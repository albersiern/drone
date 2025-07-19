import { useEffect, useRef, useState } from 'react'
import useTelemetryPlayback from '../hooks/useTelemetryPlayback'

interface VideoBackgroundProps {
  src?: string
  telemetryName?: string
}

export default function VideoBackground({ src, telemetryName = 'DJI_0381' }: VideoBackgroundProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [time, setTime] = useState(0)

  useEffect(() => {
    const el = videoRef.current
    if (!el) return
    const handler = () => setTime(el.currentTime)
    el.addEventListener('timeupdate', handler)
    return () => el.removeEventListener('timeupdate', handler)
  }, [])

  useTelemetryPlayback(telemetryName, time)

  return (
    <video
      ref={videoRef}
      src={src}
      className="background-video"
      autoPlay
      loop
      muted
      playsInline
    />
  )
}
