import { useEffect, useRef, useState, useCallback } from "react";
import Reveal from "reveal.js";
import "reveal.js/dist/reveal.css";
import RevealMath from "reveal.js/plugin/math/math.js"
import "./theme.css";
import "./index.css"
import './App.css'
import Annotated from "./components/Annotate";
import Setting from "./Setting";
import DragMove from "./components/DragMove";
import CubeGraph from "./CubeGraph";
import SingleConstraint from "./SingleConstraint";

function Matrix({ mat, setMat, label, style, withScalar = false, matReset = null }) {
  const cols = mat[0].length
  const rows = mat.length

  const [initA, _] = useState(mat.map(function (arr) {
    return arr.slice();
  }))

  const modifyMat = (A, r, c, v) => {
    // deep copy with modification at r_m, c_m to v
    var newA = A.map(function (arr) {
      return arr.slice();
    });
    newA[r][c] = v
    return newA
  }

  const [isExpanded, setIsExpanded] = useState(false)
  const [translate, setTranslate] = useState({
    x: 0,
    y: 0
  });
  const handleDragMove = (e) => {
    console.log("dragging", e.movementX, e.movementY)
    setTranslate(cur => {
      return {
        x: (cur.x + e.movementX),
        y: (cur.y + e.movementY)
      }
    });
  };

  return (
    <DragMove
      onDragMove={handleDragMove}
      style={{
        transform: `translateX(${translate.x}px) translateY(${translate.y}px)`,
        position: "absolute",
        top: 15,
        left: 15,
        background: "rgba(255, 255, 255, 0.8)",
        borderRadius: 15,
        padding: 15,
        zIndex: 1,
        ...style
      }}
      grabber={<span style={{ cursor: "pointer" }} onClick={() => { setIsExpanded(s => !s) }} onDoubleClick={() => { setMat(matReset ? matReset : initA) }}>{label}</span>}
    >
      {/* label */}

      {/* matrix grid */}
      <div
        className="matrix-container"
        style={{
          gridTemplateColumns: "auto ".repeat(cols),
          transition: "height 500ms ease",
          maxHeight: isExpanded ? "1000px" : "0px",
          opacity: isExpanded ? 1 : 0,
          overflow: "hidden",
          transition: "max-height 0.3s ease, opacity 0.2s ease",
          pointerEvents: isExpanded ? "auto" : "none"
        }}
      >
        {Array.from(Array(rows).keys()).flatMap(r => (
          Array.from(Array(cols).keys()).flatMap(c => (
            <DragInput
              key={r.toString() + c.toString()}
              value={mat[r][c]}
              setValue={(v) => { setMat(A => modifyMat(A, r, c, v)) }}
              init={initA[r][c]}
            />
          ))
        ))}
      </div>

    </DragMove>)
}

function DragInput({ init = 0, value, setValue }) {
  const [snapshot, setSnapshot] = useState(value);
  const [startVal, setStartVal] = useState(-1);

  useEffect(() => {
    const onUpdate = (event) => {
      if (startVal >= 0) {
        setValue(snapshot + (event.clientX - startVal) / 100)
      }
      event.stopPropagation()
    };
    const onEnd = () => {
      setStartVal(-1);
    };

    document.addEventListener("pointermove", onUpdate)
    document.addEventListener("pointerup", onEnd)
    return () => {
      document.removeEventListener("pointermove", onUpdate)
      document.removeEventListener("pointerup", onEnd)
    }
  }, [startVal, setValue, snapshot])

  return (
    <span
      onMouseDown={(e) => {
        setStartVal(e.clientX)
        setSnapshot(value)
      }}
      onDoubleClick={() => {
        setValue(init)
      }}
      style={{
        cursor: "ew-resize",
        userSelect: "none",
        textAlign: "right"
      }}
    >
      {value.toLocaleString(
        undefined,
        { minimumFractionDigits: 1, maximumFractionDigits: 1 }
      )}
    </span>
  );
}


function App() {
  // initialize Reveal JS
  const deckDivRef = useRef(null);
  const deckRef = useRef(null);
  const [revealReady, setRevealReady] = useState(false);
  const [frag, setFrag] = useState(0);
  useEffect(() => {
    if (deckRef.current) return;
    deckRef.current = new Reveal(deckDivRef.current, {
      transition: "fade",
      controls: false,
      slideNumber: "c/t",
      jumpToSlide: true,
      disableLayout: true,
      hash: true,

      autoAnimateEasing: 'ease',
      autoAnimateDuration: 0.5,
      transitionSpeed: 'fast', // default/fast/slow
      hideInactiveCursor: false,

      katex: {
        local: 'node_modules/katex',
        delimiters: [
          { left: '$$', right: '$$', display: true },
          { left: '$', right: '$', display: false },
          { left: '\\(', right: '\\)', display: false },
          { left: '\\[', right: '\\]', display: true },
        ],
      },
      plugins: [RevealMath.KaTeX],
    });

    deckRef.current.initialize().then(() => {
      // event handlers and plugin setups
      setTimeout(() => { setRevealReady(true); }, 100)
    });

    // keep track of the currently active fragment
    const updateFrags = () => {
      setTimeout(() => {
        const frags = document.getElementsByClassName("current-fragment")
        const id = frags.length == 0 ? -1 : parseInt(frags[0].getAttribute("data-fragment-index"))
        setFrag(id + 1)
      }, 50)
    }
    deckRef.current.on('fragmentshown', updateFrags);
    deckRef.current.on('fragmenthidden', updateFrags);
    deckRef.current.on('slidechanged', updateFrags);

    return () => {
      // destructor for cleanup
      try {
        if (deckRef.current) {
          deckRef.current.destroy();
          deckRef.current = null;
        }
      } catch (e) {
        console.warn("Reveal.js destroy call failed.");
      }
    };
  }, []);


  let A_init = [
    [1, 0, -0.7],
    [-0.5, 0, 0.1],
    [0, 0, 1],
    [0, 0, -0.6],
    [0, 1, 0],
    [0, -1, 0]
  ]
  let A_reset = [
    [1, 0, 0],
    [-1, 0, 0],
    [0, 0, 1],
    [0, 0, -1],
    [0, 1, 0],
    [0, -1, 0]
  ]
  let b_init = [[-1], [-1], [-1], [-1], [-1], [-1]]
  let c_init = [[1]]

  const [A, setA] = useState(A_init)
  const [b, setB] = useState(b_init)
  const [c, setC] = useState(c_init)

  let varIndices = [0, 1, 2]

  return (
    <div className="reveal" ref={deckDivRef}>
      <div className="slides">
        <section data-auto-animate>
          <h1 data-id="h1" id="h1-title">Fast Cube Tests for<br />LIA Constraint Solving</h1>
          <h3>Julian Karrer</h3>
          <h5 style={{ marginTop: "10vmin" }}>Paper by Martin Bromberger and Christoph Weidenbach</h5>
        </section>

        <section data-auto-animate style={{ justifyContent: "flex-start" }}>
          <h1 className="top" data-id="h1">{
            frag == 0 ? "Setting" :
              frag == 1 ? "Integers Only" :
                frag == 2 ? "Polyhedra" :
                  frag == 3 ? "Half-Spaces" : ""
          }</h1>
          <Matrix mat={A} setMat={setA} label={"$A$"} matReset={A_reset} style={{
            opacity: frag < 2 ? 0 : 1,
            pointerEvents: frag < 2 ? "none" : "auto",
          }} />
          <Matrix mat={b} setMat={setB} label={"$b$"} style={{
            left: 340,
            opacity: frag < 2 ? 0 : 1,
            pointerEvents: frag < 2 ? "none" : "auto",
          }} />
          <Matrix mat={c} setMat={setC} label={"$c$"} style={{
            right: 100,
            left: "auto",
            opacity: frag < 2 ? 0 : 1,
            pointerEvents: frag < 2 ? "none" : "auto",
          }} />
          <Setting A={A} b={b} c={c[0]} varIndices={varIndices} phase={frag} />
          <Annotated
            style={{
              opacity: frag >= 2 ? 0 : 1,
              pointerEvents: frag >= 2 ? "none" : "auto",
              position: "absolute", bottom: "8vh", background: "#f0f0f0ee",
              padding: "20px", paddingTop: "10px", borderRadius: "20px"
            }}
            glossary={{
              "\\le": "\\text{component-wise} \\le",
              x: "x \\in \\mathbb{Z}^N",
            }}
            content={"$A \\vec{x} \\le \\vec{b}$ with $x \\in \\mathbb{Z}^N$"}
            revealReady={revealReady}
          />
          <Annotated
            style={{
              opacity: frag < 2 ? 0 : 1,
              pointerEvents: frag < 2 ? "none" : "auto",
              position: "absolute", bottom: "8vh", background: "#f0f0f0ee",
              padding: "20px", paddingTop: "10px", borderRadius: "20px"
            }}
            glossary={{
              "\\le": "\\text{component-wise} \\le",
            }}
            content={"$A \\vec{x} \\le \\vec{b} \\cdot c$"}
            revealReady={revealReady}
          />
          <span className="fragment"></span>
          <span className="fragment"></span>
          <span className="fragment"></span>
        </section>

        <section data-auto-animate>
          <h1 data-id="h1">Cube Tests</h1>
          <div className="leftbound">
            <div className="top-space">Cube Definition:
              <Annotated content={`$
              \\begin{aligned}
                C_e^N(\\vec{z}) ≔& \\left\\{ \\vec{x} \\in \\mathbb{R}^N \\, \\middle | \\,  \\forall j \\in \\mathbb{N} _1^N :\\quad | \\vec{x}_j-\\vec{z}_j | \\le \\frac{e}{2} \\right \\} \\\\
                =&\\left\\{ \\vec{x} \\in \\mathbb{R}^N \\, \\middle | \\,  
                  \\left|\\left| x - z \\right|\\right|_\\infty \\le \\frac{e}{2}
                \\right \\}
              \\end{aligned}
                $`} revealReady={revealReady} /></div>
            <div className="top-space">Ployhedron Definition: </div>
            <Annotated content={`$P^A_b ≔ \\left\\{ \\vec{x} \\in \\mathbb{R}^N \\, \\middle | \\,  A\\vec{x}-\\vec{b} \\le 0 \\right \\}$`}
              glossary={{
                A: "A \\in \\mathbb{R}^{M\\times N}",
                b: "b \\in  \\mathbb{R}^{M}",
                e: "e \\in  \\mathbb{R}_+",
                c: "c \\in \\mathbb{R}",
                x: "x \\in \\mathbb{R}^N",
                "\\le": "\\text{component - wise} \\le",
              }}
              revealReady={revealReady} />
            <p className="top-space">We test for {`$C_e^N(\\vec{z}) \\subseteq P^A_b$`} {'$\\qquad$'} {"$\\lceil \\vec{z} \\rfloor \\in \\mathbb{Z}^N$"} is candidate</p>
          </div>
        </section>
        <section data-auto-animate>
          <h1 data-id="h1">Motivation</h1>
          <CubeGraph />
        </section>

        <section data-auto-animate>
          <h1 data-id="h1">Single Constraint</h1>
          <div style={{ display: "flex", width: "100vw", marginTop: "5vmin" }}>
            <div style={{ width: "40vw", height: "60vh", display: "flex", alignItems: "center", marginLeft: "50px" }}>
              <SingleConstraint />
            </div>
            <div style={{ maxWidth: "60vw", marginLeft: "50px", textAlign: "left" }}>
              <Annotated content={`$\\begin{aligned}
            &\\forall \\vec{x} \\in C_e^N(\\vec{z}): 
            \\underbrace{\\vec{a}_i \\cdot \\vec{x}}_{\\textit{objective}} \\le \\underbrace{b_i}_{\\textit{upper bound}} \\\\ \\\\

            &\\Longleftrightarrow\\max_{x\\in C_e^N(\\vec{z})} \\left\\{\\vec{a}_i \\cdot \\vec{x}\\right\\}  \\le b_i  \\\\
            \\end{aligned}$`}

                glossary={{}}
                style={{ marginBottom: "50px" }}
                revealReady={revealReady} />
              <div data-id={"vertex-set"}>
                <span style={{ width: "100%" }}>Vertex Set:</span><br />
                {` $$\\mathbb{V}\\left(\\vec{z}, e\\right)  ≔ \\left\\{  \\left( z_1 \\pm \\frac{e}{2}, \\dots , z_N \\pm \\frac{e}{2}\\right)^T
              \\right \\}  $$`}
              </div>
            </div>
          </div>
        </section>
        <section data-auto-animate style={{ textAlign: "left" }}>
          <h1 data-id="h1">Single Constraint</h1>
          <div data-id={"vertex-set"} style={{ marginTop: "5vmin" }}>
            <span style={{ width: "100%" }}>Vertex Set into Objective:</span><br />
            {` $$
             \\max_{\\vec{x}\\in\\mathbb{V}\\left(\\vec{z}, e\\right)} \\vec{a}_i^T \\vec{x}
             = \\max\\left\\{ \\vec{a}_i \\cdot \\left( z_1 \\pm \\frac{e}{2}, \\dots , z_N \\pm \\frac{e}{2}\\right)^T
              \\right \\}  $$`}
          </div>
          <div style={{ marginTop: "50px" }}>
            {`$$=
             \\vec{a}_i \\cdot \\vec{z} +  \\frac{e}{2}\\max\\left\\{ 
             \\sum_{j=1}^N \\pm a_i
            \\right\\}$$`}

            <span data-id="cube-transform-1d-res">{`$$= \\vec{a}_i\\cdot\\vec{z} + \\frac{e}{2}\\sum_{j=1}^N \\left| a_i\\right|$$`}</span>
          </div>
        </section>
        <section data-auto-animate style={{ textAlign: "left" }}>
          <h1 data-id="h1" >Multiple Constraints</h1>

          <span data-id="cube-transform-1d-res" style={{ marginTop: "10vmin" }}>
            {`$$
            C_e^N(\\vec{z})\\subseteq P^{a_i}_{b_i}
            \\quad\\Longleftrightarrow \\quad
            \\vec{a}_i\\cdot\\vec{z} + \\frac{e}{2}\\left|\\left| a_i\\right|\\right|_1 \\le b_i 
            $$ `}
          </span>
          <div style={{
            border: "2px black solid", borderRadius: "20px", padding: "3vmin", margin: "15vmin", position: "relative", textAlign: "center"
          }}>
            <span style={{ position: "absolute", top: "-8vmin", width: "100%", left: 0, fontWeight: "bold" }}>Linear Cube Transformation</span>
            {`$$ \\begin{aligned}
            C_e^N(\\vec{z})\\subseteq P^{A}_{b}
            \\Longleftrightarrow 
            &A\\vec{z} \\le \\vec{b}'\\\\
            \\text{where: }\\quad&b_i' ≔ b_i - \\frac{e}{2}\\left|\\left| a_i\\right|\\right|_1 
            \\end{aligned}$$ `}
          </div>
        </section>


        <section data-auto-animate>
          <h1 data-id="h1">Test Slide: Rounding</h1>
          <ul>
            <li style={{ marginTop: "3vmin" }}>
              {"$\\lceil x \\rfloor$"} is closest integer point to {"$x$"}<br />
              {"$\\forall x\\in\\mathbb{R}^N, \\forall x'\\in\\mathbb{Z}^N, \\forall p \\ge 1: \\, \\left|\\left| x - \\lceil x \\rfloor\\right|\\right|_p \\le \\left|\\left| x - x'\\right|\\right|_p$"}
            </li>
            <li style={{ marginTop: "3vmin" }}>
              {"$C_e^N(\\vec{z})$"} contains integer point {"$\\Longleftrightarrow \\lceil \\vec{z} \\rfloor \\in C_e^N(\\vec{z})$"}
            </li>
            <li style={{ marginTop: "3vmin" }}>
              {"$C_1^N(\\vec{z})$"}is smallest cube guaranteed to contain integer point
            </li>
          </ul>
        </section>
      </div>
    </div >
  )
}

export default App
