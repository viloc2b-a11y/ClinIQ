export const MVP_MOCK = {
  patients: [
    { id: "P001", visit: "V1", event: "visit_completed", amount: 1500, days: 12, status: "pending" },
    { id: "P002", visit: "V2", event: "visit_completed", amount: 2200, days: 35, status: "pending" },
    { id: "P003", visit: "V1", event: "prescreen_completed", amount: 300, days: 5, status: "ready" },
  ],
  kpis: {
    ready: 128400,
    atRisk: 42750,
    delayed: 23,
    critical: 8,
  },
  counteroffer: [
    { fee: "Screening", sponsor: 500, proposed: 850, priority: "must-win" },
    { fee: "Visit 1", sponsor: 1200, proposed: 1800, priority: "must-win" },
    { fee: "Labs", sponsor: 300, proposed: 450, priority: "tradeoff" },
  ],
} satisfies {
  patients: { id: string; visit: string; event: string; amount: number; days: number; status: "pending" | "ready" }[]
  kpis: { ready: number; atRisk: number; delayed: number; critical: number }
  counteroffer: { fee: string; sponsor: number; proposed: number; priority: "must-win" | "tradeoff" }[]
}

export type MvpPatient = (typeof MVP_MOCK)["patients"][number]
export type MvpKpis = (typeof MVP_MOCK)["kpis"]
export type MvpCounterofferLine = (typeof MVP_MOCK)["counteroffer"][number]

