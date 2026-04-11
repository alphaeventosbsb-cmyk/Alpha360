// ============================================================
// Alpha360 API — Padrão de Resposta
// ============================================================

import type { ApiResponse } from '@alpha360/shared';

/**
 * Resposta de sucesso
 */
export function successResponse<T>(data: T): ApiResponse<T> {
  return {
    success: true,
    data,
    error: null,
  };
}

/**
 * Resposta de erro
 */
export function errorResponse(message: string): ApiResponse<null> {
  return {
    success: false,
    data: null,
    error: message,
  };
}

/**
 * Resposta de lista com paginação (futuro)
 */
export function listResponse<T>(data: T[], total?: number) {
  return {
    success: true,
    data,
    total: total ?? data.length,
    error: null,
  };
}
