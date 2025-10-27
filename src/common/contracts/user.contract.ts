// src/common/contracts/user.contract.ts
// Basado en el diagrama de contratos

export interface RegisterUserDto {
  email: string;
  nombre: string;
  organizacionId: string;
}

export interface IUserContract {
  /**
   * Registra un nuevo usuario en el sistema.
   */
  registrarUsuario(dto: RegisterUserDto): Promise<{ id: string }>;

  /**
   * Obtiene los permisos de un usuario.
   */
  obtenerPermisos(usuarioId: string): Promise<string[]>;
}