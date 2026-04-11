export interface ProgramResponse {
  id: number;
  code: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface CreateProgramRequest {
  code: string;
  name: string;
  description?: string;
}

export interface UpdateProgramRequest {
  name: string;
  description?: string;
  isActive: boolean;
}

export interface UserProgramResponse {
  programId: number;
  code: string;
  name: string;
  grantedAt: string;
  grantedByUsername: string | null;
}
