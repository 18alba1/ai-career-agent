export interface CoverLetter {
  subject: string;
  greeting: string;
  body: string;
  closing: string;
}

export type TailoredCV = Record<string, unknown>;

async function parseError(response: Response): Promise<never> {
  let message = `Request failed with status ${response.status}`;

  try {
    const data = await response.json();

    if (typeof data?.detail === "string") {
      message = data.detail;
    } else if (data?.detail) {
      message = JSON.stringify(data.detail);
    }
  } catch {
    // Ignore JSON parsing errors.
  }

  throw new Error(message);
}

export async function getTailoredCV(
  candidateId: number,
  jobId: number,
): Promise<TailoredCV> {
  const response = await fetch(
    `/tailor-cv/${candidateId}/${jobId}`,
  );

  if (!response.ok) {
    return parseError(response);
  }

  return response.json();
}

export async function generateCoverLetter(
  candidateId: number,
  jobId: number,
): Promise<CoverLetter> {
  const response = await fetch(
    `/cover-letter/${candidateId}/${jobId}`,
  );

  if (!response.ok) {
    return parseError(response);
  }

  return response.json();
}