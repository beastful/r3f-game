import { useRef, forwardRef, useImperativeHandle, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useKeyboardControls, PointerLockControls } from '@react-three/drei'
import { RigidBody, RapierRigidBody } from '@react-three/rapier'
import { Vector3 } from 'three'
import { Controls } from '../types/controls'

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface PlayerProps {
  // Empty interface for future extensibility
}

const Player = forwardRef<{ position: Vector3 }, PlayerProps>((_props, ref) => {
  const { camera } = useThree()
  const rigidBody = useRef<RapierRigidBody>(null!)
  const [, get] = useKeyboardControls<Controls>()
  
  const currentPosition = useRef(new Vector3(0, 5, 0))
  
  const WALK_SPEED = 5
  const RUN_SPEED = 8
  const JUMP_FORCE = 8

  useImperativeHandle(ref, () => ({
    position: currentPosition.current
  }))

  useEffect(() => {
    // Set camera to first person position
    camera.position.set(0, 2, 0)
  }, [camera])

  useFrame(() => {
    if (!rigidBody.current) return

    const { forward, backward, left, right, jump, run } = get()
    
    // Get current position and velocity
    const position = rigidBody.current.translation()
    const currentVelocity = rigidBody.current.linvel()
    
    currentPosition.current.set(position.x, position.y, position.z)
    
    // First-person camera follows player position
    camera.position.x = position.x
    camera.position.y = position.y + 1.8 // Eye height
    camera.position.z = position.z
    
    // Camera-relative movement vectors
    const cameraDirection = new Vector3()
    const cameraRight = new Vector3()
    
    // Get camera forward direction (ignoring pitch for ground movement)
    camera.getWorldDirection(cameraDirection)
    cameraDirection.y = 0 // Keep movement on ground plane
    cameraDirection.normalize()
    
    // Get camera right direction for strafe movement
    cameraRight.crossVectors(cameraDirection, new Vector3(0, 1, 0))
    cameraRight.normalize()
    
    // Calculate movement direction based on input
    const moveDirection = new Vector3()
    
    if (forward) {
      moveDirection.add(cameraDirection)
    }
    if (backward) {
      moveDirection.sub(cameraDirection)
    }
    if (right) {
      moveDirection.add(cameraRight)
    }
    if (left) {
      moveDirection.sub(cameraRight)
    }
    
    // Normalize diagonal movement to prevent speed boost
    if (moveDirection.length() > 0) {
      moveDirection.normalize()
    }
    
    // Determine current speed (walking or running)
    const currentSpeed = run ? RUN_SPEED : WALK_SPEED
    
    // Apply movement with proper camera-relative direction
    rigidBody.current.setLinvel({
      x: moveDirection.x * currentSpeed,
      y: currentVelocity.y, // Preserve gravity
      z: moveDirection.z * currentSpeed
    }, true)
    
    // Improved jumping with camera-relative momentum
    if (jump && Math.abs(currentVelocity.y) < 0.5) {
      rigidBody.current.setLinvel({ 
        x: moveDirection.x * currentSpeed, 
        y: JUMP_FORCE, 
        z: moveDirection.z * currentSpeed 
      }, true)
    }
    
    // Reset if falling too far
    if (position.y < -20) {
      rigidBody.current.setTranslation({ x: 0, y: 5, z: 0 }, true)
      rigidBody.current.setLinvel({ x: 0, y: 0, z: 0 }, true)
    }
  })
  
  return (
    <>
      <PointerLockControls />
      <RigidBody
        ref={rigidBody}
        position={[0, 5, 0]}
        enabledRotations={[false, false, false]}
        type="dynamic"
        colliders="cuboid"
      >
        {/* Simple invisible player body */}
        <mesh>
          <boxGeometry args={[1, 1.8, 1]} />
          <meshBasicMaterial transparent opacity={0} />
        </mesh>
      </RigidBody>
    </>
  )
})

Player.displayName = 'Player'

export default Player