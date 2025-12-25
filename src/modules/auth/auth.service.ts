import { Injectable, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import { User } from '../user/schemas/user.schema';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private userService: UserService,
  ) {}

  async validateGoogleUser(profile: any): Promise<User> {
    const { id, displayName, picture, name } = profile;
    // console.log(profile);

    // Lấy email từ nhiều nguồn khác nhau để tránh missing
    const email =
      profile?.emails?.[0]?.value || profile?._json?.email || profile?.email;

    if (!email) {
      throw new BadRequestException(
        'Google profile does not include email. Please ensure the Google OAuth consent includes email scope.',
      );
    }

    const avatar = picture?.[0]?.value;

    // Tìm user theo Google ID hoặc email
    let user = await this.userService.findByGoogleId(id);

    if (!user) {
      // Nếu không tìm thấy theo Google ID, tìm theo email
      user = await this.userService.findByEmail(email);

      if (user) {
        // User đã tồn tại nhưng chưa có googleId, cập nhật
        const userId = (user as any)._id.toString();
        const updatedUser = await this.userService.update(userId, {
          googleId: id,
          avatar: avatar,
        });
        if (!updatedUser) {
          throw new Error('Failed to update user');
        }
        user = updatedUser;
      } else {
        // Tạo user mới
        user = await this.userService.create({
          name,
          email,
          googleId: id,
          avatar,
          trustScore: 0,
          location: {
            latitude: 0,
            longitude: 0,
          },
          sport: '',
        });
      }
    }

    if (!user) {
      throw new Error('Failed to create or retrieve user');
    }

    return user;
  }

  async login(user: User) {
    const userId = (user as any)._id.toString();
    const payload = {
      email: user.email,
      sub: userId,
      name: user.name,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: userId,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        googleId: user.googleId,
        trustScore: user.trustScore,
        ratingCount: user.ratingCount,
        sport: user.sport,
      },
    };
  }

  async validateUser(payload: any): Promise<User | null> {
    return this.userService.findOne(payload.sub);
  }
}
