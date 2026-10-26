'use client'

import { memo, useMemo } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  Handle,
  Position,
  type Node,
  type Edge,
  type NodeProps,
} from '@xyflow/react'
import {
  Users,
  Globe,
  Scale,
  Server,
  Database,
  HardDrive,
  Activity,
  KeyRound,
  Zap,
  Archive,
  MapPin,
  type LucideIcon,
} from 'lucide-react'
import type { ArchitectureOption, InfrastructureProfile } from '@/lib/types'
import { cn } from '@/lib/utils'

type Kind = 'client' | 'edge' | 'network' | 'compute' | 'database' | 'storage' | 'ops' | 'security' | 'inactive'

interface ArchNodeData extends Record<string, unknown> {
  title: string
  subtitle: string
  icon: LucideIcon
  kind: Kind
}

const KIND_STYLE: Record<Kind, string> = {
  client: 'border-foreground/25 [--node:var(--foreground)]',
  edge: 'border-primary/50 [--node:var(--primary)]',
  network: 'border-chart-5/50 [--node:var(--chart-5)]',
  compute: 'border-primary/50 [--node:var(--primary)]',
  database: 'border-info/50 [--node:var(--info)]',
  storage: 'border-success/50 [--node:var(--success)]',
  ops: 'border-warning/50 [--node:var(--warning)]',
  security: 'border-destructive/50 [--node:var(--destructive)]',
  inactive: 'border-dashed border-border opacity-60 [--node:var(--muted-foreground)]',
}

const ArchNode = memo(function ArchNode({ data }: NodeProps<Node<ArchNodeData>>) {
  const Icon = data.icon
  return (
    <div className={cn('flex w-[212px] items-center gap-3 rounded-xl border bg-card px-3 py-2.5 shadow-lg shadow-black/20', KIND_STYLE[data.kind])}>
      <Handle type="target" position={Position.Left} id="l" className="!size-1 !min-h-0 !min-w-0 !border-0 !bg-transparent" />
      <Handle type="target" position={Position.Top} id="t" className="!size-1 !min-h-0 !min-w-0 !border-0 !bg-transparent" />
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[color-mix(in_oklch,var(--node)_15%,transparent)] text-[var(--node)]">
        <Icon className="size-4" />
      </span>
      <span className="flex min-w-0 flex-col leading-tight">
        <span className="truncate text-[12px] font-semibold text-foreground">{data.title}</span>
        <span className="truncate text-[10px] text-muted-foreground">{data.subtitle}</span>
      </span>
      <Handle type="source" position={Position.Right} id="r" className="!size-1 !min-h-0 !min-w-0 !border-0 !bg-transparent" />
      <Handle type="source" position={Position.Bottom} id="b" className="!size-1 !min-h-0 !min-w-0 !border-0 !bg-transparent" />
    </div>
  )
})

const nodeTypes = { arch: ArchNode }

const COL = [0, 250, 500, 750, 1000]
const ROW = { top: 40, mid: 150, bottom: 260, lower: 380 }

function buildGraph(arch: ArchitectureOption, profile: InfrastructureProfile) {
  const has = (id: string) => arch.components.some((c) => c.id === id)
  const nodes: Node<ArchNodeData>[] = []
  const edges: Edge[] = []
  const n = (id: string, x: number, y: number, data: ArchNodeData) =>
    nodes.push({ id, type: 'arch', position: { x, y }, data, draggable: true })
  const e = (source: string, target: string, opts: Partial<Edge> = {}) =>
    edges.push({ id: `${source}-${target}`, source, target, sourceHandle: 'r', targetHandle: 'l', ...opts })

  const mid = arch.multiAz ? ROW.top + (ROW.mid - ROW.top) / 2 + 20 : ROW.top
  n('client', COL[0], mid, { title: 'Users', subtitle: `${new Intl.NumberFormat('en-US', { notation: 'compact' }).format(profile.monthlyUsers)} monthly`, icon: Users, kind: 'client' })

  const hasCdn = has('cloudfront')
  const hasWaf = has('waf')
  n('edge', COL[1], mid, {
    title: hasCdn ? (hasWaf ? 'CloudFront + WAF' : 'CloudFront') : hasWaf ? 'Route 53 + WAF' : 'Route 53',
    subtitle: hasCdn ? 'Edge cache & DDoS shield' : arch.multiRegion ? 'Failover routing' : 'DNS',
    icon: Globe,
    kind: 'edge',
  })
  e('client', 'edge', { animated: true })

  n('alb', COL[2], mid, { title: 'Load Balancer', subtitle: 'Public subnet · TLS 443', icon: Scale, kind: 'network' })
  e('edge', 'alb', { animated: true })

  n('ec2-a', COL[3], ROW.top, { title: 'EC2 Auto Scaling', subtitle: `AZ-a · ${arch.instanceType}`, icon: Server, kind: 'compute' })
  e('alb', 'ec2-a', { animated: true })
  if (arch.multiAz) {
    n('ec2-b', COL[3], ROW.mid + 40, { title: 'EC2 Auto Scaling', subtitle: `AZ-b · ${arch.instanceCount}–${arch.maxInstances} total`, icon: Server, kind: 'compute' })
    e('alb', 'ec2-b', { animated: true })
  }

  const dbComp = arch.components.find((c) => c.id === 'db')
  if (dbComp) {
    const short = arch.databaseService.replace(/^Amazon /, '').replace(/ Global Database| Global Tables/, '')
    n('db-a', COL[4], ROW.top, { title: short, subtitle: arch.multiAz ? 'Primary · AZ-a' : 'Single-AZ primary', icon: Database, kind: 'database' })
    e('ec2-a', 'db-a', { animated: true })
    if (arch.multiAz) {
      n('db-b', COL[4], ROW.mid + 40, {
        title: arch.databaseService.includes('DynamoDB') ? 'Replicated partitions' : 'Standby replica',
        subtitle: `AZ-b · sync${arch.readReplicas ? ` · ${arch.readReplicas} read replica${arch.readReplicas > 1 ? 's' : ''}` : ''}`,
        icon: Database,
        kind: 'database',
      })
      e('ec2-b', 'db-b')
      e('db-a', 'db-b', { sourceHandle: 'b', targetHandle: 't', animated: true, label: 'replication' })
    } else {
      n('db-b', COL[4], ROW.mid + 40, { title: 'Automated snapshots', subtitle: 'Restore on failure', icon: Archive, kind: 'inactive' })
      e('db-a', 'db-b', { sourceHandle: 'b', targetHandle: 't', style: { strokeDasharray: '4 4' } })
    }
  }

  if (has('cache')) {
    n('cache', COL[2], ROW.lower, { title: 'ElastiCache Redis', subtitle: 'Sessions & hot reads', icon: Zap, kind: 'database' })
    e('ec2-a', 'cache', { sourceHandle: 'b', targetHandle: 't', style: { strokeDasharray: '4 4' } })
  }

  n('s3', COL[3], ROW.lower, { title: 'Amazon S3', subtitle: `${profile.storageTb} TB · lifecycle tiers`, icon: HardDrive, kind: 'storage' })
  e(arch.multiAz ? 'ec2-b' : 'ec2-a', 's3', { sourceHandle: 'b', targetHandle: 't', style: { strokeDasharray: '4 4' } })

  n('ops', COL[4], ROW.lower, {
    title: 'CloudWatch',
    subtitle: has('guardduty') ? '+ GuardDuty · CloudTrail' : has('cloudtrail') ? '+ CloudTrail · Config' : 'Metrics & alarms',
    icon: Activity,
    kind: 'ops',
  })
  e('s3', 'ops', { style: { strokeDasharray: '4 4' } })

  n('iam', COL[1], ROW.lower, {
    title: 'IAM + KMS',
    subtitle: arch.tier === 'low-cost' ? 'AWS-managed keys' : 'Customer-managed keys',
    icon: KeyRound,
    kind: 'security',
  })

  if (arch.multiRegion) {
    n('dr', COL[0], ROW.lower, { title: 'DR region', subtitle: arch.drStrategy, icon: MapPin, kind: 'ops' })
  }

  return { nodes, edges }
}

export function ArchitectureDiagram({ arch, profile }: { arch: ArchitectureOption; profile: InfrastructureProfile }) {
  const { nodes, edges } = useMemo(() => buildGraph(arch, profile), [arch, profile])

  return (
    <ReactFlow
      key={`${arch.tier}-${profile.id}`}
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      fitView
      fitViewOptions={{ padding: 0.15 }}
      minZoom={0.3}
      maxZoom={1.75}
      zoomOnScroll={false}
      preventScrolling={false}
      nodesConnectable={false}
      proOptions={{ hideAttribution: true }}
      aria-label={`Architecture diagram for ${arch.name}`}
    >
      <Background gap={20} size={1} color="var(--border)" />
      <Controls showInteractive={false} />
    </ReactFlow>
  )
}
