import { useContext } from 'react'
import { ShooterContext } from '../contexts/ShooterContext'

export const useShooter = () => {
  const context = useContext(ShooterContext)
  if (!context) {
    throw new Error('useShooter must be used within a ShooterProvider')
  }
  return context
}