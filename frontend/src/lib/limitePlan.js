// Config compartida por recurso para los avisos de límite de plan — un solo
// lugar para el campo de Plan que se compara y el título corto del aviso,
// usado tanto por el bloque completo (AvisoLimitePlan, wizard "Nuevo
// préstamo") como por el overlay compacto (BloqueLimitePlan, panel
// "Colaboradores"). Agregar un recurso nuevo es solo agregar una entrada acá.
export const RECURSOS_LIMITE_PLAN = {
  prestamos: { campoLimite: 'limitePrestamos', titulo: 'Llegaste al límite de préstamos de tu plan' },
  colaboradores: { campoLimite: 'limiteColaboradores', titulo: 'Llegaste al límite de colaboradores de tu plan' },
}
