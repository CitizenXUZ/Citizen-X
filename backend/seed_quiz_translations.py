"""
Startup seeding script: merges explanation_translations from quizzes_bundle
into the runtime quizzes directory.

Why this exists:
  If Railway (or any host) mounts a persistent volume at the 'backend/quizzes'
  directory, the volume's files shadow the ones deployed from GitHub. This means
  that adding translations to quiz JSON files in the repo and redeploying has no
  effect — the volume still serves old files without translations.

  This script runs before the server starts (see start.sh). It reads each quiz
  file from 'backend/quizzes_bundle/' (which is NEVER volume-mounted because it
  is at a different path) and writes any missing explanation_translations into the
  corresponding file in the runtime 'backend/quizzes/' directory. It never
  removes or overwrites existing content — it only ADDS translations that are
  missing.
"""

import json
import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
BUNDLE_DIR = BASE_DIR / "quizzes_bundle"
QUIZ_DIR = BASE_DIR / "quizzes"


def seed():
    if not BUNDLE_DIR.exists():
        print("[seed_translations] No quizzes_bundle directory found — skipping.", flush=True)
        return

    patched = 0
    skipped = 0

    for bundle_file in sorted(BUNDLE_DIR.rglob("*.json")):
        rel = bundle_file.relative_to(BUNDLE_DIR)
        quiz_file = QUIZ_DIR / rel

        if not quiz_file.exists():
            continue

        try:
            with open(bundle_file, encoding="utf-8") as f:
                bundle_questions = json.load(f)
            with open(quiz_file, encoding="utf-8") as f:
                quiz_questions = json.load(f)
        except Exception as e:
            print(f"[seed_translations] Error reading {rel}: {e}", flush=True)
            continue

        # Build lookup: question_id → explanation_translations (from bundle)
        bundle_translations: dict = {}
        for q in bundle_questions:
            qid = q.get("id")
            trans = q.get("explanation_translations")
            if qid is not None and isinstance(trans, dict) and trans:
                bundle_translations[qid] = trans

        if not bundle_translations:
            skipped += 1
            continue

        # Merge into runtime quiz questions — only fill gaps, never overwrite
        changed = False
        for q in quiz_questions:
            qid = q.get("id")
            if qid not in bundle_translations:
                continue
            existing = q.get("explanation_translations")
            if isinstance(existing, dict) and existing:
                # Already has translations — check if any languages are missing
                bundle_langs = bundle_translations[qid]
                for lang, lang_data in bundle_langs.items():
                    if lang not in existing:
                        existing[lang] = lang_data
                        changed = True
            else:
                # No translations at all — add from bundle
                q["explanation_translations"] = bundle_translations[qid]
                changed = True

        if changed:
            try:
                with open(quiz_file, "w", encoding="utf-8") as f:
                    json.dump(quiz_questions, f, ensure_ascii=False, indent=2)
                print(f"[seed_translations] Patched: {rel}", flush=True)
                patched += 1
            except Exception as e:
                print(f"[seed_translations] Error writing {rel}: {e}", flush=True)
        else:
            skipped += 1

    print(
        f"[seed_translations] Done — {patched} file(s) patched, {skipped} already up-to-date.",
        flush=True,
    )


if __name__ == "__main__":
    try:
        seed()
    except Exception as e:
        print(f"[seed_translations] Unexpected error: {e}", flush=True)
        sys.exit(0)  # Don't block server startup on seed failure
