import { createContext } from 'react'
import { Vector3 } from 'three'

interface ShooterContextType {
  shootProjectile: (origin: Vector3, direction: Vector3) => void
}

export const ShooterContext = createContext<ShooterContextType | null>(null)