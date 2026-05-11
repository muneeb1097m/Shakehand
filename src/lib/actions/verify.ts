"use server";

import { resolveMx } from "dns/promises";
import * as net from "net";
import { DISPOSABLE_DOMAINS } from "@/lib/disposable-domains";

export type VerificationResult = {
  email: string;
  isValid: boolean;
  formatValid: boolean;
  domainValid: boolean;
  mxValid: boolean;
  isRoleBased: boolean;
  isDisposable: boolean;
  isCatchAll?: boolean;
  smtpAccepted?: boolean;  // server's RCPT TO response
  error?: string;
};

const ROLE_BASED_PREFIXES = new Set([
  "info", "support", "admin", "sales", "contact",
  "help", "office", "team", "marketing", "billing",
  "jobs", "hr", "noreply", "no-reply", "hello", "mail",
  "abuse", "postmaster", "webmaster",
]);

const SMTP_PROBE_TIMEOUT = 7000;
const SMTP_PROBE_FROM = process.env.VERIFIER_PROBE_FROM || "verify@example.com";

/**
 * Speak SMTP to the recipient's MX, run RCPT TO, hang up before DATA.
 * Returns: { accepted, catchAll }. Many providers reject these probes (Gmail does);
 * we treat soft failures as "unknown" rather than "invalid".
 */
async function smtpProbe(domain: string, mxHost: string, email: string): Promise<{ accepted: boolean | null; catchAll: boolean | null }> {
  return new Promise(resolve => {
    let stage = 0;
    let acceptedReal: boolean | null = null;
    let acceptedFake: boolean | null = null;
    const fakeAddr = `noexist-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@${domain}`;

    const sock = net.createConnection({ host: mxHost, port: 25 });
    sock.setTimeout(SMTP_PROBE_TIMEOUT);

    const send = (line: string) => sock.write(line + "\r\n");
    const finish = () => {
      try { sock.end("QUIT\r\n"); } catch {}
      const catchAll = acceptedReal === true && acceptedFake === true ? true
                     : acceptedReal === true && acceptedFake === false ? false
                     : null;
      resolve({ accepted: acceptedReal, catchAll });
    };

    sock.on("data", (buf) => {
      const code = parseInt(buf.toString().slice(0, 3), 10);
      switch (stage) {
        case 0: // banner
          if (code !== 220) return finish();
          send(`EHLO mailcheck.local`);
          stage++; break;
        case 1: // EHLO response
          send(`MAIL FROM:<${SMTP_PROBE_FROM}>`);
          stage++; break;
        case 2: // MAIL FROM response
          if (code !== 250) return finish();
          send(`RCPT TO:<${email}>`);
          stage++; break;
        case 3: // RCPT real
          acceptedReal = code >= 200 && code < 300;
          send(`RCPT TO:<${fakeAddr}>`);
          stage++; break;
        case 4: // RCPT fake — used to detect catch-all
          acceptedFake = code >= 200 && code < 300;
          finish(); break;
      }
    });

    sock.on("timeout", () => { resolve({ accepted: null, catchAll: null }); sock.destroy(); });
    sock.on("error",   () => resolve({ accepted: null, catchAll: null }));
  });
}

export async function verifyEmailsAction(emailsString: string): Promise<VerificationResult[]> {
  const emailList = emailsString
    .split(/[\n,; ]+/)
    .map(e => e.trim().toLowerCase())
    .filter(e => e.length > 0);

  const results = await Promise.all(emailList.map(async (email): Promise<VerificationResult> => {
    const result: VerificationResult = {
      email,
      isValid: false,
      formatValid: false,
      domainValid: false,
      mxValid: false,
      isRoleBased: false,
      isDisposable: false,
    };

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      result.error = "Invalid format";
      return result;
    }
    result.formatValid = true;

    const [localPart, domain] = email.split("@");
    if (ROLE_BASED_PREFIXES.has(localPart)) result.isRoleBased = true;
    if (DISPOSABLE_DOMAINS.has(domain))     result.isDisposable = true;

    let mxRecords: { exchange: string; priority: number }[] = [];
    try {
      mxRecords = await resolveMx(domain);
      result.domainValid = true;
      result.mxValid = mxRecords.length > 0;
    } catch (e: any) {
      result.error = e.code === "ENOTFOUND" || e.code === "ENODATA"
        ? "Domain not found or no MX records"
        : "DNS lookup failed";
      return result;
    }

    if (!result.mxValid) {
      result.error = "No MX records";
      return result;
    }

    if (!result.isDisposable) {
      const top = mxRecords.sort((a, b) => a.priority - b.priority)[0];
      const probe = await smtpProbe(domain, top.exchange, email);
      if (probe.accepted !== null) result.smtpAccepted = probe.accepted;
      if (probe.catchAll !== null) result.isCatchAll = probe.catchAll;
    }

    // Overall verdict: format + MX, plus SMTP probe didn't reject, and not disposable
    result.isValid = result.formatValid
                  && result.mxValid
                  && !result.isDisposable
                  && result.smtpAccepted !== false;

    return result;
  }));

  return results;
}
