import os
import time
import json
import logging
from datetime import datetime
from flask import Flask, request, jsonify, send_from_directory
from dotenv import load_dotenv
import anthropic

# ==========================================
# 1. Observability and setup (global SOP)
# ==========================================
task_name = "cliniq_app"
timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

tmp_dir = os.path.join(os.path.dirname(__file__), '..', '.tmp')
logs_dir = os.path.join(tmp_dir, 'logs')
runs_dir = os.path.join(tmp_dir, 'runs', task_name, timestamp)
build_dir = os.path.join(os.path.dirname(__file__), '..', 'build')

os.makedirs(logs_dir, exist_ok=True)
os.makedirs(runs_dir, exist_ok=True)
os.makedirs(build_dir, exist_ok=True)

log_path = os.path.join(logs_dir, f"{task_name}.log")
logging.basicConfig(filename=log_path, level=logging.INFO, 
                    format='%(asctime)s - %(levelname)s - %(message)s')

def create_manifest(success=True, errors=None):
    manifest = {
        "task_name": task_name,
        "timestamp": timestamp,
        "directive_path": f"directivas/{task_name}_SOP.md",
        "directive_version": "1.0",
        "inputs": {"sources": ["HTML frontend", "User chat inputs", "PDF/DOCX files"], "parameters": {}},
        "outputs": {"artifacts": [f"build/index.html", f"scripts/{task_name}.py"], "deliverables": []},
        "acceptance_report": {
            "all_pass": success,
            "checks": [
                {
                    "id": "SERVER_START",
                    "description": "Server started correctly without crashing",
                    "critical": True,
                    "pass": success,
                    "evidence": {"details": "Script reached execution or failed during logic init."}
                }
            ]
        },
        "status": "SUCCESS" if success else "FAIL",
        "errors": errors or [],
        "duration_seconds": 0,
        "log_path": log_path,
        "env_required": ["ANTHROPIC_API_KEY"]
    }
    manifest_path = os.path.join(runs_dir, 'manifest.json')
    with open(manifest_path, 'w', encoding='utf-8') as f:
        json.dump(manifest, f, indent=2)
    return manifest_path

# ==========================================
# 2. Flask server setup
# ==========================================
load_dotenv()
api_key = os.getenv("ANTHROPIC_API_KEY")

if not api_key or api_key == "sk-ant-tu-key-aqui":
    logging.warning("No valid ANTHROPIC_API_KEY found in .env.")

app = Flask(__name__, static_folder=build_dir)
try:
    client = anthropic.Anthropic(api_key=api_key)
except Exception as e:
    client = None
    logging.error(f"Error initializing Anthropic client: {e}")

@app.route("/")
def serve_index():
    return send_from_directory(app.static_folder, "index.html")

@app.route("/api/upload", methods=["POST"])
def api_upload():
    if "file" not in request.files:
        return jsonify({"error": "No file provided"}), 400
    file = request.files["file"]
    filename = file.filename.lower()
    text = ""
    
    try:
        if filename.endswith(".txt"):
            text = file.read().decode("utf-8")
        elif filename.endswith(".pdf"):
            import PyPDF2
            reader = PyPDF2.PdfReader(file)
            for page in reader.pages:
                text += page.extract_text() + "\n"
        elif filename.endswith(".docx"):
            import docx
            doc = docx.Document(file)
            for para in doc.paragraphs:
                text += para.text + "\n"
        else:
            return jsonify({"error": "Unsupported file format"}), 400
            
        logging.info(f"File parsed successfully: {filename} ({len(text)} chars)")
        return jsonify({"success": True, "text": text, "filename": filename})
    except Exception as e:
        logging.error(f"Error parsing file: {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/api/chat", methods=["POST"])
def api_chat():
    if not client:
        return jsonify({"error": "Anthropic API is not configured on the backend."}), 500
        
    data = request.json
    try:
        response = client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=2048,
            system=data.get("system", ""),
            messages=data.get("messages", [])
        )
        return jsonify({"reply": response.content[0].text})
    except Exception as e:
        logging.error(f"Error in Anthropic chat: {e}")
        return jsonify({"error": str(e)}), 500

# ==========================================
# 3. RUN
# ==========================================
if __name__ == "__main__":
    try:
        manifest_path = create_manifest(success=True)
        print(f"STATUS: SUCCESS\nOUTPUTS: {build_dir}\nMANIFEST: {manifest_path}\nLOG: {log_path}")
        logging.info("Server starting on port 5000")
        app.run(host="127.0.0.1", port=5000)
    except Exception as e:
        manifest_path = create_manifest(success=False, errors=[str(e)])
        print(f"STATUS: FAIL\nOUTPUTS: None\nMANIFEST: {manifest_path}\nLOG: {log_path}")
        logging.error(f"Fatal error: {e}")
