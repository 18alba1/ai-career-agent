import { useCallback, useEffect, useRef, useState } from "react";
import { X, AlertCircle } from "lucide-react";
import { AIOrb } from "./AIOrb";
import { AIQuestion } from "./AIQuestion";
import { ThinkTimer } from "./ThinkTimer";
import { MicrophoneState } from "./MicrophoneState";
import { TranscriptReview } from "./TranscriptReview";
import { InterviewReportView } from "./InterviewReport";
import { Button } from "./ui";
import type { InterviewConfig } from "./InterviewSetup";
import type {
  InterviewQuestion,
  InterviewTurn,
  InterviewEvaluation,
  InterviewReport,
} from "../types/interview";
import {
  fetchNextQuestion,
  evaluateAnswer,
  fetchInterviewReport,
  transcribeAudio,
  fetchSpeechAudio,
} from "../api/interviewApi";

type Phase =
  | "loading"
  | "speaking"
  | "thinktime"
  | "listening"
  | "processing"
  | "review"
  | "submitting"
  | "generating"
  | "report"
  | "error";

export function InterviewSession({
  config,
  onExit,
}: {
  config: InterviewConfig;
  onExit: () => void;
}) {
  const [phase, setPhase] = useState<Phase>("loading");
  const [question, setQuestion] = useState<InterviewQuestion | null>(null);
  const [questionNumber, setQuestionNumber] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [report, setReport] = useState<InterviewReport | null>(null);
  const [error, setError] = useState("");

  const historyRef = useRef<InterviewTurn[]>([]);
  const evaluationsRef = useRef<InterviewEvaluation[]>([]);
  const micKeyRef = useRef(0);
  const audioElRef = useRef<HTMLAudioElement | null>(null);

  const { candidateId, jobId, language, thinkTime, answerMode } = config;

  // ---- Helpers ----

  const tts = useCallback(
    async (text: string): Promise<void> => {
      const url = await fetchSpeechAudio(text, language);
      return new Promise((resolve, reject) => {
        const audio = new Audio(url);
        audioElRef.current = audio;
        audio.onended = () => {
          URL.revokeObjectURL(url);
          resolve();
        };
        audio.onerror = () => {
          URL.revokeObjectURL(url);
          reject(new Error("Audio playback failed"));
        };
        audio.play().catch(reject);
      });
    },
    [language],
  );

  // ---- Flow: speak question -> think time -> listen ----

  const speakAndContinue = useCallback(
    async (q: InterviewQuestion) => {
      setPhase("speaking");
      try {
        await tts(q.question);
      } catch {
        // If TTS fails, still proceed with text
      }
      if (thinkTime > 0) {
        setPhase("thinktime");
      } else {
        setPhase("listening");
      }
    },
    [tts, thinkTime],
  );

  const handleThinkComplete = useCallback(() => {
    setPhase("listening");
  }, []);

  // ---- Recording -> transcribe -> review ----

  const handleRecordingComplete = useCallback(
    async (blob: Blob) => {
      setPhase("processing");
      try {
        const result = await transcribeAudio(blob, language);
        setTranscript(result.transcript || "");
        setPhase("review");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Transcription failed");
        setPhase("error");
      }
    },
    [language],
  );

  const handleRecordAgain = useCallback(() => {
    setTranscript("");
    micKeyRef.current += 1;
    setPhase("listening");
  }, []);

  // ---- Confirm answer -> evaluate -> next question ----

  const handleConfirmAnswer = useCallback(
    async (answer: string) => {
      if (!question) return;

      const turn: InterviewTurn = {
        question: question.question,
        answer,
        category: question.category,
        basis: question.basis,
      };

      historyRef.current.push(turn);

      // Evaluate silently
      setPhase("submitting");
      try {
        const evaluation = await evaluateAnswer(candidateId, jobId, {
          question: question.question,
          answer,
          question_category: question.category,
          question_basis: question.basis,
        });
        evaluationsRef.current.push(evaluation);
      } catch {
        // Evaluation failure should not stop the interview
      }

      // Fetch next question
      setPhase("generating");
      try {
        const next = await fetchNextQuestion(candidateId, jobId, {
          history: historyRef.current.map((t) => ({
            question: t.question,
            answer: t.answer,
          })),
          language,
        });
        setQuestion(next);
        setQuestionNumber((n) => n + 1);
        await speakAndContinue(next);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to generate next question");
        setPhase("error");
      }
    },
    [question, candidateId, jobId, language, speakAndContinue],
  );

  // ---- End interview -> report ----

  const handleEndInterview = useCallback(async () => {
    setPhase("generating");
    try {
      const rpt = await fetchInterviewReport(candidateId, jobId, {
        history: historyRef.current,
        evaluations: evaluationsRef.current,
      });
      setReport(rpt);
      setPhase("report");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate report");
      setPhase("error");
    }
  }, [candidateId, jobId]);

  // ---- Start: initial question ----

  const startInterview = useCallback(async () => {
    setPhase("loading");
    try {
      const q = await fetchNextQuestion(candidateId, jobId, {
        history: [],
        language,
      });
      setQuestion(q);
      setQuestionNumber(1);
      await speakAndContinue(q);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to start interview");
      setPhase("error");
    }
  }, [candidateId, jobId, language, speakAndContinue]);

  // Start on mount
  const startedRef = useRef(false);
  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    startInterview();
  }, [startInterview]);

  const orbState = (() => {
    switch (phase) {
      case "loading":
      case "generating":
        return "thinking" as const;
      case "speaking":
        return "speaking" as const;
      case "listening":
        return "listening" as const;
      case "processing":
      case "submitting":
        return "processing" as const;
      default:
        return "idle" as const;
    }
  })();

  const statusText = (() => {
    const sv = language === "sv";
    switch (phase) {
      case "loading": return sv ? "Förbereder intervjun..." : "Preparing interview...";
      case "speaking": return sv ? "AI pratar..." : "AI is speaking...";
      case "thinktime": return sv ? "Betänketid" : "Think time";
      case "listening": return sv ? "Lyssnar..." : "Listening...";
      case "processing": return sv ? "Bearbetar ditt svar..." : "Processing your answer...";
      case "review": return sv ? "Granska ditt svar" : "Review your answer";
      case "submitting": return sv ? "Utvärderar..." : "Evaluating...";
      case "generating": return sv ? "Förbereder nästa fråga..." : "Preparing next question...";
      default: return "";
    }
  })();

  if (phase === "error") {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px",
          gap: "24px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            color: "var(--error)",
          }}
        >
          <AlertCircle size={28} />
          <span style={{ fontSize: "1.125rem", fontWeight: 500 }}>{error}</span>
        </div>
        <Button variant="secondary" onClick={onExit}>
          {language === "sv" ? "Tillbaka till start" : "Back to Setup"}
        </Button>
      </div>
    );
  }

  if (phase === "report" && report) {
    return (
      <InterviewReportView
        report={report}
        onRestart={onExit}
        language={language}
      />
    );
  }

  const showEndButton =
    phase !== "listening" && phase !== "review" && phase !== "loading";
  const sv = language === "sv";

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        position: "relative",
      }}
    >
      {/* Top bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "20px 24px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            color: "var(--text-muted)",
            fontSize: "0.875rem",
          }}
        >
          <span
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: "var(--success)",
              animation: "pulse 2s ease-in-out infinite",
            }}
          />
          {sv ? "Intervju pågår" : "Interview in progress"} · Q{questionNumber}
        </div>

        {showEndButton ? (
          <Button variant="danger" size="sm" onClick={handleEndInterview}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
              <X size={14} />
              {sv ? "Avsluta" : "End Interview"}
            </span>
          </Button>
        ) : (
          <div style={{ width: "120px" }} />
        )}
      </div>

      {/* Main content area */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 20px 40px",
          gap: "40px",
        }}
      >
        {/* AI Orb */}
        <AIOrb state={orbState} size={140} />

        {/* Status text */}
        {phase !== "review" && (
          <p
            style={{
              color: "var(--text-secondary)",
              fontSize: "0.9375rem",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              fontWeight: 500,
            }}
          >
            {statusText}
          </p>
        )}

        {/* Phase content */}
        {phase === "loading" && (
          <div
            style={{
              width: "40px",
              height: "40px",
              border: "3px solid var(--border-subtle)",
              borderTopColor: "var(--primary)",
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
            }}
          />
        )}

        {(phase === "speaking" || phase === "thinktime" || phase === "listening" ||
          phase === "processing" || phase === "submitting" || phase === "generating") &&
          question && (
            <AIQuestion question={question} questionNumber={questionNumber} />
          )}

        {phase === "thinktime" && (
          <ThinkTimer
            seconds={thinkTime}
            onComplete={handleThinkComplete}
            language={language}
          />
        )}

        {phase === "listening" && (
          <MicrophoneState
            key={micKeyRef.current}
            answerMode={answerMode}
            onRecordingComplete={handleRecordingComplete}
            onError={(msg) => {
              setError(msg);
              setPhase("error");
            }}
            language={language}
          />
        )}

        {phase === "review" && (
          <TranscriptReview
            transcript={transcript}
            onConfirm={handleConfirmAnswer}
            onRecordAgain={handleRecordAgain}
            language={language}
          />
        )}
      </div>
    </div>
  );
}
