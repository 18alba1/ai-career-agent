import { useState } from "react";
import { Check, RefreshCw, Pencil } from "lucide-react";
import { Button } from "./ui";

interface TranscriptReviewProps {
  transcript: string;
  onConfirm: (answer: string) => void;
  onRecordAgain: () => void;
  language: "en" | "sv";
}

export function TranscriptReview({
  transcript,
  onConfirm,
  onRecordAgain,
  language,
}: TranscriptReviewProps) {
  const [text, setText] = useState(transcript);

  const t = {
    review: language === "sv" ? "Granska ditt svar" : "Review your answer",
    edit: language === "sv" ? "Du kan redigera transkriptionen om det behövs" : "You can edit the transcript if needed",
    use: language === "sv" ? "Använd svar" : "Use Answer",
    again: language === "sv" ? "Spela in igen" : "Record Again",
  };

  return (
    <div
      style={{
        maxWidth: "560px",
        margin: "0 auto",
        animation: "fadeIn 0.4s ease",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          marginBottom: "12px",
        }}
      >
        <Pencil size={16} color="var(--text-muted)" />
        <label
          style={{
            fontSize: "0.8125rem",
            color: "var(--text-muted)",
            fontWeight: 500,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          {t.review}
        </label>
      </div>

      <p
        style={{
          color: "var(--text-muted)",
          fontSize: "0.8125rem",
          marginBottom: "16px",
        }}
      >
        {t.edit}
      </p>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={6}
        autoFocus
        style={{
          width: "100%",
          background: "var(--bg-elevated)",
          border: "1px solid var(--border-default)",
          borderRadius: "var(--radius-md)",
          padding: "16px",
          color: "var(--text-primary)",
          fontSize: "1rem",
          lineHeight: 1.6,
          resize: "vertical",
          fontFamily: "var(--font)",
        }}
      />

      <div
        style={{
          display: "flex",
          gap: "12px",
          marginTop: "20px",
          justifyContent: "center",
        }}
      >
        <Button variant="secondary" onClick={onRecordAgain}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
            <RefreshCw size={16} />
            {t.again}
          </span>
        </Button>
        <Button
          onClick={() => text.trim() && onConfirm(text.trim())}
          disabled={!text.trim()}
        >
          <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
            <Check size={16} />
            {t.use}
          </span>
        </Button>
      </div>
    </div>
  );
}
