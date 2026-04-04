import { NextResponse } from "next/server"
import { exec } from "child_process"
import path from "path"

export async function GET() {
  const projectRoot = process.cwd()
  const scriptPath = path.join(projectRoot, "cliniq-engine", "example_run.py")

  return new Promise<Response>((resolve) => {
    exec(`python "${scriptPath}"`, { cwd: projectRoot }, (error, stdout, stderr) => {
      if (error) {
        resolve(
          NextResponse.json({
            success: false,
            error: stderr || error.message,
          })
        )
        return
      }

      resolve(
        NextResponse.json({
          success: true,
          output: stdout,
        })
      )
    })
  })
}