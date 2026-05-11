import { sign, verifySig } from './crypto'

// Build absolute tracking URLs with HMAC signatures so endpoints can reject
// arbitrary inputs (open redirects, forged opens, forged unsubscribes).

export function openPixelUrl(baseUrl: string, trackingId: string): string {
  const sig = sign('open', trackingId)
  return `${baseUrl}/api/track/open?id=${trackingId}&s=${sig}`
}

export function clickUrl(baseUrl: string, trackingId: string, destination: string): string {
  const sig = sign('click', trackingId, destination)
  return `${baseUrl}/api/track/click?id=${trackingId}&s=${sig}&url=${encodeURIComponent(destination)}`
}

export function unsubscribeUrl(baseUrl: string, trackingId: string): string {
  const sig = sign('unsub', trackingId)
  return `${baseUrl}/api/unsubscribe?id=${trackingId}&s=${sig}`
}

export function verifyOpen(trackingId: string, sig: string) {
  return verifySig(sig, 'open', trackingId)
}
export function verifyClick(trackingId: string, destination: string, sig: string) {
  return verifySig(sig, 'click', trackingId, destination)
}
export function verifyUnsub(trackingId: string, sig: string) {
  return verifySig(sig, 'unsub', trackingId)
}
