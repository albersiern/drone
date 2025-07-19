import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import TelemetryCamera from './TelemetryCamera'
import StaticObject from './StaticObject'

export default function SceneRoot() {
  return (
    <Canvas
      className="three-canvas"
      camera={{ fov: 60, near: 0.1, far: 10000 }}
      gl={{ alpha: true }}
      style={{ width: '100%', height: '100%', background: 'transparent' }}
      onCreated={({ gl }) => { gl.setClearColor(0x000000, 0) }}
    >
      <TelemetryCamera />
      <StaticObject />
      <OrbitControls makeDefault /> 
    </Canvas>
  )
}
