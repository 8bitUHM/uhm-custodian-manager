"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  Loader2,
  MapPin,
  Save,
  Users,
} from "lucide-react"
import { toast } from "sonner"

import { BuildingWorkloadCard } from "@/components/buildings/BuildingWorkloadCard"
import { FloorPlanPartitionEditor } from "@/components/buildings/FloorPlanPartitionEditor"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { api } from "@/lib/api"
import type { BuildingMeta } from "@/lib/types"
import {
  revalidateAll,
  useBuilding,
  useCustodians,
  useJ3s,
  usePartitionRotation,
  usePartitionSchedule,
} from "@/lib/hooks"

function localDateISO(d = new Date()) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

export default function BuildingDetailPage() {
  const params = useParams()
  const rawId = params?.id
  const buildingId =
    typeof rawId === "string"
      ? Number.parseInt(rawId, 10)
      : Array.isArray(rawId)
        ? Number.parseInt(rawId[0] ?? "", 10)
        : NaN

  const validId = Number.isFinite(buildingId) ? buildingId : null
  const { data: building, isLoading, error, mutate } = useBuilding(validId)
  const { data: custodianData } = useCustodians({})
  const { data: j3List } = useJ3s()

  const [meta, setMeta] = useState<BuildingMeta | null>(null)
  const [metaError, setMetaError] = useState<string | null>(null)
  const [metaLoading, setMetaLoading] = useState(false)
  const [floorId, setFloorId] = useState<string>("")
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [saving, setSaving] = useState(false)
  const [assignmentJ3Id, setAssignmentJ3Id] = useState<number | null>(null)
  const [showOnlyAssignmentGroup, setShowOnlyAssignmentGroup] = useState(true)
  const [autoAppliedGroupKey, setAutoAppliedGroupKey] = useState("")
  const [scheduleDate, setScheduleDate] = useState(() => localDateISO())
  const [scheduleJ3Id, setScheduleJ3Id] = useState<number | null>(null)
  const [anchorInput, setAnchorInput] = useState("")
  const [savingAnchor, setSavingAnchor] = useState(false)

  const slug = building?.public_slug?.trim() || ""

  useEffect(() => {
    if (!slug) {
      setMeta(null)
      setMetaError(null)
      setMetaLoading(false)
      setFloorId("")
      return
    }
    let cancelled = false
    setMetaLoading(true)
    setMetaError(null)
    api.buildings
      .fetchMeta(slug)
      .then((m) => {
        if (cancelled) return
        setMeta(m)
        setFloorId((prev) => {
          if (prev && m.floors.some((f) => f.id === prev)) return prev
          return m.floors[0]?.id ?? ""
        })
      })
      .catch(() => {
        if (!cancelled) {
          setMeta(null)
          setMetaError("Could not load meta.json for this slug.")
        }
      })
      .finally(() => {
        if (!cancelled) setMetaLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [slug])

  const group4J3s = useMemo(
    () => (j3List ?? []).filter((j) => j.group_number === 4),
    [j3List]
  )

  useEffect(() => {
    if (scheduleJ3Id != null) return
    const first = group4J3s[0]
    if (first) setScheduleJ3Id(first.id)
  }, [group4J3s, scheduleJ3Id])

  useEffect(() => {
    if (assignmentJ3Id != null) return
    if (scheduleJ3Id != null) {
      setAssignmentJ3Id(scheduleJ3Id)
      return
    }
    const first = group4J3s[0]
    if (first) setAssignmentJ3Id(first.id)
  }, [assignmentJ3Id, scheduleJ3Id, group4J3s])

  const { data: rotationState, mutate: mutateRotation } = usePartitionRotation(
    validId,
    scheduleJ3Id
  )

  useEffect(() => {
    if (rotationState?.anchor_date)
      setAnchorInput(rotationState.anchor_date.slice(0, 10))
    else if (rotationState && rotationState.anchor_date == null)
      setAnchorInput("")
  }, [rotationState?.building_id, rotationState?.j3_id, rotationState?.anchor_date])

  const { data: scheduleData, isLoading: scheduleLoading } =
    usePartitionSchedule(validId, scheduleJ3Id, scheduleDate, floorId)

  const assignmentKey =
    building?.custodians
      .map((c) => c.id)
      .slice()
      .sort((a, b) => a - b)
      .join(",") ?? ""

  useEffect(() => {
    if (!building) return
    setSelectedIds(new Set(building.custodians.map((c) => c.id)))
  }, [building?.id, assignmentKey])

  const allCustodians = useMemo(
    () =>
      [...(custodianData?.items ?? [])].sort((a, b) =>
        `${a.last_name} ${a.first_name}`.localeCompare(
          `${b.last_name} ${b.first_name}`
        )
      ),
    [custodianData?.items]
  )

  const assignmentGroupMembers = useMemo(
    () =>
      assignmentJ3Id == null
        ? []
        : allCustodians.filter((c) => c.j3_id === assignmentJ3Id),
    [allCustodians, assignmentJ3Id]
  )

  const custodiansForChecklist = useMemo(() => {
    if (!showOnlyAssignmentGroup || assignmentJ3Id == null) return allCustodians
    return assignmentGroupMembers
  }, [
    allCustodians,
    showOnlyAssignmentGroup,
    assignmentJ3Id,
    assignmentGroupMembers,
  ])

  useEffect(() => {
    if (!building || assignmentJ3Id == null || allCustodians.length === 0) return
    const k = `${building.id}:${assignmentJ3Id}`
    if (autoAppliedGroupKey === k) return
    setSelectedIds(
      new Set(
        allCustodians.filter((c) => c.j3_id === assignmentJ3Id).map((c) => c.id)
      )
    )
    setAutoAppliedGroupKey(k)
  }, [building, assignmentJ3Id, allCustodians, autoAppliedGroupKey])

  const activeFloor = meta?.floors.find((f) => f.id === floorId)

  async function saveRotationAnchor() {
    if (validId == null || scheduleJ3Id == null) return
    const trimmed = anchorInput.trim()
    if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      toast.error("Anchor date must be YYYY-MM-DD.")
      return
    }
    setSavingAnchor(true)
    try {
      await api.buildings.upsertPartitionRotation(validId, {
        j3_id: scheduleJ3Id,
        anchor_date: trimmed,
      })
      toast.success("Rotation anchor saved.")
      await mutateRotation()
    } catch (err) {
      const msg =
        (err as { response?: { data?: { detail?: string } } }).response?.data
          ?.detail || (err as Error).message
      toast.error(`Save failed: ${msg}`)
    } finally {
      setSavingAnchor(false)
    }
  }

  async function saveAssignments() {
    if (validId == null) return
    setSaving(true)
    try {
      await api.buildings.update(validId, {
        custodian_ids: Array.from(selectedIds).sort((a, b) => a - b),
      })
      toast.success("Custodian assignments saved.")
      await mutate()
      revalidateAll()
    } catch (err) {
      const msg =
        (err as { response?: { data?: { detail?: string } } }).response?.data
          ?.detail || (err as Error).message
      toast.error(`Save failed: ${msg}`)
    } finally {
      setSaving(false)
    }
  }

  function toggleId(id: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  if (validId == null) {
    return (
      <Card className="p-8 text-center text-muted-foreground">
        Invalid building id.
        <Button asChild variant="link" className="block mx-auto mt-2">
          <Link href="/buildings">Back to catalog</Link>
        </Button>
      </Card>
    )
  }

  if (error || (!isLoading && !building)) {
    return (
      <Card className="p-8 text-center text-muted-foreground">
        Building not found.
        <Button asChild variant="link" className="block mx-auto mt-2">
          <Link href="/buildings">Back to catalog</Link>
        </Button>
      </Card>
    )
  }

  const overviewSrc =
    slug !== "" ? `/buildings/${slug}/3d/overview.png` : null

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="ghost" size="sm" asChild className="gap-1 -ml-2">
          <Link href="/buildings">
            <ArrowLeft className="h-4 w-4" />
            Buildings
          </Link>
        </Button>
      </div>

      {isLoading && (
        <div className="space-y-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="aspect-video w-full max-w-3xl rounded-lg" />
          <Skeleton className="h-48 w-full" />
        </div>
      )}

      {!isLoading && building && (
        <>
          <div>
            <h2 className="text-2xl font-semibold tracking-tight flex flex-wrap items-center gap-2">
              {building.name}
              {!building.is_active && (
                <Badge variant="secondary">Inactive</Badge>
              )}
            </h2>
            <p className="text-muted-foreground flex items-start gap-2 mt-1">
              <MapPin className="h-4 w-4 shrink-0 mt-0.5" />
              {building.address}
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              {building.building_code && (
                <Badge variant="outline" className="font-mono">
                  {building.building_code}
                </Badge>
              )}
              {slug && (
                <Badge variant="outline" className="font-mono">
                  {slug}
                </Badge>
              )}
              {building.floors != null && (
                <Badge variant="outline">{building.floors} floors</Badge>
              )}
            </div>
            {building.description && (
              <p className="text-sm text-muted-foreground mt-3 max-w-2xl">
                {building.description}
              </p>
            )}
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">3D overview</CardTitle>
                  <CardDescription>
                    Rendered from static assets when a public slug is set.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {overviewSrc ? (
                    <div className="rounded-lg border overflow-hidden bg-white">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={overviewSrc}
                        alt=""
                        className="block h-auto w-full"
                      />
                    </div>
                  ) : (
                    <div className="flex aspect-video items-center justify-center rounded-lg border border-dashed text-muted-foreground">
                      <Building2 className="h-14 w-14 opacity-30" />
                    </div>
                  )}
                </CardContent>
              </Card>

              {validId != null && <BuildingWorkloadCard buildingId={validId} />}

              <Card>
                <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <CardTitle className="text-base">Floor plans</CardTitle>
                    <CardDescription>
                      {metaLoading && (
                        <span className="inline-flex items-center gap-1">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          Loading metadata…
                        </span>
                      )}
                      {!metaLoading && metaError && metaError}
                      {!metaLoading && !metaError && !meta && slug === "" && (
                        <>Set a public slug on this building to load floor assets.</>
                      )}
                      {!metaLoading && meta && (
                        <>Select a floor to preview (from meta.json).</>
                      )}
                    </CardDescription>
                  </div>
                  {meta && meta.floors.length > 0 && (
                    <div className="w-full sm:w-56">
                      <Label className="text-xs sr-only">Floor</Label>
                      <Select value={floorId} onValueChange={setFloorId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Floor" />
                        </SelectTrigger>
                        <SelectContent>
                          {meta.floors.map((f) => (
                            <SelectItem key={f.id} value={f.id}>
                              {f.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </CardHeader>
                <CardContent>
                  {activeFloor ? (
                    activeFloor.image.toLowerCase().endsWith(".svg") ? (
                      validId != null && (
                        <FloorPlanPartitionEditor
                          buildingId={validId}
                          floorId={floorId}
                          floorImageHref={activeFloor.image}
                          viewBox="0 0 1224 792"
                        />
                      )
                    ) : (
                      <div className="rounded-lg border overflow-hidden bg-white">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={activeFloor.image}
                          alt={activeFloor.label}
                          className="block h-auto w-full"
                        />
                      </div>
                    )
                  ) : (
                    <div className="h-48 rounded-lg border border-dashed flex items-center justify-center text-sm text-muted-foreground">
                      No floor selected.
                    </div>
                  )}
                </CardContent>
              </Card>

              {validId != null && meta && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <CalendarDays className="h-4 w-4" />
                      Partition schedule (rotation)
                    </CardTitle>
                    <CardDescription>
                      Assignments use partition order and custodians assigned to
                      this building under the selected JIII. Set an anchor date
                      for day-based rotation.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-wrap gap-4">
                      <div className="space-y-1">
                        <Label className="text-xs">Date</Label>
                        <Input
                          type="date"
                          value={scheduleDate}
                          onChange={(e) => setScheduleDate(e.target.value)}
                          className="w-auto"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">JIII (work group)</Label>
                        <Select
                          value={
                            scheduleJ3Id != null ? String(scheduleJ3Id) : ""
                          }
                          onValueChange={(v) =>
                            setScheduleJ3Id(Number.parseInt(v, 10))
                          }
                        >
                          <SelectTrigger className="w-[min(100%,280px)]">
                            <SelectValue placeholder="Select lead" />
                          </SelectTrigger>
                          <SelectContent>
                            {(j3List ?? []).map((j) => (
                              <SelectItem key={j.id} value={String(j.id)}>
                                {j.name}
                                {j.group_number != null
                                  ? ` (group ${j.group_number})`
                                  : ""}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-end gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs">Rotation anchor</Label>
                        <Input
                          type="date"
                          value={anchorInput}
                          onChange={(e) => setAnchorInput(e.target.value)}
                          className="w-auto"
                        />
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        disabled={
                          savingAnchor ||
                          validId == null ||
                          scheduleJ3Id == null
                        }
                        onClick={() => void saveRotationAnchor()}
                      >
                        {savingAnchor ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : null}
                        Save anchor
                      </Button>
                      {rotationState?.anchor_date == null && (
                        <span className="text-xs text-amber-700 dark:text-amber-400">
                          No anchor saved yet — assignments will be empty until
                          you set one.
                        </span>
                      )}
                    </div>
                    {scheduleData &&
                      scheduleData.partition_count !== scheduleData.pool_count && (
                        <p className="text-sm text-amber-700 dark:text-amber-400">
                          Partition count ({scheduleData.partition_count}) does
                          not match custodian pool (
                          {scheduleData.pool_count}) for this floor/building —
                          review assignments.
                        </p>
                      )}
                    {scheduleLoading ? (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading schedule…
                      </div>
                    ) : scheduleData ? (
                      <div className="rounded-md border overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Partition</TableHead>
                              <TableHead>Assigned custodian</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {scheduleData.assignments.length === 0 ? (
                              <TableRow>
                                <TableCell
                                  colSpan={2}
                                  className="text-muted-foreground"
                                >
                                  No partitions for this floor, or no custodian
                                  pool.
                                </TableCell>
                              </TableRow>
                            ) : (
                              scheduleData.assignments.map((row) => (
                                <TableRow key={row.partition.id}>
                                  <TableCell className="font-medium">
                                    {row.partition.name}
                                  </TableCell>
                                  <TableCell>
                                    {row.custodian
                                      ? `${row.custodian.last_name}, ${row.custodian.first_name}`
                                      : "—"}
                                  </TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    ) : null}
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Assigned custodians
                  </CardTitle>
                  <CardDescription>
                    Janitor IIs responsible for this building (many-to-many).
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {building.custodians.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No custodians assigned yet.
                    </p>
                  ) : (
                    <ul className="flex flex-wrap gap-2">
                      {building.custodians.map((c) => (
                        <li key={c.id}>
                          <Badge variant="secondary">
                            {c.first_name} {c.last_name}
                          </Badge>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Edit assignments</CardTitle>
                  <CardDescription>
                    Auto-load a work group, then fine-tune individual custodians.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap items-end gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Work group (JIII)</Label>
                      <Select
                        value={
                          assignmentJ3Id != null ? String(assignmentJ3Id) : ""
                        }
                        onValueChange={(v) => {
                          setAssignmentJ3Id(Number.parseInt(v, 10))
                          setShowOnlyAssignmentGroup(true)
                        }}
                      >
                        <SelectTrigger className="w-[min(100%,280px)]">
                          <SelectValue placeholder="Select work group" />
                        </SelectTrigger>
                        <SelectContent>
                          {(j3List ?? []).map((j) => (
                            <SelectItem key={j.id} value={String(j.id)}>
                              {j.name}
                              {j.group_number != null ? ` (group ${j.group_number})` : ""}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant={showOnlyAssignmentGroup ? "secondary" : "outline"}
                      onClick={() =>
                        setShowOnlyAssignmentGroup((prev) => !prev)
                      }
                    >
                      {showOnlyAssignmentGroup ? "Showing group only" : "Show group only"}
                    </Button>
                  </div>
                  {assignmentJ3Id != null && (
                    <p className="text-xs text-muted-foreground">
                      Group members found: {assignmentGroupMembers.length}. Changing
                      the selected work group auto-loads that group into the checkboxes.
                    </p>
                  )}
                  <div className="max-h-72 overflow-y-auto rounded-md border p-2 space-y-1">
                    {custodiansForChecklist.length === 0 ? (
                      <p className="text-sm text-muted-foreground p-2">
                        {allCustodians.length === 0
                          ? "Loading custodians…"
                          : "No custodians in this work group."}
                      </p>
                    ) : (
                      custodiansForChecklist.map((c) => (
                        <label
                          key={c.id}
                          className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-muted cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            className="rounded border-input"
                            checked={selectedIds.has(c.id)}
                            onChange={() => toggleId(c.id)}
                          />
                          <span>
                            {c.last_name}, {c.first_name}
                          </span>
                          {!c.is_active && (
                            <span className="text-xs text-muted-foreground">
                              (inactive)
                            </span>
                          )}
                        </label>
                      ))
                    )}
                  </div>
                  <Separator />
                  <Button
                    className="w-full gap-2"
                    onClick={() => void saveAssignments()}
                    disabled={saving}
                  >
                    {saving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    Save assignments
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
