import { afterEach, describe, expect, it, vi } from "vitest"
import { isAllowedAdminEmail } from "./is-allowed-admin"

describe("isAllowedAdminEmail", () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it("returns false for empty email", () => {
    vi.stubEnv("NODE_ENV", "production")
    vi.stubEnv("CLINIQ_ADMIN_EMAILS", "a@b.com")
    expect(isAllowedAdminEmail("")).toBe(false)
    expect(isAllowedAdminEmail(null)).toBe(false)
  })

  it("matches allowlist case-insensitively in production", () => {
    vi.stubEnv("NODE_ENV", "production")
    vi.stubEnv("CLINIQ_ADMIN_EMAILS", "Admin@test.com, other@x.org")
    expect(isAllowedAdminEmail("admin@test.com")).toBe(true)
    expect(isAllowedAdminEmail("OTHER@x.org")).toBe(true)
    expect(isAllowedAdminEmail("nope@x.org")).toBe(false)
  })

  it("allows any email in development when list empty", () => {
    vi.stubEnv("NODE_ENV", "development")
    vi.stubEnv("CLINIQ_ADMIN_EMAILS", "")
    expect(isAllowedAdminEmail("any@where.com")).toBe(true)
  })

  it("denies any email in production when list empty", () => {
    vi.stubEnv("NODE_ENV", "production")
    vi.stubEnv("CLINIQ_ADMIN_EMAILS", "")
    expect(isAllowedAdminEmail("any@where.com")).toBe(false)
  })
})
