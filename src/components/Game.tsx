import { useRef, useCallback } from 'react'
import { Vector3 } from 'three'
import Player from './Player'
import Terrain from './Terrain'
import Environment from './Environment'
import SimpleAtmosphericSky from './SimpleAtmosphericSky'
import FPSGun from './FPSGun'
import { ShooterProvider } from './ShooterSystem'

export default function Game() {
  const playerRef = useRef<{ position: Vector3 } | null>(null)

  // Handle projectile hits
  const handleProjectileHit = useCallback((position: Vector3) => {
    console.log('Projectile hit at:', position)
    // Here you could add hit effects, damage calculation, etc.
  }, [])

  return (
    <ShooterProvider onProjectileHit={handleProjectileHit}>
      {/* Essential lighting for terrain and models */}
      <Environment />
      {/* Simple blue-purple sky with white stars */}
      <SimpleAtmosphericSky />
      <Terrain playerRef={playerRef} />
      <Player ref={playerRef} />
      
      {/* FPS Gun System */}
      <FPSGun />
    </ShooterProvider>
  )
}