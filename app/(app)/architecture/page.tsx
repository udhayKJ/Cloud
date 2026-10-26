import { ArchitectureView } from '@/components/architecture/architecture-view'

export const metadata = {
  title: 'Architecture Visualisation · CloudShift AI',
  description: 'Interactive AWS topology diagram, VPC, subnets, EC2, RDS, and S3 architecture components.',
}

export default function ArchitecturePage() {
  return <ArchitectureView />
}
