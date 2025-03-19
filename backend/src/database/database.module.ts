import { Module } from '@nestjs/common';
import { DatabaseService } from './database.service';
import { DatabaseController } from './database.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  providers: [DatabaseService, PrismaService],
  controllers: [DatabaseController]
})
export class DatabaseModule {}
