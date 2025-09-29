import { useRef, useMemo, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useKeyboardControls } from '@react-three/drei'
import { 
  Vector3, 
  Mesh, 
  Group, 
  Euler
} from 'three'
import { Controls } from '../types/controls'
import { useShooter } from '../hooks/useShooter'

export default function FPSGun() {
  const { camera } = useThree()
  const gunGroupRef = useRef<Group>(null)
  const barrelRef = useRef<Mesh>(null)
  const [, getKeys] = useKeyboardControls<Controls>()
  const { shootProjectile } = useShooter()
  
  // Gun animation state
  const [isRecoiling, setIsRecoiling] = useState(false)
  const recoilTimeRef = useRef(0)
  const shootCooldownRef = useRef(0)
  
  // FPS gun positioning - positioned relative to camera like in shooters
  const gunOffset = useMemo(() => new Vector3(0.8, -0.6, -1.2), [])
  const originalRotation = useMemo(() => new Euler(0, 0, 0), [])
  
  // Procedural gun generation - create a sci-fi blaster
  const gunGeometry = useMemo(() => {
    return {
      // Main body (receiver)
      body: {
        geometry: [0.15, 0.12, 0.6] as [number, number, number],
        position: new Vector3(0, 0, 0),
        color: "#2a2a2a" // Dark gunmetal
      },
      
      // Barrel
      barrel: {
        geometry: [0.06, 0.06, 0.4] as [number, number, number],
        position: new Vector3(0, 0.02, -0.5),
        color: "#1a1a1a" // Darker barrel
      },
      
      // Grip
      grip: {
        geometry: [0.08, 0.2, 0.1] as [number, number, number],
        position: new Vector3(0, -0.25, 0.15),
        rotation: new Euler(-0.3, 0, 0),
        color: "#333333" // Grip texture
      },
      
      // Trigger guard
      triggerGuard: {
        geometry: [0.03, 0.08, 0.08] as [number, number, number],
        position: new Vector3(0, -0.15, 0.05),
        color: "#2a2a2a"
      },
      
      // Sight
      sight: {
        geometry: [0.02, 0.04, 0.02] as [number, number, number],
        position: new Vector3(0, 0.08, -0.1),
        color: "#444444"
      },
      
      // Muzzle brake (sci-fi touch)
      muzzleBrake: {
        geometry: [0.08, 0.08, 0.06] as [number, number, number],
        position: new Vector3(0, 0.02, -0.75),
        color: "#333333"
      }
    }
  }, [])

  // Handle shooting input
  useFrame((state, delta) => {
    if (!gunGroupRef.current) return
    
    // Update cooldowns
    shootCooldownRef.current = Math.max(0, shootCooldownRef.current - delta)
    
    // Position gun relative to camera (FPS style)
    const cameraWorldPosition = new Vector3()
    const cameraWorldQuaternion = camera.getWorldQuaternion(camera.quaternion.clone())
    camera.getWorldPosition(cameraWorldPosition)
    
    // Apply gun offset in camera space
    const offsetInWorldSpace = gunOffset.clone().applyQuaternion(cameraWorldQuaternion)
    gunGroupRef.current.position.copy(cameraWorldPosition.add(offsetInWorldSpace))
    gunGroupRef.current.quaternion.copy(cameraWorldQuaternion)
    
    // Handle recoil animation
    if (isRecoiling) {
      recoilTimeRef.current += delta * 8 // Recoil speed
      
      if (recoilTimeRef.current < 1) {
        // Recoil animation - kick back and up
        const recoilProgress = Math.sin(recoilTimeRef.current * Math.PI)
        const recoilIntensity = 0.1
        
        gunGroupRef.current.position.add(
          new Vector3(0, recoilProgress * recoilIntensity * 0.5, recoilProgress * recoilIntensity)
            .applyQuaternion(cameraWorldQuaternion)
        )
        
        // Rotational recoil
        gunGroupRef.current.rotation.x += recoilProgress * 0.1
      } else {
        // End recoil
        setIsRecoiling(false)
        recoilTimeRef.current = 0
      }
    }
    
    // Handle shooting
    const { shoot } = getKeys()
    if (shoot && shootCooldownRef.current <= 0) {
      // Calculate shoot direction from camera
      const shootDirection = new Vector3(0, 0, -1).applyQuaternion(cameraWorldQuaternion).normalize()
      const shootOrigin = cameraWorldPosition.clone()
      
      // Add slight barrel offset
      const barrelOffset = new Vector3(0, 0, -1.2).applyQuaternion(cameraWorldQuaternion)
      shootOrigin.add(barrelOffset)
      
      shootProjectile(shootOrigin, shootDirection)
      
      // Trigger recoil and set cooldown
      setIsRecoiling(true)
      recoilTimeRef.current = 0
      shootCooldownRef.current = 0.15 // 150ms cooldown between shots
    }
    
    // Add slight weapon sway for realism
    const time = state.clock.elapsedTime
    if (!isRecoiling) {
      const swayX = Math.sin(time * 1.5) * 0.002
      const swayY = Math.cos(time * 2) * 0.001
      gunGroupRef.current.rotation.x = originalRotation.x + swayY
      gunGroupRef.current.rotation.y = originalRotation.y + swayX
    }
  })

  return (
    <group ref={gunGroupRef}>
      {/* Main gun body */}
      <mesh position={gunGeometry.body.position}>
        <boxGeometry args={gunGeometry.body.geometry} />
        <meshStandardMaterial color={gunGeometry.body.color} roughness={0.8} metalness={0.3} />
      </mesh>
      
      {/* Barrel */}
      <mesh ref={barrelRef} position={gunGeometry.barrel.position}>
        <cylinderGeometry args={[...gunGeometry.barrel.geometry]} />
        <meshStandardMaterial color={gunGeometry.barrel.color} roughness={0.6} metalness={0.4} />
      </mesh>
      
      {/* Grip */}
      <mesh position={gunGeometry.grip.position} rotation={gunGeometry.grip.rotation}>
        <boxGeometry args={gunGeometry.grip.geometry} />
        <meshStandardMaterial color={gunGeometry.grip.color} roughness={0.9} metalness={0.1} />
      </mesh>
      
      {/* Trigger guard */}
      <mesh position={gunGeometry.triggerGuard.position}>
        <boxGeometry args={gunGeometry.triggerGuard.geometry} />
        <meshStandardMaterial color={gunGeometry.triggerGuard.color} roughness={0.8} metalness={0.3} />
      </mesh>
      
      {/* Front sight */}
      <mesh position={gunGeometry.sight.position}>
        <boxGeometry args={gunGeometry.sight.geometry} />
        <meshStandardMaterial color={gunGeometry.sight.color} roughness={0.7} metalness={0.2} />
      </mesh>
      
      {/* Muzzle brake */}
      <mesh position={gunGeometry.muzzleBrake.position}>
        <cylinderGeometry args={[...gunGeometry.muzzleBrake.geometry]} />
        <meshStandardMaterial color={gunGeometry.muzzleBrake.color} roughness={0.7} metalness={0.3} />
      </mesh>
      
      {/* Muzzle flash effect (when shooting) */}
      {isRecoiling && (
        <mesh position={new Vector3(0, 0.02, -0.9)}>
          <coneGeometry args={[0.1, 0.2, 8]} />
          <meshBasicMaterial color="#ffaa00" transparent opacity={0.6} />
        </mesh>
      )}
    </group>
  )
}