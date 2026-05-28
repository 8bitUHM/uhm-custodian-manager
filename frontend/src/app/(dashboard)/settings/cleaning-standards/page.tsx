"use client"

import { useEffect, useState } from "react"
import { Loader2, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import useSWR, { mutate as globalMutate } from "swr"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { api } from "@/lib/api"
import type {
  CleaningSpaceType,
  MatchField,
  MatchKind,
  SpaceTypeMapping,
} from "@/lib/types"

async function refreshWorkloadCaches() {
  await globalMutate(
    (key) =>
      Array.isArray(key) &&
      (key[0] === "workload-summary" || key[0] === "building-workload"),
    undefined,
    { revalidate: true }
  )
}

export default function CleaningStandardsPage() {
  const { data: types, mutate: mutateTypes } = useSWR(
    ["cleaning-types"],
    () => api.cleaningStandards.listTypes()
  )
  const { data: settings, mutate: mutateSettings } = useSWR(
    ["cleaning-settings"],
    () => api.cleaningStandards.getSettings()
  )
  const { data: mappings, mutate: mutateMappings } = useSWR(
    ["cleaning-mappings"],
    () => api.cleaningStandards.listMappings()
  )

  const [savingSettings, setSavingSettings] = useState(false)
  const [workday, setWorkday] = useState("")
  const [sqftPref, setSqftPref] = useState("")
  const [editingTypeId, setEditingTypeId] = useState<number | null>(null)
  const [typeMinutes, setTypeMinutes] = useState("")
  const [newMapping, setNewMapping] = useState({
    cleaning_space_type_id: "",
    match_field: "description" as MatchField,
    match_kind: "contains" as MatchKind,
    match_value: "",
    priority: "50",
  })

  useEffect(() => {
    if (settings) {
      setWorkday(String(settings.workday_minutes))
      setSqftPref(settings.sqft_preference)
    }
  }, [settings])

  async function saveSettings() {
    setSavingSettings(true)
    try {
      await api.cleaningStandards.updateSettings({
        workday_minutes: Number.parseInt(workday, 10),
        sqft_preference: sqftPref.trim(),
      })
      toast.success("Settings saved — workload headcount will update")
      await mutateSettings()
      await refreshWorkloadCaches()
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setSavingSettings(false)
    }
  }

  async function saveTypeMinutes(t: CleaningSpaceType) {
    const mins = Number.parseFloat(typeMinutes)
    if (!Number.isFinite(mins) || mins < 0) {
      toast.error("Enter a valid number of minutes")
      return
    }
    try {
      await api.cleaningStandards.updateType(t.id, { minutes_per_unit: mins })
      toast.success(`Updated ${t.label} — total cleaning time recalculated`)
      setEditingTypeId(null)
      await mutateTypes()
      await refreshWorkloadCaches()
    } catch (err) {
      toast.error((err as Error).message)
    }
  }

  async function addMapping() {
    const typeId = Number.parseInt(newMapping.cleaning_space_type_id, 10)
    if (!Number.isFinite(typeId) || !newMapping.match_value.trim()) {
      toast.error("Select a space type and enter a match value")
      return
    }
    try {
      await api.cleaningStandards.createMapping({
        cleaning_space_type_id: typeId,
        match_field: newMapping.match_field,
        match_kind: newMapping.match_kind,
        match_value: newMapping.match_value.trim(),
        priority: Number.parseInt(newMapping.priority, 10) || 0,
      })
      toast.success("Mapping added — spaces reclassified")
      setNewMapping((p) => ({ ...p, match_value: "" }))
      await mutateMappings()
      await refreshWorkloadCaches()
    } catch (err) {
      toast.error((err as Error).message)
    }
  }

  async function removeMapping(m: SpaceTypeMapping) {
    try {
      await api.cleaningStandards.deleteMapping(m.id)
      toast.success("Mapping removed — spaces reclassified")
      await mutateMappings()
      await refreshWorkloadCaches()
    } catch (err) {
      toast.error((err as Error).message)
    }
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Cleaning standards</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Configure estimated cleaning times per space type. Workload and
          recommended headcount use these values after AiM import.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Global settings</CardTitle>
          <CardDescription>
            Workday length affects <strong>recommended custodians only</strong> (total
            time ÷ workday). Sqft column priority is used when importing AiM data.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4 items-end">
          <div className="space-y-1">
            <Label className="text-xs">Workday (minutes)</Label>
            <Input
              type="number"
              min={1}
              className="w-32"
              value={workday}
              onChange={(e) => setWorkday(e.target.value)}
            />
          </div>
          <div className="space-y-1 flex-1 min-w-[200px]">
            <Label className="text-xs">Sqft preference (comma-separated)</Label>
            <Input
              value={sqftPref}
              onChange={(e) => setSqftPref(e.target.value)}
              placeholder="polyline_sqft,cad_gross,user_sqft"
            />
          </div>
          <Button
            type="button"
            disabled={savingSettings}
            onClick={() => void saveSettings()}
          >
            {savingSettings ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Save settings
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Space types</CardTitle>
          <CardDescription>
            Minutes per space (or per sqft for &quot;Unmapped&quot;). Click Edit, change
            the value, then Save — total cleaning time updates for all imported
            buildings.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!types ? (
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Label</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead className="text-right">Minutes</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {types.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell>
                        <span className="font-medium">{t.label}</span>
                        <span className="block text-xs text-muted-foreground font-mono">
                          {t.slug}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs">{t.unit}</TableCell>
                      <TableCell className="text-right">
                        {editingTypeId === t.id ? (
                          <Input
                            type="number"
                            step="0.01"
                            className="w-24 ml-auto"
                            value={typeMinutes}
                            onChange={(e) => setTypeMinutes(e.target.value)}
                          />
                        ) : (
                          t.minutes_per_unit
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {editingTypeId === t.id ? (
                          <Button
                            size="sm"
                            onClick={() => void saveTypeMinutes(t)}
                          >
                            Save
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setEditingTypeId(t.id)
                              setTypeMinutes(String(t.minutes_per_unit))
                            }}
                          >
                            Edit
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Description mapping rules</CardTitle>
          <CardDescription>
            Higher priority wins. Used when importing AiM rows.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2 items-end">
            <div className="space-y-1">
              <Label className="text-xs">Space type</Label>
              <Select
                value={newMapping.cleaning_space_type_id}
                onValueChange={(v) =>
                  setNewMapping((p) => ({ ...p, cleaning_space_type_id: v }))
                }
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  {(types ?? []).map((t) => (
                    <SelectItem key={t.id} value={String(t.id)}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Match</Label>
              <Input
                className="w-40"
                value={newMapping.match_value}
                onChange={(e) =>
                  setNewMapping((p) => ({ ...p, match_value: e.target.value }))
                }
                placeholder="e.g. ELEVATOR"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Kind</Label>
              <Select
                value={newMapping.match_kind}
                onValueChange={(v) =>
                  setNewMapping((p) => ({
                    ...p,
                    match_kind: v as MatchKind,
                  }))
                }
              >
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="contains">contains</SelectItem>
                  <SelectItem value="exact">exact</SelectItem>
                  <SelectItem value="regex">regex</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Priority</Label>
              <Input
                type="number"
                className="w-20"
                value={newMapping.priority}
                onChange={(e) =>
                  setNewMapping((p) => ({ ...p, priority: e.target.value }))
                }
              />
            </div>
            <Button type="button" size="sm" onClick={() => void addMapping()}>
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </div>
          {!mappings ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <div className="rounded-md border overflow-x-auto max-h-80 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Rule</TableHead>
                    <TableHead className="text-right">Priority</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mappings.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell>{m.cleaning_space_type_label}</TableCell>
                      <TableCell className="font-mono text-xs">
                        {m.match_field} {m.match_kind} &quot;{m.match_value}&quot;
                      </TableCell>
                      <TableCell className="text-right">{m.priority}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => void removeMapping(m)}
                        >
                          <Trash2 className="h-4 w-4" />
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
