'use strict'

// Catálogo fijo de permisos del sistema, agrupado por módulo (ModuloPermiso).
const CATALOGO_PERMISOS = [
  // Clientes
  { codigo: 'clientes.ver',      nombre: 'Ver clientes',      descripcion: 'Consultar el listado y detalle de clientes',    modulo: 'CLIENTES' },
  { codigo: 'clientes.crear',    nombre: 'Crear clientes',    descripcion: 'Registrar nuevos clientes',                      modulo: 'CLIENTES' },
  { codigo: 'clientes.editar',   nombre: 'Editar clientes',   descripcion: 'Modificar datos de clientes existentes',         modulo: 'CLIENTES' },
  { codigo: 'clientes.eliminar', nombre: 'Eliminar clientes', descripcion: 'Eliminar o desactivar clientes',                 modulo: 'CLIENTES' },

  // Créditos
  { codigo: 'creditos.ver',            nombre: 'Ver créditos',              descripcion: 'Consultar el listado y detalle de créditos',              modulo: 'CREDITOS' },
  { codigo: 'creditos.crear',          nombre: 'Crear créditos',            descripcion: 'Otorgar nuevos créditos',                                 modulo: 'CREDITOS' },
  { codigo: 'creditos.editar',         nombre: 'Editar créditos',           descripcion: 'Modificar condiciones de un crédito',                     modulo: 'CREDITOS' },
  { codigo: 'creditos.anular',         nombre: 'Anular créditos',           descripcion: 'Anular un crédito otorgado',                              modulo: 'CREDITOS' },
  { codigo: 'creditos.cambiar_estado', nombre: 'Cambiar estado de crédito', descripcion: 'Cambiar el estado de un crédito (mora, cancelado, etc.)', modulo: 'CREDITOS' },
  { codigo: 'creditos.generar_letra', nombre: 'Generar letra de cambio', descripcion: 'Generar la letra de cambio de un crédito otorgado',            modulo: 'CREDITOS' },

  // Cobros
  { codigo: 'cobros.ver',       nombre: 'Ver cobros',       descripcion: 'Consultar pagos y recaudos',             modulo: 'COBROS' },
  { codigo: 'cobros.registrar', nombre: 'Registrar cobros', descripcion: 'Registrar un pago recibido',             modulo: 'COBROS' },
  { codigo: 'cobros.liquidar',  nombre: 'Liquidar pagos',   descripcion: 'Pasar un pago de pendiente a liquidado', modulo: 'COBROS' },
  { codigo: 'cobros.anular',    nombre: 'Anular pagos',     descripcion: 'Anular un pago y revertir el saldo',     modulo: 'COBROS' },

  // Empleados
  { codigo: 'empleados.ver',                nombre: 'Ver empleados',      descripcion: 'Consultar el listado de empleados',                 modulo: 'EMPLEADOS' },
  { codigo: 'empleados.crear',              nombre: 'Crear empleados',    descripcion: 'Registrar nuevos empleados',                        modulo: 'EMPLEADOS' },
  { codigo: 'empleados.editar',             nombre: 'Editar empleados',   descripcion: 'Modificar datos de empleados',                      modulo: 'EMPLEADOS' },
  { codigo: 'empleados.eliminar',           nombre: 'Eliminar empleados', descripcion: 'Eliminar o desactivar empleados',                   modulo: 'EMPLEADOS' },
  { codigo: 'empleados.gestionar_permisos', nombre: 'Gestionar permisos', descripcion: 'Asignar roles y permisos individuales a empleados', modulo: 'EMPLEADOS' },

  // Capital
  { codigo: 'capital.ver',      nombre: 'Ver capital',      descripcion: 'Consultar fuentes de capital y socios', modulo: 'CAPITAL' },
  { codigo: 'capital.crear',    nombre: 'Crear capital',    descripcion: 'Registrar nuevas fuentes de capital',   modulo: 'CAPITAL' },
  { codigo: 'capital.editar',   nombre: 'Editar capital',   descripcion: 'Modificar fuentes de capital',          modulo: 'CAPITAL' },
  { codigo: 'capital.eliminar', nombre: 'Eliminar capital', descripcion: 'Eliminar fuentes de capital',           modulo: 'CAPITAL' },

  // Caja
  { codigo: 'caja.ver',               nombre: 'Ver caja',                 descripcion: 'Consultar el estado de caja',              modulo: 'CAJA' },
  { codigo: 'caja.cerrar_individual', nombre: 'Cerrar caja individual',   descripcion: 'Cerrar la caja individual del día',        modulo: 'CAJA' },
  { codigo: 'caja.aprobar_cierre',    nombre: 'Aprobar cierre de caja',   descripcion: 'Aprobar el cierre de caja de un cobrador', modulo: 'CAJA' },
  { codigo: 'caja.cerrar_global',     nombre: 'Cerrar caja global',       descripcion: 'Cerrar la caja global del tenant',         modulo: 'CAJA' },
  { codigo: 'caja.registrar_gasto',   nombre: 'Registrar gasto de campo', descripcion: 'Registrar gastos de campo en la caja',     modulo: 'CAJA' },

  // Tesorería
  { codigo: 'tesoreria.ver',                  nombre: 'Ver tesorería',          descripcion: 'Consultar movimientos de tesorería',   modulo: 'TESORERIA' },
  { codigo: 'tesoreria.registrar_movimiento', nombre: 'Registrar movimiento',   descripcion: 'Registrar un movimiento de tesorería', modulo: 'TESORERIA' },
  { codigo: 'tesoreria.aprobar_movimiento',   nombre: 'Aprobar movimiento',     descripcion: 'Aprobar un movimiento de tesorería',   modulo: 'TESORERIA' },
  { codigo: 'tesoreria.consignar',            nombre: 'Registrar consignación', descripcion: 'Registrar una consignación bancaria',  modulo: 'TESORERIA' },
  { codigo: 'tesoreria.conciliar',            nombre: 'Conciliar movimientos',  descripcion: 'Conciliar movimientos de tesorería',   modulo: 'TESORERIA' },

  // Reportes
  { codigo: 'reportes.ver',      nombre: 'Ver reportes',      descripcion: 'Consultar reportes del tenant', modulo: 'REPORTES' },
  { codigo: 'reportes.exportar', nombre: 'Exportar reportes', descripcion: 'Exportar reportes a archivo',   modulo: 'REPORTES' },
]

// Códigos activos por defecto para cada rol predefinido.
// Todo lo que no aparezca aquí para un rol se siembra como inactivo (false).
const PERMISOS_POR_ROL = {
  ADMINISTRADOR: CATALOGO_PERMISOS.map(p => p.codigo),

  AUDITOR: CATALOGO_PERMISOS
    .map(p => p.codigo)
    .filter(codigo => codigo.endsWith('.ver')),

  SECRETARIA: [
    'clientes.ver', 'clientes.crear', 'clientes.editar',
    'creditos.ver', 'creditos.crear', 'creditos.editar', 'creditos.generar_letra',
    'cobros.ver', 'cobros.registrar', 'cobros.liquidar',
    'reportes.ver',
  ],

  COBRADOR: [
    'clientes.ver',
    'creditos.ver',
    'cobros.ver', 'cobros.registrar',
    'caja.ver', 'caja.cerrar_individual', 'caja.registrar_gasto',
  ],
}

module.exports = { CATALOGO_PERMISOS, PERMISOS_POR_ROL }
