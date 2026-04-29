"use server";

import { resolveMx } from "dns/promises";

export type VerificationResult = {
  email: string;
  isValid: boolean;
  formatValid: boolean;
  domainValid: boolean;
  mxValid: boolean;
  isRoleBased: boolean;
  isCatchAll?: boolean; // We can't easily check this without SMTP, but we can note it
  error?: string;
};

const ROLE_BASED_PREFIXES = [
  "info", "support", "admin", "sales", "contact", 
  "help", "office", "team", "marketing", "billing", 
  "jobs", "hr", "noreply", "hello", "mail"
];

export async function verifyEmailsAction(emailsString: string): Promise<VerificationResult[]> {
  // Simulate delay
  await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 1000));

  const emailList = emailsString
    .split(/[\n,; ]+/)
    .map(e => e.trim())
    .filter(e => e.length > 0);

  const results: VerificationResult[] = [];

  for (const email of emailList) {
    const result: VerificationResult = {
      email,
      isValid: false,
      formatValid: false,
      domainValid: false,
      mxValid: false,
      isRoleBased: false,
    };

    // 1. Format Check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      result.error = "Invalid format";
      results.push(result);
      continue;
    }
    result.formatValid = true;

    const [localPart, domain] = email.split("@");

    // 2. Role-based Check
    if (ROLE_BASED_PREFIXES.includes(localPart.toLowerCase())) {
      result.isRoleBased = true;
    }

    // 3. DNS/MX Check
    try {
      const mxRecords = await resolveMx(domain);
      result.domainValid = true;
      if (mxRecords && mxRecords.length > 0) {
        result.mxValid = true;
        result.isValid = true; // Overall valid if format and MX are okay
      } else {
        result.error = "No MX records found";
      }
    } catch (e: any) {
      result.domainValid = false;
      result.mxValid = false;
      if (e.code === 'ENOTFOUND' || e.code === 'ENODATA') {
        result.error = "Domain not found or no DNS records";
      } else {
        result.error = "Verification failed";
      }
    }

    results.push(result);
  }

  return results;
}
