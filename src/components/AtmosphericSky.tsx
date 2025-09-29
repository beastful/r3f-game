import { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { 
  ShaderMaterial, 
  Color, 
  Vector3, 
  BufferGeometry,
  BufferAttribute,
  AdditiveBlending,
  Mesh,
  Points,
  Group
} from 'three'

interface AtmosphericSkyProps {
  timeOfDay?: number // 0-1, where 0.5 is noon
}

const STAR_COUNT = 2000
const COMET_COUNT = 3

export default function AtmosphericSky({ timeOfDay = 0.3 }: AtmosphericSkyProps) {
  const { camera } = useThree()
  const skyRef = useRef<Mesh>(null)
  const starsRef = useRef<Points>(null)
  const cometsRef = useRef<Group>(null)
  const timeRef = useRef(0)

  // Procedural star field generation
  const starGeometry = useMemo(() => {
    const geometry = new BufferGeometry()
    const positions = new Float32Array(STAR_COUNT * 3)
    const colors = new Float32Array(STAR_COUNT * 3)
    const sizes = new Float32Array(STAR_COUNT)

    for (let i = 0; i < STAR_COUNT; i++) {
      // Distribute stars on sphere surface
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const radius = 800

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = radius * Math.cos(phi)
      positions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta)

      // Star color variation (white to blue-white)
      const temp = 0.8 + Math.random() * 0.2
      colors[i * 3] = temp
      colors[i * 3 + 1] = temp * 0.95
      colors[i * 3 + 2] = 1.0

      // Star size variation
      sizes[i] = Math.random() * 3 + 1
    }

    geometry.setAttribute('position', new BufferAttribute(positions, 3))
    geometry.setAttribute('color', new BufferAttribute(colors, 3))
    geometry.setAttribute('size', new BufferAttribute(sizes, 1))

    return geometry
  }, [])

  // Star material with custom shader
  const starMaterial = useMemo(() => new ShaderMaterial({
    vertexShader: `
      attribute float size;
      attribute vec3 color;
      
      varying vec3 vColor;
      varying float vVisibility;
      
      uniform float timeOfDay;
      uniform float starOpacity;
      
      void main() {
        vColor = color;
        
        // Stars more visible at night
        vVisibility = starOpacity * (1.0 - smoothstep(0.2, 0.8, timeOfDay));
        
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = size * (300.0 / -mvPosition.z) * vVisibility;
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      varying vec3 vColor;
      varying float vVisibility;
      
      void main() {
        if (vVisibility < 0.1) discard;
        
        float distanceToCenter = length(gl_PointCoord - vec2(0.5));
        float opacity = 1.0 - smoothstep(0.0, 0.5, distanceToCenter);
        opacity *= vVisibility;
        
        gl_FragColor = vec4(vColor, opacity);
      }
    `,
    uniforms: {
      timeOfDay: { value: timeOfDay },
      starOpacity: { value: 1.0 }
    },
    transparent: true,
    blending: AdditiveBlending,
    depthWrite: false
  }), [timeOfDay])

  // Sky dome with atmospheric gradient shader
  const skyMaterial = useMemo(() => new ShaderMaterial({
    vertexShader: `
      varying vec3 vWorldPosition;
      varying vec3 vNormal;
      
      void main() {
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPosition.xyz;
        vNormal = normalize(normalMatrix * normal);
        
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float timeOfDay;
      uniform vec3 sunDirection;
      varying vec3 vWorldPosition;
      varying vec3 vNormal;
      
      vec3 getSkyColor(vec3 direction, float time) {
        float elevation = direction.y;
        float sunDot = dot(direction, sunDirection);
        
        // Base sky colors for different times
        vec3 dayColor = vec3(0.5, 0.7, 1.0);
        vec3 sunsetColor = vec3(1.0, 0.6, 0.3);
        vec3 nightColor = vec3(0.02, 0.02, 0.1);
        
        // Horizon glow
        float horizon = 1.0 - abs(elevation);
        horizon = pow(horizon, 2.0);
        
        // Sun influence
        float sunInfluence = max(0.0, sunDot);
        sunInfluence = pow(sunInfluence, 8.0);
        
        // Time-based color mixing
        vec3 color;
        if (time < 0.3) {
          // Night to sunrise
          float t = time / 0.3;
          color = mix(nightColor, sunsetColor, t);
        } else if (time < 0.7) {
          // Day
          float t = (time - 0.3) / 0.4;
          color = mix(sunsetColor, dayColor, t);
        } else {
          // Sunset to night
          float t = (time - 0.7) / 0.3;
          color = mix(dayColor, nightColor, t);
        }
        
        // Add sun glow
        color += sunInfluence * vec3(1.0, 0.8, 0.4) * 0.5;
        
        // Add horizon glow
        color += horizon * sunsetColor * 0.3;
        
        // Atmospheric perspective
        float atmosphericFade = 1.0 - exp(-elevation * 2.0);
        color = mix(color, dayColor * 0.5, atmosphericFade * 0.3);
        
        return color;
      }
      
      void main() {
        vec3 direction = normalize(vWorldPosition);
        vec3 color = getSkyColor(direction, timeOfDay);
        
        gl_FragColor = vec4(color, 1.0);
      }
    `,
    uniforms: {
      timeOfDay: { value: timeOfDay },
      sunDirection: { value: new Vector3(0.2, 0.5, 0.3).normalize() }
    },
    side: 2, // Both sides
    depthWrite: false,
    depthTest: false
  }), [timeOfDay])

  // Comet generation
  const comets = useMemo(() => {
    const cometData = []
    for (let i = 0; i < COMET_COUNT; i++) {
      cometData.push({
        startPosition: new Vector3(
          (Math.random() - 0.5) * 1600,
          600 + Math.random() * 400,
          (Math.random() - 0.5) * 1600
        ),
        endPosition: new Vector3(
          (Math.random() - 0.5) * 1600,
          -200,
          (Math.random() - 0.5) * 1600
        ),
        speed: 0.3 + Math.random() * 0.7,
        trailLength: 50 + Math.random() * 100,
        delay: Math.random() * 20, // Stagger comet appearances
        color: new Color().setHSL(0.6 + Math.random() * 0.3, 0.8, 0.9)
      })
    }
    return cometData
  }, [])

  // Animate sky elements
  useFrame((_state, delta) => {
    timeRef.current += delta * 0.1 // Slow time progression

    // Update star material time
    if (starMaterial.uniforms.timeOfDay) {
      starMaterial.uniforms.timeOfDay.value = timeOfDay
    }

    // Update sky material time  
    if (skyMaterial.uniforms.timeOfDay) {
      skyMaterial.uniforms.timeOfDay.value = timeOfDay
    }

    // Rotate star field slowly
    if (starsRef.current) {
      starsRef.current.rotation.y += delta * 0.01
    }

    // Animate comets
    if (cometsRef.current) {
      cometsRef.current.children.forEach((comet: any, index: number) => {
        const cometData = comets[index]
        if (!cometData) return

        const time = (timeRef.current + cometData.delay) * cometData.speed
        const progress = (time % 30) / 30 // 30 second cycle

        if (progress > 0 && progress < 1) {
          const position = new Vector3().lerpVectors(
            cometData.startPosition,
            cometData.endPosition,
            progress
          )
          comet.position.copy(position)
          comet.visible = true

          // Look at movement direction
          const direction = new Vector3().subVectors(
            cometData.endPosition,
            cometData.startPosition
          ).normalize()
          comet.lookAt(comet.position.clone().add(direction))
        } else {
          comet.visible = false
        }
      })
    }

    // Keep sky centered on camera
    if (skyRef.current) {
      skyRef.current.position.copy(camera.position)
    }
  })

  return (
    <group>
      {/* Sky Dome */}
      <mesh ref={skyRef} renderOrder={-1}>
        <sphereGeometry args={[1000, 32, 16]} />
        <primitive object={skyMaterial} attach="material" />
      </mesh>

      {/* Star Field */}
      <points ref={starsRef}>
        <primitive object={starGeometry} attach="geometry" />
        <primitive object={starMaterial} attach="material" />
      </points>

      {/* Comets */}
      <group ref={cometsRef}>
        {comets.map((comet, index) => (
          <mesh key={index} visible={false}>
            <sphereGeometry args={[1, 8, 6]} />
            <meshBasicMaterial 
              color={comet.color}
              transparent
              opacity={0.8}
            />
            {/* Comet tail */}
            <mesh position={[0, 0, -comet.trailLength / 2]} rotation={[Math.PI / 2, 0, 0]}>
              <coneGeometry args={[2, comet.trailLength, 4]} />
              <meshBasicMaterial 
                color={comet.color}
                transparent
                opacity={0.3}
              />
            </mesh>
          </mesh>
        ))}
      </group>
    </group>
  )
}