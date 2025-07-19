import React, { useMemo } from 'react';
import { Sphere, Text } from '@react-three/drei';
import { usePOIStore } from '../stores/poi';


export default function POILayer() {
  const pois = usePOIStore((s) => s.pois)
  console.log('POILayer render, pois:', pois, 'length:', pois.length)
  
  return (
    <>
      {/* Test sphere at fixed position */}
      <group position={[0, 50, 0]}>
        <Sphere args={[10, 16, 16]}>
          <meshBasicMaterial color="red" />
        </Sphere>
        <Text
          position={[0, 15, 0]}
          fontSize={8}
          color="white"
          anchorX="center"
          anchorY="middle"
        >
          TEST POI
        </Text>
      </group>
      
      {/* Original POI logic */}
      {pois.map((poi, index) => (
        <group key={poi.id} position={[index * 20, 30, 0]}>
          <Sphere args={[5, 16, 16]}>
            <meshBasicMaterial color="red" />
          </Sphere>
          <Text
            position={[0, 8, 0]}
            fontSize={4}
            color="white"
            anchorX="center"
            anchorY="middle"
          >
            {poi.name}
          </Text>
        </group>
      ))}
    </>
  );
}
