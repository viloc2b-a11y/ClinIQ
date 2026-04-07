"use client"

import { Button } from "@/components/ui/button"
import { createBrowserSupabaseClient } from "@/supabase/client"
import { useRouter } from "next/navigation"
import { useState } from "react"

export function AdminSignOutButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function signOut() {
    setLoading(true)
    try {
      const supabase = createBrowserSupabaseClient()
      await supabase.auth.signOut()
    } finally {
      router.push("/admin/login")
      router.refresh()
      setLoading(false)
    }
  }

  return (
    <Button type="button" variant="outline" disabled={loading} onClick={() => void signOut()}>
      {loading ? "Signing out…" : "Sign out"}
    </Button>
  )
}
