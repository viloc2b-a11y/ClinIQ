export const dynamic = 'force-dynamic'

import type { ExecutionLineState, MissingExecutionLineState } from "@/lib/execution/run-operational-execution"
import { runOperationalExecution } from "@/lib/execution/run-operational-execution"
import {
  createExecutionSupabaseClient,
  executionSupabaseErrorResponse,
} from "@/lib/execution/service-supabase"

function lineToSnake(l: ExecutionLineState) {
  return {
    line_code: l.lineCode,
    expected_quantity: l.expectedQuantity,
    expected_revenue: l.expectedRevenue,
    actual_quantity: l.actualQuantity,
    actual_amount: l.actualAmount,
    quantity_gap: l.quantityGap,
    revenue_gap: l.revenueGap,
  }
}

function missingToSnake(l: MissingExecutionLineState) {
  return {
    ...lineToSnake(l),
    severity: l.severity,
    estimated_revenue_at_risk: l.estimatedRevenueAtRisk,
    priority_rank: l.priorityRank,
  }
}

export async function GET(req: Request) {
  const supabase = createExecutionSupabaseClient()
  if (!supabase) return executionSupabaseErrorResponse()

  const { searchParams } = new URL(req.url)
  const studyKey = searchParams.get("study_key")?.trim()
  if (!studyKey) {
    return Response.json({ ok: false, error: "study_key is required" }, { status: 400 })
  }

  const state = await runOperationalExecution(supabase, studyKey)
  if (!state.ok) {
    return Response.json({ ok: false, error: state.error }, { status: 500 })
  }

  return Response.json({
    ok: true,
    data: {
      study_key: state.studyKey,
      lines: state.lines.map(lineToSnake),
      matched: state.matched.map(lineToSnake),
      missing: state.missing.map(missingToSnake),
      summary: {
        matched_line_count: state.comparisonSummary.matchedLineCount,
        missing_line_count: state.comparisonSummary.missingLineCount,
        total_line_count: state.comparisonSummary.totalLineCount,
      },
      leakage: {
        missing_revenue: state.leakage.missingRevenue,
        missing_line_count: state.leakage.missingLineCount,
      },
      revenue_leakage: state.revenueLeakage,
      visit_by_line: state.visitByLine,
      totals: {
        expected_revenue: state.totals.expectedRevenue,
        actual_amount: state.totals.actualBillableAmount,
        revenue_gap: state.totals.revenueGap,
      },
    },
  })
}
