type Custodian = {
  id?: number;
  name: string | null;
  role?: string;
  boss_name?: string | null;
  boss_id?: number;
};

type Supervisor = {
  id: number;
  name: string;
};

export type { Custodian, Supervisor };
