import {
  Bot,
  Command,
  HelpCircle,
  LayoutDashboard,
  ListTodo,
  Settings,
} from 'lucide-react'
import { type SidebarData } from '../types'

export const sidebarData: SidebarData = {
  user: {
    name: 'CFO User',
    email: 'cfo@capiflow.com',
    avatar: '/avatars/shadcn.jpg',
  },
  teams: [
    {
      name: 'CapiFlow',
      logo: Command,
      plan: 'Enterprise',
    },
  ],
  navGroups: [
    {
      title: 'Platform',
      items: [
        {
          title: 'Dashboard',
          url: '/dashboard',
          icon: LayoutDashboard,
        },
        {
          title: 'CapiFlow Agent',
          url: '/dashboard',
          icon: Bot,
        },
        {
          title: 'Latest Generations',
          url: '/tasks',
          icon: ListTodo,
        },
      ],
    },
    {
      title: 'Configuration',
      items: [
        {
          title: 'Settings',
          url: '/settings',
          icon: Settings,
        },
        {
          title: 'Help Center',
          url: '/help-center',
          icon: HelpCircle,
        },
      ],
    },
  ],
}
