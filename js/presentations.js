const PRESENTATIONS_BY_COURSE = {
  a1: {
    1: true,
    2: true,
    3: true,
    4: true,
    5: false,
    6: true,
    7: true,
    8: true,
    9: true,
    10: true,
    11: true,
    12: true,
    13: true,
    14: true,
    15: true,
    16: true,
    17: true,
    18: true,
    19: true,
    20: true,
  },
  a2: {},
  b1: {},
  b2: {},
};

const PRESENTATION_FILES_BY_COURSE = {
  a1: {
    1: "abc_and_numbers.pdf",
    2: "noun.pdf",
    3: "personal_subject_pronoun.pdf",
    4: "speaking.pdf",
    5: "to_be.pdf",
    6: "possessive_adj.pdf",
    7: "demonstrative_pronouns.pdf",
    8: "articles.pdf",
    9: "possessive_case.pdf",
    10: "much_many.pdf",
    11: "present_simple_tense.pdf",
    12: "some_any_no.pdf",
    13: "prepositions_of_place.pdf",
    14: "object_pronouns.pdf",
    15: "present_continuous_tense.pdf",
    16: "time.pdf",
    17: "either_neither_too.pdf",
    18: "past_simple_tense.pdf",
    19: "future_simple_tense.pdf",
    20: "used_to.pdf",
  },
  a2: {},
  b1: {},
  b2: {},
};

const getPresentationFile = (course, lessonNumber) => {
  const normalizedCourse = String(course || "").trim().toLowerCase();
  const safeLessonNumber = Number(lessonNumber) || 1;
  const courseMap = PRESENTATION_FILES_BY_COURSE[normalizedCourse];
  if (!courseMap) {
    return "";
  }
  return courseMap[safeLessonNumber] || "";
};

const getPresentationUrl = (course, lessonNumber) => {
  const normalizedCourse = String(course || "").trim().toLowerCase();
  const safeLessonNumber = Number(lessonNumber) || 1;
  const courseMap = PRESENTATIONS_BY_COURSE[normalizedCourse];

  // Explicitly disabled (value is strictly false) — hide button immediately
  if (courseMap && courseMap[safeLessonNumber] === false) {
    return "";
  }

  // Explicitly enabled with a known static file
  if (courseMap && courseMap[safeLessonNumber] === true) {
    const hasFile =
      typeof getPresentationFile === "function"
        ? Boolean(getPresentationFile(normalizedCourse, safeLessonNumber))
        : true;
    if (hasFile) {
      return `presentation.html?course=${encodeURIComponent(normalizedCourse)}&lesson=${safeLessonNumber}`;
    }
  }

  // Not defined (e.g. a2, b1, b2) — return null so the caller checks the server API
  return null;
};
