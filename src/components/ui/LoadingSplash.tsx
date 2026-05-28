import React from 'react'
import { LogoLoader } from './LogoLoader'

interface LoadingSplashProps {
  label?: string
}

export const LoadingSplash: React.FC<LoadingSplashProps> = ({ label = 'Memuat naskah...' }) => (
  <LogoLoader fullscreen label={label} size={150} />
)

