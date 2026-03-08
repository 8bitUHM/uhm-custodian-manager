type Supervisor = {
  id?: number;
  name: string | null;
};

enum TaskStatus {
  pending = "pending",
  in_progress = "in_progress",
  completed = "completed",
  cancelled = "cancelled",
}

type Task = {
  id: number;
  title: string;
  description: string;
  status: TaskStatus;
  priority: "low" | "medium" | "high";
  assigned_to?: number;
  building_id: number;
  scheduled_date: Date;
  completed_date?: Date;
  created_at: Date;
  updated_at: Date;
}

export type { Supervisor, Task };
