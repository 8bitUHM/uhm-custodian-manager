import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { Wing } from "@/lib/types"

const styles: Record<Wing, string> = {
  EWA: "bg-cyan-100 text-cyan-800 hover:bg-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-300",
  MAUKA:
    "bg-emerald-100 text-emerald-800 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300",
  MAKAI:
    "bg-violet-100 text-violet-800 hover:bg-violet-200 dark:bg-violet-900/30 dark:text-violet-300",
}

export function WingBadge({
  wing,
  className,
}: {
  wing?: Wing | string | null
  className?: string
}) {
  if (!wing) {
    return (
      <Badge variant="outline" className={cn("font-mono", className)}>
        --
      </Badge>
    )
  }
  const w = wing.toUpperCase() as Wing
  return (
    <Badge
      variant="secondary"
      className={cn("border-transparent font-medium", styles[w], className)}
    >
      {w}
    </Badge>
  )
}
