import axios from "axios"
import type {
  BuildingCreateBody,
  BuildingDetail,
  BuildingMeta,
  BuildingPartition,
  BuildingPartitionCreate,
  BuildingPartitionUpdate,
  BuildingSummary,
  BuildingUpdate,
  Custodian,
  CustodianCreate,
  CustodianFilters,
  CustodianListResponse,
  CustodianUpdate,
  DashboardStats,
  J3,
  J3Create,
  J3Update,
  PartitionRotationResponse,
  PartitionRotationState,
  PartitionRotationUpsert,
  PartitionScheduleResponse,
  Supervisor,
  SupervisorCreate,
  SupervisorUpdate,
  CleaningSpaceType,
  CleaningSpaceTypeUpdate,
  CleaningSpaceTypeCreate,
  CleaningSettings,
  CleaningSettingsUpdate,
  SpaceTypeMapping,
  SpaceTypeMappingCreate,
  BuildingWorkload,
  WorkloadSummaryRow,
  AimImportResult,
} from "./types"

const API_BASE =
  (typeof process !== "undefined" && process.env.NEXT_PUBLIC_API_URL) ||
  "http://localhost:8000"

export const http = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
})

// Strip null/undefined entries so we don't send `?wing=null` to the server.
function cleanParams(p: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(p)) {
    if (v !== null && v !== undefined && v !== "") out[k] = v
  }
  return out
}

export const api = {
  dashboard: {
    async stats(): Promise<DashboardStats> {
      const { data } = await http.get<DashboardStats>("/api/dashboard/stats")
      return data
    },
  },

  custodians: {
    async list(filters: CustodianFilters = {}): Promise<CustodianListResponse> {
      const { data } = await http.get<CustodianListResponse>(
        "/api/custodians/",
        { params: cleanParams(filters as Record<string, unknown>) }
      )
      return data
    },
    async get(id: number): Promise<Custodian> {
      const { data } = await http.get<Custodian>(`/api/custodians/${id}`)
      return data
    },
    async create(payload: CustodianCreate): Promise<Custodian> {
      const { data } = await http.post<Custodian>("/api/custodians/", payload)
      return data
    },
    async update(id: number, payload: CustodianUpdate): Promise<Custodian> {
      const { data } = await http.put<Custodian>(
        `/api/custodians/${id}`,
        payload
      )
      return data
    },
    async remove(id: number): Promise<void> {
      await http.delete(`/api/custodians/${id}`)
    },
  },

  j3s: {
    async list(): Promise<J3[]> {
      const { data } = await http.get<J3[]>("/api/j3s/")
      return data
    },
    async create(payload: J3Create): Promise<J3> {
      const { data } = await http.post<J3>("/api/j3s/", payload)
      return data
    },
    async update(id: number, payload: J3Update): Promise<J3> {
      const { data } = await http.put<J3>(`/api/j3s/${id}`, payload)
      return data
    },
    async remove(id: number): Promise<void> {
      await http.delete(`/api/j3s/${id}`)
    },
  },

  supervisors: {
    async list(): Promise<Supervisor[]> {
      const { data } = await http.get<Supervisor[]>("/api/supervisors/")
      return data
    },
    async create(payload: SupervisorCreate): Promise<Supervisor> {
      const { data } = await http.post<Supervisor>(
        "/api/supervisors/",
        payload
      )
      return data
    },
    async update(
      id: number,
      payload: SupervisorUpdate
    ): Promise<Supervisor> {
      const { data } = await http.put<Supervisor>(
        `/api/supervisors/${id}`,
        payload
      )
      return data
    },
    async remove(id: number): Promise<void> {
      await http.delete(`/api/supervisors/${id}`)
    },
  },

  buildings: {
    async list(): Promise<BuildingSummary[]> {
      const { data } = await http.get<BuildingSummary[]>("/api/buildings/")
      return data
    },
    async get(id: number): Promise<BuildingDetail> {
      const { data } = await http.get<BuildingDetail>(`/api/buildings/${id}`)
      return data
    },
    async create(payload: BuildingCreateBody): Promise<BuildingDetail> {
      const { data } = await http.post<BuildingDetail>(
        "/api/buildings/",
        payload
      )
      return data
    },
    async update(id: number, payload: BuildingUpdate): Promise<BuildingDetail> {
      const { data } = await http.put<BuildingDetail>(
        `/api/buildings/${id}`,
        payload
      )
      return data
    },
    /** Static viewer metadata from Next ``public/buildings/{slug}/meta.json``. */
    async fetchMeta(slug: string): Promise<BuildingMeta> {
      const res = await fetch(`/buildings/${slug}/meta.json`)
      if (!res.ok) {
        throw new Error(`Failed to load building meta for ${slug}`)
      }
      return res.json() as Promise<BuildingMeta>
    },

    async listPartitions(
      buildingId: number,
      floorId?: string
    ): Promise<BuildingPartition[]> {
      const { data } = await http.get<BuildingPartition[]>(
        `/api/buildings/${buildingId}/partitions`,
        { params: cleanParams({ floor_id: floorId }) }
      )
      return data
    },

    async createPartition(
      buildingId: number,
      payload: BuildingPartitionCreate
    ): Promise<BuildingPartition> {
      const { data } = await http.post<BuildingPartition>(
        `/api/buildings/${buildingId}/partitions`,
        payload
      )
      return data
    },

    async updatePartition(
      partitionId: number,
      payload: BuildingPartitionUpdate
    ): Promise<BuildingPartition> {
      const { data } = await http.put<BuildingPartition>(
        `/api/partitions/${partitionId}`,
        payload
      )
      return data
    },

    async deletePartition(partitionId: number): Promise<void> {
      await http.delete(`/api/partitions/${partitionId}`)
    },

    async getPartitionRotation(
      buildingId: number,
      j3Id: number
    ): Promise<PartitionRotationState> {
      const { data } = await http.get<PartitionRotationState>(
        `/api/buildings/${buildingId}/partition-rotation`,
        { params: { j3_id: j3Id } }
      )
      return data
    },

    async upsertPartitionRotation(
      buildingId: number,
      payload: PartitionRotationUpsert
    ): Promise<PartitionRotationResponse> {
      const { data } = await http.put<PartitionRotationResponse>(
        `/api/buildings/${buildingId}/partition-rotation`,
        payload
      )
      return data
    },

    async getPartitionSchedule(
      buildingId: number,
      params: { j3_id: number; schedule_date: string; floor_id?: string }
    ): Promise<PartitionScheduleResponse> {
      const { data } = await http.get<PartitionScheduleResponse>(
        `/api/buildings/${buildingId}/partition-schedule`,
        { params: cleanParams(params as Record<string, unknown>) }
      )
      return data
    },

    async importSpaces(
      buildingId: number,
      file: File
    ): Promise<AimImportResult> {
      const form = new FormData()
      form.append("file", file)
      const { data } = await http.post<AimImportResult>(
        `/api/buildings/${buildingId}/spaces/import`,
        form,
        { headers: { "Content-Type": "multipart/form-data" } }
      )
      return data
    },

    async getWorkload(buildingId: number): Promise<BuildingWorkload> {
      const { data } = await http.get<BuildingWorkload>(
        `/api/buildings/${buildingId}/workload`
      )
      return data
    },

    async recomputeWorkload(buildingId: number): Promise<{ spaces_updated: number }> {
      const { data } = await http.post<{ spaces_updated: number }>(
        `/api/buildings/${buildingId}/workload/recompute`
      )
      return data
    },
  },

  cleaningStandards: {
    async listTypes(): Promise<CleaningSpaceType[]> {
      const { data } = await http.get<CleaningSpaceType[]>(
        "/api/cleaning-standards/types"
      )
      return data
    },
    async updateType(
      id: number,
      payload: CleaningSpaceTypeUpdate
    ): Promise<CleaningSpaceType> {
      const { data } = await http.put<CleaningSpaceType>(
        `/api/cleaning-standards/types/${id}`,
        payload
      )
      return data
    },
    async createType(
      payload: CleaningSpaceTypeCreate
    ): Promise<CleaningSpaceType> {
      const { data } = await http.post<CleaningSpaceType>(
        "/api/cleaning-standards/types",
        payload
      )
      return data
    },
    async getSettings(): Promise<CleaningSettings> {
      const { data } = await http.get<CleaningSettings>(
        "/api/cleaning-standards/settings"
      )
      return data
    },
    async updateSettings(
      payload: CleaningSettingsUpdate
    ): Promise<CleaningSettings> {
      const { data } = await http.put<CleaningSettings>(
        "/api/cleaning-standards/settings",
        payload
      )
      return data
    },
    async listMappings(): Promise<SpaceTypeMapping[]> {
      const { data } = await http.get<SpaceTypeMapping[]>(
        "/api/cleaning-standards/mappings"
      )
      return data
    },
    async createMapping(
      payload: SpaceTypeMappingCreate
    ): Promise<SpaceTypeMapping> {
      const { data } = await http.post<SpaceTypeMapping>(
        "/api/cleaning-standards/mappings",
        payload
      )
      return data
    },
    async deleteMapping(id: number): Promise<void> {
      await http.delete(`/api/cleaning-standards/mappings/${id}`)
    },
  },

  workload: {
    async summary(): Promise<WorkloadSummaryRow[]> {
      const { data } = await http.get<WorkloadSummaryRow[]>(
        "/api/workload/summary"
      )
      return data
    },
  },
}
