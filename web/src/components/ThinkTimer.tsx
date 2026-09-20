import { useEffect, useRef, useState } from "react";

interface ThinkTimerProps {
  seconds: number;
  onComplete: () => void;
  language: "en" | "sv";
}

export function ThinkTimer({ seconds, onComplete, language }: ThinkTimerProps) {
  const [remaining, setRemaining] = useState(seconds);
  const callbackRef = useRef(onComplete);
  callbackRef.current = onComplete;

  useEffect(() => {
    if (seconds <= 0) {
      callbackRef.current();
      return;
    }

    setRemaining(seconds);

    const interval = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          callbackRef.current();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [seconds]);

  const label = language === "sv" ? "Betänketid" : "Think time";
  const progress = seconds > 0 ? ((seconds - remaining) / seconds) * 100 : 100;

  return (
    <div
      style={{
        textAlign: "center",
        animation: "fadeIn 0.3s ease",
      }}
    >
      <p
        style={{
          color: "var(--text-muted)",
          fontSize: "0.8125rem",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          marginBottom: "20px",
        }}
      >
        {label}
      </p>

      {/* Progress ring */}
      <div
        style={{
          position: "relative",
          width: "100px",
          height: "100px",
          margin: "0 auto",
        }}
      >
        <svg width="100" height="100" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="44"
            fill="none"
            stroke="var(--border-subtle)"
            strokeWidth="4"
          />
          <circle
            cx="50"
            cy="50"
            r="44"
            fill="none"
            stroke="var(--primary)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 44}`}
            strokeDashoffset={`${2 * Math.PI * 44 * (1 - progress / 100)}`}
            transform="rotate(-90 50 50)"
            style={{ transition: "stroke-dashoffset 1s linear" }}
          />
        </svg>
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            fontSize: "2rem",
            fontWeight: 700,
            color: "var(--text-primary)",
          }}
        >
          {remaining}
        </div>
      </div>
    </div>
  );
}
