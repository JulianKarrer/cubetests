import { useEffect, useRef } from "react"


export default function CubeGraph({ }) {
    // logic for defining the board and drawing to it
    const logic = () => {
        const b_l = -6
        const b_r = 6
        const b_d = -4
        const b_u = 4
        const s = 0.4
        const e_max = 7

        const board = JXG.JSXGraph.initBoard('cubegraph1', {
            boundingbox: [b_l, b_u, b_r, b_d],
            axis: true,
            grid: true,
            gridX: 1,
            gridY: 1,
            showCopyright: false,
            showNavigation: false,
        });

        const polyCoords = [
            [-12 * s, -6 * s],
            [-6 * s, 8 * s],
            [6 * s, 9 * s],
            [12 * s, 2 * s],
            [8 * s, -8 * s],
            [-2 * s, -9 * s]
        ];

        const polyPoints = polyCoords.map((c, i) =>
            board.create('point', c, { visible: false, fixed: true })
        );
        const _polygon = board.create('polygon', polyPoints, {
            fillColor: '#eee',
            strokeColor: 'royalblue',
            opacity: 0.3,
            borders: { strokeWidth: 2 }
        });

        const e_slider = board.create('slider', [[b_l + 0.5, b_d + 0.5], [b_l + 2.5, b_d + 0.5], [0.3, e_max / 3, e_max]], {
            name: 'e',
            withLabel: true,
            label: { fontSize: 20 }
        });

        const z = board.create('point', [0, 0], {
            name: "$\\vec{z}$",
            size: 7,
            face: 'o',
            color: "red",
            snapSizeX: 0,
            snapSizeY: 0,
            label: { fontSize: 30, offset: [10, -20], opacity: 0.5 }
        });

        const z_rounded = board.create('point', [Math.round(z.X()), Math.round(z.Y())], {
            name: "$\\lceil \\vec{z} \\rfloor$",
            size: 3,
            face: 'o',
            fixed: true,
            color: "green",
            snapSizeX: 1,
            snapSizeY: 1,
            label: { visible: true, fontSize: 20, offset: [-40, 30] }
        });

        // helper to read numeric edge length
        function eVal() {
            return e_slider.Value();
        }
        const half = () => eVal() / 2;

        const p1 = board.create('point', [
            () => { return z.X() - half(); },
            () => { return z.Y() - half(); }
        ], { visible: false });

        const p2 = board.create('point', [
            () => { return z.X() + half(); },
            () => { return z.Y() - half(); }
        ], { visible: false });

        const p3 = board.create('point', [
            () => { return z.X() + half(); },
            () => { return z.Y() + half(); }
        ], { visible: false });

        const p4 = board.create('point', [
            () => { return z.X() - half(); },
            () => { return z.Y() + half(); }
        ], { visible: false });

        // the square (a polygon of the 4 corners)
        const square = board.create('polygon', [p1, p2, p3, p4], {
            opacity: 0.6,
            fillColor: '#fdd',
            strokeColor: '#a33'
        });

        function inside(point, vs) {
            // https://stackoverflow.com/questions/22521982
            // https://wrf.ecse.rpi.edu/Research/Short_Notes/pnpoly.html
            var x = point[0], y = point[1];
            var inside = false;
            for (var i = 0, j = vs.length - 1; i < vs.length; j = i++) {
                var xi = vs[i][0], yi = vs[i][1];
                var xj = vs[j][0], yj = vs[j][1];
                var intersect = ((yi > y) != (yj > y))
                    && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
                if (intersect) inside = !inside;
            }
            return inside;
        };

        function squareInside(e = eVal(), zx = z.X(), zy = z.Y()) {
            let half = e / 2
            return (
                inside([zx - half, zy - half], polyCoords) &&
                inside([zx + half, zy - half], polyCoords) &&
                inside([zx - half, zy + half], polyCoords) &&
                inside([zx + half, zy + half], polyCoords))
        }

        let z_x_ok = z.X();
        let z_y_ok = z.Y();
        z.on('drag', _ => {
            if (squareInside()) {
                z_x_ok = z.X();
                z_y_ok = z.Y();
            } else {
                const e_cur = eVal();
                const x_goal = z.X();
                const y_goal = z.Y();
                let x_cur = x_goal;
                let y_cur = y_goal;
                while (!squareInside(e_cur, x_cur, y_cur)) {
                    x_cur -= 0.01 * (x_goal - z_x_ok)
                    y_cur -= 0.01 * (y_goal - z_y_ok)
                }
                z.setPosition(JXG.COORDS_BY_USER, [x_cur, y_cur])
            }
            z_rounded.setPosition(JXG.COORDS_BY_USER, [Math.round(z.X()), Math.round(z.Y())])

            board.update();
        });

        let e_ok = eVal();
        e_slider.on('drag', _ => {
            if (squareInside()) {
                e_ok = eVal();
            } else {
                const e_goal = eVal();
                let e_cur = e_goal;
                while (!squareInside(e_cur)) {
                    e_cur -= 0.01 * (e_goal - e_ok)
                }
                e_slider.setValue(e_cur)
            }

            board.update();
        });

        board.update();
    }

    // initialize JSXGraph when the div has loaded
    let divRef = useRef(null)
    useEffect(() => {
        if (divRef.current) { logic() }
    }, [divRef])

    return (<>
        <style>
            {`#cubegraph1_jxgBoard1P55Label > span > span > span{
                font-size: 20pt!important;
            }`}
        </style>
        <div ref={divRef} id="cubegraph1" className="jxgbox" style={{ width: "100vmin", aspectRatio: 1.5, marginTop: 50, }}></div></>)
}