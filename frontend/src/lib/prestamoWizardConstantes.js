// Valores iniciales y etiquetas compartidas del wizard "Nuevo préstamo" — en
// archivo aparte (no junto a los componentes) para que Fast Refresh no se
// queje de exportar algo que no es un componente (mismo criterio que
// clienteWizardConstantes.js).

export const DETALLES_VACIO = {
  montoInicial: '', tasaInteres: '', numeroCuotas: '', frecuenciaPago: '', fechaInicio: '', fechaLetra: '',
}

export const GARANTIA_VACIA = { tipo: '', descripcion: '', valorEstimado: 0 }

export const DEUDOR_SOLIDARIO_VACIO = {
  clienteId: null, cedula: '', nombreCompleto: '', telefono: '', direccion: '',
  relacionConDeudor: 'FAMILIAR', firmoDocumento: false,
}

export const TIPOS_GARANTIA = [
  { value: 'MOTO', label: 'Moto' },
  { value: 'VEHICULO', label: 'Vehículo' },
  { value: 'ELECTRODOMESTICO', label: 'Electrodoméstico' },
  { value: 'PAGARE', label: 'Pagaré' },
  { value: 'LETRA_CAMBIO', label: 'Letra de cambio' },
  { value: 'DOCUMENTO_FIRMADO', label: 'Documento firmado' },
  { value: 'INMUEBLE', label: 'Inmueble' },
  { value: 'OTRO', label: 'Otro' },
]
export const ETIQUETA_TIPO_GARANTIA = Object.fromEntries(TIPOS_GARANTIA.map(t => [t.value, t.label]))
