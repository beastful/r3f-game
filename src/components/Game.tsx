import { useRef, useState } from 'react'
import { Vector3 } from 'three'
import Player from './Player'
import Terrain from './Terrain'
import AtmosphericSky from './AtmosphericSky'
import AtmosphericPostProcessing from './AtmosphericPostProcessing'

export default function Game() {
  const playerRef = useRef<{ position: Vector3 } | null>(null)
  const [timeOfDay] = useState(0.3) // Dawn/dusk for dramatic effect

  return (
    <>
      {/* Replace Environment with AtmosphericSky for enhanced atmosphere */}
      <AtmosphericSky timeOfDay={timeOfDay} />
      <Terrain playerRef={playerRef} />
      <Player ref={playerRef} />
      
      {/* Add atmospheric post-processing effects */}
      <AtmosphericPostProcessing timeOfDay={timeOfDay} enabled={true} />
    </>
  )
}