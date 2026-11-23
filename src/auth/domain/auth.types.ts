export interface JwtPayload {
  sub: number;
  email: string;
  alias: string;
  esAdmin?: boolean;
}

export interface AuthResponse {
  accessToken: string;
  jugador: {
    id: number;
    alias: string;
    email: string;
    rango?: string | null;
    avatarUrl?: string | null;
    region?: string | null;
    ciudad?: string | null;
    roles?: string | null;
    equipoId?: number | null;
    esAdmin?: boolean;
  };
}
