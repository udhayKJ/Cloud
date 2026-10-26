"""
CloudShift AI — Unified System Orchestrator
Runs both the Python/FastAPI backend (port 8000) and the Next.js frontend (port 3000)
concurrently as a single unified system with graceful shutdown and health monitoring.
"""

import sys
import os
import subprocess
import time
import signal
from pathlib import Path

WORKSPACE_DIR = Path(__file__).resolve().parent
NODE_EXE = WORKSPACE_DIR / ".node_runtime" / "src" / "node-v20.18.0-win-x64" / "node.exe"
NEXT_CLI = WORKSPACE_DIR / "node_modules" / "next" / "dist" / "bin" / "next"


def main():
    print("=" * 70)
    print(" 🚀 CloudShift AI — Unified Frontend & Backend Launcher")
    print("=" * 70)
    print(f" Working Directory: {WORKSPACE_DIR}")

    # 1. Start Python FastAPI Backend on Port 8000
    print("\n[1/2] Starting Python FastAPI Backend on http://localhost:8000 ...")
    backend_env = os.environ.copy()
    backend_env["PYTHONPATH"] = str(WORKSPACE_DIR)
    
    backend_cmd = [
        sys.executable,
        "-m",
        "uvicorn",
        "backend.main:app",
        "--host",
        "0.0.0.0",
        "--port",
        "8000",
        "--reload"
    ]
    
    backend_proc = subprocess.Popen(
        backend_cmd,
        cwd=str(WORKSPACE_DIR),
        env=backend_env
    )

    # 2. Start Next.js Frontend on Port 3000
    print("\n[2/2] Starting Next.js Frontend on http://localhost:3000 ...")
    node_bin = str(NODE_EXE) if NODE_EXE.exists() else "node"
    frontend_cmd = [
        node_bin,
        str(NEXT_CLI),
        "dev",
        "-p",
        "3000"
    ]
    
    frontend_proc = subprocess.Popen(
        frontend_cmd,
        cwd=str(WORKSPACE_DIR),
        env=os.environ.copy()
    )

    print("\n" + "=" * 70)
    print(" ✨ CloudShift AI is now running as a unified application:")
    print("    • Frontend UI:    http://localhost:3000")
    print("    • Backend API:    http://localhost:8000")
    print("    • OpenAPI Docs:   http://localhost:8000/docs")
    print(" Press Ctrl+C at any time to stop all services.")
    print("=" * 70 + "\n")

    def signal_handler(sig, frame):
        print("\n\n🛑 Shutting down CloudShift AI services...")
        backend_proc.terminate()
        frontend_proc.terminate()
        backend_proc.wait()
        frontend_proc.wait()
        print(" All services stopped. Goodbye!")
        sys.exit(0)

    signal.signal(signal.SIGINT, signal_handler)

    try:
        while True:
            # Check if any process terminated unexpectedly
            if backend_proc.poll() is not None:
                print("⚠️ Backend server stopped.")
                frontend_proc.terminate()
                break
            if frontend_proc.poll() is not None:
                print("⚠️ Frontend server stopped.")
                backend_proc.terminate()
                break
            time.sleep(1)
    except KeyboardInterrupt:
        signal_handler(None, None)


if __name__ == "__main__":
    main()
