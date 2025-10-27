// src/common/contracts/billing.contract.ts
// Basado en el diagrama de contratos

export interface IBillingContract {
  /**
   * Crea una nueva suscripción para una organización.
   */
  crearSuscripcion(organizacionId: string, plan: string): Promise<{ suscripcionId: string }>;

  /**
   * Obtiene el estado actual de la suscripción.
   */
  obtenerEstadoSuscripcion(organizacionId: string): Promise<'activa' | 'pendiente' | 'cancelada'>;
}