import type {
  Job,
  JobCreate,
  JobFit,
  JobRequirements,
} from "../types/job";


async function parseError(
  response: Response,
): Promise<string> {

  try {

    const data =
      await response.json();

    return (
      data.detail ??
      `Request failed (${response.status})`
    );

  } catch {

    return `Request failed (${response.status})`;
  }
}


/**
 * Get all saved jobs.
 */
export async function getJobs(): Promise<Job[]> {

  const response =
    await fetch("/jobs");

  if (!response.ok) {

    throw new Error(
      await parseError(response),
    );
  }

  return response.json();
}


/**
 * Create a new saved job.
 */
export async function createJob(
  job: JobCreate,
): Promise<Job> {

  const response =
    await fetch(
      "/jobs",
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body: JSON.stringify(job),
      },
    );

  if (!response.ok) {

    throw new Error(
      await parseError(response),
    );
  }

  return response.json();
}


/**
 * Extract structured requirements
 * from a saved job.
 */
export async function getJobRequirements(
  jobId: number,
): Promise<JobRequirements> {

  const response =
    await fetch(
      `/job-requirements/${jobId}`,
    );

  if (!response.ok) {

    throw new Error(
      await parseError(response),
    );
  }

  return response.json();
}


/**
 * Calculate the candidate's overall
 * fit for a job.
 */
export async function getJobFit(
  candidateId: number,
  jobId: number,
): Promise<JobFit> {

  const response =
    await fetch(
      `/job-fit/${candidateId}/${jobId}`,
    );

  if (!response.ok) {

    throw new Error(
      await parseError(response),
    );
  }

  return response.json();
}