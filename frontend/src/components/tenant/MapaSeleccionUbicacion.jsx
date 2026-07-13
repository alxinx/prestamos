import { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Medellín — centro por defecto cuando todavía no hay ninguna ubicación capturada.
const CENTRO_DEFECTO = { lat: 6.2442, lng: -75.5812 }
const ZOOM_DEFECTO = 13
const ZOOM_AL_CAPTURAR = 16

// Pin propio en los colores de marca (en vez del ícono azul por defecto de
// Leaflet, que además requiere el workaround clásico de rutas rotas con bundlers).
const iconoPin = L.divIcon({
  className: 'pin-ubicacion-cliente',
  html: `<svg width="30" height="40" viewBox="0 0 32 42" xmlns="http://www.w3.org/2000/svg">
    <path d="M16 0C7.163 0 0 7.163 0 16c0 11 16 26 16 26s16-15 16-26C32 7.163 24.837 0 16 0z" fill="#001430"/>
    <circle cx="16" cy="16" r="6.5" fill="#56fbab"/>
  </svg>`,
  iconSize: [30, 40],
  iconAnchor: [15, 40],
})

function ManejadorClic({ onSeleccionar }) {
  useMapEvents({
    click(e) { onSeleccionar(e.latlng.lat, e.latlng.lng) },
  })
  return null
}

// El wizard monta este mapa dentro de un grid cuyas columnas todavía no
// terminan de calcular su ancho final en el primer render — Leaflet mide el
// contenedor al crearse y, si en ese instante el tamaño real es distinto,
// cachea las coordenadas mal y el pin queda proyectado fuera del área visible
// (los tiles se ven bien porque se vuelven a pedir solos; el marker no se
// reposiciona solo). invalidateSize() fuerza a Leaflet a remedir apenas el
// layout se asienta.
function RecalcularTamano() {
  const map = useMap()
  useEffect(() => {
    const id = setTimeout(() => map.invalidateSize(), 150)
    return () => clearTimeout(id)
  }, [map])
  return null
}

// Recentra el mapa solo la primera vez que aparece una posición (ej. al capturar
// la geolocalización) — no en cada arrastre posterior del pin, para no pelearse
// con el zoom/paneo manual del usuario.
function RecentrarAlAparecer({ posicion }) {
  const map = useMap()
  const yaCentrado = useRef(false)
  useEffect(() => {
    if (posicion && !yaCentrado.current) {
      map.invalidateSize()
      map.setView([posicion.lat, posicion.lng], ZOOM_AL_CAPTURAR)
      yaCentrado.current = true
    }
  }, [posicion, map])
  return null
}

// Selector de ubicación en mapa (Leaflet + OpenStreetMap, sin API key). Clic para
// colocar el pin, arrastrar para ajustar. `latitud`/`longitud` en grados decimales
// o null si aún no se ha seleccionado nada; `onCambiar(lat, lng)` se llama con 6
// decimales de precisión (~11cm, más que suficiente para direcciones).
export default function MapaSeleccionUbicacion({ latitud, longitud, onCambiar }) {
  const tienePosicion = latitud != null && longitud != null
  const posicion = tienePosicion ? { lat: Number(latitud), lng: Number(longitud) } : null

  function seleccionar(lat, lng) {
    onCambiar(Number(lat.toFixed(6)), Number(lng.toFixed(6)))
  }

  return (
    <div className="rounded-xl overflow-hidden border border-outline-variant relative" style={{ height: 280 }}>
      <MapContainer
        center={posicion ?? CENTRO_DEFECTO}
        zoom={ZOOM_DEFECTO}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ManejadorClic onSeleccionar={seleccionar} />
        <RecalcularTamano />
        {posicion && (
          <Marker
            position={posicion}
            icon={iconoPin}
            draggable
            eventHandlers={{
              dragend: e => {
                const { lat, lng } = e.target.getLatLng()
                seleccionar(lat, lng)
              },
            }}
          />
        )}
        <RecentrarAlAparecer posicion={posicion} />
      </MapContainer>
      {!tienePosicion && (
        <div className="absolute inset-x-0 bottom-0 bg-on-background/75 text-white text-[11px] text-center py-1.5 pointer-events-none z-[1000]">
          Haz clic en el mapa para seleccionar · arrastra el pin para ajustar
        </div>
      )}
    </div>
  )
}
