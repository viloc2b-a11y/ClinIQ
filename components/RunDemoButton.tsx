"use client"

import { useState } from "react"

export default function RunDemoButton() {
  const [loading, setLoading] = useState(false)
  const [output, setOutput] = useState("")
  const [error, setError] = useState("")

  const runDemo = async () => {
    try {
      setLoading(true)
      setError("")
      setOutput("")

      const res = await fetch("/api/demo/run")
      const data = await res.json()

      if (!data.success) {
        setError(data.error || "Demo failed")
        return
      }

      setOutput(data.output || "")
    } catch (err) {
      setError("Unexpected error running demo")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ marginTop: "24px" }}>
      <button
        onClick={runDemo}
        disabled={loading}
        style={{
          padding: "12px 18px",
          borderRadius: "10px",
          border: "1px solid #ccc",
          cursor: loading ? "not-allowed" : "pointer",
          fontWeight: 600,
        }}
      >
        {loading ? "Running ClinIQ Demo..." : "Run ClinIQ Demo"}
      </button>

      {error && (
        <pre
          style={{
            marginTop: "16px",
            padding: "16px",
            background: "#fff1f2",
            border: "1px solid #fecdd3",
            borderRadius: "10px",
            whiteSpace: "pre-wrap",
          }}
        >
          {error}
        </pre>
      )}

      {output && (
        <pre
          style={{
            marginTop: "16px",
            padding: "16px",
            background: "#0b1020",
            color: "#e5e7eb",
            borderRadius: "10px",
            overflowX: "auto",
            whiteSpace: "pre-wrap",
            fontSize: "12px",
            lineHeight: 1.5,
          }}
        >
          {output}
        </pre>
      )}
    </div>
  )
}