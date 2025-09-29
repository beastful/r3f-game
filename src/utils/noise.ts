import { createNoise2D } from 'simplex-noise'

// Initialize multiple noise functions for different purposes
const terrainNoiseFunc = createNoise2D()
const grassNoise = createNoise2D()
const detailNoise = createNoise2D()

// Export the terrain noise function for use in other components
export const terrainNoise = terrainNoiseFunc

export interface TerrainConfig {
  scale: number
  amplitude: number
  octaves: number
  persistence: number
  lacunarity: number
}

export interface GrassConfig {
  scale: number
  density: number
  minHeight: number
  maxHeight: number
  maxSlope: number
}

// Enhanced terrain configuration with more variety
export const defaultTerrainConfig: TerrainConfig = {
  scale: 0.01,       // Slightly increased for more variation
  amplitude: 12,     // Much more dramatic terrain
  octaves: 4,        // Balanced detail
  persistence: 0.6,  // Better detail preservation
  lacunarity: 2.2,   // More frequency variation
}

// Grass placement configuration
export const defaultGrassConfig: GrassConfig = {
  scale: 0.03,       // Larger grass patches
  density: 0.6,      // 60% grass coverage - much more visible
  minHeight: -5,     // Allow grass at lower heights
  maxHeight: 12,     // Allow grass at higher elevations
  maxSlope: 1.2,     // Allow grass on steeper slopes
}

/**
 * Generate terrain height using enhanced fractal noise with more variety
 */
export function getTerrainHeight(x: number, z: number, config = defaultTerrainConfig): number {
  let height = 0
  let amplitude = config.amplitude
  let frequency = config.scale
  let maxValue = 0

  // Main terrain layers
  for (let i = 0; i < config.octaves; i++) {
    height += terrainNoiseFunc(x * frequency, z * frequency) * amplitude
    maxValue += amplitude
    amplitude *= config.persistence
    frequency *= config.lacunarity
  }

  // Add fine detail layer for surface variation
  height += detailNoise(x * 0.1, z * 0.1) * 0.8
  
  // Add some ridges and valleys for variety
  const ridgeNoise = Math.abs(terrainNoiseFunc(x * 0.02, z * 0.02)) * 3
  const valleyNoise = Math.pow(terrainNoiseFunc(x * 0.01, z * 0.01), 2) * -2
  
  height += ridgeNoise + valleyNoise

  return height / maxValue
}

/**
 * Determine if grass should be placed at a given position
 */
export function shouldPlaceGrass(
  x: number, 
  z: number, 
  terrainHeight: number, 
  terrainSlope: number = 0,
  config = defaultGrassConfig
): boolean {
  // Check height constraints
  if (terrainHeight < config.minHeight || terrainHeight > config.maxHeight) {
    return false
  }
  
  // Check slope constraints (no grass on steep slopes)
  if (terrainSlope > config.maxSlope) {
    return false
  }
  
  // Use noise to create grass patches
  const grassValue = (grassNoise(x * config.scale, z * config.scale) + 1) / 2 // Normalize to 0-1
  
  return grassValue < config.density
}

/**
 * Get grass density at a position (0-1 range)
 */
export function getGrassDensity(x: number, z: number, config = defaultGrassConfig): number {
  const grassValue = (grassNoise(x * config.scale, z * config.scale) + 1) / 2
  return Math.max(0, Math.min(1, grassValue))
}

/**
 * Generate a chunk of terrain vertices
 */
export function generateTerrainChunk(
  chunkX: number,
  chunkZ: number,
  chunkSize: number,
  resolution: number,
  config = defaultTerrainConfig
): Float32Array {
  const vertices: number[] = []
  const stepSize = chunkSize / resolution

  for (let i = 0; i <= resolution; i++) {
    for (let j = 0; j <= resolution; j++) {
      const x = chunkX * chunkSize + i * stepSize
      const z = chunkZ * chunkSize + j * stepSize
      const y = getTerrainHeight(x, z, config)

      vertices.push(x, y, z)
    }
  }

  return new Float32Array(vertices)
}

/**
 * Generate terrain indices for triangulated mesh
 */
export function generateTerrainIndices(resolution: number): Uint16Array {
  const indices: number[] = []

  for (let i = 0; i < resolution; i++) {
    for (let j = 0; j < resolution; j++) {
      const a = i * (resolution + 1) + j
      const b = a + 1
      const c = a + resolution + 1
      const d = c + 1

      // First triangle
      indices.push(a, c, b)
      // Second triangle  
      indices.push(b, c, d)
    }
  }

  return new Uint16Array(indices)
}

/**
 * Generate terrain normals for proper lighting
 */
export function generateTerrainNormals(vertices: Float32Array, indices: Uint16Array): Float32Array {
  const normals = new Float32Array(vertices.length)
  
  // Initialize normals to zero
  for (let i = 0; i < normals.length; i++) {
    normals[i] = 0
  }

  // Calculate face normals and accumulate vertex normals
  for (let i = 0; i < indices.length; i += 3) {
    const i1 = indices[i] * 3
    const i2 = indices[i + 1] * 3
    const i3 = indices[i + 2] * 3

    const v1x = vertices[i1], v1y = vertices[i1 + 1], v1z = vertices[i1 + 2]
    const v2x = vertices[i2], v2y = vertices[i2 + 1], v2z = vertices[i2 + 2]
    const v3x = vertices[i3], v3y = vertices[i3 + 1], v3z = vertices[i3 + 2]

    // Calculate edge vectors
    const e1x = v2x - v1x, e1y = v2y - v1y, e1z = v2z - v1z
    const e2x = v3x - v1x, e2y = v3y - v1y, e2z = v3z - v1z

    // Calculate cross product (face normal)
    const nx = e1y * e2z - e1z * e2y
    const ny = e1z * e2x - e1x * e2z
    const nz = e1x * e2y - e1y * e2x

    // Accumulate normals for each vertex of the face
    normals[i1] += nx; normals[i1 + 1] += ny; normals[i1 + 2] += nz
    normals[i2] += nx; normals[i2 + 1] += ny; normals[i2 + 2] += nz
    normals[i3] += nx; normals[i3 + 1] += ny; normals[i3 + 2] += nz
  }

  // Normalize all vertex normals
  for (let i = 0; i < normals.length; i += 3) {
    const length = Math.sqrt(normals[i] * normals[i] + normals[i + 1] * normals[i + 1] + normals[i + 2] * normals[i + 2])
    if (length > 0) {
      normals[i] /= length
      normals[i + 1] /= length
      normals[i + 2] /= length
    }
  }

  return normals
}