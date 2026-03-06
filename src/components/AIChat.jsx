import { useState, useRef, useEffect } from "react";
import { C } from "../constants/colors.js";
import { fmt } from "../utils/index.js";
import { Badge, Button, Card, Input } from "./ui/index.jsx";
import { apiRequest } from "../services/apiClient.js";

function sanitizePrompt(value) {
  return value.replace(/\s+/g, " ").trim().slice(0, 500);
}

export default function AIChat({ prefs, name, captured, rejected, showHeader = true }) {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        `Ola Dr(a). ${name || "Medico"}. Sou seu assistente de plantoes. ` +
        "Posso sugerir estrategias, analisar oportunidades e orientar ganhos operacionais.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, loading]);

  const quickPrompts = [
    "Qual plantao vale mais a pena hoje?",
    "Como melhorar renda mensal?",
    "Meu perfil atual esta restritivo?",
    "Como aumentar taxa de captura?",
  ];

  async function send(value) {
    const prompt = sanitizePrompt(value || input);
    if (!prompt || loading) {
      return;
    }

    setInput("");
    setLoading(true);
    const history = [...messages, { role: "user", content: prompt }];
    setMessages(history);

    const system =
      "Voce e um assistente para medicos que usam o PlantaoBot. " +
      `Perfil: valor minimo R$${fmt(prefs.minVal)}, distancia maxima ${prefs.maxDist}km, dias ${prefs.days.join(", ")}, especialidades ${prefs.specs.join(", ")}. ` +
      `Capturados: ${captured.length} (R$ ${fmt(captured.reduce((sum, shift) => sum + shift.val, 0))}). ` +
      `Descartados: ${rejected.length}. ` +
      "Responda em portugues do Brasil, direto, com no maximo 3 paragrafos e foco pratico.";

    try {
      const data = await apiRequest("/chat", {
        method: "POST",
        body: {
          system,
          messages: history.map((message) => ({ role: message.role, content: message.content })),
        },
      });
      const reply = data.reply || "Nao consegui responder no momento.";
      setMessages((previous) => [...previous, { role: "assistant", content: reply }]);
    } catch {
      setMessages((previous) => [...previous, { role: "assistant", content: "Erro ao conectar com a IA. Tente novamente." }]);
    }

    setLoading(false);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {showHeader ? (
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: C.text0 }}>Assistente IA</div>
          <div style={{ marginTop: 2, fontSize: 12, color: C.text2 }}>Suporte de analise para decisoes de captura</div>
        </div>
      ) : null}

      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
        {quickPrompts.map((prompt) => (
          <Button key={prompt} type="button" variant="secondary" disabled={loading} onClick={() => send(prompt)}>
            {prompt}
          </Button>
        ))}
      </div>

      <div style={{ flex: 1, minHeight: 0, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8, paddingRight: 4 }}>
        {messages.map((message, index) => (
          <div
            key={`${message.role}-${index}`}
            style={{
              display: "flex",
              justifyContent: message.role === "user" ? "flex-end" : "flex-start",
            }}
          >
            <Card
              muted={message.role !== "user"}
              style={{
                maxWidth: "82%",
                borderColor: message.role === "user" ? "rgba(11, 95, 255, 0.3)" : C.border,
                background: message.role === "user" ? C.primarySoft : C.surface1,
                padding: 10,
              }}
            >
              <div style={{ marginBottom: 4 }}>
                <Badge tone={message.role === "user" ? "primary" : "info"}>{message.role === "user" ? "Voce" : "Assistente"}</Badge>
              </div>
              <div style={{ fontSize: 12, color: C.text1, whiteSpace: "pre-wrap", lineHeight: 1.55 }}>{message.content}</div>
            </Card>
          </div>
        ))}

        {loading ? (
          <Card muted>
            <div style={{ fontSize: 12, color: C.text1 }}>Gerando resposta...</div>
          </Card>
        ) : null}
        <div ref={bottomRef} />
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
        <Input
          value={input}
          onChange={(event) => setInput(event.target.value.slice(0, 500))}
          maxLength={500}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              send();
            }
          }}
          placeholder="Pergunte sobre oportunidades e estrategia..."
          disabled={loading}
        />
        <Button type="button" onClick={() => send()} disabled={loading || !sanitizePrompt(input)}>
          Enviar
        </Button>
      </div>
    </div>
  );
}

