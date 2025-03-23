import { registerAs } from '@nestjs/config';

export default registerAs('server', () => ({
  hostname: process.env.SERVER_HOSTNAME || process.env.HOST || 'api.ocean.local',
  port: parseInt(process.env.PORT, 10) || 3000,
}));
