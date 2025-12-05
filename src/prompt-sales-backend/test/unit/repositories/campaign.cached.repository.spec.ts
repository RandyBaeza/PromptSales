// test/unit/repositories/campaign.cached.repository.spec.ts
import { Test } from '@nestjs/testing';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

// USAR REQUIRE en lugar de import - esto SIEMPRE funciona
import { CampaignCachedRepository } from '../../../src/modules/campaigns/repositories/campaign.cached.repository';

// Mocks
const mockDecoratedRepository = {
  findById: jest.fn(),
  create: jest.fn(),
  findAll: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  getActiveCampaigns: jest.fn(),
  countByOrganization: jest.fn(),
  findByOrganization: jest.fn(),
  existsByName: jest.fn(),
};

const mockCacheManager = {
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
};

describe('CampaignCachedRepository - Unit Test', () => {
  let cachedRepository: any;

  beforeEach(async () => {
    // Limpiar mocks
    jest.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        CampaignCachedRepository,
        {
          provide: 'ICampaignRepository',
          useValue: mockDecoratedRepository,
        },
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
      ],
    }).compile();

    cachedRepository = moduleRef.get(CampaignCachedRepository);
  });

  // ========== TESTS REALES ==========

  describe('findById', () => {
    it('should return from cache when cache hit (Redis mock)', async () => {
      // Arrange
      const campaignId = 1;
      const mockCampaign = {
        id: campaignId,
        name: 'Cached Campaign',
        organizationId: 100,
      };

      // Mock Redis hit
      mockCacheManager.get.mockResolvedValue(mockCampaign);

      // Act
      const result = await cachedRepository.findById(campaignId);

      // Assert
      expect(result).toEqual(mockCampaign);
      expect(mockCacheManager.get).toHaveBeenCalledWith('campaign:findById:1');
      expect(mockDecoratedRepository.findById).not.toHaveBeenCalled(); // No DB call
    });

    it('should fetch from database and cache when cache miss', async () => {
      // Arrange
      const campaignId = 1;
      const dbCampaign = {
        id: campaignId,
        name: 'DB Campaign',
        organizationId: 100,
        description: 'From database',
        enabled: true,
        deleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock Redis miss -> DB hit
      mockCacheManager.get.mockResolvedValue(null);
      mockDecoratedRepository.findById.mockResolvedValue(dbCampaign);

      // Act
      const result = await cachedRepository.findById(campaignId);

      // Assert
      expect(result).toEqual(dbCampaign);
      expect(mockCacheManager.get).toHaveBeenCalledWith('campaign:findById:1');
      expect(mockDecoratedRepository.findById).toHaveBeenCalledWith(campaignId);
      expect(mockCacheManager.set).toHaveBeenCalledWith(
        'campaign:findById:1',
        expect.any(Object), // Objecto preparado para cache
        300000, // 300 segundos * 1000 ms
      );
    });

    it('should handle cache errors with fallback to database', async () => {
      // Arrange
      const campaignId = 1;
      const dbCampaign = { id: campaignId, name: 'Fallback Campaign' };
      const cacheError = new Error('Redis connection failed');

      // Mock Redis error
      mockCacheManager.get.mockRejectedValue(cacheError);
      mockDecoratedRepository.findById.mockResolvedValue(dbCampaign);

      // Act
      const result = await cachedRepository.findById(campaignId);

      // Assert
      expect(result).toEqual(dbCampaign);
      expect(mockDecoratedRepository.findById).toHaveBeenCalledWith(campaignId);
      // Aunque Redis falló, el repositorio aún funciona
    });
  });

  describe('create', () => {
    it('should validate required fields before creating', async () => {
      // Arrange
      const invalidCampaign = {
        description: 'Missing name and organizationId',
      };

      // Act & Assert
      await expect(cachedRepository.create(invalidCampaign)).rejects.toThrow(
        'Name and organizationId are required',
      );

      expect(mockDecoratedRepository.create).not.toHaveBeenCalled();
      expect(mockCacheManager.del).not.toHaveBeenCalled();
    });

    it('should create campaign and invalidate cache (write-through pattern)', async () => {
      // Arrange
      const newCampaignData = {
        name: 'New Campaign',
        organizationId: 100,
        description: 'Test campaign',
      };

      const createdCampaign = {
        id: 2,
        ...newCampaignData,
        enabled: true,
        deleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockDecoratedRepository.create.mockResolvedValue(createdCampaign);

      // Act
      const result = await cachedRepository.create(newCampaignData);

      // Assert
      expect(result).toEqual(createdCampaign);
      expect(mockDecoratedRepository.create).toHaveBeenCalledWith(
        newCampaignData,
      );
      expect(mockCacheManager.del).toHaveBeenCalled(); // Cache invalidation
    });
  });

  describe('update', () => {
    it('should update campaign and invalidate specific cache keys', async () => {
      // Arrange
      const campaignId = 1;
      const updateData = { name: 'Updated Name' };
      const updatedCampaign = { id: campaignId, ...updateData };

      mockDecoratedRepository.update.mockResolvedValue(updatedCampaign);

      // Act
      const result = await cachedRepository.update(campaignId, updateData);

      // Assert
      expect(result).toEqual(updatedCampaign);
      expect(mockDecoratedRepository.update).toHaveBeenCalledWith(
        campaignId,
        updateData,
      );
      expect(mockCacheManager.del).toHaveBeenCalledWith(
        `campaign:findById:${campaignId}`,
      );
    });
  });

  describe('delete', () => {
    it('should delete campaign and clear related cache', async () => {
      // Arrange
      const campaignId = 1;
      mockDecoratedRepository.delete.mockResolvedValue(undefined);

      // Act
      await cachedRepository.delete(campaignId);

      // Assert
      expect(mockDecoratedRepository.delete).toHaveBeenCalledWith(campaignId);
      expect(mockCacheManager.del).toHaveBeenCalledWith(
        `campaign:findById:${campaignId}`,
      );
    });
  });

  describe('Cache key generation', () => {
    it('should generate consistent cache keys', () => {
      // Para probar método privado
      const repo = cachedRepository;

      const key1 = repo.generateCacheKey('findById', 1);
      const key2 = repo.generateCacheKey('findById', 1);

      expect(key1).toBe(key2);
      expect(key1).toContain('campaign:findById:1');
    });

    it('should handle complex filters in cache keys', () => {
      const repo = cachedRepository;

      const filter = { organizationId: 100, enabled: true };
      const key = repo.generateCacheKey('findAll', filter);

      expect(key).toContain('campaign:findAll');
      expect(key).toContain('organizationId:100');
      expect(key).toContain('enabled:true');
    });
  });
});
