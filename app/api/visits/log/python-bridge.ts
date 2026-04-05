import { spawn } from "node:child_process"
import path from "node:path"

export type PythonLogVisitPayload = {
  study_id: string
  subject_id: string
  visit_name: string
  completed_by?: string | null
  timestamp?: string | null
  expected_billables?: unknown[]
}

export type PythonLogVisitSuccess = {
  ok: true
  study_id: string
  subject_id: string
  visit_name: string
  triggered_count: number
  events_emitted: number
  message: string
}

export type PythonLogVisitFailure = {
  ok: false
  error: string
  detail?: string
}

export function runPythonLogVisit(
  projectRoot: string,
  payload: PythonLogVisitPayload,
  pythonCmd: string = process.env.PYTHON_PATH || "python",
): Promise<PythonLogVisitSuccess | PythonLogVisitFailure> {
  const scriptPath = path.join(
    projectRoot,
    "cliniq-engine",
    "api",
    "run_log_visit_stdin.py",
  )

  return new Promise((resolve) => {
    const child = spawn(pythonCmd, [scriptPath], {
      cwd: projectRoot,
      windowsHide: true,
    })
    let stdout = ""
    let stderr = ""
    child.stdout?.on("data", (c: Buffer) => {
      stdout += c.toString("utf8")
    })
    child.stderr?.on("data", (c: Buffer) => {
      stderr += c.toString("utf8")
    })
    child.on("error", (err) => {
      resolve({
        ok: false,
        error: `Failed to spawn Python: ${err.message}`,
      })
    })
    child.on("close", (code) => {
      const line = stdout.trim().split("\n").filter(Boolean).pop() ?? ""
      try {
        const parsed = JSON.parse(line) as PythonLogVisitSuccess | PythonLogVisitFailure
        if (parsed && typeof parsed === "object" && "ok" in parsed) {
          if (!parsed.ok && stderr) {
            resolve({ ...parsed, detail: (parsed as PythonLogVisitFailure).detail ?? stderr })
            return
          }
          resolve(parsed)
          return
        }
      } catch {
        /* fall through */
      }
      resolve({
        ok: false,
        error:
          stderr ||
          stdout ||
          (code !== 0 ? `Python exited with code ${code}` : "Invalid JSON from Python"),
      })
    })
    child.stdin?.write(JSON.stringify(payload))
    child.stdin?.end()
  })
}
