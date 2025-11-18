// this annotation component was written with the help of an LLM, since it is purely cosmetic 
import React, { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";

/**
 * Annotated (no extra deps)
 *
 * Same props as before:
 *  - content, glossary, revealReady
 *  - popupFontSize (e.g. "14px")
 *  - popupMaxWidth (px)
 *  - popupOffset (CSS length above pointer/anchor)
 *
 * Improved: prevents flash at top-left and fades the popup in.
 */
export default function Annotated({
    content,
    glossary = {
        A: "A \\in \\mathbb{R}^{M\\times N}",
        b: "b \\in  \\mathbb{R}^{M}",
        x: "x \\in \\mathbb{Z}^N",
        "\\le": "\\text{component-wise} \\le",
    },
    revealReady = false,
    popupFontSize = "1vmin",
    popupMaxWidth = 520,
    popupOffset = "-12vmin",
    className = "",
    style
}) {
    const containerRef = useRef(null);
    const popupRef = useRef(null);

    // popup state includes: visible (intention), mounted (DOM mounted), measuring (we're positioning),
    // html, left/top, anchorRect, cursor etc.
    const [popup, setPopup] = useState({
        intentVisible: false, // whether we intend to show it
        mounted: false, // whether the popup DOM is mounted (we mount hidden for measuring)
        measuring: false, // measuring/positioning in progress
        html: "",
        left: 0,
        top: 0,
        maxWidth: popupMaxWidth,
        anchorRect: null,
        cursor: null,
        offsetCss: popupOffset,
    });

    // small macro map
    const macroMap = {
        "\\le": "≤",
        "\\ge": "≥",
        "\\times": "×",
        "\\cdot": "·",
        "\\in": "∈",
    };

    // matchMap
    const matchMap = {};
    Object.keys(glossary).forEach((k) => {
        matchMap[k] = macroMap[k] || k;
    });
    const keys = Object.keys(matchMap).sort((a, b) => matchMap[b].length - matchMap[a].length);

    // parse inline segments
    function parseSegments(s) {
        const parts = [];
        const regex = /(\$[^$]+\$)/g;
        let lastIndex = 0, m;
        while ((m = regex.exec(s)) !== null) {
            if (m.index > lastIndex) parts.push({ type: "text", text: s.slice(lastIndex, m.index) });
            parts.push({ type: "math", text: m[0].slice(1, -1) });
            lastIndex = m.index + m[0].length;
        }
        if (lastIndex < s.length) parts.push({ type: "text", text: s.slice(lastIndex) });
        return parts;
    }

    // render math to element via KaTeX if available
    function renderMathToElement(tex, el) {
        if (window && window.katex && typeof window.katex.renderToString === "function") {
            try {
                el.innerHTML = window.katex.renderToString(tex, { throwOnError: false, displayMode: false });
                return true;
            } catch (err) {
                console.warn("katex.renderToString error:", err);
            }
        }
        if (window && typeof window.renderMathInElement === "function") {
            try {
                el.textContent = `$${tex}$`;
                window.renderMathInElement(el, {
                    delimiters: [
                        { left: "$", right: "$", display: false },
                        { left: "$$", right: "$$", display: true },
                    ],
                });
                return true;
            } catch (err) {
                console.warn("renderMathInElement error:", err);
            }
        }
        return false;
    }

    // wrap glossary targets inside rendered text nodes
    function wrapGlossaryTargets(root) {
        if (!keys.length) return;
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null, false);
        const replacements = [];
        while (walker.nextNode()) {
            const node = walker.currentNode;
            const text = node.nodeValue;
            if (!text) continue;
            let pos = -1, foundKey = null, foundIdx = -1;
            for (let k of keys) {
                const needle = matchMap[k];
                if (!needle) continue;
                const idx = text.indexOf(needle);
                if (idx >= 0 && (pos === -1 || idx < pos)) {
                    pos = idx;
                    foundKey = k;
                    foundIdx = idx;
                }
            }
            if (pos >= 0 && foundKey) {
                replacements.push({
                    node,
                    start: foundIdx,
                    end: foundIdx + matchMap[foundKey].length,
                    key: foundKey,
                });
            }
        }
        for (let i = replacements.length - 1; i >= 0; --i) {
            const { node, start, end, key } = replacements[i];
            const txt = node.nodeValue;
            const before = txt.slice(0, start);
            const middle = txt.slice(start, end);
            const after = txt.slice(end);
            const parent = node.parentNode;
            if (!parent) continue;
            if (before) parent.insertBefore(document.createTextNode(before), node);
            const span = document.createElement("span");
            span.className = "gloss-target";
            span.setAttribute("data-gloss-key", key);
            span.setAttribute("tabindex", "0");
            span.textContent = middle;
            parent.insertBefore(span, node);
            if (after) parent.insertBefore(document.createTextNode(after), node);
            parent.removeChild(node);
        }
    }

    // build initial DOM with raw fallback; wrap lightly and attach listeners
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;
        container.innerHTML = "";

        const segments = parseSegments(content);
        segments.forEach((seg) => {
            if (seg.type === "text") {
                const el = document.createElement("span");
                el.className = "plain-text";
                el.textContent = seg.text;
                container.appendChild(el);
            } else {
                const el = document.createElement("span");
                el.className = "inline-math";
                el.setAttribute("data-tex", seg.text);
                el.textContent = `$${seg.text}$`;
                container.appendChild(el);
            }
        });

        setTimeout(() => {
            wrapGlossaryTargets(container);
            attachListeners(container);
        }, 30);

        return () => detachListeners(container);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [content]);

    // when Reveal ready, render math via KaTeX and wrap
    useEffect(() => {
        if (!revealReady) return;
        const container = containerRef.current;
        if (!container) return;
        const mathSpans = Array.from(container.querySelectorAll(".inline-math[data-tex]"));
        mathSpans.forEach((s) => {
            const tex = s.getAttribute("data-tex");
            if (!tex) return;
            const ok = renderMathToElement(tex, s);
            s.removeAttribute("data-tex");
            if (ok) wrapGlossaryTargets(s);
        });
        attachListeners(container);
        return () => detachListeners(container);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [revealReady, JSON.stringify(glossary)]);

    // attach/detach listeners
    function attachListeners(root = containerRef.current) {
        if (!root) return;
        const targets = root.querySelectorAll(".gloss-target");
        targets.forEach((t) => {
            t.addEventListener("mouseenter", onTargetEnter);
            t.addEventListener("mousemove", onTargetMove);
            t.addEventListener("mouseleave", onTargetLeave);
            t.addEventListener("focus", onTargetEnter);
            t.addEventListener("blur", onTargetLeave);
            t.addEventListener("keydown", onTargetKeyDown);
            t.addEventListener("touchstart", onTargetTouch, { passive: false });
        });
    }
    function detachListeners(root = containerRef.current) {
        if (!root) return;
        const targets = root.querySelectorAll(".gloss-target");
        targets.forEach((t) => {
            t.removeEventListener("mouseenter", onTargetEnter);
            t.removeEventListener("mousemove", onTargetMove);
            t.removeEventListener("mouseleave", onTargetLeave);
            t.removeEventListener("focus", onTargetEnter);
            t.removeEventListener("blur", onTargetLeave);
            t.removeEventListener("keydown", onTargetKeyDown);
            t.removeEventListener("touchstart", onTargetTouch);
        });
    }

    // css length -> px
    function cssToPixels(cssLen) {
        try {
            const tmp = document.createElement("div");
            tmp.style.position = "absolute";
            tmp.style.left = "-9999px";
            tmp.style.marginTop = cssLen;
            document.body.appendChild(tmp);
            const px = parseFloat(getComputedStyle(tmp).marginTop || "0");
            document.body.removeChild(tmp);
            return isFinite(px) ? px : 0;
        } catch (e) {
            return 0;
        }
    }

    // popup hiding timer
    let hideTimeout = null;

    function onTargetMove(e) {
        // only update cursor when popup is already visible (improves smoothing)
        if (!popup.intentVisible) return;
        setPopup((p) => ({ ...p, cursor: { clientX: e.clientX, clientY: e.clientY } }));
    }

    function onTargetEnter(e) {
        if (hideTimeout) { clearTimeout(hideTimeout); hideTimeout = null; }
        const target = e.currentTarget;
        const key = target.getAttribute("data-gloss-key");
        if (!key) return;
        const tex = glossary[key];
        if (!tex) return;

        const cursor = (typeof e.clientX === "number" && typeof e.clientY === "number")
            ? { clientX: e.clientX, clientY: e.clientY }
            : null;
        const anchorRect = target.getBoundingClientRect();

        // prepare popup HTML
        let popupHTML = "";
        if (window && window.katex && typeof window.katex.renderToString === "function") {
            try {
                popupHTML = window.katex.renderToString(tex, { displayMode: false, throwOnError: false });
            } catch (err) {
                popupHTML = `<span>$${escapeHtml(tex)}$</span>`;
            }
        } else {
            popupHTML = `<span style="white-space:pre-wrap;">$${escapeHtml(tex)}$</span>`;
        }

        // set intentVisible + mounted + measuring: mount hidden offscreen to measure
        setPopup({
            intentVisible: true,
            mounted: true,
            measuring: true,
            html: popupHTML,
            left: -9999,
            top: -9999,
            maxWidth: popupMaxWidth,
            anchorRect,
            cursor,
            offsetCss: popupOffset,
        });
    }

    function onTargetLeave() {
        hideTimeout = setTimeout(() => {
            // hide gracefully: mark intentVisible false so CSS transition fades out
            setPopup((p) => ({ ...p, intentVisible: false }));
            // after a short delay unmount
            setTimeout(() => {
                setPopup((p) => ({ ...p, mounted: false, measuring: false }));
            }, 260); // allow fade duration to complete
            hideTimeout = null;
        }, 120);
    }

    function onTargetTouch(e) {
        e.preventDefault();
        const t = e.currentTarget;
        const isVisibleForThis = popup.intentVisible && popupRef.current && popupRef.current.contains(e.target);
        if (isVisibleForThis) {
            setPopup((p) => ({ ...p, intentVisible: false }));
            setTimeout(() => { setPopup((p) => ({ ...p, mounted: false, measuring: false })); }, 260);
        } else {
            onTargetEnter({ currentTarget: t, clientX: null, clientY: null });
        }
    }

    function onTargetKeyDown(e) {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onTargetEnter({ currentTarget: e.currentTarget, clientX: null, clientY: null });
        } else if (e.key === "Escape") {
            setPopup((p) => ({ ...p, intentVisible: false }));
            setTimeout(() => { setPopup((p) => ({ ...p, mounted: false, measuring: false })); }, 260);
        }
    }

    // keep popup open while hovering it
    useEffect(() => {
        if (!popup.mounted) return;
        const el = popupRef.current;
        if (!el) return;
        function keep() { if (hideTimeout) { clearTimeout(hideTimeout); hideTimeout = null; } }
        function scheduleHide() {
            hideTimeout = setTimeout(() => {
                setPopup((p) => ({ ...p, intentVisible: false }));
                setTimeout(() => { setPopup((p) => ({ ...p, mounted: false, measuring: false })); }, 260);
                hideTimeout = null;
            }, 120);
        }
        el.addEventListener("mouseenter", keep);
        el.addEventListener("mouseleave", scheduleHide);
        return () => {
            el.removeEventListener("mouseenter", keep);
            el.removeEventListener("mouseleave", scheduleHide);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [popup.mounted]);

    // After the popup mounts (hidden), measure & position, then reveal with animation
    useEffect(() => {
        if (!popup.mounted || !popup.measuring) return;
        requestAnimationFrame(() => {
            const el = popupRef.current;
            if (!el) return;
            // convert offset to px
            const offsetPx = cssToPixels(popup.offsetCss || popupOffset) || 0;
            // let content size up to maxWidth
            el.style.maxWidth = `${popup.maxWidth}px`;
            el.style.width = "auto";
            const rect = el.getBoundingClientRect();
            const popupW = rect.width;
            const popupH = rect.height;

            // compute desired horizontal center using cursor if available
            let desiredCenterX;
            if (popup.cursor && typeof popup.cursor.clientX === "number") {
                desiredCenterX = popup.cursor.clientX + window.scrollX;
            } else if (popup.anchorRect) {
                desiredCenterX = popup.anchorRect.left + window.scrollX + popup.anchorRect.width / 2;
            } else {
                desiredCenterX = window.scrollX + window.innerWidth / 2;
            }
            let left = desiredCenterX - popupW / 2;
            const minLeft = window.scrollX + 8;
            const maxLeft = window.scrollX + window.innerWidth - popupW - 8;
            if (left < minLeft) left = minLeft;
            if (left > maxLeft) left = maxLeft;

            // vertical: prefer above pointer/anchor by offsetPx
            let top;
            if (popup.cursor && typeof popup.cursor.clientY === "number") {
                top = popup.cursor.clientY + window.scrollY - offsetPx - popupH;
            } else if (popup.anchorRect) {
                top = popup.anchorRect.top + window.scrollY - offsetPx - popupH;
            } else {
                top = window.scrollY + 8;
            }
            const minTop = window.scrollY + 8;
            if (top < minTop && popup.anchorRect) {
                // place below anchor with same offset
                top = popup.anchorRect.bottom + window.scrollY + offsetPx;
            }
            const maxTop = window.scrollY + window.innerHeight - popupH - 8;
            if (top > maxTop) top = maxTop;

            // update state: done measuring and positioned
            setPopup((p) => ({
                ...p,
                left,
                top,
                measuring: false,
            }));
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [popup.mounted, popup.measuring, popup.html, popup.cursor, popup.anchorRect]);

    // render
    return (
        <div style={{ ...style }}>
            <div className={`math-with-glossary ${className}`} ref={containerRef} style={{ display: "inline" }} />
            {popup.mounted &&
                ReactDOM.createPortal(
                    <div
                        ref={popupRef}
                        className={`gloss-popup ${popup.intentVisible && !popup.measuring ? "gloss-visible" : "gloss-hidden"}`}
                        role="dialog"
                        aria-modal="false"
                        style={{
                            position: "absolute",
                            top: popup.measuring ? -9999 : popup.top,
                            left: popup.measuring ? -9999 : popup.left,
                            zIndex: 9999,
                            boxShadow: "0 10px 34px rgba(0,0,0,0.14)",
                            borderRadius: 8,
                            background: "var(--gloss-bg, white)",
                            padding: "8px 10px",
                            fontSize: popupFontSize,
                            maxWidth: `${popup.maxWidth}px`,
                            whiteSpace: "normal",
                            display: "inline-block",
                            lineHeight: 1.25,
                            pointerEvents: popup.measuring ? "none" : "auto",
                        }}
                        dangerouslySetInnerHTML={{ __html: popup.html }}
                    />,
                    document.body
                )}
            <style>{`
        .gloss-target{
            z-index: 99;
            position: relative;
        }
        .math-with-glossary .gloss-target {
          text-decoration: underline dotted rgba(0,0,0,0.06);
          cursor: pointer;
          padding: 20px 2px;
          border-radius: 2px;
          display: inline;
        }
        .math-with-glossary .gloss-target:hover {
          text-decoration-color: rgba(0,0,0,0.12);
        }
        .math-with-glossary .gloss-target:focus {
          outline: 2px solid rgba(0,0,0,0.06);
          outline-offset: 2px;
        }

        /* Popup hidden/measuring: don't paint and no pointer events */
        .gloss-popup.gloss-hidden {
          visibility: hidden;
          opacity: 0;
          transform: translateY(6px) scale(0.985);
          transition: none;
        }

        /* Popup visible: fade+scale in */
        .gloss-popup.gloss-visible {
          visibility: visible;
          opacity: 1;
          transform: translateY(0) scale(1);
          transition: opacity 180ms ease, transform 180ms ease;
        }

        /* KaTeX inside popup sizing */
        .gloss-popup .katex { font-size: 1em; }
      `}</style>
        </div>
    );
}

// helper
function escapeHtml(str) {
    return (str + "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}
