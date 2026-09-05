import type {
  ArchitectureOption,
  DrSimulationResult,
  DrStep,
  FailureScenario,
  InfrastructureProfile,
} from '@/lib/types'

export const SCENARIOS: { id: FailureScenario; title: string; description: string; blast: string }[] = [
  { id: 'ec2', title: 'EC2 Instance Failure', description: 'A single application instance is terminated unexpectedly.', blast: 'Compute node' },
  { id: 'database', title: 'Primary Database Failure', description: 'The primary DB instance becomes unreachable (storage / host fault).', blast: 'Data tier' },
  { id: 'az', title: 'Availability Zone Failure', description: 'An entire AZ loses power and network — all resources inside go dark.', blast: 'Zone' },
  { id: 'application', title: 'Application Failure', description: 'A bad deployment causes the application process to crash-loop.', blast: 'App layer' },
  { id: 'region', title: 'Region Failure', description: 'The primary AWS region becomes unavailable.', blast: 'Region' },
]

const step = (id: string, title: string, service: string, durationSec: number, description: string): DrStep => ({
  id,
  title,
  service,
  durationSec,
  description,
})

export function simulateFailure(
  p: InfrastructureProfile,
  arch: ArchitectureOption,
  scenario: FailureScenario,
): DrSimulationResult {
  const single = arch.tier === 'low-cost'
  const aurora = arch.databaseService.includes('Aurora')
  const dynamo = arch.databaseService.includes('DynamoDB')
  const title = SCENARIOS.find((s) => s.id === scenario)!.title
  let steps: DrStep[] = []
  let rto = 0
  let rpo = 0
  let dataLossMb = 0
  let impact = 0
  let recoveredBy = ''
  let failed: string[] = []
  let narrative = ''

  switch (scenario) {
    case 'ec2': {
      steps = [
        step('detect', 'Failure detected', 'ALB Health Check', 15, 'Target fails 2 consecutive health checks (interval 10s).'),
        step('drain', 'Deregister unhealthy target', 'Application Load Balancer', 5, 'Traffic routed to remaining healthy targets.'),
        step('launch', 'Launch replacement', 'Auto Scaling', 70, `Launch template ${arch.instanceType} in ${arch.multiAz ? 'least-loaded AZ' : 'AZ-a'}.`),
        step('boot', 'Instance warm-up', 'EC2 User Data', 45, 'Bootstrap, pull config from SSM Parameter Store.'),
        step('healthy', 'Target healthy — traffic restored', 'ALB', 20, 'Passes health checks; registered in target group.'),
        step('notify', 'Notify & record RTO', 'SNS + CloudWatch', 3, 'Event published to ops topic and dashboard.'),
      ]
      rto = steps.reduce((a, s) => a + s.durationSec, 0) / 60
      rpo = 0
      impact = single ? 100 : Math.round(100 / arch.instanceCount)
      recoveredBy = 'Auto Scaling group'
      failed = ['EC2 instance i-0a3f…']
      narrative = single
        ? 'With a single instance the application is unavailable until Auto Scaling replaces it. Consider min 2 instances across AZs.'
        : `Remaining ${arch.instanceCount - 1} instance(s) absorb traffic at reduced capacity; users experience no outage.`
      break
    }
    case 'database': {
      if (dynamo) {
        steps = [
          step('detect', 'Partition unavailable', 'DynamoDB', 2, 'Request routed to replica partition automatically.'),
          step('done', 'No action required', 'DynamoDB', 1, 'Data is replicated across 3 AZs synchronously.'),
        ]
        rto = 0.05
        rpo = 0
        impact = 0
        recoveredBy = 'DynamoDB built-in replication'
        failed = ['Storage node']
        narrative = 'DynamoDB is inherently Multi-AZ; the failure is invisible to the application.'
      } else if (arch.multiAz) {
        steps = [
          step('detect', 'Primary DB unreachable', 'RDS Monitoring', aurora ? 10 : 30, 'Enhanced monitoring detects host failure.'),
          step('verify', 'Verify failure', 'Step Functions', 5, 'Confirms loss of primary before promoting to avoid split-brain.'),
          step('promote', 'Promote standby', aurora ? 'Aurora Failover' : 'RDS Multi-AZ', aurora ? 20 : 60, aurora ? 'Reader promoted; shared storage means no data copy.' : 'Synchronous standby promoted to primary.'),
          step('dns', 'DNS endpoint flipped', 'RDS Endpoint', aurora ? 5 : 30, 'CNAME updated to new primary; TTL 5s.'),
          step('reconnect', 'Application reconnects', 'Connection Pool', 15, 'Retries with exponential backoff.'),
          step('notify', 'Notify & record RTO/RPO', 'SNS', 3, 'RDS-EVENT-0025 published.'),
        ]
        rto = steps.reduce((a, s) => a + s.durationSec, 0) / 60
        rpo = 0
        impact = 100
        recoveredBy = aurora ? 'Aurora automatic failover' : 'RDS Multi-AZ failover'
        failed = ['db-primary (AZ-a)']
        narrative = `Synchronous replication means zero data loss. Writes pause for ~${Math.round(rto * 60)}s during failover.`
      } else {
        steps = [
          step('detect', 'Primary DB unreachable', 'CloudWatch Alarm', 60, 'DatabaseConnections drops to 0; alarm fires.'),
          step('verify', 'Operator verifies failure', 'Runbook', 600, 'Manual confirmation — no automated standby exists.'),
          step('restore', 'Restore from snapshot / PITR', 'RDS', 2700, `Restoring ${p.dbSizeGb} GB from latest automated backup.`),
          step('endpoint', 'Update application endpoint', 'SSM Parameter Store', 300, 'New instance endpoint pushed to app config.'),
          step('restart', 'Restart application tier', 'Auto Scaling', 180, 'Instance refresh to pick up new endpoint.'),
          step('notify', 'Notify & record RTO/RPO', 'SNS', 3, 'Incident closed.'),
        ]
        rto = steps.reduce((a, s) => a + s.durationSec, 0) / 60
        rpo = 5
        dataLossMb = Math.round((p.monthlyUsers / 30 / 24 / 60) * 5 * 0.02)
        impact = 100
        recoveredBy = 'Manual restore from snapshot'
        failed = ['db-primary', 'Application (write path)']
        narrative = 'Single-AZ database requires a restore. Enabling Multi-AZ reduces RTO from ~1 hour to ~2 minutes.'
      }
      break
    }
    case 'az': {
      if (arch.multiAz) {
        steps = [
          step('detect', 'AZ-a impaired', 'AWS Health + CloudWatch', 30, 'Multiple instance status checks fail simultaneously.'),
          step('alb', 'ALB shifts traffic to AZ-b', 'Application Load Balancer', 10, 'Cross-zone load balancing routes to healthy targets.'),
          step('db', 'Database failover to AZ-b', aurora ? 'Aurora' : 'RDS Multi-AZ', aurora ? 30 : 90, 'Standby in AZ-b promoted.'),
          step('asg', 'Auto Scaling rebalances', 'Auto Scaling', 120, `Launches ${Math.ceil(arch.instanceCount / 2)} replacement instances in AZ-b.`),
          step('cache', 'ElastiCache replica promoted', 'ElastiCache', 20, 'Redis replica in AZ-b becomes primary.'),
          step('notify', 'Notify & record RTO/RPO', 'SNS + Step Functions', 3, 'Recovery workflow complete.'),
        ]
        rto = (30 + 10 + (aurora ? 30 : 90)) / 60
        rpo = 0
        impact = 50
        recoveredBy = 'Multi-AZ architecture'
        failed = ['AZ-a: EC2 ×' + Math.ceil(arch.instanceCount / 2), 'db-primary', 'NAT-a']
        narrative = 'Application remains available at reduced capacity while Auto Scaling restores full capacity in AZ-b.'
      } else {
        steps = [
          step('detect', 'AZ-a impaired', 'AWS Health', 60, 'All resources in the single AZ are unreachable.'),
          step('verify', 'Declare disaster', 'Runbook', 900, 'Operator activates DR plan.'),
          step('vpc', 'Provision subnets in AZ-b', 'Terraform', 600, 'Apply infrastructure in new AZ.'),
          step('db', 'Restore DB snapshot in AZ-b', 'RDS', 2700, `Restore ${p.dbSizeGb} GB snapshot.`),
          step('app', 'Launch app from AMI', 'Auto Scaling', 300, 'Update ASG subnets; launch instances.'),
          step('dns', 'Repoint ALB / DNS', 'Route 53', 120, 'New ALB in AZ-b.'),
          step('notify', 'Notify & record RTO/RPO', 'SNS', 3, 'Incident closed.'),
        ]
        rto = steps.reduce((a, s) => a + s.durationSec, 0) / 60
        rpo = 60
        dataLossMb = Math.round((p.monthlyUsers / 30 / 24 / 60) * 60 * 0.02)
        impact = 100
        recoveredBy = 'Manual rebuild in AZ-b'
        failed = ['All EC2', 'db-primary', 'ALB', 'NAT Gateway']
        narrative = 'Single-AZ design is fully unavailable. Multi-AZ would reduce RTO from hours to minutes with zero data loss.'
      }
      break
    }
    case 'application': {
      steps = [
        step('detect', 'Error rate spike', 'CloudWatch Alarm', 60, 'HTTPCode_Target_5XX > 5% for 1 minute.'),
        step('verify', 'Verify failure', 'Step Functions', 5, 'Correlates with recent deployment event.'),
        step('rollback', 'Automatic rollback', 'CodeDeploy', single ? 240 : 120, single ? 'In-place rollback on single instance.' : 'Blue/green shift back to previous target group.'),
        step('health', 'Health checks pass', 'ALB', 30, 'Error rate returns below threshold.'),
        step('notify', 'Notify & record RTO', 'SNS', 3, 'Deployment marked failed; team paged.'),
      ]
      rto = steps.reduce((a, s) => a + s.durationSec, 0) / 60
      rpo = 0
      impact = single ? 100 : 40
      recoveredBy = 'CodeDeploy automatic rollback'
      failed = ['App v2.4.1 deployment']
      narrative = single
        ? 'All traffic hits the broken version until rollback completes.'
        : 'Blue/green deployment limits blast radius; rollback is a target-group swap.'
      break
    }
    case 'region': {
      if (arch.multiRegion) {
        const active = arch.drStrategy === 'Multi-Site Active/Active'
        steps = [
          step('detect', 'Primary region health check fails', 'Route 53 Health Check', 30, '3 consecutive failures from 8 global checkers.'),
          step('verify', 'Verify regional failure', 'Step Functions (DR region)', 10, 'Confirms failure via cross-region CloudWatch.'),
          step('promote', 'Promote DR database', aurora ? 'Aurora Global Database' : dynamo ? 'DynamoDB Global Tables' : 'Cross-region replica', dynamo ? 1 : aurora ? 60 : 300, aurora ? 'Managed planned failover; secondary becomes writable.' : dynamo ? 'Already multi-master.' : 'Read replica promoted.'),
          step('scale', active ? 'Scale existing fleet' : 'Scale warm standby to production', 'Auto Scaling', active ? 60 : 180, active ? 'DR region already serving; scale out.' : `Warm fleet grows from ${Math.ceil(arch.instanceCount / 2)} to ${arch.instanceCount}.`),
          step('dns', 'Redirect traffic', 'Route 53 Failover', 60, 'DNS failover record → DR region ALB. TTL 60s.'),
          step('measure', 'Measure RTO / RPO', 'CloudWatch', 3, 'Recovery metrics published.'),
        ]
        rto = steps.reduce((a, s) => a + s.durationSec, 0) / 60
        rpo = dynamo ? 0 : 1
        dataLossMb = dynamo ? 0 : Math.round((p.monthlyUsers / 30 / 24 / 60) * 1 * 0.02)
        impact = active ? 30 : 100
        recoveredBy = `${arch.drStrategy} in DR region`
        failed = ['us-east-1: all resources']
        narrative = active
          ? 'Active/active means the DR region was already serving users; only the failed region\'s share is redirected.'
          : 'Warm standby has data and a minimal fleet ready; recovery is scaling and DNS.'
      } else if (arch.tier === 'balanced') {
        steps = [
          step('detect', 'Primary region unavailable', 'Route 53 + AWS Health', 60, 'Health checks and Personal Health Dashboard.'),
          step('verify', 'Declare regional DR', 'Runbook / Step Functions', 300, 'Ops lead approval.'),
          step('db', 'Promote cross-region read replica', 'RDS', 420, 'Replica in DR region promoted (async replication).'),
          step('infra', 'Scale pilot light', 'Terraform + Auto Scaling', 600, `ASG desired from 0 → ${arch.instanceCount}.`),
          step('dns', 'Redirect traffic', 'Route 53', 120, 'Failover record updated.'),
          step('measure', 'Measure RTO / RPO', 'CloudWatch', 3, 'Recovery metrics published.'),
        ]
        rto = steps.reduce((a, s) => a + s.durationSec, 0) / 60
        rpo = 5
        dataLossMb = Math.round((p.monthlyUsers / 30 / 24 / 60) * 5 * 0.02)
        impact = 100
        recoveredBy = 'Pilot Light DR region'
        failed = ['Primary region: all resources']
        narrative = 'Pilot light keeps data replicated with the core infrastructure switched off. Recovery is ~25 minutes.'
      } else {
        steps = [
          step('detect', 'Primary region unavailable', 'AWS Health', 300, 'No automated cross-region health checks.'),
          step('verify', 'Declare disaster', 'Runbook', 1800, 'Manual approval chain.'),
          step('infra', 'Build infrastructure in DR region', 'Terraform', 3600, 'VPC, ALB, ASG, RDS from code.'),
          step('db', 'Restore DB from cross-region snapshot copy', 'RDS', 5400, `${p.dbSizeGb} GB snapshot copied daily.`),
          step('s3', 'Repoint to S3 replica / restore', 'S3', 1800, 'Cross-region replication not configured — restore from Glacier.'),
          step('dns', 'Update DNS', 'Route 53', 600, 'Manual record change.'),
          step('measure', 'Measure RTO / RPO', 'CloudWatch', 3, 'Incident closed.'),
        ]
        rto = steps.reduce((a, s) => a + s.durationSec, 0) / 60
        rpo = 24 * 60
        dataLossMb = Math.round((p.monthlyUsers / 30 / 24 / 60) * 24 * 60 * 0.02)
        impact = 100
        recoveredBy = 'Backup & Restore'
        failed = ['Primary region: all resources', 'Up to 24h of writes']
        narrative = 'Backup & Restore is the cheapest DR tier but recovery takes hours and loses up to a day of data.'
      }
      break
    }
  }

  return {
    scenario,
    title,
    steps,
    rtoMinutes: Math.round(rto * 10) / 10,
    rpoMinutes: rpo,
    dataLossMb,
    availabilityImpactPct: impact,
    recovered: true,
    failedComponents: failed,
    recoveredBy,
    meetsRto: rto <= p.rtoMinutes,
    meetsRpo: rpo <= p.rpoMinutes,
    narrative,
  }
}
