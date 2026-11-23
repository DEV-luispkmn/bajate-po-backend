import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';

@Injectable()
export class AdminGuard extends JwtAuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isAuthed = await super.canActivate(context);
    if (!isAuthed) return false;

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.esAdmin) {
      throw new ForbiddenException(
        'Acceso restringido: Se requieren privilegios de Comandancia / Administrador.',
      );
    }

    return true;
  }
}
