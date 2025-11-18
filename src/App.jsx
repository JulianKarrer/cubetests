import { useEffect, useRef, useState, useCallback } from "react";
import Reveal from "reveal.js";
import "reveal.js/dist/reveal.css";
import RevealMath from "reveal.js/plugin/math/math.js"
import "./theme.css";
import './App.css'
import Annotated from "./components/Annotate";
import Setting from "./Setting";
import DragMove from "./components/DragMove";

function Matrix({ A, setA }) {
  const cols = A[0].length
  const rows = A.length

  const [initA, _] = useState(A.map(function (arr) {
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
    console.log(e)
    setTranslate({
      x: translate.x + e.movementX,
      y: translate.y + e.movementY
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
      }}
      grabber={<span style={{ cursor: "pointer" }} onClick={() => { setIsExpanded(s => !s) }} onDoubleClick={() => { setA(initA) }}>{"$A$"}</span>}
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
        }}
      >
        {Array.from(Array(rows).keys()).flatMap(r => (
          Array.from(Array(cols).keys()).flatMap(c => (
            <DragInput
              key={r.toString() + c.toString()}
              value={A[r][c]}
              setValue={(v) => { setA(A => modifyMat(A, r, c, v)) }}
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
    [1, 0, 0],
    [-1, 0, 0],
    [0, 0, 1],
    [0, 0, -1],
    [0, 10, 0],
    [0, -0.5, 0]
  ]

  const [A, setA] = useState(A_init)

  let b = [-1, -1, -1, -1, -1, -1]
  let f = 1.0
  let varIndices = [0, 1, 2]

  return (
    <div className="reveal" ref={deckDivRef}>
      <div className="slides">
        <section data-auto-animate>
          <h1 data-id="h1" id="h1-title">Fast Cube Tests for<br />LIA Constraint Solving</h1>
          <h3>Julian Karrer</h3>
        </section>

        <section data-auto-animate style={{ justifyContent: "flex-start" }}>
          <h1 className="top" data-id="h1">{
            frag == 0 ? "Setting" :
              frag == 1 ? "Integers Only" :
                frag == 2 ? "Polyhedra" :
                  frag == 3 ? "Half-Planes" : ""
          }</h1>
          <Matrix A={A} setA={setA} />
          <Setting A={A} b={b} varIndices={varIndices} phase={frag} />
          <Annotated
            style={{
              position: "absolute", bottom: "8vh", background: "#f0f0f0ee",
              padding: "20px", paddingTop: "10px", borderRadius: "20px"
            }}
            content={"$A \\vec{x} \\le \\vec{b}$ with $x \\in \\mathbb{Z}^N$"}
            revealReady={revealReady}
          />
          <span className="fragment"></span>
          <span className="fragment"></span>
          <span className="fragment"></span>
        </section>

        <section data-auto-animate>
          <h1 data-id="h1">Test Slide</h1>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit.
        </section>
      </div>
    </div>
  )
}

export default App
