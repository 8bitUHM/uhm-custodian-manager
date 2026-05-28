"use client"

import { useRef, useState } from "react"
import { Loader2, Upload } from "lucide-react"
import { toast } from "sonner"

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
import type { BuildingWorkload } from "@/lib/types"
import useSWR from "swr"

function formatMinutes(m: number) {
  const h = Math.floor(m / 60)
  const min = Math.round(m % 60)
  if (h === 0) return `${min} min`
  return `${h}h ${min}m`
}

export function BuildingWorkloadCard({ buildingId }: { buildingId: number }) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [importing, setImporting] = useState(false)
  const { data: workload, isLoading, mutate } = useSWR<BuildingWorkload>(
    ["building-workload", buildingId],
    () => api.buildings.getWorkload(buildingId),
    { revalidateOnFocus: false }
  )

  async function handleImport(file: File) {
    setImporting(true)
    try {
      const result = await api.buildings.importSpaces(buildingId, file)
      toast.success(
        `Imported ${result.imported_count} spaces` +
          (result.skipped_rows
            ? ` (${result.skipped_rows} rows skipped)`
            : "")
      )
      if (result.skipped_property_codes.length > 0) {
        toast.message(
          `Skipped property codes: ${result.skipped_property_codes.join(", ")}`
        )
      }
      await mutate()
    } catch (err) {
      const msg =
        (err as { response?: { data?: { detail?: string } } }).response?.data
          ?.detail || (err as Error).message
      toast.error(`Import failed: ${msg}`)
    } finally {
      setImporting(false)
      if (fileRef.current) fileRef.current.value = ""
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle className="text-base">Cleaning workload</CardTitle>
          <CardDescription>
            AiM space inventory and recommended custodian headcount for an
            8-hour workday. Tune times under Cleaning standards.
          </CardDescription>
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) void handleImport(f)
            }}
          />
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={importing}
            onClick={() => fileRef.current?.click()}
          >
            {importing ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1" />
            ) : (
              <Upload className="h-4 w-4 mr-1" />
            )}
            Import AiM data
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading workload…
          </div>
        )}
        {!isLoading && workload && workload.imported_space_count === 0 && (
          <p className="text-sm text-muted-foreground">
            No spaces imported yet. Upload an AiM Excel extract for this
            building&apos;s property code.
          </p>
        )}
        {!isLoading && workload && workload.imported_space_count > 0 && (
          <>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Total cleaning time</p>
                <p className="text-2xl font-semibold">
                  {formatMinutes(workload.total_minutes)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {workload.imported_space_count} spaces
                </p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Recommended custodians</p>
                <p className="text-2xl font-semibold">
                  {workload.recommended_headcount}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {workload.workday_minutes}-min workday
                </p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Last import</p>
                <p className="text-sm font-medium mt-1">
                  {workload.last_import_at
                    ? new Date(workload.last_import_at).toLocaleString()
                    : "—"}
                </p>
              </div>
            </div>
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Space type</TableHead>
                    <TableHead className="text-right">Count</TableHead>
                    <TableHead className="text-right">Minutes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {workload.by_space_type.map((row) => (
                    <TableRow key={row.slug + String(row.space_type_id)}>
                      <TableCell>{row.label}</TableCell>
                      <TableCell className="text-right">{row.count}</TableCell>
                      <TableCell className="text-right">
                        {Math.round(row.minutes)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {workload.unmapped_samples.length > 0 && (
              <details className="text-sm">
                <summary className="cursor-pointer font-medium">
                  Unmapped / sqft fallback samples ({workload.unmapped_samples.length})
                </summary>
                <div className="mt-2 rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Location</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Sqft</TableHead>
                        <TableHead className="text-right">Min</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {workload.unmapped_samples.map((u) => (
                        <TableRow key={u.location_code}>
                          <TableCell className="font-mono text-xs">
                            {u.location_code}
                          </TableCell>
                          <TableCell>{u.description ?? "—"}</TableCell>
                          <TableCell className="text-right">
                            {u.effective_sqft != null
                              ? Math.round(u.effective_sqft)
                              : "—"}
                          </TableCell>
                          <TableCell className="text-right">
                            {Math.round(u.minutes)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </details>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
