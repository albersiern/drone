import { Cartesian3, Color, Math as CesiumMath, Ion } from 'cesium'
import { Viewer, Entity, PointGraphics, PolygonGraphics, PolylineGraphics } from 'resium'
import { useRef, useEffect, useState } from 'react'
import { usePOIStore } from '../stores/poi'
import { useTelemetryStore } from '../stores/telemetry'

Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIzOGYyZmNlNi0wMDA4LTQ4ZWUtOGFjZi1iYTVmMDc4M2U1M2MiLCJpZCI6MzIyNzkwLCJpYXQiOjE3NTI4NDg1NTJ9.0iWFHsXiEX7UctnjPRQrTRe7sq9T0I1WkyF9WqObkl4'

const MINskCoordinates = { lat: 53.9125, lon: 27.544722, height: 150 }

export default function CesiumPanel() {
  const viewerRef = useRef<any>(null)
  const pois = usePOIStore((s) => s.pois)
  const { position, rotation } = useTelemetryStore()
  const [track, setTrack] = useState<Cartesian3[]>([])
  const [rotatedPOI, setRotatedPOI] = useState(pois)

  const R = 111320
  const cosLat0 = Math.cos(MINskCoordinates.lat * Math.PI / 180)
  const droneLon = MINskCoordinates.lon + (position.x ?? 0) / (cosLat0 * R)
  const droneLat = MINskCoordinates.lat + (position.z ?? 0) / R
  const droneAlt = position.y ?? 0

  useEffect(() => {
    fetch('/telemetry/DJI_0381.json')
      .then(r => r.ok ? r.json() : [])
      .then((pts: any[]) => {
        const origin = pts[0]
        const angle = CesiumMath.toRadians(125)
        const cosA = Math.cos(angle)
        const sinA = Math.sin(angle)
        const rotatedPts = pts.map((p) => {
          const dLon = p.lon - origin.lon
          const dLat = p.lat - origin.lat
          const newLon = dLon * cosA - dLat * sinA
          const newLat = dLon * sinA + dLat * cosA
          return {
            lon: origin.lon + newLon,
            lat: origin.lat + newLat,
            alt: p.alt || 0,
          }
        })
        const cart = rotatedPts.map((p) => Cartesian3.fromDegrees(p.lon, p.lat, p.alt))
        setTrack(cart)
        const rPois = pois.map((poi) => {
          const dLon = poi.position.x - origin.lon
          const dLat = poi.position.y - origin.lat
          const newLon = dLon * cosA - dLat * sinA + origin.lon
          const newLat = dLon * sinA + dLat * cosA + origin.lat
          return { ...poi, position: { ...poi.position, x: newLon, y: newLat } as any }
        })
        setRotatedPOI(rPois)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    const id = setInterval(() => {
      const v = (viewerRef.current as any)?.cesiumElement as any
      if (v && v.scene && v.camera) {
        v.scene.morphTo2D(0)
        v.scene.globe.enableLighting = true
        v.camera.setView({
          destination: Cartesian3.fromDegrees(MINskCoordinates.lon, MINskCoordinates.lat, 3000),
          orientation: {
            heading: -Math.PI / 2,
            pitch: 0,
            roll: 0,
          },
        })
        clearInterval(id)
      }
    }, 200)
    return () => clearInterval(id)
  }, [])

  return (
    <Viewer
      ref={viewerRef as any}
      style={{ width: '100%', height: '100%' }}
      terrainProvider={undefined}
      baseLayerPicker={false}
      timeline={false}
      animation={false}
      fullscreenButton={false}
      homeButton={false}
      navigationHelpButton={false}
      sceneModePicker={false}
      geocoder={false}
      infoBox={false}
      selectionIndicator={false}
    >
      <Entity position={Cartesian3.fromDegrees(droneLon, droneLat, droneAlt)}>
        <PointGraphics color={Color.BLUE} outlineColor={Color.WHITE} outlineWidth={2} pixelSize={10} />
      </Entity>

      <Entity name="FOV-sector">
        <PolygonGraphics
          hierarchy={(() => {
            const radius = 0.005; // ~500 м
            const halfAngle = CesiumMath.toRadians(30); // 60° сектор
            const heading = rotation.y - CesiumMath.toRadians(120); // yaw 120° left
            const positions = [Cartesian3.fromDegrees(droneLon, droneLat)];
            for (let i = -1; i <= 1; i += 2) {
              const angle = heading + i * halfAngle;
              const lon = droneLon + radius * Math.sin(angle);
              const lat = droneLat + radius * Math.cos(angle);
              positions.push(Cartesian3.fromDegrees(lon, lat));
            }
            return positions;
          })()}
          material={Color.CYAN.withAlpha(0.3)}
          outline={true}
          outlineColor={Color.WHITE}
          outlineWidth={2}
        />
      </Entity>

      {track.length > 1 && (
        <Entity>
          <PolylineGraphics
            positions={track}
            width={2}
            material={Color.RED}
          />
        </Entity>
      )}

      {rotatedPOI.map((poi) => (
        <Entity
          id={poi.id}
          key={poi.id}
          position={Cartesian3.fromDegrees(poi.position.x, poi.position.y, poi.position.z)}
          name={poi.name}
          
          point={{ color: Color.YELLOW, outlineColor: Color.WHITE, outlineWidth: 2, pixelSize: 12, disableDepthTestDistance: Number.POSITIVE_INFINITY }}
          label={{ text: poi.name, font: '20px sans-serif', fillColor: Color.WHITE, outlineColor: Color.BLACK, outlineWidth: 2, show: true, verticalOrigin: 0, pixelOffset: new Cartesian3(0, -25, 0), disableDepthTestDistance: Number.POSITIVE_INFINITY }}
        />
      ))}
    </Viewer>
  )
}
