import {
  OwnerRoleBadge,
  PriorityBadge,
  StatusBadge,
} from "@/components/action-center/action-center-badges"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { ActionCenterItem } from "@/lib/cliniq-core/action-center"
import { cn } from "@/lib/utils"

function formatMoneyUsd(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(n)
}

function MissingAmount({ amount }: { amount: number }) {
  return (
    <span className="bg-muted text-foreground inline-block rounded-md px-3 py-1.5 text-base font-bold tabular-nums tracking-tight">
      {formatMoneyUsd(amount)}
    </span>
  )
}

function priorityRowClasses(item: ActionCenterItem): string {
  if (item.priority === "high") {
    return "border-l-4 border-l-destructive bg-destructive/[0.04]"
  }
  if (item.priority === "medium") {
    return "border-l-2 border-l-amber-500/70 bg-amber-500/[0.04]"
  }
  return ""
}

/** v1: resolved rows stay visible; slight fade + muted wash for scanability. */
function resolvedQueueClasses(item: ActionCenterItem): string {
  if (item.status !== "resolved") return ""
  return "bg-muted/25 opacity-[0.82] transition-[opacity,background-color] duration-200"
}

function WorkQueueTable({
  items,
  selectedItemId,
  onItemSelect,
}: {
  items: ActionCenterItem[]
  selectedItemId: string | null
  onItemSelect?: (item: ActionCenterItem) => void
}) {
  const interactive = Boolean(onItemSelect)
  return (
    <div className="hidden md:block">
      <div className="rounded-xl border border-border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="h-12">Priority</TableHead>
              <TableHead className="min-w-[200px] h-12">Title</TableHead>
              <TableHead className="h-12">Study</TableHead>
              <TableHead className="h-12">Subject</TableHead>
              <TableHead className="h-12">Visit</TableHead>
              <TableHead className="h-12">Line code</TableHead>
              <TableHead className="h-12">Owner role</TableHead>
              <TableHead className="h-12">Missing amount</TableHead>
              <TableHead className="h-12">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => {
              const selected = selectedItemId === item.id
              return (
              <TableRow
                key={item.id}
                tabIndex={interactive ? 0 : undefined}
                aria-selected={interactive ? selected : undefined}
                data-selected={interactive && selected ? "true" : undefined}
                data-queue-status={item.status}
                className={cn(
                  priorityRowClasses(item),
                  resolvedQueueClasses(item),
                  interactive && "cursor-pointer transition-colors hover:bg-muted/50",
                  interactive && selected && "bg-primary/[0.07] ring-2 ring-inset ring-primary/30",
                )}
                onClick={interactive ? () => onItemSelect?.(item) : undefined}
                onKeyDown={
                  interactive
                    ? (e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault()
                          onItemSelect?.(item)
                        }
                      }
                    : undefined
                }
              >
                <TableCell className="py-4 align-top">
                  <PriorityBadge priority={item.priority} />
                </TableCell>
                <TableCell className="max-w-[280px] py-4 align-top whitespace-normal">
                  <div className="text-foreground font-medium leading-snug">{item.title}</div>
                  <p className="text-muted-foreground mt-2 text-xs leading-relaxed">
                    {item.description}
                  </p>
                </TableCell>
                <TableCell className="text-muted-foreground py-4 align-top">{item.studyId}</TableCell>
                <TableCell className="py-4 align-top">{item.subjectId || "—"}</TableCell>
                <TableCell className="py-4 align-top">{item.visitName}</TableCell>
                <TableCell className="py-4 align-top font-mono text-xs">{item.lineCode}</TableCell>
                <TableCell className="py-4 align-top">
                  <OwnerRoleBadge role={item.ownerRole} />
                </TableCell>
                <TableCell className="py-4 align-top">
                  <MissingAmount amount={item.missingAmount} />
                </TableCell>
                <TableCell className="py-4 align-top">
                  <StatusBadge status={item.status} />
                </TableCell>
              </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

function WorkQueueCards({
  items,
  selectedItemId,
  onItemSelect,
}: {
  items: ActionCenterItem[]
  selectedItemId: string | null
  onItemSelect?: (item: ActionCenterItem) => void
}) {
  const interactive = Boolean(onItemSelect)
  return (
    <div className="flex flex-col gap-5 md:hidden">
      {items.map((item) => {
        const selected = selectedItemId === item.id
        return (
        <Card
          key={item.id}
          tabIndex={interactive ? 0 : undefined}
          role={interactive ? "button" : undefined}
          aria-selected={interactive ? selected : undefined}
          className={cn(
            item.priority === "high"
              ? "border-l-4 border-l-destructive bg-destructive/[0.04]"
              : item.priority === "medium"
                ? "border-l-4 border-l-amber-500 bg-amber-500/[0.04]"
                : "border-l-4 border-l-muted-foreground/40",
            resolvedQueueClasses(item),
            interactive &&
              "cursor-pointer transition-shadow hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
            interactive && selected && "ring-2 ring-primary/35 ring-offset-2 ring-offset-background",
          )}
          data-queue-status={item.status}
          onClick={interactive ? () => onItemSelect?.(item) : undefined}
          onKeyDown={
            interactive
              ? (e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault()
                    onItemSelect?.(item)
                  }
                }
              : undefined
          }
        >
          <CardHeader className="gap-4 pb-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <PriorityBadge priority={item.priority} />
              <MissingAmount amount={item.missingAmount} />
            </div>
            <CardTitle className="text-base leading-snug">{item.title}</CardTitle>
            <CardDescription className="text-sm leading-relaxed">{item.description}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2 border-t border-border pt-5 text-sm">
            <div className="grid grid-cols-[6.5rem_1fr] gap-x-3 gap-y-2">
              <span className="text-muted-foreground">Study</span>
              <span className="text-foreground">{item.studyId}</span>
              <span className="text-muted-foreground">Subject</span>
              <span className="text-foreground">{item.subjectId || "—"}</span>
              <span className="text-muted-foreground">Visit</span>
              <span className="text-foreground">{item.visitName}</span>
              <span className="text-muted-foreground">Line</span>
              <span className="text-foreground font-mono text-xs">{item.lineCode}</span>
              <span className="text-muted-foreground">Owner</span>
              <span className="text-foreground">
                <OwnerRoleBadge role={item.ownerRole} />
              </span>
              <span className="text-muted-foreground">Status</span>
              <span className="text-foreground">
                <StatusBadge status={item.status} />
              </span>
            </div>
          </CardContent>
        </Card>
        )
      })}
    </div>
  )
}

/** Desktop table + mobile cards + empty state for the work queue. */
export function ActionCenterWorkQueue({
  items,
  selectedItemId = null,
  onItemSelect,
}: {
  items: ActionCenterItem[]
  selectedItemId?: string | null
  onItemSelect?: (item: ActionCenterItem) => void
}) {
  if (items.length === 0) {
    return (
      <Card className="border-dashed bg-muted/20">
        <CardHeader className="py-8">
          <CardTitle className="text-base">No open revenue actions</CardTitle>
          <CardDescription>
            All current leakage items are resolved or fully invoiced.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <>
      <WorkQueueTable items={items} selectedItemId={selectedItemId} onItemSelect={onItemSelect} />
      <WorkQueueCards items={items} selectedItemId={selectedItemId} onItemSelect={onItemSelect} />
    </>
  )
}
