import { useRef } from 'react'
import { Vector3 } from 'three'
import Player from './Player'
import Terrain from './Terrain'
import Environment from './Environment'
import SimpleAtmosphericSky from './SimpleAtmosphericSky'

export default function Game() {
  const playerRef = useRef<{ position: Vector3 } | null>(null)

  return (
    <>
      {/* Essential lighting for terrain and models */}
      <Environment />
      {/* Simple blue-purple sky with white stars */}
      <SimpleAtmosphericSky />
      <Terrain playerRef={playerRef} />
      <Player ref={playerRef} />
    </>
  )
}