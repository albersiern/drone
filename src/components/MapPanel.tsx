import { useMemo } from 'react'
import { GoogleMap, Marker, Polyline, useJsApiLoader } from '@react-google-maps/api'
import { usePOIStore } from '../stores/poi'

const INITIAL_CENTER = { lat: 53.9125, lng: 27.544722 }

const containerStyle: React.CSSProperties = {
  width: '100%',
  height: '100%',
}

function MapPanel() {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string,
    libraries: ['maps', 'geometry'] as any,
  })

  const pois = usePOIStore((s) => s.pois)
  const path = useMemo(() => pois.map((p) => ({ lat: p.position.y, lng: p.position.x })), [pois])

  if (!isLoaded) return <div>Loading map…</div>

  return (
    <GoogleMap mapContainerStyle={containerStyle} zoom={16} center={INITIAL_CENTER} options={{ disableDefaultUI: true }}>
      {/* Маркер дрона */}
      <Marker position={INITIAL_CENTER} icon={{ url: 'https://maps.google.com/mapfiles/kml/shapes/heliport.png' }} />

      {/* POI + маршрут */}
      {pois.map((poi) => (
        <Marker key={poi.id} position={{ lat: poi.position.y, lng: poi.position.x }} label={poi.name} />
      ))}
      {path.length > 1 && <Polyline path={path} options={{ strokeColor: '#4285F4', strokeWeight: 3 }} />}
    </GoogleMap>
  )
}

export default MapPanel
