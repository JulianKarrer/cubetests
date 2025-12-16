import { useEffect, useRef, useState, useCallback, Fragment } from "react";

import katex from "katex";
import "katex/dist/katex.min.css";
import Reveal from "reveal.js";
import "reveal.js/dist/reveal.css";
import paper from "./assets/unit-cube-test.pdf"

import RevealMath from "reveal.js/plugin/math/math.js"
import "./theme.css";
import "./index.css"
import './App.css'
import "./components/jsxgraphcore.js"
import ShuffleIcon from "./assets/icons/arrows-shuffle.svg"
import Annotated from "./components/Annotate";
import Setting from "./Setting";
import DragMove from "./components/DragMove";
import CubeGraph from "./CubeGraph";
import SingleConstraint from "./SingleConstraint";
import CubeTransform3D from "./CubeTransform3D.jsx";
import Simplex from "./Simplex.jsx";
import { ResultsFull, ResultsTime, ResultsSolve } from "./Results.jsx";

function gaussian(mean = 0, stdev = 1) {
  //https://stackoverflow.com/questions/25582882/
  const u = 1 - Math.random();
  const v = Math.random();
  const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  return z * stdev + mean;
}

function Matrix({ mat, setMat, label, style, lower_bound: lowerBound = null, matReset = null, initiallyExpanded = false, showShuffle = true }) {
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
    newA[r][c] = lowerBound !== null ? Math.max(lowerBound, v) : v
    return newA
  }

  const [isExpanded, setIsExpanded] = useState(initiallyExpanded)
  const [translate, setTranslate] = useState({
    x: 0,
    y: 0
  });
  const handleDragMove = (e) => {
    setTranslate(cur => {
      return {
        x: (cur.x + e.movementX),
        y: (cur.y + e.movementY)
      }
    });
  };

  const stddev = 0.1;

  return (
    <DragMove
      onDragMove={handleDragMove}
      style={{
        transform: `translateX(${translate.x}px) translateY(${translate.y}px)`,
        position: "absolute",
        top: 15,
        left: 15,
        background: isExpanded ? "white" : "rgba(255, 255, 255, 0.7)",
        borderRadius: 15,
        padding: 15,
        zIndex: isExpanded ? 2 : 1,
        ...style
      }}
      grabber={<span style={{ cursor: "pointer" }} onClick={() => { setIsExpanded(s => !s) }} onDoubleClick={() => { setMat(matReset ? matReset : initA) }}>{label}</span>}
    >
      {/* shuffle icon */}
      {showShuffle && <button style={{
        transition: "max-height 0.3s ease, opacity 0.2s ease, height 500ms ease",
        maxHeight: isExpanded ? "30px" : "0px",
        opacity: isExpanded ? 1 : 0,
        height: isExpanded ? "30px" : "0px",
        width: isExpanded ? "30px" : "0px",
        display: isExpanded ? "inline-block" : "none",
        background: "white",
        border: "2px solid black",
        borderRadius: 10,
        position: "absolute",
        left: "50%",
        transform: "translateX(-50%)",
        top: 110,
        cursor: "pointer",
        background: ` center / contain no-repeat url("${ShuffleIcon}")`
      }}
        onClick={(e) => {
          let newA = mat.map(function (arr) {
            const copy = arr.slice()
            return copy.map(x => x + gaussian(0, stddev))
          });
          setMat(newA)
        }}
        title={`Add 𝒩(μ=0,σ=${(stddev * 100).toFixed(0)}%)`}
      ></button>}
      {/* matrix grid */}
      <div
        className="matrix-container"
        style={{
          marginTop: isExpanded && showShuffle ? 30 : 0,
          gridTemplateColumns: "auto ".repeat(cols),
          maxHeight: isExpanded ? "1000px" : "0px",
          opacity: isExpanded ? 1 : 0,
          zIndex: isExpanded ? 5 : 0,
          overflow: "hidden",
          transition: "max-height 0.3s ease, opacity 0.2s ease, height 500ms ease",
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


function Bordered({ children, style, dataId }) {
  return <div style={{
    border: "2px black solid", borderRadius: "20px", padding: "3vmin", margin: "5vmin", position: "relative", textAlign: "center", ...style
  }} data-id={dataId}>
    {children}
  </div>
}

function LinearCubeTransform({ style }) {
  return (
    <Bordered style={{ margin: "15vmin", ...style }}>
      <span style={{ position: "absolute", top: "-8vmin", width: "100%", left: 0, fontWeight: "bold" }}>Linear Cube Transformation</span>
      {`$$ \\begin{aligned}
      C_e^N(\\vec{z})\\subseteq P^{A}_{b}
      \\Longleftrightarrow 
      &A\\vec{z} \\le \\vec{b}'\\\\
      \\text{where: }\\quad&b_i' ≔ b_i - \\frac{e}{2}\\left|\\left| a_i\\right|\\right|_1 
      \\end{aligned}$$ `}
    </Bordered>
  )
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
        // local: 'node_modules/katex',
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
  let A_reset = A_init
  // [
  //   [1, 0, 0],
  //   [-1, 0, 0],
  //   [0, 0, 1],
  //   [0, 0, -1],
  //   [0, 1, 0],
  //   [0, -1, 0]
  // ]
  let b_init = [[1], [1], [1], [1], [1], [1]]
  let c_init = [[1]]
  let e_init = [[0]]

  const [A, setA] = useState(A_init)
  const [b, setB] = useState(b_init)
  const [c, setC] = useState(c_init)
  const [e, setE] = useState([[0]])

  let varIndices = [0, 1, 2]

  const [chebyshev, setChebyshev] = useState(false);

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
              A: "A \\in \\mathbb{Q}^{M\\times N}",
              b: "b \\in  \\mathbb{Q}^{M}",
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
              x: "x \\in \\mathbb{Z}^N",
              A: "A \\in \\mathbb{Q}^{M\\times N}",
              b: "b \\in  \\mathbb{Q}^{M}",
              c: "c \\in  \\mathbb{Q}",
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
                  \\left|\\left| \\vec{x} - \\vec{z} \\right|\\right|_\\infty \\le \\frac{e}{2}
                \\right \\}
              \\end{aligned}
                $`}
                glossary={{
                  e: "e\\in\\mathbb{R}_{\\ge 0}",
                  x: "\\vec{x} \\in \\mathbb{R}^N",
                  z: "\\vec{z} \\in \\mathbb{R}^N",
                }}
                revealReady={revealReady} /></div>
            <div className="top-space">Polyhedron Definition: </div>
            <Annotated content={`$P^A_b ≔ \\left\\{ \\vec{x} \\in \\mathbb{R}^N \\, \\middle | \\,  A\\vec{x}-\\vec{b} \\le 0 \\right \\}$`}
              glossary={{
                A: "A \\in \\mathbb{Q}^{M\\times N}",
                b: "b \\in  \\mathbb{Q}^{M}",
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
             \\sum_{j=1}^N \\pm a_{ij}
            \\right\\}$$`}

            <span data-id="cube-transform-1d-res">{`$$= \\vec{a}_i\\cdot\\vec{z} + \\frac{e}{2}\\sum_{j=1}^N \\left|a_{ij}\\right|$$`}</span>
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
          <LinearCubeTransform />
        </section>
        <section data-auto-animate>
          <h1 data-id="h1" className="top" >Geometric Meaning</h1>
          <CubeTransform3D A={A} b={b} e={e} setE={setE} varIndices={varIndices} chebyshev={chebyshev} />
          <Matrix mat={A} setMat={setA} label={"$A$"} initiallyExpanded={false} matReset={A_reset} style={{
            top: "calc(50% - 180px)",
          }} />
          <Matrix mat={b} setMat={setB} label={"$b$"} initiallyExpanded={false} style={{
            top: "50%",
            left: 15,
          }} />
          <Matrix mat={e} setMat={setE} label={"$e$"} initiallyExpanded={true} lower_bound={0} matReset={e_init} showShuffle={false} style={{
            top: "50%",
            left: 175,
          }} />
          <div style={{ position: "absolute", left: 15, bottom: 15, fontSize: "calc(var(--r-main-font-size) * 0.75)" }}>
            Chebyshev
            <input type="checkbox" checked={chebyshev} onChange={e => setChebyshev(e.target.checked)} style={{
              width: "calc(var(--r-main-font-size) * 0.5)",
              height: "calc(var(--r-main-font-size) * 0.5)",
              marginLeft: 10,
            }}></input>
          </div>
        </section>

        <section data-auto-animate>
          <h1 data-id="h1">Largest Cube Test</h1>
          <Bordered>
            {`$$\\begin{aligned}
            e^* \\coloneqq \\max_{e\\in\\mathbb{R},\\, \\vec{z}\\in\\mathbb{R}^N} \\qquad &e  \\\\
            \\text{st.}  \\qquad A\\vec{z} + \\frac{e}{2}\\vec{a}' &\\le b \\quad\\textit{where}\\quad \\vec{a}_i' \\coloneqq \\left|\\left|\\vec{a}_i\\right|\\right|_1\\\\
             0 &\\le e
          \\end{aligned}$$`}
          </Bordered>
          <ul>
            <li>Solution with Simplex since {"$\\vec{z}\\in\\mathbb{R}^N$"}</li>
            <li>{"$\\Omega(e) \\subseteq P^A_b$"} and {"$\\Omega(e=0) = P^A_b$"}</li>
            <li>Find feasible {"$\\vec{z}$"} even for {"$e^*=\\infty$"}</li>
          </ul>
        </section>

        <section data-auto-animate>
          <h1 data-id="h1" className="top">Simplex Algorithm</h1>
          <Matrix mat={A} setMat={setA} label={"$A$"} initiallyExpanded={false} matReset={A_reset} style={{
            top: "calc(50% - 180px)",
          }} />
          <Matrix mat={b} setMat={setB} label={"$b$"} initiallyExpanded={false} style={{
            top: "50%",
            left: 15,
          }} />
          <Simplex A={A} b={b} varIndices={varIndices} />
          <div style={{ top: "50%", position: "absolute", right: 40, background: "rgba(255, 255, 255, 0.6)", borderRadius: 20, transform: "translateY(-50%)" }}>
            <Bordered style={{ margin: 0 }}>
              {`$$\\begin{aligned}
            \\max_{\\vec{x}\\in\\mathbb{R}^N} \\quad\\vec{c} &\\cdot \\vec{x}\\\\
            A\\vec{x}&\\le \\vec{b}
              `}
              {/* {`\\\\\\\\vec{x}&\\ge 0`} */}
              {`
            \\end{aligned}$$`}
            </Bordered>
          </div>

          <ol style={{
            position: "absolute",
            margin: 0,
            bottom: 10,
          }}>
            <li>Find Basic Feasible Solution</li>
            <li>Pivot along increasing edges</li>
          </ol>
        </section>

        <section data-auto-animate>
          <h1 data-id="h1">Motivation</h1>
          <CubeGraph name={"cubegraph2"} fixedE={true} />
        </section>

        <section data-auto-animate>
          <h1 data-id="h1">Closest point Lemma</h1>
          <span data-id="int-solution-guarantee">For {"$\\vec{x}\\in\\mathbb{R}^N$"}, {"$\\left\\lceil\\vec{x}\\right\\rfloor$"} is the closest integer to {"$\\vec{x}$"}</span>
          <Bordered >
            <Annotated
              content={"$\\forall \\vec{x}'\\in\\mathbb{Z}^N:  \\left |\\left | \\vec{x} -  \\left\\lceil\\vec{x}\\right\\rfloor \\right |\\right |_p \\le \\left |\\left | \\vec{x} -  \\vec{x}' \\right |\\right |_p$"}
              glossary={{ p: "p\\in\\mathbb{N^+} \\cup \\{\\infty\\}" }}
              style={{}}
              revealReady={revealReady}
            />
          </Bordered>
          Holds due to monotonicity of norms if:
          <Bordered dataId="closest-point">
            {"$\\forall x_j'\\in\\mathbb{Z}:$"}
            <span class="fragment fragment-grow" data-fragment-index="2">{"$\\sum_{j=1}^N$"}</span>
            {"$| x_j -  \\lceil x_j\\rfloor | $"}
            <span class="fragment fragment-grow" data-fragment-index="1">{"$^p$"}</span>
            {"$\\le $"}
            <span class="fragment fragment-grow" data-fragment-index="2">{"$\\sum_{j=1}^N$"}</span>
            {"$\\left | x_j -  x_j' \\right |$"}
            <span class="fragment fragment-grow" data-fragment-index="1">{"$^p$"}</span>
          </Bordered>
        </section>

        <section data-auto-animate>
          <h1 data-id="h1">Proof: One Dimension</h1>
          <Bordered style={{ margin: 10 }} dataId="closest-point">
            {"$$\\forall x_j'\\in\\mathbb{Z}:   | \\underbrace{x_j -  \\lceil x_j\\rfloor }_{\\eqqcolon d_j \\in  \\left[-\\frac{1}{2}, \\frac{1}{2}\\right]} | \\le \\left | x_j -  x_j' \\right |$$"}
          </Bordered>
          <ul style={{ marginBottom: 60 }}>
            <li>{"$\\exists z_j \\in\\mathbb{Z}: x_j' =  \\lceil x_j\\rfloor - z_j$"}</li>
          </ul>
          <span>
            {`$\\begin{aligned}
            z=0: &\\quad
            |x_j - \\lceil x_j\\rfloor | \\le |x_j - \\lceil x_j\\rfloor - \\cancel{z_j}| \\\\ 
            
            z\\neq0: &\\quad
            |x_j - x_j' | 
            = | \\underbrace{x_j - \\lceil x_j\\rfloor}_{d_j} - z_j|
            \\overset{\\text{triangle}}{\\ge} \\underbrace{ |z_j| }_{\\ge 1} - \\underbrace{|d_j|}_{\\le \\frac{1}{2}} 
            \\ge \\underbrace{|d_j|}_{\\le \\frac{1}{2}} ∎

            \\end{aligned}
            $`}
          </span>
        </section>

        <section data-auto-animate>
          <h1 data-id="h1">The tightest Cube</h1>
          <span data-id="int-solution-guarantee">{"$C_1^N(\\vec{z}) \\subseteq P^A_b$"} guarantees integer solution {"$\\left\\lceil \\vec{z} \\right\\rfloor$"}?</span>
          <Bordered>
            <ul>
              <li>{"$\\forall z_j \\in \\mathbb{R}: \\, \\left| \\left\\lceil z_j \\right\\rfloor - z_j\\right| \\le \\frac{1}{2}$"}</li>
              <li>{"$\\left\\lceil \\left(\\frac{1}{2}, \\dots, \\frac{1}{2}\\right)^T \\right\\rfloor \\in C_1^N \\left(\\left(\\frac{1}{2}, \\dots, \\frac{1}{2}\\right)^T\\right)$"}</li>
            </ul>
          </Bordered>
        </section>

        <section data-auto-animate>
          <h1 data-id="h1">Unit Cube Test</h1>
          <Bordered>
            {`$$A\\vec{z} \\le \\vec{b}' \\quad\\textit{where}\\quad \\vec{b}_i' \\coloneqq \\vec{b}_i - \\frac{1}{2} \\left|\\left|\\vec{a}_i\\right|\\right|_1$$`}
          </Bordered>
          <ul>
            <li>Feasibility, no objective function</li>
            <li><span data-id="int-solution-guarantee">Guarantees integer solution {"$\\left\\lceil \\vec{z} \\right\\rfloor$"}</span></li>
          </ul>
        </section>


        <section data-auto-animate>
          <h1 data-id="h1">Infinite Lattice Width</h1>
          {/* <ul>
            <li></li>
          </ul> */}
        </section>

        <section data-auto-animate>
          <h1 data-id="h1" className="top">Results — Solved Instances</h1>
          <ResultsSolve style={{ marginTop: 200 }} />
        </section>
        <section data-auto-animate>
          <h1 data-id="h1" className="top">Results — Time Taken</h1>
          <ResultsTime style={{ marginTop: 200 }} />
        </section>

        <section data-auto-animate>
          <h1 data-id="h1">Summary</h1>
        </section>
        <section data-auto-animate>
          <h1 data-id="h1">Appendix:  Paper</h1>
          <embed src={paper} style={{ width: "80vw", height: "80vh" }}
            type="application/pdf" />
        </section>




        {/* <section data-auto-animate>
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
        </section> */}
      </div>
    </div >
  )
}

export default App
