import { useMemo, useState, useRef, useCallback, useEffect } from 'react'
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

const CHUNK_SIZE = 50
const CHUNK_RESOLUTION = 32
const RENDER_DISTANCE = 2 // Chunks around player

export default function Terrain({ playerRef }: TerrainProps) {
  const [chunks, setChunks] = useState<Map<string, TerrainChunk>>(new Map())
  const lastPlayerChunk = useRef({ x: 0, z: 0 })
  
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
    const normalizedHeight = (height + 10) / 20 // Normalize to 0-1 based on expected range
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
        
        // Use Perlin noise for consistent terrain height
        const height = getTerrainHeight(x, z)
        
        vertices.push(x, height, z)
        
        // Add height-based color
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
        
        // Counter-clockwise winding for correct normals
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

    // Check if we need to update chunks
    const distanceFromLastUpdate = Math.abs(playerChunkX - lastPlayerChunk.current.x) + 
                                   Math.abs(playerChunkZ - lastPlayerChunk.current.z)
    
    if (distanceFromLastUpdate === 0) {
      return // No need to update
    }

    lastPlayerChunk.current = { x: playerChunkX, z: playerChunkZ }

    const newChunks = new Map<string, TerrainChunk>()

    // Generate chunks around player
    for (let x = playerChunkX - RENDER_DISTANCE; x <= playerChunkX + RENDER_DISTANCE; x++) {
      for (let z = playerChunkZ - RENDER_DISTANCE; z <= playerChunkZ + RENDER_DISTANCE; z++) {
        const key = `${x},${z}`
        
        // Reuse existing chunk or create new one
        if (chunks.has(key)) {
          newChunks.set(key, chunks.get(key)!)
        } else {
          newChunks.set(key, createChunk(x, z))
        }
      }
    }

    // Dispose of old chunks that are no longer needed
    chunks.forEach((chunk, key) => {
      if (!newChunks.has(key)) {
        chunk.geometry.dispose()
      }
    })

    setChunks(newChunks)
  }, [chunks, createChunk])

  // Listen for player movement and update chunks
  useFrame(() => {
    if (playerRef.current?.position) {
      const { x, z } = playerRef.current.position
      updateChunks(x, z)
    }
  })

  // Initialize with chunks around origin
  useEffect(() => {
    updateChunks(0, 0)
  }, [updateChunks])

  return (
    <>
      {Array.from(chunks.values()).map((chunk) => (
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
    </>
  )
}