export interface CareerAssistantSource {
  label: string;
  content?: string;
  category?: string;
  similarity?: number;
}

export interface CareerAssistantResponse {
  answer: string;
  sources: CareerAssistantSource[];
}


async function parseError(
  response: Response,
): Promise<never> {

  let message =
    `Request failed with status ${response.status}`;

  try {

    const data =
      await response.json();

    if (
      typeof data?.detail ===
      "string"
    ) {

      message =
        data.detail;

    } else if (
      data?.detail
    ) {

      message =
        JSON.stringify(
          data.detail,
        );
    }

  } catch {
    // Ignore JSON parsing errors.
  }

  throw new Error(
    message,
  );
}


function normalizeSources(
  value: unknown,
): CareerAssistantSource[] {

  if (!Array.isArray(value)) {
    return [];
  }


  return value.map(
    (
      source,
      index,
    ) => {

      if (
        typeof source ===
        "string"
      ) {

        return {
          label:
            source,
        };
      }


      if (
        source &&
        typeof source ===
        "object"
      ) {

        const item =
          source as Record<
            string,
            unknown
          >;


        const label =
          String(
            item.title ??
            item.name ??
            item.label ??
            item.category ??
            `Source ${index + 1}`,
          );


        return {
          label,

          content:
            typeof item.content ===
            "string"
              ? item.content
              : typeof item.text ===
                "string"
                ? item.text
                : undefined,

          category:
            typeof item.category ===
            "string"
              ? item.category
              : undefined,

          similarity:
            typeof item.similarity ===
            "number"
              ? item.similarity
              : undefined,
        };
      }


      return {
        label:
          `Source ${index + 1}`,
      };
    },
  );
}


export async function askCareerAssistant(
  candidateId: number,
  question: string,
): Promise<CareerAssistantResponse> {

  const params =
    new URLSearchParams({
      question,
    });


  const response =
    await fetch(
      `/candidate-rag/${candidateId}?${params.toString()}`,
    );


  if (!response.ok) {
    return parseError(
      response,
    );
  }


  const data =
    await response.json();


  return {
    answer:
      String(
        data.answer ??
        data.response ??
        data.result ??
        "No answer was returned.",
      ),

    sources:
      normalizeSources(
        data.sources ??
        data.citations ??
        [],
      ),
  };
}