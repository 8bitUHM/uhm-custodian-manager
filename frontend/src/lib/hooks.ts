"use client"

import useSWR, { mutate as globalMutate } from "swr"
import { api } from "./api"
import type {
  BuildingDetail,
  BuildingSummary,
  CustodianFilters,
  CustodianListResponse,
  DashboardStats,
  J3,
  PartitionRotationState,
  PartitionScheduleResponse,
  Supervisor,
} from "./types"

const KEYS = {
  stats: ["dashboard", "stats"] as const,
  custodians: (filters: CustodianFilters) =>
    ["custodians", filters] as const,
  j3s: ["j3s"] as const,
  supervisors: ["supervisors"] as const,
  buildings: ["buildings"] as const,
  building: (id: number) => ["buildings", id] as const,
}

export function useStats() {
  return useSWR<DashboardStats>(KEYS.stats, () => api.dashboard.stats(), {
    revalidateOnFocus: false,
  })
}

export function useCustodians(filters: CustodianFilters = {}) {
  return useSWR<CustodianListResponse>(
    KEYS.custodians(filters),
    () => api.custodians.list(filters),
    { revalidateOnFocus: false, keepPreviousData: true }
  )
}

export function useJ3s() {
  return useSWR<J3[]>(KEYS.j3s, () => api.j3s.list(), {
    revalidateOnFocus: false,
  })
}

export function useSupervisors() {
  return useSWR<Supervisor[]>(KEYS.supervisors, () => api.supervisors.list(), {
    revalidateOnFocus: false,
  })
}

export function useBuildings() {
  return useSWR<BuildingSummary[]>(KEYS.buildings, () => api.buildings.list(), {
    revalidateOnFocus: false,
  })
}

export function useBuilding(id: number | null) {
  return useSWR<BuildingDetail>(
    id != null ? KEYS.building(id) : null,
    () => api.buildings.get(id as number),
    { revalidateOnFocus: false }
  )
}

export function useBuildingPartitions(
  buildingId: number | null,
  floorId: string | null | undefined
) {
  const fid = floorId ?? ""
  return useSWR(
    buildingId != null && fid !== ""
      ? (["building-partitions", buildingId, fid] as const)
      : null,
    () => api.buildings.listPartitions(buildingId!, fid),
    { revalidateOnFocus: false }
  )
}

export function usePartitionRotation(
  buildingId: number | null,
  j3Id: number | null
) {
  return useSWR<PartitionRotationState>(
    buildingId != null && j3Id != null
      ? (["partition-rotation", buildingId, j3Id] as const)
      : null,
    () => api.buildings.getPartitionRotation(buildingId!, j3Id!),
    { revalidateOnFocus: false }
  )
}

export function usePartitionSchedule(
  buildingId: number | null,
  j3Id: number | null,
  scheduleDate: string | null,
  floorId: string | null | undefined
) {
  const fid = floorId ?? ""
  return useSWR<PartitionScheduleResponse>(
    buildingId != null && j3Id != null && scheduleDate
      ? (["partition-schedule", buildingId, j3Id, scheduleDate, fid] as const)
      : null,
    () =>
      api.buildings.getPartitionSchedule(buildingId!, {
        j3_id: j3Id!,
        schedule_date: scheduleDate!,
        ...(fid !== "" ? { floor_id: fid } : {}),
      }),
    { revalidateOnFocus: false }
  )
}

/**
 * Revalidate everything that could be affected by a hierarchy mutation.
 * Cheap call - SWR de-dupes inflight requests.
 */
export function revalidateAll() {
  globalMutate(
    (key: unknown) =>
      Array.isArray(key) &&
      (["custodians", "j3s", "supervisors", "dashboard", "buildings"].includes(
        key[0] as string
      ) ||
        key[0] === "building-partitions" ||
        key[0] === "partition-schedule" ||
        key[0] === "partition-rotation")
  )
}
