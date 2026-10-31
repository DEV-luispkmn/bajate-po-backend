export interface JwtPayload {
  sub: number;
  email: string;
  alias: string;
}

export interface AuthResponse {
  accessToken: string;
  jugador: {
    id: number;
    alias: string;
    email: string;
    rango?: string;
    avatarUrl?: string;
    equipoId?: number;
  };
}
