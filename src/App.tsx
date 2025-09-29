import { Canvas } from '@react-three/fiber'
import { Physics } from '@react-three/rapier'
import { KeyboardControls } from '@react-three/drei'
import { Suspense } from 'react'
import Game from './components/Game'
import { Controls } from './types/controls'
import './App.css'

const map = [
  { name: Controls.forward, keys: ['ArrowUp', 'w', 'W'] },
  { name: Controls.backward, keys: ['ArrowDown', 's', 'S'] },
  { name: Controls.left, keys: ['ArrowLeft', 'a', 'A'] },
  { name: Controls.right, keys: ['ArrowRight', 'd', 'D'] },
  { name: Controls.jump, keys: ['Space'] },
]

function App() {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <KeyboardControls map={map}>
        <Canvas
          camera={{ position: [0, 5, 10], fov: 75 }}
          style={{ background: 'linear-gradient(to bottom, #87CEEB, #98FB98)' }}
          shadows
        >
          <Suspense fallback={null}>
            <Physics gravity={[0, -9.81, 0]}>
              <Game />
            </Physics>
          </Suspense>
        </Canvas>
      </KeyboardControls>
      <div style={{ 
        position: 'absolute', 
        top: '10px', 
        left: '10px', 
        color: 'white', 
        fontFamily: 'monospace',
        backgroundColor: 'rgba(0,0,0,0.7)',
        padding: '10px',
        borderRadius: '5px'
      }}>
        <div>🎮 R3F Walking Game</div>
        <div>WASD / Arrow Keys: Move</div>
        <div>Space: Jump</div>
      </div>
    </div>
  )
}

export default App
