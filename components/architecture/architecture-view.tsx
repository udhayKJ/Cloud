'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  type Node,
  type Edge,
  Position
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { motion } from 'motion/react'
import {
  Network,
  Server,
  Database,
  HardDrive,
  ShieldCheck,
  Coins,
  ArrowRight,
  Sparkles,
  Layers,
  Cpu,
  RefreshCw,
  Zap,
  Globe
} from 'lucide-react'
import { useAnalysis, useActiveProject } from '@/lib/store'
import { PageHeader, Section, Pill, MetricCard, Stagger } from '@/components/shared/primitives'
import { formatUsd, formatMinutes } from '@/lib/engine'
import { cn } from '@/lib/utils'
import type { ArchitectureOption, Tier } from '@/lib/types'

export function ArchitectureView() {
  const analysis = useAnalysis()
  const profile = useActiveProject()
  const { architectures, recommendedIndex } = analysis
  const [selectedTier, setSelectedTier] = useState<Tier>(architectures[recommendedIndex]?.tier || 'balanced')

  const currentArch: ArchitectureOption = useMemo(() => {
    return architectures.find((a) => a.tier === selectedTier) || architectures[recommendedIndex]
  }, [architectures, selectedTier, recommendedIndex])

  // React Flow Diagram Nodes & Edges Generation
  const { nodes, edges } = useMemo(() => {
    const isMultiAz = currentArch.multiAz
    const isEnt = currentArch.tier === 'enterprise'

    const generatedNodes: Node[] = [
      {
        id: 'client',
        position: { x: 50, y: 180 },
        data: { label: '🌐 Internet Traffic\nUsers & Mobile Clients' },
        style: { background: '#1e293b', color: '#f8fafc', border: '1px solid #475569', borderRadius: '8px', padding: '10px', fontSize: '11px', textAlign: 'center', width: 140 }
      },
      {
        id: 'cf',
        position: { x: 230, y: 180 },
        data: { label: '🛡️ CloudFront + WAF\nEdge Cache & DDoS Shield' },
        style: { background: '#0f172a', color: '#38bdf8', border: '1px solid #0284c7', borderRadius: '8px', padding: '10px', fontSize: '11px', textAlign: 'center', width: 160 }
      },
      {
        id: 'alb',
        position: { x: 430, y: 180 },
        data: { label: '⚖️ Application Load Balancer\nPublic Subnet (Port 443)' },
        style: { background: '#0f172a', color: '#a855f7', border: '1px solid #9333ea', borderRadius: '8px', padding: '10px', fontSize: '11px', textAlign: 'center', width: 170 }
      },
      {
        id: 'ec2-az1',
        position: { x: 650, y: 110 },
        data: { label: `⚡ EC2 Auto Scaling (AZ-1)\n${currentArch.instanceCount}x ${currentArch.instanceType}` },
        style: { background: '#1e1b4b', color: '#818cf8', border: '1px solid #6366f1', borderRadius: '8px', padding: '10px', fontSize: '11px', textAlign: 'center', width: 170 }
      },
      {
        id: 'ec2-az2',
        position: { x: 650, y: 250 },
        data: { label: isMultiAz ? `⚡ EC2 Auto Scaling (AZ-2)\nStandby / Active Replica` : `⚡ EC2 Standby (Disabled)\nSingle-AZ Configuration` },
        style: { background: isMultiAz ? '#1e1b4b' : '#18181b', color: isMultiAz ? '#818cf8' : '#71717a', border: isMultiAz ? '1px solid #6366f1' : '1px dashed #3f3f46', borderRadius: '8px', padding: '10px', fontSize: '11px', textAlign: 'center', width: 170 }
      },
      {
        id: 'rds-primary',
        position: { x: 870, y: 110 },
        data: { label: `🗄️ ${currentArch.databaseService.split(' ')[0]} (AZ-1 Primary)\nWriter Node + EBS gp3` },
        style: { background: '#064e3b', color: '#34d399', border: '1px solid #10b981', borderRadius: '8px', padding: '10px', fontSize: '11px', textAlign: 'center', width: 180 }
      },
      {
        id: 'rds-standby',
        position: { x: 870, y: 250 },
        data: { label: isMultiAz ? `🗄️ Multi-AZ Standby (AZ-2)\nSync Replication (RPO=0)` : `🗄️ Nightly Snapshots\nS3 Bucket Archive` },
        style: { background: isMultiAz ? '#064e3b' : '#18181b', color: isMultiAz ? '#34d399' : '#71717a', border: isMultiAz ? '1px solid #10b981' : '1px dashed #3f3f46', borderRadius: '8px', padding: '10px', fontSize: '11px', textAlign: 'center', width: 180 }
      },
      {
        id: 's3',
        position: { x: 650, y: 390 },
        data: { label: `📦 Amazon S3 Storage\n${profile.storageTb} TB + Glacier Lifecycle` },
        style: { background: '#083344', color: '#22d3ee', border: '1px solid #06b6d4', borderRadius: '8px', padding: '10px', fontSize: '11px', textAlign: 'center', width: 170 }
      },
      {
        id: 'ops',
        position: { x: 870, y: 390 },
        data: { label: '📊 CloudWatch + IAM\nAlarms & Least-Privilege' },
        style: { background: '#1c1917', color: '#fb923c', border: '1px solid #ea580c', borderRadius: '8px', padding: '10px', fontSize: '11px', textAlign: 'center', width: 180 }
      }
    ]

    const generatedEdges: Edge[] = [
      { id: 'e1', source: 'client', target: 'cf', animated: true, style: { stroke: '#38bdf8' } },
      { id: 'e2', source: 'cf', target: 'alb', animated: true, style: { stroke: '#a855f7' } },
      { id: 'e3', source: 'alb', target: 'ec2-az1', animated: true, style: { stroke: '#818cf8' } },
      { id: 'e4', source: 'ec2-az1', target: 'rds-primary', animated: true, style: { stroke: '#34d399' } },
      { id: 'e5', source: 'ec2-az1', target: 's3', style: { stroke: '#22d3ee', strokeDasharray: '4 4' } },
      { id: 'e6', source: 'rds-primary', target: 'ops', style: { stroke: '#fb923c', strokeDasharray: '4 4' } },
    ]

    if (isMultiAz) {
      generatedEdges.push(
        { id: 'e-az2', source: 'alb', target: 'ec2-az2', animated: true, style: { stroke: '#818cf8' } },
        { id: 'e-db-sync', source: 'rds-primary', target: 'rds-standby', animated: true, style: { stroke: '#10b981' } },
        { id: 'e-ec2-az2-db', source: 'ec2-az2', target: 'rds-standby', style: { stroke: '#34d399' } }
      )
    }

    return { nodes: generatedNodes, edges: generatedEdges }
  }, [currentArch, profile])

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Step 03 · Architecture Visualisation"
        title="AWS Architecture Topology"
        description="Generated cloud architecture containing VPC, Subnets, EC2 Auto Scaling, RDS/Aurora Multi-AZ, DynamoDB, S3, and CloudFront."
        actions={
          <Link
            href="/cost"
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.02]"
          >
            Cost Analysis
            <ArrowRight className="size-4" />
          </Link>
        }
      />

      {/* Tier Switcher Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {architectures.map((a, idx) => {
          const isSelected = a.tier === selectedTier
          const isRec = idx === recommendedIndex
          return (
            <button
              key={a.tier}
              type="button"
              onClick={() => setSelectedTier(a.tier as Tier)}
              className={cn(
                'flex flex-col gap-3 rounded-xl border p-4 text-left transition-all',
                isSelected
                  ? 'border-primary bg-primary/5 ring-2 ring-primary/40 shadow-lg shadow-primary/10'
                  : 'border-border bg-card hover:border-primary/40 hover:bg-accent/40'
              )}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-semibold uppercase tracking-wider text-muted-foreground">
                  {a.tier}
                </span>
                {isRec && <Pill tone="success">RECOMMENDED</Pill>}
              </div>
              <div className="flex flex-col">
                <span className="text-base font-semibold text-foreground">{a.name}</span>
                <span className="text-xs text-muted-foreground line-clamp-2 mt-1">{a.tagline}</span>
              </div>
              <div className="mt-auto flex items-baseline justify-between pt-2 border-t border-border">
                <span className="text-lg font-bold font-mono text-primary">{formatUsd(a.cost.total)}</span>
                <span className="text-xs text-muted-foreground font-mono">{a.availabilityPct}% SLA</span>
              </div>
            </button>
          )
        })}
      </div>

      {/* React Flow Interactive Canvas */}
      <Section
        title={`Visual Architecture Diagram — ${currentArch.name}`}
        description="Interactive topology map. Zoom, pan, and inspect nodes to view traffic flow."
        bodyClassName="p-0 overflow-hidden rounded-b-xl"
      >
        <div className="h-[460px] w-full bg-slate-950/80">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            fitView
            proOptions={{ hideAttribution: true }}
          >
            <Background color="#334155" gap={18} size={1} />
            <Controls className="bg-slate-900 border-slate-700 text-slate-200 fill-slate-200" />
            <MiniMap nodeColor="#475569" maskColor="rgba(15, 23, 42, 0.7)" className="bg-slate-950 border border-slate-800" />
          </ReactFlow>
        </div>
      </Section>

      {/* Architecture Specifications */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Section title="Compute & Resiliency Specs" description="Deployment tier parameters.">
          <dl className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <dt className="text-xs text-muted-foreground uppercase font-mono">DR Strategy</dt>
              <dd className="font-semibold text-sm">{currentArch.drStrategy}</dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="text-xs text-muted-foreground uppercase font-mono">Multi-AZ Mode</dt>
              <dd className="font-semibold text-sm">{currentArch.multiAz ? 'Active / Standby Multi-AZ' : 'Single-AZ'}</dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="text-xs text-muted-foreground uppercase font-mono">EC2 Fleet</dt>
              <dd className="font-semibold text-sm">{currentArch.instanceCount} - {currentArch.maxInstances} instances</dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="text-xs text-muted-foreground uppercase font-mono">Instance Type</dt>
              <dd className="font-semibold text-sm">{currentArch.instanceType}</dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="text-xs text-muted-foreground uppercase font-mono">RTO Target / Achieved</dt>
              <dd className="font-semibold text-sm text-primary">{formatMinutes(profile.rtoMinutes)} / {formatMinutes(currentArch.rtoMinutes)}</dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="text-xs text-muted-foreground uppercase font-mono">RPO Target / Achieved</dt>
              <dd className="font-semibold text-sm text-success">{formatMinutes(profile.rpoMinutes)} / {formatMinutes(currentArch.rpoMinutes)}</dd>
            </div>
          </dl>
        </Section>

        {/* Component Bill of Materials */}
        <Section title="Architecture Component Breakdown" description="Line item specifications." className="lg:col-span-2">
          <div className="flex flex-col divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
            {currentArch.components.map((comp) => (
              <div key={comp.id} className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">{comp.service}</span>
                    <Pill tone="info">{comp.category}</Pill>
                  </div>
                  <p className="text-xs text-muted-foreground">{comp.detail}</p>
                </div>
                <div className="font-mono text-sm font-bold text-primary self-start sm:self-center shrink-0">
                  {comp.monthlyCost > 0 ? formatUsd(comp.monthlyCost) : 'Included'}
                </div>
              </div>
            ))}
          </div>
        </Section>
      </div>
    </div>
  )
}
