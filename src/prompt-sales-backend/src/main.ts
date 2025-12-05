import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Habilitar validación global
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Configurar CORS para desarrollo
  app.enableCors({
    origin: ['http://localhost:3000', 'http://localhost:5173'], // React/Vue dev servers
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: 'Content-Type, Authorization, X-Requested-With',
  });

  // Configurar prefijo global para API
  app.setGlobalPrefix('api');

  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(' PromptSales Backend iniciado correctamente');
  console.log(` Puerto: ${port}`);
  console.log(` Entorno: ${process.env.NODE_ENV || 'development'}`);
  console.log(
    ` Estrategia de repositorio: ${process.env.REPOSITORY_STRATEGY || 'orm'}`,
  );
  console.log(` URL: http://localhost:${port}/api`);
}
bootstrap();
