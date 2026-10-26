import { CostView } from '@/components/cost/cost-view'

export const metadata = {
  title: 'Cost Analysis · CloudShift AI',
  description: 'Detailed AWS infrastructure cost breakdown, tier comparisons, and TCO optimization.',
}

export default function CostPage() {
  return <CostView />
}
