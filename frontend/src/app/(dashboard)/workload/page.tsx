"use client"

import Link from "next/link"
import { Loader2 } from "lucide-react"
import useSWR from "swr"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { api } from "@/lib/api"

function formatMinutes(m: number) {
  const h = Math.floor(m / 60)
  const min = Math.round(m % 60)
  if (h === 0) return `${min} min`
  return `${h}h ${min}m`
}

export default function WorkloadSummaryPage() {
  const { data: rows, isLoading } = useSWR(
    ["workload-summary"],
    () => api.workload.summary(),
    { revalidateOnFocus: false }
  )

  const withData = (rows ?? []).filter((r) => r.imported_space_count > 0)
  const totalHeadcount = withData.reduce(
    (s, r) => s + r.recommended_headcount,
    0
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">
            Workload summary
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Recommended custodian headcount per building from imported AiM
            spaces and cleaning standards.
          </p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/settings/cleaning-standards">Cleaning standards</Link>
        </Button>
      </div>

      {withData.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Portfolio total</CardTitle>
            <CardDescription>
              Sum of recommended headcount across buildings with imported data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{totalHeadcount}</p>
            <p className="text-sm text-muted-foreground">custodians (8-hr day)</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="pt-6">
          {isLoading && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading…
            </div>
          )}
          {!isLoading && (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Building</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead className="text-right">Spaces</TableHead>
                    <TableHead className="text-right">Total time</TableHead>
                    <TableHead className="text-right">Custodians</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(rows ?? []).map((r) => (
                    <TableRow key={r.building_id}>
                      <TableCell className="font-medium">
                        {r.building_name}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {r.building_code ?? "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        {r.imported_space_count}
                      </TableCell>
                      <TableCell className="text-right">
                        {r.imported_space_count > 0
                          ? formatMinutes(r.total_minutes)
                          : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        {r.imported_space_count > 0
                          ? r.recommended_headcount
                          : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/buildings/${r.building_id}`}>
                            Details
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
