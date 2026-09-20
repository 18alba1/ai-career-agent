import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";

import type {
  CoverLetter,
  TailoredCV,
} from "../api/applicationApi";


const styles = StyleSheet.create({
  page: {
    paddingTop: 48,
    paddingBottom: 48,
    paddingLeft: 50,
    paddingRight: 50,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#1f2937",
    lineHeight: 1.45,
  },

  header: {
    marginBottom: 24,
    paddingBottom: 16,
    borderBottom: "1pt solid #d1d5db",
  },

  name: {
    fontSize: 22,
    fontWeight: 700,
    color: "#111827",
    marginBottom: 5,
  },

  role: {
    fontSize: 10.5,
    color: "#6b7280",
  },

  section: {
    marginBottom: 17,
  },

  sectionTitle: {
    fontSize: 11.5,
    fontWeight: 700,
    color: "#111827",
    marginBottom: 7,
  },

  subsectionTitle: {
    fontSize: 10,
    fontWeight: 700,
    color: "#374151",
    marginBottom: 4,
  },

  paragraph: {
    fontSize: 9.8,
    color: "#374151",
    marginBottom: 6,
  },

  bullet: {
    fontSize: 9.6,
    color: "#374151",
    marginBottom: 4,
    paddingLeft: 8,
  },

  nestedBlock: {
    marginBottom: 9,
    paddingLeft: 10,
  },

  nestedField: {
    marginBottom: 7,
  },

  tags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 5,
  },

  tag: {
    fontSize: 8.7,
    color: "#374151",
    backgroundColor: "#f3f4f6",
    paddingTop: 4,
    paddingBottom: 4,
    paddingLeft: 7,
    paddingRight: 7,
    borderRadius: 4,
  },

  coverHeader: {
    marginBottom: 24,
  },

  coverTitle: {
    fontSize: 20,
    fontWeight: 700,
    color: "#111827",
    marginBottom: 6,
  },

  subject: {
    fontSize: 10,
    fontWeight: 700,
    color: "#374151",
    marginBottom: 20,
  },

  coverParagraph: {
    fontSize: 10,
    color: "#374151",
    lineHeight: 1.55,
    marginBottom: 12,
  },

  closing: {
    fontSize: 10,
    color: "#374151",
    lineHeight: 1.55,
    marginTop: 10,
  },
});


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


function renderPdfValue(
  value: unknown,
  level = 0,
): React.ReactNode {

  if (
    value === null ||
    value === undefined
  ) {

    return null;
  }


  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {

    return (
      <Text
        style={styles.paragraph}
      >
        {String(value)}
      </Text>
    );
  }


  if (
    Array.isArray(value)
  ) {

    if (
      value.length === 0
    ) {
      return null;
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
        <View
          style={styles.tags}
        >
          {value.map(
            (
              item,
              index,
            ) => (
              <Text
                key={
                  index
                }
                style={styles.tag}
              >
                {String(
                  item,
                )}
              </Text>
            ),
          )}
        </View>
      );
    }


    return (
      <View>
        {value.map(
          (
            item,
            index,
          ) => (
            <View
              key={
                index
              }
              style={
                styles.nestedBlock
              }
            >
              {renderPdfValue(
                item,
                level + 1,
              )}
            </View>
          ),
        )}
      </View>
    );
  }


  if (
    typeof value ===
    "object"
  ) {

    return (
      <View>
        {Object.entries(
          value as Record<
            string,
            unknown
          >,
        ).map(
          (
            [
              key,
              nestedValue,
            ],
          ) => (

            <View
              key={
                key
              }
              style={
                styles.nestedField
              }
            >

              <Text
                style={
                  styles.subsectionTitle
                }
              >
                {formatKey(
                  key,
                )}
              </Text>


              {renderPdfValue(
                nestedValue,
                level + 1,
              )}

            </View>
          ),
        )}
      </View>
    );
  }


  return null;
}


function unwrapTailoredCV(
  data: TailoredCV,
): unknown {

  if (
    data &&
    typeof data === "object" &&
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


export function CVPdfDocument({
  candidateName,
  jobTitle,
  company,
  tailoredCV,
}: {
  candidateName?: string;
  jobTitle?: string;
  company?: string;
  tailoredCV: TailoredCV;
}) {

  const content =
    unwrapTailoredCV(
      tailoredCV,
    );


  return (
    <Document>
      <Page
        size="A4"
        style={
          styles.page
        }
      >

        <View
          style={
            styles.header
          }
        >

          <Text
            style={
              styles.name
            }
          >
            {candidateName ||
              "Candidate"}
          </Text>


          {(jobTitle ||
            company) && (

            <Text
              style={
                styles.role
              }
            >
              {jobTitle || ""}
              {jobTitle &&
                company
                ? " · "
                : ""}
              {company || ""}
            </Text>

          )}

        </View>


        {content &&
          typeof content ===
            "object" &&
          !Array.isArray(
            content,
          ) ? (

          Object.entries(
            content as Record<
              string,
              unknown
            >,
          ).map(
            (
              [
                key,
                value,
              ],
            ) => (

              <View
                key={
                  key
                }
                style={
                  styles.section
                }
              >

                <Text
                  style={
                    styles.sectionTitle
                  }
                >
                  {formatKey(
                    key,
                  )}
                </Text>


                {renderPdfValue(
                  value,
                )}

              </View>

            ),
          )

        ) : (

          <View
            style={
              styles.section
            }
          >
            {renderPdfValue(
              content,
            )}
          </View>

        )}

      </Page>
    </Document>
  );
}


export function CoverLetterPdfDocument({
  candidateName,
  jobTitle,
  company,
  coverLetter,
}: {
  candidateName?: string;
  jobTitle?: string;
  company?: string;
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
    <Document>
      <Page
        size="A4"
        style={
          styles.page
        }
      >

        <View
          style={
            styles.coverHeader
          }
        >

          <Text
            style={
              styles.coverTitle
            }
          >
            {candidateName ||
              "Cover Letter"}
          </Text>


          {(jobTitle ||
            company) && (

            <Text
              style={
                styles.role
              }
            >
              {jobTitle || ""}
              {jobTitle &&
                company
                ? " · "
                : ""}
              {company || ""}
            </Text>

          )}

        </View>


        {coverLetter.subject && (

          <Text
            style={
              styles.subject
            }
          >
            {coverLetter.subject}
          </Text>

        )}


        {coverLetter.greeting && (

          <Text
            style={
              styles.coverParagraph
            }
          >
            {coverLetter.greeting}
          </Text>

        )}


        {paragraphs.map(
          (
            paragraph,
            index,
          ) => (

            <Text
              key={
                index
              }
              style={
                styles.coverParagraph
              }
            >
              {paragraph}
            </Text>

          ),
        )}


        {coverLetter.closing && (

          <Text
            style={
              styles.closing
            }
          >
            {coverLetter.closing}
          </Text>

        )}

      </Page>
    </Document>
  );
}