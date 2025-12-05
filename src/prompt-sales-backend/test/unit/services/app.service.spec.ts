import { Test } from '@nestjs/testing';
import { AppService } from '../../../src/app.service';

describe('AppService', () => {
  let appService: AppService;

  // Esto se ejecuta antes de cada test
  beforeEach(async () => {
    // 1. Creamos un módulo de testing
    const moduleRef = await Test.createTestingModule({
      providers: [AppService],
    }).compile();

    // 2. Obtenemos la instancia del servicio
    appService = moduleRef.get<AppService>(AppService);
  });

  // Primer test
  it('should be defined', () => {
    expect(appService).toBeDefined();
  });

  // Test para el método getHello
  describe('getHello', () => {
    it('should return "Hello World!"', () => {
      // Actuar
      const result = appService.getHello();

      // Verificar
      expect(result).toBe('Hello World!');
    });
  });
});
