"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Users,
  UserCog,
  Shield,
  Building2,
  ClipboardList,
  BarChart3,
  Sparkles,
  Timer,
  Calculator,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface NavItem {
  href: string
  label: string
  icon: React.ElementType
  group: "Org" | "Operations"
  disabled?: boolean
}

const NAV: NavItem[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, group: "Org" },
  { href: "/custodians", label: "Custodians", icon: Users, group: "Org" },
  { href: "/j3s", label: "Janitors III", icon: UserCog, group: "Org" },
  { href: "/supervisors", label: "Supervisors", icon: Shield, group: "Org" },
  { href: "/buildings", label: "Buildings", icon: Building2, group: "Operations" },
  { href: "/workload", label: "Workload", icon: Calculator, group: "Operations" },
  {
    href: "/settings/cleaning-standards",
    label: "Cleaning standards",
    icon: Timer,
    group: "Operations",
  },
  { href: "/tasks", label: "Tasks", icon: ClipboardList, group: "Operations", disabled: true },
  { href: "/reports", label: "Reports", icon: BarChart3, group: "Operations", disabled: true },
]

export function AppSidebar() {
  const pathname = usePathname() || "/"

  const groups: Array<NavItem["group"]> = ["Org", "Operations"]

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col border-r bg-card">
      <div className="flex h-16 items-center gap-2 border-b px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <Sparkles className="h-4 w-4" />
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-semibold">UHM Custodial</span>
          <span className="text-xs text-muted-foreground">Manager</span>
        </div>
      </div>
      <nav className="flex-1 space-y-6 p-4">
        {groups.map((group) => (
          <div key={group}>
            <div className="mb-2 px-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {group}
            </div>
            <ul className="space-y-1">
              {NAV.filter((item) => item.group === group).map((item) => {
                const active =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(item.href)
                const Icon = item.icon
                const inner = (
                  <span
                    className={cn(
                      "flex items-center gap-3 rounded-md px-2 py-2 text-sm transition-colors",
                      active
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground",
                      item.disabled && "cursor-not-allowed opacity-50"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                    {item.disabled && (
                      <span className="ml-auto text-[10px] uppercase text-muted-foreground">
                        soon
                      </span>
                    )}
                  </span>
                )
                return (
                  <li key={item.href}>
                    {item.disabled ? (
                      inner
                    ) : (
                      <Link href={item.href}>{inner}</Link>
                    )}
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>
      <div className="border-t p-4 text-xs text-muted-foreground">
        University of Hawai&apos;i at M&#257;noa
        <br />
        Building &amp; Grounds Management
      </div>
    </aside>
  )
}
