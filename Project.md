# Intelligent Cloud Migration & Disaster Recovery Simulator

> **Project Codename:** CloudShift AI
> **Project Type:** AWS Cloud Architecture + Migration + Disaster Recovery
> **Team Size:** 3 Members

---

## 1. Project Overview

**CloudShift AI** is an intelligent cloud architecture platform that analyses an organisation's existing on-premise infrastructure and recommends an optimal AWS migration strategy based on **cost, performance, security, availability, scalability, RTO, and RPO requirements**.

The platform also allows users to **simulate infrastructure failures and disaster recovery scenarios**, evaluate the resilience of the proposed architecture, and compare alternative AWS architectures.

### Core Idea

```text
Existing Infrastructure
        ↓
Infrastructure Analysis
        ↓
Migration Strategy Recommendation
        ↓
AWS Architecture Generation
        ↓
Cost + Security + Performance Analysis
        ↓
Disaster Recovery Simulation
        ↓
Well-Architected Evaluation
        ↓
Final Architecture Recommendation
```

---

# 2. Main Features

### Infrastructure Analysis

* Enter existing infrastructure details.
* Define servers, databases, storage, traffic, users, and workload characteristics.
* Define business requirements:

  * Budget
  * Availability
  * RTO
  * RPO
  * Performance
  * Security

### Intelligent Migration Recommendation

Recommend:

* Rehost
* Replatform
* Refactor

Map existing infrastructure to appropriate AWS services.

Example:

```text
MySQL Database
      ↓
Migration Engine
      ↓
Amazon Aurora / RDS
```

### AWS Architecture Generation

Generate a visual AWS architecture containing:

* VPC
* Subnets
* EC2
* Load Balancer
* Auto Scaling
* RDS/Aurora
* DynamoDB
* S3
* CloudFront
* Security components

### Cost Analysis

Compare multiple architectures based on:

* Estimated infrastructure cost
* Storage cost
* Compute cost
* Database cost
* Data transfer considerations

### Disaster Recovery Simulator

Simulate:

* EC2 failure
* Database failure
* Availability Zone failure
* Application failure
* Region failure

Measure:

* RTO
* RPO
* Recovery status
* Availability impact

### Security Analysis

Evaluate:

* IAM
* Encryption
* Network isolation
* WAF
* Security groups
* Logging/auditing

### Well-Architected Evaluation

Score the architecture against:

* Security
* Reliability
* Performance Efficiency
* Cost Optimisation
* Operational Excellence

### Architecture Comparison

Generate multiple architecture options:

```text
Option A → Low Cost
Option B → Balanced
Option C → High Availability / Enterprise
```

The user can compare the trade-offs.

---

# 3. Technology Stack

## Frontend

### Technologies

* **React**
* **TypeScript**
* **Tailwind CSS**
* **React Flow**

### Responsibilities

* Dashboard
* Infrastructure input forms
* Architecture visualisation
* Migration recommendations
* Architecture comparison
* Cost dashboard
* DR simulation dashboard
* Well-Architected score display

### Important UI Pages

```text
Dashboard
├── New Project
├── Infrastructure Profile
├── Migration Analysis
├── Architecture
├── Cost Analysis
├── DR Simulator
├── Security Analysis
└── Reports
```

### React Flow

Use React Flow to visually represent:

```text
On-Premise
    ↓
Migration Engine
    ↓
AWS Architecture
    ↓
EC2 ── ALB ── CloudFront
 │
 ├── RDS
 ├── DynamoDB
 └── S3
```

---

# 4. Backend

## Technologies

* **Python**
* **FastAPI**
* **Boto3**
* REST APIs

### Responsibilities

The backend acts as the central orchestration layer.

It should handle:

* User/project data
* Infrastructure profiles
* Migration analysis
* AWS service recommendations
* Architecture generation
* Cost calculations
* DR simulation
* Security evaluation
* Report generation

### Suggested API Structure

```text
/api/projects
/api/infrastructure
/api/migration/analyse
/api/architecture/generate
/api/architecture/compare
/api/cost/estimate
/api/security/evaluate
/api/dr/simulate
/api/well-architected/score
/api/reports
```

---

# 5. Migration Decision Engine

This is the **core intelligence of the project**.

Initially implement this using deterministic rules rather than depending completely on an LLM.

### Input

```text
Database Type
Storage Size
Traffic
Number of Users
CPU Usage
Memory Usage
Availability Requirement
Budget
RTO
RPO
Security Requirement
```

### Example

```text
Input:

Database = MySQL
Storage = 5 TB
Users = 100,000
Availability = High
RTO = 1 hour
RPO = 15 minutes
Budget = Medium
```

### Output

```text
Migration Strategy:
Replatform

Database:
Amazon Aurora

Storage:
Amazon S3

Compute:
EC2 + Auto Scaling

Database Migration:
AWS DMS

Large Data Migration:
AWS Snowball

DR:
Multi-AZ architecture
```

### Decision Engine Responsibilities

Create rules for:

* Compute selection
* Database selection
* Storage selection
* Migration method
* DR strategy
* Architecture type
* Cost vs performance trade-offs

---

# 6. AI / LLM Layer

### Optional but Recommended

Use an LLM for **explanation**, not for critical architecture decisions.

### Possible technologies

* Local LLM such as Gemma/Llama
* Python LLM integration

### AI Features

The AI can explain:

> "Why was Aurora selected?"

> "Why was Snowball recommended?"

> "Why is Multi-AZ required?"

> "Why is Architecture B more expensive?"

### Important Design Rule

```text
Deterministic Engine
        ↓
Architecture Decision
        ↓
LLM
        ↓
Human-readable Explanation
```

Do **not** allow the LLM alone to determine critical AWS architecture decisions.

---

# 7. Database Layer

## Primary Database

### Amazon RDS PostgreSQL

Store:

* Users
* Projects
* Infrastructure profiles
* Migration plans
* Architecture configurations
* Simulation results
* Reports

---

## DynamoDB

Use for high-speed / event-oriented data such as:

* Simulation events
* Architecture state
* Real-time status
* Recovery events

### DynamoDB Streams

Use Streams to trigger downstream processing when important infrastructure/simulation data changes.

---

# 8. Storage

## Amazon S3

Use S3 for:

* Uploaded infrastructure files
* Architecture reports
* Generated diagrams
* Backup files
* Simulation logs
* Exported reports

### S3 Lifecycle

Demonstrate:

```text
S3 Standard
     ↓
S3 Infrequent Access
     ↓
Glacier
```

This demonstrates storage optimisation and lifecycle management.

---

## EBS

Use with EC2 for block storage.

## EFS

Use to demonstrate shared file storage across multiple EC2 instances.

---

# 9. AWS Compute Architecture

### Amazon EC2

Use EC2 for the application workload.

### Auto Scaling

Automatically increase/decrease EC2 instances based on workload.

### Elastic Load Balancing

Distribute traffic between EC2 instances.

Architecture:

```text
             CloudFront
                 ↓
                WAF
                 ↓
                ALB
                 ↓
        ┌────────┴────────┐
        ↓                 ↓
      EC2-1             EC2-2
        └────────┬────────┘
                 ↓
              Database
```

---

# 10. Networking

## Amazon VPC

Create:

```text
VPC
├── Public Subnet
│   └── Load Balancer
│
└── Private Subnet
    ├── EC2
    ├── RDS
    └── Internal Services
```

### Components

Implement/demo:

* VPC
* Public/private subnets
* Route tables
* Security groups
* Network isolation
* VPC Peering

### Direct Connect

Demonstrate as part of the **hybrid migration architecture**:

```text
On-Premise Data Centre
        │
        │ Direct Connect
        ↓
       AWS VPC
```

It does not need to be physically deployed for the student prototype.

---

# 11. Database Architecture

Demonstrate different database decisions.

### RDS

For traditional relational workloads.

### RDS Multi-AZ

For high availability.

### Read Replica

For read-heavy workloads.

### Aurora

For high-performance relational workloads.

### DynamoDB

For NoSQL/key-value workloads.

### DynamoDB Streams

For event-driven processing.

The project should explain **why a particular database was selected** rather than simply deploying every database.

---

# 12. Event-Driven Architecture

Use:

### Amazon SQS

For asynchronous and decoupled tasks.

Example:

```text
Migration Request
       ↓
      SQS
       ↓
Migration Worker
```

### Amazon SNS

For notifications:

```text
DR Failure
   ↓
SNS
   ├── Email
   ├── Alert
   └── Dashboard
```

### AWS Step Functions

For DR/migration workflows:

```text
Failure Detected
      ↓
Verify Failure
      ↓
Start Recovery
      ↓
Promote Database
      ↓
Restore Application
      ↓
Redirect Traffic
      ↓
Measure RTO
```

### AWS SWF

Include a brief architectural comparison with Step Functions because it appears in the course syllabus. Use **Step Functions for the actual modern workflow implementation**.

---

# 13. Disaster Recovery Simulator

This is one of the project's major components.

### Failure Scenarios

#### Scenario 1 — EC2 Failure

```text
EC2 Failure
    ↓
Auto Scaling
    ↓
Replacement Instance
```

#### Scenario 2 — Database Failure

```text
Primary DB Failure
       ↓
Multi-AZ Failover
       ↓
Application Recovery
```

#### Scenario 3 — Availability Zone Failure

```text
AZ-1 ❌
 ↓
AZ-2
 ↓
Application Continues
```

#### Scenario 4 — Region Failure

```text
Primary Region ❌
       ↓
DR Region
       ↓
Traffic Redirect
```

### Metrics

Record:

* RTO
* RPO
* Recovery duration
* Service availability
* Data loss
* Failed components

---

# 14. Security

## IAM

Implement:

* Users
* Groups
* Roles
* Least-privilege policies
* Service roles

## KMS

Use for encryption of sensitive data.

## WAF

Protect the web application against common web attacks.

## Shield

Include DDoS protection in the architecture.

## CloudTrail

Track AWS API activity.

## AWS Config

Monitor configuration compliance.

### Security Architecture

```text
Internet
   ↓
CloudFront
   ↓
WAF + Shield
   ↓
ALB
   ↓
Private EC2
   ↓
Private Database

IAM → Access Control
KMS → Encryption
CloudTrail → Audit
Config → Compliance
```

---

# 15. Monitoring & Operations

## CloudWatch

Monitor:

* CPU
* Memory
* Network
* Request count
* Application errors
* Database metrics
* Auto Scaling
* DR events

Create alarms such as:

```text
CPU > 80%
    ↓
CloudWatch Alarm
    ↓
Auto Scaling
```

## CloudTrail

Track:

* Login/activity
* AWS API calls
* Configuration changes

## AWS Config

Check:

* Public resources
* Security configuration
* Compliance rules

## Systems Manager

Use for:

* EC2 management
* Patch management
* Operational tasks

---

# 16. Cost Management

Implement a cost analysis module.

### Compare:

```text
Architecture A
Low Cost

Architecture B
Balanced

Architecture C
High Availability
```

Evaluate:

* Compute
* Storage
* Database
* Networking
* Architecture complexity

### AWS Services

Demonstrate:

* AWS Budgets
* AWS Cost Management
* Free Tier awareness
* Trusted Advisor

The application should identify potentially unnecessary or expensive resources and suggest alternatives.

---

# 17. Infrastructure as Code

## Terraform

Use Terraform to provision the AWS environment.

Example:

```text
Terraform
   ↓
VPC
├── Subnets
├── Route Tables
└── Security Groups

EC2
ALB
Auto Scaling
RDS
S3
CloudWatch
IAM
```

Benefits:

* Reproducible infrastructure
* Version-controlled architecture
* Easier deployment
* Strong resume/interview value

---

# 18. Docker & CI/CD

## Docker

Containerise:

* FastAPI backend
* Frontend

## GitHub

Use Git for collaboration.

## GitHub Actions

Pipeline:

```text
Git Push
   ↓
GitHub Actions
   ↓
Tests
   ↓
Build
   ↓
Docker Image
   ↓
Deploy
```

---

# 19. AWS Migration Components

The platform should recommend the appropriate migration method.

### AWS DMS

For database migration.

```text
On-Premise MySQL
       ↓
AWS DMS
       ↓
RDS/Aurora
```

### AWS Server Migration Service

Include as a server migration option/scenario.

### Snowball

For large-scale offline data migration.

### Snowball Edge

For edge/offline environments.

### Snowmobile

Include as an extreme-scale migration scenario.

Example decision logic:

```text
Data Size
   │
   ├── Normal Database → DMS
   │
   ├── Large Data → Snowball
   │
   ├── Edge Environment → Snowball Edge
   │
   └── Extremely Massive → Snowmobile
```

These services do not all need to be physically deployed. Their **architecture decisions and migration scenarios** should be demonstrated.

---

# 20. Well-Architected Framework

Evaluate the proposed architecture using:

### Security

Is data and access properly protected?

### Reliability

Can the system survive failures?

### Performance Efficiency

Are resources appropriately selected?

### Cost Optimisation

Can the architecture achieve its requirements at lower cost?

### Operational Excellence

Can the system be monitored and maintained?

Generate a score such as:

```text
Security             92%
Reliability           89%
Performance           87%
Cost Optimisation     94%
Operations            85%
```

---


# 23. Testing & Demonstration

The final project should demonstrate **architecture behaviour**, not just that the application works.

### Test 1 — Traffic Spike

```text
Normal Traffic
      ↓
Traffic Spike
      ↓
Auto Scaling
      ↓
Additional EC2
```

Measure:

* CPU
* Request count
* Response time
* Number of instances

### Test 2 — EC2 Failure

Terminate an instance and demonstrate automatic recovery.

### Test 3 — Database Failure

Demonstrate Multi-AZ failover.

### Test 4 — Security Attack

Send simulated malicious requests and demonstrate WAF blocking.

### Test 5 — DR

Simulate primary infrastructure failure and activate the recovery workflow.

### Test 6 — Cost Optimisation

Compare:

```text
Original Architecture
        vs
Optimised Architecture
```

### Test 7 — Migration

Provide a sample legacy infrastructure and demonstrate the generated AWS migration plan.

---

# 24. Final Demonstration Flow

The final presentation should follow this sequence:

```text
1. Introduce Real-World Problem
            ↓
2. Show Legacy Infrastructure
            ↓
3. Enter Infrastructure Requirements
            ↓
4. Run Migration Analysis
            ↓
5. Generate AWS Architecture
            ↓
6. Explain AWS Service Selection
            ↓
7. Show Cost Analysis
            ↓
8. Show Security Analysis
            ↓
9. Simulate Failure
            ↓
10. Trigger Disaster Recovery
            ↓
11. Measure RTO/RPO
            ↓
12. Show Well-Architected Score
            ↓
13. Compare Optimised Architecture
```

---

# 25. Potential Novelty / Innovation

The project should not be presented as merely an AWS migration calculator.

The potential innovative component is:

## Multi-Objective Cloud Architecture Recommendation

The system considers multiple objectives simultaneously:

```text
Cost
Performance
Security
Availability
Scalability
RTO
RPO
Migration Complexity
```

Instead of returning one fixed architecture, it generates alternatives based on business priorities.

### Example

```text
Priority:
Cost = 40%
Availability = 20%
Security = 20%
Performance = 20%

                ↓

Recommended Architecture
```

Changing the priorities produces a different architecture.

### Potential Research/Patent Direction

> **An explainable, multi-objective cloud migration and disaster-recovery architecture recommendation system that dynamically selects AWS services based on business constraints and evaluates the resulting architecture for cost, security, performance and resilience.**

**Note:** This is a potential novelty direction, not a guarantee that the invention is patentable. A formal prior-art/patent search would be required before making a patent claim.

---

# 26. Minimum Viable Product (MVP)

If time becomes limited, prioritise:

### Must Have

* [ ] React dashboard
* [ ] Infrastructure input
* [ ] Migration decision engine
* [ ] AWS service recommendation
* [ ] Architecture visualisation
* [ ] VPC + EC2 + ALB + Auto Scaling
* [ ] RDS + S3
* [ ] IAM
* [ ] CloudWatch
* [ ] Cost estimation
* [ ] DR simulation
* [ ] Terraform

### Should Have

* [ ] DynamoDB
* [ ] SQS
* [ ] SNS
* [ ] Step Functions
* [ ] KMS
* [ ] WAF
* [ ] CloudTrail
* [ ] Config
* [ ] Well-Architected scoring

### Advanced

* [ ] AI explanation layer
* [ ] Multi-region simulation
* [ ] Automated architecture generation
* [ ] Dynamic architecture optimisation
* [ ] Migration cost optimisation
* [ ] Automated AWS deployment
* [ ] Advanced failure injection

---

# 27. Final Technology Summary

| Domain                     | Technology                                        |
| -------------------------- | ------------------------------------------------- |
| Frontend                   | React + TypeScript                                |
| UI                         | Tailwind CSS                                      |
| Architecture Visualisation | React Flow                                        |
| Backend                    | Python + FastAPI                                  |
| AWS SDK                    | Boto3                                             |
| AI                         | LLM + Python *(optional)*                         |
| Primary DB                 | Amazon RDS PostgreSQL                             |
| NoSQL                      | DynamoDB                                          |
| Object Storage             | S3                                                |
| Block Storage              | EBS                                               |
| Shared Storage             | EFS                                               |
| Archive                    | Glacier                                           |
| Compute                    | EC2                                               |
| Scaling                    | Auto Scaling                                      |
| Load Balancer              | ALB                                               |
| CDN                        | CloudFront                                        |
| Networking                 | VPC                                               |
| Messaging                  | SQS                                               |
| Notifications              | SNS                                               |
| Workflow                   | Step Functions                                    |
| Monitoring                 | CloudWatch                                        |
| Audit                      | CloudTrail                                        |
| Compliance                 | AWS Config                                        |
| Operations                 | Systems Manager                                   |
| Security                   | IAM + KMS + WAF + Shield                          |
| Migration                  | DMS + SMS + Snowball + Snowball Edge + Snowmobile |
| IaC                        | Terraform                                         |
| Containers                 | Docker                                            |
| CI/CD                      | GitHub Actions                                    |
| Version Control            | Git + GitHub                                      |

---

# 28. Project Goal

The final system should demonstrate that the team can take a **real-world legacy infrastructure**, analyse its requirements, design an appropriate AWS architecture, migrate the workload, secure and monitor it, optimise its cost, and prove its resilience through disaster-recovery simulations.

> **The objective is not to use every AWS service. The objective is to demonstrate why each selected service is appropriate and how the complete architecture behaves under real-world conditions.**
