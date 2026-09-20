import { useState } from "react";
import { Mic, Globe, Clock, Radio, Play } from "lucide-react";
import { Button, SelectField, NumberField } from "./ui";
import type { InterviewLanguage, AnswerMode, ThinkTime } from "../types/interview";

export interface InterviewConfig {
  candidateId: number;
  jobId: number;
  language: InterviewLanguage;
  thinkTime: ThinkTime;
  answerMode: AnswerMode;
}

interface InterviewSetupProps {
  onStart: (config: InterviewConfig) => void;
}

export function InterviewSetup({ onStart }: InterviewSetupProps) {
  const [candidateId, setCandidateId] = useState(5);
  const [jobId, setJobId] = useState(2);
  const [language, setLanguage] = useState<InterviewLanguage>("en");
  const [thinkTime, setThinkTime] = useState<ThinkTime>(5);
  const [answerMode, setAnswerMode] = useState<AnswerMode>("silence");
  const [error, setError] = useState("");

  const handleStart = () => {
    if (!candidateId || !jobId) {
      setError("Please enter a valid candidate ID and job ID.");
      return;
    }
    setError("");
    onStart({ candidateId, jobId, language, thinkTime, answerMode });
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 20px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "560px",
          animation: "fadeIn 0.6s ease",
        }}
      >
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "64px",
              height: "64px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, var(--primary), var(--accent))",
              marginBottom: "20px",
              boxShadow: "0 0 40px var(--primary-glow)",
            }}
          >
            <Mic size={28} color="#fff" />
          </div>
          <h1
            style={{
              fontSize: "1.75rem",
              fontWeight: 700,
              letterSpacing: "-0.02em",
              marginBottom: "8px",
            }}
          >
            AI Voice Interview
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "1rem" }}>
            Practice your interview with an adaptive AI interviewer
          </p>
        </div>

        {/* Setup card */}
        <div
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-xl)",
            padding: "32px",
          }}
        >
          {/* IDs */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "16px",
              marginBottom: "24px",
            }}
          >
            <NumberField
              label="Candidate ID"
              value={candidateId}
              onChange={(v) => setCandidateId(v)}
            />
            <NumberField
              label="Job ID"
              value={jobId}
              onChange={(v) => setJobId(v)}
            />
          </div>

          {/* Options */}
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <SettingRow icon={<Globe size={18} />} label="Interview Language">
              <SelectField
                value={language}
                onChange={(v) => setLanguage(v as InterviewLanguage)}
                options={[
                  { value: "en", label: "English" },
                  { value: "sv", label: "Svenska" },
                ]}
              />
            </SettingRow>

            <SettingRow icon={<Clock size={18} />} label="Think Time">
              <SelectField
                value={thinkTime}
                onChange={(v) => setThinkTime(Number(v) as ThinkTime)}
                options={[
                  { value: "0", label: "No delay" },
                  { value: "5", label: "5 seconds" },
                  { value: "10", label: "10 seconds" },
                  { value: "15", label: "15 seconds" },
                  { value: "30", label: "30 seconds" },
                ]}
              />
            </SettingRow>

            <SettingRow icon={<Radio size={18} />} label="Answer Mode">
              <SelectField
                value={answerMode}
                onChange={(v) => setAnswerMode(v as AnswerMode)}
                options={[
                  { value: "silence", label: "Auto-detect silence" },
                  { value: "button", label: "Press \"End Answer\"" },
                ]}
              />
            </SettingRow>
          </div>

          {error && (
            <p
              style={{
                color: "var(--error)",
                fontSize: "0.875rem",
                marginTop: "16px",
              }}
            >
              {error}
            </p>
          )}

          <Button
            onClick={handleStart}
            size="lg"
            style={{ width: "100%", marginTop: "28px" }}
          >
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <Play size={20} />
              Start Interview
            </span>
          </Button>
        </div>

        <p
          style={{
            textAlign: "center",
            color: "var(--text-muted)",
            fontSize: "0.8125rem",
            marginTop: "24px",
          }}
        >
          Your microphone will be used to record and transcribe answers
        </p>
      </div>
    </div>
  );
}

function SettingRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-end",
        gap: "16px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          color: "var(--text-muted)",
          fontSize: "0.8125rem",
          fontWeight: 500,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          whiteSpace: "nowrap",
          paddingBottom: "12px",
        }}
      >
        {icon}
        {label}
      </div>
      <div style={{ flex: 1 }}>{children}</div>
    </div>
  );
}
