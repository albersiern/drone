import { useFrame } from '@react-three/fiber'
import { PerspectiveCamera } from '@react-three/drei'
import { useTelemetryStore } from '../stores/telemetry'
import { useRef } from 'react'
import * as THREE from 'three'

export default function TelemetryCamera() {
  const cameraRef = useRef<THREE.PerspectiveCamera>(null!)
  // const { position, rotation } = useTelemetryStore() // Temporarily disabled

  useFrame(() => {
    if (!cameraRef.current) return
    // Temporarily disabled for POI testing
    // cameraRef.current.position.copy(position)
    // cameraRef.current.rotation.set(rotation.x, rotation.y, rotation.z)
  })

  return (
    <>
      <PerspectiveCamera ref={cameraRef} makeDefault fov={60} near={0.1} far={10000} />
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
    </>
  )
}
