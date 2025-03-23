import { Module } from '@nestjs/common';
import { DatabaseService } from './database.service';
import { DatabaseController } from './database.controller';
import { PrismaService } from '../prisma/prisma.service';
import { DatabaseTunnelingService } from './database-tunneling.service';

@Module({
  providers: [DatabaseService, PrismaService, DatabaseTunnelingService],
  controllers: [DatabaseController]
})
export class DatabaseModule {}
