"""
CloudShift AI: FastAPI Main Application Entry Point
Orchestration layer strictly adhering to Project.md Section 4
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.routers.api_router import router as api_router

app = FastAPI(
    title="CloudShift AI — Intelligent Migration & Disaster Recovery Backend",
    description="Deterministic Multi-Objective Migration Decision Engine, AWS Architecture Generator, Cost Estimator, DR Simulator, and Security Auditor.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS to allow frontend connections from Next.js (port 3000) and dev servers
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount all /api endpoints
app.include_router(api_router)


@app.get("/")
def root():
    return {
        "service": "CloudShift AI Backend",
        "status": "online",
        "version": "1.0.0",
        "docs": "/docs",
        "endpoints": [
            "/api/projects",
            "/api/infrastructure/{id}",
            "/api/migration/analyse",
            "/api/architecture/generate",
            "/api/architecture/compare",
            "/api/cost/estimate",
            "/api/security/evaluate",
            "/api/dr/simulate",
            "/api/well-architected/score",
            "/api/reports/generate",
            "/api/explain"
        ]
    }


@app.get("/health")
def health():
    return {"status": "healthy", "engine": "CloudShift-Deterministic-v1"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
