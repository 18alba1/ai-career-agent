import {
  useEffect,
  useMemo,
  useState,
} from "react";

import type {
  CSSProperties,
} from "react";

import {
  ArrowRight,
  Briefcase,
  FileText,
  MessageCircle,
  Mic,
  Sparkles,
  UserRound,
  FolderKanban,
  GraduationCap,
} from "lucide-react";

import {
  getCandidates,
  getCandidate,
} from "../api/candidateApi";

import {
  getJobs,
} from "../api/jobApi";

import type {
  CandidateListItem,
  CandidateProfile,
} from "../types/candidate";

import type {
  Job,
} from "../types/job";

import type {
  AppPage,
} from "./AppShell";


export function Dashboard({
  onNavigate,
}: {
  onNavigate: (
    page: AppPage,
  ) => void;
}) {

  // ============================================================
  // STATE
  // ============================================================

  const [
    candidates,
    setCandidates,
  ] = useState<CandidateListItem[]>(
    [],
  );


  const [
    jobs,
    setJobs,
  ] = useState<Job[]>([]);


  const [
    candidateProfile,
    setCandidateProfile,
  ] = useState<CandidateProfile | null>(
    null,
  );


  const [
    loading,
    setLoading,
  ] = useState(true);


  const [
    error,
    setError,
  ] = useState("");


  // ============================================================
  // LOAD DASHBOARD DATA
  // ============================================================

  useEffect(() => {

    async function loadDashboard() {

      setLoading(true);
      setError("");

      try {

        const [
          candidateData,
          jobData,
        ] = await Promise.all([
          getCandidates(),
          getJobs(),
        ]);


        setCandidates(
          candidateData,
        );

        setJobs(
          jobData,
        );


        /*
         * Load the newest candidate's
         * full profile so the dashboard
         * can show useful profile metrics.
         */
        if (
          candidateData.length > 0
        ) {

          const latestCandidate =
            candidateData.reduce(
              (latest, candidate) =>
                candidate.id > latest.id
                  ? candidate
                  : latest,
            );


          try {

            const profile =
              await getCandidate(
                latestCandidate.id,
              );

            setCandidateProfile(
              profile,
            );

          } catch (profileError) {

            console.error(
              "Failed to load candidate profile:",
              profileError,
            );

          }
        }

      } catch (err) {

        console.error(
          "Failed to load dashboard:",
          err,
        );

        setError(
          err instanceof Error
            ? err.message
            : "Failed to load dashboard.",
        );

      } finally {

        setLoading(false);
      }
    }


    void loadDashboard();

  }, []);


  // ============================================================
  // DERIVED DATA
  // ============================================================ 
  const latestCandidate =
    useMemo(
      () =>
        candidates.length > 0
          ? candidates.reduce(
              (latest, candidate) =>
                candidate.id > latest.id
                  ? candidate
                  : latest,
            )
          : null,
      [
        candidates,
      ],
    );


  const latestJob =
    useMemo(
      () =>
        jobs.length > 0
          ? jobs[0]
          : null,
      [
        jobs,
      ],
    );


  const profileStats =
    useMemo(
      () => ({
        skills:
          candidateProfile?.skills?.length ??
          0,

        projects:
          candidateProfile?.projects?.length ??
          0,

        experience:
          candidateProfile?.experience?.length ??
          0,

        education:
          candidateProfile?.education?.length ??
          0,
      }),
      [
        candidateProfile,
      ],
    );


  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div
      style={{
        maxWidth:
          "1250px",

        margin:
          "0 auto",

        padding:
          "40px",
      }}
    >

      {/* ====================================================== */}
      {/* HEADER                                                 */}
      {/* ====================================================== */}

      <div
        style={{
          marginBottom:
            "30px",
        }}
      >

        <div
          style={{
            display:
              "flex",

            alignItems:
              "center",

            gap:
              "8px",

            color:
              "var(--text-secondary)",

            fontSize:
              "0.8rem",

            marginBottom:
              "8px",
          }}
        >

          <Sparkles
            size={16}
          />

          AI Career Agent

        </div>


        <h1
          style={{
            margin: 0,

            fontSize:
              "2rem",

            letterSpacing:
              "-0.03em",
          }}
        >
          Career Dashboard
        </h1>


        <p
          style={{
            marginTop:
              "10px",

            marginBottom:
              0,

            color:
              "var(--text-secondary)",

            lineHeight:
              1.6,

            maxWidth:
              "700px",
          }}
        >
          Manage your candidate profile,
          analyze opportunities and prepare
          for your next application or interview.
        </p>

      </div>


      {/* ====================================================== */}
      {/* ERROR                                                  */}
      {/* ====================================================== */}

      {error && (

        <Message
          message={
            error
          }
        />

      )}


      {/* ====================================================== */}
      {/* LOADING                                                */}
      {/* ====================================================== */}

      {loading ? (

        <div
          style={{
            minHeight:
              "300px",

            display:
              "flex",

            alignItems:
              "center",

            justifyContent:
              "center",

            color:
              "var(--text-secondary)",
          }}
        >

          Loading dashboard...

        </div>

      ) : (

        <>
          {/* ================================================== */}
          {/* TOP OVERVIEW                                      */}
          {/* ================================================== */}

          <div
            style={{
              display:
                "grid",

              gridTemplateColumns:
                "minmax(0, 1.4fr) minmax(260px, 0.6fr)",

              gap:
                "16px",

              marginBottom:
                "16px",
            }}
          >

            {/* ============================================== */}
            {/* PROFILE CARD                                  */}
            {/* ============================================== */}

            <section
              style={
                cardStyle
              }
            >

              <div
                style={{
                  display:
                    "flex",

                  justifyContent:
                    "space-between",

                  alignItems:
                    "flex-start",

                  gap:
                    "20px",
                }}
              >

                <div
                  style={{
                    display:
                      "flex",

                    alignItems:
                      "center",

                    gap:
                      "14px",
                  }}
                >

                  <div
                    style={{
                      width:
                        "48px",

                      height:
                        "48px",

                      borderRadius:
                        "12px",

                      display:
                        "flex",

                      alignItems:
                        "center",

                      justifyContent:
                        "center",

                      background:
                        "var(--primary-glow)",
                    }}
                  >

                    <UserRound
                      size={22}
                    />

                  </div>


                  <div>

                    <div
                      style={{
                        color:
                          "var(--text-secondary)",

                        fontSize:
                          "0.75rem",

                        marginBottom:
                          "4px",
                      }}
                    >
                      Candidate Profile
                    </div>


                    <h2
                      style={{
                        margin: 0,

                        fontSize:
                          "1.25rem",

                        letterSpacing:
                          "-0.02em",
                      }}
                    >
                      {latestCandidate?.name ??
                        "No candidate yet"}
                    </h2>

                  </div>

                </div>


                <button
                  type="button"
                  onClick={() =>
                    onNavigate(
                      "candidate",
                    )
                  }
                  style={
                    secondaryButtonStyle
                  }
                >

                  View Profile

                  <ArrowRight
                    size={14}
                  />

                </button>

              </div>


              {candidateProfile?.summary && (

                <p
                  style={{
                    marginTop:
                      "20px",

                    marginBottom:
                      0,

                    color:
                      "var(--text-secondary)",

                    fontSize:
                      "0.84rem",

                    lineHeight:
                      1.65,
                  }}
                >
                  {candidateProfile.summary}
                </p>

              )}


              {!latestCandidate && (

                <div
                  style={{
                    marginTop:
                      "20px",

                    padding:
                      "16px",

                    borderRadius:
                      "10px",

                    background:
                      "var(--bg)",

                    color:
                      "var(--text-secondary)",

                    fontSize:
                      "0.82rem",
                  }}
                >
                  Upload your CV to create your
                  candidate profile.
                </div>

              )}


              {latestCandidate && (

                <div
                  style={{
                    display:
                      "grid",

                    gridTemplateColumns:
                      "repeat(4, minmax(0, 1fr))",

                    gap:
                      "10px",

                    marginTop:
                      "22px",
                  }}
                >

                  <StatItem
                    icon={
                      <Sparkles
                        size={15}
                      />
                    }
                    label="Skills"
                    value={
                      profileStats.skills
                    }
                  />

                  <StatItem
                    icon={
                      <FolderKanban
                        size={15}
                      />
                    }
                    label="Projects"
                    value={
                      profileStats.projects
                    }
                  />

                  <StatItem
                    icon={
                      <Briefcase
                        size={15}
                      />
                    }
                    label="Experience"
                    value={
                      profileStats.experience
                    }
                  />

                  <StatItem
                    icon={
                      <GraduationCap
                        size={15}
                      />
                    }
                    label="Education"
                    value={
                      profileStats.education
                    }
                  />

                </div>

              )}

            </section>


            {/* ============================================== */}
            {/* QUICK STATS                                    */}
            {/* ============================================== */}

            <section
              style={
                cardStyle
              }
            >

              <div
                style={{
                  color:
                    "var(--text-secondary)",

                  fontSize:
                    "0.75rem",

                  marginBottom:
                    "14px",
                }}
              >
                Your Workspace
              </div>


              <div
                style={{
                  display:
                    "flex",

                  flexDirection:
                    "column",

                  gap:
                    "12px",
                }}
              >

                <OverviewStat
                  icon={
                    <Briefcase
                      size={17}
                    />
                  }
                  label="Saved Jobs"
                  value={
                    jobs.length
                  }
                />


                <OverviewStat
                  icon={
                    <UserRound
                      size={17}
                    />
                  }
                  label="Candidate Profiles"
                  value={
                    candidates.length
                  }
                />

              </div>

            </section>

          </div>


          {/* ================================================== */}
          {/* LATEST JOB                                       */}
          {/* ================================================== */}

          <section
            style={{
              ...cardStyle,

              marginBottom:
                "16px",
            }}
          >

            <div
              style={{
                display:
                  "flex",

                justifyContent:
                  "space-between",

                alignItems:
                  "center",

                gap:
                  "20px",

                marginBottom:
                  "18px",
              }}
            >

              <div>

                <div
                  style={{
                    display:
                      "flex",

                    alignItems:
                      "center",

                    gap:
                      "8px",

                    color:
                      "var(--text-secondary)",

                    fontSize:
                      "0.8rem",

                    marginBottom:
                      "6px",
                  }}
                >

                  <Briefcase
                    size={16}
                  />

                  Latest Opportunity

                </div>


                <h3
                  style={{
                    margin: 0,

                    fontSize:
                      "1.05rem",
                  }}
                >
                  {latestJob
                    ? latestJob.title
                    : "No jobs saved yet"}
                </h3>

              </div>


              <button
                type="button"
                onClick={() =>
                  onNavigate(
                    "jobs",
                  )
                }
                style={
                  secondaryButtonStyle
                }
              >

                View Jobs

                <ArrowRight
                  size={14}
                />

              </button>

            </div>


            {latestJob ? (

              <div
                style={{
                  display:
                    "grid",

                  gridTemplateColumns:
                    "minmax(0, 1fr) auto",

                  gap:
                    "20px",

                  alignItems:
                    "end",

                  padding:
                    "16px",

                  borderRadius:
                    "10px",

                  background:
                    "var(--bg)",
                }}
              >

                <div>

                  <div
                    style={{
                      color:
                        "var(--text-secondary)",

                      fontSize:
                        "0.78rem",

                      marginBottom:
                        "6px",
                    }}
                  >
                    {latestJob.company}
                  </div>


                  <div
                    style={{
                      color:
                        "var(--text-secondary)",

                      fontSize:
                        "0.8rem",

                      lineHeight:
                        1.55,

                      display:
                        "-webkit-box",

                      WebkitLineClamp:
                        3,

                      WebkitBoxOrient:
                        "vertical",

                      overflow:
                        "hidden",
                    } as CSSProperties}
                  >
                    {latestJob.description}
                  </div>

                </div>


                <button
                  type="button"
                  onClick={() =>
                    onNavigate(
                      "jobs",
                    )
                  }
                  style={
                    primaryButtonStyle
                  }
                >

                  Analyze Job

                  <ArrowRight
                    size={14}
                  />

                </button>

              </div>

            ) : (

              <EmptyState
                text="Add your first job to start analyzing requirements and Job Fit."
                buttonLabel="Add Job"
                onClick={() =>
                  onNavigate(
                    "jobs",
                  )
                }
              />

            )}

          </section>


          {/* ================================================== */}
          {/* QUICK ACTIONS                                    */}
          {/* ================================================== */}

          <section
            style={
              cardStyle
            }
          >

            <div
              style={{
                marginBottom:
                  "18px",
              }}
            >

              <div
                style={{
                  color:
                    "var(--text-secondary)",

                  fontSize:
                    "0.75rem",

                  marginBottom:
                    "5px",
                }}
              >
                Quick Actions
              </div>


              <h3
                style={{
                  margin: 0,

                  fontSize:
                    "1.05rem",
                }}
              >
                Continue building your application
              </h3>

            </div>


            <div
              style={{
                display:
                  "grid",

                gridTemplateColumns:
                  "repeat(4, minmax(0, 1fr))",

                gap:
                  "12px",
              }}
            >

              <QuickAction
                icon={
                  <UserRound
                    size={18}
                  />
                }
                title="Candidate"
                description="View your profile"
                onClick={() =>
                  onNavigate(
                    "candidate",
                  )
                }
              />


              <QuickAction
                icon={
                  <FileText
                    size={18}
                  />
                }
                title="Application"
                description="Tailor CV & letter"
                onClick={() =>
                  onNavigate(
                    "documents",
                  )
                }
              />


              <QuickAction
                icon={
                  <MessageCircle
                    size={18}
                  />
                }
                title="Career Assistant"
                description="Ask about your profile"
                onClick={() =>
                  onNavigate(
                    "assistant",
                  )
                }
              />


              <QuickAction
                icon={
                  <Mic
                    size={18}
                  />
                }
                title="Interview"
                description="Practice your interview"
                onClick={() =>
                  onNavigate(
                    "interview",
                  )
                }
              />

            </div>

          </section>

        </>
      )}

    </div>
  );
}


/* ============================================================
   STAT ITEM
   ============================================================ */

function StatItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {

  return (
    <div
      style={{
        padding:
          "12px",

        borderRadius:
          "10px",

        background:
          "var(--bg)",
      }}
    >

      <div
        style={{
          display:
            "flex",

          alignItems:
            "center",

          gap:
            "6px",

          color:
            "var(--text-secondary)",

          fontSize:
            "0.68rem",

          marginBottom:
            "5px",
        }}
      >

        {icon}

        {label}

      </div>


      <div
        style={{
          fontSize:
            "1.1rem",

          fontWeight:
            700,
        }}
      >
        {value}
      </div>

    </div>
  );
}


/* ============================================================
   OVERVIEW STAT
   ============================================================ */

function OverviewStat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {

  return (
    <div
      style={{
        display:
          "flex",

        alignItems:
          "center",

        justifyContent:
          "space-between",

        gap:
          "12px",

        padding:
          "13px",

        borderRadius:
          "10px",

        background:
          "var(--bg)",
      }}
    >

      <div
        style={{
          display:
            "flex",

          alignItems:
            "center",

          gap:
            "9px",
        }}
      >

        <div
          style={{
            width:
              "30px",

            height:
              "30px",

            borderRadius:
              "8px",

            display:
              "flex",

            alignItems:
              "center",

            justifyContent:
              "center",

            background:
              "var(--primary-glow)",
          }}
        >

          {icon}

        </div>


        <span
          style={{
            color:
              "var(--text-secondary)",

            fontSize:
              "0.78rem",
          }}
        >
          {label}
        </span>

      </div>


      <strong
        style={{
          fontSize:
            "1rem",
        }}
      >
        {value}
      </strong>

    </div>
  );
}


/* ============================================================
   QUICK ACTION
   ============================================================ */

function QuickAction({
  icon,
  title,
  description,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
}) {

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display:
          "flex",

        flexDirection:
          "column",

        alignItems:
          "flex-start",

        gap:
          "10px",

        padding:
          "16px",

        borderRadius:
          "11px",

        border:
          "1px solid var(--border-subtle)",

        background:
          "var(--bg)",

        color:
          "var(--text-primary)",

        textAlign:
          "left",

        cursor:
          "pointer",

        minHeight:
          "120px",
      }}
    >

      <div
        style={{
          width:
            "32px",

          height:
            "32px",

          borderRadius:
            "8px",

          display:
            "flex",

          alignItems:
            "center",

          justifyContent:
            "center",

          background:
            "var(--primary-glow)",
        }}
      >

        {icon}

      </div>


      <div>

        <div
          style={{
            fontWeight:
              600,

            fontSize:
              "0.82rem",
          }}
        >
          {title}
        </div>


        <div
          style={{
            marginTop:
              "4px",

            color:
              "var(--text-secondary)",

            fontSize:
              "0.7rem",

            lineHeight:
              1.45,
          }}
        >
          {description}
        </div>

      </div>

    </button>
  );
}


/* ============================================================
   EMPTY STATE
   ============================================================ */

function EmptyState({
  text,
  buttonLabel,
  onClick,
}: {
  text: string;
  buttonLabel: string;
  onClick: () => void;
}) {

  return (
    <div
      style={{
        padding:
          "22px",

        borderRadius:
          "10px",

        background:
          "var(--bg)",

        display:
          "flex",

        alignItems:
          "center",

        justifyContent:
          "space-between",

        gap:
          "20px",
      }}
    >

      <div
        style={{
          color:
            "var(--text-secondary)",

          fontSize:
            "0.82rem",

          lineHeight:
            1.5,
        }}
      >
        {text}
      </div>


      <button
        type="button"
        onClick={
          onClick
        }
        style={
          primaryButtonStyle
        }
      >
        {buttonLabel}

        <ArrowRight
          size={14}
        />
      </button>

    </div>
  );
}


/* ============================================================
   MESSAGE
   ============================================================ */

function Message({
  message,
}: {
  message: string;
}) {

  return (
    <div
      style={{
        marginBottom:
          "20px",

        padding:
          "14px 16px",

        borderRadius:
          "10px",

        border:
          "1px solid rgba(239, 68, 68, 0.25)",

        background:
          "rgba(239, 68, 68, 0.08)",

        color:
          "#fca5a5",
      }}
    >
      {message}
    </div>
  );
}


/* ============================================================
   CONSTANT STYLES
   ============================================================ */

const cardStyle:
  CSSProperties = {

    background:
      "var(--bg-card)",

    border:
      "1px solid var(--border-subtle)",

    borderRadius:
      "var(--radius-lg)",

    padding:
      "24px",
  };


const primaryButtonStyle:
  CSSProperties = {

    display:
      "flex",

    alignItems:
      "center",

    gap:
      "8px",

    border:
      "none",

    borderRadius:
      "10px",

    padding:
      "12px 16px",

    background:
      "linear-gradient(135deg, var(--primary), var(--accent))",

    color:
      "#fff",

    fontWeight:
      600,

    cursor:
      "pointer",

    whiteSpace:
      "nowrap",
  };


const secondaryButtonStyle:
  CSSProperties = {

    display:
      "flex",

    alignItems:
      "center",

    gap:
      "8px",

    border:
      "1px solid var(--border-subtle)",

    borderRadius:
      "10px",

    padding:
      "10px 14px",

    background:
      "var(--bg-card)",

    color:
      "var(--text-primary)",

    fontWeight:
      600,

    cursor:
      "pointer",

    whiteSpace:
      "nowrap",
  };