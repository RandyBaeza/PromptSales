// test/integration/api/campaigns/get-campaigns.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { CampaignController } from '../../../../src/modules/campaigns/campaign.controller';
import { CampaignService } from '../../../../src/modules/campaigns/campaign.service';
import { ICampaignRepository } from '../../../../src/modules/campaigns/repositories/campaign.repository.interface';

const request = require('supertest');

describe('Campaigns API - GET /campaigns', () => {
  let app: INestApplication;
  let campaignRepository: jest.Mocked<ICampaignRepository>;

  // Mock data
  const mockCampaign = {
    id: 1,
    organizationId: 100,
    name: 'Summer Sale 2024',
    description: 'Summer promotion campaign',
    enabled: true,
    deleted: false,
    createdAt: new Date('2024-06-01'),
    updatedAt: new Date('2024-06-01'),
    endsAt: new Date('2024-08-31'),
    checksum: null,
    organization: {
      id: 100,
      name: 'Summer Retail Inc.',
      legalName: 'Summer Retail Inc. Legal',
      email: 'info@summerretail.com',
      createdAt: new Date('2024-01-01'),
      organizationStatus: 1,
    },
    isActive: function () {
      return this.enabled && !this.deleted;
    },
    isExpired: function () {
      if (!this.endsAt) return false;
      return new Date() > this.endsAt;
    },
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

    // Crear instancia del servicio con el mock repository
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
  });

  describe('GET /campaigns', () => {
    it('should return 200 OK with campaigns array', async () => {
      // Arrange
      campaignRepository.findAll.mockResolvedValue([mockCampaign] as any);

      // Act
      const response = await request(app.getHttpServer())
        .get('/campaigns') // ← RUTA CORRECTA: /campaigns, NO /api/campaigns
        .expect('Content-Type', /json/)
        .expect(200);

      // Assert
      expect(response.body).toBeInstanceOf(Array);
      expect(response.body[0].name).toBe('Summer Sale 2024');
      expect(campaignRepository.findAll).toHaveBeenCalled();
    });

    it('should apply filters from query parameters', async () => {
      // Arrange
      campaignRepository.findAll.mockResolvedValue([mockCampaign] as any);

      // Act
      const response = await request(app.getHttpServer())
        .get('/campaigns')
        .query({ organizationId: 100, enabled: 'true' })
        .expect(200);

      // Assert
      expect(response.body).toBeInstanceOf(Array);
      expect(campaignRepository.findAll).toHaveBeenCalledWith({
        organizationId: 100,
        enabled: true,
        includeDeleted: false,
      });
    });

    it('should return empty array when no campaigns exist', async () => {
      // Arrange
      campaignRepository.findAll.mockResolvedValue([]);

      // Act
      const response = await request(app.getHttpServer())
        .get('/campaigns')
        .expect(200);

      // Assert
      expect(response.body).toEqual([]);
    });
  });

  describe('GET /campaigns/:id', () => {
    it('should return specific campaign by id', async () => {
      // Arrange
      campaignRepository.findById.mockResolvedValue(mockCampaign as any);

      // Act
      const response = await request(app.getHttpServer())
        .get('/campaigns/1')
        .expect(200);

      // Assert
      expect(response.body.id).toBe(1);
      expect(response.body.name).toBe('Summer Sale 2024');
      expect(campaignRepository.findById).toHaveBeenCalledWith(1);
    });

    it('should return 404 when campaign not found', async () => {
      // Arrange
      campaignRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await request(app.getHttpServer()).get('/campaigns/999').expect(404);
    });
  });

  describe('GET /campaigns/active', () => {
    it('should return active campaigns', async () => {
      // Arrange
      campaignRepository.getActiveCampaigns.mockResolvedValue([
        mockCampaign,
      ] as any);

      // Act
      const response = await request(app.getHttpServer())
        .get('/campaigns/active')
        .expect(200);

      // Assert
      expect(response.body).toBeInstanceOf(Array);
      expect(campaignRepository.getActiveCampaigns).toHaveBeenCalled();
    });
  });
});
