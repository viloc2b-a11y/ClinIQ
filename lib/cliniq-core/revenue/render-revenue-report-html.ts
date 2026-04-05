/**
 * STEP 84 — Deterministic HTML document from STEP 83 PDF payload (no external renderer).
 */

import type { RevenuePdfPayloadResult } from "./build-revenue-pdf-payload"

export type RenderRevenueReportHtmlInput = {
  pdfPayload: RevenuePdfPayloadResult
}

export type RenderRevenueReportHtmlResult = {
  data: {
    html: string
  }
  summary: {
    score: number
    atRisk: number
    htmlLength: number
  }
  warnings: string[]
}

export function renderRevenueReportHtml({
  pdfPayload,
}: RenderRevenueReportHtmlInput): RenderRevenueReportHtmlResult {
  const { data, summary, warnings } = pdfPayload

  const executiveSummaryHtml = data.executiveSummary
    .map((line) => `<li>${escapeHtml(line)}</li>`)
    .join("")

  const findingsHtml = data.topFindings
    .map(
      (item) => `
        <tr>
          <td>${item.rank}</td>
          <td>${escapeHtml(item.title)}</td>
          <td>$${item.estimatedValue}</td>
          <td>${escapeHtml(item.trace.studyId || "-")}</td>
          <td>${escapeHtml(item.trace.subjectId || "-")}</td>
          <td>${escapeHtml(item.trace.visitName || "-")}</td>
          <td>${escapeHtml(item.trace.lineCode || "-")}</td>
          <td>${escapeHtml(item.trace.eventLogId || "-")}</td>
        </tr>
      `,
    )
    .join("")

  const warningsHtml = warnings.length
    ? `<ul>${warnings.map((w) => `<li>${escapeHtml(w)}</li>`).join("")}</ul>`
    : `<p>None</p>`

  const html = `
    <html>
      <head>
        <title>${escapeHtml(data.title)}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 24px; color: #111; }
          h1, h2, h3 { margin-bottom: 8px; }
          .kpi-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin: 16px 0; }
          .kpi { border: 1px solid #ddd; padding: 12px; border-radius: 8px; }
          table { border-collapse: collapse; width: 100%; margin-top: 16px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background: #f5f5f5; }
        </style>
      </head>
      <body>
        <h1>${escapeHtml(data.title)}</h1>
        <p>${escapeHtml(data.headline)}</p>

        <div class="kpi-grid">
          <div class="kpi"><strong>Captured Revenue</strong><br/>$${data.kpis.capturedRevenue}</div>
          <div class="kpi"><strong>Revenue At Risk</strong><br/>$${data.kpis.revenueAtRisk}</div>
          <div class="kpi"><strong>Protection Score</strong><br/>${data.kpis.revenueProtectionScore}</div>
          <div class="kpi"><strong>Total Opportunity</strong><br/>$${data.kpis.totalRevenueOpportunity}</div>
          <div class="kpi"><strong>Recovery Rate</strong><br/>${data.kpis.recoveryRate}%</div>
          <div class="kpi"><strong>Invoice Packages</strong><br/>${data.kpis.invoicePackages}</div>
        </div>

        <h2>Executive Summary</h2>
        <ul>${executiveSummaryHtml}</ul>

        <h2>Top Findings</h2>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Finding</th>
              <th>Estimated Value</th>
              <th>Study</th>
              <th>Subject</th>
              <th>Visit</th>
              <th>Line Code</th>
              <th>Event Log</th>
            </tr>
          </thead>
          <tbody>${findingsHtml}</tbody>
        </table>

        <h2>Warnings</h2>
        ${warningsHtml}

        <h2>Summary</h2>
        <p>Score: ${summary.score}</p>
        <p>At Risk: $${summary.atRisk}</p>
      </body>
    </html>
  `.trim()

  return {
    data: {
      html,
    },
    summary: {
      score: summary.score,
      atRisk: summary.atRisk,
      htmlLength: html.length,
    },
    warnings,
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}
