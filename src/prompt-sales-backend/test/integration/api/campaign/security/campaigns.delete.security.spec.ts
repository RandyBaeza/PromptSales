// test/integration/api/campaign/security/campaigns.delete.security.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { CampaignController } from '../../../../../src/modules/campaigns/campaign.controller';
import { CampaignService } from '../../../../../src/modules/campaigns/campaign.service';
import { ICampaignRepository } from '../../../../../src/modules/campaigns/repositories/campaign.repository.interface';

const request = require('supertest');

describe('Campaigns API - DELETE /campaigns/:id (Security Tests)', () => {
  let app: INestApplication;
  let campaignRepository: jest.Mocked<ICampaignRepository>;

  // Mock data para una campaña existente
  const mockCampaign = {
    id: 1,
    organizationId: 100,
    name: 'Test Campaign',
    description: 'Test Description',
    enabled: true,
    deleted: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    endsAt: null,
    checksum: null,
  };

  beforeAll(async () => {
    // Mock del repositorio
    campaignRepository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      getActiveCampaigns: jest.fn(),
      countByOrganization: jest.fn(),
      findByOrganization: jest.fn(),
      existsByName: jest.fn(),
    };

    const campaignService = new CampaignService(campaignRepository);

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [CampaignController],
      providers: [{ provide: CampaignService, useValue: campaignService }],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    // Por defecto, simular que la campaña existe
    campaignRepository.findById.mockResolvedValue(mockCampaign as any);
    campaignRepository.delete.mockResolvedValue(undefined);
  });

  describe('Security Permission Validation', () => {
    describe('GRANT Access Tests', () => {
      it('should GRANT access when user has admin role (204 No Content)', async () => {
        // Act & Assert
        await request(app.getHttpServer())
          .delete('/campaigns/1')
          .set('x-user-role', 'admin') // ← ROL CORRECTO
          .expect(204); // ✅ GRANT - Acceso concedido

        // Verificar que se llamó al servicio
        expect(campaignRepository.delete).toHaveBeenCalledWith(1);
      });

      it('should GRANT access when user has ADMIN role (case insensitive)', async () => {
        // Act & Assert
        await request(app.getHttpServer())
          .delete('/campaigns/1')
          .set('x-user-role', 'ADMIN') // ← Mayúsculas
          .expect(204); // ✅ GRANT

        expect(campaignRepository.delete).toHaveBeenCalledWith(1);
      });
    });

    describe('REJECT Access Tests', () => {
      it('should REJECT access when user has user role (403 Forbidden)', async () => {
        // Act & Assert
        await request(app.getHttpServer())
          .delete('/campaigns/1')
          .set('x-user-role', 'user') // ← ROL INCORRECTO
          .expect(403) // ✅ REJECT - Acceso denegado
          .expect((res) => {
            expect(res.body.message).toContain('Only users with admin role');
          });

        // Verificar que NO se llamó al servicio
        expect(campaignRepository.delete).not.toHaveBeenCalled();
      });

      it('should REJECT access when no role is provided (403 Forbidden)', async () => {
        // Act & Assert
        await request(app.getHttpServer())
          .delete('/campaigns/1')
          // ← SIN HEADER x-user-role
          .expect(403) // ✅ REJECT - Acceso denegado
          .expect((res) => {
            expect(res.body.message).toContain('Only users with admin role');
          });

        expect(campaignRepository.delete).not.toHaveBeenCalled();
      });

      it('should REJECT access when role is empty string (403 Forbidden)', async () => {
        // Act & Assert
        await request(app.getHttpServer())
          .delete('/campaigns/1')
          .set('x-user-role', '') // ← ROL VACÍO
          .expect(403); // ✅ REJECT

        expect(campaignRepository.delete).not.toHaveBeenCalled();
      });

      it('should REJECT access when role is "editor" (403 Forbidden)', async () => {
        // Act & Assert
        await request(app.getHttpServer())
          .delete('/campaigns/1')
          .set('x-user-role', 'editor') // ← OTRO ROL
          .expect(403); // ✅ REJECT
      });

      it('should REJECT access when campaign does not exist but role is admin (404 Not Found)', async () => {
        // Arrange: Simular que la campaña no existe
        campaignRepository.findById.mockResolvedValue(null);

        // Act & Assert
        await request(app.getHttpServer())
          .delete('/campaigns/999')
          .set('x-user-role', 'admin') // ← Rol correcto pero recurso no existe
          .expect(404); // Not Found (primero pasa validación de rol, luego falla en servicio)

        // Verificar que se intentó buscar la campaña
        expect(campaignRepository.findById).toHaveBeenCalledWith(999);
      });
    });
  });
});
