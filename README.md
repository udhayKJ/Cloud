# CloudShift AI ☁️
### Intelligent Cloud Migration & Disaster Recovery Simulator

[![CI/CD Pipeline](https://github.com/udhayKJ/Cloud/actions/workflows/ci.yml/badge.svg)](https://github.com/udhayKJ/Cloud/actions/workflows/ci.yml)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110-009688.svg?logo=fastapi)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Next.js-16-black.svg?logo=next.js)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-blue.svg?logo=react)](https://react.dev)
[![Terraform](https://img.shields.io/badge/Terraform-1.5+-623CE4.svg?logo=terraform)](https://www.terraform.io)

**CloudShift AI** is an intelligent cloud architecture platform that analyses on-premise infrastructure and recommends an optimal AWS migration strategy based on **cost, performance, security, availability, scalability, RTO, and RPO requirements**.

---

## 🚀 Quick Start (Run Locally)

### Prerequisites
- **Python 3.10+**
- **Node.js 18+ & npm** (or pnpm)
- *(Optional)* Docker & Docker Compose for local PostgreSQL

---

### Step 1: Clone the Repository
```bash
git clone https://github.com/udhayKJ/Cloud.git
cd Cloud
```

### Step 2: Install Dependencies
```bash
# 1. Install Python Backend Dependencies
pip install -r requirements.txt

# 2. Install Next.js Frontend Dependencies
npm install
```

### Step 3: Run the Unified System
```bash
python run_all.py
```
*(On Windows, you can also double-click `start.bat`)*

Once started, open:
- 🌐 **Frontend UI**: [http://localhost:3000](http://localhost:3000)
- ⚙️ **Backend API**: [http://localhost:8000](http://localhost:8000)
- 📖 **Interactive API Docs (Swagger)**: [http://localhost:8000/docs](http://localhost:8000/docs)

---

## 🧪 Running System Tests

To execute the automated architecture behavior & disaster recovery verification suite:
```bash
python tests/system_tests.py
```

---

## 📁 Key Project Structure

```text
├── app/                  # Next.js 16 App Router (pages and layouts)
├── backend/              # Python FastAPI backend & deterministic engines
│   ├── engine/           # Migration, Architecture, DR, Security, Explanation
│   ├── routers/          # REST API endpoints
│   ├── main.py           # Application entry point
│   └── models.py         # Pydantic schemas
├── components/           # React UI components & React Flow visualizer
├── database/             # PostgreSQL schemas, indexes, views, seed data
├── lib/                  # Shared TypeScript types, state store, client engine
├── terraform/            # Infrastructure as Code (IaC) AWS definitions
├── tests/                # System test suite (7 tests matching Project.md)
├── requirements.txt      # Python dependencies
├── package.json          # Node dependencies
├── run_all.py            # Unified system launcher
└── start.bat             # 1-click Windows runner
```

---

## 🛠️ Tech Stack
- **Frontend**: Next.js, React, Tailwind CSS, React Flow, Zustand, Lucide React
- **Backend**: Python 3.10, FastAPI, Uvicorn, Pydantic, Boto3, SQLAlchemy
- **Database**: PostgreSQL 16
- **IaC**: Terraform 1.5+
- **CI/CD**: GitHub Actions
