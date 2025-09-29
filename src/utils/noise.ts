import { createNoise2D } from 'simplex-noise'

// Initialize noise function
const noise2D = createNoise2D()

export interface TerrainConfig {
  scale: number
  amplitude: number
  octaves: number
  persistence: number
  lacunarity: number
}

// Default terrain configuration
export const defaultTerrainConfig: TerrainConfig = {
  scale: 0.02,
  amplitude: 8,
  octaves: 4,
  persistence: 0.5,
  lacunarity: 2,
}

/**
 * Generate terrain height using fractal noise (multiple octaves)
 */
export function getTerrainHeight(x: number, z: number, config = defaultTerrainConfig): number {
  let height = 0
  let amplitude = config.amplitude
  let frequency = config.scale
  let maxValue = 0

  for (let i = 0; i < config.octaves; i++) {
    height += noise2D(x * frequency, z * frequency) * amplitude
    maxValue += amplitude
    amplitude *= config.persistence
    frequency *= config.lacunarity
  }

  return height / maxValue
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