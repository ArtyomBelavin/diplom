import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { RoleName as PrismaRoleName } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (existingUser) {
      throw new BadRequestException(
        'Пользователь с таким email уже существует.',
      );
    }

    const userRole = await this.prisma.role.findUnique({
      where: { name: PrismaRoleName.USER },
    });

    if (!userRole) {
      throw new BadRequestException('Роль пользователя не инициализирована.');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        roleId: userRole.id,
        email: dto.email.toLowerCase(),
        passwordHash,
        fullName: dto.fullName,
        phone: dto.phone,
        isActive: true,
        settings: {
          create: {},
        },
      },
      include: {
        role: true,
      },
    });

    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
      role: user.role.name,
    });

    return {
      message:
        'Регистрация прошла успешно. Настройки доступности созданы автоматически.',
      accessToken,
      user: this.serializeUser(user),
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
      include: {
        role: true,
      },
    });

    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Неверный email или пароль.');
    }

    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
      role: user.role.name,
    });

    return {
      message:
        'Вход выполнен. Можно открыть профиль, историю заказов и настройки доступности.',
      accessToken,
      user: this.serializeUser(user),
    };
  }

  private serializeUser(user: {
    id: number;
    email: string;
    fullName: string;
    phone: string | null;
    role: { name: string };
  }) {
    return {
      id: user.id,
      role: user.role.name,
      email: user.email,
      fullName: user.fullName,
      phone: user.phone,
    };
  }
}
