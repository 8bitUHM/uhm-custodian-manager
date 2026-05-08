"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  ChevronDown,
  ChevronUp,
  Loader2,
  MapPinned,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { api } from "@/lib/api"
import { useBuildingPartitions } from "@/lib/hooks"
import type { BuildingPartition, GeoJSONPolygon } from "@/lib/types"
import { cn } from "@/lib/utils"

const DEFAULT_PALETTE = [
  "rgba(59, 130, 246, 0.38)",
  "rgba(234, 179, 8, 0.38)",
  "rgba(34, 197, 94, 0.38)",
  "rgba(168, 85, 247, 0.38)",
  "rgba(239, 68, 68, 0.38)",
  "rgba(20, 184, 166, 0.38)",
]

function parseViewBox(vb: string) {
  const p = vb.trim().split(/[\s,]+/).map(Number)
  return { x: p[0] ?? 0, y: p[1] ?? 0, w: p[2] ?? 1224, h: p[3] ?? 792 }
}

function clientToSvg(svg: SVGSVGElement, clientX: number, clientY: number) {
  const pt = svg.createSVGPoint()
  pt.x = clientX
  pt.y = clientY
  const ctm = svg.getScreenCTM()
  if (!ctm) return { x: 0, y: 0 }
  const out = pt.matrixTransform(ctm.inverse())
  return { x: out.x, y: out.y }
}

function ringToPathD(ring: number[][]): string {
  if (ring.length < 2) return ""
  const [x0, y0] = ring[0]
  let d = `M ${x0} ${y0}`
  for (let i = 1; i < ring.length; i++) {
    d += ` L ${ring[i][0]} ${ring[i][1]}`
  }
  return `${d} Z`
}

function exteriorRing(poly: GeoJSONPolygon): number[][] {
  const ring = poly.coordinates[0] ?? []
  return ring.map((p) => [...p])
}

function cloneRing(ring: number[][]) {
  return ring.map((p) => [...p] as number[])
}

function setRingVertex(ring: number[][], i: number, x: number, y: number) {
  const next = cloneRing(ring)
  next[i] = [x, y]
  if (i === 0) next[next.length - 1] = [x, y]
  else if (i === next.length - 1) next[0] = [x, y]
  return next
}

export type FloorPlanPartitionEditorProps = {
  buildingId: number
  floorId: string
  floorImageHref: string
  viewBox?: string
}

export function FloorPlanPartitionEditor({
  buildingId,
  floorId,
  floorImageHref,
  viewBox = "0 0 1224 792",
}: FloorPlanPartitionEditorProps) {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const { data: partitions, mutate, isLoading } = useBuildingPartitions(
    buildingId,
    floorId
  )

  const vb = useMemo(() => parseViewBox(viewBox), [viewBox])

  const [mode, setMode] = useState<"view" | "edit">("view")
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [drawing, setDrawing] = useState(false)
  const [draftRing, setDraftRing] = useState<number[][]>([])
  const [newName, setNewName] = useState("")
  const [drag, setDrag] = useState<{
    partitionId: number
    vertexIndex: number
    previewRing: number[][]
  } | null>(null)

  const paletteColor = useCallback(
    (i: number, fallback?: string | null) =>
      fallback?.trim() ? fallback.trim() : DEFAULT_PALETTE[i % DEFAULT_PALETTE.length],
    []
  )

  const sortedPartitions = useMemo(
    () =>
      [...(partitions ?? [])].sort(
        (a, b) => a.sort_order - b.sort_order || a.id - b.id
      ),
    [partitions]
  )

  const finishDraft = async () => {
    if (draftRing.length < 3) {
      toast.error("Need at least three vertices.")
      return
    }
    const closed: number[][] = [...draftRing, draftRing[0]]
    const geometry: GeoJSONPolygon = {
      type: "Polygon",
      coordinates: [closed],
    }
    const maxOrder =
      partitions?.reduce((m, p) => Math.max(m, p.sort_order), -1) ?? -1
    const name = newName.trim() || `Zone ${(partitions?.length ?? 0) + 1}`
    try {
      await api.buildings.createPartition(buildingId, {
        floor_id: floorId,
        name,
        sort_order: maxOrder + 1,
        geometry,
      })
      toast.success("Partition saved.")
      setDraftRing([])
      setDrawing(false)
      setNewName("")
      await mutate()
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { detail?: unknown } } }).response?.data
          ?.detail ?? (e as Error).message
      toast.error(`Save failed: ${String(msg)}`)
    }
  }

  const onSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (mode !== "edit" || !drawing || !svgRef.current) return
    if ((e.target as HTMLElement).closest("[data-vertex]")) return
    const { x, y } = clientToSvg(svgRef.current, e.clientX, e.clientY)
    setDraftRing((prev) => [...prev, [x, y]])
  }

  const deletePartition = async (id: number) => {
    try {
      await api.buildings.deletePartition(id)
      toast.success("Partition deleted.")
      if (selectedId === id) setSelectedId(null)
      await mutate()
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { detail?: unknown } } }).response?.data
          ?.detail ?? (e as Error).message
      toast.error(`Delete failed: ${String(msg)}`)
    }
  }

  const persistRing = useCallback(
    async (partitionId: number, ring: number[][]) => {
      const geometry: GeoJSONPolygon = {
        type: "Polygon",
        coordinates: [ring],
      }
      try {
        await api.buildings.updatePartition(partitionId, { geometry })
        await mutate()
      } catch (e: unknown) {
        const msg =
          (e as { response?: { data?: { detail?: unknown } } }).response?.data
            ?.detail ?? (e as Error).message
        toast.error(`Update failed: ${String(msg)}`)
      }
    },
    [mutate]
  )

  const movePartitionOrder = async (p: BuildingPartition, dir: -1 | 1) => {
    const list = sortedPartitions
    const idx = list.findIndex((x) => x.id === p.id)
    const swap = idx + dir
    if (swap < 0 || swap >= list.length) return
    const other = list[swap]
    try {
      await Promise.all([
        api.buildings.updatePartition(p.id, {
          sort_order: other.sort_order,
        }),
        api.buildings.updatePartition(other.id, {
          sort_order: p.sort_order,
        }),
      ])
      await mutate()
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { detail?: unknown } } }).response?.data
          ?.detail ?? (e as Error).message
      toast.error(`Reorder failed: ${String(msg)}`)
    }
  }

  const dragging = drag !== null

  useEffect(() => {
    if (!dragging) return
    const onMove = (ev: PointerEvent) => {
      if (!svgRef.current) return
      const { x, y } = clientToSvg(svgRef.current, ev.clientX, ev.clientY)
      setDrag((d) =>
        d
          ? {
              ...d,
              previewRing: setRingVertex(d.previewRing, d.vertexIndex, x, y),
            }
          : null
      )
    }
    const onUp = () => {
      setDrag((d) => {
        if (d) void persistRing(d.partitionId, d.previewRing)
        return null
      })
    }
    window.addEventListener("pointermove", onMove)
    window.addEventListener("pointerup", onUp)
    window.addEventListener("pointercancel", onUp)
    return () => {
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("pointerup", onUp)
      window.removeEventListener("pointercancel", onUp)
    }
  }, [dragging, persistRing])

  const ringForRender = (p: BuildingPartition): number[][] => {
    if (drag && drag.partitionId === p.id) return drag.previewRing
    return exteriorRing(p.geometry)
  }

  const handleVertexDown = (
    e: React.PointerEvent,
    partitionId: number,
    vertexIndex: number,
    ring: number[][]
  ) => {
    if (mode !== "edit") return
    e.stopPropagation()
    ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
    setSelectedId(partitionId)
    setDrawing(false)
    setDrag({
      partitionId,
      vertexIndex,
      previewRing: cloneRing(ring),
    })
  }

  const draftPathD =
    draftRing.length >= 2 ? ringToPathD([...draftRing, draftRing[0]]) : ""

  return (
    <div className="flex flex-col gap-4 lg:flex-row">
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant={mode === "view" ? "secondary" : "outline"}
            size="sm"
            className="gap-1"
            onClick={() => {
              setMode("view")
              setDrawing(false)
              setDraftRing([])
            }}
          >
            View
          </Button>
          <Button
            type="button"
            variant={mode === "edit" ? "secondary" : "outline"}
            size="sm"
            className="gap-1"
            onClick={() => setMode("edit")}
          >
            <Pencil className="h-3.5 w-3.5" />
            Edit partitions
          </Button>
          {mode === "edit" && (
            <>
              <Button
                type="button"
                variant={drawing ? "secondary" : "outline"}
                size="sm"
                className="gap-1"
                onClick={() => {
                  setDrawing((d) => !d)
                  setDraftRing([])
                  setSelectedId(null)
                }}
              >
                <Plus className="h-3.5 w-3.5" />
                {drawing ? "Cancel drawing" : "Draw new"}
              </Button>
              {drawing && (
                <>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => void finishDraft()}
                    disabled={draftRing.length < 3}
                  >
                    Finish polygon
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setDraftRing([])}
                  >
                    Clear points
                  </Button>
                </>
              )}
            </>
          )}
        </div>
        {drawing && (
          <div className="flex flex-wrap items-end gap-2 rounded-md border bg-muted/40 p-2">
            <div className="space-y-1">
              <Label className="text-xs">Name (optional)</Label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Zone name"
                className="h-8 w-48"
              />
            </div>
            <p className="text-xs text-muted-foreground pb-1">
              Click the floor to add vertices. Finish needs at least three
              points.
            </p>
          </div>
        )}
        <div className="relative rounded-lg border overflow-hidden bg-white">
          {isLoading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/60">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          )}
          {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
          <svg
            ref={svgRef}
            role="img"
            viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`}
            className={cn(
              "block h-auto w-full touch-none select-none",
              mode === "edit" && drawing && "cursor-crosshair"
            )}
            onClick={onSvgClick}
          >
            <title>Floor plan with partition overlays</title>
            <image
              href={floorImageHref}
              x={vb.x}
              y={vb.y}
              width={vb.w}
              height={vb.h}
              preserveAspectRatio="none"
            />
            {sortedPartitions.map((p, pi) => {
              const ring = ringForRender(p)
              const d = ringToPathD(ring)
              const sel = selectedId === p.id
              return (
                <g key={p.id}>
                  <path
                    d={d}
                    fill={paletteColor(pi, p.fill_color)}
                    stroke={sel ? "var(--foreground)" : "rgb(37 99 235)"}
                    strokeWidth={sel ? 2.5 : 1.5}
                    vectorEffect="non-scaling-stroke"
                    className="pointer-events-none"
                  />
                  {mode === "edit" &&
                    !drawing &&
                    ring.length > 1 &&
                    ring.slice(0, -1).map((pt, vi) => (
                      <circle
                        key={`${p.id}-${vi}`}
                        data-vertex
                        cx={pt[0]}
                        cy={pt[1]}
                        r={6}
                        className="cursor-grab fill-background stroke-primary stroke-2 active:cursor-grabbing"
                        onPointerDown={(e) =>
                          handleVertexDown(e, p.id, vi, ring)
                        }
                      />
                    ))}
                </g>
              )
            })}
            {drawing && draftRing.length > 0 && (
              <g>
                {draftRing.map((pt, i) => (
                  <circle
                    key={`d-${i}`}
                    cx={pt[0]}
                    cy={pt[1]}
                    r={5}
                    className="fill-primary stroke-background stroke-2 pointer-events-none"
                  />
                ))}
                {draftPathD && (
                  <path
                    d={draftPathD}
                    fill="rgba(59, 130, 246, 0.15)"
                    stroke="rgb(37 99 235)"
                    strokeWidth={1.5}
                    strokeDasharray="6 4"
                    vectorEffect="non-scaling-stroke"
                    className="pointer-events-none"
                  />
                )}
              </g>
            )}
          </svg>
        </div>
      </div>

      <div className="w-full shrink-0 space-y-2 lg:w-64">
        <div className="flex items-center gap-2 text-sm font-medium">
          <MapPinned className="h-4 w-4" />
          Partitions ({sortedPartitions.length})
        </div>
        <Separator />
        <ul className="max-h-72 space-y-1 overflow-y-auto text-sm">
          {sortedPartitions.length === 0 ? (
            <li className="text-muted-foreground py-2">
              No partitions on this floor yet.
            </li>
          ) : (
            sortedPartitions.map((p) => (
              <li
                key={p.id}
                className={cn(
                  "flex flex-col gap-1 rounded-md border p-2",
                  selectedId === p.id && "border-primary bg-muted/50"
                )}
              >
                <button
                  type="button"
                  className="text-left font-medium hover:underline"
                  onClick={() => setSelectedId(p.id)}
                >
                  {p.name}
                </button>
                <div className="flex flex-wrap gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    disabled={mode !== "edit"}
                    title="Move up in rotation order"
                    onClick={() => void movePartitionOrder(p, -1)}
                  >
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    disabled={mode !== "edit"}
                    title="Move down in rotation order"
                    onClick={() => void movePartitionOrder(p, 1)}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:text-destructive"
                    disabled={mode !== "edit"}
                    title="Delete"
                    onClick={() => void deletePartition(p.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  )
}
