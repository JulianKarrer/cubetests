import { Fragment, useState } from "react"

const NAMES = ["CAV-2009", "DILLIG", "PRIME-CONE", "SLACKS", "ROTATE"]
const INSTANCES = [503, 229, 19, 229, 229]
const ORIG_INSTANCES = [591, 233, 37, 233, 229]
const SOLVERS = ["SPASS-IQ-0.1+uc", "SPASS-IQ-0.1", "ctrl-ergo", "cvc4-1.4", "mathsat5-3.9", "yices-2.4.2", "z3-4.4.0",]
const DATA = [
    ["SPASS-IQ-0.1+uc", 503, 22, 229, 9, 19, 0.4, 229, 26, 229, 9],
    ["SPASS-IQ-0.1", 503, 713, 229, 218, 19, 0.4, 197, 95, 229, 214],
    ["ctrl-ergo", 503, 12, 229, 5, 19, 0.4, 229, 46, 24, 6760],
    ["cvc4-1.4", 467, 12903, 206, 4146, 18, 3, 152, 4061, 208, 6964],
    ["mathsat5-3.9", 503, 6409, 225, 2314, 19, 3.5, 181, 4577, 229, 1513],
    ["yices-2.4.2", 472, 11461, 213, 2563, 19, 0.1, 147, 5767, 180, 10171],
    ["z3-4.4.0", 466, 764, 213, 525, 19, 0.2, 158, 383, 213, 528],
]
const SOLVES = {
    "SPASS-IQ-0.1+uc": [503, 229, 19, 229, 229],
    "SPASS-IQ-0.1": [503, 229, 19, 197, 229],
    "ctrl-ergo": [503, 229, 19, 229, 24],
    "cvc4-1.4": [467, 206, 18, 152, 208],
    "mathsat5-3.9": [503, 225, 19, 181, 229],
    "yices-2.4.2": [472, 213, 19, 147, 180],
    "z3-4.4.0": [466, 213, 19, 158, 213],
}
const TIMES = {
    "SPASS-IQ-0.1+uc": [22, 9, 0.4, 26, 9],
    "SPASS-IQ-0.1": [713, 218, 0.4, 95, 214],
    "ctrl-ergo": [12, 5, 0.4, 46, 6760],
    "cvc4-1.4": [12903, 4146, 3, 4061, 6964],
    "mathsat5-3.9": [6409, 2314, 3.5, 4577, 1513],
    "yices-2.4.2": [11461, 2563, 0.1, 5767, 10171],
    "z3-4.4.0": [764, 525, 0.2, 383, 528],
}

const TIME_MINS = [
    SOLVERS.map(s => TIMES[s][0]).reduce((a, b) => Math.min(a, b)),
    SOLVERS.map(s => TIMES[s][1]).reduce((a, b) => Math.min(a, b)),
    SOLVERS.map(s => TIMES[s][2]).reduce((a, b) => Math.min(a, b)),
    SOLVERS.map(s => TIMES[s][3]).reduce((a, b) => Math.min(a, b)),
    SOLVERS.map(s => TIMES[s][4]).reduce((a, b) => Math.min(a, b)),
]


function colourSolves(t) {
    if (t >= 0.999) { return "#048304ff" }
    // if (t > 0.9) { return "#9e7400ff" }
    if (t > 0.7) { return "#000000ff" }
    return "#c70a00ff"
}

function colourTimes(t) {
    if (t > 1.1) { return "#c70a00ff" }
    if (t > 0.5) { return "#000000ff" }
    return "#048304ff"
}

const fontsize = "4.2vmin"

export function ResultsFull({ style }) {
    return <table style={{ fontSize: "30pt", borderCollapse: "collapse", ...style }}>
        <thead>
            <tr>
                <th >Benchmark</th>
                {NAMES.map((name, i) => <th colSpan={2} key={i}>{name}</th>)}
            </tr>
            <tr>
                <th>Instances</th>
                {INSTANCES.map((instances, i) => <th colSpan={2} key={i}>{instances}</th>)}
            </tr>
            <tr>
                <th>Performance</th>
                {NAMES.map((_, i) => <Fragment key={i}>
                    <th style={{ fontStyle: "italic", fontWeight: "normal" }}>solved</th>
                    <th style={{ fontStyle: "italic", fontWeight: "normal" }}>time</th>
                </Fragment>)}
            </tr>
        </thead>
        <tbody>
            {DATA.map((e, i) => <tr key={i}>
                {e.map((content, j) => <td key={j}>{content}</td>)}
            </tr>)}

        </tbody>
    </table>
}


export function ResultsSolve({ style, showSubheader = false }) {
    const [showPercentage, setShowPercentage] = useState(false)
    return (
        <div style={{ position: "relative", ...style }}>
            <button style={{
                position: "absolute",
                right: "-6vmin",
                top: fontsize,
                width: fontsize,
                height: fontsize,
                fontSize: "2vmin",
                cursor: "pointer",
                background: "transparent",
                border: "1px solid #333",
                borderRadius: 5,
            }}
                onClick={_ => setShowPercentage(perc => !perc)}
            >%</button>
            <div style={{
                position: "absolute",
                right: "-5vmin",
                top: "10vmin",
                fontSize: "4vmin",
                textAlign: "center",
                cursor: "pointer",
            }} className="tooltip">?<span className="tooltiptext" style={{ width: 200 }}>10min 32x2.4GHz 512GB RAM</span></div>
            <table style={{ fontSize: fontsize, borderCollapse: "collapse", }}>
                <thead>
                    <tr>
                        <th >Benchmark</th>
                        {NAMES.map((name, i) => <th key={i}>{name}</th>)}
                    </tr>
                    <tr>
                        {<th className="tooltip">Instances<span className="tooltiptext">with Infinite Lattice Width (or ROTATE)</span></th>}
                        {INSTANCES.map((s, i) => <th key={i}>{showPercentage ?
                            <div className="tooltip">{(s / ORIG_INSTANCES[i]).toFixed(2) * 100 + "%"}<span className="tooltiptext">{`${s}/${ORIG_INSTANCES[i]}`}</span></div>
                            // `${s}/${ORIG_INSTANCES[i]}`
                            :
                            s
                        }</th>)}
                    </tr>
                    {showSubheader && <tr>
                        <th colSpan={NAMES.length + 1} style={{ textAlign: "center" }}>Solved Instances</th>
                    </tr>}
                </thead>
                <tbody>
                    {SOLVERS.map((name, i) => <tr key={i} style={{ border: i == 0 ? "solid 2px black" : "" }}>
                        <td>{name}</td>
                        {(SOLVES[name]).map((s, j) => <td key={j}><span style={{
                            textDecoration: s === INSTANCES[j] ? "underline" : "none",
                            color: colourSolves(s / INSTANCES[j])
                        }}>
                            {showPercentage ?
                                (s / INSTANCES[j]).toFixed(2) * 100 + "%" :
                                s
                            }
                        </span></td>)}
                    </tr>)}

                </tbody>
            </table>
        </div>)
}

export function ResultsTime({ style }) {
    const [showPercentage, setShowPercentage] = useState(false)
    return <div style={{ position: "relative", ...style }}>
        <button style={{
            position: "absolute",
            right: "-6vmin",
            top: fontsize,
            width: fontsize,
            height: fontsize,
            fontSize: "2vmin",
            cursor: "pointer",
            background: "transparent",
            border: "1px solid #333",
            borderRadius: 5,
        }}
            onClick={_ => setShowPercentage(perc => !perc)}
        >%</button>
        <div style={{
            position: "absolute",
            right: "-5vmin",
            top: "10vmin",
            fontSize: "4vmin",
            textAlign: "center",
            cursor: "pointer",
        }} className="tooltip">?<span className="tooltiptext" style={{ width: 200 }}>10min 32x2.4GHz 512GB RAM</span></div><table style={{ fontSize: fontsize, borderCollapse: "collapse", }}>
            <thead>
                <tr>
                    <th>Benchmark</th>
                    {NAMES.map((name, i) => <th key={i}>{name}</th>)}
                </tr>
                <tr>
                    {<th className="tooltip">Instances<span className="tooltiptext">with Infinite Lattice Width (or ROTATE)</span></th>}
                    {INSTANCES.map((s, i) => <th key={i}>{showPercentage ?
                        <div className="tooltip">{(s / ORIG_INSTANCES[i]).toFixed(2) * 100 + "%"}<span className="tooltiptext">{`${s}/${ORIG_INSTANCES[i]}`}</span></div>
                        // `${s}/${ORIG_INSTANCES[i]}`
                        :
                        s
                    }</th>)}
                </tr>
                <tr>
                    <th colSpan={NAMES.length + 1} style={{ textAlign: "center" }}>{showPercentage ? "Speedup" : "Time Taken"}</th>
                </tr>
            </thead>
            <tbody>
                {SOLVERS.map((name, i) => <tr key={i} style={{ border: i == 0 ? "solid 2px black" : "" }}>
                    <td>{name}</td>
                    {(TIMES[name]).map((s, j) => {
                        console.log(name, TIME_MINS[j], s, Math.abs(TIME_MINS[j] - s) < 1e-6)
                        return (<td key={j}>
                            <span style={{
                                textDecoration: Math.abs(TIME_MINS[j] - s) < 1e-6 ? "underline" : "none",
                                color: colourTimes(s / TIMES["SPASS-IQ-0.1"][j])
                            }}>{showPercentage ?
                                (TIMES["SPASS-IQ-0.1"][j] / s * 100).toFixed(0) + "%"
                                :
                                s + "s"
                                }</span>
                        </td>)
                    })}
                </tr>)}

            </tbody>
        </table>
    </div>
}