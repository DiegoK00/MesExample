import { LoginArea } from './auth.models';

export interface UserResponse {
  id: number;
  email: string;
  username: string;
  loginArea: LoginArea;
  isActive: boolean;
  createdAt: string;
  lastLoginAt: string | null;
  roles: string[];
}

export interface UsersPageResponse {
  items: UserResponse[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface CreateUserRequest {
  email: string;
  username: string;
  password: string;
  loginArea: LoginArea;
  roleIds: number[];
}

export interface UpdateUserRequest {
  email: string;
  username: string;
  isActive: boolean;
  roleIds: number[];
}
