// src/common/auth/auth.module.ts

import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }), // Usamos JWT como estrategia por defecto
  ],
  providers: [JwtStrategy],
  exports: [PassportModule], // Exportamos PassportModule para usar el Guard en otros módulos
})
export class AuthModule {}