"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { ChevronRight } from "lucide-react"

const TITLES: Record<string, { title: string; description?: string }> = {
  "/": {
    title: "Dashboard",
    description: "Overview of the custodial workforce.",
  },
  "/custodians": {
    title: "Custodians",
    description: "Manage Janitor IIs across all wings.",
  },
  "/j3s": {
    title: "Janitors III",
    description: "Group leads who report to a Janitor Supervisor II.",
  },
  "/supervisors": {
    title: "Supervisors",
    description: "Janitor Supervisor IIs (one per wing).",
  },
  "/buildings": {
    title: "Buildings",
    description: "Campus facilities, floor plans, and assigned custodians.",
  },
}

export function AppHeader() {
  const pathname = usePathname() || "/"
  const meta =
    TITLES[pathname] ??
    TITLES[
      Object.keys(TITLES).find((k) => k !== "/" && pathname.startsWith(k)) ??
        "/"
    ]

  const segments = pathname === "/" ? [] : pathname.split("/").filter(Boolean)

  return (
    <header className="border-b bg-background">
      <div className="flex flex-col gap-1 px-6 py-5">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Link href="/" className="hover:text-foreground">
            Home
          </Link>
          {segments.map((seg, i) => {
            const href = "/" + segments.slice(0, i + 1).join("/")
            return (
              <span key={href} className="flex items-center gap-1">
                <ChevronRight className="h-3 w-3" />
                <Link href={href} className="capitalize hover:text-foreground">
                  {seg.replace(/-/g, " ")}
                </Link>
              </span>
            )
          })}
        </div>
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {meta.title}
            </h1>
            {meta.description && (
              <p className="text-sm text-muted-foreground">
                {meta.description}
              </p>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
