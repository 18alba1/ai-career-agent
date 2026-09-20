import {
  useEffect,
  useMemo,
  useState,
} from "react";

import type {
  CSSProperties,
  FormEvent,
  ReactNode,
} from "react";

import {
  AlertCircle,
  BarChart3,
  Briefcase,
  CheckCircle2,
  ExternalLink,
  Loader2,
  Plus,
  Search,
  X,
} from "lucide-react";

import {
  createJob,
  getJobFit,
  getJobRequirements,
  getJobs,
} from "../api/jobApi";

import {
  getCandidates,
} from "../api/candidateApi";

import type {
  Job,
  JobFit,
  JobRequirements,
} from "../types/job";

import type {
  CandidateListItem,
} from "../types/candidate";


export function Jobs() {

  // ============================================================
  // JOB STATE
  // ============================================================

  const [
    jobs,
    setJobs,
  ] = useState<Job[]>([]);


  const [
    selectedJobId,
    setSelectedJobId,
  ] = useState<number | null>(
    null,
  );


  const [
    search,
    setSearch,
  ] = useState("");


  const [
    loadingJobs,
    setLoadingJobs,
  ] = useState(true);


  // ============================================================
  // CANDIDATE STATE
  // ============================================================

  const [
    candidates,
    setCandidates,
  ] = useState<CandidateListItem[]>(
    [],
  );


  const [
    selectedCandidateId,
    setSelectedCandidateId,
  ] = useState<number | null>(
    null,
  );


  const [
    loadingCandidates,
    setLoadingCandidates,
  ] = useState(true);


  // ============================================================
  // ANALYSIS STATE
  // ============================================================

  const [
    requirements,
    setRequirements,
  ] = useState<JobRequirements | null>(
    null,
  );


  const [
    jobFit,
    setJobFit,
  ] = useState<JobFit | null>(
    null,
  );


  const [
    analyzing,
    setAnalyzing,
  ] = useState(false);


  const [
    analysisError,
    setAnalysisError,
  ] = useState("");


  // ============================================================
  // GENERAL STATE
  // ============================================================

  const [
    error,
    setError,
  ] = useState("");


  const [
    creating,
    setCreating,
  ] = useState(false);


  const [
    showAddJob,
    setShowAddJob,
  ] = useState(false);


  const [
    title,
    setTitle,
  ] = useState("");


  const [
    company,
    setCompany,
  ] = useState("");


  const [
    description,
    setDescription,
  ] = useState("");


  const [
    url,
    setUrl,
  ] = useState("");


  // ============================================================
  // LOAD JOBS
  // ============================================================

  async function loadJobs(
    selectNewest = false,
  ) {

    setLoadingJobs(true);
    setError("");

    try {

      const data =
        await getJobs();

      setJobs(data);


      if (
        data.length > 0 &&
        (
          selectNewest ||
          selectedJobId === null
        )
      ) {

        setSelectedJobId(
          data[0].id,
        );
      }

    } catch (err) {

      console.error(
        "Failed to load jobs:",
        err,
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load jobs.",
      );

    } finally {

      setLoadingJobs(false);
    }
  }


  // ============================================================
  // LOAD CANDIDATES
  // ============================================================

  async function loadCandidates() {

    setLoadingCandidates(true);

    try {

      const data =
        await getCandidates();

      setCandidates(data);


      if (
        data.length > 0 &&
        selectedCandidateId === null
      ) {

        setSelectedCandidateId(
          data[0].id,
        );
      }

    } catch (err) {

      console.error(
        "Failed to load candidates:",
        err,
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load candidates.",
      );

    } finally {

      setLoadingCandidates(false);
    }
  }


  useEffect(() => {

    void loadJobs();

    void loadCandidates();

  }, []);


  // ============================================================
  // SELECTED JOB
  // ============================================================

  const selectedJob =
    useMemo(
      () =>
        jobs.find(
          (job) =>
            job.id ===
            selectedJobId,
        ) ?? null,
      [
        jobs,
        selectedJobId,
      ],
    );


  // ============================================================
  // FILTERED JOBS
  // ============================================================

  const filteredJobs =
    useMemo(() => {

      const normalizedSearch =
        search
          .trim()
          .toLowerCase();


      if (!normalizedSearch) {
        return jobs;
      }


      return jobs.filter(
        (job) =>
          job.title
            .toLowerCase()
            .includes(
              normalizedSearch,
            ) ||
          job.company
            .toLowerCase()
            .includes(
              normalizedSearch,
            ),
      );

    }, [jobs, search]);


  // ============================================================
  // RESET ANALYSIS
  // ============================================================

  function resetAnalysis() {

    setRequirements(null);
    setJobFit(null);
    setAnalysisError("");
  }


  // ============================================================
  // SELECT JOB
  // ============================================================

  function handleSelectJob(
    jobId: number,
  ) {

    setSelectedJobId(
      jobId,
    );

    resetAnalysis();
  }


  // ============================================================
  // SELECT CANDIDATE
  // ============================================================

  function handleSelectCandidate(
    candidateId: number,
  ) {

    setSelectedCandidateId(
      candidateId,
    );

    resetAnalysis();
  }


  // ============================================================
  // ANALYZE JOB
  // ============================================================

  async function analyzeJob() {

    if (
      selectedJobId === null ||
      selectedCandidateId === null
    ) {

      setAnalysisError(
        "Select both a candidate and a job before analyzing.",
      );

      return;
    }


    setAnalyzing(true);
    setAnalysisError("");
    setRequirements(null);
    setJobFit(null);


    try {

      /*
       * Run both backend operations
       * in parallel.
       *
       * Both use your existing
       * FastAPI endpoints.
       */
      const [
        requirementsResult,
        fitResult,
      ] = await Promise.all([
        getJobRequirements(
          selectedJobId,
        ),

        getJobFit(
          selectedCandidateId,
          selectedJobId,
        ),
      ]);


      setRequirements(
        requirementsResult,
      );

      setJobFit(
        fitResult,
      );

    } catch (err) {

      console.error(
        "Job analysis failed:",
        err,
      );

      setAnalysisError(
        err instanceof Error
          ? err.message
          : "Failed to analyze job.",
      );

    } finally {

      setAnalyzing(false);
    }
  }


  // ============================================================
  // FORM HELPERS
  // ============================================================

  function resetForm() {

    setTitle("");
    setCompany("");
    setDescription("");
    setUrl("");
    setError("");
  }


  function closeAddJob() {

    if (creating) {
      return;
    }

    setShowAddJob(false);
    resetForm();
  }


  // ============================================================
  // CREATE JOB
  // ============================================================

  async function handleCreateJob(
    event: FormEvent,
  ) {

    event.preventDefault();


    const trimmedTitle =
      title.trim();

    const trimmedCompany =
      company.trim();

    const trimmedDescription =
      description.trim();

    const trimmedUrl =
      url.trim();


    if (
      !trimmedTitle ||
      !trimmedCompany ||
      !trimmedDescription
    ) {

      setError(
        "Title, company and job description are required.",
      );

      return;
    }


    setCreating(true);
    setError("");


    try {

      const newJob =
        await createJob({
          title:
            trimmedTitle,

          company:
            trimmedCompany,

          description:
            trimmedDescription,

          url:
            trimmedUrl ||
            null,
        });


      setJobs(
        (
          currentJobs,
        ) => [
          newJob,
          ...currentJobs.filter(
            (job) =>
              job.id !==
              newJob.id,
          ),
        ],
      );


      setSelectedJobId(
        newJob.id,
      );


      resetAnalysis();

      setShowAddJob(false);

      resetForm();

    } catch (err) {

      console.error(
        "Failed to create job:",
        err,
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to create job.",
      );

    } finally {

      setCreating(false);
    }
  }


  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div
      style={{
        maxWidth: "1250px",
        margin: "0 auto",
        padding: "40px",
      }}
    >

      {/* ====================================================== */}
      {/* HEADER                                                 */}
      {/* ====================================================== */}

      <div
        style={{
          display: "flex",
          justifyContent:
            "space-between",
          alignItems:
            "flex-start",
          gap: "20px",
          marginBottom: "30px",
        }}
      >

        <div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              color:
                "var(--text-secondary)",
              fontSize:
                "0.8rem",
              marginBottom:
                "8px",
            }}
          >
            <Briefcase
              size={16}
            />

            Jobs
          </div>


          <h1
            style={{
              margin: 0,
              fontSize: "2rem",
              letterSpacing:
                "-0.03em",
            }}
          >
            Job Opportunities
          </h1>


          <p
            style={{
              marginTop: "10px",
              marginBottom: 0,
              color:
                "var(--text-secondary)",
              lineHeight: 1.6,
              maxWidth: "700px",
            }}
          >
            Save jobs, understand what they
            require and see how well your
            candidate profile matches them.
          </p>

        </div>


        <button
          type="button"
          onClick={() => {

            resetForm();

            setShowAddJob(true);
          }}
          style={primaryButtonStyle}
        >

          <Plus size={17} />

          Add Job

        </button>

      </div>


      {/* ====================================================== */}
      {/* ERROR                                                  */}
      {/* ====================================================== */}

      {error && (
        <Message
          type="error"
          message={error}
        />
      )}


      {/* ====================================================== */}
      {/* JOB SEARCH                                             */}
      {/* ====================================================== */}

      <div
        style={{
          position: "relative",
          marginBottom: "20px",
        }}
      >

        <Search
          size={17}
          style={{
            position:
              "absolute",
            left: "14px",
            top: "50%",
            transform:
              "translateY(-50%)",
            color:
              "var(--text-secondary)",
          }}
        />


        <input
          type="text"
          value={search}
          onChange={(event) =>
            setSearch(
              event.target.value,
            )
          }
          placeholder="Search jobs or companies..."
          style={{
            ...inputStyle,
            paddingLeft:
              "42px",
          }}
        />

      </div>


      {/* ====================================================== */}
      {/* MAIN JOB AREA                                         */}
      {/* ====================================================== */}

      {loadingJobs ? (

        <LoadingState text="Loading jobs..." />

      ) : jobs.length === 0 ? (

        <EmptyJobs
          onAdd={() => {

            resetForm();

            setShowAddJob(true);
          }}
        />

      ) : (

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "minmax(260px, 330px) minmax(0, 1fr)",
            gap: "20px",
            alignItems:
              "start",
          }}
        >

          {/* ================================================== */}
          {/* JOB LIST                                           */}
          {/* ================================================== */}

          <div
            style={cardStyle}
          >

            <div
              style={{
                padding:
                  "16px 18px",
                borderBottom:
                  "1px solid var(--border-subtle)",
                color:
                  "var(--text-secondary)",
                fontSize:
                  "0.8rem",
              }}
            >
              {filteredJobs.length}
              {" "}
              {filteredJobs.length === 1
                ? "job"
                : "jobs"}
            </div>


            <div
              style={{
                maxHeight:
                  "650px",
                overflowY:
                  "auto",
              }}
            >

              {filteredJobs.length ===
              0 ? (

                <div
                  style={{
                    padding:
                      "24px 18px",
                    color:
                      "var(--text-secondary)",
                    fontSize:
                      "0.85rem",
                  }}
                >
                  No jobs match your search.
                </div>

              ) : (

                filteredJobs.map(
                  (job) => {

                    const isSelected =
                      job.id ===
                      selectedJobId;


                    return (
                      <button
                        key={
                          job.id
                        }
                        type="button"
                        onClick={() =>
                          handleSelectJob(
                            job.id,
                          )
                        }
                        style={{
                          width:
                            "100%",
                          textAlign:
                            "left",
                          border:
                            "none",
                          borderBottom:
                            "1px solid var(--border-subtle)",
                          background:
                            isSelected
                              ? "var(--primary-glow)"
                              : "transparent",
                          color:
                            "var(--text-primary)",
                          padding:
                            "16px 18px",
                          cursor:
                            "pointer",
                        }}
                      >

                        <div
                          style={{
                            fontWeight:
                              600,
                            fontSize:
                              "0.9rem",
                          }}
                        >
                          {job.title}
                        </div>


                        <div
                          style={{
                            marginTop:
                              "5px",
                            color:
                              "var(--text-secondary)",
                            fontSize:
                              "0.8rem",
                          }}
                        >
                          {job.company}
                        </div>


                        <div
                          style={{
                            marginTop:
                              "8px",
                            color:
                              "var(--text-muted)",
                            fontSize:
                              "0.72rem",
                          }}
                        >
                          {formatDate(
                            job.created_at,
                          )}
                        </div>

                      </button>
                    );
                  },
                )
              )}

            </div>

          </div>


          {/* ================================================== */}
          {/* SELECTED JOB                                      */}
          {/* ================================================== */}

          {selectedJob && (

            <div
              style={{
                display:
                  "flex",
                flexDirection:
                  "column",
                gap: "16px",
              }}
            >

              <JobDetails
                job={selectedJob}
              />


              {/* ============================================= */}
              {/* ANALYSIS CONTROLS                             */}
              {/* ============================================= */}

              <section
                style={cardStyle}
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

                  <div>

                    <div
                      style={{
                        display:
                          "flex",
                        alignItems:
                          "center",
                        gap:
                          "8px",
                        fontSize:
                          "0.82rem",
                        color:
                          "var(--text-secondary)",
                        marginBottom:
                          "8px",
                      }}
                    >
                      <BarChart3
                        size={17}
                      />

                      Analyze Job Fit

                    </div>


                    <h3
                      style={{
                        margin: 0,
                        fontSize:
                          "1.05rem",
                      }}
                    >
                      Compare a candidate
                      against this job
                    </h3>


                    <p
                      style={{
                        marginTop:
                          "8px",
                        marginBottom:
                          0,
                        color:
                          "var(--text-secondary)",
                        fontSize:
                          "0.83rem",
                        lineHeight:
                          1.5,
                      }}
                    >
                      Requirements are extracted
                      from the job description and
                      compared against the selected
                      candidate profile.
                    </p>

                  </div>


                  <button
                    type="button"
                    onClick={
                      analyzeJob
                    }
                    disabled={
                      analyzing ||
                      loadingCandidates ||
                      candidates.length ===
                        0 ||
                      selectedCandidateId ===
                        null
                    }
                    style={{
                      ...primaryButtonStyle,
                      opacity:
                        analyzing
                          ? 0.7
                          : 1,
                      cursor:
                        analyzing
                          ? "default"
                          : "pointer",
                      whiteSpace:
                        "nowrap",
                    }}
                  >

                    {analyzing ? (

                      <Loader2
                        size={16}
                        className="spinner"
                      />

                    ) : (

                      <BarChart3
                        size={16}
                      />

                    )}


                    {analyzing
                      ? "Analyzing..."
                      : "Analyze Job Fit"}

                  </button>

                </div>


                <div
                  style={{
                    marginTop:
                      "22px",
                  }}
                >

                  <label
                    style={{
                      display:
                        "block",
                      fontSize:
                        "0.8rem",
                      fontWeight:
                        600,
                      marginBottom:
                        "8px",
                    }}
                  >
                    Candidate
                  </label>


                  {loadingCandidates ? (

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
                          "0.83rem",
                      }}
                    >

                      <Loader2
                        size={16}
                        className="spin"
                      />

                      Loading candidates...

                    </div>

                  ) : candidates.length ===
                    0 ? (

                    <div
                      style={{
                        color:
                          "var(--text-secondary)",
                        fontSize:
                          "0.83rem",
                      }}
                    >
                      No candidates found.
                      Upload a CV first.
                    </div>

                  ) : (

                    <select
                      value={
                        selectedCandidateId ??
                        ""
                      }
                      onChange={(
                        event,
                      ) =>
                        handleSelectCandidate(
                          Number(
                            event.target
                              .value,
                          ),
                        )
                      }
                      style={{
                        ...inputStyle,
                        maxWidth:
                          "500px",
                      }}
                    >

                      {candidates.map(
                        (
                          candidate,
                        ) => (

                          <option
                            key={
                              candidate.id
                            }
                            value={
                              candidate.id
                            }
                          >
                            {
                              candidate.name
                            }
                          </option>

                        ),
                      )}

                    </select>
                  )}

                </div>


                {analysisError && (

                  <div
                    style={{
                      marginTop:
                        "18px",
                    }}
                  >
                    <Message
                      type="error"
                      message={
                        analysisError
                      }
                    />
                  </div>

                )}

              </section>


              {/* ============================================= */}
              {/* JOB FIT SCORE                                  */}
              {/* ============================================= */}

              {jobFit && (

                <JobFitCard
                  jobFit={jobFit}
                />

              )}


              {/* ============================================= */}
              {/* REQUIREMENTS                                   */}
              {/* ============================================= */}

              {requirements && (

                <RequirementsCard
                  requirements={
                    requirements
                  }
                />

              )}

            </div>
          )}

        </div>
      )}


      {/* ====================================================== */}
      {/* ADD JOB MODAL                                          */}
      {/* ====================================================== */}

      {showAddJob && (

        <AddJobModal
          title={title}
          company={company}
          description={
            description
          }
          url={url}
          creating={creating}
          onTitleChange={
            setTitle
          }
          onCompanyChange={
            setCompany
          }
          onDescriptionChange={
            setDescription
          }
          onUrlChange={
            setUrl
          }
          onClose={
            closeAddJob
          }
          onSubmit={
            handleCreateJob
          }
        />

      )}

    </div>
  );
}


/* ============================================================
   JOB DETAILS
   ============================================================ */

function JobDetails({
  job,
}: {
  job: Job;
}) {

  return (
    <section
      style={cardStyle}
    >

      <div
        style={{
          display:
            "flex",
          alignItems:
            "flex-start",
          justifyContent:
            "space-between",
          gap:
            "20px",
          marginBottom:
            "24px",
        }}
      >

        <div>

          <div
            style={{
              fontSize:
                "0.78rem",
              color:
                "var(--text-secondary)",
              marginBottom:
                "8px",
            }}
          >
            {job.company}
          </div>


          <h2
            style={{
              margin: 0,
              fontSize:
                "1.5rem",
              letterSpacing:
                "-0.02em",
            }}
          >
            {job.title}
          </h2>


          <div
            style={{
              marginTop:
                "8px",
              color:
                "var(--text-muted)",
              fontSize:
                "0.75rem",
            }}
          >
            Added{" "}
            {formatDate(
              job.created_at,
            )}
          </div>

        </div>


        {job.url && (

          <a
            href={job.url}
            target="_blank"
            rel="noreferrer"
            style={{
              display:
                "inline-flex",
              alignItems:
                "center",
              gap:
                "6px",
              color:
                "var(--text-primary)",
              fontSize:
                "0.8rem",
              fontWeight:
                600,
              textDecoration:
                "none",
              whiteSpace:
                "nowrap",
            }}
          >
            Open job

            <ExternalLink
              size={14}
            />
          </a>

        )}

      </div>


      <div
        style={{
          paddingTop:
            "20px",
          borderTop:
            "1px solid var(--border-subtle)",
        }}
      >

        <div
          style={{
            fontSize:
              "0.8rem",
            fontWeight:
              600,
            marginBottom:
              "12px",
            color:
              "var(--text-secondary)",
          }}
        >
          Job Description
        </div>


        <div
          style={{
            whiteSpace:
              "pre-wrap",
            color:
              "var(--text-secondary)",
            lineHeight:
              1.7,
            fontSize:
              "0.86rem",
          }}
        >
          {job.description}
        </div>

      </div>

    </section>
  );
}


/* ============================================================
   JOB FIT CARD
   ============================================================ */

function JobFitCard({
  jobFit,
}: {
  jobFit: JobFit;
}) {

  return (
    <section
      style={cardStyle}
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
            "24px",
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
            <BarChart3
              size={16}
            />

            Job Fit
          </div>


          <h3
            style={{
              margin: 0,
              fontSize:
                "1.1rem",
            }}
          >
            Candidate Match
          </h3>

        </div>


        <div
          style={{
            fontSize:
              "2rem",
            fontWeight:
              700,
            letterSpacing:
              "-0.04em",
          }}
        >
          {jobFit.overall_score.toFixed(
            1,
          )}

          <span
            style={{
              fontSize:
                "0.9rem",
              color:
                "var(--text-secondary)",
              fontWeight:
                500,
              marginLeft:
                "3px",
            }}
          >
            /100
          </span>
        </div>

      </div>


      <div
        style={{
          display:
            "grid",
          gridTemplateColumns:
            "repeat(2, minmax(0, 1fr))",
          gap:
            "14px",
          marginBottom:
            "28px",
        }}
      >

        <ScoreBar
          label="Technical"
          score={
            jobFit.category_scores
              .technical
          }
        />

        <ScoreBar
          label="Soft Skills"
          score={
            jobFit.category_scores
              .soft
          }
        />

        <ScoreBar
          label="Experience"
          score={
            jobFit.category_scores
              .experience
          }
        />

        <ScoreBar
          label="Education"
          score={
            jobFit.category_scores
              .education
          }
        />

        <ScoreBar
          label="Languages"
          score={
            jobFit.category_scores
              .languages
          }
        />

      </div>


      <div
        style={{
          paddingTop:
            "22px",
          borderTop:
            "1px solid var(--border-subtle)",
        }}
      >

        <h4
          style={{
            margin:
              "0 0 16px",
            fontSize:
              "0.95rem",
          }}
        >
          Requirement Matches
        </h4>


        <div
          style={{
            display:
              "flex",
            flexDirection:
              "column",
            gap:
              "10px",
          }}
        >

          {jobFit.requirement_matches.map(
            (
              match,
              index,
            ) => (

              <RequirementMatch
                key={`${match.requirement}-${index}`}
                match={
                  match
                }
              />

            ),
          )}

        </div>

      </div>

    </section>
  );
}


/* ============================================================
   SCORE BAR
   ============================================================ */

function ScoreBar({
  label,
  score,
}: {
  label: string;
  score: number;
}) {

  const percentage =
    Math.max(
      0,
      Math.min(
        100,
        score,
      ),
    );


  return (
    <div>

      <div
        style={{
          display:
            "flex",
          justifyContent:
            "space-between",
          marginBottom:
            "7px",
          fontSize:
            "0.78rem",
        }}
      >

        <span
          style={{
            color:
              "var(--text-secondary)",
          }}
        >
          {label}
        </span>


        <span
          style={{
            fontWeight:
              600,
          }}
        >
          {score.toFixed(
            1,
          )}
        </span>

      </div>


      <div
        style={{
          width:
            "100%",
          height:
            "7px",
          borderRadius:
            "999px",
          background:
            "var(--bg)",
          overflow:
            "hidden",
        }}
      >

        <div
          style={{
            width:
              `${percentage}%`,
            height:
              "100%",
            borderRadius:
              "999px",
            background:
              "linear-gradient(90deg, var(--primary), var(--accent))",
            transition:
              "width 0.6s ease",
          }}
        />

      </div>

    </div>
  );
}


/* ============================================================
   REQUIREMENT MATCH
   ============================================================ */

function RequirementMatch({
  match,
}: {
  match: JobFit["requirement_matches"][number];
}) {

  const isStrong =
    match.status === "strong";


  return (
    <div
      style={{
        display:
          "grid",
        gridTemplateColumns:
          "1fr auto",
        gap:
          "14px",
        padding:
          "14px",
        borderRadius:
          "10px",
        border:
          "1px solid var(--border-subtle)",
        background:
          "var(--bg)",
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
          }}
        >

          {isStrong ? (

            <CheckCircle2
              size={16}
              color="#34d399"
            />

          ) : (

            <AlertCircle
              size={16}
              color="#f59e0b"
            />

          )}


          <span
            style={{
              fontWeight:
                600,
              fontSize:
                "0.83rem",
            }}
          >
            {match.requirement}
          </span>

        </div>


        {match.evidence && (

          <div
            style={{
              marginTop:
                "7px",
              paddingLeft:
                "24px",
              color:
                "var(--text-secondary)",
              fontSize:
                "0.75rem",
              lineHeight:
                1.5,
            }}
          >
            Evidence:{" "}
            {match.evidence}
          </div>

        )}

      </div>


      <div
        style={{
          textAlign:
            "right",
          whiteSpace:
            "nowrap",
        }}
      >

        <div
          style={{
            fontSize:
              "0.75rem",
            fontWeight:
              600,
          }}
        >
          {formatStatus(
            match.status,
          )}
        </div>


        <div
          style={{
            marginTop:
              "4px",
            fontSize:
              "0.7rem",
            color:
              "var(--text-muted)",
          }}
        >
          {(
            match.similarity *
            100
          ).toFixed(0)}
          % similarity
        </div>

      </div>

    </div>
  );
}


/* ============================================================
   REQUIREMENTS CARD
   ============================================================ */

function RequirementsCard({
  requirements,
}: {
  requirements: JobRequirements;
}) {

  return (
    <section
      style={cardStyle}
    >

      <div
        style={{
          display:
            "flex",
          alignItems:
            "center",
          gap:
            "9px",
          marginBottom:
            "20px",
        }}
      >

        <div
          style={{
            width:
              "34px",
            height:
              "34px",
            borderRadius:
              "9px",
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
          <Briefcase
            size={17}
          />
        </div>


        <div>

          <h3
            style={{
              margin: 0,
              fontSize:
                "1rem",
            }}
          >
            Job Requirements
          </h3>


          <div
            style={{
              marginTop:
                "3px",
              color:
                "var(--text-secondary)",
              fontSize:
                "0.75rem",
            }}
          >
            Extracted from the job description
          </div>

        </div>

      </div>


      <div
        style={{
          display:
            "grid",
          gridTemplateColumns:
            "repeat(2, minmax(0, 1fr))",
          gap:
            "14px",
        }}
      >

        <RequirementGroup
          title="Technical Skills"
          requirements={
            requirements.technical_skills
          }
        />

        <RequirementGroup
          title="Soft Skills"
          requirements={
            requirements.soft_skills
          }
        />

        <RequirementGroup
          title="Experience"
          requirements={
            requirements.experience_requirements
          }
        />

        <RequirementGroup
          title="Education"
          requirements={
            requirements.education_requirements
          }
        />

        <RequirementGroup
          title="Languages"
          requirements={
            requirements.languages
          }
        />

      </div>

    </section>
  );
}


/* ============================================================
   REQUIREMENT GROUP
   ============================================================ */

function RequirementGroup({
  title,
  requirements,
}: {
  title: string;
  requirements: {
    name: string;
    importance:
      | "required"
      | "preferred";
  }[];
}) {

  return (
    <div
      style={{
        padding:
          "16px",
        borderRadius:
          "11px",
        border:
          "1px solid var(--border-subtle)",
        background:
          "var(--bg)",
      }}
    >

      <div
        style={{
          fontSize:
            "0.8rem",
          fontWeight:
            600,
          marginBottom:
            "12px",
        }}
      >
        {title}
      </div>


      {requirements.length ===
      0 ? (

        <div
          style={{
            fontSize:
              "0.75rem",
            color:
              "var(--text-muted)",
          }}
        >
          No requirements found.
        </div>

      ) : (

        <div
          style={{
            display:
              "flex",
            flexDirection:
              "column",
            gap:
              "8px",
          }}
        >

          {requirements.map(
            (
              requirement,
            ) => (

              <div
                key={
                  requirement.name
                }
                style={{
                  display:
                    "flex",
                  alignItems:
                    "flex-start",
                  gap:
                    "8px",
                  fontSize:
                    "0.78rem",
                }}
              >

                <span
                  style={{
                    width:
                      "6px",
                    height:
                      "6px",
                    borderRadius:
                      "50%",
                    marginTop:
                      "6px",
                    background:
                      requirement.importance ===
                      "required"
                        ? "#f87171"
                        : "#f59e0b",
                    flexShrink: 0,
                  }}
                />


                <span
                  style={{
                    lineHeight:
                      1.4,
                  }}
                >
                  {requirement.name}

                  <span
                    style={{
                      marginLeft:
                        "6px",
                      color:
                        "var(--text-muted)",
                      fontSize:
                        "0.68rem",
                    }}
                  >
                    {requirement.importance}
                  </span>

                </span>

              </div>

            ),
          )}

        </div>
      )}

    </div>
  );
}


/* ============================================================
   ADD JOB MODAL
   ============================================================ */

function AddJobModal({
  title,
  company,
  description,
  url,
  creating,
  onTitleChange,
  onCompanyChange,
  onDescriptionChange,
  onUrlChange,
  onClose,
  onSubmit,
}: {
  title: string;
  company: string;
  description: string;
  url: string;
  creating: boolean;
  onTitleChange: (
    value: string,
  ) => void;
  onCompanyChange: (
    value: string,
  ) => void;
  onDescriptionChange: (
    value: string,
  ) => void;
  onUrlChange: (
    value: string,
  ) => void;
  onClose: () => void;
  onSubmit: (
    event: FormEvent,
  ) => void;
}) {

  return (
    <div
      style={{
        position:
          "fixed",
        inset: 0,
        zIndex: 100,
        background:
          "rgba(0, 0, 0, 0.65)",
        display:
          "flex",
        alignItems:
          "center",
        justifyContent:
          "center",
        padding:
          "20px",
      }}
    >

      <div
        style={{
          width:
            "100%",
          maxWidth:
            "700px",
          maxHeight:
            "calc(100vh - 40px)",
          overflowY:
            "auto",
          background:
            "var(--bg-card)",
          border:
            "1px solid var(--border-subtle)",
          borderRadius:
            "var(--radius-xl)",
          padding:
            "28px",
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
            marginBottom:
              "24px",
          }}
        >

          <div>

            <h2
              style={{
                margin: 0,
                fontSize:
                  "1.3rem",
              }}
            >
              Add Job
            </h2>


            <p
              style={{
                marginTop:
                  "6px",
                marginBottom:
                  0,
                color:
                  "var(--text-secondary)",
                fontSize:
                  "0.82rem",
              }}
            >
              Save a job for
              requirements analysis,
              job fit and application
              preparation.
            </p>

          </div>


          <button
            type="button"
            onClick={
              onClose
            }
            disabled={
              creating
            }
            style={{
              width:
                "34px",
              height:
                "34px",
              borderRadius:
                "8px",
              border:
                "1px solid var(--border-subtle)",
              background:
                "transparent",
              color:
                "var(--text-secondary)",
              cursor:
                "pointer",
              display:
                "flex",
              alignItems:
                "center",
              justifyContent:
                "center",
            }}
          >
            <X
              size={17}
            />
          </button>

        </div>


        <form
          onSubmit={
            onSubmit
          }
        >

          <FormField
            label="Job title"
            required
          >

            <input
              value={
                title
              }
              onChange={(
                event,
              ) =>
                onTitleChange(
                  event.target
                    .value,
                )
              }
              placeholder="e.g. AI Engineer"
              style={
                inputStyle
              }
            />

          </FormField>


          <div
            style={{
              marginTop:
                "18px",
            }}
          >

            <FormField
              label="Company"
              required
            >

              <input
                value={
                  company
                }
                onChange={(
                  event,
                ) =>
                  onCompanyChange(
                    event.target
                      .value,
                  )
                }
                placeholder="e.g. Hedvig"
                style={
                  inputStyle
                }
              />

            </FormField>

          </div>


          <div
            style={{
              marginTop:
                "18px",
            }}
          >

            <FormField
              label="Job URL"
            >

              <input
                type="url"
                value={
                  url
                }
                onChange={(
                  event,
                ) =>
                  onUrlChange(
                    event.target
                      .value,
                  )
                }
                placeholder="https://..."
                style={
                  inputStyle
                }
              />

            </FormField>

          </div>


          <div
            style={{
              marginTop:
                "18px",
            }}
          >

            <FormField
              label="Job description"
              required
            >

              <textarea
                value={
                  description
                }
                onChange={(
                  event,
                ) =>
                  onDescriptionChange(
                    event.target
                      .value,
                  )
                }
                placeholder="Paste the complete job description here..."
                rows={12}
                style={{
                  ...inputStyle,
                  resize:
                    "vertical",
                  lineHeight:
                    1.5,
                }}
              />

            </FormField>

          </div>


          <div
            style={{
              display:
                "flex",
              justifyContent:
                "flex-end",
              gap:
                "10px",
              marginTop:
                "22px",
            }}
          >

            <button
              type="button"
              onClick={
                onClose
              }
              disabled={
                creating
              }
              style={{
                padding:
                  "11px 16px",
                borderRadius:
                  "9px",
                border:
                  "1px solid var(--border-subtle)",
                background:
                  "transparent",
                color:
                  "var(--text-primary)",
                cursor:
                  "pointer",
              }}
            >
              Cancel
            </button>


            <button
              type="submit"
              disabled={
                creating
              }
              style={{
                ...primaryButtonStyle,
                opacity:
                  creating
                    ? 0.7
                    : 1,
              }}
            >

              {creating ? (

                <Loader2
                  size={16}
                  className="spin"
                />

              ) : (

                <Plus
                  size={16}
                />

              )}

              {creating
                ? "Saving..."
                : "Save Job"}

            </button>

          </div>

        </form>

      </div>

    </div>
  );
}


/* ============================================================
   EMPTY JOBS
   ============================================================ */

function EmptyJobs({
  onAdd,
}: {
  onAdd: () => void;
}) {

  return (
    <div
      style={{
        minHeight:
          "360px",
        display:
          "flex",
        alignItems:
          "center",
        justifyContent:
          "center",
        ...cardStyle,
        borderStyle:
          "dashed",
      }}
    >

      <div
        style={{
          textAlign:
            "center",
          maxWidth:
            "450px",
        }}
      >

        <Briefcase
          size={28}
        />


        <h3>
          No jobs yet
        </h3>


        <p
          style={{
            color:
              "var(--text-secondary)",
            lineHeight:
              1.6,
          }}
        >
          Add a job description to start
          analyzing requirements and job fit.
        </p>


        <button
          type="button"
          onClick={
            onAdd
          }
          style={
            primaryButtonStyle
          }
        >
          <Plus
            size={16}
          />

          Add Job

        </button>

      </div>

    </div>
  );
}


/* ============================================================
   MESSAGE
   ============================================================ */

function Message({
  type,
  message,
}: {
  type: "error";
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
          type === "error"
            ? "1px solid rgba(239, 68, 68, 0.25)"
            : "1px solid var(--border-subtle)",
        background:
          type === "error"
            ? "rgba(239, 68, 68, 0.08)"
            : "var(--bg-card)",
        color:
          type === "error"
            ? "#fca5a5"
            : "var(--text-primary)",
      }}
    >
      {message}
    </div>
  );
}


/* ============================================================
   LOADING
   ============================================================ */

function LoadingState({
  text,
}: {
  text: string;
}) {

  return (
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
        gap:
          "10px",
        color:
          "var(--text-secondary)",
      }}
    >

      <Loader2
        size={20}
        className="spin"
      />

      {text}

    </div>
  );
}


/* ============================================================
   FORM FIELD
   ============================================================ */

function FormField({
  label,
  required = false,
  children,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
}) {

  return (
    <label
      style={{
        display:
          "block",
      }}
    >

      <span
        style={{
          display:
            "block",
          marginBottom:
            "7px",
          fontSize:
            "0.82rem",
          fontWeight:
            600,
        }}
      >
        {label}

        {required && (
          <span
            style={{
              color:
                "#f87171",
            }}
          >
            {" "}*
          </span>
        )}
      </span>


      {children}

    </label>
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


const inputStyle:
  CSSProperties = {

    width:
      "100%",

    boxSizing:
      "border-box",

    padding:
      "11px 13px",

    borderRadius:
      "9px",

    border:
      "1px solid var(--border-subtle)",

    background:
      "var(--bg)",

    color:
      "var(--text-primary)",

    fontSize:
      "0.88rem",

    outline:
      "none",
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
  };


/* ============================================================
   HELPERS
   ============================================================ */

function formatDate(
  value: string,
): string {

  const date =
    new Date(value);


  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {

    return value;
  }


  return date.toLocaleDateString(
    "en-SE",
    {
      year: "numeric",
      month: "short",
      day: "numeric",
    },
  );
}


function formatStatus(
  status: string,
): string {

  return status
    .charAt(0)
    .toUpperCase() +
    status.slice(1);
}