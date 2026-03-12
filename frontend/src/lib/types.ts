type Custodian = {
  id?: number;
  firstName: string;
  lastName: string;
  suffix: string;
  role?: string;
  boss_name?: string | null;
  boss_id?: number;
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
