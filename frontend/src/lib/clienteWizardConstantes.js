// Valores iniciales compartidos por los pasos 3 y 4 del wizard de clientes —
// en archivo aparte (no junto a los componentes) para que Fast Refresh no se
// queje de exportar algo que no es un componente.
export const UBICACION_VACIA = {
  tipo: 'RESIDENCIA', direccion: '', ciudad: '', barrio: '', referencia: '', horarioUbicacion: '', latitud: null, longitud: null,
}

export const REFERENCIA_VACIA = { nombreCompleto: '', telefono: '', relacionConCliente: 'FAMILIAR', observaciones: '' }

// Etiquetas legibles de los enums del wizard — fuente única para Paso3/Paso4 (que
// además llevan su propio ícono por tipo) y para el resumen del modal de
// confirmación final, que solo necesita el texto.
export const ETIQUETA_TIPO_UBICACION = {
  RESIDENCIA: 'Residencia',
  TRABAJO: 'Trabajo',
  NEGOCIO_PROPIO: 'Negocio propio',
  DONDE_SE_FIRMO: 'Donde se firmó',
  FAMILIAR: 'Familiar',
  OTRO: 'Otro',
}

export const ETIQUETA_RELACION = {
  FAMILIAR: 'Familiar',
  AMIGO: 'Amigo',
  COLEGA: 'Colega',
  VECINO: 'Vecino',
  OTRO: 'Otro',
}
