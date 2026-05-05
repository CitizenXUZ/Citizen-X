let completedLessons = 0;

function markComplete(element) {
  if (!element.classList.contains("done")) {
    element.classList.add("done");
    completedLessons++;
    updateProgress();
  }
}

function completeLesson() {
  completedLessons++;
  updateProgress();
}

function updateProgress() {
  const totalLessons = 4;
  const percentage = (completedLessons / totalLessons) * 100;
  const progressBar = document.getElementById("progress-bar");
  if (progressBar) {
    progressBar.style.width = percentage + "%";
  }
}

const heroHeader = document.querySelector(".hero-header");

if (heroHeader) {
  // Two thresholds prevent flicker near the top:
  // collapse quickly on small downward scroll, expand only very close to top.
  const isMobileHeader = window.matchMedia("(max-width: 900px)").matches;
  const collapseAt = isMobileHeader ? 10 : 18;
  const expandAt = isMobileHeader ? 2 : 6;
  let isCompact = false;
  const root = document.documentElement;
  const clamp01 = (value) => Math.min(1, Math.max(0, value));

  const getNumberVar = (name, fallback) => {
    const raw = getComputedStyle(heroHeader).getPropertyValue(name).trim();
    const num = Number(raw);
    return Number.isFinite(num) ? num : fallback;
  };

  const maxSize = getNumberVar("--logo-size-max", 340);
  const minSize = getNumberVar("--logo-size-min", 95);
  const range = Math.max(1, maxSize - minSize);
  let maxHeaderPx = 0;
  let minHeaderPx = 0;

  const syncHeaderLimits = () => {
    const maxVh = getNumberVar("--header-max-vh", 45);
    const minPx = getNumberVar("--header-min-px", 90);
    maxHeaderPx = (maxVh / 100) * window.innerHeight;
    minHeaderPx = minPx;
  };

  const syncMobileSmoothVars = (y) => {
    if (!window.matchMedia("(max-width: 900px)").matches) return;

    // Smoothly interpolate mobile header spacing and logo width with scroll.
    // This avoids the "snap" feel when is-compact toggles.
    const distance = 220; // px of scroll to fully compact
    const t = clamp01(y / distance);

    const vw = window.innerWidth;
    const maxLogo = Math.min(vw * 0.78, 330);
    const minLogo = Math.min(vw * 0.46, 176);
    const logoW = Math.round(maxLogo - (maxLogo - minLogo) * t);
    heroHeader.style.setProperty("--m-logo-w", `${logoW}px`);

    const maxPadY = 14;
    const minPadY = 6;
    const padY = Math.round((maxPadY - (maxPadY - minPadY) * t) * 10) / 10;
    heroHeader.style.setProperty("--m-header-pad-y", `${padY}px`);

    const maxBtnPadY = 12;
    const minBtnPadY = 10;
    const btnPadY = Math.round((maxBtnPadY - (maxBtnPadY - minBtnPadY) * t) * 10) / 10;
    heroHeader.style.setProperty("--m-btn-pad-y", `${btnPadY}px`);

    const maxBtnPadX = 24;
    const minBtnPadX = 18;
    const btnPadX = Math.round((maxBtnPadX - (maxBtnPadX - minBtnPadX) * t) * 10) / 10;
    heroHeader.style.setProperty("--m-btn-pad-x", `${btnPadX}px`);

    const maxBtnFs = 1.12;
    const minBtnFs = 1.05;
    const btnFs = Math.round((maxBtnFs - (maxBtnFs - minBtnFs) * t) * 100) / 100;
    heroHeader.style.setProperty("--m-btn-fs", `${btnFs}rem`);
  };

  const syncLogoSizeFromHeader = () => {
    const h = heroHeader.getBoundingClientRect().height;
    // Used by mobile CSS when the header is fixed to prevent content from
    // sliding underneath it. Updated continuously for smooth shrink behavior.
    root.style.setProperty("--hero-header-h", `${Math.round(h)}px`);
    const denom = Math.max(1, maxHeaderPx - minHeaderPx);
    const t = Math.min(1, Math.max(0, (maxHeaderPx - h) / denom));
    const size = Math.round(maxSize - range * t);
    heroHeader.style.setProperty("--logo-size", `${size}px`);
  };

  const syncHeaderState = () => {
    const y = window.scrollY;

    if (!isCompact && y > collapseAt) {
      isCompact = true;
      heroHeader.classList.add("is-compact");
    } else if (isCompact && y <= expandAt) {
      isCompact = false;
      heroHeader.classList.remove("is-compact");
    }

    syncMobileSmoothVars(y);
    syncLogoSizeFromHeader();
  };

  syncHeaderLimits();
  syncHeaderState();
  window.addEventListener("scroll", syncHeaderState, { passive: true });
  window.addEventListener("resize", () => {
    syncHeaderLimits();
    syncMobileSmoothVars(window.scrollY);
    syncLogoSizeFromHeader();
  });

  const ro = new ResizeObserver(() => {
    syncLogoSizeFromHeader();
  });
  ro.observe(heroHeader);
}

const a1Lessons = {
  1: {
    title: "Theme: ABC / Numbers",
    video: "https://youtu.be/QGTAkFwF4jo?si=4g5DPbRFOadR2Dhy",
    cover: "https://i.pinimg.com/736x/f4/28/dd/f428dd018444810c4edd49f3112e49e9.jpg",
  },
  2: {
    title: "Theme: Noun",
    video: "https://youtu.be/IpWRL8rJMLY",
    cover: "https://i.pinimg.com/736x/12/1a/36/121a3678f248014e01d6d754f0ebbd3f.jpg",
  },
  3: {
    title: "Theme: Personal Subject Pronoun and To Be",
    video: "https://youtu.be/7YGYvJ61yi0",
    cover: "https://i.pinimg.com/736x/fa/c9/60/fac9600a9e92a15acb2fcb94dc715d37.jpg",
  },
  4: {
    title: "Theme: Speaking",
    video: "assets/videos/a1-lesson6.mp4",
    cover: "https://i.pinimg.com/736x/59/88/29/59882949a5b94a3feb4efd10d1847ea9.jpg",
  },
  5: {
    title: "Theme: Review Lesson",
    video: "https://youtu.be/8Y8iZ2pMokY",
    cover: "https://i.pinimg.com/736x/5c/96/75/5c9675b63a63d4acdc870abcc089da8f.jpg",
  },
  6: {
    title: "Theme: Possessive Adjective and Possessive Pronouns",
    video: "https://youtu.be/I_PGgz7Wjxg",
    cover: "https://i.pinimg.com/474x/13/44/f9/1344f935980ba0d9b12a4c93f4e390b7.jpg",
  },
  7: {
    title: "Theme: Demonstrative Pronouns",
    video: "https://youtu.be/fLjieWwitIg",
    cover: "https://i.pinimg.com/736x/24/4f/c6/244fc6b7ed5f3d1a5524e6fdaa339939.jpg",
  },
  8: {
    title: "Theme: Articles",
    video: "https://youtu.be/cBqnFvGGkEM",
    cover: "https://i.pinimg.com/736x/83/2a/03/832a032b71c63dbc31da8e2b316b7956.jpg",
  },
  9: {
    title: "Theme: Possessive Case",
    video: "https://youtu.be/P5XFb_uYLgs",
    cover: "https://i.pinimg.com/736x/c4/96/86/c4968682a4b6e03bea7758cf685287c3.jpg",
  },
  10: {
    title: "Theme: Much / Many",
    video: "https://youtu.be/OMCv3ZtecPk",
    cover: "https://i.pinimg.com/736x/73/36/1b/73361b4a1b1c5f6d1d04d40ecb7745ae.jpg",
  },
  11: {
    title: "Theme: Present Simple Tense",
    video: "https://youtu.be/yGTxYdrt090",
    cover: "https://i.pinimg.com/736x/d9/fa/b4/d9fab4a4e30b1e38443cf0c3f3ee1633.jpg",
  },
  12: {
    title: "Theme: Some Any No",
    video: "https://youtu.be/sjKD_S7qUFk",
    cover: "https://i.pinimg.com/474x/fb/35/fd/fb35fd4e826f619e4605c8e14056ad9c.jpg",
  },
  13: {
    title: "Theme: Prepositions of Place",
    video: "https://youtu.be/Oe_XU1CD0-0",
    cover: "https://i.pinimg.com/736x/87/4e/cf/874ecf6b1c664c4f648a3f68b9eb42da.jpg",
  },
  14: {
    title: "Theme: Object Pronouns",
    video: "https://youtu.be/in4W8R5gBLk",
    cover: "https://i.pinimg.com/736x/93/0e/83/930e83a0f84711d892cebf21de07cc9b.jpg",
  },
  15: {
    title: "Theme: Present Continuous Tense",
    video: "https://youtu.be/NiO8vohpAQw",
    cover: "https://i.pinimg.com/736x/8a/24/f9/8a24f9ffac2195adc4636b963e77fce8.jpg",
  },
  16: {
    title: "Theme: Time",
    video: "https://youtu.be/EQ5UelcSmRU",
    cover: "https://i.pinimg.com/736x/9e/d6/b0/9ed6b02f79d5bc40ccf3356152692ac5.jpg",
  },
  17: {
    title: "Theme: Either Neither Too",
    video: "https://youtu.be/YJHvmP5s6IU",
    cover: "https://i.pinimg.com/736x/a9/92/30/a99230cb62af716498c2d826ce8df457.jpg",
  },
  18: {
    title: "Theme: Past Simple Tense",
    video: "https://youtu.be/Xx6ucv6PiYU",
    cover: "https://i.pinimg.com/736x/d8/53/77/d85377ebad94252be86b16bd6f372244.jpg",
  },
  19: {
    title: "Theme: Future Simple Tense",
    video: "https://youtu.be/hHRGQuxCaeQ",
    cover: "https://i.pinimg.com/736x/39/40/91/394091cfc0bd8c5c378f222844a69f79.jpg",
  },
  20: {
    title: "Theme: Used To",
    video: "https://youtu.be/Jc30rFfIlVI",
    cover: "https://i.pinimg.com/736x/39/0e/78/390e78ba907acc39c806ce5bff473f95.jpg",
  },
  21: {
    title: "Theme: Final Lesson",
    video: "https://youtu.be/njuca06cRpg?si=Icbd5G5vKpmWdwBO",
    cover: "https://i.pinimg.com/736x/36/9f/03/369f03be8d5e9aa9226c4de29df728b2.jpg",
  },
};

const isYouTubeUrl = (value) => /youtube\.com|youtu\.be/.test(String(value || ""));

const extractYouTubeId = (value) => {
  const raw = String(value || "").trim();
  if (!raw) {
    return "";
  }
  const patterns = [
    /youtu\.be\/([A-Za-z0-9_-]{11})/i,
    /youtube\.com\/watch\?v=([A-Za-z0-9_-]{11})/i,
    /youtube\.com\/embed\/([A-Za-z0-9_-]{11})/i,
    /youtube\.com\/shorts\/([A-Za-z0-9_-]{11})/i,
  ];
  for (const pattern of patterns) {
    const match = raw.match(pattern);
    if (match) {
      return match[1];
    }
  }
  return "";
};

const getYouTubeEmbedUrl = (value) => {
  const id = extractYouTubeId(value);
  if (!id) {
    return "";
  }
  return `https://www.youtube.com/embed/${id}?rel=0&modestbranding=1&playsinline=1`;
};

const getYouTubeCoverUrl = (value) => {
  const id = extractYouTubeId(value);
  if (!id) {
    return "";
  }
  return `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
};

const loadYouTubeApi = () => {
  if (window.YT && window.YT.Player) {
    return Promise.resolve(window.YT);
  }
  if (window._ytApiPromise) {
    return window._ytApiPromise;
  }
  window._ytApiPromise = new Promise((resolve) => {
    window._ytApiCallbacks = window._ytApiCallbacks || [];
    window._ytApiCallbacks.push(resolve);
    if (window._ytApiScriptAdded) {
      return;
    }
    window._ytApiScriptAdded = true;
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(tag);
    window.onYouTubeIframeAPIReady = () => {
      const callbacks = window._ytApiCallbacks || [];
      callbacks.forEach((cb) => cb(window.YT));
      window._ytApiCallbacks = [];
    };
  });
  return window._ytApiPromise;
};

const createVideoProgressTracker = (course, lessonNumber, getCurrentTime, getDuration) => {
  const authState = getAuthState();
  if (!authState || !authState.username) {
    return null;
  }
  let maxWatchedSeconds = 0;
  let lastSentAt = 0;
  let lastSentWatched = 0;
  const throttleMs = 12000;
  const minDeltaSeconds = 8;

  const sendProgress = (force = false) => {
    const durationSeconds = Number(getDuration()) || 0;
    const now = Date.now();
    if (!force) {
      if (now - lastSentAt < throttleMs && Math.abs(maxWatchedSeconds - lastSentWatched) < minDeltaSeconds) {
        return;
      }
    }
    lastSentAt = now;
    lastSentWatched = maxWatchedSeconds;
    fetch(`${API_BASE_URL}/api/video-progress`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: authState.username,
        course,
        lesson_number: lessonNumber,
        watched_seconds: Math.floor(maxWatchedSeconds),
        duration_seconds: Math.floor(durationSeconds || 0),
        last_position_seconds: Math.floor(getCurrentTime() || 0),
      }),
    }).catch(() => {
      // Ignore tracking errors.
    });
  };

  const recordTick = () => {
    const current = Number(getCurrentTime()) || 0;
    if (current > maxWatchedSeconds) {
      maxWatchedSeconds = current;
    }
    sendProgress(false);
  };

  const markEnded = () => {
    const durationSeconds = Number(getDuration()) || 0;
    if (durationSeconds > maxWatchedSeconds) {
      maxWatchedSeconds = durationSeconds;
    }
    sendProgress(true);
  };

  return { sendProgress, recordTick, markEnded };
};

const setupYouTubeTracking = (player, course, lessonNumber) => {
  let watchedSeconds = 0;
  let lastTickAt = 0;
  const getDurationSafe = () => {
    try {
      return Number(player.getDuration()) || 0;
    } catch (error) {
      return 0;
    }
  };
  const getWatchedSeconds = () => watchedSeconds;
  const tracker = createVideoProgressTracker(course, lessonNumber, getWatchedSeconds, getDurationSafe);
  if (!tracker) {
    return;
  }
  let timer = null;
  const updateWatchedSeconds = () => {
    if (!lastTickAt) {
      lastTickAt = Date.now();
      return;
    }
    const now = Date.now();
    const delta = Math.max(0, (now - lastTickAt) / 1000);
    if (delta > 0) {
      watchedSeconds += delta;
      const duration = getDurationSafe();
      if (duration > 0 && watchedSeconds > duration) {
        watchedSeconds = duration;
      }
    }
    lastTickAt = now;
  };
  const start = () => {
    if (timer) {
      return;
    }
    lastTickAt = Date.now();
    timer = setInterval(() => {
      updateWatchedSeconds();
      tracker.recordTick();
    }, 1000);
  };
  const stop = () => {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
    updateWatchedSeconds();
  };

  player.addEventListener("onReady", () => {
    tracker.sendProgress(true);
  });
  player.addEventListener("onStateChange", (event) => {
    if (event.data === window.YT.PlayerState.PLAYING) {
      start();
      tracker.sendProgress(false);
      return;
    }
    if (event.data === window.YT.PlayerState.PAUSED) {
      stop();
      tracker.sendProgress(true);
      return;
    }
    if (event.data === window.YT.PlayerState.BUFFERING) {
      stop();
      tracker.sendProgress(false);
      return;
    }
    if (event.data === window.YT.PlayerState.ENDED) {
      stop();
      tracker.markEnded();
    }
  });
  window.addEventListener("beforeunload", () => {
    updateWatchedSeconds();
    tracker.sendProgress(true);
  });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      updateWatchedSeconds();
      tracker.sendProgress(true);
    }
  });
};

const a2Lessons = {
  1: {
    title: "Theme: Reflexive pronouns",
    video: "assets/videos/a2-lesson1.mp4",
    cover: "https://i.pinimg.com/736x/e5/83/39/e5833924101e3efb054198451b2352cf.jpg",
  },
  2: {
    title: "Theme: Present Simple Tense",
    video: "assets/videos/a2-lesson2.mp4",
    cover: "https://i.pinimg.com/736x/36/9f/03/369f03be8d5e9aa9226c4de29df728b2.jpg",
  },
  3: {
    title: "Theme: Present Continuous",
    video: "assets/videos/a2-lesson3.mp4",
    cover: "https://i.pinimg.com/736x/82/21/df/8221dfbf39b52c1aa6b1280982edc4ee.jpg",
  },
  4: {
    title: "Theme: Possessive Case",
    video: "assets/videos/a2-lesson4.mp4",
    cover: "https://i.pinimg.com/736x/46/1f/5f/461f5f25519228fca9c0f6985d580093.jpg",
  },
  5: {
    title: "Theme: Much Many a2 revision",
    video: "assets/videos/a2-lesson5.mp4",
    cover: "https://i.pinimg.com/736x/43/5c/1b/435c1b2e84a9a32da8f064cbec38c4a0.jpg",
  },
  6: {
    title: "Theme: Indefinite pronouns: Someone Anybody nothing everywhere",
    video: "assets/videos/a2-lesson6.mp4",
    cover: "https://i.pinimg.com/736x/fb/3f/1d/fb3f1d980a43e8e71e5b4ed44ca76146.jpg",
  },
  7: {
    title: "Theme: Past Simple",
    video: "assets/videos/a2-lesson7.mp4",
    cover: "https://i.pinimg.com/736x/3b/9c/10/3b9c10ddc980664407c4ddb1511a96a3.jpg",
  },
  8: {
    title: "Theme: Past Continuous",
    video: "assets/videos/a2-lesson8.mp4",
    cover: "https://i.pinimg.com/736x/79/95/3e/79953ec7d4a1e4b2a8c6dfd676b9bee8.jpg",
  },
  9: {
    title: "Theme: Future Simple",
    video: "assets/videos/a2-lesson9.mp4",
    cover: "https://i.pinimg.com/736x/8f/5f/57/8f5f5750c434f8d78a86e78f269cbee6.jpg",
  },
  10: {
    title: "Theme: Future Continuous",
    video: "assets/videos/a2-lesson10.mp4",
    cover: "https://i.pinimg.com/736x/2d/f7/d1/2df7d1d720621f1f07b78f1b5556dbe5.jpg",
  },
  11: {
    title: "Theme: Present Perfect",
    video: "assets/videos/a2-lesson11.mp4",
    cover: "https://i.pinimg.com/736x/dd/82/8c/dd828cade8e65fe28838da6c3d243dc8.jpg",
  },
  12: {
    title: "Theme: Interrogative pronouns / relative pronouns",
    video: "assets/videos/a2-lesson12.mp4",
    cover: "https://i.pinimg.com/736x/4f/9b/8a/4f9b8adc41363000df312f2c340df37b.jpg",
  },
  13: {
    title: "Theme: Modal verbs",
    video: "assets/videos/a2-lesson13.mp4",
    cover: "https://i.pinimg.com/736x/98/fa/c8/98fac813efe081caa6d859ffd94c422f.jpg",
  },
  14: {
    title: "Theme: Final Lesson",
    video: "https://youtu.be/njuca06cRpg?si=Icbd5G5vKpmWdwBO",
    cover: "https://i.pinimg.com/736x/36/9f/03/369f03be8d5e9aa9226c4de29df728b2.jpg",
  },
};

const FINAL_LESSON_BY_COURSE = {
  a1: 21,
  a2: 14,
};

const LESSONS_BY_COURSE = {
  a1: a1Lessons,
  a2: a2Lessons,
  b1: {
    1: { title: "Theme: Much Many", video: "assets/videos/b1-lesson1.mp4" },
    2: { title: "Theme: Consecutive order", video: "assets/videos/b1-lesson2.mp4" },
    3: { title: "Theme: Countable & Non-countable nouns", video: "assets/videos/b1-lesson3.mp4" },
    4: { title: "Theme: Articles", video: "assets/videos/b1-lesson4.mp4" },
    5: { title: "Theme: Singular & Plural nouns", video: "assets/videos/b1-lesson5.mp4" },
    6: { title: "Theme: TEST", video: "assets/videos/b1-lesson6.mp4" },
    7: { title: "Theme: Present Simple", video: "assets/videos/b1-lesson7.mp4" },
    8: { title: "Theme: Present Continuous", video: "assets/videos/b1-lesson8.mp4" },
    9: { title: "Theme: Present Perfect", video: "assets/videos/b1-lesson9.mp4" },
    10: { title: "Theme: Present Perfect Continuous", video: "assets/videos/b1-lesson10.mp4" },
    11: { title: "Theme: TEST", video: "assets/videos/b1-lesson11.mp4" },
    12: { title: "Theme: Past Simple", video: "assets/videos/b1-lesson12.mp4" },
    13: { title: "Theme: Past Continuous", video: "assets/videos/b1-lesson13.mp4" },
    14: { title: "Theme: Past Perfect", video: "assets/videos/b1-lesson14.mp4" },
    15: { title: "Theme: Past Perfect Continuous", video: "assets/videos/b1-lesson15.mp4" },
    16: { title: "Theme: TEST", video: "assets/videos/b1-lesson16.mp4" },
    17: { title: "Theme: Future Simple", video: "assets/videos/b1-lesson17.mp4" },
    18: { title: "Theme: Future Continuous", video: "assets/videos/b1-lesson18.mp4" },
    19: { title: "Theme: Future Perfect", video: "assets/videos/b1-lesson19.mp4" },
    20: { title: "Theme: Future Perfect Continuous", video: "assets/videos/b1-lesson20.mp4" },
    21: { title: "Theme: Future in the past", video: "assets/videos/b1-lesson21.mp4" },
    22: { title: "Theme: TEST", video: "assets/videos/b1-lesson22.mp4" },
    23: { title: "Theme: Gerund / infinitive", video: "assets/videos/b1-lesson23.mp4" },
    24: { title: "Theme: Reported speech", video: "assets/videos/b1-lesson24.mp4" },
    25: { title: "Theme: Essay writing", video: "assets/videos/b1-lesson25.mp4" },
    26: { title: "Theme: Adverbs", video: "assets/videos/b1-lesson26.mp4" },
    27: { title: "Theme: Adjectives", video: "assets/videos/b1-lesson27.mp4" },
  },
  b2: {
    1: { title: "Theme: Letter Writing", video: "assets/videos/b2-lesson1.mp4" },
    2: { title: "Theme: Conjunction", video: "assets/videos/b2-lesson2.mp4" },
    3: { title: "Theme: If conditional sentence", video: "assets/videos/b2-lesson3.mp4" },
    4: { title: "Theme: Suffix prefix rules", video: "assets/videos/b2-lesson4.mp4" },
    5: { title: "Theme: Nominalization", video: "assets/videos/b2-lesson5.mp4" },
    6: { title: "Theme: Passive Active voice", video: "assets/videos/b2-lesson6.mp4" },
    7: { title: "Theme: Modal Verbs", video: "assets/videos/b2-lesson7.mp4" },
    8: { title: "Theme: Wish grammar", video: "assets/videos/b2-lesson8.mp4" },
  },
};

let quizQuestions = [];

const resolveApiBaseUrl = () => {
  // Prefer same-origin API when possible. This is crucial for phone testing:
  // `127.0.0.1` on a phone points to the phone itself, not the laptop.
  const origin = window.location.origin;
  if (origin && origin !== "null") {
    return origin;
  }

  const host = window.location.hostname || "127.0.0.1";
  const protocol = window.location.protocol && window.location.protocol !== ":" ? window.location.protocol : "http:";
  return `${protocol}//${host}:8020`;
};

let API_BASE_URL = resolveApiBaseUrl();
let ACCESS_API_BASE_URL = API_BASE_URL;
const API_BASE_URL_FALLBACKS = (() => {
  const host = window.location.hostname || "127.0.0.1";
  const protocol = window.location.protocol && window.location.protocol !== ":" ? window.location.protocol : "http:";
  const candidates = [
    // Same origin first (works when backend serves site+API on the same port).
    window.location.origin && window.location.origin !== "null" ? window.location.origin : "",
    // Common dev ports on the same host.
    `${protocol}//${host}:8020`,
    `${protocol}//${host}:8000`,
    `${protocol}//${host}:8090`,
    // Local machine fallbacks.
    "http://127.0.0.1:8020",
    "http://127.0.0.1:8000",
    "http://127.0.0.1:8090",
    "http://localhost:8020",
    "http://localhost:8000",
    "http://localhost:8090",
  ].filter(Boolean);
  return Array.from(new Set(candidates));
})();

const fetchWithTimeout = (url, options = {}, timeoutMs = 8000) => {
  if (typeof AbortController === "undefined") {
    return fetch(url, options);
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const merged = { ...options, signal: controller.signal };
  return fetch(url, merged).finally(() => clearTimeout(timer));
};

const checkApiHealth = async (baseUrl) => {
  try {
    const response = await fetchWithTimeout(`${baseUrl}/api/health`, {}, 3000);
    if (!response.ok) {
      return false;
    }
    const payload = await response.json();
    return payload && payload.status === "ok";
  } catch (error) {
    return false;
  }
};

const ensureApiBaseUrl = async () => {
  if (await checkApiHealth(API_BASE_URL)) {
    return API_BASE_URL;
  }
  for (const candidate of API_BASE_URL_FALLBACKS) {
    if (candidate === API_BASE_URL) {
      continue;
    }
    if (await checkApiHealth(candidate)) {
      API_BASE_URL = candidate;
      ACCESS_API_BASE_URL = candidate;
      return API_BASE_URL;
    }
  }
  return API_BASE_URL;
};
const initContactForm = () => {
  const form = document.getElementById("contact-form");
  if (!form) {
    return;
  }
  const nameInput = document.getElementById("contact-name");
  const emailInput = document.getElementById("contact-email");
  const messageInput = document.getElementById("contact-message");
  const submitBtn = form.querySelector(".contact-submit-btn");
  const statusEl = document.getElementById("contact-status");

  const setStatus = (text, type) => {
    if (!statusEl) {
      return;
    }
    statusEl.textContent = text;
    statusEl.classList.remove("is-error", "is-success");
    if (type) {
      statusEl.classList.add(`is-${type}`);
    }
  };

  const setBusy = (isBusy) => {
    if (!submitBtn) {
      return;
    }
    submitBtn.disabled = isBusy;
    submitBtn.textContent = isBusy ? "Sending..." : "Send Message";
  };

  const isValidEmail = (value) => /\S+@\S+\.\S+/.test(String(value || "").trim());

  const handleSubmit = async (event) => {
    if (event) {
      event.preventDefault();
    }
    const name = nameInput ? nameInput.value.trim() : "";
    const email = emailInput ? emailInput.value.trim() : "";
    const message = messageInput ? messageInput.value.trim() : "";

    if (!name || !email || !message) {
      setStatus("Please fill in your name, email, and message.", "error");
      return;
    }
    if (!isValidEmail(email)) {
      setStatus("Please enter a valid email address.", "error");
      return;
    }

    setBusy(true);
    setStatus("Sending message...");
    await ensureApiBaseUrl();

    try {
      const response = await fetch(`${API_BASE_URL}/api/contact`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          message,
        }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        const errorText = payload && payload.error ? payload.error : "Unable to send message.";
        setStatus(errorText, "error");
        return;
      }
      form.reset();
      setStatus("Message sent! We will reply soon.", "success");
    } catch (error) {
      setStatus("Network error. Please try again in a moment.", "error");
    } finally {
      setBusy(false);
    }
  };

  form.addEventListener("submit", handleSubmit);
};
const ACCESS_AUTH_STORAGE_KEY = "ewms_auth_state";
const COURSE_CODES = ["a1", "a2", "b1", "b2"];

const LESSON_OVERRIDES_CACHE = {};
const MERGED_LESSONS_CACHE = {};
const ADMIN_EDIT_CODE_STORAGE_PREFIX = "ewms_admin_edit_code:";

const stripThemePrefix = (value) => String(value || "").replace(/^theme:\s*/i, "").trim();

const escapeHtml = (value) =>
  String(value === null || typeof value === "undefined" ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const fetchLessonOverrides = async (course) => {
  const normalizedCourse = String(course || "").trim().toLowerCase();
  const safeCourse = COURSE_CODES.includes(normalizedCourse) ? normalizedCourse : "";
  if (!safeCourse) {
    return [];
  }
  if (LESSON_OVERRIDES_CACHE[safeCourse]) {
    return LESSON_OVERRIDES_CACHE[safeCourse];
  }
  await ensureApiBaseUrl();
  try {
    const response = await fetchWithTimeout(
      `${API_BASE_URL}/api/lessons/overrides?course=${encodeURIComponent(safeCourse)}`,
      {},
      5000
    );
    if (!response.ok) {
      LESSON_OVERRIDES_CACHE[safeCourse] = [];
      return [];
    }
    const payload = await response.json().catch(() => ({}));
    const items = Array.isArray(payload.items) ? payload.items : [];
    LESSON_OVERRIDES_CACHE[safeCourse] = items;
    return items;
  } catch (error) {
    LESSON_OVERRIDES_CACHE[safeCourse] = [];
    return [];
  }
};

const mergeCourseLessons = async (course) => {
  const normalizedCourse = String(course || "").trim().toLowerCase();
  const safeCourse = COURSE_CODES.includes(normalizedCourse) ? normalizedCourse : "";
  if (!safeCourse) {
    return { list: [], byNumber: {} };
  }
  if (MERGED_LESSONS_CACHE[safeCourse]) {
    return MERGED_LESSONS_CACHE[safeCourse];
  }
  const baseline = LESSONS_BY_COURSE[safeCourse] || {};
  const baselineNumbers = Object.keys(baseline)
    .map((key) => Number(key) || 0)
    .filter((n) => n > 0)
    .sort((a, b) => a - b);

  const overrides = await fetchLessonOverrides(safeCourse);
  const overrideMap = {};
  overrides.forEach((item) => {
    const num = Number(item && item.lesson_number) || 0;
    if (num > 0) {
      overrideMap[num] = item;
    }
  });

  const allNumbers = new Set(baselineNumbers);
  Object.keys(overrideMap).forEach((key) => {
    const num = Number(key) || 0;
    if (num > 0) {
      allNumbers.add(num);
    }
  });

  const lessons = [];
  Array.from(allNumbers)
    .sort((a, b) => a - b)
    .forEach((lessonNumber) => {
      const base = baseline[lessonNumber] || {};
      const ov = overrideMap[lessonNumber] || {};
      const isHidden = Number(ov.is_hidden || 0) === 1;
      if (isHidden) {
        return;
      }
      const positionRaw = ov.position;
      const position = positionRaw === null || typeof positionRaw === "undefined" ? null : Number(positionRaw) || null;
      const homework =
        typeof ov.homework !== "undefined"
          ? ov.homework
          : typeof base.homework !== "undefined"
            ? base.homework
            : undefined;
      lessons.push({
        lesson_number: lessonNumber,
        position,
        title: String(ov.title || base.title || `Theme: Lesson ${lessonNumber}`),
        cover: String(ov.cover || base.cover || ""),
        video: String(ov.video || base.video || ""),
        ...(typeof homework !== "undefined" ? { homework } : {}),
      });
    });

  lessons.sort((a, b) => {
    const aKey = Number.isFinite(a.position) && a.position ? a.position : 10000 + a.lesson_number;
    const bKey = Number.isFinite(b.position) && b.position ? b.position : 10000 + b.lesson_number;
    return aKey - bKey;
  });

  const byNumber = {};
  lessons.forEach((item) => {
    byNumber[item.lesson_number] = item;
  });
  const merged = { list: lessons, byNumber };
  MERGED_LESSONS_CACHE[safeCourse] = merged;
  return merged;
};

const invalidateLessonsCache = (course) => {
  const normalizedCourse = String(course || "").trim().toLowerCase();
  if (normalizedCourse && COURSE_CODES.includes(normalizedCourse)) {
    delete LESSON_OVERRIDES_CACHE[normalizedCourse];
    delete MERGED_LESSONS_CACHE[normalizedCourse];
  }
};

const getSessionTokenFromStorage = () => {
  const raw = localStorage.getItem(ACCESS_AUTH_STORAGE_KEY);
  if (!raw) {
    return "";
  }
  try {
    const parsed = JSON.parse(raw);
    return String(parsed.sessionToken || parsed.session_token || "").trim();
  } catch (error) {
    return "";
  }
};

const getCourseFromPathname = () => {
  const path = (window.location.pathname || "").toLowerCase();
  const match = path.match(/\/(a1|a2|b1|b2)(\.html)?\/?$/);
  return match ? match[1] : "";
};

const fetchLessonAccess = async (course, lessonNumber) => {
  const normalizedCourse = String(course || "").trim().toLowerCase();
  const safeCourse = COURSE_CODES.includes(normalizedCourse) ? normalizedCourse : "";
  const sessionToken = getSessionTokenFromStorage();
  await ensureApiBaseUrl();

  try {
    const response = await fetchWithTimeout(
      `${ACCESS_API_BASE_URL}/api/access/check`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          course: safeCourse,
          lesson_number: lessonNumber,
          session_token: sessionToken,
        }),
      },
      5000
    );
    if (!response.ok) {
      return { allowed: false, status: response.status };
    }
    const payload = await response.json();
    return payload || { allowed: false };
  } catch (error) {
    return { allowed: false, network_error: true };
  }
};

const getLocalAuthRole = () => {
  const raw = localStorage.getItem(ACCESS_AUTH_STORAGE_KEY);
  if (!raw) {
    return "";
  }
  try {
    const parsed = JSON.parse(raw);
    return String(parsed && parsed.role ? parsed.role : "").trim().toLowerCase();
  } catch (error) {
    return "";
  }
};

const isLocalHost = () => {
  const host = String(window.location.hostname || "").toLowerCase();
  return host === "localhost" || host === "127.0.0.1" || host === "";
};

const checkServerLessonAccess = async (course, lessonNumber) => {
  const payload = await fetchLessonAccess(course, lessonNumber);
  if (payload && payload.allowed) {
    return true;
  }
  if (getLocalAuthRole() === "admin") {
    return true;
  }
  if (isLocalHost() && payload && payload.guest_mode && payload.reason === "login_required") {
    return true;
  }
  if (isLocalHost() && payload && payload.reason === "scheduled") {
    return true;
  }
  if (isLocalHost() && payload && payload.reason === "level_mismatch") {
    return true;
  }
  if (payload && payload.network_error && isLocalHost()) {
    return true;
  }
  return false;
};

const getLessonCompletionStorageKey = (course, lessonNumber, username) =>
  `ewms_lesson_completed:${String(course || "").toLowerCase()}:${Number(lessonNumber) || 1}:${username || "guest"}`;

const markLessonCompletedLocal = (course, lessonNumber) => {
  const authState = getAuthState();
  const username = authState && authState.username ? authState.username : "guest";
  const key = getLessonCompletionStorageKey(course, lessonNumber, username);
  try {
    localStorage.setItem(key, "1");
  } catch (error) {
    // Ignore storage failures.
  }
};

const isLessonCompletedLocal = (course, lessonNumber) => {
  const authState = getAuthState();
  const username = authState && authState.username ? authState.username : "guest";
  const key = getLessonCompletionStorageKey(course, lessonNumber, username);
  try {
    return localStorage.getItem(key) === "1";
  } catch (error) {
    return false;
  }
};

const unmarkLessonCompletedLocal = (course, lessonNumber) => {
  const authState = getAuthState();
  const username = authState && authState.username ? authState.username : "guest";
  const key = getLessonCompletionStorageKey(course, lessonNumber, username);
  try {
    localStorage.removeItem(key);
  } catch (error) {
    // Ignore storage failures.
  }
};

const isBekzodAccount = (authState) => String(authState && authState.username ? authState.username : "").trim().toLowerCase() === "bekzod";

const enforceBekzodLessonCompletionOverride = (lessonsPageEl, course) => {
  if (!lessonsPageEl || !course) {
    return;
  }
  const authState = getAuthState();
  if (!authState || !isBekzodAccount(authState)) {
    return;
  }

  // For testing: keep only Lesson 1 marked as completed for Bekzod.
  try {
    markLessonCompletedLocal(course, 1);
  } catch (error) {
    // ignore
  }

  const lessonButtons = lessonsPageEl.querySelectorAll(".lesson-watch-btn");
  lessonButtons.forEach((button) => {
    const href = button.dataset.originalHref || button.getAttribute("href") || "";
    let lessonNumber = 1;
    try {
      const url = new URL(href, window.location.href);
      lessonNumber = Number(url.searchParams.get("lesson")) || 1;
    } catch (error) {
      lessonNumber = 1;
    }
    if (lessonNumber > 1) {
      try {
        unmarkLessonCompletedLocal(course, lessonNumber);
      } catch (error) {
        // ignore
      }
    }
  });
};

const lessonPage = document.querySelector("[data-lesson-page]");
if (lessonPage) {
  const params = new URLSearchParams(window.location.search);
  const course = (params.get("course") || "a1").toLowerCase();
  const lessonNumber = Number(params.get("lesson")) || 1;
  const isEditMode = params.get("edit") === "1";

  // Set correct hrefs immediately (synchronously) — no server data needed for these URLs
  const _tasksBtn = document.getElementById("go-tasks-btn");
  const _presentationBtn = document.getElementById("lesson-presentation-btn");
  const _backBtn = document.getElementById("back-lessons-btn");
  const _homeworkBtn = document.getElementById("lesson-homework-btn");
  if (_tasksBtn) {
    _tasksBtn.href = `tasks.html?course=${course}&lesson=${lessonNumber}&open=quiz`;
    _tasksBtn.classList.remove("is-loading");
    _tasksBtn.removeAttribute("aria-disabled");
  }
  if (_backBtn) {
    _backBtn.href = `${course}.html`;
  }
  if (_homeworkBtn) {
    _homeworkBtn.classList.remove("is-loading");
    _homeworkBtn.disabled = false;
  }
  if (_presentationBtn) {
    _presentationBtn.href = `presentation.html?course=${course}&lesson=${lessonNumber}`;
    // presentationBtn stays is-loading until API confirms availability
  }

  (async () => {
    const hasAccess = await checkServerLessonAccess(course, lessonNumber);
    if (!hasAccess) {
      window.location.href = `${course}.html`;
      return;
    }

    const mergedLessons = await mergeCourseLessons(course);
    const lessonData =
      mergedLessons.byNumber[lessonNumber] || mergedLessons.byNumber[1] || (LESSONS_BY_COURSE[course] || a1Lessons)[1];

    const titleEl = document.getElementById("lesson-title");
    const videoEl = document.getElementById("lesson-video");
    const sourceEl = document.getElementById("lesson-video-source");
    const embedEl = document.getElementById("lesson-video-embed");
    const coverEl = document.getElementById("lesson-video-cover");
    const tasksBtn = document.getElementById("go-tasks-btn");
    const homeworkBtn = document.getElementById("lesson-homework-btn");
    const backBtn = document.getElementById("back-lessons-btn");
    const presentationBtn = document.getElementById("lesson-presentation-btn");
    const homeworkGateModal = document.getElementById("homework-gate-modal");
    const homeworkGateTasksBtn = document.getElementById("homework-gate-tasks");
    const homeworkGateCloseBtn = document.getElementById("homework-gate-close");
    const fallbackCoverUrl = "assets/images/cover.jpg";
    let ytPlayer = null;
    let ytPlayRequested = false;
    let embedUrl = "";

    const hideCover = () => {
      if (coverEl) {
        coverEl.classList.add("is-hidden");
      }
    };

    const showCover = () => {
      if (coverEl) {
        coverEl.classList.remove("is-hidden");
      }
    };

    const setCoverImage = (url) => {
      if (!coverEl) {
        return;
      }
      if (url) {
        coverEl.style.setProperty("--lesson-cover-image", `url("${url}")`);
        coverEl.style.backgroundImage = `url("${url}")`;
      } else {
        coverEl.style.removeProperty("--lesson-cover-image");
        coverEl.style.backgroundImage = "none";
      }
    };

    if (titleEl) {
      titleEl.textContent = lessonData.title;
    }

    const isYoutubeVideo = isYouTubeUrl(lessonData.video);
    const coverUrl =
      lessonData.cover || (isYoutubeVideo ? getYouTubeCoverUrl(lessonData.video) : fallbackCoverUrl);
    setCoverImage(coverUrl);
    showCover();
    if (videoEl && !isYoutubeVideo && coverUrl) {
      videoEl.setAttribute("poster", coverUrl);
    }
    if (coverEl) {
      coverEl.addEventListener("click", () => {
        hideCover();
        if (isYoutubeVideo) {
          if (ytPlayer && typeof ytPlayer.playVideo === "function") {
            ytPlayer.playVideo();
          } else {
            ytPlayRequested = true;
            const iframe = embedEl ? embedEl.querySelector("iframe") : null;
            if (iframe && embedUrl) {
              const separator = embedUrl.includes("?") ? "&" : "?";
              const autoplayUrl = `${embedUrl}${separator}autoplay=1`;
              if (iframe.src !== autoplayUrl) {
                iframe.src = autoplayUrl;
              }
            }
          }
        } else if (videoEl) {
          const playAttempt = videoEl.play();
          if (playAttempt && typeof playAttempt.catch === "function") {
            playAttempt.catch(() => {});
          }
        }
      });
    }
    if (videoEl) {
      videoEl.addEventListener("play", hideCover);
    }

    if (isYoutubeVideo && embedEl) {
      if (videoEl) {
        if (typeof videoEl.pause === "function") {
          videoEl.pause();
        }
        videoEl.removeAttribute("src");
        if (typeof videoEl.load === "function") {
          videoEl.load();
        }
        videoEl.remove();
      }
      embedEl.hidden = false;
      embedUrl = getYouTubeEmbedUrl(lessonData.video);
      const playerId = "lesson-youtube-player";
      const initPlayer = () => {
        if (!window.YT || !window.YT.Player) {
          return;
        }
        embedEl.innerHTML = `<div id="${playerId}"></div>`;
        const player = new window.YT.Player(playerId, {
          videoId: extractYouTubeId(lessonData.video),
          playerVars: {
            rel: 0,
            modestbranding: 1,
            playsinline: 1,
          },
        });
        ytPlayer = player;
        player.addEventListener("onReady", () => {
          if (ytPlayRequested) {
            player.playVideo();
          }
        });
        player.addEventListener("onStateChange", (event) => {
          if (event && window.YT && event.data === window.YT.PlayerState.PLAYING) {
            hideCover();
          }
        });
        setupYouTubeTracking(player, course, lessonNumber);
      };
      loadYouTubeApi().then(initPlayer);
      if (embedUrl && embedEl.querySelector("iframe") === null) {
        // fallback while API loads
        embedEl.innerHTML = `<iframe src="${embedUrl}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
      }
    } else if (sourceEl && videoEl) {
      if (embedEl) {
        embedEl.hidden = true;
        embedEl.innerHTML = "";
      }
      videoEl.hidden = false;
      sourceEl.src = lessonData.video;
      videoEl.load();
    }

    if (tasksBtn) {
      tasksBtn.href = `tasks.html?course=${course}&lesson=${lessonNumber}&open=quiz`;
      tasksBtn.classList.remove("is-loading");
      tasksBtn.removeAttribute("aria-disabled");
    }
    if (homeworkBtn) {
      homeworkBtn.classList.remove("is-loading");
      homeworkBtn.disabled = false;
    }

    const tasksUrl = `tasks.html?course=${course}&lesson=${lessonNumber}`;
    const homeworkUrl = `${tasksUrl}&open=homework`;

	    const isFinalLesson = Number(FINAL_LESSON_BY_COURSE[course] || 0) === lessonNumber;
	    if (isFinalLesson && tasksBtn) {
	      tasksBtn.textContent = "Finish the Course";
	      tasksBtn.href = `${course}.html?celebrate=1`;
	      tasksBtn.classList.add("lesson-nav-btn-finish");
	      tasksBtn.classList.remove("lesson-nav-btn-primary");
	      const actionsWrap = tasksBtn.closest(".lesson-player-actions");
	      if (actionsWrap) {
	        Array.from(actionsWrap.children).forEach((child) => {
	          if (child !== tasksBtn) {
	            child.remove();
	          }
	        });
	      }
	      tasksBtn.addEventListener("click", (event) => {
	        event.preventDefault();
	        markLessonCompletedLocal(course, lessonNumber);
	        window.location.href = `${course}.html?celebrate=1`;
	      });
	    }

    const openHomeworkGate = () => {
      if (!homeworkGateModal) {
        return;
      }
      homeworkGateModal.classList.add("is-open");
      homeworkGateModal.setAttribute("aria-hidden", "false");
    };

    const closeHomeworkGate = () => {
      if (!homeworkGateModal) {
        return;
      }
      homeworkGateModal.classList.remove("is-open");
      homeworkGateModal.setAttribute("aria-hidden", "true");
    };

    const fetchQuizExists = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/quiz/questions?course=${encodeURIComponent(course)}&lesson=${encodeURIComponent(
            lessonNumber
          )}`
        );
        if (!response.ok) {
          throw new Error("quiz_not_ok");
        }
        const payload = await response.json();
        return !!(payload && Array.isArray(payload.questions) && payload.questions.length > 0);
      } catch (error) {
        try {
          const localUrl = `backend/quizzes/${encodeURIComponent(course)}/lesson-${encodeURIComponent(lessonNumber)}.json`;
          const resp = await fetch(localUrl);
          if (!resp.ok) return false;
          const json = await resp.json();
          return Array.isArray(json) && json.length > 0;
        } catch (err) {
          return false;
        }
      }
    };

    const fetchQuizStatus = async () => {
      const username = getAuthUser();
      if (!username) {
        return { has_attempt: false };
      }
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/quiz/status?username=${encodeURIComponent(username)}&course=${encodeURIComponent(
            course
          )}&lesson=${encodeURIComponent(lessonNumber)}`
        );
        if (!response.ok) {
          return { has_attempt: false };
        }
        const payload = await response.json();
        if (!payload || typeof payload !== "object") {
          return { has_attempt: false };
        }
        return payload;
      } catch (error) {
        return { has_attempt: false };
      }
    };

    const handleHomeworkClick = async () => {
      if (isFinalLesson) {
        return;
      }
      if (getLocalAuthRole() === "admin" || (typeof isAdminUser === "function" && isAdminUser())) {
        window.location.href = homeworkUrl;
        return;
      }
      await ensureApiBaseUrl();
      const quizExists = await fetchQuizExists();
      if (!quizExists) {
        window.location.href = homeworkUrl;
        return;
      }
      const status = await fetchQuizStatus();
      if (status && status.has_attempt) {
        window.location.href = homeworkUrl;
        return;
      }
      openHomeworkGate();
    };

    if (homeworkBtn) {
      homeworkBtn.addEventListener("click", async () => {
        homeworkBtn.disabled = true;
        try {
          await handleHomeworkClick();
        } finally {
          homeworkBtn.disabled = false;
        }
      });
    }

    if (homeworkGateTasksBtn) {
      homeworkGateTasksBtn.addEventListener("click", () => {
        window.location.href = `${tasksUrl}&open=quiz`;
      });
    }

    if (homeworkGateCloseBtn) {
      homeworkGateCloseBtn.addEventListener("click", () => {
        closeHomeworkGate();
      });
    }

    if (homeworkGateModal) {
      homeworkGateModal.addEventListener("click", (event) => {
        if (event.target === homeworkGateModal) {
          closeHomeworkGate();
        }
      });
    }

    if (backBtn) {
      backBtn.href = `${course}.html`;
    }

    if (presentationBtn) {
      if (typeof getPresentationUrl === "function" && getPresentationUrl(course, lessonNumber) === "") {
        presentationBtn.hidden = true;
        presentationBtn.classList.remove("is-loading");
      } else {
      const ua = typeof navigator !== "undefined" ? navigator.userAgent || "" : "";
      const isIOS = /iPad|iPhone|iPod/i.test(ua) ||
        (typeof navigator !== "undefined" &&
          navigator.platform === "MacIntel" &&
          typeof navigator.maxTouchPoints === "number" &&
          navigator.maxTouchPoints > 1);

      const isSmallScreen =
        typeof window !== "undefined" &&
        typeof window.matchMedia === "function" &&
        window.matchMedia("(max-width: 640px)").matches;

      const fallbackPresentationUrl = `presentation.html?course=${encodeURIComponent(course)}&lesson=${lessonNumber}`;
      presentationBtn.href = fallbackPresentationUrl;

      // If static file defined in presentations.js — show button immediately, no API needed
      const hasStaticFile = typeof getPresentationFile === "function" && Boolean(getPresentationFile(course, lessonNumber));
      if (hasStaticFile) {
        const staticFile = getPresentationFile(course, lessonNumber);
        const staticUrl = `/assets/presentations/${encodeURIComponent(staticFile)}`;
        if (isIOS || isSmallScreen) {
          presentationBtn.href = staticUrl;
        } else {
          presentationBtn.href = fallbackPresentationUrl;
        }
        presentationBtn.classList.remove("is-loading");
        presentationBtn.removeAttribute("aria-disabled");
        presentationBtn.hidden = false;
      } else {
      // No static file — ask Railway (Edit Menu uploads)
      (async () => {
        try {
          await ensureApiBaseUrl();
          const resp = await fetchWithTimeout(
            `${API_BASE_URL}/api/presentation/info?course=${encodeURIComponent(course)}&lesson=${encodeURIComponent(
              lessonNumber
            )}`,
            {},
            3500
          );
          const info = await resp.json().catch(() => ({}));
          if (!resp.ok || !info || !info.available) {
            presentationBtn.hidden = true;
            return;
          }
          const url = typeof info.url === "string" ? info.url : "";
          const absoluteUrl = url
            ? url.startsWith("http")
              ? url
              : url.startsWith("/backend/uploads/")
                ? `${API_BASE_URL}${url}`
                : url
            : "";
          if (absoluteUrl && (isIOS || isSmallScreen)) {
            presentationBtn.href = absoluteUrl;
          } else {
            presentationBtn.href = fallbackPresentationUrl;
          }
          presentationBtn.classList.remove("is-loading");
          presentationBtn.removeAttribute("aria-disabled");
          presentationBtn.hidden = false;
        } catch (error) {
          presentationBtn.classList.remove("is-loading");
          presentationBtn.removeAttribute("aria-disabled");
          presentationBtn.hidden = false;
        }
      })();
      }
      } // end else (getPresentationUrl check)
    }

    if (videoEl && !isYoutubeVideo) {
      const tracker = createVideoProgressTracker(
        course,
        lessonNumber,
        () => videoEl.currentTime,
        () => videoEl.duration
      );
      if (tracker) {
        videoEl.addEventListener("loadedmetadata", () => {
          tracker.sendProgress(true);
        });

        videoEl.addEventListener("timeupdate", () => {
          tracker.recordTick();
        });

        videoEl.addEventListener("pause", () => {
          tracker.sendProgress(true);
        });

        videoEl.addEventListener("ended", () => {
          tracker.markEnded();
        });

        window.addEventListener("beforeunload", () => {
          tracker.sendProgress(true);
        });

        document.addEventListener("visibilitychange", () => {
          if (document.visibilityState === "hidden") {
            tracker.sendProgress(true);
          }
        });
      }
    }
  })();
}

const presentationPage = document.querySelector("[data-presentation-page]");
if (presentationPage) {
  const params = new URLSearchParams(window.location.search);
  const course = (params.get("course") || "a1").toLowerCase();
  const lessonNumber = Number(params.get("lesson")) || 1;
  const titleEl = document.getElementById("presentation-title");
  const noteEl = document.getElementById("presentation-note");
  const frameEl = document.getElementById("presentation-frame");
  const openBtn = document.getElementById("presentation-open-btn");
  const backBtn = document.getElementById("presentation-back-btn");

  (async () => {
    const mergedLessons = await mergeCourseLessons(course);
    const lessonData =
      mergedLessons.byNumber[lessonNumber] ||
      mergedLessons.byNumber[1] ||
      (LESSONS_BY_COURSE[course] || a1Lessons)[1];
    if (titleEl) {
      titleEl.textContent = `Lesson ${lessonNumber}: ${(lessonData.title || "").replace("Theme: ", "")}`;
    }
    if (backBtn) {
      backBtn.href = `lesson.html?course=${course}&lesson=${lessonNumber}`;
    }
    if (noteEl) {
      noteEl.textContent = "";
    }
    let pdfUrl = "";

    // If a static file is defined in presentations.js — use it directly from Vercel, no API call needed
    const staticPresentationFile = typeof getPresentationFile === "function" ? getPresentationFile(course, lessonNumber) : "";
    if (staticPresentationFile) {
      pdfUrl = `/assets/presentations/${encodeURIComponent(staticPresentationFile)}`;
    }

    // For lessons without a static file — ask Railway (Edit Menu uploads)
    if (!pdfUrl) {
      try {
        await ensureApiBaseUrl();
        const resp = await fetchWithTimeout(
          `${API_BASE_URL}/api/presentation/info?course=${encodeURIComponent(course)}&lesson=${encodeURIComponent(
            lessonNumber
          )}`,
          {},
          6000
        );
        const info = await resp.json().catch(() => ({}));
        if (resp.ok && info && info.available && typeof info.url === "string" && info.url) {
          const rawUrl = info.url;
          if (rawUrl.startsWith("http")) {
            pdfUrl = rawUrl;
          } else if (rawUrl.startsWith("/backend/uploads/")) {
            pdfUrl = `${API_BASE_URL}${rawUrl}`;
          } else {
            pdfUrl = rawUrl;
          }
        }
      } catch (error) {
        // ignore
      }
    }

    if (!pdfUrl) {
      const presentationFile = typeof getPresentationFile === "function" ? getPresentationFile(course, lessonNumber) : "";
      if (presentationFile) {
        pdfUrl = `/assets/presentations/${encodeURIComponent(presentationFile)}`;
      }
    }

    if (!pdfUrl) {
      if (noteEl) {
        noteEl.textContent = "Presentation not available.";
      }
      return;
    }
    const ua = typeof navigator !== "undefined" ? navigator.userAgent || "" : "";
    const isIOS =
      /iPad|iPhone|iPod/i.test(ua) ||
      // iPadOS may report as Mac, but has touch points
      (typeof navigator !== "undefined" &&
        navigator.platform === "MacIntel" &&
        typeof navigator.maxTouchPoints === "number" &&
        navigator.maxTouchPoints > 1);

    const isSmallScreen =
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(max-width: 640px)").matches;

    if (isIOS || isSmallScreen) {
      presentationPage.classList.add("is-fullscreen");
      if (document.body) {
        document.body.classList.add("presentation-fullscreen");
      }
    }

    if (openBtn) {
      openBtn.href = pdfUrl;
      // Desktop: hide "Open presentation" (iframe works there).
      // Mobile/iOS: keep as optional fallback "open full screen".
      openBtn.hidden = !(isIOS || isSmallScreen);
      if (isIOS || isSmallScreen) {
        // Open in the same tab so the browser "Back" arrow returns to the lesson.
        openBtn.target = "_self";
      }
    }

    if (!frameEl) {
      return;
    }

    // Mobile: show the PDF immediately (no "empty window"), keep toolbar to allow zoom/share.
    // Desktop: use a cleaner embedded view (no toolbar).
    const src = isSmallScreen || isIOS ? pdfUrl : `${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH&zoom=page-width`;
    frameEl.hidden = false;
    frameEl.src = src;
    if (noteEl) {
      noteEl.textContent =
        isIOS || isSmallScreen
          ? "Если неудобно внутри страницы — нажмите “Open presentation”. Чтобы вернуться к уроку, нажмите “Back to lesson” сверху или стрелку “Назад” в браузере."
          : "";
    }
  })();

  presentationPage.addEventListener("contextmenu", (event) => {
    event.preventDefault();
  });
  presentationPage.addEventListener("copy", (event) => {
    event.preventDefault();
  });
  presentationPage.addEventListener("cut", (event) => {
    event.preventDefault();
  });
  presentationPage.addEventListener("selectstart", (event) => {
    event.preventDefault();
  });
  presentationPage.addEventListener("dragstart", (event) => {
    event.preventDefault();
  });
  presentationPage.addEventListener("keydown", (event) => {
    const key = event.key.toLowerCase();
    const isModifier = event.ctrlKey || event.metaKey;
    if (isModifier && ["s", "p", "c", "x", "a", "u"].includes(key)) {
      event.preventDefault();
    }
    if (isModifier && event.shiftKey && ["i", "j", "c"].includes(key)) {
      event.preventDefault();
    }
    if (event.key === "F12") {
      event.preventDefault();
    }
  });
}

const tasksPage = document.querySelector("[data-tasks-page]");
if (tasksPage) {
  if (tasksPage.dataset.quizInitialized === "1") {
    // Guard against duplicate script execution attaching duplicate handlers.
  } else {
    tasksPage.dataset.quizInitialized = "1";
  }
  const params = new URLSearchParams(window.location.search);
  const course = (params.get("course") || "a1").toLowerCase();
  const lessonNumber = Number(params.get("lesson")) || 1;
  const isEditMode = params.get("edit") === "1";
  (async () => {
    try {
      const hasAccess = await checkServerLessonAccess(course, lessonNumber);
      if (!hasAccess) {
        window.location.href = `${course}.html`;
        return;
      }

  const mergedLessons = await mergeCourseLessons(course);
  let lessonData =
    mergedLessons.byNumber[lessonNumber] || mergedLessons.byNumber[1] || (LESSONS_BY_COURSE[course] || a1Lessons)[1];

  const titleEl = document.getElementById("tasks-title");
  const descriptionEl = document.getElementById("tasks-description");
  const runtimeStatusEl = document.getElementById("tasks-runtime-status");
  const openLessonBtn = document.getElementById("tasks-open-lesson-btn");
  const backBtn = document.getElementById("tasks-back-btn");
  const defaultCard = document.getElementById("tasks-default-card");
  const openQuizBtn = document.getElementById("tasks-open-quiz-btn");

  const quizCard = document.getElementById("alphabet-quiz-card");
  const quizLessonTitle = document.getElementById("quiz-lesson-title");
  const quizOpenLessonBtn = document.getElementById("quiz-open-lesson-btn");
  const quizTaskNumber = document.getElementById("quiz-task-number");
  const quizQuestion = document.getElementById("quiz-question");
  const quizOptions = document.getElementById("quiz-options");
  const quizCheckBtn = document.getElementById("quiz-check-btn");
  const quizStatus = document.getElementById("quiz-status");
  const quizPrevBtn = document.getElementById("quiz-prev-btn");
  const quizNextBtn = document.getElementById("quiz-next-btn");
  const quizExplainBtn = document.getElementById("quiz-explain-btn");
  const quizCounter = document.getElementById("quiz-counter");
  const quizFinalResult = document.getElementById("quiz-final-result");
  const quizRetryModal = document.getElementById("quiz-retry-modal");
  const quizModalRetryBtn = document.getElementById("quiz-modal-retry-btn");
  const quizModalTheoryBtn = document.getElementById("quiz-modal-theory-btn");
  const quizExplainModal = document.getElementById("quiz-explain-modal");
  const quizExplainCloseBtn = document.getElementById("quiz-explain-close");
  const quizExplainQuestion = document.getElementById("quiz-explain-question");
  const quizExplainText = document.getElementById("quiz-explain-text");
  const quizExplainOptions = document.querySelectorAll(".quiz-explain-option");
  const quizExplainLangWrap = document.getElementById("quiz-explain-lang");
  const quizExplainLangTrigger = document.getElementById("quiz-explain-lang-trigger");
  const quizExplainLangValue = document.getElementById("quiz-explain-lang-value");
  const quizExplainLangFlag = document.getElementById("quiz-explain-lang-flag");
  const quizExplainLangList = document.getElementById("quiz-explain-lang-list");
  const quizExplainLangItems = document.querySelectorAll(".quiz-explain-lang-item");
  const quizExplainNote = document.getElementById("quiz-explain-note");
  const quizExplainAsk = document.querySelector(".quiz-explain-ask");
  const quizExplainLangLabel = document.querySelector(".quiz-explain-lang-label");
  const homeworkModal = document.getElementById("homework-modal");
  const homeworkCloseBtn = document.getElementById("homework-close");
  const homeworkTitle = document.getElementById("homework-title");
  const homeworkSubtitle = document.getElementById("homework-subtitle");
  const homeworkList = document.getElementById("homework-list");
  const homeworkText = document.getElementById("homework-text");
  const homeworkFile = document.getElementById("homework-file");
  const homeworkFileList = document.getElementById("homework-file-list");
  const homeworkUploadBtn = document.getElementById("homework-upload-btn");
  const homeworkBackBtn = document.getElementById("homework-back-btn");
  const homeworkStatus = document.getElementById("homework-status");
  const homeworkNote = document.getElementById("homework-note");

  // Multiple file selection for homework.
  let homeworkSelectedFiles = [];
  let homeworkSelectedFileKeys = new Set();
  const getHomeworkFileKey = (file) => {
    if (!file) return "";
    return `${String(file.name || "")}:${Number(file.size || 0)}:${Number(file.lastModified || 0)}`;
  };
  const renderHomeworkFileList = () => {
    if (!homeworkFileList) return;
    if (!Array.isArray(homeworkSelectedFiles) || homeworkSelectedFiles.length === 0) {
      homeworkFileList.innerHTML = "";
      homeworkFileList.hidden = true;
      return;
    }
    homeworkFileList.hidden = false;
    homeworkFileList.innerHTML = homeworkSelectedFiles
      .map(
        (file, index) => `
        <div class="homework-file-item" data-file-idx="${escapeHtml(String(index))}">
          <span class="homework-file-name">${escapeHtml(String(file && file.name ? file.name : "-"))}</span>
          <button type="button" class="homework-file-remove" data-remove-idx="${escapeHtml(String(index))}" aria-label="Remove file">×</button>
        </div>
      `
      )
      .join("");
  };
  const clearHomeworkSelectedFiles = () => {
    homeworkSelectedFiles = [];
    homeworkSelectedFileKeys = new Set();
    if (homeworkFile) {
      homeworkFile.value = "";
    }
    renderHomeworkFileList();
  };
  const goToLessonPage = () => {
    window.location.href = `lesson.html?course=${course}&lesson=${lessonNumber}`;
  };

  const setRuntimeStatus = (message, tone = "") => {
    if (!runtimeStatusEl) return;
    const text = String(message || "").trim();
    runtimeStatusEl.textContent = text;
    runtimeStatusEl.hidden = !text;
    runtimeStatusEl.classList.remove("is-error");
    if (tone === "error") runtimeStatusEl.classList.add("is-error");
  };

  if (runtimeStatusEl && runtimeStatusEl.dataset.bound_errors !== "1") {
    runtimeStatusEl.dataset.bound_errors = "1";
    window.addEventListener("error", (event) => {
      const msg = event && event.message ? String(event.message) : "Unknown script error";
      setRuntimeStatus(`JS error: ${msg}`, "error");
    });
    window.addEventListener("unhandledrejection", (event) => {
      const reason = event && "reason" in event ? event.reason : null;
      const msg = reason && reason.message ? String(reason.message) : String(reason || "Unknown promise rejection");
      setRuntimeStatus(`JS promise error: ${msg}`, "error");
    });
  }

  if (titleEl) {
    titleEl.textContent = `Tasks: Lesson ${lessonNumber}`;
  }

  if (descriptionEl) {
    descriptionEl.textContent = `Practice tasks for "${lessonData.title.replace("Theme: ", "")}".`;
  }

  if (openLessonBtn) {
    openLessonBtn.href = `lesson.html?course=${course}&lesson=${lessonNumber}`;
  }

  if (backBtn) {
    if (isEditMode) {
      backBtn.href = `${course}.html?admin_open_lesson=${encodeURIComponent(String(lessonNumber))}`;
      backBtn.textContent = "Close";
    } else {
      backBtn.href = `${course}.html`;
    }
  }

  const DEFAULT_HOMEWORK_TASKS = [
    {
      title: "Vocabulary focus",
      detail: "Pick 12 new words/phrases from the lesson, add translations, and write 1 short example for each.",
    },
    {
      title: "Grammar in action",
      detail: "Write 8 sentences using the new grammar. At least 3 must be questions.",
    },
    {
      title: "Speaking: 90 seconds",
      detail: "Record a 60-90 second audio on the lesson topic. Use at least 5 new words.",
    },
    {
      title: "Writing: mini story",
      detail: "Write 80-100 words on the topic. Watch tenses and linking words.",
    },
    {
      title: "Self-check",
      detail: "Create 5 questions about the topic and answer them.",
    },
  ];

  const HOMEWORK_MAX_BYTES = 10 * 1024 * 1024;
  const HOMEWORK_ALLOWED_EXTENSIONS = new Set([
    ".pdf",
    ".doc",
    ".docx",
    ".jpg",
    ".jpeg",
    ".png",
    ".mp3",
    ".m4a",
    ".wav",
  ]);

  if (homeworkFile && homeworkFile.dataset.boundMultiFiles !== "1") {
    homeworkFile.dataset.boundMultiFiles = "1";
    homeworkFile.addEventListener("change", () => {
      const picked = homeworkFile.files ? Array.from(homeworkFile.files) : [];
      if (picked.length) {
        picked.forEach((file) => {
          const key = getHomeworkFileKey(file);
          if (!key || homeworkSelectedFileKeys.has(key)) return;
          homeworkSelectedFileKeys.add(key);
          homeworkSelectedFiles.push(file);
        });
        renderHomeworkFileList();
        setHomeworkStatus("");
      }
      // Reset input so selecting the same file again still triggers "change".
      homeworkFile.value = "";
    });
  }

  if (homeworkFileList && homeworkFileList.dataset.boundMultiFiles !== "1") {
    homeworkFileList.dataset.boundMultiFiles = "1";
    homeworkFileList.addEventListener("click", (event) => {
      const target = event.target;
      const btn = target && target.closest ? target.closest(".homework-file-remove[data-remove-idx]") : null;
      if (!btn) return;
      const idx = Number(btn.getAttribute("data-remove-idx") || -1);
      if (!Number.isFinite(idx) || idx < 0 || idx >= homeworkSelectedFiles.length) return;
      homeworkSelectedFiles.splice(idx, 1);
      homeworkSelectedFileKeys = new Set(homeworkSelectedFiles.map((f) => getHomeworkFileKey(f)).filter(Boolean));
      renderHomeworkFileList();
      setHomeworkStatus("");
    });
  }

  const normalizeHomeworkTasks = (rawTasks) => {
    if (!Array.isArray(rawTasks) || rawTasks.length === 0) {
      return DEFAULT_HOMEWORK_TASKS;
    }
    return rawTasks.map((item, index) => {
    const fallbackTitle = `Task ${index + 1}`;
      if (typeof item === "string") {
        return { title: fallbackTitle, detail: item };
      }
      if (!item || typeof item !== "object") {
        return { title: fallbackTitle, detail: "" };
      }
      const title = String(item.title || item.name || item.label || fallbackTitle).trim();
      const detail = String(item.detail || item.text || item.description || "").trim();
      return { title: title || fallbackTitle, detail };
    });
  };

	  // Admin: edit homework tasks (not quiz questions).
	  let adminHomeworkEditorState = null;
	  let homeworkCompletionKeys = new Set();
	  let homeworkCompletionLoaded = false;
	  let homeworkCompletionLoading = false;
	  let homeworkCompletionUsername = "";

	  const slugifyTaskKeyPart = (value) =>
	    String(value || "")
	      .trim()
	      .toLowerCase()
	      .replace(/[^a-z0-9]+/g, "-")
	      .replace(/^-+|-+$/g, "")
	      .slice(0, 30);

	  const buildHomeworkTaskKey = (task, index) => {
	    const slug = slugifyTaskKeyPart(task && task.title ? task.title : "");
	    return `homework:${index + 1}:${slug || "task"}`;
	  };

	  const loadHomeworkTaskCompletions = async () => {
	    const username = getAuthUser();
	    if (!username) {
	      homeworkCompletionKeys = new Set();
	      homeworkCompletionLoaded = true;
	      homeworkCompletionLoading = false;
	      homeworkCompletionUsername = "";
	      return;
	    }
	    const keyUsername = String(username).trim().toLowerCase();
	    if (homeworkCompletionLoaded && homeworkCompletionUsername === keyUsername) {
	      return;
	    }
	    if (homeworkCompletionLoading) {
	      return;
	    }
	    homeworkCompletionLoading = true;
	    try {
	      await ensureApiBaseUrl();
	      const response = await fetch(
	        `${API_BASE_URL}/api/task/completions?username=${encodeURIComponent(username)}`
	      );
	      if (!response.ok) {
	        homeworkCompletionKeys = new Set();
	        homeworkCompletionLoaded = true;
	        homeworkCompletionUsername = keyUsername;
	        return;
	      }
	      const payload = await response.json().catch(() => ({}));
	      const items = Array.isArray(payload.items) ? payload.items : [];
	      const next = new Set();
	      items.forEach((item) => {
	        const itemCourse = normalizeCourseLevel(item && item.course ? item.course : "");
	        const itemLesson = Number(item && item.lesson_number ? item.lesson_number : 0);
	        const taskKey = String(item && item.task_key ? item.task_key : "").trim();
	        if (!taskKey) return;
	        if (itemCourse === course && itemLesson === lessonNumber) {
	          next.add(taskKey);
	        }
	      });
	      homeworkCompletionKeys = next;
	      homeworkCompletionLoaded = true;
	      homeworkCompletionUsername = keyUsername;
	    } catch (error) {
	      homeworkCompletionKeys = new Set();
	      homeworkCompletionLoaded = true;
	      homeworkCompletionUsername = keyUsername;
	    } finally {
	      homeworkCompletionLoading = false;
	    }
	  };

		  const saveHomeworkTaskCompletion = async (taskKey) => {
		    const username = getAuthUser();
		    if (!username) {
		      setHomeworkStatus("Please log in to save homework progress.", "error");
		      return false;
		    }
	    try {
	      await ensureApiBaseUrl();
	      const response = await fetch(`${API_BASE_URL}/api/task/complete`, {
	        method: "POST",
	        headers: {
	          "Content-Type": "application/json",
	        },
	        body: JSON.stringify({
	          username,
	          course,
	          lesson_number: lessonNumber,
	          task_key: taskKey,
	        }),
	      });
	      if (!response.ok) {
	        setHomeworkStatus("Could not save task completion.", "error");
	        return false;
	      }
	      homeworkCompletionKeys.add(taskKey);
	      setHomeworkStatus("Task marked as completed.", "success");
	      void checkAchievementsForUser(username, { notify: true, suppressIfNoCache: false });
	      return true;
	    } catch (error) {
	      setHomeworkStatus("Auth server is not running.", "error");
	      return false;
	    }
		  };

		  const removeHomeworkTaskCompletion = async (taskKey) => {
		    const username = getAuthUser();
		    if (!username) {
		      setHomeworkStatus("Please log in to save homework progress.", "error");
		      return false;
		    }
		    try {
		      await ensureApiBaseUrl();
		      const response = await fetch(`${API_BASE_URL}/api/task/uncomplete`, {
		        method: "POST",
		        headers: {
		          "Content-Type": "application/json",
		        },
		        body: JSON.stringify({
		          username,
		          course,
		          lesson_number: lessonNumber,
		          task_key: taskKey,
		        }),
		      });
		      if (!response.ok) {
		        setHomeworkStatus("Could not update task completion.", "error");
		        return false;
		      }
		      homeworkCompletionKeys.delete(taskKey);
		      setHomeworkStatus("Task marked as not completed.", "success");
		      return true;
		    } catch (error) {
		      setHomeworkStatus("Auth server is not running.", "error");
		      return false;
		    }
		  };

		  const bindHomeworkCompletionHandlers = () => {
		    if (!homeworkList) return;
		    if (homeworkList.dataset && homeworkList.dataset.completionBound === "1") return;
		    if (homeworkList.dataset) {
		      homeworkList.dataset.completionBound = "1";
		    }
		    homeworkList.addEventListener("change", async (event) => {
		      const target = event.target;
		      if (!target || !target.classList || !target.classList.contains("homework-task-checkbox")) {
		        return;
		      }
		      const taskKey = String(target.dataset.taskKey || "").trim();
		      if (!taskKey) return;
		      target.disabled = true;
		      if (target.checked) {
		        const ok = await saveHomeworkTaskCompletion(taskKey);
		        if (!ok) {
		          target.disabled = false;
		          target.checked = false;
		          return;
		        }
		        const label = target.closest(".homework-task-check");
		        const text = label ? label.querySelector("span") : null;
		        if (text) text.textContent = "Completed";
		        const item = target.closest(".homework-item");
		        if (item) item.classList.add("is-completed");
		        target.disabled = false;
		        return;
		      }

		      const ok = await removeHomeworkTaskCompletion(taskKey);
		      if (!ok) {
		        target.disabled = false;
		        target.checked = true;
		        return;
		      }
		      const label = target.closest(".homework-task-check");
		      const text = label ? label.querySelector("span") : null;
		      if (text) text.textContent = "Mark as completed";
		      const item = target.closest(".homework-item");
		      if (item) item.classList.remove("is-completed");
		      target.disabled = false;
		    });
		  };
  const ensureAdminHomeworkEditorModal = () => {
    if (document.getElementById("admin-homework-editor-modal")) {
      return;
    }
    const wrap = document.createElement("div");
    wrap.innerHTML = `
      <div id="admin-homework-editor-modal" class="admin-lessons-modal" aria-hidden="true">
        <div class="admin-quiz-editor-card admin-homework-editor-card" role="dialog" aria-modal="true" aria-label="Edit homework">
          <div class="admin-quiz-topbar">
            <div class="admin-quiz-topbar-left">
              <span class="admin-quiz-q-label">Homework</span>
            </div>
            <div class="admin-quiz-topbar-right">
              <button type="button" class="btn admin-lessons-secondary" data-admin-close="homework-editor">Close</button>
            </div>
          </div>
          <div id="admin-homework-editor-list" class="admin-homework-editor-list"></div>
          <div class="admin-quiz-footer">
            <div class="admin-quiz-nav">
              <button id="admin-homework-add" type="button" class="btn admin-lessons-secondary">+ Add</button>
            </div>
            <div class="admin-quiz-save-wrap">
              <p id="admin-homework-status" class="admin-lessons-status" aria-live="polite"></p>
              <button id="admin-homework-save" type="button" class="btn admin-lessons-primary">Save</button>
            </div>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(wrap);
  };

  const renderAdminHomeworkEditor = () => {
    if (!adminHomeworkEditorState) return;
    const listEl = document.getElementById("admin-homework-editor-list");
    if (!listEl) return;
    listEl.innerHTML = "";
    adminHomeworkEditorState.tasks.forEach((task, idx) => {
      const row = document.createElement("div");
      row.className = "admin-homework-editor-row";
      row.innerHTML = `
        <div class="admin-homework-editor-index">${idx + 1}</div>
        <div class="admin-homework-editor-fields">
          <input class="admin-lessons-input admin-homework-title" type="text" placeholder="Title" value="${escapeHtml(
            String(task.title || "")
          )}">
          <textarea class="admin-quiz-textarea admin-homework-detail" rows="3" placeholder="Detail">${escapeHtml(
            String(task.detail || "")
          )}</textarea>
        </div>
        <div class="admin-homework-editor-actions">
          <button type="button" class="btn admin-lessons-secondary admin-homework-remove" data-idx="${idx}">Remove</button>
        </div>
      `;
      listEl.appendChild(row);
    });
  };

  const markAdminHomeworkDirty = () => {
    if (!adminHomeworkEditorState) return;
    const jsonNow = JSON.stringify(adminHomeworkEditorState.tasks || []);
    adminHomeworkEditorState.dirty = jsonNow !== adminHomeworkEditorState.initialJson;
  };

  const collectAdminHomeworkEditor = () => {
    if (!adminHomeworkEditorState) return;
    const listEl = document.getElementById("admin-homework-editor-list");
    if (!listEl) return;
    const rows = Array.from(listEl.querySelectorAll(".admin-homework-editor-row"));
    const next = [];
    rows.forEach((row, idx) => {
      const titleEl = row.querySelector(".admin-homework-title");
      const detailEl = row.querySelector(".admin-homework-detail");
      const title = String((titleEl && titleEl.value) || "").trim();
      const detail = String((detailEl && detailEl.value) || "").trim();
      if (!title && !detail) {
        return;
      }
      next.push({ title: title || `Task ${idx + 1}`, detail });
    });
    adminHomeworkEditorState.tasks = next;
    markAdminHomeworkDirty();
  };

  const openAdminHomeworkEditor = () => {
    const authState = getAuthState();
    if (!(authState && authState.role === "admin" && authState.username)) return;
    ensureAdminHomeworkEditorModal();
    const statusEl = document.getElementById("admin-homework-status");
    if (statusEl) statusEl.textContent = "";
    const tasks = normalizeHomeworkTasks(lessonData?.homework).map((t) => ({ title: t.title, detail: t.detail }));
    adminHomeworkEditorState = {
      course,
      lessonNumber,
      adminUsername: authState.username,
      tasks,
      initialJson: JSON.stringify(tasks),
      dirty: false,
      saving: false,
    };
    renderAdminHomeworkEditor();
    openAdminModal("admin-homework-editor-modal");
  };

  const requestCloseAdminHomeworkEditor = async () => {
    if (!adminHomeworkEditorState) {
      closeAdminModal("admin-homework-editor-modal");
      return;
    }
    collectAdminHomeworkEditor();
    if (adminHomeworkEditorState.dirty) {
      const proceed = window.confirm("You have unsaved changes. Save them?");
      if (proceed) {
        const saveBtn = document.getElementById("admin-homework-save");
        if (saveBtn) {
          saveBtn.click();
          return;
        }
      }
    }
    closeAdminModal("admin-homework-editor-modal");
    adminHomeworkEditorState = null;
  };

  // Wire homework editor buttons once.
  (() => {
    const already = document.body && document.body.dataset.homeworkAdminBound === "1";
    if (already) return;
    if (document.body) document.body.dataset.homeworkAdminBound = "1";
    document.addEventListener("click", async (event) => {
      const target = event.target;
      const closeBtn = target && target.closest ? target.closest('[data-admin-close="homework-editor"]') : null;
      if (closeBtn) {
        await requestCloseAdminHomeworkEditor();
        return;
      }
      if (!adminHomeworkEditorState) return;
      const id = target && target.id;
      if (id === "admin-homework-add") {
        collectAdminHomeworkEditor();
        adminHomeworkEditorState.tasks.push({ title: `Task ${adminHomeworkEditorState.tasks.length + 1}`, detail: "" });
        renderAdminHomeworkEditor();
        markAdminHomeworkDirty();
        return;
      }
      if (id === "admin-homework-save") {
        if (adminHomeworkEditorState.saving) return;
        collectAdminHomeworkEditor();
        adminHomeworkEditorState.saving = true;
        const statusEl = document.getElementById("admin-homework-status");
        if (statusEl) statusEl.textContent = "Saving...";
        const result = await adminPostJson(
          "/api/admin/lessons/homework/save",
          {
            admin_username: adminHomeworkEditorState.adminUsername,
            course: adminHomeworkEditorState.course,
            lesson_number: adminHomeworkEditorState.lessonNumber,
            homework: adminHomeworkEditorState.tasks,
          },
          15000
        );
        adminHomeworkEditorState.saving = false;
        if (!result.ok) {
          const err = (result.data && result.data.error) || "save_failed";
          if (statusEl) {
            statusEl.textContent =
              err === "not found"
                ? "Server is running an old version. Restart backend and try again."
                : err === "network_error"
                  ? "Network error. Is the backend running?"
                  : err;
          }
          return;
        }
        if (statusEl) statusEl.textContent = "Saved.";
        invalidateLessonsCache(course);
        const merged = await mergeCourseLessons(course);
        lessonData =
          merged.byNumber[lessonNumber] || merged.byNumber[1] || (LESSONS_BY_COURSE[course] || a1Lessons)[1];
        renderHomework();
        closeAdminModal("admin-homework-editor-modal");
        adminHomeworkEditorState = null;
        return;
      }
      const removeBtn = target && target.closest ? target.closest(".admin-homework-remove") : null;
      if (removeBtn) {
        if (!window.confirm("Remove this task?")) return;
        const idx = Number(removeBtn.getAttribute("data-idx")) || 0;
        collectAdminHomeworkEditor();
        adminHomeworkEditorState.tasks.splice(idx, 1);
        renderAdminHomeworkEditor();
        markAdminHomeworkDirty();
      }
    });
  })();

	  const renderHomework = () => {
    if (!homeworkTitle && !homeworkSubtitle && !homeworkList) {
      return;
    }
    setHomeworkStatus("");
    const lessonLabel = String(lessonData?.title || "")
      .replace("Theme: ", "")
      .trim();
    if (homeworkTitle) {
      homeworkTitle.textContent = `Homework: Lesson ${lessonNumber}`;
    }
    if (homeworkSubtitle) {
      homeworkSubtitle.textContent = lessonLabel
        ? `Topic: ${lessonLabel}. Complete the tasks and submit them for review.`
        : "Complete the tasks and submit them for review.";
    }
    if (homeworkBackBtn) {
      homeworkBackBtn.href = `${course}.html`;
    }
    if (homeworkNote) {
      homeworkNote.textContent =
        "Submit your text and, if needed, a file. A mentor or AI will review it.";
    }
    if (!homeworkList) {
      return;
    }
    homeworkList.innerHTML = "";
    const tasks = normalizeHomeworkTasks(lessonData?.homework);
    const username = getAuthUser();
    const canCompleteTasks = !!username;
    const completionKeys = homeworkCompletionKeys || new Set();
    const isCompletionLoading = canCompleteTasks && !homeworkCompletionLoaded;
    tasks.forEach((task, index) => {
      const item = document.createElement("div");
      item.className = "homework-item";

      const itemIndex = document.createElement("div");
      itemIndex.className = "homework-item-index";
      itemIndex.textContent = String(index + 1);

      const textWrap = document.createElement("div");
      const titleEl = document.createElement("p");
      titleEl.className = "homework-item-title";
      titleEl.textContent = task.title || `Task ${index + 1}`;

      const detailEl = document.createElement("p");
      detailEl.className = "homework-item-desc";
      detailEl.textContent = task.detail || "";

      textWrap.appendChild(titleEl);
      textWrap.appendChild(detailEl);

      const actionsRow = document.createElement("div");
      actionsRow.className = "homework-item-actions";

      const taskKey = buildHomeworkTaskKey(task, index);
      const isCompleted = completionKeys.has(taskKey);
      item.classList.toggle("is-completed", isCompleted);

      const checkLabel = document.createElement("label");
      checkLabel.className = "homework-task-check";
      const checkInput = document.createElement("input");
      checkInput.type = "checkbox";
	      checkInput.className = "homework-task-checkbox";
	      checkInput.dataset.taskKey = taskKey;
	      checkInput.checked = isCompleted;
	      checkInput.disabled = isCompletionLoading || !canCompleteTasks;

      const checkText = document.createElement("span");
      if (!canCompleteTasks) {
        checkText.textContent = "Login to mark completed";
      } else if (isCompletionLoading) {
        checkText.textContent = "Loading…";
      } else {
        checkText.textContent = isCompleted ? "Completed" : "Mark as completed";
      }

      checkLabel.appendChild(checkInput);
      checkLabel.appendChild(checkText);
      actionsRow.appendChild(checkLabel);
      textWrap.appendChild(actionsRow);

      item.appendChild(itemIndex);
      item.appendChild(textWrap);
      homeworkList.appendChild(item);
    });
	  };

	  const openHomeworkModal = () => {
	    if (!homeworkModal) {
	      return;
	    }
    const existingEditBtn = document.getElementById("admin-homework-edit-btn");
    if (existingEditBtn && !isEditMode) {
      existingEditBtn.remove();
    }
    // Admin: show "Edit homework" entrypoint inside the homework dialog.
    const authState = getAuthState();
    if (isEditMode && authState && authState.role === "admin" && authState.username) {
      const header = homeworkModal.querySelector(".homework-header");
      if (header && !document.getElementById("admin-homework-edit-btn")) {
        const btn = document.createElement("button");
        btn.id = "admin-homework-edit-btn";
        btn.type = "button";
        btn.className = "btn admin-homework-edit-btn";
        btn.textContent = "Edit homework";
        btn.addEventListener("click", () => openAdminHomeworkEditor());
        const closeBtn = document.getElementById("homework-close");
        if (closeBtn && closeBtn.parentNode === header) {
          closeBtn.insertAdjacentElement("beforebegin", btn);
        } else {
          header.appendChild(btn);
        }
      }
	    }
		    bindHomeworkCompletionHandlers();
		    renderHomework();
		    void loadHomeworkTaskCompletions().then(() => renderHomework());
		    syncHomeworkSubmittedUi();
		    homeworkModal.classList.add("is-open");
		    homeworkModal.setAttribute("aria-hidden", "false");
		  };

  const closeHomeworkModal = () => {
    if (!homeworkModal) {
      return;
    }
    if (isEditMode) {
      homeworkModal.classList.remove("is-open");
      homeworkModal.setAttribute("aria-hidden", "true");
      window.location.href = `${course}.html?admin_open_lesson=${encodeURIComponent(String(lessonNumber))}`;
      return;
    }
    homeworkModal.classList.remove("is-open");
    homeworkModal.setAttribute("aria-hidden", "true");
    if (typeof openHomeworkOnly !== "undefined" && openHomeworkOnly) {
      window.location.href = `${course}.html`;
      return;
    }
  };

  const setHomeworkStatus = (message, tone = "") => {
    if (!homeworkStatus) {
      return;
    }
    homeworkStatus.textContent = message || "";
    homeworkStatus.classList.remove("is-success", "is-error");
    if (tone === "success") {
      homeworkStatus.classList.add("is-success");
    } else if (tone === "error") {
      homeworkStatus.classList.add("is-error");
    }
  };

  const getHomeworkFileExtension = (name) => {
    const raw = String(name || "").trim().toLowerCase();
    if (!raw || !raw.includes(".")) {
      return "";
    }
    return `.${raw.split(".").pop()}`;
  };

  const readFileAsDataUrl = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error("file_read_error"));
      reader.readAsDataURL(file);
    });

  const ensureHomeworkSentModal = () => {
    if (document.getElementById("homework-sent-modal")) {
      return;
    }
	    const modalHtml = `
	      <div id="homework-sent-modal" class="subscription-sent-modal" aria-hidden="true">
	        <div class="subscription-sent-card" role="dialog" aria-modal="true" aria-labelledby="homework-sent-title">
	          <div class="subscription-sent-icon" aria-hidden="true"></div>
	          <h3 id="homework-sent-title">Homework sent</h3>
	          <p id="homework-sent-text">Your homework has been sent. We will review it soon.</p>
	          <button type="button" class="btn subscription-sent-back-btn" id="homework-sent-back-btn">Back to lessons</button>
	        </div>
	      </div>
	    `;
    document.body.insertAdjacentHTML("beforeend", modalHtml);
    const modal = document.getElementById("homework-sent-modal");
    const backBtn = document.getElementById("homework-sent-back-btn");
    if (backBtn) {
      backBtn.addEventListener("click", () => {
        if (modal) {
          modal.classList.remove("is-open");
          modal.setAttribute("aria-hidden", "true");
        }
        window.location.href = `${course}.html`;
      });
    }
    if (modal) {
      modal.addEventListener("click", (event) => {
        if (event.target === modal) {
          modal.classList.remove("is-open");
          modal.setAttribute("aria-hidden", "true");
          syncModalBodyScroll();
        }
      });
    }
  };

	  const openHomeworkSentModal = () => {
	    ensureHomeworkSentModal();
	    const modal = document.getElementById("homework-sent-modal");
	    if (!modal) return;
	    modal.classList.add("is-open");
	    modal.setAttribute("aria-hidden", "false");
	    syncModalBodyScroll();
	  };

	  const getHomeworkSubmittedStorageKey = (username) => {
	    const userKey = String(username || "").trim().toLowerCase();
	    return `ewms_homework_submitted:${userKey}:${course}:${lessonNumber}`;
	  };

	  const syncHomeworkSubmittedUi = () => {
	    if (!homeworkUploadBtn) return;
	    const username = getAuthUser();
	    if (!username) {
	      homeworkUploadBtn.disabled = false;
	      homeworkUploadBtn.classList.remove("is-submitted");
	      homeworkUploadBtn.textContent = "Submit homework";
	      return;
	    }
	    const submitted = !!window.localStorage.getItem(getHomeworkSubmittedStorageKey(username));
	    if (submitted) {
	      homeworkUploadBtn.disabled = true;
	      homeworkUploadBtn.classList.add("is-submitted");
	      homeworkUploadBtn.textContent = "Submitted";
	    } else {
	      homeworkUploadBtn.disabled = false;
	      homeworkUploadBtn.classList.remove("is-submitted");
	      homeworkUploadBtn.textContent = "Submit homework";
	    }
	  };

	  const submitHomework = async () => {
	    const username = getAuthUser();
	    if (!username) {
	      setHomeworkStatus("Please log in to submit homework.", "error");
	      return;
	    }
	    const submittedKey = getHomeworkSubmittedStorageKey(username);
	    if (window.localStorage.getItem(submittedKey)) {
	      syncHomeworkSubmittedUi();
	      return;
	    }

	    const textValue = String(homeworkText?.value || "").trim();
	    if (!textValue) {
	      setHomeworkStatus("Please add your homework text.", "error");
      return;
    }

    const filesPayload = [];
    if (Array.isArray(homeworkSelectedFiles) && homeworkSelectedFiles.length) {
      for (const file of homeworkSelectedFiles) {
        if (!file) continue;
        if (file.size > HOMEWORK_MAX_BYTES) {
          setHomeworkStatus(`"${file.name}" is too large. Max 10 MB per file.`, "error");
          return;
        }
        const extension = getHomeworkFileExtension(file.name);
        if (extension && !HOMEWORK_ALLOWED_EXTENSIONS.has(extension)) {
          setHomeworkStatus(`"${file.name}" format is not supported.`, "error");
          return;
        }
        try {
          const dataUrl = await readFileAsDataUrl(file);
          filesPayload.push({
            file_name: file.name,
            file_type: file.type || "",
            file_data: dataUrl,
          });
        } catch (error) {
          setHomeworkStatus(`Could not read "${file.name}".`, "error");
          return;
        }
      }
    }

	    if (homeworkUploadBtn) {
	      homeworkUploadBtn.disabled = true;
	      homeworkUploadBtn.classList.remove("is-submitted");
	      homeworkUploadBtn.textContent = "Sending...";
	    }
	    setHomeworkStatus("Sending homework...");

	    try {
	      const response = await fetch(`${API_BASE_URL}/api/homework/submit`, {
	        method: "POST",
	        headers: {
	          "Content-Type": "application/json",
        },
        body: JSON.stringify((() => {
          const base = {
            username,
            course,
            lesson_number: lessonNumber,
            text: textValue,
          };
          if (filesPayload.length) {
            base.files = filesPayload;
            // Backwards-compatible fields (single attachment).
            if (filesPayload.length === 1) {
              base.file_name = filesPayload[0].file_name;
              base.file_type = filesPayload[0].file_type;
              base.file_data = filesPayload[0].file_data;
            }
          }
          return base;
        })()),
      });

	      const payload = await response.json().catch(() => ({}));
	      if (!response.ok) {
	        if (response.status === 409) {
	          window.localStorage.setItem(submittedKey, new Date().toISOString());
	          syncHomeworkSubmittedUi();
	          return;
	        }
	        setHomeworkStatus(payload.error || "Could not submit homework.", "error");
	        return;
	      }

	      window.localStorage.setItem(
	        submittedKey,
	        String(payload && payload.id ? payload.id : "") || new Date().toISOString()
	      );
	      syncHomeworkSubmittedUi();
	      setHomeworkStatus("", "");
      openHomeworkSentModal();
      if (homeworkText) {
        homeworkText.value = "";
      }
      clearHomeworkSelectedFiles();
	    } catch (error) {
	      setHomeworkStatus("Auth server is not running.", "error");
	    } finally {
	      if (homeworkUploadBtn) {
	        syncHomeworkSubmittedUi();
	      }
	    }
	  };

  if (homeworkCloseBtn) {
    homeworkCloseBtn.addEventListener("click", () => {
      closeHomeworkModal();
    });
  }

  if (homeworkModal) {
    homeworkModal.addEventListener("click", (event) => {
      if (event.target === homeworkModal) {
        closeHomeworkModal();
      }
    });
  }

  if (homeworkUploadBtn) {
    homeworkUploadBtn.addEventListener("click", () => {
      void submitHomework();
    });
  }

  renderHomework();

  const saveLessonCompletion = async (targetStatusEl = null, taskKey = "lesson_completed") => {
    const username = getAuthUser();
    if (!username) {
      if (targetStatusEl) {
        targetStatusEl.textContent = "Login required to save lesson progress.";
      }
      return false;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/task/complete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          course,
          lesson_number: lessonNumber,
          task_key: taskKey,
        }),
      });

      if (!response.ok) {
        if (targetStatusEl) {
          targetStatusEl.textContent = "Could not save lesson progress.";
        }
        return false;
      }

      if (targetStatusEl) {
        targetStatusEl.textContent = "Lesson marked as completed.";
      }
      void checkAchievementsForUser(username, { notify: true, suppressIfNoCache: false });
      return true;
    } catch (error) {
      if (targetStatusEl) {
        targetStatusEl.textContent = "Auth server is not running.";
      }
      return false;
    }
  };

  const fetchQuizQuestions = async (targetCourse, targetLesson) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/quiz/questions?course=${encodeURIComponent(targetCourse)}&lesson=${encodeURIComponent(
          targetLesson
        )}`
      );
      if (!response.ok) {
        throw new Error("quiz_not_ok");
      }
      const payload = await response.json();
      if (!payload || !Array.isArray(payload.questions)) {
        throw new Error("quiz_bad_payload");
      }
      return payload.questions;
    } catch (error) {
      try {
        const localUrl = `backend/quizzes/${encodeURIComponent(targetCourse)}/lesson-${encodeURIComponent(
          targetLesson
        )}.json`;
        const resp = await fetch(localUrl);
        if (!resp.ok) return [];
        const json = await resp.json();
        return Array.isArray(json) ? json : [];
      } catch (err) {
        return [];
      }
    }
  };

  const fetchQuizStatus = async (targetCourse, targetLesson) => {
    const username = getAuthUser();
    if (!username) {
      return { has_attempt: false };
    }
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/quiz/status?username=${encodeURIComponent(username)}&course=${encodeURIComponent(
          targetCourse
        )}&lesson=${encodeURIComponent(targetLesson)}`
      );
      if (!response.ok) {
        return { has_attempt: false };
      }
      const payload = await response.json();
      if (!payload || typeof payload !== "object") {
        return { has_attempt: false };
      }
      return payload;
    } catch (error) {
      return { has_attempt: false };
    }
  };

  await ensureApiBaseUrl();
  const loadedQuestions = await fetchQuizQuestions(course, lessonNumber);
  const hasQuiz = loadedQuestions.length > 0;
  setRuntimeStatus(
    hasQuiz
      ? `Tests loaded: ${loadedQuestions.length}`
      : `Tests not found for this lesson (course=${course}, lesson=${lessonNumber}).`,
    hasQuiz ? "" : "error"
  );
  const quizStatusPayload = hasQuiz ? await fetchQuizStatus(course, lessonNumber) : { has_attempt: false };
  const hasQuizAttempt = !!(quizStatusPayload && quizStatusPayload.has_attempt);
  const openParam = params.get("open") || "";
  const openHomeworkOnly = openParam.toLowerCase() === "homework";
  const openQuizOnly = ["quiz", "tests", "test"].includes(openParam.toLowerCase());
  const isAdminRole = () => {
    const authState = getAuthState();
    const authRole = authState && authState.role ? String(authState.role).toLowerCase() : "";
    return authRole === "admin" || getLocalAuthRole() === "admin";
  };

  if (!hasQuiz) {
    if (quizCard) {
      quizCard.hidden = true;
    }
    if (defaultCard) {
      defaultCard.hidden = false;
    }
    if (openQuizBtn) {
      openQuizBtn.hidden = true;
    }
    if (openHomeworkOnly) {
      openHomeworkModal();
    }
    return;
  }

  const showTasksCard = () => {
    if (defaultCard) defaultCard.hidden = false;
    if (quizCard) quizCard.hidden = true;
  };

  const showQuizCard = () => {
    if (defaultCard) defaultCard.hidden = true;
    if (quizCard) quizCard.hidden = false;
  };

  if (openQuizBtn) {
    openQuizBtn.addEventListener("click", () => {
      showQuizCard();
      if (quizCard && typeof quizCard.scrollIntoView === "function") {
        quizCard.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  }

  // No "Tasks" button inside the quiz topbar (exit is "Back to lesson").

  // Default: tasks page shows tests only if requested via ?open=quiz.
  if (openQuizOnly) {
    showQuizCard();
  } else {
    showTasksCard();
  }

  // Always allow taking the quiz when opening tasks.

  if (openHomeworkOnly) {
    openHomeworkModal();
    if (!isEditMode && hasQuiz && !hasQuizAttempt && !isAdminRole()) {
      setHomeworkStatus("Complete the quiz first to unlock homework submission.", "error");
      if (homeworkUploadBtn) {
        homeworkUploadBtn.disabled = true;
      }
    }
  }
  if (quizLessonTitle) {
    quizLessonTitle.textContent = `${lessonData.title.replace("Theme: ", "")} - Tests`;
  }
  if (quizOpenLessonBtn) {
    quizOpenLessonBtn.href = `${course}.html`;
    quizOpenLessonBtn.textContent = "Close";
  }
  if (quizModalTheoryBtn) {
    quizModalTheoryBtn.href = `lesson.html?course=${course}&lesson=${lessonNumber}`;
  }

  quizQuestions = loadedQuestions;

    const state = {
      currentIndex: 0,
      answers: {},
      gapAnswers: {},
      checked: {},
      solved: {},
      firstAttemptLogged: {},
      firstAttempts: {},
      explanationUnlocked: {},
      isSubmitted: false,
    };
    const validQuestionIds = new Set(quizQuestions.map((item) => Number(item.id)));
    const getQuizStateStorageKey = () => {
      const username = getAuthUser() || "guest";
      return `ewms_quiz_state:${course}:${lessonNumber}:${username}`;
    };
    const sanitizeOptionMap = (source) => {
      const result = {};
      if (!source || typeof source !== "object") {
        return result;
      }
      Object.entries(source).forEach(([key, value]) => {
        const qid = Number(key);
        const option = String(value || "").trim().toUpperCase();
        if (
          validQuestionIds.has(qid) &&
          (option === "A" || option === "B" || option === "C" || option === "D")
        ) {
          result[qid] = option;
        }
      });
      return result;
    };
    const sanitizeBooleanMap = (source) => {
      const result = {};
      if (!source || typeof source !== "object") {
        return result;
      }
      Object.entries(source).forEach(([key, value]) => {
        const qid = Number(key);
        if (validQuestionIds.has(qid) && !!value) {
          result[qid] = true;
        }
      });
      return result;
    };
    const sanitizeTextMap = (source) => {
      const result = {};
      if (!source || typeof source !== "object") {
        return result;
      }
      Object.entries(source).forEach(([key, value]) => {
        const qid = Number(key);
        if (validQuestionIds.has(qid) && typeof value === "string") {
          result[qid] = value;
        }
      });
      return result;
    };
    const persistQuizState = () => {
      try {
        if (state.isSubmitted) {
          sessionStorage.removeItem(getQuizStateStorageKey());
          return;
        }
        sessionStorage.setItem(
          getQuizStateStorageKey(),
          JSON.stringify({
            currentIndex: state.currentIndex,
            answers: state.answers,
            gapAnswers: state.gapAnswers,
            checked: state.checked,
            solved: state.solved,
            firstAttemptLogged: state.firstAttemptLogged,
            firstAttempts: state.firstAttempts,
            explanationUnlocked: state.explanationUnlocked,
          })
        );
      } catch (error) {
        // Ignore storage failures.
      }
    };
    const restoreQuizState = () => {
      try {
        const raw = sessionStorage.getItem(getQuizStateStorageKey());
        if (!raw) {
          return;
        }
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== "object") {
          return;
        }
        const total = quizQuestions.length;
        const idx = Number(parsed.currentIndex);
        if (Number.isInteger(idx) && idx >= 0 && idx < total) {
          state.currentIndex = idx;
        }
        state.answers = sanitizeOptionMap(parsed.answers);
        state.gapAnswers = sanitizeTextMap(parsed.gapAnswers);
        state.firstAttempts = sanitizeOptionMap(parsed.firstAttempts);
        state.checked = sanitizeBooleanMap(parsed.checked);
        state.solved = sanitizeBooleanMap(parsed.solved);
        state.firstAttemptLogged = sanitizeBooleanMap(parsed.firstAttemptLogged);
        state.explanationUnlocked = sanitizeBooleanMap(parsed.explanationUnlocked);
      } catch (error) {
        // Ignore invalid persisted payloads.
      }
    };

    const resetQuizState = () => {
      state.currentIndex = 0;
      state.answers = {};
      state.checked = {};
      state.solved = {};
      state.firstAttemptLogged = {};
      state.firstAttempts = {};
      state.explanationUnlocked = {};
      state.isSubmitted = false;
      try {
        sessionStorage.removeItem(getQuizStateStorageKey());
      } catch (error) {
        // Ignore storage failures.
      }
    };

    const openRetryModal = () => {
      if (!quizRetryModal) {
        return;
      }
      quizRetryModal.classList.add("is-open");
      quizRetryModal.setAttribute("aria-hidden", "false");
    };

    const closeRetryModal = () => {
      if (!quizRetryModal) {
        return;
      }
      quizRetryModal.classList.remove("is-open");
      quizRetryModal.setAttribute("aria-hidden", "true");
    };

    const openExplainModal = () => {
      if (!quizExplainModal) {
        return;
      }
      quizExplainModal.classList.add("is-open");
      quizExplainModal.setAttribute("aria-hidden", "false");
    };

    const closeExplainModal = () => {
      if (!quizExplainModal) {
        return;
      }
      quizExplainModal.classList.remove("is-open");
      quizExplainModal.setAttribute("aria-hidden", "true");
      closeExplainLangList();
    };

    const getQuestionExplanation = (question) => {
      if (!question || typeof question !== "object") {
        return "Review the rule and choose the option that fits.";
      }
      const explicit = typeof question.explanation === "string" ? question.explanation.trim() : "";
      if (explicit) {
        return explicit;
      }
      return "Review the rule and choose the option that fits.";
    };

	    const explainLangLabels = {
	      en: "Eng",
	      ru: "Русский",
	      uz: "O'zbekcha",
	    };

    const explainLangFlagClasses = {
      en: "lang-flag--eng",
      ru: "lang-flag--rus",
      uz: "lang-flag--uzb",
    };

    const explainUiLabels = {
      en: {
        ask: "Need it simpler or more detailed?",
        simple: "Simpler",
        detailed: "More detail",
        langLabel: "Language",
        noteSimple: "Simpler version.",
        noteDetailed: "More detailed version.",
        noteMain: "",
      },
      ru: {
        ask: "Нужно проще или подробнее?",
        simple: "Проще",
        detailed: "Подробнее",
        langLabel: "Язык",
        noteSimple: "Упрощённая версия.",
        noteDetailed: "Подробная версия.",
        noteMain: "",
      },
      uz: {
        ask: "Soddaroq yoki batafsilroq kerakmi?",
        simple: "Osonroq",
        detailed: "Batafsil",
        langLabel: "Til",
        noteSimple: "Soddalashtirilgan variant.",
        noteDetailed: "Batafsil versiya.",
        noteMain: "",
      },
    };

    const updateExplainUiLanguage = (lang) => {
      const labels = explainUiLabels[lang] || explainUiLabels.en;
      if (quizExplainAsk) {
        quizExplainAsk.textContent = labels.ask;
      }
      if (quizExplainLangLabel) {
        quizExplainLangLabel.textContent = labels.langLabel;
      }
      if (quizExplainOptions && quizExplainOptions.length > 0) {
        quizExplainOptions.forEach((button) => {
          const mode = button.dataset.explainMode || "main";
          if (mode === "simple") {
            button.textContent = labels.simple;
          } else if (mode === "detailed") {
            button.textContent = labels.detailed;
          }
        });
      }
    };

    const extractFirstSentence = (text) => {
      const trimmed = String(text || "").trim();
      if (!trimmed) {
        return "";
      }
      const match = trimmed.match(/^(.*?[.!?])\s/);
      return match ? match[1].trim() : trimmed;
    };

	    const collectExplanationTranslations = (question) => {
	      const translations = {};
	      if (!question || typeof question !== "object") {
	        return translations;
	      }
	      const raw = question.explanation_translations;
	      if (raw && typeof raw === "object") {
	        Object.entries(raw).forEach(([key, value]) => {
	          const langKey = String(key || "").trim().toLowerCase();
	          if (!langKey) {
	            return;
	          }
	          if (typeof value === "string") {
	            const langText = value.trim();
	            if (langText) {
	              translations[langKey] = langText;
	            }
	            return;
	          }
	          if (value && typeof value === "object") {
	            const normalized = {};
	            Object.entries(value).forEach(([modeKey, modeValue]) => {
	              const mode = String(modeKey || "").trim().toLowerCase();
	              const text = typeof modeValue === "string" ? modeValue.trim() : "";
	              if (mode && text) {
	                normalized[mode] = text;
	              }
	            });
	            if (Object.keys(normalized).length > 0) {
	              translations[langKey] = normalized;
	            }
	          }
	        });
	      }
	      ["ru", "uz", "en"].forEach((langKey) => {
	        const inline = typeof question[`explanation_${langKey}`] === "string" ? question[`explanation_${langKey}`].trim() : "";
	        if (inline) {
	          translations[langKey] = inline;
	        }
	      });
	      return translations;
	    };

	    const supportedExplainLanguages = ["en", "ru", "uz"];

	    const explainFallbackNotes = {
	      en: "",
	      ru: "Перевода пока нет — показан английский.",
	      uz: "Tarjima hali yo‘q — inglizcha ko‘rsatilgan.",
	    };

	    const pickExplainTranslation = (question, lang, mode) => {
	      if (!question || !lang || lang === "en") {
	        return "";
	      }
	      const translations = collectExplanationTranslations(question);
	      const entry = translations[lang];
	      if (!entry) {
	        return "";
	      }
	      const normalizedMode = mode === "main" ? "main" : String(mode || "main").trim().toLowerCase();
	      if (typeof entry === "string") {
	        return normalizedMode === "main" ? entry : "";
	      }
	      if (!entry || typeof entry !== "object") {
	        return "";
	      }
	      if (normalizedMode === "simple") {
	        return String(entry.simple || entry.explanation_simple || "").trim();
	      }
	      if (normalizedMode === "detailed") {
	        return String(entry.detailed || entry.explanation_detailed || "").trim();
	      }
	      return String(entry.main || entry.explanation || entry.text || "").trim();
	    };

    const updateExplainLangTrigger = (lang) => {
      if (!quizExplainLangValue || !quizExplainLangFlag) {
        return;
      }
      const label = explainLangLabels[lang] || lang.toUpperCase();
      quizExplainLangValue.textContent = label;
      const flagClass = explainLangFlagClasses[lang];
      quizExplainLangFlag.className = `lang-flag ${flagClass || "lang-flag--eng"}`;
      updateExplainUiLanguage(lang);
      if (quizExplainLangItems && quizExplainLangItems.length > 0) {
        quizExplainLangItems.forEach((item) => {
          const isActive = item.dataset.lang === lang;
          item.classList.toggle("is-active", isActive);
          item.setAttribute("aria-selected", isActive ? "true" : "false");
        });
      }
    };

    let activeExplainQuestion = null;
    let activeExplainMode = "main";
    let activeExplainLang = "en";

    const updateExplainButtons = (mode) => {
      if (!quizExplainOptions || quizExplainOptions.length === 0) {
        return;
      }
      quizExplainOptions.forEach((button) => {
        button.classList.toggle("is-active", button.dataset.explainMode === mode);
      });
    };

    const closeExplainLangList = () => {
      if (!quizExplainLangList || !quizExplainLangTrigger) {
        return;
      }
      quizExplainLangList.classList.remove("is-open");
      quizExplainLangTrigger.setAttribute("aria-expanded", "false");
    };

    const toggleExplainLangList = () => {
      if (!quizExplainLangList || !quizExplainLangTrigger) {
        return;
      }
      const isOpen = quizExplainLangList.classList.toggle("is-open");
      quizExplainLangTrigger.setAttribute("aria-expanded", isOpen ? "true" : "false");
    };

	    const setExplainMode = (question, mode, lang = "") => {
	      if (!question) {
	        return;
	      }
	      activeExplainQuestion = question;
	      activeExplainMode = mode;

      const baseText = getQuestionExplanation(question);
      let displayText = baseText;
      let noteText = "";
      const uiLabels = explainUiLabels[activeExplainLang] || explainUiLabels.en;

	      if (mode === "simple") {
	        const simple = typeof question.explanation_simple === "string" ? question.explanation_simple.trim() : "";
	        if (simple) {
	          displayText = simple;
	          noteText = uiLabels.noteSimple || "";
	        } else {
	          const shorter = extractFirstSentence(baseText);
	          displayText = shorter || baseText;
	          noteText = uiLabels.noteSimple || "";
	        }
	      } else if (mode === "detailed") {
	        const detailed = typeof question.explanation_detailed === "string" ? question.explanation_detailed.trim() : "";
	        if (detailed) {
	          displayText = detailed;
	          noteText = uiLabels.noteDetailed || "";
	        } else {
	          displayText = baseText;
	          noteText = uiLabels.noteDetailed || "";
	        }
	      }

	      const translated = pickExplainTranslation(question, activeExplainLang, mode);
	      if (translated) {
	        displayText = translated;
	      } else if (activeExplainLang && activeExplainLang !== "en") {
	        const fallbackNote = explainFallbackNotes[activeExplainLang] || "";
	        if (fallbackNote) {
	          noteText = noteText ? `${noteText} ${fallbackNote}` : fallbackNote;
	        }
	      }

	      if (quizExplainText) {
	        quizExplainText.textContent = displayText;
	      }
	      if (quizExplainNote) {
	        quizExplainNote.textContent = noteText;
	      }
	      if (quizExplainLangWrap) {
	        quizExplainLangWrap.hidden = false;
	      }
	      updateExplainButtons(mode);
	    };

    const updateQuizNavState = () => {
      const total = quizQuestions.length;
      const current = quizQuestions[state.currentIndex];
      const selected = state.answers[current.id] || "";
      const isChecked = !!state.checked[current.id];
      const isSolved = !!state.solved[current.id];

      if (quizPrevBtn) {
        quizPrevBtn.disabled = state.currentIndex === 0 || state.isSubmitted;
      }
      if (quizNextBtn) {
        const isLast = state.currentIndex === total - 1;
        const isCurrentSolved = !!(isSolved || (selected && isChecked && selected === current.correct));
        quizNextBtn.textContent = isLast ? "Finish & Save" : "Next";
        quizNextBtn.disabled = state.isSubmitted || !isCurrentSolved;
      }
      if (quizExplainBtn) {
        const hasExplanation = !!getQuestionExplanation(current);
        const isUnlocked = !!state.explanationUnlocked[current.id];
        const canExplain = !state.isSubmitted && (isUnlocked || isChecked || isSolved) && hasExplanation;
        quizExplainBtn.disabled = !canExplain;
      }
      if (quizCheckBtn) {
        quizCheckBtn.disabled = state.isSubmitted;
      }
    };

    const syncCurrentQuestionState = () => {
      const current = quizQuestions[state.currentIndex];
      const selected = state.answers[current.id] || "";
      const isChecked = !!state.checked[current.id];
      const isSolved = !!state.solved[current.id];

      if (quizStatus) {
        if (isSolved) {
          quizStatus.textContent = "Correct answer.";
          quizStatus.className = "quiz-status is-correct";
        } else if (!isChecked) {
          quizStatus.textContent = "";
          quizStatus.className = "quiz-status";
        } else if (!selected) {
          quizStatus.textContent = "Choose an option first.";
          quizStatus.className = "quiz-status is-warning";
        } else if (selected === current.correct) {
          quizStatus.textContent = "Correct answer.";
          quizStatus.className = "quiz-status is-correct";
        } else {
          quizStatus.textContent = "Incorrect answer.";
          quizStatus.className = "quiz-status is-wrong";
        }
      }

      if (quizOptions) {
        const optionButtons = quizOptions.querySelectorAll(".quiz-option");
        optionButtons.forEach((button) => {
          const optionKey = button.dataset.option || "";
          button.classList.remove("is-selected", "is-correct", "is-wrong");
          if (selected === optionKey) {
            button.classList.add("is-selected");
          }
          if (isSolved && optionKey === selected) {
            button.classList.add("is-correct");
          } else if (isChecked) {
            if (optionKey === selected && selected === current.correct) {
              button.classList.add("is-correct");
            } else if (optionKey === selected && selected !== current.correct) {
              button.classList.add("is-wrong");
            }
          }
        });
      }

      updateQuizNavState();
      persistQuizState();
    };

    const renderQuestion = () => {
      const total = quizQuestions.length;
      const current = quizQuestions[state.currentIndex];

      if (quizTaskNumber) {
        quizTaskNumber.textContent = `Task #${state.currentIndex + 1}`;
      }
      if (quizQuestion) {
        quizQuestion.textContent = current.question;
      }
      if (quizCounter) {
        quizCounter.textContent = `${state.currentIndex + 1} / ${total}`;
      }

      closeExplainModal();
      activeExplainQuestion = null;
      activeExplainMode = "main";
      // keep activeExplainLang selection across questions
      if (quizExplainNote) {
        quizExplainNote.textContent = "";
      }
      if (quizExplainLangWrap) {
        quizExplainLangWrap.hidden = false;
      }
      updateExplainButtons("main");
      updateExplainLangTrigger(activeExplainLang || "en");
      closeExplainLangList();

      if (quizOptions) {
        quizOptions.innerHTML = "";
        Object.entries(current.options).forEach(([key, value]) => {
          const optionButton = document.createElement("button");
          optionButton.type = "button";
          optionButton.className = "quiz-option";
          optionButton.dataset.option = key;
          optionButton.innerHTML = `<span class="quiz-option-key">${key}</span><span>${value}</span>`;
          optionButton.addEventListener("click", () => {
            if (state.isSubmitted) {
              return;
            }
            if (state.solved[current.id]) {
              return;
            }
            state.answers[current.id] = key;
            state.checked[current.id] = false;
            closeRetryModal();
            syncCurrentQuestionState();
          });
          quizOptions.appendChild(optionButton);
        });
      }

      syncCurrentQuestionState();
    };

    const checkCurrentAnswer = () => {
      const current = quizQuestions[state.currentIndex];
      const selected = state.answers[current.id];
      if (!quizStatus) {
        return !!selected;
      }

      if (!selected) {
        quizStatus.textContent = "Choose an option first.";
        quizStatus.className = "quiz-status is-warning";
        return false;
      }
      if (state.checked[current.id]) {
        return true;
      }

      if (!state.firstAttemptLogged[current.id]) {
        state.firstAttemptLogged[current.id] = true;
        state.firstAttempts[current.id] = selected;
      }

      state.checked[current.id] = true;
      state.explanationUnlocked[current.id] = true;

      if (selected === current.correct) {
        state.solved[current.id] = true;
        quizStatus.textContent = "Correct answer.";
        quizStatus.className = "quiz-status is-correct";
        closeRetryModal();
      } else {
        state.solved[current.id] = false;
        quizStatus.textContent = "Incorrect answer.";
        quizStatus.className = "quiz-status is-wrong";
        openRetryModal();
      }
      syncCurrentQuestionState();

      return true;
    };

    const submitQuiz = async () => {
      const username = getAuthUser();
      if (!username) {
        if (quizFinalResult) {
          quizFinalResult.textContent = "Login required to save result in database.";
        }
        openHomeworkModal();
        return;
      }

      const answers = quizQuestions.map((item) => ({
        question_id: item.id,
        selected_option: state.answers[item.id] || "",
      }));
      const firstAttempts = Object.entries(state.firstAttempts).map(([questionId, selectedOption]) => ({
        question_id: Number(questionId),
        selected_option: selectedOption,
      }));

      try {
        const response = await fetch(`${API_BASE_URL}/api/quiz/submit`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username,
            course,
            lesson_number: lessonNumber,
            answers,
            first_attempts: firstAttempts,
          }),
        });

        if (!response.ok) {
          if (quizFinalResult) {
            quizFinalResult.textContent = "Could not save quiz result.";
          }
          openHomeworkModal();
          return;
        }

        const result = await response.json();
        state.isSubmitted = true;
        persistQuizState();
        try {
          sessionStorage.removeItem(getQuizStateStorageKey());
        } catch (error) {
          // Ignore storage failures.
        }
        const saved = await saveLessonCompletion(null, "lesson_completed");
        if (saved) {
          markLessonCompletedLocal(course, lessonNumber);
        }
        if (!saved) {
          void checkAchievementsForUser(username, { notify: true, suppressIfNoCache: false });
        }
        if (quizFinalResult) {
          quizFinalResult.textContent = `Saved: ${result.correct_answers}/${result.total_questions} correct.`;
        }
        renderQuestion();
        openHomeworkModal();
      } catch (error) {
        if (quizFinalResult) {
          quizFinalResult.textContent = "Auth server is not running.";
        }
        openHomeworkModal();
      }
    };

    if (quizCheckBtn) {
      quizCheckBtn.addEventListener("click", () => {
        checkCurrentAnswer();
      });
    }

    if (quizPrevBtn) {
      quizPrevBtn.addEventListener("click", () => {
        if (state.currentIndex > 0) {
          state.currentIndex -= 1;
          renderQuestion();
        }
      });
    }

    if (quizNextBtn) {
      quizNextBtn.addEventListener("click", async () => {
        const total = quizQuestions.length;
        const isLast = state.currentIndex === total - 1;

        if (!isLast) {
          state.currentIndex += 1;
          renderQuestion();
          return;
        }

        const unanswered = quizQuestions.filter((item) => !state.answers[item.id]).length;
        if (unanswered > 0) {
          if (quizFinalResult) {
            quizFinalResult.textContent = `Answer all questions first. Remaining: ${unanswered}.`;
          }
          return;
        }

        await submitQuiz();
      });
    }

    if (quizExplainBtn) {
      quizExplainBtn.addEventListener("click", () => {
        const current = quizQuestions[state.currentIndex];
        if (!current) {
          return;
        }
        if (!state.checked[current.id] && !state.solved[current.id] && !state.explanationUnlocked[current.id]) {
          return;
        }
        if (quizExplainQuestion) {
          quizExplainQuestion.textContent = current.question || "";
        }
        setExplainMode(current, "main");
        openExplainModal();
      });
    }

    if (quizExplainOptions && quizExplainOptions.length > 0) {
      quizExplainOptions.forEach((button) => {
        button.addEventListener("click", () => {
          if (!activeExplainQuestion) {
            return;
          }
          const mode = button.dataset.explainMode || "main";
          const lang = mode === "language" ? activeExplainLang : "";
          setExplainMode(activeExplainQuestion, mode, lang);
        });
      });
    }

    if (quizExplainLangTrigger) {
      quizExplainLangTrigger.addEventListener("click", (event) => {
        event.stopPropagation();
        toggleExplainLangList();
      });
    }

    if (quizExplainLangItems && quizExplainLangItems.length > 0) {
      quizExplainLangItems.forEach((item) => {
        item.addEventListener("click", (event) => {
          event.stopPropagation();
          const selected = item.dataset.lang || "en";
          activeExplainLang = selected;
          updateExplainLangTrigger(selected);
          if (activeExplainQuestion) {
            setExplainMode(activeExplainQuestion, activeExplainMode || "main");
          }
          closeExplainLangList();
        });
      });
    }

    document.addEventListener("click", (event) => {
      if (!quizExplainLangList || !quizExplainLangTrigger) {
        return;
      }
      if (!quizExplainLangList.classList.contains("is-open")) {
        return;
      }
      const target = event.target;
      if (quizExplainLangList.contains(target) || quizExplainLangTrigger.contains(target)) {
        return;
      }
      closeExplainLangList();
    });

    if (quizModalRetryBtn) {
      quizModalRetryBtn.addEventListener("click", () => {
        const current = quizQuestions[state.currentIndex];
        state.checked[current.id] = false;
        closeRetryModal();
        closeExplainModal();
        syncCurrentQuestionState();
      });
    }

    if (quizRetryModal) {
      quizRetryModal.addEventListener("click", (event) => {
        if (event.target === quizRetryModal) {
          closeRetryModal();
        }
      });
    }

    if (quizExplainCloseBtn) {
      quizExplainCloseBtn.addEventListener("click", () => {
        closeExplainModal();
      });
    }

    if (quizExplainModal) {
      quizExplainModal.addEventListener("click", (event) => {
        if (event.target === quizExplainModal) {
          closeExplainModal();
        }
      });
    }

    restoreQuizState();
    renderQuestion();
    } catch (error) {
      const msg = error && error.message ? String(error.message) : String(error || "Unknown error");
      const runtimeStatusEl = document.getElementById("tasks-runtime-status");
      if (runtimeStatusEl) {
        runtimeStatusEl.textContent = `Tasks init failed: ${msg}`;
        runtimeStatusEl.hidden = false;
        runtimeStatusEl.classList.add("is-error");
      }
    }
  })();
}

const AUTH_STORAGE_KEY = "ewms_auth_state";
const LEGACY_AUTH_STORAGE_KEY = "ewms_auth_user";
const ENABLE_VIEW_PROGRESS = true;
const ENABLE_KNOWLEDGE_RESULT_SAVE = true;

const loginBtn = document.getElementById("login-btn");
const profileBtn = document.getElementById("profile-btn");
const mentorStudentsBtn = document.getElementById("mentor-students-btn");
const mentorStudentsBadge = document.getElementById("mentor-students-badge");
const adminPanelBtn = document.getElementById("admin-panel-btn");
const adminPanelBadge = document.getElementById("admin-panel-badge");
const adminSubscriptionsEditBtn = document.getElementById("admin-subscriptions-edit-btn");
const headerGreeting = document.getElementById("header-greeting");
const studentNotificationsBtn = document.getElementById("student-notifications-btn");
const studentNotificationsBadge = document.getElementById("student-notifications-badge");
const loginModal = document.getElementById("login-modal");
const profileModal = document.getElementById("profile-modal");
const profileTitle = document.getElementById("profile-title");
const profileCloseBtn = document.getElementById("profile-close-btn");
const profileMentorBlock = document.getElementById("profile-mentor-block");
const profileMentorAvatar = document.getElementById("profile-mentor-avatar");
const profileMentorKicker = document.getElementById("profile-mentor-kicker");
const profileMentorName = document.getElementById("profile-mentor-name");
const profileMentorText = document.getElementById("profile-mentor-text");
const profileMentorContact = document.getElementById("profile-mentor-contact");
const profileMentorContactBtn = document.getElementById("profile-mentor-contact-btn");
const profileUserAvatar = document.getElementById("profile-user-avatar");
const profileUserAvatarFallback = document.getElementById("profile-user-avatar-fallback");
const profileUserKicker = document.getElementById("profile-user-kicker");
const profileUserName = document.getElementById("profile-user-name");
const profileUserAvatarActions = document.getElementById("profile-user-avatar-actions");
const profileUserAvatarInput = document.getElementById("profile-user-avatar-input");
const profileUserAvatarBtn = document.getElementById("profile-user-avatar-btn");
const profileUserAvatarMsg = document.getElementById("profile-user-avatar-msg");
const profilePublicStats = document.getElementById("profile-public-stats");
const profileSelfStats = document.getElementById("profile-self-stats");
const profileLevel = document.getElementById("profile-level");
const profileProgress = document.getElementById("profile-progress");
const profileSubscriptionRemaining = document.getElementById("profile-subscription-remaining");
const profileAchievements = document.getElementById("profile-achievements");
const profileAchievementsProgress = document.getElementById("profile-achievements-progress");
const profileAchievementsBtn = document.getElementById("profile-achievements-btn");
const achievementsModal = document.getElementById("achievements-modal");
const achievementsCloseBtn = document.getElementById("achievements-close-btn");
const achievementsModalList = document.getElementById("achievements-modal-list");
const achievementsModalProgress = document.getElementById("achievements-modal-progress");
const achievementsLeaderboardBtn = document.getElementById("achievements-leaderboard-btn");
const leaderboardModal = document.getElementById("leaderboard-modal");
const leaderboardCloseBtn = document.getElementById("leaderboard-close-btn");
const leaderboardModalList = document.getElementById("leaderboard-modal-list");
const profileUpgradeBtn = document.getElementById("profile-upgrade-btn");
const profileLessonsCompleted = document.getElementById("profile-lessons-completed");
const profileNextUnlock = document.getElementById("profile-next-unlock");
const mentorSelfEdit = document.getElementById("mentor-self-edit");
const mentorSelfName = document.getElementById("mentor-self-name");
const mentorSelfPhone = document.getElementById("mentor-self-phone");
const mentorSelfTelegram = document.getElementById("mentor-self-telegram");
const mentorSelfInstagram = document.getElementById("mentor-self-instagram");
const mentorSelfInfo = document.getElementById("mentor-self-info");
const mentorSelfSave = document.getElementById("mentor-self-save");
const mentorSelfSaveMsg = document.getElementById("mentor-self-save-msg");
const mentorStudentsModal = document.getElementById("mentor-students-modal");
const mentorStudentsCloseBtn = document.getElementById("mentor-students-close");
const mentorStudentsNote = document.getElementById("mentor-students-note");
const mentorStudentsHomeworkAlert = document.getElementById("mentor-students-homework-alert");
const mentorStudentsGrid = document.getElementById("mentor-students-grid");
const mentorStudentModal = document.getElementById("mentor-student-modal");
const mentorStudentCloseBtn = document.getElementById("mentor-student-close");
const mentorStudentTitle = document.getElementById("mentor-student-title");
const mentorStudentBody = document.getElementById("mentor-student-body");
const mentorViewProgressBtn = document.getElementById("mentor-view-progress-btn");
const mentorHomeworkBtn = document.getElementById("mentor-homework-btn");
const mentorHomeworkBadge = document.getElementById("mentor-homework-badge");
const mentorHomeworkModal = document.getElementById("mentor-homework-modal");
const mentorHomeworkCloseBtn = document.getElementById("mentor-homework-close");
const mentorHomeworkTitle = document.getElementById("mentor-homework-title");
const mentorHomeworkNote = document.getElementById("mentor-homework-note");
const mentorHomeworkLessons = document.getElementById("mentor-homework-lessons");
const mentorHomeworkReviewModal = document.getElementById("mentor-homework-review-modal");
const mentorHomeworkReviewMeta = document.getElementById("mentor-homework-review-meta");
const mentorHomeworkReviewDownloadBtn = document.getElementById("mentor-homework-review-download");
const mentorHomeworkReviewScore = document.getElementById("mentor-homework-review-score");
const mentorHomeworkReviewComment = document.getElementById("mentor-homework-review-comment");
const mentorHomeworkReviewMessage = document.getElementById("mentor-homework-review-message");
const mentorHomeworkReviewCancelBtn = document.getElementById("mentor-homework-review-cancel");
const mentorHomeworkReviewSaveBtn = document.getElementById("mentor-homework-review-save");
const mentorProgressModal = document.getElementById("mentor-progress-modal");
const mentorProgressCloseBtn = document.getElementById("mentor-progress-close");
const mentorProgressTitle = document.getElementById("mentor-progress-title");
const mentorProgressNote = document.getElementById("mentor-progress-note");
const mentorProgressLessons = document.getElementById("mentor-progress-lessons");

const syncAdminPanelPlacement = () => {
  if (!adminPanelBtn && !mentorStudentsBtn) {
    return;
  }
  const heroHeader = document.querySelector(".hero-header");
  if (!heroHeader) {
    return;
  }
  const leftWrap = heroHeader.querySelector(".header-actions.header-actions-left");
  const rightWrap = heroHeader.querySelector(".header-actions.header-actions-right");
  if (!leftWrap || !rightWrap) {
    return;
  }
  const isDesktop = window.matchMedia("(min-width: 901px)").matches;
  if (isDesktop) {
    if (adminPanelBtn && !rightWrap.contains(adminPanelBtn)) {
      rightWrap.insertBefore(adminPanelBtn, rightWrap.firstChild);
    }
    if (mentorStudentsBtn && !rightWrap.contains(mentorStudentsBtn)) {
      const insertBeforeTarget = adminPanelBtn && rightWrap.contains(adminPanelBtn) ? adminPanelBtn : rightWrap.firstChild;
      rightWrap.insertBefore(mentorStudentsBtn, insertBeforeTarget);
    }
  } else {
    if (adminPanelBtn && !leftWrap.contains(adminPanelBtn)) {
      leftWrap.appendChild(adminPanelBtn);
    }
    if (mentorStudentsBtn && !leftWrap.contains(mentorStudentsBtn)) {
      leftWrap.appendChild(mentorStudentsBtn);
    }
  }
};

const enableLessonActionButtonTilt = () => {
  const supportsHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!supportsHover || reduceMotion) {
    return;
  }
  const buttons = document.querySelectorAll(".lesson-player-actions .lesson-nav-btn");
  if (!buttons.length) {
    return;
  }

  buttons.forEach((button) => {
    let rafId = 0;
    let lastX = 0;
    let lastY = 0;
    let rect = null;

    const update = () => {
      rafId = 0;
      if (!rect) {
        rect = button.getBoundingClientRect();
      }
      const x = rect.width ? (lastX - rect.left) / rect.width : 0.5;
      const y = rect.height ? (lastY - rect.top) / rect.height : 0.5;
      const clampedX = Math.min(1, Math.max(0, x));
      const clampedY = Math.min(1, Math.max(0, y));

      button.style.setProperty("--glow-x", `${(clampedX * 100).toFixed(2)}%`);
      button.style.setProperty("--glow-y", `${(clampedY * 100).toFixed(2)}%`);
    };

    const schedule = () => {
      if (rafId) {
        return;
      }
      rafId = window.requestAnimationFrame(update);
    };

    button.addEventListener("pointerenter", () => {
      rect = button.getBoundingClientRect();
    });

    button.addEventListener("pointermove", (event) => {
      lastX = event.clientX;
      lastY = event.clientY;
      schedule();
    });

    button.addEventListener("pointerleave", () => {
      rect = null;
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = 0;
      }
      button.style.setProperty("--glow-x", "50%");
      button.style.setProperty("--glow-y", "50%");
    });
  });
};

const enableButtonGlowTracking = () => {
  if (document.querySelector("[data-admin-page]")) {
    return;
  }
  const supportsHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!supportsHover || reduceMotion) {
    return;
  }

  const buttons = document.querySelectorAll(".btn");
  if (!buttons.length) {
    return;
  }

  buttons.forEach((button) => {
    if (!button || button.dataset.glowTrackBound === "1") {
      return;
    }
    if (button.id === "admin-panel-btn") {
      return;
    }
    button.dataset.glowTrackBound = "1";

    let rafId = 0;
    let lastX = 0;
    let lastY = 0;
    let rect = null;

    const update = () => {
      rafId = 0;
      if (!rect) {
        rect = button.getBoundingClientRect();
      }
      const x = rect.width ? (lastX - rect.left) / rect.width : 0.5;
      const y = rect.height ? (lastY - rect.top) / rect.height : 0.5;
      const clampedX = Math.min(1, Math.max(0, x));
      const clampedY = Math.min(1, Math.max(0, y));

      button.style.setProperty("--glow-x", `${(clampedX * 100).toFixed(2)}%`);
      button.style.setProperty("--glow-y", `${(clampedY * 100).toFixed(2)}%`);
    };

    const schedule = () => {
      if (rafId) {
        return;
      }
      rafId = window.requestAnimationFrame(update);
    };

    button.addEventListener("pointerenter", () => {
      rect = button.getBoundingClientRect();
    });

    button.addEventListener("pointermove", (event) => {
      lastX = event.clientX;
      lastY = event.clientY;
      schedule();
    });

    button.addEventListener("pointerleave", () => {
      rect = null;
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = 0;
      }
      button.style.setProperty("--glow-x", "50%");
      button.style.setProperty("--glow-y", "50%");
    });
  });
};
const resultsTabs = document.querySelectorAll(".results-modal-tab[data-scroll-target]");
const resultsSection =
  document.querySelector(".results-modal-card-standalone") ||
  document.querySelector(".results-modal-card");
const adminProgressModalEl = document.getElementById("admin-progress-modal");
const adminRequestsModalEl = document.getElementById("admin-requests-modal");
const knowledgeTestOpenBtn = document.getElementById("knowledge-test-open-btn");
const knowledgeTestModal = document.getElementById("knowledge-test-modal");
const knowledgeTestCloseBtn = document.getElementById("knowledge-test-close-btn");
const knowledgeTestHelp = document.getElementById("knowledge-test-help");
const knowledgeTestProgress = document.getElementById("knowledge-test-progress");
const knowledgeTestQuestion = document.getElementById("knowledge-test-question");
const knowledgeTestOptions = document.getElementById("knowledge-test-options");
const knowledgeTestFeedback = document.getElementById("knowledge-test-feedback");
const knowledgeTestNextBtn = document.getElementById("knowledge-test-next-btn");
const knowledgeTestRestartBtn = document.getElementById("knowledge-test-restart-btn");
const upgradeOpenBtn = document.getElementById("upgrade-open-btn");
const upgradeModal = document.getElementById("upgrade-modal");
const upgradeCloseBtn = document.getElementById("upgrade-close-btn");
const resultsLearnBtn = document.querySelector(".results-learn-btn");
const resultsModal = document.getElementById("results-modal");
const resultsModalCloseBtn = document.getElementById("results-modal-close");
const resultsStandaloneCertImages = document.querySelectorAll(".results-standalone .results-modal-certificate img");
const upgradePlanPriceButtons = document.querySelectorAll(".upgrade-plan-price-btn");
const enrollModal = document.getElementById("enroll-modal");
const enrollCloseBtn = document.getElementById("enroll-close-btn");
const enrollCancelBtn = document.getElementById("enroll-cancel-btn");
const enrollForm = document.getElementById("enroll-form");
const enrollPlanNote = document.getElementById("enroll-plan-note");
const enrollFullName = document.getElementById("enroll-full-name");
const enrollSurname = document.getElementById("enroll-surname");
const enrollPhone = document.getElementById("enroll-phone");
const enrollTelegram = document.getElementById("enroll-telegram");
const enrollSchedule = document.getElementById("enroll-schedule");
const enrollScheduleWrap = document.getElementById("enroll-schedule-wrap");
const enrollMessage = document.getElementById("enroll-message");
const enrollSuccessModal = document.getElementById("enroll-success-modal");
const enrollSuccessMenuBtn = document.getElementById("enroll-success-menu");
const legalSignupLinks = document.querySelectorAll(".js-open-upgrade");
const legalLoginLinks = document.querySelectorAll(".js-open-login");
let profileAchievementsCache = [];
const ACHIEVEMENT_MEDAL_ICON = "&#x1F3C5;";
const ACHIEVEMENT_LOCKED_ICON = "??";
const ACHIEVEMENT_TOAST_ICON = "&#x1F3C5;";
const escapeAchievementHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
const getAchievementKey = (item) => {
  const rawKey =
    item?.id ??
    item?.code ??
    item?.slug ??
    item?.key ??
    item?.title ??
    item?.title_ru ??
    "";
  return String(rawKey || "").trim().toLowerCase();
};
const getAchievementNotifyStorageKey = (username) =>
  `ewms_achievement_notify:${String(username || "").trim().toLowerCase()}`;
const loadAchievementNotifySet = (username) => {
  const key = getAchievementNotifyStorageKey(username);
  if (!key || key.endsWith(":")) {
    return { set: new Set(), hasStored: false };
  }
  const raw = localStorage.getItem(key);
  if (!raw) {
    return { set: new Set(), hasStored: false };
  }
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return { set: new Set(parsed.map((value) => String(value))), hasStored: true };
    }
  } catch (error) {
    // Ignore parse errors.
  }
  return { set: new Set(), hasStored: true };
};
const saveAchievementNotifySet = (username, values) => {
  const key = getAchievementNotifyStorageKey(username);
  if (!key || key.endsWith(":")) {
    return;
  }
  try {
    localStorage.setItem(key, JSON.stringify(Array.from(values)));
  } catch (error) {
    // Ignore storage errors.
  }
};
const getAchievementToastContainer = () => {
  let container = document.getElementById("achievement-toast-container");
  if (!container && document.body) {
    container = document.createElement("div");
    container.id = "achievement-toast-container";
    container.className = "achievement-toast-container";
    container.setAttribute("aria-live", "polite");
    container.setAttribute("aria-atomic", "false");
    document.body.appendChild(container);
  }
  return container;
};
const showAchievementToast = (item) => {
  const container = getAchievementToastContainer();
  if (!container) {
    return;
  }
  const title = escapeAchievementHtml(item?.title || item?.title_ru || "Achievement");
  const points = Number(item?.points) || 0;
  const pointsLabel = points ? `+${escapeAchievementHtml(points)} XP` : "";
  const toast = document.createElement("div");
  toast.className = "achievement-toast";
  toast.innerHTML = `
    <div class="achievement-toast-icon">${ACHIEVEMENT_TOAST_ICON}</div>
    <div class="achievement-toast-content">
      <div class="achievement-toast-title">Achievement unlocked</div>
      <div class="achievement-toast-text">${title}${
        pointsLabel ? ` <span class="achievement-toast-points">${pointsLabel}</span>` : ""
      }</div>
    </div>
  `;
  container.appendChild(toast);
  requestAnimationFrame(() => {
    toast.classList.add("is-visible");
  });
  const removeToast = () => {
    toast.classList.remove("is-visible");
    toast.addEventListener(
      "transitionend",
      () => {
        toast.remove();
      },
      { once: true }
    );
    setTimeout(() => {
      if (toast.isConnected) {
        toast.remove();
      }
    }, 700);
  };
  setTimeout(removeToast, 4200);
};
const updateAchievementNotifications = (username, achievements, options = {}) => {
  const safeUsername = String(username || "").trim();
  if (!safeUsername) {
    return;
  }
  const notify = options.notify !== false;
  const suppressIfNoCache = options.suppressIfNoCache !== false;
  const { set: existingSet, hasStored } = loadAchievementNotifySet(safeUsername);
  const nextSet = new Set(existingSet);
  const list = Array.isArray(achievements) ? achievements : [];
  let hasNew = false;
  list.forEach((item) => {
    if (!item || !item.earned) {
      return;
    }
    const key = getAchievementKey(item);
    if (!key) {
      return;
    }
    if (!nextSet.has(key)) {
      if (notify && (!suppressIfNoCache || hasStored || existingSet.size > 0)) {
        showAchievementToast(item);
      }
      nextSet.add(key);
      hasNew = true;
    }
  });
  if (hasNew || !hasStored || existingSet.size !== nextSet.size) {
    saveAchievementNotifySet(safeUsername, nextSet);
  }
};
const renderProfileAchievementsSummary = (achievements) => {
  const list = Array.isArray(achievements) ? achievements : [];
  profileAchievementsCache = list;
  const earnedItems = list.filter((item) => item && item.earned);
  const totalCount = list.length;
  const earnedCount = earnedItems.length;
  const percent = totalCount ? Math.round((earnedCount / totalCount) * 100) : 0;
  if (profileAchievementsProgress) {
    profileAchievementsProgress.textContent = totalCount ? `${percent}% completed` : "0% completed";
  }
  if (!profileAchievements) {
    return;
  }
  // Profile modal should show only the completion percentage.
  profileAchievements.textContent = "";
  profileAchievements.hidden = true;
};
const updateAchievementsModalProgress = (achievements) => {
  if (!achievementsModalProgress) {
    return;
  }
  const list = Array.isArray(achievements) ? achievements : [];
  const total = list.length;
  const earned = list.filter((item) => item && item.earned).length;
  const percent = total ? Math.round((earned / total) * 100) : 0;
  achievementsModalProgress.textContent = total
    ? `Completed ${earned} of ${total} (${percent}%)`
    : "Completed 0%";
};
const syncAchievementsModal = (achievements) => {
  if (achievementsModal && achievementsModal.classList.contains("is-open")) {
    renderAchievementsModal(achievements);
    updateAchievementsModalProgress(achievements);
  }
};
const checkAchievementsForUser = async (username, options = {}) => {
  const safeUsername = String(username || "").trim();
  if (!safeUsername) {
    return;
  }
  try {
    await ensureApiBaseUrl();
    const response = await fetch(
      `${API_BASE_URL}/api/user/progress-summary?username=${encodeURIComponent(safeUsername)}`
    );
    if (!response.ok) {
      return;
    }
    const payload = await response.json();
    const achievements = Array.isArray(payload.achievements) ? payload.achievements : [];
    renderProfileAchievementsSummary(achievements);
    syncAchievementsModal(achievements);
    updateAchievementNotifications(safeUsername, achievements, options);
  } catch (error) {
    // Ignore notification errors.
  }
};
const termsOpenLinks = document.querySelectorAll('[data-legal-open="terms"]');
const privacyOpenLinks = document.querySelectorAll('[data-legal-open="privacy"]');
let termsModal = document.getElementById("terms-modal");
let termsCloseBtn = document.getElementById("terms-close-btn");
let privacyModal = document.getElementById("privacy-modal");
let privacyCloseBtn = document.getElementById("privacy-close-btn");
const loginForm = document.getElementById("login-form");
const loginCancel = document.getElementById("login-cancel");
const loginError = document.getElementById("login-error");
const loginUsername = document.getElementById("login-username");
const loginPassword = document.getElementById("login-password");
const loginShowPassword = document.getElementById("login-show-password");
let loginConsentCheckbox = document.getElementById("login-consent");
let enrollConsentCheckbox = document.getElementById("enroll-consent");
const loginSubmitBtn = loginForm ? loginForm.querySelector(".login-submit-btn") : null;
const enrollSubmitBtn = enrollForm ? enrollForm.querySelector(".enroll-submit-btn") : null;
let isEnrollSubmitting = false;

const ensureLegalUi = () => {
  const injectLegalText = (formEl, beforeEl = null, mode = "login") => {
    if (!formEl) {
      return;
    }
    const legacyAgree = formEl.querySelector(".legal-agree");
    if (legacyAgree) {
      legacyAgree.remove();
    }
    let signup = formEl.querySelector(".legal-signup");
    if (!signup) {
      signup = document.createElement("p");
      signup.className = "legal-signup";
    }
    if (mode === "login") {
      signup.innerHTML = `Don't have account ? <a href="#" class="legal-link js-open-upgrade">Sign up</a>`;
    } else {
      signup.innerHTML = `Already have an account? <a href="#" class="legal-link js-open-login">Login</a>`;
    }

    let agree = formEl.querySelector(".legal-consent-wrap");
    if (!agree) {
      agree = document.createElement("label");
      agree.className = "legal-consent-wrap";
    }
    if (mode === "login") {
      agree.htmlFor = "login-consent";
      agree.innerHTML = `<input id="login-consent" class="legal-consent-checkbox" type="checkbox">
        <span>I agree to
          <a href="#" class="legal-link" data-legal-open="terms">Terms and Conditions</a>
          and
          <a href="#" class="legal-link" data-legal-open="privacy">Privacy Policy</a>
        </span>`;
    } else {
      agree.htmlFor = "enroll-consent";
      agree.innerHTML = `<input id="enroll-consent" class="legal-consent-checkbox" type="checkbox">
        <span>I agree to
          <a href="#" class="legal-link" data-legal-open="terms">Terms and Conditions</a>
          and
          <a href="#" class="legal-link" data-legal-open="privacy">Privacy Policy</a>
        </span>`;
    }

    if (beforeEl && formEl.contains(beforeEl)) {
      formEl.insertBefore(signup, beforeEl);
      formEl.insertBefore(agree, beforeEl);
    } else {
      formEl.appendChild(signup);
      formEl.appendChild(agree);
    }
  };

  const loginErrorEl = loginForm ? loginForm.querySelector("#login-error") : null;
  const enrollMessageEl = enrollForm ? enrollForm.querySelector("#enroll-message") : null;
  injectLegalText(loginForm, loginErrorEl, "login");
  injectLegalText(enrollForm, enrollMessageEl, "enroll");

  if (!document.getElementById("terms-modal")) {
    const terms = document.createElement("div");
    terms.id = "terms-modal";
    terms.className = "legal-modal";
    terms.setAttribute("aria-hidden", "true");
    terms.innerHTML = `
      <div class="legal-modal-card" role="dialog" aria-modal="true" aria-labelledby="terms-title">
        <button type="button" id="terms-close-btn" class="legal-modal-close" aria-label="Close terms">&times;</button>
        <h3 id="terms-title">Terms and Conditions</h3>
        <pre class="legal-text">1. Platform Description
The Platform provides online courses for learning English, including:
Video lessons
Tests
Homework assignments
Live lessons
Chat with the instructor (Telegram Support)
Access to the Platform is provided via a monthly subscription.

2. Account Creation
Accounts are created only by administrators after payment. Users cannot create their own accounts.
Users must provide accurate information.
Sharing your account with others is strictly prohibited. Accounts may be terminated immediately if this rule is violated.

3. Use of Platform
Users may access courses and materials for personal educational use only.
Users may not copy, publish, distribute, or sell any content from the Platform. All intellectual property rights belong to the Platform.
The Platform may update courses, lessons, or assignments. Users will be notified of major changes via Telegram or Instagram.
We do not guarantee any specific level of English proficiency. Progress depends on individual effort.

4. Payment
Subscription is monthly and does not renew automatically. Users must purchase each month individually.
Payment is handled via Click, Payme, Uzum.
No refunds are provided under any circumstances, including account deletion.

5. Intellectual Property
All content on the Platform, including videos, tests, lessons, homework, and live sessions, is protected by intellectual property law.
Users may not copy, share, or distribute any materials from the Platform.

6. Privacy
We collect the following user data: name, email, phone number, and device information to ensure account security.
During use of the Platform, we track: lesson progress, test results, and homework completion.
Payment data is processed via Click, Payme, and Uzum.
Contact for privacy inquiries: englishwithmrsam@gmail.com

7. Termination
Users may request account deletion via email or Telegram, providing a reason.
Access to the Platform ends automatically after the subscription period expires.

8. Governing Law
These Terms are governed by the laws of the Republic of Uzbekistan.
Disputes will first be attempted to resolve via negotiation. If unresolved, disputes may be brought to the court where the owner is located.

9. Changes to Terms
We reserve the right to update these Terms at any time.
Major changes will be announced via Telegram and Instagram.
Continued use of the Platform after changes indicates acceptance of the new Terms.</pre>
      </div>
    `;
    document.body.appendChild(terms);
  }

  if (!document.getElementById("privacy-modal")) {
    const privacy = document.createElement("div");
    privacy.id = "privacy-modal";
    privacy.className = "legal-modal";
    privacy.setAttribute("aria-hidden", "true");
    privacy.innerHTML = `
      <div class="legal-modal-card" role="dialog" aria-modal="true" aria-labelledby="privacy-title">
        <button type="button" id="privacy-close-btn" class="legal-modal-close" aria-label="Close privacy policy">&times;</button>
        <h3 id="privacy-title">Privacy Policy</h3>
        <pre class="legal-text">Privacy Policy - English with Mr.Sam
Last Updated: [дата]
Welcome to English with Mr.Sam ("we," "our," or "us"), a platform operated by Sunnatullo Raxmatullaev's team. Your privacy is important to us. This Privacy Policy explains how we collect, use, store, and protect your information when you use our website and services (the "Platform"). By using our Platform, you agree to the terms outlined in this Privacy Policy.

1. Information We Collect
We may collect the following types of information:
1.1 Personal Information:
Name
Email address
Phone number
1.2 Device and Activity Information:
Devices used to access the Platform
Login activity, course progress, completed lessons, test results, and submitted assignments
1.3 Payment Information:
Payment data required to process course subscriptions through Click, Payme, and Uzum (handled by third-party payment processors)
1.4 User-Generated Content:
Any feedback, messages, or submissions provided within the Platform or to Telegram Support

2. How We Use Your Information
We use the collected information to:
Provide and maintain access to courses, lessons, tests, and assignments
Track course progress and performance
Communicate with users via email or Telegram regarding account access, course updates, and support
Prevent account sharing and fraudulent activity
Improve our Platform and educational content

3. Sharing Your Information
We do not sell or rent your personal information. We may share your information in the following situations:
Service Providers: Third-party providers that help operate the Platform (hosting, analytics, payment processing)
Legal Requirements: When required by law or to protect our rights, property, or safety
Business Transfers: In the event of a merger, acquisition, or sale of assets

4. Data Storage and Security
Your data is stored securely using industry-standard practices
While we strive to protect your information, no method of transmission over the internet is completely secure

5. User Rights
You have the following rights regarding your personal information:
Access: Request a copy of the data we collect about you
Correction: Update or correct inaccurate information
Deletion: Request deletion of your account and data by contacting us via email or Telegram
Opt-Out: Opt out of promotional communications
Contact for privacy inquiries: englishwithmrsam@gmail.com

6. Third-Party Links
Our Platform may contain links to third-party websites or services
We are not responsible for the privacy practices of these third-party platforms

7. Changes to This Privacy Policy
We may update this Privacy Policy from time to time
Updates will be posted on the Platform and/or communicated via Telegram or Instagram
Continued use of the Platform indicates acceptance of any changes

8. Contact Us
For questions or concerns about this Privacy Policy, you may contact us via:
Email: englishwithmrsam@gmail.com
Telegram: @English_with_MrSam_bot</pre>
      </div>
    `;
    document.body.appendChild(privacy);
  }

  termsModal = document.getElementById("terms-modal");
  termsCloseBtn = document.getElementById("terms-close-btn");
  privacyModal = document.getElementById("privacy-modal");
  privacyCloseBtn = document.getElementById("privacy-close-btn");
  loginConsentCheckbox = document.getElementById("login-consent");
  enrollConsentCheckbox = document.getElementById("enroll-consent");
};

ensureLegalUi();
initContactForm();

const syncConsentButtons = () => {
  if (loginSubmitBtn) {
    loginSubmitBtn.disabled = !(loginConsentCheckbox && loginConsentCheckbox.checked);
  }
  if (enrollSubmitBtn) {
    if (isEnrollSubmitting) {
      enrollSubmitBtn.disabled = true;
      return;
    }
    enrollSubmitBtn.disabled = !(enrollConsentCheckbox && enrollConsentCheckbox.checked);
  }
};

syncConsentButtons();

const syncModalBodyScroll = () => {
  const hasOpenModal = !!(
    (loginModal && loginModal.classList.contains("is-open")) ||
    (profileModal && profileModal.classList.contains("is-open")) ||
    (mentorStudentsModal && mentorStudentsModal.classList.contains("is-open")) ||
	    (mentorStudentModal && mentorStudentModal.classList.contains("is-open")) ||
	    (mentorProgressModal && mentorProgressModal.classList.contains("is-open")) ||
	    (mentorHomeworkModal && mentorHomeworkModal.classList.contains("is-open")) ||
	    (mentorHomeworkReviewModal && mentorHomeworkReviewModal.classList.contains("is-open")) ||
	    (achievementsModal && achievementsModal.classList.contains("is-open")) ||
    (leaderboardModal && leaderboardModal.classList.contains("is-open")) ||
    (knowledgeTestModal &&
      (knowledgeTestModal.classList.contains("is-open") || knowledgeTestModal.dataset.keepOpen === "1")) ||
    (adminProgressModalEl && adminProgressModalEl.classList.contains("is-open")) ||
    (adminRequestsModalEl && adminRequestsModalEl.classList.contains("is-open")) ||
    (document.getElementById("admin-create-queue-modal") &&
      document.getElementById("admin-create-queue-modal").classList.contains("is-open")) ||
    (document.getElementById("admin-manage-modal") &&
      document.getElementById("admin-manage-modal").classList.contains("is-open")) ||
    (document.getElementById("admin-renewals-modal") &&
      document.getElementById("admin-renewals-modal").classList.contains("is-open")) ||
    (document.getElementById("admin-payments-modal") &&
      document.getElementById("admin-payments-modal").classList.contains("is-open")) ||
    (document.getElementById("admin-delete-modal") &&
      document.getElementById("admin-delete-modal").classList.contains("is-open")) ||
    (document.getElementById("admin-delete-confirm-modal") &&
      document.getElementById("admin-delete-confirm-modal").classList.contains("is-open")) ||
    (document.getElementById("admin-edit-code-modal") &&
      document.getElementById("admin-edit-code-modal").classList.contains("is-open")) ||
    (document.getElementById("admin-lessons-manager-modal") &&
      document.getElementById("admin-lessons-manager-modal").classList.contains("is-open")) ||
    (document.getElementById("admin-lesson-edit-modal") &&
      document.getElementById("admin-lesson-edit-modal").classList.contains("is-open")) ||
    (document.getElementById("admin-unsaved-confirm-modal") &&
      document.getElementById("admin-unsaved-confirm-modal").classList.contains("is-open")) ||
    (document.getElementById("admin-quiz-editor-modal") &&
      document.getElementById("admin-quiz-editor-modal").classList.contains("is-open")) ||
    (document.getElementById("admin-user-info-modal") &&
      document.getElementById("admin-user-info-modal").classList.contains("is-open")) ||
    (upgradeModal && upgradeModal.classList.contains("is-open")) ||
    (resultsModal && resultsModal.classList.contains("is-open")) ||
    (enrollModal && enrollModal.classList.contains("is-open")) ||
    (enrollSuccessModal && enrollSuccessModal.classList.contains("is-open")) ||
    (termsModal && termsModal.classList.contains("is-open")) ||
    (privacyModal && privacyModal.classList.contains("is-open")) ||
    (document.getElementById("subscription-expired-modal") &&
      document.getElementById("subscription-expired-modal").classList.contains("is-open")) ||
    (document.getElementById("subscription-renew-modal") &&
      document.getElementById("subscription-renew-modal").classList.contains("is-open")) ||
    (document.getElementById("subscription-confirm-modal") &&
      document.getElementById("subscription-confirm-modal").classList.contains("is-open")) ||
	    (document.getElementById("subscription-sent-modal") &&
	      document.getElementById("subscription-sent-modal").classList.contains("is-open"))
	    ||
	    (document.getElementById("homework-sent-modal") &&
	      document.getElementById("homework-sent-modal").classList.contains("is-open"))
 	  );
  document.body.style.overflow = hasOpenModal ? "hidden" : "";
};

const knowledgePlacementQuestions = [
  {
    level: "A1",
    question: "Choose the correct sentence.",
    options: [
      "She go to school every day.",
      "She goes to school every day.",
      "She going to school every day.",
      "She gone to school every day.",
    ],
    correct: 1,
    weight: 1,
  },
  {
    level: "A1",
    question: "Complete the sentence: I ___ a student.",
    options: ["am", "is", "are", "be"],
    correct: 0,
    weight: 1,
  },
  {
    level: "A2",
    question: "Choose the best answer: We ___ TV now.",
    options: ["watch", "watches", "are watching", "watched"],
    correct: 2,
    weight: 2,
  },
  {
    level: "A2",
    question: "Which sentence is correct?",
    options: [
      "I have seen this movie yesterday.",
      "I saw this movie yesterday.",
      "I seen this movie yesterday.",
      "I was see this movie yesterday.",
    ],
    correct: 1,
    weight: 2,
  },
  {
    level: "B1",
    question: "Choose the correct conditional sentence.",
    options: [
      "If I will study, I pass the exam.",
      "If I studied, I will pass the exam.",
      "If I study, I will pass the exam.",
      "If I study, I would pass the exam yesterday.",
    ],
    correct: 2,
    weight: 3,
  },
  {
    level: "B1",
    question: "Pick the sentence with correct reported speech.",
    options: [
      "He said that he is tired.",
      "He said that he was tired.",
      "He said me that he was tired.",
      "He told that he was tired.",
    ],
    correct: 1,
    weight: 3,
  },
  {
    level: "B2",
    question: "Choose the best advanced structure.",
    options: [
      "Hardly had I arrived when the meeting started.",
      "Hardly I had arrived when the meeting started.",
      "I hardly had arrived when started the meeting.",
      "Had hardly I arrived when the meeting started.",
    ],
    correct: 0,
    weight: 4,
  },
  {
    level: "B2",
    question: "Pick the most natural formal sentence.",
    options: [
      "Despite of the rain, we continued.",
      "Although raining, we continue.",
      "In spite of the rain, we continued.",
      "Despite it rained, we continued.",
    ],
    correct: 2,
    weight: 4,
  },
];

const knowledgeTestState = {
  index: 0,
  score: 0,
  correctAnswers: 0,
  selected: null,
  finished: false,
  levelStats: {
    A1: { correct: 0, total: 0 },
    A2: { correct: 0, total: 0 },
    B1: { correct: 0, total: 0 },
    B2: { correct: 0, total: 0 },
  },
};
let knowledgeResultCtaTimer = null;
let knowledgeResultHoldTimer = null;
let knowledgeKeepOpenTimer = null;
let knowledgeCloseRequested = false;
let knowledgeCloseBlockedUntil = 0;
const logKnowledgeClose = (reason) => {
  try {
    const state = {
      reason,
      finished: knowledgeTestState.finished,
      keepOpen: knowledgeTestModal ? knowledgeTestModal.dataset.keepOpen === "1" : false,
      isOpen: knowledgeTestModal ? knowledgeTestModal.classList.contains("is-open") : false,
      closeBlockedMs: Math.max(0, knowledgeCloseBlockedUntil - Date.now()),
    };
    console.groupCollapsed("knowledge-test-close");
    console.log(state);
    console.trace("close-trace");
    console.groupEnd();
  } catch (error) {
    // Ignore logging errors.
  }
};

const isKnowledgeModalVisible = () =>
  !!(
    knowledgeTestModal &&
    (knowledgeTestModal.classList.contains("is-open") || knowledgeTestModal.dataset.keepOpen === "1")
  );

const ensureKnowledgeModalOpen = () => {
  if (!knowledgeTestModal) {
    return;
  }
  if (!knowledgeTestModal.classList.contains("is-open")) {
    knowledgeTestModal.classList.add("is-open");
    knowledgeTestModal.setAttribute("aria-hidden", "false");
    syncModalBodyScroll();
  }
};

const startKnowledgeKeepOpen = () => {
  if (knowledgeKeepOpenTimer) {
    clearInterval(knowledgeKeepOpenTimer);
    knowledgeKeepOpenTimer = null;
  }
  if (!knowledgeTestModal) {
    return;
  }
  ensureKnowledgeModalOpen();
  knowledgeKeepOpenTimer = setInterval(() => {
    if (!knowledgeTestState.finished) {
      clearInterval(knowledgeKeepOpenTimer);
      knowledgeKeepOpenTimer = null;
      return;
    }
    ensureKnowledgeModalOpen();
  }, 200);
};

const stopKnowledgeKeepOpen = () => {
  if (knowledgeKeepOpenTimer) {
    clearInterval(knowledgeKeepOpenTimer);
    knowledgeKeepOpenTimer = null;
  }
};

const getLevelPercent = (stats, level) => {
  const total = Number(stats[level]?.total || 0);
  if (total <= 0) {
    return 0;
  }
  const correct = Number(stats[level]?.correct || 0);
  return correct / total;
};

const getRecommendedLevel = (stats) => {
  const passThreshold = 0.6;
  if (getLevelPercent(stats, "A1") < passThreshold) {
    return "A1";
  }
  if (getLevelPercent(stats, "A2") < passThreshold) {
    return "A2";
  }
  if (getLevelPercent(stats, "B1") < passThreshold) {
    return "B1";
  }
  return "B2";
};

const renderKnowledgeQuestion = () => {
  if (!knowledgeTestQuestion || !knowledgeTestOptions || !knowledgeTestProgress || !knowledgeTestNextBtn) {
    return;
  }
  const current = knowledgePlacementQuestions[knowledgeTestState.index];
  knowledgeTestProgress.textContent = `Question ${knowledgeTestState.index + 1} of ${knowledgePlacementQuestions.length}`;
  knowledgeTestQuestion.textContent = current.question;
  knowledgeTestOptions.innerHTML = "";
  if (knowledgeTestFeedback) {
    knowledgeTestFeedback.textContent = "";
    knowledgeTestFeedback.className = "knowledge-test-feedback";
  }
  knowledgeTestNextBtn.disabled = true;
  knowledgeTestNextBtn.textContent =
    knowledgeTestState.index === knowledgePlacementQuestions.length - 1 ? "Finish" : "Next";

  current.options.forEach((optionText, optionIndex) => {
    const optionButton = document.createElement("button");
    optionButton.type = "button";
    optionButton.className = "knowledge-test-option";
    optionButton.textContent = optionText;
    optionButton.addEventListener("click", () => {
      knowledgeTestState.selected = optionIndex;
      const allOptions = knowledgeTestOptions.querySelectorAll(".knowledge-test-option");
      allOptions.forEach((button) => {
        button.classList.remove("is-selected");
      });
      optionButton.classList.add("is-selected");
      knowledgeTestNextBtn.disabled = false;
    });
    knowledgeTestOptions.appendChild(optionButton);
  });
};

const showKnowledgeResult = () => {
  if (!knowledgeTestQuestion || !knowledgeTestOptions || !knowledgeTestProgress || !knowledgeTestHelp) {
    return;
  }
  const totalQuestions = knowledgePlacementQuestions.length;
  const level = getRecommendedLevel(knowledgeTestState.levelStats);
  const a1Percent = Math.round(getLevelPercent(knowledgeTestState.levelStats, "A1") * 100);
  const a2Percent = Math.round(getLevelPercent(knowledgeTestState.levelStats, "A2") * 100);
  const b1Percent = Math.round(getLevelPercent(knowledgeTestState.levelStats, "B1") * 100);
  const b2Percent = Math.round(getLevelPercent(knowledgeTestState.levelStats, "B2") * 100);
  knowledgeTestState.finished = true;
  if (knowledgeTestModal) {
    knowledgeTestModal.dataset.keepOpen = "1";
  }
  ensureKnowledgeModalOpen();
  knowledgeCloseBlockedUntil = Date.now() + 2200;
  startKnowledgeKeepOpen();
  if (knowledgeResultHoldTimer) {
    clearInterval(knowledgeResultHoldTimer);
    knowledgeResultHoldTimer = null;
  }
  const holdUntil = Date.now() + 5000;
  knowledgeResultHoldTimer = setInterval(() => {
    if (!knowledgeTestModal) {
      clearInterval(knowledgeResultHoldTimer);
      knowledgeResultHoldTimer = null;
      return;
    }
    if (!knowledgeTestState.finished || Date.now() > holdUntil) {
      clearInterval(knowledgeResultHoldTimer);
      knowledgeResultHoldTimer = null;
      return;
    }
    if (!knowledgeTestModal.classList.contains("is-open")) {
      knowledgeTestModal.classList.add("is-open");
      knowledgeTestModal.setAttribute("aria-hidden", "false");
      syncModalBodyScroll();
    }
  }, 120);
  knowledgeTestProgress.textContent = "Result";
  knowledgeTestQuestion.textContent = `Your level is ${level}`;
  knowledgeTestHelp.textContent = `You solved ${knowledgeTestState.correctAnswers} out of ${totalQuestions}. Score: ${knowledgeTestState.score} points. Block results: A1 ${a1Percent}%, A2 ${a2Percent}%, B1 ${b1Percent}%, B2 ${b2Percent}%. Recommended course: ${level}.`;
  knowledgeTestOptions.innerHTML = "";
  if (knowledgeTestFeedback) {
    knowledgeTestFeedback.textContent = "Preparing next step...";
    knowledgeTestFeedback.className = "knowledge-test-feedback is-final";
  }
  if (knowledgeResultCtaTimer) {
    clearTimeout(knowledgeResultCtaTimer);
  }
  knowledgeResultCtaTimer = setTimeout(() => {
    knowledgeTestOptions.innerHTML = "";
    const resultButton = document.createElement("button");
    resultButton.type = "button";
    resultButton.className = "btn knowledge-test-result-link";
    resultButton.textContent = `Go to ${level} course`;
    resultButton.addEventListener("click", () => {
      window.location.href = `${level.toLowerCase()}.html`;
    });
    knowledgeTestOptions.appendChild(resultButton);
    if (knowledgeTestFeedback) {
      knowledgeTestFeedback.textContent = "You can retake the test any time.";
      knowledgeTestFeedback.className = "knowledge-test-feedback is-final";
    }
  }, 1400);
  const authUser = getAuthUser();
  if (authUser && ENABLE_KNOWLEDGE_RESULT_SAVE) {
    fetch(`${API_BASE_URL}/api/knowledge-test/submit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: authUser,
        total_questions: totalQuestions,
        correct_answers: knowledgeTestState.correctAnswers,
        score_points: knowledgeTestState.score,
        recommended_level: level,
      }),
    }).catch(() => {
      if (knowledgeTestFeedback) {
        knowledgeTestFeedback.textContent = "Could not save test result. You can still retake the test.";
        knowledgeTestFeedback.className = "knowledge-test-feedback is-wrong";
      }
    });
  } else if (knowledgeTestFeedback) {
    knowledgeTestFeedback.textContent = "Login to save this result in admin panel history.";
    knowledgeTestFeedback.className = "knowledge-test-feedback is-wrong";
  }
  if (knowledgeTestNextBtn) {
    knowledgeTestNextBtn.hidden = true;
  }
  if (knowledgeTestRestartBtn) {
    knowledgeTestRestartBtn.hidden = false;
  }
};

const startKnowledgeTest = () => {
  if (knowledgeResultCtaTimer) {
    clearTimeout(knowledgeResultCtaTimer);
    knowledgeResultCtaTimer = null;
  }
  if (knowledgeResultHoldTimer) {
    clearInterval(knowledgeResultHoldTimer);
    knowledgeResultHoldTimer = null;
  }
  stopKnowledgeKeepOpen();
  if (knowledgeTestModal) {
    delete knowledgeTestModal.dataset.keepOpen;
  }
  knowledgeTestState.index = 0;
  knowledgeTestState.score = 0;
  knowledgeTestState.correctAnswers = 0;
  knowledgeTestState.selected = null;
  knowledgeTestState.finished = false;
  knowledgeTestState.levelStats = {
    A1: { correct: 0, total: 0 },
    A2: { correct: 0, total: 0 },
    B1: { correct: 0, total: 0 },
    B2: { correct: 0, total: 0 },
  };
  if (knowledgeTestHelp) {
    knowledgeTestHelp.textContent = "Answer all questions to get your recommended level: A1, A2, B1, or B2.";
  }
  if (knowledgeTestRestartBtn) {
    knowledgeTestRestartBtn.hidden = true;
  }
  if (knowledgeTestNextBtn) {
    knowledgeTestNextBtn.hidden = false;
  }
  renderKnowledgeQuestion();
};

const closeKnowledgeTestModal = (force = false) => {
  if (!knowledgeTestModal) {
    return;
  }
  if (knowledgeTestState.finished && Date.now() < knowledgeCloseBlockedUntil) {
    logKnowledgeClose("blocked-by-time");
    return;
  }
  if (knowledgeTestState.finished && (!force || !knowledgeCloseRequested)) {
    logKnowledgeClose("blocked-by-finish");
    return;
  }
  if (force) {
    stopKnowledgeKeepOpen();
    delete knowledgeTestModal.dataset.keepOpen;
  }
  logKnowledgeClose(force ? "force-close" : "close");
  knowledgeTestModal.classList.remove("is-open");
  knowledgeTestModal.setAttribute("aria-hidden", "true");
  if (knowledgeResultCtaTimer) {
    clearTimeout(knowledgeResultCtaTimer);
    knowledgeResultCtaTimer = null;
  }
  if (knowledgeResultHoldTimer) {
    clearInterval(knowledgeResultHoldTimer);
    knowledgeResultHoldTimer = null;
  }
  syncModalBodyScroll();
};

const openKnowledgeTestModal = () => {
  if (!knowledgeTestModal) {
    return;
  }
  startKnowledgeTest();
  knowledgeTestModal.classList.add("is-open");
  knowledgeTestModal.setAttribute("aria-hidden", "false");
  syncModalBodyScroll();
};

const getAuthState = () => {
  const raw = localStorage.getItem(AUTH_STORAGE_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.username === "string") {
        return {
          id: Number(parsed.id) || null,
          username: String(parsed.username || "").trim(),
          fullName: parsed.fullName || parsed.full_name || "",
          role: String(parsed.role || "student").trim().toLowerCase(),
          level: String(parsed.level || "").trim(),
          sessionToken: parsed.sessionToken || parsed.session_token || "",
        };
      }
    } catch (error) {
      // Continue to legacy key fallback
    }
  }

  const legacyUser = localStorage.getItem(LEGACY_AUTH_STORAGE_KEY);
  if (!legacyUser) {
    return null;
  }
  return { id: null, username: legacyUser, fullName: "", role: "student", level: "", sessionToken: "" };
};

const setAuthState = (authState) => {
  if (!authState) {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem(LEGACY_AUTH_STORAGE_KEY);
    return;
  }
  const normalized = {
    id: authState.id || null,
    username: String(authState.username || "").trim(),
    fullName: String(authState.fullName || authState.full_name || "").trim(),
    role: String(authState.role || "student").trim().toLowerCase(),
    level: String(authState.level || "").trim(),
    sessionToken: String(authState.sessionToken || authState.session_token || "").trim(),
  };
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(normalized));
  localStorage.removeItem(LEGACY_AUTH_STORAGE_KEY);
};

const getAuthUser = () => {
  const authState = getAuthState();
  return authState ? authState.username : null;
};

const isAdminUser = () => {
  const authState = getAuthState();
  return !!authState && authState.role === "admin";
};

const isExpressLevel = (value) => String(value || "").toLowerCase().includes("express");

const normalizeCourseLevel = (value) => {
  const raw = String(value || "").trim().toLowerCase();
  if (!raw) {
    return "";
  }
  return raw.replace(/[-_ ]express$/i, "").trim();
};

const formatLevelLabel = (value) => {
  const raw = String(value || "").trim();
  if (!raw) {
    return "";
  }
  const lower = raw.toLowerCase();
  if (/-express$|_express$| express$/.test(lower)) {
    const base = normalizeCourseLevel(lower).toUpperCase();
    return `${base} Express`;
  }
  return raw.toUpperCase();
};

const formatScheduleLabel = (schedule, level) => {
  const raw = String(schedule || "").trim().toLowerCase();
  if (!raw) {
    return isExpressLevel(level) ? "Daily" : "-";
  }
  if (raw === "mwf") {
    return "Mon / Wed / Fri";
  }
  if (raw === "tthsa") {
    return "Tue / Thu / Sat";
  }
  return raw;
};

const parseExpressPriceLabel = (value) => {
  const raw = String(value || "").trim();
  if (!raw) {
    return { price: "", isExpress: false };
  }
  const expressPattern = /\s*\(?\s*express\s*\)?\s*$/i;
  const isExpress = expressPattern.test(raw);
  const cleaned = isExpress ? raw.replace(expressPattern, "").trim() : raw;
  return { price: cleaned || raw, isExpress };
};

const countPendingEnrollmentRequests = (items) =>
  (Array.isArray(items) ? items : []).reduce(
    (total, item) => total + (Number(item && item.seen_by_admin) === 1 ? 0 : 1),
    0
  );

const formatUnlockCountdown = (diffMs) => {
  const safeMs = Math.max(0, diffMs);
  const totalMinutes = Math.floor(safeMs / 60000);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;
  if (days > 0) {
    return `${days}d ${hours}h`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};

const applyLessonUnlockTimer = (button, unlockAtIso, onUnlock = null) => {
  if (!button || !unlockAtIso) {
    return;
  }
  const unlockAt = new Date(unlockAtIso).getTime();
  if (!Number.isFinite(unlockAt)) {
    return;
  }

  if (!button.dataset.originalText) {
    button.dataset.originalText = button.textContent;
  }
  if (!button.dataset.originalHref) {
    button.dataset.originalHref = button.getAttribute("href") || "#";
  }

  if (button.dataset.unlockTimerId) {
    clearInterval(Number(button.dataset.unlockTimerId));
    delete button.dataset.unlockTimerId;
  }

  // Ensure it's not clickable while waiting.
  button.href = "#";
  button.classList.add("is-locked-lesson-btn", "lesson-unlock-timer");
  button.setAttribute("aria-disabled", "true");
  button.setAttribute("tabindex", "-1");
  button.onclick = (event) => {
    event.preventDefault();
  };

  const update = () => {
    const diff = unlockAt - Date.now();
    if (diff <= 0) {
      if (button.dataset.unlockTimerId) {
        clearInterval(Number(button.dataset.unlockTimerId));
        delete button.dataset.unlockTimerId;
      }
      if (typeof onUnlock === "function") {
        onUnlock();
      }
      return;
    }
    button.textContent = `Opens in ${formatUnlockCountdown(diff)}`;
  };

  update();
  const timerId = window.setInterval(update, 60000);
  button.dataset.unlockTimerId = String(timerId);
};

const renderLessonsCatalogFromOverrides = async () => {
  const lessonsPageEl = document.querySelector(".lessons-page");
  if (!lessonsPageEl) {
    return;
  }
  const course = getCourseFromPathname();
  if (!course) {
    return;
  }
  const gridEl = lessonsPageEl.querySelector(".lessons-grid");
  if (!gridEl) {
    return;
  }
  const merged = await mergeCourseLessons(course);
  if (!merged || !Array.isArray(merged.list) || merged.list.length === 0) {
    return;
  }

  const cards = merged.list
    .map((lesson) => {
      const lessonNumber = Number(lesson.lesson_number) || 1;
      const title = stripThemePrefix(lesson.title || `Lesson ${lessonNumber}`);
      const video = String(lesson.video || "");
      const isYoutube = isYouTubeUrl(video);
      const cover =
        String(lesson.cover || "") || (isYoutube ? getYouTubeCoverUrl(video) : "") || "assets/images/cover.jpg";
      const imgHtml = cover
        ? `<img src="${cover}" alt="Lesson ${lessonNumber} cover">`
        : `<span class="lesson-cover-placeholder">Lesson Cover</span>`;
      return `
      <article class="lesson-card">
        <div class="lesson-cover">${imgHtml}</div>
        <div class="lesson-content">
          <h3>Lesson ${lessonNumber}: ${escapeHtml(title)}</h3>
          <a href="lesson.html?course=${encodeURIComponent(course)}&lesson=${lessonNumber}" class="btn lesson-watch-btn">Go to the lesson</a>
        </div>
      </article>`;
    })
    .join("");

  gridEl.innerHTML = cards;
};

let adminModalsCloseBound = false;
const bindAdminModalsCloseHandlers = () => {
  if (adminModalsCloseBound) return;
  adminModalsCloseBound = true;
  document.addEventListener("click", async (event) => {
    const btn = event.target && event.target.closest ? event.target.closest("[data-admin-close]") : null;
    if (!btn) return;
    const kind = btn.getAttribute("data-admin-close");
    if (kind === "edit-code") closeAdminModal("admin-edit-code-modal");
    if (kind === "manager") closeAdminModal("admin-lessons-manager-modal");
    if (kind === "cert-manager") closeAdminModal("admin-certificates-manager-modal");
    if (kind === "subs-manager") closeAdminModal("admin-subscriptions-manager-modal");
    if (kind === "lesson-edit") await requestCloseLessonEditor();
    if (kind === "quiz") await requestCloseQuizEditor();
    if (kind === "quiz-reorder") {
      closeAdminModal("admin-quiz-reorder-modal");
      openAdminModal("admin-quiz-editor-modal");
    }
    if (kind === "cert-edit") closeAdminModal("admin-certificate-edit-modal");
    if (kind === "subs-edit") closeAdminModal("admin-subscription-edit-modal");
  });
};

const ensureAdminCertificatesModals = () => {
  bindAdminModalsCloseHandlers();
  if (document.getElementById("admin-certificates-manager-modal")) {
    return;
  }

  const wrap = document.createElement("div");
  wrap.innerHTML = `
    <div id="admin-certificates-manager-modal" class="admin-lessons-modal" aria-hidden="true">
      <div class="admin-lessons-manager-card" role="dialog" aria-modal="true" aria-label="Certificates manager">
        <div class="admin-lessons-modal-header">
          <div class="admin-certificates-manager-left">
            <button id="admin-certificates-add-btn" type="button" class="btn admin-lessons-add">+ Add new certificate</button>
            <div class="admin-certificates-tabs" role="tablist" aria-label="Certificates section">
              <button type="button" class="admin-certificates-tab is-active" data-section="ielts">IELTS</button>
              <button type="button" class="admin-certificates-tab" data-section="cefr">CEFR</button>
            </div>
          </div>
          <button type="button" class="admin-lessons-close" data-admin-close="cert-manager">Close</button>
        </div>
        <div id="admin-certificates-list" class="admin-lessons-list"></div>
      </div>
    </div>

    <div id="admin-certificate-edit-modal" class="admin-lessons-modal" aria-hidden="true">
      <div class="admin-lessons-modal-card" role="dialog" aria-modal="true" aria-label="Edit certificate">
        <div class="admin-lessons-modal-header">
          <h3 id="admin-certificate-edit-title" class="admin-lessons-modal-title">Edit Certificate</h3>
          <button type="button" class="admin-lessons-close" data-admin-close="cert-edit">Close</button>
        </div>
        <div class="admin-certificate-edit-grid">
          <div class="admin-certificate-preview">
            <img id="admin-certificate-preview-img" alt="Certificate preview">
          </div>
          <div class="admin-certificate-fields">
            <label class="admin-certificate-label" for="admin-certificate-section">Section</label>
            <select id="admin-certificate-section" class="admin-lessons-input">
              <option value="ielts">IELTS</option>
              <option value="cefr">CEFR</option>
            </select>
            <label class="admin-certificate-label" for="admin-certificate-name">Name</label>
            <input id="admin-certificate-name" class="admin-lessons-input" type="text" placeholder="Student name">
            <label class="admin-certificate-label" for="admin-certificate-motto">Motto</label>
            <textarea id="admin-certificate-motto" class="admin-lessons-input admin-certificate-textarea" rows="3" placeholder="Short motto under the name"></textarea>
            <label class="admin-certificate-label" for="admin-certificate-image">Image</label>
            <input id="admin-certificate-image" class="admin-lessons-input" type="file" accept="image/*">
            <p id="admin-certificate-edit-status" class="admin-lessons-status" aria-live="polite"></p>
            <div class="admin-lessons-actions">
              <button id="admin-certificate-save" type="button" class="btn admin-lessons-primary">Save</button>
              <button id="admin-certificate-cancel" type="button" class="btn admin-lessons-secondary">Cancel</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(wrap);
};

const ensureAdminSubscriptionsModals = () => {
  bindAdminModalsCloseHandlers();
  if (document.getElementById("admin-subscriptions-manager-modal")) {
    return;
  }

  const wrap = document.createElement("div");
  wrap.innerHTML = `
    <div id="admin-subscriptions-manager-modal" class="admin-lessons-modal" aria-hidden="true">
      <div class="admin-lessons-manager-card" role="dialog" aria-modal="true" aria-label="Subscriptions manager">
        <div class="admin-lessons-modal-header">
          <button id="admin-subscriptions-add-btn" type="button" class="btn admin-lessons-add">+ Add new subscription</button>
          <button type="button" class="admin-lessons-close" data-admin-close="subs-manager">Close</button>
        </div>
        <div id="admin-subscriptions-list" class="admin-lessons-list"></div>
      </div>
    </div>

    <div id="admin-subscription-edit-modal" class="admin-lessons-modal" aria-hidden="true">
      <div class="admin-lessons-modal-card admin-subscription-edit-card" role="dialog" aria-modal="true" aria-label="Edit subscription">
        <div class="admin-lessons-modal-header">
          <h3 id="admin-subscription-edit-title" class="admin-lessons-modal-title">Edit Subscription</h3>
          <button type="button" class="admin-lessons-close" data-admin-close="subs-edit">Close</button>
        </div>
        <div class="admin-subscription-edit-fields">
          <label class="admin-certificate-label" for="admin-subscription-name">Name</label>
          <input id="admin-subscription-name" class="admin-lessons-input" type="text" placeholder="A1" />
          <label class="admin-certificate-label" for="admin-subscription-badge">Badge (optional)</label>
          <input id="admin-subscription-badge" class="admin-lessons-input" type="text" placeholder="Express" />
          <label class="admin-certificate-label" for="admin-subscription-features">What's included (one per line)</label>
          <textarea id="admin-subscription-features" class="admin-lessons-input admin-subscription-features" rows="6" placeholder="Feature 1&#10;Feature 2"></textarea>
          <div class="admin-subscription-price-grid">
            <div>
              <label class="admin-certificate-label" for="admin-subscription-price">New price (UZS)</label>
              <input id="admin-subscription-price" class="admin-lessons-input" type="text" inputmode="numeric" placeholder="225000" />
            </div>
            <div>
              <label class="admin-certificate-label" for="admin-subscription-old-price">Old price (optional)</label>
              <input id="admin-subscription-old-price" class="admin-lessons-input" type="text" inputmode="numeric" placeholder="450000" />
            </div>
            <div>
              <label class="admin-certificate-label" for="admin-subscription-discount-percent">Discount % (optional)</label>
              <input id="admin-subscription-discount-percent" class="admin-lessons-input" type="number" min="0" max="100" step="1" placeholder="50" />
            </div>
            <div>
              <label class="admin-certificate-label" for="admin-subscription-discount-ends">Discount ends (optional)</label>
              <input id="admin-subscription-discount-ends" class="admin-lessons-input" type="datetime-local" />
            </div>
          </div>
          <p id="admin-subscription-edit-status" class="admin-lessons-status" aria-live="polite"></p>
          <div class="admin-lessons-actions">
            <button id="admin-subscription-save" type="button" class="btn admin-lessons-primary">Save</button>
            <button id="admin-subscription-cancel" type="button" class="btn admin-lessons-secondary">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(wrap);
};

const ensureAdminLessonsModals = () => {
  bindAdminModalsCloseHandlers();
  if (document.getElementById("admin-edit-code-modal")) {
    return;
  }

  const wrap = document.createElement("div");
  wrap.innerHTML = `
    <div id="admin-edit-code-modal" class="admin-lessons-modal" aria-hidden="true">
      <div class="admin-lessons-modal-card" role="dialog" aria-modal="true" aria-label="Admin edit access">
        <div class="admin-lessons-modal-header">
          <h3 class="admin-lessons-modal-title">Enter access code</h3>
          <button type="button" class="admin-lessons-close" data-admin-close="edit-code">Close</button>
        </div>
        <p id="admin-edit-code-hint" class="admin-lessons-hint">We sent a 6-digit PIN to your Telegram. You can also use your permanent code.</p>
        <input id="admin-edit-code-input" class="admin-lessons-input" type="text" inputmode="numeric" placeholder="Enter PIN / code">
        <p id="admin-edit-code-status" class="admin-lessons-status" aria-live="polite"></p>
        <div class="admin-lessons-actions">
          <button id="admin-edit-code-submit" type="button" class="btn admin-lessons-primary">Submit</button>
          <button id="admin-edit-code-resend" type="button" class="btn admin-lessons-secondary">Resend PIN</button>
        </div>
      </div>
    </div>

    <div id="admin-lessons-manager-modal" class="admin-lessons-modal" aria-hidden="true">
      <div class="admin-lessons-manager-card" role="dialog" aria-modal="true" aria-label="Lessons manager">
        <div class="admin-lessons-modal-header">
          <button id="admin-lessons-add-btn" type="button" class="btn admin-lessons-add">+ Add new lesson</button>
          <button type="button" class="admin-lessons-close" data-admin-close="manager">Close</button>
        </div>
        <div id="admin-lessons-list" class="admin-lessons-list"></div>
      </div>
    </div>

    <div id="admin-lesson-edit-modal" class="admin-lessons-modal" aria-hidden="true">
      <div class="admin-lesson-edit-card" role="dialog" aria-modal="true" aria-label="Edit lesson">
        <div class="admin-lesson-edit-topbar">
          <h3 id="admin-lesson-edit-title" class="admin-lesson-edit-title">Edit Lesson</h3>
          <button type="button" class="admin-lessons-close admin-lesson-close" data-admin-close="lesson-edit">Close</button>
        </div>
        <div class="admin-lesson-theme-row">
          <input id="admin-lesson-theme-input" class="admin-lessons-input admin-lesson-theme-input" type="text" placeholder="Theme: ...">
        </div>
        <div class="admin-lesson-edit-grid">
          <div class="admin-lesson-cover-col">
            <div class="admin-lesson-cover-preview">
              <img id="admin-lesson-cover-img" alt="Cover preview">
            </div>
            <input id="admin-lesson-cover-input" class="admin-lessons-input" type="text" placeholder="Cover URL">
            <div class="admin-lesson-cover-actions">
              <button id="admin-lesson-cover-upload" type="button" class="btn admin-lessons-secondary">Upload cover</button>
              <button id="admin-lesson-cover-clear" type="button" class="btn admin-lessons-secondary">Clear</button>
              <input id="admin-lesson-cover-file" type="file" accept=".png,.jpg,.jpeg,.webp" hidden>
            </div>
          </div>
          <div class="admin-lesson-buttons-col">
            <button id="admin-lesson-review-tasks" type="button" class="admin-lesson-pill admin-lesson-pill-tasks">Review tasks</button>
            <button id="admin-lesson-review-homework" type="button" class="admin-lesson-pill admin-lesson-pill-homework">Review homework</button>
            <button id="admin-lesson-review-presentation" type="button" class="admin-lesson-pill admin-lesson-pill-presentation">Review presentation</button>
          </div>
          <div class="admin-lesson-video-col">
            <div id="admin-lesson-video-preview" class="admin-lesson-video-preview"></div>
            <input id="admin-lesson-video-input" class="admin-lessons-input" type="text" placeholder="YouTube / video URL">
          </div>
        </div>
        <div class="admin-lesson-edit-footer">
          <p id="admin-lesson-edit-status" class="admin-lessons-status" aria-live="polite"></p>
          <button id="admin-lesson-save" type="button" class="btn admin-lessons-primary admin-lesson-save">Save</button>
        </div>
      </div>
    </div>

    <div id="admin-unsaved-confirm-modal" class="admin-lessons-modal" aria-hidden="true">
      <div class="admin-lessons-confirm-card" role="dialog" aria-modal="true" aria-label="Unsaved changes">
        <h3>Save changes?</h3>
        <p>You have unsaved changes. Do you want to save them?</p>
        <div class="admin-lessons-actions">
          <button id="admin-unsaved-yes" type="button" class="btn admin-lessons-primary">Yes</button>
          <button id="admin-unsaved-no" type="button" class="btn admin-lessons-secondary">No</button>
        </div>
      </div>
    </div>

    <div id="admin-quiz-editor-modal" class="admin-lessons-modal" aria-hidden="true">
      <div class="admin-quiz-editor-card" role="dialog" aria-modal="true" aria-label="Edit tasks">
        <div class="admin-quiz-topbar">
          <div class="admin-quiz-topbar-left">
            <span id="admin-quiz-q-label" class="admin-quiz-q-label">Q1</span>
          </div>
          <div class="admin-quiz-topbar-right">
            <button id="admin-quiz-remove" type="button" class="btn admin-lessons-secondary">Remove</button>
            <button type="button" class="admin-lessons-close" data-admin-close="quiz">Close</button>
          </div>
        </div>
        <input id="admin-quiz-question" class="admin-lessons-input" type="text" placeholder="Question">
        <div class="admin-quiz-options">
          ${["A", "B", "C", "D"]
            .map(
              (key) => `
            <label class="admin-quiz-option">
              <input type="radio" name="admin-quiz-correct" value="${key}">
              <span class="admin-quiz-option-key">${key}</span>
              <input class="admin-quiz-option-input" data-option-key="${key}" type="text" placeholder="Option ${key}">
            </label>`
            )
            .join("")}
        </div>
        <div class="admin-quiz-explanations">
          <label class="admin-quiz-expl-label">Explanation (Main)</label>
          <textarea id="admin-quiz-expl-main" class="admin-quiz-textarea" rows="4"></textarea>
          <label class="admin-quiz-expl-label">Explanation (Simple)</label>
          <textarea id="admin-quiz-expl-simple" class="admin-quiz-textarea" rows="4"></textarea>
          <label class="admin-quiz-expl-label">Explanation (More Detail)</label>
          <textarea id="admin-quiz-expl-detail" class="admin-quiz-textarea" rows="4"></textarea>
        </div>
        <div class="admin-quiz-footer">
          <div class="admin-quiz-nav">
            <button id="admin-quiz-prev" type="button" class="btn admin-lessons-secondary">Prev</button>
            <button id="admin-quiz-next" type="button" class="btn admin-lessons-secondary">Next</button>
            <button id="admin-quiz-reorder" type="button" class="btn admin-lessons-secondary">Reorder</button>
            <button id="admin-quiz-add" type="button" class="btn admin-lessons-secondary">+ Add</button>
          </div>
          <div class="admin-quiz-save-wrap">
            <p id="admin-quiz-status" class="admin-lessons-status" aria-live="polite"></p>
            <button id="admin-quiz-save" type="button" class="btn admin-lessons-primary">Save</button>
          </div>
        </div>
      </div>
    </div>

    <div id="admin-quiz-reorder-modal" class="admin-lessons-modal" aria-hidden="true">
      <div class="admin-lessons-manager-card admin-quiz-reorder-card" role="dialog" aria-modal="true" aria-label="Reorder tasks">
        <div class="admin-lessons-modal-header">
          <h3 class="admin-lessons-modal-title">Reorder questions</h3>
          <button type="button" class="admin-lessons-close" data-admin-close="quiz-reorder">Close</button>
        </div>
        <p class="admin-lessons-hint">Drag to reorder. Click a row to jump to that question.</p>
        <div id="admin-quiz-reorder-list" class="admin-quiz-reorder-list"></div>
      </div>
    </div>
  `;
  document.body.appendChild(wrap);
};

const openAdminModal = (id) => {
  const el = document.getElementById(id);
  if (!el) {
    return;
  }
  el.classList.add("is-open");
  el.setAttribute("aria-hidden", "false");
  syncModalBodyScroll();
};

const closeAdminModal = (id) => {
  const el = document.getElementById(id);
  if (!el) {
    return;
  }
  el.classList.remove("is-open");
  el.setAttribute("aria-hidden", "true");
  syncModalBodyScroll();
};

const adminPostJson = async (path, payload, timeoutMs = 8000) => {
  await ensureApiBaseUrl();
  const authState = getAuthState();
  const sessionToken = (authState && authState.sessionToken) || "";
  try {
    const response = await fetchWithTimeout(`${API_BASE_URL}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Session-Token": sessionToken,
      },
      body: JSON.stringify(payload || {}),
    }, timeoutMs);
    const data = await response.json().catch(() => ({}));
    return { ok: response.ok, status: response.status, data };
  } catch (error) {
    return { ok: false, status: 0, data: { error: "network_error" } };
  }
};

const adminGetJson = async (path, timeoutMs = 8000) => {
  await ensureApiBaseUrl();
  const authState = getAuthState();
  const sessionToken = (authState && authState.sessionToken) || "";
  try {
    const response = await fetchWithTimeout(`${API_BASE_URL}${path}`, {
      method: "GET",
      headers: {
        "X-Session-Token": sessionToken,
      },
    }, timeoutMs);
    const data = await response.json().catch(() => ({}));
    return { ok: response.ok, status: response.status, data };
  } catch (error) {
    return { ok: false, status: 0, data: { error: "network_error" } };
  }
};

const adminFetchRaw = async (url, options = {}, timeoutMs = 8000) => {
  await ensureApiBaseUrl();
  const authState = getAuthState();
  const sessionToken = (authState && authState.sessionToken) || "";
  const headers = Object.assign({}, options.headers || {}, { "X-Session-Token": sessionToken });
  return fetchWithTimeout(url, Object.assign({}, options, { headers }), timeoutMs);
};

const initAdminLessonsEditing = () => {
  const lessonsPageEl = document.querySelector(".lessons-page");
  if (!lessonsPageEl) {
    return;
  }
  const editBtn = document.getElementById("admin-lessons-edit-btn");
  if (!editBtn) {
    return;
  }
  const authState = getAuthState();
  if (!(authState && authState.role === "admin" && authState.username)) {
    editBtn.hidden = true;
    return;
  }
  editBtn.hidden = false;
  if (editBtn.dataset.bound === "1") {
    return;
  }
  editBtn.dataset.bound = "1";
  ensureAdminLessonsModals();

  const course = getCourseFromPathname();

  const openManager = async () => {
    const merged = await mergeCourseLessons(course);
    const listEl = document.getElementById("admin-lessons-list");
    if (!listEl) {
      return;
    }
    listEl.innerHTML = "";
    merged.list.forEach((lesson) => {
      const row = document.createElement("div");
      row.className = "admin-lessons-row";
      row.dataset.lessonNumber = String(lesson.lesson_number);
      row.innerHTML = `
        <div class="admin-lessons-handle" draggable="true" aria-label="Move"></div>
        <div class="admin-lessons-meta">
          <div class="admin-lessons-name"><strong>Lesson ${lesson.lesson_number}</strong></div>
          <div class="admin-lessons-sub">${escapeHtml(stripThemePrefix(lesson.title))}</div>
        </div>
        <div class="admin-lessons-row-actions">
          <button type="button" class="btn admin-lessons-mini admin-lessons-mini-edit">Edit</button>
          <button type="button" class="btn admin-lessons-mini admin-lessons-mini-delete">Delete</button>
        </div>
      `;
      listEl.appendChild(row);
    });

    // Reordering: drag-and-drop (desktop) + pointer-driven sorting (touch).
    let dragged = null;
    let pointerActive = false;
    let pointerId = null;
    let dragPreviewEl = null;

    const persistOrder = async () => {
      const order = Array.from(listEl.querySelectorAll(".admin-lessons-row"))
        .map((row) => Number(row.dataset.lessonNumber) || 0)
        .filter((n) => n > 0);
      await adminPostJson("/api/admin/lessons/reorder", {
        admin_username: authState.username,
        course,
        order,
      });
      invalidateLessonsCache(course);
      await renderLessonsCatalogFromOverrides();
      applyLessonAccessLocks();
      applyLessonCompletionBadges();
    };

    listEl.querySelectorAll(".admin-lessons-handle").forEach((handle) => {
      handle.addEventListener("dragstart", (event) => {
        const parent = handle.closest(".admin-lessons-row");
        if (!parent) return;
        dragged = parent;
        if (event.dataTransfer) {
          event.dataTransfer.effectAllowed = "move";
          // Show the whole lesson "strip" as the drag preview (not only the 9-dot handle).
          try {
            if (dragPreviewEl && dragPreviewEl.remove) {
              dragPreviewEl.remove();
            }
            const clone = parent.cloneNode(true);
            clone.classList.add("admin-drag-preview");
            clone.style.width = `${parent.getBoundingClientRect().width}px`;
            clone.style.position = "absolute";
            clone.style.top = "-9999px";
            clone.style.left = "-9999px";
            clone.style.pointerEvents = "none";
            document.body.appendChild(clone);
            dragPreviewEl = clone;
            event.dataTransfer.setDragImage(clone, 32, 24);
          } catch (error) {
            // ignore
          }
        }
      });

      // Touch/pen sorting (mobile browsers usually don't support HTML5 drag).
      handle.addEventListener("pointerdown", (event) => {
        if (!event || (event.pointerType !== "touch" && event.pointerType !== "pen")) {
          return;
        }
        const parent = handle.closest(".admin-lessons-row");
        if (!parent) return;
        pointerActive = true;
        pointerId = event.pointerId;
        dragged = parent;
        dragged.classList.add("is-dragging");
        try {
          handle.setPointerCapture(pointerId);
        } catch (error) {
          // ignore
        }
        event.preventDefault();
      });

      handle.addEventListener("pointermove", (event) => {
        if (!pointerActive || !dragged || event.pointerId !== pointerId) return;
        const x = event.clientX;
        const y = event.clientY;
        const el = document.elementFromPoint(x, y);
        const targetRow = el && el.closest ? el.closest(".admin-lessons-row") : null;
        if (!targetRow || targetRow === dragged) return;
        const rect = targetRow.getBoundingClientRect();
        const shouldInsertAfter = y > rect.top + rect.height / 2;
        if (shouldInsertAfter) {
          targetRow.insertAdjacentElement("afterend", dragged);
        } else {
          targetRow.insertAdjacentElement("beforebegin", dragged);
        }
        event.preventDefault();
      });

      const finishPointerSort = async (event) => {
        if (!pointerActive || !dragged || (event && event.pointerId !== pointerId)) return;
        const row = dragged;
        pointerActive = false;
        pointerId = null;
        dragged = null;
        row.classList.remove("is-dragging");
        await persistOrder();
      };

      handle.addEventListener("pointerup", finishPointerSort);
      handle.addEventListener("pointercancel", finishPointerSort);
    });

    listEl.addEventListener("dragover", (event) => {
      event.preventDefault();
      const targetRow = event.target && event.target.closest ? event.target.closest(".admin-lessons-row") : null;
      if (!dragged || !targetRow || targetRow === dragged) return;
      const rect = targetRow.getBoundingClientRect();
      const shouldInsertAfter = event.clientY > rect.top + rect.height / 2;
      if (shouldInsertAfter) {
        targetRow.insertAdjacentElement("afterend", dragged);
      } else {
        targetRow.insertAdjacentElement("beforebegin", dragged);
      }
    });
    listEl.addEventListener("drop", async () => {
      if (!dragged) return;
      dragged = null;
      if (dragPreviewEl && dragPreviewEl.remove) {
        dragPreviewEl.remove();
      }
      dragPreviewEl = null;
      await persistOrder();
    });
    listEl.addEventListener("dragend", () => {
      dragged = null;
      if (dragPreviewEl && dragPreviewEl.remove) {
        dragPreviewEl.remove();
      }
      dragPreviewEl = null;
    });

    // Row actions.
    listEl.querySelectorAll(".admin-lessons-mini-edit").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const row = btn.closest(".admin-lessons-row");
        const lessonNumber = Number(row && row.dataset.lessonNumber) || 0;
        if (lessonNumber <= 0) {
          return;
        }
        await openLessonEditor(course, lessonNumber);
      });
    });
    listEl.querySelectorAll(".admin-lessons-mini-delete").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const row = btn.closest(".admin-lessons-row");
        const lessonNumber = Number(row && row.dataset.lessonNumber) || 0;
        if (lessonNumber <= 0) {
          return;
        }
        if (!window.confirm(`Delete Lesson ${lessonNumber}?`)) {
          return;
        }
        await adminPostJson("/api/admin/lessons/hide", {
          admin_username: authState.username,
          course,
          lesson_number: lessonNumber,
          is_hidden: 1,
        });
        invalidateLessonsCache(course);
        await renderLessonsCatalogFromOverrides();
        await openManager();
      });
    });
  };

  const requestPin = async () => {
    const now = Date.now();
    if (requestPin.inFlight && now - (requestPin.lastAt || 0) < 2500) {
      return requestPin.inFlight;
    }
    requestPin.lastAt = now;
    const statusEl = document.getElementById("admin-edit-code-status");
    if (statusEl) {
      statusEl.textContent = "Sending PIN...";
    }
    requestPin.inFlight = adminPostJson("/api/admin/edit-access/request", { admin_username: authState.username })
      .catch(() => ({ ok: false, status: 0, data: { error: "network_error" } }))
      .finally(() => {
        requestPin.inFlight = null;
      });
    const result = await requestPin.inFlight;
    if (!result.ok) {
      const error = (result.data && result.data.error) || "request_failed";
      if (statusEl) {
        statusEl.textContent =
          error === "telegram_chat_id_not_linked" || error === "admin_telegram_not_linked"
            ? "Telegram is not linked to this account."
            : error === "telegram_bot_not_configured"
              ? "Telegram bot is not configured on the server (TG_BOT_TOKEN)."
              : error === "telegram_send_failed"
                ? "Failed to send PIN to Telegram. Check TG_BOT_TOKEN and connectivity."
            : error === "network_error"
              ? "Auth server is not running."
              : error;
      }
      return false;
    }
    if (statusEl) {
      statusEl.textContent = "PIN sent. Check Telegram.";
    }
    return true;
  };
  requestPin.inFlight = null;
  requestPin.lastAt = 0;

  const verifyCode = async (code) => {
    const result = await adminPostJson("/api/admin/edit-access/verify", {
      admin_username: authState.username,
      code,
    });
    return result;
  };

  const openLessonsManagerSafe = async () => {
    openAdminModal("admin-lessons-manager-modal");
    const listEl = document.getElementById("admin-lessons-list");
    if (listEl) {
      listEl.innerHTML = "<div class=\"admin-lessons-status\">Loading...</div>";
    }
    try {
      await openManager();
    } catch (error) {
      if (listEl) {
        listEl.innerHTML = "<div class=\"admin-lessons-status\">Failed to load lessons manager.</div>";
      }
    }
  };

  let gateBusy = false;
  const startGate = async () => {
    const storageKey = `${ADMIN_EDIT_CODE_STORAGE_PREFIX}${authState.username}`;
    const safeGetStored = () => {
      try {
        return localStorage.getItem(storageKey) || "";
      } catch (error) {
        return "";
      }
    };
    const safeClearStored = () => {
      try {
        localStorage.removeItem(storageKey);
      } catch (error) {
        // ignore
      }
    };

    const stored = safeGetStored();
    if (stored) {
      const verify = await verifyCode(stored);
      if (verify.ok && verify.data && verify.data.ok) {
        if (typeof window.__ewmsDailyContentCallback === "function") {
          const cb = window.__ewmsDailyContentCallback;
          window.__ewmsDailyContentCallback = null;
          await cb();
        } else {
          await openLessonsManagerSafe();
        }
        return;
      }
      safeClearStored();
    }

    // Show UI immediately (even if the auth server is slow/offline).
    openAdminModal("admin-edit-code-modal");
    const input = document.getElementById("admin-edit-code-input");
    if (input) {
      input.value = "";
      input.focus();
    }
    return requestPin();
  };

  const triggerGate = () => {
    if (gateBusy) {
      return;
    }
    gateBusy = true;
    Promise.resolve()
      .then(() => startGate())
      .finally(() => {
        gateBusy = false;
      });
  };

  editBtn.addEventListener("click", triggerGate);
  // Extra safety: some environments lose listeners (cache, partial script errors, etc.)
  // and `onclick` remains a reliable fallback.
  editBtn.onclick = triggerGate;
  window.__ewmsOpenLessonsEditGate = triggerGate;
  if (window.PointerEvent) {
    editBtn.addEventListener("pointerup", (event) => {
      if (event.pointerType === "touch" || event.pointerType === "pen") {
        triggerGate();
      }
    });
  } else {
    editBtn.addEventListener("touchend", triggerGate, { passive: true });
  }

  // Modal buttons wiring.
  const submitBtn = document.getElementById("admin-edit-code-submit");
  const resendBtn = document.getElementById("admin-edit-code-resend");
  const inputEl = document.getElementById("admin-edit-code-input");
  const statusEl = document.getElementById("admin-edit-code-status");

  if (resendBtn) {
    resendBtn.addEventListener("click", requestPin);
  }

  if (submitBtn) {
    submitBtn.addEventListener("click", async () => {
      const code = String((inputEl && inputEl.value) || "").trim();
      if (!code) {
        if (statusEl) statusEl.textContent = "Enter a code.";
        return;
      }
      if (statusEl) statusEl.textContent = "Checking...";
      const verify = await verifyCode(code);
      if (verify.ok && verify.data && verify.data.ok) {
        if (verify.data.method === "permanent" || /[A-Za-z]/.test(code)) {
          localStorage.setItem(`${ADMIN_EDIT_CODE_STORAGE_PREFIX}${authState.username}`, code);
        }
        closeAdminModal("admin-edit-code-modal");
        if (typeof window.__ewmsDailyContentCallback === "function") {
          const cb = window.__ewmsDailyContentCallback;
          window.__ewmsDailyContentCallback = null;
          await cb();
        } else {
          await openLessonsManagerSafe();
        }
        return;
      }
      const error = (verify.data && verify.data.error) || "invalid_code";
      const attempts = verify.data && Number(verify.data.attempts_left);
      if (error === "banned") {
        if (statusEl) statusEl.textContent = "Banned. Ask super admin to unblock.";
        return;
      }
      if (statusEl) statusEl.textContent = attempts ? `Wrong code. Attempts left: ${attempts}` : "Wrong code.";
    });
  }

  const addBtn = document.getElementById("admin-lessons-add-btn");
  if (addBtn) {
    addBtn.addEventListener("click", async () => {
      await openLessonEditor(course, 0);
    });
  }

  // Support deep-link return from presentation editor (same tab):
  // `a1.html?admin_open_lesson=1` -> open the lesson edit modal automatically.
  try {
    const params = new URLSearchParams(window.location.search || "");
    const autoLesson = Number(params.get("admin_open_lesson")) || 0;
    if (autoLesson > 0 && window.__ewmsAdminAutoLessonOpened !== `${course}:${autoLesson}`) {
      window.__ewmsAdminAutoLessonOpened = `${course}:${autoLesson}`;
      try {
        window.history.replaceState({}, "", window.location.pathname);
      } catch (error) {
        // ignore
      }
      setTimeout(() => {
        openLessonEditor(course, autoLesson);
      }, 0);
    }
  } catch (error) {
    // ignore
  }
};

const parseCertificatesFromResultsDom = () => {
  const resultsEl = document.querySelector(".results-standalone");
  if (!resultsEl) return [];
  const sections = Array.from(resultsEl.querySelectorAll(".results-modal-tiles[data-section]"));
  const items = [];
  sections.forEach((tilesEl) => {
    const section = String(tilesEl.getAttribute("data-section") || "").trim().toLowerCase();
    if (!section) return;
    const tiles = Array.from(tilesEl.querySelectorAll(".results-modal-tile"));
    tiles.forEach((tile, index) => {
      const name = (tile.querySelector(".results-modal-name")?.textContent || "").trim();
      const motto = (tile.querySelector(".results-modal-quote")?.textContent || "").trim();
      const img = tile.querySelector(".results-modal-certificate img");
      const image = img && img.getAttribute("src") ? String(img.getAttribute("src")) : "";
      items.push({
        id: `seed_${section}_${index + 1}`,
        section,
        name,
        motto,
        image,
      });
    });
  });
  return items;
};

const applyCertificateViewerBindings = () => {
  const imgs = document.querySelectorAll(".results-standalone .results-modal-certificate img");
  imgs.forEach((img) => img.classList.add("js-certificate-viewer"));
};

const renderResultsCertificates = (items) => {
  const resultsEl = document.querySelector(".results-standalone");
  if (!resultsEl) return;
  const tilesBySection = {
    ielts: resultsEl.querySelector('.results-modal-tiles[data-section="ielts"]'),
    cefr: resultsEl.querySelector('.results-modal-tiles[data-section="cefr"]'),
  };
  const safeItems = Array.isArray(items) ? items : [];
  const buildHtml = (section) =>
    safeItems
      .filter((it) => String(it.section || "").toLowerCase() === section)
      .map((it) => {
        const name = escapeHtml(String(it.name || "").trim() || "Student");
        const motto = escapeHtml(String(it.motto || "").trim() || "Beautiful quote");
        const image = String(it.image || "").trim();
        const imageHtml = image
          ? `<img src="${escapeHtml(image)}" alt="${name} certificate" loading="lazy" decoding="async">`
          : "Certificate";
        return `
          <article class="results-modal-tile" data-cert-id="${escapeHtml(String(it.id || ""))}">
            <div class="results-modal-certificate">${imageHtml}</div>
            <div class="results-modal-person">
              <span class="results-modal-name">${name}</span>
              <span class="results-modal-quote">${motto}</span>
            </div>
          </article>
        `;
      })
      .join("");

  ["ielts", "cefr"].forEach((section) => {
    const el = tilesBySection[section];
    if (!el) return;
    el.innerHTML = buildHtml(section) || el.innerHTML;
  });

  applyCertificateViewerBindings();
  if (typeof window.__ewmsBuildResultsMasonry === "function") {
    window.__ewmsBuildResultsMasonry();
  }
};

const loadAndRenderCertificatesOverrides = async () => {
  const resultsEl = document.querySelector(".results-standalone");
  if (!resultsEl) return [];
  await ensureApiBaseUrl();
  try {
    const response = await fetchWithTimeout(`${API_BASE_URL}/api/certificates/overrides`, {}, 6000);
    const payload = await response.json().catch(() => ({}));
    const items = Array.isArray(payload && payload.items ? payload.items : []) ? payload.items : [];
    if (items.length) {
      renderResultsCertificates(items);
    } else {
      applyCertificateViewerBindings();
    }
    return items;
  } catch (error) {
    applyCertificateViewerBindings();
    return [];
  }
};

let subscriptionOverridesCache = [];
let subscriptionDiscountTimerInterval = 0;

const parseUzMoney = (value) => {
  if (value == null) return 0;
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(0, Math.round(value));
  }
  const digits = String(value || "").replace(/[^\d]/g, "");
  if (!digits) return 0;
  const parsed = Number(digits);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, Math.round(parsed));
};

const formatUzMoney = (amount) => {
  const safe = Math.max(0, Math.round(Number(amount) || 0));
  const raw = String(safe);
  return raw.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
};

const buildSubscriptionLabel = (item) => {
  const name = String(item && item.name ? item.name : "").trim();
  const badge = String(item && item.badge ? item.badge : "").trim();
  if (!badge) return name || "Subscription";
  return `${name || "Subscription"} ${badge}`.trim();
};

const computeSubscriptionDiscount = (item, nowMs) => {
  const price = parseUzMoney(item && item.price != null ? item.price : 0);
  let oldPrice = parseUzMoney(item && item.old_price != null ? item.old_price : 0);
  let percent = Math.max(0, Math.min(100, Math.round(Number(item && item.discount_percent ? item.discount_percent : 0) || 0)));
  if (!oldPrice && percent > 0 && price > 0 && percent < 100) {
    oldPrice = Math.round(price / (1 - percent / 100));
  }
  if (!percent && oldPrice > 0 && price > 0 && oldPrice > price) {
    percent = Math.round((1 - price / oldPrice) * 100);
  }

  const endsAtRaw = String(item && item.discount_ends_at ? item.discount_ends_at : "").trim();
  const endsAtMs = endsAtRaw ? new Date(endsAtRaw).getTime() : 0;
  const timerActive = endsAtMs > 0 && Number.isFinite(endsAtMs) && nowMs < endsAtMs;
  const discountActive = oldPrice > 0 && price > 0 && oldPrice > price && percent > 0 && (!endsAtMs || timerActive);
  const displayPrice = discountActive ? price : price > 0 ? price : oldPrice;
  return { price, oldPrice, percent, endsAtRaw, endsAtMs, timerActive, discountActive, displayPrice };
};

const formatDiscountCountdown = (msLeft) => {
  const total = Math.max(0, Math.floor(msLeft / 1000));
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`;
  }
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
};

const parseSubscriptionsFromUpgradeDom = () => {
  const upgradeGrid = document.querySelector("#upgrade-modal .upgrade-plan-grid");
  if (!upgradeGrid) return [];
  const cards = Array.from(upgradeGrid.querySelectorAll(".upgrade-plan-card"));
  const makeId = (name, badge, index) => {
    const base = `${String(name || "").trim()}_${String(badge || "").trim()}`.trim() || `subscription_${index + 1}`;
    return `sub_${base.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "")}_${index + 1}`;
  };
  return cards
    .map((card, index) => {
      const name = String((card.querySelector(".upgrade-plan-head h4") || {}).textContent || "").trim();
      const badge = String((card.querySelector(".upgrade-plan-head .upgrade-badge") || {}).textContent || "").trim();
      const features = Array.from(card.querySelectorAll(".upgrade-feature-list li"))
        .map((li) => String(li.textContent || "").trim())
        .filter(Boolean);
      const btn = card.querySelector(".upgrade-plan-price-btn");
      const newPriceText = btn && btn.querySelector ? btn.querySelector(".upgrade-new-price") : null;
      const oldPriceText = btn && btn.querySelector ? btn.querySelector(".upgrade-old-price") : null;
      const percentText = btn && btn.querySelector ? btn.querySelector(".upgrade-off-badge") : null;
      const price = parseUzMoney(newPriceText ? newPriceText.textContent : btn ? btn.textContent : "");
      const old_price = parseUzMoney(oldPriceText ? oldPriceText.textContent : "");
      const discount_percent = percentText ? parseUzMoney(percentText.textContent) : 0;
      return {
        id: makeId(name, badge, index),
        name,
        badge,
        features,
        price,
        old_price,
        discount_percent: Math.max(0, Math.min(100, Math.round(Number(discount_percent) || 0))),
        discount_ends_at: "",
      };
    })
    .filter((it) => String(it.name || "").trim());
};

const bindUpgradePlanPriceButtons = () => {
  const buttons = document.querySelectorAll(".upgrade-plan-price-btn");
  if (!buttons.length) return;
  buttons.forEach((button) => {
    if (!button || button.dataset.boundUpgradePrice === "1") {
      return;
    }
    button.dataset.boundUpgradePrice = "1";
    button.addEventListener("click", () => {
      const level = button.dataset.level || "";
      const price = button.dataset.price || button.textContent || "";
      openEnrollModal(level, price);
    });
  });
};

const renderUpgradeSubscriptions = (items) => {
  const upgradeGrid = document.querySelector("#upgrade-modal .upgrade-plan-grid");
  if (!upgradeGrid) return;
  const safeItems = Array.isArray(items) ? items : [];
  const nowMs = Date.now();
  const escapeInline = (value) =>
    String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");

  const rows = [];
  for (let i = 0; i < safeItems.length; i += 2) {
    rows.push(safeItems.slice(i, i + 2));
  }

  const cardHtml = (item) => {
    const name = String(item && item.name ? item.name : "").trim() || "Subscription";
    const badge = String(item && item.badge ? item.badge : "").trim();
    const badgeHtml = badge
      ? `<span class="upgrade-badge${/express/i.test(badge) ? " upgrade-badge--express" : ""}">${escapeInline(badge)}</span>`
      : "";
    const features = Array.isArray(item && item.features ? item.features : []) ? item.features : [];
    const discount = computeSubscriptionDiscount(item, nowMs);
    const levelLabel = buildSubscriptionLabel(item);
    const priceLabel =
      discount.displayPrice > 0
        ? `${formatUzMoney(discount.displayPrice)} so'm${badge ? ` (${badge})` : ""}`
        : "-";
    const timerHtml =
      discount.discountActive && discount.timerActive && discount.endsAtRaw
        ? `<span class="upgrade-discount-timer" data-ends-at="${escapeInline(discount.endsAtRaw)}">Ends in ${formatDiscountCountdown(
            discount.endsAtMs - nowMs
          )}</span>`
        : "";
    const priceRow =
      discount.discountActive
        ? `
          <span class="upgrade-price-row">
            <span class="upgrade-old-price">${escapeInline(formatUzMoney(discount.oldPrice))} so'm</span>
            <span class="upgrade-off-badge">${escapeInline(discount.percent)}% off</span>
            <span class="upgrade-new-price">${escapeInline(formatUzMoney(discount.price))} so'm</span>
          </span>
        `
        : `
          <span class="upgrade-price-row">
            <span class="upgrade-new-price">${
              discount.displayPrice > 0 ? `${escapeInline(formatUzMoney(discount.displayPrice))} so'm` : "-"
            }</span>
          </span>
        `;

    return `
      <article class="upgrade-plan-card${badge ? " upgrade-plan-card--express" : ""}" data-subscription-id="${escapeInline(
        String(item && item.id ? item.id : "")
      )}">
        <div class="upgrade-plan-head">
          <h4>${escapeInline(name)}</h4>
          ${badgeHtml}
        </div>
        <p class="upgrade-plan-subtitle">What's included:</p>
        <ul class="upgrade-feature-list">
          ${features.map((feat) => `<li>${escapeInline(feat)}</li>`).join("")}
        </ul>
        <button type="button" class="btn upgrade-plan-price-btn${timerHtml ? " has-timer" : ""}" data-level="${escapeInline(
          levelLabel
        )}" data-price="${escapeInline(priceLabel)}">
          ${timerHtml}
          ${priceRow}
        </button>
      </article>
    `;
  };

  upgradeGrid.innerHTML = rows
    .map((row) => `<div class="upgrade-plan-row">${row.map((item) => cardHtml(item)).join("")}</div>`)
    .join("");

  bindUpgradePlanPriceButtons();
  startSubscriptionDiscountTimers();
};

const updateSubscriptionDiscountTimers = () => {
  const timers = document.querySelectorAll(".upgrade-discount-timer[data-ends-at]");
  if (!timers.length) {
    if (subscriptionDiscountTimerInterval) {
      clearInterval(subscriptionDiscountTimerInterval);
      subscriptionDiscountTimerInterval = 0;
    }
    return;
  }

  const nowMs = Date.now();
  let needsRerender = false;
  timers.forEach((el) => {
    const raw = String(el.getAttribute("data-ends-at") || "").trim();
    if (!raw) return;
    const endsAtMs = new Date(raw).getTime();
    if (!Number.isFinite(endsAtMs) || !endsAtMs) return;
    const diff = endsAtMs - nowMs;
    if (diff <= 0) {
      needsRerender = true;
      return;
    }
    el.textContent = `Ends in ${formatDiscountCountdown(diff)}`;
  });

  if (needsRerender && Array.isArray(subscriptionOverridesCache) && subscriptionOverridesCache.length) {
    renderUpgradeSubscriptions(subscriptionOverridesCache);
  }
};

const startSubscriptionDiscountTimers = () => {
  updateSubscriptionDiscountTimers();
  if (subscriptionDiscountTimerInterval) return;
  subscriptionDiscountTimerInterval = window.setInterval(updateSubscriptionDiscountTimers, 1000);
};

const loadAndRenderSubscriptionOverrides = async () => {
  const upgradeGrid = document.querySelector("#upgrade-modal .upgrade-plan-grid");
  if (!upgradeGrid) return [];
  await ensureApiBaseUrl();
  try {
    const response = await fetchWithTimeout(`${API_BASE_URL}/api/subscriptions/overrides`, {}, 6000);
    const payload = await response.json().catch(() => ({}));
    const items = Array.isArray(payload && payload.items ? payload.items : []) ? payload.items : [];
    if (items.length) {
      subscriptionOverridesCache = items;
      renderUpgradeSubscriptions(items);
    } else {
      subscriptionOverridesCache = [];
      bindUpgradePlanPriceButtons();
    }
    return items;
  } catch (error) {
    bindUpgradePlanPriceButtons();
    return [];
  }
};

const initAdminCertificatesEditing = () => {
  const resultsEl = document.querySelector(".results-standalone");
  if (!resultsEl) {
    return;
  }
  const editBtn = document.getElementById("admin-certificates-edit-btn");
  if (!editBtn) {
    return;
  }
  const authState = getAuthState();
  if (!(authState && authState.role === "admin" && authState.username)) {
    editBtn.hidden = true;
    return;
  }
  editBtn.hidden = false;
  if (editBtn.dataset.bound === "1") {
    return;
  }
  editBtn.dataset.bound = "1";
  ensureAdminLessonsModals();
  ensureAdminCertificatesModals();

  const managerModal = document.getElementById("admin-certificates-manager-modal");
  const listEl = document.getElementById("admin-certificates-list");
  const addBtn = document.getElementById("admin-certificates-add-btn");
  const tabsWrap = managerModal ? managerModal.querySelector(".admin-certificates-tabs") : null;

  const editModal = document.getElementById("admin-certificate-edit-modal");
  const editTitle = document.getElementById("admin-certificate-edit-title");
  const editStatus = document.getElementById("admin-certificate-edit-status");
  const previewImg = document.getElementById("admin-certificate-preview-img");
  const sectionEl = document.getElementById("admin-certificate-section");
  const nameEl = document.getElementById("admin-certificate-name");
  const mottoEl = document.getElementById("admin-certificate-motto");
  const imageEl = document.getElementById("admin-certificate-image");
  const saveEl = document.getElementById("admin-certificate-save");
  const cancelEl = document.getElementById("admin-certificate-cancel");

  const state = {
    items: [],
    activeSection: "ielts",
    editingId: "",
    editingIsNew: false,
    editingImageUrl: "",
    editingFile: null,
    editingObjectUrl: "",
  };

  const revokeEditingObjectUrl = () => {
    if (!state.editingObjectUrl) return;
    try {
      URL.revokeObjectURL(state.editingObjectUrl);
    } catch (error) {
      // ignore
    }
    state.editingObjectUrl = "";
  };

  const normalizeSection = (value) => {
    const raw = String(value || "").trim().toLowerCase();
    return raw === "ielts" || raw === "cefr" ? raw : "cefr";
  };

  const sortForStorage = (items) => {
    const ielts = items.filter((it) => normalizeSection(it.section) === "ielts");
    const cefr = items.filter((it) => normalizeSection(it.section) === "cefr");
    return [...ielts, ...cefr];
  };

  const persistAll = async (nextItems) => {
    const payloadItems = sortForStorage(nextItems).map((it) => ({
      id: String(it.id || "").trim(),
      section: normalizeSection(it.section),
      name: String(it.name || "").trim(),
      motto: String(it.motto || "").trim(),
      image: String(it.image || "").trim(),
    }));
    const result = await adminPostJson("/api/admin/certificates/set-all", {
      admin_username: authState.username,
      items: payloadItems,
    });
    if (!result.ok) {
      return { ok: false, error: (result.data && result.data.error) || "save_failed" };
    }
    state.items = payloadItems;
    renderResultsCertificates(state.items);
    return { ok: true };
  };

  const renderManagerList = () => {
    if (!listEl) return;
    const section = state.activeSection;
    listEl.innerHTML = "";
    state.items
      .filter((it) => normalizeSection(it.section) === section)
      .forEach((it) => {
        const row = document.createElement("div");
        row.className = "admin-lessons-row";
        row.dataset.certId = String(it.id || "");
        const title = String(it.name || "").trim() || "Certificate";
        const sub = `${section.toUpperCase()} • ${(String(it.motto || "").trim() || "-").slice(0, 80)}`;
        row.innerHTML = `
          <div class="admin-lessons-handle" draggable="true" aria-label="Move"></div>
          <div class="admin-lessons-meta">
            <div class="admin-lessons-name"><strong>${escapeHtml(title)}</strong></div>
            <div class="admin-lessons-sub">${escapeHtml(sub)}</div>
          </div>
          <div class="admin-lessons-row-actions">
            <button type="button" class="btn admin-lessons-mini admin-certificates-mini-edit">Edit</button>
            <button type="button" class="btn admin-lessons-mini admin-certificates-mini-delete">Delete</button>
          </div>
        `;
        listEl.appendChild(row);
      });

    // Reordering: drag-and-drop (desktop) + pointer-driven sorting (touch).
    let dragged = null;
    let pointerActive = false;
    let pointerId = null;
    let dragPreviewEl = null;

    const persistOrder = async () => {
      const order = Array.from(listEl.querySelectorAll(".admin-lessons-row"))
        .map((row) => String(row.dataset.certId || "").trim())
        .filter(Boolean);
      const keep = state.items.filter((it) => normalizeSection(it.section) !== section);
      const current = state.items.filter((it) => normalizeSection(it.section) === section);
      const byId = new Map(current.map((it) => [String(it.id), it]));
      const nextSection = [];
      const seen = new Set();
      order.forEach((id) => {
        const item = byId.get(id);
        if (item) {
          nextSection.push(item);
          seen.add(id);
        }
      });
      current.forEach((it) => {
        const id = String(it.id);
        if (!seen.has(id)) {
          nextSection.push(it);
        }
      });
      const next = sortForStorage([...keep, ...nextSection]);
      await persistAll(next);
    };

    listEl.querySelectorAll(".admin-lessons-handle").forEach((handle) => {
      handle.addEventListener("dragstart", (event) => {
        const parent = handle.closest(".admin-lessons-row");
        if (!parent) return;
        dragged = parent;
        if (event.dataTransfer) {
          event.dataTransfer.effectAllowed = "move";
          try {
            if (dragPreviewEl && dragPreviewEl.remove) {
              dragPreviewEl.remove();
            }
            const clone = parent.cloneNode(true);
            clone.classList.add("admin-drag-preview");
            clone.style.width = `${parent.getBoundingClientRect().width}px`;
            clone.style.position = "absolute";
            clone.style.top = "-9999px";
            clone.style.left = "-9999px";
            clone.style.pointerEvents = "none";
            document.body.appendChild(clone);
            dragPreviewEl = clone;
            event.dataTransfer.setDragImage(clone, 32, 24);
          } catch (error) {
            // ignore
          }
        }
      });

      handle.addEventListener("pointerdown", (event) => {
        if (!event || (event.pointerType !== "touch" && event.pointerType !== "pen")) {
          return;
        }
        const parent = handle.closest(".admin-lessons-row");
        if (!parent) return;
        pointerActive = true;
        pointerId = event.pointerId;
        dragged = parent;
        dragged.classList.add("is-dragging");
        try {
          handle.setPointerCapture(pointerId);
        } catch (error) {
          // ignore
        }
        event.preventDefault();
      });

      handle.addEventListener("pointermove", (event) => {
        if (!pointerActive || !dragged || event.pointerId !== pointerId) return;
        const x = event.clientX;
        const y = event.clientY;
        const el = document.elementFromPoint(x, y);
        const targetRow = el && el.closest ? el.closest(".admin-lessons-row") : null;
        if (!targetRow || targetRow === dragged) return;
        const rect = targetRow.getBoundingClientRect();
        const shouldInsertAfter = y > rect.top + rect.height / 2;
        if (shouldInsertAfter) {
          targetRow.insertAdjacentElement("afterend", dragged);
        } else {
          targetRow.insertAdjacentElement("beforebegin", dragged);
        }
        event.preventDefault();
      });

      const finishPointerSort = async (event) => {
        if (!pointerActive || !dragged || (event && event.pointerId !== pointerId)) return;
        const row = dragged;
        pointerActive = false;
        pointerId = null;
        dragged = null;
        row.classList.remove("is-dragging");
        await persistOrder();
      };

      handle.addEventListener("pointerup", finishPointerSort);
      handle.addEventListener("pointercancel", finishPointerSort);
    });

    listEl.addEventListener("dragover", (event) => {
      event.preventDefault();
      const targetRow = event.target && event.target.closest ? event.target.closest(".admin-lessons-row") : null;
      if (!dragged || !targetRow || targetRow === dragged) return;
      const rect = targetRow.getBoundingClientRect();
      const shouldInsertAfter = event.clientY > rect.top + rect.height / 2;
      if (shouldInsertAfter) {
        targetRow.insertAdjacentElement("afterend", dragged);
      } else {
        targetRow.insertAdjacentElement("beforebegin", dragged);
      }
    });
    listEl.addEventListener("drop", async () => {
      if (!dragged) return;
      dragged = null;
      if (dragPreviewEl && dragPreviewEl.remove) {
        dragPreviewEl.remove();
      }
      dragPreviewEl = null;
      await persistOrder();
    });
    listEl.addEventListener("dragend", () => {
      dragged = null;
      if (dragPreviewEl && dragPreviewEl.remove) {
        dragPreviewEl.remove();
      }
      dragPreviewEl = null;
    });

    listEl.querySelectorAll(".admin-certificates-mini-edit").forEach((btn) => {
      btn.addEventListener("click", () => {
        const row = btn.closest(".admin-lessons-row");
        const id = String(row && row.dataset.certId ? row.dataset.certId : "").trim();
        if (!id) return;
        openCertificateEditor(id);
      });
    });
    listEl.querySelectorAll(".admin-certificates-mini-delete").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const row = btn.closest(".admin-lessons-row");
        const id = String(row && row.dataset.certId ? row.dataset.certId : "").trim();
        if (!id) return;
        if (!window.confirm("Delete this certificate?")) return;
        const next = state.items.filter((it) => String(it.id) !== id);
        await persistAll(next);
        renderManagerList();
      });
    });
  };

  const uploadCertificateImage = async (file) => {
    const base64 = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const raw = String(reader.result || "");
        const payload = raw.includes(",") ? raw.split(",")[1] : raw;
        resolve(payload);
      };
      reader.onerror = () => reject(new Error("read_failed"));
      reader.readAsDataURL(file);
    });
    const result = await adminPostJson(
      "/api/admin/certificates/image/upload",
      { admin_username: authState.username, file_name: file.name, file_data: base64 },
      120000
    );
    if (!result.ok || !result.data || !result.data.url) {
      return { ok: false, error: (result.data && result.data.error) || "upload_failed" };
    }
    return { ok: true, url: String(result.data.url) };
  };

  const openCertificateEditor = (id) => {
    if (!editModal) return;
    revokeEditingObjectUrl();
    state.editingFile = null;
    state.editingImageUrl = "";
    state.editingIsNew = !id;
    state.editingId = id || "";
    const item = id ? state.items.find((it) => String(it.id) === id) : null;
    const section = normalizeSection(item ? item.section : state.activeSection);
    const title = state.editingIsNew ? "Add new certificate" : "Edit Certificate";
    if (editTitle) editTitle.textContent = title;
    if (editStatus) editStatus.textContent = "";
    if (sectionEl) sectionEl.value = section;
    if (nameEl) nameEl.value = item ? String(item.name || "") : "";
    if (mottoEl) mottoEl.value = item ? String(item.motto || "") : "";
    const imgUrl = item ? String(item.image || "") : "";
    state.editingImageUrl = imgUrl;
    if (previewImg) {
      previewImg.src = imgUrl || "";
      previewImg.style.display = imgUrl ? "block" : "none";
    }
    if (imageEl) imageEl.value = "";
    openAdminModal("admin-certificate-edit-modal");
  };

  const openManagerSafe = async () => {
    if (!managerModal || !listEl) return;
    openAdminModal("admin-certificates-manager-modal");
    listEl.innerHTML = "<div class=\"admin-lessons-status\">Loading...</div>";
    const existing = await loadAndRenderCertificatesOverrides();
    state.items = existing.length ? existing : parseCertificatesFromResultsDom();
    if (!existing.length) {
      const boot = await persistAll(state.items);
      if (!boot.ok) {
        listEl.innerHTML = "<div class=\"admin-lessons-status\">Failed to save initial certificates list.</div>";
        return;
      }
    }
    renderManagerList();
  };

  // Gate (Telegram PIN / permanent code) – same flow as Edit Menu.
  const requestPin = async () => {
    const statusEl = document.getElementById("admin-edit-code-status");
    if (statusEl) statusEl.textContent = "Sending PIN...";
    const result = await adminPostJson("/api/admin/edit-access/request", { admin_username: authState.username });
    if (!result.ok) {
      const error = (result.data && result.data.error) || "request_failed";
      if (statusEl) statusEl.textContent = error === "network_error" ? "Auth server is not running." : error;
      return false;
    }
    if (statusEl) statusEl.textContent = "PIN sent. Check Telegram.";
    return true;
  };

  const verifyCode = async (code) =>
    adminPostJson("/api/admin/edit-access/verify", { admin_username: authState.username, code });

  const storageKey = `${ADMIN_EDIT_CODE_STORAGE_PREFIX}${authState.username}`;
  const safeGetStored = () => {
    try {
      return localStorage.getItem(storageKey) || "";
    } catch (error) {
      return "";
    }
  };
  const safeClearStored = () => {
    try {
      localStorage.removeItem(storageKey);
    } catch (error) {
      // ignore
    }
  };

  let gateBusy = false;
  const startGate = async () => {
    const stored = safeGetStored();
    if (stored) {
      const verify = await verifyCode(stored);
      if (verify.ok && verify.data && verify.data.ok) {
        await openManagerSafe();
        return;
      }
      safeClearStored();
    }
    openAdminModal("admin-edit-code-modal");
    const input = document.getElementById("admin-edit-code-input");
    if (input) {
      input.value = "";
      input.focus();
    }
    return requestPin();
  };

  const triggerGate = () => {
    if (gateBusy) return;
    gateBusy = true;
    Promise.resolve()
      .then(() => startGate())
      .finally(() => {
        gateBusy = false;
      });
  };

  editBtn.addEventListener("click", triggerGate);
  editBtn.onclick = triggerGate;

  const submitBtn = document.getElementById("admin-edit-code-submit");
  const resendBtn = document.getElementById("admin-edit-code-resend");
  const inputEl = document.getElementById("admin-edit-code-input");
  const statusEl = document.getElementById("admin-edit-code-status");
  if (resendBtn) resendBtn.addEventListener("click", requestPin);
  if (submitBtn) {
    submitBtn.addEventListener("click", async () => {
      const code = String((inputEl && inputEl.value) || "").trim();
      if (!code) {
        if (statusEl) statusEl.textContent = "Enter a code.";
        return;
      }
      if (statusEl) statusEl.textContent = "Checking...";
      const verify = await verifyCode(code);
      if (verify.ok && verify.data && verify.data.ok) {
        if (verify.data.method === "permanent" || /[A-Za-z]/.test(code)) {
          localStorage.setItem(storageKey, code);
        }
        await openManagerSafe();
        closeAdminModal("admin-edit-code-modal");
        return;
      }
      const error = (verify.data && verify.data.error) || "invalid_code";
      const attempts = verify.data && Number(verify.data.attempts_left);
      if (error === "banned") {
        if (statusEl) statusEl.textContent = "Banned. Ask super admin to unblock.";
        return;
      }
      if (statusEl) statusEl.textContent = attempts ? `Wrong code. Attempts left: ${attempts}` : "Wrong code.";
    });
  }

  if (tabsWrap) {
    tabsWrap.addEventListener("click", (event) => {
      const btn = event.target && event.target.closest ? event.target.closest(".admin-certificates-tab") : null;
      if (!btn) return;
      const section = normalizeSection(btn.getAttribute("data-section") || "");
      state.activeSection = section;
      tabsWrap.querySelectorAll(".admin-certificates-tab").forEach((el) => {
        el.classList.toggle("is-active", el === btn);
      });
      renderManagerList();
    });
  }

  if (addBtn) {
    addBtn.addEventListener("click", () => openCertificateEditor(""));
  }

  if (cancelEl) cancelEl.addEventListener("click", () => closeAdminModal("admin-certificate-edit-modal"));

  if (imageEl) {
    imageEl.addEventListener("change", () => {
      const file = imageEl.files && imageEl.files[0];
      if (!file) return;
      revokeEditingObjectUrl();
      state.editingFile = file;
      const url = URL.createObjectURL(file);
      state.editingObjectUrl = url;
      if (previewImg) {
        previewImg.src = url;
        previewImg.style.display = "block";
      }
    });
  }

  if (saveEl) {
    saveEl.addEventListener("click", async () => {
      if (saveEl) saveEl.disabled = true;
      if (editStatus) editStatus.textContent = "Saving...";
      try {
        const nextSection = normalizeSection(sectionEl && sectionEl.value ? sectionEl.value : state.activeSection);
        const nextName = String(nameEl && nameEl.value ? nameEl.value : "").trim();
        const nextMotto = String(mottoEl && mottoEl.value ? mottoEl.value : "").trim();
        let nextImage = state.editingIsNew ? "" : state.editingImageUrl;
        if (state.editingFile) {
          const upload = await uploadCertificateImage(state.editingFile);
          if (!upload.ok) {
            if (editStatus) editStatus.textContent = `Upload failed: ${upload.error}`;
            return;
          }
          nextImage = upload.url;
        }

        const makeId = () => {
          try {
            return typeof crypto !== "undefined" && crypto.randomUUID ? `cert_${crypto.randomUUID()}` : `cert_${Date.now()}_${Math.random().toString(16).slice(2)}`;
          } catch (error) {
            return `cert_${Date.now()}_${Math.random().toString(16).slice(2)}`;
          }
        };

        const id = state.editingIsNew ? makeId() : state.editingId;
        const nextItem = {
          id,
          section: nextSection,
          name: nextName,
          motto: nextMotto,
          image: nextImage,
        };
        const nextItems = state.editingIsNew
          ? [...state.items, nextItem]
          : state.items.map((it) => (String(it.id) === String(id) ? nextItem : it));

        const saved = await persistAll(nextItems);
        if (!saved.ok) {
          if (editStatus) editStatus.textContent = `Save failed: ${saved.error}`;
          return;
        }
        closeAdminModal("admin-certificate-edit-modal");
        renderManagerList();
      } finally {
        if (saveEl) saveEl.disabled = false;
      }
    });
  }

  if (managerModal) {
    managerModal.addEventListener("click", (event) => {
      if (event.target === managerModal) {
        closeAdminModal("admin-certificates-manager-modal");
      }
    });
  }
  if (editModal) {
    editModal.addEventListener("click", (event) => {
      if (event.target === editModal) {
        closeAdminModal("admin-certificate-edit-modal");
      }
    });
  }
};

const initAdminSubscriptionsEditing = () => {
  const editBtn = document.getElementById("admin-subscriptions-edit-btn");
  if (!editBtn) {
    return;
  }
  const authState = getAuthState();
  if (!(authState && authState.role === "admin" && authState.username)) {
    editBtn.hidden = true;
    return;
  }

  editBtn.hidden = false;
  if (editBtn.dataset.bound === "1") {
    return;
  }
  editBtn.dataset.bound = "1";

  ensureAdminLessonsModals();
  ensureAdminSubscriptionsModals();

  const managerModal = document.getElementById("admin-subscriptions-manager-modal");
  const listEl = document.getElementById("admin-subscriptions-list");
  const addBtn = document.getElementById("admin-subscriptions-add-btn");

  const editModal = document.getElementById("admin-subscription-edit-modal");
  const editTitle = document.getElementById("admin-subscription-edit-title");
  const editStatus = document.getElementById("admin-subscription-edit-status");
  const nameEl = document.getElementById("admin-subscription-name");
  const badgeEl = document.getElementById("admin-subscription-badge");
  const featuresEl = document.getElementById("admin-subscription-features");
  const priceEl = document.getElementById("admin-subscription-price");
  const oldPriceEl = document.getElementById("admin-subscription-old-price");
  const percentEl = document.getElementById("admin-subscription-discount-percent");
  const endsEl = document.getElementById("admin-subscription-discount-ends");
  const saveEl = document.getElementById("admin-subscription-save");
  const cancelEl = document.getElementById("admin-subscription-cancel");

  const state = {
    items: [],
    editingId: "",
    editingIsNew: false,
  };

  const makeId = () => `sub_${Date.now()}_${Math.random().toString(16).slice(2)}`;

  const toLocalDatetimeValue = (iso) => {
    const raw = String(iso || "").trim();
    if (!raw) return "";
    const d = new Date(raw);
    if (!Number.isFinite(d.getTime())) return "";
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  // Admin: keep New price and Discount % in sync.
  let subscriptionDiscountSyncLock = false;
  const clampPercentUi = (value) => {
    const num = Number(value);
    if (!Number.isFinite(num) || num <= 0) return 0;
    if (num >= 100) return 100;
    return Math.max(0, Math.min(100, Math.round(num)));
  };
  const computeDiscountPercent = (oldPrice, newPrice) => {
    const oldVal = Math.max(0, Math.round(Number(oldPrice) || 0));
    const newVal = Math.max(0, Math.round(Number(newPrice) || 0));
    if (!(oldVal > 0 && newVal > 0 && newVal < oldVal)) return 0;
    const pct = Math.round((1 - newVal / oldVal) * 100);
    return clampPercentUi(pct);
  };
  const computeNewPrice = (oldPrice, percent) => {
    const oldVal = Math.max(0, Math.round(Number(oldPrice) || 0));
    const pct = clampPercentUi(percent);
    if (!oldVal || !pct) return 0;
    const next = Math.round(oldVal * (1 - pct / 100));
    return Math.max(0, next);
  };
  const syncDiscountFromPrice = () => {
    if (subscriptionDiscountSyncLock) return;
    if (!oldPriceEl || !priceEl || !percentEl) return;
    subscriptionDiscountSyncLock = true;
    const oldVal = parseUzMoney(oldPriceEl.value);
    const newVal = parseUzMoney(priceEl.value);
    const pct = computeDiscountPercent(oldVal, newVal);
    percentEl.value = pct > 0 ? String(pct) : "";
    subscriptionDiscountSyncLock = false;
  };
  const syncDiscountFromPercent = () => {
    if (subscriptionDiscountSyncLock) return;
    if (!oldPriceEl || !priceEl || !percentEl) return;
    subscriptionDiscountSyncLock = true;
    const oldVal = parseUzMoney(oldPriceEl.value);
    const pct = clampPercentUi(percentEl.value);
    if (!pct) {
      priceEl.value = "";
      subscriptionDiscountSyncLock = false;
      return;
    }
    const nextPrice = computeNewPrice(oldVal, pct);
    priceEl.value = nextPrice > 0 ? String(nextPrice) : "0";
    subscriptionDiscountSyncLock = false;
  };
  const syncDiscountFromOldPrice = () => {
    if (subscriptionDiscountSyncLock) return;
    if (!oldPriceEl || !priceEl || !percentEl) return;
    subscriptionDiscountSyncLock = true;
    const oldVal = parseUzMoney(oldPriceEl.value);
    const pct = clampPercentUi(percentEl.value);
    const newVal = parseUzMoney(priceEl.value);
    if (pct > 0) {
      const nextPrice = computeNewPrice(oldVal, pct);
      priceEl.value = nextPrice > 0 ? String(nextPrice) : "0";
    } else if (newVal > 0) {
      const nextPct = computeDiscountPercent(oldVal, newVal);
      percentEl.value = nextPct > 0 ? String(nextPct) : "";
    }
    subscriptionDiscountSyncLock = false;
  };

  const normalizeItem = (raw) => {
    const item = raw && typeof raw === "object" ? raw : {};
    const id = String(item.id || "").trim() || makeId();
    const name = String(item.name || "").trim();
    const badge = String(item.badge || "").trim();
    const featuresRaw = Array.isArray(item.features) ? item.features : [];
    const features = featuresRaw.map((x) => String(x || "").trim()).filter(Boolean).slice(0, 50);
    const price = parseUzMoney(item.price);
    const old_price = parseUzMoney(item.old_price);
    const discount_percent = Math.max(0, Math.min(100, Math.round(Number(item.discount_percent) || 0)));
    const discount_ends_at = String(item.discount_ends_at || "").trim();
    return { id, name, badge, features, price, old_price, discount_percent, discount_ends_at };
  };

  const persistAll = async (nextItems) => {
    const payloadItems = (Array.isArray(nextItems) ? nextItems : []).map(normalizeItem);
    const result = await adminPostJson(
      "/api/admin/subscriptions/set-all",
      { admin_username: authState.username, items: payloadItems },
      20000
    );
    if (!result.ok) {
      return { ok: false, error: (result.data && result.data.error) || "save_failed" };
    }
    state.items = payloadItems;
    subscriptionOverridesCache = payloadItems;
    renderUpgradeSubscriptions(payloadItems);
    return { ok: true };
  };

  const renderManagerList = () => {
    if (!listEl) return;
    listEl.innerHTML = "";
    state.items.forEach((it) => {
      const row = document.createElement("div");
      row.className = "admin-lessons-row";
      row.dataset.subscriptionId = String(it.id || "");
      const title = String(it.name || "").trim() || "Subscription";
      const effectivePrice = parseUzMoney(it.price) || parseUzMoney(it.old_price);
      const sub = `${effectivePrice ? `${formatUzMoney(effectivePrice)} so'm` : "-"}${
        it.badge ? ` • ${String(it.badge).trim()}` : ""
      }`;
      row.innerHTML = `
        <div class="admin-lessons-handle" draggable="true" aria-label="Move"></div>
        <div class="admin-lessons-meta">
          <div class="admin-lessons-name"><strong>${escapeHtml(title)}</strong></div>
          <div class="admin-lessons-sub">${escapeHtml(sub)}</div>
        </div>
        <div class="admin-lessons-row-actions">
          <button type="button" class="btn admin-lessons-mini admin-subscriptions-mini-edit">Edit</button>
          <button type="button" class="btn admin-lessons-mini admin-lessons-mini-delete admin-subscriptions-mini-delete">Delete</button>
        </div>
      `;
      listEl.appendChild(row);
    });

    let dragged = null;
    let pointerActive = false;
    let pointerId = null;
    let dragPreviewEl = null;

    const persistOrder = async () => {
      const order = Array.from(listEl.querySelectorAll(".admin-lessons-row"))
        .map((row) => String(row.dataset.subscriptionId || "").trim())
        .filter(Boolean);
      const byId = new Map(state.items.map((it) => [String(it.id), it]));
      const next = [];
      const seen = new Set();
      order.forEach((id) => {
        const item = byId.get(id);
        if (item) {
          next.push(item);
          seen.add(id);
        }
      });
      state.items.forEach((it) => {
        const id = String(it.id);
        if (!seen.has(id)) next.push(it);
      });
      await persistAll(next);
      renderManagerList();
    };

    listEl.querySelectorAll(".admin-lessons-handle").forEach((handle) => {
      handle.addEventListener("dragstart", (event) => {
        const parent = handle.closest(".admin-lessons-row");
        if (!parent) return;
        dragged = parent;
        if (event.dataTransfer) {
          event.dataTransfer.effectAllowed = "move";
          try {
            if (dragPreviewEl && dragPreviewEl.remove) {
              dragPreviewEl.remove();
            }
            const clone = parent.cloneNode(true);
            clone.classList.add("admin-drag-preview");
            clone.style.width = `${parent.getBoundingClientRect().width}px`;
            clone.style.position = "absolute";
            clone.style.top = "-9999px";
            clone.style.left = "-9999px";
            clone.style.pointerEvents = "none";
            document.body.appendChild(clone);
            dragPreviewEl = clone;
            event.dataTransfer.setDragImage(clone, 32, 24);
          } catch (error) {
            // ignore
          }
        }
      });

      handle.addEventListener("pointerdown", (event) => {
        if (!event || (event.pointerType !== "touch" && event.pointerType !== "pen")) {
          return;
        }
        const parent = handle.closest(".admin-lessons-row");
        if (!parent) return;
        pointerActive = true;
        pointerId = event.pointerId;
        dragged = parent;
        dragged.classList.add("is-dragging");
        try {
          handle.setPointerCapture(pointerId);
        } catch (error) {
          // ignore
        }
        event.preventDefault();
      });

      handle.addEventListener("pointermove", (event) => {
        if (!pointerActive || !dragged || event.pointerId !== pointerId) return;
        const el = document.elementFromPoint(event.clientX, event.clientY);
        const targetRow = el && el.closest ? el.closest(".admin-lessons-row") : null;
        if (!targetRow || targetRow === dragged) return;
        const rect = targetRow.getBoundingClientRect();
        const shouldInsertAfter = event.clientY > rect.top + rect.height / 2;
        if (shouldInsertAfter) {
          targetRow.insertAdjacentElement("afterend", dragged);
        } else {
          targetRow.insertAdjacentElement("beforebegin", dragged);
        }
        event.preventDefault();
      });

      const finishPointerSort = async (event) => {
        if (!pointerActive || !dragged || (event && event.pointerId !== pointerId)) return;
        const row = dragged;
        pointerActive = false;
        pointerId = null;
        dragged = null;
        row.classList.remove("is-dragging");
        await persistOrder();
      };

      handle.addEventListener("pointerup", finishPointerSort);
      handle.addEventListener("pointercancel", finishPointerSort);
    });

    listEl.addEventListener("dragover", (event) => {
      event.preventDefault();
      const targetRow = event.target && event.target.closest ? event.target.closest(".admin-lessons-row") : null;
      if (!dragged || !targetRow || targetRow === dragged) return;
      const rect = targetRow.getBoundingClientRect();
      const shouldInsertAfter = event.clientY > rect.top + rect.height / 2;
      if (shouldInsertAfter) {
        targetRow.insertAdjacentElement("afterend", dragged);
      } else {
        targetRow.insertAdjacentElement("beforebegin", dragged);
      }
    });
    listEl.addEventListener("drop", async () => {
      if (!dragged) return;
      dragged = null;
      if (dragPreviewEl && dragPreviewEl.remove) {
        dragPreviewEl.remove();
      }
      dragPreviewEl = null;
      await persistOrder();
    });
    listEl.addEventListener("dragend", () => {
      dragged = null;
      if (dragPreviewEl && dragPreviewEl.remove) {
        dragPreviewEl.remove();
      }
      dragPreviewEl = null;
    });

    listEl.querySelectorAll(".admin-subscriptions-mini-edit").forEach((btn) => {
      btn.addEventListener("click", () => {
        const row = btn.closest(".admin-lessons-row");
        const id = String(row && row.dataset.subscriptionId ? row.dataset.subscriptionId : "").trim();
        if (!id) return;
        openEditor(id);
      });
    });
    listEl.querySelectorAll(".admin-subscriptions-mini-delete").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const row = btn.closest(".admin-lessons-row");
        const id = String(row && row.dataset.subscriptionId ? row.dataset.subscriptionId : "").trim();
        if (!id) return;
        if (!window.confirm("Delete this subscription?")) return;
        const next = state.items.filter((it) => String(it.id) !== id);
        await persistAll(next);
        renderManagerList();
      });
    });
  };

  const openEditor = (id) => {
    if (!editModal) return;
    state.editingId = id || "";
    state.editingIsNew = !id;
    const item = id ? state.items.find((it) => String(it.id) === id) : null;
    if (editTitle) editTitle.textContent = state.editingIsNew ? "Add new subscription" : "Edit Subscription";
    if (editStatus) editStatus.textContent = "";
    if (nameEl) nameEl.value = item ? String(item.name || "") : "";
    if (badgeEl) badgeEl.value = item ? String(item.badge || "") : "";
    if (featuresEl) {
      const features = item && Array.isArray(item.features) ? item.features : [];
      featuresEl.value = features.map((x) => String(x || "").trim()).filter(Boolean).join("\n");
    }
    if (priceEl) priceEl.value = item ? String(item.price || "") : "";
    if (oldPriceEl) oldPriceEl.value = item ? String(item.old_price || "") : "";
    if (percentEl) percentEl.value = item && item.discount_percent ? String(item.discount_percent) : "";
    if (endsEl) endsEl.value = item ? toLocalDatetimeValue(item.discount_ends_at || "") : "";
    // Auto-fill the missing field if admin provided only one.
    syncDiscountFromOldPrice();
    if (percentEl && !clampPercentUi(percentEl.value)) {
      syncDiscountFromPrice();
    }
    openAdminModal("admin-subscription-edit-modal");
  };

  const openManagerSafe = async () => {
    if (!managerModal || !listEl) return;
    openAdminModal("admin-subscriptions-manager-modal");
    listEl.innerHTML = "<div class=\"admin-lessons-status\">Loading...</div>";
    const existing = await loadAndRenderSubscriptionOverrides();
    state.items = existing.length ? existing.map(normalizeItem) : parseSubscriptionsFromUpgradeDom().map(normalizeItem);
    renderManagerList();
  };

  const requestPin = async () => {
    const statusEl = document.getElementById("admin-edit-code-status");
    if (statusEl) statusEl.textContent = "Sending PIN...";
    const result = await adminPostJson("/api/admin/edit-access/request", { admin_username: authState.username });
    if (!result.ok) {
      const error = (result.data && result.data.error) || "request_failed";
      if (statusEl) statusEl.textContent = error === "network_error" ? "Auth server is not running." : error;
      return false;
    }
    if (statusEl) statusEl.textContent = "PIN sent. Check Telegram.";
    return true;
  };

  const verifyCode = async (code) =>
    adminPostJson("/api/admin/edit-access/verify", { admin_username: authState.username, code });

  const storageKey = `${ADMIN_EDIT_CODE_STORAGE_PREFIX}${authState.username}`;
  const safeGetStored = () => {
    try {
      return localStorage.getItem(storageKey) || "";
    } catch (error) {
      return "";
    }
  };
  const safeClearStored = () => {
    try {
      localStorage.removeItem(storageKey);
    } catch (error) {
      // ignore
    }
  };

  let gateBusy = false;
  const startGate = async () => {
    const stored = safeGetStored();
    if (stored) {
      const verify = await verifyCode(stored);
      if (verify.ok && verify.data && verify.data.ok) {
        await openManagerSafe();
        return;
      }
      safeClearStored();
    }
    openAdminModal("admin-edit-code-modal");
    const input = document.getElementById("admin-edit-code-input");
    if (input) {
      input.value = "";
      input.focus();
    }
    return requestPin();
  };

  const triggerGate = () => {
    if (gateBusy) return;
    gateBusy = true;
    Promise.resolve()
      .then(() => startGate())
      .finally(() => {
        gateBusy = false;
      });
  };

  editBtn.addEventListener("click", triggerGate);
  editBtn.onclick = triggerGate;
  window.__ewmsOpenSubscriptionsEditGate = triggerGate;

  const submitBtn = document.getElementById("admin-edit-code-submit");
  const resendBtn = document.getElementById("admin-edit-code-resend");
  const inputEl = document.getElementById("admin-edit-code-input");
  const statusEl = document.getElementById("admin-edit-code-status");
  if (resendBtn) resendBtn.addEventListener("click", requestPin);
  if (submitBtn) {
    submitBtn.addEventListener("click", async () => {
      const code = String((inputEl && inputEl.value) || "").trim();
      if (!code) {
        if (statusEl) statusEl.textContent = "Enter a code.";
        return;
      }
      if (statusEl) statusEl.textContent = "Checking...";
      const verify = await verifyCode(code);
      if (verify.ok && verify.data && verify.data.ok) {
        if (verify.data.method === "permanent" || /[A-Za-z]/.test(code)) {
          localStorage.setItem(storageKey, code);
        }
        await openManagerSafe();
        closeAdminModal("admin-edit-code-modal");
        return;
      }
      const error = (verify.data && verify.data.error) || "invalid_code";
      const attempts = verify.data && Number(verify.data.attempts_left);
      if (error === "banned") {
        if (statusEl) statusEl.textContent = "Banned. Ask super admin to unblock.";
        return;
      }
      if (statusEl) statusEl.textContent = attempts ? `Wrong code. Attempts left: ${attempts}` : "Wrong code.";
    });
  }

  if (addBtn) {
    addBtn.addEventListener("click", () => openEditor(""));
  }

  if (cancelEl) cancelEl.addEventListener("click", () => closeAdminModal("admin-subscription-edit-modal"));

  if (priceEl && priceEl.dataset.boundDiscountSync !== "1") {
    priceEl.dataset.boundDiscountSync = "1";
    priceEl.addEventListener("input", syncDiscountFromPrice);
  }
  if (percentEl && percentEl.dataset.boundDiscountSync !== "1") {
    percentEl.dataset.boundDiscountSync = "1";
    percentEl.addEventListener("input", syncDiscountFromPercent);
  }
  if (oldPriceEl && oldPriceEl.dataset.boundDiscountSync !== "1") {
    oldPriceEl.dataset.boundDiscountSync = "1";
    oldPriceEl.addEventListener("input", syncDiscountFromOldPrice);
  }

  if (saveEl) {
    saveEl.addEventListener("click", async () => {
      if (saveEl) saveEl.disabled = true;
      if (editStatus) editStatus.textContent = "Saving...";
      try {
        const rawOld = parseUzMoney(oldPriceEl && oldPriceEl.value ? oldPriceEl.value : 0);
        const rawPrice = parseUzMoney(priceEl && priceEl.value ? priceEl.value : 0);
        const rawPct = clampPercentUi(percentEl && percentEl.value ? percentEl.value : 0);
        const derivedPct = !rawPct && rawOld > 0 && rawPrice > 0 ? computeDiscountPercent(rawOld, rawPrice) : rawPct;
        const derivedPrice =
          rawOld > 0 && derivedPct > 0 && !rawPrice ? computeNewPrice(rawOld, derivedPct) : rawPrice;

        const next = {
          id: state.editingIsNew ? makeId() : state.editingId,
          name: String(nameEl && nameEl.value ? nameEl.value : "").trim(),
          badge: String(badgeEl && badgeEl.value ? badgeEl.value : "").trim(),
          features: String(featuresEl && featuresEl.value ? featuresEl.value : "")
            .split("\n")
            .map((line) => String(line || "").trim())
            .filter(Boolean),
          price: derivedPrice,
          old_price: rawOld,
          discount_percent: derivedPct,
          discount_ends_at: "",
        };

        const rawEnds = String(endsEl && endsEl.value ? endsEl.value : "").trim();
        if (rawEnds) {
          const d = new Date(rawEnds);
          if (Number.isFinite(d.getTime())) {
            next.discount_ends_at = d.toISOString();
          }
        }

        const normalized = normalizeItem(next);
        const nextItems = state.editingIsNew
          ? [...state.items, normalized]
          : state.items.map((it) => (String(it.id) === String(state.editingId) ? normalized : it));

        const saved = await persistAll(nextItems);
        if (!saved.ok) {
          if (editStatus) editStatus.textContent = `Save failed: ${saved.error}`;
          return;
        }
        if (editStatus) editStatus.textContent = "Saved.";
        closeAdminModal("admin-subscription-edit-modal");
        openAdminModal("admin-subscriptions-manager-modal");
        renderManagerList();
      } finally {
        if (saveEl) saveEl.disabled = false;
      }
    });
  }
};

// Global fallback: if per-button wiring doesn't happen for any reason, still react to clicks.
(() => {
  const tryOpenLessons = () => {
    if (typeof window.__ewmsOpenLessonsEditGate === "function") {
      window.__ewmsOpenLessonsEditGate();
      return true;
    }
    // Try to (re)initialize then open.
    try {
      initAdminLessonsEditing();
    } catch (error) {
      // ignore
    }
    if (typeof window.__ewmsOpenLessonsEditGate === "function") {
      window.__ewmsOpenLessonsEditGate();
      return true;
    }
    return false;
  };

  const tryOpenSubscriptions = () => {
    if (typeof window.__ewmsOpenSubscriptionsEditGate === "function") {
      window.__ewmsOpenSubscriptionsEditGate();
      return true;
    }
    try {
      initAdminSubscriptionsEditing();
    } catch (error) {
      // ignore
    }
    if (typeof window.__ewmsOpenSubscriptionsEditGate === "function") {
      window.__ewmsOpenSubscriptionsEditGate();
      return true;
    }
    return false;
  };

  document.addEventListener(
    "click",
    (event) => {
      const target = event.target;
      const lessonsBtn = target && target.closest ? target.closest("#admin-lessons-edit-btn") : null;
      const subsBtn = target && target.closest ? target.closest("#admin-subscriptions-edit-btn") : null;
      if (!lessonsBtn && !subsBtn) return;
      // Let the local handler run first if present.
      setTimeout(() => {
        if (lessonsBtn) tryOpenLessons();
        if (subsBtn) tryOpenSubscriptions();
      }, 0);
    },
    true
  );

  document.addEventListener(
    "pointerup",
    (event) => {
      const target = event.target;
      const lessonsBtn = target && target.closest ? target.closest("#admin-lessons-edit-btn") : null;
      const subsBtn = target && target.closest ? target.closest("#admin-subscriptions-edit-btn") : null;
      if (!lessonsBtn && !subsBtn) return;
      if (event.pointerType === "touch" || event.pointerType === "pen") {
        setTimeout(() => {
          if (lessonsBtn) tryOpenLessons();
          if (subsBtn) tryOpenSubscriptions();
        }, 0);
      }
    },
    true
  );
})();

let adminLessonEditorState = null;

const updateLessonVideoPreview = (videoUrl) => {
  const preview = document.getElementById("admin-lesson-video-preview");
  if (!preview) return;
  const url = String(videoUrl || "").trim();
  if (isYouTubeUrl(url)) {
    preview.innerHTML = `<iframe src="${getYouTubeEmbedUrl(url)}" title="YouTube video" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
    return;
  }
  preview.innerHTML = url ? `<div class="admin-lesson-video-placeholder">${escapeHtml(url)}</div>` : "";
};

const updateLessonCoverPreview = (coverUrl) => {
  const img = document.getElementById("admin-lesson-cover-img");
  if (!img) return;
  const url = String(coverUrl || "").trim();
  if (!url) {
    img.removeAttribute("src");
    img.style.display = "none";
    return;
  }
  img.style.display = "";
  img.src = url;
};

const openLessonEditor = async (course, lessonNumber) => {
  const authState = getAuthState();
  ensureAdminLessonsModals();
  const merged = await mergeCourseLessons(course);
  const existing = lessonNumber > 0 ? merged.byNumber[lessonNumber] : null;
  adminLessonEditorState = {
    course,
    lessonNumber: lessonNumber || 0,
    initial: {
      title: existing ? existing.title : "Theme: ",
      cover: existing ? existing.cover : "",
      video: existing ? existing.video : "",
    },
    current: {
      title: existing ? existing.title : "Theme: ",
      cover: existing ? existing.cover : "",
      video: existing ? existing.video : "",
    },
    dirty: false,
    saving: false,
  };

  const titleEl = document.getElementById("admin-lesson-edit-title");
  const themeInput = document.getElementById("admin-lesson-theme-input");
  const coverInput = document.getElementById("admin-lesson-cover-input");
  const videoInput = document.getElementById("admin-lesson-video-input");
  const statusEl = document.getElementById("admin-lesson-edit-status");

  if (titleEl) {
    titleEl.textContent = lessonNumber > 0 ? `Edit Lesson ${lessonNumber}` : "Add new lesson";
  }
  if (themeInput) themeInput.value = adminLessonEditorState.current.title;
  if (coverInput) coverInput.value = adminLessonEditorState.current.cover;
  if (videoInput) videoInput.value = adminLessonEditorState.current.video;
  updateLessonCoverPreview(adminLessonEditorState.current.cover);
  updateLessonVideoPreview(adminLessonEditorState.current.video);
  if (statusEl) statusEl.textContent = "";

  const markDirty = () => {
    if (!adminLessonEditorState) return;
    const isDirty =
      adminLessonEditorState.current.title !== adminLessonEditorState.initial.title ||
      adminLessonEditorState.current.cover !== adminLessonEditorState.initial.cover ||
      adminLessonEditorState.current.video !== adminLessonEditorState.initial.video;
    adminLessonEditorState.dirty = isDirty;
  };

  const bindOnce = (el, event, handler) => {
    if (!el) return;
    const key = `bound_${event}`;
    if (el.dataset[key] === "1") return;
    el.dataset[key] = "1";
    el.addEventListener(event, handler);
  };

  bindOnce(themeInput, "input", () => {
    if (!adminLessonEditorState) return;
    adminLessonEditorState.current.title = themeInput.value;
    markDirty();
  });
  bindOnce(coverInput, "input", () => {
    if (!adminLessonEditorState) return;
    adminLessonEditorState.current.cover = coverInput.value.trim();
    updateLessonCoverPreview(adminLessonEditorState.current.cover);
    markDirty();
  });
  bindOnce(videoInput, "input", () => {
    if (!adminLessonEditorState) return;
    adminLessonEditorState.current.video = videoInput.value.trim();
    updateLessonVideoPreview(adminLessonEditorState.current.video);
    markDirty();
  });

  const uploadBtn = document.getElementById("admin-lesson-cover-upload");
  const clearBtn = document.getElementById("admin-lesson-cover-clear");
  const fileInput = document.getElementById("admin-lesson-cover-file");
  bindOnce(uploadBtn, "click", () => fileInput && fileInput.click());
  bindOnce(clearBtn, "click", () => {
    if (!adminLessonEditorState) return;
    adminLessonEditorState.current.cover = "";
    if (coverInput) coverInput.value = "";
    updateLessonCoverPreview("");
    markDirty();
  });
  bindOnce(fileInput, "change", async () => {
    if (!fileInput || !fileInput.files || !fileInput.files[0] || !adminLessonEditorState) return;
    const file = fileInput.files[0];
    const reader = new FileReader();
    reader.onload = async () => {
      const raw = String(reader.result || "");
      const base64 = raw.includes(",") ? raw.split(",")[1] : raw;
      const result = await adminPostJson(
        "/api/admin/lessons/cover/upload",
        {
          admin_username: authState.username,
          file_name: file.name,
          file_data: base64,
        },
        60000
      );
      if (result.ok && result.data && result.data.url) {
        adminLessonEditorState.current.cover = result.data.url;
        if (coverInput) coverInput.value = result.data.url;
        updateLessonCoverPreview(result.data.url);
        markDirty();
      }
    };
    reader.readAsDataURL(file);
  });

  const saveBtn = document.getElementById("admin-lesson-save");
  bindOnce(saveBtn, "click", async () => {
    await saveLessonEditor();
  });

  const reviewTasksBtn = document.getElementById("admin-lesson-review-tasks");
  const reviewHomeworkBtn = document.getElementById("admin-lesson-review-homework");
  const reviewPresentationBtn = document.getElementById("admin-lesson-review-presentation");
  bindOnce(reviewHomeworkBtn, "click", () => {
    if (adminLessonEditorState && adminLessonEditorState.dirty) {
      const proceed = window.confirm("You have unsaved changes. Continue and lose them?");
      if (!proceed) {
        return;
      }
    }
    const n = adminLessonEditorState && adminLessonEditorState.lessonNumber ? adminLessonEditorState.lessonNumber : 1;
    window.location.href = `tasks.html?course=${encodeURIComponent(course)}&lesson=${n}&open=homework&edit=1`;
  });
  bindOnce(reviewPresentationBtn, "click", () => {
    if (adminLessonEditorState && adminLessonEditorState.dirty) {
      const proceed = window.confirm("You have unsaved changes. Continue and lose them?");
      if (!proceed) {
        return;
      }
    }
    const n = adminLessonEditorState && adminLessonEditorState.lessonNumber ? adminLessonEditorState.lessonNumber : 1;
    window.location.href = `presentation.html?course=${encodeURIComponent(course)}&lesson=${n}&edit=1`;
  });
  bindOnce(reviewTasksBtn, "click", async () => {
    const n = adminLessonEditorState && adminLessonEditorState.lessonNumber ? adminLessonEditorState.lessonNumber : 0;
    if (n <= 0) {
      const status = document.getElementById("admin-lesson-edit-status");
      if (status) status.textContent = "Save the lesson first.";
      return;
    }
    await openQuizEditor(course, n);
  });

  openAdminModal("admin-lesson-edit-modal");
};

const saveLessonEditor = async () => {
  if (!adminLessonEditorState || adminLessonEditorState.saving) return false;
  const authState = getAuthState();
  if (!(authState && authState.username)) return false;
  adminLessonEditorState.saving = true;
  const statusEl = document.getElementById("admin-lesson-edit-status");
  if (statusEl) statusEl.textContent = "Saving...";
  const payload = {
    admin_username: authState.username,
    course: adminLessonEditorState.course,
    title: adminLessonEditorState.current.title,
    cover: adminLessonEditorState.current.cover,
    video: adminLessonEditorState.current.video,
  };

  let result = null;
  if (adminLessonEditorState.lessonNumber > 0) {
    result = await adminPostJson("/api/admin/lessons/save", {
      ...payload,
      lesson_number: adminLessonEditorState.lessonNumber,
    });
  } else {
    result = await adminPostJson("/api/admin/lessons/create", payload);
    if (result.ok && result.data && result.data.lesson_number) {
      adminLessonEditorState.lessonNumber = Number(result.data.lesson_number) || 0;
    }
  }
  adminLessonEditorState.saving = false;
  if (!result || !result.ok) {
    if (statusEl) statusEl.textContent = (result && result.data && result.data.error) || "Save failed.";
    return false;
  }
  if (statusEl) statusEl.textContent = "Saved.";
  invalidateLessonsCache(adminLessonEditorState.course);
  await renderLessonsCatalogFromOverrides();
  applyLessonAccessLocks();
  applyLessonCompletionBadges();

  adminLessonEditorState.initial = { ...adminLessonEditorState.current };
  adminLessonEditorState.dirty = false;
  return true;
};

const requestCloseLessonEditor = async () => {
  if (adminLessonEditorState && adminLessonEditorState.dirty) {
    openAdminModal("admin-unsaved-confirm-modal");
    return;
  }
  closeAdminModal("admin-lesson-edit-modal");
  adminLessonEditorState = null;
};

(() => {
  document.addEventListener("click", async (event) => {
    const yes = event.target && event.target.id === "admin-unsaved-yes";
    const no = event.target && event.target.id === "admin-unsaved-no";
    if (!yes && !no) return;
    if (yes) {
      await saveLessonEditor();
    }
    closeAdminModal("admin-unsaved-confirm-modal");
    closeAdminModal("admin-lesson-edit-modal");
    adminLessonEditorState = null;
  });
})();

let adminQuizEditorState = null;

const serializeAdminQuizQuestions = (questions) => {
  if (!Array.isArray(questions)) {
    return "[]";
  }
  const normalized = questions.map((q) => {
    const options = (q && q.options && typeof q.options === "object" ? q.options : {}) || {};
    return {
      id: Number(q && q.id) || 0,
      question: String((q && q.question) || "").trim(),
      options: {
        A: String(options.A || options.a || "").trim(),
        B: String(options.B || options.b || "").trim(),
        C: String(options.C || options.c || "").trim(),
        D: String(options.D || options.d || "").trim(),
      },
      correct: String((q && q.correct) || "").trim().toUpperCase(),
      explanation: String((q && q.explanation) || "").trim(),
      explanation_simple: String((q && q.explanation_simple) || "").trim(),
      explanation_detailed: String((q && q.explanation_detailed) || "").trim(),
    };
  });
  try {
    return JSON.stringify(normalized);
  } catch (error) {
    return "[]";
  }
};

const saveQuizEditor = async ({ closeAfter = false } = {}) => {
  if (!adminQuizEditorState) return false;
  collectQuizEditorQuestion();
  const statusEl = document.getElementById("admin-quiz-status");
  if (statusEl) statusEl.textContent = "Saving...";
  const result = await adminPostJson(
    "/api/admin/quiz/save",
    {
      admin_username: adminQuizEditorState.adminUsername,
      course: adminQuizEditorState.course,
      lesson_number: adminQuizEditorState.lessonNumber,
      questions: adminQuizEditorState.questions,
    },
    20000
  );
  if (result.ok) {
    adminQuizEditorState.lastSavedSerialized = serializeAdminQuizQuestions(adminQuizEditorState.questions);
  }
  if (statusEl) statusEl.textContent = result.ok ? "Saved." : (result.data && result.data.error) || "Save failed.";
  if (result.ok && closeAfter) {
    closeAdminModal("admin-quiz-editor-modal");
  }
  return !!result.ok;
};

const requestCloseQuizEditor = async () => {
  if (!adminQuizEditorState) {
    closeAdminModal("admin-quiz-editor-modal");
    return;
  }
  collectQuizEditorQuestion();
  const currentSerialized = serializeAdminQuizQuestions(adminQuizEditorState.questions);
  const baseline = adminQuizEditorState.lastSavedSerialized || adminQuizEditorState.initialSerialized || "[]";
  const dirty = currentSerialized !== baseline;
  if (!dirty) {
    closeAdminModal("admin-quiz-editor-modal");
    return;
  }
  const shouldSave = window.confirm("You have unsaved changes. Save them?");
  if (shouldSave) {
    await saveQuizEditor({ closeAfter: true });
    return;
  }
  closeAdminModal("admin-quiz-editor-modal");
};

const openQuizEditor = async (course, lessonNumber) => {
  const authState = getAuthState();
  ensureAdminLessonsModals();
  const statusEl = document.getElementById("admin-quiz-status");
  if (statusEl) statusEl.textContent = "Loading...";
  await ensureApiBaseUrl();
  const response = await fetchWithTimeout(
    `${API_BASE_URL}/api/quiz/questions?course=${encodeURIComponent(course)}&lesson=${encodeURIComponent(lessonNumber)}`,
    {},
    6000
  );
  const payload = await response.json().catch(() => ({}));
  const questions = Array.isArray(payload.questions) ? payload.questions : [];
  adminQuizEditorState = {
    course,
    lessonNumber,
    questions: questions.length ? questions : [],
    index: 0,
    adminUsername: authState && authState.username ? authState.username : "",
    initialSerialized: serializeAdminQuizQuestions(questions),
    lastSavedSerialized: serializeAdminQuizQuestions(questions),
  };
  if (statusEl) statusEl.textContent = questions.length ? "" : "No questions found. Add one.";
  renderQuizEditorQuestion();
  openAdminModal("admin-quiz-editor-modal");
};

const initAdminInlineEditors = () => {
  const authState = getAuthState();
  if (!(authState && authState.role === "admin" && authState.username)) {
    return;
  }

  const params = new URLSearchParams(window.location.search || "");
  const isEditMode = params.get("edit") === "1";
  const course = (params.get("course") || "").trim().toLowerCase();
  const lessonNumber = Number(params.get("lesson")) || 0;

  const presentationPageEl = document.querySelector("[data-presentation-page]");
  if (presentationPageEl && course && lessonNumber > 0) {
    // Only enable inline editing when explicitly opened from the Edit Menu.
    if (!isEditMode) {
      return;
    }
    const actions = document.querySelector(".presentation-actions");
    if (!actions || presentationPageEl.dataset.adminPresentationBound === "1") {
      return;
    }
    presentationPageEl.dataset.adminPresentationBound = "1";

    // Remove legacy buttons (from older versions of this page).
    const legacyEdit = document.getElementById("admin-inline-edit-presentation-tasks");
    if (legacyEdit) legacyEdit.remove();

    const backBtn = document.getElementById("presentation-back-btn");
    if (backBtn) {
      backBtn.hidden = true;
    }

    const noteEl = document.getElementById("presentation-note");
    const openBtn = document.getElementById("presentation-open-btn");
    const frameEl = document.getElementById("presentation-frame");

    const state = {
      dirty: false,
      saving: false,
      pendingFile: null,
      objectUrl: "",
    };

    const setNote = (text) => {
      if (noteEl) noteEl.textContent = text || "";
    };

    const revokeObjectUrl = () => {
      if (state.objectUrl) {
        try {
          URL.revokeObjectURL(state.objectUrl);
        } catch (error) {
          // ignore
        }
        state.objectUrl = "";
      }
    };

    const returnToLessonEditor = () => {
      revokeObjectUrl();
      window.location.href = `${course}.html?admin_open_lesson=${encodeURIComponent(String(lessonNumber))}`;
    };

    const uploadPendingIfNeeded = async () => {
      if (!state.pendingFile) {
        return { ok: true, skipped: true };
      }
      state.saving = true;
      setNote("Saving...");
      const file = state.pendingFile;
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const raw = String(reader.result || "");
          const payload = raw.includes(",") ? raw.split(",")[1] : raw;
          resolve(payload);
        };
        reader.onerror = () => reject(new Error("read_failed"));
        reader.readAsDataURL(file);
      });
      const result = await adminPostJson(
        "/api/admin/presentation/upload",
        {
          admin_username: authState.username,
          course,
          lesson_number: lessonNumber,
          file_name: file.name,
          file_data: base64,
        },
        240000
      );
      state.saving = false;
      if (!result.ok || !result.data || !result.data.url) {
        return { ok: false, error: (result.data && result.data.error) || "upload_failed" };
      }
      const url = String(result.data.url || "");
      const absoluteUrl = url.startsWith("http") ? url : `${API_BASE_URL || ""}${url}`;
      const busted = absoluteUrl ? `${absoluteUrl}?v=${Date.now()}` : "";
      if (openBtn && busted) {
        openBtn.href = busted;
        openBtn.hidden = false;
        openBtn.target = "_self";
      }
      if (frameEl && busted) {
        frameEl.hidden = false;
        frameEl.src = busted;
      }
      state.pendingFile = null;
      state.dirty = false;
      setNote("Saved.");
      return { ok: true, skipped: false };
    };

    const replaceBtn = document.createElement("button");
    replaceBtn.id = "admin-inline-upload-presentation";
    replaceBtn.type = "button";
    replaceBtn.className = "btn admin-lessons-secondary";
    replaceBtn.textContent = "Replace PDF";

    const saveBtn = document.createElement("button");
    saveBtn.id = "admin-inline-save-presentation";
    saveBtn.type = "button";
    saveBtn.className = "btn admin-lessons-primary";
    saveBtn.textContent = "Save";

    const closeBtn = document.createElement("button");
    closeBtn.id = "admin-inline-close-presentation";
    closeBtn.type = "button";
    closeBtn.className = "btn admin-lessons-secondary";
    closeBtn.textContent = "Close";

    const fileInput = document.createElement("input");
    fileInput.id = "admin-inline-upload-presentation-file";
    fileInput.type = "file";
    fileInput.accept = "application/pdf";
    fileInput.hidden = true;

    replaceBtn.addEventListener("click", () => fileInput.click());
    fileInput.addEventListener("change", () => {
      const file = fileInput.files && fileInput.files[0];
      if (!file) return;
      revokeObjectUrl();
      try {
        state.objectUrl = URL.createObjectURL(file);
      } catch (error) {
        state.objectUrl = "";
      }
      state.pendingFile = file;
      state.dirty = true;
      if (frameEl && state.objectUrl) {
        frameEl.hidden = false;
        frameEl.src = state.objectUrl;
      }
      setNote("Ready to save.");
    });

    saveBtn.addEventListener("click", async () => {
      if (state.saving) return;
      const res = await uploadPendingIfNeeded();
      if (!res.ok) {
        setNote(String(res.error || "network_error"));
        return;
      }
      returnToLessonEditor();
    });

    closeBtn.addEventListener("click", async () => {
      if (state.saving) return;
      if (state.dirty) {
        const shouldSave = window.confirm("Save changes?");
        if (shouldSave) {
          const res = await uploadPendingIfNeeded();
          if (!res.ok) {
            setNote(String(res.error || "network_error"));
            return;
          }
        }
      }
      returnToLessonEditor();
    });

    const keepOpenBtn = openBtn && openBtn.parentNode === actions ? openBtn : null;
    actions.innerHTML = "";
    if (keepOpenBtn) {
      actions.appendChild(keepOpenBtn);
    }
    actions.appendChild(replaceBtn);
    actions.appendChild(saveBtn);
    actions.appendChild(closeBtn);
    actions.appendChild(fileInput);
  }
};

const renderQuizReorderList = () => {
  if (!adminQuizEditorState) return;
  const existingList = document.getElementById("admin-quiz-reorder-list");
  if (!existingList) return;
  // Replace the node to drop any previously attached listeners.
  const listEl = existingList.cloneNode(false);
  existingList.parentNode.replaceChild(listEl, existingList);
  const selectedId = adminQuizEditorState.questions[adminQuizEditorState.index]
    ? Number(adminQuizEditorState.questions[adminQuizEditorState.index].id) || 0
    : 0;

  adminQuizEditorState.questions.forEach((q, idx) => {
    const row = document.createElement("div");
    row.className = "admin-quiz-reorder-row";
    const qid = Number(q && q.id) || 0;
    row.dataset.qid = String(qid);
    if (qid && qid === selectedId) {
      row.classList.add("is-current");
    }
    const questionText = String((q && q.question) || "").trim() || "(empty question)";
    row.innerHTML = `
      <div class="admin-quiz-reorder-handle" draggable="true" aria-label="Move"></div>
      <div class="admin-quiz-reorder-meta">
        <div class="admin-quiz-reorder-title">Q${idx + 1}</div>
        <div class="admin-quiz-reorder-sub">${escapeHtml(questionText)}</div>
      </div>
    `;
    listEl.appendChild(row);
  });

  const syncDomLabelsAndCurrent = () => {
    if (!adminQuizEditorState) return;
    const currentId = adminQuizEditorState.questions[adminQuizEditorState.index]
      ? Number(adminQuizEditorState.questions[adminQuizEditorState.index].id) || 0
      : 0;
    const rows = Array.from(listEl.querySelectorAll(".admin-quiz-reorder-row"));
    rows.forEach((row, idx) => {
      const titleEl = row.querySelector(".admin-quiz-reorder-title");
      if (titleEl) titleEl.textContent = `Q${idx + 1}`;
      row.classList.toggle("is-current", (Number(row.dataset.qid) || 0) === currentId && currentId > 0);
    });
  };

  // Drag sorting (desktop) + pointer sorting (touch).
  let dragged = null;
  let pointerActive = false;
  let pointerId = null;
  let dragPreviewEl = null;

  const applyReorderFromDom = () => {
    if (!adminQuizEditorState) return;
    const selectedBefore = selectedId;
    const ids = Array.from(listEl.querySelectorAll(".admin-quiz-reorder-row"))
      .map((row) => Number(row.dataset.qid) || 0)
      .filter((n) => n > 0);
    const byId = new Map(
      adminQuizEditorState.questions.map((q) => [Number(q && q.id) || 0, q]).filter(([id]) => id > 0)
    );
    const next = [];
    ids.forEach((id) => {
      const item = byId.get(id);
      if (item) next.push(item);
    });
    adminQuizEditorState.questions = next;
    const idx = selectedBefore ? next.findIndex((q) => (Number(q && q.id) || 0) === selectedBefore) : -1;
    adminQuizEditorState.index = idx >= 0 ? idx : 0;
  };

  const cleanupPreview = () => {
    if (dragPreviewEl && dragPreviewEl.remove) {
      dragPreviewEl.remove();
    }
    dragPreviewEl = null;
  };

  listEl.querySelectorAll(".admin-quiz-reorder-handle").forEach((handle) => {
    handle.addEventListener("dragstart", (event) => {
      const parent = handle.closest(".admin-quiz-reorder-row");
      if (!parent) return;
      dragged = parent;
      if (event.dataTransfer) {
        event.dataTransfer.effectAllowed = "move";
        try {
          cleanupPreview();
          const clone = parent.cloneNode(true);
          clone.classList.add("admin-drag-preview");
          clone.style.width = `${parent.getBoundingClientRect().width}px`;
          clone.style.position = "absolute";
          clone.style.top = "-9999px";
          clone.style.left = "-9999px";
          clone.style.pointerEvents = "none";
          document.body.appendChild(clone);
          dragPreviewEl = clone;
          event.dataTransfer.setDragImage(clone, 32, 24);
        } catch (error) {
          // ignore
        }
      }
    });

    handle.addEventListener("pointerdown", (event) => {
      if (!event || (event.pointerType !== "touch" && event.pointerType !== "pen")) {
        return;
      }
      const parent = handle.closest(".admin-quiz-reorder-row");
      if (!parent) return;
      pointerActive = true;
      pointerId = event.pointerId;
      dragged = parent;
      dragged.classList.add("is-dragging");
      try {
        handle.setPointerCapture(pointerId);
      } catch (error) {
        // ignore
      }
      event.preventDefault();
    });

    handle.addEventListener("pointermove", (event) => {
      if (!pointerActive || !dragged || event.pointerId !== pointerId) return;
      const el = document.elementFromPoint(event.clientX, event.clientY);
      const targetRow = el && el.closest ? el.closest(".admin-quiz-reorder-row") : null;
      if (!targetRow || targetRow === dragged) return;
      const rect = targetRow.getBoundingClientRect();
      const shouldInsertAfter = event.clientY > rect.top + rect.height / 2;
      if (shouldInsertAfter) {
        targetRow.insertAdjacentElement("afterend", dragged);
      } else {
        targetRow.insertAdjacentElement("beforebegin", dragged);
      }
      event.preventDefault();
    });

    const finishPointerSort = (event) => {
      if (!pointerActive || !dragged || (event && event.pointerId !== pointerId)) return;
      const row = dragged;
      pointerActive = false;
      pointerId = null;
      dragged = null;
      row.classList.remove("is-dragging");
      applyReorderFromDom();
      syncDomLabelsAndCurrent();
    };

    handle.addEventListener("pointerup", finishPointerSort);
    handle.addEventListener("pointercancel", finishPointerSort);
  });

  listEl.addEventListener("dragover", (event) => {
    event.preventDefault();
    const targetRow = event.target && event.target.closest ? event.target.closest(".admin-quiz-reorder-row") : null;
    if (!dragged || !targetRow || targetRow === dragged) return;
    const rect = targetRow.getBoundingClientRect();
    const shouldInsertAfter = event.clientY > rect.top + rect.height / 2;
    if (shouldInsertAfter) {
      targetRow.insertAdjacentElement("afterend", dragged);
    } else {
      targetRow.insertAdjacentElement("beforebegin", dragged);
    }
  });

  listEl.addEventListener("drop", () => {
    if (!dragged) return;
    dragged = null;
    cleanupPreview();
    applyReorderFromDom();
    syncDomLabelsAndCurrent();
  });

  listEl.addEventListener("dragend", () => {
    dragged = null;
    cleanupPreview();
  });

  listEl.addEventListener("click", (event) => {
    const row = event.target && event.target.closest ? event.target.closest(".admin-quiz-reorder-row") : null;
    if (!row || !adminQuizEditorState) return;
    const rows = Array.from(listEl.querySelectorAll(".admin-quiz-reorder-row"));
    const idx = rows.indexOf(row);
    if (idx < 0) return;
    adminQuizEditorState.index = idx;
    closeAdminModal("admin-quiz-reorder-modal");
    openAdminModal("admin-quiz-editor-modal");
    renderQuizEditorQuestion();
  });
};

const openQuizReorderModal = () => {
  if (!adminQuizEditorState) return;
  collectQuizEditorQuestion();
  closeAdminModal("admin-quiz-editor-modal");
  renderQuizReorderList();
  openAdminModal("admin-quiz-reorder-modal");
};

initAdminInlineEditors();

const renderQuizEditorQuestion = () => {
  if (!adminQuizEditorState) return;
  const { questions, index } = adminQuizEditorState;
  const current = questions[index] || null;
  const qLabel = document.getElementById("admin-quiz-q-label");
  const questionInput = document.getElementById("admin-quiz-question");
  const statusEl = document.getElementById("admin-quiz-status");
  const mainEl = document.getElementById("admin-quiz-expl-main");
  const simpleEl = document.getElementById("admin-quiz-expl-simple");
  const detailEl = document.getElementById("admin-quiz-expl-detail");
  if (qLabel) qLabel.textContent = `Q${index + 1}`;
  if (!current) {
    if (questionInput) questionInput.value = "";
    document.querySelectorAll(".admin-quiz-option-input").forEach((el) => (el.value = ""));
    document.querySelectorAll('input[name="admin-quiz-correct"]').forEach((el) => (el.checked = false));
    if (mainEl) mainEl.value = "";
    if (simpleEl) simpleEl.value = "";
    if (detailEl) detailEl.value = "";
    if (statusEl) statusEl.textContent = "No question selected.";
    return;
  }
  if (questionInput) questionInput.value = current.question || "";
  const options = current.options || {};
  document.querySelectorAll(".admin-quiz-option-input").forEach((el) => {
    const key = el.getAttribute("data-option-key");
    el.value = String(options && key ? options[key] || "" : "");
  });
  document.querySelectorAll('input[name="admin-quiz-correct"]').forEach((el) => {
    el.checked = String(current.correct || "").toUpperCase() === el.value;
  });
  if (mainEl) mainEl.value = current.explanation || "";
  if (simpleEl) simpleEl.value = current.explanation_simple || "";
  if (detailEl) detailEl.value = current.explanation_detailed || "";
  if (statusEl) statusEl.textContent = "";
};

const collectQuizEditorQuestion = () => {
  if (!adminQuizEditorState) return;
  const { questions, index } = adminQuizEditorState;
  const current = questions[index];
  if (!current) return;
  const questionInput = document.getElementById("admin-quiz-question");
  const mainEl = document.getElementById("admin-quiz-expl-main");
  const simpleEl = document.getElementById("admin-quiz-expl-simple");
  const detailEl = document.getElementById("admin-quiz-expl-detail");
  current.question = String((questionInput && questionInput.value) || "").trim();
  current.options = current.options || {};
  document.querySelectorAll(".admin-quiz-option-input").forEach((el) => {
    const key = el.getAttribute("data-option-key");
    current.options[key] = String(el.value || "").trim();
  });
  const checked = document.querySelector('input[name="admin-quiz-correct"]:checked');
  current.correct = checked ? checked.value : current.correct || "A";
  current.explanation = String((mainEl && mainEl.value) || "").trim();
  current.explanation_simple = String((simpleEl && simpleEl.value) || "").trim();
  current.explanation_detailed = String((detailEl && detailEl.value) || "").trim();
};

(() => {
  document.addEventListener("click", async (event) => {
    if (!adminQuizEditorState) return;
    const id = event.target && event.target.id;
    if (!id) return;
    if (id === "admin-quiz-prev" || id === "admin-quiz-next") {
      collectQuizEditorQuestion();
      const delta = id === "admin-quiz-prev" ? -1 : 1;
      adminQuizEditorState.index = Math.max(
        0,
        Math.min(adminQuizEditorState.questions.length - 1, adminQuizEditorState.index + delta)
      );
      renderQuizEditorQuestion();
      return;
    }
    if (id === "admin-quiz-add") {
      collectQuizEditorQuestion();
      const maxId = adminQuizEditorState.questions.reduce((max, q) => Math.max(max, Number(q.id) || 0), 0);
      const insertAt = Math.min(adminQuizEditorState.index + 1, adminQuizEditorState.questions.length);
      adminQuizEditorState.questions.splice(insertAt, 0, {
        id: maxId + 1,
        question: "",
        options: { A: "", B: "", C: "", D: "" },
        correct: "A",
        explanation: "",
        explanation_simple: "",
        explanation_detailed: "",
      });
      adminQuizEditorState.index = insertAt;
      renderQuizEditorQuestion();
      return;
    }
    if (id === "admin-quiz-reorder") {
      openQuizReorderModal();
      return;
    }
    if (id === "admin-quiz-remove") {
      if (!window.confirm("Remove this question?")) return;
      adminQuizEditorState.questions.splice(adminQuizEditorState.index, 1);
      adminQuizEditorState.index = Math.max(0, adminQuizEditorState.index - 1);
      renderQuizEditorQuestion();
      return;
    }
    if (id === "admin-quiz-save") {
      await saveQuizEditor({ closeAfter: false });
    }
  });
})();

const applyLessonAccessLocks = async () => {
  const lessonsPageEl = document.querySelector(".lessons-page");
  if (!lessonsPageEl) {
    return;
  }

  const authState = getAuthState();
  const currentCourse = getCourseFromPathname();
  if (authState && authState.role === "admin") {
    return;
  }
  const hasLevelMismatch = !!(
    authState &&
    authState.sessionToken &&
    authState.level &&
    currentCourse &&
    normalizeCourseLevel(authState.level) !== currentCourse
  );
  const hasSession = !!(authState && authState.sessionToken);
  const isLoggedIn = !!getAuthUser() && hasSession;

  const lessonButtons = lessonsPageEl.querySelectorAll(".lesson-watch-btn");

  const resetLessonButton = (button) => {
    if (!button) {
      return;
    }
    const lessonCard = button.closest(".lesson-card");
    if (lessonCard) {
      lessonCard.classList.remove("is-locked-lesson-card");
      const note = lessonCard.querySelector(".lesson-lock-note");
      if (note) {
        note.remove();
      }
    }
    if (!button.dataset.originalText) {
      button.dataset.originalText = button.textContent;
    }
    if (!button.dataset.originalHref) {
      button.dataset.originalHref = button.getAttribute("href") || "#";
    }
    if (button.dataset.unlockTimerId) {
      clearInterval(Number(button.dataset.unlockTimerId));
      delete button.dataset.unlockTimerId;
    }
    button.classList.remove("is-locked-lesson-btn", "lesson-unlock-timer");
    button.removeAttribute("aria-disabled");
    button.removeAttribute("tabindex");
    button.textContent = button.dataset.originalText;
    button.href = button.dataset.originalHref;
    button.onclick = null;
    delete button.dataset.requiredLessonNumber;
    delete button.dataset.prerequisiteLocked;
  };

  const lockLessonButton = (button, label = "Locked") => {
    if (!button) {
      return;
    }
    resetLessonButton(button);
    button.href = "#";
    button.textContent = label;
    button.classList.add("is-locked-lesson-btn");
    button.setAttribute("aria-disabled", "true");
    button.setAttribute("tabindex", "-1");
    button.onclick = (event) => {
      event.preventDefault();
    };
    const lessonCard = button.closest(".lesson-card");
    if (lessonCard) {
      lessonCard.classList.add("is-locked-lesson-card");
    }
  };

  const ensureLessonPrereqModal = () => {
    if (document.getElementById("lesson-prereq-modal")) {
      return;
    }
    const wrap = document.createElement("div");
    wrap.innerHTML = `
      <div id="lesson-prereq-modal" class="lesson-prereq-modal" aria-hidden="true">
        <div class="lesson-prereq-card" role="dialog" aria-modal="true" aria-labelledby="lesson-prereq-title">
          <h3 id="lesson-prereq-title">Lesson required</h3>
          <p id="lesson-prereq-text">You need to complete the required lesson first.</p>
          <div class="lesson-prereq-actions">
            <button id="lesson-prereq-close" type="button" class="btn lesson-nav-btn">Close</button>
            <button id="lesson-prereq-go" type="button" class="btn lesson-nav-btn lesson-nav-btn-primary">Go</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(wrap);
  };

  const openLessonPrereqModal = (requiredLessonTitle, requiredHref) => {
    ensureLessonPrereqModal();
    const modal = document.getElementById("lesson-prereq-modal");
    const text = document.getElementById("lesson-prereq-text");
    const goBtn = document.getElementById("lesson-prereq-go");
    if (text) {
      const safeTitle = String(requiredLessonTitle || "").trim();
      text.textContent = safeTitle
        ? `Please complete this lesson first: "${safeTitle}".`
        : "Please complete the required lesson first.";
    }
    if (goBtn) {
      goBtn.onclick = (event) => {
        event.preventDefault();
        if (requiredHref) {
          window.location.href = requiredHref;
        }
      };
    }
    if (modal) {
      modal.classList.add("is-open");
      modal.setAttribute("aria-hidden", "false");
    }
  };

  const closeLessonPrereqModal = () => {
    const modal = document.getElementById("lesson-prereq-modal");
    if (!modal) return;
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
  };

  if (lessonsPageEl.dataset.prereqModalBound !== "1") {
    lessonsPageEl.dataset.prereqModalBound = "1";
    document.addEventListener("click", (event) => {
      const target = event.target;
      const closeBtn = target && target.closest ? target.closest("#lesson-prereq-close") : null;
      if (closeBtn) {
        closeLessonPrereqModal();
        return;
      }
      const modal = document.getElementById("lesson-prereq-modal");
      if (modal && event.target === modal) {
        closeLessonPrereqModal();
      }
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closeLessonPrereqModal();
      }
    });
  }

  let scheduledButton = null;
  let scheduledUnlockAt = null;
  const isBekzodA1Preview = !!(authState && isBekzodAccount(authState) && String(currentCourse || "").toLowerCase() === "a1");

  if (!isLoggedIn || hasLevelMismatch) {
    lessonButtons.forEach((button) => {
      resetLessonButton(button);
      const href = button.getAttribute("href") || "";
      let lessonNumber = 1;
      try {
        const url = new URL(href, window.location.href);
        lessonNumber = Number(url.searchParams.get("lesson")) || 1;
      } catch (error) {
        lessonNumber = 1;
      }
      if (lessonNumber <= 1) {
        return;
      }
      lockLessonButton(button, "Locked");

      const lessonCard = button.closest(".lesson-card");
      if (lessonCard) {
        if (!lessonCard.querySelector(".lesson-lock-note")) {
          const lockNote = document.createElement("p");
          lockNote.className = "lesson-lock-note";
          lockNote.textContent = hasLevelMismatch ? "Only Lesson 1 is available for your level" : "Login required";
          button.insertAdjacentElement("afterend", lockNote);
        }
      }
    });
  } else {
    // Pre-lock all visually so there is no blue flash
    const lessonConfigs = [];
    for (const button of lessonButtons) {
      resetLessonButton(button);
      const href = button.getAttribute("href") || "";
      let lessonNumber = 1;
      try {
        const url = new URL(href, window.location.href);
        lessonNumber = Number(url.searchParams.get("lesson")) || 1;
      } catch (error) {
        lessonNumber = 1;
      }
      
      lessonConfigs.push({ button, lessonNumber });
      
      if (lessonNumber > 1) {
         lockLessonButton(button, "Loading...");
      }
    }

    // Fetch all lessons concurrently to prevent waterfall
    const checkPromises = lessonConfigs.map(async (config) => {
      const { button, lessonNumber } = config;
      if (lessonNumber <= 1) return { ...config, payload: { allowed: true } };
      
      if (isBekzodA1Preview && lessonNumber <= 4) {
        return { ...config, isBekzod: true };
      }
      
      const payload = await fetchLessonAccess(currentCourse, lessonNumber);
      return { ...config, payload };
    });

    const results = await Promise.all(checkPromises);

    for (const result of results) {
      const { button, lessonNumber, payload, isBekzod } = result;
      if (lessonNumber <= 1) {
         resetLessonButton(button);
         continue;
      }

      if (isBekzod) {
        if (lessonNumber === 2) {
          resetLessonButton(button);
          continue;
        }
        lockLessonButton(button, "Locked");
        button.onclick = async (event) => {
          event.preventDefault();
          const merged = await mergeCourseLessons(currentCourse);
          const requiredLesson = (merged && merged.byNumber && merged.byNumber[2]) || null;
          const requiredTitle = requiredLesson ? stripThemePrefix(requiredLesson.title || "") : "Lesson 2";
          const requiredHref = `lesson.html?course=${encodeURIComponent(currentCourse)}&lesson=2`;
          openLessonPrereqModal(requiredTitle, requiredHref);
        };
        continue;
      }

      if (payload && payload.allowed) {
        resetLessonButton(button);
        continue;
      }

      const reason = payload && payload.reason ? String(payload.reason) : "";
      if (reason === "prerequisite") {
        const requiredLessonNumber = Number(payload.required_lesson_number) || 0;
        button.dataset.prerequisiteLocked = "1";
        button.dataset.requiredLessonNumber = String(requiredLessonNumber || "");
        
        lockLessonButton(button, "Locked");
        
        button.onclick = async (event) => {
          event.preventDefault();
          const merged = await mergeCourseLessons(currentCourse);
          const requiredLesson =
            (merged && merged.byNumber && requiredLessonNumber ? merged.byNumber[requiredLessonNumber] : null) || null;
          const requiredTitle = requiredLesson ? stripThemePrefix(requiredLesson.title || "") : `Lesson ${requiredLessonNumber}`;
          const requiredHref = `lesson.html?course=${encodeURIComponent(currentCourse)}&lesson=${encodeURIComponent(
            String(requiredLessonNumber || 1)
          )}`;
          openLessonPrereqModal(requiredTitle, requiredHref);
        };
        continue;
      }

      lockLessonButton(button, "Locked");
      if (reason === "scheduled" && !scheduledButton) {
        scheduledButton = button;
        scheduledUnlockAt = payload.next_unlock_at || "";
      }
    }
  }

  if (scheduledButton && scheduledUnlockAt) {
    lockLessonButton(scheduledButton, "Locked");
    applyLessonUnlockTimer(scheduledButton, scheduledUnlockAt, () => {
      applyLessonAccessLocks();
    });
  }

  const header = lessonsPageEl.querySelector(".lessons-header");
  if (header && !header.querySelector(".lessons-access-note") && (!isLoggedIn || hasLevelMismatch)) {
    const note = document.createElement("p");
    note.className = "lessons-access-note";
      const levelLabel = formatLevelLabel(authState.level || "");
      note.textContent = hasLevelMismatch
        ? `Your account level is ${levelLabel || "-"}. In this course only Lesson 1 is available.`
        : "Only Lesson 1 is available in guest mode. Login to unlock all lessons.";
    header.appendChild(note);
  }
};

const syncLessonsPageProgressFromServer = async () => {
  const lessonsPageEl = document.querySelector(".lessons-page");
  if (!lessonsPageEl) {
    return;
  }
  const authState = getAuthState();
  const course = getCourseFromPathname();
  if (!authState || !authState.username || !course) {
    return;
  }
  if (authState.role === "admin") {
    return;
  }

  try {
    await ensureApiBaseUrl();
    const response = await fetch(
      `${API_BASE_URL}/api/user/progress-summary?username=${encodeURIComponent(authState.username)}`
    );
    if (!response.ok) {
      return;
    }
    const payload = await response.json();
    const payloadCourse = normalizeCourseLevel(payload && payload.level ? payload.level : authState.level || "");
    if (payloadCourse && payloadCourse !== course) {
      return;
    }

    const strictListRaw = Array.isArray(payload.completed_lessons_strict_list)
      ? payload.completed_lessons_strict_list
      : [];
    const completedListRaw = Array.isArray(payload.completed_lessons_list) ? payload.completed_lessons_list : [];
    const completedCount = Number(payload.completed_lessons || 0);
    const completedListFallback =
      completedListRaw.length > 0
        ? completedListRaw
        : completedCount > 0
          ? Array.from({ length: completedCount }, (_, index) => index + 1)
          : [];
    let completedList = strictListRaw.length > 0 ? strictListRaw : completedListFallback;
    if (isBekzodAccount(authState)) {
      completedList = [1];
    }

    completedList.forEach((lessonNumber) => {
      const safeLessonNumber = Number(lessonNumber) || 0;
      if (safeLessonNumber > 0) {
        markLessonCompletedLocal(course, safeLessonNumber);
      }
    });

    // Remove stale local "completed" flags if server no longer considers lessons completed.
    const serverCompletedSet = new Set(completedList.map((n) => Number(n) || 0).filter((n) => n > 0));
    const lessonButtons = lessonsPageEl.querySelectorAll(".lesson-watch-btn");
    lessonButtons.forEach((button) => {
      const href = button.dataset.originalHref || button.getAttribute("href") || "";
      let lessonNumber = 1;
      try {
        const url = new URL(href, window.location.href);
        lessonNumber = Number(url.searchParams.get("lesson")) || 1;
      } catch (error) {
        lessonNumber = 1;
      }
      if (lessonNumber > 0 && isLessonCompletedLocal(course, lessonNumber) && !serverCompletedSet.has(lessonNumber)) {
        unmarkLessonCompletedLocal(course, lessonNumber);
      }
    });

    // Re-apply badges from local cache after syncing.
    applyLessonCompletionBadges();

    // Show countdown for the next lesson that will unlock by schedule (the first locked after available ones).
    const availableLessons = Math.max(0, Number(payload.available_lessons || 0));
    const totalLessons = Math.max(0, Number(payload.total_lessons || 0));
    const scheduledNextLessonNumber = availableLessons > 0 ? availableLessons + 1 : 2;

    const nextUnlockAtRaw = String(payload.next_unlock_at || "").trim();
    let unlockAtIso = "";
    if (nextUnlockAtRaw) {
      const unlockAtMs = new Date(nextUnlockAtRaw).getTime();
      if (Number.isFinite(unlockAtMs) && unlockAtMs > Date.now()) {
        unlockAtIso = nextUnlockAtRaw;
      }
    }

    if (
      unlockAtIso &&
      Number.isFinite(scheduledNextLessonNumber) &&
      scheduledNextLessonNumber > 1 &&
      totalLessons > 0 &&
      availableLessons > 0 &&
      availableLessons < totalLessons
    ) {
      let targetButton = null;
      lessonButtons.forEach((button) => {
        if (targetButton) {
          return;
        }
        const href = button.dataset.originalHref || button.getAttribute("href") || "";
        try {
          const url = new URL(href, window.location.href);
          const lessonNumber = Number(url.searchParams.get("lesson")) || 1;
          if (lessonNumber === scheduledNextLessonNumber) {
            targetButton = button;
          }
        } catch (error) {
          // ignore
        }
      });

      if (targetButton) {
        // Keep whatever lock state access-check applied; only replace the label with countdown.
        applyLessonUnlockTimer(targetButton, unlockAtIso, () => {
          applyLessonAccessLocks();
          syncLessonsPageProgressFromServer();
        });
      }
    }
  } catch (error) {
    // Ignore sync errors (e.g., backend down).
  }
};

const applyLessonCompletionBadges = () => {
  const lessonsPageEl = document.querySelector(".lessons-page");
  if (!lessonsPageEl) {
    return;
  }
  const course = getCourseFromPathname();
  if (!course) {
    return;
  }

  enforceBekzodLessonCompletionOverride(lessonsPageEl, course);

  const lessonButtons = lessonsPageEl.querySelectorAll(".lesson-watch-btn");
  lessonButtons.forEach((button) => {
    const href = button.dataset.originalHref || button.getAttribute("href") || "";
    let lessonNumber = 1;
    try {
      const url = new URL(href, window.location.href);
      lessonNumber = Number(url.searchParams.get("lesson")) || 1;
    } catch (error) {
      lessonNumber = 1;
    }
    const existing = button.parentElement && button.parentElement.querySelector(".lesson-completed-badge");
    if (!isLessonCompletedLocal(course, lessonNumber)) {
      if (existing) {
        existing.remove();
      }
      return;
    }
    if (existing) return;
    const badge = document.createElement("div");
    badge.className = "lesson-completed-badge";
    badge.textContent = "Lesson completed";
    button.insertAdjacentElement("beforebegin", badge);
  });
};

const startCourseCelebration = (message = "Congratulations You Did It.") => {
  const existing = document.getElementById("course-celebration");
  if (existing) {
    existing.remove();
  }

  const overlay = document.createElement("div");
  overlay.id = "course-celebration";
  overlay.className = "course-celebration is-open";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");

  const canvas = document.createElement("canvas");
  canvas.className = "course-celebration__canvas";
  canvas.setAttribute("aria-hidden", "true");

  const card = document.createElement("div");
  card.className = "course-celebration__card";

  const title = document.createElement("h2");
  title.className = "course-celebration__title";
  title.textContent = message;

  const subtitle = document.createElement("p");
  subtitle.className = "course-celebration__subtitle";
  subtitle.textContent = "Course completed";

  const closeBtn = document.createElement("button");
  closeBtn.type = "button";
  closeBtn.className = "btn course-celebration__close";
  closeBtn.textContent = "Close";

  card.appendChild(title);
  card.appendChild(subtitle);
  card.appendChild(closeBtn);

  overlay.appendChild(canvas);
  overlay.appendChild(card);
  document.body.appendChild(overlay);
  document.body.style.overflow = "hidden";

  let closed = false;
  let rafId = 0;

  const close = () => {
    if (closed) {
      return;
    }
    closed = true;
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = 0;
    }
    window.removeEventListener("resize", onResize);
    overlay.classList.remove("is-open");
    document.body.style.overflow = "";
    window.setTimeout(() => overlay.remove(), 200);
  };

  if (closeBtn) {
    closeBtn.addEventListener("click", close);
  }
  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) {
      close();
    }
  });
  document.addEventListener(
    "keydown",
    (event) => {
      if (event.key === "Escape") {
        close();
      }
    },
    { once: true }
  );

  if (!(canvas instanceof HTMLCanvasElement)) {
    return;
  }

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return;
  }

  const resize = () => {
    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    canvas.width = Math.floor(window.innerWidth * dpr);
    canvas.height = Math.floor(window.innerHeight * dpr);
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  resize();
  const onResize = () => resize();
  window.addEventListener("resize", onResize, { passive: true });

  const prefersReducedMotion =
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const colors = ["#22c55e", "#16a34a", "#0ea5e9", "#f59e0b", "#ef4444", "#a855f7", "#ffffff"];

  const particles = [];
  const gravity = 0.085;
  const friction = 0.986;
  const maxParticles = 1400;

  const spawnBurst = () => {
    const padding = 80;
    const x = padding + Math.random() * Math.max(0, window.innerWidth - padding * 2);
    const y = 70 + Math.random() * Math.max(0, window.innerHeight * 0.42);
    const particleCount = 120 + Math.floor(Math.random() * 90);
    const color = colors[Math.floor(Math.random() * colors.length)];
    const baseLife = 900 + Math.random() * 800;

    if (particles.length > maxParticles) {
      particles.splice(0, Math.min(particles.length, particleCount));
    }

    for (let i = 0; i < particleCount; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.6 + Math.random() * 5.2;
      particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 1.4 + Math.random() * 2.7,
        age: 0,
        life: baseLife + Math.random() * 600,
        color,
      });
    }
  };

  const drawParticle = (p, alpha) => {
    ctx.globalAlpha = alpha;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  };

  let lastNow = performance.now();
  let nextBurstAt = lastNow + 120;

  if (prefersReducedMotion) {
    for (let i = 0; i < 3; i += 1) {
      spawnBurst();
    }
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    particles.forEach((p) => drawParticle(p, 0.9));
    ctx.globalAlpha = 1;
    return;
  }

  const tick = (now) => {
    if (closed) {
      window.removeEventListener("resize", onResize);
      return;
    }

    const dt = Math.min(34, Math.max(0, now - lastNow));
    const dtFactor = dt / 16.67;
    lastNow = now;

    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    if (!prefersReducedMotion && now >= nextBurstAt) {
      const bursts = Math.random() < 0.55 ? 2 : 1;
      for (let i = 0; i < bursts; i += 1) {
        spawnBurst();
      }
      nextBurstAt = now + 420 + Math.random() * 520;
    }

    for (let i = particles.length - 1; i >= 0; i -= 1) {
      const p = particles[i];
      p.age += dt;
      if (p.age >= p.life) {
        particles.splice(i, 1);
        continue;
      }
      p.vy += gravity * dtFactor;
      p.vx *= Math.pow(friction, dtFactor);
      p.vy *= Math.pow(friction, dtFactor);
      p.x += p.vx * dtFactor;
      p.y += p.vy * dtFactor;

      const t = p.age / p.life;
      const alpha = Math.max(0, 1 - t) * (t < 0.06 ? t / 0.06 : 1);
      drawParticle(p, alpha);
    }

    ctx.globalAlpha = 1;
    rafId = requestAnimationFrame(tick);
  };

  rafId = requestAnimationFrame(tick);
};

const COURSE_RENEW_PLANS = {
  a1: {
    label: "A1",
    price: "350 000 so'm",
    features: [
      "20 beginner video lessons",
      "Basic grammar and vocabulary practice",
      "Pronunciation drills for daily speech",
      "Mini quizzes after each unit",
      "Teacher support and feedback",
    ],
  },
  a2: {
    label: "A2",
    price: "400 000 so'm",
    features: [
      "25 elementary level video lessons",
      "Sentence building and speaking tasks",
      "Grammar tests with explanations",
      "Weekly progress checkpoints",
      "Teacher support and feedback",
    ],
  },
  b1: {
    label: "B1",
    price: "450 000 so'm",
    features: [
      "30 intermediate video lessons",
      "Writing and reading improvement tasks",
      "Essay structure training",
      "Mock tests with analytics",
      "Teacher support and feedback",
    ],
  },
  b2: {
    label: "B2",
    price: "500 000 so'm",
    features: [
      "Advanced grammar and fluency lessons",
      "Academic writing practice",
      "Exam-oriented speaking sessions",
      "Full unit tests with explanations",
      "Teacher support and feedback",
    ],
  },
};

let subscriptionCourseContext = "";

const ensureSubscriptionModals = () => {
  if (document.getElementById("subscription-expired-modal")) {
    return;
  }
  const modalHtml = `
    <div id="subscription-expired-modal" class="subscription-expired-modal" aria-hidden="true">
      <div class="subscription-expired-card" role="dialog" aria-modal="true" aria-labelledby="subscription-expired-title">
        <div class="subscription-expired-icon">!</div>
        <h3 id="subscription-expired-title">Course subscription expired</h3>
        <p id="subscription-expired-text">Your subscription for this course has ended. To continue learning, please renew your subscription.</p>
        <button type="button" class="btn subscription-expired-renew-btn" id="subscription-expired-renew-btn">Renew subscription</button>
        <button type="button" class="btn subscription-expired-back-btn" id="subscription-expired-back-btn">Back to menu</button>
      </div>
    </div>
    <div id="subscription-renew-modal" class="subscription-renew-modal" aria-hidden="true">
      <div class="subscription-renew-card upgrade-plan-card" role="dialog" aria-modal="true" aria-labelledby="subscription-renew-title">
        <div class="upgrade-plan-head">
          <h4 id="subscription-renew-title">A1</h4>
        </div>
        <p class="upgrade-plan-subtitle">What's included:</p>
        <ul class="upgrade-feature-list" id="subscription-renew-features"></ul>
        <p class="subscription-renew-hint" id="subscription-renew-hint">Renew subscription</p>
        <button type="button" class="btn subscription-renew-price-btn" id="subscription-renew-price-btn"></button>
        <button type="button" class="btn subscription-renew-back-btn" id="subscription-renew-back-btn">Back to menu</button>
      </div>
    </div>
    <div id="subscription-confirm-modal" class="subscription-confirm-modal" aria-hidden="true">
      <div class="subscription-confirm-card" role="dialog" aria-modal="true" aria-labelledby="subscription-confirm-title">
        <h3 id="subscription-confirm-title">Please confirm renewal</h3>
        <p id="subscription-confirm-text">Do you want to send a renewal request for this course?</p>
        <button type="button" class="btn subscription-confirm-ok-btn" id="subscription-confirm-ok-btn">Confirm</button>
        <button type="button" class="btn subscription-confirm-back-btn" id="subscription-confirm-back-btn">Back</button>
      </div>
    </div>
    <div id="subscription-sent-modal" class="subscription-sent-modal" aria-hidden="true">
      <div class="subscription-sent-card" role="dialog" aria-modal="true" aria-labelledby="subscription-sent-title">
        <div class="subscription-sent-icon" aria-hidden="true"></div>
        <h3 id="subscription-sent-title">Request sent</h3>
        <p id="subscription-sent-text">Your course renewal request has been sent. Administrators will contact you soon.</p>
        <button type="button" class="btn subscription-sent-back-btn" id="subscription-sent-back-btn">Back to menu</button>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML("beforeend", modalHtml);

  const expiredRenewBtn = document.getElementById("subscription-expired-renew-btn");
  const expiredBackBtn = document.getElementById("subscription-expired-back-btn");
  const renewBackBtn = document.getElementById("subscription-renew-back-btn");
  const renewPriceBtn = document.getElementById("subscription-renew-price-btn");
  const confirmBackBtn = document.getElementById("subscription-confirm-back-btn");
  const confirmOkBtn = document.getElementById("subscription-confirm-ok-btn");
  const sentBackBtn = document.getElementById("subscription-sent-back-btn");

  if (expiredRenewBtn) {
    expiredRenewBtn.addEventListener("click", () => {
      openSubscriptionRenewModal(subscriptionCourseContext);
    });
  }

  if (expiredBackBtn) {
    expiredBackBtn.addEventListener("click", () => {
      window.location.href = "index.html";
    });
  }

  if (renewBackBtn) {
    renewBackBtn.addEventListener("click", () => {
      window.location.href = "index.html";
    });
  }

  if (renewPriceBtn) {
    renewPriceBtn.addEventListener("click", () => {
      openSubscriptionConfirmModal(subscriptionCourseContext);
    });
  }

  if (confirmBackBtn) {
    confirmBackBtn.addEventListener("click", () => {
      openSubscriptionRenewModal(subscriptionCourseContext);
    });
  }

  if (confirmOkBtn) {
    confirmOkBtn.addEventListener("click", async () => {
      const authState = getAuthState();
      const course = subscriptionCourseContext || "";
      const plan = COURSE_RENEW_PLANS[course] || COURSE_RENEW_PLANS.a1;
      try {
        await fetch(`${API_BASE_URL}/api/renewal-request`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            full_name: authState && authState.fullName ? authState.fullName : "",
            phone: "",
            telegram_username: "",
            level: course,
            price_label: plan.price,
            username: authState && authState.username ? authState.username : "",
          }),
        });
      } catch (error) {
        // Ignore submission errors for now.
      }
      openSubscriptionSentModal();
    });
  }

  if (sentBackBtn) {
    sentBackBtn.addEventListener("click", () => {
      window.location.href = "index.html";
    });
  }
};

const closeSubscriptionModals = () => {
  const modalIds = [
    "subscription-expired-modal",
    "subscription-renew-modal",
    "subscription-confirm-modal",
    "subscription-sent-modal",
  ];
  modalIds.forEach((id) => {
    const modal = document.getElementById(id);
    if (modal && modal.classList.contains("is-open")) {
      modal.classList.remove("is-open");
      modal.setAttribute("aria-hidden", "true");
    }
  });
};

const openSubscriptionExpiredModal = (course) => {
  ensureSubscriptionModals();
  closeSubscriptionModals();
  subscriptionCourseContext = String(course || "").trim().toLowerCase();
  const modal = document.getElementById("subscription-expired-modal");
  if (!modal) {
    return;
  }
  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");
  syncModalBodyScroll();
};

const openSubscriptionRenewModal = (course) => {
  ensureSubscriptionModals();
  closeSubscriptionModals();
  subscriptionCourseContext = String(course || "").trim().toLowerCase();
  const modal = document.getElementById("subscription-renew-modal");
  if (!modal) {
    return;
  }

  const plan = COURSE_RENEW_PLANS[subscriptionCourseContext] || COURSE_RENEW_PLANS.a1;
  const titleEl = document.getElementById("subscription-renew-title");
  const featuresEl = document.getElementById("subscription-renew-features");
  const priceBtn = document.getElementById("subscription-renew-price-btn");
  const hintEl = document.getElementById("subscription-renew-hint");
  const authState = getAuthState();
  const authLevelLabel = authState ? formatLevelLabel(authState.level || "") : "";
  const shouldShowAuthLevel = authLevelLabel && normalizeCourseLevel(authState.level || "") === subscriptionCourseContext;
  const escapeHtmlInline = (value) =>
    String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  if (titleEl) {
    titleEl.textContent = shouldShowAuthLevel ? authLevelLabel : plan.label;
  }
  if (featuresEl) {
    featuresEl.innerHTML = plan.features.map((item) => `<li>${escapeHtmlInline(item)}</li>`).join("");
  }
  if (priceBtn) {
    priceBtn.textContent = plan.price;
  }
  if (hintEl) {
    hintEl.textContent = "Renew subscription";
  }

  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");
  syncModalBodyScroll();
};

const openSubscriptionConfirmModal = () => {
  ensureSubscriptionModals();
  closeSubscriptionModals();
  const modal = document.getElementById("subscription-confirm-modal");
  if (!modal) {
    return;
  }
  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");
  syncModalBodyScroll();
};

const openSubscriptionSentModal = () => {
  ensureSubscriptionModals();
  closeSubscriptionModals();
  const modal = document.getElementById("subscription-sent-modal");
  if (!modal) {
    return;
  }
  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");
  syncModalBodyScroll();
};

const handleSubscriptionGate = async () => {
  const lessonsPageEl = document.querySelector(".lessons-page");
  if (!lessonsPageEl) {
    return;
  }
  const authState = getAuthState();
  const currentCourse = getCourseFromPathname();
  if (!authState || !authState.sessionToken || !currentCourse) {
    return;
  }
  if (authState.role === "admin" || authState.role === "mentor") {
    return;
  }
  if (normalizeCourseLevel(authState.level || "") !== currentCourse) {
    return;
  }
  const accessPayload = await fetchLessonAccess(currentCourse, 1);
  let shouldGate = Boolean(accessPayload && accessPayload.reason === "subscription_expired");

  // Fallback: if the session token is stale (e.g. switching DBs/servers),
  // `access/check` can return guest access for lesson 1. Use progress summary to
  // still show the subscription-expired modal reliably.
  if (!shouldGate && authState.username) {
    try {
      await ensureApiBaseUrl();
      const response = await fetch(
        `${API_BASE_URL}/api/user/progress-summary?username=${encodeURIComponent(authState.username)}`
      );
      if (response.ok) {
        const summary = await response.json();
        const remainingDays = Number(summary && summary.remaining_days ? summary.remaining_days : 0);
        const remainingHours = Number(summary && summary.remaining_hours ? summary.remaining_hours : 0);
        const summaryCourse = normalizeCourseLevel(summary && summary.level ? summary.level : "");
        if (summaryCourse === currentCourse && remainingDays <= 0 && remainingHours <= 0) {
          shouldGate = true;
        }
      }
    } catch (error) {
      // Ignore fallback errors.
    }
  }

  if (shouldGate) {
    openSubscriptionExpiredModal(currentCourse);
  }
};

const applyCourseLevelLocks = () => {
  const courseButtons = document.querySelectorAll("#levels .card .btn");
  const authState = getAuthState();
  const isLoggedIn = !!(authState && authState.sessionToken);
  const userLevel = authState ? normalizeCourseLevel(authState.level) : "";
  const isAdmin = authState && authState.role === "admin";

  courseButtons.forEach((button) => {
    if (!button.dataset.originalText) {
      button.dataset.originalText = button.textContent;
    }
    if (!button.dataset.originalHref) {
      button.dataset.originalHref = button.getAttribute("href") || "#";
    }

    button.href = button.dataset.originalHref;
    button.textContent = button.dataset.originalText;
    button.classList.remove("is-locked-course-btn");
    button.removeAttribute("aria-disabled");
    button.removeAttribute("tabindex");
    button.onclick = null;

    if (isLoggedIn && userLevel && !isAdmin) {
      const btnHref = button.dataset.originalHref;
      let courseMatch = "";
      if (btnHref.includes("a1.html")) courseMatch = "a1";
      else if (btnHref.includes("a2.html")) courseMatch = "a2";
      else if (btnHref.includes("b1.html")) courseMatch = "b1";
      else if (btnHref.includes("b2.html")) courseMatch = "b2";

      if (courseMatch && courseMatch !== userLevel) {
        button.href = "#";
        button.textContent = "Locked";
        button.classList.add("is-locked-course-btn");
        button.setAttribute("aria-disabled", "true");
        button.setAttribute("tabindex", "-1");
        button.onclick = (e) => e.preventDefault();
      }
    }
  });
};

const updateLoginButton = () => {
  const authState = getAuthState();

  if (loginBtn) {
    loginBtn.textContent = authState ? "Logout" : "Login";
  }

  if (profileBtn) {
    profileBtn.hidden = !authState || isAdminUser();
  }

  if (mentorStudentsBtn) {
    mentorStudentsBtn.hidden = !authState || authState.role !== "mentor";
    mentorStudentsBtn.style.position = "relative";
  }
  if (mentorStudentsBadge && (!authState || authState.role !== "mentor")) {
    mentorStudentsBadge.hidden = true;
    mentorStudentsBadge.textContent = "0";
  }

  if (headerGreeting) {
    if (authState && authState.username) {
      const displayName = String(authState.fullName || "").trim() || authState.username;
      headerGreeting.textContent = `Welcome, ${displayName}`;
      headerGreeting.hidden = false;
    } else {
      headerGreeting.textContent = "";
      headerGreeting.hidden = true;
    }
  }

  if (adminPanelBtn) {
    adminPanelBtn.hidden = !authState || !isAdminUser();
  }
  if (adminSubscriptionsEditBtn) {
    adminSubscriptionsEditBtn.hidden = !authState || !isAdminUser();
  }
  if (adminPanelBadge && (!authState || !isAdminUser())) {
    adminPanelBadge.hidden = true;
    adminPanelBadge.textContent = "0";
  }

  syncAdminPanelPlacement();
};

const closeProfileModal = () => {
  if (!profileModal) {
    return;
  }
  profileModal.classList.remove("is-open");
  profileModal.setAttribute("aria-hidden", "true");
  syncModalBodyScroll();
};

const closeMentorStudentModal = () => {
  if (!mentorStudentModal) {
    return;
  }
  mentorStudentModal.classList.remove("is-open");
  mentorStudentModal.setAttribute("aria-hidden", "true");
  if (mentorStudentTitle) {
    mentorStudentTitle.textContent = "Student";
  }
  if (mentorViewProgressBtn) {
    mentorViewProgressBtn.hidden = true;
    delete mentorViewProgressBtn.dataset.student;
  }
  if (mentorHomeworkBtn) {
    mentorHomeworkBtn.hidden = true;
    delete mentorHomeworkBtn.dataset.student;
  }
  if (mentorHomeworkBadge) {
    mentorHomeworkBadge.hidden = true;
    mentorHomeworkBadge.textContent = "0";
  }
  if (mentorStudentBody) {
    mentorStudentBody.innerHTML = "";
  }
  syncModalBodyScroll();
};

const closeMentorProgressModal = () => {
  if (!mentorProgressModal) {
    return;
  }
  mentorProgressModal.classList.remove("is-open");
  mentorProgressModal.setAttribute("aria-hidden", "true");
  if (mentorProgressTitle) {
    mentorProgressTitle.textContent = "Student Progress";
  }
  if (mentorProgressNote) {
    mentorProgressNote.textContent = "";
  }
  if (mentorProgressLessons) {
    mentorProgressLessons.innerHTML = "";
  }
  syncModalBodyScroll();
};

const closeMentorHomeworkModal = () => {
  if (!mentorHomeworkModal) {
    return;
  }
  mentorHomeworkModal.classList.remove("is-open");
  mentorHomeworkModal.setAttribute("aria-hidden", "true");
  if (mentorHomeworkTitle) {
    mentorHomeworkTitle.textContent = "Homework";
  }
  if (mentorHomeworkNote) {
    mentorHomeworkNote.textContent = "";
  }
  if (mentorHomeworkLessons) {
    mentorHomeworkLessons.innerHTML = "";
  }
  syncModalBodyScroll();
};

const setMentorHomeworkReviewMessage = (message, tone = "") => {
  if (!mentorHomeworkReviewMessage) return;
  mentorHomeworkReviewMessage.textContent = message || "";
  mentorHomeworkReviewMessage.classList.remove("is-success");
  if (tone === "success") {
    mentorHomeworkReviewMessage.classList.add("is-success");
  }
};

const closeMentorHomeworkReviewModal = () => {
  if (!mentorHomeworkReviewModal) return;
  mentorHomeworkReviewModal.classList.remove("is-open");
  mentorHomeworkReviewModal.setAttribute("aria-hidden", "true");
  delete mentorHomeworkReviewModal.dataset.submissionId;
  delete mentorHomeworkReviewModal.dataset.student;
  delete mentorHomeworkReviewModal.dataset.course;
  delete mentorHomeworkReviewModal.dataset.lessonNumber;
  if (mentorHomeworkReviewMeta) mentorHomeworkReviewMeta.textContent = "-";
  if (mentorHomeworkReviewDownloadBtn) {
    mentorHomeworkReviewDownloadBtn.setAttribute("aria-disabled", "true");
    mentorHomeworkReviewDownloadBtn.classList.add("is-disabled");
    mentorHomeworkReviewDownloadBtn.setAttribute("href", "#");
  }
  if (mentorHomeworkReviewScore) mentorHomeworkReviewScore.value = "5";
  if (mentorHomeworkReviewComment) mentorHomeworkReviewComment.value = "";
  setMentorHomeworkReviewMessage("");
  syncModalBodyScroll();
};

const openMentorHomeworkReviewModal = (payload) => {
  if (!mentorHomeworkReviewModal) return;
  const submissionId = Number(payload && payload.submissionId ? payload.submissionId : 0) || 0;
  if (submissionId <= 0) return;
  const authState = getAuthState();
  mentorHomeworkReviewModal.dataset.submissionId = String(submissionId);
  mentorHomeworkReviewModal.dataset.student = String(payload && payload.student ? payload.student : "").trim();
  mentorHomeworkReviewModal.dataset.course = String(payload && payload.course ? payload.course : "").trim();
  mentorHomeworkReviewModal.dataset.lessonNumber = String(payload && payload.lessonNumber ? payload.lessonNumber : "").trim();
  const lessonTitle = String(payload && payload.lessonTitle ? payload.lessonTitle : "").trim();
  const lessonNumber = String(payload && payload.lessonNumber ? payload.lessonNumber : "").trim();
  const student = String(payload && payload.student ? payload.student : "").trim();
  const latestAt = String(payload && payload.latestAt ? payload.latestAt : "").trim();
  if (mentorHomeworkReviewMeta) {
    const titlePart = lessonTitle ? `Lesson ${lessonNumber}: ${lessonTitle}` : `Lesson ${lessonNumber}`;
    const studentPart = student ? `Student: ${student}` : "Student: -";
    const sentPart = latestAt ? `Last sent: ${latestAt}` : "";
    mentorHomeworkReviewMeta.textContent = [studentPart, titlePart, sentPart].filter(Boolean).join(" • ");
  }
  if (mentorHomeworkReviewDownloadBtn) {
    if (authState && authState.role === "mentor" && authState.username) {
      const downloadUrl = `${API_BASE_URL}/api/mentor/homework/download?username=${encodeURIComponent(
        String(authState.username).trim()
      )}&submission_id=${encodeURIComponent(String(submissionId))}`;
      mentorHomeworkReviewDownloadBtn.classList.remove("is-disabled");
      mentorHomeworkReviewDownloadBtn.removeAttribute("aria-disabled");
      mentorHomeworkReviewDownloadBtn.href = downloadUrl;
    } else {
      mentorHomeworkReviewDownloadBtn.setAttribute("aria-disabled", "true");
      mentorHomeworkReviewDownloadBtn.classList.add("is-disabled");
      mentorHomeworkReviewDownloadBtn.setAttribute("href", "#");
    }
  }
  if (mentorHomeworkReviewScore) mentorHomeworkReviewScore.value = "5";
  if (mentorHomeworkReviewComment) mentorHomeworkReviewComment.value = "";
  setMentorHomeworkReviewMessage("");
  mentorHomeworkReviewModal.classList.add("is-open");
  mentorHomeworkReviewModal.setAttribute("aria-hidden", "false");
  syncModalBodyScroll();
};

const showMentorHomeworkCheckedLabel = (submissionId) => {
  const id = Number(submissionId || 0) || 0;
  if (!mentorHomeworkLessons || id <= 0) return;
  const buttons = mentorHomeworkLessons.querySelectorAll(".mentor-homework-checked-btn");
  buttons.forEach((button) => {
    if (!(button instanceof HTMLButtonElement)) return;
    const btnId = Number(button.dataset.submissionId || 0) || 0;
    if (btnId !== id) return;
    const card = button.closest(".mentor-homework-lesson-card");
    if (!card) return;
    const label = card.querySelector(".mentor-homework-checked-label");
    if (label) {
      label.removeAttribute("hidden");
    }
  });
};

const saveMentorHomeworkReview = async () => {
  const authState = getAuthState();
  if (!authState || authState.role !== "mentor" || !authState.username) {
    setMentorHomeworkReviewMessage("Please log in as a mentor.");
    return;
  }
  if (!mentorHomeworkReviewModal) return;
  const submissionId = Number(mentorHomeworkReviewModal.dataset.submissionId || 0) || 0;
  if (submissionId <= 0) {
    setMentorHomeworkReviewMessage("Homework submission is missing.");
    return;
  }
  const score = Number(mentorHomeworkReviewScore && mentorHomeworkReviewScore.value ? mentorHomeworkReviewScore.value : 0) || 0;
  if (!(score >= 1 && score <= 5)) {
    setMentorHomeworkReviewMessage("Score must be between 1 and 5.");
    return;
  }
  const comment = String(mentorHomeworkReviewComment && mentorHomeworkReviewComment.value ? mentorHomeworkReviewComment.value : "").trim();
  try {
    await ensureApiBaseUrl();
    if (mentorHomeworkReviewSaveBtn) {
      mentorHomeworkReviewSaveBtn.disabled = true;
    }
    const response = await fetch(`${API_BASE_URL}/api/mentor/homework/review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: String(authState.username).trim(),
        submission_id: submissionId,
        score,
        comment,
      }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      setMentorHomeworkReviewMessage(payload && payload.error ? String(payload.error) : `Save failed (HTTP ${response.status}).`);
      return;
    }
	    const reviewedStudent = String(mentorHomeworkReviewModal.dataset.student || "").trim();
	    const reviewedSubmissionId = Number(mentorHomeworkReviewModal.dataset.submissionId || 0) || 0;
	    closeMentorHomeworkReviewModal();
	    showMentorHomeworkCheckedLabel(reviewedSubmissionId);
	    await openMentorHomeworkModal(reviewedStudent);
	    refreshMentorHomeworkSummary();
  } catch (error) {
    setMentorHomeworkReviewMessage("Auth server is not running.");
  } finally {
    if (mentorHomeworkReviewSaveBtn) mentorHomeworkReviewSaveBtn.disabled = false;
  }
};

const openMentorHomeworkModal = async (studentUsername) => {
  if (!mentorHomeworkModal) {
    return;
  }
  const authState = getAuthState();
  if (!authState || authState.role !== "mentor" || !authState.username) {
    return;
  }
  const target = String(studentUsername || "").trim();
  if (!target) {
    return;
  }

  const parseUtcDate = (value) => {
    const raw = String(value || "").trim();
    if (!raw) return null;
    const hasTimezone = /[zZ]|[+-]\d{2}:\d{2}$/.test(raw);
    const candidate = hasTimezone ? raw : `${raw}Z`;
    const date = new Date(candidate);
    return Number.isNaN(date.getTime()) ? null : date;
  };
  const formatTimestamp = (value) => {
    const date = parseUtcDate(value);
    return date ? date.toLocaleString() : value || "-";
  };

  mentorHomeworkModal.classList.add("is-open");
  mentorHomeworkModal.setAttribute("aria-hidden", "false");
  syncModalBodyScroll();
  if (mentorHomeworkTitle) {
    mentorHomeworkTitle.textContent = `Homework: ${target}`;
  }
  if (mentorHomeworkNote) {
    mentorHomeworkNote.textContent = "Loading...";
  }
  if (mentorHomeworkLessons) {
    mentorHomeworkLessons.innerHTML = "";
  }

  await ensureApiBaseUrl();
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/mentor/homework/lessons?username=${encodeURIComponent(
        authState.username
      )}&student_username=${encodeURIComponent(target)}`
    );
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      if (mentorHomeworkNote) {
        mentorHomeworkNote.textContent = payload && payload.error ? String(payload.error) : "Failed to load homework.";
      }
      return;
    }
    const items = Array.isArray(payload.items) ? payload.items : [];
	    if (mentorHomeworkNote) {
	      const newTotal = items.reduce((acc, item) => acc + ((Number(item.new_count || 0) || 0) > 0 ? 1 : 0), 0);
	      mentorHomeworkNote.textContent = items.length
	        ? `Lessons with homework: ${items.length}${newTotal > 0 ? ` • New: ${newTotal}` : ""}`
	        : "No homework submissions yet.";
	    }
    if (!mentorHomeworkLessons) {
      return;
    }
    const lessonCoverFallback = "https://i.pinimg.com/736x/71/dd/47/71dd4745ab21b90b5162c0f864fba8e7.jpg";
	    mentorHomeworkLessons.innerHTML = "";
		    items.forEach((item) => {
		      const course = String(item.course || "").trim().toLowerCase();
		      const lessonNumber = Number(item.lesson_number || 0) || 0;
		      const latestId = Number(item.latest_submission_id || 0) || 0;
		      const latestAt = item.latest_submitted_at ? formatTimestamp(item.latest_submitted_at) : "-";
		      const lessonMeta = (LESSONS_BY_COURSE[course] || {})[lessonNumber] || { title: `Theme: Lesson ${lessonNumber}` };
		      const lessonTitle = stripThemePrefix(lessonMeta.title || "");
		      const coverUrl = String(lessonMeta.cover || "").trim() || lessonCoverFallback;

			      const card = document.createElement("article");
			      card.className = "admin-progress-lesson-card mentor-homework-lesson-card";
			      const hasNew = (Number(item.new_count || 0) || 0) > 0;
				      card.innerHTML = `
				        <div class="admin-progress-lesson-cover">
				          <img src="${escapeHtml(coverUrl)}" alt="Lesson ${escapeHtml(lessonNumber)} cover">
				        </div>
				        <div class="admin-progress-lesson-body">
				          <h4>Lesson ${escapeHtml(lessonNumber)}: ${escapeHtml(lessonTitle)}</h4>
				          <p class="mentor-homework-checked-label"${hasNew ? " hidden" : ""}>Homework Checked</p>
				          <div class="mentor-homework-actions">
				            <button
			              type="button"
			              class="btn mentor-homework-checked-btn${latestId > 0 ? "" : " is-disabled"}"
		              data-submission-id="${escapeHtml(latestId)}"
		              data-student="${escapeHtml(target)}"
		              data-course="${escapeHtml(course)}"
		              data-lesson-number="${escapeHtml(lessonNumber)}"
		              data-lesson-title="${escapeHtml(lessonTitle)}"
		              data-latest-at="${escapeHtml(latestAt)}"
		              ${latestId > 0 ? "" : "disabled"}
		            >
		              Check Homework
		            </button>
		          </div>
		        </div>
		      `;
		      mentorHomeworkLessons.appendChild(card);
		    });

    // Refresh the header / modal badges after opening (download will mark seen server-side).
    refreshMentorHomeworkSummary();
  } catch (error) {
    if (mentorHomeworkNote) {
      mentorHomeworkNote.textContent = "Auth server is not running.";
    }
  }
};

const clampPercent = (value) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return 0;
  return Math.min(100, Math.max(0, num));
};

const getPercentToneStyle = (percent) => {
  const value = clampPercent(percent);
  const hue = Math.round((value / 100) * 120); // 0=red, 120=green
  const textColor = `hsl(${hue} 55% 26%)`;
  const borderColor = `hsl(${hue} 45% 70%)`;
  const bgTop = `hsl(${hue} 90% 96%)`;
  const bgBottom = `hsl(${hue} 85% 90%)`;
  return `color:${textColor};background:linear-gradient(180deg, ${bgTop} 0%, ${bgBottom} 100%);border:1px solid ${borderColor};`;
};

const renderMentorProgressLessons = (course, lessons, student) => {
  if (!mentorProgressLessons || !mentorProgressNote) {
    return;
  }
  const courseLessons = LESSONS_BY_COURSE[course] || {};
  const lessonCoverFallback = "https://i.pinimg.com/736x/71/dd/47/71dd4745ab21b90b5162c0f864fba8e7.jpg";
  const formatSeconds = (value) => {
    const total = Math.max(0, Math.round(Number(value) || 0));
    const minutes = Math.floor(total / 60);
    const seconds = total % 60;
    return `${minutes}:${String(seconds).padStart(2, "0")}`;
  };
  const parseUtcDate = (value) => {
    const raw = String(value || "").trim();
    if (!raw) {
      return null;
    }
    const hasTimezone = /[zZ]|[+-]\d{2}:\d{2}$/.test(raw);
    const candidate = hasTimezone ? raw : `${raw}Z`;
    const date = new Date(candidate);
    return Number.isNaN(date.getTime()) ? null : date;
  };
  const formatTimestamp = (value) => {
    const date = parseUtcDate(value);
    if (date) {
      return date.toLocaleString();
    }
    return value || "-";
  };

  mentorProgressLessons.innerHTML = "";
  (Array.isArray(lessons) ? lessons : []).forEach((item) => {
    const lessonNumber = Number(item.lesson_number || 0) || 0;
    const lessonMeta = courseLessons[lessonNumber] || { title: `Theme: Lesson ${lessonNumber}` };
    const lessonCoverUrl = String(lessonMeta.cover || "").trim() || lessonCoverFallback;
    const correctCount = Number(item.correct_count || 0);
    const wrongCount = Number(item.wrong_count || 0);
    const answeredCount = Math.max(0, correctCount + wrongCount);
    const accuracyPercent = answeredCount > 0 ? Math.round((correctCount * 100) / answeredCount) : 0;
    const accuracyClass = accuracyPercent >= 70 ? "is-good" : "is-bad";
    const videoWatched = Number(item.video_watched_seconds || 0);
    const videoWatchedMinutes = Number(item.video_watched_minutes || 0);
    const videoDuration = Number(item.video_duration_seconds || 0);
    const videoPercent = videoDuration > 0 ? Math.round((videoWatched * 100) / videoDuration) : 0;
    const videoClass = videoDuration > 0 ? (videoPercent >= 70 ? "is-good" : "is-bad") : "is-empty";
    const videoStyle = videoDuration > 0 ? getPercentToneStyle(videoPercent) : "";
    const videoMeta = videoDuration > 0 ? `${formatSeconds(videoWatched)} / ${formatSeconds(videoDuration)}` : "No data";
    const videoMinutesLabel =
      videoDuration > 0 || videoWatchedMinutes > 0 ? `${videoWatchedMinutes.toFixed(2)} min` : "-";
    const videoLastSeenLabel = item.video_updated_at ? formatTimestamp(item.video_updated_at) : "-";

    const card = document.createElement("article");
    card.className = "admin-progress-lesson-card";
    card.innerHTML = `
      <div class="admin-progress-lesson-cover">
        <img src="${lessonCoverUrl}" alt="Lesson ${lessonNumber} cover">
      </div>
      <div class="admin-progress-lesson-body">
        <h4>Lesson ${lessonNumber}: ${escapeHtml((lessonMeta.title || "").replace("Theme: ", ""))}</h4>
        <p class="admin-progress-correct">Correct: ${escapeHtml(correctCount)}</p>
        <p class="admin-progress-wrong">Wrong: ${escapeHtml(wrongCount)}</p>
        <div class="admin-progress-percent ${accuracyClass}">
          <span class="admin-progress-percent-label">Accuracy</span>
          <span class="admin-progress-percent-value">${escapeHtml(accuracyPercent)}%</span>
          <span class="admin-progress-percent-meta">${escapeHtml(answeredCount)} answered</span>
        </div>
        <div class="admin-progress-video ${videoClass}"${videoStyle ? ` style="${videoStyle}"` : ""}>
          <span class="admin-progress-video-label">Progress of watched video</span>
          <span class="admin-progress-video-value">${videoDuration > 0 ? `${escapeHtml(videoPercent)}%` : "-"}</span>
          <span class="admin-progress-video-meta">${escapeHtml(videoMeta)}</span>
          <span class="admin-progress-video-meta">Watched minutes: ${escapeHtml(videoMinutesLabel)}</span>
          <span class="admin-progress-video-meta">Last watched: ${escapeHtml(videoLastSeenLabel)}</span>
        </div>
      </div>
    `;
    mentorProgressLessons.appendChild(card);
  });

  const levelLabel = formatLevelLabel(student && student.level ? student.level : "");
  mentorProgressNote.textContent = `${(student && (student.full_name || student.username)) || "-"} (${levelLabel || "-"})`;
};

const openMentorProgressModal = async (studentUsername) => {
  if (!mentorProgressModal) {
    return;
  }
  const authState = getAuthState();
  if (!authState || authState.role !== "mentor" || !authState.username) {
    return;
  }
  const target = String(studentUsername || "").trim();
  if (!target) {
    return;
  }
  mentorProgressModal.classList.add("is-open");
  mentorProgressModal.setAttribute("aria-hidden", "false");
  syncModalBodyScroll();
  if (mentorProgressNote) {
    mentorProgressNote.textContent = "Loading progress...";
  }
  if (mentorProgressLessons) {
    mentorProgressLessons.innerHTML = "";
  }
  await ensureApiBaseUrl();
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/mentor/progress?username=${encodeURIComponent(authState.username)}&student_username=${encodeURIComponent(target)}`
    );
    if (!response.ok) {
      let serverError = "";
      try {
        const errPayload = await response.json();
        serverError = errPayload && errPayload.error ? String(errPayload.error) : "";
      } catch (error) {
        serverError = "";
      }
      if (mentorProgressNote) {
        mentorProgressNote.textContent = serverError
          ? `Could not load student progress: ${serverError}.`
          : `Could not load student progress (HTTP ${response.status}).`;
      }
      return;
    }
    const payload = await response.json();
    if (mentorProgressTitle) {
      mentorProgressTitle.textContent = `Progress: ${payload && payload.student ? payload.student.username : target}`;
    }
    renderMentorProgressLessons(payload.course, payload.lessons || [], payload.student || {});
  } catch (error) {
    if (mentorProgressNote) {
      mentorProgressNote.textContent = "Auth server is not running.";
    }
  }
};

const closeMentorStudentsModal = () => {
  if (!mentorStudentsModal) {
    return;
  }
  mentorStudentsModal.classList.remove("is-open");
  mentorStudentsModal.setAttribute("aria-hidden", "true");
  if (mentorStudentsNote) {
    mentorStudentsNote.textContent = "";
  }
  if (mentorStudentsHomeworkAlert) {
    mentorStudentsHomeworkAlert.hidden = true;
    mentorStudentsHomeworkAlert.innerHTML = "";
  }
  if (mentorStudentsGrid) {
    mentorStudentsGrid.innerHTML = "";
  }
  syncModalBodyScroll();
};

const openMentorStudentsModal = async () => {
  if (!mentorStudentsModal) {
    return;
  }
  const authState = getAuthState();
  if (!authState || authState.role !== "mentor" || !authState.username) {
    return;
  }
  mentorStudentsModal.classList.add("is-open");
  mentorStudentsModal.setAttribute("aria-hidden", "false");
  syncModalBodyScroll();
  if (mentorStudentsNote) {
    mentorStudentsNote.textContent = "Loading...";
  }
  if (mentorStudentsHomeworkAlert) {
    mentorStudentsHomeworkAlert.hidden = true;
    mentorStudentsHomeworkAlert.innerHTML = "";
  }
  if (mentorStudentsGrid) {
    mentorStudentsGrid.innerHTML = "";
  }
  await ensureApiBaseUrl();
  await refreshMentorHomeworkSummary();
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/mentor/students?username=${encodeURIComponent(authState.username)}`
    );
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      if (mentorStudentsNote) {
        mentorStudentsNote.textContent = payload && payload.error ? String(payload.error) : "Failed to load students.";
      }
      return;
    }
    const items = Array.isArray(payload.items) ? payload.items : [];
    if (mentorStudentsNote) {
      mentorStudentsNote.textContent = items.length ? `Students: ${items.length}` : "No students yet.";
    }
    if (!mentorStudentsGrid) {
      return;
    }
	    mentorStudentsGrid.innerHTML = "";
		    items.forEach((item) => {
		      const card = document.createElement("article");
		      card.className = "mentor-students-student";
	      const progress = Math.round(Number(item.average_percent || 0));
	      const name = item.full_name || item.username || "Student";
	      const username = String(item.username || "").trim();
	      const newCount =
	        mentorHomeworkSummaryCache && mentorHomeworkSummaryCache.by_student
	          ? Number(mentorHomeworkSummaryCache.by_student[String(username).toLowerCase()] || 0) || 0
	          : 0;
		      card.innerHTML = `
		        ${
		          newCount > 0
		            ? `<span class="admin-requests-badge mentor-students-card-badge">${escapeHtml(
		                newCount > 99 ? "99+" : String(newCount)
		              )}</span>`
		            : ""
		        }
		        <h4>${escapeHtml(name)}</h4>
		        <p class="mentor-students-progress">Average progress: ${Number.isFinite(progress) ? progress : 0}%</p>
		        <button type="button" class="btn mentor-students-view-more" data-student="${escapeHtml(username)}">View More</button>
		      `;
		      mentorStudentsGrid.appendChild(card);
		    });
  } catch (error) {
    if (mentorStudentsNote) {
      mentorStudentsNote.textContent = "Auth server is not running.";
    }
  }
};

const openMentorStudentDetails = async (studentUsername) => {
  if (!mentorStudentModal) {
    return;
  }
  const authState = getAuthState();
  if (!authState || authState.role !== "mentor" || !authState.username) {
    return;
  }
  const target = String(studentUsername || "").trim();
  if (!target) {
    return;
  }
  mentorStudentModal.classList.add("is-open");
  mentorStudentModal.setAttribute("aria-hidden", "false");
  syncModalBodyScroll();
  if (mentorStudentTitle) {
    mentorStudentTitle.textContent = `Student: ${target}`;
  }
  if (mentorViewProgressBtn) {
    mentorViewProgressBtn.hidden = false;
    mentorViewProgressBtn.dataset.student = target;
  }
  if (mentorHomeworkBtn) {
    mentorHomeworkBtn.hidden = false;
    mentorHomeworkBtn.dataset.student = target;
  }
  const mentorNewHomeworkCount =
    mentorHomeworkSummaryCache && mentorHomeworkSummaryCache.by_student
      ? Number(mentorHomeworkSummaryCache.by_student[String(target).toLowerCase()] || 0) || 0
      : 0;
  if (mentorHomeworkBadge) {
    mentorHomeworkBadge.textContent = mentorNewHomeworkCount > 99 ? "99+" : String(mentorNewHomeworkCount);
    mentorHomeworkBadge.hidden = mentorNewHomeworkCount <= 0;
  }
  if (mentorStudentBody) {
    mentorStudentBody.innerHTML = "<p class=\"admin-delete-note\">Loading...</p>";
  }
  await ensureApiBaseUrl();
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/mentor/student-details?username=${encodeURIComponent(
        authState.username
      )}&student_username=${encodeURIComponent(target)}`
    );
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      if (mentorStudentBody) {
        const err = payload && payload.error ? String(payload.error) : `Failed to load details (HTTP ${response.status}).`;
        mentorStudentBody.innerHTML = `<p class="admin-delete-note">${escapeHtml(err)}</p>`;
      }
      return;
    }
    const student = payload.student || {};
    const summary = payload.summary || {};
    const parents = Array.isArray(payload.parents) ? payload.parents : [];
    const scheduleLabel = formatScheduleLabel(student.lesson_schedule || "", student.level || "") || "-";
    const avg = Math.round(Number(summary.average_percent || 0));
    const completed = Math.max(0, Number(summary.completed_lessons || 0));
    const opened = Math.max(0, Number(summary.available_lessons || 0));
    const remainingDays = Math.max(0, Number(summary.remaining_days || 0));
    const remainingHours = Math.max(0, Number(summary.remaining_hours || 0));
    const parentsHtml = parents.length
      ? `<ul class="admin-user-info-parents-list">${parents
          .map((item) => {
            const relation = String(item.relation || "").toLowerCase();
            const relationLabel = relation === "mother" ? "👩 Mother" : relation === "father" ? "👨 Father" : relation || "-";
            const name = [item.first_name, item.last_name].filter(Boolean).join(" ").trim() || "-";
            const phone = item.phone || "-";
            return `<li>${escapeHtml(relationLabel)} — ${escapeHtml(name)}<br><span class="admin-user-info-parents-phone">${escapeHtml(
              phone
            )}</span></li>`;
          })
          .join("")}</ul>`
      : `<p class="admin-user-info-empty">-</p>`;

	    if (mentorStudentBody) {
	      mentorStudentBody.innerHTML = `
	        <div class="admin-user-info-sections mentor-student-summary">
	          <section class="admin-user-info-section">
	            <h4>👤 Account</h4>
	            <div class="admin-device-detail-grid">
              <div class="admin-device-detail-item">
                <span class="admin-device-detail-label">🧑 Full name</span>
                <p>${escapeHtml(student.full_name || "-")}</p>
              </div>
              <div class="admin-device-detail-item">
                <span class="admin-device-detail-label">📞 Phone</span>
                <p>${escapeHtml(student.phone || "-")}</p>
              </div>
              <div class="admin-device-detail-item">
                <span class="admin-device-detail-label">📅 Schedule</span>
                <p>${escapeHtml(scheduleLabel)}</p>
              </div>
              <div class="admin-device-detail-item">
                <span class="admin-device-detail-label">📈 Average progress</span>
                <p>${Number.isFinite(avg) ? `${avg}%` : "0%"}</p>
              </div>
              <div class="admin-device-detail-item">
                <span class="admin-device-detail-label">✅ Lessons completed</span>
                <p>${Math.min(completed, opened)} / ${opened}</p>
              </div>
              <div class="admin-device-detail-item">
                <span class="admin-device-detail-label">⏳ Subscription time left</span>
                <p>${remainingDays} days ${remainingHours} hours</p>
              </div>
            </div>
          </section>

          <section class="admin-user-info-section">
            <h4>❓ Student's Questions</h4>
            <p class="admin-user-info-empty">-</p>
          </section>

          <section class="admin-user-info-section admin-user-info-parents">
            <h4>👨‍👩‍👧 Parents</h4>
            ${parentsHtml}
          </section>
        </div>
      `;
    }
  } catch (error) {
    if (mentorStudentBody) {
      mentorStudentBody.innerHTML = "<p class=\"admin-delete-note\">Auth server is not running.</p>";
    }
  }
};

const closeAchievementsModal = () => {
  if (!achievementsModal) {
    return;
  }
  achievementsModal.classList.remove("is-open");
  achievementsModal.setAttribute("aria-hidden", "true");
  syncModalBodyScroll();
};

const closeLeaderboardModal = () => {
  if (!leaderboardModal) {
    return;
  }
  leaderboardModal.classList.remove("is-open");
  leaderboardModal.setAttribute("aria-hidden", "true");
  syncModalBodyScroll();
};

const renderAchievementsModal = (items) => {
  if (!achievementsModalList) {
    return;
  }
  const escapeHtmlInline = (value) =>
    String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");

  const list = Array.isArray(items) ? items : [];
  if (!list.length) {
    achievementsModalList.innerHTML = "<p>No achievements yet.</p>";
    return;
  }
  achievementsModalList.innerHTML = list
    .map((item) => {
      const earned = !!(item && item.earned);
      const title = escapeHtmlInline(item?.title || item?.title_ru || "");
      const description = escapeHtmlInline(item?.description || item?.description_ru || "");
      const icon = earned
        ? ACHIEVEMENT_MEDAL_ICON
        : escapeHtmlInline(item?.icon || ACHIEVEMENT_LOCKED_ICON);
      const points = Number(item?.points) || 0;
      const pointsLabel = points ? `+${points} XP` : "";
      const statusLabel = earned ? "Unlocked" : "Locked";
      return `
        <div class="achievement-item${earned ? " is-earned" : " is-locked"}">
          <div class="achievement-icon">${icon}</div>
          <div class="achievement-text">
            <h4>${title}</h4>
            <p>${description}</p>
          </div>
          <div class="achievement-status">${statusLabel} ${pointsLabel}</div>
        </div>
      `;
    })
    .join("");
};

const loadAchievementsLeaderboard = async () => {
  if (!leaderboardModalList) {
    return;
  }
  leaderboardModalList.textContent = "Loading...";
  const escapeHtmlInline = (value) =>
    String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  try {
    await ensureApiBaseUrl();
    const authState = getAuthState();
    const levelParam = authState && authState.level ? String(authState.level).trim() : "";
    const url = new URL(`${API_BASE_URL}/api/leaderboard/achievements`);
    url.searchParams.set("limit", "10");
    if (levelParam) {
      url.searchParams.set("level", levelParam);
    }
    const response = await fetch(url.toString());
    if (!response.ok) {
      leaderboardModalList.textContent = "Failed to load leaderboard.";
      return;
    }
    const payload = await response.json();
    const items = Array.isArray(payload.items) ? payload.items : [];
    if (!items.length) {
      leaderboardModalList.textContent = "No leaderboard data yet.";
      return;
    }
    const authUsername = authState && authState.username ? String(authState.username).toLowerCase() : "";
    leaderboardModalList.innerHTML = items
      .map((item) => {
        const rank = Number(item.rank) || 0;
        const username = String(item.username || "").trim();
        const nameRaw = item.full_name || username || "User";
        const name = escapeHtmlInline(nameRaw);
        const levelLabel = formatLevelLabel(item.level || "");
        const meta = levelLabel ? `<div class="leaderboard-meta">${escapeHtmlInline(levelLabel)}</div>` : "";
        const points = Number(item.total_points) || 0;
        const isYou = authUsername && username.toLowerCase() === authUsername;
        const medal =
          rank === 1 ? "&#x1F947;" : rank === 2 ? "&#x1F948;" : rank === 3 ? "&#x1F949;" : "";
        const rankClass = rank === 1 ? " is-top-1" : rank === 2 ? " is-top-2" : rank === 3 ? " is-top-3" : "";
        const medalMarkup = medal ? `<span class="leaderboard-medal" aria-hidden="true">${medal}</span>` : "";
        const rankLabel = rank ? `#${rank}` : "";
        return `
          <div class="leaderboard-row${isYou ? " is-you" : ""}${rankClass}" role="button" tabindex="0" data-username="${escapeHtmlInline(username)}">
            <div class="leaderboard-rank">
              <span class="leaderboard-rank-text">${rankLabel}</span>
              ${medalMarkup}
            </div>
            <div class="leaderboard-name">
              <div class="leaderboard-name-text">${name}</div>
              ${meta}
            </div>
            <div class="leaderboard-points">${points} XP</div>
          </div>
        `;
      })
      .join("");
  } catch (error) {
    leaderboardModalList.textContent = "Failed to load leaderboard.";
  }
};

const openAchievementsModal = () => {
  if (!achievementsModal) {
    return;
  }
  renderAchievementsModal(profileAchievementsCache);
  updateAchievementsModalProgress(profileAchievementsCache);
  achievementsModal.classList.add("is-open");
  achievementsModal.setAttribute("aria-hidden", "false");
  syncModalBodyScroll();
};

const openLeaderboardModal = () => {
  if (!leaderboardModal) {
    return;
  }
  closeAchievementsModal();
  loadAchievementsLeaderboard();
  leaderboardModal.classList.add("is-open");
  leaderboardModal.setAttribute("aria-hidden", "false");
  syncModalBodyScroll();
};

const buildProfileMentorContactIcons = (mentor) => {
  const phoneRaw = String(mentor && mentor.phone ? mentor.phone : "").trim();
  const phoneClean = phoneRaw.replace(/[^\d+]/g, "");
  const tgRaw = String((mentor && (mentor.telegram_username || mentor.telegram)) || "").trim();
  const tgClean = tgRaw.replace(/^@/, "");
  const igRaw = String((mentor && (mentor.instagram_username || mentor.instagram)) || "").trim();
  const igClean = igRaw.replace(/^@/, "");
  const icons = [];
  if (tgClean) {
    icons.push({
      href: `https://t.me/${encodeURIComponent(tgClean)}`,
      iconSrc: "assets/images/icons8-telegram-96.png",
      iconAlt: "Telegram",
      iconClass: "profile-support-icon-img",
    });
  }
  if (igClean) {
    icons.push({
      href: `https://www.instagram.com/${encodeURIComponent(igClean)}`,
      iconSrc: "assets/images/icons8-instagram-94.png",
      iconAlt: "Instagram",
      iconClass: "profile-support-icon-img profile-support-icon-img--instagram",
    });
  }
  if (phoneClean) {
    icons.push({
      href: `tel:${phoneClean}`,
      iconSrc: "assets/images/phone.png",
      iconAlt: "Phone",
      iconClass: "profile-support-icon-img",
    });
  }
  return icons;
};

const ensureMentorSavedModal = () => {
  if (document.getElementById("mentor-saved-modal")) return;
  const html = `
    <div id="mentor-saved-modal" class="subscription-sent-modal" aria-hidden="true" style="z-index:1500">
      <div class="subscription-sent-card" role="dialog" aria-modal="true" aria-labelledby="mentor-saved-title">
        <div class="subscription-sent-icon" aria-hidden="true"></div>
        <h3 id="mentor-saved-title">Saved Successfully</h3>
        <p>Your information has been updated.</p>
        <button type="button" class="btn subscription-sent-back-btn" id="mentor-saved-close-btn">Close</button>
      </div>
    </div>`;
  document.body.insertAdjacentHTML("beforeend", html);
  const closeBtn = document.getElementById("mentor-saved-close-btn");
  const modal = document.getElementById("mentor-saved-modal");
  if (closeBtn && modal) {
    closeBtn.addEventListener("click", () => {
      modal.classList.remove("is-open");
      modal.setAttribute("aria-hidden", "true");
    });
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.classList.remove("is-open");
        modal.setAttribute("aria-hidden", "true");
      }
    });
  }
};

const openMentorSavedModal = () => {
  ensureMentorSavedModal();
  const modal = document.getElementById("mentor-saved-modal");
  if (!modal) return;
  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");
  if (typeof syncModalBodyScroll === "function") syncModalBodyScroll();
};

const resetMentorSelfSaveMessage = () => {
  if (!mentorSelfSaveMsg) return;
  mentorSelfSaveMsg.textContent = "";
  mentorSelfSaveMsg.classList.remove("is-error", "is-success");
};

const setMentorSelfSaveMessage = (text, tone) => {
  if (!mentorSelfSaveMsg) return;
  mentorSelfSaveMsg.textContent = text || "";
  mentorSelfSaveMsg.classList.remove("is-error", "is-success");
  if (tone === "error") mentorSelfSaveMsg.classList.add("is-error");
  if (tone === "success") mentorSelfSaveMsg.classList.add("is-success");
};

const saveMentorSelfProfile = async () => {
  const authState = getAuthState();
  if (!authState || String(authState.role || "").toLowerCase() !== "mentor" || !authState.username) {
    setMentorSelfSaveMessage("Mentor access required.", "error");
    return;
  }
  if (!mentorSelfName || !mentorSelfPhone || !mentorSelfTelegram || !mentorSelfInstagram || !mentorSelfInfo) {
    setMentorSelfSaveMessage("Edit form is missing.", "error");
    return;
  }
  resetMentorSelfSaveMessage();
  const payload = {
    username: String(authState.username).trim(),
    name: String(mentorSelfName.value || "").trim(),
    phone: String(mentorSelfPhone.value || "").trim(),
    telegram_username: String(mentorSelfTelegram.value || "").trim(),
    instagram_username: String(mentorSelfInstagram.value || "").trim(),
    info: String(mentorSelfInfo.value || "").trim(),
  };
  try {
    await ensureApiBaseUrl();
    const response = await fetch(`${API_BASE_URL}/api/mentor/self-update`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      let errorMessage = `Save failed (HTTP ${response.status}).`;
      try {
        const errPayload = await response.json();
        if (errPayload && errPayload.error) {
          errorMessage = String(errPayload.error);
        }
      } catch (error) {
        // ignore
      }
      setMentorSelfSaveMessage(errorMessage, "error");
      return;
    }
    openProfileModal();
    openMentorSavedModal();
  } catch (error) {
    setMentorSelfSaveMessage("Auth server is not running.", "error");
  }
};

const getAvatarInitials = (fullName, username) => {
  const name = String(fullName || "").trim();
  const parts = name.split(/\s+/).filter(Boolean);
  const letters = [];
  parts.slice(0, 2).forEach((part) => {
    const char = part[0] || "";
    if (char) letters.push(char.toUpperCase());
  });
  if (!letters.length) {
    const fallback = String(username || "").trim()[0] || "U";
    return fallback.toUpperCase();
  }
  return letters.join("");
};

const setProfileUserAvatar = (avatarUrl, fullName, username) => {
  const safeUrl = String(avatarUrl || "").trim();
  const initials = getAvatarInitials(fullName, username);
  if (profileUserAvatarFallback) {
    profileUserAvatarFallback.textContent = initials;
  }
  if (!profileUserAvatar) {
    return;
  }
  if (safeUrl) {
    const finalUrl = safeUrl.startsWith("http") ? safeUrl : `${API_BASE_URL}${safeUrl}`;
    profileUserAvatar.src = finalUrl;
    profileUserAvatar.hidden = false;
    if (profileUserAvatarFallback) {
      profileUserAvatarFallback.hidden = true;
    }
  } else {
    profileUserAvatar.src = "";
    profileUserAvatar.hidden = true;
    if (profileUserAvatarFallback) {
      profileUserAvatarFallback.hidden = false;
    }
  }
};

const openProfileModal = async (overrideUsername = "") => {
  if (!profileModal) {
    return;
  }
  const authState = getAuthState();
  if (!authState || !authState.username) {
    return;
  }
  const targetUsername = String(overrideUsername || authState.username).trim();
  const isSelf = !overrideUsername || targetUsername.toLowerCase() === String(authState.username).toLowerCase();
  const isMentorSelf = isSelf && String(authState.role || "").toLowerCase() === "mentor";

  if (profileTitle) {
    profileTitle.textContent = isSelf ? "Profile" : `Profile: ${targetUsername}`;
  }
  if (profileUpgradeBtn) {
    profileUpgradeBtn.hidden = !isSelf;
  }
  if (mentorSelfEdit) {
    mentorSelfEdit.hidden = !isMentorSelf;
  }
  if (profileMentorBlock) {
    profileMentorBlock.hidden = isMentorSelf;
  }
  if (profileMentorKicker) {
    profileMentorKicker.textContent = isSelf ? "Your Mentor" : "Mentor";
  }
  if (profileLevel) {
    const levelLabel = formatLevelLabel(isSelf ? authState.level || "" : "");
    profileLevel.textContent = levelLabel || "-";
  }
  if (profileMentorName) {
    profileMentorName.textContent = "Mentor: —";
  }
  if (profileMentorText) {
    profileMentorText.textContent = "Mentor info will appear here.";
  }
  if (profileMentorContact) {
    const actionsWrap = profileMentorContact.querySelector(".profile-mentor-contact-actions");
    if (actionsWrap) {
      actionsWrap.innerHTML = "";
      actionsWrap.hidden = true;
      actionsWrap.classList.remove("is-open");
    }
  }
  if (profileMentorContactBtn) {
    profileMentorContactBtn.disabled = true;
    profileMentorContactBtn.hidden = true;
    profileMentorContactBtn.setAttribute("aria-expanded", "false");
  }
  if (profileProgress) {
    profileProgress.textContent = "0%";
  }
  if (profileSubscriptionRemaining) {
    profileSubscriptionRemaining.textContent = "-";
  }
  if (profileAchievements) {
    profileAchievements.textContent = "-";
  }
  if (profileAchievementsProgress) {
    profileAchievementsProgress.textContent = "-";
  }
  profileAchievementsCache = [];
  if (profileLessonsCompleted) {
    profileLessonsCompleted.textContent = "-";
  }
  if (profileNextUnlock) {
    profileNextUnlock.textContent = "-";
  }
  if (profileUserKicker) {
    profileUserKicker.textContent = isSelf ? "You" : "User";
  }
  if (profileUserName) {
    const initialName = isSelf ? authState.fullName || authState.username : targetUsername;
    profileUserName.textContent = initialName || "-";
  }
  if (profileUserAvatarActions) {
    profileUserAvatarActions.hidden = !isSelf;
  }
  if (profileUserAvatarMsg) {
    profileUserAvatarMsg.textContent = "";
  }
  setProfileUserAvatar("", isSelf ? authState.fullName || "" : "", targetUsername);
  if (profilePublicStats) {
    profilePublicStats.hidden = isSelf;
    if (isSelf) {
      profilePublicStats.innerHTML = "";
    }
  }
  if (profileSelfStats) {
    profileSelfStats.hidden = !isSelf;
  }
  resetMentorSelfSaveMessage();
  profileModal.classList.add("is-open");
  profileModal.setAttribute("aria-hidden", "false");
  syncModalBodyScroll();
  try {
    await ensureApiBaseUrl();
    const response = await fetch(
      `${API_BASE_URL}/api/user/progress-summary?username=${encodeURIComponent(targetUsername)}`
    );
    if (!response.ok) {
      let serverError = "";
      try {
        const errPayload = await response.json();
        serverError = errPayload && errPayload.error ? String(errPayload.error) : "";
      } catch (error) {
        serverError = "";
      }
      if (profileMentorText) {
        profileMentorText.textContent = serverError
          ? `Failed to load profile: ${serverError}`
          : `Failed to load profile. (HTTP ${response.status})`;
      }
      return;
    }
    const payload = await response.json();
    const resolvedFullName = String(payload.full_name || (isSelf ? authState.fullName : "") || "").trim();
    const displayName = resolvedFullName || targetUsername;
    if (profileUserName) {
      profileUserName.textContent = displayName;
    }
    setProfileUserAvatar(payload.avatar_url || "", displayName, targetUsername);
    const levelLabel = formatLevelLabel(payload.level || (isSelf ? authState.level || "" : ""));
    if (profileLevel) {
      profileLevel.textContent = levelLabel || "-";
    }
    const averagePercent = Number(payload.average_percent || 0);
    const lessonsCount = Number(payload.lessons_count || 0);
    if (profileProgress) {
      profileProgress.textContent = lessonsCount > 0 ? `${Math.round(averagePercent)}%` : "0%";
    }
    if (profileSubscriptionRemaining) {
      const remainingDays = Number(payload.remaining_days || 0);
      const remainingHours = Number(payload.remaining_hours || 0);
      profileSubscriptionRemaining.textContent = `${remainingDays} days ${remainingHours} hours`;
    }
    const achievements = Array.isArray(payload.achievements) ? payload.achievements : [];
    renderProfileAchievementsSummary(achievements);
    if (!isSelf && profilePublicStats) {
      const earnedCount = achievements.filter((item) => item && item.earned).length;
      const totalCount = achievements.length;
      const achievementsPercent = totalCount ? Math.round((earnedCount / totalCount) * 100) : 0;
      const completed = Math.max(0, Number(payload.completed_lessons || 0));
      const totalLessons = Math.max(0, Number(payload.total_lessons || 0));
      const lessonsLabel = totalLessons > 0 ? `${Math.min(completed, totalLessons)} / ${totalLessons}` : `${completed}`;
      const progressLabel = lessonsCount > 0 ? `${Math.round(averagePercent)}%` : "0%";
      profilePublicStats.hidden = false;
      profilePublicStats.innerHTML = `
        <article class="profile-stat-card">
          <h4>Level</h4>
          <p>${escapeHtml(levelLabel || "-")}</p>
        </article>
        <article class="profile-stat-card">
          <h4>Lessons completed</h4>
          <p>${escapeHtml(lessonsLabel)}</p>
        </article>
        <article class="profile-stat-card">
          <h4>Average progress</h4>
          <p>${escapeHtml(progressLabel)}</p>
        </article>
        <article class="profile-stat-card">
          <h4>Achievements</h4>
          <p>${escapeHtml(`${achievementsPercent}% completed`)}</p>
        </article>
      `;
    }
    if (isSelf) {
      updateAchievementNotifications(authState.username, achievements, {
        notify: true,
        suppressIfNoCache: true,
      });
    }
    if (payload.mentor) {
      const mentor = payload.mentor || {};
      const mentorName = mentor.name ? `Mentor: ${mentor.name}` : "Mentor: —";
      if (profileMentorName) {
        profileMentorName.textContent = mentorName;
      }
      if (profileMentorText) {
        profileMentorText.textContent = mentor.info || "Mentor info will appear here.";
      }
      const icons = buildProfileMentorContactIcons(mentor);
      if (profileMentorContact) {
        const actionsWrap = profileMentorContact.querySelector(".profile-mentor-contact-actions");
        if (actionsWrap) {
          actionsWrap.innerHTML = "";
          actionsWrap.classList.toggle("is-open", icons.length > 0);
          actionsWrap.hidden = icons.length === 0;
          icons.forEach((item, index) => {
            const link = document.createElement("a");
            link.className = "profile-support-icon";
            link.href = item.href;
            link.target = "_blank";
            link.rel = "noopener";
            link.setAttribute("aria-label", item.iconAlt);
            link.style.setProperty("--i", String(index));
            const img = document.createElement("img");
            img.src = item.iconSrc;
            img.alt = item.iconAlt;
            img.className = item.iconClass;
            link.appendChild(img);
            actionsWrap.appendChild(link);
          });
        }
      }
      if (profileMentorContactBtn) {
        profileMentorContactBtn.hidden = icons.length === 0;
        profileMentorContactBtn.disabled = icons.length === 0;
        profileMentorContactBtn.setAttribute("aria-expanded", "false");
      }
      if (profileMentorAvatar && mentor.avatar_url) {
        const rawUrl = String(mentor.avatar_url || "").trim();
        const avatarUrl = rawUrl.startsWith("http") ? rawUrl : `${API_BASE_URL}${rawUrl}`;
        profileMentorAvatar.src = avatarUrl;
      }
    }
    if (mentorSelfEdit && !mentorSelfEdit.hidden) {
      const ownProfile = payload.own_mentor_profile || {};
      if (mentorSelfName) mentorSelfName.value = String(ownProfile.name || "").trim();
      if (mentorSelfPhone) mentorSelfPhone.value = String(ownProfile.phone || "").trim();
      if (mentorSelfTelegram) mentorSelfTelegram.value = String(ownProfile.telegram_username || "").trim();
      if (mentorSelfInstagram) mentorSelfInstagram.value = String(ownProfile.instagram_username || "").trim();
      if (mentorSelfInfo) mentorSelfInfo.value = String(ownProfile.info || "").trim();
      resetMentorSelfSaveMessage();
    }
    if (profileLessonsCompleted) {
      const completed = Number(payload.completed_lessons || 0);
      const total = Number(payload.total_lessons || 0);
      profileLessonsCompleted.textContent = total > 0 ? `${completed} / ${total}` : `${completed}`;
    }
    if (profileNextUnlock) {
      const nextUnlockAtRaw = String(payload.next_unlock_at || "").trim();
      let formatted = "";
      if (nextUnlockAtRaw) {
        const unlockAtMs = new Date(nextUnlockAtRaw).getTime();
        if (Number.isFinite(unlockAtMs)) {
          const diff = unlockAtMs - Date.now();
          formatted = diff > 0 ? formatUnlockCountdown(diff) : "Available now";
        }
      }
      if (!formatted) {
        const nextSeconds = Number(payload.next_unlock_seconds || 0);
        formatted = nextSeconds > 0 ? formatUnlockCountdown(nextSeconds * 1000) : "Available now";
      }
      profileNextUnlock.textContent = formatted;
    }
  } catch (error) {
    // Ignore profile load errors.
  }
};

const refreshAdminPanelBadge = async () => {
  if (!adminPanelBtn || !adminPanelBadge) {
    return;
  }
  const authState = getAuthState();
  if (!authState || authState.role !== "admin" || !authState.username) {
    adminPanelBadge.hidden = true;
    adminPanelBadge.textContent = "0";
    return;
  }
  try {
    const response = await adminFetchRaw(`${API_BASE_URL}/api/admin/overview`);
    if (!response.ok) {
      return;
    }
    const payload = await response.json();
    const pendingCount = Number((payload.stats && payload.stats.pending_enrollment_requests) || 0);
    const renewalsCount = Array.isArray(payload.renewal_requests) ? payload.renewal_requests.length : 0;
    const totalCount = pendingCount + renewalsCount;
    adminPanelBadge.textContent = totalCount > 99 ? "99+" : String(totalCount);
    adminPanelBadge.hidden = totalCount <= 0;
  } catch (error) {
    // Ignore badge refresh errors.
  }
};

let mentorHomeworkSummaryCache = { total_new: 0, students: [], by_student: {} };

const renderMentorHomeworkAlert = (summary) => {
  if (!mentorStudentsHomeworkAlert) {
    return;
  }
  // Mentors: keep Students modal clean (badge on the Students button is enough).
  mentorStudentsHomeworkAlert.hidden = true;
  mentorStudentsHomeworkAlert.innerHTML = "";
  return;
  const totalNew = Number(summary && summary.total_new ? summary.total_new : 0) || 0;
  const students = Array.isArray(summary && summary.students ? summary.students : []) ? summary.students : [];
  if (totalNew <= 0 || !students.length) {
    mentorStudentsHomeworkAlert.hidden = true;
    mentorStudentsHomeworkAlert.innerHTML = "";
    return;
  }
  const top = students
    .filter((item) => Number(item.new_count || 0) > 0)
    .slice(0, 6)
    .map((item) => {
      const username = String(item.username || "").trim();
      const name = String(item.full_name || "").trim();
      const count = Number(item.new_count || 0) || 0;
      const label = name ? `${name} (${username})` : username;
      return `<li>${escapeHtml(label || "Student")}: ${escapeHtml(count)}</li>`;
    })
    .join("");
  mentorStudentsHomeworkAlert.innerHTML = `
    <p class="mentor-homework-alert-title">New homework</p>
    <ul class="mentor-homework-alert-list">${top || ""}</ul>
  `;
  mentorStudentsHomeworkAlert.hidden = false;
};

const refreshMentorHomeworkSummary = async () => {
  const authState = getAuthState();
  if (!authState || authState.role !== "mentor" || !authState.username) {
    mentorHomeworkSummaryCache = { total_new: 0, students: [], by_student: {} };
    if (mentorStudentsBadge) {
      mentorStudentsBadge.hidden = true;
      mentorStudentsBadge.textContent = "0";
    }
    if (mentorStudentsHomeworkAlert) {
      mentorStudentsHomeworkAlert.hidden = true;
      mentorStudentsHomeworkAlert.innerHTML = "";
    }
    return;
  }
  try {
    await ensureApiBaseUrl();
    const response = await fetch(
      `${API_BASE_URL}/api/mentor/homework/summary?username=${encodeURIComponent(authState.username)}`
    );
    if (!response.ok) {
      return;
    }
    const payload = await response.json().catch(() => ({}));
    const totalNew = Number(payload && payload.total_new ? payload.total_new : 0) || 0;
    const students = Array.isArray(payload && payload.students ? payload.students : []) ? payload.students : [];
    const byStudent = {};
    students.forEach((item) => {
      const username = String(item && item.username ? item.username : "").trim().toLowerCase();
      if (!username) return;
      byStudent[username] = Number(item.new_count || 0) || 0;
    });
    mentorHomeworkSummaryCache = { total_new: totalNew, students, by_student: byStudent };

    if (mentorStudentsBadge) {
      mentorStudentsBadge.textContent = totalNew > 99 ? "99+" : String(totalNew);
      mentorStudentsBadge.hidden = totalNew <= 0;
    }
    // Students modal alert is intentionally disabled (badge is enough).
  } catch (error) {
    // Ignore badge refresh errors.
  }
};

let studentNotificationsModal = null;
let studentNotificationsCloseBtn = null;
let studentNotificationsNote = null;
let studentNotificationsList = null;

const ensureStudentNotificationsUi = () => {
  if (studentNotificationsModal) {
    return;
  }
  const overlay = document.createElement("div");
  overlay.id = "student-notifications-modal";
  overlay.className = "profile-modal student-notifications-modal";
  overlay.setAttribute("aria-hidden", "true");
  overlay.innerHTML = `
    <div class="profile-modal-card student-notifications-card">
      <div class="profile-topbar">
        <h3>Notifications</h3>
        <button type="button" id="student-notifications-close" class="btn profile-close-btn">Close</button>
      </div>
      <p id="student-notifications-note" class="admin-delete-note">Loading...</p>
      <div id="student-notifications-list" class="student-notifications-list"></div>
    </div>
  `;
  document.body.appendChild(overlay);
  studentNotificationsModal = overlay;
  studentNotificationsCloseBtn = overlay.querySelector("#student-notifications-close");
  studentNotificationsNote = overlay.querySelector("#student-notifications-note");
  studentNotificationsList = overlay.querySelector("#student-notifications-list");

  if (studentNotificationsCloseBtn) {
    studentNotificationsCloseBtn.addEventListener("click", () => {
      closeStudentNotificationsModal();
    });
  }
  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) {
      closeStudentNotificationsModal();
    }
  });
};

const closeStudentNotificationsModal = () => {
  if (!studentNotificationsModal) return;
  studentNotificationsModal.classList.remove("is-open");
  studentNotificationsModal.setAttribute("aria-hidden", "true");
  if (studentNotificationsNote) {
    studentNotificationsNote.textContent = "";
  }
  if (studentNotificationsList) {
    studentNotificationsList.innerHTML = "";
  }
  syncModalBodyScroll();
};

const refreshStudentNotificationsSummary = async () => {
  if (!studentNotificationsBtn || !studentNotificationsBadge) {
    return;
  }
  const authState = getAuthState();
  const isStudent = !!(authState && authState.role === "student" && authState.username);
  studentNotificationsBtn.hidden = !isStudent;
  if (!isStudent) {
    studentNotificationsBadge.hidden = true;
    studentNotificationsBadge.textContent = "0";
    return;
  }
  try {
    await ensureApiBaseUrl();
    const response = await fetch(
      `${API_BASE_URL}/api/student/notifications/summary?username=${encodeURIComponent(String(authState.username).trim())}`
    );
    if (!response.ok) {
      return;
    }
    const payload = await response.json().catch(() => ({}));
    const unread = Number(payload && payload.unread_count ? payload.unread_count : 0) || 0;
    studentNotificationsBadge.textContent = unread > 99 ? "99+" : String(unread);
    studentNotificationsBadge.hidden = unread <= 0;
  } catch (error) {
    // ignore
  }
};

const getStudentCommentSeenStorageKey = (username) => {
  const safeUser = String(username || "").trim().toLowerCase();
  return safeUser ? `student_comment_seen_v1:${safeUser}` : "student_comment_seen_v1:unknown";
};

const readStudentCommentSeenMap = (username) => {
  try {
    const raw = localStorage.getItem(getStudentCommentSeenStorageKey(username));
    const parsed = raw ? JSON.parse(raw) : null;
    if (!parsed || typeof parsed !== "object") return {};
    return parsed;
  } catch (error) {
    return {};
  }
};

const writeStudentCommentSeenMap = (username, nextMap) => {
  try {
    localStorage.setItem(getStudentCommentSeenStorageKey(username), JSON.stringify(nextMap || {}));
  } catch (error) {
    // ignore
  }
};

const isStudentCommentSeen = (username, submissionId) => {
  const id = Number(submissionId || 0) || 0;
  if (id <= 0) return false;
  const map = readStudentCommentSeenMap(username);
  return !!map[String(id)];
};

const markStudentCommentSeen = (username, submissionId) => {
  const id = Number(submissionId || 0) || 0;
  if (id <= 0) return;
  const map = readStudentCommentSeenMap(username);
  if (map[String(id)]) return;
  map[String(id)] = true;
  writeStudentCommentSeenMap(username, map);
};

const decrementStudentNotificationsBadge = (by = 1) => {
  if (!studentNotificationsBadge) return;
  const delta = Math.max(0, Number(by || 0) || 0);
  if (!delta) return;
  const currentText = String(studentNotificationsBadge.textContent || "").trim();
  const currentNum = Number(currentText);
  if (!Number.isFinite(currentNum)) {
    refreshStudentNotificationsSummary();
    return;
  }
  const nextNum = Math.max(0, Math.round(currentNum) - delta);
  studentNotificationsBadge.textContent = String(nextNum);
  studentNotificationsBadge.hidden = nextNum <= 0;
};

const openStudentNotificationsModal = async () => {
  ensureStudentNotificationsUi();
  if (!studentNotificationsModal || !studentNotificationsNote || !studentNotificationsList) return;
  const authState = getAuthState();
  if (!authState || authState.role !== "student" || !authState.username) {
    return;
  }
  studentNotificationsModal.classList.add("is-open");
  studentNotificationsModal.setAttribute("aria-hidden", "false");
  syncModalBodyScroll();
  studentNotificationsNote.textContent = "Loading...";
  studentNotificationsList.innerHTML = "";

  try {
    await ensureApiBaseUrl();
    const response = await fetch(
      `${API_BASE_URL}/api/student/notifications/homework-reviews?username=${encodeURIComponent(
        String(authState.username).trim()
      )}&limit=80`
    );
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      studentNotificationsNote.textContent = payload && payload.error ? String(payload.error) : "Failed to load notifications.";
      return;
    }
    const items = Array.isArray(payload.items) ? payload.items : [];
    studentNotificationsNote.textContent = items.length ? `Notifications: ${items.length}` : "No notifications yet.";

    const unreadIds = [];
    items.forEach((item) => {
      const submissionId = Number(item.submission_id || 0) || 0;
      const course = String(item.course || "").trim().toLowerCase();
      const lessonNumber = Number(item.lesson_number || 0) || 0;
      const score = Number(item.score || 0) || 0;
      const safeScore = Math.max(0, Math.min(5, Math.round(score)));
      const reviewedAt = String(item.reviewed_at || "").trim();
      const reviewer = String(item.reviewer_username || "").trim();
      const comment = String(item.feedback_text || "").trim();
      const hasComment = !!comment;
      const isCommentSeen = hasComment ? isStudentCommentSeen(authState.username, submissionId) : true;
      const showCommentBadge = hasComment && !isCommentSeen;
      const isUnread = !!item.is_unread;
      if (isUnread && submissionId > 0) {
        unreadIds.push(submissionId);
      }

      const title = `Lesson ${lessonNumber}${course ? ` (${course.toUpperCase()})` : ""}`;
      const metaParts = [];
      if (reviewer) metaParts.push(`Mentor: ${reviewer}`);
      if (reviewedAt) {
        const parseUtcDate = (value) => {
          const raw = String(value || "").trim();
          if (!raw) return null;
          const hasTimezone = /[zZ]|[+-]\\d{2}:\\d{2}$/.test(raw);
          const candidate = hasTimezone ? raw : `${raw}Z`;
          const date = new Date(candidate);
          return Number.isNaN(date.getTime()) ? null : date;
        };
        const formatShortTimestamp = (value) => {
          const date = parseUtcDate(value);
          if (!date) return value || "-";
          const pad = (n) => String(n).padStart(2, "0");
          return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(
            date.getHours()
          )}:${pad(date.getMinutes())}`;
        };
        metaParts.push(formatShortTimestamp(reviewedAt));
      }

      const downloadUrl = `${API_BASE_URL}/api/student/homework/download?username=${encodeURIComponent(
        String(authState.username).trim()
      )}&submission_id=${encodeURIComponent(String(submissionId))}`;

      const card = document.createElement("article");
      card.className = "student-notifications-item";
      card.innerHTML = `
        <div class="student-notifications-item-head">
          <h4 class="student-notifications-item-title">${escapeHtml(title)}</h4>
          ${
            safeScore > 0
              ? `<span class="student-notifications-score is-score-${escapeHtml(safeScore)}">${escapeHtml(safeScore)}</span>`
              : ""
          }
        </div>
        <p class="student-notifications-item-meta">${escapeHtml(metaParts.join(" • ") || "-")}</p>
        <div class="student-notifications-item-actions">
          ${
            hasComment
              ? `<button type="button" class="btn student-notifications-comment-btn">
                  Comment
                  ${showCommentBadge ? `<span class="admin-requests-badge">1</span>` : ""}
                </button>`
              : `<button type="button" class="btn student-notifications-comment-btn is-disabled" disabled>Comment</button>`
          }
          <a class="btn student-notifications-homework-btn" href="${escapeHtml(downloadUrl)}">Your Homework</a>
        </div>
        ${hasComment ? `<p class="student-notifications-comment" hidden>${escapeHtml(comment)}</p>` : ""}
      `;
      const commentBtn = card.querySelector(".student-notifications-comment-btn");
      const commentEl = card.querySelector(".student-notifications-comment");
      if (commentBtn && commentEl && hasComment) {
        commentBtn.addEventListener("click", () => {
          markStudentCommentSeen(authState.username, submissionId);
          const badge = commentBtn.querySelector(".admin-requests-badge");
          if (badge) {
            badge.remove();
          }
          const hidden = commentEl.hasAttribute("hidden");
          if (hidden) {
            commentEl.removeAttribute("hidden");
          } else {
            commentEl.setAttribute("hidden", "");
          }
        });
      }
      studentNotificationsList.appendChild(card);
    });

    if (unreadIds.length) {
      decrementStudentNotificationsBadge(unreadIds.length);
      fetch(`${API_BASE_URL}/api/student/notifications/mark-seen`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: String(authState.username).trim(), submission_ids: unreadIds }),
      }).catch(() => {});
      window.setTimeout(() => refreshStudentNotificationsSummary(), 350);
    }
  } catch (error) {
    studentNotificationsNote.textContent = "Auth server is not running.";
  }
};

const refreshAuthRole = async () => {
  const authState = getAuthState();
  if (!authState || !authState.username) {
    return;
  }

  try {
    await ensureApiBaseUrl();
    const response = await fetch(`${API_BASE_URL}/api/user/role?username=${encodeURIComponent(authState.username)}`);
    if (!response.ok) {
      return;
    }
    const payload = await response.json();
    const nextRole = payload.role || authState.role || "student";
    const nextLevel = payload.level || authState.level || "";
    const nextFullName = payload.full_name || authState.fullName || "";
    if (nextRole !== authState.role || nextLevel !== authState.level || nextFullName !== (authState.fullName || "")) {
      setAuthState({
        id: authState.id || null,
        username: authState.username,
        fullName: nextFullName,
        role: nextRole,
        level: nextLevel,
        sessionToken: authState.sessionToken || "",
      });
    }
	    updateLoginButton();
	    refreshAdminPanelBadge();
	    refreshMentorHomeworkSummary();
	    refreshStudentNotificationsSummary();
	    applyCourseLevelLocks();
	    applyLessonAccessLocks();
	    try {
	      initAdminLessonsEditing();
    } catch (error) {
      // ignore
    }
    try {
      initAdminSubscriptionsEditing();
    } catch (error) {
      // ignore
    }
    syncLessonsPageProgressFromServer();
  } catch (error) {
    // Ignore role sync errors and keep current local state.
  }
};

const closeLoginModal = () => {
  if (!loginModal) {
    return;
  }

  loginModal.classList.remove("is-open");
  loginModal.setAttribute("aria-hidden", "true");
  if (loginError) {
    loginError.textContent = "";
  }
  if (loginPassword) {
    loginPassword.type = "password";
  }
  if (loginShowPassword) {
    loginShowPassword.checked = false;
  }
  if (loginConsentCheckbox) {
    loginConsentCheckbox.checked = false;
  }
  syncConsentButtons();
  syncModalBodyScroll();
};

const openLoginModal = () => {
  if (!loginModal) {
    return;
  }
  ensureLegalUi();

  loginModal.classList.add("is-open");
  loginModal.setAttribute("aria-hidden", "false");
  if (loginUsername) {
    loginUsername.focus();
  }
  syncConsentButtons();
  syncModalBodyScroll();
};

const closeUpgradeModal = () => {
  if (!upgradeModal) {
    return;
  }
  upgradeModal.classList.remove("is-open");
  upgradeModal.setAttribute("aria-hidden", "true");
  syncModalBodyScroll();
};

const openUpgradeModal = () => {
  if (!upgradeModal) {
    return;
  }
  upgradeModal.classList.add("is-open");
  upgradeModal.setAttribute("aria-hidden", "false");
  syncModalBodyScroll();
};

const handleRenewQuery = () => {
  if (!upgradeModal) {
    return;
  }
  const params = new URLSearchParams(window.location.search);
  const renewLevel = String(params.get("renew") || "").trim().toLowerCase();
  if (!renewLevel) {
    return;
  }
  openUpgradeModal();
};

const closeResultsModal = () => {
  if (!resultsModal) {
    return;
  }
  resultsModal.classList.remove("is-open");
  resultsModal.setAttribute("aria-hidden", "true");
  syncModalBodyScroll();
};

const openResultsModal = () => {
  if (!resultsModal) {
    return;
  }
  resultsModal.classList.add("is-open");
  resultsModal.setAttribute("aria-hidden", "false");
  syncModalBodyScroll();
};

const closeTermsModal = () => {
  if (!termsModal) {
    return;
  }
  termsModal.classList.remove("is-open");
  termsModal.setAttribute("aria-hidden", "true");
  syncModalBodyScroll();
};

const openTermsModal = () => {
  if (!termsModal) {
    return;
  }
  termsModal.classList.add("is-open");
  termsModal.setAttribute("aria-hidden", "false");
  syncModalBodyScroll();
};

const closePrivacyModal = () => {
  if (!privacyModal) {
    return;
  }
  privacyModal.classList.remove("is-open");
  privacyModal.setAttribute("aria-hidden", "true");
  syncModalBodyScroll();
};

const openPrivacyModal = () => {
  if (!privacyModal) {
    return;
  }
  privacyModal.classList.add("is-open");
  privacyModal.setAttribute("aria-hidden", "false");
  syncModalBodyScroll();
};

let selectedEnrollPlan = { level: "", price: "" };

const syncEnrollScheduleVisibility = () => {
  const isExpress = /express/i.test(String(selectedEnrollPlan.level || ""));
  if (enrollScheduleWrap) {
    enrollScheduleWrap.hidden = isExpress;
  }
  if (enrollSchedule) {
    enrollSchedule.required = !isExpress;
    if (isExpress) {
      enrollSchedule.value = "";
    }
  }
};

const closeEnrollModal = () => {
  if (!enrollModal) {
    return;
  }
  enrollModal.classList.remove("is-open");
  enrollModal.setAttribute("aria-hidden", "true");
  if (enrollForm) {
    enrollForm.reset();
  }
  if (enrollMessage) {
    enrollMessage.textContent = "";
    enrollMessage.classList.remove("is-success");
  }
  selectedEnrollPlan = { level: "", price: "" };
  if (enrollConsentCheckbox) {
    enrollConsentCheckbox.checked = false;
  }
  isEnrollSubmitting = false;
  if (enrollSubmitBtn) {
    enrollSubmitBtn.disabled = !(enrollConsentCheckbox && enrollConsentCheckbox.checked);
    enrollSubmitBtn.textContent = "Send request";
  }
  syncConsentButtons();
  syncModalBodyScroll();
};

const openEnrollSuccessModal = () => {
  if (!enrollSuccessModal) {
    return;
  }
  enrollSuccessModal.classList.add("is-open");
  enrollSuccessModal.setAttribute("aria-hidden", "false");
  syncModalBodyScroll();
};

const closeEnrollSuccessModal = () => {
  if (!enrollSuccessModal) {
    return;
  }
  enrollSuccessModal.classList.remove("is-open");
  enrollSuccessModal.setAttribute("aria-hidden", "true");
  syncModalBodyScroll();
};

const openEnrollModal = (level, price) => {
  if (!enrollModal) {
    return;
  }
  ensureLegalUi();
  const priceMeta = parseExpressPriceLabel(price);
  const levelLabel = formatLevelLabel(level);
  const levelWithExpress = priceMeta.isExpress && levelLabel && !/express/i.test(levelLabel)
    ? `${levelLabel} Express`
    : levelLabel;
  selectedEnrollPlan = {
    level: levelWithExpress,
    price: priceMeta.price || String(price || "").trim(),
  };
  syncEnrollScheduleVisibility();
  if (enrollPlanNote) {
    enrollPlanNote.textContent = selectedEnrollPlan.level && selectedEnrollPlan.price
      ? `Selected plan: ${selectedEnrollPlan.level} - ${selectedEnrollPlan.price}`
      : "Selected plan";
  }
  if (enrollMessage) {
    enrollMessage.textContent = "";
    enrollMessage.classList.remove("is-success");
  }
  const authState = getAuthState();
  if (enrollFullName) {
    const stored = String((authState && authState.fullName) || "").trim();
    const parts = stored ? stored.split(/\s+/).filter(Boolean) : [];
    enrollFullName.value = parts.length > 0 ? parts[0] : stored;
    if (enrollSurname) {
      enrollSurname.value = parts.length > 1 ? parts.slice(1).join(" ") : "";
    }
  }
  if (enrollTelegram) {
    enrollTelegram.value = "";
  }
  if (enrollPhone) {
    enrollPhone.value = "";
  }
  if (enrollSchedule) {
    enrollSchedule.value = "";
  }
  syncEnrollScheduleVisibility();
  enrollModal.classList.add("is-open");
  enrollModal.setAttribute("aria-hidden", "false");
  if (enrollFullName) {
    enrollFullName.focus();
  }
  syncConsentButtons();
  syncModalBodyScroll();
};

if (loginBtn) {
  updateLoginButton();

  loginBtn.addEventListener("click", (event) => {
    event.preventDefault();
    const authUser = getAuthUser();

    if (authUser) {
      try {
        Object.keys(localStorage)
          .filter((key) => key && key.startsWith(ADMIN_EDIT_CODE_STORAGE_PREFIX))
          .forEach((key) => localStorage.removeItem(key));
      } catch (error) {
        // ignore
      }
      localStorage.removeItem(AUTH_STORAGE_KEY);
      localStorage.removeItem(LEGACY_AUTH_STORAGE_KEY);
      updateLoginButton();
      closeProfileModal();
      refreshAdminPanelBadge();
      applyCourseLevelLocks();
      return;
    }

    openLoginModal();
  });
}

if (profileBtn) {
  profileBtn.addEventListener("click", (event) => {
    event.preventDefault();
    openProfileModal();
  });
}

if (profileCloseBtn) {
  profileCloseBtn.addEventListener("click", () => {
    closeProfileModal();
  });
}

// Mentor contact actions are always visible when available.

const uploadProfileAvatar = async (file) => {
  const authState = getAuthState();
  if (!authState || !authState.username) {
    if (profileUserAvatarMsg) profileUserAvatarMsg.textContent = "Login required.";
    return;
  }
  if (!file) {
    return;
  }
  if (profileUserAvatarMsg) {
    profileUserAvatarMsg.textContent = "Uploading...";
  }
  const readFileAsDataUrl = (source) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result || "");
      reader.onerror = () => reject(new Error("file_read_failed"));
      reader.readAsDataURL(source);
    });
  try {
    await ensureApiBaseUrl();
    const fileData = await readFileAsDataUrl(file);
    const response = await fetch(`${API_BASE_URL}/api/user/avatar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: String(authState.username).trim(),
        file_name: file.name,
        file_data: fileData,
      }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const err = payload && payload.error ? String(payload.error) : `Upload failed (HTTP ${response.status}).`;
      if (profileUserAvatarMsg) profileUserAvatarMsg.textContent = err;
      return;
    }
    if (profileUserAvatarMsg) profileUserAvatarMsg.textContent = "Saved.";
    await openProfileModal();
  } catch (error) {
    if (profileUserAvatarMsg) profileUserAvatarMsg.textContent = "Auth server is not running.";
  }
};

if (profileUserAvatarBtn && profileUserAvatarInput) {
  profileUserAvatarBtn.addEventListener("click", () => {
    profileUserAvatarInput.click();
  });
}

if (profileUserAvatarInput) {
  profileUserAvatarInput.addEventListener("change", async () => {
    const file = profileUserAvatarInput.files && profileUserAvatarInput.files[0];
    if (!file) {
      if (profileUserAvatarMsg) profileUserAvatarMsg.textContent = "";
      return;
    }
    await uploadProfileAvatar(file);
    profileUserAvatarInput.value = "";
  });
}

if (mentorSelfSave) {
  mentorSelfSave.addEventListener("click", () => {
    saveMentorSelfProfile();
  });
}

if (mentorStudentsBtn) {
  mentorStudentsBtn.addEventListener("click", (event) => {
    if (event) {
      event.preventDefault();
    }
    openMentorStudentsModal();
  });
}

if (studentNotificationsBtn) {
  studentNotificationsBtn.addEventListener("click", (event) => {
    if (event) {
      event.preventDefault();
    }
    openStudentNotificationsModal();
  });
}
if (mentorStudentsCloseBtn) {
  mentorStudentsCloseBtn.addEventListener("click", () => {
    closeMentorStudentsModal();
  });
}
if (mentorStudentCloseBtn) {
  mentorStudentCloseBtn.addEventListener("click", () => {
    closeMentorStudentModal();
  });
}
if (mentorViewProgressBtn) {
  mentorViewProgressBtn.addEventListener("click", (event) => {
    if (event) {
      event.preventDefault();
    }
    const username = String(mentorViewProgressBtn.dataset.student || "").trim();
    closeMentorStudentModal();
    openMentorProgressModal(username);
  });
}
if (mentorHomeworkBtn) {
  mentorHomeworkBtn.addEventListener("click", (event) => {
    if (event) {
      event.preventDefault();
    }
    const username = String(mentorHomeworkBtn.dataset.student || "").trim();
    closeMentorStudentModal();
    openMentorHomeworkModal(username);
  });
}
if (mentorProgressCloseBtn) {
  mentorProgressCloseBtn.addEventListener("click", () => {
    closeMentorProgressModal();
  });
}
if (mentorHomeworkCloseBtn) {
  mentorHomeworkCloseBtn.addEventListener("click", () => {
    closeMentorHomeworkModal();
  });
}
if (mentorStudentsModal) {
  mentorStudentsModal.addEventListener("click", (event) => {
    if (event.target === mentorStudentsModal) {
      closeMentorStudentsModal();
    }
  });
}
if (mentorStudentModal) {
  mentorStudentModal.addEventListener("click", (event) => {
    if (event.target === mentorStudentModal) {
      closeMentorStudentModal();
    }
  });
}
if (mentorProgressModal) {
  mentorProgressModal.addEventListener("click", (event) => {
    if (event.target === mentorProgressModal) {
      closeMentorProgressModal();
    }
  });
}
if (mentorHomeworkModal) {
  mentorHomeworkModal.addEventListener("click", (event) => {
    if (event.target === mentorHomeworkModal) {
      closeMentorHomeworkModal();
    }
  });
}
if (mentorHomeworkLessons) {
  mentorHomeworkLessons.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const checkedBtn = target.closest(".mentor-homework-checked-btn");
    if (checkedBtn instanceof HTMLButtonElement) {
      event.preventDefault();
      openMentorHomeworkReviewModal({
        submissionId: Number(checkedBtn.dataset.submissionId || 0) || 0,
        student: String(checkedBtn.dataset.student || "").trim(),
        course: String(checkedBtn.dataset.course || "").trim(),
        lessonNumber: Number(checkedBtn.dataset.lessonNumber || 0) || 0,
        lessonTitle: String(checkedBtn.dataset.lessonTitle || "").trim(),
        latestAt: String(checkedBtn.dataset.latestAt || "").trim(),
      });
      return;
    }
  });
}

if (mentorHomeworkReviewCancelBtn) {
  mentorHomeworkReviewCancelBtn.addEventListener("click", () => {
    closeMentorHomeworkReviewModal();
  });
}

if (mentorHomeworkReviewSaveBtn) {
  mentorHomeworkReviewSaveBtn.addEventListener("click", () => {
    saveMentorHomeworkReview();
  });
}

if (mentorHomeworkReviewModal) {
  mentorHomeworkReviewModal.addEventListener("click", (event) => {
    if (event.target === mentorHomeworkReviewModal) {
      closeMentorHomeworkReviewModal();
    }
  });
}
if (mentorStudentsGrid) {
  mentorStudentsGrid.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }
    const btn = target.closest(".mentor-students-view-more");
    if (!btn) {
      return;
    }
    const username = btn.getAttribute("data-student") || "";
    closeMentorStudentsModal();
    openMentorStudentDetails(username);
  });
}

if (profileUpgradeBtn) {
  profileUpgradeBtn.addEventListener("click", () => {
    closeProfileModal();
    openUpgradeModal();
  });
}

if (profileAchievementsBtn) {
  profileAchievementsBtn.addEventListener("click", () => {
    openAchievementsModal();
  });
}

if (achievementsLeaderboardBtn) {
  achievementsLeaderboardBtn.addEventListener("click", () => {
    openLeaderboardModal();
  });
}

if (achievementsCloseBtn) {
  achievementsCloseBtn.addEventListener("click", () => {
    closeAchievementsModal();
  });
}

if (achievementsModal) {
  achievementsModal.addEventListener("click", (event) => {
    if (event.target === achievementsModal) {
      closeAchievementsModal();
    }
  });
}

if (leaderboardCloseBtn) {
  leaderboardCloseBtn.addEventListener("click", () => {
    closeLeaderboardModal();
  });
}

if (leaderboardModal) {
  leaderboardModal.addEventListener("click", (event) => {
    if (event.target === leaderboardModal) {
      closeLeaderboardModal();
    }
  });
}

if (leaderboardModalList) {
  const openLeaderboardUser = (row) => {
    if (!row) return;
    const username = String(row.getAttribute("data-username") || "").trim();
    if (!username) return;
    closeLeaderboardModal();
    openProfileModal(username);
  };
  leaderboardModalList.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const row = target.closest(".leaderboard-row");
    openLeaderboardUser(row);
  });
  leaderboardModalList.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const row = target.closest(".leaderboard-row");
    if (!row) return;
    event.preventDefault();
    openLeaderboardUser(row);
  });
}

if (resultsTabs.length) {
  resultsTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const targetId = tab.dataset.scrollTarget;
      const target = targetId ? document.getElementById(targetId) : null;
      if (!target) {
        return;
      }
      const targetTop = target.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({
        top: Math.max(0, targetTop - 20),
        behavior: "smooth",
      });
      resultsTabs.forEach((item) => item.classList.toggle("is-active", item === tab));
    });
  });
}

const resultsMobileMasonryEls = document.querySelectorAll(".results-mobile-masonry[data-section]");
if (resultsMobileMasonryEls.length) {
  const resultsMasonryMedia = window.matchMedia("(max-width: 640px)");
  let masonryRelayoutTimer = 0;

  const clearMasonry = (masonryEl) => {
    masonryEl.innerHTML = "";
    masonryEl.classList.remove("is-active");
  };

  const relayoutMasonry = (masonryEl) => {
    if (!masonryEl || !masonryEl.classList.contains("is-active")) {
      return;
    }
    const styles = window.getComputedStyle(masonryEl);
    const rowHeight = Number.parseFloat(styles.getPropertyValue("grid-auto-rows")) || 14;
    const rowGap = Number.parseFloat(styles.getPropertyValue("row-gap")) || 0;

    const items = masonryEl.querySelectorAll(".results-masonry-item");
    items.forEach((item) => {
      const child = item.firstElementChild;
      if (!child) {
        return;
      }
      const rect = child.getBoundingClientRect();
      const span = Math.max(1, Math.ceil((rect.height + rowGap) / (rowHeight + rowGap)));
      item.style.setProperty("--span", String(span));
    });
  };

  const scheduleRelayout = (masonryEl) => {
    if (masonryRelayoutTimer) {
      window.clearTimeout(masonryRelayoutTimer);
    }
    masonryRelayoutTimer = window.setTimeout(() => {
      relayoutMasonry(masonryEl);
    }, 40);
  };

	  const buildMasonry = () => {
	    if (!resultsMasonryMedia.matches) {
	      resultsMobileMasonryEls.forEach(clearMasonry);
	      return;
	    }

    resultsMobileMasonryEls.forEach((masonryEl) => {
      const tilesEl = masonryEl.nextElementSibling;
      if (!tilesEl || !tilesEl.classList.contains("results-modal-tiles")) {
        return;
      }

      masonryEl.innerHTML = "";

      const tiles = Array.from(tilesEl.querySelectorAll(".results-modal-tile"));
      tiles.forEach((tile, index) => {
        const nameText = (tile.querySelector(".results-modal-name")?.textContent || "").trim();
        const quoteText = (tile.querySelector(".results-modal-quote")?.textContent || "").trim();
        const imgEl = tile.querySelector(".results-modal-certificate img");

        const certCol = index % 2 === 0 ? 1 : 2;
        const quoteCol = certCol === 1 ? 2 : 1;

        const certItem = document.createElement("div");
        certItem.className = "results-masonry-item";
        certItem.style.setProperty("--col", String(certCol));
        certItem.style.setProperty("--span", "1");

        const certCard = document.createElement("div");
        certCard.className = "results-masonry-cert";

        const certMedia = document.createElement("div");
        certMedia.className = "results-masonry-cert-media";
        certMedia.style.aspectRatio = "3 / 4";

        if (imgEl && imgEl.getAttribute("src")) {
          const clonedImg = document.createElement("img");
          clonedImg.src = imgEl.getAttribute("src");
          clonedImg.alt = imgEl.getAttribute("alt") || "Certificate";
          clonedImg.loading = "lazy";
          clonedImg.decoding = "async";
          clonedImg.className = "js-certificate-viewer";
          clonedImg.addEventListener("load", () => {
            if (clonedImg.naturalWidth && clonedImg.naturalHeight) {
              certMedia.style.aspectRatio = `${clonedImg.naturalWidth} / ${clonedImg.naturalHeight}`;
            }
            scheduleRelayout(masonryEl);
          });
          certMedia.appendChild(clonedImg);
        } else {
          const placeholder = document.createElement("div");
          placeholder.className = "results-masonry-cert-placeholder";
          placeholder.textContent = "Certificate";
          certMedia.appendChild(placeholder);
        }

        const certName = document.createElement("div");
        certName.className = "results-masonry-cert-name";
        certName.textContent = nameText || "Student";

        certCard.appendChild(certMedia);
        certCard.appendChild(certName);
        certItem.appendChild(certCard);

        const quoteItem = document.createElement("div");
        quoteItem.className = "results-masonry-item";
        quoteItem.style.setProperty("--col", String(quoteCol));
        quoteItem.style.setProperty("--span", "1");

        const quoteCard = document.createElement("div");
        quoteCard.className = "results-masonry-quote";
        quoteCard.textContent = quoteText || "Beautiful quote";
        quoteItem.appendChild(quoteCard);

        masonryEl.appendChild(certItem);
        masonryEl.appendChild(quoteItem);
      });

      masonryEl.classList.add("is-active");
      scheduleRelayout(masonryEl);
    });
	  };

	  window.__ewmsBuildResultsMasonry = buildMasonry;

	  buildMasonry();
  if (typeof resultsMasonryMedia.addEventListener === "function") {
    resultsMasonryMedia.addEventListener("change", buildMasonry);
  } else if (typeof resultsMasonryMedia.addListener === "function") {
    resultsMasonryMedia.addListener(buildMasonry);
  }

  window.addEventListener("resize", () => {
    resultsMobileMasonryEls.forEach((masonryEl) => scheduleRelayout(masonryEl));
  });
}

const certViewerEl = document.getElementById("certificate-viewer");
const certViewerImg = document.getElementById("certificate-viewer-img");

const closeCertificateViewer = () => {
  if (!certViewerEl) {
    return;
  }
  certViewerEl.classList.remove("is-open");
  certViewerEl.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
  if (certViewerImg) {
    certViewerImg.removeAttribute("src");
  }
};

const openCertificateViewer = (src, alt) => {
  if (!certViewerEl || !certViewerImg || !src) {
    return;
  }
  certViewerImg.src = src;
  certViewerImg.alt = alt || "Certificate preview";
  certViewerEl.classList.add("is-open");
  certViewerEl.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
};

if (certViewerEl) {
  certViewerEl.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) {
      return;
    }
    if (target.matches("[data-cert-close]")) {
      closeCertificateViewer();
    }
  });
}

document.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLImageElement)) {
    return;
  }
  if (!target.classList.contains("js-certificate-viewer")) {
    return;
  }
  const isDesktopLike =
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (isDesktopLike) {
    return;
  }
  event.preventDefault();
  openCertificateViewer(target.currentSrc || target.src, target.alt);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && certViewerEl && certViewerEl.classList.contains("is-open")) {
    closeCertificateViewer();
  }
});

if (resultsStandaloneCertImages.length) {
  resultsStandaloneCertImages.forEach((img) => img.classList.add("js-certificate-viewer"));
}

if (profileModal) {
  profileModal.addEventListener("click", (event) => {
    if (event.target === profileModal) {
      closeProfileModal();
    }
  });
}

if (loginCancel) {
  loginCancel.addEventListener("click", () => {
    closeLoginModal();
  });
}

if (loginModal) {
  loginModal.addEventListener("click", (event) => {
    if (event.target === loginModal) {
      closeLoginModal();
    }
  });
}

if (knowledgeTestOpenBtn) {
  knowledgeTestOpenBtn.addEventListener("click", (event) => {
    event.preventDefault();
    openKnowledgeTestModal();
  });
}

if (knowledgeTestCloseBtn) {
  knowledgeTestCloseBtn.addEventListener("click", () => {
    knowledgeCloseRequested = true;
    closeKnowledgeTestModal(true);
    knowledgeCloseRequested = false;
  });
}

if (knowledgeTestModal) {
  knowledgeTestModal.addEventListener("click", (event) => {
    if (event.target === knowledgeTestModal) {
      return;
    }
  });
}

if (knowledgeTestModal) {
  const observer = new MutationObserver((records) => {
    records.forEach((record) => {
      if (record.type !== "attributes" || record.attributeName !== "class") {
        return;
      }
      const wasOpen = record.oldValue && record.oldValue.split(" ").includes("is-open");
      const isOpen = knowledgeTestModal.classList.contains("is-open");
      if (wasOpen && !isOpen) {
        logKnowledgeClose("mutation-removed-is-open");
      }
    });
  });
  observer.observe(knowledgeTestModal, { attributes: true, attributeOldValue: true });
}

if (knowledgeTestNextBtn) {
  knowledgeTestNextBtn.addEventListener("click", (event) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    if (knowledgeTestState.finished) {
      return;
    }
    const current = knowledgePlacementQuestions[knowledgeTestState.index];
    if (knowledgeTestState.selected === null) {
      return;
    }
    if (!knowledgeTestState.levelStats[current.level]) {
      knowledgeTestState.levelStats[current.level] = { correct: 0, total: 0 };
    }
    knowledgeTestState.levelStats[current.level].total += 1;
    if (knowledgeTestState.selected === current.correct) {
      knowledgeTestState.score += current.weight;
      knowledgeTestState.correctAnswers += 1;
      knowledgeTestState.levelStats[current.level].correct += 1;
    }
    const isLast = knowledgeTestState.index === knowledgePlacementQuestions.length - 1;
    if (isLast) {
      setTimeout(() => {
        showKnowledgeResult();
      }, 0);
      return;
    }
    knowledgeTestState.index += 1;
    knowledgeTestState.selected = null;
    renderKnowledgeQuestion();
  });
}

document.addEventListener(
  "submit",
  (event) => {
    if (!isKnowledgeModalVisible()) {
      return;
    }
    logKnowledgeClose("form-submit");
    event.preventDefault();
    event.stopPropagation();
  },
  true
);

document.addEventListener(
  "click",
  (event) => {
    if (!isKnowledgeModalVisible()) {
      return;
    }
    const link = event.target && event.target.closest ? event.target.closest("a[href]") : null;
    if (link) {
      logKnowledgeClose(`link-click:${link.getAttribute("href") || ""}`);
    }
  },
  true
);

window.addEventListener("beforeunload", () => {
  if (isKnowledgeModalVisible()) {
    logKnowledgeClose("beforeunload");
  }
});

if (knowledgeTestRestartBtn) {
  knowledgeTestRestartBtn.addEventListener("click", () => {
    startKnowledgeTest();
  });
}

if (upgradeOpenBtn) {
  upgradeOpenBtn.addEventListener("click", (event) => {
    event.preventDefault();
    openUpgradeModal();
  });
}

if (upgradeCloseBtn) {
  upgradeCloseBtn.addEventListener("click", () => {
    closeUpgradeModal();
  });
}

if (upgradeModal) {
  upgradeModal.addEventListener("click", (event) => {
    if (event.target === upgradeModal) {
      closeUpgradeModal();
    }
  });
}

if (resultsLearnBtn && resultsModal) {
  resultsLearnBtn.addEventListener("click", (event) => {
    event.preventDefault();
    openResultsModal();
  });
}

if (resultsModalCloseBtn) {
  resultsModalCloseBtn.addEventListener("click", () => {
    closeResultsModal();
  });
}

if (resultsModal) {
  resultsModal.addEventListener("click", (event) => {
    if (event.target === resultsModal) {
      closeResultsModal();
    }
  });
}

if (legalSignupLinks.length > 0) {
  legalSignupLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      closeLoginModal();
      closeEnrollModal();
      openUpgradeModal();
    });
  });
}

if (legalLoginLinks.length > 0) {
  legalLoginLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      closeEnrollModal();
      closeUpgradeModal();
      openLoginModal();
    });
  });
}

if (termsOpenLinks.length > 0) {
  termsOpenLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      openTermsModal();
    });
  });
}

if (privacyOpenLinks.length > 0) {
  privacyOpenLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      openPrivacyModal();
    });
  });
}

if (termsCloseBtn) {
  termsCloseBtn.addEventListener("click", () => {
    closeTermsModal();
  });
}

if (termsModal) {
  termsModal.addEventListener("click", (event) => {
    if (event.target === termsModal) {
      closeTermsModal();
    }
  });
}

if (privacyCloseBtn) {
  privacyCloseBtn.addEventListener("click", () => {
    closePrivacyModal();
  });
}

if (privacyModal) {
  privacyModal.addEventListener("click", (event) => {
    if (event.target === privacyModal) {
      closePrivacyModal();
    }
  });
}

document.addEventListener("click", (event) => {
  const upgradeLink = event.target.closest(".js-open-upgrade");
  if (upgradeLink) {
    event.preventDefault();
    closeLoginModal();
    closeEnrollModal();
    openUpgradeModal();
    return;
  }

  const loginLink = event.target.closest(".js-open-login");
  if (loginLink) {
    event.preventDefault();
    closeEnrollModal();
    closeUpgradeModal();
    openLoginModal();
    return;
  }

  const termsLink = event.target.closest('[data-legal-open="terms"]');
  if (termsLink) {
    event.preventDefault();
    openTermsModal();
    return;
  }

  const privacyLink = event.target.closest('[data-legal-open="privacy"]');
  if (privacyLink) {
    event.preventDefault();
    openPrivacyModal();
    return;
  }

  if (event.target && event.target.id === "terms-close-btn") {
    closeTermsModal();
    return;
  }

  if (event.target && event.target.id === "privacy-close-btn") {
    closePrivacyModal();
  }
});

document.addEventListener("change", (event) => {
  const target = event.target;
  if (!target) {
    return;
  }
  if (target.id === "login-consent" || target.id === "enroll-consent") {
    loginConsentCheckbox = document.getElementById("login-consent");
    enrollConsentCheckbox = document.getElementById("enroll-consent");
    syncConsentButtons();
  }
});

bindUpgradePlanPriceButtons();

if (enrollCloseBtn) {
  enrollCloseBtn.addEventListener("click", () => {
    closeEnrollModal();
  });
}

if (enrollCancelBtn) {
  enrollCancelBtn.addEventListener("click", () => {
    closeEnrollModal();
  });
}

if (enrollModal) {
  enrollModal.addEventListener("click", (event) => {
    if (event.target === enrollModal) {
      closeEnrollModal();
    }
  });
}

if (enrollSuccessMenuBtn) {
  enrollSuccessMenuBtn.addEventListener("click", () => {
    closeEnrollSuccessModal();
    window.location.href = "index.html";
  });
}

if (enrollSuccessModal) {
  enrollSuccessModal.addEventListener("click", (event) => {
    if (event.target === enrollSuccessModal) {
      closeEnrollSuccessModal();
    }
  });
}

if (enrollForm) {
  enrollForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (isEnrollSubmitting) {
      return;
    }
    if (!(enrollConsentCheckbox && enrollConsentCheckbox.checked)) {
      if (enrollMessage) {
        enrollMessage.textContent = "Please accept Terms and Privacy Policy.";
        enrollMessage.classList.remove("is-success");
      }
      syncConsentButtons();
      return;
    }
    const firstName = enrollFullName ? enrollFullName.value.trim() : "";
    const surname = enrollSurname ? enrollSurname.value.trim() : "";
    const fullName = `${firstName} ${surname}`.trim();
    const phone = enrollPhone ? enrollPhone.value.trim() : "";
    const rawTelegram = enrollTelegram ? enrollTelegram.value.trim() : "";
    const telegram = rawTelegram ? rawTelegram.replace(/^@/, "") : "";
    const schedule = enrollSchedule ? enrollSchedule.value.trim() : "";

    if (!firstName || !surname) {
      if (enrollMessage) {
        enrollMessage.textContent = "Name and surname are required.";
        enrollMessage.classList.remove("is-success");
      }
      return;
    }

    if (!phone || !/^\+?[0-9()\-\s]{7,20}$/.test(phone)) {
      if (enrollMessage) {
        enrollMessage.textContent = "Enter a valid phone number.";
        enrollMessage.classList.remove("is-success");
      }
      return;
    }

    if (telegram && !/^[A-Za-z0-9_]{4,32}$/.test(telegram)) {
      if (enrollMessage) {
        enrollMessage.textContent = "Telegram username format is invalid.";
        enrollMessage.classList.remove("is-success");
      }
      return;
    }

    if (!selectedEnrollPlan.level) {
      if (enrollMessage) {
        enrollMessage.textContent = "Plan is not selected.";
        enrollMessage.classList.remove("is-success");
      }
      return;
    }

    if (!schedule && !/express/i.test(String(selectedEnrollPlan.level || ""))) {
      if (enrollMessage) {
        enrollMessage.textContent = "Please select preferred schedule.";
        enrollMessage.classList.remove("is-success");
      }
      return;
    }

    const authState = getAuthState();
    try {
      isEnrollSubmitting = true;
      if (enrollSubmitBtn) {
        enrollSubmitBtn.disabled = true;
        enrollSubmitBtn.textContent = "Sending...";
      }
      const response = await fetch(`${API_BASE_URL}/api/enrollment-request`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          full_name: fullName,
          phone,
          telegram_username: telegram,
          level: selectedEnrollPlan.level.toLowerCase(),
          price_label: selectedEnrollPlan.price,
          lesson_schedule: schedule,
          username: authState && authState.username ? authState.username : "",
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        if (enrollMessage) {
          enrollMessage.textContent = payload.error || "Could not send request.";
          enrollMessage.classList.remove("is-success");
        }
        isEnrollSubmitting = false;
        if (enrollSubmitBtn) {
          enrollSubmitBtn.disabled = !(enrollConsentCheckbox && enrollConsentCheckbox.checked);
          enrollSubmitBtn.textContent = "Send request";
        }
        return;
      }

      closeEnrollModal();
      openEnrollSuccessModal();
    } catch (error) {
      if (enrollMessage) {
        enrollMessage.textContent = "Auth server is not running.";
        enrollMessage.classList.remove("is-success");
      }
      isEnrollSubmitting = false;
      if (enrollSubmitBtn) {
        enrollSubmitBtn.disabled = !(enrollConsentCheckbox && enrollConsentCheckbox.checked);
        enrollSubmitBtn.textContent = "Send request";
      }
    }
  });
}

if (loginForm) {
  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!(loginConsentCheckbox && loginConsentCheckbox.checked)) {
      if (loginError) {
        loginError.textContent = "Please accept Terms and Privacy Policy.";
      }
      syncConsentButtons();
      return;
    }

    const username = loginUsername ? loginUsername.value.trim() : "";
    const password = loginPassword ? loginPassword.value : "";

    try {
      await ensureApiBaseUrl();
      const response = await fetch(`${API_BASE_URL}/api/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        if (loginError) {
          loginError.textContent = "Incorrect login or password.";
        }
        return;
      }

      const data = await response.json();
      setAuthState({
        id: data.id || null,
        username: data.username || username,
        fullName: data.full_name || "",
        role: data.role || "student",
        level: data.level || "",
        sessionToken: data.session_token || "",
      });
	      closeLoginModal();
	      updateLoginButton();
	      refreshAdminPanelBadge();
	      refreshMentorHomeworkSummary();
	      refreshStudentNotificationsSummary();
	      applyCourseLevelLocks();
	      applyLessonCompletionBadges();
	      handleSubscriptionGate();
      loginForm.reset();
      syncConsentButtons();
    } catch (error) {
      if (loginError) {
        loginError.textContent = "Auth server is not running.";
      }
    }
  });
}

if (loginShowPassword && loginPassword) {
  loginShowPassword.addEventListener("change", () => {
    loginPassword.type = loginShowPassword.checked ? "text" : "password";
  });
}

const ensureTeamModals = () => {
  if (document.getElementById("team-modal")) {
    return;
  }
  const wrap = document.createElement("div");
  wrap.innerHTML = `
    <div id="team-modal" class="team-modal" aria-hidden="true">
      <div class="team-modal-card" role="dialog" aria-modal="true" aria-label="Team of Mr.Sam">
        <div class="team-modal-topbar">
          <div class="team-modal-topbar-spacer" aria-hidden="true"></div>
          <div class="team-modal-topbar-center">
            <h3 class="team-modal-title">Team of Mr.Sam</h3>
            <span id="team-modal-count" class="team-modal-count">0 members</span>
          </div>
          <div class="team-modal-topbar-right">
            <button type="button" id="team-modal-edit-btn" class="btn team-modal-edit-btn" hidden>Edit Info</button>
            <button type="button" id="team-modal-close" class="btn profile-close-btn">Close</button>
          </div>
        </div>
        <div class="team-modal-body">
          <div id="team-modal-list" class="about-team"></div>
        </div>
      </div>
    </div>

    <div id="team-member-modal" class="profile-modal team-member-modal" aria-hidden="true">
      <div class="profile-modal-card team-member-card">
        <div class="profile-topbar">
          <h3 id="team-member-title">Team member</h3>
          <button type="button" id="team-member-close" class="btn profile-close-btn">Close</button>
        </div>
        <div class="team-member-hero">
          <div class="team-member-avatar">
            <img id="team-member-avatar" src="" alt="Team member avatar" hidden>
            <div id="team-member-avatar-fallback" class="team-member-avatar-fallback" aria-hidden="true">T</div>
          </div>
          <div class="team-member-hero-text">
            <h4 id="team-member-header" class="team-member-header">-</h4>
            <p id="team-member-subheader" class="team-member-subheader">-</p>
          </div>
        </div>

        <div class="team-member-section">
          <h4 class="team-member-section-title">Achievements</h4>
          <ul id="team-member-achievements" class="team-member-achievements"></ul>
        </div>

        <div class="team-member-section">
          <p class="profile-support-label">Contact</p>
          <div id="team-member-contacts" class="profile-support-actions"></div>
        </div>
      </div>
    </div>

    <div id="admin-team-edit-code-modal" class="admin-lessons-modal" aria-hidden="true">
      <div class="admin-lessons-modal-card" role="dialog" aria-modal="true" aria-label="Edit team access">
        <div class="admin-lessons-modal-header">
          <h3 class="admin-lessons-modal-title">Edit Team</h3>
          <button type="button" id="admin-team-edit-code-close" class="admin-lessons-close">Close</button>
        </div>
        <p class="admin-lessons-hint">We sent a 6-digit PIN to your Telegram. You can also use your permanent code.</p>
        <input id="admin-team-edit-code-input" class="admin-lessons-input" type="text" inputmode="numeric" autocomplete="one-time-code" placeholder="Enter code">
        <p id="admin-team-edit-code-status" class="admin-lessons-status" aria-live="polite"></p>
        <div class="admin-lessons-actions">
          <button type="button" id="admin-team-edit-code-resend" class="btn admin-lessons-secondary">Resend</button>
          <button type="button" id="admin-team-edit-code-submit" class="btn admin-lessons-primary">Continue</button>
        </div>
      </div>
    </div>

    <div id="admin-team-manager-modal" class="admin-lessons-modal" aria-hidden="true">
      <div class="admin-lessons-manager-card" role="dialog" aria-modal="true" aria-label="Team manager">
        <div class="admin-lessons-modal-header">
          <button id="admin-team-add-btn" type="button" class="btn admin-lessons-add">+ Add team member</button>
          <button type="button" id="admin-team-manager-close" class="admin-lessons-close">Close</button>
        </div>
        <p class="admin-lessons-hint">Drag to reorder. Use Edit/Delete for each member.</p>
        <div id="admin-team-list" class="admin-lessons-list"></div>
      </div>
    </div>

    <div id="admin-team-edit-modal" class="admin-lessons-modal" aria-hidden="true">
      <div class="admin-lessons-modal-card" role="dialog" aria-modal="true" aria-label="Edit team member">
        <div class="admin-lessons-modal-header">
          <h3 id="admin-team-edit-title" class="admin-lessons-modal-title">Edit Team Member</h3>
          <button type="button" id="admin-team-edit-close" class="admin-lessons-close">Close</button>
        </div>
        <div class="admin-team-edit-grid">
          <div class="admin-team-edit-avatar">
            <img id="admin-team-edit-avatar-preview" alt="Avatar preview" hidden>
            <div id="admin-team-edit-avatar-fallback" class="admin-team-edit-avatar-fallback" aria-hidden="true">T</div>
            <input id="admin-team-edit-avatar-input" type="file" accept=".png,.jpg,.jpeg,.webp" hidden>
            <button type="button" id="admin-team-edit-avatar-btn" class="btn admin-lessons-secondary">Upload avatar</button>
            <p id="admin-team-edit-avatar-msg" class="admin-lessons-status" aria-live="polite"></p>
          </div>
          <div class="admin-team-edit-fields">
            <label class="admin-certificate-label" for="admin-team-edit-header">Header</label>
            <input id="admin-team-edit-header" class="admin-lessons-input" type="text" placeholder="Mr.Sam - Founder & Lead Teacher">
            <label class="admin-certificate-label" for="admin-team-edit-subheader">Description</label>
            <textarea id="admin-team-edit-subheader" class="admin-lessons-input admin-team-edit-textarea" rows="3" placeholder="Short description"></textarea>
            <label class="admin-certificate-label" for="admin-team-edit-achievements">Achievements (one per line)</label>
            <textarea id="admin-team-edit-achievements" class="admin-lessons-input admin-team-edit-textarea" rows="5" placeholder="Achievement 1&#10;Achievement 2"></textarea>
            <label class="admin-certificate-label" for="admin-team-edit-telegram">Telegram username</label>
            <input id="admin-team-edit-telegram" class="admin-lessons-input" type="text" placeholder="@username">
            <label class="admin-certificate-label" for="admin-team-edit-whatsapp">WhatsApp phone</label>
            <input id="admin-team-edit-whatsapp" class="admin-lessons-input" type="tel" placeholder="+998...">
            <label class="admin-certificate-label" for="admin-team-edit-instagram">Instagram username</label>
            <input id="admin-team-edit-instagram" class="admin-lessons-input" type="text" placeholder="@username">
            <p id="admin-team-edit-status" class="admin-lessons-status" aria-live="polite"></p>
            <div class="admin-lessons-actions">
              <button type="button" id="admin-team-edit-save" class="btn admin-lessons-primary">Save</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(wrap);
};

const initTeamModal = () => {
  const moreBtn = document.querySelector(".mentors-more-btn");
  if (!moreBtn) {
    return;
  }
  ensureTeamModals();

  const teamModal = document.getElementById("team-modal");
  const teamClose = document.getElementById("team-modal-close");
  const teamList = document.getElementById("team-modal-list");
  const teamCount = document.getElementById("team-modal-count");
  const teamEditBtn = document.getElementById("team-modal-edit-btn");

  const memberModal = document.getElementById("team-member-modal");
  const memberClose = document.getElementById("team-member-close");
  const memberTitle = document.getElementById("team-member-title");
  const memberAvatar = document.getElementById("team-member-avatar");
  const memberAvatarFallback = document.getElementById("team-member-avatar-fallback");
  const memberHeader = document.getElementById("team-member-header");
  const memberSubheader = document.getElementById("team-member-subheader");
  const memberAchievements = document.getElementById("team-member-achievements");
  const memberContacts = document.getElementById("team-member-contacts");

  const gateModal = document.getElementById("admin-team-edit-code-modal");
  const gateClose = document.getElementById("admin-team-edit-code-close");
  const gateInput = document.getElementById("admin-team-edit-code-input");
  const gateStatus = document.getElementById("admin-team-edit-code-status");
  const gateResend = document.getElementById("admin-team-edit-code-resend");
  const gateSubmit = document.getElementById("admin-team-edit-code-submit");

  const managerModal = document.getElementById("admin-team-manager-modal");
  const managerClose = document.getElementById("admin-team-manager-close");
  const managerList = document.getElementById("admin-team-list");
  const managerAdd = document.getElementById("admin-team-add-btn");

  const editModal = document.getElementById("admin-team-edit-modal");
  const editClose = document.getElementById("admin-team-edit-close");
  const editSave = document.getElementById("admin-team-edit-save");
  const editStatus = document.getElementById("admin-team-edit-status");
  const editHeader = document.getElementById("admin-team-edit-header");
  const editSubheader = document.getElementById("admin-team-edit-subheader");
  const editAchievements = document.getElementById("admin-team-edit-achievements");
  const editTelegram = document.getElementById("admin-team-edit-telegram");
  const editWhatsapp = document.getElementById("admin-team-edit-whatsapp");
  const editInstagram = document.getElementById("admin-team-edit-instagram");
  const editTitle = document.getElementById("admin-team-edit-title");
  const editAvatarPreview = document.getElementById("admin-team-edit-avatar-preview");
  const editAvatarFallback = document.getElementById("admin-team-edit-avatar-fallback");
  const editAvatarInput = document.getElementById("admin-team-edit-avatar-input");
  const editAvatarBtn = document.getElementById("admin-team-edit-avatar-btn");
  const editAvatarMsg = document.getElementById("admin-team-edit-avatar-msg");

  if (!teamModal || !teamClose || !teamList || !teamCount || !teamEditBtn) {
    return;
  }
  if (!memberModal || !memberClose || !memberTitle || !memberAvatar || !memberAvatarFallback) {
    return;
  }
  if (!managerModal || !managerClose || !managerList || !managerAdd) {
    return;
  }
  if (!gateModal || !gateClose || !gateInput || !gateStatus || !gateResend || !gateSubmit) {
    return;
  }
  if (
    !editModal ||
    !editClose ||
    !editSave ||
    !editStatus ||
    !editHeader ||
    !editSubheader ||
    !editAchievements ||
    !editTelegram ||
    !editWhatsapp ||
    !editInstagram ||
    !editTitle ||
    !editAvatarPreview ||
    !editAvatarFallback ||
    !editAvatarInput ||
    !editAvatarBtn ||
    !editAvatarMsg
  ) {
    return;
  }

  const openOverlay = (el) => {
    el.classList.add("is-open");
    el.setAttribute("aria-hidden", "false");
    syncModalBodyScroll();
  };
  const closeOverlay = (el) => {
    el.classList.remove("is-open");
    el.setAttribute("aria-hidden", "true");
    syncModalBodyScroll();
  };

  let teamMembersCache = [];
  let adminTeamCache = [];
  let editingTeamMemberId = "";
  let editingTeamMemberIsNew = false;
  let editSnapshot = null;
  let pendingAvatarFile = null;
  let pendingAvatarToken = "";
  let pendingAvatarOriginalName = "";
  let pendingAvatarUrl = "";

  const resolveTeamAvatarUrl = (rawUrl) => {
    const trimmed = String(rawUrl || "").trim();
    if (!trimmed) return "";
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    if (trimmed.startsWith("/api/")) return `${API_BASE_URL}${trimmed}`;
    return trimmed;
  };

  const parseTeamAchievementsLines = (value) =>
    String(value || "")
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .slice(0, 24);

  const formatMemberCount = (count) => {
    const n = Math.max(0, Number(count) || 0);
    return `${n} ${n === 1 ? "member" : "members"}`;
  };

  const buildTeamContactIcons = (member) => {
    const tgRaw = String(member && member.telegram_username ? member.telegram_username : "").trim();
    const tgClean = tgRaw.replace(/^@/, "");
    const igRaw = String(member && member.instagram_username ? member.instagram_username : "").trim();
    const igClean = igRaw.replace(/^@/, "");
    const waRaw = String(member && member.whatsapp_phone ? member.whatsapp_phone : "").trim();
    const waDigits = waRaw.replace(/[^\d]/g, "");
    const icons = [];
    if (tgClean) {
      icons.push({
        href: `https://t.me/${encodeURIComponent(tgClean)}`,
        iconSrc: "assets/images/icons8-telegram-96.png",
        iconAlt: "Telegram",
        iconClass: "profile-support-icon-img",
      });
    }
    if (waDigits) {
      icons.push({
        href: `https://wa.me/${encodeURIComponent(waDigits)}`,
        iconSrc: "assets/images/whatsapp.svg",
        iconAlt: "WhatsApp",
        iconClass: "profile-support-icon-img",
      });
    }
    if (igClean) {
      icons.push({
        href: `https://www.instagram.com/${encodeURIComponent(igClean)}`,
        iconSrc: "assets/images/icons8-instagram-94.png",
        iconAlt: "Instagram",
        iconClass: "profile-support-icon-img profile-support-icon-img--instagram",
      });
    }
    return icons;
  };

  const renderMemberModal = (member) => {
    const headerText = String(member && member.header ? member.header : "").trim() || "-";
    const subheaderText = String(member && member.subheader ? member.subheader : "").trim() || "-";
    memberTitle.textContent = headerText;
    memberHeader.textContent = headerText;
    memberSubheader.textContent = subheaderText;

    const avatarUrl = resolveTeamAvatarUrl(member && member.avatar_url ? member.avatar_url : "");
    memberAvatar.hidden = !avatarUrl;
    memberAvatarFallback.hidden = Boolean(avatarUrl);
    if (avatarUrl) {
      memberAvatar.src = avatarUrl;
    } else {
      memberAvatar.removeAttribute("src");
    }

    memberAchievements.innerHTML = "";
    const achievements = Array.isArray(member && member.achievements ? member.achievements : null)
      ? member.achievements
      : [];
    if (achievements.length === 0) {
      const li = document.createElement("li");
      li.textContent = "No achievements yet.";
      memberAchievements.appendChild(li);
    } else {
      achievements.slice(0, 24).forEach((item) => {
        const li = document.createElement("li");
        li.textContent = String(item || "").trim();
        memberAchievements.appendChild(li);
      });
    }

    memberContacts.innerHTML = "";
    const icons = buildTeamContactIcons(member);
    if (icons.length === 0) {
      memberContacts.innerHTML = "<div class=\"admin-lessons-status\">No contacts yet.</div>";
      return;
    }
    icons.forEach((item) => {
      const link = document.createElement("a");
      link.className = "profile-support-icon";
      link.href = item.href;
      link.target = "_blank";
      link.rel = "noopener";
      link.setAttribute("aria-label", item.iconAlt);
      const img = document.createElement("img");
      img.src = item.iconSrc;
      img.alt = item.iconAlt;
      img.className = item.iconClass;
      link.appendChild(img);
      memberContacts.appendChild(link);
    });
  };

  let latestTeamMembersCache = [];
  let latestTeamMembersAt = 0;
  const getLatestTeamMembers = async () => {
    const now = Date.now();
    if (now - latestTeamMembersAt < 4000 && Array.isArray(latestTeamMembersCache) && latestTeamMembersCache.length) {
      return latestTeamMembersCache;
    }
    const items = await loadTeamMembers();
    if (items.length) {
      latestTeamMembersCache = items.slice();
      latestTeamMembersAt = now;
      return latestTeamMembersCache;
    }
    return teamMembersCache.slice();
  };

  const openMemberModal = async (member) => {
    const memberId = String(member && member.id ? member.id : "").trim();
    const headerText = String(member && member.header ? member.header : "").trim() || "Team member";
    memberTitle.textContent = headerText;
    memberHeader.textContent = headerText;
    memberSubheader.textContent = "Loading...";
    memberAchievements.innerHTML = "<li>Loading...</li>";
    memberContacts.innerHTML = "<div class=\"admin-lessons-status\">Loading...</div>";
    openOverlay(memberModal);

    const list = await getLatestTeamMembers();
    const fresh = memberId ? list.find((it) => String(it && it.id ? it.id : "") === memberId) : null;
    renderMemberModal(fresh || member);
  };

  const renderTeamList = (members) => {
    const list = Array.isArray(members) ? members : [];
    teamCount.textContent = formatMemberCount(list.length);
    teamList.innerHTML = "";
    const isAdmin = isAdminUser();
    teamEditBtn.hidden = !isAdmin;

    const sorted = list
      .slice()
      .sort((a, b) => (Number(a && a.order) || 0) - (Number(b && b.order) || 0));
    if (sorted.length === 0) {
      teamList.innerHTML = "<div class=\"admin-lessons-status\">No team members yet.</div>";
      return;
    }

    const createCard = (member, isFeatured) => {
      const headerText = String(member && member.header ? member.header : "").trim();
      const subheaderText = String(member && member.subheader ? member.subheader : "").trim();
      const card = document.createElement("article");
      card.className = `about-person${isFeatured ? " about-person-featured" : ""} team-person`;
      card.dataset.teamMemberId = String(member && member.id ? member.id : "");

      const avatarUrl = resolveTeamAvatarUrl(member && member.avatar_url ? member.avatar_url : "");
      const avatarMarkup = avatarUrl ? `<img src="${escapeHtml(avatarUrl)}" alt="Avatar">` : "Photo";

    const actionsMarkup = `
        <div class="team-card-actions">
          <button type="button" class="btn team-card-more-btn">More</button>
        </div>
      `;

      card.innerHTML = `
        <div class="about-avatar">${avatarMarkup}</div>
        <div class="about-info">
          <h3>${escapeHtml(headerText || "-")}</h3>
          <p>${escapeHtml(subheaderText || "")}</p>
          ${actionsMarkup}
        </div>
      `;
      const moreBtn = card.querySelector(".team-card-more-btn");
      if (moreBtn) {
        moreBtn.addEventListener("click", (event) => {
          event.preventDefault();
          Promise.resolve()
            .then(() => openMemberModal(member))
            .catch(() => {});
        });
      }
      return card;
    };

    const featured = createCard(sorted[0], true);
    teamList.appendChild(featured);

    const rest = sorted.slice(1);
    if (rest.length > 0) {
      const grid = document.createElement("div");
      grid.className = "about-grid";
      rest.forEach((member) => {
        grid.appendChild(createCard(member, false));
      });
      teamList.appendChild(grid);
    }
  };

  const loadTeamMembers = async () => {
    await ensureApiBaseUrl();
    try {
      const response = await fetch(`${API_BASE_URL}/api/team`);
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        return [];
      }
      const items = Array.isArray(payload.items) ? payload.items : [];
      return items;
    } catch (error) {
      return [];
    }
  };

  const loadTeamMembersFromDomFallback = () => {
    const container = document.querySelector(".results-section .about-team");
    if (!container) return [];
    const cards = Array.from(container.querySelectorAll(".about-person"));
    const items = [];
    cards.forEach((card, index) => {
      const header = String(card.querySelector(".about-info h3")?.textContent || "").trim();
      const subheader = String(card.querySelector(".about-info p")?.textContent || "").trim();
      const imgSrc = String(card.querySelector(".about-avatar img")?.getAttribute("src") || "").trim();
      if (!header) return;
      items.push({
        id: `dom_${index + 1}`,
        order: index,
        header,
        subheader,
        achievements: [],
        telegram_username: "",
        instagram_username: "",
        whatsapp_phone: "",
        avatar_url: imgSrc,
      });
    });
    return items;
  };

  const openTeamModal = async () => {
    openOverlay(teamModal);
    teamList.innerHTML = "<div class=\"admin-lessons-status\">Loading...</div>";
    const members = await loadTeamMembers();
    teamMembersCache = members.length ? members : loadTeamMembersFromDomFallback();
    renderTeamList(teamMembersCache);
  };

  const openManagerModal = async () => {
    const authState = getAuthState();
    if (!authState || authState.role !== "admin" || !authState.username) {
      return;
    }
    managerList.innerHTML = "<div class=\"admin-lessons-status\">Loading...</div>";
    openOverlay(managerModal);
    adminTeamCache = await fetchAdminTeamMembers();
    renderAdminTeamManager();
  };

  async function fetchAdminTeamMembers() {
    const authState = getAuthState();
    if (!authState || authState.role !== "admin" || !authState.username) {
      return [];
    }
    await ensureApiBaseUrl();
    try {
      const response = await adminFetchRaw(`${API_BASE_URL}/api/admin/team`);
      const payload = await response.json().catch(() => ({}));
      if (response.ok && Array.isArray(payload.items)) {
        return payload.items.slice();
      }
      return teamMembersCache.slice();
    } catch (error) {
      return teamMembersCache.slice();
    }
  }

  async function ensureAdminTeamLoaded() {
    const authState = getAuthState();
    if (!authState || authState.role !== "admin" || !authState.username) {
      return false;
    }
    if (Array.isArray(adminTeamCache) && adminTeamCache.length > 0) {
      return true;
    }
    adminTeamCache = await fetchAdminTeamMembers();
    return adminTeamCache.length > 0;
  }

  const persistAdminTeamItems = async () => {
    const authState = getAuthState();
    if (!authState || authState.role !== "admin" || !authState.username) {
      return { ok: false, error: "admin_access_required" };
    }
    const payloadItems = adminTeamCache.map((it, idx) => ({
      ...it,
      order: idx,
    }));
    const result = await adminPostJson("/api/admin/team/set-all", { admin_username: authState.username, items: payloadItems });
    if (!result.ok) {
      return { ok: false, error: (result.data && result.data.error) || "save_failed" };
    }
    adminTeamCache = payloadItems.slice();
    return { ok: true };
  };

  const renderAdminTeamManager = () => {
    managerList.innerHTML = "";
    const items = adminTeamCache
      .slice()
      .sort((a, b) => (Number(a && a.order) || 0) - (Number(b && b.order) || 0));
    items.forEach((member) => {
      const row = document.createElement("div");
      row.className = "admin-lessons-row";
      row.dataset.teamMemberId = String(member && member.id ? member.id : "");
      row.innerHTML = `
        <div class="admin-lessons-handle" draggable="true" aria-label="Move"></div>
        <div class="admin-lessons-meta">
          <div class="admin-lessons-name"><strong>${escapeHtml(String(member.header || "").trim() || "-")}</strong></div>
          <div class="admin-lessons-sub">${escapeHtml(String(member.subheader || "").trim() || "")}</div>
        </div>
        <div class="admin-lessons-row-actions">
          <button type="button" class="btn admin-lessons-mini admin-team-mini-edit">Edit</button>
          <button type="button" class="btn admin-lessons-mini admin-team-mini-delete">Delete</button>
        </div>
      `;
      managerList.appendChild(row);
    });

    // Reordering: drag-and-drop + pointer sorting (same behavior as lessons).
    let dragged = null;
    let pointerActive = false;
    let pointerId = null;

    const applyOrderFromDom = () => {
      const ids = Array.from(managerList.querySelectorAll(".admin-lessons-row"))
        .map((row) => String(row.dataset.teamMemberId || "").trim())
        .filter(Boolean);
      const byId = new Map(adminTeamCache.map((m) => [String(m.id || ""), m]));
      adminTeamCache = ids.map((id, idx) => ({ ...(byId.get(id) || { id }), order: idx }));
    };

    const persistOrder = async () => {
      applyOrderFromDom();
      await persistAdminTeamItems();
      teamMembersCache = adminTeamCache.slice();
      renderTeamList(teamMembersCache);
    };

    managerList.querySelectorAll(".admin-lessons-handle").forEach((handle) => {
      handle.addEventListener("dragstart", (event) => {
        const parent = handle.closest(".admin-lessons-row");
        if (!parent) return;
        dragged = parent;
        if (event.dataTransfer) {
          event.dataTransfer.effectAllowed = "move";
        }
      });
      handle.addEventListener("dragover", (event) => event.preventDefault());
      handle.addEventListener("drop", (event) => {
        event.preventDefault();
        const targetRow = handle.closest(".admin-lessons-row");
        if (!dragged || !targetRow || targetRow === dragged) return;
        const rect = targetRow.getBoundingClientRect();
        const y = event.clientY;
        const shouldInsertAfter = y > rect.top + rect.height / 2;
        if (shouldInsertAfter) {
          targetRow.insertAdjacentElement("afterend", dragged);
        } else {
          targetRow.insertAdjacentElement("beforebegin", dragged);
        }
      });
      handle.addEventListener("dragend", () => {
        dragged = null;
        persistOrder();
      });

      handle.addEventListener("pointerdown", (event) => {
        if (!event || (event.pointerType !== "touch" && event.pointerType !== "pen")) {
          return;
        }
        const parent = handle.closest(".admin-lessons-row");
        if (!parent) return;
        pointerActive = true;
        pointerId = event.pointerId;
        dragged = parent;
        dragged.classList.add("is-dragging");
        try {
          handle.setPointerCapture(pointerId);
        } catch (error) {
          // ignore
        }
        event.preventDefault();
      });

      handle.addEventListener("pointermove", (event) => {
        if (!pointerActive || !dragged || event.pointerId !== pointerId) return;
        const el = document.elementFromPoint(event.clientX, event.clientY);
        const targetRow = el && el.closest ? el.closest(".admin-lessons-row") : null;
        if (!targetRow || targetRow === dragged) return;
        const rect = targetRow.getBoundingClientRect();
        const shouldInsertAfter = event.clientY > rect.top + rect.height / 2;
        if (shouldInsertAfter) {
          targetRow.insertAdjacentElement("afterend", dragged);
        } else {
          targetRow.insertAdjacentElement("beforebegin", dragged);
        }
        event.preventDefault();
      });

      const finishPointer = () => {
        if (!pointerActive) return;
        pointerActive = false;
        pointerId = null;
        if (dragged) dragged.classList.remove("is-dragging");
        dragged = null;
        persistOrder();
      };

      handle.addEventListener("pointerup", finishPointer);
      handle.addEventListener("pointercancel", finishPointer);
    });
  };

  const resetEditModal = () => {
    editStatus.textContent = "";
    editAvatarMsg.textContent = "";
    pendingAvatarFile = null;
    pendingAvatarToken = "";
    pendingAvatarOriginalName = "";
    pendingAvatarUrl = "";
    editSnapshot = null;
    editingTeamMemberIsNew = false;
    if (editAvatarInput) editAvatarInput.value = "";
  };

  const openEditModalForMember = (member) => {
    resetEditModal();
    const id = String(member && member.id ? member.id : "").trim();
    editingTeamMemberId = id;
    editingTeamMemberIsNew = !adminTeamCache.some((m) => String(m && m.id ? m.id : "") === id);
    editTitle.textContent = id ? "Edit Team Member" : "Add Team Member";

    pendingAvatarUrl = String(member && member.avatar_url ? member.avatar_url : "").trim();
    editHeader.value = String(member && member.header ? member.header : "").trim();
    editSubheader.value = String(member && member.subheader ? member.subheader : "").trim();
    editAchievements.value = Array.isArray(member && member.achievements ? member.achievements : null)
      ? member.achievements.join("\n")
      : "";
    editTelegram.value = String(member && member.telegram_username ? member.telegram_username : "").trim();
    editWhatsapp.value = String(member && member.whatsapp_phone ? member.whatsapp_phone : "").trim();
    editInstagram.value = String(member && member.instagram_username ? member.instagram_username : "").trim();

    const avatarUrl = resolveTeamAvatarUrl(member && member.avatar_url ? member.avatar_url : "");
    editAvatarPreview.hidden = !avatarUrl;
    editAvatarFallback.hidden = Boolean(avatarUrl);
    if (avatarUrl) {
      editAvatarPreview.src = avatarUrl;
    } else {
      editAvatarPreview.removeAttribute("src");
    }

    pendingAvatarToken = String(member && member.avatar_file ? member.avatar_file : "").trim();
    pendingAvatarOriginalName = String(member && member.avatar_original_name ? member.avatar_original_name : "").trim();

    editSnapshot = {
      header: editHeader.value,
      subheader: editSubheader.value,
      achievements: editAchievements.value,
      telegram: editTelegram.value,
      whatsapp: editWhatsapp.value,
      instagram: editInstagram.value,
      avatar_file: pendingAvatarToken,
      avatar_url: pendingAvatarUrl,
      avatar_original_name: pendingAvatarOriginalName,
    };

    openOverlay(editModal);
  };

  const requestPin = async () => {
    gateStatus.textContent = "Sending PIN...";
    const authState = getAuthState();
    const result = await adminPostJson("/api/admin/edit-access/request", { admin_username: authState.username });
    if (!result.ok) {
      const error = (result.data && result.data.error) || "request_failed";
      gateStatus.textContent = error === "network_error" ? "Auth server is not running." : String(error);
      return false;
    }
    gateStatus.textContent = "PIN sent. Check Telegram.";
    return true;
  };

  const verifyCode = async (code) => {
    const authState = getAuthState();
    return adminPostJson("/api/admin/edit-access/verify", { admin_username: authState.username, code });
  };

  let gateBusy = false;
  const startGate = async () => {
    const authState = getAuthState();
    if (!authState || authState.role !== "admin" || !authState.username) {
      return;
    }
    const storageKey = `${ADMIN_EDIT_CODE_STORAGE_PREFIX}${authState.username}`;
    let stored = "";
    try {
      stored = localStorage.getItem(storageKey) || "";
    } catch (error) {
      stored = "";
    }
    if (stored) {
      const verify = await verifyCode(stored);
      if (verify.ok && verify.data && verify.data.ok) {
        await openManagerModal();
        return;
      }
      try {
        localStorage.removeItem(storageKey);
      } catch (error) {
        // ignore
      }
    }

    openOverlay(gateModal);
    gateInput.value = "";
    gateInput.focus();
    return requestPin();
  };

  const triggerGate = () => {
    if (gateBusy) return;
    gateBusy = true;
    Promise.resolve()
      .then(() => startGate())
      .finally(() => {
        gateBusy = false;
      });
  };

  const handleDeleteMember = async (memberId) => {
    const authState = getAuthState();
    if (!authState || authState.role !== "admin" || !authState.username) {
      return;
    }
    const loaded = await ensureAdminTeamLoaded();
    if (!loaded) {
      window.alert("Could not load team list.");
      return;
    }
    const ok = window.confirm("Delete this team member?");
    if (!ok) return;
    adminTeamCache = adminTeamCache.filter((m) => String(m.id || "") !== memberId);
    const res = await persistAdminTeamItems();
    if (!res.ok) {
      window.alert("Could not delete team member.");
      return;
    }
    teamMembersCache = adminTeamCache.slice();
    renderTeamList(teamMembersCache);
    renderAdminTeamManager();
  };

  // Wiring: open/close modals.
  moreBtn.addEventListener("click", (event) => {
    event.preventDefault();
    openTeamModal();
  });
  moreBtn.onclick = (event) => {
    if (event) event.preventDefault();
    openTeamModal();
  };

  teamClose.addEventListener("click", () => closeOverlay(teamModal));
  memberClose.addEventListener("click", () => closeOverlay(memberModal));
  gateClose.addEventListener("click", () => closeOverlay(gateModal));
  managerClose.addEventListener("click", () => closeOverlay(managerModal));
  const isEditDirty = () => {
    if (!editSnapshot) return false;
    const current = {
      header: String(editHeader.value || ""),
      subheader: String(editSubheader.value || ""),
      achievements: String(editAchievements.value || ""),
      telegram: String(editTelegram.value || ""),
      whatsapp: String(editWhatsapp.value || ""),
      instagram: String(editInstagram.value || ""),
      avatar_file: String(pendingAvatarToken || ""),
      avatar_url: String(pendingAvatarUrl || ""),
      avatar_original_name: String(pendingAvatarOriginalName || ""),
    };
    return JSON.stringify(current) !== JSON.stringify(editSnapshot);
  };
  const saveEditingMember = async ({ closeOnSuccess } = { closeOnSuccess: true }) => {
    const authState = getAuthState();
    if (!authState || authState.role !== "admin" || !authState.username) {
      editStatus.textContent = "Admin access required.";
      return false;
    }
    const header = String(editHeader.value || "").trim();
    if (!header) {
      editStatus.textContent = "Header is required.";
      return false;
    }
    editStatus.textContent = "Saving...";

    let avatarFileToken = pendingAvatarToken;
    let avatarOriginalName = pendingAvatarOriginalName;
    if (pendingAvatarFile) {
      const file = pendingAvatarFile;
      const base64 = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ""));
        reader.onerror = () => resolve("");
        reader.readAsDataURL(file);
      });
      if (!base64) {
        editStatus.textContent = "Could not read avatar file.";
        return false;
      }
      const upload = await adminPostJson(
        "/api/admin/team/avatar/upload",
        { admin_username: authState.username, file_name: file.name, file_data: base64 },
        120000
      );
      if (!upload.ok || !upload.data || !upload.data.file) {
        editStatus.textContent = (upload.data && upload.data.error) || "avatar_upload_failed";
        return false;
      }
      avatarFileToken = String(upload.data.file || "").trim();
      avatarOriginalName = String(upload.data.original_name || file.name || "").trim();
    }

    const achievements = parseTeamAchievementsLines(editAchievements.value);
    const memberId = String(editingTeamMemberId || "").trim();
    const next = {
      id: memberId,
      order: 0,
      header,
      subheader: String(editSubheader.value || "").trim(),
      achievements,
      telegram_username: String(editTelegram.value || "").trim(),
      instagram_username: String(editInstagram.value || "").trim(),
      whatsapp_phone: String(editWhatsapp.value || "").trim(),
      avatar_url: avatarFileToken ? "" : pendingAvatarUrl,
      avatar_file: avatarFileToken || "",
      avatar_original_name: avatarOriginalName || "",
    };

    if (editingTeamMemberIsNew) {
      adminTeamCache = adminTeamCache.concat([{ ...next }]);
      editingTeamMemberIsNew = false;
    } else {
      adminTeamCache = adminTeamCache.map((m) => (String(m.id || "") === memberId ? { ...m, ...next } : m));
    }

    const res = await persistAdminTeamItems();
    if (!res.ok) {
      const rawError = String(res.error || "save_failed");
      editStatus.textContent =
        rawError === "not found"
          ? "Server does not support Team API yet. Restart the backend/server.py."
          : rawError;
      return false;
    }

    // Re-fetch from server to ensure persistence (and to get normalized values).
    try {
      const fresh = await fetchAdminTeamMembers();
      if (fresh && Array.isArray(fresh) && fresh.length > 0) {
        adminTeamCache = fresh.slice();
      }
    } catch (error) {
      // ignore
    }

    teamMembersCache = adminTeamCache.slice();
    renderAdminTeamManager();
    renderTeamList(teamMembersCache);

    editSnapshot = {
      header: editHeader.value,
      subheader: editSubheader.value,
      achievements: editAchievements.value,
      telegram: editTelegram.value,
      whatsapp: editWhatsapp.value,
      instagram: editInstagram.value,
      avatar_file: String(avatarFileToken || ""),
      avatar_url: String(pendingAvatarUrl || ""),
      avatar_original_name: String(avatarOriginalName || ""),
    };

    editStatus.textContent = "Saved.";
    pendingAvatarFile = null;
    pendingAvatarToken = "";
    pendingAvatarOriginalName = "";

    // Bust the short-lived "latest team" cache so public reads reflect the save immediately.
    latestTeamMembersAt = 0;

    if (closeOnSuccess) {
      closeOverlay(editModal);
    }
    return true;
  };

  const requestCloseEditModal = async () => {
    if (isEditDirty()) {
      const shouldSave = window.confirm("Save changes?");
      if (shouldSave) {
        const ok = await saveEditingMember({ closeOnSuccess: true });
        if (!ok) {
          return;
        }
        return;
      }
    }
    closeOverlay(editModal);
  };

  editClose.addEventListener("click", () => {
    Promise.resolve()
      .then(() => requestCloseEditModal())
      .catch(() => {});
  });

  teamModal.addEventListener("click", (event) => {
    if (event.target === teamModal) closeOverlay(teamModal);
  });
  memberModal.addEventListener("click", (event) => {
    if (event.target === memberModal) closeOverlay(memberModal);
  });
  gateModal.addEventListener("click", (event) => {
    if (event.target === gateModal) closeOverlay(gateModal);
  });
  managerModal.addEventListener("click", (event) => {
    if (event.target === managerModal) closeOverlay(managerModal);
  });
  editModal.addEventListener("click", (event) => {
    if (event.target === editModal) {
      Promise.resolve()
        .then(() => requestCloseEditModal())
        .catch(() => {});
    }
  });

  // Team modal actions (More/Edit/Delete).
  teamList.addEventListener("click", (event) => {
    const target = event.target;
    const card = target && target.closest ? target.closest(".team-person") : null;
    if (!card) return;
    const memberId = String(card.dataset.teamMemberId || "").trim();
    const member = teamMembersCache.find((m) => String(m.id || "") === memberId) || null;
    if (target.closest(".team-card-more-btn")) {
      event.preventDefault();
      if (member) openMemberModal(member);
    }
  });

  // Admin manager actions (Edit/Delete).
  managerList.addEventListener("click", (event) => {
    const target = event.target;
    const row = target && target.closest ? target.closest(".admin-lessons-row") : null;
    if (!row) return;
    const memberId = String(row.dataset.teamMemberId || "").trim();
    if (!memberId) return;
    const member = adminTeamCache.find((m) => String(m.id || "") === memberId) || null;
    if (target.closest(".admin-team-mini-edit")) {
      if (member) openEditModalForMember(member);
    }
    if (target.closest(".admin-team-mini-delete")) {
      handleDeleteMember(memberId);
    }
  });

  teamEditBtn.addEventListener("click", triggerGate);
  teamEditBtn.onclick = triggerGate;

  gateResend.addEventListener("click", requestPin);
  gateSubmit.addEventListener("click", async () => {
    const code = String(gateInput.value || "").trim();
    if (!code) {
      gateStatus.textContent = "Enter a code.";
      return;
    }
    gateStatus.textContent = "Checking...";
    const verify = await verifyCode(code);
    if (verify.ok && verify.data && verify.data.ok) {
      const authState = getAuthState();
      if (verify.data.method === "permanent" || /[A-Za-z]/.test(code)) {
        try {
          localStorage.setItem(`${ADMIN_EDIT_CODE_STORAGE_PREFIX}${authState.username}`, code);
        } catch (error) {
          // ignore
        }
      }
      closeOverlay(gateModal);
      await openManagerModal();
      return;
    }
    const error = (verify.data && verify.data.error) || "invalid_code";
    const attempts = verify.data && Number(verify.data.attempts_left);
    if (error === "banned") {
      gateStatus.textContent = "Banned. Ask super admin to unblock.";
      return;
    }
    gateStatus.textContent = attempts ? `Wrong code. Attempts left: ${attempts}` : "Wrong code.";
  });

  managerAdd.addEventListener("click", () => {
    const id = `tm_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    const blank = {
      id,
      order: adminTeamCache.length,
      header: "",
      subheader: "",
      achievements: [],
      telegram_username: "",
      instagram_username: "",
      whatsapp_phone: "",
      avatar_url: "",
      avatar_file: "",
      avatar_original_name: "",
    };
    openEditModalForMember(blank);
  });

  editAvatarBtn.addEventListener("click", () => editAvatarInput.click());
  editAvatarInput.addEventListener("change", () => {
    const file = editAvatarInput.files && editAvatarInput.files[0];
    pendingAvatarFile = file || null;
    pendingAvatarToken = "";
    pendingAvatarOriginalName = "";
    pendingAvatarUrl = "";
    editAvatarMsg.textContent = file ? `Selected: ${file.name}` : "";
    if (file) {
      try {
        const url = URL.createObjectURL(file);
        editAvatarPreview.src = url;
        editAvatarPreview.hidden = false;
        editAvatarFallback.hidden = true;
      } catch (error) {
        // ignore
      }
    }
  });

  editSave.addEventListener("click", () => {
    Promise.resolve()
      .then(() => saveEditingMember({ closeOnSuccess: true }))
      .catch(() => {});
  });
};

updateLoginButton();
refreshAuthRole();
refreshAdminPanelBadge();
(async () => {
  try {
    await loadAndRenderCertificatesOverrides();
  } catch (error) {
    // ignore
  }
  try {
    await loadAndRenderSubscriptionOverrides();
  } catch (error) {
    // ignore
  }
  try {
    await renderLessonsCatalogFromOverrides();
  } catch (error) {
    // ignore
  }
  try {
    initAdminLessonsEditing();
  } catch (error) {
    // ignore
  }
  try {
    initAdminSubscriptionsEditing();
  } catch (error) {
    // ignore
  }
	  try {
	    initAdminCertificatesEditing();
	  } catch (error) {
	    // ignore
	  }
	  try {
	    initTeamModal();
	  } catch (error) {
	    // ignore
	  }
	  try {
	    await applyLessonAccessLocks();
	  } catch (error) {
	    // ignore
	  }
  try {
    applyLessonCompletionBadges();
  } catch (error) {
    // ignore
  }
  try {
    applyCourseLevelLocks();
  } catch (error) {
    // ignore
  }
  try {
    handleSubscriptionGate();
  } catch (error) {
    // ignore
  }
  try {
    handleRenewQuery();
  } catch (error) {
    // ignore
  }
  try {
    syncLessonsPageProgressFromServer();
  } catch (error) {
    // ignore
  }
  try {
    syncAdminPanelPlacement();
  } catch (error) {
    // ignore
  }
  try {
    enableLessonActionButtonTilt();
  } catch (error) {
    // ignore
  }
  try {
    enableButtonGlowTracking();
  } catch (error) {
    // ignore
  }
})();

(() => {
  const lessonsPageEl = document.querySelector(".lessons-page");
  if (!lessonsPageEl) {
    return;
  }
  const course = getCourseFromPathname();
  if (!FINAL_LESSON_BY_COURSE[course]) {
    return;
  }
  const params = new URLSearchParams(window.location.search);
  if (params.get("celebrate") !== "1") {
    return;
  }
  params.delete("celebrate");
  const nextQuery = params.toString();
  const nextUrl = `${window.location.pathname}${nextQuery ? `?${nextQuery}` : ""}${window.location.hash || ""}`;
  window.history.replaceState({}, "", nextUrl);
  startCourseCelebration("Congratulations You Did It.");
})();

let adminPanelPlacementRaf = 0;
window.addEventListener("resize", () => {
  if (adminPanelPlacementRaf) {
    cancelAnimationFrame(adminPanelPlacementRaf);
  }
  adminPanelPlacementRaf = requestAnimationFrame(() => {
    adminPanelPlacementRaf = 0;
    syncAdminPanelPlacement();
    enableLessonActionButtonTilt();
    enableButtonGlowTracking();
  });
});

const adminPage = document.querySelector("[data-admin-page]");
  if (adminPage) {
  const adminGuard = document.getElementById("admin-guard-message");
  const adminContent = document.getElementById("admin-content");
  const adminUserEl = document.getElementById("admin-user");
  const adminUsernameSearchInput = document.getElementById("admin-username-search");
  const statUsersEl = document.getElementById("admin-stat-users");
  const usersTableBody = document.getElementById("admin-users-body");
  const knowledgeTableBody = document.getElementById("admin-knowledge-body");
  const knowledgeToggleBtn = document.getElementById("admin-knowledge-toggle-btn");
  const levelTableA1 = document.getElementById("admin-level-table-a1");
  const levelTableA2 = document.getElementById("admin-level-table-a2");
  const levelTableB1 = document.getElementById("admin-level-table-b1");
  const levelTableB2 = document.getElementById("admin-level-table-b2");
	  const adminSearchBtn = document.getElementById("admin-search-btn");
	  const createModal = document.getElementById("admin-create-modal");
	  const createForm = document.getElementById("admin-create-form");
	  const createCancelBtn = document.getElementById("admin-create-cancel");
	  const createPaymentApprovalBtn = document.getElementById("admin-create-payment-approval");
	  const createSubmitBtn = document.getElementById("admin-create-submit");
	  const createRoleInput = document.getElementById("admin-create-role");
	  const createNameInput = document.getElementById("admin-create-name");
	  const createSecondNameInput = document.getElementById("admin-create-second-name");
	  const createPhoneInput = document.getElementById("admin-create-phone");
	  const createLevelInput = document.getElementById("admin-create-level");
	  const createScheduleInput = document.getElementById("admin-create-schedule");
	  const createScheduleGroup = document.getElementById("admin-create-schedule-group");
	  const createMentorInput = document.getElementById("admin-create-mentor");
	  const createUsernameInput = document.getElementById("admin-create-username");
	  const createPasswordInput = document.getElementById("admin-create-password");
	  const createProfilePhotoInput = document.getElementById("admin-create-profile-photo");
	  const createProfilePhotoMessage = document.getElementById("admin-create-profile-photo-message");
	  const createMessage = document.getElementById("admin-create-message");
  const editModal = document.getElementById("admin-edit-modal");
  const editForm = document.getElementById("admin-edit-form");
  const editCancelBtn = document.getElementById("admin-edit-cancel");
  const editSubmitBtn = document.getElementById("admin-edit-submit");
  const editNameInput = document.getElementById("admin-edit-name");
  const editPhoneInput = document.getElementById("admin-edit-phone");
  const editLevelInput = document.getElementById("admin-edit-level");
  const editScheduleInput = document.getElementById("admin-edit-schedule");
  const editUsernameInput = document.getElementById("admin-edit-username");
  const editPasswordInput = document.getElementById("admin-edit-password");
  const editMessage = document.getElementById("admin-edit-message");
  const userInfoModal = document.getElementById("admin-user-info-modal");
  const userInfoCloseBtn = document.getElementById("admin-user-info-close");
  const userInfoEditBtn = document.getElementById("admin-user-info-edit");
  const userInfoTitle = document.getElementById("admin-user-info-title");
  const userInfoNote = document.getElementById("admin-user-info-note");
  const userInfoBody = document.getElementById("admin-user-info-body");
  const passwordResetModal = document.getElementById("admin-password-reset-modal");
  const passwordResetForm = document.getElementById("admin-password-reset-form");
  const passwordResetCodeInput = document.getElementById("admin-password-reset-code");
  const passwordResetNewInput = document.getElementById("admin-password-reset-new");
  const passwordResetMessage = document.getElementById("admin-password-reset-message");
  const passwordResetCancelBtn = document.getElementById("admin-password-reset-cancel");
  const passwordResetSubmitBtn = document.getElementById("admin-password-reset-submit");
  const viewProgressBtn = document.getElementById("admin-view-progress-btn");
  const progressModal = document.getElementById("admin-progress-modal");
  const progressCloseBtn = document.getElementById("admin-progress-close");
  const progressTitle = document.getElementById("admin-progress-title");
  const progressUsersList = document.getElementById("admin-progress-users-list");
  const progressLessons = document.getElementById("admin-progress-lessons");
  const progressNote = document.getElementById("admin-progress-note");
  const manageBtn = document.getElementById("admin-manage-btn");
  const manageBadge = document.getElementById("admin-manage-badge");
  const manageModal = document.getElementById("admin-manage-modal");
  const manageCloseBtn = document.getElementById("admin-manage-close");
  const manageRequestsBtn = document.getElementById("admin-manage-requests-btn");
  const manageRenewalsBtn = document.getElementById("admin-manage-renewals-btn");
  const manageCreateBtn = document.getElementById("admin-manage-create-btn");
  const manageMentorBtn = document.getElementById("admin-manage-mentor-btn");
  const manageDevicesBtn = document.getElementById("admin-manage-devices-btn");
  const manageDeleteBtn = document.getElementById("admin-manage-delete-btn");
	  const createQueueModal = document.getElementById("admin-create-queue-modal");
	  const createQueueCloseBtn = document.getElementById("admin-create-queue-close");
	  const createQueueManualBtn = document.getElementById("admin-create-queue-manual");
	  const createQueueList = document.getElementById("admin-create-queue-list");
	  const createQueueNote = document.getElementById("admin-create-queue-note");
	  const createTitleEl = document.getElementById("admin-create-title");
  const mentorModal = document.getElementById("admin-mentor-modal");
  const mentorForm = document.getElementById("admin-mentor-form");
  const mentorCancelBtn = document.getElementById("admin-mentor-cancel");
  const mentorAvatarBtn = document.getElementById("admin-mentor-avatar-btn");
  const mentorAvatarInput = document.getElementById("admin-mentor-avatar");
  const mentorAvatarMessage = document.getElementById("admin-mentor-avatar-message");
  const mentorMessage = document.getElementById("admin-mentor-message");
  const mentorNameInput = document.getElementById("admin-mentor-name");
  const mentorLevelInput = document.getElementById("admin-mentor-level");
  const mentorPhoneInput = document.getElementById("admin-mentor-phone");
  const mentorEmailInput = document.getElementById("admin-mentor-email");
  const mentorTelegramInput = document.getElementById("admin-mentor-telegram");
  const mentorInfoInput = document.getElementById("admin-mentor-info");
  const mentorSubmitBtn = document.getElementById("admin-mentor-submit");
  const mentorsModal = document.getElementById("admin-mentors-modal");
  const mentorsCloseBtn = document.getElementById("admin-mentors-close");
  const mentorsCreateBtn = document.getElementById("admin-mentors-create-btn");
  const mentorsBody = document.getElementById("admin-mentors-body");
  const mentorsNote = document.getElementById("admin-mentors-note");
  const mentorEditModal = document.getElementById("admin-mentor-edit-modal");
  const mentorEditForm = document.getElementById("admin-mentor-edit-form");
  const mentorEditCancelBtn = document.getElementById("admin-mentor-edit-cancel");
  const mentorEditAvatarBtn = document.getElementById("admin-mentor-edit-avatar-btn");
  const mentorEditAvatarInput = document.getElementById("admin-mentor-edit-avatar");
  const mentorEditAvatarMessage = document.getElementById("admin-mentor-edit-avatar-message");
  const mentorEditMessage = document.getElementById("admin-mentor-edit-message");
  const mentorEditNameInput = document.getElementById("admin-mentor-edit-name");
  const mentorEditLevelInput = document.getElementById("admin-mentor-edit-level");
  const mentorEditPhoneInput = document.getElementById("admin-mentor-edit-phone");
  const mentorEditEmailInput = document.getElementById("admin-mentor-edit-email");
  const mentorEditTelegramInput = document.getElementById("admin-mentor-edit-telegram");
  const mentorEditInfoInput = document.getElementById("admin-mentor-edit-info");
  const mentorEditSubmitBtn = document.getElementById("admin-mentor-edit-submit");
  const renewalsModal = document.getElementById("admin-renewals-modal");
  const renewalsCloseBtn = document.getElementById("admin-renewals-close");
  const renewalsBody = document.getElementById("admin-renewals-body");
  const renewalsNote = document.getElementById("admin-renewals-note");
  const devicesModal = document.getElementById("admin-devices-modal");
  const devicesCloseBtn = document.getElementById("admin-devices-close");
  const devicesBody = document.getElementById("admin-devices-body");
  const devicesNote = document.getElementById("admin-devices-note");
  const deviceDetailModal = document.getElementById("admin-device-detail-modal");
  const deviceDetailCloseBtn = document.getElementById("admin-device-detail-close");
  const deviceDetailUsername = document.getElementById("admin-device-detail-username");
  const deviceDetailType = document.getElementById("admin-device-detail-type");
  const deviceDetailFirst = document.getElementById("admin-device-detail-first");
  const deviceDetailLast = document.getElementById("admin-device-detail-last");
  const deviceDetailCount = document.getElementById("admin-device-detail-count");
  const deviceDetailIp = document.getElementById("admin-device-detail-ip");
  const deviceDetailLocation = document.getElementById("admin-device-detail-location");
  const deviceDetailTimezone = document.getElementById("admin-device-detail-timezone");
  const deviceDetailOrg = document.getElementById("admin-device-detail-org");
  const deviceDetailAgent = document.getElementById("admin-device-detail-agent");
  const deviceDetailUa = document.getElementById("admin-device-detail-ua");
  const paymentApprovalBtn = document.getElementById("admin-payment-approval-btn");
  const paymentsModal = document.getElementById("admin-payments-modal");
  const paymentsCloseBtn = document.getElementById("admin-payments-close");
  const paymentsBody = document.getElementById("admin-payments-body");
  const paymentForm = document.getElementById("admin-payment-form");
  const paymentUsername = document.getElementById("admin-payment-username");
  const paymentDate = document.getElementById("admin-payment-date");
  const paymentFile = document.getElementById("admin-payment-file");
  const paymentMessage = document.getElementById("admin-payment-message");
  const paymentSubmitBtn = document.getElementById("admin-payment-submit");
  const deleteModal = document.getElementById("admin-delete-modal");
  const deleteCloseBtn = document.getElementById("admin-delete-close");
  const deleteBody = document.getElementById("admin-delete-body");
  const deleteNote = document.getElementById("admin-delete-note");
  const deleteConfirmModal = document.getElementById("admin-delete-confirm-modal");
  const deleteConfirmText = document.getElementById("admin-delete-confirm-text");
  const deleteConfirmUsername = document.getElementById("admin-delete-confirm-username");
  const deleteConfirmCancel = document.getElementById("admin-delete-confirm-cancel");
  const deleteConfirmAccept = document.getElementById("admin-delete-confirm-accept");
  const requestsBadge = document.getElementById("admin-requests-badge");
  const renewalsBadge = document.getElementById("admin-renewals-badge");
  const requestsModal = document.getElementById("admin-requests-modal");
  const requestsCloseBtn = document.getElementById("admin-requests-close");
  const requestsBody = document.getElementById("admin-requests-body");
  const requestsNote = document.getElementById("admin-requests-note");
  const requestsSearchInput = document.getElementById("admin-requests-search");
  const requestsSearchBtn = document.getElementById("admin-requests-search-btn");

  const authState = getAuthState();
  if (!authState || authState.role !== "admin") {
    if (adminGuard) {
      adminGuard.hidden = false;
    }
    if (adminContent) {
      adminContent.hidden = true;
    }
  } else {
    if (adminGuard) {
      adminGuard.hidden = true;
    }
    if (adminContent) {
      adminContent.hidden = false;
    }
    if (adminUserEl) {
      adminUserEl.textContent = authState.username;
    }
    if (viewProgressBtn) {
      viewProgressBtn.hidden = !ENABLE_VIEW_PROGRESS;
    }
    if (progressModal && !ENABLE_VIEW_PROGRESS) {
      progressModal.classList.remove("is-open");
      progressModal.setAttribute("aria-hidden", "true");
    }

    const escapeHtml = (value) =>
      String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
    const DEVICE_ICON_SVGS = {
      pc: `
        <svg class="admin-device-icon" viewBox="0 0 24 24" aria-hidden="true">
          <rect x="3" y="4" width="18" height="12" rx="2" fill="none" stroke="currentColor" stroke-width="2"></rect>
          <rect x="9" y="18" width="6" height="2" fill="currentColor"></rect>
          <rect x="7" y="20" width="10" height="2" fill="currentColor"></rect>
        </svg>
      `,
      phone: `
        <svg class="admin-device-icon" viewBox="0 0 24 24" aria-hidden="true">
          <rect x="7" y="3" width="10" height="18" rx="2" fill="none" stroke="currentColor" stroke-width="2"></rect>
          <circle cx="12" cy="17" r="1" fill="currentColor"></circle>
        </svg>
      `,
      tablet: `
        <svg class="admin-device-icon" viewBox="0 0 24 24" aria-hidden="true">
          <rect x="5" y="3" width="14" height="18" rx="2" fill="none" stroke="currentColor" stroke-width="2"></rect>
          <circle cx="12" cy="18" r="0.9" fill="currentColor"></circle>
        </svg>
      `,
      unknown: `
        <svg class="admin-device-icon" viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"></circle>
          <circle cx="12" cy="12" r="2" fill="currentColor"></circle>
        </svg>
      `,
    };
    const DEVICE_LABELS = {
      pc: "PC",
      phone: "Phone",
      tablet: "Tablet",
      unknown: "Other",
    };
    const parseUserAgentSummary = (ua) => {
      const raw = String(ua || "").trim();
      if (!raw) {
        return "-";
      }
      const lower = raw.toLowerCase();
      const osMap = [
        { re: /windows nt 10\.0/i, label: "Windows 10" },
        { re: /windows nt 11\.0/i, label: "Windows 11" },
        { re: /windows nt 6\.3/i, label: "Windows 8.1" },
        { re: /windows nt 6\.2/i, label: "Windows 8" },
        { re: /windows nt 6\.1/i, label: "Windows 7" },
        { re: /windows nt 6\.0/i, label: "Windows Vista" },
        { re: /windows nt 5\.1/i, label: "Windows XP" },
        { re: /mac os x 10[_\\.](\d+)[_\\.](\d+)/i, label: (m) => `macOS 10.${m[1]}.${m[2]}` },
        { re: /mac os x 10[_\\.](\d+)/i, label: (m) => `macOS 10.${m[1]}` },
        { re: /iphone os (\d+)[_\\.](\d+)/i, label: (m) => `iOS ${m[1]}.${m[2]}` },
        { re: /ipad; cpu os (\d+)[_\\.](\d+)/i, label: (m) => `iPadOS ${m[1]}.${m[2]}` },
        { re: /android (\d+)(?:\.(\d+))?/i, label: (m) => `Android ${m[1]}${m[2] ? "." + m[2] : ""}` },
        { re: /linux/i, label: "Linux" },
      ];
      let osLabel = "Unknown OS";
      for (const entry of osMap) {
        const match = raw.match(entry.re);
        if (match) {
          osLabel = typeof entry.label === "function" ? entry.label(match) : entry.label;
          break;
        }
      }

      const browserMatchers = [
        { re: /edg\/(\d+)/i, label: (m) => `Edge ${m[1]}` },
        { re: /opr\/(\d+)/i, label: (m) => `Opera ${m[1]}` },
        { re: /chrome\/(\d+)/i, label: (m) => `Chrome ${m[1]}` },
        { re: /firefox\/(\d+)/i, label: (m) => `Firefox ${m[1]}` },
        { re: /version\/(\d+).+safari/i, label: (m) => `Safari ${m[1]}` },
      ];
      let browserLabel = "Unknown Browser";
      if (lower.includes("safari") && !lower.includes("chrome") && !lower.includes("chromium")) {
        const safariMatch = raw.match(/version\/(\d+)/i);
        if (safariMatch) {
          browserLabel = `Safari ${safariMatch[1]}`;
        }
      } else {
        for (const entry of browserMatchers) {
          const match = raw.match(entry.re);
          if (match) {
            browserLabel = entry.label(match);
            break;
          }
        }
      }
      return `${osLabel} / ${browserLabel}`;
    };
    const lessonCoverUrl = "https://i.pinimg.com/736x/71/dd/47/71dd4745ab21b90b5162c0f864fba8e7.jpg";
    let progressUsers = [];
    let enrollmentRequests = [];
    let renewalRequests = [];
    let paymentChecks = [];
    let paymentChecksByUsername = new Map();
    let deviceLog = [];
    let mentorsCache = [];
    let mentorEditId = "";
    let createModalCloseLockUntil = 0;
    let editTargetUsername = "";
    let userInfoTargetUsername = "";
    let userInfoTarget = null;
    let activeEnrollmentRequest = null;
    const generatedUsernames = new Set();
    let payloadUsersCache = [];
    let pendingEnrollmentRequests = 0;
  let knowledgeAttemptsExpanded = false;
  let knowledgeAttemptsCache = [];
  let adminUsernameFilterQuery = "";
  let adminRequestsSearchQuery = "";
  const KNOWLEDGE_TABLE_VISIBLE_ROWS = 4;
  const normalizeUsernameFilter = (value) => String(value || "").trim().toLowerCase();
  const normalizeRequestsFilter = (value) => String(value || "").trim().toLowerCase();
  const applyTableFilterByUsername = (rowSelector) => {
    const rows = document.querySelectorAll(rowSelector);
    rows.forEach((row) => {
      const rowUsername = normalizeUsernameFilter(row.dataset.username || "");
      const query = adminUsernameFilterQuery;
      const queryDigits = query.replace(/[^\d]/g, "");
      const rowPhoneDigits = String(row.dataset.phoneDigits || "").replace(/[^\d]/g, "");
      const usernameMatches = !query || rowUsername.includes(query);
      const phoneMatches = !!queryDigits && rowPhoneDigits.includes(queryDigits);
      const matches = !query || usernameMatches || phoneMatches;
      row.style.display = matches ? "" : "none";
    });
  };
  const applyRequestsFilter = () => {
    const rows = document.querySelectorAll("#admin-requests-body tr");
    rows.forEach((row) => {
      const rowUsername = normalizeUsernameFilter(row.dataset.username || "");
      const usernameMatches = !adminUsernameFilterQuery || rowUsername.includes(adminUsernameFilterQuery);
      const rowText = normalizeRequestsFilter(row.textContent || "");
      const searchMatches = !adminRequestsSearchQuery || rowText.includes(adminRequestsSearchQuery);
      row.style.display = usernameMatches && searchMatches ? "" : "none";
    });
  };
  const applyAdminUsernameFilters = () => {
    applyTableFilterByUsername("#admin-users-body tr[data-username]");
    applyTableFilterByUsername("#admin-knowledge-body tr[data-username]");
    applyTableFilterByUsername("#admin-level-table-a1 tr[data-username]");
    applyTableFilterByUsername("#admin-level-table-a2 tr[data-username]");
    applyTableFilterByUsername("#admin-level-table-b1 tr[data-username]");
    applyTableFilterByUsername("#admin-level-table-b2 tr[data-username]");
    applyRequestsFilter();
    applyTableFilterByUsername("#admin-renewals-body tr[data-username]");
    applyTableFilterByUsername("#admin-payments-body tr[data-username]");
    applyTableFilterByUsername("#admin-delete-body tr[data-username]");
  };

    const CYRILLIC_MAP = {
      а: "a",
      б: "b",
      в: "v",
      г: "g",
      д: "d",
      е: "e",
      ё: "e",
      ж: "zh",
      з: "z",
      и: "i",
      й: "i",
      к: "k",
      л: "l",
      м: "m",
      н: "n",
      о: "o",
      п: "p",
      р: "r",
      с: "s",
      т: "t",
      у: "u",
      ф: "f",
      х: "h",
      ц: "ts",
      ч: "ch",
      ш: "sh",
      щ: "shch",
      ы: "y",
      э: "e",
      ю: "yu",
      я: "ya",
      ъ: "",
      ь: "",
    };

    const transliterateToLatin = (value) =>
      String(value || "")
        .split("")
        .map((char) => {
          const lower = char.toLowerCase();
          if (/[a-z0-9]/.test(lower)) {
            return lower;
          }
          if (Object.prototype.hasOwnProperty.call(CYRILLIC_MAP, lower)) {
            return CYRILLIC_MAP[lower];
          }
          return "";
        })
        .join("");

    const buildUsernameBase = (fullName) => {
      const firstWord = String(fullName || "").trim().split(/\s+/)[0] || "";
      const latin = transliterateToLatin(firstWord);
      const cleaned = latin.replace(/[^a-z0-9]/g, "");
      return cleaned || "student";
    };

    const buildExistingUsernames = () => {
      const set = new Set();
      payloadUsersCache.forEach((item) => {
        const key = String(item.username || "").trim().toLowerCase();
        if (key) {
          set.add(key);
        }
      });
      (enrollmentRequests || []).forEach((item) => {
        const key = String(item.submitted_username || "").trim().toLowerCase();
        if (key) {
          set.add(key);
        }
      });
      generatedUsernames.forEach((key) => set.add(String(key || "").toLowerCase()));
      return set;
    };

    const generateRandomDigits = (length) => {
      const digits = [];
      for (let i = 0; i < length; i += 1) {
        digits.push(Math.floor(Math.random() * 10));
      }
      return digits.join("");
    };

    const generateUsername = (fullName) => {
      const base = buildUsernameBase(fullName);
      const existing = buildExistingUsernames();
      for (let i = 0; i < 12; i += 1) {
        const candidate = `${base}${generateRandomDigits(5)}`;
        const key = candidate.toLowerCase();
        if (!existing.has(key)) {
          generatedUsernames.add(key);
          return candidate;
        }
      }
      const fallback = `${base}${Date.now().toString().slice(-6)}`;
      generatedUsernames.add(fallback.toLowerCase());
      return fallback;
    };

    const generatePassword = () => {
      const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
      const length = 8;
      let result = "";
      for (let i = 0; i < length; i += 1) {
        result += chars[Math.floor(Math.random() * chars.length)];
      }
      return result;
    };

    const getRequestLevelValue = (item) => {
      const rawLevel = String(item && item.level ? item.level : "").trim().toLowerCase();
      const priceMeta = parseExpressPriceLabel(item && item.price_label ? item.price_label : "");
      if (!rawLevel) {
        return priceMeta.isExpress ? "a1-express" : "a1";
      }
      const base = normalizeCourseLevel(rawLevel) || rawLevel;
      const shouldExpress = priceMeta.isExpress || isExpressLevel(rawLevel);
      if (shouldExpress) {
        return `${base}-express`;
      }
      return rawLevel;
    };
	    const hasPaymentApproval = (username) => {
	      const key = String(username || "").trim().toLowerCase();
	      if (!key) {
	        return false;
	      }
	      const items = paymentChecksByUsername.get(key);
	      return Array.isArray(items) && items.length > 0;
	    };
	    const getCreateRoleValue = () => {
	      const raw = createRoleInput ? String(createRoleInput.value || "").trim().toLowerCase() : "";
	      return raw === "mentor" ? "mentor" : "student";
	    };
	    const formatMentorStudentCount = (count) => {
	      const safeCount = Math.max(0, Number(count) || 0);
	      return `${safeCount} ${safeCount === 1 ? "student" : "students"}`;
	    };
	    const refreshCreateMentorOptions = async () => {
	      if (!createMentorInput || !createLevelInput) {
	        return;
	      }
	      if (!authState || !authState.username) {
	        return;
	      }
	      if (getCreateRoleValue() !== "student") {
	        return;
	      }
	      const targetLevel = normalizeCourseLevel(createLevelInput.value);
	      if (!targetLevel) {
	        return;
	      }
	      createMentorInput.disabled = true;
	      createMentorInput.setAttribute("aria-disabled", "true");
	      createMentorInput.innerHTML = "<option value=\"\">Loading mentors...</option>";
	      const loaded = await loadMentors({ render: false, silent: true });
	      if (!loaded) {
	        createMentorInput.disabled = true;
	        createMentorInput.setAttribute("aria-disabled", "true");
	        createMentorInput.innerHTML = "<option value=\"\">Failed to load mentors</option>";
	        return;
	      }
	      const items = (Array.isArray(mentorsCache) ? mentorsCache : [])
	        .filter((mentor) => normalizeCourseLevel(mentor && mentor.level ? mentor.level : "") === targetLevel)
	        .slice()
	        .sort((a, b) => {
	          const aCount = Number(a && a.student_count ? a.student_count : 0);
	          const bCount = Number(b && b.student_count ? b.student_count : 0);
	          if (aCount !== bCount) {
	            return aCount - bCount;
	          }
	          return String(a && a.name ? a.name : "").localeCompare(String(b && b.name ? b.name : ""));
	        });

	      const previousValue = String(createMentorInput.value || "").trim();
	      createMentorInput.innerHTML = "<option value=\"\">Choose Mentor</option>";
	      if (!items.length) {
	        createMentorInput.disabled = true;
	        createMentorInput.setAttribute("aria-disabled", "true");
	        createMentorInput.innerHTML = "<option value=\"\">No mentors for this level</option>";
	        return;
	      }
	      items.forEach((mentor) => {
	        const option = document.createElement("option");
	        option.value = String(mentor.id || "");
	        const countLabel = formatMentorStudentCount(mentor.student_count);
	        option.textContent = `${mentor.name || "Mentor"} — ${countLabel}`;
	        createMentorInput.appendChild(option);
	      });
	      createMentorInput.disabled = false;
	      createMentorInput.setAttribute("aria-disabled", "false");

	      const hasPrevious = items.some((mentor) => String(mentor.id || "") === previousValue);
	      if (previousValue && hasPrevious) {
	        createMentorInput.value = previousValue;
	      } else {
	        createMentorInput.value = String(items[0].id || "");
	      }
	    };
	    const resetCreateProfilePhotoState = () => {
	      if (createProfilePhotoInput) {
	        createProfilePhotoInput.value = "";
	      }
	      if (createProfilePhotoMessage) {
	        createProfilePhotoMessage.textContent = "";
	        createProfilePhotoMessage.classList.remove("is-success");
	      }
	    };
	    const syncCreateRoleState = () => {
	      const role = getCreateRoleValue();
	      const isMentor = role === "mentor";
	      if (createSecondNameInput) {
	        createSecondNameInput.classList.toggle("is-hidden", !isMentor);
	        if (!isMentor) {
	          createSecondNameInput.value = "";
	        }
	      }
	      if (createMentorInput) {
	        createMentorInput.classList.toggle("is-hidden", isMentor);
	      }
	      if (createPaymentApprovalBtn) {
	        createPaymentApprovalBtn.textContent = isMentor ? "Profile Photo" : "Payment Approval";
	      }
	      if (createProfilePhotoMessage) {
	        createProfilePhotoMessage.classList.toggle("is-hidden", !isMentor);
	      }
	      if (createScheduleGroup) {
	        if (isMentor) {
	          createScheduleGroup.classList.add("is-hidden");
	        } else {
	          createScheduleGroup.classList.remove("is-hidden");
	        }
	      }
	      if (!isMentor) {
	        Promise.resolve().then(() => refreshCreateMentorOptions());
	        resetCreateProfilePhotoState();
	      }
	      syncCreateScheduleState();
	    };
		    const syncCreateApprovalState = () => {
		      if (!createSubmitBtn) {
		        return;
		      }
		      const createMode = createModal && createModal.dataset ? String(createModal.dataset.mode || "") : "";
	      if (createMode === "manual") {
	        createSubmitBtn.classList.remove("is-disabled");
	        createSubmitBtn.setAttribute("aria-disabled", "false");
	        createSubmitBtn.disabled = false;
	        return;
	      }
	      const username = createUsernameInput ? createUsernameInput.value.trim() : "";
	      const approved = hasPaymentApproval(username);
	      if (approved) {
	        createSubmitBtn.classList.remove("is-disabled");
	        createSubmitBtn.setAttribute("aria-disabled", "false");
	        createSubmitBtn.disabled = false;
	      } else {
	        createSubmitBtn.classList.add("is-disabled");
	        createSubmitBtn.setAttribute("aria-disabled", "true");
	        createSubmitBtn.disabled = true;
	      }
	    };

	    const syncCreateScheduleState = () => {
	      if (!createScheduleInput || !createLevelInput) {
	        return;
	      }
	      if (getCreateRoleValue() === "mentor") {
	        createScheduleInput.disabled = true;
	        createScheduleInput.setAttribute("aria-disabled", "true");
	        if (createScheduleGroup) {
	          createScheduleGroup.classList.add("is-hidden");
	        }
	        return;
	      }
	      if (activeEnrollmentRequest) {
	        createScheduleInput.disabled = true;
	        createScheduleInput.setAttribute("aria-disabled", "true");
	        if (createScheduleGroup) {
          createScheduleGroup.classList.add("is-hidden");
        }
        return;
      }
      const expressLevel = isExpressLevel(createLevelInput.value);
      if (expressLevel) {
        createScheduleInput.value = "mwf";
        createScheduleInput.disabled = true;
        createScheduleInput.setAttribute("aria-disabled", "true");
        if (createScheduleGroup) {
          createScheduleGroup.classList.add("is-hidden");
        }
      } else {
        createScheduleInput.disabled = false;
        createScheduleInput.setAttribute("aria-disabled", "false");
        if (createScheduleGroup) {
          createScheduleGroup.classList.remove("is-hidden");
        }
      }
    };

    const syncEditScheduleState = () => {
      if (!editScheduleInput || !editLevelInput) {
        return;
      }
      const expressLevel = isExpressLevel(editLevelInput.value);
      if (expressLevel) {
        editScheduleInput.value = "mwf";
        editScheduleInput.disabled = true;
        editScheduleInput.setAttribute("aria-disabled", "true");
      } else {
        editScheduleInput.disabled = false;
        editScheduleInput.setAttribute("aria-disabled", "false");
      }
    };

    const updateRequestsBadge = (count) => {
      if (!requestsBadge) {
        return;
      }
      const safeCount = Math.max(0, Number(count) || 0);
      requestsBadge.textContent = safeCount > 99 ? "99+" : String(safeCount);
      requestsBadge.hidden = safeCount <= 0;
    };

    const updateRenewalsBadge = (count) => {
      if (!renewalsBadge) {
        return;
      }
      const safeCount = Math.max(0, Number(count) || 0);
      renewalsBadge.textContent = safeCount > 99 ? "99+" : String(safeCount);
      renewalsBadge.hidden = safeCount <= 0;
    };

    const updateManageBadge = (count) => {
      if (!manageBadge) {
        return;
      }
      const safeCount = Math.max(0, Number(count) || 0);
      manageBadge.textContent = safeCount > 99 ? "99+" : String(safeCount);
      manageBadge.hidden = safeCount <= 0;
    };
    const renderUsers = (users) => {
      if (!usersTableBody) {
        return;
      }
      usersTableBody.innerHTML = "";
      users.forEach((user) => {
        const row = document.createElement("tr");
        const usernameValue = String(user.username || "").trim();
        const usernameKey = usernameValue.toLowerCase();
        row.dataset.username = usernameKey;
        row.dataset.targetUsername = usernameValue;
        row.dataset.phoneDigits = String(user.phone || "").replace(/[^\d]/g, "");
        const levelLabel = formatLevelLabel(user.level || "");
        const scheduleLabel = formatScheduleLabel(user.lesson_schedule || "", user.level || "");
        const paymentChecksForUser = paymentChecksByUsername.get(usernameKey) || [];
        let paymentCell = "-";
        if (paymentChecksForUser.length && authState && authState.username) {
          const links = paymentChecksForUser
            .map((item, index) => {
              if (!item || !item.id) {
                return "";
              }
              const paymentLink = `${API_BASE_URL}/api/admin/payment-checks/file?session_token=${encodeURIComponent(
                authState.sessionToken || ""
              )}&id=${encodeURIComponent(item.id)}`;
              return `<a href="${paymentLink}" target="_blank" rel="noopener">Open #${index + 1}</a>`;
            })
            .filter(Boolean);
          if (links.length) {
            paymentCell = links.join("<br>");
          }
        }
        const infoBtn = `<button type="button" class="btn admin-user-info-btn">More info</button>`;
        row.innerHTML = `
          <td>${escapeHtml(user.full_name || "-")}</td>
          <td>${escapeHtml(levelLabel || "-")}</td>
          <td>${escapeHtml(usernameValue || "-")}</td>
          <td>${escapeHtml(scheduleLabel)}</td>
          <td>${escapeHtml(user.phone || "-")}</td>
          <td>${escapeHtml(user.role || "-")}</td>
          <td>${escapeHtml(user.created_at || "-")}</td>
          <td>${paymentCell}</td>
          <td>${infoBtn}</td>
        `;
        usersTableBody.appendChild(row);
      });
      applyAdminUsernameFilters();
    };

    const renderDeleteUsers = (users) => {
      if (!deleteBody || !deleteNote) {
        return;
      }
      deleteBody.innerHTML = "";
      if (!Array.isArray(users) || users.length === 0) {
        deleteNote.textContent = "No users available.";
        return;
      }
      deleteNote.textContent = `Users: ${users.length}`;
      users.forEach((user) => {
        const row = document.createElement("tr");
        row.dataset.username = String(user.username || "").trim().toLowerCase();
        row.dataset.targetUsername = String(user.username || "").trim();
        const isAdmin = String(user.role || "").toLowerCase() === "admin";
        const levelLabel = formatLevelLabel(user.level || "");
        row.innerHTML = `
          <td>${escapeHtml(user.full_name || "-")}</td>
          <td>${escapeHtml(levelLabel || "-")}</td>
          <td>${escapeHtml(user.username || "-")}</td>
          <td>${escapeHtml(user.role || "-")}</td>
          <td>
            <button type="button" class="btn admin-delete-btn" ${isAdmin ? "disabled" : ""}>Delete</button>
          </td>
        `;
        deleteBody.appendChild(row);
      });
      applyAdminUsernameFilters();
    };

    const renderLevelTables = (levelTables) => {
      const levelWrapMap = {
        a1: levelTableA1,
        a2: levelTableA2,
        b1: levelTableB1,
        b2: levelTableB2,
      };

      const order = ["a1", "a2", "b1", "b2"];
      const hasAnyContainer = order.some((level) => !!levelWrapMap[level]);
      if (!hasAnyContainer) {
        return;
      }

      order.forEach((level) => {
        const container = levelWrapMap[level];
        if (!container) {
          return;
        }

        container.innerHTML = "";

        const payload = levelTables[level] || { lesson_count: 0, users: [] };
        const lessonCount = Number(payload.lesson_count) || 0;
        const users = Array.isArray(payload.users) ? payload.users : [];

        if (users.length === 0) {
          const empty = document.createElement("p");
          empty.className = "admin-empty-note";
          empty.textContent = "No students for this level yet.";
          container.appendChild(empty);
          return;
        }

        const tableWrap = document.createElement("div");
        tableWrap.className = "admin-table-wrap";
        const table = document.createElement("table");
        table.className = "admin-table";

        let headHtml = "<tr><th>Name</th><th>User</th><th>Password</th><th>Date of Registration</th>";
        for (let i = 1; i <= lessonCount; i += 1) {
          headHtml += `<th>L${i}</th>`;
        }
        headHtml += "</tr>";

        const thead = document.createElement("thead");
        thead.innerHTML = headHtml;
        table.appendChild(thead);

        const tbody = document.createElement("tbody");
        users.forEach((user) => {
          const row = document.createElement("tr");
          row.dataset.username = String(user.user || "").trim().toLowerCase();
          let rowHtml = `
            <td>${escapeHtml(user.name || "-")}</td>
            <td>${escapeHtml(user.user || "-")}</td>
            <td>${escapeHtml(user.created_at || "-")}</td>
          `;
          for (let i = 1; i <= lessonCount; i += 1) {
            rowHtml += `<td>${user.lessons && user.lessons[String(i)] ? "✓" : "-"}</td>`;
          }
          row.innerHTML = rowHtml;
          tbody.appendChild(row);
        });

        table.appendChild(tbody);
        tableWrap.appendChild(table);
        container.appendChild(tableWrap);
      });
      applyAdminUsernameFilters();
    };

    const renderKnowledgeAttempts = (attempts) => {
      if (!knowledgeTableBody) {
        return;
      }
      knowledgeAttemptsCache = Array.isArray(attempts) ? attempts : [];
      const visibleAttempts = knowledgeAttemptsExpanded
        ? knowledgeAttemptsCache
        : knowledgeAttemptsCache.slice(0, KNOWLEDGE_TABLE_VISIBLE_ROWS);
      knowledgeTableBody.innerHTML = "";
      visibleAttempts.forEach((attempt) => {
        const row = document.createElement("tr");
        row.dataset.username = String(attempt.username || "").trim().toLowerCase();
        row.innerHTML = `
          <td>${escapeHtml(attempt.username || "-")}</td>
          <td>${escapeHtml(attempt.correct_answers || 0)}</td>
          <td>${escapeHtml(attempt.total_questions || 0)}</td>
          <td>${escapeHtml(attempt.score_points || 0)}</td>
          <td>${escapeHtml((attempt.recommended_level || "-").toUpperCase())}</td>
          <td>${escapeHtml(attempt.submitted_at || "-")}</td>
        `;
        knowledgeTableBody.appendChild(row);
      });
      if (knowledgeToggleBtn) {
        const hasMore = knowledgeAttemptsCache.length > KNOWLEDGE_TABLE_VISIBLE_ROWS;
        knowledgeToggleBtn.hidden = !hasMore;
        knowledgeToggleBtn.textContent = knowledgeAttemptsExpanded ? "Collapse table" : "Expand table";
      }
      applyAdminUsernameFilters();
    };

    const renderEnrollmentRequests = (items) => {
      if (!requestsBody || !requestsNote) {
        return;
      }
      requestsBody.innerHTML = "";
      if (!Array.isArray(items) || items.length === 0) {
        requestsNote.textContent = "No purchase requests yet.";
        return;
      }
      requestsNote.textContent = `Requests: ${items.length}`;
      items.forEach((item) => {
        const priceMeta = parseExpressPriceLabel(item.price_label || "");
        const levelBase = formatLevelLabel(item.level || "-");
        const levelLabel = priceMeta.isExpress && levelBase && !/express/i.test(levelBase) && levelBase !== "-"
          ? `${levelBase} Express`
          : levelBase;
        const priceLabel = priceMeta.price || item.price_label || "-";
        const scheduleLabel = formatScheduleLabel(item.lesson_schedule || "", item.level || "");
        const row = document.createElement("tr");
        const isDone = Number(item.seen_by_admin || 0) === 1;
        const actionHtml = isDone
          ? `<span class="admin-requests-status">Created</span>`
          : `<span class="admin-requests-status">Pending</span>`;
        row.className = `admin-requests-row${isDone ? " is-done" : ""}`;
        row.dataset.username = String(item.submitted_username || "").trim().toLowerCase();
        row.dataset.requestId = String(item.id || "").trim();
        row.innerHTML = `
          <td>${escapeHtml(item.full_name || "-")}</td>
          <td>${escapeHtml(item.phone || "-")}</td>
          <td>${escapeHtml(item.telegram_username ? `@${item.telegram_username}` : "-")}</td>
          <td>${escapeHtml(levelLabel)}</td>
          <td>${escapeHtml(scheduleLabel)}</td>
          <td>${escapeHtml(priceLabel)}</td>
          <td>${escapeHtml(item.submitted_username || "-")}</td>
          <td>${escapeHtml(item.created_at || "-")}</td>
          <td class="admin-requests-done-cell">
            ${actionHtml}
          </td>
        `;
        requestsBody.appendChild(row);
      });
      applyAdminUsernameFilters();
    };

    const renderCreateQueue = (items) => {
      if (!createQueueList || !createQueueNote) {
        return;
      }
      createQueueList.innerHTML = "";
      const pendingItems = Array.isArray(items)
        ? items.filter((item) => Number(item && item.seen_by_admin || 0) !== 1)
        : [];
      if (!pendingItems.length) {
        createQueueNote.textContent = "No purchase requests yet.";
        return;
      }
      createQueueNote.textContent = `Requests: ${pendingItems.length}`;
      pendingItems.forEach((item) => {
        const priceMeta = parseExpressPriceLabel(item.price_label || "");
        const levelBase = formatLevelLabel(item.level || "-");
        const levelLabel = priceMeta.isExpress && levelBase && !/express/i.test(levelBase) && levelBase !== "-"
          ? `${levelBase} Express`
          : levelBase;
        const scheduleLabel = formatScheduleLabel(item.lesson_schedule || "", item.level || "");
        const card = document.createElement("article");
        card.className = "admin-create-queue-card";
        card.dataset.requestId = String(item.id || "");
        card.dataset.username = String(item.submitted_username || "").trim().toLowerCase();
        const submittedUsername = String(item.submitted_username || "").trim();
        const actionHtml = `
          <button type="button" class="btn admin-create-queue-delete-btn">Delete</button>
          <button type="button" class="btn admin-create-queue-create-btn">Create</button>
        `;
        card.innerHTML = `
          <div class="admin-create-queue-header">
            <h4>${escapeHtml(item.full_name || "-")}</h4>
          </div>
          ${submittedUsername ? `<p class="admin-create-queue-meta">Username: ${escapeHtml(submittedUsername)}</p>` : ""}
          <p class="admin-create-queue-meta">Phone: ${escapeHtml(item.phone || "-")}</p>
          <p class="admin-create-queue-meta">Telegram: ${escapeHtml(item.telegram_username ? `@${item.telegram_username}` : "-")}</p>
          <p class="admin-create-queue-meta">Level: ${escapeHtml(levelLabel || "-")}</p>
          <p class="admin-create-queue-meta">Schedule: ${escapeHtml(scheduleLabel)}</p>
          <div class="admin-create-queue-actions">
            ${actionHtml}
          </div>
        `;
        createQueueList.appendChild(card);
      });
      applyAdminUsernameFilters();
    };

    const renderDeviceLog = (items) => {
      if (!devicesBody || !devicesNote) {
        return;
      }
      devicesBody.innerHTML = "";
      if (!Array.isArray(items) || items.length === 0) {
        devicesNote.textContent = "No device data yet.";
        return;
      }
      const deviceMap = new Map();
      items.forEach((item) => {
        const username = String(item.username || "").trim() || "-";
        const key = username.toLowerCase();
        const deviceTypeRaw = String(item.device_type || "unknown").toLowerCase();
        const deviceType = ["pc", "phone", "tablet", "unknown"].includes(deviceTypeRaw) ? deviceTypeRaw : "unknown";
        const lastSeen = String(item.last_seen_at || "").trim();
        const entry = deviceMap.get(key) || {
          username,
          deviceCount: 0,
          types: {},
          lastSeen: "",
          devices: [],
        };
        entry.deviceCount += 1;
        entry.types[deviceType] = (entry.types[deviceType] || 0) + 1;
        if (!entry.lastSeen || (lastSeen && lastSeen > entry.lastSeen)) {
          entry.lastSeen = lastSeen;
        }
        entry.devices.push({
          username,
          deviceType,
          firstSeen: String(item.first_seen_at || "").trim(),
          lastSeen,
          loginCount: Number(item.login_count || 0),
          lastIp: String(item.last_ip || "").trim(),
          city: String(item.city || "").trim(),
          region: String(item.region || "").trim(),
          country: String(item.country || "").trim(),
          timezone: String(item.timezone || "").trim(),
          org: String(item.org || "").trim(),
          userAgent: String(item.user_agent || "").trim(),
        });
        deviceMap.set(key, entry);
      });

      const rows = Array.from(deviceMap.values()).sort((a, b) => (b.lastSeen || "").localeCompare(a.lastSeen || ""));
      devicesNote.textContent = `Users: ${rows.length}`;

      rows.forEach((entry) => {
        const typeCounters = { pc: 0, phone: 0, tablet: 0, unknown: 0 };
        const deviceList = document.createElement("div");
        deviceList.className = "admin-device-list";
        const sortedDevices = [...entry.devices].sort((a, b) => (b.lastSeen || "").localeCompare(a.lastSeen || ""));
        sortedDevices.forEach((device) => {
          const type = device.deviceType;
          typeCounters[type] = (typeCounters[type] || 0) + 1;
          const label = `${DEVICE_LABELS[type]} ${typeCounters[type]}`;
          const button = document.createElement("button");
          button.type = "button";
          button.className = `admin-device-chip admin-device-chip--${type} admin-device-chip-btn`;
          button.innerHTML = `${DEVICE_ICON_SVGS[type] || ""}<span></span>`;
          const labelSpan = button.querySelector("span");
          if (labelSpan) {
            labelSpan.textContent = label;
          }
          button.dataset.username = device.username;
          button.dataset.deviceType = type;
          button.dataset.firstSeen = device.firstSeen || "-";
          button.dataset.lastSeen = device.lastSeen || "-";
          button.dataset.loginCount = String(device.loginCount || 0);
          button.dataset.lastIp = device.lastIp || "-";
          button.dataset.city = device.city || "";
          button.dataset.region = device.region || "";
          button.dataset.country = device.country || "";
          button.dataset.timezone = device.timezone || "";
          button.dataset.org = device.org || "";
          button.dataset.userAgent = device.userAgent || "-";
          deviceList.appendChild(button);
        });

        const row = document.createElement("tr");
        const usernameCell = document.createElement("td");
        usernameCell.textContent = entry.username || "-";
        const countCell = document.createElement("td");
        countCell.textContent = String(entry.deviceCount || 0);
        const typesCell = document.createElement("td");
        if (deviceList.children.length) {
          typesCell.appendChild(deviceList);
        } else {
          typesCell.textContent = "-";
        }
        const lastSeenCell = document.createElement("td");
        lastSeenCell.textContent = entry.lastSeen || "-";
        row.appendChild(usernameCell);
        row.appendChild(countCell);
        row.appendChild(typesCell);
        row.appendChild(lastSeenCell);
        devicesBody.appendChild(row);
      });
    };

    const renderRenewalRequests = (items) => {
      if (!renewalsBody || !renewalsNote) {
        return;
      }
      renewalsBody.innerHTML = "";
      if (!Array.isArray(items) || items.length === 0) {
        renewalsNote.textContent = "No renewal requests yet.";
        return;
      }
      renewalsNote.textContent = `Requests: ${items.length}`;
      items.forEach((item) => {
        const priceMeta = parseExpressPriceLabel(item.price_label || "");
        const levelBase = formatLevelLabel(item.level || "-");
        const levelLabel = priceMeta.isExpress && levelBase && !/express/i.test(levelBase) && levelBase !== "-"
          ? `${levelBase} Express`
          : levelBase;
        const priceLabel = priceMeta.price || item.price_label || "-";
        const row = document.createElement("tr");
        row.dataset.username = String(item.submitted_username || item.username || "").trim().toLowerCase();
        row.dataset.targetUsername = String(item.submitted_username || item.username || "").trim();
        row.dataset.renewalId = String(item.id || "").trim();
        row.innerHTML = `
          <td>${escapeHtml(item.full_name || "-")}</td>
          <td>${escapeHtml(item.phone || "-")}</td>
          <td>${escapeHtml(item.telegram_username ? `@${item.telegram_username}` : "-")}</td>
          <td>${escapeHtml(levelLabel)}</td>
          <td>${escapeHtml(priceLabel)}</td>
          <td>${escapeHtml(item.submitted_username || item.username || "-")}</td>
          <td>
            <div class="admin-renewals-actions">
              <button type="button" class="btn admin-renewals-action-btn admin-renewals-check-btn">Check</button>
              <button type="button" class="btn admin-renewals-action-btn is-primary admin-renewals-extend-btn">Extend</button>
            </div>
          </td>
        `;
        renewalsBody.appendChild(row);
      });
      applyAdminUsernameFilters();
    };

    const renderPaymentChecks = (items) => {
      if (!paymentsBody) {
        return;
      }
      paymentsBody.innerHTML = "";
      if (!Array.isArray(items) || items.length === 0) {
        return;
      }
      items.forEach((item) => {
        const row = document.createElement("tr");
        row.dataset.username = String(item.username || "").trim().toLowerCase();
        const fileLink = item.id && authState && authState.username
          ? `${API_BASE_URL}/api/admin/payment-checks/file?session_token=${encodeURIComponent(authState.sessionToken || "")}&id=${encodeURIComponent(item.id)}`
          : "";
        const fileCell = fileLink
          ? `<a href="${fileLink}" target="_blank" rel="noopener">Open</a>`
          : escapeHtml(item.original_name || "-");
        row.innerHTML = `
          <td>${escapeHtml(item.username || "-")}</td>
          <td>${escapeHtml(item.payment_date || "-")}</td>
          <td>${fileCell}</td>
        `;
        paymentsBody.appendChild(row);
      });
      applyAdminUsernameFilters();
    };

    const loadDeviceLog = async () => {
      if (!authState || !devicesNote) {
        return;
      }
      devicesNote.textContent = "Loading devices...";
      try {
        const response = await adminFetchRaw(
          `${API_BASE_URL}/api/admin/device-log`
        );
        if (!response.ok) {
          devicesNote.textContent = "Failed to load device log.";
          return;
        }
        const payload = await response.json();
        deviceLog = Array.isArray(payload.items) ? payload.items : [];
        renderDeviceLog(deviceLog);
      } catch (error) {
        devicesNote.textContent = "Failed to load device log.";
      }
    };

    const closeProgressModal = () => {
      if (!progressModal) {
        return;
      }
      progressModal.classList.remove("is-open");
      progressModal.setAttribute("aria-hidden", "true");
      syncModalBodyScroll();
    };

    const openProgressModal = () => {
      if (!ENABLE_VIEW_PROGRESS) {
        return;
      }
      if (!progressModal) {
        return;
      }
      progressModal.classList.add("is-open");
      progressModal.setAttribute("aria-hidden", "false");
      syncModalBodyScroll();
      if (progressNote) {
        progressNote.textContent = "Select a student to view lesson progress.";
      }
      if (progressLessons) {
        progressLessons.innerHTML = "";
      }
      if (progressTitle) {
        progressTitle.textContent = "Student Progress";
      }
      renderProgressUsers(progressUsers);
    };

    const closeRequestsModal = () => {
      if (!requestsModal) {
        return;
      }
      requestsModal.classList.remove("is-open");
      requestsModal.setAttribute("aria-hidden", "true");
      syncModalBodyScroll();
    };

    const markEnrollmentRequestsSeen = async () => {
      try {
        const response = await adminFetchRaw(`${API_BASE_URL}/api/admin/enrollment-requests/mark-seen`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            admin_username: authState.username,
          }),
        });
        if (!response.ok) {
          return;
        }
        pendingEnrollmentRequests = 0;
        enrollmentRequests = (enrollmentRequests || []).map((item) => ({ ...item, seen_by_admin: 1 }));
        updateRequestsBadge(0);
      } catch (error) {
        // Ignore marking errors and keep UI data as-is.
      }
    };

    const markEnrollmentRequestDone = async (requestId) => {
      if (!requestId) {
        return { ok: false };
      }
      try {
        const response = await adminFetchRaw(`${API_BASE_URL}/api/admin/enrollment-requests/mark-one`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            admin_username: authState.username,
            request_id: requestId,
          }),
        });
        if (!response.ok) {
          return { ok: false };
        }
        const payload = await response.json();
        return {
          ok: true,
          pendingCount: Number(payload.pending_count),
        };
      } catch (error) {
        return { ok: false };
      }
    };

    const deleteEnrollmentRequest = async (requestId) => {
      if (!requestId) {
        return { ok: false };
      }
      try {
        const response = await adminFetchRaw(`${API_BASE_URL}/api/admin/enrollment-requests/delete`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            admin_username: authState.username,
            request_id: requestId,
          }),
        });
        if (!response.ok) {
          return { ok: false };
        }
        const payload = await response.json();
        return {
          ok: true,
          pendingCount: Number(payload.pending_count),
        };
      } catch (error) {
        return { ok: false };
      }
    };

    const openRequestsModal = async () => {
      if (!requestsModal) {
        return;
      }
      renderEnrollmentRequests(enrollmentRequests);
      requestsModal.classList.add("is-open");
      requestsModal.setAttribute("aria-hidden", "false");
      syncModalBodyScroll();
    };

    const openCreateQueueModal = () => {
      if (!createQueueModal) {
        return;
      }
      renderCreateQueue(enrollmentRequests);
      createQueueModal.classList.add("is-open");
      createQueueModal.setAttribute("aria-hidden", "false");
      syncModalBodyScroll();
    };

    const closeCreateQueueModal = () => {
      if (!createQueueModal) {
        return;
      }
      createQueueModal.classList.remove("is-open");
      createQueueModal.setAttribute("aria-hidden", "true");
      syncModalBodyScroll();
    };

    const openDevicesModal = async () => {
      if (!devicesModal) {
        return;
      }
      devicesModal.classList.add("is-open");
      devicesModal.setAttribute("aria-hidden", "false");
      syncModalBodyScroll();
      await loadDeviceLog();
    };

    const openDeviceDetailModal = (payload) => {
      if (!deviceDetailModal) {
        return;
      }
      if (deviceDetailUsername) deviceDetailUsername.textContent = payload.username || "-";
      if (deviceDetailType) deviceDetailType.textContent = DEVICE_LABELS[payload.deviceType] || "Other";
      if (deviceDetailFirst) deviceDetailFirst.textContent = payload.firstSeen || "-";
      if (deviceDetailLast) deviceDetailLast.textContent = payload.lastSeen || "-";
      if (deviceDetailCount) deviceDetailCount.textContent = payload.loginCount || "0";
      if (deviceDetailIp) deviceDetailIp.textContent = payload.lastIp || "-";
      if (deviceDetailLocation) deviceDetailLocation.textContent = payload.location || "-";
      if (deviceDetailTimezone) deviceDetailTimezone.textContent = payload.timezone || "-";
      if (deviceDetailOrg) deviceDetailOrg.textContent = payload.org || "-";
      if (deviceDetailAgent) deviceDetailAgent.textContent = parseUserAgentSummary(payload.userAgent || "");
      if (deviceDetailUa) deviceDetailUa.textContent = payload.userAgent || "-";
      deviceDetailModal.classList.add("is-open");
      deviceDetailModal.setAttribute("aria-hidden", "false");
      syncModalBodyScroll();
    };

    const closeDeviceDetailModal = () => {
      if (!deviceDetailModal) {
        return;
      }
      deviceDetailModal.classList.remove("is-open");
      deviceDetailModal.setAttribute("aria-hidden", "true");
      syncModalBodyScroll();
    };

    const closeDevicesModal = () => {
      if (!devicesModal) {
        return;
      }
      devicesModal.classList.remove("is-open");
      devicesModal.setAttribute("aria-hidden", "true");
      syncModalBodyScroll();
    };

    const openManageModal = () => {
      if (!manageModal) {
        return;
      }
      manageModal.classList.add("is-open");
      manageModal.setAttribute("aria-hidden", "false");
      syncModalBodyScroll();
    };

    const closeManageModal = () => {
      if (!manageModal) {
        return;
      }
      manageModal.classList.remove("is-open");
      manageModal.setAttribute("aria-hidden", "true");
      syncModalBodyScroll();
    };

    const openRenewalsModal = () => {
      if (!renewalsModal) {
        return;
      }
      renderRenewalRequests(renewalRequests);
      renewalsModal.classList.add("is-open");
      renewalsModal.setAttribute("aria-hidden", "false");
      syncModalBodyScroll();
    };

    const openDeleteModal = () => {
      if (!deleteModal) {
        return;
      }
      renderDeleteUsers(payloadUsersCache);
      deleteModal.classList.add("is-open");
      deleteModal.setAttribute("aria-hidden", "false");
      syncModalBodyScroll();
    };

    const closeDeleteModal = () => {
      if (!deleteModal) {
        return;
      }
      deleteModal.classList.remove("is-open");
      deleteModal.setAttribute("aria-hidden", "true");
      syncModalBodyScroll();
    };

    const openDeleteConfirmModal = (username) => {
      if (!deleteConfirmModal) {
        return;
      }
      if (deleteConfirmUsername) {
        deleteConfirmUsername.textContent = username || "-";
      }
      deleteConfirmModal.dataset.username = username || "";
      deleteConfirmModal.classList.add("is-open");
      deleteConfirmModal.setAttribute("aria-hidden", "false");
      syncModalBodyScroll();
    };

    const closeDeleteConfirmModal = () => {
      if (!deleteConfirmModal) {
        return;
      }
      deleteConfirmModal.classList.remove("is-open");
      deleteConfirmModal.setAttribute("aria-hidden", "true");
      syncModalBodyScroll();
    };

    const openPaymentsModal = async () => {
      if (!paymentsModal) {
        return;
      }
      paymentsModal.classList.add("is-open");
      paymentsModal.setAttribute("aria-hidden", "false");
      syncModalBodyScroll();
      await loadPaymentChecks();
    };

    const closePaymentsModal = () => {
      if (!paymentsModal) {
        return;
      }
      paymentsModal.classList.remove("is-open");
      paymentsModal.setAttribute("aria-hidden", "true");
      syncModalBodyScroll();
    };

    const loadPaymentChecks = async () => {
      if (!authState || !authState.username) {
        return;
      }
      try {
        const response = await adminFetchRaw(`${API_BASE_URL}/api/admin/payment-checks`);
        if (!response.ok) {
          return;
        }
        const payload = await response.json();
        paymentChecks = Array.isArray(payload.items) ? payload.items : [];
        const nextMap = new Map();
        paymentChecks.forEach((item) => {
          const key = String(item.username || "").trim().toLowerCase();
          if (!key) {
            return;
          }
          if (!nextMap.has(key)) {
            nextMap.set(key, []);
          }
          nextMap.get(key).push(item);
        });
        paymentChecksByUsername = nextMap;
        renderPaymentChecks(paymentChecks);
        if (payloadUsersCache.length) {
          renderUsers(payloadUsersCache);
        }
        syncCreateApprovalState();
      } catch (error) {
        // Ignore errors for now.
      }
    };

    const closeRenewalsModal = () => {
      if (!renewalsModal) {
        return;
      }
      renewalsModal.classList.remove("is-open");
      renewalsModal.setAttribute("aria-hidden", "true");
      syncModalBodyScroll();
    };

    const renderProgressLessons = (course, lessons, student) => {
      if (!progressLessons || !progressNote) {
        return;
      }
      const courseLessons = LESSONS_BY_COURSE[course] || {};
      const formatSeconds = (value) => {
        const total = Math.max(0, Math.round(Number(value) || 0));
        const minutes = Math.floor(total / 60);
        const seconds = total % 60;
        return `${minutes}:${String(seconds).padStart(2, "0")}`;
      };
      const parseUtcDate = (value) => {
        const raw = String(value || "").trim();
        if (!raw) {
          return null;
        }
        const hasTimezone = /[zZ]|[+-]\d{2}:\d{2}$/.test(raw);
        const candidate = hasTimezone ? raw : `${raw}Z`;
        const date = new Date(candidate);
        return Number.isNaN(date.getTime()) ? null : date;
      };

      const formatTimestamp = (value) => {
        const date = parseUtcDate(value);
        if (date) {
          return date.toLocaleString();
        }
        return value || "-";
      };
      progressLessons.innerHTML = "";
      lessons.forEach((item) => {
        const lessonMeta = courseLessons[item.lesson_number] || { title: `Theme: Lesson ${item.lesson_number}` };
        const correctCount = Number(item.correct_count || 0);
        const wrongCount = Number(item.wrong_count || 0);
        const answeredCount = Math.max(0, correctCount + wrongCount);
        const accuracyPercent = answeredCount > 0 ? Math.round((correctCount * 100) / answeredCount) : 0;
        const accuracyClass = accuracyPercent >= 70 ? "is-good" : "is-bad";
        const videoWatched = Number(item.video_watched_seconds || 0);
        const videoWatchedMinutes = Number(item.video_watched_minutes || 0);
        const videoDuration = Number(item.video_duration_seconds || 0);
        const videoPercent = videoDuration > 0 ? Math.round((videoWatched * 100) / videoDuration) : 0;
        const videoClass = videoDuration > 0 ? (videoPercent >= 70 ? "is-good" : "is-bad") : "is-empty";
        const videoStyle = videoDuration > 0 ? getPercentToneStyle(videoPercent) : "";
        const videoMeta = videoDuration > 0
          ? `${formatSeconds(videoWatched)} / ${formatSeconds(videoDuration)}`
          : "No data";
        const videoMinutesLabel = videoDuration > 0 || videoWatchedMinutes > 0
          ? `${videoWatchedMinutes.toFixed(2)} min`
          : "-";
        const videoLastSeenLabel = item.video_updated_at ? formatTimestamp(item.video_updated_at) : "-";
        const card = document.createElement("article");
        card.className = "admin-progress-lesson-card";
        card.innerHTML = `
          <div class="admin-progress-lesson-cover">
            <img src="${lessonCoverUrl}" alt="Lesson ${item.lesson_number} cover">
          </div>
          <div class="admin-progress-lesson-body">
            <h4>Lesson ${item.lesson_number}: ${escapeHtml((lessonMeta.title || "").replace("Theme: ", ""))}</h4>
            <p class="admin-progress-correct">Correct: ${escapeHtml(correctCount)}</p>
            <p class="admin-progress-wrong">Wrong: ${escapeHtml(wrongCount)}</p>
            <div class="admin-progress-percent ${accuracyClass}">
              <span class="admin-progress-percent-label">Accuracy</span>
              <span class="admin-progress-percent-value">${escapeHtml(accuracyPercent)}%</span>
              <span class="admin-progress-percent-meta">${escapeHtml(answeredCount)} answered</span>
            </div>
            <div class="admin-progress-video ${videoClass}"${videoStyle ? ` style="${videoStyle}"` : ""}>
              <span class="admin-progress-video-label">Progress of watched video</span>
              <span class="admin-progress-video-value">${videoDuration > 0 ? `${escapeHtml(videoPercent)}%` : "-"}</span>
              <span class="admin-progress-video-meta">${escapeHtml(videoMeta)}</span>
              <span class="admin-progress-video-meta">Watched minutes: ${escapeHtml(videoMinutesLabel)}</span>
              <span class="admin-progress-video-meta">Last watched: ${escapeHtml(videoLastSeenLabel)}</span>
            </div>
          </div>
        `;
        progressLessons.appendChild(card);
      });
      const levelLabel = formatLevelLabel(student.level || "");
      progressNote.textContent = `${student.full_name || student.username} (${levelLabel || "-"})`;
    };

    const loadStudentProgress = async (studentUsername) => {
      if (!ENABLE_VIEW_PROGRESS) {
        return;
      }
      if (!studentUsername) {
        return;
      }
      if (progressNote) {
        progressNote.textContent = "Loading progress...";
      }
      if (progressLessons) {
        progressLessons.innerHTML = "";
      }
      try {
        const response = await adminFetchRaw(
          `${API_BASE_URL}/api/admin/progress?student_username=${encodeURIComponent(studentUsername)}`
        );
        if (!response.ok) {
          let serverError = "";
          try {
            const errPayload = await response.json();
            serverError = errPayload && errPayload.error ? String(errPayload.error) : "";
          } catch (error) {
            serverError = "";
          }
          if (progressNote) {
            if (serverError === "not found" || response.status === 404) {
              progressNote.textContent = "Could not load student progress: backend route not found. Restart backend server.";
            } else {
              progressNote.textContent = serverError
                ? `Could not load student progress: ${serverError}.`
                : `Could not load student progress (HTTP ${response.status}).`;
            }
          }
          return;
        }
        const payload = await response.json();
        if (progressTitle) {
          progressTitle.textContent = `Progress: ${payload.student.username}`;
        }
        renderProgressLessons(payload.course, payload.lessons || [], payload.student || {});
      } catch (error) {
        if (progressNote) {
          progressNote.textContent = "Auth server is not running.";
        }
      }
    };

    const renderProgressUsers = (users) => {
      if (!ENABLE_VIEW_PROGRESS) {
        return;
      }
      if (!progressUsersList) {
        return;
      }
      progressUsersList.innerHTML = "";
      if (!Array.isArray(users) || users.length === 0) {
        progressUsersList.innerHTML = "<p class=\"admin-empty-note\">No students yet.</p>";
        return;
      }
      const levelOrder = { A1: 0, A2: 1, B1: 2, B2: 3 };
      const getLevelRank = (user) => {
        const base = normalizeCourseLevel(user.level || "");
        const key = base ? base.toUpperCase() : "";
        return Object.prototype.hasOwnProperty.call(levelOrder, key) ? levelOrder[key] : 99;
      };
      const getNameKey = (user) => (user.full_name || user.username || "").toLowerCase();
      const sortedUsers = [...users].sort((a, b) => {
        const rankDiff = getLevelRank(a) - getLevelRank(b);
        if (rankDiff !== 0) {
          return rankDiff;
        }
        const nameDiff = getNameKey(a).localeCompare(getNameKey(b));
        if (nameDiff !== 0) {
          return nameDiff;
        }
        return String(a.username || "").localeCompare(String(b.username || ""));
      });
      sortedUsers.forEach((user, index) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "admin-progress-user-btn";
        const levelLabel = formatLevelLabel(user.level || "");
        button.innerHTML = `${escapeHtml(user.full_name || user.username)} <span>${escapeHtml(levelLabel || "-")}</span>`;
        button.addEventListener("click", () => {
          const allButtons = progressUsersList.querySelectorAll(".admin-progress-user-btn");
          allButtons.forEach((item) => item.classList.remove("is-active"));
          button.classList.add("is-active");
          loadStudentProgress(user.username);
        });
        progressUsersList.appendChild(button);
        if (index === 0) {
          button.click();
        }
      });
    };

		    const fillCreateFormFromRequest = (item) => {
		      if (!item) {
		        return;
		      }
		      if (createModal && createModal.dataset) {
		        createModal.dataset.mode = "request";
		      }
		      if (createTitleEl) {
		        createTitleEl.textContent = "Create User";
		      }
		      if (createRoleInput) {
		        createRoleInput.value = "student";
		        createRoleInput.disabled = true;
		        createRoleInput.setAttribute("aria-disabled", "true");
		      }
		      if (createNameInput) {
		        createNameInput.readOnly = true;
		      }
		      if (createSecondNameInput) {
		        createSecondNameInput.value = "";
		      }
		      resetCreateProfilePhotoState();
		      if (createPhoneInput) {
		        createPhoneInput.readOnly = true;
		      }
		      if (createLevelInput) {
		        createLevelInput.disabled = true;
		      }
	      if (createUsernameInput) {
	        createUsernameInput.readOnly = true;
	      }
	      if (createPasswordInput) {
	        createPasswordInput.readOnly = true;
	      }
	      const scheduleRaw = String(item.lesson_schedule || "").trim().toLowerCase();
	      const scheduleValue = scheduleRaw === "tthsa"
	        ? "tthsa"
	        : scheduleRaw === "mwf"
	          ? "mwf"
	          : "mwf";
	      const levelValue = getRequestLevelValue(item);
      if (createNameInput) {
        createNameInput.value = item.full_name || "";
      }
      if (createPhoneInput) {
        createPhoneInput.value = item.phone || "";
      }
      if (createLevelInput) {
        createLevelInput.value = levelValue;
      }
      if (createScheduleInput) {
        createScheduleInput.value = scheduleValue;
      }
      const username = generateUsername(item.full_name || "");
      const password = generatePassword();
      if (createUsernameInput) {
        createUsernameInput.value = username;
      }
      if (createPasswordInput) {
        createPasswordInput.value = password;
      }
		      if (createMessage) {
		        createMessage.textContent = "";
		        createMessage.classList.remove("is-success");
		      }
		      syncCreateRoleState();
		      syncCreateApprovalState();
		    };

	    const openCreateModalForRequest = (item) => {
	      if (!createModal || !item) {
	        return;
	      }
	      closeCreateQueueModal();
	      activeEnrollmentRequest = item;
	      if (createModal.dataset) {
	        createModal.dataset.mode = "request";
	      }
	      if (createModal.dataset) {
	        createModal.dataset.requestId = String(item.id || "");
	      }
	      fillCreateFormFromRequest(item);
	      openCreateModal();
      if (createScheduleInput && !createScheduleInput.disabled && createScheduleGroup) {
        createScheduleInput.focus();
      } else if (createSubmitBtn) {
        createSubmitBtn.focus();
      }
    };

		    const openCreateModal = () => {
		      if (!createModal) {
		        return;
		      }
		      if (createModal.dataset && !createModal.dataset.mode) {
		        createModal.dataset.mode = "request";
		      }
		      createModal.classList.add("is-open");
		      createModal.setAttribute("aria-hidden", "false");
		      if (createMessage) {
		        createMessage.textContent = "";
		        createMessage.classList.remove("is-success");
		      }
		      syncCreateApprovalState();
		      syncCreateRoleState();
	      if (createScheduleInput && !createScheduleInput.disabled) {
	        createScheduleInput.focus();
	      } else if (createSubmitBtn) {
	        createSubmitBtn.focus();
	      }
	    };

		    const closeCreateModal = (options = {}) => {
		      if (!createModal) {
		        return;
		      }
	      const preserveForm = !!options.preserveForm;
	      const forceClose = !!options.force;
	      if (!forceClose && Date.now() < createModalCloseLockUntil) {
	        return;
	      }
	      createModal.classList.remove("is-open");
	      createModal.setAttribute("aria-hidden", "true");
		      if (createModal.dataset) {
		        createModal.dataset.closeLockUntil = "";
		        createModal.dataset.mode = "";
		        createModal.dataset.requestId = "";
		      }
	      if (createForm && !preserveForm) {
	        createForm.reset();
	      }
	      if (!preserveForm) {
	        resetCreateProfilePhotoState();
	      }
	      if (createMessage) {
	        createMessage.textContent = "";
	        createMessage.classList.remove("is-success");
	      }
		      syncCreateApprovalState();
		      syncCreateRoleState();
		      activeEnrollmentRequest = null;
		    };

		    const openCreateModalManual = () => {
		      if (!createModal) {
		        return;
		      }
		      activeEnrollmentRequest = null;
		      if (createModal.dataset) {
		        createModal.dataset.mode = "manual";
		        createModal.dataset.requestId = "";
		      }
		      if (createTitleEl) {
		        createTitleEl.textContent = "Create User (Manual)";
		      }
		      if (createRoleInput) {
		        createRoleInput.disabled = false;
		        createRoleInput.setAttribute("aria-disabled", "false");
		        createRoleInput.value = "student";
		      }
		      if (createNameInput) {
		        createNameInput.readOnly = false;
		        createNameInput.value = "";
		      }
		      if (createSecondNameInput) {
		        createSecondNameInput.value = "";
		      }
		      if (createMentorInput) {
		        createMentorInput.value = "";
		      }
		      resetCreateProfilePhotoState();
		      if (createPhoneInput) {
		        createPhoneInput.readOnly = false;
		        createPhoneInput.value = "";
		      }
		      if (createLevelInput) {
		        createLevelInput.disabled = false;
	        if (!createLevelInput.value) {
	          createLevelInput.value = "a1";
	        }
	      }
	      if (createScheduleInput && !createScheduleInput.value) {
	        createScheduleInput.value = "mwf";
	      }
	      if (createUsernameInput) {
	        createUsernameInput.readOnly = false;
	        createUsernameInput.value = "";
	      }
	      if (createPasswordInput) {
	        createPasswordInput.readOnly = false;
	        createPasswordInput.value = generatePassword();
	      }
		      if (createMessage) {
		        createMessage.textContent = "";
		        createMessage.classList.remove("is-success");
		      }
		      syncCreateRoleState();
		      openCreateModal();
		      if (createNameInput) {
		        createNameInput.focus();
		      }
		    };

    const openEditModal = (user) => {
      if (!editModal || !user) {
        return;
      }
      editTargetUsername = String(user.username || "").trim();
      if (editNameInput) {
        editNameInput.value = user.full_name || "";
      }
      if (editPhoneInput) {
        editPhoneInput.value = user.phone || "";
      }
      if (editLevelInput) {
        editLevelInput.value = user.level || "";
      }
      if (editScheduleInput) {
        editScheduleInput.value = user.lesson_schedule || "mwf";
      }
      if (editUsernameInput) {
        editUsernameInput.value = editTargetUsername;
      }
      if (editPasswordInput) {
        editPasswordInput.value = "";
      }
      if (editMessage) {
        editMessage.textContent = "";
        editMessage.classList.remove("is-success");
      }
      syncEditScheduleState();
      editModal.classList.add("is-open");
      editModal.setAttribute("aria-hidden", "false");
      if (editNameInput) {
        editNameInput.focus();
      }
    };

    const closeEditModal = () => {
      if (!editModal) {
        return;
      }
      editModal.classList.remove("is-open");
      editModal.setAttribute("aria-hidden", "true");
      editTargetUsername = "";
      if (editForm) {
        editForm.reset();
      }
      if (editMessage) {
        editMessage.textContent = "";
        editMessage.classList.remove("is-success");
      }
      syncEditScheduleState();
    };

    const closeUserInfoModal = () => {
      if (!userInfoModal) {
        return;
      }
      userInfoModal.classList.remove("is-open");
      userInfoModal.setAttribute("aria-hidden", "true");
      userInfoTargetUsername = "";
      userInfoTarget = null;
      if (userInfoNote) {
        userInfoNote.textContent = "Select a user to view details.";
      }
      if (userInfoBody) {
        userInfoBody.innerHTML = "";
      }
      syncModalBodyScroll();
    };

    const openPasswordResetModal = () =>
      new Promise((resolve) => {
        if (
          !passwordResetModal ||
          !passwordResetForm ||
          !passwordResetCodeInput ||
          !passwordResetNewInput ||
          !passwordResetCancelBtn ||
          !passwordResetSubmitBtn
        ) {
          resolve(null);
          return;
        }
        if (passwordResetMessage) {
          passwordResetMessage.textContent = "";
          passwordResetMessage.classList.remove("is-success");
        }
        passwordResetCodeInput.value = "";
        passwordResetNewInput.value = "";
        passwordResetModal.classList.add("is-open");
        passwordResetModal.setAttribute("aria-hidden", "false");
        syncModalBodyScroll();
        setTimeout(() => {
          try {
            passwordResetCodeInput.focus();
          } catch (e) {}
        }, 0);

        const cleanup = (value) => {
          passwordResetModal.classList.remove("is-open");
          passwordResetModal.setAttribute("aria-hidden", "true");
          syncModalBodyScroll();
          passwordResetForm.removeEventListener("submit", onSubmit);
          passwordResetCancelBtn.removeEventListener("click", onCancel);
          passwordResetModal.removeEventListener("click", onBackdrop);
          resolve(value);
        };

        const onBackdrop = (event) => {
          if (event.target === passwordResetModal) {
            cleanup(null);
          }
        };

        const onCancel = () => cleanup(null);

        const onSubmit = (event) => {
          event.preventDefault();
          const code = String(passwordResetCodeInput.value || "").trim();
          const newPassword = String(passwordResetNewInput.value || "").trim();
          if (!code) {
            if (passwordResetMessage) {
              passwordResetMessage.textContent = "PIN code is required.";
            }
            return;
          }
          if (newPassword && newPassword.length < 6) {
            if (passwordResetMessage) {
              passwordResetMessage.textContent = "Password must be at least 6 characters.";
            }
            return;
          }
          cleanup({ code, new_password: newPassword || "" });
        };

        passwordResetForm.addEventListener("submit", onSubmit);
        passwordResetCancelBtn.addEventListener("click", onCancel);
        passwordResetModal.addEventListener("click", onBackdrop);
      });

    const openUserInfoModal = async (user) => {
      if (!userInfoModal || !user) {
        return;
      }
      if (!authState || !authState.username) {
        return;
      }
      userInfoTargetUsername = String(user.username || "").trim();
      userInfoTarget = user;
      if (userInfoTitle) {
        userInfoTitle.textContent = userInfoTargetUsername ? `More info: ${userInfoTargetUsername}` : "More Info";
      }
      if (userInfoNote) {
        userInfoNote.textContent = "Loading...";
      }
      if (userInfoBody) {
        userInfoBody.innerHTML = "";
      }
      const targetRole = String(user.role || "").toLowerCase();
      const targetUsername = String(user.username || "").trim();
      const canEdit =
        targetRole === "student" || (targetRole === "admin" && authState && targetUsername === authState.username);
      if (userInfoEditBtn) {
        userInfoEditBtn.disabled = !canEdit;
        userInfoEditBtn.setAttribute("aria-disabled", String(!canEdit));
      }
      userInfoModal.classList.add("is-open");
      userInfoModal.setAttribute("aria-hidden", "false");
      syncModalBodyScroll();

      try {
        const response = await adminFetchRaw(
          `${API_BASE_URL}/api/admin/user-details?target_username=${encodeURIComponent(userInfoTargetUsername)}`
        );
        let payload = null;
        try {
          payload = await response.json();
        } catch (parseError) {
          payload = null;
        }
        if (!response.ok || !payload || payload.error) {
          if (userInfoNote) {
            const serverError = payload && payload.error ? String(payload.error) : "";
            userInfoNote.textContent = serverError
              ? `Failed to load user details: ${serverError}`
              : `Failed to load user details. (HTTP ${response.status})`;
          }
          return;
        }
	        const details = payload.user || {};
	        const botUser = payload.bot_user || {};
	        const parents = Array.isArray(payload.parents) ? payload.parents : [];
	        const mentor = payload.mentor || null;
	        const parentsHtml = parents.length
	          ? `<ul class="admin-user-info-parents-list">${parents
              .map((item) => {
                const relation = String(item.relation || "").toLowerCase();
                const relationLabel =
                  relation === "mother" ? "👩 Mother" : relation === "father" ? "👨 Father" : relation || "-";
                const name = [item.first_name, item.last_name].filter(Boolean).join(" ").trim() || "-";
                const phone = item.phone || "-";
                return `<li>${escapeHtml(relationLabel)} — ${escapeHtml(name)}<br><span class="admin-user-info-parents-phone">${escapeHtml(
                  phone
                )}</span></li>`;
              })
              .join("")}</ul>`
          : `<p class="admin-user-info-empty">-</p>`;
        if (userInfoNote) {
          userInfoNote.textContent = "";
        }
	        if (userInfoBody) {
	          const createdAt = String(details.created_at || "-").replace("T", " ");
	          const accessAt = String(details.access_started_at || "-").replace("T", " ");
	          const mentorSection =
	            mentor && String(details.role || "").toLowerCase() === "student"
	              ? `
	                <section class="admin-user-info-section">
	                  <h4>🧑‍🏫 Mentor</h4>
	                  <div class="admin-device-detail-grid">
	                    <div class="admin-device-detail-item">
	                      <span class="admin-device-detail-label">🧑 Name</span>
	                      <p>${escapeHtml(mentor.name || "-")}</p>
	                    </div>
	                    <div class="admin-device-detail-item">
	                      <span class="admin-device-detail-label">🎯 Level</span>
	                      <p>${escapeHtml(formatLevelLabel(mentor.level || "") || "-")}</p>
	                    </div>
	                    <div class="admin-device-detail-item">
	                      <span class="admin-device-detail-label">📞 Phone</span>
	                      <p>${escapeHtml(mentor.phone || "-")}</p>
	                    </div>
	                    <div class="admin-device-detail-item">
	                      <span class="admin-device-detail-label">💬 Telegram</span>
	                      <p>${escapeHtml(mentor.telegram_username ? `@${String(mentor.telegram_username).replace(/^@/, "")}` : "-")}</p>
	                    </div>
	                  </div>
	                </section>
	              `
	              : "";
	          userInfoBody.innerHTML = `
	            <div class="admin-user-info-sections">
	              <section class="admin-user-info-section">
	                <h4>👤 Account</h4>
                <div class="admin-device-detail-grid">
                  <div class="admin-device-detail-item">
                    <span class="admin-device-detail-label">🧑 Full name</span>
                    <p>${escapeHtml(details.full_name || "-")}</p>
                  </div>
                  <div class="admin-device-detail-item">
                    <span class="admin-device-detail-label">🆔 Username</span>
                    <p>${escapeHtml(details.username || "-")}</p>
                  </div>
                  <div class="admin-device-detail-item">
                    <span class="admin-device-detail-label">📞 Phone</span>
                    <p>${escapeHtml(details.phone || "-")}</p>
                  </div>
                  <div class="admin-device-detail-item">
                    <span class="admin-device-detail-label">🎯 Level</span>
                    <p>${escapeHtml(formatLevelLabel(details.level || "") || "-")}</p>
                  </div>
                  <div class="admin-device-detail-item">
                    <span class="admin-device-detail-label">📅 Schedule</span>
                    <p>${escapeHtml(formatScheduleLabel(details.lesson_schedule || "", details.level || "") || "-")}</p>
                  </div>
                  <div class="admin-device-detail-item">
                    <span class="admin-device-detail-label">👤 Role</span>
                    <p>${escapeHtml(details.role || "-")}</p>
                  </div>
                  <div class="admin-device-detail-item">
                    <span class="admin-device-detail-label">🔑 Password</span>
                    <div class="admin-user-password-row">
                      <p id="admin-user-password-value">${escapeHtml(details.password || "*****")}</p>
                      <button type="button" class="admin-user-password-reveal-btn" id="admin-user-password-reveal-btn" title="Reveal / reset password">
                        👁
                      </button>
                    </div>
                  </div>
                  <div class="admin-device-detail-item">
                    <span class="admin-device-detail-label">🗓️ Created at</span>
                    <p>${escapeHtml(createdAt || "-")}</p>
                  </div>
                  <div class="admin-device-detail-item">
                    <span class="admin-device-detail-label">🚀 Access started</span>
                    <p>${escapeHtml(accessAt || "-")}</p>
	                  </div>
	                </div>
	              </section>
	              ${mentorSection}
	
	              <section class="admin-user-info-section">
	                <h4>💬 Bot</h4>
	                <div class="admin-device-detail-grid">
                  <div class="admin-device-detail-item">
                    <span class="admin-device-detail-label">🪪 Telegram chat_id</span>
                    <p>${escapeHtml(String(botUser.chat_id || "-"))}</p>
                  </div>
                </div>
              </section>

              <section class="admin-user-info-section admin-user-info-parents">
                <h4>👨‍👩‍👧 Parents</h4>
                ${parentsHtml}
              </section>
            </div>
          `;

            const revealBtn = userInfoBody.querySelector("#admin-user-password-reveal-btn");
            if (revealBtn) {
              revealBtn.addEventListener("click", async () => {
                if (!authState || !authState.username) {
                  return;
                }
                const valueEl = userInfoBody.querySelector("#admin-user-password-value");
                if (valueEl) {
                  valueEl.textContent = "Sending PIN...";
                }
                const pinReq = await adminPostJson("/api/admin/edit-access/request", { admin_username: authState.username });
                if (!pinReq.ok) {
                  const err = (pinReq.data && pinReq.data.error) || `HTTP ${pinReq.status}`;
                  if (valueEl) {
                    valueEl.textContent = "*****";
                  }
                  window.alert(`Failed to send PIN: ${err}`);
                  return;
                }
                const modalRes = await openPasswordResetModal();
                if (!modalRes) {
                  if (valueEl) {
                    valueEl.textContent = "*****";
                  }
                  return;
                }
                const body = {
                  admin_username: authState.username,
                  target_username: userInfoTargetUsername,
                  code: String(modalRes.code || "").trim(),
                };
                if (modalRes.new_password) {
                  body.new_password = String(modalRes.new_password || "").trim();
                }
                const reset = await adminPostJson("/api/admin/users/reset-password", body);
                if (!reset.ok || !reset.data || !reset.data.password) {
                  const err = (reset.data && reset.data.error) || `HTTP ${reset.status}`;
                  if (valueEl) {
                    valueEl.textContent = "*****";
                  }
                  window.alert(`Failed to reset password: ${err}`);
                  return;
                }
                if (valueEl) {
                  valueEl.textContent = String(reset.data.password);
                }
              });
            }
        }
      } catch (error) {
        if (userInfoNote) {
          userInfoNote.textContent = "Auth server is not running.";
        }
      }
    };

    const syncMentorAvatarState = () => {
      if (!mentorSubmitBtn || !mentorAvatarInput) {
        return;
      }
      const hasAvatar = mentorAvatarInput.files && mentorAvatarInput.files[0];
      if (hasAvatar) {
        mentorSubmitBtn.classList.remove("is-disabled");
        mentorSubmitBtn.setAttribute("aria-disabled", "false");
      } else {
        mentorSubmitBtn.classList.add("is-disabled");
        mentorSubmitBtn.setAttribute("aria-disabled", "true");
      }
    };

    const openMentorModal = () => {
      if (!mentorModal) {
        return;
      }
      mentorModal.classList.add("is-open");
      mentorModal.setAttribute("aria-hidden", "false");
      if (mentorMessage) {
        mentorMessage.textContent = "";
        mentorMessage.classList.remove("is-success");
      }
      if (mentorAvatarMessage) {
        mentorAvatarMessage.textContent = "";
        mentorAvatarMessage.classList.remove("is-success");
      }
      if (mentorNameInput) {
        mentorNameInput.focus();
      }
      syncMentorAvatarState();
    };

    const closeMentorModal = () => {
      if (!mentorModal) {
        return;
      }
      mentorModal.classList.remove("is-open");
      mentorModal.setAttribute("aria-hidden", "true");
      if (mentorForm) {
        mentorForm.reset();
      }
      if (mentorAvatarInput) {
        mentorAvatarInput.value = "";
      }
      if (mentorMessage) {
        mentorMessage.textContent = "";
        mentorMessage.classList.remove("is-success");
      }
      if (mentorAvatarMessage) {
        mentorAvatarMessage.textContent = "";
        mentorAvatarMessage.classList.remove("is-success");
      }
      syncMentorAvatarState();
    };

    const openMentorsModal = async () => {
      if (!mentorsModal) {
        return;
      }
      mentorsModal.classList.add("is-open");
      mentorsModal.setAttribute("aria-hidden", "false");
      syncModalBodyScroll();
      if (mentorsNote) {
        mentorsNote.textContent = "Loading mentors...";
      }
      await loadMentors();
    };

    const closeMentorsModal = () => {
      if (!mentorsModal) {
        return;
      }
      mentorsModal.classList.remove("is-open");
      mentorsModal.setAttribute("aria-hidden", "true");
      syncModalBodyScroll();
    };

    const openMentorEditModal = (mentor) => {
      if (!mentorEditModal || !mentor) {
        return;
      }
      mentorEditId = String(mentor.id || "");
      if (mentorEditNameInput) {
        mentorEditNameInput.value = mentor.name || "";
      }
      if (mentorEditLevelInput) {
        mentorEditLevelInput.value = mentor.level || "";
      }
      if (mentorEditPhoneInput) {
        mentorEditPhoneInput.value = mentor.phone || "";
      }
      if (mentorEditEmailInput) {
        mentorEditEmailInput.value = mentor.email || "";
      }
      if (mentorEditTelegramInput) {
        mentorEditTelegramInput.value = mentor.telegram_username || "";
      }
      if (mentorEditInfoInput) {
        mentorEditInfoInput.value = mentor.info || "";
      }
      if (mentorEditAvatarInput) {
        mentorEditAvatarInput.value = "";
      }
      if (mentorEditAvatarMessage) {
        mentorEditAvatarMessage.textContent = "";
        mentorEditAvatarMessage.classList.remove("is-success");
      }
      if (mentorEditMessage) {
        mentorEditMessage.textContent = "";
        mentorEditMessage.classList.remove("is-success");
      }
      mentorEditModal.classList.add("is-open");
      mentorEditModal.setAttribute("aria-hidden", "false");
      syncModalBodyScroll();
    };

    const closeMentorEditModal = () => {
      if (!mentorEditModal) {
        return;
      }
      mentorEditModal.classList.remove("is-open");
      mentorEditModal.setAttribute("aria-hidden", "true");
      mentorEditId = "";
      syncModalBodyScroll();
    };

    const renderMentors = (items) => {
      if (!mentorsBody || !mentorsNote) {
        return;
      }
      mentorsBody.innerHTML = "";
      if (!Array.isArray(items) || items.length === 0) {
        mentorsNote.textContent = "No mentors yet.";
        return;
      }
      mentorsNote.textContent = `Mentors: ${items.length}`;
      items.forEach((mentor) => {
        const row = document.createElement("tr");
        row.dataset.mentorId = String(mentor.id || "");
        const levelLabel = formatLevelLabel(mentor.level || "");
        const avatarRaw = String(mentor.avatar_url || "").trim();
        const avatarUrl = avatarRaw ? (avatarRaw.startsWith("http") ? avatarRaw : `${API_BASE_URL}${avatarRaw}`) : "";
        const avatarCell = avatarUrl
          ? `<img class="admin-mentor-avatar" src="${avatarUrl}" alt="Mentor avatar">`
          : "-";
        const info = String(mentor.info || "");
        const infoShort = info.length > 70 ? `${info.slice(0, 67)}...` : info;
        row.innerHTML = `
          <td>${avatarCell}</td>
          <td>${escapeHtml(mentor.name || "-")}</td>
          <td>${escapeHtml(levelLabel || "-")}</td>
          <td>${escapeHtml(mentor.phone || "-")}</td>
          <td>${escapeHtml(mentor.email || "-")}</td>
          <td>${escapeHtml(mentor.telegram_username || "-")}</td>
          <td title="${escapeHtml(info)}">${escapeHtml(infoShort || "-")}</td>
          <td>
            <button type="button" class="btn admin-mentor-edit-btn">Edit</button>
          </td>
        `;
        mentorsBody.appendChild(row);
      });
    };

    const loadMentors = async (options = {}) => {
      if (!authState || !authState.username) {
        return false;
      }
      const shouldRender = !Object.prototype.hasOwnProperty.call(options || {}, "render") || !!options.render;
      const silent = !!(options && options.silent);
      try {
        await ensureApiBaseUrl();
        const response = await adminFetchRaw(`${API_BASE_URL}/api/admin/mentors`);
        if (!response.ok) {
          if (!silent && mentorsNote) {
            mentorsNote.textContent = "Failed to load mentors.";
          }
          return false;
        }
        const payload = await response.json();
        mentorsCache = Array.isArray(payload.items) ? payload.items : [];
        if (shouldRender) {
          renderMentors(mentorsCache);
        }
        return true;
      } catch (error) {
        if (!silent && mentorsNote) {
          mentorsNote.textContent = "Auth server is not running.";
        }
        return false;
      }
    };

    const submitMentorEdit = async (payload) => {
      if (!authState || !authState.username) {
        return;
      }
      if (!mentorEditId) {
        return;
      }
      const name = mentorEditNameInput ? mentorEditNameInput.value.trim() : "";
      const level = mentorEditLevelInput ? mentorEditLevelInput.value.trim().toLowerCase() : "";
      const phone = mentorEditPhoneInput ? mentorEditPhoneInput.value.trim() : "";
      const email = mentorEditEmailInput ? mentorEditEmailInput.value.trim() : "";
      const telegram = mentorEditTelegramInput ? mentorEditTelegramInput.value.trim() : "";
      const info = mentorEditInfoInput ? mentorEditInfoInput.value.trim() : "";
      if (!name || !level || !phone || !email || !telegram || !info) {
        if (mentorEditMessage) {
          mentorEditMessage.textContent = "Fill all fields before saving.";
          mentorEditMessage.classList.remove("is-success");
        }
        return;
      }
      try {
        const response = await adminFetchRaw(`${API_BASE_URL}/api/admin/mentors/update`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            admin_username: authState.username,
            mentor_id: mentorEditId,
            name,
            level,
            phone,
            email,
            telegram_username: telegram,
            info,
            ...(payload || {}),
          }),
        });
        const result = await response.json();
        if (!response.ok) {
          if (mentorEditMessage) {
            mentorEditMessage.textContent = result.error || "Could not update mentor.";
            mentorEditMessage.classList.remove("is-success");
          }
          return;
        }
        if (mentorEditMessage) {
          mentorEditMessage.textContent = "Mentor updated.";
          mentorEditMessage.classList.add("is-success");
        }
        await loadMentors();
        setTimeout(() => {
          closeMentorEditModal();
        }, 500);
      } catch (error) {
        if (mentorEditMessage) {
          mentorEditMessage.textContent = "Auth server is not running.";
          mentorEditMessage.classList.remove("is-success");
        }
      }
    };

    const loadAdminOverview = async () => {
      try {
        await ensureApiBaseUrl();
        const response = await adminFetchRaw(`${API_BASE_URL}/api/admin/overview`);
        if (!response.ok) {
          if (adminGuard) {
            adminGuard.hidden = false;
            adminGuard.textContent = "Failed to load admin data.";
          }
          if (adminContent) {
            adminContent.hidden = true;
          }
          return;
        }

        const payload = await response.json();
        if (statUsersEl) {
          statUsersEl.textContent = String(payload.stats.total_users || 0);
        }

        payloadUsersCache = Array.isArray(payload.users) ? payload.users : [];
        renderUsers(payloadUsersCache);
        renderKnowledgeAttempts(payload.knowledge_test_attempts || []);
        renderLevelTables(payload.level_tables || {});
        enrollmentRequests = Array.isArray(payload.enrollment_requests) ? payload.enrollment_requests : [];
        renewalRequests = Array.isArray(payload.renewal_requests) ? payload.renewal_requests : [];
        pendingEnrollmentRequests = Number((payload.stats && payload.stats.pending_enrollment_requests) || 0);
        updateRequestsBadge(pendingEnrollmentRequests);
        updateRenewalsBadge(renewalRequests.length);
        updateManageBadge(pendingEnrollmentRequests + renewalRequests.length);
        if (requestsModal && requestsModal.classList.contains("is-open")) {
          renderEnrollmentRequests(enrollmentRequests);
        }
        if (createQueueModal && createQueueModal.classList.contains("is-open")) {
          renderCreateQueue(enrollmentRequests);
        }
        if (renewalsModal && renewalsModal.classList.contains("is-open")) {
          renderRenewalRequests(renewalRequests);
        }
        if (deleteModal && deleteModal.classList.contains("is-open")) {
          renderDeleteUsers(payloadUsersCache);
        }
        await loadPaymentChecks();
        progressUsers = ENABLE_VIEW_PROGRESS
          ? (payload.users || []).filter((user) => (user.role || "").toLowerCase() === "student")
          : [];
        if (ENABLE_VIEW_PROGRESS && progressModal && progressModal.classList.contains("is-open")) {
          renderProgressUsers(progressUsers);
        }
      } catch (error) {
        if (adminGuard) {
          adminGuard.hidden = false;
          adminGuard.textContent = "Auth server is not running.";
        }
        if (adminContent) {
          adminContent.hidden = true;
        }
      }
    };

    if (createCancelBtn) {
      createCancelBtn.addEventListener("click", closeCreateModal);
    }
    if (editCancelBtn) {
      editCancelBtn.addEventListener("click", closeEditModal);
    }
    if (userInfoCloseBtn) {
      userInfoCloseBtn.addEventListener("click", closeUserInfoModal);
    }
    if (userInfoEditBtn) {
      userInfoEditBtn.addEventListener("click", () => {
        const targetUser = userInfoTarget;
        if (!targetUser) {
          return;
        }
        closeUserInfoModal();
        openEditModal(targetUser);
      });
    }
    if (mentorCancelBtn) {
      mentorCancelBtn.addEventListener("click", closeMentorModal);
    }
    if (mentorAvatarBtn) {
      mentorAvatarBtn.addEventListener("click", () => {
        if (mentorAvatarInput) {
          mentorAvatarInput.click();
        }
      });
    }
    if (mentorAvatarInput) {
      mentorAvatarInput.addEventListener("change", () => {
        const file = mentorAvatarInput.files && mentorAvatarInput.files[0];
        if (mentorAvatarMessage) {
          mentorAvatarMessage.textContent = file ? `Avatar selected: ${file.name}` : "";
          mentorAvatarMessage.classList.toggle("is-success", Boolean(file));
        }
        syncMentorAvatarState();
      });
    }
    if (mentorsCloseBtn) {
      mentorsCloseBtn.addEventListener("click", closeMentorsModal);
    }
    if (mentorsCreateBtn) {
      mentorsCreateBtn.addEventListener("click", () => {
        closeMentorsModal();
        openMentorModal();
      });
    }
    if (mentorsModal) {
      mentorsModal.addEventListener("click", (event) => {
        if (event.target === mentorsModal) {
          closeMentorsModal();
        }
      });
    }
    if (mentorsBody) {
      mentorsBody.addEventListener("click", (event) => {
        const target = event.target;
        if (!(target instanceof HTMLElement)) {
          return;
        }
        const editBtn = target.closest(".admin-mentor-edit-btn");
        if (!editBtn) {
          return;
        }
        const row = editBtn.closest("tr");
        const mentorId = row ? String(row.dataset.mentorId || "") : "";
        if (!mentorId) {
          return;
        }
        const mentor = mentorsCache.find((item) => String(item.id || "") === mentorId);
        if (!mentor) {
          return;
        }
        openMentorEditModal(mentor);
      });
    }
    if (mentorEditCancelBtn) {
      mentorEditCancelBtn.addEventListener("click", closeMentorEditModal);
    }
    if (mentorEditAvatarBtn) {
      mentorEditAvatarBtn.addEventListener("click", () => {
        if (mentorEditAvatarInput) {
          mentorEditAvatarInput.click();
        }
      });
    }
    if (mentorEditAvatarInput) {
      mentorEditAvatarInput.addEventListener("change", () => {
        const file = mentorEditAvatarInput.files && mentorEditAvatarInput.files[0];
        if (mentorEditAvatarMessage) {
          mentorEditAvatarMessage.textContent = file ? `Avatar selected: ${file.name}` : "";
          mentorEditAvatarMessage.classList.toggle("is-success", Boolean(file));
        }
      });
    }
    if (mentorEditModal) {
      mentorEditModal.addEventListener("click", (event) => {
        if (event.target === mentorEditModal) {
          closeMentorEditModal();
        }
      });
    }
	    if (createPaymentApprovalBtn) {
	      createPaymentApprovalBtn.addEventListener("click", () => {
	        if (getCreateRoleValue() === "mentor") {
	          if (createProfilePhotoInput) {
	            createProfilePhotoInput.click();
	          }
	          return;
	        }
	        const username = createUsernameInput ? createUsernameInput.value.trim() : "";
	        if (!username) {
	          if (createMessage) {
	            createMessage.textContent = "Username is missing. Please reopen the request.";
	            createMessage.classList.remove("is-success");
          }
          return;
        }
        if (paymentUsername && username) {
          paymentUsername.value = username;
        }
        if (paymentDate && !paymentDate.value) {
          const today = new Date();
          paymentDate.value = today.toISOString().slice(0, 10);
        }
	        openPaymentsModal();
	      });
	    }
	    if (createProfilePhotoInput) {
	      createProfilePhotoInput.addEventListener("change", () => {
	        const file = createProfilePhotoInput.files && createProfilePhotoInput.files[0];
	        if (createProfilePhotoMessage) {
	          createProfilePhotoMessage.textContent = file ? `Photo selected: ${file.name}` : "";
	          createProfilePhotoMessage.classList.toggle("is-success", Boolean(file));
	        }
	      });
	    }
	    if (createRoleInput) {
	      createRoleInput.addEventListener("change", () => {
	        syncCreateRoleState();
	        if (createMessage) {
	          createMessage.textContent = "";
	          createMessage.classList.remove("is-success");
	        }
	      });
	    }
	    if (createUsernameInput) {
	      createUsernameInput.addEventListener("input", () => {
	        syncCreateApprovalState();
	        if (createMessage) {
	          createMessage.textContent = "";
          createMessage.classList.remove("is-success");
        }
      });
    }

	    if (createLevelInput) {
	      createLevelInput.addEventListener("change", () => {
	        syncCreateScheduleState();
	        refreshCreateMentorOptions();
	      });
	    }
    if (editLevelInput) {
      editLevelInput.addEventListener("change", () => {
        syncEditScheduleState();
      });
    }

    if (createModal) {
      createModal.addEventListener("click", (event) => {
        if (event.target === createModal) {
          if (Date.now() < createModalCloseLockUntil) {
            return;
          }
          closeCreateModal();
        }
      });
    }
    if (editModal) {
      editModal.addEventListener("click", (event) => {
        if (event.target === editModal) {
          closeEditModal();
        }
      });
    }
    if (userInfoModal) {
      userInfoModal.addEventListener("click", (event) => {
        if (event.target === userInfoModal) {
          closeUserInfoModal();
        }
      });
    }
    if (mentorModal) {
      mentorModal.addEventListener("click", (event) => {
        if (event.target === mentorModal) {
          closeMentorModal();
        }
      });
    }

    if (viewProgressBtn && ENABLE_VIEW_PROGRESS) {
      viewProgressBtn.addEventListener("click", () => {
        openProgressModal();
      });
    }

    if (manageBtn) {
      manageBtn.addEventListener("click", () => {
        openManageModal();
      });
    }

    if (manageCloseBtn) {
      manageCloseBtn.addEventListener("click", () => {
        closeManageModal();
      });
    }

	    if (createQueueCloseBtn) {
	      createQueueCloseBtn.addEventListener("click", () => {
	        closeCreateQueueModal();
	      });
	    }

	    if (createQueueManualBtn) {
	      createQueueManualBtn.addEventListener("click", () => {
	        closeCreateQueueModal();
	        openCreateModalManual();
	      });
	    }

    if (createQueueModal) {
      createQueueModal.addEventListener("click", (event) => {
        if (event.target === createQueueModal) {
          closeCreateQueueModal();
        }
      });
    }

    if (createQueueList) {
      createQueueList.addEventListener("click", async (event) => {
        const deleteBtn = event.target.closest(".admin-create-queue-delete-btn");
        if (deleteBtn) {
          const card = deleteBtn.closest(".admin-create-queue-card");
          const requestId = card ? Number(card.dataset.requestId) : 0;
          if (!requestId) {
            return;
          }
          const confirmDelete = window.confirm("Delete this request?");
          if (!confirmDelete) {
            return;
          }
          const previousLabel = deleteBtn.textContent;
          deleteBtn.textContent = "Deleting...";
          deleteBtn.disabled = true;
          const result = await deleteEnrollmentRequest(requestId);
          if (!result.ok) {
            deleteBtn.textContent = previousLabel;
            deleteBtn.disabled = false;
            return;
          }
          enrollmentRequests = (enrollmentRequests || []).filter(
            (item) => Number(item && item.id) !== requestId
          );
          const pendingCount = Number.isFinite(result.pendingCount)
            ? Math.max(0, result.pendingCount)
            : countPendingEnrollmentRequests(enrollmentRequests);
          pendingEnrollmentRequests = pendingCount;
          updateRequestsBadge(pendingCount);
          updateManageBadge(pendingCount + renewalRequests.length);
          renderEnrollmentRequests(enrollmentRequests);
          renderCreateQueue(enrollmentRequests);
          return;
        }

        const createBtn = event.target.closest(".admin-create-queue-create-btn");
        if (!createBtn) {
          return;
        }
        const card = createBtn.closest(".admin-create-queue-card");
        const requestId = card ? Number(card.dataset.requestId) : 0;
        if (!requestId) {
          return;
        }
        const requestItem = (enrollmentRequests || []).find((item) => Number(item && item.id) === requestId);
        if (!requestItem) {
          return;
        }
        openCreateModalForRequest(requestItem);
      });
    }

    if (manageRequestsBtn) {
      manageRequestsBtn.addEventListener("click", () => {
        closeManageModal();
        openRequestsModal();
      });
    }

    if (manageRenewalsBtn) {
      manageRenewalsBtn.addEventListener("click", () => {
        closeManageModal();
        openRenewalsModal();
      });
    }

    if (manageCreateBtn) {
      manageCreateBtn.addEventListener("click", () => {
        closeManageModal();
        openCreateQueueModal();
      });
    }

    if (manageMentorBtn) {
      manageMentorBtn.addEventListener("click", () => {
        closeManageModal();
        openMentorsModal();
      });
    }

    if (manageDevicesBtn) {
      manageDevicesBtn.addEventListener("click", () => {
        closeManageModal();
        openDevicesModal();
      });
    }

    if (manageDeleteBtn) {
      manageDeleteBtn.addEventListener("click", () => {
        closeManageModal();
        openDeleteModal();
      });
    }

    if (progressCloseBtn && ENABLE_VIEW_PROGRESS) {
      progressCloseBtn.addEventListener("click", () => {
        closeProgressModal();
      });
    }

    if (progressModal && ENABLE_VIEW_PROGRESS) {
      progressModal.addEventListener("click", (event) => {
        if (event.target === progressModal) {
          closeProgressModal();
        }
      });
    }

    if (requestsCloseBtn) {
      requestsCloseBtn.addEventListener("click", () => {
        closeRequestsModal();
      });
    }

    if (requestsModal) {
      requestsModal.addEventListener("click", (event) => {
        if (event.target === requestsModal) {
          closeRequestsModal();
        }
      });
    }

    if (devicesCloseBtn) {
      devicesCloseBtn.addEventListener("click", () => {
        closeDevicesModal();
      });
    }

    if (devicesModal) {
      devicesModal.addEventListener("click", (event) => {
        if (event.target === devicesModal) {
          closeDevicesModal();
        }
      });
    }

    if (deviceDetailCloseBtn) {
      deviceDetailCloseBtn.addEventListener("click", () => {
        closeDeviceDetailModal();
      });
    }

    if (deviceDetailModal) {
      deviceDetailModal.addEventListener("click", (event) => {
        if (event.target === deviceDetailModal) {
          closeDeviceDetailModal();
        }
      });
    }

    if (devicesBody) {
      devicesBody.addEventListener("click", (event) => {
        const chip = event.target.closest(".admin-device-chip-btn");
        if (!chip) {
          return;
        }
        openDeviceDetailModal({
          username: chip.dataset.username || "-",
          deviceType: chip.dataset.deviceType || "unknown",
          firstSeen: chip.dataset.firstSeen || "-",
          lastSeen: chip.dataset.lastSeen || "-",
          loginCount: chip.dataset.loginCount || "0",
          lastIp: chip.dataset.lastIp || "-",
          location: [chip.dataset.city, chip.dataset.region, chip.dataset.country]
            .filter((value) => value && value.trim())
            .join(", ") || "-",
          timezone: chip.dataset.timezone || "-",
          org: chip.dataset.org || "-",
          userAgent: chip.dataset.userAgent || "-",
        });
      });
    }

    if (usersTableBody) {
      usersTableBody.addEventListener("click", (event) => {
        const target = event.target;
        if (!(target instanceof HTMLElement)) {
          return;
        }
        const infoBtn = target.closest(".admin-user-info-btn");
        if (!infoBtn) {
          return;
        }
        const row = infoBtn.closest("tr");
        const username = row ? String(row.dataset.targetUsername || "").trim() : "";
        if (!username) {
          return;
        }
        const user = payloadUsersCache.find((item) => String(item.username || "") === username);
        if (!user) {
          return;
        }
        openUserInfoModal(user);
      });
    }

    if (manageModal) {
      manageModal.addEventListener("click", (event) => {
        if (event.target === manageModal) {
          closeManageModal();
        }
      });
    }

    if (renewalsCloseBtn) {
      renewalsCloseBtn.addEventListener("click", () => {
        closeRenewalsModal();
      });
    }

    if (renewalsModal) {
      renewalsModal.addEventListener("click", (event) => {
        if (event.target === renewalsModal) {
          closeRenewalsModal();
        }
      });
    }

    if (paymentApprovalBtn) {
      paymentApprovalBtn.addEventListener("click", () => {
        closeRenewalsModal();
        openPaymentsModal();
      });
    }

    if (paymentsCloseBtn) {
      paymentsCloseBtn.addEventListener("click", () => {
        closePaymentsModal();
      });
    }

    if (paymentsModal) {
      paymentsModal.addEventListener("click", (event) => {
        if (event.target === paymentsModal) {
          closePaymentsModal();
        }
      });
    }

    if (deleteCloseBtn) {
      deleteCloseBtn.addEventListener("click", () => {
        closeDeleteModal();
      });
    }

    if (deleteModal) {
      deleteModal.addEventListener("click", (event) => {
        if (event.target === deleteModal) {
          closeDeleteModal();
        }
      });
    }

    if (deleteBody) {
      deleteBody.addEventListener("click", (event) => {
        const target = event.target;
        if (!(target instanceof HTMLElement)) {
          return;
        }
        if (!target.classList.contains("admin-delete-btn")) {
          return;
        }
        const row = target.closest("tr");
        const username = row ? String(row.dataset.targetUsername || "").trim() : "";
        if (!authState || !authState.username || !username) {
          return;
        }
        openDeleteConfirmModal(username);
      });
    }

    if (deleteConfirmCancel) {
      deleteConfirmCancel.addEventListener("click", () => {
        closeDeleteConfirmModal();
      });
    }

    if (deleteConfirmModal) {
      deleteConfirmModal.addEventListener("click", (event) => {
        if (event.target === deleteConfirmModal) {
          closeDeleteConfirmModal();
        }
      });
    }

    if (deleteConfirmAccept) {
      deleteConfirmAccept.addEventListener("click", async () => {
        if (!authState || !authState.username) {
          return;
        }
        const username = deleteConfirmModal ? String(deleteConfirmModal.dataset.username || "").trim() : "";
        if (!username) {
          return;
        }
        try {
          const response = await adminFetchRaw(`${API_BASE_URL}/api/admin/users/delete`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              admin_username: authState.username,
              username,
            }),
          });
          if (!response.ok) {
            return;
          }
          closeDeleteConfirmModal();
          await loadAdminOverview();
        } catch (error) {
          // Ignore for now.
        }
      });
    }

    if (renewalsBody) {
      renewalsBody.addEventListener("click", async (event) => {
        const target = event.target;
        if (!(target instanceof HTMLElement)) {
          return;
        }
        const row = target.closest("tr");
        const username = row ? String(row.dataset.targetUsername || "").trim() : "";
        if (target.classList.contains("admin-renewals-check-btn")) {
          if (paymentUsername && username) {
            paymentUsername.value = username;
          }
          if (paymentDate && !paymentDate.value) {
            const today = new Date();
            paymentDate.value = today.toISOString().slice(0, 10);
          }
          closeRenewalsModal();
          openPaymentsModal();
          return;
        }
        if (target.classList.contains("admin-renewals-extend-btn")) {
          if (!authState || !authState.username || !username) {
            return;
          }
          try {
            const response = await adminFetchRaw(`${API_BASE_URL}/api/admin/users/extend-subscription`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                admin_username: authState.username,
                username,
                renewal_id: row ? row.dataset.renewalId : "",
              }),
            });
            if (!response.ok) {
              return;
            }
            if (row) {
              row.remove();
            }
            const renewalId = row ? String(row.dataset.renewalId || "").trim() : "";
            if (renewalId) {
              renewalRequests = (renewalRequests || []).filter(
                (item) => String(item.id || "").trim() !== renewalId
              );
            } else if (username) {
              const usernameLower = username.toLowerCase();
              renewalRequests = (renewalRequests || []).filter((item) => {
                const target = String(item.submitted_username || item.username || "").toLowerCase();
                return target !== usernameLower;
              });
            }
            renderRenewalRequests(renewalRequests);
            updateRenewalsBadge(renewalRequests.length);
            updateManageBadge(pendingEnrollmentRequests + renewalRequests.length);
          } catch (error) {
            // Ignore for now.
          }
        }
      });
    }

    const handlePaymentUpload = async () => {
      if (!authState || !authState.username) {
        return;
      }
      if (!paymentUsername || !paymentDate || !paymentFile) {
        return;
      }
      const username = paymentUsername.value.trim();
      const dateValue = paymentDate.value;
      const file = paymentFile.files && paymentFile.files[0];
      if (!username || !dateValue || !file) {
        if (paymentMessage) {
          paymentMessage.textContent = "Fill all fields and attach a file.";
        }
        return;
      }
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const response = await adminFetchRaw(`${API_BASE_URL}/api/admin/payment-checks/upload`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              admin_username: authState.username,
              username,
              payment_date: dateValue,
              file_name: file.name,
              file_data: reader.result || "",
            }),
          });
          if (!response.ok) {
            if (paymentMessage) {
              paymentMessage.textContent = "Could not upload payment proof.";
            }
            return;
          }
          if (paymentMessage) {
            paymentMessage.textContent = "Payment proof saved.";
          }
          paymentFile.value = "";
          await loadPaymentChecks();
          createModalCloseLockUntil = Date.now() + 5000;
          if (createModal) {
            createModal.dataset.closeLockUntil = String(createModalCloseLockUntil);
          }
          closePaymentsModal();
          if (createModal && createModal.classList.contains("is-open")) {
            syncCreateApprovalState();
            if (createMessage) {
              createMessage.textContent = "Payment approval added. You can create the user now.";
              createMessage.classList.add("is-success");
            }
          }
        } catch (error) {
          if (paymentMessage) {
            paymentMessage.textContent = "Auth server is not running.";
          }
        }
      };
      reader.readAsDataURL(file);
    };

    if (paymentSubmitBtn) {
      paymentSubmitBtn.addEventListener("click", (event) => {
        if (event) {
          event.preventDefault();
          event.stopPropagation();
        }
        handlePaymentUpload();
      });
    }

    if (knowledgeToggleBtn) {
      knowledgeToggleBtn.addEventListener("click", () => {
        knowledgeAttemptsExpanded = !knowledgeAttemptsExpanded;
        renderKnowledgeAttempts(knowledgeAttemptsCache);
      });
    }

    if (adminUsernameSearchInput) {
      adminUsernameSearchInput.addEventListener("input", () => {
        adminUsernameFilterQuery = normalizeUsernameFilter(adminUsernameSearchInput.value);
        applyAdminUsernameFilters();
      });
    }

    if (requestsSearchInput) {
      requestsSearchInput.addEventListener("input", () => {
        adminRequestsSearchQuery = normalizeRequestsFilter(requestsSearchInput.value);
        applyRequestsFilter();
      });
      requestsSearchInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          adminRequestsSearchQuery = normalizeRequestsFilter(requestsSearchInput.value);
          applyRequestsFilter();
        }
      });
    }
    if (requestsSearchBtn) {
      requestsSearchBtn.addEventListener("click", () => {
        adminRequestsSearchQuery = normalizeRequestsFilter(requestsSearchInput ? requestsSearchInput.value : "");
        applyRequestsFilter();
        if (requestsSearchInput) {
          requestsSearchInput.focus();
        }
      });
    }

    if (adminSearchBtn) {
      adminSearchBtn.addEventListener("click", () => {
        adminUsernameFilterQuery = normalizeUsernameFilter(adminUsernameSearchInput ? adminUsernameSearchInput.value : "");
        applyAdminUsernameFilters();
        if (adminUsernameSearchInput) {
          adminUsernameSearchInput.focus();
        }
      });
    }

	    if (createForm) {
	      createForm.addEventListener("submit", async (event) => {
	        event.preventDefault();
	        const role = getCreateRoleValue();
	        const firstName = createNameInput ? createNameInput.value.trim() : "";
	        const secondName = createSecondNameInput ? createSecondNameInput.value.trim() : "";
	        const phone = createPhoneInput ? createPhoneInput.value.trim() : "";
	        const level = createLevelInput ? createLevelInput.value.trim().toLowerCase() : "";
	        const isExpress = isExpressLevel(level);
	        const lessonSchedule =
	          role === "mentor"
	            ? ""
	            : isExpress
	              ? ""
	              : (createScheduleInput ? createScheduleInput.value.trim() : "");
	        const username = createUsernameInput ? createUsernameInput.value.trim() : "";
	        const password = createPasswordInput ? createPasswordInput.value : "";
	        const mentorIdRaw = createMentorInput ? createMentorInput.value.trim() : "";
	        const mentorId = role === "student" && mentorIdRaw ? Number(mentorIdRaw) : 0;
	        if (!firstName || !phone || !level || !username || !password) {
	          if (createMessage) {
	            createMessage.textContent = "Missing user data. Please reopen the request.";
	            createMessage.classList.remove("is-success");
	          }
	          return;
	        }
	        if (role === "student" && !isExpress && !lessonSchedule) {
	          if (createMessage) {
	            createMessage.textContent = "Select lesson days for this student.";
	            createMessage.classList.remove("is-success");
	          }
	          return;
	        }
	        if (role === "student" && !hasPaymentApproval(username)) {
	          if (createMessage) {
	            createMessage.textContent = "Please add Payment Approval first.";
	            createMessage.classList.remove("is-success");
	          }
	          syncCreateApprovalState();
	          return;
	        }
	        const profilePhotoFile =
	          role === "mentor" && createProfilePhotoInput && createProfilePhotoInput.files
	            ? createProfilePhotoInput.files[0]
	            : null;
	        if (role === "mentor" && !profilePhotoFile) {
	          if (createMessage) {
	            createMessage.textContent = "Please upload Profile Photo first.";
	            createMessage.classList.remove("is-success");
	          }
	          return;
	        }
	        const readFileAsDataUrl = (file) =>
	          new Promise((resolve, reject) => {
	            const reader = new FileReader();
	            reader.onload = () => resolve(reader.result || "");
	            reader.onerror = () => reject(new Error("file_read_failed"));
	            reader.readAsDataURL(file);
	          });
	
	        try {
	          let filePayload = {};
	          if (role === "mentor" && profilePhotoFile) {
	            const fileData = await readFileAsDataUrl(profilePhotoFile);
	            filePayload = {
	              file_name: profilePhotoFile.name,
	              file_data: fileData,
	            };
	          }
	          const response = await adminFetchRaw(`${API_BASE_URL}/api/admin/users/create`, {
	            method: "POST",
	            headers: {
	              "Content-Type": "application/json",
	            },
	            body: JSON.stringify({
	              admin_username: authState.username,
	              role,
	              name: firstName,
	              second_name: secondName,
	              phone,
	              level,
	              lesson_schedule: lessonSchedule,
	              username,
	              password,
	              ...(role === "student" && Number.isFinite(mentorId) && mentorId > 0 ? { mentor_id: mentorId } : {}),
	              ...filePayload,
	            }),
	          });

          const payload = await response.json();
          if (!response.ok) {
            if (createMessage) {
              createMessage.textContent = payload.error || "Could not create user.";
              createMessage.classList.remove("is-success");
            }
            return;
          }

          if (createMessage) {
            createMessage.textContent = `User ${payload.username} created.`;
            createMessage.classList.add("is-success");
          }
          const requestId = activeEnrollmentRequest
            ? Number(activeEnrollmentRequest.id)
            : Number(createModal && createModal.dataset ? createModal.dataset.requestId : 0);
          if (requestId) {
            await markEnrollmentRequestDone(requestId);
          }
          await loadAdminOverview();
          await loadMentors({ render: false, silent: true });
          if (createQueueModal && createQueueModal.classList.contains("is-open")) {
            renderCreateQueue(enrollmentRequests);
          }
          setTimeout(() => {
            closeCreateModal({ force: true });
          }, 700);
        } catch (error) {
          if (createMessage) {
            createMessage.textContent = "Auth server is not running.";
            createMessage.classList.remove("is-success");
          }
        }
      });
    }

    if (editForm) {
      editForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        if (!authState || !authState.username) {
          return;
        }
        if (!editTargetUsername) {
          return;
        }
        const name = editNameInput ? editNameInput.value.trim() : "";
        const phone = editPhoneInput ? editPhoneInput.value.trim() : "";
        const level = editLevelInput ? editLevelInput.value.trim().toLowerCase() : "";
        const schedule = editScheduleInput ? editScheduleInput.value.trim() : "";
        const username = editUsernameInput ? editUsernameInput.value.trim() : "";
        const password = editPasswordInput ? editPasswordInput.value.trim() : "";
        if (!name || !phone || !level || !schedule || !username) {
          if (editMessage) {
            editMessage.textContent = "Fill all required fields before saving.";
            editMessage.classList.remove("is-success");
          }
          return;
        }
        try {
          const response = await adminFetchRaw(`${API_BASE_URL}/api/admin/users/update`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              admin_username: authState.username,
              target_username: editTargetUsername,
              username,
              name,
              phone,
              level,
              lesson_schedule: schedule,
              ...(password ? { password } : {}),
            }),
          });
          const payload = await response.json();
          if (!response.ok) {
            if (editMessage) {
              editMessage.textContent = payload.error || "Could not update user.";
              editMessage.classList.remove("is-success");
            }
            return;
          }
          if (editMessage) {
            const finalUsername = (payload && payload.username) || username || editTargetUsername;
            editMessage.textContent = `User ${finalUsername} updated.`;
            editMessage.classList.add("is-success");
          }
          await loadAdminOverview();
          setTimeout(() => {
            closeEditModal();
          }, 700);
        } catch (error) {
          if (editMessage) {
            editMessage.textContent = "Auth server is not running.";
            editMessage.classList.remove("is-success");
          }
        }
      });
    }

    if (mentorForm) {
      mentorForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        if (!authState || !authState.username) {
          return;
        }
        const name = mentorNameInput ? mentorNameInput.value.trim() : "";
        const level = mentorLevelInput ? mentorLevelInput.value.trim().toLowerCase() : "";
        const phone = mentorPhoneInput ? mentorPhoneInput.value.trim() : "";
        const email = mentorEmailInput ? mentorEmailInput.value.trim() : "";
        const telegram = mentorTelegramInput ? mentorTelegramInput.value.trim() : "";
        const info = mentorInfoInput ? mentorInfoInput.value.trim() : "";
        const file = mentorAvatarInput && mentorAvatarInput.files ? mentorAvatarInput.files[0] : null;
        if (!name || !level || !phone || !email || !telegram || !info || !file) {
          if (mentorMessage) {
            mentorMessage.textContent = "Fill all fields and upload an avatar.";
            mentorMessage.classList.remove("is-success");
          }
          syncMentorAvatarState();
          return;
        }
        const reader = new FileReader();
        reader.onload = async () => {
          try {
            const response = await adminFetchRaw(`${API_BASE_URL}/api/admin/mentors/create`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                admin_username: authState.username,
                name,
                level,
                phone,
                email,
                telegram_username: telegram,
                info,
                file_name: file.name,
                file_data: reader.result || "",
              }),
            });
            const payload = await response.json();
            if (!response.ok) {
              if (mentorMessage) {
                mentorMessage.textContent = payload.error || "Could not create mentor.";
                mentorMessage.classList.remove("is-success");
              }
              return;
            }
            if (mentorMessage) {
              mentorMessage.textContent = `Mentor ${payload.name || name} created.`;
              mentorMessage.classList.add("is-success");
            }
            if (mentorsModal && mentorsModal.classList.contains("is-open")) {
              await loadMentors();
            }
            setTimeout(() => {
              closeMentorModal();
            }, 700);
          } catch (error) {
            if (mentorMessage) {
              mentorMessage.textContent = "Auth server is not running.";
              mentorMessage.classList.remove("is-success");
            }
          }
        };
        reader.readAsDataURL(file);
      });
    }

    if (mentorEditForm) {
      mentorEditForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const file = mentorEditAvatarInput && mentorEditAvatarInput.files ? mentorEditAvatarInput.files[0] : null;
        if (!file) {
          submitMentorEdit({});
          return;
        }
        const reader = new FileReader();
        reader.onload = async () => {
          await submitMentorEdit({
            file_name: file.name,
            file_data: reader.result || "",
          });
        };
        reader.readAsDataURL(file);
      });
    }

    loadAdminOverview();
  }
}

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && loginModal && loginModal.classList.contains("is-open")) {
    closeLoginModal();
    return;
  }
  if (event.key === "Escape" && profileModal && profileModal.classList.contains("is-open")) {
    closeProfileModal();
    return;
  }
  if (event.key === "Escape" && achievementsModal && achievementsModal.classList.contains("is-open")) {
    closeAchievementsModal();
    return;
  }
  if (event.key === "Escape" && leaderboardModal && leaderboardModal.classList.contains("is-open")) {
    closeLeaderboardModal();
    return;
  }
  if (event.key === "Escape" && knowledgeTestModal && knowledgeTestModal.classList.contains("is-open")) {
    // Keep knowledge test result open; close only via explicit close button.
    return;
  }
  if (event.key === "Escape" && enrollModal && enrollModal.classList.contains("is-open")) {
    closeEnrollModal();
    return;
  }
  if (event.key === "Escape" && enrollSuccessModal && enrollSuccessModal.classList.contains("is-open")) {
    closeEnrollSuccessModal();
    return;
  }
  if (event.key === "Escape" && upgradeModal && upgradeModal.classList.contains("is-open")) {
    closeUpgradeModal();
    return;
  }
  if (event.key === "Escape" && resultsModal && resultsModal.classList.contains("is-open")) {
    closeResultsModal();
    return;
  }
  if (event.key === "Escape" && termsModal && termsModal.classList.contains("is-open")) {
    closeTermsModal();
    return;
  }
  if (event.key === "Escape" && privacyModal && privacyModal.classList.contains("is-open")) {
    closePrivacyModal();
    return;
  }
  const createModal = document.getElementById("admin-create-modal");
  if (event.key === "Escape" && createModal && createModal.classList.contains("is-open")) {
    const lockUntil = Number(createModal.dataset.closeLockUntil || 0);
    if (lockUntil && Date.now() < lockUntil) {
      return;
    }
    createModal.classList.remove("is-open");
    createModal.setAttribute("aria-hidden", "true");
  }
  const editModal = document.getElementById("admin-edit-modal");
  if (event.key === "Escape" && editModal && editModal.classList.contains("is-open")) {
    editModal.classList.remove("is-open");
    editModal.setAttribute("aria-hidden", "true");
  }
  const mentorModal = document.getElementById("admin-mentor-modal");
  if (event.key === "Escape" && mentorModal && mentorModal.classList.contains("is-open")) {
    mentorModal.classList.remove("is-open");
    mentorModal.setAttribute("aria-hidden", "true");
  }
  const mentorsModal = document.getElementById("admin-mentors-modal");
  if (event.key === "Escape" && mentorsModal && mentorsModal.classList.contains("is-open")) {
    mentorsModal.classList.remove("is-open");
    mentorsModal.setAttribute("aria-hidden", "true");
    syncModalBodyScroll();
  }
  const mentorEditModal = document.getElementById("admin-mentor-edit-modal");
  if (event.key === "Escape" && mentorEditModal && mentorEditModal.classList.contains("is-open")) {
    mentorEditModal.classList.remove("is-open");
    mentorEditModal.setAttribute("aria-hidden", "true");
    syncModalBodyScroll();
  }
  const progressModal = document.getElementById("admin-progress-modal");
  if (event.key === "Escape" && progressModal && progressModal.classList.contains("is-open")) {
    progressModal.classList.remove("is-open");
    progressModal.setAttribute("aria-hidden", "true");
    syncModalBodyScroll();
    return;
  }
  const requestsModal = document.getElementById("admin-requests-modal");
  if (event.key === "Escape" && requestsModal && requestsModal.classList.contains("is-open")) {
    requestsModal.classList.remove("is-open");
    requestsModal.setAttribute("aria-hidden", "true");
    syncModalBodyScroll();
  }
  const createQueueModal = document.getElementById("admin-create-queue-modal");
  if (event.key === "Escape" && createQueueModal && createQueueModal.classList.contains("is-open")) {
    createQueueModal.classList.remove("is-open");
    createQueueModal.setAttribute("aria-hidden", "true");
    syncModalBodyScroll();
  }
  const devicesModal = document.getElementById("admin-devices-modal");
  if (event.key === "Escape" && devicesModal && devicesModal.classList.contains("is-open")) {
    devicesModal.classList.remove("is-open");
    devicesModal.setAttribute("aria-hidden", "true");
    syncModalBodyScroll();
  }
  const deviceDetailModal = document.getElementById("admin-device-detail-modal");
  if (event.key === "Escape" && deviceDetailModal && deviceDetailModal.classList.contains("is-open")) {
    deviceDetailModal.classList.remove("is-open");
    deviceDetailModal.setAttribute("aria-hidden", "true");
    syncModalBodyScroll();
  }
  const manageModal = document.getElementById("admin-manage-modal");
  if (event.key === "Escape" && manageModal && manageModal.classList.contains("is-open")) {
    manageModal.classList.remove("is-open");
    manageModal.setAttribute("aria-hidden", "true");
    syncModalBodyScroll();
  }
  const renewalsModal = document.getElementById("admin-renewals-modal");
  if (event.key === "Escape" && renewalsModal && renewalsModal.classList.contains("is-open")) {
    renewalsModal.classList.remove("is-open");
    renewalsModal.setAttribute("aria-hidden", "true");
    syncModalBodyScroll();
  }
  const paymentsModal = document.getElementById("admin-payments-modal");
  if (event.key === "Escape" && paymentsModal && paymentsModal.classList.contains("is-open")) {
    paymentsModal.classList.remove("is-open");
    paymentsModal.setAttribute("aria-hidden", "true");
    syncModalBodyScroll();
  }
  const deleteModal = document.getElementById("admin-delete-modal");
  if (event.key === "Escape" && deleteModal && deleteModal.classList.contains("is-open")) {
    deleteModal.classList.remove("is-open");
    deleteModal.setAttribute("aria-hidden", "true");
    syncModalBodyScroll();
  }
  const deleteConfirmModal = document.getElementById("admin-delete-confirm-modal");
  if (event.key === "Escape" && deleteConfirmModal && deleteConfirmModal.classList.contains("is-open")) {
    deleteConfirmModal.classList.remove("is-open");
    deleteConfirmModal.setAttribute("aria-hidden", "true");
    syncModalBodyScroll();
  }
  const editCodeModal = document.getElementById("admin-edit-code-modal");
  if (event.key === "Escape" && editCodeModal && editCodeModal.classList.contains("is-open")) {
    editCodeModal.classList.remove("is-open");
    editCodeModal.setAttribute("aria-hidden", "true");
    syncModalBodyScroll();
  }
  const teamModal = document.getElementById("team-modal");
  if (event.key === "Escape" && teamModal && teamModal.classList.contains("is-open")) {
    teamModal.classList.remove("is-open");
    teamModal.setAttribute("aria-hidden", "true");
    syncModalBodyScroll();
  }
  const teamMemberModal = document.getElementById("team-member-modal");
  if (event.key === "Escape" && teamMemberModal && teamMemberModal.classList.contains("is-open")) {
    teamMemberModal.classList.remove("is-open");
    teamMemberModal.setAttribute("aria-hidden", "true");
    syncModalBodyScroll();
  }
  const teamGateModal = document.getElementById("admin-team-edit-code-modal");
  if (event.key === "Escape" && teamGateModal && teamGateModal.classList.contains("is-open")) {
    teamGateModal.classList.remove("is-open");
    teamGateModal.setAttribute("aria-hidden", "true");
    syncModalBodyScroll();
  }
  const teamManagerModal = document.getElementById("admin-team-manager-modal");
  if (event.key === "Escape" && teamManagerModal && teamManagerModal.classList.contains("is-open")) {
    teamManagerModal.classList.remove("is-open");
    teamManagerModal.setAttribute("aria-hidden", "true");
    syncModalBodyScroll();
  }
  const teamEditModal = document.getElementById("admin-team-edit-modal");
  if (event.key === "Escape" && teamEditModal && teamEditModal.classList.contains("is-open")) {
    teamEditModal.classList.remove("is-open");
    teamEditModal.setAttribute("aria-hidden", "true");
    syncModalBodyScroll();
  }
  const lessonsManagerModal = document.getElementById("admin-lessons-manager-modal");
  if (event.key === "Escape" && lessonsManagerModal && lessonsManagerModal.classList.contains("is-open")) {
    lessonsManagerModal.classList.remove("is-open");
    lessonsManagerModal.setAttribute("aria-hidden", "true");
    syncModalBodyScroll();
  }
  const lessonEditModal = document.getElementById("admin-lesson-edit-modal");
  if (event.key === "Escape" && lessonEditModal && lessonEditModal.classList.contains("is-open")) {
    requestCloseLessonEditor();
  }
  const unsavedModal = document.getElementById("admin-unsaved-confirm-modal");
  if (event.key === "Escape" && unsavedModal && unsavedModal.classList.contains("is-open")) {
    unsavedModal.classList.remove("is-open");
    unsavedModal.setAttribute("aria-hidden", "true");
    syncModalBodyScroll();
  }
  const quizModal = document.getElementById("admin-quiz-editor-modal");
  if (event.key === "Escape" && quizModal && quizModal.classList.contains("is-open")) {
    quizModal.classList.remove("is-open");
    quizModal.setAttribute("aria-hidden", "true");
    syncModalBodyScroll();
  }
  const dailyModal = document.getElementById("daily-content-modal");
  if (event.key === "Escape" && dailyModal && dailyModal.classList.contains("is-open")) {
    closeAdminModal("daily-content-modal");
  }
});

// ── Daily content cards ───────────────────────────────────────────────────────
(() => {
  const motivationEl = document.getElementById("daily-motivation-text");
  const tipEl = document.getElementById("daily-tip-text");
  const motivationEditBtn = document.getElementById("daily-motivation-edit-btn");
  const tipEditBtn = document.getElementById("daily-tip-edit-btn");

  // Show edit buttons only for admins
  const _auth = getAuthState();
  if (_auth && _auth.role === "admin" && _auth.username) {
    if (motivationEditBtn) motivationEditBtn.hidden = false;
    if (tipEditBtn) tipEditBtn.hidden = false;
  }

  // Fetch and render today's content
  ensureApiBaseUrl().then(() => {
    fetchWithTimeout(`${API_BASE_URL}/api/daily-content`, {}, 4000)
      .then((resp) => resp.ok ? resp.json() : null)
      .then((data) => {
        if (!data) return;
        if (data.motivation && motivationEl) motivationEl.textContent = data.motivation.text;
        if (data.tip && tipEl) tipEl.textContent = data.tip.text;
      })
      .catch(() => {});
  });

  // ── Admin editor state ──
  let _editType = "motivation";
  let _verifiedCode = "";

  const getStoredCode = () => {
    const auth = getAuthState();
    if (!auth || !auth.username) return "";
    try { return localStorage.getItem(`${ADMIN_EDIT_CODE_STORAGE_PREFIX}${auth.username}`) || ""; } catch (_e) { return ""; }
  };

  const saveStoredCode = (code) => {
    const auth = getAuthState();
    if (!auth || !auth.username) return;
    try { localStorage.setItem(`${ADMIN_EDIT_CODE_STORAGE_PREFIX}${auth.username}`, code); } catch (_e) { /* */ }
  };

  const clearStoredCode = () => {
    const auth = getAuthState();
    if (!auth || !auth.username) return;
    try { localStorage.removeItem(`${ADMIN_EDIT_CODE_STORAGE_PREFIX}${auth.username}`); } catch (_e) { /* */ }
  };

  const adminPayload = () => {
    const auth = getAuthState();
    return { admin_username: (auth && auth.username) || "", code: _verifiedCode };
  };

  // ── Daily PIN modal helpers ──
  const openDailyPinModal = () => {
    const input = document.getElementById("daily-pin-input");
    const status = document.getElementById("daily-pin-status");
    if (input) { input.value = ""; input.focus(); }
    if (status) status.textContent = "";
    openAdminModal("daily-pin-modal");
  };

  const closeDailyPinModal = () => closeAdminModal("daily-pin-modal");

  const sendPin = async () => {
    const auth = getAuthState();
    const statusEl = document.getElementById("daily-pin-status");
    if (statusEl) statusEl.textContent = "Sending PIN...";
    try {
      await ensureApiBaseUrl();
      const res = await adminPostJson("/api/admin/edit-access/request", { admin_username: auth.username });
      if (res.ok && res.data && res.data.ok) {
        if (statusEl) statusEl.textContent = "PIN sent to Telegram.";
      } else {
        const err = (res.data && res.data.error) || "error";
        if (statusEl) statusEl.textContent =
          err === "admin_telegram_not_linked" || err === "telegram_chat_id_not_linked"
            ? "Telegram not linked to this account."
            : err === "telegram_bot_not_configured" ? "Telegram bot not configured."
            : "Failed to send PIN.";
      }
    } catch (_e) {
      if (statusEl) statusEl.textContent = "Server error.";
    }
  };

  // ── Content editor ──
  const openDailyEditor = async (type) => {
    _editType = type;
    const modal = document.getElementById("daily-content-modal");
    const titleEl = document.getElementById("daily-content-modal-title");
    const listEl = document.getElementById("daily-content-list");
    const statusEl = document.getElementById("daily-content-status");
    if (!modal) return;
    if (titleEl) titleEl.textContent = type === "motivation" ? "Edit Daily Motivations" : "Edit Daily Tips";
    if (listEl) listEl.innerHTML = "<div class='admin-lessons-status'>Loading...</div>";
    if (statusEl) statusEl.textContent = "";
    openAdminModal("daily-content-modal");
    await renderDailyList(type);
  };

  const AUTH_ERRORS = new Set(["pin_expired", "pin_not_requested", "invalid_code", "banned", "invalid_request"]);

  const showReauthPrompt = (statusEl, type) => {
    if (!statusEl) return;
    statusEl.innerHTML = "";
    const msg = document.createElement("span");
    msg.textContent = "Code expired. ";
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = "Re-authenticate";
    btn.style.cssText = "background:#1e88e5;color:#fff;border:none;border-radius:8px;padding:3px 10px;cursor:pointer;font-size:0.85rem;margin-left:4px;";
    btn.addEventListener("click", () => {
      _verifiedCode = "";
      clearStoredCode();
      closeAdminModal("daily-content-modal");
      openDailyPinModal();
      sendPin();
      window.__ewmsDailyReauthType = type;
    });
    statusEl.appendChild(msg);
    statusEl.appendChild(btn);
  };

  const renderDailyList = async (type) => {
    const listEl = document.getElementById("daily-content-list");
    const statusEl = document.getElementById("daily-content-status");
    if (!listEl) return;
    try {
      await ensureApiBaseUrl();
      const resp = await fetchWithTimeout(`${API_BASE_URL}/api/admin/daily-content/list`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...adminPayload(), type }),
      }, 6000);
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok || !data.items) {
        const err = data.error || "";
        if (AUTH_ERRORS.has(err)) {
          listEl.innerHTML = "";
          showReauthPrompt(statusEl, type);
        } else {
          if (statusEl) statusEl.textContent = err || "Failed to load.";
          listEl.innerHTML = "";
        }
        return;
      }
      listEl.innerHTML = "";
      // Track unsaved changes: Set of item ids with unsaved edits
      const _unsaved = new Set();
      data.items.forEach((item) => {
        const row = document.createElement("div");
        row.className = "daily-content-item" + (item.active ? "" : " is-inactive");
        const textarea = document.createElement("textarea");
        textarea.className = "daily-content-item-text";
        textarea.value = item.text;
        textarea.rows = 2;
        const actions = document.createElement("div");
        actions.className = "daily-content-item-actions";

        // Save button — shows "Saved" until edited again
        const saveBtn = document.createElement("button");
        saveBtn.type = "button";
        saveBtn.className = "daily-content-btn daily-content-btn--save";
        saveBtn.textContent = "Save";
        saveBtn.disabled = true; // disabled until text changes

        // Toggle button
        const toggleBtn = document.createElement("button");
        toggleBtn.type = "button";
        toggleBtn.className = "daily-content-btn daily-content-btn--toggle" + (item.active ? "" : " is-show");
        toggleBtn.textContent = item.active ? "Hide" : "Show";

        const delBtn = document.createElement("button");
        delBtn.type = "button";
        delBtn.className = "daily-content-btn daily-content-btn--delete";
        delBtn.textContent = "✕";

        // Enable Save when text changes
        textarea.addEventListener("input", () => {
          const changed = textarea.value.trim() !== item.text;
          saveBtn.disabled = !changed;
          if (changed) {
            saveBtn.textContent = "Save";
            _unsaved.add(item.id);
          } else {
            _unsaved.delete(item.id);
          }
        });

        saveBtn.addEventListener("click", async () => {
          const newText = textarea.value.trim();
          if (!newText) return;
          saveBtn.disabled = true;
          saveBtn.textContent = "Saving...";
          const res = await fetchWithTimeout(`${API_BASE_URL}/api/admin/daily-content/update`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...adminPayload(), id: item.id, text: newText }),
          }, 6000).catch(() => null);
          if (res && res.ok) {
            item.text = newText; // update baseline
            saveBtn.textContent = "Saved";
            saveBtn.disabled = true; // stays disabled until next edit
            _unsaved.delete(item.id);
          } else {
            saveBtn.textContent = "Save";
            saveBtn.disabled = false;
          }
        });

        toggleBtn.addEventListener("click", async () => {
          const newActive = !item.active;
          await fetchWithTimeout(`${API_BASE_URL}/api/admin/daily-content/update`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...adminPayload(), id: item.id, active: newActive }),
          }, 6000).catch(() => null);
          item.active = newActive;
          row.className = "daily-content-item" + (newActive ? "" : " is-inactive");
          toggleBtn.textContent = newActive ? "Hide" : "Show";
          toggleBtn.className = "daily-content-btn daily-content-btn--toggle" + (newActive ? "" : " is-show");
        });

        // Store unsaved tracker reference on the list element
        if (!listEl._unsaved) listEl._unsaved = _unsaved;

        delBtn.addEventListener("click", async () => {
          if (!confirm("Delete this item?")) return;
          await fetchWithTimeout(`${API_BASE_URL}/api/admin/daily-content/delete`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...adminPayload(), id: item.id }),
          }, 6000).catch(() => null);
          row.remove();
        });

        actions.append(saveBtn, toggleBtn, delBtn);
        row.append(textarea, actions);
        listEl.appendChild(row);
      });
    } catch (_e) {
      if (statusEl) statusEl.textContent = "Error loading content.";
    }
  };

  // ── Wire up Edit buttons ──
  const onEditClick = async (type) => {
    const auth = getAuthState();
    if (!auth || auth.role !== "admin") return;
    _editType = type;

    // Try stored code first
    const stored = getStoredCode();
    if (stored) {
      try {
        await ensureApiBaseUrl();
        const res = await adminPostJson("/api/admin/edit-access/verify", { admin_username: auth.username, code: stored });
        if (res.ok && res.data && res.data.ok) {
          _verifiedCode = stored;
          openDailyEditor(type);
          return;
        }
      } catch (_e) { /* */ }
      clearStoredCode();
    }

    // No valid stored code — open PIN modal and immediately send PIN
    openDailyPinModal();
    sendPin();
  };

  if (motivationEditBtn) motivationEditBtn.addEventListener("click", () => onEditClick("motivation"));
  if (tipEditBtn) tipEditBtn.addEventListener("click", () => onEditClick("tip"));

  // PIN modal submit
  const pinSubmitBtn = document.getElementById("daily-pin-submit");
  const pinResendBtn = document.getElementById("daily-pin-resend");
  const pinCloseBtn = document.getElementById("daily-pin-close");
  const pinInput = document.getElementById("daily-pin-input");

  if (pinSubmitBtn) {
    pinSubmitBtn.addEventListener("click", async () => {
      const code = (pinInput && pinInput.value.trim()) || "";
      const statusEl = document.getElementById("daily-pin-status");
      if (!code) { if (statusEl) statusEl.textContent = "Enter the code."; return; }
      if (statusEl) statusEl.textContent = "Checking...";
      pinSubmitBtn.disabled = true;
      try {
        const auth = getAuthState();
        await ensureApiBaseUrl();
        const res = await adminPostJson("/api/admin/edit-access/verify", { admin_username: auth.username, code });
        if (res.ok && res.data && res.data.ok) {
          _verifiedCode = code;
          if (/[A-Za-z]/.test(code) || res.data.method === "permanent") saveStoredCode(code);
          const typeToOpen = window.__ewmsDailyReauthType || _editType;
          window.__ewmsDailyReauthType = null;
          closeDailyPinModal();
          openDailyEditor(typeToOpen);
        } else {
          const err = (res.data && res.data.error) || "wrong_code";
          const left = res.data && res.data.attempts_left;
          if (statusEl) statusEl.textContent = err === "banned" ? "Too many attempts. Banned." :
            left ? `Wrong code. Attempts left: ${left}` : "Wrong code.";
        }
      } catch (_e) {
        const statusEl = document.getElementById("daily-pin-status");
        if (statusEl) statusEl.textContent = "Server error.";
      }
      pinSubmitBtn.disabled = false;
    });
  }

  if (pinInput) {
    pinInput.addEventListener("keydown", (e) => { if (e.key === "Enter") pinSubmitBtn && pinSubmitBtn.click(); });
  }

  if (pinResendBtn) pinResendBtn.addEventListener("click", sendPin);
  if (pinCloseBtn) pinCloseBtn.addEventListener("click", closeDailyPinModal);

  // Daily content editor close — warn about unsaved changes
  const editorCloseBtn = document.getElementById("daily-content-modal-close");
  const closeDailyEditor = () => {
    const listEl = document.getElementById("daily-content-list");
    const unsaved = listEl && listEl._unsaved;
    if (unsaved && unsaved.size > 0) {
      if (!confirm(`You have ${unsaved.size} unsaved change(s). Close anyway? Unsaved text will be lost.`)) return;
    }
    closeAdminModal("daily-content-modal");
  };
  if (editorCloseBtn) editorCloseBtn.addEventListener("click", closeDailyEditor);

  // Add new item
  const addBtn = document.getElementById("daily-content-add-btn");
  if (addBtn) {
    addBtn.addEventListener("click", async () => {
      const textarea = document.getElementById("daily-content-new-text");
      const statusEl = document.getElementById("daily-content-status");
      const text = (textarea && textarea.value.trim()) || "";
      if (!text) { if (statusEl) statusEl.textContent = "Enter text first."; return; }
      addBtn.disabled = true;
      try {
        await ensureApiBaseUrl();
        const resp = await fetchWithTimeout(`${API_BASE_URL}/api/admin/daily-content/create`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...adminPayload(), type: _editType, text }),
        }, 6000);
        const data = await resp.json().catch(() => ({}));
        if (resp.ok && data.ok) {
          if (textarea) textarea.value = "";
          if (statusEl) statusEl.textContent = "";
          await renderDailyList(_editType);
        } else {
          const err = data.error || "Failed to add.";
          if (AUTH_ERRORS.has(err)) {
            showReauthPrompt(statusEl, _editType);
          } else {
            if (statusEl) statusEl.textContent = err;
          }
        }
      } catch (_e) {
        const statusEl = document.getElementById("daily-content-status");
        if (statusEl) statusEl.textContent = "Error.";
      }
      addBtn.disabled = false;
    });
  }
})();
