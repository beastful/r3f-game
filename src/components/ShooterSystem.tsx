import { useRef, useState, useCallback } from 'react'
import type { ReactNode } from 'react'
import { useFrame } from '@react-three/fiber'
import { RigidBody, RapierRigidBody } from '@react-three/rapier'
import { Vector3, Mesh } from 'three'
import { ShooterContext } from '../contexts/ShooterContext'

interface Projectile {
  id: number
  origin: Vector3
  direction: Vector3
  createdAt: number
  rigidBodyRef: React.RefObject<RapierRigidBody | null>
}

interface ShooterProviderProps {
  children: ReactNode
  onProjectileHit?: (position: Vector3) => void
}

export function ShooterProvider({ children, onProjectileHit }: ShooterProviderProps) {
  const [projectiles, setProjectiles] = useState<Projectile[]>([])
  const projectileIdRef = useRef(0)
  
  // Create a new projectile
  const shootProjectile = useCallback((origin: Vector3, direction: Vector3) => {
    const newProjectile: Projectile = {
      id: projectileIdRef.current++,
      origin: origin.clone(),
      direction: direction.clone(),
      createdAt: Date.now(),
      rigidBodyRef: { current: null }
    }
    
    setProjectiles(prev => [...prev, newProjectile])
  }, [])
  
  // Clean up old projectiles
  useFrame(() => {
    const now = Date.now()
    setProjectiles(prev => prev.filter(projectile => {
      // Remove projectiles after 5 seconds
      if (now - projectile.createdAt > 5000) {
        return false
      }
      
      // Remove projectiles that are too far away
      if (projectile.rigidBodyRef.current) {
        const position = projectile.rigidBodyRef.current.translation()
        const distance = Math.sqrt(position.x ** 2 + position.y ** 2 + position.z ** 2)
        if (distance > 200) {
          return false
        }
      }
      
      return true
    }))
  })

  return (
    <ShooterContext.Provider value={{ shootProjectile }}>
      {children}
      {/* Render projectiles */}
      {projectiles.map(projectile => (
        <ProjectileBall
          key={projectile.id}
          projectile={projectile}
          onHit={onProjectileHit}
        />
      ))}
    </ShooterContext.Provider>
  )
}

interface ProjectileBallProps {
  projectile: Projectile
  onHit?: (position: Vector3) => void
}

function ProjectileBall({ projectile, onHit }: ProjectileBallProps) {
  const meshRef = useRef<Mesh>(null)
  
  const handleCollision = useCallback(() => {
    if (projectile.rigidBodyRef.current) {
      const position = projectile.rigidBodyRef.current.translation()
      onHit?.(new Vector3(position.x, position.y, position.z))
    }
  }, [projectile.rigidBodyRef, onHit])

  return (
    <RigidBody
      ref={projectile.rigidBodyRef}
      position={[projectile.origin.x, projectile.origin.y, projectile.origin.z]}
      linearVelocity={[
        projectile.direction.x * 25, // Fast projectile speed
        projectile.direction.y * 25,
        projectile.direction.z * 25
      ]}
      gravityScale={0.3} // Light gravity for realistic arc
      colliders="ball"
      restitution={0.3} // Some bounce
      friction={0.5}
      onCollisionEnter={handleCollision}
    >
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.05]} />
        <meshStandardMaterial 
          color="#00ff88" // Bright green projectile
          emissive="#004422" // Slight glow
          roughness={0.3}
          metalness={0.1}
        />
      </mesh>
    </RigidBody>
  )
}