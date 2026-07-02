import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router";
import { useNavigate, Link, Routes, Route } from "react-router-dom";
import { useState, useEffect, useRef, useCallback } from "react";
function CookieBanner() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!localStorage.getItem("cookie_consent")) setVisible(true);
  }, []);
  const respond = (choice) => {
    localStorage.setItem("cookie_consent", choice);
    setVisible(false);
  };
  if (!visible) return null;
  return /* @__PURE__ */ jsxs("div", { style: {
    position: "fixed",
    bottom: 24,
    left: "50%",
    transform: "translateX(-50%)",
    zIndex: 99999,
    width: "calc(100% - 48px)",
    maxWidth: 620,
    background: "#0f172a",
    borderRadius: 16,
    padding: "16px 20px",
    display: "flex",
    alignItems: "center",
    gap: 16,
    boxShadow: "0 8px 40px rgba(0,0,0,0.35)",
    flexWrap: "wrap"
  }, children: [
    /* @__PURE__ */ jsx("span", { style: { fontSize: 20 }, children: "🍪" }),
    /* @__PURE__ */ jsxs("p", { style: { flex: 1, fontSize: 13, color: "#cbd5e1", lineHeight: 1.5, margin: 0, minWidth: 200 }, children: [
      "Nous utilisons des cookies fonctionnels et d'analyse anonymisée.",
      " ",
      /* @__PURE__ */ jsx("a", { href: "/cookies", style: { color: "#60a5fa", textDecoration: "underline" }, children: "En savoir plus" })
    ] }),
    /* @__PURE__ */ jsxs("div", { style: { display: "flex", gap: 8, flexShrink: 0 }, children: [
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: () => respond("refused"),
          style: {
            padding: "8px 16px",
            borderRadius: 8,
            border: "1px solid #334155",
            background: "transparent",
            color: "#94a3b8",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "inherit"
          },
          children: "Refuser"
        }
      ),
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: () => respond("accepted"),
          style: {
            padding: "8px 16px",
            borderRadius: 8,
            border: "none",
            background: "linear-gradient(135deg, #1E3A5F, #2D5A8A)",
            color: "#fff",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "inherit"
          },
          children: "Accepter"
        }
      )
    ] })
  ] });
}
const logoDemoUrl = "/assets/logo.demo-Bmgs7kXW.png";
const sC = (s) => s >= 85 ? { c1: "#10b981", soft: "#34d399" } : s >= 80 ? { c1: "#34d399", soft: "#6ee7b7" } : s >= 65 ? { c1: "#ca8a04", soft: "#fde047" } : s >= 50 ? { c1: "#f97316", soft: "#fb923c" } : { c1: "#ef4444", soft: "#f87171" };
function ScoreRingMini({ score, size = 88 }) {
  const c = sC(score);
  const r = (size - 10) / 2, cx = size / 2;
  const circ = 2 * Math.PI * r;
  const arcRef = useRef(null);
  const numRef = useRef(null);
  const visibleRef = useRef(false);
  const rafRef = useRef(null);
  const scoreRef = useRef(score);
  scoreRef.current = score;
  const playAnim = (sc) => {
    cancelAnimationFrame(rafRef.current);
    const circ_ = 2 * Math.PI * ((size - 10) / 2);
    const dur = 900, t0 = performance.now();
    const step = (t) => {
      const p = Math.min(1, (t - t0) / dur);
      const ease = 1 - Math.pow(1 - p, 3);
      const val = Math.round(ease * sc);
      if (numRef.current) numRef.current.textContent = val;
      if (arcRef.current) arcRef.current.style.strokeDashoffset = circ_ * (1 - val / 100);
      if (p < 1) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
  };
  useEffect(() => {
    var _a;
    const el = (_a = arcRef.current) == null ? void 0 : _a.closest(".feature-mock-card");
    const io = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      visibleRef.current = true;
      io.disconnect();
      playAnim(scoreRef.current);
    }, { threshold: 0.3 });
    if (el) io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(rafRef.current);
    };
  }, [size]);
  useEffect(() => {
    if (!visibleRef.current) return;
    playAnim(score);
    return () => cancelAnimationFrame(rafRef.current);
  }, [score]);
  return /* @__PURE__ */ jsxs("div", { style: { display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }, children: [
    /* @__PURE__ */ jsxs("div", { style: { position: "relative", width: size, height: size }, children: [
      /* @__PURE__ */ jsx("div", { style: { position: "absolute", inset: -4, background: `radial-gradient(circle at 30% 30%,${c.c1}35 0%,transparent 60%)`, filter: "blur(10px)", pointerEvents: "none" } }),
      /* @__PURE__ */ jsxs("svg", { width: size, height: size, style: { position: "relative", display: "block", transform: "rotate(-90deg)" }, children: [
        /* @__PURE__ */ jsx("defs", { children: /* @__PURE__ */ jsxs("linearGradient", { id: `sg-m-${score}`, x1: "0%", y1: "0%", x2: "100%", y2: "100%", children: [
          /* @__PURE__ */ jsx("stop", { offset: "0%", stopColor: c.c1 }),
          /* @__PURE__ */ jsx("stop", { offset: "100%", stopColor: c.soft })
        ] }) }),
        /* @__PURE__ */ jsx("circle", { cx, cy: cx, r, fill: "none", stroke: "rgba(241,245,249,0.8)", strokeWidth: 8 }),
        /* @__PURE__ */ jsx(
          "circle",
          {
            ref: arcRef,
            cx,
            cy: cx,
            r,
            fill: "none",
            stroke: `url(#sg-m-${score})`,
            strokeWidth: 8,
            strokeLinecap: "round",
            strokeDasharray: circ,
            strokeDashoffset: circ,
            style: { filter: `drop-shadow(0 2px 6px ${c.c1}60)` }
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { style: { position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }, children: [
        /* @__PURE__ */ jsx("span", { ref: numRef, style: { fontSize: Math.round(size * 0.32), fontWeight: 900, color: c.c1, lineHeight: 1, fontVariantNumeric: "tabular-nums" }, children: "0" }),
        /* @__PURE__ */ jsx("span", { style: { fontSize: 9, fontWeight: 600, color: "#cbd5e1" }, children: "/ 100" })
      ] })
    ] }),
    /* @__PURE__ */ jsx("span", { style: { fontSize: 9, fontWeight: 700, color: c.c1, letterSpacing: "0.04em" }, children: "Score IA" })
  ] });
}
function GemBadgeMini({ score, ville, prix, surface, selected, photo, onClick }) {
  const c = sC(score);
  const fmtPrix = (v) => v ? new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(v) : "—";
  return /* @__PURE__ */ jsxs(
    "div",
    {
      onClick,
      style: {
        display: "flex",
        alignItems: "center",
        gap: 7,
        padding: "6px 8px",
        borderRadius: 11,
        background: selected ? `${c.c1}12` : "#f8fafc",
        border: `1.5px solid ${selected ? c.c1 : "#edf1f7"}`,
        transition: "all 0.18s",
        cursor: "pointer",
        boxShadow: selected ? `0 2px 10px ${c.c1}28` : "none",
        transform: selected ? "translateX(2px)" : "none"
      },
      children: [
        /* @__PURE__ */ jsxs("div", { style: { width: 38, height: 36, borderRadius: 7, overflow: "hidden", flexShrink: 0, position: "relative" }, children: [
          photo ? /* @__PURE__ */ jsx("img", { src: photo, alt: ville, style: { width: "100%", height: "100%", objectFit: "cover", display: "block" } }) : /* @__PURE__ */ jsx("div", { style: { width: "100%", height: "100%", background: `linear-gradient(135deg,${c.c1}25,${c.soft}10)` } }),
          /* @__PURE__ */ jsx("div", { style: { position: "absolute", top: 2, right: 2, background: `linear-gradient(135deg,${c.c1},${c.soft})`, color: "#fff", fontSize: 8, fontWeight: 800, padding: "1px 3px", borderRadius: 9999, lineHeight: 1.2 }, children: score })
        ] }),
        /* @__PURE__ */ jsxs("div", { style: { flex: 1, minWidth: 0 }, children: [
          /* @__PURE__ */ jsx("div", { style: { fontSize: 11, fontWeight: 700, color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }, children: ville }),
          /* @__PURE__ */ jsxs("div", { style: { fontSize: 10, color: "#64748b" }, children: [
            fmtPrix(prix),
            surface ? ` · ${surface}m²` : ""
          ] })
        ] })
      ]
    }
  );
}
function MatchingMock() {
  const fmtPrix = (v) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(v);
  const biens = [
    {
      score: 88,
      ville: "Agay",
      prix: 45e4,
      surface: 120,
      pieces: 4,
      type: "Maison/villa",
      photo: "https://groupementprimmo.staticlbi.com/wa/images/biens/7/99c18db26bdddf8af44b50d7e4634c99/photo_baea1dab07b245ccd532c47b45d3afff.jpg",
      forts: ["Localisation exacte : secteur Agay calme, critère principal respecté", "Budget dans la cible — 450 k€ = plafond, marge de négociation réelle", "Plain-pied confirmé en description, critère explicitement demandé"],
      atts: ["Cuisine équipée non renseignée sur la fiche — à confirmer à la visite"],
      postit: "Proposer en premier rendez-vous en soulignant la correspondance exacte localisation + plain-pied + budget — c'est le bien à ne pas manquer."
    },
    {
      score: 81,
      ville: "Fréjus",
      prix: 42e4,
      surface: 95,
      pieces: 3,
      type: "Maison/villa",
      photo: "https://groupementprimmo.staticlbi.com/wa/images/biens/12/a250fab4a2c4b0dd44e7fbccc62d16de/photo_48347d1adc58ea2976500be9ddf894f5.jpg",
      forts: ["Prix 30 000 € sous le budget max — position solide en négociation", "Garage double + jardin clos, critères demandés, confirmés en description", "Quartier calme, école et commerces à moins de 400 m"],
      atts: ["Surface légèrement en dessous de l'idéal (95 m² vs 120 m² souhaités)"],
      postit: "Proposer en insistant sur les 30 000 € de marge et le garage double, mais préparer le client au compromis sur la surface (95 m² vs 120 m² souhaités)."
    },
    {
      score: 73,
      ville: "Bagnols",
      prix: 435e3,
      surface: 130,
      pieces: 5,
      type: "Maison/villa",
      photo: "https://groupementprimmo.staticlbi.com/wa/images/biens/10/b65839405141bda0d653bed097312829/photo_efdd4482865e6f34cc296cef5f960855.jpg",
      forts: ["Grande surface (130 m²), idéale si la famille s'agrandit", "Piscine privée et terrasse avec vue Estérel confirmées en description", "Calme absolu, fin de chemin, aucun vis-à-vis"],
      atts: ["Hors secteur demandé — Bagnols vs Agay/Fréjus, 30 min de route", "Budget dépassé de ~7 % — prévoir négociation"],
      postit: "Vérifier si le client accepte de s'éloigner du secteur demandé — si oui, mettre en avant la grande surface et la piscine pour justifier les 7 % au-dessus du budget."
    }
  ];
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [panelVisible, setPanelVisible] = useState(true);
  const handleSelect = (i) => {
    if (i === selectedIdx) return;
    setPanelVisible(false);
    setTimeout(() => {
      setSelectedIdx(i);
      setPanelVisible(true);
    }, 140);
  };
  const bien = biens[selectedIdx];
  return /* @__PURE__ */ jsxs("div", { style: { fontFamily: "Inter, sans-serif", background: "#f0f9ff", minHeight: "100%", display: "flex", flexDirection: "column" }, children: [
    /* @__PURE__ */ jsxs("div", { style: { padding: "10px 13px", borderBottom: "1px solid #e0f2fe", background: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }, children: [
      /* @__PURE__ */ jsx("span", { style: { fontWeight: 700, fontSize: 13, color: "#0f172a" }, children: "Matchings" }),
      /* @__PURE__ */ jsx("div", { style: { background: "linear-gradient(135deg,#38bdf8,#6366f1)", color: "#fff", borderRadius: 7, padding: "4px 8px", fontSize: 9, fontWeight: 700 }, children: "✦ Analyse global" })
    ] }),
    /* @__PURE__ */ jsxs("div", { style: { padding: "6px 9px", display: "flex", gap: 5, borderBottom: "1px solid #e0f2fe", background: "rgba(255,255,255,0.65)", backdropFilter: "blur(8px)", alignItems: "center", flexShrink: 0 }, children: [
      /* @__PURE__ */ jsxs("span", { style: { padding: "2px 8px", borderRadius: 10, fontSize: 9, fontWeight: 600, background: "#059669", color: "#fff", display: "flex", alignItems: "center", gap: 3 }, children: [
        /* @__PURE__ */ jsx("span", { style: { width: 4, height: 4, borderRadius: "50%", background: "rgba(255,255,255,.7)", display: "inline-block" } }),
        "Nouveaux"
      ] }),
      /* @__PURE__ */ jsx("div", { style: { display: "flex", background: "rgba(255,255,255,0.8)", borderRadius: 8, border: "1px solid rgba(0,0,0,0.07)", overflow: "hidden" }, children: ["Tous", "≥ 65", "≥ 80"].map((t, i) => /* @__PURE__ */ jsx("span", { style: { padding: "2px 7px", fontSize: 9, fontWeight: 600, background: i === 0 ? "#38bdf8" : "transparent", color: i === 0 ? "#fff" : "#94a3b8" }, children: t }, t)) }),
      /* @__PURE__ */ jsx("div", { style: { marginLeft: "auto", display: "flex", background: "rgba(255,255,255,0.8)", borderRadius: 8, border: "1px solid rgba(0,0,0,0.07)", overflow: "hidden" }, children: ["Récents", "Score", "A→Z"].map((t, i) => /* @__PURE__ */ jsx("span", { style: { padding: "2px 7px", fontSize: 9, fontWeight: 600, background: i === 0 ? "#38bdf8" : "transparent", color: i === 0 ? "#fff" : "#94a3b8" }, children: t }, t)) })
    ] }),
    /* @__PURE__ */ jsx("div", { style: { padding: "8px 8px", flex: 1 }, children: /* @__PURE__ */ jsxs("div", { className: "matching-row", style: { background: "#fff", borderRadius: 14, border: "1px solid #edf1f7", overflow: "hidden", boxShadow: "0 4px 14px rgba(56,189,248,0.08)", animationDelay: "200ms" }, children: [
      /* @__PURE__ */ jsxs("div", { style: { display: "grid", gridTemplateColumns: "1.1fr 82px 1.1fr" }, children: [
        /* @__PURE__ */ jsxs("div", { style: { padding: "12px 10px", borderRight: "1px solid #f3f4f6", display: "flex", flexDirection: "column", gap: 7, justifyContent: "center" }, children: [
          /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: 7 }, children: [
            /* @__PURE__ */ jsx("div", { style: { width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#38bdf8,#6366f1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 10, flexShrink: 0 }, children: "MD" }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("div", { style: { fontSize: 11, fontWeight: 700, color: "#0f172a" }, children: "Mathis Duverger" }),
              /* @__PURE__ */ jsxs("div", { style: { fontSize: 9, color: "#64748b", display: "flex", alignItems: "center", gap: 4 }, children: [
                /* @__PURE__ */ jsx("span", { style: { width: 4, height: 4, borderRadius: "50%", background: "#10b981", display: "inline-block" } }),
                "Actif · 3 matchs"
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { style: { padding: "6px 8px", background: "#f8fafc", borderRadius: 8, border: "1px solid #edf1f7", fontSize: 10, color: "#0f172a" }, children: [
            /* @__PURE__ */ jsx("div", { style: { fontSize: 8, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700, marginBottom: 2 }, children: "Cherche" }),
            /* @__PURE__ */ jsx("span", { style: { fontWeight: 700 }, children: "Maison/villa" }),
            " à ",
            /* @__PURE__ */ jsx("span", { style: { fontWeight: 700 }, children: "Agay" })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("div", { style: { fontSize: 8, color: "#94a3b8", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.1em" }, children: "Budget" }),
            /* @__PURE__ */ jsx("div", { style: { fontSize: 13, fontWeight: 800, color: "#0f172a" }, children: fmtPrix(45e4) })
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { style: { display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(180deg,#fbfcfe,#f8fafc)", borderRight: "1px solid #f3f4f6" }, children: /* @__PURE__ */ jsx(ScoreRingMini, { score: bien.score, size: 68 }) }),
        /* @__PURE__ */ jsx("div", { style: { padding: "8px", display: "flex", flexDirection: "column", gap: 4, justifyContent: "center" }, children: biens.map((b, i) => /* @__PURE__ */ jsx(GemBadgeMini, { score: b.score, ville: b.ville, prix: b.prix, surface: b.surface, photo: b.photo, selected: i === selectedIdx, onClick: () => handleSelect(i) }, i)) })
      ] }),
      /* @__PURE__ */ jsxs("div", { style: { borderTop: "1px solid #e5e7eb", opacity: panelVisible ? 1 : 0, transition: "opacity 0.14s ease" }, children: [
        /* @__PURE__ */ jsxs("div", { style: { position: "relative", minHeight: 160, background: `linear-gradient(135deg,rgba(15,23,42,.84) 0%,rgba(15,23,42,.58) 100%),url(${bien.photo}) center/cover no-repeat`, padding: "14px 16px" }, children: [
          /* @__PURE__ */ jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }, children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("div", { style: { fontSize: 13, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em" }, children: bien.type }),
              /* @__PURE__ */ jsxs("div", { style: { fontSize: 10, color: "rgba(255,255,255,.65)", marginTop: 2, display: "flex", gap: 5 }, children: [
                /* @__PURE__ */ jsxs("span", { children: [
                  "📍 ",
                  bien.ville
                ] }),
                /* @__PURE__ */ jsx("span", { style: { opacity: 0.4 }, children: "·" }),
                /* @__PURE__ */ jsxs("span", { children: [
                  bien.surface,
                  " m²"
                ] }),
                /* @__PURE__ */ jsx("span", { style: { opacity: 0.4 }, children: "·" }),
                /* @__PURE__ */ jsxs("span", { children: [
                  bien.pieces,
                  " pièces"
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsx("div", { style: { fontSize: 15, fontWeight: 800, color: "#fff", letterSpacing: "-0.03em" }, children: fmtPrix(bien.prix) })
          ] }),
          /* @__PURE__ */ jsxs("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }, children: [
            /* @__PURE__ */ jsxs("div", { style: { display: "flex", flexDirection: "column", gap: 8 }, children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: 4, marginBottom: 5 }, children: [
                  /* @__PURE__ */ jsx("svg", { width: "9", height: "9", viewBox: "0 0 24 24", fill: "#86efac", children: /* @__PURE__ */ jsx("polygon", { points: "13 2 3 14 12 14 11 22 21 10 12 10 13 2" }) }),
                  /* @__PURE__ */ jsx("span", { style: { fontSize: 8, fontWeight: 700, color: "#86efac", textTransform: "uppercase", letterSpacing: ".1em" }, children: "Points forts" })
                ] }),
                bien.forts.map((f, i) => /* @__PURE__ */ jsxs("div", { style: { display: "flex", gap: 5, marginBottom: 3, fontSize: 9, color: "rgba(255,255,255,.88)", lineHeight: 1.4 }, children: [
                  /* @__PURE__ */ jsx("span", { style: { color: "#34d399", flexShrink: 0 }, children: "•" }),
                  /* @__PURE__ */ jsx("span", { children: f })
                ] }, i))
              ] }),
              bien.atts.length > 0 && /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: 4, marginBottom: 5 }, children: [
                  /* @__PURE__ */ jsx("svg", { width: "9", height: "9", viewBox: "0 0 24 24", fill: "#fcd34d", children: /* @__PURE__ */ jsx("path", { d: "M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" }) }),
                  /* @__PURE__ */ jsx("span", { style: { fontSize: 8, fontWeight: 700, color: "#fcd34d", textTransform: "uppercase", letterSpacing: ".1em" }, children: "Attention" })
                ] }),
                bien.atts.map((a, i) => /* @__PURE__ */ jsxs("div", { style: { display: "flex", gap: 5, marginBottom: 3, fontSize: 9, color: "rgba(255,255,255,.88)", lineHeight: 1.4 }, children: [
                  /* @__PURE__ */ jsx("span", { style: { color: "#fbbf24", flexShrink: 0 }, children: "•" }),
                  /* @__PURE__ */ jsx("span", { children: a })
                ] }, i))
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { style: { background: "linear-gradient(160deg,#fef9c3,#fde68a)", borderRadius: 4, padding: "8px 10px", transform: "rotate(-1deg)", boxShadow: "0 6px 18px rgba(0,0,0,.28)", position: "relative", alignSelf: "flex-start" }, children: [
              /* @__PURE__ */ jsx("div", { style: { position: "absolute", top: -6, left: "50%", transform: "translateX(-50%)", width: 40, height: 10, background: "rgba(255,255,255,.55)", borderRadius: 2 } }),
              /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: 4, marginBottom: 5 }, children: [
                /* @__PURE__ */ jsx("span", { style: { fontSize: 11 }, children: "📝" }),
                /* @__PURE__ */ jsx("span", { style: { fontSize: 8, fontWeight: 700, color: "#92400e", textTransform: "uppercase", letterSpacing: ".1em" }, children: "Recommandation" })
              ] }),
              /* @__PURE__ */ jsx("p", { style: { fontSize: 13, color: "#78350f", lineHeight: 1.45, margin: 0, fontFamily: '"Caveat", cursive', fontWeight: 500 }, children: bien.postit })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", background: "#fbfcfe", borderTop: "1px solid #f1f5f9" }, children: [
          /* @__PURE__ */ jsxs(
            "div",
            {
              style: { display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", borderRadius: 8, background: "#fff", border: "1px solid #e8eef5", fontSize: 11, fontWeight: 600, color: "#94a3b8", cursor: "pointer", transition: "all 0.18s" },
              onMouseEnter: (e) => {
                e.currentTarget.style.background = "#fef2f2";
                e.currentTarget.style.borderColor = "#fecaca";
                e.currentTarget.style.color = "#dc2626";
              },
              onMouseLeave: (e) => {
                e.currentTarget.style.background = "#fff";
                e.currentTarget.style.borderColor = "#e8eef5";
                e.currentTarget.style.color = "#94a3b8";
              },
              children: [
                /* @__PURE__ */ jsxs("svg", { width: "11", height: "11", viewBox: "0 0 24 24", fill: "none", children: [
                  /* @__PURE__ */ jsx("circle", { cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "2" }),
                  /* @__PURE__ */ jsx("line", { x1: "15", y1: "9", x2: "9", y2: "15", stroke: "currentColor", strokeWidth: "2" }),
                  /* @__PURE__ */ jsx("line", { x1: "9", y1: "9", x2: "15", y2: "15", stroke: "currentColor", strokeWidth: "2" })
                ] }),
                "Refuser"
              ]
            }
          ),
          /* @__PURE__ */ jsxs("div", { style: { marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }, children: [
            /* @__PURE__ */ jsx("span", { style: { fontSize: 10, color: "#94a3b8" }, children: "1 bien sélectionné" }),
            /* @__PURE__ */ jsxs(
              "div",
              {
                onClick: () => {
                  var _a;
                  return (_a = document.getElementById("feat-email")) == null ? void 0 : _a.scrollIntoView({ behavior: "smooth", block: "center" });
                },
                style: { display: "flex", alignItems: "center", gap: 6, padding: "7px 16px", borderRadius: 9, background: "linear-gradient(135deg,#38bdf8,#6366f1)", color: "#fff", fontSize: 11, fontWeight: 700, boxShadow: "0 4px 12px rgba(56,189,248,.35)", cursor: "pointer", transition: "transform 0.18s, box-shadow 0.18s" },
                onMouseEnter: (e) => {
                  e.currentTarget.style.transform = "translateY(-1px)";
                  e.currentTarget.style.boxShadow = "0 6px 18px rgba(56,189,248,.45)";
                },
                onMouseLeave: (e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(56,189,248,.35)";
                },
                children: [
                  /* @__PURE__ */ jsx("svg", { width: "12", height: "12", viewBox: "0 0 24 24", fill: "none", children: /* @__PURE__ */ jsx("path", { d: "M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }) }),
                  "Envoyer la sélection →"
                ]
              }
            )
          ] })
        ] })
      ] })
    ] }) })
  ] });
}
function BotFace({ size = 28 }) {
  const eyeW = Math.max(Math.round(size * 0.14), 3);
  const eyeH = Math.max(Math.round(size * 0.27), 7);
  const gap = Math.max(Math.round(size * 0.11), 3);
  return /* @__PURE__ */ jsxs("div", { style: {
    width: size,
    height: size,
    flexShrink: 0,
    borderRadius: size <= 30 ? "50%" : Math.round(size * 0.22),
    position: "relative",
    overflow: "hidden",
    background: "linear-gradient(135deg, #9147ff 0%, #05c8e8 55%, #ec4899 100%)",
    boxShadow: "0 2px 10px rgba(145,71,255,.35)"
  }, children: [
    /* @__PURE__ */ jsx("div", { style: { position: "absolute", inset: 0, background: "rgba(255,255,255,0.10)" } }),
    /* @__PURE__ */ jsxs("div", { style: {
      position: "absolute",
      left: "50%",
      top: "50%",
      transform: "translate(-50%, -50%)",
      display: "flex",
      alignItems: "center",
      gap
    }, children: [
      /* @__PURE__ */ jsx("div", { className: "bot-eye", style: { width: eyeW, height: eyeH, background: "#fff", borderRadius: eyeW * 2, boxShadow: "0 1px 4px rgba(0,0,0,.2)" } }),
      /* @__PURE__ */ jsx("div", { className: "bot-eye", style: { width: eyeW, height: eyeH, background: "#fff", borderRadius: eyeW * 2, boxShadow: "0 1px 4px rgba(0,0,0,.2)", animationDelay: ".3s" } })
    ] })
  ] });
}
function UserAvatar() {
  return /* @__PURE__ */ jsx(
    "img",
    {
      src: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=56&h=56&fit=crop&crop=face",
      alt: "avatar",
      style: { width: 28, height: 28, borderRadius: "50%", flexShrink: 0, objectFit: "cover", display: "block" }
    }
  );
}
function TypingDots() {
  return /* @__PURE__ */ jsxs("div", { style: { display: "flex", gap: 8, flexDirection: "row" }, children: [
    /* @__PURE__ */ jsx(BotFace, { size: 28 }),
    /* @__PURE__ */ jsx("div", { style: { background: "#fff", border: "1px solid #e2e8f0", borderRadius: "4px 14px 14px 14px", padding: "10px 14px", display: "flex", gap: 5, alignItems: "center" }, children: [0, 1, 2].map((i) => /* @__PURE__ */ jsx("span", { className: "chat-dot", style: { width: 6, height: 6, borderRadius: "50%", background: "#94a3b8", display: "block", animationDelay: `${i * 0.18}s` } }, i)) })
  ] });
}
function ChatMock() {
  const wrapRef = useRef(null);
  const msgsRef = useRef(null);
  const [phase, setPhase] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [input, setInput] = useState("");
  const [extraMsgs, setExtraMsgs] = useState([]);
  const [easterTyping, setEasterTyping] = useState(false);
  const LINK = /* @__PURE__ */ jsx("a", { href: "#pricing", style: { display: "block", marginTop: 8, padding: "5px 14px", borderRadius: 20, background: "linear-gradient(135deg,#4f46e5,#7c3aed)", color: "#fff", fontSize: 11, fontWeight: 600, textDecoration: "none", width: "fit-content" }, children: "Voir les tarifs" });
  const EASTER_REPLIES = [
    /* @__PURE__ */ jsxs("span", { children: [
      "T'es curieux toi 😄 Mes vraies réponses sont réservées aux agents abonnés.",
      LINK
    ] }),
    /* @__PURE__ */ jsxs("span", { children: [
      "Belle tentative 👀 Mais je suis réservé aux abonnés ImmoFlash.",
      LINK
    ] }),
    /* @__PURE__ */ jsxs("span", { children: [
      "Chut… je parle uniquement à mes abonnés 🤫",
      LINK
    ] }),
    /* @__PURE__ */ jsxs("span", { children: [
      "Bonne question ! Mais je ne réponds qu'aux abonnés 😉",
      LINK
    ] })
  ];
  const handleSend = () => {
    const txt = input.trim();
    if (!txt) return;
    setInput("");
    setExtraMsgs((prev) => [...prev, { r: "user", t: txt }]);
    setEasterTyping(true);
    setTimeout(() => {
      setEasterTyping(false);
      const reply = EASTER_REPLIES[Math.floor(Math.random() * EASTER_REPLIES.length)];
      setExtraMsgs((prev) => [...prev, { r: "bot", t: reply }]);
    }, 1200);
  };
  const MSGS = [
    { r: "bot", t: "Bonjour ! Comment puis-je vous aider ?" },
    { r: "user", t: "J'ai rentré un T3 à 245 000 € ce matin — qui dans mes prospects pourrait être intéressé ?" },
    { r: "bot", t: "3 prospects correspondent à ce bien :\n• Marie D. — budget 230–260 k€, cherche T3\n• Paul & Sophie L. — budget 240 k€, secteur centre\n• Ahmed B. — demande active depuis 3 semaines" }
  ];
  const FULL = MSGS[2].t;
  useEffect(() => {
    const el = msgsRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [phase, charCount, extraMsgs, easterTyping]);
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      io.disconnect();
      setTimeout(() => setPhase(1), 700);
      setTimeout(() => setPhase(2), 1800);
      setTimeout(() => setPhase(3), 2700);
      setTimeout(() => setPhase(4), 3500);
      setTimeout(() => {
        setPhase(5);
        let i = 0;
        const iv = setInterval(() => {
          i++;
          setCharCount(i);
          if (i >= FULL.length) clearInterval(iv);
        }, 22);
      }, 4600);
    }, { threshold: 0.4 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const showMsg0 = phase >= 2;
  const showMsg1 = phase >= 3;
  const showTyping = phase === 1 || phase === 4;
  const showMsg2 = phase >= 5;
  const msg2text = phase === 5 ? FULL.slice(0, charCount) : FULL;
  return /* @__PURE__ */ jsxs("div", { ref: wrapRef, style: { fontFamily: "Inter, sans-serif", display: "flex", flexDirection: "column", height: "100%" }, children: [
    /* @__PURE__ */ jsxs("div", { style: { background: "linear-gradient(135deg,#4338ca,#6d28d9)", padding: "13px 16px", display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }, children: [
      /* @__PURE__ */ jsx(BotFace, { size: 38 }),
      /* @__PURE__ */ jsxs("div", { style: { flex: 1 }, children: [
        /* @__PURE__ */ jsx("div", { style: { color: "#fff", fontWeight: 600, fontSize: 14 }, children: "Assistant IA" }),
        /* @__PURE__ */ jsx("div", { style: { color: "rgba(255,255,255,0.6)", fontSize: 11 }, children: "Côte d'Azur Immo" })
      ] }),
      /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: 5 }, children: [
        /* @__PURE__ */ jsx("span", { style: { width: 7, height: 7, borderRadius: "50%", background: "#34d399", boxShadow: "0 0 6px rgba(52,211,153,.7)" } }),
        /* @__PURE__ */ jsx("span", { style: { color: "rgba(255,255,255,0.55)", fontSize: 11 }, children: "En ligne" })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { ref: msgsRef, style: { flex: 1, padding: "16px 14px", display: "flex", flexDirection: "column", gap: 12, background: "linear-gradient(180deg,#f1f5f9,#f8fafc)", overflowY: "auto" }, children: [
      [
        showMsg0 && { ...MSGS[0], key: 0 },
        showMsg1 && { ...MSGS[1], key: 1 }
      ].filter(Boolean).map((msg) => {
        const bot = msg.r === "bot";
        return /* @__PURE__ */ jsxs("div", { className: "chat-msg-in", style: { display: "flex", gap: 8, flexDirection: bot ? "row" : "row-reverse" }, children: [
          bot ? /* @__PURE__ */ jsx(BotFace, { size: 28 }) : /* @__PURE__ */ jsx(UserAvatar, {}),
          /* @__PURE__ */ jsx("div", { style: { maxWidth: "80%", borderRadius: bot ? "4px 14px 14px 14px" : "14px 4px 14px 14px", padding: "8px 12px", fontSize: 12, lineHeight: 1.6, background: bot ? "#fff" : "linear-gradient(135deg,#4f46e5,#6d28d9)", color: bot ? "#1e293b" : "#fff", border: bot ? "1px solid #e2e8f0" : "none", boxShadow: bot ? "0 1px 4px rgba(0,0,0,0.06)" : "none" }, children: msg.t.split("\n").map((line, j) => /* @__PURE__ */ jsx("div", { children: line }, j)) })
        ] }, msg.key);
      }),
      showTyping && /* @__PURE__ */ jsx("div", { className: "chat-msg-in", children: /* @__PURE__ */ jsx(TypingDots, {}) }),
      showMsg2 && /* @__PURE__ */ jsxs("div", { className: "chat-msg-in", style: { display: "flex", gap: 8 }, children: [
        /* @__PURE__ */ jsx(BotFace, { size: 28 }),
        /* @__PURE__ */ jsxs("div", { style: { maxWidth: "80%", borderRadius: "4px 14px 14px 14px", padding: "8px 12px", fontSize: 12, lineHeight: 1.6, background: "#fff", color: "#1e293b", border: "1px solid #e2e8f0", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", minHeight: 36 }, children: [
          msg2text.split("\n").map((line, j) => /* @__PURE__ */ jsx("div", { children: line }, j)),
          charCount < FULL.length && /* @__PURE__ */ jsx("span", { className: "chat-cursor" })
        ] })
      ] }),
      extraMsgs.map((msg, i) => {
        const bot = msg.r === "bot";
        return /* @__PURE__ */ jsxs("div", { className: "chat-msg-in", style: { display: "flex", gap: 8, flexDirection: bot ? "row" : "row-reverse" }, children: [
          bot ? /* @__PURE__ */ jsx(BotFace, { size: 28 }) : /* @__PURE__ */ jsx(UserAvatar, {}),
          /* @__PURE__ */ jsx("div", { style: { maxWidth: "80%", borderRadius: bot ? "4px 14px 14px 14px" : "14px 4px 14px 14px", padding: "8px 12px", fontSize: 12, lineHeight: 1.6, background: bot ? "#fff" : "linear-gradient(135deg,#4f46e5,#6d28d9)", color: bot ? "#1e293b" : "#fff", border: bot ? "1px solid #e2e8f0" : "none" }, children: msg.t })
        ] }, "e" + i);
      }),
      easterTyping && /* @__PURE__ */ jsx("div", { className: "chat-msg-in", children: /* @__PURE__ */ jsx(TypingDots, {}) })
    ] }),
    /* @__PURE__ */ jsxs("div", { style: { padding: "10px 12px 12px", borderTop: "1px solid #e2e8f0", background: "#fff", flexShrink: 0 }, children: [
      /* @__PURE__ */ jsxs("div", { style: { display: "flex", gap: 8, alignItems: "center" }, children: [
        /* @__PURE__ */ jsx(
          "input",
          {
            type: "text",
            value: input,
            onChange: (e) => setInput(e.target.value),
            onKeyDown: (e) => e.key === "Enter" && handleSend(),
            placeholder: "Posez votre question...",
            style: { flex: 1, border: "1.5px solid #e2e8f0", borderRadius: 12, padding: "8px 12px", fontSize: 12, color: "#1e293b", background: "#f8fafc", outline: "none", fontFamily: "Inter, sans-serif" }
          }
        ),
        /* @__PURE__ */ jsx("div", { onClick: handleSend, style: { width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#4f46e5,#7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, cursor: "pointer" }, children: /* @__PURE__ */ jsx("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", children: /* @__PURE__ */ jsx("path", { d: "M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z", stroke: "#fff", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }) }) })
      ] }),
      /* @__PURE__ */ jsx("div", { style: { textAlign: "center", fontSize: 10, color: "#cbd5e1", marginTop: 6 }, children: "Propulsé par Claude AI · Immocompanion" })
    ] })
  ] });
}
const VPS_URL = "/api".replace(/\/+$/, "");
const BIEN_DEMO_URL = `${VPS_URL}/public/bien/saint_francois/20`;
function EmailMock() {
  const COLOR = "#1E3A5F";
  const GRAD = "linear-gradient(135deg, #1E3A5F 0%, #1a4a8a 60%, #1d6fa8 100%)";
  const scrollRef = useRef(null);
  const [annotVisible, setAnnotVisible] = useState(false);
  const [bubbleHover, setBubbleHover] = useState(false);
  const lottieRef = useRef(null);
  useEffect(() => {
    if (lottieRef.current) lottieRef.current.loop = false;
  }, [annotVisible]);
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    let isAutoScrolling = false;
    function smoothScrollTo(target, duration, onDone) {
      const start = el.scrollTop;
      const change = target - start;
      const t0 = performance.now();
      isAutoScrolling = true;
      function step(now) {
        const p = Math.min((now - t0) / duration, 1);
        const ease = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
        el.scrollTop = start + change * ease;
        if (p < 1) requestAnimationFrame(step);
        else {
          isAutoScrolling = false;
          onDone && onDone();
        }
      }
      requestAnimationFrame(step);
    }
    function onUserScroll() {
      if (isAutoScrolling) return;
      setAnnotVisible(false);
    }
    el.addEventListener("scroll", onUserScroll, { passive: true });
    const io = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      io.disconnect();
      setTimeout(() => {
        const isMobile = window.innerWidth < 768;
        const scrollTarget = isMobile ? Math.round((el.scrollHeight - el.clientHeight) * 0.67) : 480;
        smoothScrollTo(scrollTarget, 2200, () => {
          setTimeout(() => setAnnotVisible(true), 300);
        });
      }, 900);
    }, { threshold: 0.4 });
    io.observe(el);
    return () => {
      io.disconnect();
      el.removeEventListener("scroll", onUserScroll);
    };
  }, []);
  const args = [
    "167 m² avec 4 chambres, correspond à votre besoin d'espace",
    "Plain-pied intégral avec suite parentale, critère mentionné",
    "Piscine privée et jardin 700 m², l'extérieur que vous cherchiez"
  ];
  return (
    /* Wrapper relatif — l'annotation sort au-dessus sans être clippée */
    /* @__PURE__ */ jsxs("div", { style: { position: "relative", height: "100%" }, children: [
      annotVisible && /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsx(
          "div",
          {
            className: "email-annotation",
            style: { position: "absolute", bottom: -80, left: 10, zIndex: 21, pointerEvents: "auto", cursor: "default" },
            onMouseEnter: () => setBubbleHover(true),
            onMouseLeave: () => setBubbleHover(false),
            children: /* @__PURE__ */ jsxs("div", { style: {
              background: "#fff",
              borderRadius: 20,
              padding: "8px 16px",
              boxShadow: bubbleHover ? "0 8px 32px rgba(0,0,0,0.22)" : "0 4px 24px rgba(0,0,0,0.13)",
              fontSize: 13,
              fontWeight: 600,
              color: "#0f172a",
              whiteSpace: "nowrap",
              transform: bubbleHover ? "rotate(13deg) scale(1.06)" : "rotate(10deg)",
              transition: "transform 0.25s cubic-bezier(0.22,1,0.36,1), box-shadow 0.25s ease"
            }, children: [
              "Chaque bien a sa page à partager. ",
              /* @__PURE__ */ jsx("span", { style: { textDecoration: "underline", textDecorationColor: "#1E3A5F", textDecorationThickness: "2px", textUnderlineOffset: "3px" }, children: "Même celui-là." })
            ] })
          }
        ),
        /* @__PURE__ */ jsx("div", { className: "email-annotation", style: { position: "absolute", bottom: -60, left: 100, zIndex: 20, pointerEvents: "none" }, children: /* @__PURE__ */ jsx(
          "dotlottie-wc",
          {
            ref: lottieRef,
            src: "https://lottie.host/22a61234-8b4f-4788-915e-9137b050280b/1XOsfAVpEM.lottie",
            autoplay: "true",
            speed: "0.8",
            style: { width: "120px", height: "120px", display: "block", transform: "scaleX(-1) rotate(2deg)" }
          }
        ) })
      ] }),
      /* @__PURE__ */ jsx("div", { ref: scrollRef, style: { fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif", background: "#F3F4F6", padding: "16px 8px", height: "100%", overflowX: "hidden", overflowY: "auto", borderRadius: 12 }, children: /* @__PURE__ */ jsxs("div", { style: { background: "#FFFFFF", borderRadius: 16, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", maxWidth: 540, margin: "0 auto" }, children: [
        /* @__PURE__ */ jsx("div", { style: { padding: "18px 28px 14px", borderBottom: "1px solid #E5E7EB" }, children: /* @__PURE__ */ jsx("img", { src: logoDemoUrl, alt: "Azur Riviera Immobilier", style: { height: 52, width: "auto", display: "block" } }) }),
        /* @__PURE__ */ jsx("div", { style: { background: GRAD, padding: "16px 28px" }, children: /* @__PURE__ */ jsx("p", { style: { margin: 0, color: "#FFFFFF", fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "1.5px" }, children: "Sélectionné pour vous" }) }),
        /* @__PURE__ */ jsxs("div", { style: { padding: "24px 28px 18px" }, children: [
          /* @__PURE__ */ jsx("p", { style: { margin: "0 0 12px", fontSize: 14, lineHeight: 1.6, color: "#374151" }, children: "Bonjour M./Mme BLATI," }),
          /* @__PURE__ */ jsx("p", { style: { margin: 0, fontSize: 14, lineHeight: 1.6, color: "#374151" }, children: "Suite à notre échange, j'ai identifié un bien qui pourrait vous intéresser. Voici pourquoi je pense qu'il mérite votre attention." })
        ] }),
        /* @__PURE__ */ jsx("div", { style: { margin: "0 28px 18px" }, children: /* @__PURE__ */ jsxs("div", { style: { border: "1px solid #E5E7EB", borderRadius: 12, overflow: "hidden" }, children: [
          /* @__PURE__ */ jsx("div", { style: { background: GRAD, padding: "14px 20px" }, children: /* @__PURE__ */ jsx("p", { style: { margin: 0, color: "#FFFFFF", fontSize: 16, fontWeight: 600 }, children: "Maison/villa · Les Arcs" }) }),
          /* @__PURE__ */ jsx("div", { style: { padding: "16px 20px" }, children: [["Prix", "580 000 €", true], ["Surface", "167 m²", false], ["Pièces", "5 pièces", false]].map(([k, v, big]) => /* @__PURE__ */ jsxs("div", { style: { display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #F3F4F6" }, children: [
            /* @__PURE__ */ jsx("span", { style: { fontSize: 13, color: "#6B7280" }, children: k }),
            /* @__PURE__ */ jsx("span", { style: { fontSize: big ? 18 : 13, fontWeight: 700, color: big ? COLOR : "#111827" }, children: v })
          ] }, k)) })
        ] }) }),
        /* @__PURE__ */ jsx("div", { style: { margin: "0 28px 18px", borderRadius: 12, overflow: "hidden" }, children: /* @__PURE__ */ jsx(
          "img",
          {
            src: "https://groupementprimmo.staticlbi.com/wa/images/biens/11/67e970bb42105a5188b32864e42d1424/photo_0ca2885f13804197b64beb9874714665.jpg",
            alt: "Villa Les Arcs",
            style: { width: "100%", display: "block", height: 160, objectFit: "cover" }
          }
        ) }),
        /* @__PURE__ */ jsxs("div", { style: { margin: "0 28px 18px", background: "#FAFAFA", borderRadius: 12, padding: "16px 18px", border: "1px solid #E5E7EB" }, children: [
          /* @__PURE__ */ jsx("p", { style: { margin: "0 0 12px", fontSize: 14, fontWeight: 700, color: COLOR }, children: "Pourquoi ce bien pour vous ?" }),
          /* @__PURE__ */ jsx("p", { style: { margin: "0 0 10px", fontSize: 12, fontWeight: 600, color: "#059669" }, children: "Ce qui correspond à votre recherche" }),
          args.map((a) => /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 7 }, children: [
            /* @__PURE__ */ jsx("div", { style: { width: 8, height: 8, borderRadius: "50%", background: "#10B981", flexShrink: 0, marginTop: 4 } }),
            /* @__PURE__ */ jsx("span", { style: { fontSize: 13, color: "#374151", lineHeight: 1.5 }, children: a })
          ] }, a))
        ] }),
        /* @__PURE__ */ jsxs("div", { style: { padding: "0 28px 20px", textAlign: "center" }, children: [
          /* @__PURE__ */ jsx(
            "a",
            {
              href: BIEN_DEMO_URL,
              target: "_blank",
              rel: "noopener noreferrer",
              className: "email-cta-btn",
              style: { display: "inline-block", padding: "14px 40px", color: "#FFFFFF", textDecoration: "none", fontSize: 14, fontWeight: 700, letterSpacing: "0.04em", borderRadius: 12, background: GRAD, boxShadow: "0 6px 20px rgba(30,58,95,0.35)" },
              children: "Voir ce bien →"
            }
          ),
          /* @__PURE__ */ jsx("div", { style: { marginTop: 8 }, children: /* @__PURE__ */ jsx("a", { href: BIEN_DEMO_URL, target: "_blank", rel: "noopener noreferrer", style: { fontSize: 10, color: "#9CA3AF", textDecoration: "underline" }, children: "Ouvrir dans votre navigateur" }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { style: { padding: "0 28px 24px" }, children: [
          /* @__PURE__ */ jsx("p", { style: { margin: "0 0 12px", fontSize: 14, lineHeight: 1.6, color: "#374151" }, children: "Ce bien vous intéresse ? N'hésitez pas à me contacter pour organiser une visite." }),
          /* @__PURE__ */ jsx("p", { style: { margin: 0, fontSize: 14, color: "#374151" }, children: "À très bientôt," })
        ] }),
        /* @__PURE__ */ jsx("div", { style: { padding: "0 28px 28px" }, children: /* @__PURE__ */ jsxs("div", { style: { borderLeft: `3px solid ${COLOR}`, paddingLeft: 14 }, children: [
          /* @__PURE__ */ jsx("p", { style: { margin: "0 0 3px", fontSize: 14, fontWeight: 600, color: "#111827" }, children: "Sophie Laurent" }),
          /* @__PURE__ */ jsx("p", { style: { margin: "0 0 10px", fontSize: 12, color: "#6B7280" }, children: "Conseillère immobilier" }),
          /* @__PURE__ */ jsxs("p", { style: { margin: 0, fontSize: 12, lineHeight: 1.8, color: "#374151" }, children: [
            "12 avenue de la Corniche, 83600 Fréjus",
            /* @__PURE__ */ jsx("br", {}),
            /* @__PURE__ */ jsx("span", { style: { color: COLOR, fontWeight: 500 }, children: "04 94 XX XX XX" })
          ] })
        ] }) }),
        /* @__PURE__ */ jsx("div", { style: { background: "#F9FAFB", borderTop: "1px solid #E5E7EB", padding: "14px 28px" }, children: /* @__PURE__ */ jsxs("p", { style: { margin: 0, fontSize: 10, lineHeight: 1.6, color: "#9CA3AF", textAlign: "center" }, children: [
          "Vous recevez cet email car vous avez effectué une recherche immobilière auprès de notre agence.",
          /* @__PURE__ */ jsx("br", {}),
          "Pour ne plus recevoir nos propositions, répondez STOP à cet email."
        ] }) })
      ] }) })
    ] })
  );
}
function BiensMock() {
  const biens = [
    { ref: "AP-4821", type: "Appartement", ville: "Fréjus", surface: "34.48 m²", prix: "125 000 €", photo: "https://groupementprimmo.staticlbi.com/wa/images/biens/12/451ce046a0e41bcad3512ad26ea6e012/photo_2608d3bd31121c2f8ed8d7df12d23cfb.jpg" },
    { ref: "MV-1093", type: "Maison/villa", ville: "Fréjus", surface: "72 m²", prix: "288 750 €", photo: "https://groupementprimmo.staticlbi.com/wa/images/biens/12/a250fab4a2c4b0dd44e7fbccc62d16de/photo_48347d1adc58ea2976500be9ddf894f5.jpg" },
    { ref: "AP-3307", type: "Appartement", ville: "Saint-Raphaël", surface: "49 m²", prix: "169 000 €", photo: "https://groupementprimmo.staticlbi.com/wa/images/biens/6/1d1c9013fe12fd33e556482df1315df4/photo_eb7aaaa0d583d7a7df2d208cd04c4bd7.png" },
    { ref: "AP-7754", type: "Appartement", ville: "Agay", surface: "27.34 m²", prix: "165 000 €", photo: "https://groupementprimmo.staticlbi.com/wa/images/biens/7/99c18db26bdddf8af44b50d7e4634c99/photo_baea1dab07b245ccd532c47b45d3afff.jpg" },
    { ref: "MV-2248", type: "Maison/villa", ville: "Bagnols-en-Forêt", surface: "130 m²", prix: "580 000 €", photo: "https://groupementprimmo.staticlbi.com/wa/images/biens/10/b65839405141bda0d653bed097312829/photo_efdd4482865e6f34cc296cef5f960855.jpg" },
    { ref: "AP-5561", type: "Appartement", ville: "Saint-Raphaël", surface: "140 m²", prix: "399 000 €", photo: "https://groupementprimmo.staticlbi.com/wa/images/biens/6/925be20d620fea5d48cdf3bdf92a39ce/photo_5cb4bf9fce9829fcbf57fec2bbf5c746.jpg" },
    { ref: "AP-6690", type: "Appartement", ville: "Grimaud", surface: "49 m²", prix: "595 000 €", photo: "https://groupementprimmo.staticlbi.com/wa/images/biens/11/6838bbb9f22063de6c9634c3f52be2db/photo_9e6929e4cc450f90ea870c311882d934.png" }
  ];
  return /* @__PURE__ */ jsxs("div", { style: { fontFamily: "Inter, sans-serif", background: "#fff", WebkitFontSmoothing: "antialiased" }, children: [
    /* @__PURE__ */ jsxs("div", { style: { padding: "11px 16px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }, children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("span", { style: { fontWeight: 700, fontSize: 14, color: "#0f172a" }, children: "Biens" }),
        /* @__PURE__ */ jsx("span", { style: { marginLeft: 8, fontSize: 11, color: "#94a3b8" }, children: "131 actifs" })
      ] }),
      /* @__PURE__ */ jsx("div", { style: { display: "flex", gap: 6, alignItems: "center" }, children: ["Tous", "Saint François Immo", "Partenaires"].map((t, idx) => /* @__PURE__ */ jsx("span", { style: { padding: "3px 8px", borderRadius: 6, fontSize: 10, fontWeight: 600, background: idx === 0 ? "#1E3A5F" : "#f1f5f9", color: idx === 0 ? "#fff" : "#64748b" }, children: t }, t)) })
    ] }),
    /* @__PURE__ */ jsx("div", { style: { display: "grid", gridTemplateColumns: "2.2fr 1.3fr 0.9fr 1fr", gap: 6, padding: "7px 16px", background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }, children: ["Bien", "Localisation", "Surface", "Prix"].map((c) => /* @__PURE__ */ jsx("span", { style: { fontSize: 10, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em" }, children: c }, c)) }),
    biens.map((b, idx) => /* @__PURE__ */ jsxs("div", { className: "matching-row", style: { display: "grid", gridTemplateColumns: "2.2fr 1.3fr 0.9fr 1fr", gap: 6, padding: "8px 16px", borderBottom: "1px solid #f8fafc", alignItems: "center", animationDelay: `${200 + idx * 120}ms` }, children: [
      /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: 9 }, children: [
        /* @__PURE__ */ jsx("div", { style: { width: 38, height: 30, borderRadius: 6, overflow: "hidden", flexShrink: 0 }, children: /* @__PURE__ */ jsx(
          "img",
          {
            src: b.photo,
            alt: b.type,
            style: { width: "100%", height: "100%", objectFit: "cover", display: "block" }
          }
        ) }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("div", { style: { fontSize: 12, fontWeight: 600, color: "#1E3A5F", lineHeight: 1.2 }, children: b.type }),
          /* @__PURE__ */ jsxs("div", { style: { fontSize: 10, color: "#94a3b8", marginTop: 1 }, children: [
            "Réf. ",
            b.ref
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: 4 }, children: [
        /* @__PURE__ */ jsx("svg", { width: "10", height: "10", viewBox: "0 0 24 24", fill: "none", style: { flexShrink: 0 }, children: /* @__PURE__ */ jsx("path", { d: "M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z", stroke: "#94a3b8", strokeWidth: "2" }) }),
        /* @__PURE__ */ jsx("span", { style: { fontSize: 11, color: "#64748b" }, children: b.ville })
      ] }),
      /* @__PURE__ */ jsx("span", { style: { fontSize: 11, color: "#64748b" }, children: b.surface }),
      /* @__PURE__ */ jsx("span", { style: { fontSize: 12, fontWeight: 700, color: "#1E3A5F" }, children: b.prix })
    ] }, idx))
  ] });
}
function DashboardMock() {
  const kpis = [
    {
      label: "Prospects",
      value: "57",
      color: "#3b82f6",
      bg: "#eff6ff",
      badge: "4 à analyser",
      bC: "#d97706",
      bBg: "#fef3c7",
      icon: /* @__PURE__ */ jsxs("svg", { width: "13", height: "13", viewBox: "0 0 24 24", fill: "none", children: [
        /* @__PURE__ */ jsx("path", { d: "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round" }),
        /* @__PURE__ */ jsx("circle", { cx: "9", cy: "7", r: "4", stroke: "currentColor", strokeWidth: "2" })
      ] })
    },
    {
      label: "Biens",
      value: "130",
      color: "#10b981",
      bg: "#f0fdf4",
      badge: "Groupement Primmo",
      bC: "#2563eb",
      bBg: "#eff6ff",
      icon: /* @__PURE__ */ jsxs("svg", { width: "13", height: "13", viewBox: "0 0 24 24", fill: "none", children: [
        /* @__PURE__ */ jsx("rect", { x: "2", y: "7", width: "20", height: "14", rx: "2", stroke: "currentColor", strokeWidth: "2" }),
        /* @__PURE__ */ jsx("path", { d: "M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16", stroke: "currentColor", strokeWidth: "2" })
      ] })
    },
    {
      label: "Excellents",
      value: "97",
      color: "#7c3aed",
      bg: "#f5f3ff",
      badge: "37% du total",
      bC: "#7c3aed",
      bBg: "#f5f3ff",
      bar: 37,
      icon: /* @__PURE__ */ jsx("svg", { width: "13", height: "13", viewBox: "0 0 24 24", fill: "none", children: /* @__PURE__ */ jsx("polygon", { points: "12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2", stroke: "currentColor", strokeWidth: "2", strokeLinejoin: "round" }) })
    },
    {
      label: "Score IA",
      value: "64",
      color: "#f59e0b",
      bg: "#fffbeb",
      badge: "398 matchings",
      bC: "#6b7280",
      bBg: "#f9fafb",
      bar: 64,
      icon: /* @__PURE__ */ jsx("svg", { width: "13", height: "13", viewBox: "0 0 24 24", fill: "none", children: /* @__PURE__ */ jsx("polyline", { points: "22 7 13.5 15.5 8.5 10.5 2 17", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }) })
    }
  ];
  const matches = [
    { score: 94, nom: "Mme Marchand Sophie", bien: "Maison/villa · Fréjus", budget: "250 000 €", top: true },
    { score: 88, nom: "Mme Rochel Laura", bien: "Maison/villa · Les Arcs", budget: "620 000 €", top: false },
    { score: 85, nom: "Mme Torres Elena", bien: "Maison/villa · Agay", budget: "160 000 €", top: false },
    { score: 82, nom: "Mr Blanchard Luc", bien: "Appartement · Fréjus", budget: "410 000 €", top: false }
  ];
  const distrib = [
    { label: "90-100", color: "#059669", pct: 72 },
    { label: "80-89", color: "#10b981", pct: 88 },
    { label: "70-79", color: "#34d399", pct: 55 },
    { label: "60-69", color: "#f59e0b", pct: 40 },
    { label: "50-59", color: "#fbbf24", pct: 28 },
    { label: "< 50", color: "#f87171", pct: 18 }
  ];
  const topBiens = [
    { rank: 1, label: "Appartement · Fréjus", prix: "125 000 €", matchs: 14 },
    { rank: 2, label: "Maison/villa · Saint-Raphaël", prix: "399 000 €", matchs: 11 },
    { rank: 3, label: "Appartement · Agay", prix: "165 000 €", matchs: 9 }
  ];
  const sColor = (s) => s >= 75 ? "#10b981" : s >= 50 ? "#f59e0b" : "#ef4444";
  const rankColor = (i) => i === 0 ? "#F5C518" : i === 1 ? "#A8A9AD" : i === 2 ? "#CD7F32" : "#cbd5e1";
  return /* @__PURE__ */ jsxs("div", { style: { fontFamily: "Inter, sans-serif", background: "#f8fafc" }, children: [
    /* @__PURE__ */ jsx("div", { style: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 7, padding: "12px 12px 8px" }, children: kpis.map((k, i) => /* @__PURE__ */ jsxs("div", { style: { background: "#fff", borderRadius: 12, padding: "10px 10px 8px", border: "1px solid #edf1f7", borderTop: `2.5px solid ${k.color}` }, children: [
      /* @__PURE__ */ jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }, children: [
        /* @__PURE__ */ jsx("div", { style: { width: 26, height: 26, borderRadius: 7, background: k.bg, display: "flex", alignItems: "center", justifyContent: "center", color: k.color }, children: k.icon }),
        /* @__PURE__ */ jsx("span", { style: { fontSize: 9, fontWeight: 600, padding: "2px 5px", borderRadius: 99, background: k.bBg, color: k.bC, lineHeight: 1.4, textAlign: "right", maxWidth: 68 }, children: k.badge })
      ] }),
      /* @__PURE__ */ jsx("div", { style: { fontSize: 22, fontWeight: 800, color: k.color, lineHeight: 1, marginBottom: 2 }, children: k.value }),
      /* @__PURE__ */ jsx("div", { style: { fontSize: 9, color: "#94a3b8", fontWeight: 500, marginBottom: k.bar ? 6 : 0 }, children: k.label }),
      k.bar && /* @__PURE__ */ jsx("div", { style: { height: 2.5, background: "#f1f5f9", borderRadius: 99, overflow: "hidden" }, children: /* @__PURE__ */ jsx("div", { style: { height: "100%", borderRadius: 99, background: k.color, width: `${k.bar}%` } }) })
    ] }, i)) }),
    /* @__PURE__ */ jsxs("div", { style: { margin: "0 12px 8px", padding: "7px 12px", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 10, display: "flex", alignItems: "center", gap: 8 }, children: [
      /* @__PURE__ */ jsx("span", { className: "dash-pulse-dot", style: { width: 6, height: 6, borderRadius: "50%", background: "#f59e0b", flexShrink: 0 } }),
      /* @__PURE__ */ jsxs("span", { style: { fontSize: 11, color: "#92400e", fontWeight: 500, flex: 1 }, children: [
        /* @__PURE__ */ jsx("strong", { children: "4 prospects" }),
        " en attente d'analyse IA"
      ] }),
      /* @__PURE__ */ jsx("span", { style: { fontSize: 10, fontWeight: 700, background: "#f59e0b", color: "#fff", borderRadius: 6, padding: "2px 8px" }, children: "Analyser" })
    ] }),
    /* @__PURE__ */ jsxs("div", { style: { display: "grid", gridTemplateColumns: "3fr 2fr", gap: 8, margin: "0 12px 8px" }, children: [
      /* @__PURE__ */ jsxs("div", { style: { background: "#fff", borderRadius: 14, overflow: "hidden", border: "1px solid #edf1f7" }, children: [
        /* @__PURE__ */ jsxs("div", { style: { padding: "9px 13px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between" }, children: [
          /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: 7 }, children: [
            /* @__PURE__ */ jsx("div", { style: { width: 24, height: 24, borderRadius: 7, background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center" }, children: /* @__PURE__ */ jsx("svg", { width: "11", height: "11", viewBox: "0 0 24 24", fill: "none", children: /* @__PURE__ */ jsx("polygon", { points: "13 2 3 14 12 14 11 22 21 10 12 10 13 2", stroke: "#3b82f6", strokeWidth: "2", strokeLinejoin: "round" }) }) }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("div", { style: { fontSize: 11, fontWeight: 700, color: "#1E3A5F" }, children: "À contacter en priorité" }),
              /* @__PURE__ */ jsx("div", { style: { fontSize: 9, color: "#94a3b8" }, children: "4 meilleurs matchs" })
            ] })
          ] }),
          /* @__PURE__ */ jsx("span", { style: { fontSize: 10, color: "#3b82f6", fontWeight: 600 }, children: "Tout voir →" })
        ] }),
        matches.map((m, i) => /* @__PURE__ */ jsxs("div", { style: { padding: "8px 13px", display: "flex", alignItems: "center", gap: 9, borderBottom: i < matches.length - 1 ? "1px solid #f8fafc" : "none" }, children: [
          /* @__PURE__ */ jsx("div", { style: { width: 34, height: 34, borderRadius: 9, flexShrink: 0, background: `linear-gradient(135deg,${sColor(m.score)},${sColor(m.score)}99)`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 12 }, children: m.score }),
          /* @__PURE__ */ jsxs("div", { style: { flex: 1, minWidth: 0 }, children: [
            /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: 5, marginBottom: 1 }, children: [
              /* @__PURE__ */ jsx("span", { style: { fontSize: 11, fontWeight: 600, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }, children: m.nom }),
              m.top && /* @__PURE__ */ jsx("span", { style: { fontSize: 8, fontWeight: 700, padding: "1px 4px", borderRadius: 4, background: "#f0fdf4", color: "#059669", flexShrink: 0 }, children: "❤ COUP DE CŒUR" })
            ] }),
            /* @__PURE__ */ jsxs("div", { style: { fontSize: 10, color: "#94a3b8" }, children: [
              m.bien,
              " · ",
              m.budget
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { style: { display: "flex", gap: 4, flexShrink: 0 }, children: [
            /* @__PURE__ */ jsx("div", { style: { width: 26, height: 26, borderRadius: 7, background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center" }, children: /* @__PURE__ */ jsx("svg", { width: "10", height: "10", viewBox: "0 0 24 24", fill: "none", children: /* @__PURE__ */ jsx("path", { d: "M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z", stroke: "#10b981", strokeWidth: "2" }) }) }),
            /* @__PURE__ */ jsx("div", { style: { width: 26, height: 26, borderRadius: 7, background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center" }, children: /* @__PURE__ */ jsxs("svg", { width: "10", height: "10", viewBox: "0 0 24 24", fill: "none", children: [
              /* @__PURE__ */ jsx("path", { d: "M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z", stroke: "#3b82f6", strokeWidth: "2" }),
              /* @__PURE__ */ jsx("polyline", { points: "22,6 12,13 2,6", stroke: "#3b82f6", strokeWidth: "2" })
            ] }) })
          ] })
        ] }, i))
      ] }),
      /* @__PURE__ */ jsxs("div", { style: { display: "flex", flexDirection: "column", gap: 8 }, children: [
        /* @__PURE__ */ jsxs("div", { style: { background: "#fff", borderRadius: 14, overflow: "hidden", border: "1px solid #edf1f7" }, children: [
          /* @__PURE__ */ jsxs("div", { style: { padding: "9px 13px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between" }, children: [
            /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: 7 }, children: [
              /* @__PURE__ */ jsx("div", { style: { width: 24, height: 24, borderRadius: 7, background: "#f5f3ff", display: "flex", alignItems: "center", justifyContent: "center" }, children: /* @__PURE__ */ jsx("svg", { width: "11", height: "11", viewBox: "0 0 24 24", fill: "none", children: /* @__PURE__ */ jsx("polyline", { points: "22 12 18 12 15 21 9 3 6 12 2 12", stroke: "#7c3aed", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }) }) }),
              /* @__PURE__ */ jsx("div", { style: { fontSize: 11, fontWeight: 700, color: "#1E3A5F" }, children: "Qualité des matchs" })
            ] }),
            /* @__PURE__ */ jsxs("span", { style: { fontSize: 13, fontWeight: 800, color: "#1E3A5F" }, children: [
              "64",
              /* @__PURE__ */ jsx("span", { style: { fontSize: 9, color: "#94a3b8", fontWeight: 400 }, children: "/100" })
            ] })
          ] }),
          /* @__PURE__ */ jsx("div", { style: { padding: "10px 13px", display: "flex", flexDirection: "column", gap: 7 }, children: distrib.map((d) => /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: 7 }, children: [
            /* @__PURE__ */ jsx("span", { style: { fontSize: 9, color: "#94a3b8", width: 36, flexShrink: 0 }, children: d.label }),
            /* @__PURE__ */ jsx("div", { style: { flex: 1, height: 5, background: "#f1f5f9", borderRadius: 99, overflow: "hidden" }, children: /* @__PURE__ */ jsx("div", { style: { height: "100%", borderRadius: 99, background: d.color, width: `${d.pct}%` } }) })
          ] }, d.label)) })
        ] }),
        /* @__PURE__ */ jsxs("div", { style: { background: "#fff", borderRadius: 14, overflow: "hidden", border: "1px solid #edf1f7", flex: 1 }, children: [
          /* @__PURE__ */ jsx("div", { style: { padding: "9px 13px", borderBottom: "1px solid #f1f5f9" }, children: /* @__PURE__ */ jsx("div", { style: { fontSize: 11, fontWeight: 700, color: "#1E3A5F" }, children: "Biens les plus demandés" }) }),
          topBiens.map((b, i) => /* @__PURE__ */ jsxs("div", { style: { padding: "7px 13px", display: "flex", alignItems: "center", gap: 8, borderBottom: i < topBiens.length - 1 ? "1px solid #f8fafc" : "none" }, children: [
            /* @__PURE__ */ jsxs("span", { style: { fontSize: 11, fontWeight: 800, width: 16, flexShrink: 0, color: rankColor(i) }, children: [
              "#",
              b.rank
            ] }),
            /* @__PURE__ */ jsxs("div", { style: { flex: 1, minWidth: 0 }, children: [
              /* @__PURE__ */ jsx("div", { style: { fontSize: 11, fontWeight: 600, color: "#1E3A5F", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }, children: b.label }),
              /* @__PURE__ */ jsx("div", { style: { fontSize: 9, color: "#94a3b8" }, children: b.prix })
            ] }),
            /* @__PURE__ */ jsxs("span", { style: { fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 6, background: "#f5f3ff", color: "#7c3aed", flexShrink: 0 }, children: [
              b.matchs,
              " matchs"
            ] })
          ] }, i))
        ] })
      ] })
    ] })
  ] });
}
const FEATURES = [
  {
    id: "matching",
    label: "Matching IA",
    title: "Le bon bien pour le bon acheteur.",
    description: "ImmoFlash croise budget, localisation et style de vie, puis attribue un score sur 100 à chaque paire. Les meilleures remontent toutes seules, toi tu valides.",
    proof: "Score calculé en temps réel sur l'ensemble de ton portefeuille",
    Mock: MatchingMock,
    height: 560,
    scrollable: false,
    rotation: 0,
    reversed: false,
    glow: true
  },
  {
    id: "chat",
    label: "Agent IA conversationnel",
    title: "Tu lui parles. Il connaît ton stock par cœur.",
    description: '"Quel bien pour Sophie, budget 350k, cherche du calme et un garage ?" Une question, une réponse en quelques secondes. Comme un collègue qui aurait tout mémorisé.',
    proof: "Répond sur l'ensemble du catalogue en moins de 5 secondes",
    Mock: ChatMock,
    height: 420,
    scrollable: false,
    rotation: 1.5,
    reversed: true,
    glow: true
  },
  {
    id: "email",
    label: "Emails générés automatiquement",
    title: "L'email est prêt. Il t'attend.",
    description: "ImmoFlash rédige un email personnalisé avec les vrais arguments du bien : prix, surface, emplacement. Tu relis en 30 secondes, tu envoies.",
    proof: "Email prêt en moins de 10 secondes, personnalisé par bien et acheteur",
    Mock: EmailMock,
    height: 480,
    scrollable: true,
    rotation: 0,
    reversed: false,
    glow: true
  },
  {
    id: "biens",
    label: "Import de biens",
    title: "Ton portefeuille se met à jour tout seul.",
    description: "On connecte ImmoFlash à ton logiciel métier. Chaque nouveau bien remonte automatiquement, zéro saisie, zéro manipulation de ta part.",
    proof: "Connexion à ton logiciel métier, synchronisation en temps réel",
    Mock: BiensMock,
    height: 390,
    scrollable: false,
    rotation: 1.5,
    reversed: true,
    glow: true
  },
  {
    id: "dashboard",
    label: "Dashboard & analytics",
    title: "Tu sais exactement où tu en es.",
    description: "Matchings lancés, performance par agent, biens les plus demandés. Pas pour faire joli, pour savoir où donner un coup de main. Un rapport mensuel et un rapport par prospect sont générés automatiquement.",
    proof: "Données temps réel · rapports PDF mensuels et par prospect",
    Mock: DashboardMock,
    height: 462,
    scrollable: false,
    rotation: -1.5,
    reversed: false,
    glow: true
  }
];
function CheckIcon() {
  return /* @__PURE__ */ jsxs("svg", { width: "18", height: "18", viewBox: "0 0 18 18", fill: "none", style: { flexShrink: 0 }, "aria-hidden": "true", children: [
    /* @__PURE__ */ jsx("circle", { cx: "9", cy: "9", r: "9", fill: "rgba(56,189,248,0.12)" }),
    /* @__PURE__ */ jsx("path", { d: "M5.5 9l2.5 2.5L12.5 7", stroke: "#38bdf8", strokeWidth: "1.6", strokeLinecap: "round", strokeLinejoin: "round" })
  ] });
}
function FeaturesSection() {
  const sectionRef = useRef(null);
  useEffect(() => {
    var _a;
    const blocks = (_a = sectionRef.current) == null ? void 0 : _a.querySelectorAll(".feature-block");
    if (!(blocks == null ? void 0 : blocks.length)) return;
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("visible");
          observer.unobserve(e.target);
        }
      }),
      { threshold: 0.1 }
    );
    blocks.forEach((b) => observer.observe(b));
    return () => observer.disconnect();
  }, []);
  return /* @__PURE__ */ jsx("section", { id: "features", ref: sectionRef, style: { background: "#f8fafc", padding: "6rem 1.5rem" }, children: /* @__PURE__ */ jsxs("div", { style: { maxWidth: 1100, margin: "0 auto" }, children: [
    /* @__PURE__ */ jsxs("div", { className: "feature-block", style: { textAlign: "center", marginBottom: "5.5rem" }, children: [
      /* @__PURE__ */ jsx("span", { style: { display: "inline-block", background: "rgba(56,189,248,0.1)", color: "#38bdf8", border: "1px solid rgba(56,189,248,0.2)", borderRadius: 999, padding: "4px 14px", fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 18, fontFamily: "Inter, sans-serif" }, children: "Fonctionnalités" }),
      /* @__PURE__ */ jsx("h2", { style: { fontSize: "clamp(26px, 4vw, 42px)", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.8px", margin: "0 0 0.75rem", fontFamily: "Inter, sans-serif" }, children: "On a gardé ce qui change vraiment ta semaine." }),
      /* @__PURE__ */ jsx("p", { style: { color: "#64748b", fontSize: 16, margin: 0, fontFamily: "Inter, sans-serif" }, children: "Tout ce dont un agent a besoin. Rien de superflu." })
    ] }),
    /* @__PURE__ */ jsx("div", { style: { display: "flex", flexDirection: "column", gap: "6rem" }, children: FEATURES.map((feat, i) => {
      const Mock = feat.Mock;
      return /* @__PURE__ */ jsx("div", { id: `feat-${feat.id}`, className: "feature-block", style: { transitionDelay: `${i * 60}ms` }, children: /* @__PURE__ */ jsxs("div", { className: "feature-row", style: { flexDirection: feat.reversed ? "row-reverse" : "row" }, children: [
        /* @__PURE__ */ jsxs("div", { className: "feature-img-outer", style: { position: "relative" }, children: [
          feat.glow && /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx("div", { style: { position: "absolute", zIndex: 0, width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.55) 0%, transparent 65%)", filter: "blur(55px)", top: "-20%", left: "-15%", pointerEvents: "none" } }),
            /* @__PURE__ */ jsx("div", { style: { position: "absolute", zIndex: 0, width: 260, height: 260, borderRadius: "50%", background: "radial-gradient(circle, rgba(139,92,246,0.50) 0%, transparent 65%)", filter: "blur(50px)", bottom: "-18%", right: "-10%", pointerEvents: "none" } }),
            /* @__PURE__ */ jsx("div", { style: { position: "absolute", zIndex: 0, width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle, rgba(6,182,212,0.45) 0%, transparent 65%)", filter: "blur(45px)", top: "30%", left: "42%", transform: "translate(-50%,-50%)", pointerEvents: "none" } }),
            /* @__PURE__ */ jsx("div", { style: { position: "absolute", zIndex: 0, width: 160, height: 160, borderRadius: "50%", background: "radial-gradient(circle, rgba(244,114,182,0.40) 0%, transparent 65%)", filter: "blur(40px)", bottom: "8%", left: "-10%", pointerEvents: "none" } })
          ] }),
          /* @__PURE__ */ jsx("div", { style: { position: "relative", zIndex: 1 }, children: /* @__PURE__ */ jsx("div", { className: "feature-mock-card", style: {
            borderRadius: 12,
            /* email (scrollable:true) : visible → annotation absolue peut sortir */
            overflow: feat.scrollable ? "visible" : "hidden",
            transform: feat.rotation !== 0 ? `rotate(${feat.rotation}deg) translateZ(0)` : "none",
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            boxShadow: "0 32px 80px rgba(0,0,0,0.18)",
            height: feat.height
          }, children: /* @__PURE__ */ jsx(Mock, {}) }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "feature-text", children: [
          /* @__PURE__ */ jsx("span", { style: { display: "inline-block", background: "rgba(56,189,248,0.1)", color: "#38bdf8", border: "1px solid rgba(56,189,248,0.2)", borderRadius: 999, padding: "3px 12px", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 16, fontFamily: "Inter, sans-serif" }, children: feat.label }),
          /* @__PURE__ */ jsx("h3", { style: { fontSize: "clamp(22px, 2.6vw, 30px)", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.6px", lineHeight: 1.2, margin: "0 0 1rem", fontFamily: "Inter, sans-serif" }, children: feat.title }),
          /* @__PURE__ */ jsx("p", { style: { fontSize: 14, color: "#64748b", lineHeight: 1.85, margin: "0 0 1.5rem", fontFamily: "Inter, sans-serif" }, children: feat.description }),
          /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: 8 }, children: [
            /* @__PURE__ */ jsx(CheckIcon, {}),
            /* @__PURE__ */ jsx("span", { style: { fontSize: 13, color: "#0f172a", fontWeight: 500, fontFamily: "Inter, sans-serif" }, children: feat.proof })
          ] })
        ] })
      ] }) }, feat.id);
    }) })
  ] }) });
}
const SUJETS = [
  "Question générale",
  "Problème technique",
  "Question sur les tarifs",
  "Demande de démo",
  "Autre"
];
function ContactModal({ isOpen, onClose }) {
  const [form, setForm] = useState({ name: "", email: "", sujet: "Question générale", message: "" });
  const [status, setStatus] = useState("idle");
  const [focused, setFocused] = useState(null);
  if (!isOpen) return null;
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  async function handleSubmit(e) {
    e.preventDefault();
    setStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      setStatus(data.ok ? "success" : "error");
    } catch {
      setStatus("error");
    }
  }
  function handleClose() {
    setForm({ name: "", email: "", sujet: "Question générale", message: "" });
    setStatus("idle");
    setFocused(null);
    onClose();
  }
  const inputStyle = (key) => ({
    width: "100%",
    padding: "11px 14px",
    borderRadius: 10,
    border: `1px solid ${focused === key ? "rgba(56,189,248,0.5)" : "rgba(255,255,255,0.1)"}`,
    fontSize: 14,
    outline: "none",
    background: focused === key ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.05)",
    color: "#f1f5f9",
    boxSizing: "border-box",
    transition: "border-color 200ms, background 200ms",
    backdropFilter: "blur(4px)"
  });
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx("style", { children: `
        @keyframes overlayIn  { from { opacity: 0 } to { opacity: 1 } }
        @keyframes cardIn     { from { opacity: 0; transform: translateY(24px) scale(0.97) } to { opacity: 1; transform: translateY(0) scale(1) } }
        @keyframes checkIn    { 0% { transform: scale(0) rotate(-20deg); opacity: 0 } 70% { transform: scale(1.12) rotate(2deg) } 100% { transform: scale(1) rotate(0deg); opacity: 1 } }
        @keyframes spin       { to { transform: rotate(360deg) } }
        .contact-input::placeholder { color: rgba(148,163,184,0.5); }
      ` }),
    /* @__PURE__ */ jsx(
      "div",
      {
        onClick: handleClose,
        style: {
          position: "fixed",
          inset: 0,
          zIndex: 1e3,
          background: "rgba(6, 13, 26, 0.75)",
          backdropFilter: "blur(10px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "1rem",
          animation: "overlayIn 200ms ease"
        },
        children: /* @__PURE__ */ jsxs(
          "div",
          {
            onClick: (e) => e.stopPropagation(),
            style: {
              width: "100%",
              maxWidth: 480,
              background: "rgba(15, 28, 50, 0.85)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 24,
              boxShadow: "0 40px 100px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.07)",
              backdropFilter: "blur(24px)",
              overflow: "hidden",
              animation: "cardIn 280ms cubic-bezier(0.22,1,0.36,1)"
            },
            children: [
              /* @__PURE__ */ jsx("div", { style: {
                position: "absolute",
                top: 0,
                left: "50%",
                transform: "translateX(-50%)",
                width: 300,
                height: 1,
                background: "linear-gradient(90deg, transparent, rgba(56,189,248,0.6), transparent)",
                pointerEvents: "none"
              } }),
              /* @__PURE__ */ jsxs("div", { style: { padding: "2rem" }, children: [
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    onClick: handleClose,
                    style: {
                      position: "absolute",
                      top: 20,
                      right: 20,
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      color: "#94a3b8",
                      fontSize: 18,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "background 150ms, color 150ms"
                    },
                    onMouseEnter: (e) => {
                      e.currentTarget.style.background = "rgba(255,255,255,0.12)";
                      e.currentTarget.style.color = "#fff";
                    },
                    onMouseLeave: (e) => {
                      e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                      e.currentTarget.style.color = "#94a3b8";
                    },
                    children: "×"
                  }
                ),
                status === "success" ? /* @__PURE__ */ jsxs("div", { style: { textAlign: "center", padding: "1.5rem 0" }, children: [
                  /* @__PURE__ */ jsx(
                    "div",
                    {
                      style: {
                        width: 60,
                        height: 60,
                        borderRadius: "50%",
                        background: "rgba(56,189,248,0.12)",
                        border: "1px solid rgba(56,189,248,0.3)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        margin: "0 auto 1.25rem",
                        animation: "checkIn 500ms cubic-bezier(0.22,1,0.36,1)"
                      },
                      children: /* @__PURE__ */ jsx("svg", { width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", children: /* @__PURE__ */ jsx("path", { d: "M5 13l4 4L19 7", stroke: "#38bdf8", strokeWidth: "2.5", strokeLinecap: "round", strokeLinejoin: "round" }) })
                    }
                  ),
                  /* @__PURE__ */ jsx("h3", { style: { color: "#f1f5f9", fontWeight: 700, fontSize: 20, margin: "0 0 8px" }, children: "Message envoyé" }),
                  /* @__PURE__ */ jsxs("p", { style: { color: "#64748b", fontSize: 14, margin: "0 0 1.75rem", lineHeight: 1.6 }, children: [
                    "Nous avons bien reçu votre message.",
                    /* @__PURE__ */ jsx("br", {}),
                    "Vous recevrez une réponse sous 24h."
                  ] }),
                  /* @__PURE__ */ jsx(
                    "button",
                    {
                      onClick: handleClose,
                      style: {
                        background: "rgba(255,255,255,0.07)",
                        color: "#f1f5f9",
                        border: "1px solid rgba(255,255,255,0.12)",
                        borderRadius: 10,
                        padding: "10px 24px",
                        fontSize: 14,
                        fontWeight: 500,
                        cursor: "pointer"
                      },
                      children: "Fermer"
                    }
                  )
                ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
                  /* @__PURE__ */ jsx("h3", { style: { color: "#f1f5f9", fontWeight: 700, fontSize: 20, margin: "0 0 4px" }, children: "Une question ?" }),
                  /* @__PURE__ */ jsx("p", { style: { color: "#475569", fontSize: 13, margin: "0 0 1.75rem" }, children: "Réponse garantie sous 24h." }),
                  /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, style: { display: "flex", flexDirection: "column", gap: 14 }, children: [
                    /* @__PURE__ */ jsx("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }, children: [["name", "Nom", "Jean Dupont", "text"], ["email", "Email", "vous@agence.fr", "email"]].map(([k, lbl, ph, t]) => /* @__PURE__ */ jsxs("div", { children: [
                      /* @__PURE__ */ jsx("label", { style: { display: "block", fontSize: 11, fontWeight: 600, color: "#475569", letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 6 }, children: lbl }),
                      /* @__PURE__ */ jsx(
                        "input",
                        {
                          className: "contact-input",
                          type: t,
                          placeholder: ph,
                          value: form[k],
                          onChange: set(k),
                          required: true,
                          style: inputStyle(k),
                          onFocus: () => setFocused(k),
                          onBlur: () => setFocused(null)
                        }
                      )
                    ] }, k)) }),
                    /* @__PURE__ */ jsxs("div", { children: [
                      /* @__PURE__ */ jsx("label", { style: { display: "block", fontSize: 11, fontWeight: 600, color: "#475569", letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 8 }, children: "Sujet" }),
                      /* @__PURE__ */ jsx("div", { style: { display: "flex", flexWrap: "wrap", gap: 7 }, children: SUJETS.map((s) => {
                        const active = form.sujet === s;
                        return /* @__PURE__ */ jsx(
                          "button",
                          {
                            type: "button",
                            onClick: () => setForm((f) => ({ ...f, sujet: s })),
                            style: {
                              padding: "6px 13px",
                              borderRadius: 999,
                              fontSize: 13,
                              border: `1px solid ${active ? "rgba(56,189,248,0.5)" : "rgba(255,255,255,0.1)"}`,
                              background: active ? "rgba(56,189,248,0.1)" : "rgba(255,255,255,0.04)",
                              color: active ? "#38bdf8" : "#64748b",
                              cursor: "pointer",
                              fontWeight: active ? 500 : 400,
                              transition: "all 160ms"
                            },
                            children: s
                          },
                          s
                        );
                      }) })
                    ] }),
                    /* @__PURE__ */ jsxs("div", { children: [
                      /* @__PURE__ */ jsx("label", { style: { display: "block", fontSize: 11, fontWeight: 600, color: "#475569", letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 6 }, children: "Message" }),
                      /* @__PURE__ */ jsx(
                        "textarea",
                        {
                          className: "contact-input",
                          placeholder: "Décrivez votre demande...",
                          value: form.message,
                          onChange: set("message"),
                          required: true,
                          style: { ...inputStyle("message"), resize: "none", minHeight: 100 },
                          onFocus: () => setFocused("message"),
                          onBlur: () => setFocused(null)
                        }
                      )
                    ] }),
                    status === "error" && /* @__PURE__ */ jsx("p", { style: {
                      color: "#f87171",
                      fontSize: 13,
                      margin: 0,
                      padding: "10px 14px",
                      background: "rgba(239,68,68,0.08)",
                      border: "1px solid rgba(239,68,68,0.2)",
                      borderRadius: 8
                    }, children: "Une erreur est survenue. Réessayez ou écrivez à contact@immoflash.app" }),
                    /* @__PURE__ */ jsx(
                      "button",
                      {
                        type: "submit",
                        disabled: status === "sending",
                        style: {
                          marginTop: 4,
                          background: "linear-gradient(135deg, #1e3a5f 0%, #2d6ca2 100%)",
                          color: "#fff",
                          border: "none",
                          borderRadius: 12,
                          padding: "13px",
                          fontSize: 14,
                          fontWeight: 600,
                          cursor: status === "sending" ? "not-allowed" : "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 8,
                          boxShadow: "0 4px 24px rgba(30,58,95,0.4)",
                          opacity: status === "sending" ? 0.7 : 1,
                          transition: "opacity 150ms"
                        },
                        children: status === "sending" ? /* @__PURE__ */ jsxs(Fragment, { children: [
                          /* @__PURE__ */ jsxs("svg", { width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", style: { animation: "spin 1s linear infinite" }, children: [
                            /* @__PURE__ */ jsx("circle", { cx: "12", cy: "12", r: "9", stroke: "rgba(255,255,255,0.25)", strokeWidth: "2.5" }),
                            /* @__PURE__ */ jsx("path", { d: "M12 3a9 9 0 0 1 9 9", stroke: "#fff", strokeWidth: "2.5", strokeLinecap: "round" })
                          ] }),
                          "Envoi en cours…"
                        ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
                          "Envoyer le message",
                          /* @__PURE__ */ jsx("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", children: /* @__PURE__ */ jsx("path", { d: "M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }) })
                        ] })
                      }
                    )
                  ] })
                ] })
              ] })
            ]
          }
        )
      }
    )
  ] });
}
function usePrefersReducedMotion() {
  const [pref, setPref] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handler = (e) => setPref(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return pref;
}
function useScrollProgress() {
  useEffect(() => {
    const bar = document.getElementById("scroll-progress");
    if (!bar) return;
    const onScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const pct = docHeight > 0 ? scrollTop / docHeight * 100 : 0;
      bar.style.width = pct + "%";
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
}
function useIsMobile(bp = 768) {
  const [isMobile, setIsMobile] = useState(() => typeof window !== "undefined" && window.innerWidth < bp);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < bp);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, [bp]);
  return isMobile;
}
function useReveal() {
  useEffect(() => {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) {
      document.querySelectorAll(".reveal, .reveal-group, .timeline-row").forEach((el) => el.classList.add("visible"));
      return;
    }
    const makeVisible = (el) => {
      const children = el.querySelectorAll(".reveal-child");
      if (children.length > 0) {
        children.forEach((child, i) => setTimeout(() => child.classList.add("visible"), i * 80));
      } else {
        el.classList.add("visible");
      }
    };
    const els = [...document.querySelectorAll(".reveal, .reveal-group, .timeline-row")];
    els.forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.top < window.innerHeight + 50 && r.bottom > 0) {
        makeVisible(el);
      }
    });
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            makeVisible(entry.target);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -48px 0px" }
    );
    els.forEach((el) => {
      if (!el.classList.contains("visible")) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);
}
function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return /* @__PURE__ */ jsxs(
    "div",
    {
      style: { borderBottom: "1px solid #e2e8f0", padding: "1.25rem 0", cursor: "pointer" },
      onClick: () => setOpen((o) => !o),
      children: [
        /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }, children: [
          /* @__PURE__ */ jsx("span", { style: { fontSize: 15, fontWeight: 600, color: "#0f172a" }, children: q }),
          /* @__PURE__ */ jsx("span", { style: { fontSize: 22, color: "#64748b", flexShrink: 0, lineHeight: 1, transition: "transform 200ms", transform: open ? "rotate(45deg)" : "none" }, children: "+" })
        ] }),
        open && /* @__PURE__ */ jsx("p", { style: { margin: "0.75rem 0 0", fontSize: 14, color: "#64748b", lineHeight: 1.7 }, children: a })
      ]
    }
  );
}
function HeroVideo() {
  const videoRef = useRef(null);
  const trackRef = useRef(null);
  const hideTimer = useRef(null);
  const dragging = useRef(false);
  const [paused, setPaused] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showCtrl, setShowCtrl] = useState(false);
  const [muted, setMuted] = useState(true);
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.addEventListener("play", () => setPaused(false));
    v.addEventListener("pause", () => setPaused(true));
    v.addEventListener("ended", () => setPaused(true));
    v.addEventListener("timeupdate", () => setCurrentTime(v.currentTime));
    v.addEventListener("loadedmetadata", () => setDuration(v.duration));
    v.addEventListener("canplay", () => v.play().catch(() => {
    }), { once: true });
    v.load();
  }, []);
  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.ended) {
      v.currentTime = 0;
      v.play().catch(() => {
      });
      return;
    }
    v.paused ? v.play().catch(() => {
    }) : v.pause();
  };
  const seekTo = (clientX) => {
    const v = videoRef.current;
    const bar = trackRef.current;
    if (!v || !bar || !duration) return;
    const rect = bar.getBoundingClientRect();
    const pct2 = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    v.currentTime = pct2 * duration;
    setCurrentTime(pct2 * duration);
  };
  const onTrackDown = (e) => {
    dragging.current = true;
    seekTo(e.clientX);
  };
  const onTrackMove = (e) => {
    if (dragging.current) seekTo(e.clientX);
  };
  const onTrackUp = () => {
    dragging.current = false;
  };
  useEffect(() => {
    window.addEventListener("mousemove", onTrackMove);
    window.addEventListener("mouseup", onTrackUp);
    return () => {
      window.removeEventListener("mousemove", onTrackMove);
      window.removeEventListener("mouseup", onTrackUp);
    };
  });
  const showControls = () => {
    setShowCtrl(true);
    clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setShowCtrl(false), 2500);
  };
  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  };
  const toggleFullscreen = () => {
    const v = videoRef.current;
    if (!v) return;
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {
      });
    } else if (v.requestFullscreen) {
      v.requestFullscreen().catch(() => {
      });
    } else if (v.webkitEnterFullscreen) {
      v.webkitEnterFullscreen();
    }
  };
  const fmt = (s) => {
    const m = Math.floor(s / 60), sec = Math.floor(s % 60);
    return `${m}:${String(sec).padStart(2, "0")}`;
  };
  const pct = duration > 0 ? currentTime / duration * 100 : 0;
  return /* @__PURE__ */ jsx("div", { style: { maxWidth: 1080, margin: "0 auto", padding: "0 1.5rem", position: "relative", zIndex: 1 }, children: /* @__PURE__ */ jsxs(
    "div",
    {
      style: { borderRadius: 16, overflow: "hidden", boxShadow: "0 0 0 1px rgba(56,189,248,0.15), 0 0 60px 20px rgba(56,189,248,0.25), 0 0 120px 40px rgba(99,102,241,0.2), 0 40px 100px rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.08)", position: "relative", cursor: "none", transform: "translateZ(0)", willChange: "transform", backdropFilter: "blur(0px)" },
      onMouseMove: showControls,
      onMouseLeave: () => {
        clearTimeout(hideTimer.current);
        setShowCtrl(false);
      },
      onTouchStart: showControls,
      children: [
        /* @__PURE__ */ jsx(
          "video",
          {
            ref: videoRef,
            src: "/assets/hero.mp4",
            poster: "/assets/hero-poster.jpg",
            autoPlay: true,
            muted: true,
            playsInline: true,
            preload: "auto",
            width: "1280",
            height: "720",
            style: { width: "100%", display: "block", aspectRatio: "16/9" },
            onClick: togglePlay
          }
        ),
        /* @__PURE__ */ jsxs("div", { style: {
          position: "absolute",
          inset: 0,
          pointerEvents: showCtrl ? "auto" : "none",
          opacity: showCtrl ? 1 : 0,
          transition: "opacity 0.25s ease"
        }, children: [
          /* @__PURE__ */ jsx("div", { style: {
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 100,
            background: "linear-gradient(to top, rgba(6,13,24,0.85) 0%, transparent 100%)",
            pointerEvents: "none"
          } }),
          /* @__PURE__ */ jsx("div", { onClick: togglePlay, style: {
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer"
          }, children: /* @__PURE__ */ jsx("div", { style: {
            width: 64,
            height: 64,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.12)",
            border: "1.5px solid rgba(255,255,255,0.35)",
            backdropFilter: "blur(12px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "transform 0.15s ease, background 0.15s ease"
          }, children: paused ? /* @__PURE__ */ jsx("svg", { width: "22", height: "22", viewBox: "0 0 24 24", fill: "white", children: /* @__PURE__ */ jsx("path", { d: "M8 5v14l11-7z" }) }) : /* @__PURE__ */ jsxs("svg", { width: "22", height: "22", viewBox: "0 0 24 24", fill: "white", children: [
            /* @__PURE__ */ jsx("rect", { x: "6", y: "4", width: "4", height: "16" }),
            /* @__PURE__ */ jsx("rect", { x: "14", y: "4", width: "4", height: "16" })
          ] }) }) }),
          /* @__PURE__ */ jsx("div", { style: { position: "absolute", bottom: 0, left: 0, right: 0, padding: "0 16px 14px" }, children: /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }, children: [
            /* @__PURE__ */ jsx("span", { style: { color: "rgba(255,255,255,0.8)", fontSize: 12, fontVariantNumeric: "tabular-nums", fontFamily: "ui-monospace, monospace", whiteSpace: "nowrap" }, children: fmt(currentTime) }),
            /* @__PURE__ */ jsxs(
              "div",
              {
                ref: trackRef,
                onMouseDown: onTrackDown,
                style: { flex: 1, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.2)", cursor: "pointer", position: "relative" },
                children: [
                  /* @__PURE__ */ jsx("div", { style: { position: "absolute", left: 0, top: 0, height: "100%", width: `${pct}%`, borderRadius: 2, background: "linear-gradient(90deg,#38bdf8,#6366f1)", transition: "width 0.1s linear" } }),
                  /* @__PURE__ */ jsx("div", { style: { position: "absolute", top: "50%", left: `${pct}%`, width: 12, height: 12, borderRadius: "50%", background: "#fff", transform: "translate(-50%,-50%)", boxShadow: "0 1px 4px rgba(0,0,0,0.4)" } })
                ]
              }
            ),
            /* @__PURE__ */ jsx("span", { style: { color: "rgba(255,255,255,0.45)", fontSize: 12, fontVariantNumeric: "tabular-nums", fontFamily: "ui-monospace, monospace", whiteSpace: "nowrap" }, children: fmt(duration) }),
            /* @__PURE__ */ jsx("div", { onClick: toggleMute, style: { cursor: "pointer", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, borderRadius: 6, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)" }, children: muted ? /* @__PURE__ */ jsxs("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "rgba(255,255,255,0.8)", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
              /* @__PURE__ */ jsx("path", { d: "M11 5L6 9H2v6h4l5 4V5z" }),
              /* @__PURE__ */ jsx("line", { x1: "23", y1: "9", x2: "17", y2: "15" }),
              /* @__PURE__ */ jsx("line", { x1: "17", y1: "9", x2: "23", y2: "15" })
            ] }) : /* @__PURE__ */ jsxs("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "rgba(255,255,255,0.8)", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
              /* @__PURE__ */ jsx("path", { d: "M11 5L6 9H2v6h4l5 4V5z" }),
              /* @__PURE__ */ jsx("path", { d: "M15.54 8.46a5 5 0 0 1 0 7.07" }),
              /* @__PURE__ */ jsx("path", { d: "M19.07 4.93a10 10 0 0 1 0 14.14" })
            ] }) }),
            /* @__PURE__ */ jsx("div", { onClick: toggleFullscreen, style: { cursor: "pointer", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, borderRadius: 6, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)" }, children: /* @__PURE__ */ jsx("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "rgba(255,255,255,0.8)", strokeWidth: "2", strokeLinecap: "round", children: /* @__PURE__ */ jsx("path", { d: "M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M8 21H5a2 2 0 0 1-2-2v-3M16 21h3a2 2 0 0 0 2-2v-3" }) }) })
          ] }) })
        ] })
      ]
    }
  ) });
}
function Home() {
  useScrollProgress();
  useReveal();
  usePrefersReducedMotion();
  const isMobile = useIsMobile();
  const [menuOpen, setMenuOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const navigate = useNavigate();
  const openDemo = (e) => {
    e == null ? void 0 : e.preventDefault();
    setMenuOpen(false);
    navigate("/demarrer");
  };
  const stepsRef = useRef(null);
  const [stepsVisible, setStepsVisible] = useState(false);
  useEffect(() => {
    const el = stepsRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setStepsVisible(true);
        io.disconnect();
      }
    }, { threshold: 0.2 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 768) setMenuOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  useEffect(() => {
    const targets = [
      document.querySelector(".left-before"),
      document.querySelector(".right-after")
    ].filter(Boolean);
    if (!targets.length) return;
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("playing");
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.25 });
    targets.forEach((t) => obs.observe(t));
    return () => obs.disconnect();
  }, []);
  useEffect(() => {
    const rows = document.querySelectorAll(".timeline-row");
    if (!rows.length) return;
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -40px 0px" });
    rows.forEach((r) => obs.observe(r));
    return () => obs.disconnect();
  }, []);
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);
  const navLinks = [
    { label: "Fonctionnalités", href: "#features" },
    { label: "Tarifs", href: "#pricing" },
    { label: "Démo", href: "#demo" }
  ];
  const plans = [
    {
      name: "Essentiel",
      price: "49",
      subtitle: "L'agence solo qui veut démarrer",
      features: [
        "1 utilisateur",
        "Jusqu'à 50 biens actifs",
        "20 matchings IA / mois",
        "20 emails personnalisés / mois",
        "30 questions agent IA / mois",
        "Synchronisation avec votre logiciel métier",
        "Support email — réponse 48h"
      ],
      cta: "Commencer",
      ctaStyle: "outline",
      featured: false,
      stripeUrl: "https://buy.stripe.com/5kQ4gB0KYbmsggA4Mk0Fi01"
    },
    {
      name: "Pro",
      price: "89",
      subtitle: "L'agence active avec une équipe",
      badge: "Recommandé",
      features: [
        "Jusqu'à 3 agents",
        "Jusqu'à 200 biens actifs",
        "Matchings IA illimités",
        "80 emails personnalisés / mois",
        "200 questions agent IA / mois",
        "Synchronisation avec votre logiciel métier",
        "Rapport mensuel PDF automatique",
        "Support email — réponse 24h"
      ],
      cta: "Commencer",
      ctaStyle: "filled",
      featured: true,
      stripeUrl: "https://buy.stripe.com/9B65kFdxKaio4xS3Ig0Fi02"
    },
    {
      name: "Réseau",
      price: "179",
      subtitle: "Les agences multi-bureaux",
      features: [
        "Jusqu'à 10 agents",
        "Biens illimités",
        "Matchings IA illimités",
        "Emails personnalisés illimités",
        "Questions agent IA illimitées",
        "Jusqu'à 3 bureaux dans un compte",
        "Dashboard multi-agences centralisé",
        "Rapport avancé + export Excel",
        "Synchronisation prioritaire (toutes 2h)",
        "Onboarding dédié inclus (visio 1h)",
        "Support prioritaire — réponse 12h"
      ],
      cta: "Commencer",
      ctaStyle: "outline",
      featured: false,
      stripeUrl: "https://buy.stripe.com/fZu3cxdxK76c5BW1A80Fi00"
    }
  ];
  const footerCols = [
    {
      title: "Produit",
      links: [
        { label: "Fonctionnalités", href: "#features" },
        { label: "Comment ça marche", href: "#steps" },
        { label: "Tarifs", href: "#pricing" },
        { label: "FAQ", href: "#faq" }
      ]
    },
    {
      title: "Ressources",
      links: [
        { label: "Documentation", href: "/documentation", internal: true },
        { label: "Guide de démarrage", href: "/guide-de-demarrage", internal: true },
        { label: "FAQ", href: "/faq", internal: true }
      ]
    },
    {
      title: "Légal",
      links: [
        { label: "Mentions légales", href: "/mentions-legales", internal: true },
        { label: "CGU", href: "/cgu", internal: true },
        { label: "Confidentialité", href: "/confidentialite", internal: true },
        { label: "Cookies", href: "/cookies", internal: true }
      ]
    },
    {
      title: "Contact",
      links: [
        { label: "contact@immoflash.app", href: "mailto:contact@immoflash.app" },
        { label: "Support", onClick: () => setContactOpen(true) }
      ]
    }
  ];
  const faqItems = [
    {
      q: "Comment ImmoFlash importe mes biens ?",
      a: "Depuis Hektor, un fichier Excel ou CSV, ou en saisie manuelle. L'import prend moins de 5 minutes. Aucune ligne de code, aucune intégration technique."
    },
    {
      q: "C'est quoi exactement un 'score de matching' ?",
      a: "Un score sur 100 calculé par notre IA qui croise le budget, la surface, les critères, la localisation et l'historique du prospect avec les caractéristiques du bien. Plus c'est haut, plus la probabilité de conversion est élevée."
    },
    {
      q: "Est-ce que ImmoFlash rédige les emails à ma place ?",
      a: "Oui. Pour chaque matching, l'IA génère un email personnalisé qui explique pourquoi CE bien correspond à CE prospect — avec les arguments concrets. Vous relisez, vous envoyez."
    },
    {
      q: "Mes données sont-elles sécurisées ? Êtes-vous conformes RGPD ?",
      a: "Oui, à plusieurs niveaux. Les données sont hébergées exclusivement en Europe (Hetzner, Allemagne). Chaque agence dispose de sa propre base de données isolée. Les critères de recherche des prospects envoyés à l'IA sont anonymisés (aucun nom, email ni téléphone ne quitte notre serveur). Un contrat de sous-traitance RGPD Article 28 est fourni à chaque agence cliente. ImmoFlash agit en qualité de sous-traitant : vos données vous appartiennent et restent accessibles 30 jours après résiliation."
    },
    {
      q: "C'est quoi la période d'essai ?",
      a: "Vous commencez avec une démo guidée sur vos vraies données. Si ça ne vous convient pas, vous ne payez rien. Aucune carte bancaire demandée à l'inscription."
    },
    {
      q: "Est-ce vraiment rentable pour une agence ?",
      a: "À 89 € HT par mois, une seule vente supplémentaire dans l'année — un rapprochement qu'un CRM classique aurait raté — couvre plusieurs années d'abonnement. ImmoFlash ne remplace pas votre jugement, il s'assure que vous ne laissez passer aucune opportunité."
    },
    {
      q: "Ça marche avec plusieurs agents dans une agence ?",
      a: "Oui, le plan Agence+ prend en charge jusqu'à 5 agents avec des accès séparés. Chaque agent voit son propre portefeuille."
    }
  ];
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx("div", { id: "scroll-progress" }),
    /* @__PURE__ */ jsxs("nav", { className: "navbar", children: [
      /* @__PURE__ */ jsxs("a", { href: "#", style: { fontWeight: 800, fontSize: 19, color: "#fff", textDecoration: "none", letterSpacing: "-0.5px", flexShrink: 0 }, children: [
        "Immo",
        /* @__PURE__ */ jsx("span", { style: { color: "#38bdf8" }, children: "Flash" })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "hidden md:flex items-center gap-8", children: navLinks.map((link) => /* @__PURE__ */ jsx(
        "a",
        {
          href: link.href,
          style: { color: "rgba(255,255,255,0.6)", textDecoration: "none", fontSize: 14, fontWeight: 500, transition: "color 150ms" },
          onMouseEnter: (e) => e.target.style.color = "#fff",
          onMouseLeave: (e) => e.target.style.color = "rgba(255,255,255,0.6)",
          children: link.label
        },
        link.label
      )) }),
      /* @__PURE__ */ jsx("a", { href: "#", onClick: openDemo, className: "btn-primary navbar-cta", style: { padding: "9px 20px", fontSize: 13 }, children: "Essayer gratuitement" }),
      /* @__PURE__ */ jsxs(
        "button",
        {
          className: "navbar-burger",
          onClick: () => setMenuOpen(true),
          "aria-label": "Menu",
          style: { background: "none", border: "none", cursor: "pointer", padding: 6 },
          children: [
            /* @__PURE__ */ jsx("span", { style: { display: "block", width: 22, height: 2, background: "#fff", borderRadius: 2, marginBottom: 5 } }),
            /* @__PURE__ */ jsx("span", { style: { display: "block", width: 22, height: 2, background: "#fff", borderRadius: 2, marginBottom: 5 } }),
            /* @__PURE__ */ jsx("span", { style: { display: "block", width: 14, height: 2, background: "#fff", borderRadius: 2 } })
          ]
        }
      )
    ] }),
    /* @__PURE__ */ jsxs("div", { className: `mobile-menu ${menuOpen ? "open" : ""}`, children: [
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: () => setMenuOpen(false),
          "aria-label": "Fermer",
          style: { position: "absolute", top: 14, right: 16, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "50%", width: 30, height: 30, cursor: "pointer", fontSize: 16, color: "rgba(255,255,255,0.7)", display: "flex", alignItems: "center", justifyContent: "center" },
          children: "×"
        }
      ),
      /* @__PURE__ */ jsxs("a", { href: "#", style: { fontWeight: 800, fontSize: 20, color: "#fff", textDecoration: "none" }, children: [
        "Immo",
        /* @__PURE__ */ jsx("span", { style: { color: "#38bdf8" }, children: "Flash" })
      ] }),
      navLinks.map((link) => /* @__PURE__ */ jsx(
        "a",
        {
          href: link.href,
          onClick: () => setMenuOpen(false),
          style: { color: "rgba(255,255,255,0.75)", textDecoration: "none", fontSize: 17, fontWeight: 500 },
          children: link.label
        },
        link.label
      )),
      /* @__PURE__ */ jsx(
        "a",
        {
          href: "#",
          onClick: openDemo,
          className: "btn-primary",
          style: { padding: "12px 28px", fontSize: 14, width: "100%", textAlign: "center", justifyContent: "center" },
          children: "Demander une démo"
        }
      )
    ] }),
    /* @__PURE__ */ jsxs("section", { style: {
      background: "radial-gradient(ellipse at 20% 30%, #0d2137 0%, #060d1a 50%, #0a0618 100%)",
      padding: "9rem 1.5rem 6rem",
      textAlign: "center",
      position: "relative",
      overflow: "hidden"
    }, children: [
      /* @__PURE__ */ jsx("div", { style: { position: "absolute", width: 700, height: 700, top: -250, left: "-10%", borderRadius: "50%", background: "radial-gradient(circle, rgba(56,189,248,0.22) 0%, transparent 70%)", filter: "blur(60px)", animation: "floatOrb 14s ease-in-out infinite" } }),
      /* @__PURE__ */ jsx("div", { style: { position: "absolute", width: 580, height: 580, bottom: -180, right: "-8%", borderRadius: "50%", background: "radial-gradient(circle, rgba(139,92,246,0.25) 0%, transparent 70%)", filter: "blur(60px)", animation: "floatOrb2 17s ease-in-out infinite" } }),
      /* @__PURE__ */ jsx("div", { style: { position: "absolute", width: 420, height: 420, top: "10%", right: "15%", borderRadius: "50%", background: "radial-gradient(circle, rgba(244,114,182,0.14) 0%, transparent 70%)", filter: "blur(50px)", animation: "floatOrb 20s ease-in-out infinite reverse" } }),
      /* @__PURE__ */ jsx("div", { style: { position: "absolute", width: 360, height: 360, bottom: "5%", left: "20%", borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%)", filter: "blur(50px)", animation: "floatOrb2 11s ease-in-out infinite reverse" } }),
      /* @__PURE__ */ jsx("div", { style: { position: "absolute", inset: 0, backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E")`, opacity: 0.4, pointerEvents: "none" } }),
      /* @__PURE__ */ jsxs("div", { style: { maxWidth: 800, margin: "0 auto", position: "relative", zIndex: 1 }, children: [
        /* @__PURE__ */ jsx("div", { className: "reveal", style: { marginBottom: "1.75rem" }, children: /* @__PURE__ */ jsx("span", { style: {
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          background: "rgba(56,189,248,0.08)",
          color: "#7dd3fc",
          border: "1px solid rgba(56,189,248,0.2)",
          borderRadius: 999,
          padding: "5px 14px",
          fontSize: 12,
          fontWeight: 500,
          letterSpacing: "0.06em",
          textTransform: "uppercase"
        }, children: "IA pour agents immobiliers" }) }),
        /* @__PURE__ */ jsxs("h1", { className: "reveal", style: { fontSize: "clamp(36px, 6vw, 64px)", fontWeight: 800, lineHeight: 1.08, color: "#f1f5f9", letterSpacing: "-1.5px", margin: "0 0 1.5rem" }, children: [
          "Votre prochaine vente",
          /* @__PURE__ */ jsx("br", {}),
          /* @__PURE__ */ jsx("span", { className: "text-gradient", children: "est déjà dans votre fichier." })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "reveal", style: { fontSize: 18, color: "#94a3b8", lineHeight: 1.75, maxWidth: 520, margin: "0 auto 2.75rem", fontWeight: 400 }, children: "ImmoFlash analyse vos prospects, trouve les meilleurs matchings et rédige l'email. En 30 secondes." }),
        /* @__PURE__ */ jsxs("div", { className: "reveal", style: { display: "flex", flexWrap: "wrap", gap: 14, justifyContent: "center", marginBottom: "1rem" }, children: [
          /* @__PURE__ */ jsxs("a", { href: "#", onClick: openDemo, className: "btn-primary", children: [
            "Demander une démo gratuite",
            /* @__PURE__ */ jsx("svg", { width: "15", height: "15", fill: "none", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { stroke: "currentColor", strokeWidth: "2.5", strokeLinecap: "round", strokeLinejoin: "round", d: "M5 12h14M12 5l7 7-7 7" }) })
          ] }),
          /* @__PURE__ */ jsx("a", { href: "#features", className: "btn-ghost-light", children: "Voir comment ça marche" })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "reveal", style: { fontSize: 13, color: "#334155", margin: "0 0 3rem" }, children: "Aucune carte bancaire · Opérationnel en 24h · Vos vraies données" })
      ] }),
      /* @__PURE__ */ jsx(HeroVideo, {})
    ] }),
    /* @__PURE__ */ jsx("section", { className: "section", style: { background: "#f8fafc" }, children: /* @__PURE__ */ jsxs("div", { style: { maxWidth: 1080, margin: "0 auto" }, children: [
      /* @__PURE__ */ jsxs("div", { className: "reveal", style: { textAlign: "center", marginBottom: "4rem" }, children: [
        /* @__PURE__ */ jsx("p", { style: { color: "#38bdf8", fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 12px" }, children: "Comment ça marche" }),
        /* @__PURE__ */ jsx("h2", { style: { fontSize: "clamp(26px, 4vw, 40px)", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.8px", margin: "0 0 12px" }, children: "Opérationnel en 4 étapes." }),
        /* @__PURE__ */ jsx("p", { style: { color: "#64748b", fontSize: 16, maxWidth: 480, margin: "0 auto" }, children: "Pas de formation. Pas de configuration complexe. Vous êtes prêt en quelques minutes." })
      ] }),
      /* @__PURE__ */ jsxs("div", { ref: stepsRef, className: "steps-grid", style: { display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)", gap: "1.5rem", position: "relative" }, children: [
        /* @__PURE__ */ jsx("div", { style: { display: isMobile ? "none" : "block", position: "absolute", top: 36, left: "calc(12.5% + 16px)", right: "calc(12.5% + 16px)", height: 2, background: "#e2e8f0", borderRadius: 2, zIndex: 0, pointerEvents: "none" }, children: /* @__PURE__ */ jsx("div", { className: "steps-progress-bar", style: { height: "100%", borderRadius: 2, background: "linear-gradient(90deg, #1E3A5F 0%, #38bdf8 60%, #7dd3fc 100%)", width: stepsVisible ? "100%" : 0, transition: stepsVisible ? "width 1.6s cubic-bezier(0.4,0,0.2,1) 0.3s" : "none" } }) }),
        [
          {
            color: "#0369a1",
            icon: /* @__PURE__ */ jsxs("svg", { width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", children: [
              /* @__PURE__ */ jsx("path", { d: "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }),
              /* @__PURE__ */ jsx("path", { d: "M9 22V12h6v10", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" })
            ] }),
            title: "Vos biens sont déjà là",
            desc: "On connecte ImmoFlash à votre logiciel métier. Vos biens se synchronisent automatiquement, vous n'avez rien à faire."
          },
          {
            color: "#1E3A5F",
            icon: /* @__PURE__ */ jsxs("svg", { width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", children: [
              /* @__PURE__ */ jsx("circle", { cx: "9", cy: "7", r: "4", stroke: "currentColor", strokeWidth: "2" }),
              /* @__PURE__ */ jsx("path", { d: "M2 21v-2a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v2", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round" }),
              /* @__PURE__ */ jsx("path", { d: "M16 11h6M19 8v6", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round" })
            ] }),
            title: "Importez vos prospects",
            desc: "Renseignez les critères de chaque acheteur : budget, surface, localisation, type de bien."
          },
          {
            color: "#4f46e5",
            icon: /* @__PURE__ */ jsx("svg", { width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", children: /* @__PURE__ */ jsx("path", { d: "M12 2l3 7h7l-5.5 4 2 7L12 16l-6.5 4 2-7L2 9h7z", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }) }),
            title: "L'IA score chaque matching",
            desc: "L'algorithme compare chaque prospect avec chaque bien et attribue un score de compatibilité sur 100."
          },
          {
            color: "#059669",
            icon: /* @__PURE__ */ jsxs("svg", { width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", children: [
              /* @__PURE__ */ jsx("rect", { x: "2", y: "4", width: "20", height: "16", rx: "2", stroke: "currentColor", strokeWidth: "2" }),
              /* @__PURE__ */ jsx("path", { d: "M2 8l10 7 10-7", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round" })
            ] }),
            title: "Envoyez l'email en 30 s",
            desc: "Les meilleurs matchings remontent en tête. Un email personnalisé est généré avec les arguments du bien."
          }
        ].map((step, i) => /* @__PURE__ */ jsxs("div", { style: { position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", opacity: stepsVisible ? 1 : 0, transform: stepsVisible ? "none" : "translateY(28px)", transition: `opacity 0.55s ease ${i * 0.26 + 0.1}s, transform 0.55s ease ${i * 0.26 + 0.1}s` }, children: [
          /* @__PURE__ */ jsxs("div", { style: { position: "relative", marginBottom: "1.5rem" }, children: [
            /* @__PURE__ */ jsx("div", { style: { width: 72, height: 72, borderRadius: "50%", background: "#fff", border: `2px solid ${step.color}22`, boxShadow: `0 4px 24px ${step.color}18`, display: "flex", alignItems: "center", justifyContent: "center", color: step.color }, children: step.icon }),
            /* @__PURE__ */ jsx("div", { style: { position: "absolute", top: -8, right: -8, width: 24, height: 24, borderRadius: "50%", background: step.color, color: "#fff", fontSize: 10, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }, children: i + 1 })
          ] }),
          /* @__PURE__ */ jsx("h3", { style: { fontSize: 18, fontWeight: 700, color: "#0f172a", margin: "0 0 10px", letterSpacing: "-0.3px" }, children: step.title }),
          /* @__PURE__ */ jsx("p", { style: { fontSize: 14, lineHeight: 1.7, color: "#64748b", margin: 0, maxWidth: 260 }, children: step.desc })
        ] }, i))
      ] })
    ] }) }),
    /* @__PURE__ */ jsx("section", { className: "section", style: { background: "#ffffff" }, children: /* @__PURE__ */ jsxs("div", { style: { maxWidth: 1e3, margin: "0 auto" }, children: [
      /* @__PURE__ */ jsxs("div", { className: "reveal", style: { textAlign: "center", marginBottom: "3rem" }, children: [
        /* @__PURE__ */ jsx("h2", { style: { fontSize: "clamp(24px, 4vw, 38px)", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.6px", margin: "0 0 0.75rem", lineHeight: 1.25 }, children: "La même heure. Deux réalités." }),
        /* @__PURE__ */ jsx("p", { style: { color: "#64748b", fontSize: 16, lineHeight: 1.7, maxWidth: 480, margin: "0 auto" }, children: "Ce que font vos agents aujourd'hui — et ce qu'ImmoFlash fait à leur place." })
      ] }),
      /* @__PURE__ */ jsxs("div", { style: { position: "relative" }, children: [
        !isMobile && /* @__PURE__ */ jsx("div", { className: "arrow-slide", style: {
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 10,
          pointerEvents: "none"
        }, children: /* @__PURE__ */ jsx("svg", { width: "36", height: "36", viewBox: "0 0 24 24", fill: "none", children: /* @__PURE__ */ jsx("path", { className: "arrow-draw", d: "M5 12h14M13 6l6 6-6 6", stroke: "#38bdf8", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", strokeDasharray: "30", strokeDashoffset: "30" }) }) }),
        /* @__PURE__ */ jsxs("div", { className: "reveal-group", style: { display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: isMobile ? "1.5rem" : "5rem", alignItems: "stretch" }, children: [
          /* @__PURE__ */ jsxs("div", { className: "reveal-child left-before", style: {
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: 20,
            padding: "2rem",
            position: "relative"
          }, children: [
            /* @__PURE__ */ jsx("p", { style: { fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 1.75rem" }, children: "Sans ImmoFlash" }),
            /* @__PURE__ */ jsx("div", { style: { display: "flex", flexDirection: "column", gap: "1.25rem" }, children: [
              { icon: /* @__PURE__ */ jsxs("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", children: [
                /* @__PURE__ */ jsx("path", { d: "M12 6v6l4 2", stroke: "#94a3b8", strokeWidth: "2", strokeLinecap: "round" }),
                /* @__PURE__ */ jsx("circle", { cx: "12", cy: "12", r: "9", stroke: "#94a3b8", strokeWidth: "2" })
              ] }), text: "Exporter les biens manuellement", note: "5 min", n: 1 },
              { icon: /* @__PURE__ */ jsx("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", children: /* @__PURE__ */ jsx("path", { d: "M4 6h16M4 12h10M4 18h7", stroke: "#94a3b8", strokeWidth: "2", strokeLinecap: "round" }) }), text: "Parcourir les fiches prospect", note: "20 min", n: 2 },
              { icon: /* @__PURE__ */ jsx("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", children: /* @__PURE__ */ jsx("path", { d: "M8 6l4-4 4 4M16 18l-4 4-4-4M12 2v20", stroke: "#94a3b8", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }) }), text: "Croiser critères et budgets", note: "20 min", n: 3 },
              { icon: /* @__PURE__ */ jsxs("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", children: [
                /* @__PURE__ */ jsx("rect", { x: "2", y: "4", width: "20", height: "16", rx: "2", stroke: "#94a3b8", strokeWidth: "2" }),
                /* @__PURE__ */ jsx("path", { d: "M2 8l10 7 10-7", stroke: "#94a3b8", strokeWidth: "2", strokeLinecap: "round" })
              ] }), text: "Rédiger un email par prospect", note: "10 min", n: 4 }
            ].map((item) => /* @__PURE__ */ jsxs("div", { className: `before-item before-item-${item.n}`, children: [
              /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: 10 }, children: [
                /* @__PURE__ */ jsx("span", { style: { flexShrink: 0, opacity: 0.6 }, children: item.icon }),
                /* @__PURE__ */ jsx("span", { style: { fontSize: 14, color: "#64748b", flex: 1 }, children: item.text }),
                /* @__PURE__ */ jsx("span", { style: { fontSize: 12, color: "#94a3b8", fontWeight: 500 }, children: item.note })
              ] }),
              /* @__PURE__ */ jsx("div", { style: { marginTop: 8, height: 2, background: "#f1f5f9", borderRadius: 2, overflow: "hidden" }, children: /* @__PURE__ */ jsx("div", { className: `before-prog before-prog-${item.n}`, style: { height: "100%", background: "#cbd5e1" } }) })
            ] }, item.n)) }),
            /* @__PURE__ */ jsxs("div", { style: { marginTop: "2rem", paddingTop: "1.25rem", borderTop: "1px solid #f1f5f9", display: "flex", alignItems: "baseline", gap: 6 }, children: [
              /* @__PURE__ */ jsx("span", { style: { color: "#94a3b8", fontSize: 13 }, children: "Total" }),
              /* @__PURE__ */ jsx("span", { style: { color: "#475569", fontWeight: 700, fontSize: 22, letterSpacing: "-0.5px" }, children: "~55 min" }),
              /* @__PURE__ */ jsx("span", { style: { color: "#cbd5e1", fontSize: 12 }, children: "par session" })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "reveal-child right-after", style: {
            background: "linear-gradient(150deg, #071220 0%, #0b1e38 60%, #0c2647 100%)",
            border: "1px solid rgba(56,189,248,0.25)",
            borderRadius: 24,
            padding: "2.25rem",
            position: "relative",
            overflow: "hidden",
            transform: isMobile ? "none" : "translateY(-8px)",
            boxShadow: "0 0 0 1px rgba(56,189,248,0.08), 0 28px 70px rgba(56,189,248,0.2), 0 8px 24px rgba(0,0,0,0.5)"
          }, children: [
            /* @__PURE__ */ jsx("div", { style: { position: "absolute", top: 0, left: "10%", right: "10%", height: 1, background: "linear-gradient(90deg, transparent, rgba(56,189,248,0.85), transparent)", pointerEvents: "none" } }),
            /* @__PURE__ */ jsx("div", { style: { position: "absolute", width: 340, height: 340, top: -130, right: -90, borderRadius: "50%", background: "radial-gradient(circle, rgba(56,189,248,0.11) 0%, transparent 65%)", pointerEvents: "none" } }),
            /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.75rem", position: "relative" }, children: [
              /* @__PURE__ */ jsx("p", { style: { fontSize: 11, fontWeight: 700, color: "#38bdf8", textTransform: "uppercase", letterSpacing: "0.1em", margin: 0 }, children: "Avec ImmoFlash" }),
              /* @__PURE__ */ jsx("span", { style: { fontSize: 11, fontWeight: 700, color: "#0f172a", background: "#38bdf8", borderRadius: 999, padding: "3px 10px" }, children: "Solution" })
            ] }),
            /* @__PURE__ */ jsx("div", { style: { display: "flex", flexDirection: "column", gap: "1.25rem", position: "relative" }, children: [
              { icon: /* @__PURE__ */ jsxs("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", children: [
                /* @__PURE__ */ jsx("path", { d: "M4 12a8 8 0 0 1 14.93-4M20 12a8 8 0 0 1-14.93 4", stroke: "#38bdf8", strokeWidth: "2", strokeLinecap: "round" }),
                /* @__PURE__ */ jsx("path", { d: "M18 4l2 4h-4M6 20l-2-4h4", stroke: "#38bdf8", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" })
              ] }), text: "Synchronisation automatique du portefeuille" },
              { icon: /* @__PURE__ */ jsxs("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", children: [
                /* @__PURE__ */ jsx("circle", { cx: "12", cy: "12", r: "9", stroke: "#38bdf8", strokeWidth: "2" }),
                /* @__PURE__ */ jsx("path", { d: "M12 7v5l3 3", stroke: "#38bdf8", strokeWidth: "2", strokeLinecap: "round" })
              ] }), text: "Score /100 calculé pour chaque prospect" },
              { icon: /* @__PURE__ */ jsx("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", children: /* @__PURE__ */ jsx("path", { d: "M3 6h18M7 12h10M11 18h2", stroke: "#38bdf8", strokeWidth: "2", strokeLinecap: "round" }) }), text: "Meilleurs matchings remontés en priorité" },
              { icon: /* @__PURE__ */ jsxs("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", children: [
                /* @__PURE__ */ jsx("rect", { x: "2", y: "4", width: "20", height: "16", rx: "2", stroke: "#38bdf8", strokeWidth: "2" }),
                /* @__PURE__ */ jsx("path", { d: "M2 8l10 7 10-7", stroke: "#38bdf8", strokeWidth: "2", strokeLinecap: "round" })
              ] }), text: "Email personnalisé généré et prêt à envoyer" }
            ].map((item, i) => /* @__PURE__ */ jsxs(
              "div",
              {
                className: "after-item",
                style: { display: "flex", alignItems: "center", gap: 10, padding: "0.5rem 0.75rem", borderRadius: 10, transition: "background 160ms, transform 160ms", cursor: "default" },
                onMouseEnter: (e) => {
                  e.currentTarget.style.background = "rgba(56,189,248,0.09)";
                  e.currentTarget.style.transform = "translateX(5px)";
                },
                onMouseLeave: (e) => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.transform = "translateX(0)";
                },
                children: [
                  /* @__PURE__ */ jsx("span", { style: { flexShrink: 0 }, children: item.icon }),
                  /* @__PURE__ */ jsx("span", { style: { fontSize: 14, color: "#cbd5e1", flex: 1 }, children: item.text }),
                  /* @__PURE__ */ jsx("span", { style: { fontSize: 11, color: "#0f172a", background: "rgba(56,189,248,0.9)", borderRadius: 999, padding: "2px 8px", fontWeight: 700 }, children: "Instant" })
                ]
              },
              i
            )) }),
            /* @__PURE__ */ jsxs("div", { style: { marginTop: "2rem", paddingTop: "1.25rem", borderTop: "1px solid rgba(56,189,248,0.12)", position: "relative", display: "flex", alignItems: "baseline", gap: 6 }, children: [
              /* @__PURE__ */ jsx("span", { style: { color: "#64748b", fontSize: 13 }, children: "Total" }),
              /* @__PURE__ */ jsx("span", { style: { color: "#38bdf8", fontWeight: 800, fontSize: 28, letterSpacing: "-1px" }, children: "30s" })
            ] })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "reveal", style: { textAlign: "center", marginTop: "2.5rem" }, children: /* @__PURE__ */ jsxs("p", { style: { color: "#94a3b8", fontSize: 14, margin: 0 }, children: [
        "En moyenne, nos clients récupèrent",
        " ",
        /* @__PURE__ */ jsx("strong", { style: { color: "#0f172a" }, children: "5 à 8 heures par semaine et par agent." })
      ] }) })
    ] }) }),
    /* @__PURE__ */ jsx(FeaturesSection, {}),
    /* @__PURE__ */ jsx("section", { id: "pricing", style: { background: "#0f1e30", padding: "5rem 1.5rem" }, children: /* @__PURE__ */ jsxs("div", { style: { maxWidth: 1100, margin: "0 auto" }, children: [
      /* @__PURE__ */ jsxs("div", { className: "reveal", style: { textAlign: "center", marginBottom: "3.5rem" }, children: [
        /* @__PURE__ */ jsx("span", { style: {
          display: "inline-block",
          background: "rgba(56,189,248,0.12)",
          color: "#38bdf8",
          borderRadius: 999,
          padding: "4px 14px",
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          marginBottom: 16,
          border: "1px solid rgba(56,189,248,0.25)"
        }, children: "Tarifs" }),
        /* @__PURE__ */ jsx("h2", { style: { fontSize: "clamp(28px, 4vw, 42px)", fontWeight: 800, color: "#ffffff", letterSpacing: "-0.8px", margin: "0 0 0.5rem" }, children: "Simple. Transparent. Sans surprise." }),
        /* @__PURE__ */ jsx("p", { style: { color: "#94a3b8", fontSize: 15, margin: 0 }, children: "Une vente conclue grâce à ImmoFlash couvre 2 ans d'abonnement." })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "reveal-group pricing-grid", children: plans.map((plan) => /* @__PURE__ */ jsxs("div", { className: `reveal-child pricing-card ${plan.featured ? "featured" : ""}`, children: [
        plan.badge && /* @__PURE__ */ jsx("div", { style: { marginBottom: "-0.5rem" }, children: /* @__PURE__ */ jsx("span", { style: { background: "#38bdf8", color: "#0f1e30", borderRadius: 999, padding: "4px 12px", fontSize: 12, fontWeight: 700 }, children: plan.badge }) }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h3", { style: { color: "#ffffff", fontWeight: 700, fontSize: 20, margin: "0 0 4px" }, children: plan.name }),
          /* @__PURE__ */ jsx("p", { style: { color: "#64748b", fontSize: 14, margin: 0 }, children: plan.subtitle })
        ] }),
        /* @__PURE__ */ jsxs("div", { style: { display: "flex", flexDirection: "column", gap: 4 }, children: [
          /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "baseline", gap: 4 }, children: [
            /* @__PURE__ */ jsxs("span", { style: { fontSize: 48, fontWeight: 800, color: "#ffffff", lineHeight: 1 }, children: [
              plan.price,
              "€"
            ] }),
            /* @__PURE__ */ jsx("span", { style: { color: "#64748b", fontSize: 14 }, children: "HT / mois" })
          ] }),
          /* @__PURE__ */ jsx("span", { style: { color: "#38bdf8", fontSize: 12, fontWeight: 600, letterSpacing: "0.04em" }, children: "Sans engagement" })
        ] }),
        /* @__PURE__ */ jsx("div", { style: { height: 1, background: "rgba(255,255,255,0.08)" } }),
        /* @__PURE__ */ jsx("ul", { style: { listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }, children: plan.features.map((f) => /* @__PURE__ */ jsxs("li", { style: { display: "flex", alignItems: "flex-start", gap: 10, color: "#cbd5e1", fontSize: 14 }, children: [
          /* @__PURE__ */ jsx("span", { style: {
            flexShrink: 0,
            width: 18,
            height: 18,
            borderRadius: "50%",
            background: plan.featured ? "rgba(56,189,248,0.15)" : "rgba(255,255,255,0.08)",
            color: plan.featured ? "#38bdf8" : "#94a3b8",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 10,
            fontWeight: 700,
            marginTop: 1
          }, children: "✓" }),
          f
        ] }, f)) }),
        plan.stripeUrl ? /* @__PURE__ */ jsx(
          "a",
          {
            href: plan.stripeUrl,
            target: "_blank",
            rel: "noopener noreferrer",
            className: plan.ctaStyle === "filled" ? "btn-filled-dark" : "btn-outline-white",
            style: { marginTop: "auto" },
            children: plan.cta
          }
        ) : /* @__PURE__ */ jsx(
          "a",
          {
            href: plan.ctaHref || "#",
            className: "btn-outline-white",
            style: { marginTop: "auto" },
            children: plan.cta
          }
        )
      ] }, plan.name)) }),
      /* @__PURE__ */ jsx("div", { className: "reveal", style: { textAlign: "center", marginTop: "2.5rem" }, children: /* @__PURE__ */ jsxs("div", { style: { display: "flex", flexWrap: "wrap", justifyContent: "center", alignItems: "center", gap: "6px 0", color: "#475569", fontSize: 13 }, children: [
        /* @__PURE__ */ jsx("span", { style: { whiteSpace: "nowrap" }, children: "Sans engagement · résiliable à tout moment" }),
        /* @__PURE__ */ jsx("span", { style: { margin: "0 12px", color: "#334155" }, children: "·" }),
        /* @__PURE__ */ jsx("span", { style: { whiteSpace: "nowrap" }, children: "Tarif de lancement garanti à vie pour les premières agences" }),
        /* @__PURE__ */ jsx("span", { style: { margin: "0 12px", color: "#334155" }, children: "·" }),
        /* @__PURE__ */ jsx("span", { style: { whiteSpace: "nowrap" }, children: "Remboursé intégralement si vous n'êtes pas satisfait dans les 14 jours" })
      ] }) })
    ] }) }),
    /* @__PURE__ */ jsx("section", { className: "section", style: { background: "#ffffff" }, children: /* @__PURE__ */ jsxs("div", { style: { maxWidth: 720, margin: "0 auto" }, children: [
      /* @__PURE__ */ jsxs("div", { className: "reveal", style: { textAlign: "center", marginBottom: "3rem" }, children: [
        /* @__PURE__ */ jsx("h2", { style: { fontSize: "clamp(26px, 4vw, 38px)", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.6px", margin: "0 0 0.75rem" }, children: "Questions fréquentes" }),
        /* @__PURE__ */ jsxs("p", { style: { color: "#64748b", fontSize: 15, margin: 0 }, children: [
          "Pas trouvé la réponse ?",
          " ",
          /* @__PURE__ */ jsx("button", { onClick: () => setContactOpen(true), style: { background: "none", border: "none", padding: 0, color: "#38bdf8", textDecoration: "none", fontWeight: 500, cursor: "pointer", fontSize: "inherit" }, children: "Écrivez-nous." })
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "reveal", children: faqItems.map((item, i) => /* @__PURE__ */ jsx(FaqItem, { q: item.q, a: item.a }, i)) })
    ] }) }),
    /* @__PURE__ */ jsxs("section", { id: "demo", style: { background: "radial-gradient(ellipse at 50% 0%, #0d2137 0%, #060d1a 70%)", padding: "6rem 1.5rem", textAlign: "center", position: "relative", overflow: "hidden" }, children: [
      /* @__PURE__ */ jsx("div", { style: { position: "absolute", width: 600, height: 600, top: -200, left: "50%", transform: "translateX(-50%)", borderRadius: "50%", background: "radial-gradient(circle, rgba(56,189,248,0.12) 0%, transparent 70%)", pointerEvents: "none" } }),
      /* @__PURE__ */ jsx("div", { style: { maxWidth: 620, margin: "0 auto", position: "relative" }, children: /* @__PURE__ */ jsxs("div", { className: "reveal", children: [
        /* @__PURE__ */ jsx("p", { style: { color: "#38bdf8", fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 1.25rem" }, children: "Prêt à gagner du temps ?" }),
        /* @__PURE__ */ jsxs("h2", { style: { fontSize: "clamp(28px, 5vw, 48px)", fontWeight: 800, color: "#f1f5f9", letterSpacing: "-1px", lineHeight: 1.1, margin: "0 0 1.25rem" }, children: [
          "Votre prochaine vente",
          /* @__PURE__ */ jsx("br", {}),
          "commence maintenant."
        ] }),
        /* @__PURE__ */ jsx("p", { style: { color: "#64748b", fontSize: 16, lineHeight: 1.7, margin: "0 0 2.5rem" }, children: "Démo sur vos données réelles. Aucune carte bancaire. Opérationnel en 24h." }),
        /* @__PURE__ */ jsxs("a", { href: "#", onClick: openDemo, className: "btn-primary", style: { fontSize: 15, padding: "14px 32px" }, children: [
          "Demander une démo gratuite",
          /* @__PURE__ */ jsx("svg", { width: "15", height: "15", fill: "none", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { stroke: "currentColor", strokeWidth: "2.5", strokeLinecap: "round", strokeLinejoin: "round", d: "M5 12h14M12 5l7 7-7 7" }) })
        ] })
      ] }) })
    ] }),
    /* @__PURE__ */ jsx("footer", { style: { background: "#0f172a", padding: "4rem 1.5rem 2rem" }, children: /* @__PURE__ */ jsxs("div", { style: { maxWidth: 1100, margin: "0 auto" }, children: [
      /* @__PURE__ */ jsxs("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "2.5rem", marginBottom: "3rem" }, children: [
        /* @__PURE__ */ jsxs("div", { style: { gridColumn: "span 1" }, children: [
          /* @__PURE__ */ jsxs("div", { style: { fontWeight: 800, fontSize: 20, color: "#ffffff", marginBottom: 12 }, children: [
            "Immo",
            /* @__PURE__ */ jsx("span", { style: { color: "#38bdf8" }, children: "Flash" })
          ] }),
          /* @__PURE__ */ jsx("p", { style: { color: "#475569", fontSize: 14, lineHeight: 1.6, margin: "0 0 1rem", maxWidth: 220 }, children: "Le matching prospect-bien réinventé par l'IA." }),
          /* @__PURE__ */ jsx("a", { href: "mailto:contact@immoflash.app", style: { color: "#38bdf8", fontSize: 13, textDecoration: "none", fontWeight: 500 }, children: "contact@immoflash.app" })
        ] }),
        footerCols.map((col) => /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h4", { style: { color: "#ffffff", fontWeight: 600, fontSize: 14, margin: "0 0 1rem", letterSpacing: "0.02em" }, children: col.title }),
          /* @__PURE__ */ jsx("ul", { style: { listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8 }, children: col.links.map((link) => /* @__PURE__ */ jsx("li", { children: link.onClick ? /* @__PURE__ */ jsx(
            "button",
            {
              onClick: link.onClick,
              style: { background: "none", border: "none", padding: 0, color: "#475569", fontSize: 14, textDecoration: "none", cursor: "pointer", transition: "color 150ms" },
              onMouseEnter: (e) => e.target.style.color = "#94a3b8",
              onMouseLeave: (e) => e.target.style.color = "#475569",
              children: link.label
            }
          ) : link.internal ? /* @__PURE__ */ jsx(
            Link,
            {
              to: link.href,
              style: { color: "#475569", fontSize: 14, textDecoration: "none", transition: "color 150ms" },
              onMouseEnter: (e) => e.currentTarget.style.color = "#94a3b8",
              onMouseLeave: (e) => e.currentTarget.style.color = "#475569",
              children: link.label
            }
          ) : /* @__PURE__ */ jsx(
            "a",
            {
              href: link.href,
              style: { color: "#475569", fontSize: 14, textDecoration: "none", transition: "color 150ms" },
              onMouseEnter: (e) => e.target.style.color = "#94a3b8",
              onMouseLeave: (e) => e.target.style.color = "#475569",
              children: link.label
            }
          ) }, link.label)) })
        ] }, col.title))
      ] }),
      /* @__PURE__ */ jsxs("div", { style: { borderTop: "1px solid #1e293b", paddingTop: "1.75rem", display: "flex", flexWrap: "wrap", gap: "0.75rem", alignItems: "center", justifyContent: "space-between" }, children: [
        /* @__PURE__ */ jsx("p", { style: { color: "#334155", fontSize: 13, margin: 0 }, children: "© 2026 ImmoFlash. Tous droits réservés." }),
        /* @__PURE__ */ jsx("div", { style: { display: "flex", gap: "1.5rem" }, children: [
          { label: "Mentions légales", to: "/mentions-legales" },
          { label: "CGU", to: "/cgu" },
          { label: "Confidentialité", to: "/confidentialite" }
        ].map((item) => /* @__PURE__ */ jsx(
          Link,
          {
            to: item.to,
            style: { color: "#334155", fontSize: 13, textDecoration: "none", transition: "color 150ms" },
            onMouseEnter: (e) => e.currentTarget.style.color = "#64748b",
            onMouseLeave: (e) => e.currentTarget.style.color = "#334155",
            children: item.label
          },
          item.to
        )) })
      ] })
    ] }) }),
    /* @__PURE__ */ jsx(ContactModal, { isOpen: contactOpen, onClose: () => setContactOpen(false) })
  ] });
}
function ScrollTop() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  return null;
}
function PageLayout({ title, category, children }) {
  useEffect(() => {
    document.title = `${title} — ImmoFlash`;
  }, [title]);
  return /* @__PURE__ */ jsxs("div", { style: { minHeight: "100vh", display: "flex", flexDirection: "column", background: "#ffffff" }, children: [
    /* @__PURE__ */ jsx(ScrollTop, {}),
    /* @__PURE__ */ jsxs("nav", { style: {
      position: "sticky",
      top: 0,
      zIndex: 100,
      background: "#ffffff",
      borderBottom: "1px solid #e2e8f0",
      padding: "0 1.5rem",
      height: 60,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between"
    }, children: [
      /* @__PURE__ */ jsxs(
        Link,
        {
          to: "/",
          style: { fontWeight: 800, fontSize: 18, color: "#0f172a", textDecoration: "none", letterSpacing: "-0.5px" },
          children: [
            "Immo",
            /* @__PURE__ */ jsx("span", { style: { color: "#38bdf8" }, children: "Flash" })
          ]
        }
      ),
      /* @__PURE__ */ jsx(
        Link,
        {
          to: "/",
          style: {
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            color: "#64748b",
            textDecoration: "none",
            fontSize: 14,
            fontWeight: 500,
            transition: "color 150ms"
          },
          onMouseEnter: (e) => e.currentTarget.style.color = "#0f172a",
          onMouseLeave: (e) => e.currentTarget.style.color = "#64748b",
          children: "← Retour au site"
        }
      )
    ] }),
    /* @__PURE__ */ jsx("div", { style: { background: "#f8fafc", borderBottom: "1px solid #e8ecf0", padding: "3rem 1.5rem 2.5rem" }, children: /* @__PURE__ */ jsxs("div", { style: { maxWidth: 760, margin: "0 auto" }, children: [
      category && /* @__PURE__ */ jsx("p", { style: { color: "#94a3b8", fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 10px" }, children: category }),
      /* @__PURE__ */ jsx("h1", { style: { fontSize: "clamp(24px, 4vw, 36px)", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.6px", margin: 0 }, children: title })
    ] }) }),
    /* @__PURE__ */ jsx("main", { style: { flex: 1, padding: "3.5rem 1.5rem" }, children: /* @__PURE__ */ jsx("div", { style: { maxWidth: 760, margin: "0 auto" }, children }) }),
    /* @__PURE__ */ jsx("footer", { style: { background: "#0f172a", padding: "2rem 1.5rem" }, children: /* @__PURE__ */ jsxs("div", { style: { maxWidth: 760, margin: "0 auto", display: "flex", flexWrap: "wrap", gap: "1rem", alignItems: "center", justifyContent: "space-between" }, children: [
      /* @__PURE__ */ jsxs(Link, { to: "/", style: { fontWeight: 700, fontSize: 16, color: "#ffffff", textDecoration: "none" }, children: [
        "Immo",
        /* @__PURE__ */ jsx("span", { style: { color: "#38bdf8" }, children: "Flash" })
      ] }),
      /* @__PURE__ */ jsx("div", { style: { display: "flex", flexWrap: "wrap", gap: "1.25rem" }, children: [
        { label: "Mentions légales", to: "/mentions-legales" },
        { label: "CGU", to: "/cgu" },
        { label: "Confidentialité", to: "/confidentialite" },
        { label: "Cookies", to: "/cookies" },
        { label: "FAQ", to: "/faq" }
      ].map((l) => /* @__PURE__ */ jsx(
        Link,
        {
          to: l.to,
          style: { color: "#475569", fontSize: 13, textDecoration: "none", transition: "color 150ms" },
          onMouseEnter: (e) => e.currentTarget.style.color = "#94a3b8",
          onMouseLeave: (e) => e.currentTarget.style.color = "#475569",
          children: l.label
        },
        l.to
      )) })
    ] }) })
  ] });
}
const faqs = [
  {
    section: "Le produit",
    items: [
      {
        q: "Qu'est-ce qu'ImmoFlash exactement ?",
        a: "ImmoFlash est un logiciel SaaS conçu pour les agences immobilières. Il analyse automatiquement votre portefeuille de biens et votre base de prospects pour générer des correspondances précises — avec un score de 0 à 100, une analyse argumentée, et un email de proposition personnalisé. L'objectif : trouver le bon acheteur pour chaque bien, sans y passer des heures."
      },
      {
        q: "Quelle est la différence entre ImmoFlash et le matching de mon CRM immobilier ?",
        a: "Le matching natif d'un CRM immobilier fonctionne par filtres stricts : si un bien dépasse le budget de 5 % ou a une pièce de moins que demandé, il n'apparaît jamais. ImmoFlash utilise une logique floue propulsée par l'IA : il évalue chaque paire prospect-bien sur des critères objectifs (budget, localisation, surface, pièces) et qualitatifs (notes libres, destination du projet, DPE), puis attribue un score sur 100 avec une analyse argumentée. Il détecte ainsi les opportunités qu'un filtre strict élimine. ImmoFlash ne remplace pas votre CRM : il s'ajoute par-dessus, comme couche d'intelligence dédiée au rapprochement acquéreurs-biens."
      },
      {
        q: "Comment fonctionne le score /100 ?",
        a: "Le score ImmoFlash est calculé en deux parties. Une partie objective (60 points maximum) évalue l'adéquation sur des critères mesurables : budget par rapport au prix du bien, type de bien recherché, localisation souhaitée, surface, nombre de pièces. Une partie qualitative (40 points maximum) est générée par l'IA : elle analyse les notes libres sur le prospect, le DPE, la destination prévue (résidence principale, investissement, rénovation) et d'autres signaux contextuels. Le total donne une vision immédiate des meilleures opportunités à traiter en priorité."
      },
      {
        q: "L'IA peut-elle se tromper ?",
        a: "ImmoFlash est un assistant, pas un décideur. Il propose des scores et des analyses — c'est l'agent qui choisit ce qu'il fait de ces informations. Le système limite les biais grâce à son approche hybride (règles objectives + IA qualitative). Plus vous l'utilisez, plus il s'affine. En pratique, les agents constatent rapidement que les opportunités remontées correspondent à ce qu'ils auraient identifié eux-mêmes — mais en quelques secondes plutôt qu'en plusieurs heures."
      }
    ]
  },
  {
    section: "Mise en place",
    items: [
      {
        q: "ImmoFlash est-il compatible avec Hektor ou Primmo ?",
        a: "Oui. ImmoFlash synchronise automatiquement le catalogue de biens depuis les logiciels Hektor et Primmo, avec une mise à jour toutes les 6 heures. Pour les autres logiciels métier, l'import se fait en quelques minutes depuis un fichier Excel ou CSV. Dans tous les cas, vous conservez votre logiciel actuel : ImmoFlash vient en complément."
      },
      {
        q: "Combien de temps prend la mise en place ?",
        a: "La plupart des agences sont opérationnelles en moins de 24 heures. L'import de vos biens (Excel, CSV ou synchronisation directe) prend en général moins de 10 minutes. La création de vos premiers prospects est guidée. Lors de votre démo, nous le faisons ensemble avec vos données réelles pour que vous voyiez immédiatement les résultats."
      },
      {
        q: "Est-ce que je dois changer mes outils actuels ?",
        a: "Non. ImmoFlash s'intègre à votre flux de travail existant. Vous continuez à utiliser votre logiciel métier pour la gestion courante — ImmoFlash ajoute simplement une couche d'intelligence pour le matching. L'import se fait depuis Excel, CSV ou via synchronisation directe selon votre logiciel."
      },
      {
        q: "Faut-il former toute l'équipe ?",
        a: "La prise en main est rapide — la plupart des agents sont autonomes après une session de 2 heures. Nous accompagnons chaque agence lors du démarrage. Le support est inclus dans tous les plans. L'interface a été conçue avec un seul objectif : qu'un agent immobilier puisse l'utiliser sans formation technique longue."
      }
    ]
  },
  {
    section: "Fonctionnalités",
    items: [
      {
        q: "Les emails générés sont-ils vraiment personnalisés ?",
        a: "Oui. Chaque email est généré spécifiquement pour la paire prospect / bien concernée. Il met en avant les points forts qui correspondent aux critères du prospect, mentionne les points d'attention de manière honnête, et utilise un ton adapté. Le résultat est un email HTML de qualité, prêt à envoyer — ou à relire et ajuster en 30 secondes."
      },
      {
        q: "Puis-je envoyer les emails directement depuis ImmoFlash ?",
        a: "Oui. ImmoFlash inclut un module d'envoi email configuré avec les paramètres SMTP de votre agence. Les emails partent depuis votre adresse, avec votre identité visuelle. Un historique des envois est conservé par prospect."
      },
      {
        q: "Qu'est-ce que l'assistant IA conversationnel ?",
        a: `C'est une interface de dialogue intégrée qui vous permet d'interroger votre portefeuille en langage naturel. Exemples : "Quels prospects ont un budget entre 200k et 300k à Nice ?", "Montre-moi les biens disponibles avec plus de 3 pièces", "Génère un email pour ce prospect et ce bien". Vous n'avez pas besoin de naviguer dans des menus — vous posez la question, ImmoFlash répond.`
      },
      {
        q: "Y a-t-il des rapports et des statistiques ?",
        a: "Oui. ImmoFlash génère des rapports mensuels HTML avec les statistiques de votre agence : nombre de matchings réalisés, taux de conversion, mails envoyés, activité par agent. Ces rapports sont disponibles en téléchargement et peuvent être partagés avec votre direction."
      }
    ]
  },
  {
    section: "Tarifs & engagement",
    items: [
      {
        q: "Combien coûte ImmoFlash ?",
        a: "ImmoFlash propose trois plans, sans engagement : Essentiel à 49 € HT/mois (1 utilisateur, 20 matchings IA par mois), Pro à 89 € HT/mois (jusqu'à 3 agents, matchings et emails illimités) et Réseau à 179 € HT/mois (jusqu'à 10 agents, questions à l'agent IA illimitées). Un essai gratuit de 10 jours est disponible, sans carte bancaire, avec toutes les fonctionnalités du plan Pro."
      },
      {
        q: "Y a-t-il un engagement minimum ?",
        a: "Nos plans sont disponibles au mois, sans engagement minimum. Vous pouvez passer à un plan supérieur ou inférieur à tout moment. Un engagement annuel est possible et permet de bénéficier d'un tarif préférentiel — contactez-nous pour en discuter."
      },
      {
        q: "Comment fonctionne l'essai gratuit ?",
        a: "L'essai dure 10 jours, sans carte bancaire. Pendant cette période, vous avez accès à toutes les fonctionnalités du plan Pro avec vos données réelles. À l'issue de l'essai, vous choisissez le plan adapté ou vous nous contactez pour prolonger si vous avez besoin de plus de temps."
      },
      {
        q: "Que se passe-t-il si je dépasse le quota de matchings ?",
        a: "Sur le plan Essentiel, au-delà des 20 matchings inclus, vous pouvez passer au plan Pro à tout moment. Nous vous prévenons par email avant d'atteindre la limite — aucune interruption de service ne survient sans votre accord."
      },
      {
        q: "Une vente couvre-t-elle vraiment l'abonnement ?",
        a: "Dans l'immense majorité des cas, oui. Une commission moyenne sur une vente immobilière en France représente plusieurs milliers d'euros. Notre plan Pro est à 89 € HT par mois — soit environ 1 070 € par an. Si ImmoFlash permet à votre agence de conclure une vente supplémentaire dans l'année grâce à un rapprochement qu'elle aurait raté, l'investissement est largement amorti."
      }
    ]
  },
  {
    section: "Données & sécurité",
    items: [
      {
        q: "Mes données sont-elles sécurisées ?",
        a: "Les données de votre agence sont stockées dans une base de données isolée — chaque agence dispose de sa propre instance, séparée des autres. Les accès sont protégés par authentification JWT. Toutes les communications sont chiffrées (HTTPS). Nous n'utilisons pas vos données pour entraîner des modèles ou les transmettre à des tiers."
      },
      {
        q: "Qui a accès aux données de mon agence ?",
        a: "Uniquement les utilisateurs que vous créez dans votre espace ImmoFlash. Les rôles (Admin, Agent) permettent de définir les niveaux d'accès. L'équipe ImmoFlash peut accéder aux données en cas de demande de support technique, avec votre accord explicite."
      },
      {
        q: "Que se passe-t-il si j'arrête mon abonnement ?",
        a: "Vos données restent accessibles pendant 30 jours après la fin de votre abonnement, le temps de les exporter si besoin. Après cette période, elles sont supprimées définitivement. Nous vous fournissons un export complet en CSV sur simple demande."
      }
    ]
  }
];
function AccordionItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return /* @__PURE__ */ jsxs("div", { style: { borderBottom: "1px solid #e8ecf0" }, children: [
    /* @__PURE__ */ jsxs(
      "button",
      {
        onClick: () => setOpen(!open),
        style: {
          width: "100%",
          textAlign: "left",
          padding: "1.1rem 0",
          background: "none",
          border: "none",
          cursor: "pointer",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 16
        },
        children: [
          /* @__PURE__ */ jsx("span", { style: { fontSize: 16, fontWeight: 600, color: "#0f172a", lineHeight: 1.45 }, children: q }),
          /* @__PURE__ */ jsx("span", { style: {
            flexShrink: 0,
            fontSize: 20,
            color: "#94a3b8",
            lineHeight: 1,
            transform: open ? "rotate(45deg)" : "rotate(0deg)",
            transition: "transform 200ms ease"
          }, children: "+" })
        ]
      }
    ),
    /* @__PURE__ */ jsx("p", { style: {
      display: open ? "block" : "none",
      color: "#64748b",
      fontSize: 15,
      lineHeight: 1.75,
      margin: "0 0 1.1rem",
      paddingRight: 32
    }, children: a })
  ] });
}
function FAQ() {
  return /* @__PURE__ */ jsxs(PageLayout, { title: "Questions fréquentes", category: "FAQ", children: [
    /* @__PURE__ */ jsxs("p", { style: { color: "#64748b", fontSize: 16, lineHeight: 1.7, margin: "0 0 3rem" }, children: [
      "Vous avez une question sur ImmoFlash ? Vous trouverez probablement la réponse ici. Sinon, écrivez-nous à",
      " ",
      /* @__PURE__ */ jsx("a", { href: "mailto:contact@immoflash.app", style: { color: "#1E3A5F", fontWeight: 600, textDecoration: "none" }, children: "contact@immoflash.app" }),
      "."
    ] }),
    faqs.map((section) => /* @__PURE__ */ jsxs("div", { style: { marginBottom: "3rem" }, children: [
      /* @__PURE__ */ jsx("h2", { style: { fontSize: 14, fontWeight: 700, color: "#1E3A5F", letterSpacing: "0.07em", textTransform: "uppercase", margin: "0 0 0.5rem" }, children: section.section }),
      section.items.map((item) => /* @__PURE__ */ jsx(AccordionItem, { q: item.q, a: item.a }, item.q))
    ] }, section.section)),
    /* @__PURE__ */ jsxs("div", { style: {
      marginTop: "3rem",
      padding: "2rem",
      background: "#f8fafc",
      border: "1px solid #e8ecf0",
      borderRadius: 12,
      textAlign: "center"
    }, children: [
      /* @__PURE__ */ jsx("p", { style: { fontWeight: 700, color: "#0f172a", fontSize: 17, margin: "0 0 0.5rem" }, children: "Vous ne trouvez pas votre réponse ?" }),
      /* @__PURE__ */ jsx("p", { style: { color: "#64748b", fontSize: 15, margin: "0 0 1.25rem" }, children: "Notre équipe répond sous 24h." }),
      /* @__PURE__ */ jsx(
        "a",
        {
          href: "mailto:contact@immoflash.app",
          className: "btn-primary",
          style: { display: "inline-flex", alignItems: "center", gap: 8, padding: "11px 24px", fontSize: 14 },
          children: "Nous écrire"
        }
      )
    ] })
  ] });
}
const S$4 = ({ children }) => /* @__PURE__ */ jsx("h2", { style: { fontSize: 17, fontWeight: 700, color: "#0f172a", margin: "2.5rem 0 0.75rem", letterSpacing: "-0.2px" }, children });
const P$5 = ({ children }) => /* @__PURE__ */ jsx("p", { style: { color: "#475569", fontSize: 15, lineHeight: 1.75, margin: "0 0 0.75rem" }, children });
function MentionsLegales() {
  return /* @__PURE__ */ jsxs(PageLayout, { title: "Mentions légales", category: "Légal", children: [
    /* @__PURE__ */ jsx(P$5, { children: "Conformément aux dispositions de la loi n° 2004-575 du 21 juin 2004 pour la confiance en l'économie numérique, les informations suivantes sont portées à la connaissance des utilisateurs du site ImmoFlash." }),
    /* @__PURE__ */ jsx(S$4, { children: "Éditeur du site" }),
    /* @__PURE__ */ jsxs(P$5, { children: [
      /* @__PURE__ */ jsx("strong", { children: "Bendiaf Noa" }),
      /* @__PURE__ */ jsx("br", {}),
      "Entrepreneur Individuel",
      /* @__PURE__ */ jsx("br", {}),
      "Nom commercial : Nowa",
      /* @__PURE__ */ jsx("br", {}),
      "8 Impasse des Sangliers",
      /* @__PURE__ */ jsx("br", {}),
      "83440 Montauroux — France",
      /* @__PURE__ */ jsx("br", {}),
      /* @__PURE__ */ jsx("br", {}),
      "SIRET : 990 077 331 00017",
      /* @__PURE__ */ jsx("br", {}),
      "SIREN : 990 077 331",
      /* @__PURE__ */ jsx("br", {}),
      "Code APE : 6201Z — Programmation informatique",
      /* @__PURE__ */ jsx("br", {}),
      "Immatriculé au Registre National des Entreprises depuis le 06/08/2025",
      /* @__PURE__ */ jsx("br", {}),
      /* @__PURE__ */ jsx("br", {}),
      "Email : ",
      /* @__PURE__ */ jsx("a", { href: "mailto:contact@immoflash.app", style: { color: "#1E3A5F", fontWeight: 600 }, children: "contact@immoflash.app" })
    ] }),
    /* @__PURE__ */ jsx(S$4, { children: "Directeur de la publication" }),
    /* @__PURE__ */ jsx(P$5, { children: "Bendiaf Noa — contact@immoflash.app" }),
    /* @__PURE__ */ jsx(S$4, { children: "Hébergement" }),
    /* @__PURE__ */ jsxs(P$5, { children: [
      "Le site ImmoFlash est hébergé par :",
      /* @__PURE__ */ jsx("br", {}),
      /* @__PURE__ */ jsx("strong", { children: "Hetzner Online GmbH" }),
      /* @__PURE__ */ jsx("br", {}),
      "Industriestr. 25",
      /* @__PURE__ */ jsx("br", {}),
      "91710 Gunzenhausen — Allemagne",
      /* @__PURE__ */ jsx("br", {}),
      /* @__PURE__ */ jsx("a", { href: "https://www.hetzner.com", target: "_blank", rel: "noopener noreferrer", style: { color: "#1E3A5F", fontWeight: 600 }, children: "www.hetzner.com" })
    ] }),
    /* @__PURE__ */ jsx(S$4, { children: "Propriété intellectuelle" }),
    /* @__PURE__ */ jsx(P$5, { children: "L'ensemble du contenu de ce site (textes, images, graphismes, logo, icônes, algorithmes…) est la propriété exclusive de Bendiaf Noa / ImmoFlash, à l'exception des marques, logos ou contenus appartenant à d'autres sociétés partenaires ou auteurs." }),
    /* @__PURE__ */ jsx(P$5, { children: "Toute reproduction, représentation, modification, publication ou adaptation de tout ou partie des éléments du site, quel que soit le moyen ou le procédé utilisé, est interdite sans autorisation écrite préalable de l'éditeur." }),
    /* @__PURE__ */ jsx(S$4, { children: "Données personnelles" }),
    /* @__PURE__ */ jsx(P$5, { children: "Les informations recueillies sur ce site font l'objet d'un traitement informatique destiné à la gestion des demandes de démonstration et à la relation commerciale. Conformément au Règlement Général sur la Protection des Données (RGPD), vous disposez d'un droit d'accès, de rectification, de portabilité et d'effacement de vos données." }),
    /* @__PURE__ */ jsxs(P$5, { children: [
      "Pour exercer ces droits : ",
      /* @__PURE__ */ jsx("a", { href: "mailto:contact@immoflash.app", style: { color: "#1E3A5F", fontWeight: 600 }, children: "contact@immoflash.app" })
    ] }),
    /* @__PURE__ */ jsxs(P$5, { children: [
      "Pour plus d'informations, consultez notre",
      " ",
      /* @__PURE__ */ jsx("a", { href: "/confidentialite", style: { color: "#1E3A5F", fontWeight: 600 }, children: "Politique de confidentialité" }),
      "."
    ] }),
    /* @__PURE__ */ jsx(S$4, { children: "Cookies" }),
    /* @__PURE__ */ jsxs(P$5, { children: [
      "Ce site utilise des cookies à des fins de fonctionnement et d'analyse d'audience.",
      " ",
      /* @__PURE__ */ jsx("a", { href: "/cookies", style: { color: "#1E3A5F", fontWeight: 600 }, children: "En savoir plus" }),
      "."
    ] }),
    /* @__PURE__ */ jsx(S$4, { children: "Droit applicable et juridiction" }),
    /* @__PURE__ */ jsx(P$5, { children: "Tout litige en relation avec l'utilisation du site ImmoFlash est soumis au droit français. En dehors des cas où la loi ne le permet pas, il est fait attribution exclusive de juridiction aux tribunaux compétents." }),
    /* @__PURE__ */ jsx("p", { style: { color: "#94a3b8", fontSize: 13, marginTop: "3rem", fontStyle: "italic" }, children: "Dernière mise à jour : avril 2026" })
  ] });
}
const S$3 = ({ children }) => /* @__PURE__ */ jsx("h2", { style: { fontSize: 17, fontWeight: 700, color: "#0f172a", margin: "2.5rem 0 0.75rem", letterSpacing: "-0.2px" }, children });
const P$4 = ({ children }) => /* @__PURE__ */ jsx("p", { style: { color: "#475569", fontSize: 15, lineHeight: 1.75, margin: "0 0 0.75rem" }, children });
const Li$3 = ({ children }) => /* @__PURE__ */ jsx("li", { style: { color: "#475569", fontSize: 15, lineHeight: 1.75, marginBottom: 8 }, children });
function CGU() {
  return /* @__PURE__ */ jsxs(PageLayout, { title: "Conditions Générales d'Utilisation", category: "Légal", children: [
    /* @__PURE__ */ jsx(P$4, { children: "Les présentes Conditions Générales d'Utilisation (CGU) régissent l'accès et l'utilisation de la plateforme ImmoFlash, accessible à l'adresse immoflash.app, éditée par ImmoFlash." }),
    /* @__PURE__ */ jsx(P$4, { children: "En utilisant ImmoFlash, vous acceptez sans réserve les présentes conditions." }),
    /* @__PURE__ */ jsx(S$3, { children: "1. Description du service" }),
    /* @__PURE__ */ jsx(P$4, { children: "ImmoFlash est une plateforme SaaS (Software as a Service) permettant aux agences immobilières de :" }),
    /* @__PURE__ */ jsxs("ul", { style: { paddingLeft: 20, margin: "0 0 0.75rem" }, children: [
      /* @__PURE__ */ jsx(Li$3, { children: "Importer et gérer leur portefeuille de biens immobiliers ;" }),
      /* @__PURE__ */ jsx(Li$3, { children: "Gérer leur base de prospects acheteurs ;" }),
      /* @__PURE__ */ jsx(Li$3, { children: "Générer des matchings automatisés scorés entre prospects et biens ;" }),
      /* @__PURE__ */ jsx(Li$3, { children: "Générer et envoyer des emails personnalisés ;" }),
      /* @__PURE__ */ jsx(Li$3, { children: "Consulter des rapports et statistiques d'activité." })
    ] }),
    /* @__PURE__ */ jsx(S$3, { children: "2. Accès au service" }),
    /* @__PURE__ */ jsx(P$4, { children: "L'accès à ImmoFlash est réservé aux professionnels de l'immobilier ayant souscrit à l'un des plans proposés. Un essai gratuit de 10 jours est disponible sans engagement." }),
    /* @__PURE__ */ jsx(P$4, { children: "Chaque compte est associé à une agence. L'utilisateur est responsable de la confidentialité de ses identifiants de connexion." }),
    /* @__PURE__ */ jsx(S$3, { children: "3. Conditions financières" }),
    /* @__PURE__ */ jsxs(P$4, { children: [
      "ImmoFlash est proposé selon trois plans tarifaires (Starter, Pro, Agence+), dont les prix et les fonctionnalités sont détaillés sur la page ",
      /* @__PURE__ */ jsx("a", { href: "/#pricing", style: { color: "#1E3A5F", fontWeight: 600 }, children: "Tarifs" }),
      "."
    ] }),
    /* @__PURE__ */ jsx(P$4, { children: "Les abonnements sont facturés mensuellement ou annuellement selon le choix de l'utilisateur. Les prix sont exprimés hors taxes. La TVA applicable est celle en vigueur au moment de la facturation." }),
    /* @__PURE__ */ jsx(P$4, { children: "Aucun remboursement n'est accordé pour les périodes entamées, sauf disposition légale contraire." }),
    /* @__PURE__ */ jsx(S$3, { children: "4. Obligations de l'utilisateur" }),
    /* @__PURE__ */ jsx(P$4, { children: "L'utilisateur s'engage à :" }),
    /* @__PURE__ */ jsxs("ul", { style: { paddingLeft: 20, margin: "0 0 0.75rem" }, children: [
      /* @__PURE__ */ jsx(Li$3, { children: "Utiliser ImmoFlash dans le cadre légal applicable à son activité professionnelle ;" }),
      /* @__PURE__ */ jsx(Li$3, { children: "Ne pas partager ses identifiants avec des tiers non autorisés ;" }),
      /* @__PURE__ */ jsx(Li$3, { children: "Ne pas tenter de contourner les mesures de sécurité de la plateforme ;" }),
      /* @__PURE__ */ jsx(Li$3, { children: "Respecter les droits des tiers, notamment en matière de données personnelles de ses propres clients ;" }),
      /* @__PURE__ */ jsx(Li$3, { children: "Ne pas utiliser ImmoFlash à des fins illicites, frauduleuses ou contraires aux présentes CGU." })
    ] }),
    /* @__PURE__ */ jsx(S$3, { children: "5. Données utilisateurs et analyse comportementale" }),
    /* @__PURE__ */ jsx(P$4, { children: "Les données importées dans ImmoFlash (biens, prospects, coordonnées) restent la propriété de l'agence utilisatrice. ImmoFlash s'engage à ne pas les utiliser à d'autres fins que la fourniture du service." }),
    /* @__PURE__ */ jsx(P$4, { children: "L'agence est responsable de la licéité des données qu'elle importe, notamment au regard du RGPD pour les données personnelles de ses prospects." }),
    /* @__PURE__ */ jsx(P$4, { children: "À des fins d'amélioration du service, ImmoFlash utilise un outil d'analyse comportementale (PostHog) qui enregistre les interactions des utilisateurs avec la plateforme (clics, navigation, durée de session). Ces données sont utilisées exclusivement pour améliorer l'ergonomie et la qualité du service. Aucune donnée saisie dans les formulaires (coordonnées, données prospects) n'est collectée par cet outil." }),
    /* @__PURE__ */ jsx(S$3, { children: "6. Disponibilité du service" }),
    /* @__PURE__ */ jsx(P$4, { children: "ImmoFlash s'engage à maintenir le service disponible 24h/24 et 7j/7, sous réserve de maintenances programmées communiquées à l'avance. Des interruptions ponctuelles peuvent survenir pour cause de maintenance ou d'incidents techniques. ImmoFlash ne pourra être tenu responsable des conséquences d'une indisponibilité temporaire." }),
    /* @__PURE__ */ jsx(S$3, { children: "7. Propriété intellectuelle" }),
    /* @__PURE__ */ jsx(P$4, { children: "L'ensemble des éléments constitutifs de la plateforme ImmoFlash (code, design, algorithmes, modèles d'IA, marque) sont la propriété exclusive d'ImmoFlash et sont protégés par les lois relatives à la propriété intellectuelle." }),
    /* @__PURE__ */ jsx(P$4, { children: "L'utilisateur dispose d'un droit d'utilisation non exclusif et non transférable de la plateforme, limité à la durée de son abonnement." }),
    /* @__PURE__ */ jsx(S$3, { children: "8. Limitation de responsabilité" }),
    /* @__PURE__ */ jsx(P$4, { children: "ImmoFlash est un outil d'aide à la décision. Les scores et recommandations générés sont fournis à titre indicatif. L'utilisateur demeure seul responsable des décisions commerciales prises sur la base des informations fournies par la plateforme." }),
    /* @__PURE__ */ jsx(P$4, { children: "La responsabilité d'ImmoFlash ne pourra pas être engagée pour des pertes commerciales indirectes liées à l'utilisation ou à la non-utilisation du service." }),
    /* @__PURE__ */ jsx(S$3, { children: "9. Résiliation" }),
    /* @__PURE__ */ jsx(P$4, { children: "L'utilisateur peut résilier son abonnement à tout moment depuis son espace de compte. La résiliation prend effet à la fin de la période de facturation en cours." }),
    /* @__PURE__ */ jsx(P$4, { children: "ImmoFlash se réserve le droit de suspendre ou résilier un compte en cas de violation des présentes CGU, sans préavis ni remboursement." }),
    /* @__PURE__ */ jsx(S$3, { children: "10. Modification des CGU" }),
    /* @__PURE__ */ jsx(P$4, { children: "ImmoFlash se réserve le droit de modifier les présentes CGU à tout moment. Les utilisateurs sont informés par email de toute modification substantielle. La poursuite de l'utilisation du service après notification vaut acceptation des nouvelles conditions." }),
    /* @__PURE__ */ jsx(S$3, { children: "11. Droit applicable" }),
    /* @__PURE__ */ jsx(P$4, { children: "Les présentes CGU sont soumises au droit français. Tout litige relatif à leur interprétation ou exécution relève de la compétence exclusive des tribunaux français." }),
    /* @__PURE__ */ jsx("p", { style: { color: "#94a3b8", fontSize: 13, marginTop: "3rem", fontStyle: "italic" }, children: "Dernière mise à jour : mai 2026" })
  ] });
}
const S$2 = ({ children }) => /* @__PURE__ */ jsx("h2", { style: { fontSize: 17, fontWeight: 700, color: "#0f172a", margin: "2.5rem 0 0.75rem", letterSpacing: "-0.2px" }, children });
const P$3 = ({ children }) => /* @__PURE__ */ jsx("p", { style: { color: "#475569", fontSize: 15, lineHeight: 1.75, margin: "0 0 0.75rem" }, children });
const Li$2 = ({ children }) => /* @__PURE__ */ jsx("li", { style: { color: "#475569", fontSize: 15, lineHeight: 1.75, marginBottom: 8 }, children });
function Confidentialite() {
  return /* @__PURE__ */ jsxs(PageLayout, { title: "Politique de confidentialité", category: "Légal", children: [
    /* @__PURE__ */ jsx(P$3, { children: "ImmoFlash attache une grande importance à la protection de vos données personnelles. Cette politique explique quelles données nous collectons, comment nous les utilisons, et quels sont vos droits." }),
    /* @__PURE__ */ jsx(P$3, { children: "Elle s'applique à toute personne utilisant la plateforme ImmoFlash ou contactant ImmoFlash via notre site." }),
    /* @__PURE__ */ jsx(S$2, { children: "1. Responsable du traitement" }),
    /* @__PURE__ */ jsxs(P$3, { children: [
      "Le responsable du traitement des données collectées via ImmoFlash est l'éditeur du site. Contact : ",
      /* @__PURE__ */ jsx("a", { href: "mailto:contact@immoflash.app", style: { color: "#1E3A5F", fontWeight: 600 }, children: "contact@immoflash.app" })
    ] }),
    /* @__PURE__ */ jsx(S$2, { children: "2. Données collectées" }),
    /* @__PURE__ */ jsx(P$3, { children: "Nous collectons les données suivantes :" }),
    /* @__PURE__ */ jsxs("ul", { style: { paddingLeft: 20, margin: "0 0 0.75rem" }, children: [
      /* @__PURE__ */ jsxs(Li$2, { children: [
        /* @__PURE__ */ jsx("strong", { children: "Données de compte" }),
        " : nom, prénom, email professionnel, nom de l'agence, lors de la création d'un compte ou d'une demande de démo."
      ] }),
      /* @__PURE__ */ jsxs(Li$2, { children: [
        /* @__PURE__ */ jsx("strong", { children: "Données d'utilisation" }),
        " : pages visitées, fonctionnalités utilisées, matchings réalisés, logs de connexion — à des fins d'amélioration du service et de sécurité."
      ] }),
      /* @__PURE__ */ jsxs(Li$2, { children: [
        /* @__PURE__ */ jsx("strong", { children: "Données de contact" }),
        " : messages envoyés via le formulaire de contact ou par email."
      ] }),
      /* @__PURE__ */ jsxs(Li$2, { children: [
        /* @__PURE__ */ jsx("strong", { children: "Données de facturation" }),
        " : pour la gestion des abonnements (traitées via notre prestataire de paiement sécurisé)."
      ] })
    ] }),
    /* @__PURE__ */ jsx(P$3, { children: "Nous ne collectons aucune donnée sensible au sens de l'article 9 du RGPD." }),
    /* @__PURE__ */ jsx(S$2, { children: "3. Données des prospects de vos agences" }),
    /* @__PURE__ */ jsx(P$3, { children: "Les données de prospects et de biens que vous importez dans ImmoFlash restent sous votre responsabilité en tant que responsable de traitement. ImmoFlash agit en qualité de sous-traitant au sens du RGPD pour ces données." }),
    /* @__PURE__ */ jsx(P$3, { children: "En tant qu'agence utilisatrice, vous êtes responsable d'informer vos prospects de l'existence d'un traitement automatisé de leurs données et de recueillir leur consentement si nécessaire." }),
    /* @__PURE__ */ jsx(S$2, { children: "4. Finalités du traitement" }),
    /* @__PURE__ */ jsx(P$3, { children: "Vos données sont utilisées pour :" }),
    /* @__PURE__ */ jsxs("ul", { style: { paddingLeft: 20, margin: "0 0 0.75rem" }, children: [
      /* @__PURE__ */ jsx(Li$2, { children: "Créer et gérer votre compte ImmoFlash ;" }),
      /* @__PURE__ */ jsx(Li$2, { children: "Fournir les fonctionnalités de la plateforme (matching, génération d'emails, rapports) ;" }),
      /* @__PURE__ */ jsx(Li$2, { children: "Vous envoyer des communications relatives à votre abonnement et au service ;" }),
      /* @__PURE__ */ jsx(Li$2, { children: "Améliorer le produit et assurer sa sécurité ;" }),
      /* @__PURE__ */ jsx(Li$2, { children: "Respecter nos obligations légales." })
    ] }),
    /* @__PURE__ */ jsx(S$2, { children: "5. Base légale des traitements" }),
    /* @__PURE__ */ jsxs("ul", { style: { paddingLeft: 20, margin: "0 0 0.75rem" }, children: [
      /* @__PURE__ */ jsxs(Li$2, { children: [
        /* @__PURE__ */ jsx("strong", { children: "Exécution du contrat" }),
        " : pour la gestion de votre compte et la fourniture du service ;"
      ] }),
      /* @__PURE__ */ jsxs(Li$2, { children: [
        /* @__PURE__ */ jsx("strong", { children: "Intérêt légitime" }),
        " : pour l'amélioration du service et la sécurité ;"
      ] }),
      /* @__PURE__ */ jsxs(Li$2, { children: [
        /* @__PURE__ */ jsx("strong", { children: "Consentement" }),
        " : pour les communications marketing (vous pouvez vous désabonner à tout moment) ;"
      ] }),
      /* @__PURE__ */ jsxs(Li$2, { children: [
        /* @__PURE__ */ jsx("strong", { children: "Obligation légale" }),
        " : pour la conservation des données de facturation."
      ] })
    ] }),
    /* @__PURE__ */ jsx(S$2, { children: "6. Durée de conservation" }),
    /* @__PURE__ */ jsxs("ul", { style: { paddingLeft: 20, margin: "0 0 0.75rem" }, children: [
      /* @__PURE__ */ jsxs(Li$2, { children: [
        /* @__PURE__ */ jsx("strong", { children: "Données de compte actif" }),
        " : pendant la durée de l'abonnement + 30 jours après résiliation ;"
      ] }),
      /* @__PURE__ */ jsxs(Li$2, { children: [
        /* @__PURE__ */ jsx("strong", { children: "Données de facturation" }),
        " : 10 ans (obligation légale) ;"
      ] }),
      /* @__PURE__ */ jsxs(Li$2, { children: [
        /* @__PURE__ */ jsx("strong", { children: "Données de contact" }),
        " : 3 ans après le dernier contact."
      ] })
    ] }),
    /* @__PURE__ */ jsx(S$2, { children: "7. Partage des données" }),
    /* @__PURE__ */ jsx(P$3, { children: "ImmoFlash ne vend, ne loue et ne partage pas vos données personnelles à des tiers à des fins commerciales." }),
    /* @__PURE__ */ jsx(P$3, { children: "Vos données peuvent être partagées avec :" }),
    /* @__PURE__ */ jsxs("ul", { style: { paddingLeft: 20, margin: "0 0 0.75rem" }, children: [
      /* @__PURE__ */ jsxs(Li$2, { children: [
        /* @__PURE__ */ jsx("strong", { children: "Anthropic (Claude AI)" }),
        " : pour la génération d'analyses qualitatives et d'emails. Les données transmises sont anonymisées et ne servent pas à l'entraînement de modèles selon les conditions d'utilisation de l'API."
      ] }),
      /* @__PURE__ */ jsxs(Li$2, { children: [
        /* @__PURE__ */ jsx("strong", { children: "Notre hébergeur" }),
        " : pour le stockage des données."
      ] }),
      /* @__PURE__ */ jsxs(Li$2, { children: [
        /* @__PURE__ */ jsx("strong", { children: "Notre prestataire de paiement" }),
        " : pour la gestion des abonnements."
      ] })
    ] }),
    /* @__PURE__ */ jsx(P$3, { children: "Tous nos sous-traitants sont soumis à des obligations contractuelles de confidentialité et de sécurité." }),
    /* @__PURE__ */ jsx(S$2, { children: "8. Sécurité" }),
    /* @__PURE__ */ jsx(P$3, { children: "Nous mettons en œuvre des mesures techniques et organisationnelles adaptées pour protéger vos données : chiffrement des communications (HTTPS/TLS), isolation des bases de données par agence, authentification sécurisée (JWT), sauvegardes régulières." }),
    /* @__PURE__ */ jsx(S$2, { children: "9. Vos droits" }),
    /* @__PURE__ */ jsx(P$3, { children: "Conformément au RGPD, vous disposez des droits suivants sur vos données personnelles :" }),
    /* @__PURE__ */ jsxs("ul", { style: { paddingLeft: 20, margin: "0 0 0.75rem" }, children: [
      /* @__PURE__ */ jsxs(Li$2, { children: [
        /* @__PURE__ */ jsx("strong", { children: "Droit d'accès" }),
        " : obtenir une copie de vos données ;"
      ] }),
      /* @__PURE__ */ jsxs(Li$2, { children: [
        /* @__PURE__ */ jsx("strong", { children: "Droit de rectification" }),
        " : corriger des données inexactes ;"
      ] }),
      /* @__PURE__ */ jsxs(Li$2, { children: [
        /* @__PURE__ */ jsx("strong", { children: "Droit à l'effacement" }),
        " : demander la suppression de vos données ;"
      ] }),
      /* @__PURE__ */ jsxs(Li$2, { children: [
        /* @__PURE__ */ jsx("strong", { children: "Droit à la portabilité" }),
        " : recevoir vos données dans un format structuré ;"
      ] }),
      /* @__PURE__ */ jsxs(Li$2, { children: [
        /* @__PURE__ */ jsx("strong", { children: "Droit d'opposition" }),
        " : vous opposer à certains traitements ;"
      ] }),
      /* @__PURE__ */ jsxs(Li$2, { children: [
        /* @__PURE__ */ jsx("strong", { children: "Droit à la limitation" }),
        " : demander la suspension temporaire d'un traitement."
      ] })
    ] }),
    /* @__PURE__ */ jsxs(P$3, { children: [
      "Pour exercer ces droits, contactez-nous à",
      " ",
      /* @__PURE__ */ jsx("a", { href: "mailto:contact@immoflash.app", style: { color: "#1E3A5F", fontWeight: 600 }, children: "contact@immoflash.app" }),
      ". Nous répondons dans un délai maximum d'un mois."
    ] }),
    /* @__PURE__ */ jsxs(P$3, { children: [
      "Vous avez également le droit d'introduire une réclamation auprès de la CNIL (",
      /* @__PURE__ */ jsx("a", { href: "https://www.cnil.fr", target: "_blank", rel: "noopener noreferrer", style: { color: "#1E3A5F", fontWeight: 600 }, children: "www.cnil.fr" }),
      ")."
    ] }),
    /* @__PURE__ */ jsx(S$2, { children: "10. Cookies" }),
    /* @__PURE__ */ jsxs(P$3, { children: [
      "Pour toute information sur les cookies utilisés par ce site, consultez notre",
      " ",
      /* @__PURE__ */ jsx("a", { href: "/cookies", style: { color: "#1E3A5F", fontWeight: 600 }, children: "Politique de cookies" }),
      "."
    ] }),
    /* @__PURE__ */ jsx(S$2, { children: "11. Modifications" }),
    /* @__PURE__ */ jsx(P$3, { children: "Cette politique peut être mise à jour. En cas de modification substantielle, vous serez informé par email ou via une notification sur la plateforme." }),
    /* @__PURE__ */ jsx("p", { style: { color: "#94a3b8", fontSize: 13, marginTop: "3rem", fontStyle: "italic" }, children: "Dernière mise à jour : avril 2026" })
  ] });
}
const S$1 = ({ children }) => /* @__PURE__ */ jsx("h2", { style: { fontSize: 17, fontWeight: 700, color: "#0f172a", margin: "2.5rem 0 0.75rem", letterSpacing: "-0.2px" }, children });
const P$2 = ({ children }) => /* @__PURE__ */ jsx("p", { style: { color: "#475569", fontSize: 15, lineHeight: 1.75, margin: "0 0 0.75rem" }, children });
const cookieTable = [
  { name: "Session (JWT)", type: "Fonctionnel", purpose: "Maintien de la session utilisateur authentifiée", duration: "Durée de la session", tiers: "Non" },
  { name: "Préférences", type: "Fonctionnel", purpose: "Mémorisation des préférences d'affichage", duration: "12 mois", tiers: "Non" },
  { name: "Analyse", type: "Analytique", purpose: "Mesure d'audience anonymisée (pages vues, parcours)", duration: "13 mois", tiers: "Possible" }
];
function Cookies() {
  return /* @__PURE__ */ jsxs(PageLayout, { title: "Politique de cookies", category: "Légal", children: [
    /* @__PURE__ */ jsx(P$2, { children: "Un cookie est un petit fichier texte déposé sur votre terminal (ordinateur, mobile, tablette) lors de la visite d'un site. Il permet de mémoriser des informations relatives à votre navigation." }),
    /* @__PURE__ */ jsx(P$2, { children: "Cette page explique quels cookies ImmoFlash utilise, pourquoi, et comment vous pouvez les gérer." }),
    /* @__PURE__ */ jsx(S$1, { children: "Cookies utilisés" }),
    /* @__PURE__ */ jsx("div", { style: { overflowX: "auto", margin: "0 0 1.5rem" }, children: /* @__PURE__ */ jsxs("table", { style: { width: "100%", borderCollapse: "collapse", fontSize: 14 }, children: [
      /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsx("tr", { style: { background: "#f8fafc" }, children: ["Nom", "Type", "Finalité", "Durée", "Tiers"].map((h) => /* @__PURE__ */ jsx("th", { style: { textAlign: "left", padding: "10px 14px", fontWeight: 600, color: "#0f172a", borderBottom: "2px solid #e2e8f0", whiteSpace: "nowrap" }, children: h }, h)) }) }),
      /* @__PURE__ */ jsx("tbody", { children: cookieTable.map((row, i) => /* @__PURE__ */ jsxs("tr", { style: { borderBottom: "1px solid #f1f5f9" }, children: [
        /* @__PURE__ */ jsx("td", { style: { padding: "10px 14px", color: "#0f172a", fontWeight: 500 }, children: row.name }),
        /* @__PURE__ */ jsx("td", { style: { padding: "10px 14px", color: "#64748b" }, children: /* @__PURE__ */ jsx("span", { style: {
          display: "inline-block",
          padding: "2px 8px",
          borderRadius: 4,
          fontSize: 12,
          fontWeight: 600,
          background: row.type === "Fonctionnel" ? "#eff6ff" : "#fef9c3",
          color: row.type === "Fonctionnel" ? "#1E3A5F" : "#92400e"
        }, children: row.type }) }),
        /* @__PURE__ */ jsx("td", { style: { padding: "10px 14px", color: "#64748b" }, children: row.purpose }),
        /* @__PURE__ */ jsx("td", { style: { padding: "10px 14px", color: "#64748b", whiteSpace: "nowrap" }, children: row.duration }),
        /* @__PURE__ */ jsx("td", { style: { padding: "10px 14px", color: "#64748b" }, children: row.tiers })
      ] }, i)) })
    ] }) }),
    /* @__PURE__ */ jsx(S$1, { children: "Cookies strictement nécessaires" }),
    /* @__PURE__ */ jsx(P$2, { children: "Ces cookies sont indispensables au fonctionnement de la plateforme ImmoFlash (authentification, sécurité, préférences essentielles). Ils ne peuvent pas être désactivés sans empêcher l'utilisation du service." }),
    /* @__PURE__ */ jsx(S$1, { children: "Cookies analytiques" }),
    /* @__PURE__ */ jsx(P$2, { children: "Ces cookies nous permettent de mesurer l'audience de notre site et d'améliorer l'expérience utilisateur. Les données collectées sont anonymisées — elles ne permettent pas de vous identifier personnellement." }),
    /* @__PURE__ */ jsx(P$2, { children: "Conformément aux recommandations de la CNIL, nous utilisons ces cookies sans recueillir votre consentement préalable dès lors qu'ils servent exclusivement à la production de statistiques anonymes." }),
    /* @__PURE__ */ jsx(S$1, { children: "Cookies tiers" }),
    /* @__PURE__ */ jsx(P$2, { children: "ImmoFlash ne dépose pas de cookies publicitaires ou de tracking de tiers à des fins commerciales." }),
    /* @__PURE__ */ jsx(S$1, { children: "Comment gérer vos cookies" }),
    /* @__PURE__ */ jsx(P$2, { children: "Vous pouvez à tout moment configurer votre navigateur pour refuser ou supprimer les cookies. La procédure varie selon le navigateur :" }),
    /* @__PURE__ */ jsxs("ul", { style: { paddingLeft: 20, margin: "0 0 1rem", color: "#475569", fontSize: 15, lineHeight: 1.75 }, children: [
      /* @__PURE__ */ jsxs("li", { style: { marginBottom: 6 }, children: [
        /* @__PURE__ */ jsx("strong", { children: "Chrome" }),
        " : Paramètres → Confidentialité et sécurité → Cookies et autres données des sites"
      ] }),
      /* @__PURE__ */ jsxs("li", { style: { marginBottom: 6 }, children: [
        /* @__PURE__ */ jsx("strong", { children: "Firefox" }),
        " : Paramètres → Vie privée et sécurité → Cookies et données du site"
      ] }),
      /* @__PURE__ */ jsxs("li", { style: { marginBottom: 6 }, children: [
        /* @__PURE__ */ jsx("strong", { children: "Safari" }),
        " : Préférences → Confidentialité → Gérer les données du site web"
      ] }),
      /* @__PURE__ */ jsxs("li", { children: [
        /* @__PURE__ */ jsx("strong", { children: "Edge" }),
        " : Paramètres → Cookies et autorisations du site → Cookies et données du site"
      ] })
    ] }),
    /* @__PURE__ */ jsx(P$2, { children: "Attention : la désactivation de certains cookies peut affecter le fonctionnement de la plateforme ImmoFlash." }),
    /* @__PURE__ */ jsx(S$1, { children: "Droit applicable" }),
    /* @__PURE__ */ jsx(P$2, { children: "Cette politique est conforme aux recommandations de la Commission Nationale de l'Informatique et des Libertés (CNIL) et au Règlement Général sur la Protection des Données (RGPD)." }),
    /* @__PURE__ */ jsxs(P$2, { children: [
      "Pour toute question, contactez-nous à",
      " ",
      /* @__PURE__ */ jsx("a", { href: "mailto:contact@immoflash.app", style: { color: "#1E3A5F", fontWeight: 600 }, children: "contact@immoflash.app" }),
      "."
    ] }),
    /* @__PURE__ */ jsx("p", { style: { color: "#94a3b8", fontSize: 13, marginTop: "3rem", fontStyle: "italic" }, children: "Dernière mise à jour : avril 2026" })
  ] });
}
const Step = ({ number, title, time, children }) => /* @__PURE__ */ jsxs("div", { style: { display: "flex", gap: "1.5rem", marginBottom: "3rem" }, children: [
  /* @__PURE__ */ jsxs("div", { style: { flexShrink: 0 }, children: [
    /* @__PURE__ */ jsx("div", { style: {
      width: 40,
      height: 40,
      borderRadius: "50%",
      background: "linear-gradient(135deg, #1E3A5F, #38bdf8)",
      color: "#fff",
      fontWeight: 800,
      fontSize: 16,
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }, children: number }),
    /* @__PURE__ */ jsx("div", { style: { width: 2, background: "#e2e8f0", margin: "8px auto 0", height: "calc(100% - 56px)" } })
  ] }),
  /* @__PURE__ */ jsxs("div", { style: { flex: 1, paddingBottom: "1rem" }, children: [
    /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: 12, marginBottom: "0.75rem", flexWrap: "wrap" }, children: [
      /* @__PURE__ */ jsx("h2", { style: { fontSize: 19, fontWeight: 700, color: "#0f172a", margin: 0 }, children: title }),
      time && /* @__PURE__ */ jsxs("span", { style: { background: "#f1f5f9", color: "#64748b", fontSize: 12, fontWeight: 600, padding: "2px 10px", borderRadius: 20 }, children: [
        "⏱ ",
        time
      ] })
    ] }),
    children
  ] })
] });
const Tip = ({ children }) => /* @__PURE__ */ jsxs("div", { style: { background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 8, padding: "0.875rem 1rem", margin: "1rem 0", display: "flex", gap: 10 }, children: [
  /* @__PURE__ */ jsx("span", { style: { flexShrink: 0, fontSize: 16 }, children: "💡" }),
  /* @__PURE__ */ jsx("p", { style: { color: "#1e40af", fontSize: 14, lineHeight: 1.65, margin: 0 }, children })
] });
const Warning = ({ children }) => /* @__PURE__ */ jsxs("div", { style: { background: "#fef9c3", border: "1px solid #fde68a", borderRadius: 8, padding: "0.875rem 1rem", margin: "1rem 0", display: "flex", gap: 10 }, children: [
  /* @__PURE__ */ jsx("span", { style: { flexShrink: 0, fontSize: 16 }, children: "⚠️" }),
  /* @__PURE__ */ jsx("p", { style: { color: "#92400e", fontSize: 14, lineHeight: 1.65, margin: 0 }, children })
] });
const Action = ({ children }) => /* @__PURE__ */ jsx("div", { style: { background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "1rem 1.25rem", margin: "1rem 0" }, children: /* @__PURE__ */ jsx("p", { style: { color: "#334155", fontSize: 14, lineHeight: 1.65, margin: 0, fontFamily: "monospace" }, children }) });
const P$1 = ({ children }) => /* @__PURE__ */ jsx("p", { style: { color: "#475569", fontSize: 15, lineHeight: 1.75, margin: "0 0 0.75rem" }, children });
const Li$1 = ({ children }) => /* @__PURE__ */ jsx("li", { style: { color: "#475569", fontSize: 15, lineHeight: 1.75, marginBottom: 6 }, children });
const steps = [
  { id: "compte", label: "Créer votre compte" },
  { id: "agence", label: "Configurer votre agence" },
  { id: "smtp", label: "Configurer l'email" },
  { id: "biens", label: "Importer vos biens" },
  { id: "prospects", label: "Ajouter vos prospects" },
  { id: "matching", label: "Lancer un matching" },
  { id: "email", label: "Envoyer une proposition" },
  { id: "suite", label: "La suite" }
];
function GuideDemarrage() {
  const [active, setActive] = useState("compte");
  useEffect(() => {
    const handleScroll = () => {
      for (const s of steps) {
        const el = document.getElementById(s.id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 120) setActive(s.id);
        }
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  return /* @__PURE__ */ jsxs(PageLayout, { title: "Guide de démarrage", category: "Ressources", children: [
    /* @__PURE__ */ jsxs(P$1, { children: [
      "Ce guide vous accompagne de la création de votre compte jusqu'à votre premier email de proposition envoyé. Comptez ",
      /* @__PURE__ */ jsx("strong", { children: "30 à 45 minutes" }),
      " pour tout mettre en place — avec vos vraies données."
    ] }),
    /* @__PURE__ */ jsx("div", { style: { display: "flex", gap: 6, flexWrap: "wrap", marginBottom: "3rem" }, children: steps.map((s, i) => /* @__PURE__ */ jsxs(
      "a",
      {
        href: `#${s.id}`,
        style: {
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: "5px 12px",
          borderRadius: 20,
          fontSize: 13,
          fontWeight: 500,
          textDecoration: "none",
          background: active === s.id ? "#1E3A5F" : "#f1f5f9",
          color: active === s.id ? "#fff" : "#64748b",
          transition: "all 150ms"
        },
        children: [
          /* @__PURE__ */ jsx("span", { style: { fontWeight: 700 }, children: i + 1 }),
          " ",
          s.label
        ]
      },
      s.id
    )) }),
    /* @__PURE__ */ jsx("div", { id: "compte", children: /* @__PURE__ */ jsxs(Step, { number: 1, title: "Créer votre compte", time: "2 min", children: [
      /* @__PURE__ */ jsx(P$1, { children: "Votre compte ImmoFlash est créé par l'équipe lors de votre démo ou de votre souscription. Vous recevez un email avec vos identifiants :" }),
      /* @__PURE__ */ jsxs("ul", { style: { paddingLeft: 20, margin: "0 0 1rem" }, children: [
        /* @__PURE__ */ jsxs(Li$1, { children: [
          /* @__PURE__ */ jsx("strong", { children: "Email" }),
          " : votre adresse professionnelle"
        ] }),
        /* @__PURE__ */ jsxs(Li$1, { children: [
          /* @__PURE__ */ jsx("strong", { children: "Mot de passe" }),
          " : temporaire, à changer dès la première connexion"
        ] })
      ] }),
      /* @__PURE__ */ jsx(Action, { children: "→ Rendez-vous sur votre espace ImmoFlash et connectez-vous avec ces identifiants." }),
      /* @__PURE__ */ jsx(Tip, { children: "Si vous n'avez pas reçu vos identifiants, vérifiez vos spams ou écrivez à contact@immoflash.app." })
    ] }) }),
    /* @__PURE__ */ jsx("div", { id: "agence", children: /* @__PURE__ */ jsxs(Step, { number: 2, title: "Configurer votre agence", time: "5 min", children: [
      /* @__PURE__ */ jsx(P$1, { children: "Avant d'importer vos données, personnalisez l'identité de votre agence. Ces informations apparaissent dans les emails envoyés à vos prospects." }),
      /* @__PURE__ */ jsxs(P$1, { children: [
        "Rendez-vous dans ",
        /* @__PURE__ */ jsx("strong", { children: "Administration → Paramètres de l'agence" }),
        " :"
      ] }),
      /* @__PURE__ */ jsxs("ul", { style: { paddingLeft: 20, margin: "0 0 1rem" }, children: [
        /* @__PURE__ */ jsxs(Li$1, { children: [
          /* @__PURE__ */ jsx("strong", { children: "Nom de l'agence" }),
          " : tel qu'il apparaîtra dans les emails et rapports"
        ] }),
        /* @__PURE__ */ jsxs(Li$1, { children: [
          /* @__PURE__ */ jsx("strong", { children: "Logo" }),
          " : format PNG ou JPG, fond transparent recommandé"
        ] }),
        /* @__PURE__ */ jsxs(Li$1, { children: [
          /* @__PURE__ */ jsx("strong", { children: "Couleur principale" }),
          " : code hexadécimal (ex. #1E3A5F) pour l'identité visuelle des emails"
        ] }),
        /* @__PURE__ */ jsxs(Li$1, { children: [
          /* @__PURE__ */ jsx("strong", { children: "Adresse et téléphone" }),
          " : affichés en pied des emails"
        ] })
      ] }),
      /* @__PURE__ */ jsx(Tip, { children: "Un logo de bonne qualité et une couleur cohérente avec votre charte graphique rendent vos emails de proposition nettement plus professionnels." })
    ] }) }),
    /* @__PURE__ */ jsx("div", { id: "smtp", children: /* @__PURE__ */ jsxs(Step, { number: 3, title: "Configurer l'envoi d'emails (SMTP)", time: "5 min", children: [
      /* @__PURE__ */ jsxs(P$1, { children: [
        "Pour envoyer des emails depuis votre adresse professionnelle, ImmoFlash a besoin de vos paramètres SMTP. Rendez-vous dans ",
        /* @__PURE__ */ jsx("strong", { children: "Administration → Configuration email" }),
        "."
      ] }),
      /* @__PURE__ */ jsx(P$1, { children: /* @__PURE__ */ jsx("strong", { children: "Paramètres à renseigner :" }) }),
      /* @__PURE__ */ jsx("div", { style: { overflowX: "auto", margin: "0 0 1rem" }, children: /* @__PURE__ */ jsxs("table", { style: { width: "100%", borderCollapse: "collapse", fontSize: 14 }, children: [
        /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsx("tr", { style: { background: "#f8fafc" }, children: ["Champ", "Exemple", "Description"].map((h) => /* @__PURE__ */ jsx("th", { style: { textAlign: "left", padding: "8px 12px", fontWeight: 600, color: "#0f172a", borderBottom: "2px solid #e2e8f0" }, children: h }, h)) }) }),
        /* @__PURE__ */ jsx("tbody", { children: [
          ["Serveur SMTP", "smtp.gmail.com", "Adresse du serveur sortant"],
          ["Port", "587", "Port TLS standard (ou 465 pour SSL)"],
          ["Utilisateur", "votre@agence.fr", "Votre adresse email complète"],
          ["Mot de passe", "••••••••", "Mot de passe ou mot de passe d'application"],
          ["Nom expéditeur", "Sophie — Agence Riviera", "Nom affiché chez le destinataire"],
          ["Email de réponse", "sophie@agence.fr", "Adresse de réponse (Reply-To)"]
        ].map(([field, ex, desc]) => /* @__PURE__ */ jsxs("tr", { style: { borderBottom: "1px solid #f1f5f9" }, children: [
          /* @__PURE__ */ jsx("td", { style: { padding: "8px 12px", fontWeight: 600, color: "#334155" }, children: field }),
          /* @__PURE__ */ jsx("td", { style: { padding: "8px 12px", color: "#64748b", fontFamily: "monospace", fontSize: 13 }, children: ex }),
          /* @__PURE__ */ jsx("td", { style: { padding: "8px 12px", color: "#64748b" }, children: desc })
        ] }, field)) })
      ] }) }),
      /* @__PURE__ */ jsxs(Warning, { children: [
        "Si vous utilisez Gmail, vous devez créer un ",
        /* @__PURE__ */ jsx("strong", { children: "mot de passe d'application" }),
        " (pas votre mot de passe Google habituel). Allez dans : Compte Google → Sécurité → Validation en 2 étapes → Mots de passe des applications."
      ] }),
      /* @__PURE__ */ jsx(Tip, { children: "Après enregistrement, ImmoFlash envoie un email de test à votre adresse. Vérifiez qu'il arrive correctement avant de passer à la suite." })
    ] }) }),
    /* @__PURE__ */ jsx("div", { id: "biens", children: /* @__PURE__ */ jsxs(Step, { number: 4, title: "Importer vos biens", time: "5–10 min", children: [
      /* @__PURE__ */ jsx(P$1, { children: "Vos biens sont le cœur d'ImmoFlash. Plus la fiche est complète, plus le matching est précis." }),
      /* @__PURE__ */ jsx(P$1, { children: /* @__PURE__ */ jsx("strong", { children: "Option A — Import depuis un fichier CSV ou Excel :" }) }),
      /* @__PURE__ */ jsxs("ul", { style: { paddingLeft: 20, margin: "0 0 1rem" }, children: [
        /* @__PURE__ */ jsxs(Li$1, { children: [
          "Rendez-vous dans ",
          /* @__PURE__ */ jsx("strong", { children: "Biens → Importer" })
        ] }),
        /* @__PURE__ */ jsx(Li$1, { children: "Téléchargez le modèle CSV fourni par ImmoFlash" }),
        /* @__PURE__ */ jsx(Li$1, { children: "Remplissez-le avec vos données (référence, type, prix, surface, ville, description…)" }),
        /* @__PURE__ */ jsx(Li$1, { children: "Importez le fichier — les biens apparaissent instantanément" })
      ] }),
      /* @__PURE__ */ jsx(P$1, { children: /* @__PURE__ */ jsx("strong", { children: "Option B — Synchronisation automatique (Hektor / logiciel métier) :" }) }),
      /* @__PURE__ */ jsxs("ul", { style: { paddingLeft: 20, margin: "0 0 1rem" }, children: [
        /* @__PURE__ */ jsxs(Li$1, { children: [
          "Rendez-vous dans ",
          /* @__PURE__ */ jsx("strong", { children: "Administration → Synchronisation" })
        ] }),
        /* @__PURE__ */ jsx(Li$1, { children: "Renseignez l'URL de votre flux FTP ou XML" }),
        /* @__PURE__ */ jsx(Li$1, { children: "La synchronisation se fait toutes les 6 heures automatiquement" })
      ] }),
      /* @__PURE__ */ jsx(P$1, { children: /* @__PURE__ */ jsx("strong", { children: "Option C — Saisie manuelle :" }) }),
      /* @__PURE__ */ jsxs("ul", { style: { paddingLeft: 20, margin: "0 0 1rem" }, children: [
        /* @__PURE__ */ jsxs(Li$1, { children: [
          "Cliquez sur ",
          /* @__PURE__ */ jsx("strong", { children: "Biens → Nouveau bien" })
        ] }),
        /* @__PURE__ */ jsx(Li$1, { children: "Remplissez la fiche : type, prix, surface, pièces, ville, description, photos" }),
        /* @__PURE__ */ jsx(Li$1, { children: "Enregistrez — le bien est disponible immédiatement pour le matching" })
      ] }),
      /* @__PURE__ */ jsxs(Tip, { children: [
        "Les ",
        /* @__PURE__ */ jsx("strong", { children: "photos" }),
        " sont particulièrement importantes : elles sont intégrées dans les emails de proposition. Ajoutez au minimum 3 photos par bien pour maximiser l'impact."
      ] }),
      /* @__PURE__ */ jsxs(Tip, { children: [
        "La ",
        /* @__PURE__ */ jsx("strong", { children: "description" }),
        " est lue par l'IA pour l'analyse qualitative. Plus elle est riche (ambiance, atouts, destination idéale), plus le score est pertinent."
      ] })
    ] }) }),
    /* @__PURE__ */ jsx("div", { id: "prospects", children: /* @__PURE__ */ jsxs(Step, { number: 5, title: "Ajouter vos premiers prospects", time: "5–10 min", children: [
      /* @__PURE__ */ jsx(P$1, { children: "Un prospect bien qualifié donne un matching bien ciblé. Prenez 2 minutes par prospect pour renseigner les critères essentiels." }),
      /* @__PURE__ */ jsxs(P$1, { children: [
        "Rendez-vous dans ",
        /* @__PURE__ */ jsx("strong", { children: "Clients → Nouveau client" }),
        " :"
      ] }),
      /* @__PURE__ */ jsx("div", { style: { overflowX: "auto", margin: "0 0 1rem" }, children: /* @__PURE__ */ jsxs("table", { style: { width: "100%", borderCollapse: "collapse", fontSize: 14 }, children: [
        /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsx("tr", { style: { background: "#f8fafc" }, children: ["Champ", "Importance", "Conseil"].map((h) => /* @__PURE__ */ jsx("th", { style: { textAlign: "left", padding: "8px 12px", fontWeight: 600, color: "#0f172a", borderBottom: "2px solid #e2e8f0" }, children: h }, h)) }) }),
        /* @__PURE__ */ jsx("tbody", { children: [
          ["Nom / Email / Téléphone", "★★★", "Indispensable pour l'envoi d'email"],
          ["Budget maximum", "★★★", "Critère pondéré à 25 pts dans le score"],
          ["Type de bien recherché", "★★★", "Appartement, maison, terrain… (20 pts)"],
          ["Ville / Zone souhaitée", "★★★", "Critère de localisation (15 pts)"],
          ["Surface minimum", "★★☆", "Affine les résultats"],
          ["Nombre de pièces", "★★☆", "Affine les résultats"],
          ["Notes libres", "★★☆", "Lu par l'IA : style de vie, urgence, destination…"],
          ["Statut", "★☆☆", "Actif, En attente, Archivé"]
        ].map(([field, imp, conseil]) => /* @__PURE__ */ jsxs("tr", { style: { borderBottom: "1px solid #f1f5f9" }, children: [
          /* @__PURE__ */ jsx("td", { style: { padding: "8px 12px", fontWeight: 600, color: "#334155" }, children: field }),
          /* @__PURE__ */ jsx("td", { style: { padding: "8px 12px", color: "#f59e0b", letterSpacing: 2 }, children: imp }),
          /* @__PURE__ */ jsx("td", { style: { padding: "8px 12px", color: "#64748b" }, children: conseil })
        ] }, field)) })
      ] }) }),
      /* @__PURE__ */ jsxs(Tip, { children: [
        "Le champ ",
        /* @__PURE__ */ jsx("strong", { children: "Notes libres" }),
        ` est analysé par l'IA. Notez-y ce que vous retenez de vos échanges : "Couple avec enfants, cherche calme, investissement locatif envisagé à terme, pas pressé avant juin." Ces détails font la différence dans l'analyse qualitative.`
      ] })
    ] }) }),
    /* @__PURE__ */ jsx("div", { id: "matching", children: /* @__PURE__ */ jsxs(Step, { number: 6, title: "Lancer votre premier matching", time: "1 min", children: [
      /* @__PURE__ */ jsx(P$1, { children: "C'est le moment clé. Avec au moins 1 bien et 1 prospect dans votre base, vous pouvez lancer votre premier matching." }),
      /* @__PURE__ */ jsx(P$1, { children: /* @__PURE__ */ jsx("strong", { children: "Depuis la page Matchings :" }) }),
      /* @__PURE__ */ jsxs("ul", { style: { paddingLeft: 20, margin: "0 0 1rem" }, children: [
        /* @__PURE__ */ jsxs(Li$1, { children: [
          "Cliquez sur ",
          /* @__PURE__ */ jsx("strong", { children: "Nouveau matching" })
        ] }),
        /* @__PURE__ */ jsx(Li$1, { children: "Sélectionnez un prospect (ou laissez ImmoFlash analyser toute la base)" }),
        /* @__PURE__ */ jsxs(Li$1, { children: [
          "Cliquez sur ",
          /* @__PURE__ */ jsx("strong", { children: "Lancer l'analyse" })
        ] }),
        /* @__PURE__ */ jsx(Li$1, { children: "L'IA analyse les correspondances en quelques secondes" })
      ] }),
      /* @__PURE__ */ jsx(P$1, { children: /* @__PURE__ */ jsx("strong", { children: "Comprendre les résultats :" }) }),
      /* @__PURE__ */ jsxs("ul", { style: { paddingLeft: 20, margin: "0 0 1rem" }, children: [
        /* @__PURE__ */ jsxs(Li$1, { children: [
          /* @__PURE__ */ jsx("strong", { children: "Score /100" }),
          " : adéquation globale (objectif 0–60 + qualitatif IA 0–40)"
        ] }),
        /* @__PURE__ */ jsxs(Li$1, { children: [
          /* @__PURE__ */ jsx("strong", { children: "Points forts" }),
          " : ce qui correspond parfaitement aux critères"
        ] }),
        /* @__PURE__ */ jsxs(Li$1, { children: [
          /* @__PURE__ */ jsx("strong", { children: "Points d'attention" }),
          " : écarts à mentionner honnêtement"
        ] }),
        /* @__PURE__ */ jsxs(Li$1, { children: [
          /* @__PURE__ */ jsx("strong", { children: "Recommandation" }),
          " : synthèse rédigée par l'IA pour l'agent"
        ] })
      ] }),
      /* @__PURE__ */ jsx(Tip, { children: "Triez les résultats par score décroissant. Les biens au-dessus de 70/100 sont vos meilleures opportunités à traiter en priorité." }),
      /* @__PURE__ */ jsx(Warning, { children: "Un score faible (en dessous de 40) ne signifie pas que le bien est mauvais — il signifie simplement qu'il ne correspond pas à ce prospect précis." })
    ] }) }),
    /* @__PURE__ */ jsx("div", { id: "email", children: /* @__PURE__ */ jsxs(Step, { number: 7, title: "Envoyer votre première proposition", time: "2 min", children: [
      /* @__PURE__ */ jsx(P$1, { children: "Pour chaque matching, ImmoFlash génère automatiquement un email de proposition personnalisé. Voici comment l'envoyer :" }),
      /* @__PURE__ */ jsxs("ul", { style: { paddingLeft: 20, margin: "0 0 1rem" }, children: [
        /* @__PURE__ */ jsx(Li$1, { children: "Depuis la page de résultats du matching, cliquez sur un bien pour ouvrir sa fiche" }),
        /* @__PURE__ */ jsxs(Li$1, { children: [
          "Cliquez sur ",
          /* @__PURE__ */ jsx("strong", { children: "Générer l'email" }),
          " — l'IA rédige le message en quelques secondes"
        ] }),
        /* @__PURE__ */ jsx(Li$1, { children: "Relisez l'email généré (vous pouvez le modifier librement)" }),
        /* @__PURE__ */ jsxs(Li$1, { children: [
          "Cliquez sur ",
          /* @__PURE__ */ jsx("strong", { children: "Envoyer" }),
          " — l'email part depuis votre adresse professionnelle"
        ] })
      ] }),
      /* @__PURE__ */ jsx(P$1, { children: /* @__PURE__ */ jsx("strong", { children: "Ce que contient l'email généré :" }) }),
      /* @__PURE__ */ jsxs("ul", { style: { paddingLeft: 20, margin: "0 0 1rem" }, children: [
        /* @__PURE__ */ jsx(Li$1, { children: "Accroche personnalisée pour ce prospect" }),
        /* @__PURE__ */ jsx(Li$1, { children: "Présentation du bien avec photos intégrées" }),
        /* @__PURE__ */ jsx(Li$1, { children: "Arguments spécifiques liés aux critères du prospect" }),
        /* @__PURE__ */ jsx(Li$1, { children: "Points d'attention mentionnés de manière transparente" }),
        /* @__PURE__ */ jsx(Li$1, { children: "Vos coordonnées et un appel à l'action" })
      ] }),
      /* @__PURE__ */ jsx(Tip, { children: "L'email est généré en HTML et s'affiche correctement dans tous les clients mail (Gmail, Outlook, Apple Mail). Vous pouvez prévisualiser le rendu avant l'envoi." })
    ] }) }),
    /* @__PURE__ */ jsx("div", { id: "suite", children: /* @__PURE__ */ jsxs(Step, { number: 8, title: "La suite — aller plus loin", time: "", children: [
      /* @__PURE__ */ jsx(P$1, { children: "Félicitations — vous avez effectué votre premier cycle complet sur ImmoFlash. Voici ce que vous pouvez explorer ensuite :" }),
      /* @__PURE__ */ jsx("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem", margin: "1rem 0" }, children: [
        {
          title: "Agent IA conversationnel",
          desc: 'Posez des questions en français sur votre portefeuille. "Quels prospects ont un budget > 300k à Nice ?" — réponse instantanée.'
        },
        {
          title: "Rapports mensuels",
          desc: "Suivez vos performances : matchings réalisés, emails envoyés, taux de conversion. Disponibles en Administration → Rapports."
        },
        {
          title: "Gestion des rôles",
          desc: "Ajoutez vos agents avec des permissions adaptées (Admin ou Agent). Chaque agent voit ses propres matchings."
        },
        {
          title: "Archivage et relances",
          desc: "Archivez les prospects inactifs. Consultez l'historique des emails envoyés par prospect pour organiser vos relances."
        }
      ].map((card) => /* @__PURE__ */ jsxs("div", { style: { background: "#f8fafc", border: "1px solid #e8ecf0", borderRadius: 10, padding: "1.25rem" }, children: [
        /* @__PURE__ */ jsx("p", { style: { fontWeight: 700, color: "#0f172a", fontSize: 15, margin: "0 0 0.5rem" }, children: card.title }),
        /* @__PURE__ */ jsx("p", { style: { color: "#64748b", fontSize: 14, lineHeight: 1.6, margin: 0 }, children: card.desc })
      ] }, card.title)) })
    ] }) }),
    /* @__PURE__ */ jsxs("div", { style: { background: "#0f1e30", borderRadius: 12, padding: "2rem", textAlign: "center", marginTop: "2rem" }, children: [
      /* @__PURE__ */ jsx("p", { style: { fontWeight: 700, color: "#ffffff", fontSize: 18, margin: "0 0 0.5rem" }, children: "Besoin d'aide pour vous lancer ?" }),
      /* @__PURE__ */ jsx("p", { style: { color: "#64748b", fontSize: 15, margin: "0 0 1.25rem" }, children: "Notre équipe accompagne chaque agence lors du démarrage — gratuitement, sur votre première session." }),
      /* @__PURE__ */ jsx(
        "a",
        {
          href: "mailto:contact@immoflash.app",
          className: "btn-primary",
          style: { display: "inline-flex", alignItems: "center", gap: 8, padding: "11px 24px", fontSize: 14 },
          children: "Planifier ma session de démarrage"
        }
      )
    ] })
  ] });
}
const H2 = ({ id, children }) => /* @__PURE__ */ jsx("h2", { id, style: { fontSize: 22, fontWeight: 800, color: "#0f172a", margin: "3rem 0 1rem", letterSpacing: "-0.4px", scrollMarginTop: 80 }, children });
const H3 = ({ id, children }) => /* @__PURE__ */ jsx("h3", { id, style: { fontSize: 17, fontWeight: 700, color: "#1E3A5F", margin: "2rem 0 0.75rem", scrollMarginTop: 80 }, children });
const P = ({ children }) => /* @__PURE__ */ jsx("p", { style: { color: "#475569", fontSize: 15, lineHeight: 1.8, margin: "0 0 0.75rem" }, children });
const Li = ({ children }) => /* @__PURE__ */ jsx("li", { style: { color: "#475569", fontSize: 15, lineHeight: 1.8, marginBottom: 6 }, children });
const Code = ({ children }) => /* @__PURE__ */ jsx("code", { style: { background: "#f1f5f9", color: "#334155", fontSize: 13, padding: "2px 6px", borderRadius: 4, fontFamily: "monospace" }, children });
const Field$1 = ({ name, type, req, desc }) => /* @__PURE__ */ jsxs("tr", { style: { borderBottom: "1px solid #f1f5f9" }, children: [
  /* @__PURE__ */ jsx("td", { style: { padding: "8px 12px", fontFamily: "monospace", fontSize: 13, color: "#1E3A5F", fontWeight: 600 }, children: name }),
  /* @__PURE__ */ jsx("td", { style: { padding: "8px 12px", color: "#64748b", fontSize: 13 }, children: type }),
  /* @__PURE__ */ jsx("td", { style: { padding: "8px 12px" }, children: req === "oui" ? /* @__PURE__ */ jsx("span", { style: { color: "#dc2626", fontSize: 12, fontWeight: 700 }, children: "Requis" }) : /* @__PURE__ */ jsx("span", { style: { color: "#94a3b8", fontSize: 12 }, children: "Optionnel" }) }),
  /* @__PURE__ */ jsx("td", { style: { padding: "8px 12px", color: "#64748b", fontSize: 14 }, children: desc })
] });
const TableHead = () => /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsx("tr", { style: { background: "#f8fafc" }, children: ["Champ", "Type", "Requis", "Description"].map((h) => /* @__PURE__ */ jsx("th", { style: { textAlign: "left", padding: "8px 12px", fontWeight: 600, color: "#0f172a", fontSize: 13, borderBottom: "2px solid #e2e8f0" }, children: h }, h)) }) });
const toc = [
  { id: "apercu", label: "Vue d'ensemble" },
  { id: "biens", label: "Gestion des biens", sub: [
    { id: "biens-champs", label: "Champs disponibles" },
    { id: "biens-import", label: "Import CSV / Sync" },
    { id: "biens-statuts", label: "Statuts et archivage" }
  ] },
  { id: "prospects", label: "Gestion des prospects", sub: [
    { id: "prospects-champs", label: "Champs disponibles" },
    { id: "prospects-statuts", label: "Statuts" }
  ] },
  { id: "matching", label: "Le matching IA", sub: [
    { id: "matching-score", label: "Score /100 expliqué" },
    { id: "matching-lancer", label: "Lancer un matching" },
    { id: "matching-resultats", label: "Lire les résultats" }
  ] },
  { id: "emails", label: "Emails IA", sub: [
    { id: "emails-generer", label: "Générer un email" },
    { id: "emails-smtp", label: "Configuration SMTP" }
  ] },
  { id: "agent", label: "Agent IA conversationnel" },
  { id: "rapports", label: "Rapports et analytics" },
  { id: "admin", label: "Administration", sub: [
    { id: "admin-roles", label: "Rôles et permissions" },
    { id: "admin-agence", label: "Paramètres agence" }
  ] },
  { id: "depannage", label: "Dépannage" }
];
function Documentation() {
  const [activeId, setActiveId] = useState("apercu");
  useEffect(() => {
    const allIds = toc.flatMap((s) => [s.id, ...(s.sub || []).map((x) => x.id)]);
    const handleScroll = () => {
      for (const id of [...allIds].reverse()) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= 130) {
          setActiveId(id);
          break;
        }
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  return /* @__PURE__ */ jsx(PageLayout, { title: "Documentation", category: "Ressources", children: /* @__PURE__ */ jsxs("div", { style: { display: "grid", gridTemplateColumns: "200px 1fr", gap: "3rem", alignItems: "start" }, children: [
    /* @__PURE__ */ jsxs("nav", { style: { position: "sticky", top: 80 }, children: [
      /* @__PURE__ */ jsx("p", { style: { fontSize: 11, fontWeight: 700, color: "#94a3b8", letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 10px" }, children: "Sommaire" }),
      toc.map((section) => {
        var _a;
        return /* @__PURE__ */ jsxs("div", { style: { marginBottom: 4 }, children: [
          /* @__PURE__ */ jsx(
            "a",
            {
              href: `#${section.id}`,
              style: {
                display: "block",
                padding: "4px 8px",
                borderRadius: 6,
                fontSize: 13,
                fontWeight: 600,
                textDecoration: "none",
                color: activeId === section.id ? "#1E3A5F" : "#64748b",
                background: activeId === section.id ? "#eff6ff" : "transparent",
                transition: "all 150ms"
              },
              children: section.label
            }
          ),
          (_a = section.sub) == null ? void 0 : _a.map((sub) => /* @__PURE__ */ jsx(
            "a",
            {
              href: `#${sub.id}`,
              style: {
                display: "block",
                padding: "3px 8px 3px 20px",
                borderRadius: 6,
                fontSize: 12,
                textDecoration: "none",
                color: activeId === sub.id ? "#1E3A5F" : "#94a3b8",
                background: activeId === sub.id ? "#eff6ff" : "transparent",
                transition: "all 150ms"
              },
              children: sub.label
            },
            sub.id
          ))
        ] }, section.id);
      }),
      /* @__PURE__ */ jsx("div", { style: { marginTop: "1.5rem", paddingTop: "1.5rem", borderTop: "1px solid #e2e8f0" }, children: /* @__PURE__ */ jsx(Link, { to: "/guide-de-demarrage", style: { fontSize: 13, color: "#38bdf8", fontWeight: 600, textDecoration: "none" }, children: "→ Guide de démarrage" }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx(H2, { id: "apercu", children: "Vue d'ensemble" }),
      /* @__PURE__ */ jsxs(P, { children: [
        "ImmoFlash est organisé autour de trois entités principales : les ",
        /* @__PURE__ */ jsx("strong", { children: "biens" }),
        ", les ",
        /* @__PURE__ */ jsx("strong", { children: "prospects" }),
        " et les ",
        /* @__PURE__ */ jsx("strong", { children: "matchings" }),
        ". Tout le reste — emails, rapports, agent IA — gravite autour de ces trois piliers."
      ] }),
      /* @__PURE__ */ jsx("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "0.875rem", margin: "1.25rem 0" }, children: [
        { emoji: "🏠", title: "Biens", desc: "Votre portefeuille immobilier" },
        { emoji: "👤", title: "Prospects", desc: "Vos acheteurs et leurs critères" },
        { emoji: "🎯", title: "Matchings", desc: "Correspondances scorées par l'IA" },
        { emoji: "✉️", title: "Emails IA", desc: "Propositions générées auto." },
        { emoji: "💬", title: "Agent IA", desc: "Interface conversationnelle" },
        { emoji: "📊", title: "Rapports", desc: "Analytics et performances" }
      ].map((c) => /* @__PURE__ */ jsxs("div", { style: { background: "#f8fafc", border: "1px solid #e8ecf0", borderRadius: 10, padding: "1rem", textAlign: "center" }, children: [
        /* @__PURE__ */ jsx("div", { style: { fontSize: 24, marginBottom: 6 }, children: c.emoji }),
        /* @__PURE__ */ jsx("p", { style: { fontWeight: 700, color: "#0f172a", fontSize: 13, margin: "0 0 3px" }, children: c.title }),
        /* @__PURE__ */ jsx("p", { style: { color: "#94a3b8", fontSize: 12, margin: 0 }, children: c.desc })
      ] }, c.title)) }),
      /* @__PURE__ */ jsx(H2, { id: "biens", children: "Gestion des biens" }),
      /* @__PURE__ */ jsx(P, { children: "Un bien représente un actif immobilier de votre portefeuille — en vente ou en location. Plus la fiche est complète, plus le score de matching est précis." }),
      /* @__PURE__ */ jsx(H3, { id: "biens-champs", children: "Champs disponibles" }),
      /* @__PURE__ */ jsx("div", { style: { overflowX: "auto", marginBottom: "1.5rem" }, children: /* @__PURE__ */ jsxs("table", { style: { width: "100%", borderCollapse: "collapse", fontSize: 14 }, children: [
        /* @__PURE__ */ jsx(TableHead, {}),
        /* @__PURE__ */ jsxs("tbody", { children: [
          /* @__PURE__ */ jsx(Field$1, { name: "reference", type: "texte", req: "oui", desc: "Référence interne unique (ex. REF-2024-001)" }),
          /* @__PURE__ */ jsx(Field$1, { name: "type_bien", type: "enum", req: "oui", desc: "Appartement, Maison, Terrain, Commerce, Parking…" }),
          /* @__PURE__ */ jsx(Field$1, { name: "prix", type: "nombre", req: "oui", desc: "Prix de vente en euros (hors honoraires)" }),
          /* @__PURE__ */ jsx(Field$1, { name: "surface", type: "nombre", req: "non", desc: "Surface habitable en m²" }),
          /* @__PURE__ */ jsx(Field$1, { name: "nb_pieces", type: "nombre", req: "non", desc: "Nombre de pièces principales" }),
          /* @__PURE__ */ jsx(Field$1, { name: "nb_chambres", type: "nombre", req: "non", desc: "Nombre de chambres" }),
          /* @__PURE__ */ jsx(Field$1, { name: "ville", type: "texte", req: "oui", desc: "Ville du bien" }),
          /* @__PURE__ */ jsx(Field$1, { name: "code_postal", type: "texte", req: "non", desc: "Code postal (5 chiffres)" }),
          /* @__PURE__ */ jsx(Field$1, { name: "adresse", type: "texte", req: "non", desc: "Adresse complète (pour usage interne uniquement)" }),
          /* @__PURE__ */ jsx(Field$1, { name: "dpe", type: "enum", req: "non", desc: "Classe énergétique A à G — influencée l'analyse IA" }),
          /* @__PURE__ */ jsx(Field$1, { name: "description", type: "texte long", req: "non", desc: "Description commerciale — lue par l'IA pour l'analyse qualitative" }),
          /* @__PURE__ */ jsx(Field$1, { name: "photos", type: "URLs", req: "non", desc: "URLs des photos (séparées par |) — intégrées dans les emails" }),
          /* @__PURE__ */ jsx(Field$1, { name: "stationnement", type: "booléen", req: "non", desc: "Présence d'un garage ou parking" }),
          /* @__PURE__ */ jsx(Field$1, { name: "statut", type: "enum", req: "non", desc: "Actif, Vendu, Archivé (défaut : Actif)" })
        ] })
      ] }) }),
      /* @__PURE__ */ jsx(H3, { id: "biens-import", children: "Import CSV et synchronisation" }),
      /* @__PURE__ */ jsxs(P, { children: [
        /* @__PURE__ */ jsx("strong", { children: "Import CSV :" }),
        " Téléchargez le modèle depuis ",
        /* @__PURE__ */ jsx(Code, { children: "Biens → Importer → Télécharger le modèle" }),
        ". Les colonnes doivent correspondre exactement aux noms de champs ci-dessus. Les lignes vides et les colonnes supplémentaires sont ignorées."
      ] }),
      /* @__PURE__ */ jsxs(P, { children: [
        /* @__PURE__ */ jsx("strong", { children: "Synchronisation automatique :" }),
        " Si votre logiciel métier exporte un flux XML ou FTP compatible, configurez l'URL dans ",
        /* @__PURE__ */ jsx(Code, { children: "Administration → Synchronisation" }),
        '. La mise à jour se fait toutes les 6 heures. Les biens existants sont mis à jour, les nouveaux sont ajoutés, les disparus passent en statut "Archivé".'
      ] }),
      /* @__PURE__ */ jsx(H3, { id: "biens-statuts", children: "Statuts et archivage" }),
      /* @__PURE__ */ jsxs("ul", { style: { paddingLeft: 20, margin: "0 0 1rem" }, children: [
        /* @__PURE__ */ jsxs(Li, { children: [
          /* @__PURE__ */ jsx("strong", { children: "Actif" }),
          " : bien disponible, inclus dans les matchings"
        ] }),
        /* @__PURE__ */ jsxs(Li, { children: [
          /* @__PURE__ */ jsx("strong", { children: "Vendu / Loué" }),
          " : bien sorti du marché, exclu des matchings mais conservé dans l'historique"
        ] }),
        /* @__PURE__ */ jsxs(Li, { children: [
          /* @__PURE__ */ jsx("strong", { children: "Archivé" }),
          " : bien masqué, exclu des matchings, récupérable à tout moment"
        ] })
      ] }),
      /* @__PURE__ */ jsxs(P, { children: [
        "Un bien archivé peut être restauré depuis ",
        /* @__PURE__ */ jsx(Code, { children: "Biens → Archivés → Restaurer" }),
        "."
      ] }),
      /* @__PURE__ */ jsx(H2, { id: "prospects", children: "Gestion des prospects" }),
      /* @__PURE__ */ jsx(P, { children: "Un prospect est un acheteur ou locataire potentiel avec des critères de recherche définis. La richesse des informations renseignées détermine directement la qualité du matching." }),
      /* @__PURE__ */ jsx(H3, { id: "prospects-champs", children: "Champs disponibles" }),
      /* @__PURE__ */ jsx("div", { style: { overflowX: "auto", marginBottom: "1.5rem" }, children: /* @__PURE__ */ jsxs("table", { style: { width: "100%", borderCollapse: "collapse", fontSize: 14 }, children: [
        /* @__PURE__ */ jsx(TableHead, {}),
        /* @__PURE__ */ jsxs("tbody", { children: [
          /* @__PURE__ */ jsx(Field$1, { name: "prenom / nom", type: "texte", req: "oui", desc: "Identité du prospect" }),
          /* @__PURE__ */ jsx(Field$1, { name: "email", type: "email", req: "oui", desc: "Adresse pour l'envoi des propositions" }),
          /* @__PURE__ */ jsx(Field$1, { name: "telephone", type: "texte", req: "non", desc: "Numéro de contact" }),
          /* @__PURE__ */ jsx(Field$1, { name: "budget_max", type: "nombre", req: "oui", desc: "Budget maximum en euros (critère pondéré à 25 pts)" }),
          /* @__PURE__ */ jsx(Field$1, { name: "type_bien", type: "enum", req: "oui", desc: "Type(s) de bien recherché (20 pts)" }),
          /* @__PURE__ */ jsx(Field$1, { name: "ville_souhaitee", type: "texte", req: "oui", desc: "Ville ou zone souhaitée (15 pts)" }),
          /* @__PURE__ */ jsx(Field$1, { name: "surface_min", type: "nombre", req: "non", desc: "Surface minimum souhaitée en m²" }),
          /* @__PURE__ */ jsx(Field$1, { name: "nb_pieces_min", type: "nombre", req: "non", desc: "Nombre de pièces minimum" }),
          /* @__PURE__ */ jsx(Field$1, { name: "stationnement", type: "booléen", req: "non", desc: "Nécessite un parking / garage" }),
          /* @__PURE__ */ jsx(Field$1, { name: "notes", type: "texte long", req: "non", desc: "Notes libres lues par l'IA (style de vie, urgence, destination…)" }),
          /* @__PURE__ */ jsx(Field$1, { name: "statut", type: "enum", req: "non", desc: "Actif, En attente, Archivé (défaut : Actif)" }),
          /* @__PURE__ */ jsx(Field$1, { name: "agent_referent", type: "texte", req: "non", desc: "Agent en charge du prospect" })
        ] })
      ] }) }),
      /* @__PURE__ */ jsx(H3, { id: "prospects-statuts", children: "Statuts" }),
      /* @__PURE__ */ jsxs("ul", { style: { paddingLeft: 20, margin: "0 0 1rem" }, children: [
        /* @__PURE__ */ jsxs(Li, { children: [
          /* @__PURE__ */ jsx("strong", { children: "Actif" }),
          " : prospect en recherche active, inclus dans les matchings"
        ] }),
        /* @__PURE__ */ jsxs(Li, { children: [
          /* @__PURE__ */ jsx("strong", { children: "En attente" }),
          " : prospect non urgent, inclus dans les matchings mais tagué"
        ] }),
        /* @__PURE__ */ jsxs(Li, { children: [
          /* @__PURE__ */ jsx("strong", { children: "Archivé" }),
          " : prospect inactif ou ayant acheté, exclu des matchings"
        ] })
      ] }),
      /* @__PURE__ */ jsx(H2, { id: "matching", children: "Le matching IA" }),
      /* @__PURE__ */ jsx(P, { children: "Le matching est le cœur d'ImmoFlash. Pour chaque prospect, l'algorithme analyse l'ensemble de votre portefeuille actif et génère un score de correspondance pour chaque bien." }),
      /* @__PURE__ */ jsx(H3, { id: "matching-score", children: "Score /100 expliqué" }),
      /* @__PURE__ */ jsx(P, { children: "Le score est composé de deux parties :" }),
      /* @__PURE__ */ jsxs("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", margin: "1rem 0" }, children: [
        /* @__PURE__ */ jsxs("div", { style: { background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 10, padding: "1.25rem" }, children: [
          /* @__PURE__ */ jsx("p", { style: { fontWeight: 700, color: "#1E3A5F", fontSize: 14, margin: "0 0 0.75rem" }, children: "Partie objective — 60 pts max" }),
          /* @__PURE__ */ jsx("ul", { style: { paddingLeft: 16, margin: 0, listStyle: "none" }, children: [
            ["Budget", "25 pts"],
            ["Type de bien", "20 pts"],
            ["Localisation", "15 pts"]
          ].map(([k, v]) => /* @__PURE__ */ jsxs("li", { style: { fontSize: 13, color: "#334155", marginBottom: 5, display: "flex", justifyContent: "space-between" }, children: [
            /* @__PURE__ */ jsx("span", { children: k }),
            /* @__PURE__ */ jsx("strong", { children: v })
          ] }, k)) }),
          /* @__PURE__ */ jsx("p", { style: { fontSize: 12, color: "#64748b", margin: "0.75rem 0 0" }, children: "Calculé sur la base des critères explicites du prospect." })
        ] }),
        /* @__PURE__ */ jsxs("div", { style: { background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10, padding: "1.25rem" }, children: [
          /* @__PURE__ */ jsx("p", { style: { fontWeight: 700, color: "#166534", fontSize: 14, margin: "0 0 0.75rem" }, children: "Partie qualitative IA — 40 pts max" }),
          /* @__PURE__ */ jsx("ul", { style: { paddingLeft: 16, margin: 0, listStyle: "none" }, children: [
            ["Style de vie", "~15 pts"],
            ["DPE / confort", "~10 pts"],
            ["Destination", "~10 pts"],
            ["Urgence / timing", "~5 pts"]
          ].map(([k, v]) => /* @__PURE__ */ jsxs("li", { style: { fontSize: 13, color: "#334155", marginBottom: 5, display: "flex", justifyContent: "space-between" }, children: [
            /* @__PURE__ */ jsx("span", { children: k }),
            /* @__PURE__ */ jsx("strong", { children: v })
          ] }, k)) }),
          /* @__PURE__ */ jsx("p", { style: { fontSize: 12, color: "#64748b", margin: "0.75rem 0 0" }, children: "Analysé par Claude AI depuis la description du bien et les notes du prospect." })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { style: { background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "1rem", margin: "1rem 0" }, children: [
        /* @__PURE__ */ jsx("p", { style: { fontWeight: 700, color: "#0f172a", fontSize: 14, margin: "0 0 0.5rem" }, children: "Grille d'interprétation" }),
        [
          { range: "85 – 100", label: "Excellent", color: "#166534", bg: "#dcfce7", desc: "Correspondance quasi parfaite — à contacter en priorité" },
          { range: "70 – 84", label: "Très bon", color: "#1e40af", bg: "#dbeafe", desc: "Forte adéquation — opportunité sérieuse" },
          { range: "55 – 69", label: "Bon", color: "#92400e", bg: "#fef9c3", desc: "Bonne base — quelques critères à discuter" },
          { range: "40 – 54", label: "Partiel", color: "#6b7280", bg: "#f1f5f9", desc: "Correspondance partielle — à proposer en option" },
          { range: "< 40", label: "Faible", color: "#9ca3af", bg: "#f9fafb", desc: "Peu pertinent pour ce prospect" }
        ].map((row) => /* @__PURE__ */ jsxs("div", { style: { display: "flex", gap: 12, alignItems: "center", marginBottom: 6 }, children: [
          /* @__PURE__ */ jsx("span", { style: { background: row.bg, color: row.color, fontSize: 12, fontWeight: 700, padding: "2px 8px", borderRadius: 4, minWidth: 60, textAlign: "center" }, children: row.range }),
          /* @__PURE__ */ jsx("span", { style: { fontWeight: 600, color: row.color, fontSize: 13, minWidth: 70 }, children: row.label }),
          /* @__PURE__ */ jsx("span", { style: { color: "#64748b", fontSize: 13 }, children: row.desc })
        ] }, row.range))
      ] }),
      /* @__PURE__ */ jsx(H3, { id: "matching-lancer", children: "Lancer un matching" }),
      /* @__PURE__ */ jsxs(P, { children: [
        "Depuis ",
        /* @__PURE__ */ jsx(Code, { children: "Matchings → Nouveau matching" }),
        " :"
      ] }),
      /* @__PURE__ */ jsxs("ul", { style: { paddingLeft: 20, margin: "0 0 1rem" }, children: [
        /* @__PURE__ */ jsxs(Li, { children: [
          /* @__PURE__ */ jsx("strong", { children: "Matching par prospect" }),
          " : sélectionnez un prospect, ImmoFlash analyse tous les biens actifs"
        ] }),
        /* @__PURE__ */ jsxs(Li, { children: [
          /* @__PURE__ */ jsx("strong", { children: "Matching par bien" }),
          " : sélectionnez un bien, ImmoFlash remonte les prospects les plus pertinents"
        ] }),
        /* @__PURE__ */ jsxs(Li, { children: [
          /* @__PURE__ */ jsx("strong", { children: "Matching global" }),
          " : analyse croisée de tous les prospects actifs contre tous les biens actifs (recommandé une fois par semaine)"
        ] })
      ] }),
      /* @__PURE__ */ jsx(H3, { id: "matching-resultats", children: "Lire les résultats" }),
      /* @__PURE__ */ jsx(P, { children: "Chaque résultat de matching affiche :" }),
      /* @__PURE__ */ jsxs("ul", { style: { paddingLeft: 20, margin: "0 0 1rem" }, children: [
        /* @__PURE__ */ jsxs(Li, { children: [
          /* @__PURE__ */ jsx("strong", { children: "Score /100" }),
          " avec jauge visuelle"
        ] }),
        /* @__PURE__ */ jsxs(Li, { children: [
          /* @__PURE__ */ jsx("strong", { children: "Points forts" }),
          " : liste des critères parfaitement satisfaits"
        ] }),
        /* @__PURE__ */ jsxs(Li, { children: [
          /* @__PURE__ */ jsx("strong", { children: "Points d'attention" }),
          " : critères non satisfaits ou à nuancer"
        ] }),
        /* @__PURE__ */ jsxs(Li, { children: [
          /* @__PURE__ */ jsx("strong", { children: "Recommandation agent" }),
          " : synthèse rédigée par l'IA avec la stratégie de présentation suggérée"
        ] }),
        /* @__PURE__ */ jsxs(Li, { children: [
          /* @__PURE__ */ jsx("strong", { children: `Bouton "Générer l'email"` }),
          " : crée instantanément le message de proposition"
        ] })
      ] }),
      /* @__PURE__ */ jsx(H2, { id: "emails", children: "Emails IA" }),
      /* @__PURE__ */ jsx(H3, { id: "emails-generer", children: "Générer et envoyer un email" }),
      /* @__PURE__ */ jsxs(P, { children: [
        "Depuis n'importe quel résultat de matching, cliquez sur ",
        /* @__PURE__ */ jsx(Code, { children: "Générer l'email" }),
        ". L'IA rédige en quelques secondes un email HTML personnalisé incluant :"
      ] }),
      /* @__PURE__ */ jsxs("ul", { style: { paddingLeft: 20, margin: "0 0 1rem" }, children: [
        /* @__PURE__ */ jsx(Li, { children: "Accroche adaptée au profil du prospect" }),
        /* @__PURE__ */ jsx(Li, { children: "Présentation du bien avec photos intégrées (si renseignées)" }),
        /* @__PURE__ */ jsx(Li, { children: "Arguments ciblés sur ses critères spécifiques" }),
        /* @__PURE__ */ jsx(Li, { children: "Points d'attention formulés de manière transparente" }),
        /* @__PURE__ */ jsx(Li, { children: "Coordonnées de l'agence en pied de mail" })
      ] }),
      /* @__PURE__ */ jsxs(P, { children: [
        "L'email est entièrement modifiable avant envoi. Cliquez sur ",
        /* @__PURE__ */ jsx(Code, { children: "Envoyer" }),
        " pour l'expédier depuis votre adresse professionnelle configurée."
      ] }),
      /* @__PURE__ */ jsx(H3, { id: "emails-smtp", children: "Configuration SMTP" }),
      /* @__PURE__ */ jsxs(P, { children: [
        "Rendez-vous dans ",
        /* @__PURE__ */ jsx(Code, { children: "Administration → Configuration email" }),
        ". Les paramètres nécessaires sont :"
      ] }),
      /* @__PURE__ */ jsxs("ul", { style: { paddingLeft: 20, margin: "0 0 1rem" }, children: [
        /* @__PURE__ */ jsxs(Li, { children: [
          /* @__PURE__ */ jsx("strong", { children: "Serveur SMTP" }),
          " — ex. ",
          /* @__PURE__ */ jsx(Code, { children: "smtp.gmail.com" }),
          ", ",
          /* @__PURE__ */ jsx(Code, { children: "smtp.office365.com" })
        ] }),
        /* @__PURE__ */ jsxs(Li, { children: [
          /* @__PURE__ */ jsx("strong", { children: "Port" }),
          " — ",
          /* @__PURE__ */ jsx(Code, { children: "587" }),
          " (TLS) ou ",
          /* @__PURE__ */ jsx(Code, { children: "465" }),
          " (SSL)"
        ] }),
        /* @__PURE__ */ jsxs(Li, { children: [
          /* @__PURE__ */ jsx("strong", { children: "Identifiant" }),
          " — votre adresse email complète"
        ] }),
        /* @__PURE__ */ jsxs(Li, { children: [
          /* @__PURE__ */ jsx("strong", { children: "Mot de passe" }),
          " — mot de passe ou mot de passe d'application (Gmail, Outlook)"
        ] }),
        /* @__PURE__ */ jsxs(Li, { children: [
          /* @__PURE__ */ jsx("strong", { children: "Nom expéditeur" }),
          ' — apparaît dans le champ "De" chez le destinataire'
        ] })
      ] }),
      /* @__PURE__ */ jsx(P, { children: "Un email de test est envoyé à votre adresse après enregistrement pour valider la configuration." }),
      /* @__PURE__ */ jsx(H2, { id: "agent", children: "Agent IA conversationnel" }),
      /* @__PURE__ */ jsx(P, { children: "L'agent IA est une interface de dialogue intégrée à ImmoFlash. Il comprend le langage naturel et a accès à l'ensemble de votre portefeuille en temps réel." }),
      /* @__PURE__ */ jsx(P, { children: /* @__PURE__ */ jsx("strong", { children: "Exemples de questions :" }) }),
      /* @__PURE__ */ jsx("div", { style: { background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "1rem", margin: "0.75rem 0 1rem" }, children: [
        "Quels prospects ont un budget supérieur à 350 000 € ?",
        "Montre-moi les biens disponibles à Fréjus avec plus de 4 pièces.",
        "Qui pourrait être intéressé par le bien REF-2024-042 ?",
        "Génère un email de proposition pour Mme Dupont concernant le REF-2024-018.",
        "Combien de matchings ont été réalisés ce mois-ci ?",
        "Quels prospects n'ont pas été contactés depuis 30 jours ?"
      ].map((q) => /* @__PURE__ */ jsxs("div", { style: { display: "flex", gap: 8, marginBottom: 8 }, children: [
        /* @__PURE__ */ jsx("span", { style: { color: "#38bdf8", fontWeight: 700, flexShrink: 0 }, children: "›" }),
        /* @__PURE__ */ jsx("span", { style: { color: "#475569", fontSize: 14, fontStyle: "italic" }, children: q })
      ] }, q)) }),
      /* @__PURE__ */ jsx(P, { children: "L'agent peut générer des emails, lister des biens selon des critères complexes, résumer l'activité d'un prospect ou d'un bien, et répondre à des questions sur votre portefeuille." }),
      /* @__PURE__ */ jsx(H2, { id: "rapports", children: "Rapports et analytics" }),
      /* @__PURE__ */ jsxs(P, { children: [
        "ImmoFlash génère un rapport mensuel disponible dans ",
        /* @__PURE__ */ jsx(Code, { children: "Administration → Rapports" }),
        ". Il inclut :"
      ] }),
      /* @__PURE__ */ jsxs("ul", { style: { paddingLeft: 20, margin: "0 0 1rem" }, children: [
        /* @__PURE__ */ jsxs(Li, { children: [
          /* @__PURE__ */ jsx("strong", { children: "Activité générale" }),
          " : nombre de biens actifs, de prospects, de matchings réalisés"
        ] }),
        /* @__PURE__ */ jsxs(Li, { children: [
          /* @__PURE__ */ jsx("strong", { children: "Emails" }),
          " : nombre d'emails envoyés, par agent, par bien"
        ] }),
        /* @__PURE__ */ jsxs(Li, { children: [
          /* @__PURE__ */ jsx("strong", { children: "Scores" }),
          " : distribution des scores de matching, score moyen du portefeuille"
        ] }),
        /* @__PURE__ */ jsxs(Li, { children: [
          /* @__PURE__ */ jsx("strong", { children: "Biens les plus matchés" }),
          " : top 5 des biens générant le plus de correspondances"
        ] }),
        /* @__PURE__ */ jsxs(Li, { children: [
          /* @__PURE__ */ jsx("strong", { children: "Prospects les plus actifs" }),
          " : top 5 des prospects avec le plus de matchings"
        ] }),
        /* @__PURE__ */ jsxs(Li, { children: [
          /* @__PURE__ */ jsx("strong", { children: "Utilisation API Claude" }),
          " : consommation de l'IA pour le mois en cours"
        ] })
      ] }),
      /* @__PURE__ */ jsx(P, { children: "Les rapports sont téléchargeables en HTML. Pour des besoins d'export personnalisé, contactez le support." }),
      /* @__PURE__ */ jsx(H2, { id: "admin", children: "Administration" }),
      /* @__PURE__ */ jsx(H3, { id: "admin-roles", children: "Rôles et permissions" }),
      /* @__PURE__ */ jsx("div", { style: { overflowX: "auto", marginBottom: "1.5rem" }, children: /* @__PURE__ */ jsxs("table", { style: { width: "100%", borderCollapse: "collapse", fontSize: 14 }, children: [
        /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsx("tr", { style: { background: "#f8fafc" }, children: ["Fonctionnalité", "Admin", "Agent"].map((h) => /* @__PURE__ */ jsx("th", { style: { textAlign: "left", padding: "8px 12px", fontWeight: 600, color: "#0f172a", borderBottom: "2px solid #e2e8f0" }, children: h }, h)) }) }),
        /* @__PURE__ */ jsx("tbody", { children: [
          ["Voir les biens", "✓", "✓"],
          ["Ajouter / modifier des biens", "✓", "✓"],
          ["Supprimer des biens", "✓", "—"],
          ["Voir les prospects", "✓", "✓"],
          ["Ajouter / modifier des prospects", "✓", "✓"],
          ["Supprimer des prospects", "✓", "—"],
          ["Lancer des matchings", "✓", "✓"],
          ["Envoyer des emails", "✓", "✓"],
          ["Voir les rapports", "✓", "✓"],
          ["Configurer l'agence (SMTP, logo…)", "✓", "—"],
          ["Gérer les utilisateurs", "✓", "—"],
          ["Réinitialiser les données (démo)", "✓", "—"]
        ].map(([feat, admin, agent]) => /* @__PURE__ */ jsxs("tr", { style: { borderBottom: "1px solid #f1f5f9" }, children: [
          /* @__PURE__ */ jsx("td", { style: { padding: "8px 12px", color: "#334155" }, children: feat }),
          /* @__PURE__ */ jsx("td", { style: { padding: "8px 12px", color: "#166534", fontWeight: 700 }, children: admin }),
          /* @__PURE__ */ jsx("td", { style: { padding: "8px 12px", color: agent === "✓" ? "#166534" : "#94a3b8", fontWeight: 700 }, children: agent })
        ] }, feat)) })
      ] }) }),
      /* @__PURE__ */ jsx(H3, { id: "admin-agence", children: "Paramètres agence" }),
      /* @__PURE__ */ jsxs(P, { children: [
        "Depuis ",
        /* @__PURE__ */ jsx(Code, { children: "Administration → Paramètres" }),
        ", vous pouvez configurer :"
      ] }),
      /* @__PURE__ */ jsxs("ul", { style: { paddingLeft: 20, margin: "0 0 1rem" }, children: [
        /* @__PURE__ */ jsxs(Li, { children: [
          /* @__PURE__ */ jsx("strong", { children: "Nom de l'agence" }),
          " : apparaît dans les emails et les rapports"
        ] }),
        /* @__PURE__ */ jsxs(Li, { children: [
          /* @__PURE__ */ jsx("strong", { children: "Logo" }),
          " : PNG ou JPG, intégré dans les emails HTML"
        ] }),
        /* @__PURE__ */ jsxs(Li, { children: [
          /* @__PURE__ */ jsx("strong", { children: "Couleur principale" }),
          " : code hexadécimal, appliquée à l'en-tête des emails"
        ] }),
        /* @__PURE__ */ jsxs(Li, { children: [
          /* @__PURE__ */ jsx("strong", { children: "Adresse et téléphone" }),
          " : affichés en pied d'email"
        ] }),
        /* @__PURE__ */ jsxs(Li, { children: [
          /* @__PURE__ */ jsx("strong", { children: "Configuration SMTP" }),
          " : paramètres d'envoi email (voir section Emails)"
        ] })
      ] }),
      /* @__PURE__ */ jsx(H2, { id: "depannage", children: "Dépannage" }),
      [
        {
          q: "Le matching ne donne aucun résultat",
          a: 'Vérifiez que vous avez au moins 1 bien au statut "Actif" et 1 prospect au statut "Actif" avec un budget et un type de bien renseignés.'
        },
        {
          q: "Les emails ne partent pas",
          a: `Vérifiez votre configuration SMTP dans Administration → Configuration email. Si vous utilisez Gmail, assurez-vous d'utiliser un mot de passe d'application (pas votre mot de passe Google). Cliquez sur "Envoyer un email de test" pour valider.`
        },
        {
          q: "Les photos n'apparaissent pas dans les emails",
          a: "Les URLs des photos doivent être accessibles publiquement. Vérifiez que les liens ne nécessitent pas d'authentification. Le format attendu dans l'import CSV est : URL1|URL2|URL3 (séparées par le caractère pipe)."
        },
        {
          q: "Le score est anormalement bas alors que le bien correspond bien",
          a: `Vérifiez que les champs critiques du prospect sont bien renseignés (budget, type, ville). Enrichissez le champ "Notes libres" du prospect — l'IA l'utilise pour la partie qualitative. Vérifiez aussi que la description du bien est suffisamment détaillée.`
        },
        {
          q: "L'import CSV échoue",
          a: "Vérifiez que votre fichier utilise bien le modèle fourni par ImmoFlash (les noms de colonnes doivent être identiques). Encodage attendu : UTF-8. Séparateur : virgule ou point-virgule. Supprimez les lignes d'en-tête superflues."
        },
        {
          q: "L'agent IA ne répond plus",
          a: "L'agent IA nécessite une connexion active à l'API Claude (Anthropic). Vérifiez votre connexion internet. Si le problème persiste, contactez le support — cela peut indiquer un quota dépassé ou une interruption de service."
        }
      ].map((item) => /* @__PURE__ */ jsxs("div", { style: { marginBottom: "1.25rem", paddingBottom: "1.25rem", borderBottom: "1px solid #f1f5f9" }, children: [
        /* @__PURE__ */ jsxs("p", { style: { fontWeight: 700, color: "#0f172a", fontSize: 15, margin: "0 0 0.4rem" }, children: [
          "❓ ",
          item.q
        ] }),
        /* @__PURE__ */ jsx(P, { children: item.a })
      ] }, item.q)),
      /* @__PURE__ */ jsxs("div", { style: { background: "#0f1e30", borderRadius: 12, padding: "1.75rem", textAlign: "center", marginTop: "2rem" }, children: [
        /* @__PURE__ */ jsx("p", { style: { fontWeight: 700, color: "#ffffff", fontSize: 17, margin: "0 0 0.5rem" }, children: "Votre problème n'est pas listé ici ?" }),
        /* @__PURE__ */ jsx("p", { style: { color: "#64748b", fontSize: 14, margin: "0 0 1.25rem" }, children: "Écrivez-nous — nous répondons sous 24h ouvrées." }),
        /* @__PURE__ */ jsx(
          "a",
          {
            href: "mailto:contact@immoflash.app",
            className: "btn-primary",
            style: { display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 22px", fontSize: 14 },
            children: "Contacter le support"
          }
        )
      ] })
    ] })
  ] }) });
}
function Block({ title, children }) {
  return /* @__PURE__ */ jsxs("div", { style: { marginBottom: "3.5rem" }, children: [
    /* @__PURE__ */ jsx("p", { style: { fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 1.25rem", paddingBottom: "0.75rem", borderBottom: "1px solid #f1f5f9" }, children: title }),
    /* @__PURE__ */ jsx("div", { style: { display: "flex", flexWrap: "wrap", gap: "1rem", alignItems: "flex-start" }, children })
  ] });
}
function Variant({ label, children }) {
  return /* @__PURE__ */ jsxs("div", { style: { display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-start" }, children: [
    children,
    /* @__PURE__ */ jsx("span", { style: { fontSize: 11, color: "#cbd5e1", fontFamily: "monospace" }, children: label })
  ] });
}
function ScoreBadge({ score }) {
  const color = score >= 80 ? "#22c55e" : score >= 55 ? "#f59e0b" : "#ef4444";
  const bg = score >= 80 ? "rgba(34,197,94,0.1)" : score >= 55 ? "rgba(245,158,11,0.1)" : "rgba(239,68,68,0.1)";
  return /* @__PURE__ */ jsxs("div", { style: { display: "inline-flex", flexDirection: "column", alignItems: "center", background: bg, border: `1.5px solid ${color}`, borderRadius: 12, padding: "10px 18px", minWidth: 72 }, children: [
    /* @__PURE__ */ jsx("span", { style: { fontSize: 28, fontWeight: 800, color, lineHeight: 1, letterSpacing: "-1px" }, children: score }),
    /* @__PURE__ */ jsx("span", { style: { fontSize: 10, fontWeight: 600, color, opacity: 0.7, marginTop: 2 }, children: "/100" })
  ] });
}
function EmailPreview() {
  return /* @__PURE__ */ jsxs("div", { style: { background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, width: 340, overflow: "hidden", boxShadow: "0 4px 20px rgba(0,0,0,0.07)" }, children: [
    /* @__PURE__ */ jsxs("div", { style: { background: "#f8fafc", borderBottom: "1px solid #e2e8f0", padding: "10px 14px", display: "flex", alignItems: "center", gap: 8 }, children: [
      /* @__PURE__ */ jsx("div", { style: { width: 10, height: 10, borderRadius: "50%", background: "#fee2e2" } }),
      /* @__PURE__ */ jsx("div", { style: { width: 10, height: 10, borderRadius: "50%", background: "#fef3c7" } }),
      /* @__PURE__ */ jsx("div", { style: { width: 10, height: 10, borderRadius: "50%", background: "#dcfce7" } }),
      /* @__PURE__ */ jsx("span", { style: { fontSize: 11, color: "#94a3b8", marginLeft: 8, fontFamily: "monospace" }, children: "Brouillon généré par ImmoFlash" })
    ] }),
    /* @__PURE__ */ jsxs("div", { style: { padding: "14px 16px" }, children: [
      /* @__PURE__ */ jsxs("p", { style: { fontSize: 11, color: "#94a3b8", margin: "0 0 4px" }, children: [
        "À : ",
        /* @__PURE__ */ jsx("span", { style: { color: "#0f172a" }, children: "sophie.martin@gmail.com" })
      ] }),
      /* @__PURE__ */ jsxs("p", { style: { fontSize: 11, color: "#94a3b8", margin: "0 0 10px" }, children: [
        "Objet : ",
        /* @__PURE__ */ jsx("span", { style: { color: "#0f172a", fontWeight: 600 }, children: "Le bien qui correspond à vos critères — réf. #2847" })
      ] }),
      /* @__PURE__ */ jsx("div", { style: { height: 1, background: "#f1f5f9", margin: "0 0 10px" } }),
      /* @__PURE__ */ jsx("p", { style: { fontSize: 12, color: "#475569", lineHeight: 1.6, margin: "0 0 8px" }, children: "Bonjour Sophie," }),
      /* @__PURE__ */ jsx("p", { style: { fontSize: 12, color: "#475569", lineHeight: 1.6, margin: "0 0 8px" }, children: "J'ai pensé à vous en voyant ce T3 lumineux à Antibes — 68 m², calme absolu, garage inclus, à 345 000 €." }),
      /* @__PURE__ */ jsxs("p", { style: { fontSize: 12, color: "#475569", lineHeight: 1.6, margin: 0 }, children: [
        "Il correspond à ",
        /* @__PURE__ */ jsx("strong", { style: { color: "#0f172a" }, children: "92/100" }),
        " de vos critères. Je peux vous organiser une visite cette semaine."
      ] }),
      /* @__PURE__ */ jsxs("div", { style: { marginTop: 12, display: "inline-flex", alignItems: "center", gap: 6, background: "#0f172a", borderRadius: 8, padding: "6px 14px" }, children: [
        /* @__PURE__ */ jsx("span", { style: { fontSize: 11, color: "#fff", fontWeight: 600 }, children: "Envoyer" }),
        /* @__PURE__ */ jsx("svg", { width: "11", height: "11", viewBox: "0 0 24 24", fill: "none", children: /* @__PURE__ */ jsx("path", { d: "M5 12h14M13 6l6 6-6 6", stroke: "#38bdf8", strokeWidth: "2.5", strokeLinecap: "round", strokeLinejoin: "round" }) })
      ] })
    ] })
  ] });
}
function ChatPreview() {
  return /* @__PURE__ */ jsxs("div", { style: { background: "#0f172a", border: "1px solid rgba(56,189,248,0.2)", borderRadius: 14, width: 360, overflow: "hidden", boxShadow: "0 8px 32px rgba(0,0,0,0.3)" }, children: [
    /* @__PURE__ */ jsxs("div", { style: { borderBottom: "1px solid rgba(255,255,255,0.07)", padding: "10px 16px", display: "flex", alignItems: "center", gap: 8 }, children: [
      /* @__PURE__ */ jsx("div", { style: { width: 8, height: 8, borderRadius: "50%", background: "#22c55e" } }),
      /* @__PURE__ */ jsx("span", { style: { fontSize: 12, color: "#94a3b8", fontWeight: 500 }, children: "Agent IA — ImmoFlash" })
    ] }),
    /* @__PURE__ */ jsxs("div", { style: { padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10 }, children: [
      /* @__PURE__ */ jsx("div", { style: { alignSelf: "flex-end", background: "rgba(56,189,248,0.15)", border: "1px solid rgba(56,189,248,0.25)", borderRadius: "12px 12px 4px 12px", padding: "8px 12px", maxWidth: "85%" }, children: /* @__PURE__ */ jsx("p", { style: { fontSize: 12, color: "#e2e8f0", margin: 0, lineHeight: 1.5 }, children: "Quel bien correspond le mieux à Sophie, budget 350k, cherche du calme et un garage ?" }) }),
      /* @__PURE__ */ jsxs("div", { style: { alignSelf: "flex-start", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "4px 12px 12px 12px", padding: "8px 12px", maxWidth: "90%" }, children: [
        /* @__PURE__ */ jsx("p", { style: { fontSize: 12, color: "#94a3b8", margin: "0 0 6px", lineHeight: 1.5 }, children: "Meilleur match pour Sophie :" }),
        /* @__PURE__ */ jsxs("div", { style: { background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: 8, padding: "6px 10px", marginBottom: 4 }, children: [
          /* @__PURE__ */ jsx("p", { style: { fontSize: 12, color: "#e2e8f0", margin: 0, fontWeight: 600 }, children: "T3 Antibes — 68 m² · 345 000 €" }),
          /* @__PURE__ */ jsxs("p", { style: { fontSize: 11, color: "#94a3b8", margin: "2px 0 0" }, children: [
            "Score ",
            /* @__PURE__ */ jsx("strong", { style: { color: "#22c55e" }, children: "92/100" }),
            " · Calme, garage, budget OK"
          ] })
        ] })
      ] })
    ] })
  ] });
}
function MatchingPreview() {
  const biens = [
    { ref: "#2847", label: "T3 Antibes 68m²", score: 92, color: "#22c55e" },
    { ref: "#1923", label: "T4 Nice Centre 85m²", score: 71, color: "#f59e0b" },
    { ref: "#3301", label: "Studio Cannes 32m²", score: 38, color: "#ef4444" }
  ];
  return /* @__PURE__ */ jsxs("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, width: 460 }, children: [
    /* @__PURE__ */ jsxs("div", { style: { background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 12, padding: "14px" }, children: [
      /* @__PURE__ */ jsx("p", { style: { fontSize: 10, fontWeight: 700, color: "#38bdf8", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 10px" }, children: "Prospect" }),
      /* @__PURE__ */ jsx("p", { style: { fontSize: 13, fontWeight: 700, color: "#0f172a", margin: "0 0 6px" }, children: "Sophie Martin" }),
      /* @__PURE__ */ jsx("div", { style: { display: "flex", flexDirection: "column", gap: 4 }, children: [["Budget", "< 350 000 €"], ["Surface", "≥ 60 m²"], ["Secteur", "Antibes / Nice"], ["Critères", "Calme · Garage"]].map(([k, v]) => /* @__PURE__ */ jsxs("div", { style: { display: "flex", justifyContent: "space-between" }, children: [
        /* @__PURE__ */ jsx("span", { style: { fontSize: 11, color: "#94a3b8" }, children: k }),
        /* @__PURE__ */ jsx("span", { style: { fontSize: 11, color: "#475569", fontWeight: 500 }, children: v })
      ] }, k)) })
    ] }),
    /* @__PURE__ */ jsxs("div", { style: { display: "flex", flexDirection: "column", gap: 6 }, children: [
      /* @__PURE__ */ jsx("p", { style: { fontSize: 10, fontWeight: 700, color: "#38bdf8", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 4px" }, children: "Matchings" }),
      biens.map((b) => /* @__PURE__ */ jsxs("div", { style: { background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, padding: "8px 10px", display: "flex", alignItems: "center", gap: 8 }, children: [
        /* @__PURE__ */ jsxs("div", { style: { flex: 1 }, children: [
          /* @__PURE__ */ jsx("p", { style: { fontSize: 11, fontWeight: 600, color: "#0f172a", margin: 0 }, children: b.label }),
          /* @__PURE__ */ jsx("p", { style: { fontSize: 10, color: "#94a3b8", margin: 0 }, children: b.ref })
        ] }),
        /* @__PURE__ */ jsxs("div", { style: { background: `${b.color}18`, border: `1.5px solid ${b.color}`, borderRadius: 8, padding: "3px 7px", textAlign: "center", minWidth: 44 }, children: [
          /* @__PURE__ */ jsx("span", { style: { fontSize: 14, fontWeight: 800, color: b.color, lineHeight: 1 }, children: b.score }),
          /* @__PURE__ */ jsx("span", { style: { fontSize: 9, color: b.color, display: "block", opacity: 0.7 }, children: "/100" })
        ] })
      ] }, b.ref))
    ] })
  ] });
}
function PricingCardPreview({ name, price, subtitle, badge, features, cta, featured }) {
  return /* @__PURE__ */ jsxs("div", { style: {
    background: "#0f1e30",
    border: featured ? "1px solid rgba(56,189,248,0.35)" : "1px solid rgba(255,255,255,0.08)",
    borderRadius: 16,
    padding: "1.5rem",
    width: 200,
    display: "flex",
    flexDirection: "column",
    gap: 12,
    boxShadow: featured ? "0 0 40px rgba(56,189,248,0.12)" : "none"
  }, children: [
    badge && /* @__PURE__ */ jsx("span", { style: { background: "#38bdf8", color: "#0f1e30", borderRadius: 999, padding: "3px 10px", fontSize: 11, fontWeight: 700, alignSelf: "flex-start" }, children: badge }),
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("p", { style: { color: "#fff", fontWeight: 700, fontSize: 16, margin: "0 0 2px" }, children: name }),
      /* @__PURE__ */ jsx("p", { style: { color: "#64748b", fontSize: 12, margin: 0 }, children: subtitle })
    ] }),
    /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "baseline", gap: 4 }, children: [
      /* @__PURE__ */ jsxs("span", { style: { fontSize: 32, fontWeight: 800, color: "#fff", lineHeight: 1 }, children: [
        price,
        "€"
      ] }),
      /* @__PURE__ */ jsx("span", { style: { color: "#64748b", fontSize: 12 }, children: "HT / mois" })
    ] }),
    /* @__PURE__ */ jsx("div", { style: { height: 1, background: "rgba(255,255,255,0.08)" } }),
    /* @__PURE__ */ jsx("ul", { style: { listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 7 }, children: features.map((f) => /* @__PURE__ */ jsxs("li", { style: { display: "flex", alignItems: "flex-start", gap: 7, color: "#cbd5e1", fontSize: 12 }, children: [
      /* @__PURE__ */ jsx("span", { style: { flexShrink: 0, width: 15, height: 15, borderRadius: "50%", background: featured ? "rgba(56,189,248,0.15)" : "rgba(255,255,255,0.08)", color: featured ? "#38bdf8" : "#94a3b8", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, marginTop: 1 }, children: "✓" }),
      f
    ] }, f)) }),
    /* @__PURE__ */ jsx("div", { style: { marginTop: "auto", background: featured ? "#38bdf8" : "transparent", border: featured ? "none" : "1px solid rgba(255,255,255,0.2)", color: featured ? "#0f1e30" : "#fff", borderRadius: 8, padding: "8px 14px", fontSize: 13, fontWeight: 600, textAlign: "center", cursor: "pointer" }, children: cta })
  ] });
}
function FaqPreview() {
  const [open, setOpen] = useState(false);
  return /* @__PURE__ */ jsxs("div", { style: { width: 420, border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden" }, children: [
    /* @__PURE__ */ jsxs("div", { onClick: () => setOpen((o) => !o), style: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, padding: "1rem 1.25rem", cursor: "pointer", background: "#fff" }, children: [
      /* @__PURE__ */ jsx("span", { style: { fontSize: 14, fontWeight: 600, color: "#0f172a" }, children: "Comment ImmoFlash importe mes biens ?" }),
      /* @__PURE__ */ jsx("span", { style: { fontSize: 20, color: "#64748b", flexShrink: 0, lineHeight: 1, transition: "transform 200ms", transform: open ? "rotate(45deg)" : "none" }, children: "+" })
    ] }),
    open && /* @__PURE__ */ jsx("div", { style: { padding: "0 1.25rem 1rem", background: "#fff" }, children: /* @__PURE__ */ jsx("p", { style: { margin: 0, fontSize: 13, color: "#64748b", lineHeight: 1.7 }, children: "Depuis Hektor, un fichier Excel ou CSV, ou en saisie manuelle. L'import prend moins de 5 minutes." }) })
  ] });
}
function Showcase() {
  return /* @__PURE__ */ jsx("div", { style: { background: "#ffffff", minHeight: "100vh", padding: "3rem 2rem", fontFamily: "Inter, sans-serif" }, children: /* @__PURE__ */ jsxs("div", { style: { maxWidth: 1100, margin: "0 auto" }, children: [
    /* @__PURE__ */ jsxs("div", { style: { marginBottom: "3.5rem", paddingBottom: "2rem", borderBottom: "2px solid #f1f5f9" }, children: [
      /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }, children: [
        /* @__PURE__ */ jsxs("span", { style: { fontWeight: 800, fontSize: 22, color: "#0f172a", letterSpacing: "-0.5px" }, children: [
          "Immo",
          /* @__PURE__ */ jsx("span", { style: { color: "#38bdf8" }, children: "Flash" })
        ] }),
        /* @__PURE__ */ jsx("span", { style: { background: "#f1f5f9", color: "#64748b", borderRadius: 6, padding: "2px 10px", fontSize: 11, fontWeight: 600 }, children: "Design System" })
      ] }),
      /* @__PURE__ */ jsx("p", { style: { color: "#94a3b8", fontSize: 14, margin: 0 }, children: "Tous les composants et assets de la landing — fond blanc pour capture." })
    ] }),
    /* @__PURE__ */ jsx(Block, { title: "Palette de couleurs", children: [
      { name: "#0f172a", label: "Slate 900 — Dark base" },
      { name: "#1E3A5F", label: "Navy — Accent sombre" },
      { name: "#38bdf8", label: "Sky 400 — Accent principal" },
      { name: "#7dd3fc", label: "Sky 300 — Accent léger" },
      { name: "#22c55e", label: "Green — Score fort" },
      { name: "#f59e0b", label: "Amber — Score moyen" },
      { name: "#ef4444", label: "Red — Score faible" },
      { name: "#64748b", label: "Slate 500 — Texte secondaire" },
      { name: "#94a3b8", label: "Slate 400 — Texte tertiaire" },
      { name: "#e2e8f0", label: "Slate 200 — Bordures" },
      { name: "#f8fafc", label: "Slate 50 — Fond clair" }
    ].map((c) => /* @__PURE__ */ jsxs(Variant, { label: c.name, children: [
      /* @__PURE__ */ jsx("div", { style: { width: 60, height: 60, borderRadius: 10, background: c.name, border: "1px solid rgba(0,0,0,0.06)" } }),
      /* @__PURE__ */ jsx("span", { style: { fontSize: 11, color: "#64748b", maxWidth: 80, lineHeight: 1.4 }, children: c.label })
    ] }, c.name)) }),
    /* @__PURE__ */ jsx(Block, { title: "Typographie", children: /* @__PURE__ */ jsxs("div", { style: { display: "flex", flexDirection: "column", gap: 16, width: "100%" }, children: [
      /* @__PURE__ */ jsx(Variant, { label: "H1 — Hero (clamp 36–64px, 800)", children: /* @__PURE__ */ jsxs("p", { style: { fontSize: "clamp(36px, 5vw, 56px)", fontWeight: 800, color: "#0f172a", letterSpacing: "-1.5px", margin: 0, lineHeight: 1.08 }, children: [
        "Votre prochaine vente",
        /* @__PURE__ */ jsx("br", {}),
        /* @__PURE__ */ jsx("span", { style: { background: "linear-gradient(135deg, #38bdf8, #818cf8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }, children: "est dans votre fichier." })
      ] }) }),
      /* @__PURE__ */ jsx(Variant, { label: "H2 — Section (clamp 26–40px, 800)", children: /* @__PURE__ */ jsx("p", { style: { fontSize: "clamp(26px, 4vw, 40px)", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.8px", margin: 0 }, children: "Ce qui nous rend incontournables." }) }),
      /* @__PURE__ */ jsx(Variant, { label: "H3 — Card (clamp 18–22px, 700)", children: /* @__PURE__ */ jsx("p", { style: { fontSize: "clamp(18px, 2.2vw, 22px)", fontWeight: 700, color: "#0f172a", letterSpacing: "-0.4px", margin: 0, lineHeight: 1.3 }, children: "Le bon acheteur pour le bon bien." }) }),
      /* @__PURE__ */ jsx(Variant, { label: "Label — Feature (11px, 700, uppercase, #38bdf8)", children: /* @__PURE__ */ jsx("p", { style: { fontSize: 11, fontWeight: 700, color: "#38bdf8", textTransform: "uppercase", letterSpacing: "0.1em", margin: 0 }, children: "Matching IA" }) }),
      /* @__PURE__ */ jsx(Variant, { label: "Body — 14–16px, #64748b, lh 1.75", children: /* @__PURE__ */ jsx("p", { style: { fontSize: 15, color: "#64748b", lineHeight: 1.75, margin: 0, maxWidth: 520 }, children: "ImmoFlash croise budget, localisation, style de vie et te sort un score /100. Les meilleures paires remontent tout seules. Toi tu valides." }) }),
      /* @__PURE__ */ jsx(Variant, { label: "Mention — 13px, #334155", children: /* @__PURE__ */ jsx("p", { style: { fontSize: 13, color: "#334155", margin: 0 }, children: "Aucune carte bancaire · Opérationnel en 24h · Vos vraies données" }) })
    ] }) }),
    /* @__PURE__ */ jsxs(Block, { title: "Badges & Pills", children: [
      /* @__PURE__ */ jsx(Variant, { label: "Badge section (sky)", children: /* @__PURE__ */ jsx("span", { style: { display: "inline-block", background: "rgba(56,189,248,0.1)", color: "#38bdf8", border: "1px solid rgba(56,189,248,0.2)", borderRadius: 999, padding: "4px 14px", fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }, children: "Fonctionnalités" }) }),
      /* @__PURE__ */ jsx(Variant, { label: "Badge hero (sky dim)", children: /* @__PURE__ */ jsx("span", { style: { display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(56,189,248,0.08)", color: "#7dd3fc", border: "1px solid rgba(56,189,248,0.2)", borderRadius: 999, padding: "5px 14px", fontSize: 12, fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase" }, children: "IA pour agents immobiliers" }) }),
      /* @__PURE__ */ jsx(Variant, { label: "Badge filled (pricing)", children: /* @__PURE__ */ jsx("span", { style: { background: "#38bdf8", color: "#0f1e30", borderRadius: 999, padding: "4px 12px", fontSize: 12, fontWeight: 700 }, children: "Recommandé" }) }),
      /* @__PURE__ */ jsx(Variant, { label: "Badge solution (dark)", children: /* @__PURE__ */ jsx("span", { style: { fontSize: 11, fontWeight: 700, color: "#0f172a", background: "#38bdf8", borderRadius: 999, padding: "3px 10px" }, children: "Solution" }) }),
      /* @__PURE__ */ jsx(Variant, { label: "Badge lancement (locked)", children: /* @__PURE__ */ jsx("span", { style: { display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(56,189,248,0.08)", color: "#38bdf8", border: "1px solid rgba(56,189,248,0.2)", borderRadius: 999, padding: "5px 14px", fontSize: 12, fontWeight: 500 }, children: "Tarif garanti à vie pour les premières agences" }) }),
      /* @__PURE__ */ jsx(Variant, { label: "Badge instant (after)", children: /* @__PURE__ */ jsx("span", { style: { fontSize: 11, color: "#0f172a", background: "rgba(56,189,248,0.9)", borderRadius: 999, padding: "2px 8px", fontWeight: 700 }, children: "Instant" }) })
    ] }),
    /* @__PURE__ */ jsxs(Block, { title: "Boutons", children: [
      /* @__PURE__ */ jsx(Variant, { label: "btn-primary", children: /* @__PURE__ */ jsxs("a", { href: "#", onClick: (e) => e.preventDefault(), style: { display: "inline-flex", alignItems: "center", gap: 8, background: "#38bdf8", color: "#0f172a", borderRadius: 8, padding: "11px 22px", fontSize: 14, fontWeight: 700, textDecoration: "none" }, children: [
        "Demander une démo",
        /* @__PURE__ */ jsx("svg", { width: "14", height: "14", fill: "none", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { stroke: "currentColor", strokeWidth: "2.5", strokeLinecap: "round", strokeLinejoin: "round", d: "M5 12h14M12 5l7 7-7 7" }) })
      ] }) }),
      /* @__PURE__ */ jsx(Variant, { label: "btn-ghost-light", children: /* @__PURE__ */ jsx("a", { href: "#", onClick: (e) => e.preventDefault(), style: { display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.75)", border: "1px solid rgba(255,255,255,0.14)", borderRadius: 8, padding: "11px 22px", fontSize: 14, fontWeight: 600, textDecoration: "none", backdropFilter: "blur(4px)" }, children: "Voir comment ça marche" }) }),
      /* @__PURE__ */ jsx(Variant, { label: "btn-filled-dark (pricing)", children: /* @__PURE__ */ jsx("a", { href: "#", onClick: (e) => e.preventDefault(), style: { display: "block", background: "#38bdf8", color: "#0f1e30", borderRadius: 8, padding: "10px 20px", fontSize: 13, fontWeight: 700, textDecoration: "none", textAlign: "center" }, children: "Demander une démo" }) }),
      /* @__PURE__ */ jsx(Variant, { label: "btn-outline-white (pricing)", children: /* @__PURE__ */ jsx("a", { href: "#", onClick: (e) => e.preventDefault(), style: { display: "block", background: "transparent", color: "#fff", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 8, padding: "10px 20px", fontSize: 13, fontWeight: 600, textDecoration: "none", textAlign: "center" }, children: "Commencer" }) }),
      /* @__PURE__ */ jsx(Variant, { label: "btn-cta-large (final section)", children: /* @__PURE__ */ jsxs("a", { href: "#", onClick: (e) => e.preventDefault(), style: { display: "inline-flex", alignItems: "center", gap: 8, background: "#38bdf8", color: "#0f172a", borderRadius: 8, padding: "14px 32px", fontSize: 15, fontWeight: 700, textDecoration: "none" }, children: [
        "Demander une démo gratuite",
        /* @__PURE__ */ jsx("svg", { width: "15", height: "15", fill: "none", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { stroke: "currentColor", strokeWidth: "2.5", strokeLinecap: "round", strokeLinejoin: "round", d: "M5 12h14M12 5l7 7-7 7" }) })
      ] }) })
    ] }),
    /* @__PURE__ */ jsxs(Block, { title: "Score badge /100", children: [
      /* @__PURE__ */ jsx(Variant, { label: "Fort ≥ 80 (vert)", children: /* @__PURE__ */ jsx(ScoreBadge, { score: 92 }) }),
      /* @__PURE__ */ jsx(Variant, { label: "Moyen 55–79 (orange)", children: /* @__PURE__ */ jsx(ScoreBadge, { score: 71 }) }),
      /* @__PURE__ */ jsx(Variant, { label: "Faible < 55 (rouge)", children: /* @__PURE__ */ jsx(ScoreBadge, { score: 38 }) }),
      /* @__PURE__ */ jsx(Variant, { label: "Score inline (text)", children: /* @__PURE__ */ jsxs("span", { style: { fontSize: 24, fontWeight: 800, color: "#22c55e", letterSpacing: "-0.5px" }, children: [
        "92",
        /* @__PURE__ */ jsx("span", { style: { fontSize: 14, color: "#94a3b8", fontWeight: 500 }, children: "/100" })
      ] }) })
    ] }),
    /* @__PURE__ */ jsxs(Block, { title: "Timeline dot", children: [
      /* @__PURE__ */ jsx(Variant, { label: "Dot + radar pulse", children: /* @__PURE__ */ jsxs("div", { style: { position: "relative", width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center" }, children: [
        /* @__PURE__ */ jsx("style", { children: `
                @keyframes radarPulse {
                  0% { transform: scale(1); opacity: 0.6; }
                  100% { transform: scale(2.5); opacity: 0; }
                }
                .showcase-dot::after {
                  content: '';
                  position: absolute;
                  width: 10px; height: 10px;
                  border-radius: 50%;
                  background: rgba(100,116,139,0.4);
                  animation: radarPulse 2s ease-out infinite;
                }
              ` }),
        /* @__PURE__ */ jsx("div", { className: "showcase-dot", style: { position: "relative", width: 10, height: 10, borderRadius: "50%", background: "#64748b", boxShadow: "0 0 0 3px rgba(100,116,139,0.25)", display: "flex", alignItems: "center", justifyContent: "center" } })
      ] }) }),
      /* @__PURE__ */ jsx(Variant, { label: "Ligne timeline (1px, #cbd5e1)", children: /* @__PURE__ */ jsx("div", { style: { width: 2, height: 120, background: "linear-gradient(to bottom, transparent, #cbd5e1 15%, #cbd5e1 85%, transparent)", borderRadius: 2 } }) })
    ] }),
    /* @__PURE__ */ jsx(Block, { title: "Asset — Feature 1 · Matching split (prospect + scores)", children: /* @__PURE__ */ jsx(MatchingPreview, {}) }),
    /* @__PURE__ */ jsx(Block, { title: "Asset — Feature 3 · Email généré", children: /* @__PURE__ */ jsx(EmailPreview, {}) }),
    /* @__PURE__ */ jsx(Block, { title: "Asset — Feature 2 · Chat Agent IA", children: /* @__PURE__ */ jsx(ChatPreview, {}) }),
    /* @__PURE__ */ jsxs(Block, { title: "Avant / Après — rows", children: [
      /* @__PURE__ */ jsx(Variant, { label: "Before item (animé)", children: /* @__PURE__ */ jsxs("div", { style: { background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "1rem 1.25rem", width: 280 }, children: [
        /* @__PURE__ */ jsx("p", { style: { fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 12px" }, children: "Sans ImmoFlash" }),
        [
          { text: "Exporter les biens manuellement", note: "5 min" },
          { text: "Parcourir les fiches prospect", note: "20 min" }
        ].map((item, i) => /* @__PURE__ */ jsxs("div", { style: { marginBottom: 10 }, children: [
          /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: 8 }, children: [
            /* @__PURE__ */ jsx("span", { style: { fontSize: 13, color: "#64748b", flex: 1 }, children: item.text }),
            /* @__PURE__ */ jsx("span", { style: { fontSize: 11, color: "#94a3b8", fontWeight: 500 }, children: item.note })
          ] }),
          /* @__PURE__ */ jsx("div", { style: { marginTop: 6, height: 2, background: "#f1f5f9", borderRadius: 2 }, children: /* @__PURE__ */ jsx("div", { style: { height: "100%", width: "80%", background: "#cbd5e1", borderRadius: 2 } }) })
        ] }, i)),
        /* @__PURE__ */ jsxs("div", { style: { marginTop: 12, paddingTop: 10, borderTop: "1px solid #f1f5f9", display: "flex", alignItems: "baseline", gap: 6 }, children: [
          /* @__PURE__ */ jsx("span", { style: { color: "#94a3b8", fontSize: 12 }, children: "Total" }),
          /* @__PURE__ */ jsx("span", { style: { color: "#475569", fontWeight: 700, fontSize: 20 }, children: "~55 min" })
        ] })
      ] }) }),
      /* @__PURE__ */ jsx(Variant, { label: "After item (dark)", children: /* @__PURE__ */ jsxs("div", { style: { background: "linear-gradient(150deg, #071220 0%, #0b1e38 60%, #0c2647 100%)", border: "1px solid rgba(56,189,248,0.25)", borderRadius: 16, padding: "1rem 1.25rem", width: 280, position: "relative", overflow: "hidden" }, children: [
        /* @__PURE__ */ jsx("div", { style: { position: "absolute", top: 0, left: "10%", right: "10%", height: 1, background: "linear-gradient(90deg, transparent, rgba(56,189,248,0.85), transparent)" } }),
        /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }, children: [
          /* @__PURE__ */ jsx("p", { style: { fontSize: 10, fontWeight: 700, color: "#38bdf8", textTransform: "uppercase", letterSpacing: "0.1em", margin: 0 }, children: "Avec ImmoFlash" }),
          /* @__PURE__ */ jsx("span", { style: { fontSize: 10, fontWeight: 700, color: "#0f172a", background: "#38bdf8", borderRadius: 999, padding: "2px 8px" }, children: "Solution" })
        ] }),
        ["Synchronisation auto du portefeuille", "Score /100 calculé en temps réel"].map((text, i) => /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: 8, padding: "5px 8px", borderRadius: 8, marginBottom: 4 }, children: [
          /* @__PURE__ */ jsx("span", { style: { fontSize: 13, color: "#cbd5e1", flex: 1 }, children: text }),
          /* @__PURE__ */ jsx("span", { style: { fontSize: 10, color: "#0f172a", background: "rgba(56,189,248,0.9)", borderRadius: 999, padding: "2px 7px", fontWeight: 700 }, children: "Instant" })
        ] }, i)),
        /* @__PURE__ */ jsxs("div", { style: { marginTop: 12, paddingTop: 10, borderTop: "1px solid rgba(56,189,248,0.12)", display: "flex", alignItems: "baseline", gap: 6 }, children: [
          /* @__PURE__ */ jsx("span", { style: { color: "#64748b", fontSize: 12 }, children: "Total" }),
          /* @__PURE__ */ jsx("span", { style: { color: "#38bdf8", fontWeight: 800, fontSize: 24, letterSpacing: "-1px" }, children: "30s" })
        ] })
      ] }) }),
      /* @__PURE__ */ jsx(Variant, { label: "Arrow badge (centre)", children: /* @__PURE__ */ jsx("div", { style: { width: 36, height: 36, borderRadius: "50%", background: "#0f172a", border: "1.5px solid rgba(56,189,248,0.4)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 16px rgba(56,189,248,0.25)" }, children: /* @__PURE__ */ jsx("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", children: /* @__PURE__ */ jsx("path", { d: "M5 12h14M13 6l6 6-6 6", stroke: "#38bdf8", strokeWidth: "2.5", strokeLinecap: "round", strokeLinejoin: "round" }) }) }) })
    ] }),
    /* @__PURE__ */ jsxs(Block, { title: "Pricing cards", children: [
      /* @__PURE__ */ jsx(
        PricingCardPreview,
        {
          name: "Starter",
          price: "49",
          subtitle: "Idéal pour démarrer",
          features: ["Jusqu'à 50 biens", "20 matchings / mois", "Import Hektor", "Support email"],
          cta: "Commencer",
          featured: false
        }
      ),
      /* @__PURE__ */ jsx(
        PricingCardPreview,
        {
          name: "Pro",
          price: "99",
          subtitle: "Pour les agences actives",
          badge: "Recommandé",
          features: ["Biens illimités", "Matchings illimités", "Emails IA générés", "Dashboard + historique", "Agent IA intégré"],
          cta: "Demander une démo",
          featured: true
        }
      ),
      /* @__PURE__ */ jsx(
        PricingCardPreview,
        {
          name: "Agence+",
          price: "199",
          subtitle: "Multi-agents, marque blanche",
          features: ["Tout le plan Pro", "Multi-utilisateurs (5 agents)", "Rapports mensuels auto", "Marque blanche"],
          cta: "Nous contacter",
          featured: false
        }
      )
    ] }),
    /* @__PURE__ */ jsx(Block, { title: "FAQ accordion item", children: /* @__PURE__ */ jsx(FaqPreview, {}) }),
    /* @__PURE__ */ jsxs(Block, { title: "Stats & chiffres clés", children: [
      /* @__PURE__ */ jsx(Variant, { label: "30s (highlight bleu)", children: /* @__PURE__ */ jsx("div", { style: { display: "flex", alignItems: "baseline", gap: 4 }, children: /* @__PURE__ */ jsx("span", { style: { color: "#38bdf8", fontWeight: 800, fontSize: 48, letterSpacing: "-2px", lineHeight: 1 }, children: "30s" }) }) }),
      /* @__PURE__ */ jsx(Variant, { label: "~55 min (grey)", children: /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "baseline", gap: 6 }, children: [
        /* @__PURE__ */ jsx("span", { style: { color: "#475569", fontWeight: 700, fontSize: 36, letterSpacing: "-1px", lineHeight: 1 }, children: "~55 min" }),
        /* @__PURE__ */ jsx("span", { style: { color: "#cbd5e1", fontSize: 13 }, children: "par session" })
      ] }) }),
      /* @__PURE__ */ jsx(Variant, { label: "5–8h / semaine", children: /* @__PURE__ */ jsxs("p", { style: { color: "#94a3b8", fontSize: 14, margin: 0 }, children: [
        "En moyenne, nos clients récupèrent",
        " ",
        /* @__PURE__ */ jsx("strong", { style: { color: "#0f172a" }, children: "5 à 8 heures par semaine et par agent." })
      ] }) })
    ] }),
    /* @__PURE__ */ jsx(Block, { title: "Logos partenaires", children: (() => {
      const b = "/";
      return [
        { src: `${b}logo/b&b.png`, alt: "B&B", h: 60 },
        { src: `${b}logo/rastel.png`, alt: "Rastel", h: 56 },
        { src: `${b}logo/saintfrancois.png`, alt: "Saint-François", h: 64 },
        { src: `${b}logo/sierra.png`, alt: "Sierra", h: 52 },
        { src: `${b}logo/revedesud.svg`, alt: "Rêve du Sud", h: 56 },
        { src: `${b}logo/intramuros.jpg`, alt: "Intramuros", h: 48 }
      ];
    })().map((logo, i) => /* @__PURE__ */ jsxs("div", { style: { display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }, children: [
      /* @__PURE__ */ jsx("div", { style: { background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "center", minWidth: 90 }, children: /* @__PURE__ */ jsx("img", { src: logo.src, alt: logo.alt, style: { height: logo.h, width: "auto", opacity: 0.8, filter: "grayscale(20%)" } }) }),
      /* @__PURE__ */ jsx("span", { style: { fontSize: 11, color: "#94a3b8" }, children: logo.alt })
    ] }, i)) }),
    /* @__PURE__ */ jsx("div", { style: { marginTop: "4rem", paddingTop: "2rem", borderTop: "1px solid #f1f5f9", textAlign: "center" }, children: /* @__PURE__ */ jsxs("p", { style: { color: "#cbd5e1", fontSize: 12, margin: 0 }, children: [
      "ImmoFlash Design System — usage interne · ",
      /* @__PURE__ */ jsx("a", { href: "/", style: { color: "#38bdf8", textDecoration: "none" }, children: "← Retour landing" })
    ] }) })
  ] }) });
}
const API_URL = "/api";
const DASHBOARD_URL = "https://immoflash.app/dashboard";
const S = {
  input: (err) => ({
    width: "100%",
    background: "rgba(255,255,255,0.05)",
    border: `1.5px solid ${err ? "#f87171" : "rgba(255,255,255,0.1)"}`,
    borderRadius: 10,
    padding: "13px 16px",
    color: "#f1f5f9",
    fontSize: 15,
    outline: "none",
    fontFamily: "inherit",
    boxSizing: "border-box",
    transition: "border-color 150ms, background 150ms"
  }),
  label: {
    display: "block",
    fontSize: 11,
    fontWeight: 700,
    color: "#64748b",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    marginBottom: 7
  },
  btnPrimary: (disabled) => ({
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: "14px 28px",
    borderRadius: 12,
    border: "none",
    fontFamily: "inherit",
    fontSize: 15,
    fontWeight: 700,
    cursor: disabled ? "not-allowed" : "pointer",
    background: disabled ? "rgba(56,189,248,0.25)" : "linear-gradient(135deg, #0ea5e9 0%, #38bdf8 100%)",
    color: disabled ? "rgba(15,23,42,0.5)" : "#0f172a",
    boxShadow: disabled ? "none" : "0 4px 24px rgba(56,189,248,0.3)",
    transition: "all 150ms"
  }),
  btnBack: {
    padding: "14px 20px",
    borderRadius: 12,
    border: "1.5px solid rgba(255,255,255,0.1)",
    background: "rgba(255,255,255,0.04)",
    color: "#64748b",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "inherit",
    transition: "all 150ms"
  }
};
function Field({ label, type = "text", value, onChange, placeholder, required, error, autoFocus, hint }) {
  return /* @__PURE__ */ jsxs("div", { style: { marginBottom: "1.1rem" }, children: [
    /* @__PURE__ */ jsxs("label", { style: S.label, children: [
      label,
      required && /* @__PURE__ */ jsx("span", { style: { color: "#38bdf8" }, children: " *" })
    ] }),
    /* @__PURE__ */ jsx(
      "input",
      {
        type,
        value,
        onChange: (e) => onChange(e.target.value),
        placeholder,
        autoFocus,
        style: S.input(error),
        onFocus: (e) => {
          e.target.style.borderColor = "#38bdf8";
          e.target.style.background = "rgba(56,189,248,0.06)";
        },
        onBlur: (e) => {
          e.target.style.borderColor = error ? "#f87171" : "rgba(255,255,255,0.1)";
          e.target.style.background = "rgba(255,255,255,0.05)";
        }
      }
    ),
    hint && !error && /* @__PURE__ */ jsx("p", { style: { margin: "5px 0 0", fontSize: 12, color: "#334155" }, children: hint }),
    error && /* @__PURE__ */ jsx("p", { style: { margin: "5px 0 0", fontSize: 12, color: "#f87171" }, children: error })
  ] });
}
function Spinner({ size = 18, color = "#0f172a" }) {
  return /* @__PURE__ */ jsx("span", { style: {
    display: "inline-block",
    width: size,
    height: size,
    flexShrink: 0,
    border: `2.5px solid ${color}44`,
    borderTopColor: color,
    borderRadius: "50%",
    animation: "spin 0.7s linear infinite"
  } });
}
function Stepper({ step, total }) {
  return /* @__PURE__ */ jsx("div", { style: { display: "flex", alignItems: "center", justifyContent: "center", gap: 0, marginBottom: "2.5rem" }, children: Array.from({ length: total }, (_, i) => {
    const n = i + 1;
    const done = n < step;
    const active = n === step;
    return /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center" }, children: [
      /* @__PURE__ */ jsx("div", { style: {
        width: 32,
        height: 32,
        borderRadius: "50%",
        background: done ? "#38bdf8" : active ? "rgba(56,189,248,0.15)" : "rgba(255,255,255,0.04)",
        border: `2px solid ${done || active ? "#38bdf8" : "rgba(255,255,255,0.1)"}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 12,
        fontWeight: 700,
        transition: "all 300ms",
        color: done ? "#0f172a" : active ? "#38bdf8" : "#334155"
      }, children: done ? /* @__PURE__ */ jsx("svg", { width: "13", height: "13", viewBox: "0 0 24 24", fill: "none", children: /* @__PURE__ */ jsx("path", { d: "M5 13l4 4L19 7", stroke: "currentColor", strokeWidth: "2.5", strokeLinecap: "round", strokeLinejoin: "round" }) }) : n }),
      n < total && /* @__PURE__ */ jsx("div", { style: {
        width: 48,
        height: 2,
        margin: "0 4px",
        background: done ? "#38bdf8" : "rgba(255,255,255,0.08)",
        transition: "background 300ms"
      } })
    ] }, n);
  }) });
}
function Onboarding() {
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [agence, setAgence] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [step, setStep] = useState(1);
  const [importMode, setImportMode] = useState(null);
  const [ftpHost, setFtpHost] = useState("");
  const [ftpUser, setFtpUser] = useState("");
  const [ftpPass, setFtpPass] = useState("");
  const [ftpPath, setFtpPath] = useState("/Annonces.csv");
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [siteUrl, setSiteUrl] = useState("");
  const [scrapePreview, setScrapePreview] = useState(null);
  const [scrapeLoading, setScrapeLoading] = useState(false);
  const [scrapeError, setScrapeError] = useState(null);
  const [scrapeStepIdx, setScrapeStepIdx] = useState(0);
  const scrapeTimers = useRef([]);
  const SCRAPE_STEPS = [
    { text: "Connexion au site…", sub: "Récupération du contenu de la page" },
    { text: "Lecture des annonces…", sub: "Parcours de la structure HTML" },
    { text: "Extraction par intelligence artificielle…", sub: "Claude analyse chaque annonce" },
    { text: "Structuration des données…", sub: "Prix, surfaces, types, localisations" },
    { text: "Finalisation…", sub: "Presque prêt !" }
  ];
  const SCRAPE_DELAYS = [0, 3500, 8e3, 15e3, 22e3];
  useEffect(() => {
    scrapeTimers.current.forEach(clearTimeout);
    scrapeTimers.current = [];
    if (!scrapeLoading) {
      setScrapeStepIdx(0);
      return;
    }
    SCRAPE_DELAYS.forEach((delay, i) => {
      const t = setTimeout(() => setScrapeStepIdx(i), delay);
      scrapeTimers.current.push(t);
    });
    return () => scrapeTimers.current.forEach(clearTimeout);
  }, [scrapeLoading]);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [result, setResult] = useState(null);
  useEffect(() => {
    document.title = "Démarrer — ImmoFlash";
  }, []);
  const MAX_FILE_SIZE = 10 * 1024 * 1024;
  const setFileChecked = useCallback((f) => {
    if (!f) return;
    if (f.size > MAX_FILE_SIZE) {
      setApiError("Fichier trop volumineux (max 10 Mo). Divisez votre fichier si nécessaire.");
      return;
    }
    setFile(f);
    setApiError(null);
  }, []);
  const handleDrop = useCallback((e) => {
    var _a;
    e.preventDefault();
    setDragging(false);
    const f = (_a = e.dataTransfer.files) == null ? void 0 : _a[0];
    if (f) setFileChecked(f);
  }, [setFileChecked]);
  const onDragOver = useCallback((e) => {
    e.preventDefault();
    setDragging(true);
  }, []);
  const onDragLeave = useCallback(() => setDragging(false), []);
  function validateStep1() {
    var _a;
    const e = {};
    if (!nom.trim()) e.nom = "Obligatoire";
    if (!email.trim() || !email.includes("@") || !((_a = email.split("@")[1]) == null ? void 0 : _a.includes("."))) e.email = "Email invalide";
    if (!agence.trim()) e.agence = "Obligatoire";
    setFieldErrors(e);
    return !Object.keys(e).length;
  }
  function validateFtp() {
    const e = {};
    if (!ftpHost.trim()) e.ftpHost = "Obligatoire";
    if (!ftpUser.trim()) e.ftpUser = "Obligatoire";
    if (!ftpPass.trim()) e.ftpPass = "Obligatoire";
    if (!ftpPath.trim()) e.ftpPath = "Obligatoire";
    setFieldErrors(e);
    return !Object.keys(e).length;
  }
  function next() {
    setApiError(null);
    if (step === 1) {
      if (!validateStep1()) return;
      setStep(2);
    } else if (step === 2) {
      if (!importMode) return;
      if (importMode === "demo") submit();
      else setStep(3);
    } else if (step === 3) {
      if (importMode === "hektor_ftp") {
        if (!validateFtp()) return;
        submit();
      } else if (importMode === "csv") {
        if (!file) {
          setApiError("Veuillez sélectionner un fichier.");
          return;
        }
        submit();
      } else if (importMode === "scrape") {
        if (!scrapePreview) return;
        submit();
      }
    }
  }
  async function analyserSite() {
    if (!siteUrl.trim()) return;
    setScrapeLoading(true);
    setScrapeError(null);
    setScrapePreview(null);
    try {
      const res = await fetch(`${API_URL}/scrape-preview`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: siteUrl.trim() })
      });
      const data = await res.json();
      if (!res.ok) {
        setScrapeError(data.detail || "Erreur d'analyse.");
        return;
      }
      if (!data.nb_biens) {
        setScrapeError("Aucun bien trouvé. Essayez une URL de page listing plus spécifique (ex: /vente ou /annonces).");
        return;
      }
      setScrapePreview(data);
    } catch {
      setScrapeError("Impossible de contacter le serveur.");
    } finally {
      setScrapeLoading(false);
    }
  }
  function back() {
    setApiError(null);
    if (step === 2) setStep(1);
    if (step === 3) {
      setStep(2);
      setFile(null);
      setScrapePreview(null);
      setScrapeError(null);
    }
  }
  async function submit() {
    setLoading(true);
    setApiError(null);
    const fd = new FormData();
    fd.append("nom", nom.trim());
    fd.append("email", email.trim().toLowerCase());
    fd.append("agence_nom", agence.trim());
    fd.append("mode", importMode);
    if (importMode === "hektor_ftp") {
      fd.append("ftp_host", ftpHost.trim());
      fd.append("ftp_user", ftpUser.trim());
      fd.append("ftp_pass", ftpPass.trim());
      fd.append("ftp_path", ftpPath.trim());
    }
    if (importMode === "csv" && file) fd.append("file", file);
    if (importMode === "scrape" && scrapePreview) {
      fd.append("biens_json", JSON.stringify(scrapePreview.biens));
    }
    try {
      const res = await fetch(`${API_URL}/onboard`, { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) {
        setApiError(data.detail || "Erreur serveur.");
        setLoading(false);
        return;
      }
      setResult(data);
      setTimeout(() => {
        window.location.href = `${DASHBOARD_URL.replace(/\/$/, "")}/?token=${data.access_token}`;
      }, 2800);
    } catch {
      setApiError("Impossible de contacter le serveur.");
      setLoading(false);
    }
  }
  const totalSteps = importMode === "demo" ? 2 : 3;
  return /* @__PURE__ */ jsxs("div", { style: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    background: "#050c15",
    fontFamily: "'Inter', system-ui, sans-serif",
    color: "#f1f5f9"
  }, children: [
    /* @__PURE__ */ jsxs("div", { style: { position: "fixed", inset: 0, pointerEvents: "none", overflow: "hidden", zIndex: 0 }, children: [
      /* @__PURE__ */ jsx("div", { style: { position: "absolute", inset: 0, backgroundImage: "radial-gradient(rgba(148,163,184,0.04) 1px, transparent 1px)", backgroundSize: "32px 32px" } }),
      /* @__PURE__ */ jsx("div", { style: { position: "absolute", width: 1e3, height: 800, top: -300, left: -250, borderRadius: "50%", background: "radial-gradient(ellipse, rgba(6,182,212,0.26) 0%, rgba(14,165,233,0.10) 40%, transparent 68%)", filter: "blur(50px)" } }),
      /* @__PURE__ */ jsx("div", { style: { position: "absolute", width: 900, height: 750, bottom: -280, right: -200, borderRadius: "50%", background: "radial-gradient(ellipse, rgba(99,60,220,0.28) 0%, rgba(124,58,237,0.10) 40%, transparent 68%)", filter: "blur(50px)" } }),
      /* @__PURE__ */ jsx("div", { style: { position: "absolute", width: 500, height: 420, top: -100, right: -80, borderRadius: "50%", background: "radial-gradient(ellipse, rgba(56,189,248,0.12) 0%, transparent 65%)", filter: "blur(45px)" } }),
      /* @__PURE__ */ jsx("div", { style: { position: "absolute", width: 460, height: 380, bottom: -80, left: -60, borderRadius: "50%", background: "radial-gradient(ellipse, rgba(139,92,246,0.13) 0%, transparent 65%)", filter: "blur(40px)" } }),
      /* @__PURE__ */ jsx("div", { style: { position: "absolute", width: 600, height: 400, top: "50%", left: "50%", transform: "translate(-50%, -50%)", borderRadius: "50%", background: "radial-gradient(ellipse, rgba(14,165,233,0.06) 0%, transparent 70%)", filter: "blur(30px)" } }),
      /* @__PURE__ */ jsx("div", { style: { position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg, transparent 5%, rgba(56,189,248,0.2) 30%, rgba(139,92,246,0.18) 70%, transparent 95%)" } })
    ] }),
    /* @__PURE__ */ jsxs("header", { style: { position: "relative", zIndex: 1, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1.25rem 2rem", borderBottom: "1px solid rgba(255,255,255,0.05)" }, children: [
      /* @__PURE__ */ jsxs(Link, { to: "/", style: { textDecoration: "none", fontWeight: 800, fontSize: 18, color: "#f1f5f9" }, children: [
        "Immo",
        /* @__PURE__ */ jsx("span", { style: { color: "#38bdf8" }, children: "Flash" })
      ] }),
      /* @__PURE__ */ jsxs(
        "a",
        {
          href: `${DASHBOARD_URL}login`,
          style: { fontSize: 13, color: "#475569", textDecoration: "none", transition: "color 150ms" },
          onMouseEnter: (e) => e.target.style.color = "#94a3b8",
          onMouseLeave: (e) => e.target.style.color = "#475569",
          children: [
            "Déjà un compte ? ",
            /* @__PURE__ */ jsx("span", { style: { color: "#38bdf8", fontWeight: 600 }, children: "Se connecter" })
          ]
        }
      )
    ] }),
    /* @__PURE__ */ jsx("main", { style: { flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem 1rem", position: "relative", zIndex: 1 }, children: /* @__PURE__ */ jsx("div", { style: {
      width: "100%",
      maxWidth: 560,
      background: "rgba(255,255,255,0.025)",
      border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: 28,
      backdropFilter: "blur(16px)",
      WebkitBackdropFilter: "blur(16px)",
      boxShadow: "0 0 0 1px rgba(56,189,248,0.05), 0 30px 80px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.05)",
      padding: "2.5rem 2.5rem 2rem"
    }, children: result ? /* @__PURE__ */ jsxs("div", { style: { textAlign: "center", animation: "stepIn 320ms ease" }, children: [
      /* @__PURE__ */ jsx("div", { style: {
        width: 80,
        height: 80,
        borderRadius: "50%",
        margin: "0 auto 1.75rem",
        background: "rgba(56,189,248,0.1)",
        border: "2px solid rgba(56,189,248,0.3)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }, children: /* @__PURE__ */ jsx("svg", { width: "36", height: "36", viewBox: "0 0 24 24", fill: "none", children: /* @__PURE__ */ jsx("path", { d: "M5 13l4 4L19 7", stroke: "#38bdf8", strokeWidth: "2.5", strokeLinecap: "round", strokeLinejoin: "round" }) }) }),
      /* @__PURE__ */ jsx("h1", { style: { fontSize: "clamp(24px, 5vw, 36px)", fontWeight: 800, letterSpacing: "-0.8px", margin: "0 0 1rem", color: "#f1f5f9" }, children: "Votre espace est prêt !" }),
      result.syncing ? /* @__PURE__ */ jsxs("p", { style: { color: "#64748b", fontSize: 16, lineHeight: 1.7, margin: "0 0 1.5rem" }, children: [
        "La synchronisation Hektor est en cours en arrière-plan.",
        /* @__PURE__ */ jsx("br", {}),
        "Vos biens apparaîtront dans votre dashboard dans quelques instants."
      ] }) : /* @__PURE__ */ jsxs("p", { style: { color: "#64748b", fontSize: 16, lineHeight: 1.7, margin: "0 0 1.5rem" }, children: [
        result.nb_biens > 0 ? /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsxs("strong", { style: { color: "#38bdf8" }, children: [
            result.nb_biens,
            " biens"
          ] }),
          " importés avec succès. "
        ] }) : "",
        "Vous allez être redirigé automatiquement."
      ] }),
      /* @__PURE__ */ jsxs("div", { style: { background: "rgba(255,193,7,0.08)", border: "1px solid rgba(255,193,7,0.25)", borderRadius: 14, padding: "14px 18px", marginBottom: "1.5rem", textAlign: "left" }, children: [
        /* @__PURE__ */ jsx("p", { style: { margin: "0 0 6px", fontSize: 12, fontWeight: 700, color: "#fbbf24", letterSpacing: "0.06em", textTransform: "uppercase" }, children: "⚠ Notez votre email de connexion" }),
        /* @__PURE__ */ jsx("p", { style: { margin: "0 0 10px", fontSize: 13, color: "#94a3b8", lineHeight: 1.6 }, children: "Aucun mot de passe n'a été créé. Pour revenir à votre espace, rendez-vous sur la page de connexion et entrez votre email :" }),
        /* @__PURE__ */ jsx("div", { style: { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "8px 14px", fontFamily: "monospace", fontSize: 14, color: "#38bdf8", wordBreak: "break-all" }, children: email })
      ] }),
      /* @__PURE__ */ jsxs("div", { style: { display: "inline-flex", alignItems: "center", gap: 10, background: "rgba(56,189,248,0.08)", border: "1px solid rgba(56,189,248,0.2)", borderRadius: 999, padding: "10px 22px" }, children: [
        /* @__PURE__ */ jsx(Spinner, { size: 15, color: "#38bdf8" }),
        /* @__PURE__ */ jsx("span", { style: { fontSize: 14, color: "#38bdf8", fontWeight: 600 }, children: "Chargement de votre dashboard…" })
      ] })
    ] }, "success") : /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx(Stepper, { step, total: totalSteps }),
      step === 1 && /* @__PURE__ */ jsxs("div", { style: { animation: "stepIn 280ms ease" }, children: [
        /* @__PURE__ */ jsxs("div", { style: { marginBottom: "2rem", textAlign: "center" }, children: [
          /* @__PURE__ */ jsx("div", { style: { display: "inline-flex", alignItems: "center", gap: 7, background: "rgba(56,189,248,0.08)", border: "1px solid rgba(56,189,248,0.18)", borderRadius: 999, padding: "4px 14px", fontSize: 11, fontWeight: 600, color: "#7dd3fc", letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: "1.25rem" }, children: "Gratuit · 6 jours · Sans carte bancaire" }),
          /* @__PURE__ */ jsx("h1", { style: { fontSize: "clamp(26px, 5vw, 38px)", fontWeight: 800, letterSpacing: "-0.8px", margin: "0 0 0.5rem", color: "#f1f5f9" }, children: "Créons votre espace" }),
          /* @__PURE__ */ jsx("p", { style: { color: "#475569", fontSize: 15, margin: 0 }, children: "30 secondes et vous êtes opérationnel." })
        ] }),
        /* @__PURE__ */ jsx(Field, { label: "Nom complet", value: nom, onChange: setNom, placeholder: "Sophie Martin", required: true, error: fieldErrors.nom, autoFocus: true }),
        /* @__PURE__ */ jsx(Field, { label: "Email professionnel", type: "email", value: email, onChange: setEmail, placeholder: "sophie@agence.fr", required: true, error: fieldErrors.email }),
        /* @__PURE__ */ jsx(Field, { label: "Nom de votre agence", value: agence, onChange: setAgence, placeholder: "Martin Immobilier", required: true, error: fieldErrors.agence }),
        /* @__PURE__ */ jsx("div", { style: { marginTop: "1.75rem" }, children: /* @__PURE__ */ jsxs("button", { onClick: next, className: "ob-primary", style: S.btnPrimary(false), children: [
          "Continuer ",
          /* @__PURE__ */ jsx("span", { style: { fontSize: 17 }, children: "→" })
        ] }) }),
        /* @__PURE__ */ jsxs("p", { style: { textAlign: "center", fontSize: 12, color: "#1e3a5f", marginTop: "1rem" }, children: [
          "En continuant, vous acceptez les ",
          /* @__PURE__ */ jsx(Link, { to: "/cgu", style: { color: "#334155" }, children: "CGU" }),
          " et la ",
          /* @__PURE__ */ jsx(Link, { to: "/confidentialite", style: { color: "#334155" }, children: "Politique de confidentialité" })
        ] })
      ] }, "step1"),
      step === 2 && /* @__PURE__ */ jsxs("div", { style: { animation: "stepIn 280ms ease" }, children: [
        /* @__PURE__ */ jsxs("div", { style: { marginBottom: "2rem", textAlign: "center" }, children: [
          /* @__PURE__ */ jsxs("h1", { style: { fontSize: "clamp(22px, 4vw, 32px)", fontWeight: 800, letterSpacing: "-0.6px", margin: "0 0 0.5rem", color: "#f1f5f9" }, children: [
            "Comment sont gérés",
            /* @__PURE__ */ jsx("br", {}),
            "vos biens ?"
          ] }),
          /* @__PURE__ */ jsx("p", { style: { color: "#475569", fontSize: 15, margin: 0 }, children: "Choisissez votre source, on s'occupe du reste." })
        ] }),
        [
          {
            id: "hektor_ftp",
            badge: "Recommandé",
            icon: /* @__PURE__ */ jsxs("svg", { width: "26", height: "26", viewBox: "0 0 24 24", fill: "none", children: [
              /* @__PURE__ */ jsx("path", { d: "M4 12a8 8 0 0 1 14.93-4M20 12a8 8 0 0 1-14.93 4", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round" }),
              /* @__PURE__ */ jsx("path", { d: "M18 4l2 4h-4M6 20l-2-4h4", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" })
            ] }),
            title: "Logiciel Hektor",
            desc: "Connexion directe via FTP — vos biens se synchronisent automatiquement"
          },
          {
            id: "csv",
            icon: /* @__PURE__ */ jsxs("svg", { width: "26", height: "26", viewBox: "0 0 24 24", fill: "none", children: [
              /* @__PURE__ */ jsx("rect", { x: "3", y: "3", width: "18", height: "18", rx: "2", stroke: "currentColor", strokeWidth: "2" }),
              /* @__PURE__ */ jsx("path", { d: "M3 9h18M3 15h18M9 3v18", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round" })
            ] }),
            title: "Fichier Excel / CSV",
            desc: "Importez un export depuis votre logiciel ou un fichier structuré"
          },
          {
            id: "scrape",
            icon: /* @__PURE__ */ jsxs("svg", { width: "26", height: "26", viewBox: "0 0 24 24", fill: "none", children: [
              /* @__PURE__ */ jsx("circle", { cx: "12", cy: "12", r: "9", stroke: "currentColor", strokeWidth: "2" }),
              /* @__PURE__ */ jsx("path", { d: "M2 12h20M12 3c-2.5 3-4 5.5-4 9s1.5 6 4 9M12 3c2.5 3 4 5.5 4 9s-1.5 6-4 9", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round" })
            ] }),
            title: "Mon site web",
            desc: "On extrait vos biens directement depuis votre site agence — aucun export requis"
          },
          {
            id: "demo",
            badge: "0 effort",
            icon: /* @__PURE__ */ jsx("svg", { width: "26", height: "26", viewBox: "0 0 24 24", fill: "none", children: /* @__PURE__ */ jsx("path", { d: "M12 2l3 7h7l-5.5 4 2 7L12 16l-6.5 4 2-7L2 9h7z", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }) }),
            title: "Données de démo",
            desc: "20 vrais biens anonymisés du Var · matchings et prospects pré-calculés"
          }
        ].map((m) => {
          const sel = importMode === m.id;
          return /* @__PURE__ */ jsxs(
            "button",
            {
              onClick: () => setImportMode(m.id),
              style: {
                display: "flex",
                alignItems: "center",
                gap: 16,
                width: "100%",
                textAlign: "left",
                cursor: "pointer",
                fontFamily: "inherit",
                background: sel ? "rgba(56,189,248,0.09)" : "rgba(255,255,255,0.03)",
                border: `1.5px solid ${sel ? "#38bdf8" : "rgba(255,255,255,0.08)"}`,
                borderRadius: 14,
                padding: "17px 18px",
                marginBottom: "0.75rem",
                transition: "all 170ms",
                transform: sel ? "translateX(4px)" : "none"
              },
              children: [
                /* @__PURE__ */ jsx("div", { style: {
                  width: 50,
                  height: 50,
                  borderRadius: 12,
                  flexShrink: 0,
                  background: sel ? "rgba(56,189,248,0.13)" : "rgba(255,255,255,0.05)",
                  border: `1px solid ${sel ? "rgba(56,189,248,0.3)" : "rgba(255,255,255,0.07)"}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: sel ? "#38bdf8" : "#475569",
                  transition: "all 170ms"
                }, children: m.icon }),
                /* @__PURE__ */ jsxs("div", { style: { flex: 1 }, children: [
                  /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }, children: [
                    /* @__PURE__ */ jsx("span", { style: { fontSize: 15, fontWeight: 700, color: sel ? "#f1f5f9" : "#94a3b8" }, children: m.title }),
                    m.badge && /* @__PURE__ */ jsx("span", { style: { fontSize: 10, fontWeight: 700, background: "#38bdf8", color: "#0f172a", borderRadius: 999, padding: "2px 8px", letterSpacing: "0.04em", textTransform: "uppercase" }, children: m.badge })
                  ] }),
                  /* @__PURE__ */ jsx("p", { style: { margin: 0, fontSize: 13, color: "#475569", lineHeight: 1.5 }, children: m.desc })
                ] }),
                /* @__PURE__ */ jsx("div", { style: {
                  width: 20,
                  height: 20,
                  borderRadius: "50%",
                  flexShrink: 0,
                  border: `2px solid ${sel ? "#38bdf8" : "#334155"}`,
                  background: sel ? "#38bdf8" : "transparent",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 170ms"
                }, children: sel && /* @__PURE__ */ jsx("div", { style: { width: 7, height: 7, borderRadius: "50%", background: "#0f172a" } }) })
              ]
            },
            m.id
          );
        }),
        apiError && /* @__PURE__ */ jsx("p", { style: { fontSize: 13, color: "#f87171", background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)", borderRadius: 10, padding: "10px 14px", marginTop: "1rem" }, children: apiError }),
        /* @__PURE__ */ jsxs("div", { style: { display: "flex", gap: 10, marginTop: "1.5rem" }, children: [
          /* @__PURE__ */ jsx("button", { onClick: back, className: "ob-back", style: S.btnBack, children: "← Retour" }),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: next,
              disabled: !importMode || loading,
              className: "ob-primary",
              style: S.btnPrimary(!importMode || loading),
              children: loading ? /* @__PURE__ */ jsxs(Fragment, { children: [
                /* @__PURE__ */ jsx(Spinner, {}),
                " En cours…"
              ] }) : importMode === "demo" ? /* @__PURE__ */ jsx(Fragment, { children: "Accéder à ma démo →" }) : /* @__PURE__ */ jsxs(Fragment, { children: [
                "Continuer ",
                /* @__PURE__ */ jsx("span", { style: { fontSize: 17 }, children: "→" })
              ] })
            }
          )
        ] })
      ] }, "step2"),
      step === 3 && importMode === "hektor_ftp" && /* @__PURE__ */ jsxs("div", { style: { animation: "stepIn 280ms ease" }, children: [
        /* @__PURE__ */ jsxs("div", { style: { marginBottom: "1.75rem" }, children: [
          /* @__PURE__ */ jsx("h1", { style: { fontSize: "clamp(20px, 4vw, 30px)", fontWeight: 800, letterSpacing: "-0.5px", margin: "0 0 0.5rem", color: "#f1f5f9" }, children: "Vos accès FTP Hektor" }),
          /* @__PURE__ */ jsx("p", { style: { color: "#475569", fontSize: 14, margin: 0 }, children: "Ces informations vous sont fournies par le support Hektor." })
        ] }),
        /* @__PURE__ */ jsxs("div", { style: { background: "rgba(56,189,248,0.06)", border: "1px solid rgba(56,189,248,0.18)", borderRadius: 12, padding: "14px 16px", marginBottom: "1.5rem", display: "flex", gap: 12, alignItems: "flex-start" }, children: [
          /* @__PURE__ */ jsxs("svg", { width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", style: { flexShrink: 0, marginTop: 1, color: "#38bdf8" }, children: [
            /* @__PURE__ */ jsx("circle", { cx: "12", cy: "12", r: "9", stroke: "currentColor", strokeWidth: "2" }),
            /* @__PURE__ */ jsx("path", { d: "M12 8v4M12 16h.01", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round" })
          ] }),
          /* @__PURE__ */ jsxs("div", { style: { fontSize: 13, color: "#64748b", lineHeight: 1.6 }, children: [
            /* @__PURE__ */ jsx("strong", { style: { color: "#94a3b8" }, children: "Vous n'avez pas vos accès FTP ?" }),
            /* @__PURE__ */ jsx("br", {}),
            `Contactez le support Hektor et demandez vos "identifiants d'export FTP". Ils vous fourniront le serveur, l'identifiant, le mot de passe et le chemin du fichier CSV.`
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 1rem" }, children: [
          /* @__PURE__ */ jsx(Field, { label: "Serveur FTP", value: ftpHost, onChange: setFtpHost, placeholder: "ftp.hektor.fr", required: true, error: fieldErrors.ftpHost, autoFocus: true }),
          /* @__PURE__ */ jsx(Field, { label: "Port", value: "21", onChange: () => {
          }, placeholder: "21", hint: "Généralement 21" })
        ] }),
        /* @__PURE__ */ jsx(Field, { label: "Identifiant", value: ftpUser, onChange: setFtpUser, placeholder: "mon_agence_ftp", required: true, error: fieldErrors.ftpUser }),
        /* @__PURE__ */ jsx(Field, { label: "Mot de passe FTP", type: "password", value: ftpPass, onChange: setFtpPass, placeholder: "••••••••••", required: true, error: fieldErrors.ftpPass }),
        /* @__PURE__ */ jsx(Field, { label: "Chemin du fichier", value: ftpPath, onChange: setFtpPath, placeholder: "/Annonces.csv", required: true, error: fieldErrors.ftpPath, hint: 'Généralement "/Annonces.csv" ou "/export/Annonces.csv"' }),
        apiError && /* @__PURE__ */ jsx("p", { style: { fontSize: 13, color: "#f87171", background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)", borderRadius: 10, padding: "10px 14px", marginTop: "0.75rem" }, children: apiError }),
        /* @__PURE__ */ jsxs("div", { style: { display: "flex", gap: 10, marginTop: "1.5rem" }, children: [
          /* @__PURE__ */ jsx("button", { onClick: back, className: "ob-back", style: S.btnBack, children: "← Retour" }),
          /* @__PURE__ */ jsx("button", { onClick: next, disabled: loading, className: "ob-primary", style: S.btnPrimary(loading), children: loading ? /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx(Spinner, {}),
            "Connexion en cours…"
          ] }) : /* @__PURE__ */ jsx(Fragment, { children: "Connecter Hektor →" }) })
        ] })
      ] }, "step3-ftp"),
      step === 3 && importMode === "scrape" && /* @__PURE__ */ jsxs("div", { style: { animation: "stepIn 280ms ease" }, children: [
        /* @__PURE__ */ jsxs("div", { style: { marginBottom: "1.5rem" }, children: [
          /* @__PURE__ */ jsx("h1", { style: { fontSize: "clamp(20px, 4vw, 30px)", fontWeight: 800, letterSpacing: "-0.5px", margin: "0 0 0.4rem", color: "#f1f5f9" }, children: "Votre site immobilier" }),
          /* @__PURE__ */ jsxs("p", { style: { color: "#475569", fontSize: 14, margin: 0 }, children: [
            "On extrait jusqu'à ",
            /* @__PURE__ */ jsx("strong", { style: { color: "#94a3b8" }, children: "15 biens" }),
            " automatiquement — sans export, sans fichier."
          ] })
        ] }),
        !scrapePreview ? /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsxs("div", { style: {
            background: "rgba(251,191,36,0.06)",
            border: "1px solid rgba(251,191,36,0.25)",
            borderRadius: 12,
            padding: "13px 16px",
            marginBottom: "1.25rem",
            display: "flex",
            gap: 11,
            alignItems: "flex-start"
          }, children: [
            /* @__PURE__ */ jsxs("svg", { width: "17", height: "17", viewBox: "0 0 24 24", fill: "none", style: { flexShrink: 0, marginTop: 1, color: "#fbbf24" }, children: [
              /* @__PURE__ */ jsx("path", { d: "M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }),
              /* @__PURE__ */ jsx("path", { d: "M12 9v4M12 17h.01", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round" })
            ] }),
            /* @__PURE__ */ jsxs("div", { style: { fontSize: 13, color: "#94a3b8", lineHeight: 1.65 }, children: [
              /* @__PURE__ */ jsx("strong", { style: { color: "#fbbf24" }, children: "Collez l'URL de votre page de biens à vendre" }),
              " — pas la page d'accueil.",
              /* @__PURE__ */ jsx("br", {}),
              /* @__PURE__ */ jsxs("span", { style: { color: "#64748b" }, children: [
                "Exemple : ",
                /* @__PURE__ */ jsxs("span", { style: { fontFamily: "monospace", color: "#7dd3fc" }, children: [
                  "mon-agence.fr",
                  /* @__PURE__ */ jsx("strong", { style: { color: "#f1f5f9" }, children: "/vente" })
                ] }),
                " ",
                "ou",
                " ",
                /* @__PURE__ */ jsxs("span", { style: { fontFamily: "monospace", color: "#7dd3fc" }, children: [
                  "mon-agence.fr",
                  /* @__PURE__ */ jsx("strong", { style: { color: "#f1f5f9" }, children: "/annonces" })
                ] })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsx(
            Field,
            {
              label: "URL de la page listing",
              value: siteUrl,
              onChange: (v) => {
                setSiteUrl(v);
                setScrapeError(null);
              },
              placeholder: "https://www.mon-agence.fr/vente",
              error: scrapeError,
              autoFocus: true
            }
          ),
          /* @__PURE__ */ jsx("p", { style: { margin: "-0.6rem 0 1.25rem", fontSize: 12, color: "#334155" }, children: "Maximum 15 biens extraits · Vous pourrez en ajouter d'autres ensuite." }),
          scrapeLoading && /* @__PURE__ */ jsx("div", { style: {
            background: "rgba(56,189,248,0.05)",
            border: "1px solid rgba(56,189,248,0.18)",
            borderRadius: 14,
            padding: "18px 20px",
            marginBottom: "1.25rem",
            animation: "stepIn 280ms ease"
          }, children: /* @__PURE__ */ jsx("div", { style: { display: "flex", flexDirection: "column", gap: 10 }, children: SCRAPE_STEPS.map((s, i) => {
            const done = i < scrapeStepIdx;
            const active = i === scrapeStepIdx;
            const pending = i > scrapeStepIdx;
            return /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: 12, opacity: pending ? 0.3 : 1, transition: "opacity 400ms" }, children: [
              /* @__PURE__ */ jsx("div", { style: {
                width: 28,
                height: 28,
                borderRadius: "50%",
                flexShrink: 0,
                background: done ? "rgba(56,189,248,0.2)" : active ? "rgba(56,189,248,0.1)" : "rgba(255,255,255,0.04)",
                border: `1.5px solid ${done || active ? "rgba(56,189,248,0.4)" : "rgba(255,255,255,0.08)"}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 400ms"
              }, children: done ? /* @__PURE__ */ jsx("svg", { width: "13", height: "13", viewBox: "0 0 24 24", fill: "none", children: /* @__PURE__ */ jsx("path", { d: "M5 13l4 4L19 7", stroke: "#38bdf8", strokeWidth: "2.5", strokeLinecap: "round", strokeLinejoin: "round" }) }) : active ? /* @__PURE__ */ jsx(Spinner, { size: 13, color: "#38bdf8" }) : /* @__PURE__ */ jsx("div", { style: { width: 6, height: 6, borderRadius: "50%", background: "#334155" } }) }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("p", { style: {
                  margin: 0,
                  fontSize: 13,
                  fontWeight: active ? 700 : 500,
                  color: done ? "#38bdf8" : active ? "#f1f5f9" : "#334155",
                  transition: "color 400ms"
                }, children: s.text }),
                active && /* @__PURE__ */ jsx("p", { style: { margin: "2px 0 0", fontSize: 11, color: "#475569", animation: "stepIn 300ms ease" }, children: s.sub })
              ] })
            ] }, i);
          }) }) }),
          /* @__PURE__ */ jsxs("div", { style: { display: "flex", gap: 10 }, children: [
            /* @__PURE__ */ jsx("button", { onClick: back, disabled: scrapeLoading, style: { ...S.btnBack, opacity: scrapeLoading ? 0.4 : 1, cursor: scrapeLoading ? "not-allowed" : "pointer" }, children: "← Retour" }),
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: analyserSite,
                disabled: !siteUrl.trim() || scrapeLoading,
                className: "ob-primary",
                style: S.btnPrimary(!siteUrl.trim() || scrapeLoading),
                children: scrapeLoading ? /* @__PURE__ */ jsxs(Fragment, { children: [
                  /* @__PURE__ */ jsx(Spinner, {}),
                  "Analyse en cours…"
                ] }) : /* @__PURE__ */ jsx(Fragment, { children: "Analyser mon site →" })
              }
            )
          ] })
        ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsxs("div", { style: { background: "rgba(56,189,248,0.06)", border: "1px solid rgba(56,189,248,0.2)", borderRadius: 14, padding: "16px 18px", marginBottom: "1.25rem" }, children: [
            /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }, children: [
              /* @__PURE__ */ jsx("div", { style: { width: 36, height: 36, borderRadius: 10, background: "rgba(56,189,248,0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "#38bdf8", flexShrink: 0 }, children: /* @__PURE__ */ jsx("svg", { width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", children: /* @__PURE__ */ jsx("path", { d: "M5 13l4 4L19 7", stroke: "currentColor", strokeWidth: "2.5", strokeLinecap: "round", strokeLinejoin: "round" }) }) }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsxs("p", { style: { margin: 0, fontSize: 15, fontWeight: 700, color: "#f1f5f9" }, children: [
                  scrapePreview.nb_biens,
                  " bien",
                  scrapePreview.nb_biens > 1 ? "s" : "",
                  " trouvé",
                  scrapePreview.nb_biens > 1 ? "s" : ""
                ] }),
                /* @__PURE__ */ jsx("p", { style: { margin: 0, fontSize: 12, color: "#475569", wordBreak: "break-all" }, children: scrapePreview.url })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { style: { display: "flex", flexDirection: "column", gap: 5 }, children: [
              scrapePreview.biens.slice(0, 4).map((b, i) => /* @__PURE__ */ jsxs("div", { style: { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8, padding: "7px 12px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }, children: [
                /* @__PURE__ */ jsx("span", { style: { fontSize: 13, color: "#94a3b8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }, children: [b.type, b.ville, b.surface ? `${b.surface}m²` : null, b.pieces ? `${b.pieces}p` : null].filter(Boolean).join(" · ") }),
                b.prix && /* @__PURE__ */ jsxs("span", { style: { fontSize: 13, fontWeight: 700, color: "#38bdf8", flexShrink: 0 }, children: [
                  Number(b.prix).toLocaleString("fr-FR"),
                  " €"
                ] })
              ] }, i)),
              scrapePreview.nb_biens > 4 && /* @__PURE__ */ jsxs("p", { style: { margin: "4px 0 0", fontSize: 12, color: "#475569", textAlign: "center" }, children: [
                "+ ",
                scrapePreview.nb_biens - 4,
                " autres biens"
              ] })
            ] })
          ] }),
          apiError && /* @__PURE__ */ jsx("p", { style: { fontSize: 13, color: "#f87171", background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)", borderRadius: 10, padding: "10px 14px", marginBottom: "1rem" }, children: apiError }),
          /* @__PURE__ */ jsxs("div", { style: { display: "flex", gap: 10 }, children: [
            /* @__PURE__ */ jsx("button", { onClick: () => {
              setScrapePreview(null);
              setScrapeError(null);
            }, className: "ob-back", style: S.btnBack, children: "← Changer l'URL" }),
            /* @__PURE__ */ jsx("button", { onClick: next, disabled: loading, className: "ob-primary", style: S.btnPrimary(loading), children: loading ? /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx(Spinner, {}),
              "Création en cours…"
            ] }) : /* @__PURE__ */ jsx(Fragment, { children: "Créer mon compte →" }) })
          ] })
        ] })
      ] }, "step3-scrape"),
      step === 3 && importMode === "csv" && /* @__PURE__ */ jsxs("div", { style: { animation: "stepIn 280ms ease" }, children: [
        /* @__PURE__ */ jsxs("div", { style: { marginBottom: "1.75rem" }, children: [
          /* @__PURE__ */ jsx("h1", { style: { fontSize: "clamp(20px, 4vw, 30px)", fontWeight: 800, letterSpacing: "-0.5px", margin: "0 0 0.5rem", color: "#f1f5f9" }, children: "Importez votre fichier" }),
          /* @__PURE__ */ jsx("p", { style: { color: "#475569", fontSize: 14, margin: 0 }, children: "Fichier Excel (.xlsx) ou CSV standard." })
        ] }),
        /* @__PURE__ */ jsxs(
          "div",
          {
            onDrop: handleDrop,
            onDragOver,
            onDragLeave,
            onClick: () => document.getElementById("file-input").click(),
            style: {
              border: `2px dashed ${dragging ? "#38bdf8" : file ? "rgba(56,189,248,0.5)" : "rgba(255,255,255,0.1)"}`,
              borderRadius: 16,
              padding: "2.75rem 1.5rem",
              textAlign: "center",
              cursor: "pointer",
              background: dragging ? "rgba(56,189,248,0.07)" : file ? "rgba(56,189,248,0.04)" : "rgba(255,255,255,0.02)",
              transition: "all 200ms",
              marginBottom: "1.25rem"
            },
            children: [
              /* @__PURE__ */ jsx(
                "input",
                {
                  id: "file-input",
                  type: "file",
                  accept: ".xlsx,.xls,.csv",
                  style: { display: "none" },
                  onChange: (e) => {
                    var _a;
                    const f = (_a = e.target.files) == null ? void 0 : _a[0];
                    if (f) setFileChecked(f);
                  }
                }
              ),
              file ? /* @__PURE__ */ jsxs(Fragment, { children: [
                /* @__PURE__ */ jsx("div", { style: { width: 52, height: 52, borderRadius: 12, margin: "0 auto 1rem", background: "rgba(56,189,248,0.12)", border: "1px solid rgba(56,189,248,0.25)", display: "flex", alignItems: "center", justifyContent: "center", color: "#38bdf8" }, children: /* @__PURE__ */ jsxs("svg", { width: "22", height: "22", viewBox: "0 0 24 24", fill: "none", children: [
                  /* @__PURE__ */ jsx("path", { d: "M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }),
                  /* @__PURE__ */ jsx("path", { d: "M14 2v6h6M9 13l2 2 4-4", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" })
                ] }) }),
                /* @__PURE__ */ jsx("p", { style: { margin: "0 0 4px", fontSize: 15, fontWeight: 700, color: "#f1f5f9" }, children: file.name }),
                /* @__PURE__ */ jsx("p", { style: { margin: 0, fontSize: 13, color: "#38bdf8" }, children: "Fichier prêt · Cliquer pour changer" })
              ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
                /* @__PURE__ */ jsx("div", { style: { width: 52, height: 52, borderRadius: 12, margin: "0 auto 1rem", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", color: "#334155" }, children: /* @__PURE__ */ jsx("svg", { width: "22", height: "22", viewBox: "0 0 24 24", fill: "none", children: /* @__PURE__ */ jsx("path", { d: "M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }) }) }),
                /* @__PURE__ */ jsx("p", { style: { margin: "0 0 4px", fontSize: 15, fontWeight: 600, color: "#64748b" }, children: "Glissez votre fichier ici" }),
                /* @__PURE__ */ jsxs("p", { style: { margin: 0, fontSize: 13, color: "#334155" }, children: [
                  "ou ",
                  /* @__PURE__ */ jsx("span", { style: { color: "#38bdf8" }, children: "parcourir" }),
                  " · .xlsx, .xls, .csv"
                ] })
              ] })
            ]
          }
        ),
        /* @__PURE__ */ jsxs("div", { style: { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "14px 16px", marginBottom: "0.25rem" }, children: [
          /* @__PURE__ */ jsx("p", { style: { margin: "0 0 8px", fontSize: 12, fontWeight: 700, color: "#475569", letterSpacing: "0.06em", textTransform: "uppercase" }, children: "Colonnes attendues" }),
          /* @__PURE__ */ jsx("div", { style: { display: "flex", flexWrap: "wrap", gap: "6px" }, children: ["Reference", "Type", "Ville", "Quartier", "Prix", "Surface", "Pieces", "Chambres", "Description", "Etat", "Date"].map((col) => /* @__PURE__ */ jsx("span", { style: { fontSize: 12, background: "rgba(56,189,248,0.07)", border: "1px solid rgba(56,189,248,0.15)", color: "#7dd3fc", borderRadius: 6, padding: "3px 9px", fontFamily: "monospace" }, children: col }, col)) }),
          /* @__PURE__ */ jsx("p", { style: { margin: "10px 0 0", fontSize: 12, color: "#334155" }, children: "Seules Reference, Type, Ville et Prix sont obligatoires. Les autres colonnes sont facultatives." })
        ] }),
        apiError && /* @__PURE__ */ jsx("p", { style: { fontSize: 13, color: "#f87171", background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)", borderRadius: 10, padding: "10px 14px", marginTop: "1rem" }, children: apiError }),
        /* @__PURE__ */ jsxs("div", { style: { display: "flex", gap: 10, marginTop: "1.5rem" }, children: [
          /* @__PURE__ */ jsx("button", { onClick: back, className: "ob-back", style: S.btnBack, children: "← Retour" }),
          /* @__PURE__ */ jsx("button", { onClick: next, disabled: !file || loading, className: "ob-primary", style: S.btnPrimary(!file || loading), children: loading ? /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx(Spinner, {}),
            "Import en cours…"
          ] }) : /* @__PURE__ */ jsx(Fragment, { children: "Importer mes biens →" }) })
        ] })
      ] }, "step3-csv")
    ] }) }) }),
    /* @__PURE__ */ jsx("style", { children: `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }

        @keyframes stepIn   { from { opacity: 0; transform: translateX(22px) } to { opacity: 1; transform: translateX(0) } }
        @keyframes spin     { to { transform: rotate(360deg) } }
        @keyframes shimmer  { 0% { background-position: -200% center } 100% { background-position: 200% center } }

        ::placeholder { color: #334155; }

        /* ── Bouton primaire ── */
        .ob-primary {
          position: relative; overflow: hidden;
          transition: transform 180ms cubic-bezier(0.34,1.56,0.64,1),
                      box-shadow 180ms ease,
                      filter 180ms ease !important;
        }
        .ob-primary::after {
          content: '';
          position: absolute; inset: 0;
          background: linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.28) 50%, transparent 70%);
          background-size: 200% 100%;
          opacity: 0;
          transition: opacity 200ms;
        }
        .ob-primary:not(:disabled):hover {
          transform: translateY(-2px) scale(1.015);
          box-shadow: 0 10px 36px rgba(56,189,248,0.55), 0 0 0 1px rgba(56,189,248,0.25) !important;
          filter: brightness(1.07);
        }
        .ob-primary:not(:disabled):hover::after {
          opacity: 1;
          animation: shimmer 600ms ease forwards;
        }
        .ob-primary:not(:disabled):active {
          transform: translateY(0) scale(0.98);
          box-shadow: 0 4px 16px rgba(56,189,248,0.3) !important;
        }

        /* ── Bouton retour ── */
        .ob-back {
          transition: border-color 160ms, color 160ms, background 160ms, transform 160ms !important;
        }
        .ob-back:hover {
          border-color: rgba(56,189,248,0.35) !important;
          color: #cbd5e1 !important;
          background: rgba(56,189,248,0.06) !important;
        }
        .ob-back:active {
          transform: scale(0.97);
        }
      ` })
  ] });
}
function AppRoutes() {
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(CookieBanner, {}),
    /* @__PURE__ */ jsxs(Routes, { children: [
      /* @__PURE__ */ jsx(Route, { path: "/", element: /* @__PURE__ */ jsx(Home, {}) }),
      /* @__PURE__ */ jsx(Route, { path: "/demarrer", element: /* @__PURE__ */ jsx(Onboarding, {}) }),
      /* @__PURE__ */ jsx(Route, { path: "/showcase", element: /* @__PURE__ */ jsx(Showcase, {}) }),
      /* @__PURE__ */ jsx(Route, { path: "/faq", element: /* @__PURE__ */ jsx(FAQ, {}) }),
      /* @__PURE__ */ jsx(Route, { path: "/mentions-legales", element: /* @__PURE__ */ jsx(MentionsLegales, {}) }),
      /* @__PURE__ */ jsx(Route, { path: "/cgu", element: /* @__PURE__ */ jsx(CGU, {}) }),
      /* @__PURE__ */ jsx(Route, { path: "/confidentialite", element: /* @__PURE__ */ jsx(Confidentialite, {}) }),
      /* @__PURE__ */ jsx(Route, { path: "/cookies", element: /* @__PURE__ */ jsx(Cookies, {}) }),
      /* @__PURE__ */ jsx(Route, { path: "/guide-de-demarrage", element: /* @__PURE__ */ jsx(GuideDemarrage, {}) }),
      /* @__PURE__ */ jsx(Route, { path: "/documentation", element: /* @__PURE__ */ jsx(Documentation, {}) })
    ] })
  ] });
}
function render(url) {
  return renderToString(
    /* @__PURE__ */ jsx(StaticRouter, { location: url, children: /* @__PURE__ */ jsx(AppRoutes, {}) })
  );
}
export {
  faqs,
  render
};
