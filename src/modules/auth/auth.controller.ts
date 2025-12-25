import {
  Controller,
  Get,
  Req,
  Res,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import type { Response } from 'express';

import { AuthService } from './auth.service';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

const hasGoogleCredentials =
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET;

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  async googleAuth() {
    // Redirect đến Google OAuth page
    // Passport sẽ tự động xử lý
  }

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleAuthRedirect(@Req() req, @Res() res: Response) {
    try {
      const user = await this.authService.validateGoogleUser(req.user);
      const loginResult = await this.authService.login(user);

      // Redirect về frontend với token và user data
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const token = loginResult.access_token;
      const userData = encodeURIComponent(JSON.stringify(loginResult.user));

      res.redirect(
        `${frontendUrl}/auth/callback?token=${token}&user=${userData}`,
      );
    } catch (error) {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      res.redirect(
        `${frontendUrl}/auth/callback?error=${encodeURIComponent(error.message || 'Login failed')}`,
      );
    }
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  getProfile(@Req() req) {
    return req.user;
  }

  // Endpoint riêng cho mobile - nhận token và redirect về mobile app
  @Get('mobile/callback')
  async mobileCallback(@Req() req, @Res() res: Response) {
    const token = req.query.token as string;
    const user = req.query.user as string;
    const error = req.query.error as string;

    const mobileScheme = process.env.MOBILE_SCHEME || 'timkeo://auth/callback';

    if (error) {
      res.redirect(`${mobileScheme}?error=${encodeURIComponent(error)}`);
      return;
    }

    if (token) {
      res.redirect(`${mobileScheme}?token=${encodeURIComponent(token)}&user=${encodeURIComponent(user || '')}`);
      return;
    }

    res.redirect(`${mobileScheme}?error=${encodeURIComponent('Missing token')}`);
  }
}
