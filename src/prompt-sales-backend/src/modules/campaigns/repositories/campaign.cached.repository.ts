import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { Campaign } from '../entities/campaign.entity';
import type { ICampaignRepository } from './campaign.repository.interface';
import { CampaignFilter } from './campaign.repository.interface';

@Injectable()
export class CampaignCachedRepository implements ICampaignRepository {
  private readonly CACHE_TTL = 300; // 5 minutos en segundos
  private readonly CACHE_PREFIX = 'campaign:';

  constructor(
    @Inject('ICampaignRepository')
    private readonly decoratedRepository: any,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  private generateCacheKey(method: string, ...args: any[]): string {
    const argsHash = args
      .filter((arg) => arg !== undefined && arg !== null)
      .map((arg) => {
        if (typeof arg === 'object') {
          // Para objetos, crear hash consistente
          return JSON.stringify(arg);
        }
        // Para números y strings, usar directamente sin JSON.stringify
        return String(arg);
      })
      .join(':');

    // Remover comillas que JSON.stringify pueda añadir
    const cleanHash = argsHash.replace(/"/g, '');

    return `${this.CACHE_PREFIX}${method}:${cleanHash || 'all'}`;
  }
  async findById(id: number): Promise<Campaign | null> {
    // Usar la misma clave que en TestController
    const cacheKey = `campaign:findById:${id}`;

    console.log(`🔍 [CACHE REPO] Key being used: '${cacheKey}'`);

    try {
      // PRIMERO: Verificar que cacheManager funciona
      console.log(`🧪 [CACHE REPO] Testing cache manager...`);
      await this.cacheManager.set('repo:test', 'working', 1000); // 1000ms = 1 segundo
      const testResult = await this.cacheManager.get('repo:test');
      console.log(`🧪 [CACHE REPO] Cache test: ${testResult ? 'OK' : 'FAIL'}`);

      // SEGUNDO: Intentar obtener con nuestra clave
      console.log(`🔎 [CACHE REPO] Getting key: '${cacheKey}'`);
      const cached = await this.cacheManager.get<Campaign>(cacheKey);

      if (cached) {
        console.log(`✅ [CACHE HIT] ${cacheKey}`);
        return cached;
      }

      console.log(`❌ [CACHE MISS] ${cacheKey} - Key not found in Redis`);

      // Obtener del repositorio decorado
      const campaign = await this.decoratedRepository.findById(id);

      // Almacenar en caché si existe
      if (campaign) {
        console.log(
          `🗄️ [DB FOUND] Campaign: ${campaign.id} - ${campaign.name}`,
        );

        // IMPORTANTE: Crear objeto plano para cache
        const cacheData = this.prepareForCache(campaign);

        console.log(`💾 [CACHE SET] Setting: ${cacheKey}`);
        console.log(`💾 [CACHE SET] TTL: ${this.CACHE_TTL} seconds`);

        // AQUÍ ESTÁ LA CLAVE: cache-manager espera MILISEGUNDOS
        // this.CACHE_TTL = 300 (segundos) * 1000 = 300,000 (milisegundos)
        await this.cacheManager.set(cacheKey, cacheData, this.CACHE_TTL * 1000);
        console.log(
          `✅ [CACHE SET] Successfully cached for ${this.CACHE_TTL}s`,
        );
      }

      return campaign;
    } catch (error) {
      console.error('❌ Cache error in findById:', error.message);
      // Fallback al repositorio original
      return this.decoratedRepository.findById(id);
    }
  }

  private prepareForCache(campaign: Campaign): any {
    // Crear objeto plano, serializable
    return {
      id: campaign.id,
      organizationId: campaign.organizationId,
      name: campaign.name,
      description: campaign.description,
      enabled: campaign.enabled,
      deleted: campaign.deleted,
      createdAt: campaign.createdAt,
      updatedAt: campaign.updatedAt,
      endsAt: campaign.endsAt,
      checksum: campaign.checksum,
    };
  }

  async findAll(filter?: CampaignFilter): Promise<Campaign[]> {
    const cacheKey = this.generateCacheKey('findAll', filter);

    try {
      const cached = await this.cacheManager.get<Campaign[]>(cacheKey);
      if (cached) {
        console.log(`✅ [CACHE HIT] ${cacheKey}`);
        return cached;
      }

      console.log(`❌ [CACHE MISS] ${cacheKey}`);
      const campaigns = await this.decoratedRepository.findAll(filter);

      await this.cacheManager.set(cacheKey, campaigns, this.CACHE_TTL * 1000);
      console.log(`💾 [CACHE SET] ${cacheKey}`);

      return campaigns;
    } catch (error) {
      console.error('❌ Cache error in findAll:', error);
      return this.decoratedRepository.findAll(filter);
    }
  }

  async create(campaign: Partial<Campaign>): Promise<Campaign> {
    try {
      // Validar campos requeridos
      if (!campaign.name || !campaign.organizationId) {
        throw new Error('Name and organizationId are required');
      }

      const newCampaign = await this.decoratedRepository.create(campaign);

      // Invalidar cachés relevantes
      await this.invalidateRelevantCaches();
      console.log('🗑️ [CACHE INVALIDATED] After create');

      return newCampaign;
    } catch (error) {
      console.error('❌ Cache error in create:', error);
      throw error;
    }
  }

  async update(id: number, campaign: Partial<Campaign>): Promise<Campaign> {
    try {
      const updatedCampaign = await this.decoratedRepository.update(
        id,
        campaign,
      );

      // Invalidar cachés específicos de forma más simple
      await this.cacheManager.del(`campaign:findById:${id}`);
      await this.invalidateRelevantCaches();

      console.log(`🗑️ [CACHE INVALIDATED] Campaign ${id} updated`);

      return updatedCampaign;
    } catch (error) {
      console.error('❌ Cache error in update:', error);
      throw error;
    }
  }

  async delete(id: number): Promise<void> {
    try {
      await this.decoratedRepository.delete(id);

      // Invalidar cachés de forma simple
      await this.cacheManager.del(`campaign:findById:${id}`);
      await this.invalidateRelevantCaches();

      console.log(`🗑️ [CACHE INVALIDATED] Campaign ${id} deleted`);
    } catch (error) {
      console.error('❌ Cache error in delete:', error);
      throw error;
    }
  }

  async getActiveCampaigns(): Promise<Campaign[]> {
    const cacheKey = this.generateCacheKey('getActiveCampaigns');

    try {
      const cached = await this.cacheManager.get<Campaign[]>(cacheKey);
      if (cached) {
        console.log(`✅ [CACHE HIT] ${cacheKey}`);
        return cached;
      }

      console.log(`❌ [CACHE MISS] ${cacheKey}`);
      const campaigns = await this.decoratedRepository.getActiveCampaigns();

      await this.cacheManager.set(cacheKey, campaigns, this.CACHE_TTL * 1000);
      console.log(`💾 [CACHE SET] ${cacheKey}`);

      return campaigns;
    } catch (error) {
      console.error('❌ Cache error in getActiveCampaigns:', error);
      return this.decoratedRepository.getActiveCampaigns();
    }
  }

  async countByOrganization(organizationId: number): Promise<number> {
    const cacheKey = this.generateCacheKey(
      'countByOrganization',
      organizationId,
    );

    try {
      const cached = await this.cacheManager.get<number>(cacheKey);
      if (cached !== undefined && cached !== null) {
        console.log(`✅ [CACHE HIT] ${cacheKey}`);
        return cached;
      }

      console.log(`❌ [CACHE MISS] ${cacheKey}`);
      const count =
        await this.decoratedRepository.countByOrganization(organizationId);

      await this.cacheManager.set(cacheKey, count, this.CACHE_TTL * 1000);
      console.log(`💾 [CACHE SET] ${cacheKey}`);

      return count;
    } catch (error) {
      console.error('❌ Cache error in countByOrganization:', error);
      return this.decoratedRepository.countByOrganization(organizationId);
    }
  }

  async findByOrganization(organizationId: number): Promise<Campaign[]> {
    const cacheKey = this.generateCacheKey(
      'findByOrganization',
      organizationId,
    );

    try {
      const cached = await this.cacheManager.get<Campaign[]>(cacheKey);
      if (cached) {
        console.log(`✅ [CACHE HIT] ${cacheKey}`);
        return cached;
      }

      console.log(`❌ [CACHE MISS] ${cacheKey}`);
      const campaigns =
        await this.decoratedRepository.findByOrganization(organizationId);

      await this.cacheManager.set(cacheKey, campaigns, this.CACHE_TTL * 1000);
      console.log(`💾 [CACHE SET] ${cacheKey}`);

      return campaigns;
    } catch (error) {
      console.error('❌ Cache error in findByOrganization:', error);
      return this.decoratedRepository.findByOrganization(organizationId);
    }
  }

  async existsByName(name: string, organizationId: number): Promise<boolean> {
    // No cacheamos validaciones para mantener datos frescos
    return this.decoratedRepository.existsByName(name, organizationId);
  }

  private async invalidateRelevantCaches(): Promise<void> {
    try {
      console.log('🗑️ [CACHE INVALIDATE] Invalidating cache...');

      // Solo invalidar las keys más importantes
      const keysToDelete = [
        `${this.CACHE_PREFIX}findAll:all`,
        `${this.CACHE_PREFIX}findAll:{includeDeleted:false}`,
        `${this.CACHE_PREFIX}findAll:{includeDeleted:true}`,
        `${this.CACHE_PREFIX}getActiveCampaigns:all`,
      ];

      for (const key of keysToDelete) {
        try {
          await this.cacheManager.del(key);
          console.log(`🗑️ Deleted: ${key}`);
        } catch (error) {
          // Ignorar errores de keys que no existen
        }
      }

      console.log('🗑️ [CACHE INVALIDATE] Cache invalidation complete');
    } catch (error) {
      console.error(
        '❌ Cache invalidation error (non-critical):',
        error.message,
      );
    }
  }
  // Método para diagnóstico
  // Método para diagnóstico

  async debugCacheKey(id: number): Promise<any> {
    const cacheKey = `campaign:findById:${id}`;
    const generatedKey = this.generateCacheKey('findById', id);

    console.log('\n'.repeat(2));
    console.log('='.repeat(60));
    console.log('🔍 CACHE KEY DIAGNOSIS');
    console.log('='.repeat(60));
    console.log(`ID: ${id}`);
    console.log(`Simple key: '${cacheKey}'`);
    console.log(`Generated key: '${generatedKey}'`);
    console.log(`Keys match: ${cacheKey === generatedKey}`);

    // Verificar en Redis
    const simpleResult = await this.cacheManager.get(cacheKey);
    const generatedResult = await this.cacheManager.get(generatedKey);

    return {
      simpleKey: cacheKey,
      generatedKey: generatedKey,
      keysMatch: cacheKey === generatedKey,
      simpleKeyExists: !!simpleResult,
      generatedKeyExists: !!generatedResult,
      simpleKeyValue: simpleResult,
      generatedKeyValue: generatedResult,
    };
  }
  async getCacheStats(): Promise<any> {
    try {
      // Obtener el cliente Redis subyacente
      const redisClient = (this.cacheManager as any).store.getClient();

      if (!redisClient || typeof redisClient.keys !== 'function') {
        return { error: 'Redis client not available' };
      }

      const keys = await new Promise<string[]>((resolve, reject) => {
        redisClient.keys('*', (err: any, result: string[]) => {
          if (err) {
            reject(err);
          } else {
            resolve(result || []);
          }
        });
      });

      const campaignKeys = keys.filter((key) =>
        key.startsWith(this.CACHE_PREFIX),
      );

      return {
        totalKeys: keys.length,
        campaignKeys: campaignKeys.length,
        campaignKeyExamples: campaignKeys.slice(0, 5),
      };
    } catch (error) {
      console.error('❌ Error getting cache stats:', error);
      return { error: error.message };
    }
  }
}
