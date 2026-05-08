"use client"

import { useEffect } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { api } from "@/lib/api"
import { revalidateAll, useSupervisors } from "@/lib/hooks"
import type { J3 } from "@/lib/types"

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  group_number: z.coerce
    .number()
    .int()
    .positive("Group number must be a positive integer")
    .optional()
    .nullable(),
  position_id: z.string().optional().nullable(),
  uh_id: z.string().optional().nullable(),
  supervisor_id: z.coerce
    .number()
    .int()
    .positive("Select a supervisor"),
})

type FormValues = z.infer<typeof schema>

interface J3FormProps {
  j3?: J3 | null
  onDone: () => void
  onCancel: () => void
}

export function J3Form({ j3, onDone, onCancel }: J3FormProps) {
  const { data: supervisors } = useSupervisors()
  const isEdit = Boolean(j3)

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: j3?.name ?? "",
      group_number: j3?.group_number ?? null,
      position_id: j3?.position_id ?? "",
      uh_id: j3?.uh_id ?? "",
      supervisor_id: j3?.supervisor_id ?? 0,
    },
  })

  useEffect(() => {
    reset({
      name: j3?.name ?? "",
      group_number: j3?.group_number ?? null,
      position_id: j3?.position_id ?? "",
      uh_id: j3?.uh_id ?? "",
      supervisor_id: j3?.supervisor_id ?? 0,
    })
  }, [j3, reset])

  const onSubmit = handleSubmit(async (values) => {
    const payload = {
      name: values.name,
      group_number: values.group_number ? Number(values.group_number) : null,
      position_id: values.position_id || null,
      uh_id: values.uh_id || null,
      supervisor_id: Number(values.supervisor_id),
    }
    try {
      if (isEdit && j3) {
        await api.j3s.update(j3.id, payload)
        toast.success(`Updated ${values.name}`)
      } else {
        await api.j3s.create(payload)
        toast.success(`Added ${values.name}`)
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
      <div className="grid gap-1.5">
        <Label htmlFor="name">Full name</Label>
        <Input id="name" {...register("name")} />
        {errors.name && (
          <p className="text-xs text-destructive">{errors.name.message}</p>
        )}
      </div>

      <div className="grid gap-1.5">
        <Label>Reports to (Supervisor)</Label>
        <Controller
          control={control}
          name="supervisor_id"
          render={({ field }) => (
            <Select
              value={field.value ? String(field.value) : ""}
              onValueChange={(val) => field.onChange(Number(val))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select supervisor..." />
              </SelectTrigger>
              <SelectContent>
                {supervisors?.map((s) => (
                  <SelectItem key={s.id} value={String(s.id)}>
                    {s.wing ? `${s.wing} - ` : ""}
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.supervisor_id && (
          <p className="text-xs text-destructive">
            {errors.supervisor_id.message}
          </p>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="grid gap-1.5">
          <Label htmlFor="group_number">Group #</Label>
          <Input
            id="group_number"
            type="number"
            inputMode="numeric"
            placeholder="e.g. 1"
            {...register("group_number")}
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="position_id">Position #</Label>
          <Input id="position_id" {...register("position_id")} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="uh_id">UH ID</Label>
          <Input id="uh_id" {...register("uh_id")} />
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
              : "Add Janitor III"}
        </Button>
      </div>
    </form>
  )
}
