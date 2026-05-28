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

export type CleaningUnit = "per_space" | "per_sqft"
export type MatchField = "description" | "primary_type"
export type MatchKind = "exact" | "contains" | "regex"

export interface CleaningSpaceType {
  id: number
  slug: string
  label: string
  minutes_per_unit: number
  unit: CleaningUnit
  is_active: boolean
  sort_order: number
}

export interface CleaningSpaceTypeUpdate {
  label?: string
  minutes_per_unit?: number
  unit?: CleaningUnit
  is_active?: boolean
  sort_order?: number
}

export interface CleaningSpaceTypeCreate {
  slug: string
  label: string
  minutes_per_unit: number
  unit?: CleaningUnit
  sort_order?: number
}

export interface CleaningSettings {
  workday_minutes: number
  sqft_preference: string
}

export interface CleaningSettingsUpdate {
  workday_minutes?: number
  sqft_preference?: string
}

export interface SpaceTypeMapping {
  id: number
  cleaning_space_type_id: number
  cleaning_space_type_slug?: string | null
  cleaning_space_type_label?: string | null
  match_field: MatchField
  match_kind: MatchKind
  match_value: string
  priority: number
  is_active: boolean
}

export interface SpaceTypeMappingCreate {
  cleaning_space_type_id: number
  match_field?: MatchField
  match_kind?: MatchKind
  match_value: string
  priority?: number
  is_active?: boolean
}

export interface WorkloadBreakdownRow {
  space_type_id?: number | null
  slug: string
  label: string
  count: number
  minutes: number
}

export interface UnmappedSpaceSample {
  location_code: string
  description?: string | null
  effective_sqft?: number | null
  minutes: number
}

export interface BuildingWorkload {
  building_id: number
  building_name?: string | null
  building_code?: string | null
  total_minutes: number
  workday_minutes: number
  recommended_headcount: number
  imported_space_count: number
  last_import_at?: string | null
  by_space_type: WorkloadBreakdownRow[]
  unmapped_samples: UnmappedSpaceSample[]
}

export interface WorkloadSummaryRow {
  building_id: number
  building_name: string
  building_code?: string | null
  public_slug?: string | null
  imported_space_count: number
  total_minutes: number
  recommended_headcount: number
  last_import_at?: string | null
}

export interface AimImportResult {
  building_id: number
  import_batch_id: string
  imported_count: number
  skipped_rows: number
  skipped_property_codes: number[]
  allowed_property_codes: number[]
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
