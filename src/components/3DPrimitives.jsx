import * as THREE from 'three'
import { useMemo } from 'react'
import { ConvexGeometry } from 'three/examples/jsm/Addons.js'
import { Points, Point, PointMaterial } from '@react-three/drei'

const EPS = 1e-8

// compute the plane orthogonal to a row from a constraint matrix
export function planeFromInequality(rowCoeffs, offset, varIndices, otherVars = {}) {
    // rowCoeffs: array length n
    // varIndices: [i,j,k]
    const [i, j, k] = varIndices
    // Build the 3D normal components from the chosen indices
    const nx = (rowCoeffs[i] || 0)
    const ny = (rowCoeffs[j] || 0)
    const nz = (rowCoeffs[k] || 0)
    // Contribution from other variables to the constant offset
    let c = offset || 0
    for (let i = 0; i < rowCoeffs.length; i++) {
        if (i === i || i === j || i === k) continue
        const val = otherVars.hasOwnProperty(i) ? otherVars[i] : 0
        c += (rowCoeffs[i] || 0) * val
    }
    // We want inequality n . x + d <= 0 where d = c
    const normal = new THREE.Vector3(nx, ny, nz)
    const d = -c
    return { normal, d }
}


// solve a 3x3 linear system, return null if singular
function solve3x3(N, rhs) {
    const a = N // an array of 9 numbers row-major
    const b0 = rhs.x, b1 = rhs.y, b2 = rhs.z
    const a00 = a[0], a01 = a[1], a02 = a[2]
    const a10 = a[3], a11 = a[4], a12 = a[5]
    const a20 = a[6], a21 = a[7], a22 = a[8]
    const det = a00 * (a11 * a22 - a12 * a21) - a01 * (a10 * a22 - a12 * a20) + a02 * (a10 * a21 - a11 * a20)
    if (Math.abs(det) < EPS) return null
    const invDet = 1 / det
    const x = (
        (b0 * (a11 * a22 - a12 * a21) - a01 * (b1 * a22 - a12 * b2) + a02 * (b1 * a21 - a11 * b2)) * invDet
    )
    const y = (
        (a00 * (b1 * a22 - a12 * b2) - b0 * (a10 * a22 - a12 * a20) + a02 * (a10 * b2 - b1 * a20)) * invDet
    )
    const z = (
        (a00 * (a11 * b2 - b1 * a21) - a01 * (a10 * b2 - b1 * a20) + b0 * (a10 * a21 - a11 * a20)) * invDet
    )
    return new THREE.Vector3(x, y, z)
}

/**
* Given an array of planes { normal: Vector3, d: number } where inequality is
* normal.dot(x) + d <= 0, compute feasible vertices by intersecting all triplets
* and keeping points that satisfy all inequalities. Returns unique points.
*/
export function computeFeasibleVertices(planes) {
    const pts = []
    const m = planes.length
    for (let a = 0; a < m; a++) {
        for (let b = a + 1; b < m; b++) {
            for (let c = b + 1; c < m; c++) {
                const n1 = planes[a].normal
                const n2 = planes[b].normal
                const n3 = planes[c].normal
                // build matrix rows
                const N = [
                    n1.x, n1.y, n1.z,
                    n2.x, n2.y, n2.z,
                    n3.x, n3.y, n3.z,
                ]
                // solve N * x = -d
                const rhs = new THREE.Vector3(-planes[a].d, -planes[b].d, -planes[c].d)
                const cand = solve3x3(N, rhs)
                if (!cand) continue
                // Check candidate against all inequalities
                let ok = true
                for (let t = 0; t < m; t++) {
                    const val = planes[t].normal.dot(cand) + planes[t].d
                    if (val > 1e-6) { ok = false; break }
                }
                if (!ok) continue
                // Keep unique: tolerance-based
                let dup = false
                for (const p of pts) {
                    if (p.distanceToSquared(cand) < 1e-10) { dup = true; break }
                }
                if (!dup) pts.push(cand)
            }
        }
    }
    return pts
}


export function HalfPlane({ normal, d, size = 10, color = 'orange', opacity = 0.5, showNormal = true, showArrows = true }) {
    // centre at -normal * d / ||n||^2 
    const n = normal.clone()
    const normLenSq = n.lengthSq()
    const extraOffFact = (1 + 2e-2) // prevent flicker by slight offset
    const center = (normLenSq > EPS) ? n.clone().multiplyScalar(-d / normLenSq * extraOffFact) : new THREE.Vector3()
    const z = new THREE.Vector3(0, 0, 1)
    const q = new THREE.Quaternion()
    if (n.length() > EPS) q.setFromUnitVectors(z, n.clone().normalize())

    return (
        <group>
            <mesh position={center.toArray()} quaternion={q}>
                <circleGeometry args={[size, 30]} />
                <meshStandardMaterial
                    color={color}
                    transparent
                    depthTest={true}
                    depthWrite={false}
                    opacity={opacity}
                    side={THREE.DoubleSide}
                />
            </mesh>
            {showNormal && n.length() > EPS && (
                <mesh position={center.toArray()}>
                    {/* show little arrow as well */}
                    {showArrows && <primitive object={new THREE.ArrowHelper(n.clone().normalize(), new THREE.Vector3(0, 0, 0), 1, color)} />}
                </mesh>
            )}
        </group>
    )
}

export function feasibleGeometry(vertices) {
    if (!vertices || vertices.length < 4) return null
    const pts = vertices.map(p => new THREE.Vector3(p.x, p.y, p.z))
    try {
        const g = new ConvexGeometry(pts)
        g.computeVertexNormals()
        return g
    } catch (e) {
        console.warn('ConvexGeometry failed', e)
        return null
    }
}

export function FeasibleVolume({ vertices, color = 'royalblue', simple, opacity = 0.35 }) {
    const geom = useMemo(() => feasibleGeometry(vertices), [vertices])
    if (!geom) return null
    return (
        <mesh geometry={geom}>
            {simple ? <>
                <meshBasicMaterial
                    color={color}
                    side={THREE.DoubleSide}
                />
            </> : <>
                <meshStandardMaterial
                    color={color}
                    transparent
                    depthTest={true}
                    depthWrite={true}
                    opacity={opacity}
                    side={THREE.DoubleSide}
                />
            </>}

        </mesh>
    )
}
export function FeasibleWire({ vertices, color = 'royalblue', opacity = 0.35 }) {
    const geom = useMemo(() => feasibleGeometry(vertices), [vertices])
    if (!geom) return null
    return (
        <mesh geometry={geom}>
            <meshStandardMaterial wireframe />
        </mesh>
    )
}

export function PointGrid({
    colour = "black",
    xmin = -10, xmax = 10, ymin = 0, ymax = 0, zmin = -10, zmax = 10
}) {
    let grid = []
    for (let x = xmin; x <= xmax; x++) {
        for (let y = ymin; y <= ymax; y++) {
            for (let z = zmin; z <= zmax; z++) {
                grid.push([x, y + 1e-2, z])
            }
        }
    }

    return (<>
        <Points
            limit={grid.length} // max number of points
            range={1000} // draw-range
        >
            {grid.map((pos, i) => <Point position={pos} key={"point" + i} />)}
            <PointMaterial transparent vertexColors size={5} sizeAttenuation={false} depthWrite={false} color={colour} />
        </Points>
    </>)
}