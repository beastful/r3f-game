import { useMemo, useState, useRef, useCallback } from 'react'
import { useFrame } from '@react-three/fiber'
import { RigidBody } from '@react-three/rapier'
import { 
  BufferGeometry, 
  BufferAttribute, 
  ShaderMaterial, 
  Color,
  Vector3
} from 'three'
import { getTerrainHeight } from '../utils/noise'
import GrassSystem from './GrassSystem'

interface TerrainProps {
  playerRef: React.MutableRefObject<{ position: Vector3 } | null>
}

interface TerrainChunk {
  x: number
  z: number
  key: string
  geometry: BufferGeometry
  material: ShaderMaterial
}

// Optimized parameters for better performance
const CHUNK_SIZE = 64        // Larger chunks = fewer chunks total
const CHUNK_RESOLUTION = 16  // Reduced from 32 = 4x fewer vertices!
const RENDER_DISTANCE = 1    // Reduced from 2 = 9 chunks instead of 25

export default function Terrain({ playerRef }: TerrainProps) {
  // Use ref instead of state to avoid triggering re-renders
  const chunksRef = useRef<Map<string, TerrainChunk>>(new Map())
  const [, forceUpdate] = useState({}) // Only for triggering render when needed
  const lastPlayerChunk = useRef({ x: 999999, z: 999999 }) // Force initial load
  const frameCount = useRef(0)
  
  // Shared shader material for all chunks
  const sharedMaterial = useMemo(() => new ShaderMaterial({
    vertexShader: `
      attribute vec3 color;
      varying vec3 vColor;
      varying vec3 vNormal;
      varying vec3 vPosition;
      
      void main() {
        vColor = color;
        vNormal = normalize(normalMatrix * normal);
        vPosition = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec3 vColor;
      varying vec3 vNormal;
      varying vec3 vPosition;
      
      void main() {
        vec3 lightDirection = normalize(vec3(1.0, 1.0, 1.0));
        float lightIntensity = max(dot(vNormal, lightDirection), 0.3);
        
        gl_FragColor = vec4(vColor * lightIntensity, 1.0);
      }
    `
  }), [])

  const getHeightBasedColor = useCallback((height: number) => {
    const normalizedHeight = (height + 10) / 20
    const color = new Color()
    
    if (normalizedHeight < 0.2) {
      color.setHSL(0.6, 0.8, 0.3) // Deep blue for low areas
    } else if (normalizedHeight < 0.4) {
      color.setHSL(0.3, 0.6, 0.4) // Green for medium areas
    } else if (normalizedHeight < 0.7) {
      color.setHSL(0.15, 0.7, 0.5) // Yellow-green for hills
    } else {
      color.setHSL(0.0, 0.0, 0.8) // White for peaks
    }
    
    return color
  }, [])

  const createChunk = useCallback((chunkX: number, chunkZ: number): TerrainChunk => {
    const vertices: number[] = []
    const indices: number[] = []
    const colors: number[] = []
    
    // Generate vertices using Perlin noise
    for (let i = 0; i <= CHUNK_RESOLUTION; i++) {
      for (let j = 0; j <= CHUNK_RESOLUTION; j++) {
        const x = chunkX * CHUNK_SIZE + (i / CHUNK_RESOLUTION) * CHUNK_SIZE
        const z = chunkZ * CHUNK_SIZE + (j / CHUNK_RESOLUTION) * CHUNK_SIZE
        
        const height = getTerrainHeight(x, z)
        vertices.push(x, height, z)
        
        const color = getHeightBasedColor(height)
        colors.push(color.r, color.g, color.b)
      }
    }
    
    // Generate indices with correct winding order
    for (let i = 0; i < CHUNK_RESOLUTION; i++) {
      for (let j = 0; j < CHUNK_RESOLUTION; j++) {
        const a = i * (CHUNK_RESOLUTION + 1) + j
        const b = a + 1
        const c = a + CHUNK_RESOLUTION + 1
        const d = c + 1
        
        indices.push(a, b, c)
        indices.push(b, d, c)
      }
    }
    
    const geometry = new BufferGeometry()
    geometry.setAttribute('position', new BufferAttribute(new Float32Array(vertices), 3))
    geometry.setAttribute('color', new BufferAttribute(new Float32Array(colors), 3))
    geometry.setIndex(indices)
    geometry.computeVertexNormals()
    
    return {
      x: chunkX,
      z: chunkZ,
      key: `${chunkX},${chunkZ}`,
      geometry,
      material: sharedMaterial
    }
  }, [getHeightBasedColor, sharedMaterial])

  const updateChunks = useCallback((playerX: number, playerZ: number) => {
    const playerChunkX = Math.floor(playerX / CHUNK_SIZE)
    const playerChunkZ = Math.floor(playerZ / CHUNK_SIZE)

    // Only update if player moved far enough
    const distanceFromLastUpdate = Math.abs(playerChunkX - lastPlayerChunk.current.x) + 
                                   Math.abs(playerChunkZ - lastPlayerChunk.current.z)
    
    if (distanceFromLastUpdate === 0) {
      return // No change needed
    }

    lastPlayerChunk.current = { x: playerChunkX, z: playerChunkZ }

    const currentChunks = chunksRef.current
    const newChunks = new Map<string, TerrainChunk>()

    // Generate chunks around player
    for (let x = playerChunkX - RENDER_DISTANCE; x <= playerChunkX + RENDER_DISTANCE; x++) {
      for (let z = playerChunkZ - RENDER_DISTANCE; z <= playerChunkZ + RENDER_DISTANCE; z++) {
        const key = `${x},${z}`
        
        // Reuse existing chunk or create new one
        if (currentChunks.has(key)) {
          newChunks.set(key, currentChunks.get(key)!)
        } else {
          newChunks.set(key, createChunk(x, z))
        }
      }
    }

    // Dispose of old chunks that are no longer needed
    currentChunks.forEach((chunk, key) => {
      if (!newChunks.has(key)) {
        chunk.geometry.dispose()
      }
    })

    chunksRef.current = newChunks
    
    // Force a re-render only when chunks actually change
    forceUpdate({})
  }, [createChunk])

  // Throttled chunk updates - only check every few frames
  useFrame(() => {
    frameCount.current += 1
    
    // Only check for updates every 10 frames (reduce from every frame)
    if (frameCount.current % 10 !== 0) {
      return
    }
    
    if (playerRef.current?.position) {
      const { x, z } = playerRef.current.position
      
      // Only update if player moved significantly
      const currentChunkX = Math.floor(x / CHUNK_SIZE)
      const currentChunkZ = Math.floor(z / CHUNK_SIZE)
      const lastChunkX = lastPlayerChunk.current.x
      const lastChunkZ = lastPlayerChunk.current.z
      
      const distance = Math.abs(currentChunkX - lastChunkX) + Math.abs(currentChunkZ - lastChunkZ)
      
      if (distance > 0) {
        updateChunks(x, z)
      }
    }
  })

  return (
    <>
      {/* Terrain meshes */}
      {Array.from(chunksRef.current.values()).map((chunk) => (
        <RigidBody
          key={chunk.key}
          type="fixed"
          colliders="trimesh"
        >
          <mesh 
            geometry={chunk.geometry} 
            material={chunk.material} 
            receiveShadow 
          />
        </RigidBody>
      ))}
      
      {/* Debug: Bright red cubes at chunk centers */}
      {Array.from(chunksRef.current.values()).map((chunk) => (
        <mesh
          key={`debug-${chunk.key}`}
          position={[chunk.x * CHUNK_SIZE + CHUNK_SIZE/2, 10, chunk.z * CHUNK_SIZE + CHUNK_SIZE/2]}
        >
          <boxGeometry args={[4, 4, 4]} />
          <meshBasicMaterial color="red" />
        </mesh>
      ))}
      
      {/* Grass systems for each chunk */}
      {Array.from(chunksRef.current.values()).map((chunk) => (
        <GrassSystem
          key={`grass-${chunk.key}`}
          chunkX={chunk.x}
          chunkZ={chunk.z}
          chunkSize={CHUNK_SIZE}
        />
      ))}
    </>
  )
}