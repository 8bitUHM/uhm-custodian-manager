"use client"

import { useState } from "react"
import Link from "next/link"
import { Building2, MapPin, Plus, Users } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"

import { api } from "@/lib/api"
import { useBuildings } from "@/lib/hooks"

export default function BuildingsPage() {
  const { data: buildings, isLoading, mutate } = useBuildings()
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [name, setName] = useState("")
  const [address, setAddress] = useState("")
  const [buildingCode, setBuildingCode] = useState("")
  const [publicSlug, setPublicSlug] = useState("")
  const [floors, setFloors] = useState("")
  const [description, setDescription] = useState("")

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !address.trim()) {
      toast.error("Name and address are required.")
      return
    }
    setSubmitting(true)
    try {
      await api.buildings.create({
        name: name.trim(),
        address: address.trim(),
        building_code: buildingCode.trim() || null,
        public_slug: publicSlug.trim() || null,
        floors: floors.trim() ? Number(floors) : null,
        description: description.trim() || null,
        is_active: true,
      })
      toast.success(`Added ${name.trim()}`)
      setOpen(false)
      setName("")
      setAddress("")
      setBuildingCode("")
      setPublicSlug("")
      setFloors("")
      setDescription("")
      await mutate()
    } catch (err) {
      const msg =
        (err as { response?: { data?: { detail?: string } } }).response?.data
          ?.detail || (err as Error).message
      toast.error(`Could not create building: ${msg}`)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground max-w-xl">
          Browse campus buildings. Link static floor assets by setting a{" "}
          <span className="font-mono text-xs">public_slug</span> that matches{" "}
          <span className="font-mono text-xs">public/buildings/&lt;slug&gt;/</span>.
        </p>
        <Button onClick={() => setOpen(true)} className="gap-2 shrink-0">
          <Plus className="h-4 w-4" />
          Add building
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {isLoading &&
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <Skeleton className="aspect-video w-full rounded-t-lg" />
              <CardHeader>
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-4 w-full mt-2" />
              </CardHeader>
            </Card>
          ))}
        {!isLoading &&
          (buildings ?? []).map((b) => {
            const thumb =
              b.public_slug != null && b.public_slug !== ""
                ? `/buildings/${b.public_slug}/3d/overview.png`
                : null
            return (
              <Card
                key={b.id}
                className="overflow-hidden flex flex-col transition-shadow hover:shadow-md"
              >
                <Link href={`/buildings/${b.id}`} className="block">
                  <div className="w-full bg-white">
                    {thumb ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={thumb}
                        alt=""
                        className="block h-auto w-full"
                      />
                    ) : (
                      <div className="flex min-h-[180px] items-center justify-center text-muted-foreground bg-muted/20">
                        <Building2 className="h-16 w-16 opacity-40" />
                      </div>
                    )}
                  </div>
                </Link>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-lg leading-tight">
                      <Link
                        href={`/buildings/${b.id}`}
                        className="hover:text-primary"
                      >
                        {b.name}
                      </Link>
                    </CardTitle>
                    {!b.is_active && (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                  </div>
                  <CardDescription className="flex items-start gap-1.5">
                    <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{b.address}</span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2 text-xs text-muted-foreground pb-2">
                  {b.building_code && (
                    <Badge variant="outline" className="font-mono">
                      {b.building_code}
                    </Badge>
                  )}
                  {b.public_slug && (
                    <Badge variant="outline" className="font-mono">
                      /{b.public_slug}
                    </Badge>
                  )}
                  {b.floors != null && (
                    <span>{b.floors} floors</span>
                  )}
                </CardContent>
                <CardFooter className="mt-auto border-t pt-3 flex justify-between">
                  <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    {b.custodian_count} custodian
                    {b.custodian_count === 1 ? "" : "s"}
                  </span>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/buildings/${b.id}`}>Details</Link>
                  </Button>
                </CardFooter>
              </Card>
            )
          })}
      </div>

      {!isLoading && (!buildings || buildings.length === 0) && (
        <Card className="p-10 text-center text-muted-foreground">
          No buildings yet. Seed the database or add one with &quot;Add building&quot;.
        </Card>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleCreate}>
            <DialogHeader>
              <DialogTitle>Add building</DialogTitle>
              <DialogDescription>
                Creates a campus record. Optional slug matches files under{" "}
                <span className="font-mono text-xs">public/buildings/</span>.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-3 py-4">
              <div className="grid gap-1.5">
                <Label htmlFor="b-name">Name</Label>
                <Input
                  id="b-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="b-address">Address</Label>
                <Input
                  id="b-address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label htmlFor="b-code">Building code</Label>
                  <Input
                    id="b-code"
                    value={buildingCode}
                    onChange={(e) => setBuildingCode(e.target.value)}
                    placeholder="optional"
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="b-slug">Public slug</Label>
                  <Input
                    id="b-slug"
                    value={publicSlug}
                    onChange={(e) => setPublicSlug(e.target.value)}
                    placeholder="e.g. shidler"
                  />
                </div>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="b-floors">Floor count</Label>
                <Input
                  id="b-floors"
                  type="number"
                  min={0}
                  value={floors}
                  onChange={(e) => setFloors(e.target.value)}
                  placeholder="optional"
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="b-desc">Description</Label>
                <textarea
                  id="b-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="optional"
                  rows={3}
                  className="flex min-h-[72px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Saving..." : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
