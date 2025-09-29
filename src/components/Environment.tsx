import { useThree } from '@react-three/fiber'
import { useEffect } from 'react'
import { Fog } from 'three'

export default function Environment() {
  const { scene } = useThree()

  useEffect(() => {
    // Add fog for atmospheric effect
    scene.fog = new Fog('#87CEEB', 50, 200)
  }, [scene])

  return (
    <>
      {/* Ambient lighting */}
      <ambientLight intensity={0.3} />
      
      {/* Main directional light (sun) */}
      <directionalLight
        position={[50, 50, 25]}
        intensity={1}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-50}
        shadow-camera-right={50}
        shadow-camera-top={50}
        shadow-camera-bottom={-50}
        shadow-camera-near={0.1}
        shadow-camera-far={200}
      />
      
      {/* Fill light for softer shadows */}
      <directionalLight
        position={[-20, 30, 10]}
        intensity={0.3}
        color="#ffeedd"
      />
      
      {/* Simple sky dome effect */}
      <mesh>
        <sphereGeometry args={[300, 32, 32]} />
        <meshBasicMaterial 
          color="#87CEEB" 
          side={2} // THREE.BackSide
        />
      </mesh>
    </>
  )
}