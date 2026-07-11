import { usePermisosContexto } from '../context/PermisosContext'

// Permisos efectivos del colaborador autenticado (rol + ajustes individuales) —
// usado para bloquear visualmente formularios/acciones que no tiene permitidos.
// Lee del PermisosContext compartido (un solo fetch por sesión de panel, ver
// PermisosProvider en DashboardTenant.jsx) en vez de pedirlo cada vez.
export default function usePermisos() {
  return usePermisosContexto()
}
