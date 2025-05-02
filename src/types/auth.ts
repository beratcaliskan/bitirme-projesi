export interface User {
  id: string;
  email: string;
  name: string;
  isAdmin: boolean;
  createdAt: Date;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData extends LoginCredentials {
  name: string;
} 