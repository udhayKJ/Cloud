"""
CloudShift AI: Security Evaluation Engine
Assesses IAM, KMS, WAF, Shield, CloudTrail, AWS Config, and network isolation
Adheres strictly to Project.md Section 2, 10, 14 & 15
"""

from typing import List, Dict, Any
from backend.models import InfrastructureProfile, ArchitectureOption, SecurityReport, SecurityControl


def evaluate_security(p: InfrastructureProfile, arch: ArchitectureOption) -> SecurityReport:
    controls: List[SecurityControl] = [
        SecurityControl(
            id="sec-iam-1",
            name="Least-Privilege IAM Roles & Policies",
            service="AWS IAM",
            pillar="identity",
            status="enabled",
            severity="critical",
            description="EC2 instances and services use IAM instance profiles with least-privilege permissions and temporary STS tokens rather than long-lived root credentials."
        ),
        SecurityControl(
            id="sec-iam-2",
            name="MFA & Role-Based Access Control",
            service="AWS IAM & AWS IAM Identity Center",
            pillar="identity",
            status="enabled",
            severity="high",
            description="Enforces Multi-Factor Authentication (MFA) for administrative roles and groups mapped to organisational units."
        ),
        SecurityControl(
            id="sec-kms-1",
            name="At-Rest Encryption (EBS, RDS, S3)",
            service="AWS KMS",
            pillar="encryption",
            status="enabled",
            severity="critical",
            description="All storage volumes, database clusters, and S3 buckets are encrypted using AWS KMS Customer Managed Keys (CMK) with annual rotation."
        ),
        SecurityControl(
            id="sec-kms-2",
            name="In-Transit Encryption (TLS 1.3)",
            service="AWS Certificate Manager (ACM) + ALB",
            pillar="encryption",
            status="enabled",
            severity="high",
            description="End-to-end SSL/TLS 1.3 termination at ALB with HTTPS redirect and internal TLS between ALB and backend compute."
        ),
        SecurityControl(
            id="sec-net-1",
            name="VPC Private Subnet Isolation",
            service="Amazon VPC & Security Groups",
            pillar="network",
            status="enabled",
            severity="critical",
            description="Database instances and internal application servers reside exclusively in private subnets with no public IPv4 route."
        ),
        SecurityControl(
            id="sec-net-2",
            name="Stateful Security Groups & Network ACLs",
            service="Amazon VPC Security Groups",
            pillar="network",
            status="enabled",
            severity="high",
            description="Strict ingress rules restricting port 3306/5432 exclusively to the application security group."
        ),
        SecurityControl(
            id="sec-edge-1",
            name="Web Application Firewall (WAF) OWASP Top 10",
            service="AWS WAF",
            pillar="edge",
            status="enabled" if arch.tier in ["balanced", "enterprise"] else "partial",
            severity="high",
            description="Protects public endpoints against SQL Injection, Cross-Site Scripting (XSS), rate limits, and known bad IP reputation lists."
        ),
        SecurityControl(
            id="sec-edge-2",
            name="DDoS Protection & Edge Mitigation",
            service="AWS Shield & Amazon CloudFront",
            pillar="edge",
            status="enabled" if arch.tier in ["balanced", "enterprise"] else "partial",
            severity="medium",
            description="Layer 3/4 SYN flood protection via AWS Shield Standard and CDN absorption."
        ),
        SecurityControl(
            id="sec-audit-1",
            name="Continuous API Auditing & Tamper-Proof Logs",
            service="AWS CloudTrail",
            pillar="audit",
            status="enabled",
            severity="high",
            description="Multi-region CloudTrail enabled with log file validation, delivered to an encrypted S3 audit bucket with Object Lock."
        ),
        SecurityControl(
            id="sec-audit-2",
            name="Compliance Rule Monitoring & Drift Detection",
            service="AWS Config",
            pillar="audit",
            status="enabled" if arch.tier in ["balanced", "enterprise"] else "partial",
            severity="medium",
            description="Monitors non-compliant public S3 buckets, unencrypted EBS volumes, and security group drift in real-time."
        )
    ]

    # Findings
    findings: List[Dict[str, Any]] = []
    if arch.tier == "low-cost":
        findings.append({
            "title": "WAF Rate-Limiting & Managed Rules Missing",
            "severity": "medium",
            "recommendation": "Attach AWS WAF to ALB with AWSManagedRulesCommonRuleSet to filter bot traffic and prevent Layer 7 attacks."
        })
        findings.append({
            "title": "Automated Config Drift Remediation Not Configured",
            "severity": "low",
            "recommendation": "Enable AWS Config automated remediation rule `s3-bucket-public-read-prohibited`."
        })
    else:
        findings.append({
            "title": "Enable GuardDuty AI Threat Detection",
            "severity": "low",
            "recommendation": "Activate Amazon GuardDuty for intelligent anomaly detection against VPC flow logs and DNS query logs."
        })

    # Score calculation
    enabled_count = sum(1 for c in controls if c.status == "enabled")
    partial_count = sum(1 for c in controls if c.status == "partial")
    score = round(((enabled_count * 10.0) + (partial_count * 5.0)) / len(controls) * 10.0, 1)

    return SecurityReport(
        score=score,
        controls=controls,
        findings=findings
    )
