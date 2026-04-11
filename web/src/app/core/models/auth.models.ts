export type LoginArea = 1 | 2; // 1 = Admin, 2 = App

export interface LoginRequest {
  email: string;
  password: string;
  area: LoginArea;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
}

export interface CurrentUser {
  id: number;
  email: string;
  username: string;
  loginArea: LoginArea;
  roles: string[];
  programs: string[];
}
