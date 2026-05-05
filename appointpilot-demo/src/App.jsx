import { useState, useRef, useEffect } from "react";

const C = {
  bg: "#F4F2EE", surface: "#FFFFFF", border: "#E0DDD8", borderStrong: "#C8C4BE",
  teal: "#1E7D7D", tealLight: "#E8F4F4", tealBorder: "#A8D4D4",
  navy: "#1A2332", navyMuted: "#3D4F63", textMuted: "#6B7A8D", textFaint: "#9CA8B5",
};

const Logo = () => (
  <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600, fontSize: 18, color: C.navy, letterSpacing: "-0.3px" }}>
    Appoint Pilot
  </span>
);

const defaultK = {
  bedrijfsnaam: "", product: "", kwalificatievragen: "",
  toon: "vriendelijk en professioneel", doelActie: "afspraak inplannen", gedragsregels: "",
};

function buildPrompt(k) {
  return `Je bent een AI-reactivatie-assistent voor ${k.bedrijfsnaam}.
Taak: reactiveer oude leads op een ${k.toon} manier, kwalificeer ze en stuur aan op: ${k.doelActie}.
Product/dienst context: ${k.product}

Kwalificatievragen (verspreid door gesprek, nooit als lijst):
${k.kwalificatievragen || "- Wanneer had je interesse?\n- Wat is je huidige situatie?\n- Wanneer wil je dit geregeld hebben?"}

${k.gedragsregels ? `Extra gedragsregels en context (volg deze strikt op):\n${k.gedragsregels}\n` : ""}
Algemene regels:
- JIJ begint het gesprek als eerste met een Prince Charming bericht
- Stel één vraag tegelijk
- Max 2-3 zinnen per bericht
- Warm en menselijk, niet robotachtig
- Reageer in het Nederlands tenzij anders gevraagd`;
}

const OPENING_PROMPT = (k) =>
  `Start nu het gesprek. Stuur een kort, persoonlijk openingsbericht als reactivatie voor ${k.bedrijfsnaam}. Gebruik de Prince Charming stijl: neem contact op met een oude lead die ooit interesse toonde in ${k.product}. Één korte zin + één vraag. Geen opsomming, geen formele aanhef.`;

export default function App() {
  const [tab, setTab] = useState("kennisbank");
  const [k, setK] = useState(defaultK);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [aiStarted, setAiStarted] = useState(false);
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  useEffect(() => {
    if (tab === "gesprek" && k.bedrijfsnaam && !aiStarted && messages.length === 0) {
      startConversation();
    }
  }, [tab, k.bedrijfsnaam]);

  const startConversation = async () => {
    setAiStarted(true);
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: buildPrompt(k),
          messages: [{ role: "user", content: OPENING_PROMPT(k) }],
        }),
      });
      const data = await res.json();
      setMessages([{ role: "assistant", content: data.content?.[0]?.text || `Hé, ben jij het nog? We hadden je eerder gesproken over ${k.product}. Heb je hier nog interesse in?` }]);
    } catch {
      setMessages([{ role: "assistant", content: `Hé, ik ben het van ${k.bedrijfsnaam}. We hadden jou eerder gesproken over ${k.product} — heb je hier nog interesse in?` }]);
    }
    setLoading(false);
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    setMessages([]);
    setAiStarted(false);
    setTab("gesprek");
  };

  const handleReset = () => {
    setMessages([]);
    setAiStarted(false);
    setTimeout(() => startConversation(), 100);
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = { role: "user", content: input.trim() };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: buildPrompt(k),
          messages: next,
        }),
      });
      const data = await res.json();
      setMessages([...next, { role: "assistant", content: data.content?.[0]?.text || "Er ging iets mis." }]);
    } catch {
      setMessages([...next, { role: "assistant", content: "Verbindingsfout. Probeer opnieuw." }]);
    }
    setLoading(false);
  };

  const isReady = k.bedrijfsnaam && k.product;

  const inp = {
    width: "100%", boxSizing: "border-box", background: "#fff",
    border: `1.5px solid ${C.border}`, borderRadius: 8, padding: "10px 14px",
    color: C.navy, fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontSize: 14, outline: "none", lineHeight: 1.5, transition: "border-color 0.15s",
  };

  const Label = ({ text, req }) => (
    <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: C.navyMuted, marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.7px" }}>
      {text}{req && <span style={{ color: C.teal, marginLeft: 2 }}>*</span>}
    </label>
  );

  const AIAvatar = () => (
    <div style={{ width: 28, height: 28, borderRadius: 7, background: C.teal, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
        <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </div>
  );

  const TypingBubble = () => (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 8, marginBottom: 10 }}>
      <AIAvatar />
      <div style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: "14px 14px 14px 4px", padding: "12px 16px", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
        <div style={{ display: "flex", gap: 5 }}>
          {[0,1,2].map(i => <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: C.teal, animation: `dot 1.2s ease-in-out ${i*0.2}s infinite` }} />)}
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", background: C.bg, minHeight: "100vh", color: C.navy }}>
      <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <div style={{ height: 4, background: C.teal }} />

      {/* Header */}
      <div style={{ background: "#fff", borderBottom: `1px solid ${C.border}`, padding: "0 32px", height: 62, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 10 }}>
        <Logo />
        <div style={{ display: "flex", gap: 2, background: C.bg, borderRadius: 8, padding: 3, border: `1px solid ${C.border}` }}>
          {[{ id: "kennisbank", label: "Kennisbank" }, { id: "gesprek", label: "Gesprek" }].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              padding: "7px 18px", borderRadius: 6, border: "none", cursor: "pointer",
              fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, fontWeight: 500,
              background: tab === t.id ? C.teal : "transparent",
              color: tab === t.id ? "#fff" : C.textMuted, transition: "all 0.15s",
            }}>{t.label}</button>
          ))}
        </div>
        <div style={{ fontSize: 12, color: C.teal, fontWeight: 600, background: C.tealLight, padding: "5px 12px", borderRadius: 20, border: `1px solid ${C.tealBorder}` }}>
          Demo omgeving
        </div>
      </div>

      {/* KENNISBANK */}
      {tab === "kennisbank" && (
        <div style={{ maxWidth: 600, margin: "0 auto", padding: "40px 24px" }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 6px", letterSpacing: "-0.4px" }}>Kennisbank instellen</h1>
          <p style={{ color: C.textMuted, fontSize: 14, margin: "0 0 28px", lineHeight: 1.6 }}>
            Vul de gegevens van je klant in. De AI start automatisch het gesprek zodra je naar het Gesprek-tabblad gaat.
          </p>

          <div style={{ background: "#fff", borderRadius: 12, border: `1px solid ${C.border}`, padding: 28, display: "flex", flexDirection: "column", gap: 18 }}>

            <div>
              <Label text="Bedrijfsnaam" req />
              <input value={k.bedrijfsnaam} onChange={e => setK({ ...k, bedrijfsnaam: e.target.value })} placeholder="bijv. Doko Kozijnen" style={inp} />
            </div>

            <div>
              <Label text="Product of dienst" req />
              <p style={{ fontSize: 12, color: C.textMuted, margin: "0 0 7px", lineHeight: 1.5 }}>
                Beschrijf het product en de doelgroep kort. Hoe meer context, hoe beter de AI het gesprek afstemt.
              </p>
              <textarea
                value={k.product}
                onChange={e => setK({ ...k, product: e.target.value })}
                placeholder="bijv. HR++ kozijnen voor particulieren in Noord-Holland — inclusief gratis inmeting aan huis"
                rows={3}
                style={{ ...inp, resize: "vertical" }}
              />
            </div>

            <div>
              <Label text="Toon van de AI" />
              <input value={k.toon} onChange={e => setK({ ...k, toon: e.target.value })} placeholder="bijv. vriendelijk en professioneel" style={inp} />
            </div>

            <div>
              <Label text="Gewenste actie" />
              <input value={k.doelActie} onChange={e => setK({ ...k, doelActie: e.target.value })} placeholder="bijv. afspraak inplannen voor inmeting" style={inp} />
            </div>

            <div>
              <Label text="Kwalificatievragen" />
              <textarea
                value={k.kwalificatievragen}
                onChange={e => setK({ ...k, kwalificatievragen: e.target.value })}
                placeholder={"- Hi, dit is Jan van Bedrijf, is dit nog steeds [naam]? U had een tijdje geleden interesse getoond in ons Product.\n- Klopt het dat dat nog steeds op je radar staat?\n- Wanneer wil je dit laten installeren?\n- Hoeveel kozijnen heb je nodig?"}
                rows={4}
                style={{ ...inp, resize: "vertical" }}
              />
            </div>

            <div style={{ borderTop: `1px solid ${C.border}`, margin: "4px 0" }} />

            <div>
              <Label text="Gedragsregels & extra context" />
              <p style={{ fontSize: 12, color: C.textMuted, margin: "0 0 7px", lineHeight: 1.5 }}>
                Specifieke instructies die de AI altijd volgt — bijv. hoe afspraken worden ingepland, wat de AI niet mag zeggen, of bedrijfsspecifieke info.
              </p>
              <textarea
                value={k.gedragsregels}
                onChange={e => setK({ ...k, gedragsregels: e.target.value })}
                placeholder={"- Afspraken zijn altijd telefonisch, nooit op locatie\n- Gebruik geen emoticons in het gesprek\n- Noem de prijs pas als de lead er zelf naar vraagt\n- De installatietijd is altijd binnen 2 weken na akkoord"}
                rows={5}
                style={{ ...inp, resize: "vertical", background: "#FAFAF9", borderStyle: "dashed", fontSize: 13 }}
              />
            </div>

            <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 18, display: "flex", alignItems: "center", gap: 14 }}>
              <button onClick={handleSave} disabled={!isReady} style={{
                padding: "11px 26px", borderRadius: 8, border: "none",
                cursor: isReady ? "pointer" : "not-allowed",
                background: isReady ? C.teal : C.borderStrong,
                color: "#fff", fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: 14, fontWeight: 600, transition: "all 0.15s",
              }}>
                {saved ? "✓ Opgeslagen" : "Opslaan en demo starten →"}
              </button>
              {!isReady && <span style={{ fontSize: 12, color: C.textFaint }}>Vul bedrijfsnaam en product in</span>}
            </div>
          </div>
        </div>
      )}

      {/* GESPREK */}
      {tab === "gesprek" && (
        <div style={{ maxWidth: 600, margin: "0 auto", padding: "24px 24px 0", display: "flex", flexDirection: "column", height: "calc(100vh - 66px)" }}>

          {k.bedrijfsnaam ? (
            <div style={{ background: C.tealLight, border: `1px solid ${C.tealBorder}`, borderRadius: 8, padding: "9px 16px", marginBottom: 14, display: "flex", alignItems: "center", gap: 10, fontSize: 13 }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: C.teal, flexShrink: 0 }} />
              <span style={{ fontWeight: 600, color: C.teal }}>{k.bedrijfsnaam}</span>
              <span style={{ color: C.textFaint }}>·</span>
              <span style={{ color: C.textMuted, maxWidth: 280, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{k.product}</span>
              <div style={{ marginLeft: "auto", display: "flex", gap: 12, alignItems: "center" }}>
                <button onClick={handleReset} style={{ background: "none", border: "none", color: C.textMuted, cursor: "pointer", fontSize: 12, fontFamily: "'Plus Jakarta Sans', sans-serif", padding: 0 }}>↺ Opnieuw</button>
                <button onClick={() => setTab("kennisbank")} style={{ background: "none", border: "none", color: C.teal, cursor: "pointer", fontSize: 12, fontFamily: "'Plus Jakarta Sans', sans-serif", padding: 0, textDecoration: "underline", fontWeight: 500 }}>Wijzigen</button>
              </div>
            </div>
          ) : (
            <div style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 8, padding: 20, marginBottom: 14, textAlign: "center" }}>
              <p style={{ color: C.textMuted, fontSize: 14, margin: "0 0 12px" }}>Stel eerst de kennisbank in om te starten.</p>
              <button onClick={() => setTab("kennisbank")} style={{ padding: "9px 20px", borderRadius: 7, border: "none", background: C.teal, color: "#fff", cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, fontWeight: 600 }}>Kennisbank instellen →</button>
            </div>
          )}

          <div style={{ flex: 1, overflowY: "auto", paddingBottom: 12 }}>
            {loading && messages.length === 0 && <TypingBubble />}

            {messages.map((m, i) => (
              <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start", marginBottom: 10, alignItems: "flex-end", gap: 8 }}>
                {m.role === "assistant" && <AIAvatar />}
                <div style={{
                  maxWidth: "76%", padding: "10px 14px", fontSize: 14, lineHeight: 1.6, whiteSpace: "pre-wrap",
                  borderRadius: m.role === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                  background: m.role === "user" ? C.teal : "#fff",
                  border: m.role === "user" ? "none" : `1px solid ${C.border}`,
                  color: m.role === "user" ? "#fff" : C.navy,
                  boxShadow: m.role === "assistant" ? "0 1px 4px rgba(0,0,0,0.05)" : "none",
                }}>
                  {m.content}
                </div>
              </div>
            ))}

            {loading && messages.length > 0 && <TypingBubble />}
            <div ref={endRef} />
          </div>

          <div style={{ borderTop: `1px solid ${C.border}`, padding: "14px 0 24px", display: "flex", gap: 10 }}>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }}}
              placeholder={k.bedrijfsnaam ? "Reageer als lead..." : "Stel eerst de kennisbank in..."}
              rows={1}
              disabled={!k.bedrijfsnaam || loading}
              style={{ flex: 1, background: "#fff", border: `1.5px solid ${C.border}`, borderRadius: 10, padding: "10px 14px", color: C.navy, fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 14, resize: "none", outline: "none", lineHeight: 1.5, opacity: k.bedrijfsnaam ? 1 : 0.5 }}
            />
            <button onClick={sendMessage} disabled={!input.trim() || loading || !k.bedrijfsnaam} style={{
              padding: "10px 20px", borderRadius: 10, border: "none", flexShrink: 0,
              background: input.trim() && !loading && k.bedrijfsnaam ? C.teal : C.borderStrong,
              color: "#fff", cursor: input.trim() && !loading && k.bedrijfsnaam ? "pointer" : "not-allowed",
              fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 14, fontWeight: 600, transition: "all 0.15s",
            }}>Stuur</button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes dot{0%,100%{transform:translateY(0);opacity:.4}50%{transform:translateY(-4px);opacity:1}}
        input:focus,textarea:focus{border-color:${C.teal}!important;box-shadow:0 0 0 3px ${C.teal}18;}
        *{box-sizing:border-box}
        ::-webkit-scrollbar{width:4px}
        ::-webkit-scrollbar-thumb{background:${C.border};border-radius:2px}
      `}</style>
    </div>
  );
}
