import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '@modules/users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { InviteUserDto } from './dto/invite-user.dto';
import { ActivateAccountDto } from './dto/activate-account.dto';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import * as nodemailer from 'nodemailer';
import { UserRole, UserStatus } from '@modules/users/schemas/user.schema';

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
      role: UserRole.STAFF, // Default role for self-registration
    });

    return this.generateTokens(user);
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    return this.generateTokens(user);
  }

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.status !== 'active') {
      throw new UnauthorizedException('Account is not active');
    }

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

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto) {
    const { currentPassword, newPassword, confirmPassword } = changePasswordDto;

    if (newPassword !== confirmPassword) {
      throw new BadRequestException('New password and confirmation do not match');
    }

    if (currentPassword === newPassword) {
      throw new BadRequestException('New password must be different from current password');
    }

    const user = await this.usersService.findByIdWithPassword(userId);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);

    if (!isCurrentPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    await this.usersService.update(userId, { password: newPassword });

    return { message: 'Password changed successfully' };
  }

  private sendEmail(to: string, subject: string, html: string, devLabel: string): void {
    const smtpHost = this.configService.get<string>('SMTP_HOST');
    const smtpUser = this.configService.get<string>('SMTP_USER');
    const smtpPass = this.configService.get<string>('SMTP_PASS');

    const isConfigured =
      smtpHost &&
      smtpUser &&
      smtpPass &&
      !smtpUser.includes('your-email') &&
      !smtpPass.includes('your-app-password');

    if (isConfigured) {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: this.configService.get<number>('SMTP_PORT') || 587,
        secure: false,
        auth: { user: smtpUser, pass: smtpPass },
      });

      transporter
        .sendMail({ from: `"Social Impact Platform" <${smtpUser}>`, to, subject, html })
        .then(() => console.log(`[MAIL] Sent "${subject}" to ${to}`))
        .catch((err) => console.error(`[MAIL] Failed to send to ${to}:`, err.message));
    } else {
      console.log(`[DEV - ${devLabel}] ${html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()}`);
    }
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const { email } = forgotPasswordDto;
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      return { message: 'If that email exists, a reset link has been sent.' };
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await this.usersService.saveResetToken(String(user._id), token, expires);

    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3001';
    const resetUrl = `${frontendUrl}/reset-password?token=${token}`;

    this.sendEmail(
      user.email,
      'Password Reset Request',
      `<p>Hello ${user.name},</p>
       <p>Click the link below to reset your password (valid for 1 hour):</p>
       <p><a href="${resetUrl}">${resetUrl}</a></p>
       <p>If you did not request this, ignore this email.</p>`,
      `RESET URL for ${email}: ${resetUrl}`,
    );

    return { message: 'If that email exists, a reset link has been sent.' };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const { token, newPassword } = resetPasswordDto;

    const user = await this.usersService.findByResetToken(token);

    if (!user) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    await this.usersService.update(String(user._id), { password: newPassword });
    await this.usersService.clearResetToken(String(user._id));

    return { message: 'Password reset successfully' };
  }

  async inviteUser(inviteUserDto: InviteUserDto) {
    const user = await this.usersService.create({
      name: inviteUserDto.name,
      email: inviteUserDto.email,
      role: inviteUserDto.role || UserRole.STAFF,
      phone: inviteUserDto.phone,
      status: UserStatus.PENDING,
    });

    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await this.usersService.saveInvitationToken(String(user._id), token, expires);

    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3001';
    const activationUrl = `${frontendUrl}/activate?token=${token}`;

    this.sendEmail(
      user.email,
      'You have been invited to join the platform',
      `<p>Hello ${user.name},</p>
       <p>You have been invited to join the Social Impact Platform.</p>
       <p>Click the link below to activate your account and set your password (valid for 7 days):</p>
       <p><a href="${activationUrl}">${activationUrl}</a></p>
       <p>If you did not expect this invitation, you can ignore this email.</p>`,
      `ACTIVATION URL for ${user.email}: ${activationUrl}`,
    );

    return { message: 'Invitation sent successfully', userId: user._id };
  }

  async activateAccount(activateAccountDto: ActivateAccountDto) {
    const { token, password } = activateAccountDto;

    const user = await this.usersService.findByInvitationToken(token);

    if (!user) {
      throw new BadRequestException('Invalid or expired invitation link');
    }

    await this.usersService.update(String(user._id), {
      password,
      status: UserStatus.ACTIVE,
    });
    await this.usersService.clearInvitationToken(String(user._id));

    const activatedUser = await this.usersService.findByEmail(user.email);
    return this.generateTokens(activatedUser);
  }
}
