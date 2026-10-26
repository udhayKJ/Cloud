import { DrSimulatorView } from '@/components/dr/dr-simulator-view'

export const metadata = {
  title: 'Disaster Recovery Simulator · CloudShift AI',
  description: 'Simulate EC2, database, AZ, and region failures, validate Step Functions workflows, and measure RTO / RPO.',
}

export default function DrSimulatorPage() {
  return <DrSimulatorView />
}
