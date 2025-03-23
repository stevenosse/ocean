import { Module } from '@nestjs/common';
import { DatabaseService } from './database.service';
import { DatabaseController } from './database.controller';
import { PrismaService } from '../prisma/prisma.service';
import { DatabaseTunnelingService } from './database-tunneling.service';
import { AutoTunnelManagerService } from './auto-tunnel-manager.service';

@Module({
  providers: [DatabaseService, PrismaService, DatabaseTunnelingService, AutoTunnelManagerService],
  controllers: [DatabaseController]
})
export class DatabaseModule {}
