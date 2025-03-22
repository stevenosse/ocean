import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcrypt';
import { ChangePasswordDto } from './dto/change-password.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) { }

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (user && (await bcrypt.compare(password, user.passwordHash))) {
      const { passwordHash, ...result } = user;
      return result;
    }
    return null;
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Get the complete user data to check forcePasswordChange flag
    const fullUser = await this.usersService.findOne(user.id);

    const payload = { email: user.email, sub: user.id, role: user.role };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        forcePasswordChange: fullUser.forcePasswordChange,
      },
    };
  }

  async register(registerDto: RegisterDto) {
    const existingUser = await this.usersService.findByEmail(registerDto.email);
    if (existingUser) {
      throw new UnauthorizedException('User already exists');
    }

    const userCount = await this.usersService.countUsers();
    if (userCount > 0) {
      throw new UnauthorizedException('Registration is disabled. Please contact an administrator.');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);
    const user = await this.usersService.createAdmin({
      email: registerDto.email,
      passwordHash: hashedPassword,
    }, false);

    const payload = { email: user.email, sub: user.id, role: user.role };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        forcePasswordChange: user.forcePasswordChange,
      },
    };
  }

  async changePassword(userId: number, changePasswordDto: ChangePasswordDto) {
    // Get the user
    const user = await this.usersService.findOne(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(
      changePasswordDto.currentPassword,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Hash the new password
    const newPasswordHash = await bcrypt.hash(changePasswordDto.newPassword, 10);

    // Update the password and reset forcePasswordChange flag
    const updatedUser = await this.usersService.updatePassword(userId, newPasswordHash);

    // Return updated user info without password
    const { passwordHash, ...result } = updatedUser;
    return {
      message: 'Password changed successfully',
      user: {
        id: result.id,
        email: result.email,
        role: result.role,
        forcePasswordChange: result.forcePasswordChange,
      },
    };
  }
}