import { Sparkles } from "lucide-react";
import type { InterviewQuestion } from "../types/interview";

interface AIQuestionProps {
  question: InterviewQuestion;
  questionNumber: number;
}

const categoryColors: Record<string, string> = {
  technical: "var(--primary)",
  project: "var(--accent)",
  behavioral: "#8b5cf6",
  motivation: "#f59e0b",
};

export function AIQuestion({ question, questionNumber }: AIQuestionProps) {
  const color = categoryColors[question.category] ?? "var(--primary)";

  return (
    <div
      style={{
        animation: "fadeIn 0.5s ease",
        textAlign: "center",
        maxWidth: "640px",
        margin: "0 auto",
      }}
    >
      {/* Category badge */}
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          padding: "6px 14px",
          borderRadius: "100px",
          background: `${color}1a`,
          border: `1px solid ${color}40`,
          color: color,
          fontSize: "0.75rem",
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          marginBottom: "24px",
        }}
      >
        <Sparkles size={12} />
        {question.category} · Q{questionNumber}
      </div>

      {/* Question text */}
      <p
        style={{
          fontSize: "1.75rem",
          fontWeight: 600,
          lineHeight: 1.35,
          letterSpacing: "-0.01em",
          color: "var(--text-primary)",
        }}
      >
        {question.question}
      </p>

      {/* Purpose hint */}
      <p
        style={{
          marginTop: "16px",
          color: "var(--text-muted)",
          fontSize: "0.875rem",
        }}
      >
        {question.purpose}
      </p>
    </div>
  );
}
