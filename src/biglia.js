import gsap from 'gsap'
import { useRef, useEffect, useMemo } from "react"
import { BackSide, RepeatWrapping } from "three"
import { useFrame, useThree } from "react-three-fiber"
import { useTexture } from "@react-three/drei"

export default function Biglia() {
  const $group = useRef()
  const $ball = useRef()
  const $petals = useRef()
  const $shadow = useRef()
  const $material = useRef()
  const [textureShadow, textureMap] = useTexture(["/shadow.png", "/texture.jpg"])
  let isAnimating = false

  const colors = {
    bg1: 'rgb(132 56 202)',
    bg2: 'rgb(17 9 43)',
    ball1: 'blue',
    ball2: '#f37ae9',
    petal1: '#5000c8',
    petal2: '#cf0058',
    petal3: '#ffc6c6',
    factor: 3
  }

  const ballMaterial = useMemo(() => ({
    clearcoat: 0.1,
    clearcoatRoughness: 0.1,
    metalness: 0.2,
    roughness: 0.09,
    normalMap: textureMap,
    normalScale: [.02, .02],
    "normalMap-wrapS": RepeatWrapping,
    "normalMap-wrapT": RepeatWrapping,
    "normalMap-repeat": [1, 1],
    "normalMap-anisotropy": 16,
    transmission: .9,
    transparent: true,
  }), [])

  const petalMaterial = useMemo(() => {
    return ({
    clearcoat: 1.0,
    clearcoatRoughness: 1,
    metalness: 0.2,
    roughness: 0.5,
    color: "white",
    normalMap: textureMap,
    transmission: 0,
    normalScale: [0.1, 0.1],
    "normalMap-wrapS": RepeatWrapping,
    "normalMap-wrapT": RepeatWrapping,
    "normalMap-repeat": [4, 1],
    "normalMap-anisotropy": 16,
    transparent: true,
    onBeforeCompile(shader) {
      shader.uniforms.uTime = { value: 0 }
      shader.uniforms.uFactor = { value: colors.factor }
      shader.vertexShader = `
        uniform float uTime;
        uniform float uFactor;
        varying vec3 vPosition;
        ${shader.vertexShader}
      `;
      shader.vertexShader = shader.vertexShader.replace(
        "#include <begin_vertex>",
        /*glsl*/`
          float theta = sin( uTime + position.y ) / 2.0 * uFactor;
          float c = cos( theta );
          float s = sin( theta );
          mat3 m = mat3( c, 0, s, 0, 1, 0, -s, 0, c );
          mat3 m2 = mat3(
            cos(position.y), 0., 0.,
            0., 1.6, 0.,
            0., 0., cos(position.y * PI) * 1.
          );
          vec3 transformed = vec3( position ) * m2 * m;
          vNormal = vNormal * m2 * m;
          vPosition = transformed;
        `
      );
      $material.current.userData.shader = shader
    },
  })}, [])

  const { gl } = useThree()

  useEffect(() => {
    const style = { background: `radial-gradient(${colors.bg1}, ${colors.bg2})` }
    Object.assign(gl.domElement.style, style)
  }, [])

  const bounce = () => {
    if (isAnimating) return
    isAnimating = true
    gsap.to($ball.current.position, {
      y: .5,
      duration: .5,
      ease: 'power3.out',
      onComplete: () => {
        gsap.to($ball.current.position, {
          y: 0,
          duration: 1,
          ease: "bounce.out",
        })
      }
    })
    gsap.to($ball.current.rotation, {
      z: `+=${Math.PI}`,
      duration: 1.5,
      ease: 'power3.out',
      onComplete: () => {
        isAnimating = false
      }
    })
    gsap.to($shadow.current.material, {
      opacity: .1,
      duration: .6,
      ease: 'power3.out',
      onComplete: () => {
        gsap.to($shadow.current.material, {
          opacity: .75,
          duration: 1,
          ease: "bounce.out",
        })
      }
    })
  }

  const Sphere = () => (
    <group>
      <mesh>
        <icosahedronBufferGeometry attach="geometry" args={[.8, 18]} />
        <meshPhysicalMaterial {...ballMaterial} side={BackSide} color={colors.ball1} transmission={.9} />
      </mesh>
      <mesh renderOrder={100} onPointerDown={bounce}>
        <icosahedronBufferGeometry attach="geometry" args={[.8, 18]} />
        <meshPhysicalMaterial
          {...ballMaterial}
          color={colors.ball2}
        />
      </mesh>
    </group>
  )

  const Petals = () => (
    <group ref={$petals} >
      <mesh rotation={[0, 0, 0]} receiveShadow castShadow>
        <boxBufferGeometry
          attach="geometry"
          args={[.02, 1, 1, 200, 200, 200]}
        />
        <meshStandardMaterial 
          ref={$material}
          {...petalMaterial}
          color={colors.petal1}
        />
      </mesh>
      <mesh rotation={[0, Math.PI * 0.333, 0]} receiveShadow castShadow>
        <boxBufferGeometry
          attach="geometry"
          args={[0.02, .98, 1, 200, 200, 200]}
        />
        <meshStandardMaterial 
          ref={$material}
          {...petalMaterial}
          color={colors.petal2}
        />
      </mesh>
      <mesh rotation={[0, Math.PI * -0.333, 0]} receiveShadow castShadow>
        <boxBufferGeometry
          attach="geometry"
          args={[.03, .99, 1, 200, 200, 200]}
        />
        <meshStandardMaterial 
          {...petalMaterial}
          color={colors.petal3}
        />
      </mesh>
    </group>
  )

  const Lights = () => (
    <>
      <spotLight
        intensity={0.4}
        position={[-20, 20, 10]}
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        color="white"
        castShadow
      />
      <pointLight position={[.01, -.8, 0]} intensity={2} />
    </>
  )

  const Shadow = () => (
    <mesh ref={$shadow} position={[0, -.8, 0]} rotation={[-Math.PI * .5, 0, 0]}>
      <planeBufferGeometry attach="geometry" args={[2, 2]}  />
      <meshStandardMaterial attach="material" map={textureShadow} transparent={true} color="#000000" opacity={.75} />
    </mesh>
  )

  useFrame(({clock}) => {
    $group.current.rotation.y = clock.getElapsedTime()
  })

  return (
    <>
      <group ref={$group}>
        <group ref={$ball}>
          <Sphere />
          <Petals />
        </group>
        <Shadow />
      </group>
       <Lights />
    </>
  )
}