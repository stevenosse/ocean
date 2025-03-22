export interface User {
  id: number;
  email: string;
  role?: string;
  createdAt?: string;
  updatedAt?: string;
  forcePasswordChange?: boolean;
}

export interface AuthResponse {
  access_token: string;
  user: User;
}