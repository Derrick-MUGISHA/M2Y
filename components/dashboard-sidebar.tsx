"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  MessageSquare,
  Users,
  ImageIcon,
  Bell,
  User,
  Shield,
  CreditCard,
  Settings,
  ChevronLeft,
  ChevronRight,
  Home,
  LogOut,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

const sidebarItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: Home,
  },
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
    icon: ImageIcon,
  },
  {
    title: "Notifications",
    href: "/dashboard/notifications",
    icon: Bell,
  },
  {
    title: "Profile",
    href: "/dashboard/profile",
    icon: User,
  },
  {
    title: "Privacy",
    href: "/dashboard/privacy",
    icon: Shield,
  },
  {
    title: "Premium",
    href: "/dashboard/premium",
    icon: CreditCard,
  },
  {
    title: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
  },
]

export function DashboardSidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    await signOut({ redirect: false })
    router.push("/")
  }

  return (
    <aside
      className={cn(
        "h-screen bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800",
        "transition-all duration-300 ease-in-out flex flex-col",
        collapsed ? "w-[70px]" : "w-[240px]",
      )}
    >
      <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-gray-800">
        <div className={cn("flex items-center", collapsed && "justify-center w-full")}>
          <MessageSquare className="h-6 w-6 text-primary" />
          {!collapsed && <span className="ml-2 font-bold text-lg">Me2You</span>}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto py-6">
        <nav className="px-2 space-y-1">
          <TooltipProvider delayDuration={0}>
            {sidebarItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)

              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800",
                        collapsed ? "justify-center" : "",
                      )}
                    >
                      <item.icon className={cn("h-5 w-5", collapsed ? "mx-auto" : "")} />
                      {!collapsed && <span>{item.title}</span>}
                    </Link>
                  </TooltipTrigger>
                  {collapsed && <TooltipContent side="right">{item.title}</TooltipContent>}
                </Tooltip>
              )
            })}
          </TooltipProvider>
        </nav>
      </div>

      <div className="p-4 border-t border-gray-200 dark:border-gray-800">
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                onClick={handleLogout}
                className={cn(
                  "w-full text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800",
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  collapsed ? "justify-center" : "",
                )}
              >
                <LogOut className={cn("h-5 w-5", collapsed ? "mx-auto" : "")} />
                {!collapsed && <span>Log out</span>}
              </Button>
            </TooltipTrigger>
            {collapsed && <TooltipContent side="right">Log out</TooltipContent>}
          </Tooltip>
        </TooltipProvider>
      </div>
    </aside>
  )
}

