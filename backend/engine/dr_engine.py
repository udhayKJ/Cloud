"""
CloudShift AI: Disaster Recovery Simulator Engine
Simulates 5 failure scenarios and measures RTO, RPO, data loss, and availability impact
Adheres strictly to Project.md Section 2, 12, 13 & 23
"""

from typing import List
from backend.models import (
    InfrastructureProfile,
    ArchitectureOption,
    FailureScenario,
    DrStep,
    DrSimulationResult
)


def simulate_disaster_recovery(
    p: InfrastructureProfile,
    scenario: FailureScenario,
    arch: ArchitectureOption
) -> DrSimulationResult:
    steps: List[DrStep] = []
    
    if scenario == FailureScenario.EC2:
        title = "EC2 Primary Compute Instance Failure"
        failed_components = ["EC2 Instance (us-east-1a)", "Target Group Health Probe"]
        
        if arch.autoScaling:
            steps = [
                DrStep(
                    id="s1",
                    title="Failure Detected",
                    service="Amazon Route 53 / ALB Health Checks",
                    durationSec=15,
                    description="ALB health check marks failed EC2 instance as Unhealthy (502 Gateway Timeout threshold reached)."
                ),
                DrStep(
                    id="s2",
                    title="Traffic Shifted to Healthy Nodes",
                    service="Application Load Balancer (ALB)",
                    durationSec=5,
                    description="ALB stops sending connections to failed instance and reroutes active traffic to existing healthy instances."
                ),
                DrStep(
                    id="s3",
                    title="Auto Scaling Group Triggered",
                    service="Amazon EC2 Auto Scaling",
                    durationSec=10,
                    description="Auto Scaling Group detects capacity below minimum desired count and requests replacement instance."
                ),
                DrStep(
                    id="s4",
                    title="Replacement Node Provisioned & Warm",
                    service="Amazon EC2 Graviton3 (Launch Template)",
                    durationSec=60,
                    description="New EC2 instance boots from Launch Template, runs user-data initialization, and registers with Target Group."
                ),
                DrStep(
                    id="s5",
                    title="Full Capacity Restored",
                    service="Application Load Balancer",
                    durationSec=10,
                    description="Health checks pass (200 OK); normal traffic distribution restored across all nodes."
                )
            ]
            rto = 1.6  # minutes
            rpo = 0.0  # Stateless compute
            data_loss = 0.0
            avail_impact = 2.0
            recovered = True
            recovered_by = "Auto Scaling Group + ALB Health Checks"
            narrative = f"Auto Scaling automatically detected instance failure in {steps[0].durationSec}s. ALB redirected live traffic immediately to healthy instances while a fresh EC2 instance was launched and attached within {rto:.1f} minutes."
        else:
            steps = [
                DrStep(
                    id="s1",
                    title="Manual Alarm Triggered",
                    service="Amazon CloudWatch Alarms",
                    durationSec=60,
                    description="CloudWatch Alarm notifies on-call engineer via Amazon SNS."
                ),
                DrStep(
                    id="s2",
                    title="Manual Instance Reboot / Launch",
                    service="AWS Management Console / CLI",
                    durationSec=300,
                    description="Engineer restarts stopped instance or deploys replacement from backup AMI."
                ),
                DrStep(
                    id="s3",
                    title="Recovery Complete",
                    service="Amazon EC2",
                    durationSec=120,
                    description="Instance booted and operational."
                )
            ]
            rto = 8.0
            rpo = 0.0
            data_loss = 0.0
            avail_impact = 25.0
            recovered = True
            recovered_by = "CloudWatch SNS Alert + Manual Provisioning"
            narrative = "Single instance without Auto Scaling required CloudWatch SNS alerting and manual engineer intervention to replace the instance."

    elif scenario == FailureScenario.DATABASE:
        title = "Primary Database Instance Outage"
        failed_components = ["Amazon RDS / Aurora Primary Writer Node (us-east-1a)"]
        
        if arch.multiAz:
            steps = [
                DrStep(
                    id="s1",
                    title="Heartbeat Failure Detected",
                    service="Amazon RDS / Aurora Multi-AZ Monitor",
                    durationSec=20,
                    description="Master database instance heartbeat loss detected by internal AWS storage quorum."
                ),
                DrStep(
                    id="s2",
                    title="Standby Promotion Initiated",
                    service="Amazon RDS / Aurora Failover Engine",
                    durationSec=25,
                    description="Synchronous Standby replica in us-east-1b is elevated to Primary Writer."
                ),
                DrStep(
                    id="s3",
                    title="DNS Endpoint Re-pointed",
                    service="Amazon RDS CNAME Routing",
                    durationSec=15,
                    description="Database endpoint DNS CNAME automatically updated to point to the new Primary node."
                ),
                DrStep(
                    id="s4",
                    title="Application Reconnect & Normal Operation",
                    service="Amazon RDS / EC2 Connection Pool",
                    durationSec=10,
                    description="Application database connection pools re-establish write connections seamlessly."
                )
            ]
            rto = 1.2
            rpo = 0.0  # Synchronous replication
            data_loss = 0.0
            avail_impact = 1.5
            recovered = True
            recovered_by = "RDS / Aurora Multi-AZ Automatic Failover"
            narrative = "Multi-AZ synchronous replication allowed the standby instance in AZ-b to be promoted to Primary in 70s with ZERO data loss (RPO = 0)."
        else:
            steps = [
                DrStep(
                    id="s1",
                    title="Outage Detected via CloudWatch",
                    service="Amazon CloudWatch Alarm",
                    durationSec=60,
                    description="Database connection error rate exceeds threshold."
                ),
                DrStep(
                    id="s2",
                    title="Point-in-Time Snapshot Restore",
                    service="Amazon RDS Automated Backups / S3",
                    durationSec=1200,
                    description="Initiate restore from most recent automated transaction log snapshot."
                ),
                DrStep(
                    id="s3",
                    title="Application Configuration Update",
                    service="AWS Systems Manager Parameter Store",
                    durationSec=180,
                    description="Update database connection string to point to newly restored instance."
                )
            ]
            rto = 24.0
            rpo = 15.0  # Up to 15 min delta since last transaction log upload
            data_loss = 12.5  # MB
            avail_impact = 45.0
            recovered = True
            recovered_by = "Automated Snapshot Restore from S3"
            narrative = "Single-AZ database required Point-in-Time snapshot restoration from S3, resulting in 24-minute downtime and potential 15-minute data lag."

    elif scenario == FailureScenario.AZ:
        title = "Complete Availability Zone Outage (us-east-1a)"
        failed_components = ["VPC Subnet us-east-1a", "EC2 Instances in AZ-a", "Primary DB in AZ-a"]
        
        if arch.multiAz:
            steps = [
                DrStep(
                    id="s1",
                    title="AZ Infrastructure Failure Detected",
                    service="AWS Global Health & CloudWatch",
                    durationSec=25,
                    description="Loss of power/connectivity detected across Availability Zone us-east-1a."
                ),
                DrStep(
                    id="s2",
                    title="Cross-Zone Load Balancer Drain",
                    service="Application Load Balancer (ALB)",
                    durationSec=15,
                    description="ALB isolates AZ-a targets and directs 100% of user traffic to AZ-b and AZ-c."
                ),
                DrStep(
                    id="s3",
                    title="Auto Scaling Multi-AZ Rebalance",
                    service="Amazon EC2 Auto Scaling",
                    durationSec=90,
                    description="Auto Scaling spins up replacement EC2 instances in surviving Availability Zones to maintain desired compute count."
                ),
                DrStep(
                    id="s4",
                    title="Database Failover to Surviving AZ",
                    service="Amazon Aurora / RDS Multi-AZ",
                    durationSec=40,
                    description="Standby DB in AZ-b promoted to active master; replication resumes."
                )
            ]
            rto = 2.8
            rpo = 0.0
            data_loss = 0.0
            avail_impact = 4.0
            recovered = True
            recovered_by = "Multi-AZ VPC Architecture + Cross-Zone ALB"
            narrative = "Multi-AZ VPC design insulated application from complete datacenter outage. ALB and Auto Scaling shifted load to AZ-b without service interruption."
        else:
            steps = [
                DrStep(
                    id="s1",
                    title="Total Site Outage",
                    service="Amazon CloudWatch / Route 53",
                    durationSec=120,
                    description="All instances and databases in single AZ become unreachable."
                ),
                DrStep(
                    id="s2",
                    title="Emergency VPC Provisioning in AZ-b",
                    service="Terraform / CloudFormation",
                    durationSec=900,
                    description="Infrastructure as Code re-applied to provision network and servers in alternative AZ."
                ),
                DrStep(
                    id="s3",
                    title="Database Restore from S3",
                    service="Amazon RDS / S3",
                    durationSec=1500,
                    description="Restore database snapshot into newly created subnet."
                )
            ]
            rto = 42.0
            rpo = 30.0
            data_loss = 45.0
            avail_impact = 95.0
            recovered = True
            recovered_by = "Terraform IaC Disaster Redeployment"
            narrative = "Single-AZ architecture suffered total downtime during AZ outage; required emergency IaC re-provisioning into alternative AZ."

    elif scenario == FailureScenario.APPLICATION:
        title = "Application Container / Process Crash"
        failed_components = ["Application Runtime Process", "HTTP /health endpoint (500 Error)"]
        
        steps = [
            DrStep(
                id="s1",
                title="ALB Health Check Detection",
                service="Application Load Balancer (ALB)",
                durationSec=10,
                description="ALB receives consecutive 500 Internal Server Error responses on /health endpoint."
            ),
            DrStep(
                id="s2",
                title="Target Deregistration & Traffic Drainage",
                service="Application Load Balancer",
                durationSec=5,
                description="Failed instance marked unhealthy; in-flight requests gracefully drained."
            ),
            DrStep(
                id="s3",
                title="Automated Instance Replacement",
                service="Amazon EC2 Auto Scaling / ECS Fargate",
                durationSec=45,
                description="Unhealthy container/node terminated and fresh container task/EC2 instance instantiated."
            ),
            DrStep(
                id="s4",
                title="Health Check Verification & Service Recovery",
                service="Application Load Balancer",
                durationSec=10,
                description="New instance passes health checks; HTTP 200 OK restored."
            )
        ]
        rto = 1.2
        rpo = 0.0
        data_loss = 0.0
        avail_impact = 1.0
        recovered = True
        recovered_by = "ALB Health Checks + ECS / Auto Scaling Self-Healing"
        narrative = "Layer 7 health checks caught application process crash within 10s and self-healed by provisioning a fresh healthy container."

    elif scenario == FailureScenario.REGION:
        title = "Catastrophic Primary Region Disaster (us-east-1 Outage)"
        failed_components = ["Entire Primary Region us-east-1", "VPC us-east-1", "Aurora Master", "ALB us-east-1"]
        
        if arch.multiRegion:
            steps = [
                DrStep(
                    id="s1",
                    title="Route 53 Global Health Check Failure",
                    service="Amazon Route 53 Application Recovery Controller",
                    durationSec=30,
                    description="Route 53 health checks detect regional failure across all primary endpoints."
                ),
                DrStep(
                    id="s2",
                    title="Automated DNS Traffic Routing",
                    service="Amazon Route 53 DNS Failover",
                    durationSec=20,
                    description="DNS weighted records automatically swing 100% of global traffic to DR region (us-west-2)."
                ),
                DrStep(
                    id="s3",
                    title="Aurora Global Database Promotion",
                    service="AWS Step Functions + Amazon Aurora Global Database",
                    durationSec=45,
                    description="Step Functions workflow triggers Aurora secondary cluster promotion in us-west-2 to standalone read-write master."
                ),
                DrStep(
                    id="s4",
                    title="Secondary Compute Scale-Up",
                    service="Amazon EC2 Auto Scaling (us-west-2)",
                    durationSec=60,
                    description="Auto Scaling Group in us-west-2 expands from warm standby to full production capacity."
                ),
                DrStep(
                    id="s5",
                    title="Global Traffic Operational",
                    service="Amazon CloudFront + Route 53",
                    durationSec=15,
                    description="All global requests served seamlessly from us-west-2 with RPO < 1s."
                )
            ]
            rto = 2.8
            rpo = 0.1  # Under 1 second storage replication
            data_loss = 0.2
            avail_impact = 3.0
            recovered = True
            recovered_by = "Route 53 ARC + Aurora Global Database + Step Functions"
            narrative = "Multi-Region Active/Active architecture with Route 53 and Aurora Global Database executed automated Step Functions failover in 2.8 minutes."
        else:
            steps = [
                DrStep(
                    id="s1",
                    title="Regional Disaster Declared",
                    service="AWS Health Dashboard",
                    durationSec=300,
                    description="Primary AWS region us-east-1 experienced catastrophic failure."
                ),
                DrStep(
                    id="s2",
                    title="Cross-Region S3 Replica Access",
                    service="Amazon S3 Cross-Region Replication",
                    durationSec=600,
                    description="Access secondary S3 backup bucket in us-west-2."
                ),
                DrStep(
                    id="s3",
                    title="Terraform Cold Deployment in DR Region",
                    service="Terraform / GitHub Actions",
                    durationSec=1800,
                    description="Deploy full VPC, ALB, EC2, and RDS infrastructure in secondary region."
                ),
                DrStep(
                    id="s4",
                    title="Database Snapshot Restore",
                    service="Amazon RDS Snapshot Restore",
                    durationSec=2400,
                    description="Restore DB snapshot replicated to us-west-2."
                ),
                DrStep(
                    id="s5",
                    title="Manual DNS Cutover",
                    service="Amazon Route 53",
                    durationSec=300,
                    description="Update DNS records to point to new secondary region ALB."
                )
            ]
            rto = 90.0
            rpo = 60.0
            data_loss = 85.0
            avail_impact = 100.0
            recovered = True
            recovered_by = "Cross-Region S3 Backup + Cold Terraform Rebuild"
            narrative = "Single-region architecture required cold provisioning via Terraform in secondary region, taking 90 minutes with 1-hour snapshot data loss."

    meets_rto = rto <= p.rtoMinutes
    meets_rpo = rpo <= p.rpoMinutes

    return DrSimulationResult(
        scenario=scenario,
        title=title,
        steps=steps,
        rtoMinutes=rto,
        rpoMinutes=rpo,
        dataLossMb=data_loss,
        availabilityImpactPct=avail_impact,
        recovered=recovered,
        failedComponents=failed_components,
        recoveredBy=recovered_by,
        meetsRto=meets_rto,
        meetsRpo=meets_rpo,
        narrative=narrative
    )
