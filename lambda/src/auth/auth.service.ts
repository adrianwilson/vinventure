import { Injectable, UnauthorizedException, ConflictException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { DatabaseService } from '../database/database.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UserRole, Prisma } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private database: DatabaseService,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { email, password, name, phone } = registerDto;

    // Check if user already exists
    const existingUser = await this.database.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // For now, we'll use email as cognitoUid until we properly integrate AWS Cognito
    const cognitoUid = `local_${email}`;

    // Create user
    const user = await this.database.user.create({
      data: {
        cognitoUid,
        email,
        password: hashedPassword,
        name,
        phone,
        role: UserRole.GUEST,
      },
    });

    // Generate JWT token
    const payload = { 
      sub: user.id, 
      cognitoUid: user.cognitoUid, 
      email: user.email, 
      role: user.role 
    };
    
    const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

    return {
      user: {
        id: user.id,
        cognitoUid: user.cognitoUid,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role,
        avatarUrl: user.avatarUrl,
      },
      accessToken,
      refreshToken,
    };
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // Find user by email
    const user = await this.database.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Cognito-only users don't have a local password
    if (!user.password) {
      throw new UnauthorizedException('This account uses Cognito authentication. Local login is not available.');
    }

    // Verify password against stored hash
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate JWT token
    const payload = { 
      sub: user.id, 
      cognitoUid: user.cognitoUid, 
      email: user.email, 
      role: user.role 
    };
    
    const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

    return {
      user: {
        id: user.id,
        cognitoUid: user.cognitoUid,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role,
        avatarUrl: user.avatarUrl,
      },
      accessToken,
      refreshToken,
    };
  }

  async getProfile(userId: string) {
    const user = await this.database.user.findUnique({
      where: { id: userId },
      include: {
        favoriteWineries: {
          include: {
            winery: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      id: user.id,
      cognitoUid: user.cognitoUid,
      email: user.email,
      name: user.name,
      phone: user.phone,
      role: user.role,
      avatarUrl: user.avatarUrl,
      preferences: user.preferences,
      favoriteWineries: user.favoriteWineries.map(fav => fav.winery),
      createdAt: user.createdAt,
    };
  }

  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto) {
    const user = await this.database.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updatedUser = await this.database.user.update({
      where: { id: userId },
      data: {
        name: updateProfileDto.name ?? user.name,
        phone: updateProfileDto.phone ?? user.phone,
        avatarUrl: updateProfileDto.avatarUrl ?? user.avatarUrl,
        preferences: updateProfileDto.preferences !== undefined
          ? (updateProfileDto.preferences as Prisma.InputJsonValue)
          : user.preferences !== null ? (user.preferences as Prisma.InputJsonValue) : undefined,
      },
    });

    return {
      id: updatedUser.id,
      cognitoUid: updatedUser.cognitoUid,
      email: updatedUser.email,
      name: updatedUser.name,
      phone: updatedUser.phone,
      role: updatedUser.role,
      avatarUrl: updatedUser.avatarUrl,
      preferences: updatedUser.preferences,
    };
  }

  async verifyToken(token: string) {
    try {
      const payload = this.jwtService.verify(token);
      return payload;
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken);
      
      // Generate new access token
      const newPayload = { 
        sub: payload.sub, 
        cognitoUid: payload.cognitoUid, 
        email: payload.email, 
        role: payload.role 
      };
      
      const accessToken = this.jwtService.sign(newPayload, { expiresIn: '15m' });
      
      return {
        accessToken,
        refreshToken, // Keep the same refresh token
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async addToFavorites(userId: string, wineryId: string) {
    // Check if winery exists
    const winery = await this.database.winery.findUnique({
      where: { id: wineryId },
    });

    if (!winery) {
      throw new NotFoundException('Winery not found');
    }

    // Check if already favorited
    const existingFavorite = await this.database.favoriteWinery.findUnique({
      where: { userId_wineryId: { userId, wineryId } },
    });

    if (existingFavorite) {
      throw new ConflictException('Winery already in favorites');
    }

    return this.database.favoriteWinery.create({
      data: { userId, wineryId },
      include: { winery: true },
    });
  }

  async removeFromFavorites(userId: string, wineryId: string) {
    const favorite = await this.database.favoriteWinery.findUnique({
      where: { userId_wineryId: { userId, wineryId } },
    });

    if (!favorite) {
      throw new NotFoundException('Favorite not found');
    }

    await this.database.favoriteWinery.delete({
      where: { id: favorite.id },
    });

    return { message: 'Removed from favorites' };
  }

  async getFavorites(userId: string) {
    const favorites = await this.database.favoriteWinery.findMany({
      where: { userId },
      include: { winery: true },
      orderBy: { createdAt: 'desc' },
    });

    return favorites.map(fav => fav.winery);
  }

  // TEMPORARY: Remove this in production
  async updateUserRole(userId: string, role: UserRole) {
    const user = await this.database.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updatedUser = await this.database.user.update({
      where: { id: userId },
      data: { role },
    });

    return {
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      role: updatedUser.role,
      message: `Role updated to ${role}`,
    };
  }
}