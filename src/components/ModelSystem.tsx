import { useMemo } from 'react'
import { 
  Color,
  Vector3
} from 'three'
import { getTerrainHeight } from '../utils/noise'

interface ModelSystemProps {
  chunkX: number
  chunkZ: number
  chunkSize: number
}

// Model types for variety
enum ModelType {
  TREE = 'tree',
  ROCK = 'rock',
  BUSH = 'bush',
  CRYSTAL = 'crystal'
}

interface ModelInstance {
  position: Vector3
  modelType: ModelType
  scale: number
  rotation: number
}

const MODELS_PER_CHUNK = 8  // Reasonable density
const MIN_MODEL_SPACING = 8  // Minimum distance between models

export default function ModelSystem({ chunkX, chunkZ, chunkSize }: ModelSystemProps) {
  // Generate model instances for this chunk
  const modelInstances = useMemo(() => {
    const instances: ModelInstance[] = []
    const attempts = MODELS_PER_CHUNK * 3 // Try more times to avoid clustering
    
    for (let i = 0; i < attempts && instances.length < MODELS_PER_CHUNK; i++) {
      const localX = Math.random() * chunkSize
      const localZ = Math.random() * chunkSize
      const worldX = chunkX * chunkSize + localX
      const worldZ = chunkZ * chunkSize + localZ
      
      // Check minimum spacing from other models
      const tooClose = instances.some(existing => {
        const distance = existing.position.distanceTo(new Vector3(worldX, 0, worldZ))
        return distance < MIN_MODEL_SPACING
      })
      
      if (tooClose) continue
      
      const terrainHeight = getTerrainHeight(worldX, worldZ)
      
      // Choose model type based on terrain height and random factor
      let modelType: ModelType
      const heightFactor = (terrainHeight + 10) / 20 // Normalize height
      const random = Math.random()
      
      if (heightFactor > 0.7 && random < 0.4) {
        modelType = ModelType.CRYSTAL // Crystals on high areas
      } else if (heightFactor < 0.3 && random < 0.5) {
        modelType = ModelType.ROCK // Rocks in low areas
      } else if (random < 0.6) {
        modelType = ModelType.TREE // Trees are common
      } else {
        modelType = ModelType.BUSH // Bushes fill remaining spots
      }
      
      instances.push({
        position: new Vector3(worldX, terrainHeight, worldZ),
        modelType,
        scale: 0.8 + Math.random() * 0.6, // 0.8 to 1.4 scale
        rotation: Math.random() * Math.PI * 2
      })
    }
    
    console.log(`DEBUG: Chunk (${chunkX}, ${chunkZ}) placed ${instances.length} models`)
    return instances
  }, [chunkX, chunkZ, chunkSize])

  // Create different model components
  const createTree = (instance: ModelInstance, index: number) => (
    <group
      key={`tree-${chunkX}-${chunkZ}-${index}`}
      position={[instance.position.x, instance.position.y, instance.position.z]}
      rotation={[0, instance.rotation, 0]}
      scale={[instance.scale, instance.scale, instance.scale]}
    >
      {/* Tree trunk */}
      <mesh position={[0, 1.5, 0]}>
        <cylinderGeometry args={[0.3, 0.4, 3, 8]} />
        <meshStandardMaterial color={new Color(0.4, 0.2, 0.1)} />
      </mesh>
      {/* Tree foliage */}
      <mesh position={[0, 4, 0]}>
        <coneGeometry args={[2, 3, 8]} />
        <meshStandardMaterial color={new Color(0.1, 0.5, 0.1)} />
      </mesh>
      <mesh position={[0, 5.5, 0]}>
        <coneGeometry args={[1.5, 2.5, 8]} />
        <meshStandardMaterial color={new Color(0.15, 0.6, 0.15)} />
      </mesh>
    </group>
  )

  const createRock = (instance: ModelInstance, index: number) => (
    <mesh
      key={`rock-${chunkX}-${chunkZ}-${index}`}
      position={[instance.position.x, instance.position.y + 0.5, instance.position.z]}
      rotation={[Math.random() * 0.3, instance.rotation, Math.random() * 0.3]}
      scale={[instance.scale, instance.scale * 0.6, instance.scale]}
    >
      <sphereGeometry args={[1, 8, 6]} />
      <meshStandardMaterial color={new Color(0.4, 0.4, 0.5)} />
    </mesh>
  )

  const createBush = (instance: ModelInstance, index: number) => (
    <group
      key={`bush-${chunkX}-${chunkZ}-${index}`}
      position={[instance.position.x, instance.position.y, instance.position.z]}
      rotation={[0, instance.rotation, 0]}
      scale={[instance.scale, instance.scale * 0.7, instance.scale]}
    >
      <mesh position={[0, 0.8, 0]}>
        <sphereGeometry args={[1.2, 8, 6]} />
        <meshStandardMaterial color={new Color(0.1, 0.4, 0.1)} />
      </mesh>
      <mesh position={[0.5, 0.5, 0.3]}>
        <sphereGeometry args={[0.8, 8, 6]} />
        <meshStandardMaterial color={new Color(0.15, 0.5, 0.1)} />
      </mesh>
      <mesh position={[-0.3, 0.6, -0.4]}>
        <sphereGeometry args={[0.9, 8, 6]} />
        <meshStandardMaterial color={new Color(0.12, 0.45, 0.12)} />
      </mesh>
    </group>
  )

  const createCrystal = (instance: ModelInstance, index: number) => (
    <group
      key={`crystal-${chunkX}-${chunkZ}-${index}`}
      position={[instance.position.x, instance.position.y, instance.position.z]}
      rotation={[0, instance.rotation, 0]}
      scale={[instance.scale, instance.scale * 1.5, instance.scale]}
    >
      <mesh position={[0, 1.5, 0]} rotation={[0, 0, 0]}>
        <coneGeometry args={[0.5, 3, 6]} />
        <meshStandardMaterial 
          color={new Color(0.7, 0.3, 0.8)} 
          transparent
          opacity={0.8}
          emissive={new Color(0.1, 0.05, 0.15)}
        />
      </mesh>
      <mesh position={[0.8, 1, 0.5]} rotation={[0.2, 0.5, 0.1]}>
        <coneGeometry args={[0.3, 2, 6]} />
        <meshStandardMaterial 
          color={new Color(0.5, 0.3, 0.9)} 
          transparent
          opacity={0.7}
          emissive={new Color(0.05, 0.05, 0.1)}
        />
      </mesh>
      <mesh position={[-0.6, 0.8, -0.3]} rotation={[-0.1, -0.3, 0.2]}>
        <coneGeometry args={[0.4, 1.8, 6]} />
        <meshStandardMaterial 
          color={new Color(0.6, 0.2, 0.7)} 
          transparent
          opacity={0.75}
          emissive={new Color(0.08, 0.02, 0.1)}
        />
      </mesh>
    </group>
  )

  return (
    <>
      {modelInstances.map((instance, index) => {
        switch (instance.modelType) {
          case ModelType.TREE:
            return createTree(instance, index)
          case ModelType.ROCK:
            return createRock(instance, index)
          case ModelType.BUSH:
            return createBush(instance, index)
          case ModelType.CRYSTAL:
            return createCrystal(instance, index)
          default:
            return null
        }
      })}
    </>
  )
}