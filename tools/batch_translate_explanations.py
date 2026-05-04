#!/usr/bin/env python3
import argparse
import json
import os
import re
import sys
import urllib.error
import urllib.request
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[1]
QUIZZES_ROOT = REPO_ROOT / "backend" / "quizzes"


def first_sentence(text: str) -> str:
    cleaned = str(text or "").strip()
    if not cleaned:
        return ""
    match = re.match(r"^(.*?[.!?])\s", cleaned)
    return match.group(1).strip() if match else cleaned


def normalize_translate_endpoint(url: str) -> str:
    cleaned = str(url or "").strip()
    if not cleaned:
        return ""
    if cleaned.endswith("/translate"):
        return cleaned
    if cleaned.endswith("/"):
        return f"{cleaned}translate"
    return f"{cleaned}/translate"


class Translator:
    def __init__(self, base_url: str, api_key: str = "", timeout: float = 20.0):
        self.endpoint = normalize_translate_endpoint(base_url)
        self.api_key = str(api_key or "").strip()
        self.timeout = float(timeout)
        self.cache: dict[tuple[str, str], str] = {}

    def translate(self, text: str, target_lang: str, source_lang: str = "en") -> str:
        payload_text = str(text or "").strip()
        lang = str(target_lang or "").strip().lower()
        if not payload_text or not lang:
            return ""
        key = (payload_text, lang)
        if key in self.cache:
            return self.cache[key]
        if not self.endpoint:
            raise RuntimeError("Translation endpoint is not configured.")

        payload: dict[str, str] = {
            "q": payload_text,
            "source": str(source_lang or "en").strip() or "en",
            "target": lang,
            "format": "text",
        }
        if self.api_key:
            payload["api_key"] = self.api_key
        data = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        request = urllib.request.Request(
            self.endpoint,
            data=data,
            headers={
                "Content-Type": "application/json",
                "Accept": "application/json",
                "User-Agent": "EWMS/1.0",
            },
            method="POST",
        )
        try:
            with urllib.request.urlopen(request, timeout=self.timeout) as response:
                raw = response.read().decode("utf-8", errors="replace")
                decoded = json.loads(raw) if raw else {}
        except (OSError, urllib.error.URLError, json.JSONDecodeError) as exc:
            raise RuntimeError(f"Translation request failed: {exc}") from exc

        translated = str((decoded or {}).get("translatedText", "") or "").strip()
        self.cache[key] = translated
        return translated


def iter_quiz_files(course: str | None) -> list[Path]:
    if not QUIZZES_ROOT.exists():
        return []
    if course:
        root = QUIZZES_ROOT / course
        return sorted(root.glob("lesson-*.json")) if root.exists() else []
    return sorted(QUIZZES_ROOT.glob("*/*.json"))


def load_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8-sig"))


def dump_json(path: Path, data) -> None:
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def ensure_mode_translations(question: dict, translator: Translator, overwrite: bool) -> bool:
    main_en = str(question.get("explanation", "") or "").strip()
    if not main_en:
        return False
    simple_en = str(question.get("explanation_simple", "") or "").strip() or first_sentence(main_en) or main_en
    detailed_en = str(question.get("explanation_detailed", "") or "").strip() or main_en

    existing = question.get("explanation_translations") if isinstance(question.get("explanation_translations"), dict) else {}
    if not overwrite and existing and isinstance(existing, dict):
        has_ru = "ru" in existing
        has_uz = "uz" in existing
        if has_ru and has_uz:
            return False

    translations = dict(existing) if isinstance(existing, dict) else {}

    for lang in ("ru", "uz"):
        current = translations.get(lang) if isinstance(translations.get(lang), dict) else {}
        if not overwrite and isinstance(current, dict) and current.get("main") and current.get("simple") and current.get("detailed"):
            continue
        mode_map = dict(current) if isinstance(current, dict) else {}
        mode_map["main"] = translator.translate(main_en, lang)
        mode_map["simple"] = translator.translate(simple_en, lang)
        mode_map["detailed"] = translator.translate(detailed_en, lang)
        translations[lang] = mode_map

    question["explanation_translations"] = translations
    return True


def main() -> int:
    parser = argparse.ArgumentParser(description="Batch-translate quiz explanations and persist into lesson JSON files.")
    parser.add_argument("--course", default="", help="Course folder (a1, a2). Empty = all.")
    parser.add_argument("--translate-url", default=os.environ.get("EWMS_TRANSLATE_URL", ""), help="LibreTranslate base URL.")
    parser.add_argument("--api-key", default=os.environ.get("EWMS_TRANSLATE_API_KEY", ""), help="LibreTranslate API key.")
    parser.add_argument("--overwrite", action="store_true", help="Overwrite existing ru/uz translations.")
    parser.add_argument("--dry-run", action="store_true", help="Do not write files, only report.")
    args = parser.parse_args()

    files = iter_quiz_files(args.course.strip().lower() or None)
    if not files:
        print("No quiz JSON files found.", file=sys.stderr)
        return 2

    translator = Translator(args.translate_url, api_key=args.api_key)
    touched_files = 0
    touched_questions = 0
    for fp in files:
        raw = load_json(fp)
        if not isinstance(raw, list):
            continue
        changed = False
        for item in raw:
            if not isinstance(item, dict):
                continue
            if ensure_mode_translations(item, translator, overwrite=args.overwrite):
                changed = True
                touched_questions += 1
        if changed:
            touched_files += 1
            if not args.dry_run:
                dump_json(fp, raw)
            print(("DRY " if args.dry_run else "") + f"updated: {fp.relative_to(REPO_ROOT)}")

    print(f"files: {touched_files}, questions: {touched_questions}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

