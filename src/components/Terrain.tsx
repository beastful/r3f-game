import { useMemo } from 'react'
import { RigidBody } from '@react-three/rapier'
import { 
  BufferGeometry, 
  BufferAttribute, 
  ShaderMaterial, 
  Color 
} from 'three'

export default function Terrain() {
  // Simple terrain geometry
  const { geometry, material } = useMemo(() => {
    const size = 100
    const resolution = 64
    const vertices: number[] = []
    const indices: number[] = []
    const colors: number[] = []
    
    // Generate terrain vertices with simple noise
    for (let i = 0; i <= resolution; i++) {
      for (let j = 0; j <= resolution; j++) {
        const x = (i / resolution) * size - size / 2
        const z = (j / resolution) * size - size / 2
        
        // Simple height calculation
        const height = Math.sin(x * 0.1) * Math.cos(z * 0.1) * 3 + 
                      Math.sin(x * 0.05) * Math.cos(z * 0.05) * 6
        
        vertices.push(x, height, z)
        
        // Color based on height
        const normalizedHeight = (height + 9) / 18 // Normalize to 0-1
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
        
        colors.push(color.r, color.g, color.b)
      }
    }
    
    // Generate indices
    for (let i = 0; i < resolution; i++) {
      for (let j = 0; j < resolution; j++) {
        const a = i * (resolution + 1) + j
        const b = a + 1
        const c = a + resolution + 1
        const d = c + 1
        
        indices.push(a, b, c)
        indices.push(b, d, c)
      }
    }
    
    const geom = new BufferGeometry()
    geom.setAttribute('position', new BufferAttribute(new Float32Array(vertices), 3))
    geom.setAttribute('color', new BufferAttribute(new Float32Array(colors), 3))
    geom.setIndex(indices)
    geom.computeVertexNormals()
    
    const mat = new ShaderMaterial({
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
    })
    
    return { geometry: geom, material: mat }
  }, [])

  return (
    <RigidBody type="fixed" colliders="trimesh">
      <mesh geometry={geometry} material={material} receiveShadow />
    </RigidBody>
  )
}