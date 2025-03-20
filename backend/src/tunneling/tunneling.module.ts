import { Module } from '@nestjs/common';
import { TunnelingService } from './tunneling.service';
import { TunnelingController } from './tunneling.controller';
import { SshTunnelingService } from './ssh-tunneling.service';

@Module({
  controllers: [TunnelingController],
  providers: [TunnelingService, SshTunnelingService],
  exports: [TunnelingService, SshTunnelingService],
})
export class TunnelingModule {}