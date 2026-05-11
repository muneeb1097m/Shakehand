import { resolveTxt, resolveMx } from 'dns/promises'

export type AuthStatus = 'pass' | 'fail' | 'none' | 'error'

export interface DomainAuthResult {
  domain: string
  spf: AuthStatus
  dkim: AuthStatus
  dmarc: AuthStatus
  hasMx: boolean
  details: { spf?: string; dmarc?: string; dkimSelectorsTried: string[] }
}

const COMMON_DKIM_SELECTORS = ['default', 'google', 'selector1', 'selector2', 'k1', 'mail', 'dkim']

async function txt(host: string): Promise<string[]> {
  try {
    const recs = await resolveTxt(host)
    return recs.map(r => r.join(''))
  } catch {
    return []
  }
}

export async function checkDomainAuth(email: string): Promise<DomainAuthResult> {
  const domain = email.split('@')[1]?.toLowerCase()
  if (!domain) {
    return { domain: '', spf: 'error', dkim: 'error', dmarc: 'error', hasMx: false, details: { dkimSelectorsTried: [] } }
  }

  const result: DomainAuthResult = {
    domain,
    spf: 'none',
    dkim: 'none',
    dmarc: 'none',
    hasMx: false,
    details: { dkimSelectorsTried: [] },
  }

  try {
    const mx = await resolveMx(domain)
    result.hasMx = mx.length > 0
  } catch {
    result.hasMx = false
  }

  // SPF
  const spfRecords = (await txt(domain)).filter(r => r.toLowerCase().startsWith('v=spf1'))
  if (spfRecords.length === 1) {
    result.spf = 'pass'
    result.details.spf = spfRecords[0]
  } else if (spfRecords.length > 1) {
    result.spf = 'fail' // RFC 7208: multiple SPF records = permerror
    result.details.spf = spfRecords.join(' | ')
  }

  // DMARC
  const dmarcRecords = (await txt(`_dmarc.${domain}`)).filter(r => r.toLowerCase().startsWith('v=dmarc1'))
  if (dmarcRecords.length > 0) {
    result.dmarc = 'pass'
    result.details.dmarc = dmarcRecords[0]
  }

  // DKIM — we can't know the selector without the user telling us; probe common ones
  for (const sel of COMMON_DKIM_SELECTORS) {
    result.details.dkimSelectorsTried.push(sel)
    const recs = await txt(`${sel}._domainkey.${domain}`)
    if (recs.some(r => r.toLowerCase().includes('v=dkim1'))) {
      result.dkim = 'pass'
      break
    }
  }

  return result
}
