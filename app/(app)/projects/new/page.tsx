import { NewProjectWizard } from '@/components/projects/new-project-wizard'

export const metadata = {
  title: 'New Project · CloudShift AI',
  description: 'Create a new migration project from a template or from scratch.',
}

export default function NewProjectPage() {
  return <NewProjectWizard />
}
