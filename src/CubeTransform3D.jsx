import { Canvas } from '@react-three/fiber'
import { OrbitControls, Grid, Box, Wireframe } from '@react-three/drei'
import { useEffect, useMemo, useState } from 'react'
import { planeFromInequality, computeFeasibleVertices, FeasibleVolume, FeasibleWire } from './components/3DPrimitives'


export default function CubeTransform3D({ A, b, e, setE, varIndices, style }) {
    const camPosFinal = [0, 4, -8]

    const l1_norm = list => list.reduce((prev, cur) => Math.abs(prev) + Math.abs(cur), 0)
    const linear_cube_transform = (A, b, e) => b.map((b_i, i) =>
        b_i[0] - e[0][0] * 0.5 * l1_norm(A[i])
    )

    // original volume
    const planes_orig = useMemo(() => {
        const rows = []
        for (let r = 0; r < A.length; r++) {
            rows.push(
                planeFromInequality(A[r], b[r], varIndices)
            )
        }
        return rows
    }, [A, b])
    const vertices_orig = useMemo(() => computeFeasibleVertices(planes_orig), [planes_orig])

    // create planes
    const planes = useMemo(() => {
        const rows = []
        for (let r = 0; r < A.length; r++) {
            rows.push(
                planeFromInequality(A[r], linear_cube_transform(A, b, e)[r], varIndices)
            )
        }
        return rows
    }, [A, b, e, varIndices])
    const vertices = useMemo(() => computeFeasibleVertices(planes), [planes])

    const [verts6, setVerts6] = useState(vertices)
    const [safe_e, setSafe_e] = useState(e)
    useEffect(() => {
        console.log(vertices.length)
        if (vertices.length > 0) {
            setVerts6(vertices.slice())
            setSafe_e(e)
        } else {
            setE(safe_e)
        }
    }, [vertices])

    return (<div style={{ height: "100vh", width: "100%" }}>
        <Canvas camera={{ position: camPosFinal, fov: 45, }}>
            {/* lighting */}
            <ambientLight intensity={Math.PI / 2} />
            <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} decay={0} intensity={Math.PI} />
            <pointLight position={[-10, -10, -10]} decay={0} intensity={Math.PI} />

            {/* feasible volume */}
            <FeasibleVolume vertices={vertices} simple={true} color={'royalblue'} opacity={1} />
            <FeasibleVolume vertices={vertices_orig} color={'royalblue'} opacity={0.1} />

            {verts6.map((v_i, i) => {
                return <Box position={[v_i.x, v_i.y, v_i.z]} scale={safe_e[0][0]}>
                    <meshStandardMaterial wireframe color={"orange"} />
                </Box>
            })}

            {/* controls */}
            <OrbitControls enabled={true} enablePan={false} />
            <Grid cellSize={50} infiniteGrid={true} side={2} sectionColor={"#ffffff"} position={[0, 0, 0]} />

        </Canvas>
    </div >)
}