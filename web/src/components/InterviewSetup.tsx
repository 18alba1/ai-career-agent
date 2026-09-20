import { useEffect, useMemo, useRef, useState } from "react";
import {
  Mic,
  Globe,
  Clock,
  Radio,
  Play,
  User,
  Briefcase,
  Search,
  AlertCircle,
  Loader2,
  ChevronDown,
  Check,
} from "lucide-react";
import { Button, SelectField } from "./ui";
import type {
  InterviewLanguage,
  AnswerMode,
  ThinkTime,
  CandidateListItem,
  JobListItem,
} from "../types/interview";
import { getCandidates, getJobs } from "../api/interviewApi";

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

type LoadState = "loading" | "loaded" | "error";

export function InterviewSetup({ onStart }: InterviewSetupProps) {
  const [candidates, setCandidates] = useState<CandidateListItem[]>([]);
  const [jobs, setJobs] = useState<JobListItem[]>([]);
  const [candidatesState, setCandidatesState] = useState<LoadState>("loading");
  const [jobsState, setJobsState] = useState<LoadState>("loading");
  const [loadError, setLoadError] = useState("");

  const [selectedCandidateId, setSelectedCandidateId] = useState<number | null>(null);
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);

  const [language, setLanguage] = useState<InterviewLanguage>("en");
  const [thinkTime, setThinkTime] = useState<ThinkTime>(5);
  const [answerMode, setAnswerMode] = useState<AnswerMode>("silence");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    setCandidatesState("loading");
    getCandidates()
      .then((data) => {
        if (cancelled) return;
        setCandidates(data);
        setCandidatesState("loaded");
      })
      .catch((e) => {
        if (cancelled) return;
        setLoadError(e instanceof Error ? e.message : "Failed to load candidates");
        setCandidatesState("error");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    setJobsState("loading");
    getJobs()
      .then((data) => {
        if (cancelled) return;
        setJobs(data);
        setJobsState("loaded");
      })
      .catch((e) => {
        if (cancelled) return;
        setLoadError(e instanceof Error ? e.message : "Failed to load jobs");
        setJobsState("error");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const selectedCandidate = useMemo(
    () => candidates.find((c) => c.id === selectedCandidateId) ?? null,
    [candidates, selectedCandidateId],
  );

  const selectedJob = useMemo(
    () => jobs.find((j) => j.id === selectedJobId) ?? null,
    [jobs, selectedJobId],
  );

  const handleStart = () => {
    if (!selectedCandidateId || !selectedJobId) {
      setError("Please select both a candidate and a job.");
      return;
    }
    setError("");
    onStart({
      candidateId: selectedCandidateId,
      jobId: selectedJobId,
      language,
      thinkTime,
      answerMode,
    });
  };

  const isLoading = candidatesState === "loading" || jobsState === "loading";
  const hasError = candidatesState === "error" || jobsState === "error";
  const canStart =
    !isLoading &&
    !hasError &&
    selectedCandidateId !== null &&
    selectedJobId !== null;

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
          {/* Candidate selector */}
          <Field label="Candidate">
            <SearchableSelect
              items={candidates}
              state={candidatesState}
              error={loadError}
              selectedId={selectedCandidateId}
              onSelect={setSelectedCandidateId}
              renderItem={(c) => ({
                primary: c.name,
                secondary: c.summary ?? undefined,
              })}
              placeholder="Select a candidate"
              searchPlaceholder="Search candidates..."
              icon={<User size={18} />}
              emptyText="No candidates found"
            />
          </Field>

          {/* Job selector */}
          <div style={{ marginTop: "20px" }}>
            <Field label="Job">
              <SearchableSelect
                items={jobs}
                state={jobsState}
                error={loadError}
                selectedId={selectedJobId}
                onSelect={setSelectedJobId}
                renderItem={(j) => ({
                  primary: j.title,
                  secondary: j.company,
                })}
                placeholder="Select a job"
                searchPlaceholder="Search jobs..."
                icon={<Briefcase size={18} />}
                emptyText="No jobs found"
              />
            </Field>
          </div>

          {/* Options */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "20px",
              marginTop: "28px",
            }}
          >
            <SettingRow icon={<Globe size={18} />} label="Language">
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
            disabled={!canStart}
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

// ---- Field wrapper ----

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      <label
        style={{
          fontSize: "0.8125rem",
          color: "var(--text-muted)",
          fontWeight: 500,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

// ---- Searchable Select ----

interface SearchableSelectProps<T extends { id: number }> {
  items: T[];
  state: LoadState;
  error: string;
  selectedId: number | null;
  onSelect: (id: number) => void;
  renderItem: (item: T) => { primary: string; secondary?: string };
  placeholder: string;
  searchPlaceholder: string;
  icon: React.ReactNode;
  emptyText: string;
}

function SearchableSelect<T extends { id: number }>({
  items,
  state,
  error,
  selectedId,
  onSelect,
  renderItem,
  placeholder,
  searchPlaceholder,
  icon,
  emptyText,
}: SearchableSelectProps<T>) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const selectedItem = items.find((i) => i.id === selectedId) ?? null;

  const filtered = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter((item) => {
      const { primary, secondary } = renderItem(item);
      return (
        primary.toLowerCase().includes(q) ||
        (secondary?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [items, search, renderItem]);

  const handleSelect = (id: number) => {
    onSelect(id);
    setOpen(false);
    setSearch("");
  };

  // Loading state
  if (state === "loading") {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          padding: "14px 16px",
          background: "var(--bg-elevated)",
          border: "1px solid var(--border-default)",
          borderRadius: "var(--radius-md)",
          color: "var(--text-muted)",
          fontSize: "0.9375rem",
        }}
      >
        <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} />
        Loading...
      </div>
    );
  }

  // Error state
  if (state === "error") {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          padding: "14px 16px",
          background: "rgba(239, 68, 68, 0.08)",
          border: "1px solid rgba(239, 68, 68, 0.25)",
          borderRadius: "var(--radius-md)",
          color: "var(--error)",
          fontSize: "0.875rem",
        }}
      >
        <AlertCircle size={18} />
        {error || "Failed to load"}
      </div>
    );
  }

  // Empty state (no items at all)
  if (items.length === 0) {
    return (
      <div
        style={{
          padding: "14px 16px",
          background: "var(--bg-elevated)",
          border: "1px solid var(--border-default)",
          borderRadius: "var(--radius-md)",
          color: "var(--text-muted)",
          fontSize: "0.9375rem",
        }}
      >
        {emptyText}
      </div>
    );
  }

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      {/* Trigger */}
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 16px",
          background: "var(--bg-elevated)",
          border: `1px solid ${open ? "var(--primary)" : "var(--border-default)"}`,
          borderRadius: "var(--radius-md)",
          color: selectedItem ? "var(--text-primary)" : "var(--text-muted)",
          fontSize: "0.9375rem",
          transition: "border-color 0.2s ease",
        }}
      >
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "10px",
            overflow: "hidden",
          }}
        >
          <span style={{ color: "var(--text-muted)", flexShrink: 0 }}>{icon}</span>
          {selectedItem ? (
            <span
              style={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {renderItem(selectedItem).primary}
              {renderItem(selectedItem).secondary && (
                <span style={{ color: "var(--text-muted)" }}>
                  {" — "}
                  {renderItem(selectedItem).secondary}
                </span>
              )}
            </span>
          ) : (
            placeholder
          )}
        </span>
        <ChevronDown
          size={18}
          style={{
            color: "var(--text-muted)",
            transform: open ? "rotate(180deg)" : "none",
            transition: "transform 0.2s ease",
            flexShrink: 0,
          }}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            right: 0,
            background: "var(--bg-elevated)",
            border: "1px solid var(--border-default)",
            borderRadius: "var(--radius-md)",
            boxShadow: "0 12px 40px rgba(0,0,0,0.5)",
            zIndex: 100,
            overflow: "hidden",
            animation: "fadeIn 0.15s ease",
          }}
        >
          {/* Search input */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 14px",
              borderBottom: "1px solid var(--border-subtle)",
            }}
          >
            <Search size={16} color="var(--text-muted)" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={searchPlaceholder}
              autoFocus
              style={{
                flex: 1,
                background: "transparent",
                border: "none",
                color: "var(--text-primary)",
                fontSize: "0.9375rem",
              }}
            />
          </div>

          {/* Items */}
          <div
            style={{
              maxHeight: "240px",
              overflowY: "auto",
            }}
          >
            {filtered.length === 0 ? (
              <div
                style={{
                  padding: "16px",
                  color: "var(--text-muted)",
                  fontSize: "0.875rem",
                  textAlign: "center",
                }}
              >
                No matches
              </div>
            ) : (
              filtered.map((item) => {
                const { primary, secondary } = renderItem(item);
                const isSelected = item.id === selectedId;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelect(item.id)}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "12px 14px",
                      background: isSelected
                        ? "rgba(59, 130, 246, 0.1)"
                        : "transparent",
                      color: "var(--text-primary)",
                      fontSize: "0.9375rem",
                      textAlign: "left",
                      transition: "background 0.15s ease",
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected)
                        (e.currentTarget as HTMLElement).style.background =
                          "var(--bg-card-hover)";
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected)
                        (e.currentTarget as HTMLElement).style.background =
                          "transparent";
                    }}
                  >
                    <span style={{ overflow: "hidden" }}>
                      <span style={{ display: "block", fontWeight: 500 }}>
                        {primary}
                      </span>
                      {secondary && (
                        <span
                          style={{
                            display: "block",
                            color: "var(--text-muted)",
                            fontSize: "0.8125rem",
                            marginTop: "2px",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {secondary}
                        </span>
                      )}
                    </span>
                    {isSelected && (
                      <Check size={16} color="var(--primary)" style={{ flexShrink: 0 }} />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
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
