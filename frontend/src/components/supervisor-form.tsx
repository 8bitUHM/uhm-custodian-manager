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
import { revalidateAll } from "@/lib/hooks"
import type { Supervisor } from "@/lib/types"
import { WINGS } from "@/lib/types"

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  wing: z.enum(["EWA", "MAUKA", "MAKAI"]).optional().nullable(),
  org_code: z.string().optional().nullable(),
  position_id: z.string().optional().nullable(),
  uh_id: z.string().optional().nullable(),
})

type FormValues = z.infer<typeof schema>

interface SupervisorFormProps {
  supervisor?: Supervisor | null
  onDone: () => void
  onCancel: () => void
}

export function SupervisorForm({
  supervisor,
  onDone,
  onCancel,
}: SupervisorFormProps) {
  const isEdit = Boolean(supervisor)

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: supervisor?.name ?? "",
      wing: (supervisor?.wing ?? null) as FormValues["wing"],
      org_code: supervisor?.org_code ?? "",
      position_id: supervisor?.position_id ?? "",
      uh_id: supervisor?.uh_id ?? "",
    },
  })

  useEffect(() => {
    reset({
      name: supervisor?.name ?? "",
      wing: (supervisor?.wing ?? null) as FormValues["wing"],
      org_code: supervisor?.org_code ?? "",
      position_id: supervisor?.position_id ?? "",
      uh_id: supervisor?.uh_id ?? "",
    })
  }, [supervisor, reset])

  const onSubmit = handleSubmit(async (values) => {
    const payload = {
      name: values.name,
      wing: values.wing || null,
      org_code: values.org_code || null,
      position_id: values.position_id || null,
      uh_id: values.uh_id || null,
    }
    try {
      if (isEdit && supervisor) {
        await api.supervisors.update(supervisor.id, payload)
        toast.success(`Updated ${values.name}`)
      } else {
        await api.supervisors.create(payload)
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

      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-1.5">
          <Label>Wing</Label>
          <Controller
            control={control}
            name="wing"
            render={({ field }) => (
              <Select
                value={field.value ?? "none"}
                onValueChange={(val) =>
                  field.onChange(val === "none" ? null : val)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select wing..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Unassigned</SelectItem>
                  {WINGS.map((w) => (
                    <SelectItem key={w} value={w}>
                      {w}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="org_code">Org code</Label>
          <Input
            id="org_code"
            placeholder="e.g. MAC1BG"
            {...register("org_code")}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
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
              : "Add supervisor"}
        </Button>
      </div>
    </form>
  )
}
