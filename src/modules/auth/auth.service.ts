import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '@modules/users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcrypt';
import { UserRole } from '@modules/users/schemas/user.schema';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto) {
    const user = await this.usersService.create({
      ...registerDto,
      role: UserRole.VIEWER, // Default role for registration
    });

    return this.generateTokens(user);
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);

    // Update last login
    await this.usersService.updateLastLogin(user._id);

    return this.generateTokens(user);
  }

  async validateUser(email: string, password: string): Promise<any> {
    console.log('[Auth Debug] Attempting login for email:', email);
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      console.log('[Auth Debug] ❌ User not found:', email);
      throw new UnauthorizedException('Invalid credentials');
    }

    console.log('[Auth Debug] ✅ User found:', email, '| Status:', user.status);
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      console.log('[Auth Debug] ❌ Password mismatch for:', email);
      throw new UnauthorizedException('Invalid credentials');
    }

    console.log('[Auth Debug] ✅ Password matches for:', email);

    if (user.status !== 'active') {
      console.log('[Auth Debug] ❌ User status is not active:', user.status);
      throw new UnauthorizedException('Account is not active');
    }

    console.log('[Auth Debug] ✅ User validated successfully:', email);
    return user;
  }

  private generateTokens(user: any) {
    const payload = {
      email: user.email,
      sub: user._id,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get<string>('jwt.expiresIn'),
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('jwt.refreshSecret'),
      expiresIn: this.configService.get<string>('jwt.refreshExpiresIn'),
    });

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }

  async getProfile(userId: string) {
    return this.usersService.findOne(userId);
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('jwt.refreshSecret'),
      });

      const user = await this.usersService.findOne(payload.sub);

      if (!user || user.status !== 'active') {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const newPayload = {
        email: user.email,
        sub: user._id,
        role: user.role,
      };

      return {
        access_token: this.jwtService.sign(newPayload, {
          expiresIn: this.configService.get<string>('jwt.expiresIn'),
        }),
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
}
