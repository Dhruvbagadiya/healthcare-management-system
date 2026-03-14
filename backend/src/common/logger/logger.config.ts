import { WinstonModule, utilities } from 'nest-winston';
import * as winston from 'winston';

const isProduction = process.env.NODE_ENV === 'production';

export const winstonConfig = WinstonModule.createLogger({
  transports: [
    new winston.transports.Console({
      level: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),
      format: isProduction
        ? winston.format.combine(
            winston.format.timestamp(),
            winston.format.json(),
          )
        : winston.format.combine(
            winston.format.timestamp(),
            utilities.format.nestLike('Aarogentix', {
              prettyPrint: true,
              colors: true,
            }),
          ),
    }),
  ],
});
