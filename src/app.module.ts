import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { PrismaService } from './prisma/prisma.service';
import { ConfigModule } from '@nestjs/config';
import { AgentsModule } from './agents/agents.module';
import { MetadataModule } from './metadata/metadata.module';
import { SearchModule } from './search/search.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    AgentsModule,
    MetadataModule,
    SearchModule,
    UsersModule,
  ],
  controllers: [AppController],
  providers: [PrismaService],
})
export class AppModule {}
