export type Wing = "EWA" | "MAUKA" | "MAKAI"

export const WINGS: Wing[] = ["EWA", "MAUKA", "MAKAI"]

export interface Supervisor {
  id: number
  name: string
  wing?: Wing | null
  org_code?: string | null
  position_id?: string | null
  uh_id?: string | null
  j3_list: number[]
}

export interface SupervisorCreate {
  name: string
  wing?: Wing | null
  org_code?: string | null
  position_id?: string | null
  uh_id?: string | null
}

export type SupervisorUpdate = Partial<SupervisorCreate>

export interface J3 {
  id: number
  name: string
  group_number?: number | null
  position_id?: string | null
  uh_id?: string | null
  supervisor_id: number
}

export interface J3Create {
  name: string
  group_number?: number | null
  position_id?: string | null
  uh_id?: string | null
  supervisor_id: number
}

export type J3Update = Partial<J3Create>

export interface Custodian {
  id: number
  first_name: string
  last_name: string
  email?: string | null
  phone?: string | null
  employee_id?: string | null
  uh_id?: string | null
  position_id?: string | null
  position_title?: string | null
  j3_id?: number | null
  is_active: boolean
  hire_date?: string | null
  created_at?: string | null
  updated_at?: string | null
  building_ids?: number[]
}

export interface CustodianCreate {
  first_name: string
  last_name: string
  email?: string | null
  phone?: string | null
  employee_id?: string | null
  uh_id?: string | null
  position_id?: string | null
  position_title?: string | null
  j3_id?: number | null
  is_active?: boolean
}

export type CustodianUpdate = Partial<CustodianCreate> & {
  building_ids?: number[] | null
}

export interface BuildingCustodianBrief {
  id: number
  first_name: string
  last_name: string
  j3_id?: number | null
  is_active: boolean
}

export interface BuildingSummary {
  id: number
  name: string
  address: string
  building_code?: string | null
  floors?: number | null
  description?: string | null
  public_slug?: string | null
  is_active: boolean
  custodian_count: number
  created_at: string
  updated_at?: string | null
}

export interface BuildingDetail {
  id: number
  name: string
  address: string
  building_code?: string | null
  floors?: number | null
  description?: string | null
  public_slug?: string | null
  is_active: boolean
  created_at: string
  updated_at?: string | null
  custodians: BuildingCustodianBrief[]
}

export interface BuildingCreateBody {
  name: string
  address: string
  building_code?: string | null
  floors?: number | null
  description?: string | null
  public_slug?: string | null
  is_active?: boolean
  custodian_ids?: number[] | null
}

export type BuildingUpdate = Partial<
  Omit<BuildingCreateBody, "custodian_ids">
> & {
  custodian_ids?: number[] | null
}

export interface BuildingMetaFloor {
  id: string
  label: string
  image: string
}

export interface BuildingMeta {
  name: string
  slug: string
  overview3d: string
  floors: BuildingMetaFloor[]
}

/** GeoJSON Polygon in floor SVG user units (not geographic). */
export interface GeoJSONPolygon {
  type: "Polygon"
  coordinates: number[][][]
}

export interface BuildingPartition {
  id: number
  building_id: number
  floor_id: string
  name: string
  sort_order: number
  geometry: GeoJSONPolygon
  fill_color?: string | null
}

export interface BuildingPartitionCreate {
  floor_id: string
  name: string
  sort_order?: number
  geometry: GeoJSONPolygon
  fill_color?: string | null
}

export type BuildingPartitionUpdate = Partial<
  Omit<BuildingPartitionCreate, "floor_id">
> & { floor_id?: string }

export interface PartitionRotationState {
  building_id: number
  j3_id: number
  anchor_date?: string | null
}

export interface PartitionRotationUpsert {
  j3_id: number
  anchor_date: string
}

export interface PartitionRotationResponse {
  building_id: number
  j3_id: number
  anchor_date: string
}

export interface PartitionScheduleCustodian {
  id: number
  first_name: string
  last_name: string
}

export interface PartitionScheduleRow {
  partition: BuildingPartition
  custodian?: PartitionScheduleCustodian | null
}

export interface PartitionScheduleResponse {
  building_id: number
  j3_id: number
  schedule_date: string
  floor_id?: string | null
  anchor_date?: string | null
  day_offset?: number | null
  partition_count: number
  pool_count: number
  assignments: PartitionScheduleRow[]
}

export interface CustodianListResponse {
  items: Custodian[]
  total: number
}

export interface CustodianFilters {
  wing?: Wing | null
  j3_id?: number | null
  q?: string | null
  is_active?: boolean | null
}

export interface DashboardStats {
  totalCustodians: number
  activeCustodians: number
  totalBuildings: number
  tasksCompleted: number
  totalSupervisors: number
  totalJ3s: number
}
