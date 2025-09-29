import { useRef, useEffect, useState, useCallback } from 'react'
import { useFrame } from '@react-three/fiber'
import { RigidBody } from '@react-three/rapier'
import { Vector3, BufferGeometry, BufferAttribute } from 'three'
import { generateTerrainChunk, generateTerrainIndices, generateTerrainNormals } from '../utils/noise'

interface TerrainProps {
  playerRef: React.MutableRefObject<{ position: Vector3 } | null>
}

interface TerrainChunk {
  x: number
  z: number
  geometry: BufferGeometry
  vertices: Float32Array
}

const CHUNK_SIZE = 50
const CHUNK_RESOLUTION = 32
const RENDER_DISTANCE = 3 // Chunks around player

export default function Terrain({ playerRef }: TerrainProps) {
  const [chunks, setChunks] = useState<Map<string, TerrainChunk>>(new Map())
  const lastPlayerChunk = useRef({ x: 0, z: 0 })

  const createChunk = (chunkX: number, chunkZ: number): TerrainChunk => {
    const vertices = generateTerrainChunk(chunkX, chunkZ, CHUNK_SIZE, CHUNK_RESOLUTION)
    const indices = generateTerrainIndices(CHUNK_RESOLUTION)
    const normals = generateTerrainNormals(vertices, indices)

    const geometry = new BufferGeometry()
    geometry.setAttribute('position', new BufferAttribute(vertices, 3))
    geometry.setAttribute('normal', new BufferAttribute(normals, 3))
    geometry.setIndex(new BufferAttribute(indices, 1))

    return {
      x: chunkX,
      z: chunkZ,
      geometry,
      vertices,
    }
  }

  const getChunkKey = (x: number, z: number) => `${x},${z}`

  const updateChunks = useCallback((playerX: number, playerZ: number) => {
    const playerChunkX = Math.floor(playerX / CHUNK_SIZE)
    const playerChunkZ = Math.floor(playerZ / CHUNK_SIZE)

    // Only update if player moved to a different chunk
    if (playerChunkX === lastPlayerChunk.current.x && playerChunkZ === lastPlayerChunk.current.z) {
      return
    }

    lastPlayerChunk.current = { x: playerChunkX, z: playerChunkZ }

    const newChunks = new Map<string, TerrainChunk>()

    // Generate chunks around player
    for (let x = playerChunkX - RENDER_DISTANCE; x <= playerChunkX + RENDER_DISTANCE; x++) {
      for (let z = playerChunkZ - RENDER_DISTANCE; z <= playerChunkZ + RENDER_DISTANCE; z++) {
        const key = getChunkKey(x, z)
        
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
  }, [chunks])

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
          key={getChunkKey(chunk.x, chunk.z)}
          type="fixed"
          colliders="trimesh"
        >
          <mesh
            geometry={chunk.geometry}
            receiveShadow
          >
            <meshStandardMaterial 
              color="#4a7c59" 
              wireframe={false}
              roughness={0.9}
              metalness={0.0}
              transparent={false}
              opacity={1.0}
              side={0} // THREE.FrontSide
            />
          </mesh>
        </RigidBody>
      ))}
    </>
  )
}