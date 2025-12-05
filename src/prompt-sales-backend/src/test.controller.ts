import { Controller, Get, Inject, Param, ParseIntPipe } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { InjectConnection } from '@nestjs/typeorm';
import { Connection } from 'typeorm';

@Controller('test')
export class TestController {
  constructor(
    @InjectConnection()
    private connection: Connection,
    @Inject(CACHE_MANAGER) // ← Esto ahora funcionará
    private cacheManager: Cache,
  ) {}

  @Get('database')
  async testDatabase() {
    try {
      // Probar conexión a PostgreSQL
      const result = await this.connection.query('SELECT version() as version');

      // Probar que podemos ejecutar una consulta básica
      const tableCheck = await this.connection.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'campaigns'
        ) as campaigns_table_exists
      `);

      return {
        success: true,
        message: 'PostgreSQL connection successful',
        version: result[0]?.version,
        campaigns_table_exists: tableCheck[0]?.campaigns_table_exists,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        message: 'PostgreSQL connection failed',
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  @Get('cache/debug')
  async debugCache() {
    try {
      const testKey = 'debug:test';
      const testValue = {
        message: 'Test Redis Cache',
        timestamp: new Date().toISOString(),
        number: Math.random(),
      };

      console.log('🔍 [DEBUG] Setting cache...');

      // 1. Guardar en cache
      await this.cacheManager.set(testKey, testValue, 30000);
      console.log('✅ [DEBUG] Cache set successfully');

      // 2. Recuperar inmediatamente
      const retrieved = await this.cacheManager.get(testKey);
      console.log('📦 [DEBUG] Retrieved from cache:', retrieved);

      // 3. Verificar si coinciden
      const match = JSON.stringify(testValue) === JSON.stringify(retrieved);

      return {
        success: true,
        test: 'Redis Cache Debug',
        stored: testValue,
        retrieved: retrieved,
        match: match,
        message: match ? '✅ Redis cache is working!' : '❌ Cache mismatch',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('❌ [DEBUG ERROR]', error);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  @Get('cache/check-campaign/:id')
  async checkCampaignCache(@Param('id', ParseIntPipe) id: number) {
    try {
      const cacheKey = `campaign:findById:${id}`;

      console.log(`🔍 [CACHE CHECK] Checking key: '${cacheKey}'`);

      // 1. Verificar si existe
      const exists = await this.cacheManager.get(cacheKey);

      // 2. Listar todas las claves relacionadas (aproximación)
      console.log(`🔍 [CACHE CHECK] All keys pattern: campaign:*`);

      return {
        success: true,
        cacheKey: cacheKey,
        exists: !!exists,
        value: exists,
        valueType: typeof exists,
        message: exists
          ? '✅ Key exists in cache'
          : '❌ Key NOT found in cache',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('❌ [CHECK ERROR]', error);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  @Get('cache/set-campaign/:id')
  async manuallySetCampaignCache(@Param('id', ParseIntPipe) id: number) {
    try {
      const cacheKey = `campaign:findById:${id}`;

      // Crear datos de prueba
      const testCampaign = {
        id: id,
        name: `Manually Set Campaign ${id}`,
        description: 'This was set manually via API',
        organizationId: 1,
        enabled: true,
        deleted: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        endsAt: null,
      };

      console.log(`💾 [MANUAL SET] Setting key: ${cacheKey}`);
      await this.cacheManager.set(cacheKey, testCampaign, 300);

      // Verificar que se guardó
      const retrieved = await this.cacheManager.get(cacheKey);

      return {
        success: true,
        action: 'Manually set campaign cache',
        cacheKey: cacheKey,
        setData: testCampaign,
        retrievedData: retrieved,
        match: JSON.stringify(testCampaign) === JSON.stringify(retrieved),
        message: '✅ Manually set cache for campaign',
        redisCommand: `Run: redis-cli get "${cacheKey}"`,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('❌ [MANUAL SET ERROR]', error);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  @Get('health')
  async health() {
    const dbHealth = await this.testDatabase();

    return {
      status: dbHealth.success ? 'UP' : 'DOWN',
      timestamp: new Date().toISOString(),
      services: {
        database: {
          status: dbHealth.success ? 'UP' : 'DOWN',
          details: dbHealth,
        },
        redis: {
          status: 'DISABLED',
          message: 'Redis temporarily disabled for initial setup',
        },
      },
      environment: process.env.NODE_ENV || 'development',
      repository_strategy: process.env.REPOSITORY_STRATEGY || 'orm',
      message: ' .env file is now working correctly!',
    };
  }
}
