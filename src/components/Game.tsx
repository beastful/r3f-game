import { useRef } from 'react'
import { Vector3 } from 'three'
import Player from './Player'
import Terrain from './Terrain'
import Environment from './Environment'

export default function Game() {
  const playerRef = useRef<{ position: Vector3 } | null>(null)

  return (
    <>
      <Environment />
      <Terrain playerRef={playerRef} />
      <Player ref={playerRef} />
    </>
  )
}