// Tarjeta de stat compacta — versión liviana de TarjetaStat (que trae
// ilustración 3D grande pensada para la esquina de una tarjeta ancha, no para
// el tamaño chico de un header de 4-5 tarjetas en fila). Reusa las mismas
// ilustraciones webp del resto de la app (ver imagen3d en TarjetaStat).
// Extraída de ClientePerfil.jsx para reusarla también en PrestamoDetalle.jsx.
export default function TarjetaStatChica({ imagen, titulo, valor, subtitulo, peligro = false }) {
  return (
    <div className="bg-surface-lowest border border-outline-variant/50 rounded-xl shadow-card p-5 flex items-center gap-4 min-h-[100px]">
      <img src={imagen} alt="" className="w-12 h-12 object-contain shrink-0" />
      <div className="min-w-0">
        <p className="text-[13px] text-on-surface-variant m-0 truncate">{titulo}</p>
        <p className={`text-2xl font-bold m-0 leading-tight ${peligro ? 'text-error' : 'text-on-background'}`}>{valor}</p>
        {subtitulo && <p className="text-[13px] font-semibold text-[#FBBF24] m-0 mt-0.5">{subtitulo}</p>}
      </div>
    </div>
  )
}
