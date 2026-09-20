import { useState } from "react";

import {
  AppShell,
  type AppPage,
} from "./components/AppShell";

import { Dashboard } from "./components/Dashboard";

import { InterviewSetup } from "./components/InterviewSetup";

import { InterviewSession } from "./components/InterviewSession";

import type { InterviewConfig } from "./components/InterviewSetup";

import { Candidate } from "./components/Candidate";

import { Jobs } from "./components/Jobs";

import { ApplicationDocuments } from "./components/ApplicationDocuments";

import { CareerAssistant } from "./components/CareerAssistant";

export default function App() {
  const [
    activePage,
    setActivePage,
  ] = useState<AppPage>(
    "dashboard",
  );

  const [
    interviewConfig,
    setInterviewConfig,
  ] = useState<InterviewConfig | null>(
    null,
  );

  /*
   * Once an interview starts, keep the
   * existing InterviewSession completely
   * separate from the application shell.
   */
  if (interviewConfig) {
    return (
      <InterviewSession
        config={interviewConfig}
        onExit={() => {
          setInterviewConfig(null);
          setActivePage("interview");
        }}
      />
    );
  }

  const renderPage = () => {
    switch (activePage) {
      case "dashboard":
        return (
          <Dashboard
            onNavigate={setActivePage}
          />
        );

      case "interview":
        return (
          <InterviewSetup
            onStart={(config) => {
              setInterviewConfig(config);
            }}
          />
        );

      case "candidate":
        return <Candidate />;

      case "jobs":
        return <Jobs />;

      case "documents":
        return <ApplicationDocuments />;

      case "assistant":

        return <CareerAssistant />;

      default:
        return (
          <Dashboard
            onNavigate={setActivePage}
          />
        );
    }
  };

  return (
    <AppShell
      activePage={activePage}
      onNavigate={setActivePage}
    >
      {renderPage()}
    </AppShell>
  );
}


/* ============================================================
   TEMPORARY PLACEHOLDER
   ============================================================ */

interface PlaceholderPageProps {
  title: string;
  description: string;
}

function PlaceholderPage({
  title,
  description,
}: PlaceholderPageProps) {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px",
      }}
    >
      <div
        style={{
          maxWidth: "560px",
          textAlign: "center",
        }}
      >
        <h1
          style={{
            margin: 0,
            fontSize: "2rem",
            letterSpacing: "-0.03em",
          }}
        >
          {title}
        </h1>

        <p
          style={{
            marginTop: "12px",
            color: "var(--text-secondary)",
            lineHeight: 1.6,
          }}
        >
          {description}
        </p>

        <p
          style={{
            marginTop: "20px",
            color: "var(--text-muted)",
            fontSize: "0.85rem",
          }}
        >
          This section will be connected to the
          existing AI Career Agent backend next.
        </p>
      </div>
    </div>
  );
}