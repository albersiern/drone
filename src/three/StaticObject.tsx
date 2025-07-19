import { Sphere, Cone, Text } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useRef, useState } from 'react'
import { Group } from 'three'

function LocationPin({ position, color, label, hoverText }: { position: [number, number, number], color: string, label: string, hoverText?: string }) {
  const groupRef = useRef<Group>(null!)
  const [hovered, setHovered] = useState(false)
  const [scale, setScale] = useState(1)

  useFrame(() => {
    if (groupRef.current) {
      const targetScale = hovered ? 1.2 : 1
      setScale(prev => prev + (targetScale - prev) * 0.1)
      groupRef.current.scale.setScalar(scale)
      
      if (hovered) {
        groupRef.current.position.y = position[1] + Math.sin(Date.now() * 0.005) * 2
      } else {
        groupRef.current.position.y = position[1]
      }
    }
  })

  return (
    <group 
      ref={groupRef}
      position={position} 
      scale={0.1}
    >
      {/* Invisible collision sphere for better hover detection */}
      <Sphere 
        args={[5, 8, 8]} 
        position={[0, -0.5, 0]}
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
      >
        <meshBasicMaterial transparent opacity={0} />
      </Sphere>
      <Sphere args={[2, 16, 16]} position={[0, 1.5, 0]}>
        <meshStandardMaterial 
          color={hovered ? "#ffffff" : color} 
          emissive={hovered ? color : "#000000"}
          emissiveIntensity={hovered ? 0.3 : 0.1}
          roughness={0.2}
          metalness={0.2}
        />
      </Sphere>
      
      <Sphere args={[1.2, 16, 16]} position={[0, 1.5, -0.1]}>
        <meshStandardMaterial 
          color={hovered ? color : "white"} 
          emissive={hovered ? "white" : color}
          emissiveIntensity={hovered ? 0.4 : 0.1}
          roughness={0.1}
        />
      </Sphere>
      
      <Cone args={[1, 2, 8]} position={[0, -1, 0]} rotation={[Math.PI, 0, 0]}>
        <meshStandardMaterial 
          color={hovered ? "#ffffff" : color} 
          emissive={hovered ? color : "#000000"}
          emissiveIntensity={hovered ? 0.3 : 0.1}
          roughness={0.2}
          metalness={0.2}
        />
      </Cone>
      
      <Text
        position={[0, 4, 0]}
        fontSize={1}
        color="white"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.4}
        outlineColor="black"
      >
        {label}
      </Text>
      
      {hovered && hoverText && (
        <Text
          position={[0, 6, 0]}
          fontSize={1.1}
          color="#ffff00"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.3}
          outlineColor="black"
        >
          {hoverText}
        </Text>
      )}
    </group>
  )
}

export default function StaticObject() {
  console.log('StaticObject rendering interactive location pins...')
  
  return (
    <group>
      <LocationPin 
        position={[0, 0, -60]} 
        color="#e74c3c" 
        label="ДОРОГА"
        hoverText="Проспект Победителей"
      />
      
      <LocationPin 
        position={[25, 0, -60]} 
        color="#3498db" 
        label="МЕМОРИАЛ"
        hoverText="Мемориал Героев"
      />
    </group>
  )
}
