import { useEffect, useRef } from "react"

export default function CubeTransform2D({ style }) {
    // logic for defining the board and drawing to it

    // initialize JSXGraph when the div has loaded
    let divRef = useRef(null)

    const logic = () => {
        const aspect = divRef.current.clientWidth / divRef.current.clientHeight

        const b_l = -6
        const b_r = 6
        const b_d = -4
        const b_u = 4
        const s = 0.4
        const e_max = 7

        const e_margin = 0.2

        const A = [
            [-5.6, 2.4],
            [-0.4, 4.8],
            [2.8, 2.4],
            [4.0, -1.6],
            [0.4, -4.0],
            [-1.2, -4.0]
        ]

        const b = () => [
            21.12,
            16.32,
            15.36,
            17.92,
            14.08,
            15.36
        ]

        const board = JXG.JSXGraph.initBoard('cubetransform2d', {
            boundingbox: [b_l, b_u, b_r, b_d],
            axis: true,
            grid: true,
            gridX: 1,
            gridY: 1,
            showCopyright: false,
            showNavigation: false,
        });

        const e_slider = board.create('slider', [[b_l + e_margin, b_d + e_margin], [b_l + e_margin * 5, b_d + e_margin], [0, e_max / 4, e_max]], {
            name: 'e',
            withLabel: true,
            label: { fontSize: 20 }
        });


        const z = board.create('point', [-1, 1], {
            name: '$z$',
            size: 7,
            face: 'o',
        });

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

        // the square (a polygon of the 4 corners)
        const _square = board.create('polygon', [p1, p2, p3, p4], {
            opacity: 0.5,
            fillColor: '#faa',
            strokeColor: '#a33'
        });


        // const

        board.update();
    }

    useEffect(() => {
        if (divRef.current) { logic() }
    }, [divRef])

    return (<>
        <div ref={divRef} id="cubetransform2d" className="jxgbox" style={{ height: "80vh", aspectRatio: "1.5", ...style }}></div></>)
}