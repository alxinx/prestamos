// Valores iniciales compartidos por los pasos 3 y 4 del wizard de clientes —
// en archivo aparte (no junto a los componentes) para que Fast Refresh no se
// queje de exportar algo que no es un componente.
export const UBICACION_VACIA = {
  tipo: 'RESIDENCIA', direccion: '', ciudad: '', barrio: '', referencia: '', horarioUbicacion: '', latitud: null, longitud: null,
}

export const REFERENCIA_VACIA = { nombreCompleto: '', telefono: '', relacionConCliente: 'FAMILIAR', observaciones: '' }
