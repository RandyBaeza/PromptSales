import { Module, DynamicModule, Scope } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Campaign } from './entities/campaign.entity';
import { CampaignController } from './campaign.controller';
import { CampaignService } from './campaign.service';
import { Organization } from './entities/organization.entity';

// Repositorios
import { CampaignOrmRepository } from './repositories/campaign.orm.repository';
import { CampaignSpRepository } from './repositories/campaign.sp.repository';
import { CampaignCachedRepository } from './repositories/campaign.cached.repository'; // ← AÑADIR ESTA LÍNEA
import { ICampaignRepository } from './repositories/campaign.repository.interface';

@Module({})
export class CampaignsModule {
  // ACTUALIZAR: Agregar 'cached' a las opciones
  static forRoot(strategy: 'orm' | 'sp' | 'cached' = 'orm'): DynamicModule {
    // Determinar qué repositorio usar basado en la estrategia
    let repositoryProvider;

    switch (strategy) {
      case 'sp':
        repositoryProvider = {
          provide: 'ICampaignRepository',
          useClass: CampaignSpRepository,
        };
        break;

      case 'cached': // ← AÑADIR ESTE CASO
        repositoryProvider = {
          provide: 'ICampaignRepository',
          useFactory: (ormRepo: CampaignOrmRepository, cacheManager: any) => {
            return new CampaignCachedRepository(ormRepo, cacheManager);
          },
          inject: [CampaignOrmRepository, 'CACHE_MANAGER'],
          scope: Scope.REQUEST, // Opcional
        };
        break;

      case 'orm':
      default:
        repositoryProvider = {
          provide: 'ICampaignRepository',
          useClass: CampaignOrmRepository,
        };
        break;
    }

    return {
      module: CampaignsModule,
      imports: [TypeOrmModule.forFeature([Campaign, Organization])],
      controllers: [CampaignController],
      providers: [
        CampaignService,
        CampaignOrmRepository,
        CampaignSpRepository,
        CampaignCachedRepository, // ← AÑADIR AL ARRAY DE PROVIDERS
        repositoryProvider,
      ],
      exports: [CampaignService],
    };
  }
}
