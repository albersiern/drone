import * as THREE from 'three'

export default function Terrain() {
  return (
    <mesh rotation-x={-Math.PI / 2} receiveShadow>
      <planeGeometry args={[10000, 10000, 64, 64]} />
      <meshStandardMaterial color={0x808080} />
    </mesh>
  )
}
