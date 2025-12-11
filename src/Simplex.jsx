import * as THREE from 'three'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Grid, Box, Wireframe, Sphere, TransformControls, DragControls, Html, Billboard } from '@react-three/drei'
import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { planeFromInequality, computeFeasibleVertices, FeasibleVolume, feasibleGeometry } from './components/3DPrimitives'


function objective(x, y, z, c) {
    return x * c[0] + y * c[1] + z * c[2]
}

function getColour(x, y, z, c, f_min, f_max) {
    const tmpColor = new THREE.Color('orange')
    const t = (objective(x, y, z, c) - f_min) / (f_max - f_min)
    const hue = (0.6) * (1 - t) + 0.1
    tmpColor.setHSL(hue, 1.0, 0.5)
    return tmpColor
}

function DirectionColouredVolume({ vertices, c, setFmin, setFmax }) {
    const objective = (x, y, z) => x * c[0] + y * c[1] + z * c[2]
    const geom = useMemo(() => {
        const geo = feasibleGeometry(vertices)
        // const workingGeo = geo.index ? geo.toNonIndexed() : geo
        const workingGeo = geo.index ? geo.toNonIndexed() : geo
        const posAttr = workingGeo.getAttribute('position')
        const vertexCount = posAttr.count
        const colours = new Float32Array(vertexCount * 3)

        const pos = workingGeo.getAttribute('position')

        // compute objective values per vertex
        const verts = []
        for (let i = 0; i < vertexCount; i++) {
            verts.push([pos.getX(i), pos.getY(i), pos.getZ(i)])
        }
        const f_v = verts.map(([x, y, z]) => objective(x, y, z, c))
        const f_min = Math.min.apply(null, f_v)
        const f_max = Math.max.apply(null, f_v)
        setFmin(f_min)
        setFmax(f_max)

        for (let i = 0; i < vertexCount; i++) {
            const colour = getColour(verts[i][0], verts[i][1], verts[i][2], c, f_min, f_max)
            colours[i * 3 + 0] = colour.r
            colours[i * 3 + 1] = colour.g
            colours[i * 3 + 2] = colour.b
        }

        const colorAttr = new THREE.BufferAttribute(colours, 3)
        colorAttr.needsUpdate = true
        workingGeo.setAttribute('color', colorAttr)
        return workingGeo
    }, [vertices, c])

    if (!geom) return null
    return (<>
        <mesh geometry={geom}>
            <meshStandardMaterial
                transparent
                opacity={0.5}
                vertexColors
                side={THREE.DoubleSide}
            />
        </mesh>

        <lineSegments>
            <edgesGeometry args={[geom]} />
            <lineBasicMaterial linewidth={2} color={"black"} />
        </lineSegments>
    </>
    )
}

function OrientableArrow({
    colour = "red",
    c,
    setC,
}) {
    const [direction, setDirection] = useState(() => (new THREE.Vector3(c[0], c[1], c[2])).normalize());
    const [len, setLen] = useState(() => Math.sqrt(c[0] * c[0] + c[1] * c[1] + c[2] * c[2]));
    useEffect(() => {
        const v = new THREE.Vector3(c[0], c[1], c[2]);
        if (v.lengthSq() > 0) v.normalize();
        setDirection(v);
        setLen(2 * Math.sqrt(c[0] * c[0] + c[1] * c[1] + c[2] * c[2]))
    }, [c]);

    return (
        <>
            {/* Visible arrow */}
            <arrowHelper
                args={[direction, new THREE.Vector3(0, 0, 0), 1, colour]}
            />
            <DragControls
                onDrag={(
                    localMatrix,
                    deltaLocalMatrix,
                    worldMatrix,
                    deltaWorldMatrix
                ) => {
                    const pos = new THREE.Vector3();
                    pos.setFromMatrixPosition(worldMatrix);
                    setC([pos.x, pos.y, pos.z])
                }}
            >
                <Sphere position={c} scale={0.1}>
                    <meshStandardMaterial
                        color={colour}
                        transparent
                        opacity={1.}
                        side={THREE.DoubleSide}
                    />
                </Sphere>
                <Html
                    position={[c[0], c[1] + 0.2, c[2]]} // offset above the sphere
                    center
                    transform={false}
                    distanceFactor={10}
                    occlude={false}
                    zIndexRange={[100, 0]}
                    style={{ pointerEvents: 'none' }}
                >
                    <div style={{
                        padding: '5px 10px',
                        background: 'rgba(0,0,0,0.1)',
                        color: 'black',
                        borderRadius: 6,
                        fontSize: 14,
                        transform: 'translateY(-50%)'
                    }}>
                        c
                    </div>
                </Html>
            </DragControls>
        </>
    );
}

export default function Simplex({ A, b, varIndices, style }) {
    const camPosFinal = [0, 4, -8]
    const c_size = 0
    const [c, setC] = useState([c_size, c_size, c_size])
    const [fmin, setFmin] = useState(0)
    const [fmax, setFmax] = useState(1)

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

    const vert_highlight = useMemo(() => {
        // find vertex with greatest objective value
        let maxpos = vertices_orig[0]
        let max_val = -99999.
        for (const v of vertices_orig) {
            const f_v = objective(v.x, v.y, v.z, c)
            if (f_v > max_val) {
                max_val = f_v
                maxpos = v
            }
        }
        const colour = getColour(maxpos.x, maxpos.y, maxpos.z, c, fmin, fmax)

        return <>
            <Sphere position={maxpos} scale={0.1}>
                <meshBasicMaterial
                    color={colour}
                    side={THREE.DoubleSide}
                />
            </Sphere>
            <Html
                position={[maxpos.x, maxpos.y + 0.2, maxpos.z]} // offset above the sphere
                center
                transform={false}
                distanceFactor={10}
                occlude={false}
                zIndexRange={[100, 0]}
                style={{ pointerEvents: 'none' }}
            >
                <div style={{
                    padding: '5px 10px',
                    background: 'rgba(0,0,0,0.1)',
                    color: 'black',
                    borderRadius: 6,
                    fontSize: 14,
                    transform: 'translateY(-50%)'
                }}>
                    maximizer
                </div>
            </Html>
        </>
    }, [vertices_orig, c])


    return (<div style={{ height: "100vh", width: "100%" }}>
        <Canvas camera={{ position: camPosFinal, fov: 45, }}>
            {/* lighting */}
            <ambientLight intensity={Math.PI / 2} />
            <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} decay={0} intensity={Math.PI} />
            <pointLight position={[-10, -10, -10]} decay={0} intensity={Math.PI} />

            {/* feasible volume */}
            <DirectionColouredVolume vertices={vertices_orig} c={c} setFmin={setFmin} setFmax={setFmax} />
            {vert_highlight}

            {/* control objective direction */}
            <OrientableArrow c={c} setC={setC} />

            {/* controls */}
            <OrbitControls enabled={true} enablePan={false} makeDefault />
            <Grid cellSize={50} infiniteGrid={true} side={2} sectionColor={"#ffffff"} position={[0, 0, 0]} />

        </Canvas>
    </div >)
}