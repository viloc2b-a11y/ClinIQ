/**
 * Admin allowlist via env `CLINIQ_ADMIN_EMAILS` (comma or semicolon separated, case-insensitive).
 * If unset or empty in production, no email is admin.
 * If unset or empty in non-production, any signed-in user is treated as admin (dev convenience).
 */
export function isAllowedAdminEmail(email: string | undefined | null): boolean {
  if (!email || typeof email !== "string") return false
  const normalized = email.trim().toLowerCase()
  const raw = process.env.CLINIQ_ADMIN_EMAILS?.trim() ?? ""
  const list = raw
    .split(/[,;]+/)
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
  if (list.length === 0) {
    return process.env.NODE_ENV !== "production"
  }
  return list.includes(normalized)
}
