import {
  useEffect,
  useMemo,
  useState,
} from "react";

import type {
  CSSProperties,
  ReactNode,
} from "react";

import {
  Briefcase,
  Check,
  Copy,
  Download,
  FileText,
  Loader2,
  Mail,
  UserRound,
} from "lucide-react";

import {
  getCandidates,
} from "../api/candidateApi";

import {
  getJobs,
} from "../api/jobApi";

import {
  generateCoverLetter,
  getTailoredCV,
} from "../api/applicationApi";

import type {
  CandidateListItem,
} from "../types/candidate";

import type {
  Job,
} from "../types/job";

import type {
  CoverLetter,
  TailoredCV,
} from "../api/applicationApi";

import {
  pdf,
} from "@react-pdf/renderer";

import {
  CVPdfDocument,
  CoverLetterPdfDocument,
} from "./DocumentPdf";

export function ApplicationDocuments() {

  // ============================================================
  // DATA STATE
  // ============================================================

  const [
    candidates,
    setCandidates,
  ] = useState<CandidateListItem[]>([]);


  const [
    jobs,
    setJobs,
  ] = useState<Job[]>([]);


  const [
    selectedCandidateId,
    setSelectedCandidateId,
  ] = useState<number | null>(null);


  const [
    selectedJobId,
    setSelectedJobId,
  ] = useState<number | null>(null);


  // ============================================================
  // DOCUMENT STATE
  // ============================================================

  const [
    tailoredCV,
    setTailoredCV,
  ] = useState<TailoredCV | null>(null);


  const [
    coverLetter,
    setCoverLetter,
  ] = useState<CoverLetter | null>(null);


  const [
    activeDocument,
    setActiveDocument,
  ] = useState<
    "cv" | "cover-letter"
  >("cv");


  const [
    copiedDocument,
    setCopiedDocument,
  ] = useState<
    "cv" | "cover-letter" | null
  >(null);


  // ============================================================
  // LOADING STATE
  // ============================================================

  const [
    loadingData,
    setLoadingData,
  ] = useState(true);


  const [
    tailoringCV,
    setTailoringCV,
  ] = useState(false);


  const [
    generatingCoverLetter,
    setGeneratingCoverLetter,
  ] = useState(false);


  // ============================================================
  // ERROR STATE
  // ============================================================

  const [
    error,
    setError,
  ] = useState("");


  // ============================================================
  // LOAD DATA
  // ============================================================

  async function loadData() {

    setLoadingData(true);
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


      if (
        candidateData.length > 0
      ) {

        const latestCandidate =
          candidateData.reduce(
            (
              latest,
              candidate,
            ) =>
              candidate.id >
              latest.id
                ? candidate
                : latest,
          );


        setSelectedCandidateId(
          latestCandidate.id,
        );
      }


      if (
        jobData.length > 0
      ) {

        setSelectedJobId(
          jobData[0].id,
        );
      }

    } catch (err) {

      console.error(
        "Failed to load application data:",
        err,
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load candidates and jobs.",
      );

    } finally {

      setLoadingData(false);
    }
  }


  useEffect(() => {

    void loadData();

  }, []);


  // ============================================================
  // SELECTED DATA
  // ============================================================

  const selectedCandidate =
    useMemo(
      () =>
        candidates.find(
          (candidate) =>
            candidate.id ===
            selectedCandidateId,
        ) ?? null,
      [
        candidates,
        selectedCandidateId,
      ],
    );


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
  // RESET GENERATED DOCUMENTS
  // ============================================================

  function resetDocuments() {

    setTailoredCV(null);
    setCoverLetter(null);
    setCopiedDocument(null);
    setError("");
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

    resetDocuments();
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

    resetDocuments();
  }


  // ============================================================
  // TAILOR CV
  // ============================================================

  async function handleTailorCV() {

    if (
      selectedCandidateId === null ||
      selectedJobId === null
    ) {

      setError(
        "Select both a candidate and a job before tailoring the CV.",
      );

      return;
    }


    setTailoringCV(true);
    setError("");
    setCopiedDocument(null);


    try {

      const result =
        await getTailoredCV(
          selectedCandidateId,
          selectedJobId,
        );


      setTailoredCV(
        result,
      );

      setActiveDocument(
        "cv",
      );

    } catch (err) {

      console.error(
        "Failed to tailor CV:",
        err,
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to tailor CV.",
      );

    } finally {

      setTailoringCV(false);
    }
  }


  // ============================================================
  // GENERATE COVER LETTER
  // ============================================================

  async function handleGenerateCoverLetter() {

    if (
      selectedCandidateId === null ||
      selectedJobId === null
    ) {

      setError(
        "Select both a candidate and a job before generating a cover letter.",
      );

      return;
    }


    setGeneratingCoverLetter(
      true,
    );

    setError("");
    setCopiedDocument(null);


    try {

      const result =
        await generateCoverLetter(
          selectedCandidateId,
          selectedJobId,
        );


      setCoverLetter(
        result,
      );

      setActiveDocument(
        "cover-letter",
      );

    } catch (err) {

      console.error(
        "Failed to generate cover letter:",
        err,
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to generate cover letter.",
      );

    } finally {

      setGeneratingCoverLetter(
        false,
      );
    }
  }


  // ============================================================
  // DOCUMENT FORMATTING
  // ============================================================

  function formatValueForDownload(
    value: unknown,
    level = 0,
  ): string {

    const indent =
      "  ".repeat(level);


    if (
      value === null ||
      value === undefined
    ) {
      return "";
    }


    if (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean"
    ) {

      return String(
        value,
      );
    }


    if (
      Array.isArray(
        value,
      )
    ) {

      if (
        value.length === 0
      ) {
        return "";
      }


      return value
        .map(
          (
            item,
          ) => {

            const formatted =
              formatValueForDownload(
                item,
                level + 1,
              );


            if (
              typeof item ===
                "string" ||
              typeof item ===
                "number"
            ) {

              return `${indent}- ${formatted}`;
            }


            return formatted;
          },
        )
        .filter(
          Boolean,
        )
        .join(
          "\n",
        );
    }


    if (
      typeof value ===
      "object"
    ) {

      return Object.entries(
        value as Record<
          string,
          unknown
        >,
      )
        .map(
          (
            [
              key,
              nestedValue,
            ],
          ) => {

            const formatted =
              formatValueForDownload(
                nestedValue,
                level + 1,
              );


            if (!formatted) {
              return "";
            }


            return `${indent}${formatKey(
              key,
            )}\n${formatted}`;
          },
        )
        .filter(
          Boolean,
        )
        .join(
          "\n\n",
        );
    }


    return "";
  }


  function getCVDownloadText(): string {

    if (!tailoredCV) {
      return "";
    }


    return formatValueForDownload(
      unwrapTailoredCV(
        tailoredCV,
      ),
    );
  }


  function getCoverLetterDownloadText(): string {

    if (!coverLetter) {
      return "";
    }


    const sections = [
      coverLetter.subject
        ? `Subject: ${coverLetter.subject}`
        : "",

      coverLetter.greeting,

      coverLetter.body,

      coverLetter.closing,
    ].filter(
      Boolean,
    );


    return sections.join(
      "\n\n",
    );
  }


  // ============================================================
  // COPY DOCUMENT
  // ============================================================

  async function copyDocument(
    type:
      | "cv"
      | "cover-letter",
  ) {

    const text =
      type === "cv"
        ? getCVDownloadText()
        : getCoverLetterDownloadText();


    if (!text) {
      return;
    }


    try {

      await navigator.clipboard.writeText(
        text,
      );


      setCopiedDocument(
        type,
      );


      window.setTimeout(
        () =>
          setCopiedDocument(
            null,
          ),
        2000,
      );

    } catch (err) {

      console.error(
        "Failed to copy document:",
        err,
      );

      setError(
        "Failed to copy the document.",
      );
    }
  }


  // ============================================================
  // DOWNLOAD DOCUMENT
  // ============================================================
  async function downloadDocument(
  type:
    | "cv"
    | "cover-letter",
) {

  if (
    type === "cv" &&
    !tailoredCV
  ) {
    return;
  }


  if (
    type === "cover-letter" &&
    !coverLetter
  ) {
    return;
  }


  try {

    const pdfDocument =
      type === "cv"
        ? (
            <CVPdfDocument
              candidateName={
                selectedCandidate?.name
              }
              jobTitle={
                selectedJob?.title
              }
              company={
                selectedJob?.company
              }
              tailoredCV={
                tailoredCV!
              }
            />
          )
        : (
            <CoverLetterPdfDocument
              candidateName={
                selectedCandidate?.name
              }
              jobTitle={
                selectedJob?.title
              }
              company={
                selectedJob?.company
              }
              coverLetter={
                coverLetter!
              }
            />
          );


    const blob =
      await pdf(
        pdfDocument,
      ).toBlob();


    const url =
      URL.createObjectURL(
        blob,
      );


    const link =
      window.document.createElement(
        "a",
      );


    link.href =
      url;


    link.download =
      type === "cv"
        ? "tailored-cv.pdf"
        : "cover-letter.pdf";


    window.document.body.appendChild(
      link,
    );


    link.click();


    link.remove();


    URL.revokeObjectURL(
      url,
    );

  } catch (err) {

    console.error(
      "Failed to generate PDF:",
      err,
    );

    setError(
      "Failed to generate the PDF.",
    );
  }
}


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
          display:
            "flex",

          justifyContent:
            "space-between",

          alignItems:
            "flex-start",

          gap:
            "20px",

          marginBottom:
            "30px",
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
                "8px",
            }}
          >

            <FileText
              size={16}
            />

            Application Materials

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
            CV & Cover Letter
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
            Tailor your CV and generate a
            job-specific cover letter using
            your candidate profile and the
            selected job.
          </p>

        </div>

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

      {loadingData ? (

        <LoadingState
          text="Loading candidates and jobs..."
        />

      ) : (

        <>
          {/* ================================================== */}
          {/* SELECTION AREA                                     */}
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
                  Application Setup
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
                  Choose the candidate and job
                  you want to prepare an application for.
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
                  "18px",
              }}
            >

              {/* ============================================ */}
              {/* CANDIDATE                                     */}
              {/* ============================================ */}

              <div>

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
                  htmlFor="application-candidate"
                >
                  Candidate
                </label>


                {candidates.length ===
                0 ? (

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
                        "0.82rem",
                    }}
                  >

                    <UserRound
                      size={16}
                    />

                    No candidate profile found.

                  </div>

                ) : (

                  <select
                    id="application-candidate"
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
                    style={
                      inputStyle
                    }
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


              {/* ============================================ */}
              {/* JOB                                           */}
              {/* ============================================ */}

              <div>

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
                  htmlFor="application-job"
                >
                  Job
                </label>


                {jobs.length ===
                0 ? (

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
                        "0.82rem",
                    }}
                  >

                    <Briefcase
                      size={16}
                    />

                    No saved jobs found.

                  </div>

                ) : (

                  <select
                    id="application-job"
                    value={
                      selectedJobId ??
                      ""
                    }
                    onChange={(
                      event,
                    ) =>
                      handleSelectJob(
                        Number(
                          event.target
                            .value,
                        ),
                      )
                    }
                    style={
                      inputStyle
                    }
                  >

                    {jobs.map(
                      (
                        job,
                      ) => (

                        <option
                          key={
                            job.id
                          }
                          value={
                            job.id
                          }
                        >
                          {job.title}
                          {" — "}
                          {job.company}
                        </option>

                      ),
                    )}

                  </select>

                )}

              </div>

            </div>


            {/* ============================================== */}
            {/* SELECTED CONTEXT                               */}
            {/* ============================================== */}

            {selectedCandidate &&
              selectedJob && (

                <div
                  style={{
                    display:
                      "grid",

                    gridTemplateColumns:
                      "repeat(2, minmax(0, 1fr))",

                    gap:
                      "14px",

                    marginTop:
                      "20px",

                    paddingTop:
                      "20px",

                    borderTop:
                      "1px solid var(--border-subtle)",
                  }}
                >

                  <ContextItem
                    label="Candidate"
                    value={
                      selectedCandidate.name
                    }
                  />

                  <ContextItem
                    label="Target Role"
                    value={
                      `${selectedJob.title} · ${selectedJob.company}`
                    }
                  />

                </div>

              )}

          </section>


          {/* ================================================== */}
          {/* ACTIONS                                            */}
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

                    color:
                      "var(--text-secondary)",

                    fontSize:
                      "0.8rem",

                    marginBottom:
                      "8px",
                  }}
                >

                  <FileText
                    size={16}
                  />

                  Prepare Application

                </div>


                <h3
                  style={{
                    margin: 0,

                    fontSize:
                      "1.05rem",
                  }}
                >
                  Generate tailored materials
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
                  Use the selected candidate
                  profile and job description
                  to create application-ready
                  material.
                </p>

              </div>


              <div
                style={{
                  display:
                    "flex",

                  gap:
                    "10px",

                  flexShrink:
                    0,
                }}
              >

                <button
                  type="button"
                  onClick={
                    handleTailorCV
                  }
                  disabled={
                    selectedCandidateId ===
                      null ||
                    selectedJobId ===
                      null ||
                    tailoringCV ||
                    generatingCoverLetter
                  }
                  style={{
                    ...primaryButtonStyle,

                    opacity:
                      tailoringCV ||
                      selectedCandidateId ===
                        null ||
                      selectedJobId ===
                        null
                        ? 0.7
                        : 1,
                  }}
                >

                  {tailoringCV ? (

                    <Loader2
                      size={16}
                      className="spinner"
                    />

                  ) : (

                    <FileText
                      size={16}
                    />

                  )}


                  {tailoringCV
                    ? "Tailoring..."
                    : "Tailor CV"}

                </button>


                <button
                  type="button"
                  onClick={
                    handleGenerateCoverLetter
                  }
                  disabled={
                    selectedCandidateId ===
                      null ||
                    selectedJobId ===
                      null ||
                    generatingCoverLetter ||
                    tailoringCV
                  }
                  style={{
                    ...secondaryButtonStyle,

                    opacity:
                      generatingCoverLetter ||
                      selectedCandidateId ===
                        null ||
                      selectedJobId ===
                        null
                        ? 0.7
                        : 1,
                  }}
                >

                  {generatingCoverLetter ? (

                    <Loader2
                      size={16}
                      className="spinner"
                    />

                  ) : (

                    <Mail
                      size={16}
                    />

                  )}


                  {generatingCoverLetter
                    ? "Generating..."
                    : "Generate Cover Letter"}

                </button>

              </div>

            </div>

          </section>


          {/* ================================================== */}
          {/* DOCUMENT TABS                                     */}
          {/* ================================================== */}

          <div
            style={{
              display:
                "flex",

              gap:
                "4px",

              padding:
                "4px",

              width:
                "fit-content",

              borderRadius:
                "10px",

              background:
                "var(--bg)",
            }}
          >

            <DocumentTab
              active={
                activeDocument === "cv"
              }
              label="Tailored CV"
              icon={
                <FileText
                  size={15}
                />
              }
              onClick={() =>
                setActiveDocument(
                  "cv",
                )
              }
            />


            <DocumentTab
              active={
                activeDocument ===
                "cover-letter"
              }
              label="Cover Letter"
              icon={
                <Mail
                  size={15}
                />
              }
              onClick={() =>
                setActiveDocument(
                  "cover-letter",
                )
              }
            />

          </div>


          {/* ================================================== */}
          {/* TAILORED CV                                       */}
          {/* ================================================== */}

          {activeDocument === "cv" && (

            <section
              style={{
                ...cardStyle,

                marginTop:
                  "16px",
              }}
            >

              <DocumentHeader
                icon={
                  <FileText
                    size={17}
                  />
                }
                title="Tailored CV"
                subtitle={
                  selectedJob
                    ? `Tailored for ${selectedJob.title} at ${selectedJob.company}`
                    : "Job-specific CV"
                }
              />


              {tailoredCV &&
                !tailoringCV && (

                  <DocumentActions
                    copyLabel={
                      copiedDocument ===
                      "cv"
                        ? "Copied"
                        : "Copy"
                    }
                    onCopy={() =>
                      void copyDocument(
                        "cv",
                      )
                    }
                    onDownload={() =>
                      downloadDocument(
                        "cv",
                      )
                    }
                    copied={
                      copiedDocument ===
                      "cv"
                    }
                  />

                )}


              {tailoringCV ? (

                <LoadingState
                  text="Analyzing the job and tailoring your CV..."
                />

              ) : tailoredCV ? (

                <div
                  style={{
                    marginTop:
                      "24px",
                  }}
                >

                  <StructuredDocument
                    value={
                      unwrapTailoredCV(
                        tailoredCV,
                      )
                    }
                  />

                </div>

              ) : (

                <EmptyDocument
                  icon={
                    <FileText
                      size={27}
                    />
                  }
                  title="No tailored CV yet"
                  description="Select a candidate and job, then click Tailor CV to generate a job-specific version of your profile."
                />

              )}

            </section>

          )}


          {/* ================================================== */}
          {/* COVER LETTER                                       */}
          {/* ================================================== */}

          {activeDocument ===
            "cover-letter" && (

            <section
              style={{
                ...cardStyle,

                marginTop:
                  "16px",
              }}
            >

              <DocumentHeader
                icon={
                  <Mail
                    size={17}
                  />
                }
                title="Cover Letter"
                subtitle={
                  selectedJob
                    ? `Generated for ${selectedJob.title} at ${selectedJob.company}`
                    : "Job-specific cover letter"
                }
              />


              {coverLetter &&
                !generatingCoverLetter && (

                  <DocumentActions
                    copyLabel={
                      copiedDocument ===
                      "cover-letter"
                        ? "Copied"
                        : "Copy"
                    }
                    onCopy={() =>
                      void copyDocument(
                        "cover-letter",
                      )
                    }
                    onDownload={() =>
                      downloadDocument(
                        "cover-letter",
                      )
                    }
                    copied={
                      copiedDocument ===
                      "cover-letter"
                    }
                  />

                )}


              {generatingCoverLetter ? (

                <LoadingState
                  text="Writing a job-specific cover letter..."
                />

              ) : coverLetter ? (

                <CoverLetterView
                  coverLetter={
                    coverLetter
                  }
                />

              ) : (

                <EmptyDocument
                  icon={
                    <Mail
                      size={27}
                    />
                  }
                  title="No cover letter yet"
                  description="Select a candidate and job, then click Generate Cover Letter."
                />

              )}

            </section>

          )}

        </>
      )}

    </div>
  );
}


/* ============================================================
   DOCUMENT HEADER
   ============================================================ */

function DocumentHeader({
  icon,
  title,
  subtitle,
}: {
  icon: ReactNode;
  title: string;
  subtitle: string;
}) {

  return (
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

        {icon}

      </div>


      <div>

        <h3
          style={{
            margin: 0,

            fontSize:
              "1rem",
          }}
        >
          {title}
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
          {subtitle}
        </div>

      </div>

    </div>
  );
}


/* ============================================================
   DOCUMENT ACTIONS
   ============================================================ */

function DocumentActions({
  copyLabel,
  onCopy,
  onDownload,
  copied,
}: {
  copyLabel: string;
  onCopy: () => void;
  onDownload: () => void;
  copied: boolean;
}) {

  return (
    <div
      style={{
        display:
          "flex",

        gap:
          "8px",

        marginBottom:
          "20px",
      }}
    >

      <button
        type="button"
        onClick={
          onCopy
        }
        style={{
          ...secondaryButtonStyle,

          padding:
            "9px 13px",

          fontSize:
            "0.78rem",
        }}
      >

        {copied ? (
          <Check
            size={14}
          />
        ) : (
          <Copy
            size={14}
          />
        )}

        {copyLabel}

      </button>


      <button
        type="button"
        onClick={
          onDownload
        }
        style={{
          ...secondaryButtonStyle,

          padding:
            "9px 13px",

          fontSize:
            "0.78rem",
        }}
      >

        <Download
          size={14}
        />

        Download

      </button>

    </div>
  );
}


/* ============================================================
   DOCUMENT TAB
   ============================================================ */

function DocumentTab({
  active,
  label,
  icon,
  onClick,
}: {
  active: boolean;
  label: string;
  icon: ReactNode;
  onClick: () => void;
}) {

  return (
    <button
      type="button"
      onClick={
        onClick
      }
      style={{
        display:
          "flex",

        alignItems:
          "center",

        gap:
          "7px",

        border:
          "none",

        borderRadius:
          "8px",

        padding:
          "9px 14px",

        background:
          active
            ? "var(--bg-card)"
            : "transparent",

        color:
          active
            ? "var(--text-primary)"
            : "var(--text-secondary)",

        fontWeight:
          active
            ? 600
            : 500,

        cursor:
          "pointer",

        boxShadow:
          active
            ? "0 1px 3px rgba(0, 0, 0, 0.08)"
            : "none",
      }}
    >

      {icon}

      {label}

    </button>
  );
}


/* ============================================================
   CONTEXT ITEM
   ============================================================ */

function ContextItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {

  return (
    <div>

      <div
        style={{
          color:
            "var(--text-muted)",

          fontSize:
            "0.7rem",

          marginBottom:
            "4px",
        }}
      >
        {label}
      </div>


      <div
        style={{
          fontSize:
            "0.83rem",

          fontWeight:
            600,
        }}
      >
        {value}
      </div>

    </div>
  );
}


/* ============================================================
   COVER LETTER VIEW
   ============================================================ */

function CoverLetterView({
  coverLetter,
}: {
  coverLetter: CoverLetter;
}) {

  const paragraphs =
    coverLetter.body
      .split(
        /\n\s*\n/,
      )
      .filter(
        (
          paragraph,
        ) =>
          paragraph
            .trim()
            .length > 0,
      );


  return (
    <div
      style={{
        maxWidth:
          "820px",

        marginTop:
          "24px",
      }}
    >

      {coverLetter.subject && (

        <div
          style={{
            paddingBottom:
              "18px",

            marginBottom:
              "24px",

            borderBottom:
              "1px solid var(--border-subtle)",
          }}
        >

          <div
            style={{
              color:
                "var(--text-muted)",

              fontSize:
                "0.7rem",

              marginBottom:
                "5px",

              textTransform:
                "uppercase",

              letterSpacing:
                "0.05em",
            }}
          >
            Subject
          </div>


          <div
            style={{
              fontWeight:
                600,

              fontSize:
                "0.95rem",
            }}
          >
            {coverLetter.subject}
          </div>

        </div>

      )}


      <div
        style={{
          color:
            "var(--text-secondary)",

          fontSize:
            "0.88rem",

          lineHeight:
            1.75,
        }}
      >

        {coverLetter.greeting && (

          <p
            style={{
              marginTop:
                0,
            }}
          >
            {coverLetter.greeting}
          </p>

        )}


        {paragraphs.map(
          (
            paragraph,
            index,
          ) => (

            <p
              key={
                index
              }
              style={{
                margin:
                  "0 0 18px",
              }}
            >
              {paragraph}
            </p>

          ),
        )}


        {coverLetter.closing && (

          <p
            style={{
              whiteSpace:
                "pre-line",

              marginTop:
                "26px",

              marginBottom:
                0,
            }}
          >
            {coverLetter.closing}
          </p>

        )}

      </div>

    </div>
  );
}


/* ============================================================
   STRUCTURED DOCUMENT
   ============================================================ */

function StructuredDocument({
  value,
}: {
  value: unknown;
}) {

  if (
    value === null ||
    value === undefined
  ) {

    return (
      <div
        style={{
          color:
            "var(--text-muted)",

          fontSize:
            "0.82rem",
        }}
      >
        No content returned.
      </div>
    );
  }


  if (
    typeof value ===
      "string" ||
    typeof value ===
      "number" ||
    typeof value ===
      "boolean"
  ) {

    return (
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
        {String(
          value,
        )}
      </div>
    );
  }


  if (
    Array.isArray(
      value,
    )
  ) {

    if (
      value.length ===
      0
    ) {

      return (
        <div
          style={{
            color:
              "var(--text-muted)",

            fontSize:
              "0.8rem",
          }}
        >
          No items.
        </div>
      );
    }


    const allStrings =
      value.every(
        (
          item,
        ) =>
          typeof item ===
          "string",
      );


    if (
      allStrings
    ) {

      return (
        <div
          style={{
            display:
              "flex",

            flexWrap:
              "wrap",

            gap:
              "8px",
          }}
        >

          {value.map(
            (
              item,
              index,
            ) => (

              <span
                key={
                  index
                }
                style={{
                  padding:
                    "6px 10px",

                  borderRadius:
                    "999px",

                  background:
                    "var(--bg)",

                  border:
                    "1px solid var(--border-subtle)",

                  fontSize:
                    "0.75rem",
                }}
              >
                {String(
                  item,
                )}
              </span>

            ),
          )}

        </div>
      );
    }


    return (
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

        {value.map(
          (
            item,
            index,
          ) => (

            <div
              key={
                index
              }
              style={{
                padding:
                  "15px",

                borderRadius:
                  "10px",

                border:
                  "1px solid var(--border-subtle)",

                background:
                  "var(--bg)",
              }}
            >

              <StructuredDocument
                value={
                  item
                }
              />

            </div>

          ),
        )}

      </div>
    );
  }


  if (
    typeof value ===
    "object"
  ) {

    const entries =
      Object.entries(
        value as Record<
          string,
          unknown
        >,
      );


    return (
      <div
        style={{
          display:
            "flex",

          flexDirection:
            "column",

          gap:
            "20px",
        }}
      >

        {entries.map(
          (
            [
              key,
              nestedValue,
            ],
          ) => (

            <div
              key={
                key
              }
              style={{
                paddingBottom:
                  "20px",

                borderBottom:
                  "1px solid var(--border-subtle)",
              }}
            >

              <div
                style={{
                  fontSize:
                    "0.88rem",

                  fontWeight:
                    600,

                  marginBottom:
                    "10px",
                }}
              >
                {formatKey(
                  key,
                )}
              </div>


              <StructuredDocument
                value={
                  nestedValue
                }
              />

            </div>

          ),
        )}

      </div>
    );
  }


  return null;
}


/* ============================================================
   EMPTY DOCUMENT
   ============================================================ */

function EmptyDocument({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {

  return (
    <div
      style={{
        minHeight:
          "280px",

        display:
          "flex",

        alignItems:
          "center",

        justifyContent:
          "center",
      }}
    >

      <div
        style={{
          textAlign:
            "center",

          maxWidth:
            "480px",
        }}
      >

        <div
          style={{
            display:
              "flex",

            justifyContent:
              "center",

            marginBottom:
              "14px",

            color:
              "var(--text-secondary)",
          }}
        >
          {icon}
        </div>


        <h3
          style={{
            margin:
              "0 0 8px",

            fontSize:
              "1rem",
          }}
        >
          {title}
        </h3>


        <p
          style={{
            margin: 0,

            color:
              "var(--text-secondary)",

            lineHeight:
              1.6,

            fontSize:
              "0.83rem",
          }}
        >
          {description}
        </p>

      </div>

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
          "260px",

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
        className="spinner"
      />

      {text}

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
      "11px 15px",

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


/* ============================================================
   HELPERS
   ============================================================ */

function formatKey(
  value: string,
): string {

  return value
    .replace(
      /_/g,
      " ",
    )
    .replace(
      /\b\w/g,
      (
        character,
      ) =>
        character.toUpperCase(),
    );
}


function unwrapTailoredCV(
  data: TailoredCV,
): unknown {

  if (
    data &&
    typeof data ===
      "object" &&
    "tailored_cv" in data
  ) {

    return (
      data as Record<
        string,
        unknown
      >
    ).tailored_cv;
  }


  return data;
}