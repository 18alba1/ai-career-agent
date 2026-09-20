import type {
  InterviewQuestion,
  NextQuestionRequest,
  InterviewEvaluation,
  InterviewEvaluationRequest,
  InterviewReport,
  InterviewReportRequest,
  TranscribeResponse,
} from "../types/interview";

async function parseError(response: Response): Promise<string> {
  try {
    const data = await response.json();
    return data.detail ?? `Request failed (${response.status})`;
  } catch {
    return `Request failed (${response.status})`;
  }
}

export async function fetchNextQuestion(
  candidateId: number,
  jobId: number,
  body: NextQuestionRequest,
): Promise<InterviewQuestion> {
  const response = await fetch(
    `/interview/next/${candidateId}/${jobId}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );
  if (!response.ok) throw new Error(await parseError(response));
  return response.json();
}

export async function evaluateAnswer(
  candidateId: number,
  jobId: number,
  body: InterviewEvaluationRequest,
): Promise<InterviewEvaluation> {
  const response = await fetch(
    `/interview/evaluate/${candidateId}/${jobId}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );
  if (!response.ok) throw new Error(await parseError(response));
  return response.json();
}

export async function fetchInterviewReport(
  candidateId: number,
  jobId: number,
  body: InterviewReportRequest,
): Promise<InterviewReport> {
  const response = await fetch(
    `/interview/report/${candidateId}/${jobId}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );
  if (!response.ok) throw new Error(await parseError(response));
  return response.json();
}

export async function transcribeAudio(
  audioBlob: Blob,
  language: string,
): Promise<TranscribeResponse> {
  const formData = new FormData();
  formData.append("file", audioBlob, "answer.webm");
  formData.append("language", language);
  const response = await fetch("/transcribe-audio", {
    method: "POST",
    body: formData,
  });
  if (!response.ok) throw new Error(await parseError(response));
  return response.json();
}

export async function fetchSpeechAudio(
  text: string,
  language: string,
): Promise<string> {
  const params = new URLSearchParams({ text, language });
  const response = await fetch(`/text-to-speech?${params.toString()}`);
  if (!response.ok) throw new Error(await parseError(response));
  const blob = await response.blob();
  return URL.createObjectURL(blob);
}
