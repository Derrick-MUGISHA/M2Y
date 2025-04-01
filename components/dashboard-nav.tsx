"use client"

import type React from "react"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { MessageSquare, Users, Image, Bell, User, Settings, UsersRound } from "lucide-react"
import { useNotifications } from "@/hooks/use-notifications"
import { Badge } from "@/components/ui/badge"

interface NavItem {
  title: string
  href: string
  icon: React.ElementType
  badge?: number
}

export function DashboardNav() {
  const pathname = usePathname()
  const { unreadCount } = useNotifications()

  const navItems: NavItem[] = [
    {
      title: "Messages",
      href: "/dashboard/messages",
      icon: MessageSquare,
    },
    {
      title: "Groups",
      href: "/dashboard/groups",
      icon: UsersRound,
    },
    {
      title: "Connections",
      href: "/dashboard/connections",
      icon: Users,
    },
    {
      title: "Stories",
      href: "/dashboard/stories",
      icon: Image,
    },
    {
      title: "Notifications",
      href: "/dashboard/notifications",
      icon: Bell,
      badge: unreadCount,
    },
    {
      title: "Profile",
      href: "/dashboard/profile",
      icon: User,
    },
    {
      title: "Settings",
      href: "/dashboard/settings",
      icon: Settings,
    },
  ]

  return (
    <nav className="grid items-start gap-2 p-4">
      {navItems.map((item) => (
        <Link key={item.href} href={item.href}>
          <Button
            variant={pathname.startsWith(item.href) ? "secondary" : "ghost"}
            className={cn("w-full justify-start gap-2", {
              "bg-muted": pathname.startsWith(item.href),
            })}
          >
            <item.icon className="h-4 w-4" />
            <span>{item.title}</span>
            {item.badge ? (
              <Badge variant="destructive" className="ml-auto">
                {item.badge > 99 ? "99+" : item.badge}
              </Badge>
            ) : null}
          </Button>
        </Link>
      ))}
    </nav>
  )
}

