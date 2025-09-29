import { useMemo } from 'react'
import { 
  BoxGeometry, 
  MeshBasicMaterial,
  Color,
  Vector3
} from 'three'
import { getTerrainHeight } from '../utils/noise'

interface GrassSystemProps {
  chunkX: number
  chunkZ: number
  chunkSize: number
}

// Simplified parameters for guaranteed visibility
const GRASS_SIZE = 2.0              // Very large for visibility
const GRASS_HEIGHT = 4.0            // Tall grass

export default function GrassSystem({ chunkX, chunkZ, chunkSize }: GrassSystemProps) {
  // Generate simple grass positions - guaranteed to be visible
  const grassPositions = useMemo(() => {
    const positions: Vector3[] = []
    
    // Create a grid of grass positions for guaranteed visibility
    const grassSpacing = chunkSize / 8 // 8x8 grid of grass per chunk
    
    for (let x = 1; x < 8; x++) {
      for (let z = 1; z < 8; z++) {
        const worldX = chunkX * chunkSize + x * grassSpacing
        const worldZ = chunkZ * chunkSize + z * grassSpacing
        const terrainHeight = getTerrainHeight(worldX, worldZ)
        
        positions.push(new Vector3(worldX, terrainHeight + GRASS_HEIGHT/2, worldZ))
      }
    }
    
    console.log(`DEBUG: Chunk (${chunkX}, ${chunkZ}) created ${positions.length} grass cubes`)
    return positions
  }, [chunkX, chunkZ, chunkSize])

  // Simple geometry and bright green material
  const geometry = useMemo(() => new BoxGeometry(GRASS_SIZE, GRASS_HEIGHT, GRASS_SIZE/4), [])
  const material = useMemo(() => new MeshBasicMaterial({ 
    color: new Color(0.2, 0.8, 0.2), // Bright green
    transparent: false
  }), [])

  return (
    <>
      {grassPositions.map((position, i) => (
        <mesh
          key={`grass-${chunkX}-${chunkZ}-${i}`}
          geometry={geometry}
          material={material}
          position={position}
        />
      ))}
    </>
  )
}