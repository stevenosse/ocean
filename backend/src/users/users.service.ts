import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { Role } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findOne(id: number) {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async create(createUserDto: CreateUserDto) {
    return this.prisma.user.create({
      data: {
        email: createUserDto.email,
        passwordHash: createUserDto.passwordHash,
        role: Role.USER,
      },
    });
  }

  async createAdmin(createUserDto: CreateUserDto) {
    return this.prisma.user.create({
      data: {
        email: createUserDto.email,
        passwordHash: createUserDto.passwordHash,
        role: Role.ADMIN,
      },
    });
  }

  async countUsers() {
    return this.prisma.user.count();
  }

  async findAll() {
    return this.prisma.user.findMany();
  }
}