import {
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  TrendingUp,
  RotateCcw,
} from "lucide-react";
import { Button } from "./ui";
import type { InterviewReport } from "../types/interview";

interface InterviewReportViewProps {
  report: InterviewReport;
  onRestart: () => void;
  language: "en" | "sv";
}

export function InterviewReportView({
  report,
  onRestart,
  language,
}: InterviewReportViewProps) {
  const t = {
    title: language === "sv" ? "Intervjurapport" : "Interview Report",
    overall: language === "sv" ? "Övergripande" : "Overall",
    technical: language === "sv" ? "Teknisk" : "Technical",
    behavioral: language === "sv" ? "Beteende" : "Behavioral",
    communication: language === "sv" ? "Kommunikation" : "Communication",
    grounding: language === "sv" ? "Förankring" : "Grounding",
    summary: language === "sv" ? "Sammanfattning" : "Summary",
    strongest: language === "sv" ? "Starkaste svar" : "Strongest Answers",
    weakest: language === "sv" ? "Svagaste svar" : "Weakest Answers",
    strengths: language === "sv" ? "Återkommande styrkor" : "Recurring Strengths",
    weaknesses: language === "sv" ? "Återkommande svagheter" : "Recurring Weaknesses",
    recommendations: language === "sv" ? "Rekommendationer" : "Recommendations",
    newInterview: language === "sv" ? "Starta ny intervju" : "Start New Interview",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "60px 20px",
        display: "flex",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "720px",
          animation: "fadeIn 0.6s ease",
        }}
      >
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <h1
            style={{
              fontSize: "2rem",
              fontWeight: 700,
              letterSpacing: "-0.02em",
              marginBottom: "8px",
            }}
          >
            {t.title}
          </h1>

          {/* Overall score */}
          <div
            style={{
              display: "inline-flex",
              flexDirection: "column",
              alignItems: "center",
              marginTop: "20px",
              padding: "20px 40px",
              background: "var(--bg-card)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-xl)",
            }}
          >
            <span
              style={{
                fontSize: "3rem",
                fontWeight: 700,
                background: "linear-gradient(135deg, var(--primary), var(--accent))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                lineHeight: 1,
              }}
            >
              {report.overall_score}
            </span>
            <span
              style={{
                color: "var(--text-muted)",
                fontSize: "0.875rem",
                marginTop: "4px",
              }}
            >
              {t.overall} · / 10
            </span>
          </div>
        </div>

        {/* Score breakdown */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: "12px",
            marginBottom: "32px",
          }}
        >
          <ScoreBar label={t.technical} value={report.technical_score} color="var(--primary)" />
          <ScoreBar label={t.behavioral} value={report.behavioral_score} color="#8b5cf6" />
          <ScoreBar label={t.communication} value={report.communication_score} color="var(--accent)" />
          <ScoreBar label={t.grounding} value={report.grounding_score} color="var(--success)" />
        </div>

        {/* Summary */}
        <Section title={t.summary}>
          <p
            style={{
              color: "var(--text-secondary)",
              fontSize: "1rem",
              lineHeight: 1.7,
            }}
          >
            {report.summary}
          </p>
        </Section>

        {/* Strongest / Weakest */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "16px",
            marginBottom: "24px",
          }}
        >
          <ListSection
            title={t.strongest}
            items={report.strongest_answers}
            icon={<CheckCircle2 size={16} color="var(--success)" />}
          />
          <ListSection
            title={t.weakest}
            items={report.weakest_answers}
            icon={<AlertTriangle size={16} color="var(--warning)" />}
          />
        </div>

        <ListSection
          title={t.strengths}
          items={report.recurring_strengths}
          icon={<TrendingUp size={16} color="var(--primary)" />}
          marginBottom="24px"
        />

        <ListSection
          title={t.weaknesses}
          items={report.recurring_weaknesses}
          icon={<AlertTriangle size={16} color="var(--warning)" />}
          marginBottom="24px"
        />

        <ListSection
          title={t.recommendations}
          items={report.recommendations}
          icon={<Lightbulb size={16} color="#f59e0b" />}
          marginBottom="32px"
        />

        {/* Restart */}
        <div style={{ textAlign: "center" }}>
          <Button variant="secondary" size="lg" onClick={onRestart}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
              <RotateCcw size={18} />
              {t.newInterview}
            </span>
          </Button>
        </div>
      </div>
    </div>
  );
}

function ScoreBar({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border-subtle)",
        borderRadius: "var(--radius-md)",
        padding: "16px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "10px",
        }}
      >
        <span style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>
          {label}
        </span>
        <span style={{ fontWeight: 600, fontSize: "0.9375rem" }}>
          {value}
          <span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>/10</span>
        </span>
      </div>
      <div
        style={{
          height: "6px",
          background: "var(--bg-elevated)",
          borderRadius: "3px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${(value / 10) * 100}%`,
            background: color,
            borderRadius: "3px",
            transition: "width 0.8s ease",
          }}
        />
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border-subtle)",
        borderRadius: "var(--radius-lg)",
        padding: "24px",
        marginBottom: "24px",
      }}
    >
      <h3
        style={{
          fontSize: "1.125rem",
          fontWeight: 600,
          marginBottom: "12px",
        }}
      >
        {title}
      </h3>
      {children}
    </div>
  );
}

function ListSection({
  title,
  items,
  icon,
  marginBottom = "0",
}: {
  title: string;
  items: string[];
  icon: React.ReactNode;
  marginBottom?: string;
}) {
  return (
    <div
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border-subtle)",
        borderRadius: "var(--radius-lg)",
        padding: "24px",
        marginBottom,
      }}
    >
      <h3
        style={{
          fontSize: "1rem",
          fontWeight: 600,
          marginBottom: "16px",
          color: "var(--text-primary)",
        }}
      >
        {title}
      </h3>
      {items.length > 0 ? (
        <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: "10px" }}>
          {items.map((item, i) => (
            <li
              key={i}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "10px",
                color: "var(--text-secondary)",
                fontSize: "0.9375rem",
                lineHeight: 1.5,
              }}
            >
              <span style={{ flexShrink: 0, marginTop: "2px" }}>{icon}</span>
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>—</p>
      )}
    </div>
  );
}
