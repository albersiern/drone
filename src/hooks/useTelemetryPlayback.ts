import { useEffect, useRef } from 'react'
import { useTelemetryStore } from '../stores/telemetry'
import { Vector3, Euler } from 'three'

interface Point {
  t: number
  lat: number
  lon: number
  alt: number | null
  yaw: number | null
  pitch: number | null
  roll: number | null
  v: number | null
  x?: number
  z?: number
}

export default function useTelemetryPlayback(videoName: string, currentTime: number) {
  const telemetry = useRef<Point[] | null>(null)
  const setTelemetry = useTelemetryStore((s) => s.setTelemetry)

  useEffect(() => {
    fetch(`/telemetry/${videoName}.json`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: Point[] | null) => {
        if (data && data.length) {
          const origin = data[0]
          const angle = 125 * Math.PI / 180
          const cosA = Math.cos(angle)
          const sinA = Math.sin(angle)
          const R = 111320 // meters per deg
          const cosLat0 = Math.cos(origin.lat * Math.PI / 180)
          telemetry.current = data.map((p) => {
            const dLon = p.lon - origin.lon
            const dLat = p.lat - origin.lat
            const newLon = dLon * cosA - dLat * sinA + origin.lon
            const newLat = dLon * sinA + dLat * cosA + origin.lat
            const x = (newLon - origin.lon) * cosLat0 * R
            const z = (newLat - origin.lat) * R
            return { ...p, x, z }
          })
        } else {
          telemetry.current = data
        }
      })
      .catch(() => {
        telemetry.current = null
      })
  }, [videoName])

  useEffect(() => {
    if (!telemetry.current || !telemetry.current.length) return
    const arr = telemetry.current
    let left = 0
    let right = arr.length - 1
    while (left < right) {
      const mid = Math.floor((left + right) / 2)
      if (arr[mid].t < currentTime) left = mid + 1
      else right = mid
    }
    const p = arr[left]
    if (!p) return
    setTelemetry(
      new Vector3(p.x, p.alt ?? 0, p.z),
      new Euler((p.pitch ?? 0) * Math.PI / 180, (p.yaw ?? 0) * Math.PI / 180, (p.roll ?? 0) * Math.PI / 180)
    )
  }, [currentTime, setTelemetry])
}
