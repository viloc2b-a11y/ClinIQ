"use client"

import RunDemoButton from "@/components/RunDemoButton"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"
import {
  ArrowRight,
  BarChart3,
  ClipboardList,
  FileSpreadsheet,
  LayoutDashboard,
  LineChart,
  Receipt,
  Scale,
  ShieldCheck,
  Sparkles,
  Workflow,
  Zap,
} from "lucide-react"
import Link from "next/link"
import type { ReactNode } from "react"

type Variant = "home" | "tour"

type ModuleLink = {
  href: string
  title: string
  description: string
  badge?: string
  icon: ReactNode
}

function buildModules(engineDemoHref: string): ModuleLink[] {
  return [
    {
      href: "/dashboard?study_key=STUDY-1",
      title: "Operations workbench",
      description:
        "Live signals: expected vs actual, leakage, recent events, and Action Center sync.",
      badge: "Demo",
      icon: <LayoutDashboard className="size-5" aria-hidden />,
    },
    {
      href: "/action-center",
      title: "Action Center",
      description:
        "Revenue-leakage work queue: prioritize, resolve, and audit operational items.",
      icon: <ClipboardList className="size-5" aria-hidden />,
    },
    {
      href: "/dashboard/ar",
      title: "AR & collections",
      description:
        "Demo view from invoice to cash: aging, risk, and collections queue narrative.",
      badge: "Demo",
      icon: <Receipt className="size-5" aria-hidden />,
    },
    {
      href: "/budget-gap",
      title: "Budget gap",
      description: "Internal vs sponsor budget comparison and negotiation handoff.",
      icon: <BarChart3 className="size-5" aria-hidden />,
    },
    {
      href: "/negotiation",
      title: "Negotiation engine",
      description: "Module 4 artifacts and flow from the external package and engine rules.",
      icon: <Scale className="size-5" aria-hidden />,
    },
    {
      href: "/claims",
      title: "Claims",
      description: "Claims line and invoice package aligned to the execution ledger.",
      icon: <FileSpreadsheet className="size-5" aria-hidden />,
    },
    {
      href: "/ledger",
      title: "Ledger",
      description: "Post-award ledger view and billable traceability.",
      icon: <LineChart className="size-5" aria-hidden />,
    },
    {
      href: engineDemoHref,
      title: "Live engine demo",
      description:
        "Run the SoA → expected billables → visit triggers → leakage trace in one click.",
      icon: <Workflow className="size-5" aria-hidden />,
    },
  ]
}

const apiRefs = [
  { path: "/api/execution/run", note: "Unified operational state (GET; optional POST sync)" },
  {
    path: "/api/ingest-event",
    note: "Visit ingest with expected billables (Bearer if CLINIQ_API_SECRET is set)",
  },
  { path: "/api/action-center", note: "Action Center list and summary" },
  { path: "/api/action-center/mutate", note: "Item mutations (POST)" },
]

export function ClinIQPresentation({ variant }: { variant: Variant }) {
  const engineDemoHref = variant === "home" ? "#live-demo" : "/#live-demo"
  const modules = buildModules(engineDemoHref)

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-background to-background">
      <header className="sticky top-0 z-50 border-b border-border/80 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Sparkles className="size-4" aria-hidden />
            </div>
            <div>
              <p className="text-sm font-semibold tracking-tight">ClinIQ</p>
              <p className="text-xs text-muted-foreground">
                {variant === "home" ? "Clinical operations & revenue" : "Product tour"}
              </p>
            </div>
          </div>
          <nav className="flex flex-wrap items-center gap-2" aria-label="Quick links">
            <Link
              href="/dashboard?study_key=STUDY-1"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              Workbench
            </Link>
            <Link
              href="/action-center"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              Action Center
            </Link>
            <Link href="#modules" className={cn(buttonVariants({ size: "sm" }))}>
              Explore modules
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="border-b border-border/60 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
            <Badge
              variant="secondary"
              className="mb-4 border-white/20 bg-white/10 text-white hover:bg-white/15"
            >
              Clinical site revenue protection
            </Badge>
            <h1 className="max-w-3xl text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
              Execution, financial truth, and collections in one platform.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-white/85 sm:text-lg">
              From schedule of assessments through billing: expected lines, visit events, leakage
              detection, and an operations queue your finance and site leads can stand behind.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/dashboard?study_key=STUDY-1"
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "bg-white text-slate-900 hover:bg-white/90",
                )}
              >
                Open workbench
                <ArrowRight className="ms-2 size-4" aria-hidden />
              </Link>
              <Link
                href="/action-center"
                className={cn(
                  buttonVariants({ size: "lg", variant: "outline" }),
                  "border-white/40 bg-transparent text-white hover:bg-white/10",
                )}
              >
                View Action Center
              </Link>
              <Link
                href={engineDemoHref}
                className={cn(
                  buttonVariants({ size: "lg", variant: "ghost" }),
                  "text-white hover:bg-white/10",
                )}
              >
                Live engine demo
              </Link>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6" aria-labelledby="pillars-heading">
          <h2 id="pillars-heading" className="sr-only">
            Value pillars
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="border-border/80 shadow-sm">
              <CardHeader>
                <div className="mb-2 flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <ShieldCheck className="size-5" aria-hidden />
                </div>
                <CardTitle className="text-lg">Revenue protection</CardTitle>
                <CardDescription>
                  Expected vs actual by line, quantified leakage, and prioritization by financial
                  risk—language study finance teams already use.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="border-border/80 shadow-sm">
              <CardHeader>
                <div className="mb-2 flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Zap className="size-5" aria-hidden />
                </div>
                <CardTitle className="text-lg">Execution truth</CardTitle>
                <CardDescription>
                  Events, billables, and ledger aligned to the SoA and invoicing—fewer disputes,
                  clearer audit trails.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="border-border/80 shadow-sm">
              <CardHeader>
                <div className="mb-2 flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Workflow className="size-5" aria-hidden />
                </div>
                <CardTitle className="text-lg">Visit to cash</CardTitle>
                <CardDescription>
                  Action Center to close gaps, AR demo for aging and collections—a complete
                  post-award story.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </section>

        <section
          id="modules"
          className="border-t border-border/60 bg-muted/30 py-14"
          aria-labelledby="modules-heading"
        >
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mb-10 max-w-2xl">
              <h2 id="modules-heading" className="text-2xl font-bold tracking-tight sm:text-3xl">
                Product map
              </h2>
              <p className="mt-2 text-muted-foreground">
                Each card opens the real app screen. Use{" "}
                <code className="rounded bg-muted px-1 py-0.5 text-sm">study_key=STUDY-1</code> when
                demoing execution data.
              </p>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {modules.map((m) => (
                <Card
                  key={m.href + m.title}
                  className="flex flex-col border-border/80 shadow-sm transition-shadow hover:shadow-md"
                >
                  <CardHeader className="flex-1">
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <div className="flex size-10 items-center justify-center rounded-lg bg-muted text-foreground">
                        {m.icon}
                      </div>
                      {m.badge ? (
                        <Badge variant="secondary">{m.badge}</Badge>
                      ) : null}
                    </div>
                    <CardTitle className="text-base">{m.title}</CardTitle>
                    <CardDescription className="text-sm leading-relaxed">
                      {m.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <Link
                      href={m.href}
                      className={cn(buttonVariants({ variant: "default" }), "w-full")}
                    >
                      Open
                      <ArrowRight className="ms-2 size-4" aria-hidden />
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {variant === "home" ? (
          <section
            id="live-demo"
            className="mx-auto max-w-6xl scroll-mt-24 px-4 py-14 sm:px-6"
            aria-labelledby="live-demo-heading"
          >
            <h2
              id="live-demo-heading"
              className="text-2xl font-bold tracking-tight sm:text-3xl"
            >
              Live engine demo
            </h2>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              Runs the deterministic ClinIQ trace via <code className="text-sm">/api/demo/run</code>.
            </p>
            <Card className="mt-6 border-border/80">
              <CardContent className="p-6">
                <RunDemoButton />
              </CardContent>
            </Card>
          </section>
        ) : null}

        <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6" aria-labelledby="flow-heading">
          <h2 id="flow-heading" className="text-2xl font-bold tracking-tight sm:text-3xl">
            Suggested demo script (10–15 minutes)
          </h2>
          <ol className="mt-8 space-y-4">
            {[
              {
                step: "1",
                title: "Context",
                body: "This page: SoA → expected billables → visits → leakage narrative.",
                href: variant === "home" ? "#modules" : "/#modules",
              },
              {
                step: "2",
                title: "Operations",
                body: "Workbench: signals, missing lines, and recents.",
                href: "/dashboard?study_key=STUDY-1",
              },
              {
                step: "3",
                title: "Action",
                body: "Action Center: prioritized queue and statuses.",
                href: "/action-center",
              },
              {
                step: "4",
                title: "Financial close",
                body: "AR demo: aging and collections story.",
                href: "/dashboard/ar",
              },
            ].map((item) => (
              <li key={item.step}>
                <Card className="border-border/80">
                  <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex gap-4">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                        {item.step}
                      </span>
                      <div>
                        <p className="font-semibold">{item.title}</p>
                        <p className="text-sm text-muted-foreground">{item.body}</p>
                      </div>
                    </div>
                    <Link
                      href={item.href}
                      className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                    >
                      Go
                    </Link>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ol>
        </section>

        <section
          className="border-t border-border/60 bg-muted/20 py-14"
          aria-labelledby="api-heading"
        >
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 id="api-heading" className="text-2xl font-bold tracking-tight sm:text-3xl">
              Technical integration
            </h2>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              Reference endpoints used by the app. Configure Supabase in production; set{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-sm">CLINIQ_API_SECRET</code> to
              protect ingest when needed.
            </p>
            <ul className="mt-6 space-y-3">
              {apiRefs.map((a) => (
                <li key={a.path}>
                  <Card className="border-border/80">
                    <CardContent className="flex flex-col gap-1 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <code className="text-sm font-mono text-foreground">{a.path}</code>
                      <span className="text-sm text-muted-foreground">{a.note}</span>
                    </CardContent>
                  </Card>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <footer className="border-t border-border bg-muted/30 py-10">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 text-center sm:flex-row sm:text-left sm:px-6">
            <p className="text-sm text-muted-foreground">
              ClinIQ — execution and revenue protection for clinical research sites.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <Link
                href="/dashboard?study_key=STUDY-1"
                className={cn(buttonVariants())}
              >
                Start demo
              </Link>
              {variant === "home" ? (
                <Link href="/sales" className={cn(buttonVariants({ variant: "outline" }))}>
                  Short tour
                </Link>
              ) : (
                <Link href="/" className={cn(buttonVariants({ variant: "outline" }))}>
                  Home
                </Link>
              )}
            </div>
          </div>
        </footer>
      </main>
    </div>
  )
}
