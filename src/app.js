import { Suspense } from 'react'
import { Canvas } from "react-three-fiber"
import { OrbitControls, Environment } from '@react-three/drei'
import Biglia from './biglia'

export default function App() {
  const camera = { position: [5, 0.1, 0], fov: 50 }
  return (
    <Canvas shadowMap camera={camera}>
       <OrbitControls
        enableDamping
        dampingFactor={0.06}
        enableZoom={false}
      />
      <Suspense fallback={null}>
        <Environment preset="city" />
        <Biglia />
      </Suspense>
    </Canvas>
  )
}