import { WellArchitectedView } from '@/components/well-architected/well-architected-view'

export const metadata = {
  title: 'Well-Architected Framework · CloudShift AI',
  description: 'AWS 5-pillar Well-Architected Framework scoring: Security, Reliability, Performance, Cost, Operations.',
}

export default function WellArchitectedPage() {
  return <WellArchitectedView />
}
