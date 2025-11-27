import { useEffect, useRef } from "react"

export default function SingleConstraint({ }) {
    // logic for defining the board and drawing to it

    // initialize JSXGraph when the div has loaded
    let divRef = useRef(null)

    const logic = () => {
        const aspect = divRef.current.clientWidth / divRef.current.clientHeight
        const w = 2
        const h = w / aspect
        const e_max = w
        const e_margin = 0.2

        const board = JXG.JSXGraph.initBoard('singleconstraint', {
            boundingbox: [-w, h, w, -h],
            axis: true,
            grid: true,
            gridX: 1,
            gridY: 1,
            showCopyright: false,
            showNavigation: false,
        });

        const e_slider = board.create('slider', [[-w + e_margin, -h + e_margin], [-w + e_margin * 5, -h + e_margin], [0, e_max / 4, e_max]], {
            name: 'e',
            withLabel: true,
            label: { fontSize: 20 }
        });


        const z = board.create('point', [-1, 1], {
            name: '$z$',
            size: 7,
            face: 'o',
        });

        const origin = board.create('point', [0, 0], {
            visible: false,
            fixed: true,
        })
        const a = board.create('point', [0.8, 0.3], {
            name: '$\\vec{a}$',
            size: 1.5,
            face: 'o',
            color: "royalblue",
        });
        const a_line = board.create('line', [origin, a], {
            color: "black",
            opacity: 0.3,
        })


        const half = () => e_slider.Value() / 2;

        // draw square vertices
        const vert_fontsize = 20
        const show_vert = false
        const vert_layer = 13
        const p1 = board.create('point', [
            () => { return z.X() - half(); },
            () => { return z.Y() - half(); }
        ], { name: "xᵥ₁", label: { visible: show_vert, fontsize: vert_fontsize }, });
        const p2 = board.create('point', [
            () => { return z.X() + half(); },
            () => { return z.Y() - half(); }
        ], { name: "xᵥ₂", label: { visible: show_vert, fontsize: vert_fontsize }, });
        const p3 = board.create('point', [
            () => { return z.X() + half(); },
            () => { return z.Y() + half(); }
        ], { name: "xᵥ₃", label: { visible: show_vert, fontsize: vert_fontsize }, });
        const p4 = board.create('point', [
            () => { return z.X() - half(); },
            () => { return z.Y() + half(); }
        ], { name: "xᵥ₄", label: { visible: show_vert, fontsize: vert_fontsize }, });

        // draw projected vertices
        const projfac = (a, p) => (p.X() * a.X() + p.Y() * a.Y())
        const len_a = () => Math.sqrt(a.X() * a.X() + a.Y() * a.Y())
        const proj = (a, p, x) => projfac(a, p) * (x ? a.X() : a.Y()) / len_a()
        const seg_style = {
            color: "black",
            opacity: 0.1,
        }
        const proj_p_style = {
            name: '',
            layer: 13,
        }
        const points = [p1, p2, p3, p4]
        for (const p of points) {
            const p_proj = board.create('point', [
                () => { return proj(a, p, true); },
                () => { return proj(a, p, false); }
            ], proj_p_style)
            board.create('segment', [p, p_proj], seg_style)
        }
        // draw segment from min to max projected value along a
        const min_proj = () => points.map(p => projfac(a, p)).reduce((a, b) => a < b ? a : b)
        const max_proj = () => points.map(p => projfac(a, p)).reduce((a, b) => a > b ? a : b)
        const proj_segment = board.create('segment', [[
            () => { return min_proj() * a.X() / len_a(); },
            () => { return min_proj() * a.Y() / len_a(); }
        ], [
            () => { return max_proj() * a.X() / len_a(); },
            () => { return max_proj() * a.Y() / len_a(); }
        ]], {
            color: "#faa",
            strokeWidth: 8,
            opacity: 0.5,
            layer: 11,
        })


        // the square (a polygon of the 4 corners)
        const _square = board.create('polygon', [p1, p2, p3, p4], {
            opacity: 0.5,
            fillColor: '#faa',
            strokeColor: '#a33'
        });

        const _a_arrow = board.create('arrow', [origin, a], {
            name: '$\\vec{a}$',
            strokeWidth: 3,
            color: "royalblue",
            layer: 10,
        });

        // const

        board.update();
    }

    useEffect(() => {
        if (divRef.current) { logic() }
    }, [divRef])

    return (<>
        <div ref={divRef} id="singleconstraint" className="jxgbox" style={{ width: "40vw", height: "min(60vh, 40vw)" }}></div></>)
}