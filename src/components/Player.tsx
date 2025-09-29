import { useRef, forwardRef, useImperativeHandle, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useKeyboardControls, PointerLockControls } from '@react-three/drei'
import { RigidBody, RapierRigidBody } from '@react-three/rapier'
import { Vector3, Euler } from 'three'
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
  
  const MOVE_SPEED = 5
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

    const { forward, backward, left, right, jump } = get()
    
    // Get current position and velocity
    const position = rigidBody.current.translation()
    const currentVelocity = rigidBody.current.linvel()
    
    currentPosition.current.set(position.x, position.y, position.z)
    
    // First-person camera follows player position
    camera.position.x = position.x
    camera.position.y = position.y + 1.8 // Eye height
    camera.position.z = position.z
    
    // Movement direction based on camera orientation
    const direction = new Vector3()
    const euler = new Euler()
    euler.setFromQuaternion(camera.quaternion)
    
    if (forward) direction.z -= 1
    if (backward) direction.z += 1
    if (left) direction.x -= 1
    if (right) direction.x += 1
    
    // Apply camera rotation to movement
    if (direction.length() > 0) {
      direction.normalize()
      direction.applyEuler(new Euler(0, euler.y, 0)) // Only Y rotation for movement
    }
    
    // Apply movement
    rigidBody.current.setLinvel({
      x: direction.x * MOVE_SPEED,
      y: currentVelocity.y, // Preserve gravity
      z: direction.z * MOVE_SPEED
    }, true)
    
    // Simple jumping
    if (jump && Math.abs(currentVelocity.y) < 0.5) {
      rigidBody.current.setLinvel({ 
        x: direction.x * MOVE_SPEED, 
        y: JUMP_FORCE, 
        z: direction.z * MOVE_SPEED 
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