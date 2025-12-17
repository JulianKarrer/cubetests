import { useEffect, useRef } from "react"


export default function LatticeWidth({ name = "latticeWidth" }) {
    // logic for defining the board and drawing to it
    const logic = () => {
        const b_l = -6
        const b_r = 6
        const b_d = -4
        const b_u = 4

        const board = JXG.JSXGraph.initBoard(name, {
            boundingbox: [b_l, b_u, b_r, b_d],
            axis: true,
            grid: true,
            gridX: 1,
            gridY: 1,
            showCopyright: false,
            showNavigation: true,
        });

        // create bottom line
        const bottom_line_y = -1
        const line_bot = board.create('line', [-bottom_line_y, 0, 1], {
            color: "blue",
        });

        const handle = board.create('point', [4, -bottom_line_y], {
            name: "",
            size: 7,
            face: 'o',
            color: "blue",
            snapToGrid: true,
            snapSizeX: 0.1,
            snapSizeY: 0.1,
        });
        const line_top = board.create('line', [[0, -bottom_line_y], handle], {
            color: "blue",
        });

        const z = board.create('glider', [1, 0, board.defaultAxes.x], {
            name: '',
            size: 4,
            strokeColor: 'black',
            fillColor: 'black'
        });

        // create an intersection point
        const intersect = board.create('intersection', [line_bot, line_top, 0], {
            name: ""
        });

        const has_intersect = () => intersect.isReal

        // -1, 1 if handle.X > intersect.X with linebot,linetop
        const handle_over = () => handle.Y() >= intersect.Y()
        const handle_right = () => handle.X() > intersect.X()
        board.create('angle',
            [line_top, line_bot, -1, 1], {
            radius: 10000,
            visible: () => handle.X() > 0 && (handle_over() && !handle_right() || !handle_over() && handle_right()),
            color: "lightblue"
        });
        board.create('angle',
            [line_bot, line_top, -1, 1], {
            radius: 10000,
            visible: () => handle.X() > 0 && (handle_over() && handle_right()),
            color: "lightblue"
        });
        board.create('angle',
            [line_bot, line_top, -1, -1], {
            radius: 10000,
            visible: () => handle.X() < 0 && ((handle_over() && handle_right()) || !handle_over() && !handle_right()),
            color: "lightblue"
        });

        handle.on('drag', _ => {
            console.log(handle)
            board.update();
        });


        board.update()
    }

    // initialize JSXGraph when the div has loaded
    let divRef = useRef(null)
    useEffect(() => {
        if (divRef.current) { logic() }
    }, [divRef])

    return (<>
        <div ref={divRef} id={name} className="jxgbox" style={{ width: "100vmin", aspectRatio: 1.5, marginTop: 50, }}></div></>)
}