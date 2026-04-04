import RunDemoButton from "@/components/RunDemoButton"

export default function HomePage() {
  return (
    <main style={{ maxWidth: "1000px", margin: "0 auto", padding: "40px 20px" }}>
      <h1 style={{ fontSize: "36px", fontWeight: 700, marginBottom: "12px" }}>
        ClinIQ Demo
      </h1>

      <p style={{ fontSize: "18px", lineHeight: 1.6, marginBottom: "16px" }}>
        Event-driven execution + revenue protection engine for clinical research sites.
      </p>

      <p style={{ fontSize: "16px", lineHeight: 1.6, color: "#444" }}>
        This demo runs the SoA → expected billables → visit triggers → revenue leakage detection flow
        using the current ClinIQ engine.
      </p>

      <p className="mb-6 text-sm">
        <a className="text-primary underline underline-offset-4" href="/dashboard">
          ClinIQ Dashboard v1
        </a>
        <span className="text-muted-foreground"> — document ingest (placeholder) + live AR demo</span>
      </p>

      <RunDemoButton />
    </main>
  )
}