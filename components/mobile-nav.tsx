"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { MessageSquare, Users, Image, Bell, User, Settings, Menu } from "lucide-react"
import { useNotifications } from "@/hooks/use-notifications"
import { Badge } from "@/components/ui/badge"

interface NavItem {
  title: string
  href: string
  icon: React.ElementType
  badge?: number
}

export function MobileNav() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const { unreadCount } = useNotifications()

  const navItems: NavItem[] = [
    {
      title: "Messages",
      href: "/dashboard/messages",
      icon: MessageSquare,
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
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle Menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="pr-0">
        <SheetHeader>
          <SheetTitle>Me2You</SheetTitle>
        </SheetHeader>
        <nav className="grid gap-2 py-6">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md",
                pathname.startsWith(item.href) ? "bg-muted" : "hover:bg-muted",
              )}
            >
              <item.icon className="h-4 w-4" />
              <span>{item.title}</span>
              {item.badge ? (
                <Badge variant="destructive" className="ml-auto">
                  {item.badge > 99 ? "99+" : item.badge}
                </Badge>
              ) : null}
            </Link>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  )
}

