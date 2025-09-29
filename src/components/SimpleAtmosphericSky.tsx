import { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { 
  BufferGeometry,
  BufferAttribute,
  Mesh,
  Points
} from 'three'

// Simple sky with white stars - high performance
const STAR_COUNT = 400

export default function SimpleAtmosphericSky() {
  const { camera } = useThree()
  const skyRef = useRef<Mesh>(null)
  const starsRef = useRef<Points>(null)

  // Simple star positions
  const starGeometry = useMemo(() => {
    const geometry = new BufferGeometry()
    const positions = new Float32Array(STAR_COUNT * 3)

    for (let i = 0; i < STAR_COUNT; i++) {
      // Random star positions in a sphere
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const radius = 300

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = radius * Math.cos(phi)
      positions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta)
    }

    geometry.setAttribute('position', new BufferAttribute(positions, 3))
    return geometry
  }, [])

  // Keep sky centered on camera
  useFrame(() => {
    if (skyRef.current) {
      skyRef.current.position.copy(camera.position)
    }
    if (starsRef.current) {
      starsRef.current.position.copy(camera.position)
      // Slow star rotation
      starsRef.current.rotation.y += 0.0005
    }
  })

  return (
    <group>
      {/* Blue-Purple Sky Dome */}
      <mesh ref={skyRef} renderOrder={-10}>
        <sphereGeometry args={[800, 32, 16]} />
        <meshBasicMaterial 
          color="#1a1a4a"  // Dark blue-purple
          side={2} // Both sides
          depthWrite={false}
        />
      </mesh>

      {/* Simple White Stars */}
      <points ref={starsRef}>
        <primitive object={starGeometry} attach="geometry" />
        <pointsMaterial 
          color="white"
          size={2}
          sizeAttenuation={false}
        />
      </points>
    </group>
  )
}