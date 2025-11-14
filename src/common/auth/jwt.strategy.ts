// src/common/auth/jwt.strategy.ts

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { passportJwtSecret } from 'jwks-rsa';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    // Configuración de la estrategia JWT para Auth0
    super({
      secretOrKeyProvider: passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        // URL de tu dominio de Auth0 (Issuer)
        jwksUri: `${process.env.AUTH0_ISSUER_URL}.well-known/jwks.json`,
      }),

      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      audience: process.env.AUTH0_AUDIENCE, // API Audience
      issuer: process.env.AUTH0_ISSUER_URL, // Dominio de Auth0
      algorithms: ['RS256'], // Algoritmo usado por Auth0
    });
  }

  // El método validate se llama si el token es válido y no ha expirado.
  // Aquí puedes buscar el usuario en la BD si fuera necesario.
  async validate(payload: any) {
    if (!payload.sub) {
      throw new UnauthorizedException();
    }
    // Retornamos el payload (incluye el ID del usuario y los scopes/roles)
    return payload; 
  }
}