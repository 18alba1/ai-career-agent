import { Mic, Square } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface MicrophoneStateProps {
  answerMode: "silence" | "button";
  onRecordingComplete: (blob: Blob) => void;
  onError: (message: string) => void;
  language: "en" | "sv";
}

const SILENCE_THRESHOLD = 0.015;
const SILENCE_DURATION = 1200;
const MIN_RECORDING_DURATION = 1000;

export function MicrophoneState({
  answerMode,
  onRecordingComplete,
  onError,
  language,
}: MicrophoneStateProps) {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const silenceStartRef = useRef<number | null>(null);
  const recordingStartRef = useRef<number>(0);
  const rafRef = useRef<number>(0);
  const completeCbRef = useRef(onRecordingComplete);
  completeCbRef.current = onRecordingComplete;
  const errorCbRef = useRef(onError);
  errorCbRef.current = onError;
  const modeRef = useRef(answerMode);
  modeRef.current = answerMode;

  const [phase, setPhase] = useState<"requesting" | "recording" | "processing">(
    "requesting",
  );
  const [waveform, setWaveform] = useState<number[]>(new Array(7).fill(6));

  useEffect(() => {
    let cancelled = false;

    const startMic = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        audioChunksRef.current = [];
        const recorder = new MediaRecorder(stream);
        mediaRecorderRef.current = recorder;

        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) audioChunksRef.current.push(e.data);
        };

        recorder.onstop = () => {
          stream.getTracks().forEach((t) => t.stop());
          if (audioContextRef.current) {
            try {
              audioContextRef.current.close();
            } catch {
              // ignore
            }
            audioContextRef.current = null;
          }
          setPhase("processing");
          const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
          completeCbRef.current(blob);
        };

        recorder.start();
        recordingStartRef.current = Date.now();
        setPhase("recording");

        if (modeRef.current === "silence") {
          setupSilenceDetection(stream);
        }
      } catch {
        errorCbRef.current(
          language === "sv"
            ? "Kunde inte komma åt mikrofonen."
            : "Could not access microphone.",
        );
      }
    };

    startMic();

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafRef.current);
      if (mediaRecorderRef.current?.state === "recording") {
        mediaRecorderRef.current.stop();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setupSilenceDetection = (stream: MediaStream) => {
    const ctx = new AudioContext();
    audioContextRef.current = ctx;
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 2048;
    const source = ctx.createMediaStreamSource(stream);
    source.connect(analyser);
    silenceStartRef.current = null;

    const detect = () => {
      if (
        !mediaRecorderRef.current ||
        mediaRecorderRef.current.state !== "recording" ||
        modeRef.current !== "silence"
      )
        return;

      const data = new Uint8Array(analyser.fftSize);
      analyser.getByteTimeDomainData(data);

      let sum = 0;
      for (let i = 0; i < data.length; i++) {
        const normalized = (data[i] - 128) / 128;
        sum += normalized * normalized;
      }
      const rms = Math.sqrt(sum / data.length);
      const now = Date.now();
      const elapsed = now - recordingStartRef.current;

      // Update waveform visualization
      const wave = Math.min(1, rms * 8);
      setWaveform((prev) => [...prev.slice(1), 6 + wave * 24]);

      if (rms < SILENCE_THRESHOLD && elapsed > MIN_RECORDING_DURATION) {
        if (silenceStartRef.current === null) {
          silenceStartRef.current = now;
        }
        if (now - silenceStartRef.current >= SILENCE_DURATION) {
          stopRecording();
          return;
        }
      } else {
        silenceStartRef.current = null;
      }

      rafRef.current = requestAnimationFrame(detect);
    };

    rafRef.current = requestAnimationFrame(detect);
  };

  const stopRecording = () => {
    cancelAnimationFrame(rafRef.current);
    if (mediaRecorderRef.current?.state === "recording") {
      setPhase("processing");
      mediaRecorderRef.current.stop();
    }
  };

  const messages = {
    requesting: language === "sv" ? "Begär mikrofonåtkomst..." : "Requesting microphone...",
    recording:
      answerMode === "silence"
        ? language === "sv"
          ? "Lyssnar... (tystnad avslutar automatiskt)"
          : "Listening... (silence ends automatically)"
        : language === "sv"
          ? "Inspelning... tryck Stoppa när klar"
          : "Recording... press Stop when done",
    processing: language === "sv" ? "Bearbetar ditt svar..." : "Processing your answer...",
  };

  return (
    <div
      style={{
        textAlign: "center",
        animation: "fadeIn 0.4s ease",
      }}
    >
      {/* Mic visualization */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "4px",
          height: "60px",
          marginBottom: "24px",
        }}
      >
        {phase === "processing" ? (
          <div
            style={{
              width: "32px",
              height: "32px",
              border: "3px solid var(--border-subtle)",
              borderTopColor: "var(--primary)",
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
            }}
          />
        ) : (
          waveform.map((h, i) => (
            <div
              key={i}
              style={{
                width: "4px",
                height: `${h}px`,
                background:
                  phase === "recording"
                    ? "linear-gradient(to top, var(--primary), var(--accent))"
                    : "var(--border-default)",
                borderRadius: "2px",
                transition: "height 0.1s ease",
              }}
            />
          ))
        )}
      </div>

      <p
        style={{
          color: phase === "recording" ? "var(--text-primary)" : "var(--text-secondary)",
          fontSize: "1rem",
          fontWeight: 500,
          marginBottom: phase === "recording" && answerMode === "button" ? "24px" : "0",
        }}
      >
        {phase === "requesting" && (
          <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
            <Mic size={16} />
            {messages.requesting}
          </span>
        )}
        {phase === "recording" && (
          <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
            <span
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: "var(--error)",
                animation: "pulse 1.5s ease-in-out infinite",
              }}
            />
            {messages.recording}
          </span>
        )}
        {phase === "processing" && messages.processing}
      </p>

      {phase === "recording" && answerMode === "button" && (
        <button
          onClick={stopRecording}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "12px 24px",
            background: "rgba(239, 68, 68, 0.12)",
            color: "var(--error)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            borderRadius: "var(--radius-md)",
            fontSize: "0.9375rem",
            fontWeight: 500,
            transition: "all 0.2s ease",
          }}
        >
          <Square size={16} fill="currentColor" />
          {language === "sv" ? "Stoppa" : "End Answer"}
        </button>
      )}
    </div>
  );
}
