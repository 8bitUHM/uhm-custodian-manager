"use client"

import Link from "next/link"
import { useMemo } from "react"
import {
  Users,
  UserCog,
  Shield,
  Activity,
  ArrowRight,
  MapPin,
} from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

import { useCustodians, useJ3s, useStats, useSupervisors } from "@/lib/hooks"
import type { Wing } from "@/lib/types"

function KpiCard({
  title,
  value,
  loading,
  icon: Icon,
  hint,
}: {
  title: string
  value: number | string
  loading?: boolean
  icon: React.ElementType
  hint?: string
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-20" />
        ) : (
          <div className="text-3xl font-bold">{value}</div>
        )}
        {hint && (
          <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
        )}
      </CardContent>
    </Card>
  )
}

const WING_DOTS: Record<Wing, string> = {
  EWA: "bg-cyan-500",
  MAUKA: "bg-emerald-500",
  MAKAI: "bg-violet-500",
}

const WING_BORDERS: Record<Wing, string> = {
  EWA: "border-l-cyan-500",
  MAUKA: "border-l-emerald-500",
  MAKAI: "border-l-violet-500",
}

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useStats()
  const { data: supervisors, isLoading: supsLoading } = useSupervisors()
  const { data: j3s } = useJ3s()
  const { data: custodianList } = useCustodians({})

  const wingBreakdown = useMemo(() => {
    if (!supervisors || !j3s || !custodianList) return null
    const j3ById = new Map(j3s.map((j) => [j.id, j]))
    const counts: Record<Wing, { sii?: string; j3s: number; jiis: number }> = {
      EWA: { j3s: 0, jiis: 0 },
      MAUKA: { j3s: 0, jiis: 0 },
      MAKAI: { j3s: 0, jiis: 0 },
    }
    for (const s of supervisors) {
      if (s.wing && counts[s.wing as Wing]) {
        counts[s.wing as Wing].sii = s.name
        counts[s.wing as Wing].j3s += s.j3_list.length
      }
    }
    for (const c of custodianList.items) {
      const j3 = c.j3_id ? j3ById.get(c.j3_id) : undefined
      if (!j3) continue
      const sup = supervisors.find((s) => s.id === j3.supervisor_id)
      if (sup?.wing && counts[sup.wing as Wing]) {
        counts[sup.wing as Wing].jiis++
      }
    }
    return counts
  }, [supervisors, j3s, custodianList])

  return (
    <div className="grid gap-8">
      {/* KPIs */}
      <section>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            title="Custodians"
            value={stats?.totalCustodians ?? 0}
            loading={statsLoading}
            icon={Users}
            hint={
              stats
                ? `${stats.activeCustodians} currently active`
                : undefined
            }
          />
          <KpiCard
            title="Janitors III"
            value={stats?.totalJ3s ?? 0}
            loading={statsLoading}
            icon={UserCog}
            hint="Group leads"
          />
          <KpiCard
            title="Supervisors"
            value={stats?.totalSupervisors ?? 0}
            loading={statsLoading}
            icon={Shield}
            hint="One per wing"
          />
          <KpiCard
            title="Active rate"
            value={
              stats && stats.totalCustodians > 0
                ? `${Math.round(
                    (stats.activeCustodians / stats.totalCustodians) * 100
                  )}%`
                : "--"
            }
            loading={statsLoading}
            icon={Activity}
            hint={
              stats
                ? `${stats.activeCustodians}/${stats.totalCustodians}`
                : undefined
            }
          />
        </div>
      </section>

      {/* Wings */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Wings</h2>
            <p className="text-sm text-muted-foreground">
              Browse the org chart by wing.
            </p>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(["EWA", "MAUKA", "MAKAI"] as const).map((wing) => {
            const w = wingBreakdown?.[wing]
            return (
              <Card
                key={wing}
                className={`border-l-4 ${WING_BORDERS[wing]} transition-shadow hover:shadow-md`}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className={`h-2 w-2 rounded-full ${WING_DOTS[wing]}`}
                      />
                      <CardTitle className="text-base">{wing}</CardTitle>
                    </div>
                    <Badge variant="outline" className="font-mono text-[10px]">
                      <MapPin className="mr-1 h-3 w-3" />
                      Wing
                    </Badge>
                  </div>
                  <CardDescription>
                    {supsLoading
                      ? "Loading..."
                      : w?.sii
                        ? `Supervised by ${w.sii}`
                        : "No supervisor assigned"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-2">
                  <div className="rounded-md border p-3">
                    <div className="text-xs text-muted-foreground">
                      Janitors III
                    </div>
                    <div className="text-2xl font-semibold">
                      {w?.j3s ?? 0}
                    </div>
                  </div>
                  <div className="rounded-md border p-3">
                    <div className="text-xs text-muted-foreground">
                      Janitor IIs
                    </div>
                    <div className="text-2xl font-semibold">
                      {w?.jiis ?? 0}
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button asChild variant="ghost" size="sm" className="ml-auto">
                    <Link href={`/custodians?wing=${wing}`}>
                      View custodians
                      <ArrowRight className="ml-1 h-3 w-3" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            )
          })}
        </div>
      </section>

      {/* Quick actions */}
      <section>
        <div className="mb-3">
          <h2 className="text-lg font-semibold">Quick actions</h2>
          <p className="text-sm text-muted-foreground">
            Jump straight into common tasks.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="transition-shadow hover:shadow-md">
            <CardHeader className="flex flex-row items-center gap-3 space-y-0 pb-2">
              <Users className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">Custodians</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Add, edit, or reassign Janitor IIs.
              </p>
            </CardContent>
            <CardFooter>
              <Button asChild className="w-full">
                <Link href="/custodians?action=create">Add custodian</Link>
              </Button>
            </CardFooter>
          </Card>

          <Card className="transition-shadow hover:shadow-md">
            <CardHeader className="flex flex-row items-center gap-3 space-y-0 pb-2">
              <UserCog className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">Janitors III</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Manage group leads and reassign supervisors.
              </p>
            </CardContent>
            <CardFooter>
              <Button asChild variant="outline" className="w-full">
                <Link href="/j3s">Open</Link>
              </Button>
            </CardFooter>
          </Card>

          <Card className="transition-shadow hover:shadow-md">
            <CardHeader className="flex flex-row items-center gap-3 space-y-0 pb-2">
              <Shield className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">Supervisors</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Maintain Janitor Supervisor IIs and wings.
              </p>
            </CardContent>
            <CardFooter>
              <Button asChild variant="outline" className="w-full">
                <Link href="/supervisors">Open</Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </section>
    </div>
  )
}
