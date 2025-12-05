// test/integration/api/campaign/campaigns.post.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { CampaignController } from '../../../../src/modules/campaigns/campaign.controller';
import { CampaignService } from '../../../../src/modules/campaigns/campaign.service';
import { ICampaignRepository } from '../../../../src/modules/campaigns/repositories/campaign.repository.interface';

const request = require('supertest');

describe('Campaigns API - POST /campaigns', () => {
  let app: INestApplication;
  let campaignRepository: jest.Mocked<ICampaignRepository>;

  // Mock data
  const mockCreatedCampaign = {
    id: 3,
    organizationId: 200,
    name: 'New Year Sale 2025',
    description: 'Start the year with great offers',
    enabled: true,
    deleted: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    endsAt: new Date('2025-01-31T23:59:59.999Z'),
    checksum: null,
    organization: {
      id: 200,
      name: 'New Year Retail',
      legalName: 'New Year Retail Legal',
      email: 'info@newyearretail.com',
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

  describe('POST /campaigns', () => {
    const validCampaignData = {
      name: 'New Year Sale 2025',
      organizationId: 200,
      description: 'Start the year with great offers',
      endsAt: '2025-01-31T23:59:59.999Z',
    };

    it('should create campaign and return 201 Created', async () => {
      // Arrange
      campaignRepository.existsByName.mockResolvedValue(false);
      campaignRepository.create.mockResolvedValue(mockCreatedCampaign as any);

      // Act
      const response = await request(app.getHttpServer())
        .post('/campaigns')
        .send(validCampaignData)
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)
        .expect(201);

      // Assert
      expect(response.body.id).toBe(3);
      expect(response.body.name).toBe('New Year Sale 2025');
      expect(campaignRepository.create).toHaveBeenCalled();
      expect(campaignRepository.existsByName).toHaveBeenCalledWith(
        'New Year Sale 2025',
        200,
      );
    });

    it('should return 400 Bad Request for invalid data', async () => {
      // Arrange
      const invalidData = {
        description: 'Missing name and organizationId',
      };

      // Act & Assert
      await request(app.getHttpServer())
        .post('/campaigns')
        .send(invalidData)
        .set('Content-Type', 'application/json')
        .expect(400);
    });

    // Tests adicionales para cubrir todas las validaciones
    it('should return 400 when name is missing', async () => {
      const invalidData = {
        organizationId: 200,
        description: 'Missing name',
      };

      await request(app.getHttpServer())
        .post('/campaigns')
        .send(invalidData)
        .set('Content-Type', 'application/json')
        .expect(400);
    });

    it('should return 400 when organizationId is missing', async () => {
      const invalidData = {
        name: 'Campaign without org',
        description: 'Missing organizationId',
      };

      await request(app.getHttpServer())
        .post('/campaigns')
        .send(invalidData)
        .set('Content-Type', 'application/json')
        .expect(400);
    });

    it('should return 400 when name is empty string', async () => {
      const invalidData = {
        name: '',
        organizationId: 200,
        description: 'Empty name',
      };

      await request(app.getHttpServer())
        .post('/campaigns')
        .send(invalidData)
        .set('Content-Type', 'application/json')
        .expect(400);
    });

    it('should return 400 when name is only whitespace', async () => {
      const invalidData = {
        name: '   ',
        organizationId: 200,
        description: 'Whitespace name',
      };

      await request(app.getHttpServer())
        .post('/campaigns')
        .send(invalidData)
        .set('Content-Type', 'application/json')
        .expect(400);
    });

    it('should return 400 when organizationId is 0', async () => {
      const invalidData = {
        name: 'Test Campaign',
        organizationId: 0,
        description: 'Zero org ID',
      };

      await request(app.getHttpServer())
        .post('/campaigns')
        .send(invalidData)
        .set('Content-Type', 'application/json')
        .expect(400);
    });

    it('should return 400 when organizationId is negative', async () => {
      const invalidData = {
        name: 'Test Campaign',
        organizationId: -1,
        description: 'Negative org ID',
      };

      await request(app.getHttpServer())
        .post('/campaigns')
        .send(invalidData)
        .set('Content-Type', 'application/json')
        .expect(400);
    });

    it('should return 409 Conflict when campaign name already exists', async () => {
      // Arrange
      campaignRepository.existsByName.mockResolvedValue(true);

      // Act & Assert
      await request(app.getHttpServer())
        .post('/campaigns')
        .send(validCampaignData)
        .set('Content-Type', 'application/json')
        .expect(409)
        .expect((res) => {
          expect(res.body.message).toContain('already exists');
        });
    });
  });
});
