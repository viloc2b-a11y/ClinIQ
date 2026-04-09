export function formatUsd(amount: number) {
  return amount.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  })
}

export function statusFromDays(daysPending: number): "delayed" | "critical" {
  return daysPending > 30 ? "critical" : "delayed"
}

