import { Injectable } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';

@Injectable()
export class ConfigService {
  constructor(private configService: NestConfigService) {}

  get<T>(key: string, defaultValue?: T): T {
    return this.configService.get<T>(key, defaultValue as T) as T;
  }

  get isProduction(): boolean {
    const nodeEnv = this.configService.get<string>('NODE_ENV', 'development');
    return nodeEnv === 'production';
  }

  get port(): number {
    return parseInt(this.configService.get<string>('PORT', '3000'), 10);
  }

  get databaseUrl(): string {
    const dbUrl = this.configService.get<string>('DATABASE_URL');

    if (!dbUrl) {
      throw new Error('DATABASE_URL is not defined');
    }

    return dbUrl;
  }

  get logLevel(): string {
    return this.configService.get<string>('LOG_LEVEL', 'info');
  }
}
