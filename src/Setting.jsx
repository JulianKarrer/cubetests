import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Grid } from '@react-three/drei'
import { useEffect, useMemo, useState } from 'react'
import { create } from 'zustand'
import { useSpring, animated } from '@react-spring/three'
import { planeFromInequality, computeFeasibleVertices, HalfPlane, FeasibleVolume, PointGrid } from './components/3DPrimitives'

const AnimatedHalfPlane = animated(HalfPlane)

// reactive camera
const useStore = create(set => ({
    position: [0, 10, 0],
    setPosition: position => set({ position }),
}))


function ReactiveCamera({ controllable }) {
    const [x, y, z] = useStore(state => state.position)
    useFrame(state => {
        if (!controllable) {
            const alpha = 0.05
            state.camera.position.lerp({ x, y, z }, alpha)
            state.camera.lookAt(0, 0, 0)
            state.camera.updateProjectionMatrix()
        }
    })
}

export default function Setting({ A, b, c, varIndices, phase, style }) {
    // define phases
    const p2d = 0
    const p2dp = 1
    const p3d = 2
    const phs = 3

    const camPosInit = [0, 10, -1e-2]
    const camPosFinal = [0, 4, -8]

    // create planes
    const planes = useMemo(() => {
        if (!A || !b) return []
        const rows = []
        for (let r = 0; r < A.length; r++) {
            const p = planeFromInequality(A[r], c * b[r], varIndices)
            rows.push(p)
        }
        return rows
    }, [A, b, c, varIndices])
    const vertices = useMemo(() => computeFeasibleVertices(planes), [planes])

    // animate camera
    const setPosition = useStore(state => state.setPosition)
    const [controllable, setControllable] = useState(false)
    useEffect(() => {
        const toleranceTime = 500
        if (phase < p3d) {
            setPosition(camPosInit)
            setTimeout(() => { setControllable(false) }, toleranceTime)
        } else {
            setPosition(camPosFinal)
            setTimeout(() => { setControllable(true) }, toleranceTime)
        }
    }, [phase])

    // animate halfspaces
    const planeSpring = useSpring({
        size: phase < p3d ? 0 : (phase < phs ? 1 : 5),
        opacity: phase < phs ? 0.9 : 0.2,
    })


    return (<div style={{ height: "100vh", width: "100%" }}>
        <Canvas camera={{ position: camPosInit, fov: 45, }}>
            <ReactiveCamera controllable={controllable} />
            {/* lighting */}
            <ambientLight intensity={Math.PI / 2} />
            <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} decay={0} intensity={Math.PI} />
            <pointLight position={[-10, -10, -10]} decay={0} intensity={Math.PI} />

            {/* half-planes  */}
            {planes.map((p, idx) => (
                <AnimatedHalfPlane key={idx} normal={p.normal} d={p.d} color={'orange'} opacity={planeSpring.opacity} size={planeSpring.size} showArrows={phase >= p3d} />
            ))}

            {phase === p2dp && <PointGrid />}

            {/* feasible volume */}
            <FeasibleVolume vertices={vertices} simple={
                phase < p3d
                // false
            } color={'royalblue'} opacity={0.5} />

            {/* controls */}
            <OrbitControls enabled={phase >= p3d} enablePan={false} />
            <Grid cellSize={50} infiniteGrid={true} side={2} sectionColor={"#ffffff"} position={[0, 0, 0]} />

        </Canvas>
    </div >)
}