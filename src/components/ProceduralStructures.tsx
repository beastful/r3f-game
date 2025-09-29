import { useMemo } from 'react'
import { Vector3 } from 'three'

interface Structure {
  id: number
  type: 'house' | 'dungeon'
  position: Vector3
  rotation: number
  scale: number
  variant: number
}

interface ProceduralStructuresProps {
  chunkX: number
  chunkZ: number
  chunkSize: number
  heightMap: (x: number, z: number) => number
  noise: (x: number, z: number) => number
}

export default function ProceduralStructures({ 
  chunkX, 
  chunkZ, 
  chunkSize, 
  heightMap, 
  noise 
}: ProceduralStructuresProps) {
  
  // Generate structures for this chunk
  const structures = useMemo(() => {
    const structureList: Structure[] = []
    const chunkCenterX = chunkX * chunkSize
    const chunkCenterZ = chunkZ * chunkSize
    
    // Generate a deterministic seed for this chunk
    const chunkSeed = chunkX * 73856093 + chunkZ * 19349663
    const random = (seed: number) => {
      const x = Math.sin(seed) * 10000
      return x - Math.floor(x)
    }
    
    // Check if this chunk should have structures (about 30% chance)
    const structureChance = random(chunkSeed)
    if (structureChance < 0.7) return structureList
    
    // Determine number of structures (1-2 per chunk)
    const numStructures = Math.floor(random(chunkSeed + 1) * 2) + 1
    
    for (let i = 0; i < numStructures; i++) {
      const structSeed = chunkSeed + i * 12345
      
      // Random position within chunk (avoid edges)
      const margin = chunkSize * 0.2
      const x = chunkCenterX + (random(structSeed) - 0.5) * (chunkSize - margin * 2)
      const z = chunkCenterZ + (random(structSeed + 1) - 0.5) * (chunkSize - margin * 2)
      
      // Get terrain height at this position
      const y = heightMap(x, z)
      
      // Check terrain suitability (avoid too steep areas)
      const suitability = noise(x * 0.01, z * 0.01)
      if (Math.abs(suitability) > 0.5) continue // Skip unsuitable terrain
      
      // Determine structure type based on terrain height and noise
      const typeRandom = random(structSeed + 2)
      let type: 'house' | 'dungeon'
      
      if (y > 20) {
        // Higher elevations prefer dungeons (ruins on mountains)
        type = typeRandom < 0.7 ? 'dungeon' : 'house'
      } else {
        // Lower elevations prefer houses (settlements in valleys)
        type = typeRandom < 0.7 ? 'house' : 'dungeon'
      }
      
      structureList.push({
        id: i,
        type,
        position: new Vector3(x, y, z),
        rotation: random(structSeed + 3) * Math.PI * 2,
        scale: 0.8 + random(structSeed + 4) * 0.6, // 0.8 - 1.4 scale
        variant: Math.floor(random(structSeed + 5) * 3) // 0, 1, or 2
      })
    }
    
    return structureList
  }, [chunkX, chunkZ, chunkSize, heightMap, noise])

  return (
    <group>
      {structures.map(structure => (
        structure.type === 'house' ? (
          <ProceduralHouse key={structure.id} structure={structure} />
        ) : (
          <ProceduralDungeon key={structure.id} structure={structure} />
        )
      ))}
    </group>
  )
}

// Procedural House Component
function ProceduralHouse({ structure }: { structure: Structure }) {
  const houseGeometry = useMemo(() => {
    const variant = structure.variant
    
    // Base house dimensions (vary by variant)
    const width = 4 + variant * 1.5
    const height = 3 + variant * 0.5
    const depth = 4 + variant * 1.2
    
    return {
      // Main building
      main: {
        geometry: [width, height, depth] as [number, number, number],
        position: new Vector3(0, height / 2, 0),
        color: variant === 0 ? "#8B4513" : variant === 1 ? "#A0522D" : "#CD853F" // Brown variants
      },
      
      // Roof
      roof: {
        geometry: [width + 0.5, height * 0.4, depth + 0.5] as [number, number, number],
        position: new Vector3(0, height + (height * 0.2), 0),
        color: variant === 0 ? "#654321" : variant === 1 ? "#8B4513" : "#A0522D" // Darker roof
      },
      
      // Door
      door: {
        geometry: [0.8, 1.8, 0.1] as [number, number, number],
        position: new Vector3(0, 0.9, depth / 2 + 0.05),
        color: "#4A4A4A" // Dark gray door
      },
      
      // Windows (2 on front)
      window1: {
        geometry: [0.8, 0.8, 0.05] as [number, number, number],
        position: new Vector3(-width * 0.3, height * 0.6, depth / 2 + 0.05),
        color: "#87CEEB" // Light blue window
      },
      
      window2: {
        geometry: [0.8, 0.8, 0.05] as [number, number, number],
        position: new Vector3(width * 0.3, height * 0.6, depth / 2 + 0.05),
        color: "#87CEEB" // Light blue window
      },
      
      // Chimney (only on variants 1 and 2)
      ...(variant > 0 && {
        chimney: {
          geometry: [0.6, height * 0.8, 0.6] as [number, number, number],
          position: new Vector3(width * 0.3, height + height * 0.4, -depth * 0.2),
          color: "#696969" // Dark gray chimney
        }
      })
    }
  }, [structure.variant])

  return (
    <group 
      position={structure.position} 
      rotation={[0, structure.rotation, 0]} 
      scale={structure.scale}
    >
      {/* Main building */}
      <mesh position={houseGeometry.main.position}>
        <boxGeometry args={houseGeometry.main.geometry} />
        <meshStandardMaterial color={houseGeometry.main.color} />
      </mesh>
      
      {/* Roof */}
      <mesh position={houseGeometry.roof.position}>
        <boxGeometry args={houseGeometry.roof.geometry} />
        <meshStandardMaterial color={houseGeometry.roof.color} />
      </mesh>
      
      {/* Door */}
      <mesh position={houseGeometry.door.position}>
        <boxGeometry args={houseGeometry.door.geometry} />
        <meshStandardMaterial color={houseGeometry.door.color} />
      </mesh>
      
      {/* Windows */}
      <mesh position={houseGeometry.window1.position}>
        <boxGeometry args={houseGeometry.window1.geometry} />
        <meshStandardMaterial color={houseGeometry.window1.color} transparent opacity={0.7} />
      </mesh>
      
      <mesh position={houseGeometry.window2.position}>
        <boxGeometry args={houseGeometry.window2.geometry} />
        <meshStandardMaterial color={houseGeometry.window2.color} transparent opacity={0.7} />
      </mesh>
      
      {/* Chimney (if variant has one) */}
      {houseGeometry.chimney && (
        <mesh position={houseGeometry.chimney.position}>
          <boxGeometry args={houseGeometry.chimney.geometry} />
          <meshStandardMaterial color={houseGeometry.chimney.color} />
        </mesh>
      )}
    </group>
  )
}

// Procedural Dungeon Component
function ProceduralDungeon({ structure }: { structure: Structure }) {
  const dungeonGeometry = useMemo(() => {
    const variant = structure.variant
    
    // Base dungeon dimensions (vary by variant)
    const width = 6 + variant * 2
    const height = 2 + variant * 0.5
    const depth = 6 + variant * 2
    
    return {
      // Main dungeon hall
      main: {
        geometry: [width, height, depth] as [number, number, number],
        position: new Vector3(0, -height / 2, 0), // Underground
        color: "#2F4F4F" // Dark slate gray
      },
      
      // Entrance stairs
      entrance: {
        geometry: [2, height / 2, 3] as [number, number, number],
        position: new Vector3(0, -height / 4, depth / 2 + 1.5),
        color: "#696969" // Darker gray for stairs
      },
      
      // Pillars (vary by variant)
      pillar1: {
        geometry: [0.5, height + 1, 0.5] as [number, number, number],
        position: new Vector3(-width * 0.3, 0, -depth * 0.3),
        color: "#708090" // Slate gray pillars
      },
      
      pillar2: {
        geometry: [0.5, height + 1, 0.5] as [number, number, number],
        position: new Vector3(width * 0.3, 0, -depth * 0.3),
        color: "#708090"
      },
      
      // Back wall with runes (variant 2 only)
      ...(variant === 2 && {
        runeWall: {
          geometry: [width * 0.8, height * 0.8, 0.1] as [number, number, number],
          position: new Vector3(0, -height / 4, -depth / 2 + 0.05),
          color: "#4B0082" // Indigo for mystical runes
        }
      }),
      
      // Treasure chest (variant 1 and 2)
      ...(variant > 0 && {
        chest: {
          geometry: [1, 0.8, 0.8] as [number, number, number],
          position: new Vector3(0, -height / 2 + 0.4, -depth * 0.3),
          color: "#B8860B" // Dark golden rod
        }
      })
    }
  }, [structure.variant])

  return (
    <group 
      position={structure.position} 
      rotation={[0, structure.rotation, 0]} 
      scale={structure.scale}
    >
      {/* Main dungeon hall */}
      <mesh position={dungeonGeometry.main.position}>
        <boxGeometry args={dungeonGeometry.main.geometry} />
        <meshStandardMaterial color={dungeonGeometry.main.color} />
      </mesh>
      
      {/* Entrance stairs */}
      <mesh position={dungeonGeometry.entrance.position}>
        <boxGeometry args={dungeonGeometry.entrance.geometry} />
        <meshStandardMaterial color={dungeonGeometry.entrance.color} />
      </mesh>
      
      {/* Pillars */}
      <mesh position={dungeonGeometry.pillar1.position}>
        <cylinderGeometry args={[dungeonGeometry.pillar1.geometry[0], dungeonGeometry.pillar1.geometry[0], dungeonGeometry.pillar1.geometry[1], 8]} />
        <meshStandardMaterial color={dungeonGeometry.pillar1.color} />
      </mesh>
      
      <mesh position={dungeonGeometry.pillar2.position}>
        <cylinderGeometry args={[dungeonGeometry.pillar2.geometry[0], dungeonGeometry.pillar2.geometry[0], dungeonGeometry.pillar2.geometry[1], 8]} />
        <meshStandardMaterial color={dungeonGeometry.pillar2.color} />
      </mesh>
      
      {/* Rune wall (variant 2 only) */}
      {dungeonGeometry.runeWall && (
        <mesh position={dungeonGeometry.runeWall.position}>
          <boxGeometry args={dungeonGeometry.runeWall.geometry} />
          <meshStandardMaterial 
            color={dungeonGeometry.runeWall.color} 
            emissive="#1a1a2e"
            emissiveIntensity={0.3}
          />
        </mesh>
      )}
      
      {/* Treasure chest */}
      {dungeonGeometry.chest && (
        <mesh position={dungeonGeometry.chest.position}>
          <boxGeometry args={dungeonGeometry.chest.geometry} />
          <meshStandardMaterial 
            color={dungeonGeometry.chest.color}
            metalness={0.7}
            roughness={0.3}
          />
        </mesh>
      )}
    </group>
  )
}