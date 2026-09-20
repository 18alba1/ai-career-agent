import type {
  CandidateListItem,
  CandidateProfile,
} from "../types/candidate";


async function parseError(
  response: Response,
): Promise<string> {

  try {

    const data = await response.json();

    return (
      data.detail ??
      `Request failed (${response.status})`
    );

  } catch {

    return `Request failed (${response.status})`;
  }
}


/**
 * Get all candidate profiles.
 */
export async function getCandidates(): Promise<
  CandidateListItem[]
> {

  const response =
    await fetch("/candidates");

  if (!response.ok) {

    throw new Error(
      await parseError(response),
    );
  }

  return response.json();
}


/**
 * Get one complete candidate profile.
 */
export async function getCandidate(
  candidateId: number,
): Promise<CandidateProfile> {

  const response =
    await fetch(
      `/candidate/${candidateId}`,
    );

  if (!response.ok) {

    throw new Error(
      await parseError(response),
    );
  }

  return response.json();
}


/**
 * Upload a CV and let the existing
 * backend create the candidate profile.
 */
export async function uploadCv(
  file: File,
): Promise<CandidateProfile> {

  const formData =
    new FormData();

  formData.append(
    "file",
    file,
  );


  const response =
    await fetch(
      "/upload-cv",
      {
        method: "POST",
        body: formData,
      },
    );


  if (!response.ok) {

    throw new Error(
      await parseError(response),
    );
  }


  return response.json();
}