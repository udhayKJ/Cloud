import type { ArchitectureOption, InfrastructureProfile, SecurityControl, SecurityReport } from '@/lib/types'

export function evaluateSecurity(p: InfrastructureProfile, arch: ArchitectureOption): SecurityReport {
  const has = (id: string) => arch.components.some((c) => c.id === id)
  const cmk = arch.tier !== 'low-cost'

  const controls: SecurityControl[] = [
    {
      id: 'iam-lp',
      name: 'Least-privilege IAM roles',
      service: 'AWS IAM',
      pillar: 'identity',
      status: 'enabled',
      severity: 'critical',
      description: 'EC2 instance profiles and service roles scoped to required actions only. No long-lived access keys.',
    },
    {
      id: 'iam-mfa',
      name: 'MFA on privileged users',
      service: 'AWS IAM',
      pillar: 'identity',
      status: p.security === 'low' ? 'partial' : 'enabled',
      severity: 'high',
      description: 'Hardware or virtual MFA enforced through IAM policy conditions.',
    },
    {
      id: 'kms',
      name: 'Encryption at rest (EBS, RDS, S3, EFS)',
      service: 'AWS KMS',
      pillar: 'encryption',
      status: cmk ? 'enabled' : 'partial',
      severity: 'critical',
      description: cmk ? 'Customer-managed keys with annual rotation and key policies.' : 'AWS-managed keys — upgrade to CMKs for audit-grade control.',
    },
    {
      id: 'tls',
      name: 'Encryption in transit',
      service: 'ACM + ALB',
      pillar: 'encryption',
      status: 'enabled',
      severity: 'critical',
      description: 'TLS 1.2+ terminated at ALB with ACM certificates; RDS connections enforce SSL.',
    },
    {
      id: 'vpc-iso',
      name: 'Private subnet isolation',
      service: 'Amazon VPC',
      pillar: 'network',
      status: 'enabled',
      severity: 'critical',
      description: 'Compute and databases have no public IPs; egress through NAT Gateway only.',
    },
    {
      id: 'sg',
      name: 'Tiered security groups',
      service: 'Security Groups',
      pillar: 'network',
      status: 'enabled',
      severity: 'high',
      description: 'ALB → EC2 (443/80), EC2 → DB (3306/5432). No 0.0.0.0/0 inbound except ALB.',
    },
    {
      id: 'flow',
      name: 'VPC Flow Logs',
      service: 'Amazon VPC',
      pillar: 'network',
      status: arch.tier === 'low-cost' ? 'missing' : 'enabled',
      severity: 'medium',
      description: 'Network telemetry to CloudWatch Logs for forensics and GuardDuty.',
    },
    {
      id: 'waf',
      name: 'Web Application Firewall',
      service: 'AWS WAF',
      pillar: 'edge',
      status: has('waf') ? 'enabled' : 'missing',
      severity: 'high',
      description: 'AWS Managed Rules: Core Rule Set, SQLi, known bad inputs, rate-based rule (2000 req / 5 min).',
    },
    {
      id: 'shield',
      name: 'DDoS protection',
      service: 'AWS Shield',
      pillar: 'edge',
      status: has('waf') ? 'enabled' : 'partial',
      severity: 'high',
      description: has('waf') ? 'Shield Standard on CloudFront + ALB, WAF rate limiting for L7.' : 'Shield Standard only (L3/L4).',
    },
    {
      id: 'cloudtrail',
      name: 'API audit logging',
      service: 'AWS CloudTrail',
      pillar: 'audit',
      status: has('cloudtrail') ? 'enabled' : 'missing',
      severity: 'high',
      description: 'Multi-region trail with log file validation, delivered to an encrypted, versioned S3 bucket.',
    },
    {
      id: 'config',
      name: 'Configuration compliance',
      service: 'AWS Config',
      pillar: 'audit',
      status: has('config') ? 'enabled' : 'missing',
      severity: 'medium',
      description: 'Rules: s3-bucket-public-read-prohibited, restricted-ssh, rds-storage-encrypted, encrypted-volumes.',
    },
    {
      id: 'guardduty',
      name: 'Threat detection',
      service: 'Amazon GuardDuty',
      pillar: 'audit',
      status: has('guardduty') ? 'enabled' : arch.tier === 'balanced' ? 'partial' : 'missing',
      severity: 'medium',
      description: 'Continuous analysis of CloudTrail, DNS and Flow Logs for compromised credentials and crypto-mining.',
    },
    {
      id: 'ssm',
      name: 'Patch management',
      service: 'Systems Manager',
      pillar: 'identity',
      status: 'enabled',
      severity: 'medium',
      description: 'Patch baselines applied in maintenance windows; Session Manager replaces SSH bastions.',
    },
  ]

  const weight: Record<SecurityControl['severity'], number> = { critical: 4, high: 3, medium: 2, low: 1 }
  const statusValue: Record<SecurityControl['status'], number> = { enabled: 1, partial: 0.5, missing: 0 }
  const max = controls.reduce((a, c) => a + weight[c.severity], 0)
  const got = controls.reduce((a, c) => a + weight[c.severity] * statusValue[c.status], 0)
  const score = Math.round((got / max) * 100)

  const findings = controls
    .filter((c) => c.status !== 'enabled')
    .map((c) => ({
      title: `${c.name} is ${c.status}`,
      severity: c.severity,
      recommendation:
        c.id === 'waf'
          ? 'Attach AWS WAF web ACL to the ALB / CloudFront distribution with the Core Rule Set.'
          : c.id === 'kms'
            ? 'Create customer-managed KMS keys and re-encrypt volumes and snapshots.'
            : c.id === 'cloudtrail'
              ? 'Enable an organisation trail across all regions with log validation.'
              : c.id === 'config'
                ? 'Deploy the Operational Best Practices for AWS Well-Architected conformance pack.'
                : c.id === 'guardduty'
                  ? 'Enable GuardDuty in all regions and route findings to SNS.'
                  : c.id === 'flow'
                    ? 'Enable VPC Flow Logs to CloudWatch Logs with 90-day retention.'
                    : 'Enforce MFA through an IAM policy deny condition on aws:MultiFactorAuthPresent.',
    }))

  if (p.compliance.length > 0)
    findings.push({
      title: `${p.compliance.join(', ')} compliance scope`,
      severity: 'medium',
      recommendation: 'Map controls to AWS Artifact reports and enable AWS Audit Manager frameworks for continuous evidence collection.',
    })

  return { score, controls, findings }
}
