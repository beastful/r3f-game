import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { 
  InstancedMesh, 
  PlaneGeometry, 
  ShaderMaterial,
  Object3D,
  Color,
  Vector3,
  InstancedBufferAttribute
} from 'three'
import { shouldPlaceGrass, getTerrainHeight } from '../utils/noise'

interface GrassSystemProps {
  chunkX: number
  chunkZ: number
  chunkSize: number
}

const GRASS_COUNT_PER_CHUNK = 400  // Increased for visibility
const GRASS_SIZE = 1.5              // Bigger grass blades
const GRASS_HEIGHT_VARIATION = 0.5   // More size variety
const WIND_STRENGTH = 0.8            // More visible wind

export default function GrassSystem({ chunkX, chunkZ, chunkSize }: GrassSystemProps) {
  const meshRef = useRef<InstancedMesh>(null)
  const timeRef = useRef(0)
  
  // Generate grass instances for this chunk
  const grassInstances = useMemo(() => {
    const instances: { position: Vector3; scale: number; color: Color; windOffset: number }[] = []
    
    // Generate random grass positions within chunk
    for (let i = 0; i < GRASS_COUNT_PER_CHUNK; i++) {
      const localX = Math.random() * chunkSize
      const localZ = Math.random() * chunkSize
      const worldX = chunkX * chunkSize + localX
      const worldZ = chunkZ * chunkSize + localZ
      
      const terrainHeight = getTerrainHeight(worldX, worldZ)
      
      // For now, place grass more liberally to ensure visibility
      const shouldPlace = shouldPlaceGrass(worldX, worldZ, terrainHeight) || (i % 3 === 0) // Force every 3rd attempt
      
      if (shouldPlace) {
        const scale = 1.0 + Math.random() * GRASS_HEIGHT_VARIATION
        const color = new Color().setHSL(0.25 + Math.random() * 0.15, 0.7 + Math.random() * 0.2, 0.4 + Math.random() * 0.2)
        
        instances.push({
          position: new Vector3(worldX, terrainHeight + 0.1, worldZ), // Slightly above terrain
          scale,
          color,
          windOffset: Math.random() * Math.PI * 2
        })
      }
    }
    
    // Debug: Log grass instance count
    console.log(`Chunk (${chunkX}, ${chunkZ}): Generated ${instances.length} grass instances`)
    
    return instances
  }, [chunkX, chunkZ, chunkSize])

  // Grass geometry and material
  const { geometry, material } = useMemo(() => {
    const geom = new PlaneGeometry(GRASS_SIZE, GRASS_SIZE * 1.5)
    
    const mat = new ShaderMaterial({
      vertexShader: `
        uniform float time;
        uniform vec3 windDirection;
        uniform float windStrength;
        
        attribute vec3 instanceColor;
        attribute float instanceScale;
        attribute float windOffset;
        
        varying vec2 vUv;
        varying vec3 vColor;
        varying float vHeight;
        
        void main() {
          vUv = uv;
          vColor = instanceColor;
          vHeight = position.y + 0.5; // Normalize height for wind effect
          
          vec3 pos = position;
          
          // Scale the grass
          pos *= instanceScale;
          
          // Wind animation - more movement at top of grass
          float windEffect = sin(time + windOffset) * windStrength * vHeight;
          pos.x += windEffect;
          
          vec4 worldPosition = instanceMatrix * vec4(pos, 1.0);
          gl_Position = projectionMatrix * modelViewMatrix * worldPosition;
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        varying vec3 vColor;
        varying float vHeight;
        
        void main() {
          // Alpha mask for grass shape (fade at edges)
          float alpha = 1.0 - pow(abs(vUv.x - 0.5) * 2.0, 2.0);
          alpha *= smoothstep(0.0, 0.1, vUv.y); // Fade at bottom
          alpha *= smoothstep(1.0, 0.8, vUv.y); // Fade at top
          
          if (alpha < 0.1) discard;
          
          // Color variation based on height
          vec3 color = vColor * (0.8 + 0.2 * vHeight);
          
          gl_FragColor = vec4(color, alpha);
        }
      `,
      uniforms: {
        time: { value: 0 },
        windDirection: { value: new Vector3(1, 0, 0) },
        windStrength: { value: WIND_STRENGTH }
      },
      transparent: true,
      alphaTest: 0.1
    })
    
    return { geometry: geom, material: mat }
  }, [])

  // Set up instanced attributes
  useMemo(() => {
    if (!meshRef.current || grassInstances.length === 0) return

    const mesh = meshRef.current
    mesh.count = grassInstances.length

    // Create instance attributes
    const colors = new Float32Array(grassInstances.length * 3)
    const scales = new Float32Array(grassInstances.length)
    const windOffsets = new Float32Array(grassInstances.length)
    
    const dummy = new Object3D()
    
    grassInstances.forEach((instance, i) => {
      // Set position and rotation
      dummy.position.copy(instance.position)
      dummy.rotation.y = Math.random() * Math.PI * 2  // Random rotation
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
      
      // Set color
      colors[i * 3] = instance.color.r
      colors[i * 3 + 1] = instance.color.g
      colors[i * 3 + 2] = instance.color.b
      
      // Set scale
      scales[i] = instance.scale
      
      // Set wind offset
      windOffsets[i] = instance.windOffset
    })
    
    mesh.instanceMatrix.needsUpdate = true
    
    // Set instance attributes
    geometry.setAttribute('instanceColor', new InstancedBufferAttribute(colors, 3))
    geometry.setAttribute('instanceScale', new InstancedBufferAttribute(scales, 1))
    geometry.setAttribute('windOffset', new InstancedBufferAttribute(windOffsets, 1))
    
  }, [grassInstances, geometry])

  // Animate wind
  useFrame((state) => {
    if (!meshRef.current) return
    
    timeRef.current += state.clock.getDelta()
    
    // Update wind time
    if (material.uniforms.time) {
      material.uniforms.time.value = timeRef.current
    }
  })

  // Only render if we have grass instances
  if (grassInstances.length === 0) {
    return null
  }

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, grassInstances.length]}
      castShadow
      receiveShadow
    />
  )
}