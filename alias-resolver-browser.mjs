
/**
 * Archivo de ayuda para resolver alias @/ en importaciones
 * Esto es utilizado por Vite durante el desarrollo
 */

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Resolver alias @/ a la ruta adecuada
 */
export function resolveAlias(alias) {
  if (alias.startsWith('@/')) {
    return path.resolve(__dirname, 'client/src', alias.slice(2));
  }
  return alias;
}

export default {
  resolveAlias
};
