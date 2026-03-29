type Custodian = {
  id?: number;
  firstName: string;
  lastName: string;
  role?: string;
  boss_name?: string | null;
  boss_id?: number;
  groupnum?: number;
};

type Supervisor = {
  id: number;
  name: string;
};

type nameHolder = {
  firstName: string;
  lastName: string;
};

export type { Custodian, Supervisor, nameHolder };
