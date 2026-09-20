import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  BookOpen,
  BriefcaseBusiness,
  GraduationCap,
  Languages,
  Loader2,
  Plus,
  Upload,
  User,
} from "lucide-react";

import {
  getCandidate,
  getCandidates,
  uploadCv,
} from "../api/candidateApi";

import type {
  CandidateListItem,
  CandidateProfile,
} from "../types/candidate";


export function Candidate() {

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
    profile,
    setProfile,
  ] = useState<CandidateProfile | null>(
    null,
  );


  const [
    loadingCandidates,
    setLoadingCandidates,
  ] = useState(true);


  const [
    loadingProfile,
    setLoadingProfile,
  ] = useState(false);


  const [
    uploading,
    setUploading,
  ] = useState(false);


  const [
    error,
    setError,
  ] = useState("");


  const fileInputRef =
    useRef<HTMLInputElement | null>(
      null,
    );


  async function loadCandidates(
    selectLatest = false,
  ) {

    setLoadingCandidates(true);
    setError("");

    try {

      const data =
        await getCandidates();

      setCandidates(data);


      if (data.length === 0) {

        setSelectedCandidateId(
          null,
        );

        setProfile(null);

        return;
      }


      if (
        selectLatest ||
        selectedCandidateId === null
      ) {

        /*
         * Backend returns candidates
         * ordered by newest first.
         */
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


  async function loadProfile(
    candidateId: number,
  ) {

    setLoadingProfile(true);
    setError("");

    try {

      const data =
        await getCandidate(
          candidateId,
        );

      setProfile(data);

    } catch (err) {

      console.error(
        "Failed to load candidate:",
        err,
      );

      setProfile(null);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load candidate profile.",
      );

    } finally {

      setLoadingProfile(false);
    }
  }


  useEffect(() => {

    void loadCandidates(
      true,
    );

  }, []);


  useEffect(() => {

    if (
      selectedCandidateId === null
    ) {

      setProfile(null);

      return;
    }


    void loadProfile(
      selectedCandidateId,
    );

  }, [selectedCandidateId]);


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


  async function handleFileSelected(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {

    const file =
      event.target.files?.[0];


    /*
     * Allow the same file to be
     * selected again later.
     */
    event.target.value = "";


    if (!file) {
      return;
    }


    setUploading(true);
    setError("");


    try {

      await uploadCv(file);


      /*
       * The backend creates a new
       * candidate. Since /candidates
       * is ordered newest first,
       * the first result is the newly
       * uploaded candidate.
       */
      await loadCandidates(true);

    } catch (err) {

      console.error(
        "CV upload failed:",
        err,
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to upload CV.",
      );

    } finally {

      setUploading(false);
    }
  }


  const triggerUpload = () => {

    if (uploading) {
      return;
    }

    fileInputRef.current?.click();
  };


  return (
    <div
      style={{
        maxWidth: "1200px",
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
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: "20px",
          marginBottom: "32px",
        }}
      >

        <div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              color: "var(--text-secondary)",
              fontSize: "0.8rem",
              marginBottom: "8px",
            }}
          >
            <User size={16} />

            Candidate
          </div>


          <h1
            style={{
              margin: 0,
              fontSize: "2rem",
              letterSpacing: "-0.03em",
            }}
          >
            Candidate Profile
          </h1>


          <p
            style={{
              marginTop: "10px",
              marginBottom: 0,
              color: "var(--text-secondary)",
              lineHeight: 1.6,
              maxWidth: "650px",
            }}
          >
            Manage your CV, skills, experience,
            education and projects in one place.
          </p>

        </div>


        <div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx,.txt"
            onChange={
              handleFileSelected
            }
            style={{
              display: "none",
            }}
          />


          <button
            type="button"
            onClick={
              triggerUpload
            }
            disabled={uploading}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              border: "none",
              borderRadius: "10px",
              padding: "12px 16px",
              background:
                "linear-gradient(135deg, var(--primary), var(--accent))",
              color: "#fff",
              fontWeight: 600,
              cursor: uploading
                ? "default"
                : "pointer",
              opacity: uploading
                ? 0.7
                : 1,
            }}
          >

            {uploading ? (
              <Loader2
                size={17}
                className="spinner"
              />
            ) : (
              <Upload size={17} />
            )}


            {uploading
              ? "Processing CV..."
              : "Upload New CV"}

          </button>

        </div>

      </div>


      {/* ====================================================== */}
      {/* ERROR                                                  */}
      {/* ====================================================== */}

      {error && (
        <div
          style={{
            marginBottom: "24px",
            padding: "14px 16px",
            borderRadius: "10px",
            border:
              "1px solid rgba(239, 68, 68, 0.25)",
            background:
              "rgba(239, 68, 68, 0.08)",
            color: "#fca5a5",
          }}
        >
          {error}
        </div>
      )}


      {/* ====================================================== */}
      {/* CANDIDATE SELECTOR                                     */}
      {/* ====================================================== */}

      <div
        style={{
          background:
            "var(--bg-card)",
          border:
            "1px solid var(--border-subtle)",
          borderRadius:
            "var(--radius-lg)",
          padding: "20px",
          marginBottom: "24px",
        }}
      >

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            color: "var(--text-secondary)",
            fontSize: "0.82rem",
            marginBottom: "10px",
          }}
        >
          <User size={16} />

          Select Candidate
        </div>


        {loadingCandidates ? (

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              color: "var(--text-secondary)",
            }}
          >
            <Loader2
              size={16}
              className="spinner"
            />

            Loading candidates...
          </div>

        ) : candidates.length === 0 ? (

          <div
            style={{
              color:
                "var(--text-secondary)",
            }}
          >
            No candidate profiles yet.
            Upload a CV to create one.
          </div>

        ) : (

          <select
            value={
              selectedCandidateId ??
              ""
            }
            onChange={(event) =>
              setSelectedCandidateId(
                Number(
                  event.target.value,
                ),
              )
            }
            style={{
              width: "100%",
              maxWidth: "600px",
              padding: "12px 14px",
              borderRadius: "10px",
              border:
                "1px solid var(--border-subtle)",
              background:
                "var(--bg)",
              color:
                "var(--text-primary)",
              fontSize: "0.95rem",
              outline: "none",
            }}
          >

            {candidates.map(
              (candidate) => (
                <option
                  key={candidate.id}
                  value={candidate.id}
                >
                  {candidate.name}
                </option>
              ),
            )}

          </select>
        )}

      </div>


      {/* ====================================================== */}
      {/* PROFILE                                                */}
      {/* ====================================================== */}

      {loadingProfile ? (

        <div
          style={{
            minHeight: "300px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
            color:
              "var(--text-secondary)",
          }}
        >

          <Loader2
            size={20}
            className="spinner"
          />

          Loading profile...

        </div>

      ) : !profile ? (

        <EmptyProfileState
          onUpload={triggerUpload}
          uploading={uploading}
        />

      ) : (

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >

          {/* Identity / summary */}

          <section
            style={{
              background:
                "var(--bg-card)",
              border:
                "1px solid var(--border-subtle)",
              borderRadius:
                "var(--radius-lg)",
              padding: "28px",
            }}
          >

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "14px",
                marginBottom: "18px",
              }}
            >

              <div
                style={{
                  width: "52px",
                  height: "52px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background:
                    "var(--primary-glow)",
                  color:
                    "var(--text-primary)",
                  fontSize: "1.1rem",
                  fontWeight: 700,
                }}
              >
                {getInitials(
                  profile.name,
                )}
              </div>


              <div>

                <h2
                  style={{
                    margin: 0,
                    fontSize: "1.35rem",
                  }}
                >
                  {profile.name}
                </h2>


                <div
                  style={{
                    marginTop: "4px",
                    color:
                      "var(--text-secondary)",
                    fontSize: "0.82rem",
                  }}
                >
                  Candidate #{selectedCandidate?.id}
                </div>

              </div>

            </div>


            <p
              style={{
                margin: 0,
                color:
                  "var(--text-secondary)",
                lineHeight: 1.7,
              }}
            >
              {profile.summary}
            </p>

          </section>


          {/* Skills */}

          <ProfileSection
            icon={<BookOpen size={18} />}
            title="Skills"
          >

            {profile.skills.length === 0 ? (

              <EmptyText>
                No skills extracted.
              </EmptyText>

            ) : (

              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "8px",
                }}
              >

                {profile.skills.map(
                  (skill) => (
                    <span
                      key={skill}
                      style={{
                        padding:
                          "7px 10px",
                        borderRadius:
                          "999px",
                        background:
                          "var(--primary-glow)",
                        border:
                          "1px solid var(--border-subtle)",
                        fontSize:
                          "0.8rem",
                      }}
                    >
                      {skill}
                    </span>
                  ),
                )}

              </div>
            )}

          </ProfileSection>


          {/* Experience */}

          <ProfileSection
            icon={
              <BriefcaseBusiness
                size={18}
              />
            }
            title="Experience"
          >

            {profile.experience.length ===
            0 ? (

              <EmptyText>
                No experience extracted.
              </EmptyText>

            ) : (

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "22px",
                }}
              >

                {profile.experience.map(
                  (item, index) => (
                    <TimelineItem
                      key={`${item.company}-${item.role}-${index}`}
                      title={item.role}
                      subtitle={
                        item.company
                      }
                      description={
                        item.description
                      }
                    />
                  ),
                )}

              </div>
            )}

          </ProfileSection>


          {/* Education */}

          <ProfileSection
            icon={
              <GraduationCap
                size={18}
              />
            }
            title="Education"
          >

            {profile.education.length ===
            0 ? (

              <EmptyText>
                No education extracted.
              </EmptyText>

            ) : (

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "22px",
                }}
              >

                {profile.education.map(
                  (item, index) => (
                    <TimelineItem
                      key={`${item.institution}-${item.degree}-${index}`}
                      title={item.degree}
                      subtitle={
                        item.institution
                      }
                      description={
                        item.description
                      }
                    />
                  ),
                )}

              </div>
            )}

          </ProfileSection>


          {/* Projects */}

          <ProfileSection
            icon={
              <BriefcaseBusiness
                size={18}
              />
            }
            title="Projects"
          >

            {profile.projects.length ===
            0 ? (

              <EmptyText>
                No projects extracted.
              </EmptyText>

            ) : (

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(280px, 1fr))",
                  gap: "14px",
                }}
              >

                {profile.projects.map(
                  (project, index) => (
                    <div
                      key={`${project.name}-${index}`}
                      style={{
                        padding: "18px",
                        borderRadius:
                          "12px",
                        border:
                          "1px solid var(--border-subtle)",
                        background:
                          "var(--bg)",
                      }}
                    >

                      <div
                        style={{
                          fontWeight: 600,
                        }}
                      >
                        {project.name}
                      </div>


                      <p
                        style={{
                          marginTop: "8px",
                          color:
                            "var(--text-secondary)",
                          lineHeight: 1.55,
                          fontSize:
                            "0.85rem",
                        }}
                      >
                        {project.description}
                      </p>


                      {project.technologies
                        .length > 0 && (
                        <div
                          style={{
                            display: "flex",
                            flexWrap:
                              "wrap",
                            gap: "6px",
                            marginTop:
                              "12px",
                          }}
                        >

                          {project.technologies.map(
                            (technology) => (
                              <span
                                key={
                                  technology
                                }
                                style={{
                                  fontSize:
                                    "0.72rem",
                                  color:
                                    "var(--text-secondary)",
                                  padding:
                                    "4px 7px",
                                  borderRadius:
                                    "6px",
                                  background:
                                    "var(--bg-card)",
                                  border:
                                    "1px solid var(--border-subtle)",
                                }}
                              >
                                {technology}
                              </span>
                            ),
                          )}

                        </div>
                      )}

                    </div>
                  ),
                )}

              </div>
            )}

          </ProfileSection>


          {/* Languages */}

          <ProfileSection
            icon={
              <Languages size={18} />
            }
            title="Languages"
          >

            {profile.languages.length ===
            0 ? (

              <EmptyText>
                No languages extracted.
              </EmptyText>

            ) : (

              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "8px",
                }}
              >

                {profile.languages.map(
                  (language) => (
                    <span
                      key={language}
                      style={{
                        padding:
                          "7px 10px",
                        borderRadius:
                          "999px",
                        border:
                          "1px solid var(--border-subtle)",
                        background:
                          "var(--bg)",
                        fontSize:
                          "0.8rem",
                      }}
                    >
                      {language}
                    </span>
                  ),
                )}

              </div>
            )}

          </ProfileSection>

        </div>
      )}

    </div>
  );
}


/* ============================================================
   PROFILE SECTION
   ============================================================ */

interface ProfileSectionProps {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}


function ProfileSection({
  icon,
  title,
  children,
}: ProfileSectionProps) {

  return (
    <section
      style={{
        background:
          "var(--bg-card)",
        border:
          "1px solid var(--border-subtle)",
        borderRadius:
          "var(--radius-lg)",
        padding: "24px",
      }}
    >

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "9px",
          marginBottom: "18px",
        }}
      >

        <div
          style={{
            width: "34px",
            height: "34px",
            borderRadius: "9px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background:
              "var(--primary-glow)",
          }}
        >
          {icon}
        </div>


        <h3
          style={{
            margin: 0,
            fontSize: "1rem",
          }}
        >
          {title}
        </h3>

      </div>


      {children}

    </section>
  );
}


/* ============================================================
   TIMELINE ITEM
   ============================================================ */

interface TimelineItemProps {
  title: string;
  subtitle: string;
  description: string;
}


function TimelineItem({
  title,
  subtitle,
  description,
}: TimelineItemProps) {

  return (
    <div>

      <div
        style={{
          fontWeight: 600,
          fontSize: "0.95rem",
        }}
      >
        {title}
      </div>


      <div
        style={{
          marginTop: "4px",
          color:
            "var(--text-secondary)",
          fontSize: "0.82rem",
        }}
      >
        {subtitle}
      </div>


      <div
        style={{
          marginTop: "9px",
          color:
            "var(--text-secondary)",
          lineHeight: 1.6,
          fontSize: "0.85rem",
        }}
      >
        {description}
      </div>

    </div>
  );
}


/* ============================================================
   EMPTY PROFILE
   ============================================================ */

interface EmptyProfileStateProps {
  onUpload: () => void;
  uploading: boolean;
}


function EmptyProfileState({
  onUpload,
  uploading,
}: EmptyProfileStateProps) {

  return (
    <div
      style={{
        minHeight: "320px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background:
          "var(--bg-card)",
        border:
          "1px dashed var(--border-subtle)",
        borderRadius:
          "var(--radius-lg)",
      }}
    >

      <div
        style={{
          textAlign: "center",
          maxWidth: "440px",
        }}
      >

        <div
          style={{
            width: "52px",
            height: "52px",
            margin: "0 auto 16px",
            borderRadius: "14px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background:
              "var(--primary-glow)",
          }}
        >
          <Plus size={22} />
        </div>


        <h3
          style={{
            margin: 0,
          }}
        >
          No candidate profile yet
        </h3>


        <p
          style={{
            marginTop: "9px",
            color:
              "var(--text-secondary)",
            lineHeight: 1.6,
          }}
        >
          Upload a CV and the existing AI
          pipeline will extract your profile,
          skills, experience, education and
          projects.
        </p>


        <button
          type="button"
          onClick={onUpload}
          disabled={uploading}
          style={{
            marginTop: "16px",
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            border: "none",
            borderRadius: "10px",
            padding: "11px 15px",
            background:
              "linear-gradient(135deg, var(--primary), var(--accent))",
            color: "#fff",
            fontWeight: 600,
            cursor:
              uploading
                ? "default"
                : "pointer",
            opacity: uploading
              ? 0.7
              : 1,
          }}
        >
          <Upload size={16} />

          Upload CV
        </button>

      </div>

    </div>
  );
}


/* ============================================================
   HELPERS
   ============================================================ */

function EmptyText({
  children,
}: {
  children: React.ReactNode;
}) {

  return (
    <div
      style={{
        color:
          "var(--text-secondary)",
        fontSize: "0.85rem",
      }}
    >
      {children}
    </div>
  );
}


function getInitials(
  name: string,
): string {

  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(
      (part) =>
        part[0]?.toUpperCase() ?? "",
    )
    .join("");
}