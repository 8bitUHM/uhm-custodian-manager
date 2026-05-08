"use client"

import { useEffect, useMemo } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { api } from "@/lib/api"
import { revalidateAll, useJ3s, useSupervisors } from "@/lib/hooks"
import type { Custodian } from "@/lib/types"

const schema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  uh_id: z.string().optional().nullable(),
  position_id: z.string().optional().nullable(),
  position_title: z.string().optional().nullable(),
  email: z
    .string()
    .email("Must be a valid email")
    .optional()
    .or(z.literal("")),
  phone: z.string().optional().nullable(),
  j3_id: z.coerce.number().int().positive().optional().nullable(),
  is_active: z.boolean(),
})

type FormValues = z.infer<typeof schema>

interface CustodianFormProps {
  custodian?: Custodian | null
  defaultJ3Id?: number | null
  onDone: () => void
  onCancel: () => void
}

export function CustodianForm({
  custodian,
  defaultJ3Id,
  onDone,
  onCancel,
}: CustodianFormProps) {
  const { data: j3s } = useJ3s()
  const { data: supervisors } = useSupervisors()

  const isEdit = Boolean(custodian)

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      first_name: custodian?.first_name ?? "",
      last_name: custodian?.last_name ?? "",
      uh_id: custodian?.uh_id ?? "",
      position_id: custodian?.position_id ?? "",
      position_title: custodian?.position_title ?? "Janitor II",
      email: custodian?.email ?? "",
      phone: custodian?.phone ?? "",
      j3_id: custodian?.j3_id ?? defaultJ3Id ?? null,
      is_active: custodian?.is_active ?? true,
    },
  })

  // When the edited record changes (e.g. opening a different row in edit mode),
  // reset the form so the inputs reflect the new values.
  useEffect(() => {
    reset({
      first_name: custodian?.first_name ?? "",
      last_name: custodian?.last_name ?? "",
      uh_id: custodian?.uh_id ?? "",
      position_id: custodian?.position_id ?? "",
      position_title: custodian?.position_title ?? "Janitor II",
      email: custodian?.email ?? "",
      phone: custodian?.phone ?? "",
      j3_id: custodian?.j3_id ?? defaultJ3Id ?? null,
      is_active: custodian?.is_active ?? true,
    })
  }, [custodian, defaultJ3Id, reset])

  const j3sByWing = useMemo(() => {
    if (!j3s || !supervisors) return null
    const supById = new Map(supervisors.map((s) => [s.id, s]))
    const groups: Record<string, typeof j3s> = {
      EWA: [],
      MAUKA: [],
      MAKAI: [],
      OTHER: [],
    }
    for (const j of [...j3s].sort(
      (a, b) => (a.group_number ?? 0) - (b.group_number ?? 0)
    )) {
      const wing = supById.get(j.supervisor_id)?.wing ?? "OTHER"
      const key = (wing ?? "OTHER").toUpperCase()
      ;(groups[key] ?? groups.OTHER).push(j)
    }
    return groups
  }, [j3s, supervisors])

  const onSubmit = handleSubmit(async (values) => {
    const payload = {
      first_name: values.first_name,
      last_name: values.last_name,
      uh_id: values.uh_id || null,
      position_id: values.position_id || null,
      position_title: values.position_title || "Janitor II",
      email: values.email ? values.email : null,
      phone: values.phone || null,
      j3_id: values.j3_id ? Number(values.j3_id) : null,
      is_active: values.is_active,
    }
    try {
      if (isEdit && custodian) {
        await api.custodians.update(custodian.id, payload)
        toast.success(`Updated ${values.first_name} ${values.last_name}`)
      } else {
        await api.custodians.create(payload)
        toast.success(`Added ${values.first_name} ${values.last_name}`)
      }
      revalidateAll()
      onDone()
    } catch (err) {
      const msg =
        (err as { response?: { data?: { detail?: string } } }).response?.data
          ?.detail || (err as Error).message
      toast.error(`Failed to save: ${msg}`)
    }
  })

  return (
    <form className="grid gap-4" onSubmit={onSubmit}>
      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-1.5">
          <Label htmlFor="first_name">First name</Label>
          <Input id="first_name" {...register("first_name")} />
          {errors.first_name && (
            <p className="text-xs text-destructive">
              {errors.first_name.message}
            </p>
          )}
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="last_name">Last name</Label>
          <Input id="last_name" {...register("last_name")} />
          {errors.last_name && (
            <p className="text-xs text-destructive">
              {errors.last_name.message}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-1.5">
          <Label htmlFor="uh_id">UH ID</Label>
          <Input id="uh_id" placeholder="e.g. 12345678" {...register("uh_id")} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="position_id">Position #</Label>
          <Input
            id="position_id"
            placeholder="e.g. 22334"
            {...register("position_id")}
          />
        </div>
      </div>

      <div className="grid gap-1.5">
        <Label>Reports to (Janitor III)</Label>
        <Controller
          control={control}
          name="j3_id"
          render={({ field }) => (
            <Select
              value={field.value ? String(field.value) : "none"}
              onValueChange={(val) =>
                field.onChange(val === "none" ? null : Number(val))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Unassigned" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Unassigned</SelectItem>
                {j3sByWing &&
                  (["EWA", "MAUKA", "MAKAI", "OTHER"] as const).map(
                    (wing) =>
                      j3sByWing[wing] && j3sByWing[wing].length > 0 ? (
                        <SelectGroup key={wing}>
                          <SelectLabel>{wing}</SelectLabel>
                          {j3sByWing[wing].map((j) => (
                            <SelectItem key={j.id} value={String(j.id)}>
                              Group{" "}
                              {j.group_number !== null &&
                              j.group_number !== undefined
                                ? j.group_number
                                : "?"}{" "}
                              &middot; {j.name}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      ) : null
                  )}
              </SelectContent>
            </Select>
          )}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="optional"
            {...register("email")}
          />
          {errors.email && (
            <p className="text-xs text-destructive">{errors.email.message}</p>
          )}
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" placeholder="optional" {...register("phone")} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-1.5">
          <Label htmlFor="position_title">Position title</Label>
          <Input
            id="position_title"
            placeholder="Janitor II"
            {...register("position_title")}
          />
        </div>
        <div className="flex items-end">
          <div className="flex items-center justify-between rounded-md border px-3 py-2 w-full">
            <div>
              <Label htmlFor="is_active" className="text-sm">
                Active
              </Label>
              <p className="text-xs text-muted-foreground">
                Currently employed
              </p>
            </div>
            <Controller
              control={control}
              name="is_active"
              render={({ field }) => (
                <Switch
                  id="is_active"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? "Saving..."
            : isEdit
              ? "Save changes"
              : "Add custodian"}
        </Button>
      </div>
    </form>
  )
}
