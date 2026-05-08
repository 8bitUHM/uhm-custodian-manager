"use client"

import { useMemo, useState } from "react"
import {
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
  Users,
  UserCog,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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

import { SupervisorForm } from "@/components/supervisor-form"
import { DeleteDialog } from "@/components/delete-dialog"
import { WingBadge } from "@/components/wing-badge"

import { api } from "@/lib/api"
import {
  revalidateAll,
  useCustodians,
  useJ3s,
  useSupervisors,
} from "@/lib/hooks"
import type { Supervisor, Wing } from "@/lib/types"

export default function SupervisorsPage() {
  const [createOpen, setCreateOpen] = useState(false)
  const [editing, setEditing] = useState<Supervisor | null>(null)
  const [deleting, setDeleting] = useState<Supervisor | null>(null)
  const [deleteBusy, setDeleteBusy] = useState(false)

  const { data: supervisors, isLoading } = useSupervisors()
  const { data: j3s } = useJ3s()
  const { data: custodianList } = useCustodians({})

  const j2CountBySup = useMemo(() => {
    if (!j3s || !custodianList) return new Map<number, number>()
    const j3SupMap = new Map(j3s.map((j) => [j.id, j.supervisor_id]))
    const m = new Map<number, number>()
    for (const c of custodianList.items) {
      if (c.j3_id == null) continue
      const sid = j3SupMap.get(c.j3_id)
      if (sid != null) m.set(sid, (m.get(sid) ?? 0) + 1)
    }
    return m
  }, [j3s, custodianList])

  async function handleDelete() {
    if (!deleting) return
    setDeleteBusy(true)
    try {
      await api.supervisors.remove(deleting.id)
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
      {/* Wing summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(["EWA", "MAUKA", "MAKAI"] as Wing[]).map((w) => {
          const sup = supervisors?.find((s) => s.wing === w)
          return (
            <Card key={w} className="p-4">
              <div className="flex items-center justify-between">
                <WingBadge wing={w} />
                <span className="text-xs text-muted-foreground">
                  {sup?.org_code ?? "--"}
                </span>
              </div>
              <div className="mt-2 text-base font-medium">
                {sup?.name ?? "Unassigned"}
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-md border p-2">
                  <div className="text-muted-foreground">Janitors III</div>
                  <div className="text-base font-semibold">
                    {sup?.j3_list.length ?? 0}
                  </div>
                </div>
                <div className="rounded-md border p-2">
                  <div className="text-muted-foreground">Janitor IIs</div>
                  <div className="text-base font-semibold">
                    {sup ? (j2CountBySup.get(sup.id) ?? 0) : 0}
                  </div>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      <Card className="p-4 flex items-center justify-between">
        <div>
          <div className="text-base font-medium">All supervisors</div>
          <div className="text-sm text-muted-foreground">
            {supervisors?.length ?? 0} supervisor(s) total
          </div>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add supervisor
        </Button>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Wing</TableHead>
              <TableHead>Org code</TableHead>
              <TableHead>Position #</TableHead>
              <TableHead>UH ID</TableHead>
              <TableHead># JIIIs</TableHead>
              <TableHead># JIIs</TableHead>
              <TableHead className="w-[60px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading
              ? Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={`s-${i}`}>
                    {Array.from({ length: 8 }).map((__, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-4 w-20" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              : (supervisors ?? []).length === 0
                ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="h-32 text-center text-sm text-muted-foreground"
                    >
                      No supervisors to show.
                    </TableCell>
                  </TableRow>
                )
                : (supervisors ?? []).map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.name}</TableCell>
                      <TableCell>
                        <WingBadge wing={s.wing as Wing} />
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {s.org_code || "-"}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {s.position_id || "-"}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {s.uh_id || "-"}
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-1 rounded-md border bg-muted/40 px-2 py-0.5 text-xs">
                          <UserCog className="h-3 w-3" />
                          {s.j3_list.length}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-1 rounded-md border bg-muted/40 px-2 py-0.5 text-xs">
                          <Users className="h-3 w-3" />
                          {j2CountBySup.get(s.id) ?? 0}
                        </span>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setEditing(s)}>
                              <Pencil className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => setDeleting(s)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add supervisor</DialogTitle>
            <DialogDescription>
              Each wing should have exactly one Janitor Supervisor II.
            </DialogDescription>
          </DialogHeader>
          <SupervisorForm
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
            <DialogDescription>Update supervisor details.</DialogDescription>
          </DialogHeader>
          {editing && (
            <SupervisorForm
              supervisor={editing}
              onCancel={() => setEditing(null)}
              onDone={() => setEditing(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      <DeleteDialog
        open={Boolean(deleting)}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Delete supervisor?"
        description={
          deleting ? (
            <span>
              This will permanently remove{" "}
              <span className="font-semibold">{deleting.name}</span>.{" "}
              {deleting.j3_list.length > 0 && (
                <span>
                  <span className="font-semibold">
                    {deleting.j3_list.length}
                  </span>{" "}
                  Janitor III(s) will be left without a supervisor.
                </span>
              )}{" "}
              {(j2CountBySup.get(deleting.id) ?? 0) > 0 && (
                <span>
                  Indirectly affects{" "}
                  <span className="font-semibold">
                    {j2CountBySup.get(deleting.id)}
                  </span>{" "}
                  Janitor II(s).
                </span>
              )}
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
