"use client"

import { useMemo, useState } from "react"
import { MoreHorizontal, Pencil, Plus, Trash2, Users } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { J3Form } from "@/components/j3-form"
import { DeleteDialog } from "@/components/delete-dialog"
import { WingBadge } from "@/components/wing-badge"

import { api } from "@/lib/api"
import {
  revalidateAll,
  useCustodians,
  useJ3s,
  useSupervisors,
} from "@/lib/hooks"
import type { J3, Wing } from "@/lib/types"
import { WINGS } from "@/lib/types"

export default function J3sPage() {
  const [wingFilter, setWingFilter] = useState<Wing | "all">("all")
  const [createOpen, setCreateOpen] = useState(false)
  const [editing, setEditing] = useState<J3 | null>(null)
  const [deleting, setDeleting] = useState<J3 | null>(null)
  const [deleteBusy, setDeleteBusy] = useState(false)

  const { data: j3s, isLoading } = useJ3s()
  const { data: supervisors } = useSupervisors()
  const { data: custodianList } = useCustodians({})

  const supById = useMemo(
    () => new Map((supervisors ?? []).map((s) => [s.id, s])),
    [supervisors]
  )

  const j2CountByJ3 = useMemo(() => {
    const m = new Map<number, number>()
    for (const c of custodianList?.items ?? []) {
      if (c.j3_id !== null && c.j3_id !== undefined) {
        m.set(c.j3_id, (m.get(c.j3_id) ?? 0) + 1)
      }
    }
    return m
  }, [custodianList])

  const rows = useMemo(() => {
    if (!j3s) return []
    return [...j3s]
      .filter((j) => {
        if (wingFilter === "all") return true
        return supById.get(j.supervisor_id)?.wing === wingFilter
      })
      .sort((a, b) => (a.group_number ?? 999) - (b.group_number ?? 999))
  }, [j3s, supById, wingFilter])

  async function handleDelete() {
    if (!deleting) return
    setDeleteBusy(true)
    try {
      await api.j3s.remove(deleting.id)
      toast.success(`Removed ${deleting.name}`)
      revalidateAll()
      setDeleting(null)
    } catch (err) {
      const msg =
        (err as { response?: { data?: { detail?: string } } }).response?.data
          ?.detail || (err as Error).message
      toast.error(`Failed to delete: ${msg}`)
    } finally {
      setDeleteBusy(false)
    }
  }

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="grid gap-3 md:grid-cols-[200px_1fr_auto]">
          <div className="grid gap-1.5">
            <Label className="text-xs">Wing</Label>
            <Select
              value={wingFilter}
              onValueChange={(v) => setWingFilter(v as Wing | "all")}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All wings</SelectItem>
                {WINGS.map((w) => (
                  <SelectItem key={w} value={w}>
                    {w}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div />
          <div className="flex items-end">
            <Button onClick={() => setCreateOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Janitor III
            </Button>
          </div>
        </div>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Group #</TableHead>
              <TableHead>Wing</TableHead>
              <TableHead>Supervisor</TableHead>
              <TableHead># JIIs</TableHead>
              <TableHead>UH ID</TableHead>
              <TableHead>Position #</TableHead>
              <TableHead className="w-[60px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={`s-${i}`}>
                    {Array.from({ length: 8 }).map((__, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-4 w-20" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              : rows.length === 0
                ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="h-32 text-center text-sm text-muted-foreground"
                    >
                      No Janitors III to show.
                    </TableCell>
                  </TableRow>
                )
                : rows.map((j) => {
                    const sup = supById.get(j.supervisor_id)
                    const count = j2CountByJ3.get(j.id) ?? 0
                    return (
                      <TableRow key={j.id}>
                        <TableCell className="font-medium">{j.name}</TableCell>
                        <TableCell>
                          <span className="font-medium">
                            Group {j.group_number ?? "?"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <WingBadge wing={sup?.wing as Wing} />
                        </TableCell>
                        <TableCell className="text-sm">
                          {sup?.name ?? (
                            <span className="text-muted-foreground">
                              Unassigned
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="inline-flex items-center gap-1 rounded-md border bg-muted/40 px-2 py-0.5 text-xs">
                            <Users className="h-3 w-3" />
                            {count}
                          </span>
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {j.uh_id || "-"}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {j.position_id || "-"}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setEditing(j)}>
                                <Pencil className="mr-2 h-4 w-4" /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => setDeleting(j)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )
                  })}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Janitor III</DialogTitle>
            <DialogDescription>
              Group leads report directly to a Janitor Supervisor II.
            </DialogDescription>
          </DialogHeader>
          <J3Form
            onCancel={() => setCreateOpen(false)}
            onDone={() => setCreateOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(editing)}
        onOpenChange={(o) => !o && setEditing(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit {editing?.name}</DialogTitle>
            <DialogDescription>Update Janitor III details.</DialogDescription>
          </DialogHeader>
          {editing && (
            <J3Form
              j3={editing}
              onCancel={() => setEditing(null)}
              onDone={() => setEditing(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      <DeleteDialog
        open={Boolean(deleting)}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Delete Janitor III?"
        description={
          deleting ? (
            <span>
              This will permanently remove{" "}
              <span className="font-semibold">{deleting.name}</span>.{" "}
              {(j2CountByJ3.get(deleting.id) ?? 0) > 0 && (
                <span>
                  <span className="font-semibold">
                    {j2CountByJ3.get(deleting.id)}
                  </span>{" "}
                  Janitor II(s) will be left unassigned.
                </span>
              )}{" "}
              This action cannot be undone.
            </span>
          ) : (
            ""
          )
        }
        onConfirm={handleDelete}
        busy={deleteBusy}
      />
    </div>
  )
}
