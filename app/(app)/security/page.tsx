import { SecurityView } from '@/components/security/security-view'

export const metadata = {
  title: 'Security Analysis · CloudShift AI',
  description: 'AWS security controls, IAM least-privilege, KMS encryption, WAF, and CloudTrail auditing.',
}

export default function SecurityPage() {
  return <SecurityView />
}
