import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backend = path.join(__dirname, "..", "backend");
const isWin = process.platform === "win32";
const venvPython = isWin
  ? path.join(backend, ".venv", "Scripts", "python.exe")
  : path.join(backend, ".venv", "bin", "python");

const python = existsSync(venvPython) ? venvPython : "python";

if (!existsSync(venvPython)) {
  console.warn(
    "[cliniq] backend/.venv not found — using `python` from PATH.\n" +
      "  Create once: cd backend && python -m venv .venv && pip install -r requirements.txt"
  );
}

const child = spawn(
  python,
  ["-m", "fastapi", "dev", "scripts/cliniq_backend.py"],
  { cwd: backend, stdio: "inherit" }
);

child.on("exit", (code, signal) => {
  if (signal) process.exit(1);
  process.exit(code ?? 1);
});
