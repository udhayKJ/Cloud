import { DashboardView } from '@/components/dashboard/dashboard-view'

export const metadata = {
  title: 'Dashboard · CloudShift AI',
  description: 'Overview of the active migration project, pipeline progress and recommendation.',
}

export default function DashboardPage() {
  return <DashboardView />
}
