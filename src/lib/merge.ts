// Replaces {{variable}} placeholders with real contact data
// Used before every email send

export type MergeData = {
  first_name?: string
  last_name?: string
  name?: string
  email?: string
  company?: string
  job_title?: string
  phone?: string
  [key: string]: string | undefined
}

export function mergeVariables(template: string, data: MergeData): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return data[key] ?? match // if no value found, leave placeholder as-is
  })
}

export function extractVariables(template: string): string[] {
  const matches = template.match(/\{\{(\w+)\}\}/g) || []
  return [...new Set(matches.map(m => m.replace(/\{\{|\}\}/g, '')))]
}

export function buildMergeData(contact: {
  name: string
  email: string
  company?: string | null
  job_title?: string | null
  phone?: string | null
  custom_fields?: Record<string, string>
}): MergeData {
  const nameParts = contact.name.trim().split(' ')
  return {
    first_name: nameParts[0] || '',
    last_name: nameParts.slice(1).join(' ') || '',
    name: contact.name,
    email: contact.email,
    company: contact.company || '',
    job_title: contact.job_title || '',
    phone: contact.phone || '',
    ...contact.custom_fields,
  }
}
