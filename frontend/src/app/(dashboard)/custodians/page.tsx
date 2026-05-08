"use client"

import { Suspense, useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  Plus,
  MoreHorizontal,
  Search,
  Pencil,
  Trash2,
  Eye,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
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
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
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

import { CustodianForm } from "@/components/custodian-form"
import { DeleteDialog } from "@/components/delete-dialog"
import { WingBadge } from "@/components/wing-badge"

import { api } from "@/lib/api"
import { revalidateAll, useCustodians, useJ3s, useSupervisors } from "@/lib/hooks"
import type { Custodian, Wing } from "@/lib/types"
import { WINGS } from "@/lib/types"

const PAGE_SIZE = 15

export default function CustodiansPage() {
  return (
    <Suspense fallback={null}>
      <CustodiansPageInner />
    </Suspense>
  )
}

function CustodiansPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const initialWing = (searchParams.get("wing") || "all") as Wing | "all"
  const initialAction = searchParams.get("action")

  // Filter state
  const [wing, setWing] = useState<Wing | "all">(initialWing)
  const [j3Id, setJ3Id] = useState<string>("all")
  const [query, setQuery] = useState<string>("")
  const [activeOnly, setActiveOnly] = useState<boolean>(false)
  const [page, setPage] = useState(1)

  // Debounced search
  const [debouncedQuery, setDebouncedQuery] = useState(query)
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 250)
    return () => clearTimeout(t)
  }, [query])

  // Reset page on filter change
  useEffect(() => {
    setPage(1)
  }, [wing, j3Id, debouncedQuery, activeOnly])

  const filters = {
    wing: wing === "all" ? null : wing,
    j3_id: j3Id === "all" ? null : Number(j3Id),
    q: debouncedQuery || null,
    is_active: activeOnly ? true : null,
  }

  const { data: list, isLoading } = useCustodians(filters)
  const { data: j3s } = useJ3s()
  const { data: supervisors } = useSupervisors()

  // Filter J3 dropdown by selected wing
  const j3Options = useMemo(() => {
    if (!j3s || !supervisors) return []
    const supById = new Map(supervisors.map((s) => [s.id, s]))
    return j3s
      .filter((j) => {
        if (wing === "all") return true
        const sup = supById.get(j.supervisor_id)
        return sup?.wing === wing
      })
      .sort((a, b) => (a.group_number ?? 0) - (b.group_number ?? 0))
  }, [j3s, supervisors, wing])

  const j3LookupName = useMemo(() => {
    if (!j3s) return new Map<number, { name: string; group?: number | null }>()
    return new Map(
      j3s.map((j) => [j.id, { name: j.name, group: j.group_number }])
    )
  }, [j3s])

  const wingForJ3 = useMemo(() => {
    if (!j3s || !supervisors) return new Map<number, string | null>()
    const supById = new Map(supervisors.map((s) => [s.id, s]))
    return new Map(
      j3s.map((j) => [j.id, supById.get(j.supervisor_id)?.wing ?? null])
    )
  }, [j3s, supervisors])

  // Pagination
  const total = list?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const items = list?.items ?? []
  const pageItems = items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  // Dialog state
  const [createOpen, setCreateOpen] = useState(initialAction === "create")
  const [editing, setEditing] = useState<Custodian | null>(null)
  const [viewing, setViewing] = useState<Custodian | null>(null)
  const [deleting, setDeleting] = useState<Custodian | null>(null)
  const [deleteBusy, setDeleteBusy] = useState(false)

  // If user lands on /custodians?action=create, strip the query so back-button
  // and refresh don't re-open the dialog repeatedly.
  useEffect(() => {
    if (initialAction === "create") {
      const url = new URL(window.location.href)
      url.searchParams.delete("action")
      router.replace(url.pathname + url.search)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleDelete() {
    if (!deleting) return
    setDeleteBusy(true)
    try {
      await api.custodians.remove(deleting.id)
      toast.success(`Removed ${deleting.first_name} ${deleting.last_name}`)
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
      {/* Filter bar */}
      <Card className="p-4">
        <div className="grid gap-3 md:grid-cols-[1fr_180px_220px_140px_auto]">
          <div className="grid gap-1.5">
            <Label className="text-xs" htmlFor="search">
              Search
            </Label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Name or UH ID..."
                className="pl-8"
              />
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label className="text-xs">Wing</Label>
            <Select
              value={wing}
              onValueChange={(v) => {
                setWing(v as Wing | "all")
                setJ3Id("all")
              }}
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

          <div className="grid gap-1.5">
            <Label className="text-xs">Janitor III</Label>
            <Select value={j3Id} onValueChange={setJ3Id}>
              <SelectTrigger>
                <SelectValue placeholder="All groups" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All groups</SelectItem>
                <SelectGroup>
                  <SelectLabel>
                    {wing === "all" ? "All wings" : wing}
                  </SelectLabel>
                  {j3Options.map((j) => (
                    <SelectItem key={j.id} value={String(j.id)}>
                      Group {j.group_number ?? "?"} &middot; {j.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between rounded-md border px-3">
            <Label htmlFor="active" className="text-xs">
              Active only
            </Label>
            <Switch
              id="active"
              checked={activeOnly}
              onCheckedChange={setActiveOnly}
            />
          </div>

          <div className="flex items-end">
            <Button onClick={() => setCreateOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Add custodian
            </Button>
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Position #</TableHead>
              <TableHead>UH ID</TableHead>
              <TableHead>Group</TableHead>
              <TableHead>Wing</TableHead>
              <TableHead>Hire date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[60px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && items.length === 0
              ? Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={`s-${i}`}>
                    {Array.from({ length: 8 }).map((__, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-4 w-20" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              : pageItems.length === 0
                ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="h-32 text-center text-sm text-muted-foreground"
                    >
                      No custodians match these filters.
                    </TableCell>
                  </TableRow>
                )
                : pageItems.map((c) => {
                    const j3 = c.j3_id ? j3LookupName.get(c.j3_id) : undefined
                    const cWing = c.j3_id ? wingForJ3.get(c.j3_id) : null
                    return (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium">
                          {c.first_name} {c.last_name}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {c.position_id || "-"}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {c.uh_id || "-"}
                        </TableCell>
                        <TableCell>
                          {j3 ? (
                            <span className="text-sm">
                              <span className="font-medium">
                                Group {j3.group ?? "?"}
                              </span>
                              <span className="text-muted-foreground">
                                {" "}
                                &middot; {j3.name}
                              </span>
                            </span>
                          ) : (
                            <span className="text-sm text-muted-foreground">
                              Unassigned
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <WingBadge wing={cWing as Wing} />
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {c.hire_date
                            ? new Date(c.hire_date).toLocaleDateString()
                            : "-"}
                        </TableCell>
                        <TableCell>
                          {c.is_active ? (
                            <Badge variant="success">Active</Badge>
                          ) : (
                            <Badge variant="secondary">Inactive</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Actions</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setViewing(c)}>
                                <Eye className="mr-2 h-4 w-4" /> View
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setEditing(c)}>
                                <Pencil className="mr-2 h-4 w-4" /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => setDeleting(c)}
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

        <div className="flex items-center justify-between border-t px-4 py-3">
          <div className="text-xs text-muted-foreground">
            Showing{" "}
            {pageItems.length === 0
              ? 0
              : (page - 1) * PAGE_SIZE + 1}
            –{(page - 1) * PAGE_SIZE + pageItems.length} of {total}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <span className="text-xs text-muted-foreground">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </Button>
          </div>
        </div>
      </Card>

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add custodian</DialogTitle>
            <DialogDescription>
              Create a new Janitor II and assign them to a JIII.
            </DialogDescription>
          </DialogHeader>
          <CustodianForm
            onCancel={() => setCreateOpen(false)}
            onDone={() => setCreateOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog
        open={Boolean(editing)}
        onOpenChange={(o) => !o && setEditing(null)}
      >
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              Edit {editing?.first_name} {editing?.last_name}
            </DialogTitle>
            <DialogDescription>Update custodian details.</DialogDescription>
          </DialogHeader>
          {editing && (
            <CustodianForm
              custodian={editing}
              onCancel={() => setEditing(null)}
              onDone={() => setEditing(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* View dialog */}
      <Dialog
        open={Boolean(viewing)}
        onOpenChange={(o) => !o && setViewing(null)}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {viewing?.first_name} {viewing?.last_name}
            </DialogTitle>
            <DialogDescription>Custodian details.</DialogDescription>
          </DialogHeader>
          {viewing && (
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <Detail label="UH ID" value={viewing.uh_id} mono />
              <Detail label="Position #" value={viewing.position_id} mono />
              <Detail label="Position title" value={viewing.position_title} />
              <Detail
                label="Status"
                value={viewing.is_active ? "Active" : "Inactive"}
              />
              <Detail label="Email" value={viewing.email} />
              <Detail label="Phone" value={viewing.phone} />
              <Detail
                label="Group"
                value={
                  viewing.j3_id
                    ? `Group ${j3LookupName.get(viewing.j3_id)?.group ?? "?"} - ${j3LookupName.get(viewing.j3_id)?.name ?? ""}`
                    : "Unassigned"
                }
              />
              <Detail
                label="Hire date"
                value={
                  viewing.hire_date
                    ? new Date(viewing.hire_date).toLocaleDateString()
                    : "-"
                }
              />
            </dl>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete dialog */}
      <DeleteDialog
        open={Boolean(deleting)}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Delete custodian?"
        description={
          deleting ? (
            <span>
              This will permanently remove{" "}
              <span className="font-semibold">
                {deleting.first_name} {deleting.last_name}
              </span>
              {" "}from the database. This action cannot be undone.
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

function Detail({
  label,
  value,
  mono,
}: {
  label: string
  value?: string | null
  mono?: boolean
}) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd
        className={
          mono ? "font-mono text-sm" : "text-sm"
        }
      >
        {value || "-"}
      </dd>
    </div>
  )
}
