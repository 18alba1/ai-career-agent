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
  | "ending"
  | "reporting"
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

  // ---- Race-condition guards ----

  /** False once End Interview is pressed — no new cycle may proceed. */
  const interviewActiveRef = useRef(true);
  /** True while the ending/reporting sequence is in progress. */
  const endingRef = useRef(false);
  /** Ensures POST /interview/report is called at most once. */
  const reportRequestedRef = useRef(false);
  /**
   * Incremented every time End Interview is pressed or a new interview starts.
   * Each async continuation captures the value at call time and bails out
   * if it has changed by the time the await resolves.
   */
  const sessionIdRef = useRef(0);
  /** Aborts in-flight fetches (next-question, TTS, evaluate, transcribe). */
  const abortRef = useRef<AbortController | null>(null);

  const { candidateId, jobId, language, thinkTime, answerMode } = config;

  // ---- Abort / cleanup helpers ----

  const abortInFlight = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
  }, []);

  const stopAudio = useCallback(() => {
    if (audioElRef.current) {
      try {
        audioElRef.current.pause();
      } catch {
        // ignore
      }
      audioElRef.current = null;
    }
  }, []);

  /** Check whether this async cycle is still the current one. */
  const isCurrentCycle = useCallback(() => {
    return interviewActiveRef.current && !endingRef.current;
  }, []);

  // ---- TTS ----

  const tts = useCallback(
    async (text: string, session: number): Promise<void> => {
      const controller = new AbortController();
      abortRef.current = controller;

      let url: string;
      try {
        url = await fetchSpeechAudio(text, language, controller.signal);
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") return;
        // TTS fetch failed — but the interview may still be active
        return;
      }

      // Guard: bail if the interview ended while fetching
      if (session !== sessionIdRef.current || !interviewActiveRef.current) {
        URL.revokeObjectURL(url);
        return;
      }

      return new Promise<void>((resolve) => {
        const audio = new Audio(url);
        audioElRef.current = audio;

        const cleanup = () => {
          URL.revokeObjectURL(url);
          if (audioElRef.current === audio) {
            audioElRef.current = null;
          }
        };

        audio.onended = () => {
          cleanup();
          resolve();
        };
        audio.onerror = () => {
          cleanup();
          resolve();
        };

        audio.play().catch(() => {
          cleanup();
          resolve();
        });
      });
    },
    [language],
  );

  // ---- Flow: speak question -> think time -> listen ----

  const speakAndContinue = useCallback(
    async (q: InterviewQuestion, session: number) => {
      setPhase("speaking");
      await tts(q.question, session);

      // Guard: bail if interview ended during TTS
      if (session !== sessionIdRef.current || !interviewActiveRef.current) return;

      if (thinkTime > 0) {
        setPhase("thinktime");
      } else {
        setPhase("listening");
      }
    },
    [tts, thinkTime],
  );

  const handleThinkComplete = useCallback(
    (session: number) => {
      if (session !== sessionIdRef.current || !interviewActiveRef.current) return;
      setPhase("listening");
    },
    [],
  );

  // ---- Recording -> transcribe -> review ----

  const handleRecordingComplete = useCallback(
    async (blob: Blob) => {
      const session = sessionIdRef.current;
      if (!interviewActiveRef.current) return;

      setPhase("processing");

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const result = await transcribeAudio(blob, language, controller.signal);

        // Guard: bail if interview ended during transcription
        if (session !== sessionIdRef.current || !interviewActiveRef.current) return;

        setTranscript(result.transcript || "");
        setPhase("review");
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") return;
        if (session !== sessionIdRef.current || !interviewActiveRef.current) return;
        setError(e instanceof Error ? e.message : "Transcription failed");
        setPhase("error");
      }
    },
    [language],
  );

  const handleRecordAgain = useCallback(() => {
    if (!interviewActiveRef.current) return;
    setTranscript("");
    micKeyRef.current += 1;
    setPhase("listening");
  }, []);

  // ---- Confirm answer -> evaluate -> next question ----

  const handleConfirmAnswer = useCallback(
    async (answer: string) => {
      if (!question) return;
      if (!interviewActiveRef.current) return;

      const session = sessionIdRef.current;

      const turn: InterviewTurn = {
        question: question.question,
        answer,
        category: question.category,
        basis: question.basis,
      };

      historyRef.current.push(turn);

      // Evaluate silently
      setPhase("submitting");

      const evalController = new AbortController();
      abortRef.current = evalController;

      try {
        const evaluation = await evaluateAnswer(
          candidateId,
          jobId,
          {
            question: question.question,
            answer,
            question_category: question.category,
            question_basis: question.basis,
          },
          evalController.signal,
        );

        // Guard: bail if interview ended during evaluation
        if (session !== sessionIdRef.current || !interviewActiveRef.current) return;

        evaluationsRef.current.push(evaluation);
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") return;
        // Evaluation failure should not stop the interview — but
        // only if the interview is still active.
        if (session !== sessionIdRef.current || !interviewActiveRef.current) return;
      }

      // Guard: do NOT fetch next question if interview has ended
      if (session !== sessionIdRef.current || !interviewActiveRef.current) return;

      // Fetch next question
      setPhase("generating");

      const nextController = new AbortController();
      abortRef.current = nextController;

      try {
        const next = await fetchNextQuestion(
          candidateId,
          jobId,
          {
            history: historyRef.current.map((t) => ({
              question: t.question,
              answer: t.answer,
            })),
            language,
          },
          nextController.signal,
        );

        // Guard: bail if interview ended during fetch
        if (session !== sessionIdRef.current || !interviewActiveRef.current) return;

        setQuestion(next);
        setQuestionNumber((n) => n + 1);
        await speakAndContinue(next, session);
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") return;
        if (session !== sessionIdRef.current || !interviewActiveRef.current) return;
        setError(e instanceof Error ? e.message : "Failed to generate next question");
        setPhase("error");
      }
    },
    [question, candidateId, jobId, language, speakAndContinue],
  );

  // ---- End interview -> report (exactly once) ----

  const handleEndInterview = useCallback(async () => {
    // Guard against double-clicks / repeated calls
    if (endingRef.current || reportRequestedRef.current) return;

    endingRef.current = true;
    interviewActiveRef.current = false;
    sessionIdRef.current += 1;
    reportRequestedRef.current = true;

    // Abort any in-flight fetches (next-question, TTS, evaluate, transcribe)
    abortInFlight();
    // Stop any currently playing TTS audio
    stopAudio();

    setPhase("ending");

    // Guard: if there are no completed answers, show empty report state
    if (historyRef.current.length === 0 || evaluationsRef.current.length === 0) {
      setReport({
        overall_score: 0,
        technical_score: 0,
        behavioral_score: 0,
        communication_score: 0,
        grounding_score: 0,
        strongest_answers: [],
        weakest_answers: [],
        recurring_strengths: [],
        recurring_weaknesses: [],
        recommendations: [],
        summary:
          language === "sv"
            ? "Det finns inga slutförda intervjusvar att rapportera."
            : "No completed interview answers were found.",
      });
      setPhase("report");
      return;
    }

    setPhase("reporting");

    try {
      const rpt = await fetchInterviewReport(
        candidateId,
        jobId,
        {
          history: historyRef.current,
          evaluations: evaluationsRef.current,
        },
      );

      // Even after the report returns, we don't need to check guards —
      // this is the terminal state and reportRequestedRef prevents duplicates.
      setReport(rpt);
      setPhase("report");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate report");
      setPhase("error");
    }
  }, [abortInFlight, stopAudio, candidateId, jobId, language]);

  // ---- Start: initial question ----

  const startInterview = useCallback(async () => {
    const session = sessionIdRef.current;

    setPhase("loading");

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const q = await fetchNextQuestion(
        candidateId,
        jobId,
        { history: [], language },
        controller.signal,
      );

      // Guard: bail if interview ended during fetch
      if (session !== sessionIdRef.current || !interviewActiveRef.current) return;

      setQuestion(q);
      setQuestionNumber(1);
      await speakAndContinue(q, session);
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return;
      if (session !== sessionIdRef.current || !interviewActiveRef.current) return;
      setError(e instanceof Error ? e.message : "Failed to start interview");
      setPhase("error");
    }
  }, [candidateId, jobId, language, speakAndContinue]);

  // Start on mount — StrictMode-safe deferred startup.
  // In StrictMode, React mounts, unmounts, then re-mounts.
  // The cleanup cancels the deferred startup from the first mount and
  // invalidates its session, so the second mount's startup is the only
  // one that actually fires /interview/next.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      sessionIdRef.current += 1;
      interviewActiveRef.current = true;
      endingRef.current = false;
      reportRequestedRef.current = false;
      startInterview();
    }, 0);

    return () => {
      window.clearTimeout(timer);
      interviewActiveRef.current = false;
      // Invalidate any async work from the previous effect cycle.
      sessionIdRef.current += 1;
      abortInFlight();
      stopAudio();
    };
  }, [startInterview, abortInFlight, stopAudio]);

  // ---- Derived render state ----

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
      case "ending":
      case "reporting":
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
      case "ending": return sv ? "Avslutar intervjun..." : "Ending interview...";
      case "reporting": return sv ? "Genererar intervjurapport..." : "Generating interview report...";
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

  // End Interview button is disabled during listening/review (recording in
  // progress or transcript pending) and during the ending/reporting phase.
  const endButtonDisabled =
    phase === "listening" ||
    phase === "review" ||
    phase === "ending" ||
    phase === "reporting" ||
    endingRef.current;

  const showEndButton = phase !== "loading";
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
              background:
                phase === "ending" || phase === "reporting"
                  ? "var(--warning)"
                  : "var(--success)",
              animation: "pulse 2s ease-in-out infinite",
            }}
          />
          {(phase === "ending" || phase === "reporting")
            ? (sv ? "Avslutar..." : "Ending...")
            : (sv ? "Intervju pågår" : "Interview in progress")
          } · Q{questionNumber}
        </div>

        {showEndButton ? (
          <Button
            variant="danger"
            size="sm"
            onClick={handleEndInterview}
            disabled={endButtonDisabled}
          >
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

        {(phase === "ending" || phase === "reporting") && (
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
            onComplete={() => handleThinkComplete(sessionIdRef.current)}
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
