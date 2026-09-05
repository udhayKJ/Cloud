import {
  LayoutDashboard,
  PlusCircle,
  Server,
  Route,
  Network,
  Coins,
  Siren,
  ShieldCheck,
  Gauge,
  FileText,
  type LucideIcon,
} from 'lucide-react'

export interface NavItem {
  href: string
  label: string
  icon: LucideIcon
  step?: number
}

export const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/projects/new', label: 'New Project', icon: PlusCircle },
  { href: '/infrastructure', label: 'Infrastructure Profile', icon: Server, step: 1 },
  { href: '/migration', label: 'Migration Analysis', icon: Route, step: 2 },
  { href: '/architecture', label: 'Architecture', icon: Network, step: 3 },
  { href: '/cost', label: 'Cost Analysis', icon: Coins, step: 4 },
  { href: '/dr-simulator', label: 'DR Simulator', icon: Siren, step: 5 },
  { href: '/security', label: 'Security Analysis', icon: ShieldCheck, step: 6 },
  { href: '/well-architected', label: 'Well-Architected', icon: Gauge, step: 7 },
  { href: '/reports', label: 'Reports', icon: FileText, step: 8 },
]
