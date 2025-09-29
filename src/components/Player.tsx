import { useRef, forwardRef, useImperativeHandle } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useKeyboardControls } from '@react-three/drei'
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
  
  const velocity = useRef(new Vector3())
  const direction = useRef(new Vector3())
  const currentPosition = useRef(new Vector3(0, 10, 0))
  
  const MOVE_SPEED = 5
  const JUMP_FORCE = 8
  const CAMERA_HEIGHT = 1.8
  const CAMERA_DISTANCE = 8

  useImperativeHandle(ref, () => ({
    position: currentPosition.current
  }))

  useFrame((_state, delta) => {
    if (!rigidBody.current) return

    const { forward, backward, left, right, jump } = get()
    
    // Get current position and velocity
    const position = rigidBody.current.translation()
    const currentVelocity = rigidBody.current.linvel()
    
    currentPosition.current.set(position.x, position.y, position.z)
    
    // Calculate movement direction
    direction.current.set(0, 0, 0)
    
    if (forward) direction.current.z -= 1
    if (backward) direction.current.z += 1
    if (left) direction.current.x -= 1
    if (right) direction.current.x += 1
    
    direction.current.normalize()
    
    // Apply movement
    velocity.current.set(
      direction.current.x * MOVE_SPEED,
      currentVelocity.y, // Preserve y velocity (gravity/jumping)
      direction.current.z * MOVE_SPEED
    )
    
    rigidBody.current.setLinvel(velocity.current, true)
    
    // Jumping (only if close to ground)
    if (jump && Math.abs(currentVelocity.y) < 0.1) {
      rigidBody.current.setLinvel({ 
        x: velocity.current.x, 
        y: JUMP_FORCE, 
        z: velocity.current.z 
      }, true)
    }
    
    // Third-person camera follow
    const cameraTarget = new Vector3(
      position.x,
      position.y + CAMERA_HEIGHT,
      position.z
    )
    
    const cameraPosition = new Vector3(
      position.x,
      position.y + CAMERA_HEIGHT + 3,
      position.z + CAMERA_DISTANCE
    )
    
    // Smooth camera movement
    camera.position.lerp(cameraPosition, delta * 5)
    camera.lookAt(cameraTarget)
    
    // Prevent player from falling too far
    if (position.y < -50) {
      rigidBody.current.setTranslation({ x: 0, y: 10, z: 0 }, true)
      rigidBody.current.setLinvel({ x: 0, y: 0, z: 0 }, true)
    }
  })

  return (
    <RigidBody
      ref={rigidBody}
      position={[0, 10, 0]}
      enabledRotations={[false, false, false]} // Lock rotation
      type="dynamic"
      colliders="cuboid"
    >
      {/* Player visual representation */}
      <mesh castShadow>
        <capsuleGeometry args={[0.5, 1.5]} />
        <meshStandardMaterial color="#ff6b6b" />
      </mesh>
    </RigidBody>
  )
})

Player.displayName = 'Player'

export default Player