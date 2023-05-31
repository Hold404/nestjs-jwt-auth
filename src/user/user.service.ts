import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { hash, verify } from 'argon2';
import { User } from '@prisma/client';
import { Response } from 'express';
import { RefreshDto } from './dto/refresh.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService, private jwt: JwtService) {}

  async register(dto: RegisterDto, response: Response) {
    const userByEmail = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    const userByLogin = await this.prisma.user.findUnique({
      where: { login: dto.login },
    });

    if (userByEmail) throw new BadRequestException('Email is taken.');
    if (userByLogin) throw new BadRequestException('Login is taken.');

    const user = await this.prisma.user.create({
      data: {
        login: dto.login,
        email: dto.email,
        password: await hash(dto.password),
      },
    });

    return this.returnFormat(user, response);
  }

  async login(dto: LoginDto, response: Response) {
    const user = await this.prisma.user.findUnique({
      where: { login: dto.login },
    });
    if (!user) throw new NotFoundException('User was not found.');

    if (!(await verify(user.password, dto.password)))
      throw new UnauthorizedException('Wrong password.');

    return this.returnFormat(user, response);
  }

  async refresh(dto: RefreshDto, response: Response) {
    const result = await this.jwt.verifyAsync(dto.refreshToken);
    if (!result) throw new UnauthorizedException('Invalid refresh token.');

    const user = await this.prisma.user.findUnique({
      where: { id: result.id },
    });
    if (!user) throw new NotFoundException('User was not found.');

    return this.returnFormat(user, response);
  }

  async get(userId: string) {
    return await this.prisma.user.findUnique({
      where: { id: +userId },
      select: {
        id: true,
        login: true,
        email: true,
      },
    });
  }

  private async createTokens(userId: number) {
    const data = { id: userId };

    const accessToken = this.jwt.sign(data, {
      expiresIn: '1h',
    });

    const refreshToken = this.jwt.sign(data, {
      expiresIn: '30d',
    });

    return { accessToken, refreshToken };
  }

  private async returnFormat(user: User, response: Response) {
    const { accessToken, refreshToken } = await this.createTokens(user.id);

    response.cookie('accessToken', accessToken);
    response.cookie('refreshToken', refreshToken);

    return {
      id: user.id,
      login: user.login,
      email: user.email,
    };
  }
}
