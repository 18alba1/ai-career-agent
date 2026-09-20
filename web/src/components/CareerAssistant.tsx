import {
  useEffect,
  useMemo,
  useState,
} from "react";

import type {
  CSSProperties,
  KeyboardEvent,
  ReactNode,
} from "react";

import {
  BookOpen,
  MessageCircle,
  RotateCcw,
  Send,
  Sparkles,
  UserRound,
  Loader2,
} from "lucide-react";

import {
  getCandidates,
} from "../api/candidateApi";

import {
  askCareerAssistant,
  type CareerAssistantSource,
} from "../api/careerAssistantApi";

import type {
  CandidateListItem,
} from "../types/candidate";


interface ChatMessage {
  role:
    | "user"
    | "assistant";

  content: string;

  sources?: CareerAssistantSource[];
}


const starterQuestions = [
  "What are my strongest technical skills?",
  "What experience do I have with AI and automation?",
  "Which of my projects are most relevant for an AI Engineer role?",
  "Give me examples from my background that I could use in an interview.",
];


export function CareerAssistant() {

  // ============================================================
  // CANDIDATE STATE
  // ============================================================

  const [
    candidates,
    setCandidates,
  ] = useState<
    CandidateListItem[]
  >([]);


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
  // CHAT STATE
  // ============================================================

  const [
    messages,
    setMessages,
  ] = useState<ChatMessage[]>(
    [],
  );


  const [
    question,
    setQuestion,
  ] = useState("");


  const [
    asking,
    setAsking,
  ] = useState(false);


  const [
    error,
    setError,
  ] = useState("");


  // ============================================================
  // LOAD CANDIDATES
  // ============================================================

  async function loadCandidates() {

    setLoadingCandidates(true);
    setError("");

    try {

      const data =
        await getCandidates();

      setCandidates(
        data,
      );


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

    void loadCandidates();

  }, []);


  // ============================================================
  // SELECTED CANDIDATE
  // ============================================================

  const selectedCandidate =
    useMemo(
      () =>
        candidates.find(
          (
            candidate,
          ) =>
            candidate.id ===
            selectedCandidateId,
        ) ?? null,
      [
        candidates,
        selectedCandidateId,
      ],
    );


  // ============================================================
  // CHANGE CANDIDATE
  // ============================================================

  function handleCandidateChange(
    candidateId: number,
  ) {

    setSelectedCandidateId(
      candidateId,
    );

    setMessages(
      [],
    );

    setError("");
  }


  // ============================================================
  // ASK QUESTION
  // ============================================================

  async function handleAsk(
    text?: string,
  ) {

    const trimmedQuestion =
      (
        text ??
        question
      ).trim();


    if (!trimmedQuestion) {
      return;
    }


    if (
      selectedCandidateId ===
      null
    ) {

      setError(
        "Select a candidate before asking a question.",
      );

      return;
    }


    if (asking) {
      return;
    }


    setQuestion("");
    setError("");
    setAsking(true);


    setMessages(
      (
        current,
      ) => [
        ...current,
        {
          role:
            "user",
          content:
            trimmedQuestion,
        },
      ],
    );


    try {

      const result =
        await askCareerAssistant(
          selectedCandidateId,
          trimmedQuestion,
        );


      setMessages(
        (
          current,
        ) => [
          ...current,
          {
            role:
              "assistant",

            content:
              result.answer,

            sources:
              result.sources,
          },
        ],
      );

    } catch (err) {

      console.error(
        "Career Assistant request failed:",
        err,
      );

      const message =
        err instanceof Error
          ? err.message
          : "Failed to get an answer.";


      setError(
        message,
      );

    } finally {

      setAsking(false);
    }
  }


  // ============================================================
  // ENTER KEY
  // ============================================================

  function handleKeyDown(
    event: KeyboardEvent<HTMLTextAreaElement>,
  ) {

    if (
      event.key ===
        "Enter" &&
      !event.shiftKey
    ) {

      event.preventDefault();

      void handleAsk();
    }
  }


  // ============================================================
  // CLEAR CHAT
  // ============================================================

  function clearChat() {

    setMessages(
      [],
    );

    setError("");
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

            <Sparkles
              size={16}
            />

            Career Assistant

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
            Ask About Your Career
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
            Ask questions about your skills,
            experience and projects. Answers are
            grounded in your candidate profile.
          </p>

        </div>


        {messages.length > 0 && (

          <button
            type="button"
            onClick={
              clearChat
            }
            style={{
              ...secondaryButtonStyle,
            }}
          >

            <RotateCcw
              size={15}
            />

            Clear Chat

          </button>

        )}

      </div>


      {/* ====================================================== */}
      {/* ERROR                                                  */}
      {/* ====================================================== */}

      {error && (

        <Message
          message={error}
        />

      )}


      {/* ====================================================== */}
      {/* CANDIDATE SELECTION                                   */}
      {/* ====================================================== */}

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
              "18px",
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

            <UserRound
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
              Candidate Profile
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
              Choose which candidate profile
              the assistant should use.
            </div>

          </div>

        </div>


        {loadingCandidates ? (

          <div
            style={{
              display:
                "flex",

              alignItems:
                "center",

              gap:
                "9px",

              color:
                "var(--text-secondary)",

              fontSize:
                "0.82rem",
            }}
          >

            <Loader2
              size={17}
              className="spinner"
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
            No candidate profiles found.
            Upload a CV first.
          </div>

        ) : (

          <select
            id="assistant-candidate"
            value={
              selectedCandidateId ??
              ""
            }
            onChange={(event) =>
              handleCandidateChange(
                Number(
                  event.target.value,
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

      </section>


      {/* ====================================================== */}
      {/* CHAT                                                   */}
      {/* ====================================================== */}

      <section
        style={{
          ...cardStyle,

          padding:
            "0",

          overflow:
            "hidden",
        }}
      >

        {/* ================================================== */}
        {/* CHAT HEADER                                       */}
        {/* ================================================== */}

        <div
          style={{
            padding:
              "18px 22px",

            borderBottom:
              "1px solid var(--border-subtle)",

            display:
              "flex",

            alignItems:
              "center",

            gap:
              "10px",
          }}
        >

          <MessageCircle
            size={17}
          />


          <div>

            <div
              style={{
                fontWeight:
                  600,

                fontSize:
                  "0.9rem",
              }}
            >
              Career Assistant
            </div>


            <div
              style={{
                marginTop:
                  "3px",

                color:
                  "var(--text-secondary)",

                fontSize:
                  "0.72rem",
              }}
            >
              {selectedCandidate
                ? `Grounded in ${selectedCandidate.name}'s profile`
                : "Select a candidate profile"}
            </div>

          </div>

        </div>


        {/* ================================================== */}
        {/* CHAT CONTENT                                      */}
        {/* ================================================== */}

        <div
          style={{
            minHeight:
              "420px",

            maxHeight:
              "650px",

            overflowY:
              "auto",

            padding:
              "24px",
          }}
        >

          {messages.length ===
          0 ? (

            <EmptyChat
              onAsk={
                handleAsk
              }
            />

          ) : (

            <div
              style={{
                display:
                  "flex",

                flexDirection:
                  "column",

                gap:
                  "18px",
              }}
            >

              {messages.map(
                (
                  message,
                  index,
                ) => (

                  <ChatMessageView
                    key={
                      index
                    }
                    message={
                      message
                    }
                  />

                ),
              )}


              {asking && (

                <div
                  style={{
                    display:
                      "flex",

                    alignItems:
                      "flex-start",

                    gap:
                      "10px",
                  }}
                >

                  <AssistantAvatar />

                  <div
                    style={{
                      padding:
                        "13px 15px",

                      borderRadius:
                        "12px",

                      background:
                        "var(--bg)",

                      border:
                        "1px solid var(--border-subtle)",

                      color:
                        "var(--text-secondary)",

                      fontSize:
                        "0.83rem",
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

                      <Loader2
                        size={15}
                        className="spinner"
                      />

                      Searching your profile...

                    </div>

                  </div>

                </div>

              )}

            </div>

          )}

        </div>


        {/* ================================================== */}
        {/* STARTER QUESTIONS                                */}
        {/* ================================================== */}

        {messages.length ===
          0 && (

          <div
            style={{
              padding:
                "0 24px 20px",
            }}
          >

            <div
              style={{
                marginBottom:
                  "10px",

                color:
                  "var(--text-muted)",

                fontSize:
                  "0.72rem",
              }}
            >
              Try asking
            </div>


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

              {starterQuestions.map(
                (
                  starter,
                ) => (

                  <button
                    key={
                      starter
                    }
                    type="button"
                    onClick={() =>
                      void handleAsk(
                        starter,
                      )
                    }
                    disabled={
                      asking ||
                      selectedCandidateId ===
                        null
                    }
                    style={{
                      padding:
                        "8px 11px",

                      borderRadius:
                        "9px",

                      border:
                        "1px solid var(--border-subtle)",

                      background:
                        "var(--bg)",

                      color:
                        "var(--text-secondary)",

                      fontSize:
                        "0.74rem",

                      cursor:
                        "pointer",

                      textAlign:
                        "left",
                    }}
                  >
                    {starter}
                  </button>

                ),
              )}

            </div>

          </div>

        )}


        {/* ================================================== */}
        {/* INPUT                                             */}
        {/* ================================================== */}

        <div
          style={{
            padding:
              "18px 20px",

            borderTop:
              "1px solid var(--border-subtle)",
          }}
        >

          <div
            style={{
              display:
                "flex",

              gap:
                "10px",

              alignItems:
                "flex-end",
            }}
          >

            <textarea
              id="career-question"
              value={
                question
              }
              onChange={(event) =>
                setQuestion(
                  event.target.value,
                )
              }
              onKeyDown={
                handleKeyDown
              }
              placeholder={
                selectedCandidateId ===
                null
                  ? "Select a candidate first..."
                  : "Ask something about your background..."
              }
              disabled={
                selectedCandidateId ===
                  null ||
                asking
              }
              rows={3}
              style={{
                ...inputStyle,

                resize:
                  "vertical",

                minHeight:
                  "78px",

                lineHeight:
                  1.5,
              }}
            />


            <button
              type="button"
              onClick={() =>
                void handleAsk()
              }
              disabled={
                !question.trim() ||
                selectedCandidateId ===
                  null ||
                asking
              }
              style={{
                ...primaryButtonStyle,

                height:
                  "42px",

                padding:
                  "0 15px",

                flexShrink:
                  0,

                opacity:
                  !question.trim() ||
                  selectedCandidateId ===
                    null ||
                  asking
                    ? 0.6
                    : 1,
              }}
            >

              {asking ? (

                <Loader2
                  size={16}
                  className="spinner"
                />

              ) : (

                <Send
                  size={16}
                />

              )}

              {asking
                ? "Thinking..."
                : "Ask"}

            </button>

          </div>


          <div
            style={{
              marginTop:
                "8px",

              color:
                "var(--text-muted)",

              fontSize:
                "0.68rem",
            }}
          >
            Press Enter to send · Shift + Enter
            for a new line
          </div>

        </div>

      </section>

    </div>
  );
}


/* ============================================================
   EMPTY CHAT
   ============================================================ */

function EmptyChat({
  onAsk,
}: {
  onAsk: (
    question: string,
  ) => void;
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
      }}
    >

      <div
        style={{
          textAlign:
            "center",

          maxWidth:
            "520px",
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
          }}
        >

          <Sparkles
            size={28}
          />

        </div>


        <h3
          style={{
            margin:
              "0 0 8px",

            fontSize:
              "1.05rem",
          }}
        >
          Your career profile, in conversation
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
          Ask about your experience, skills,
          projects or examples you can use
          in applications and interviews.
        </p>

      </div>

    </div>
  );
}


/* ============================================================
   CHAT MESSAGE
   ============================================================ */

function ChatMessageView({
  message,
}: {
  message: ChatMessage;
}) {

  const isUser =
    message.role ===
    "user";


  return (
    <div
      style={{
        display:
          "flex",

        alignItems:
          "flex-start",

        justifyContent:
          isUser
            ? "flex-end"
            : "flex-start",

        gap:
          "10px",
      }}
    >

      {!isUser && (
        <AssistantAvatar />
      )}


      <div
        style={{
          maxWidth:
            "78%",

          padding:
            "13px 15px",

          borderRadius:
            "12px",

          background:
            isUser
              ? "linear-gradient(135deg, var(--primary), var(--accent))"
              : "var(--bg)",

          color:
            isUser
              ? "#fff"
              : "var(--text-secondary)",

          border:
            isUser
              ? "none"
              : "1px solid var(--border-subtle)",

          fontSize:
            "0.84rem",

          lineHeight:
            1.65,

          whiteSpace:
            "pre-wrap",
        }}
      >

        {message.content}


        {!isUser &&
          message.sources &&
          message.sources.length >
            0 && (

          <Sources
            sources={
              message.sources
            }
          />

        )}

      </div>


      {isUser && (
        <div
          style={{
            width:
              "28px",

            height:
              "28px",

            borderRadius:
              "50%",

            display:
              "flex",

            alignItems:
              "center",

            justifyContent:
              "center",

            background:
              "var(--bg)",

            border:
              "1px solid var(--border-subtle)",

            flexShrink:
              0,
          }}
        >

          <UserRound
            size={14}
          />

        </div>
      )}

    </div>
  );
}


/* ============================================================
   ASSISTANT AVATAR
   ============================================================ */

function AssistantAvatar() {

  return (
    <div
      style={{
        width:
          "28px",

        height:
          "28px",

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

        flexShrink:
          0,
      }}
    >

      <Sparkles
        size={14}
      />

    </div>
  );
}


/* ============================================================
   SOURCES
   ============================================================ */

function Sources({
  sources,
}: {
  sources: CareerAssistantSource[];
}) {

  return (
    <div
      style={{
        marginTop:
          "16px",

        paddingTop:
          "13px",

        borderTop:
          "1px solid var(--border-subtle)",
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
            "var(--text-muted)",

          fontSize:
            "0.68rem",

          marginBottom:
            "8px",
        }}
      >

        <BookOpen
          size={13}
        />

        Sources

      </div>


      <div
        style={{
          display:
            "flex",

          flexDirection:
            "column",

          gap:
            "7px",
        }}
      >

        {sources.map(
          (
            source,
            index,
          ) => (

            <div
              key={
                `${source.label}-${index}`
              }
              style={{
                padding:
                  "9px 10px",

                borderRadius:
                  "8px",

                background:
                  "var(--bg-card)",

                border:
                  "1px solid var(--border-subtle)",
              }}
            >

              <div
                style={{
                  display:
                    "flex",

                  justifyContent:
                    "space-between",

                  gap:
                    "10px",

                  fontSize:
                    "0.72rem",

                  fontWeight:
                    600,
                }}
              >

                <span>
                  {source.label}
                </span>


                {source.similarity !==
                  undefined && (

                  <span
                    style={{
                      color:
                        "var(--text-muted)",

                      fontWeight:
                        500,
                    }}
                  >
                    {(
                      source.similarity *
                      100
                    ).toFixed(
                      0,
                    )}
                    %
                  </span>

                )}

              </div>


              {source.category && (

                <div
                  style={{
                    marginTop:
                      "3px",

                    color:
                      "var(--text-muted)",

                    fontSize:
                      "0.64rem",
                  }}
                >
                  {source.category}
                </div>

              )}


              {source.content && (

                <div
                  style={{
                    marginTop:
                      "6px",

                    color:
                      "var(--text-secondary)",

                    fontSize:
                      "0.68rem",

                    lineHeight:
                      1.45,
                  }}
                >
                  {source.content}
                </div>

              )}

            </div>

          ),
        )}

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
  };