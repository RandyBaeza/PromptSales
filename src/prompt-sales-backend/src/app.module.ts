import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager'; // ← DESCOMENTAR ESTA LÍNEA
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CampaignsModule } from './modules/campaigns/campaign.module';
import { TestController } from './test.controller';

@Module({
  imports: [
    // 1. Configuración de variables de entorno
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env.development',
    }),

    // 2. Configuración de TypeORM (PostgreSQL)
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 5432),
        username: configService.get('DB_USERNAME', 'postgres'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_NAME', 'postgres'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: false,
        logging: true,
      }),
      inject: [ConfigService],
    }),

    // 3. CacheModule con Redis - ¡DESCOMENTAR TODO ESTO!
    CacheModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        store: require('cache-manager-redis-store'),
        host: configService.get('REDIS_HOST', 'localhost'),
        port: configService.get<number>('REDIS_PORT', 6379),
        ttl: 300, // 5 minutos en segundos
        // Configuración para Windows Redis
        retry_strategy: function (options) {
          if (options.error && options.error.code === 'ECONNREFUSED') {
            console.error(' Redis server refused connection');
            return new Error('The server refused the connection');
          }
          if (options.total_retry_time > 1000 * 60 * 60) {
            return new Error('Retry time exhausted');
          }
          if (options.attempt > 10) {
            return undefined;
          }
          return Math.min(options.attempt * 100, 3000);
        },
      }),
      inject: [ConfigService],
      isGlobal: true, // Para que esté disponible en toda la aplicación
    }),

    // 4. Módulos de negocio - CAMBIAR A 'cached'
    CampaignsModule.forRoot('cached'), // ← CAMBIAR de 'orm' a 'cached'
  ],
  controllers: [AppController, TestController],
  providers: [AppService],
})
export class AppModule {}
