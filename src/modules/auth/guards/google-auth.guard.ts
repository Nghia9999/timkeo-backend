import {
  Injectable,
  ExecutionContext,
  BadRequestException,
  CanActivate,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GoogleAuthGuard implements CanActivate {
  private guard: CanActivate | null = null;

  constructor(private readonly configService: ConfigService) {
    // Chỉ tạo AuthGuard nếu strategy đã được load
    try {
      this.guard = new (class extends AuthGuard('google') {} as any)();
    } catch {
      this.guard = null;
    }
  }

  canActivate(context: ExecutionContext) {
    const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
    const clientSecret = this.configService.get<string>('GOOGLE_CLIENT_SECRET');
    const hasGoogleCredentials = clientId && clientSecret;

    if (!hasGoogleCredentials || !this.guard) {
      throw new BadRequestException(
        'Google OAuth is not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in your environment variables.',
      );
    }

    return this.guard.canActivate(context);
  }
}
