import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as bodyParser from 'body-parser';

@Injectable()
export class RawBodyMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    bodyParser.json({
      verify: (req: any, res, buffer) => {
        if (Buffer.isBuffer(buffer)) {
          req.rawBody = buffer;
        }
        return true;
      },
    })(req, res, next);
  }
}
