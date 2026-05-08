import base64
import hashlib
import ipaddress
import json
import mimetypes
import os
import re
import secrets
import shutil
import string
import sqlite3
import urllib.error
import urllib.request
import zipfile
from datetime import datetime, timedelta, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, quote, urlparse, urlencode, unquote


BASE_DIR = Path(__file__).resolve().parent
WEB_ROOT = BASE_DIR.parent


def load_env_file(path: Path):
    if not path.exists():
        return
    try:
        content = path.read_text(encoding="utf-8")
    except OSError:
        return
    for raw_line in content.splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        if key and key not in os.environ:
            os.environ[key] = value


def load_env():
    load_env_file(BASE_DIR / ".env")
    load_env_file(BASE_DIR.parent / ".env")


load_env()

LEGACY_DB_PATH = BASE_DIR / "database.db"
DEFAULT_DB_DIR = Path(os.environ.get("EWMS_DB_DIR") or (Path.home() / ".ewms"))
DEFAULT_DB_DIR.mkdir(parents=True, exist_ok=True)
DB_PATH = DEFAULT_DB_DIR / "database.db"
OPEN_ACCESS = os.environ.get("EWMS_OPEN_ACCESS", "").strip().lower() in {"1", "true", "yes", "on"}
if LEGACY_DB_PATH.exists() and not DB_PATH.exists():
    try:
        shutil.copy2(LEGACY_DB_PATH, DB_PATH)
    except OSError:
        pass
HOST = os.environ.get("EWMS_HOST", "0.0.0.0")
try:
    PORT = int(os.environ.get("EWMS_PORT") or os.environ.get("PORT") or "8000")
except (TypeError, ValueError):
    PORT = 8000
SESSION_TTL_DAYS = 7
LESSON_UNLOCK_INTERVAL_DAYS = 2
ADMIN_EDIT_PIN_TTL_MINUTES = 10
ADMIN_EDIT_PIN_MAX_ATTEMPTS = 5
ADMIN_EDIT_BAN_MINUTES = 30
LOCAL_TZ_OFFSET_HOURS = int(os.environ.get("EWMS_TZ_OFFSET_HOURS", "5"))
LOCAL_TZ = timezone(timedelta(hours=LOCAL_TZ_OFFSET_HOURS))
HOMEWORK_MAX_BYTES = 10 * 1024 * 1024
HOMEWORK_ALLOWED_EXTENSIONS = {
    ".pdf",
    ".doc",
    ".docx",
    ".jpg",
    ".jpeg",
    ".png",
    ".mp3",
    ".m4a",
    ".wav",
}
TG_BOT_TOKEN = os.environ.get("TG_BOT_TOKEN", "").strip()
RAW_TG_ADMIN_IDS = os.environ.get("TG_ADMIN_IDS", "")
BOT_SYNC_TOKEN = os.environ.get("BOT_SYNC_TOKEN", "").strip()
DEFAULT_LESSON_SCHEDULE_KEY = "mwf"
LESSON_SCHEDULE_WEEKDAYS = {
    "mwf": (0, 2, 4),
    "tthsa": (1, 3, 5),
}
LESSON_SCHEDULE_LABELS = {
    "mwf": "Mon / Wed / Fri",
    "tthsa": "Tue / Thu / Sat",
}
COURSE_LESSON_COUNTS = {
    "a1": 20,
    "a2": 13,
    "b1": 27,
    "b2": 8,
}


_LESSON_TITLES_CACHE: dict[str, dict[int, str]] | None = None


def _extract_object_block(source: str, marker: str) -> str:
    idx = source.find(marker)
    if idx < 0:
        return ""
    start = source.find("{", idx)
    if start < 0:
        return ""
    depth = 0
    for i in range(start, len(source)):
        ch = source[i]
        if ch == "{":
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0:
                return source[start : i + 1]
    return ""


def _parse_lesson_titles_from_script() -> dict[str, dict[int, str]]:
    script_path = WEB_ROOT / "js" / "script.js"
    try:
        text = script_path.read_text(encoding="utf-8", errors="replace")
    except OSError:
        return {}

    titles: dict[str, dict[int, str]] = {}

    def parse_var(course: str, var_name: str):
        block = _extract_object_block(text, f"const {var_name} =")
        if not block:
            return
        found = {}
        for match in re.finditer(r"(?s)\\b(\\d+)\\s*:\\s*\\{.*?\\btitle\\s*:\\s*\\\"([^\\\"]+)\\\"", block):
            num = int(match.group(1))
            title = match.group(2)
            found[num] = title
        if found:
            titles[course] = found

    parse_var("a1", "a1Lessons")
    parse_var("a2", "a2Lessons")

    lessons_by_course_block = _extract_object_block(text, "const LESSONS_BY_COURSE =")
    if lessons_by_course_block:
        for course in ("b1", "b2"):
            course_block = _extract_object_block(lessons_by_course_block, f"{course}:")
            if not course_block:
                continue
            found = {}
            for match in re.finditer(r"(?s)\\b(\\d+)\\s*:\\s*\\{\\s*title\\s*:\\s*\\\"([^\\\"]+)\\\"", course_block):
                found[int(match.group(1))] = match.group(2)
            if found:
                titles[course] = found

    return titles


def get_lesson_titles_cache() -> dict[str, dict[int, str]]:
    global _LESSON_TITLES_CACHE
    if _LESSON_TITLES_CACHE is None:
        _LESSON_TITLES_CACHE = _parse_lesson_titles_from_script()
    return _LESSON_TITLES_CACHE


def get_lesson_title(course: str, lesson_number: int) -> str:
    course_key = str(course or "").strip().lower()
    try:
        lesson_number = int(lesson_number)
    except (TypeError, ValueError):
        lesson_number = 0
    if lesson_number <= 0:
        return ""

    # Allow admin overrides to take precedence.
    try:
        overrides = load_lesson_overrides(course_key)
    except Exception:
        overrides = []
    for item in overrides if isinstance(overrides, list) else []:
        if not isinstance(item, dict):
            continue
        if int(item.get("lesson_number") or 0) == lesson_number:
            title = str(item.get("title") or "").strip()
            if title:
                return title

    cache = get_lesson_titles_cache()
    return str((cache.get(course_key) or {}).get(lesson_number) or "")
EXPRESS_LEVEL_SUFFIXES = ("-express", " express", "_express")
TRANSLATE_URL = os.environ.get("EWMS_TRANSLATE_URL", "").strip()
TRANSLATE_API_KEY = os.environ.get("EWMS_TRANSLATE_API_KEY", "").strip()


def _normalize_translate_endpoint(url: str) -> str:
    cleaned = str(url or "").strip()
    if not cleaned:
        return ""
    if cleaned.endswith("/translate"):
        return cleaned
    if cleaned.endswith("/"):
        return f"{cleaned}translate"
    return f"{cleaned}/translate"


def translate_text(text: str, target_lang: str, source_lang: str = "en") -> str | None:
    endpoint = _normalize_translate_endpoint(TRANSLATE_URL)
    payload_text = str(text or "").strip()
    if not endpoint or not payload_text:
        return None
    payload = {
        "q": payload_text,
        "source": str(source_lang or "en").strip() or "en",
        "target": str(target_lang or "").strip().lower(),
        "format": "text",
    }
    if TRANSLATE_API_KEY:
        payload["api_key"] = TRANSLATE_API_KEY
    data = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    request = urllib.request.Request(
        endpoint,
        data=data,
        headers={
            "Content-Type": "application/json",
            "Accept": "application/json",
            "User-Agent": "EWMS/1.0",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=10) as response:
            raw = response.read().decode("utf-8", errors="replace")
            decoded = json.loads(raw) if raw else {}
    except (OSError, urllib.error.URLError, json.JSONDecodeError):
        return None
    translated = str((decoded or {}).get("translatedText", "") or "").strip()
    return translated or None


def _first_sentence(text: str) -> str:
    cleaned = str(text or "").strip()
    if not cleaned:
        return ""
    match = re.match(r"^(.*?[.!?])\s", cleaned)
    return match.group(1).strip() if match else cleaned


def _normalize_explanation_translation_map(raw) -> dict[str, dict[str, str]]:
    normalized: dict[str, dict[str, str]] = {}
    if not isinstance(raw, dict):
        return normalized
    for lang_key, value in raw.items():
        lang = str(lang_key or "").strip().lower()
        if not lang:
            continue
        if isinstance(value, str):
            text = value.strip()
            if text:
                normalized[lang] = {"main": text}
            continue
        if isinstance(value, dict):
            modes: dict[str, str] = {}
            for mode_key, mode_value in value.items():
                mode = str(mode_key or "").strip().lower()
                text = str(mode_value or "").strip()
                if mode and text:
                    modes[mode] = text
            if modes:
                normalized[lang] = modes
    return normalized


def parse_chat_ids(raw_value: str):
    ids = []
    for part in str(raw_value or "").split(","):
        cleaned = part.strip()
        if not cleaned:
            continue
        try:
            ids.append(int(cleaned))
        except ValueError:
            continue
    return ids


TG_ADMIN_IDS = parse_chat_ids(RAW_TG_ADMIN_IDS)


def build_contact_message(name: str, email: str, message: str, client_ip: str, user_agent: str) -> str:
    safe_message = str(message or "").replace("\r", "").strip()
    if len(safe_message) > 1200:
        safe_message = safe_message[:1197].rstrip() + "..."
    timestamp = datetime.now(LOCAL_TZ).strftime("%Y-%m-%d %H:%M")
    tz_label = f"GMT{LOCAL_TZ_OFFSET_HOURS:+d}"
    lines = [
        "New message from website",
        f"Name: {name}",
        f"Email: {email}",
        f"Message: {safe_message}",
        f"Time: {timestamp} ({tz_label})",
    ]
    if client_ip:
        lines.append(f"IP: {client_ip}")
    if user_agent:
        lines.append(f"UA: {user_agent[:140]}")
    return "\n".join(lines)


def build_enrollment_request_message(
    full_name: str,
    level: str,
    price_label: str,
    phone: str,
    telegram_username: str,
    submitted_username: str,
    lesson_schedule: str,
) -> str:
    timestamp = datetime.now(LOCAL_TZ).strftime("%Y-%m-%d %H:%M")
    tz_label = f"GMT{LOCAL_TZ_OFFSET_HOURS:+d}"
    lines = [
        "New purchase request",
        f"Name: {full_name}",
        f"Level: {level}",
        f"Price: {price_label}",
        f"Phone: {phone}",
        f"Time: {timestamp} ({tz_label})",
    ]
    schedule_label = format_schedule_label(lesson_schedule)
    if schedule_label:
        lines.insert(4, f"Schedule: {schedule_label}")
    if telegram_username:
        lines.insert(5, f"Telegram: @{telegram_username.lstrip('@')}")
    if submitted_username:
        lines.insert(5, f"User: {submitted_username}")
    return "\n".join(lines)


def build_renewal_request_message(full_name: str, level: str, price_label: str, phone: str, telegram_username: str, submitted_username: str) -> str:
    timestamp = datetime.now(LOCAL_TZ).strftime("%Y-%m-%d %H:%M")
    tz_label = f"GMT{LOCAL_TZ_OFFSET_HOURS:+d}"
    lines = [
        "New renewal request",
        f"Name: {full_name}",
        f"Level: {level}",
        f"Price: {price_label}",
        f"Phone: {phone}",
        f"Time: {timestamp} ({tz_label})",
    ]
    if telegram_username:
        lines.insert(5, f"Telegram: @{telegram_username.lstrip('@')}")
    if submitted_username:
        lines.insert(5, f"User: {submitted_username}")
    return "\n".join(lines)


def send_telegram_message(text: str) -> bool:
    if not TG_BOT_TOKEN or not TG_ADMIN_IDS:
        return False
    payload_text = str(text or "").strip()
    if not payload_text:
        return False
    api_url = f"https://api.telegram.org/bot{TG_BOT_TOKEN}/sendMessage"
    sent = 0
    for chat_id in TG_ADMIN_IDS:
        payload = urlencode({"chat_id": str(chat_id), "text": payload_text}).encode("utf-8")
        req = urllib.request.Request(api_url, data=payload)
        try:
            with urllib.request.urlopen(req, timeout=5) as response:
                response_body = response.read().decode("utf-8", errors="ignore")
            data = json.loads(response_body)
        except (OSError, urllib.error.URLError, json.JSONDecodeError):
            continue
        if data.get("ok"):
            sent += 1
    return sent > 0


def send_telegram_message_to(chat_ids: list[int], text: str, parse_mode: str = "") -> bool:
    if not TG_BOT_TOKEN:
        return False
    payload_text = str(text or "").strip()
    if not payload_text:
        return False
    ids = []
    for raw in chat_ids or []:
        try:
            cid = int(raw)
        except (TypeError, ValueError):
            continue
        if cid > 0 and cid not in ids:
            ids.append(cid)
    if not ids:
        return False
    api_url = f"https://api.telegram.org/bot{TG_BOT_TOKEN}/sendMessage"
    sent = 0
    for chat_id in ids:
        params = {"chat_id": str(chat_id), "text": payload_text}
        if parse_mode:
            params["parse_mode"] = parse_mode
        payload = urlencode(params).encode("utf-8")
        req = urllib.request.Request(api_url, data=payload)
        try:
            with urllib.request.urlopen(req, timeout=5) as response:
                response_body = response.read().decode("utf-8", errors="ignore")
            data = json.loads(response_body)
        except (OSError, urllib.error.URLError, json.JSONDecodeError):
            continue
        if data.get("ok"):
            sent += 1
    return sent > 0

def format_course_label(course: str) -> str:
    """Return a human-readable course label, e.g. 'a1' -> 'A1', 'a1_express' -> 'A1 Express'."""
    return str(course or "").strip().upper().replace("_", " ")


def notify_parents(user_id: int, message: str) -> None:
    """Send a Telegram message to all parents of user_id who have linked their Telegram account."""
    if not TG_BOT_TOKEN:
        return
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute(
            "SELECT telegram_chat_id FROM user_parents WHERE user_id = ? AND telegram_chat_id > 0",
            (user_id,),
        )
        chat_ids = [int(row["telegram_chat_id"]) for row in cur.fetchall()]
        conn.close()
        if chat_ids:
            send_telegram_message_to(chat_ids, message)
    except Exception:
        pass  # Never fail the main request due to notification errors


ADMIN_USERNAME = os.environ.get("EWMS_ADMIN_USERNAME", "azamat_admin").strip()
RAW_ADMIN_PASSWORD = os.environ.get("EWMS_ADMIN_PASSWORD", "").strip()
ADMIN_PASSWORD = RAW_ADMIN_PASSWORD
if not ADMIN_PASSWORD:
    ADMIN_PASSWORD = secrets.token_urlsafe(24)
    print(f"WARNING: EWMS_ADMIN_PASSWORD not set. Generated temporary password: {ADMIN_PASSWORD}")
    print("Set EWMS_ADMIN_PASSWORD in your .env file for a persistent password.")
ADMIN_EDIT_PERMANENT_CODE = (os.environ.get("EWMS_ADMIN_EDIT_CODE") or "").strip() or ADMIN_PASSWORD

QUIZ_DIR = BASE_DIR / "quizzes"
COVER_UPLOAD_DIR = DEFAULT_DB_DIR / "uploads" / "covers"
CERTIFICATE_UPLOAD_DIR = DEFAULT_DB_DIR / "uploads" / "certificates"
PRESENTATIONS_DIR = DEFAULT_DB_DIR / "uploads" / "presentations"
STATIC_PRESENTATIONS_DIR = WEB_ROOT / "assets" / "presentations"
LESSON_OVERRIDES_DIR = DEFAULT_DB_DIR / "lesson_overrides"
CERTIFICATE_OVERRIDES_PATH = DEFAULT_DB_DIR / "certificates_overrides.json"
SUBSCRIPTION_OVERRIDES_PATH = DEFAULT_DB_DIR / "subscriptions_overrides.json"
TEAM_OVERRIDES_PATH = DEFAULT_DB_DIR / "team_overrides.json"
TEAM_AVATAR_UPLOAD_DIR = DEFAULT_DB_DIR / "uploads" / "team"
PARTNERS_PATH = DEFAULT_DB_DIR / "partners.json"
PARTNER_LOGO_UPLOAD_DIR = DEFAULT_DB_DIR / "uploads" / "partners"
MAX_COVER_BYTES = 5 * 1024 * 1024
MAX_PRESENTATION_BYTES = 25 * 1024 * 1024
ALLOWED_COVER_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp"}

COVER_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
CERTIFICATE_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
LESSON_OVERRIDES_DIR.mkdir(parents=True, exist_ok=True)
TEAM_AVATAR_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
PARTNER_LOGO_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
PRESENTATIONS_BY_COURSE = {
    "a1": {
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
    "a2": {
        1: "reflexive_pronoun.pdf",
        2: "present_simple_tense_a2.pdf",
        3: "present_continuous_tense_a2.pdf",
        4: "possessive_case_a2.pdf",
        5: "much_many_a2.pdf",
        6: "indefinite_pronouns.pdf",
        7: "past_simple_tense_a2.pdf",
        8: "past_continuous_a2.pdf",
        9: "future_simple_tense_a2.pdf",
        10: "future_continuos_a2.pdf",
        11: "present_perfect_a2.pdf",
        12: "interogative_relative_pronouns_a2.pdf",
        13: "modal_verbs_a2.pdf",
    },
    "b1": {},
    "b2": {},
}

DEFAULT_TEAM_MEMBERS: list[dict] = [
    {
        "id": "seed_mrsam",
        "order": 0,
        "header": "Mr.Sam - Founder & Lead Teacher",
        "subheader": "IELTS instructor with practical exam strategy, CEFR-based planning, and clear step-by-step guidance from beginner to upper-intermediate levels.",
        "achievements": [
            "Practical exam strategies for IELTS and CEFR.",
            "Clear step-by-step planning for beginners.",
        ],
        "telegram_username": "English_with_MrSam_bot",
        "instagram_username": "english_with_mrsam",
        "whatsapp_phone": "+998933503459",
        # Served by the web root (frontend), not by the API.
        "avatar_url": "/assets/images/Mr_Sam_ava.jpg",
        "avatar_file": "",
        "avatar_original_name": "",
    },
    {
        "id": "seed_azamat",
        "order": 1,
        "header": "Azamat - Co-founder and Developer",
        "subheader": "Leads development, ensures code quality, and turns ideas into working products. Creator of the platform English with Mr.Sam and other projects.",
        "achievements": [
            "Builds platform features end-to-end.",
            "Maintains quality and stability.",
        ],
        "telegram_username": "",
        "instagram_username": "",
        "whatsapp_phone": "",
        "avatar_url": "",
        "avatar_file": "",
        "avatar_original_name": "",
    },
    {
        "id": "seed_shokhjakhon",
        "order": 2,
        "header": "Shokhjakhon - Head of Mentors",
        "subheader": "Ensures every student develops fluency, confidence, and natural pronunciation across all mentors' work.",
        "achievements": [
            "Mentor quality control and training.",
            "Focus on fluency and pronunciation.",
        ],
        "telegram_username": "",
        "instagram_username": "",
        "whatsapp_phone": "",
        "avatar_url": "",
        "avatar_file": "",
        "avatar_original_name": "",
    },
    {
        "id": "seed_javohir",
        "order": 3,
        "header": "Javohir - Head of Design",
        "subheader": "Ensures every visual element is clear, functional, and aesthetically strong.",
        "achievements": [
            "Design system and UI consistency.",
            "Improves usability across pages.",
        ],
        "telegram_username": "",
        "instagram_username": "",
        "whatsapp_phone": "",
        "avatar_url": "",
        "avatar_file": "",
        "avatar_original_name": "",
    },
    {
        "id": "seed_umarbek",
        "order": 4,
        "header": "Umarbek - Head of Student Support",
        "subheader": "Ensures every student feels heard, helped, and supported throughout their journey.",
        "achievements": [
            "Fast student support and follow-up.",
            "Improves student onboarding.",
        ],
        "telegram_username": "",
        "instagram_username": "",
        "whatsapp_phone": "",
        "avatar_url": "",
        "avatar_file": "",
        "avatar_original_name": "",
    },
]


def normalize_level(value: str):
    raw = str(value or "").strip().lower()
    is_express = False
    for suffix in EXPRESS_LEVEL_SUFFIXES:
        if raw.endswith(suffix):
            raw = raw[: -len(suffix)].strip()
            is_express = True
            break
    return raw, is_express


def resolve_mentor_profile_id(cur, mentor_user_row) -> int:
    phone = str((mentor_user_row["phone"] if "phone" in mentor_user_row.keys() else "") or "").strip()
    if phone:
        cur.execute("SELECT id FROM mentors WHERE phone = ? ORDER BY id DESC LIMIT 1", (phone,))
        row = cur.fetchone()
        if row is not None:
            return int(row["id"] or 0)
    full_name = str((mentor_user_row["full_name"] if "full_name" in mentor_user_row.keys() else "") or "").strip()
    if full_name:
        cur.execute("SELECT id FROM mentors WHERE LOWER(name) = LOWER(?) ORDER BY id DESC LIMIT 1", (full_name,))
        row = cur.fetchone()
        if row is not None:
            return int(row["id"] or 0)
    return 0


def atomic_write_text(path: Path, text: str) -> None:
    tmp = path.with_suffix(path.suffix + ".tmp")
    tmp.write_text(text, encoding="utf-8")
    tmp.replace(path)


def get_overrides_path(course: str) -> Path | None:
    course_key, _ = normalize_level(course)
    if course_key not in COURSE_LESSON_COUNTS:
        return None
    return LESSON_OVERRIDES_DIR / f"{course_key}.json"


def load_lesson_overrides(course: str) -> list[dict]:
    path = get_overrides_path(course)
    if path is None or not path.exists():
        return []
    try:
        raw_text = path.read_text(encoding="utf-8-sig")
        payload = json.loads(raw_text)
    except (OSError, json.JSONDecodeError):
        return []
    if not isinstance(payload, list):
        return []
    items: list[dict] = []
    for item in payload:
        if isinstance(item, dict):
            items.append(item)
    return items


def save_lesson_overrides(course: str, items: list[dict]) -> bool:
    path = get_overrides_path(course)
    if path is None:
        return False
    try:
        atomic_write_text(path, json.dumps(items, ensure_ascii=False, indent=2))
        return True
    except OSError:
        return False


def load_certificate_overrides() -> list[dict]:
    path = CERTIFICATE_OVERRIDES_PATH
    if not path.exists():
        return []
    try:
        raw_text = path.read_text(encoding="utf-8-sig")
        payload = json.loads(raw_text)
    except (OSError, json.JSONDecodeError):
        return []
    if not isinstance(payload, list):
        return []
    items: list[dict] = []
    for item in payload:
        if isinstance(item, dict):
            items.append(item)
    return items


def save_certificate_overrides(items: list[dict]) -> bool:
    try:
        atomic_write_text(CERTIFICATE_OVERRIDES_PATH, json.dumps(items, ensure_ascii=False, indent=2))
        return True
    except OSError:
        return False


def load_subscription_overrides() -> list[dict]:
    path = SUBSCRIPTION_OVERRIDES_PATH
    if not path.exists():
        return []
    try:
        raw_text = path.read_text(encoding="utf-8-sig")
        payload = json.loads(raw_text)
    except (OSError, json.JSONDecodeError):
        return []
    if not isinstance(payload, list):
        return []
    items: list[dict] = []
    for item in payload:
        if isinstance(item, dict):
            items.append(item)
    return items


def save_subscription_overrides(items: list[dict]) -> bool:
    try:
        atomic_write_text(SUBSCRIPTION_OVERRIDES_PATH, json.dumps(items, ensure_ascii=False, indent=2))
        return True
    except OSError:
        return False


def load_team_overrides() -> list[dict]:
    path = TEAM_OVERRIDES_PATH
    if not path.exists():
        return list(DEFAULT_TEAM_MEMBERS)
    try:
        raw_text = path.read_text(encoding="utf-8-sig")
        payload = json.loads(raw_text)
    except (OSError, json.JSONDecodeError):
        return list(DEFAULT_TEAM_MEMBERS)
    if not isinstance(payload, list):
        return list(DEFAULT_TEAM_MEMBERS)
    items: list[dict] = []
    for item in payload:
        if isinstance(item, dict):
            items.append(item)
    return items


def save_team_overrides(items: list[dict]) -> bool:
    try:
        atomic_write_text(TEAM_OVERRIDES_PATH, json.dumps(items, ensure_ascii=False, indent=2))
        return True
    except OSError:
        return False

def load_partners() -> list[dict]:
    if not PARTNERS_PATH.exists():
        return []
    try:
        raw_text = PARTNERS_PATH.read_text(encoding="utf-8-sig")
        payload = json.loads(raw_text)
    except (OSError, json.JSONDecodeError):
        return []
    return [item for item in payload if isinstance(item, dict)]


def save_partners(items: list[dict]) -> bool:
    try:
        atomic_write_text(PARTNERS_PATH, json.dumps(items, ensure_ascii=False, indent=2))
        return True
    except OSError:
        return False


def is_admin_user(conn: sqlite3.Connection, username: str) -> bool:
    cleaned = str(username or "").strip()
    if not cleaned:
        return False
    cur = conn.cursor()
    cur.execute("SELECT role FROM users WHERE username = ?", (cleaned,))
    row = cur.fetchone()
    if row is None:
        return False
    return str(row["role"] or "").strip().lower() == "admin"


def normalize_phone(value: str) -> str:
    raw = str(value or "").strip()
    if not raw:
        return ""
    digits = re.sub(r"[^\d]", "", raw)
    if not digits:
        return ""
    return f"+{digits}"


def sanitize_team_member(raw: dict, order: int) -> dict | None:
    if not isinstance(raw, dict):
        return None
    member_id = str(raw.get("id", "") or "").strip()
    if not member_id:
        return None
    header = str(raw.get("header", "") or "").strip()
    subheader = str(raw.get("subheader", "") or "").strip()
    if not header:
        return None
    if len(header) > 160:
        header = header[:160].rstrip()
    if len(subheader) > 700:
        subheader = subheader[:700].rstrip()

    achievements_raw = raw.get("achievements", [])
    achievements: list[str] = []
    if isinstance(achievements_raw, list):
        for item in achievements_raw:
            text = str(item or "").strip()
            if not text:
                continue
            if len(text) > 160:
                text = text[:160].rstrip()
            achievements.append(text)
            if len(achievements) >= 24:
                break
    elif isinstance(achievements_raw, str):
        for line in achievements_raw.splitlines():
            text = line.strip()
            if not text:
                continue
            if len(text) > 160:
                text = text[:160].rstrip()
            achievements.append(text)
            if len(achievements) >= 24:
                break

    telegram_username = str(raw.get("telegram_username", "") or raw.get("telegram", "") or "").strip().lstrip("@")
    instagram_username = str(raw.get("instagram_username", "") or raw.get("instagram", "") or "").strip().lstrip("@")
    whatsapp_phone_raw = str(raw.get("whatsapp_phone", "") or raw.get("whatsapp", "") or "").strip()

    if telegram_username and re.fullmatch(r"[A-Za-z0-9_]{4,32}", telegram_username) is None:
        telegram_username = ""
    if instagram_username and re.fullmatch(r"[A-Za-z0-9_.]{1,32}", instagram_username) is None:
        instagram_username = ""

    whatsapp_phone = normalize_phone(whatsapp_phone_raw) if whatsapp_phone_raw else ""

    avatar_url = str(raw.get("avatar_url", "") or "").strip()
    if len(avatar_url) > 500:
        avatar_url = avatar_url[:500].rstrip()
    avatar_file = str(raw.get("avatar_file", "") or "").strip()
    if avatar_file and ("/" in avatar_file or "\\" in avatar_file):
        avatar_file = ""
    if avatar_file and re.fullmatch(r"[A-Za-z0-9._-]{1,180}", avatar_file) is None:
        avatar_file = ""
    avatar_original_name = str(raw.get("avatar_original_name", "") or "").strip()
    if len(avatar_original_name) > 180:
        avatar_original_name = avatar_original_name[:180].rstrip()

    return {
        "id": member_id,
        "order": int(order),
        "header": header,
        "subheader": subheader,
        "achievements": achievements,
        "telegram_username": telegram_username,
        "instagram_username": instagram_username,
        "whatsapp_phone": whatsapp_phone,
        "avatar_url": avatar_url,
        "avatar_file": avatar_file,
        "avatar_original_name": avatar_original_name,
    }


def detect_device_type(user_agent: str) -> str:
    ua = str(user_agent or "").lower()
    if "ipad" in ua or "tablet" in ua or ("android" in ua and "mobile" not in ua):
        return "tablet"
    if "mobi" in ua or "iphone" in ua or ("android" in ua and "mobile" in ua):
        return "phone"
    if "windows" in ua or "macintosh" in ua or "linux" in ua or "cros" in ua:
        return "pc"
    return "unknown"


def is_public_ip(value: str) -> bool:
    if not value:
        return False
    try:
        ip_obj = ipaddress.ip_address(value)
    except ValueError:
        return False
    if ip_obj.is_private or ip_obj.is_loopback or ip_obj.is_reserved or ip_obj.is_link_local or ip_obj.is_multicast:
        return False
    return True


def fetch_ip_location(ip_value: str) -> dict:
    if not is_public_ip(ip_value):
        return {}
    api_key = os.environ.get("IPAPI_KEY", "").strip()
    if api_key:
        url = f"https://ipapi.co/{ip_value}/json/?key={api_key}"
    else:
        url = f"https://ipapi.co/{ip_value}/json/"
    try:
        with urllib.request.urlopen(url, timeout=2) as response:
            payload = response.read().decode("utf-8", errors="ignore")
        data = json.loads(payload)
    except (urllib.error.URLError, urllib.error.HTTPError, json.JSONDecodeError, TimeoutError):
        return {}
    if not isinstance(data, dict) or data.get("error"):
        return {}
    return {
        "city": str(data.get("city", "") or "").strip(),
        "region": str(data.get("region", "") or "").strip(),
        "country": str(data.get("country_name", "") or "").strip(),
        "timezone": str(data.get("timezone", "") or "").strip(),
        "org": str(data.get("org", "") or "").strip(),
    }


def record_user_device(cur, user_id: int, username: str, user_agent: str, client_ip: str):
    ua = str(user_agent or "").strip()
    device_type = detect_device_type(ua)
    device_hash = hashlib.sha256(ua.lower().encode("utf-8")).hexdigest()
    now = datetime.now(timezone.utc).isoformat()
    cur.execute(
        """
        SELECT id, last_ip, city, region, country, timezone, org
        FROM user_devices
        WHERE user_id = ? AND device_hash = ?
        """,
        (user_id, device_hash),
    )
    row = cur.fetchone()
    location = {}
    if row is None or (client_ip and client_ip != (row["last_ip"] or "")) or not (row["city"] or row["country"]):
        location = fetch_ip_location(client_ip)
    if row is None:
        cur.execute(
            """
            INSERT INTO user_devices (
                user_id, username, device_hash, device_type, user_agent, first_seen_at, last_seen_at, login_count, last_ip,
                city, region, country, timezone, org
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?)
            """,
            (
                user_id,
                username,
                device_hash,
                device_type,
                ua,
                now,
                now,
                client_ip,
                location.get("city", ""),
                location.get("region", ""),
                location.get("country", ""),
                location.get("timezone", ""),
                location.get("org", ""),
            ),
        )
    else:
        if location:
            cur.execute(
                """
                UPDATE user_devices
                SET device_type = ?, user_agent = ?, last_seen_at = ?, login_count = login_count + 1, last_ip = ?,
                    city = ?, region = ?, country = ?, timezone = ?, org = ?
                WHERE id = ?
                """,
                (
                    device_type,
                    ua,
                    now,
                    client_ip,
                    location.get("city", ""),
                    location.get("region", ""),
                    location.get("country", ""),
                    location.get("timezone", ""),
                    location.get("org", ""),
                    row["id"],
                ),
            )
        else:
            cur.execute(
                """
                UPDATE user_devices
                SET device_type = ?, user_agent = ?, last_seen_at = ?, login_count = login_count + 1, last_ip = ?
                WHERE id = ?
                """,
                (device_type, ua, now, client_ip, row["id"]),
            )


def get_unlock_interval_days(level: str) -> int:
    _, is_express = normalize_level(level)
    return 1 if is_express else LESSON_UNLOCK_INTERVAL_DAYS


def normalize_schedule_key(value: str) -> str:
    raw = str(value or "").strip().lower()
    if not raw:
        return ""
    if raw in LESSON_SCHEDULE_WEEKDAYS:
        return raw
    cleaned = re.sub(r"[^a-z]", "", raw)
    if cleaned in {"mwf"}:
        return "mwf"
    if cleaned in {"tthsa", "tths", "tts"}:
        return "tthsa"
    if all(token in cleaned for token in ("mon", "wed", "fri")):
        return "mwf"
    if all(token in cleaned for token in ("tue", "thu", "sat")):
        return "tthsa"
    return ""


def format_schedule_label(value: str) -> str:
    key = normalize_schedule_key(value)
    if not key:
        return ""
    return LESSON_SCHEDULE_LABELS.get(key, key)


def get_user_schedule_key(level: str, schedule_raw: str) -> str:
    _, is_express = normalize_level(level)
    if is_express:
        return ""
    return normalize_schedule_key(schedule_raw) or DEFAULT_LESSON_SCHEDULE_KEY


def get_schedule_weekdays(level: str, schedule_raw: str):
    key = get_user_schedule_key(level, schedule_raw)
    if not key:
        return None
    return LESSON_SCHEDULE_WEEKDAYS.get(key, LESSON_SCHEDULE_WEEKDAYS[DEFAULT_LESSON_SCHEDULE_KEY])


def get_schedule_anchor_dt(access_started_dt: datetime, level: str, schedule_raw: str):
    if access_started_dt is None:
        return None
    local_dt = to_local(access_started_dt)
    if local_dt is None:
        return None
    _, is_express = normalize_level(level)
    if is_express:
        return local_dt
    schedule_key = get_user_schedule_key(level, schedule_raw)
    if not schedule_key:
        return local_dt
    return local_dt.replace(hour=0, minute=0, second=0, microsecond=0)


def combine_date_with_time(date_value, template_dt: datetime):
    if template_dt.tzinfo is None:
        return datetime.combine(date_value, template_dt.time())
    return datetime.combine(date_value, template_dt.timetz())


def count_weekday_occurrences(start_date, end_date, weekdays) -> int:
    if start_date > end_date:
        return 0
    total_days = (end_date - start_date).days + 1
    full_weeks, extra_days = divmod(total_days, 7)
    count = full_weeks * len(weekdays)
    for i in range(extra_days):
        if (start_date + timedelta(days=i)).weekday() in weekdays:
            count += 1
    return count


def count_unlock_events(access_started_dt: datetime, now_dt: datetime, weekdays) -> int:
    if not weekdays or now_dt <= access_started_dt:
        return 0
    start_date = access_started_dt.date() + timedelta(days=1)
    end_date = now_dt.date()
    if end_date < start_date:
        return 0
    return count_weekday_occurrences(start_date, end_date, weekdays)


def get_available_lessons(access_started_dt: datetime, level: str, schedule_raw: str, now_dt: datetime, total_lessons=None):
    if access_started_dt is None:
        available = 1
    else:
        _, is_express = normalize_level(level)
        if is_express:
            days_since = int(max(0.0, (now_dt - access_started_dt).total_seconds()) // 86400)
            interval_days = get_unlock_interval_days(level)
            available = max(1, int(days_since // max(1, interval_days)) + 1)
        else:
            weekdays = get_schedule_weekdays(level, schedule_raw)
            unlock_events = count_unlock_events(access_started_dt, now_dt, weekdays)
            available = max(1, unlock_events + 1)
    if total_lessons:
        available = min(available, total_lessons)
    return available


def get_nth_scheduled_datetime(start_dt: datetime, weekdays, n: int):
    if n <= 0:
        return start_dt
    if not weekdays:
        return start_dt + timedelta(days=n)
    date = start_dt.date() + timedelta(days=1)
    count = 0
    while True:
        if date.weekday() in weekdays:
            count += 1
            if count >= n:
                return combine_date_with_time(date, start_dt)
        date += timedelta(days=1)


def get_lesson_unlock_at(access_started_dt: datetime, level: str, schedule_raw: str, lesson_number: int):
    if access_started_dt is None:
        return None
    if lesson_number <= 1:
        return access_started_dt
    _, is_express = normalize_level(level)
    if is_express:
        return access_started_dt + timedelta(days=lesson_number - 1)
    weekdays = get_schedule_weekdays(level, schedule_raw)
    return get_nth_scheduled_datetime(access_started_dt, weekdays, lesson_number - 1)


def estimate_access_started_at(now_dt: datetime, level: str, schedule_raw: str, lesson_number: int):
    if lesson_number <= 1:
        return now_dt
    _, is_express = normalize_level(level)
    if is_express:
        return now_dt - timedelta(days=lesson_number - 1)
    weekdays = get_schedule_weekdays(level, schedule_raw)
    if not weekdays:
        return now_dt - timedelta(days=(lesson_number - 1) * LESSON_UNLOCK_INTERVAL_DAYS)
    count = 0
    date = now_dt.date()
    while True:
        if date.weekday() in weekdays:
            count += 1
            if count >= (lesson_number - 1):
                start_date = date - timedelta(days=1)
                return combine_date_with_time(start_date, now_dt)
        date -= timedelta(days=1)


def get_quiz_path(course: str, lesson_number: int):
    course_key, _ = normalize_level(course)
    if course_key not in COURSE_LESSON_COUNTS:
        return None
    try:
        lesson_num = int(lesson_number)
    except (TypeError, ValueError):
        return None
    if lesson_num <= 0:
        return None
    return QUIZ_DIR / course_key / f"lesson-{lesson_num}.json"


def get_presentation_path(course: str, lesson_number: int):
    course_key, _ = normalize_level(course)
    if course_key not in COURSE_LESSON_COUNTS:
        return None
    try:
        lesson_num = int(lesson_number)
    except (TypeError, ValueError):
        return None
    if lesson_num <= 0:
        return None

    # If a named static file is defined in code, it takes priority (permanent GitHub file)
    course_map = PRESENTATIONS_BY_COURSE.get(course_key, {})
    filename = course_map.get(lesson_num)
    if filename:
        static_path = STATIC_PRESENTATIONS_DIR / filename
        if static_path.exists():
            return static_path
        static_course_path = STATIC_PRESENTATIONS_DIR / course_key / filename
        if static_course_path.exists():
            return static_course_path

    # Admin override upload: uploads/presentations/<course>/lesson-<n>.pdf
    override = PRESENTATIONS_DIR / course_key / f"lesson-{lesson_num}.pdf"
    if override.exists():
        return override

    if filename:
        path = PRESENTATIONS_DIR / filename
        if path.exists():
            return path
        course_path = PRESENTATIONS_DIR / course_key / filename
        if course_path.exists():
            return course_path

        static_course_path = STATIC_PRESENTATIONS_DIR / course_key / filename
        if static_course_path.exists():
            return static_course_path

    # Fallback: allow the simple per-lesson naming convention:
    fallback = PRESENTATIONS_DIR / course_key / f"lesson-{lesson_num}.pdf"
    if fallback.exists():
        return fallback
        
    static_fallback = STATIC_PRESENTATIONS_DIR / course_key / f"lesson-{lesson_num}.pdf"
    if static_fallback.exists():
        return static_fallback
        
    return None


def load_quiz_questions(course: str, lesson_number: int):
    quiz_path = get_quiz_path(course, lesson_number)
    if quiz_path is None or not quiz_path.exists():
        return None
    try:
        raw_text = quiz_path.read_text(encoding="utf-8-sig")
        raw = json.loads(raw_text)
    except (OSError, json.JSONDecodeError):
        return None
    if not isinstance(raw, list):
        return None
    questions = []
    for item in raw:
        if not isinstance(item, dict):
            continue
        try:
            qid = int(item.get("id", 0))
        except (TypeError, ValueError):
            continue
        question = str(item.get("question", "")).strip()
        options_raw = item.get("options")
        if qid <= 0 or not question or not isinstance(options_raw, dict):
            continue
        options = {}
        for key, value in options_raw.items():
            key_norm = str(key).strip().upper()
            if key_norm in {"A", "B", "C", "D"}:
                options[key_norm] = str(value)
        correct = str(item.get("correct", "")).strip().upper()
        if correct not in options:
            continue
        explanation = str(item.get("explanation", "")).strip()
        explanation_simple = str(item.get("explanation_simple", "")).strip()
        explanation_detailed = str(item.get("explanation_detailed", "")).strip()
        translations = {}
        raw_translations = item.get("explanation_translations")
        if isinstance(raw_translations, dict):
            for key, value in raw_translations.items():
                lang_key = str(key or "").strip().lower()
                if not lang_key:
                    continue
                if isinstance(value, str):
                    lang_text = value.strip()
                    if lang_text:
                        translations[lang_key] = lang_text
                    continue
                if isinstance(value, dict):
                    normalized: dict[str, str] = {}
                    for mode_key, mode_value in value.items():
                        mode = str(mode_key or "").strip().lower()
                        text = str(mode_value or "").strip()
                        if mode and text:
                            normalized[mode] = text
                    if normalized:
                        translations[lang_key] = normalized
        for lang_key in ("ru", "uz", "en"):
            inline_text = str(item.get(f"explanation_{lang_key}", "")).strip()
            if inline_text:
                existing = translations.get(lang_key)
                if existing is None:
                    translations[lang_key] = inline_text
                elif isinstance(existing, dict):
                    existing.setdefault("main", inline_text)
        questions.append(
            {
                "id": qid,
                "question": question,
                "options": options,
                "correct": correct,
                **({"explanation": explanation} if explanation else {}),
                **({"explanation_simple": explanation_simple} if explanation_simple else {}),
                **({"explanation_detailed": explanation_detailed} if explanation_detailed else {}),
                **({"explanation_translations": translations} if translations else {}),
            }
        )
    return questions or None


def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def hash_password(password: str, salt: str) -> str:
    return hashlib.sha256(f"{salt}:{password}".encode("utf-8")).hexdigest()


def create_session(cur, user_id: int) -> tuple[str, str]:
    token = secrets.token_urlsafe(32)
    expires_at = (datetime.now(timezone.utc) + timedelta(days=SESSION_TTL_DAYS)).isoformat()
    cur.execute("DELETE FROM user_sessions WHERE user_id = ?", (user_id,))
    cur.execute(
        """
        INSERT INTO user_sessions (token, user_id, created_at, expires_at)
        VALUES (?, ?, ?, ?)
        """,
        (token, user_id, datetime.now(timezone.utc).isoformat(), expires_at),
    )
    return token, expires_at


def get_session_user(cur, token: str):
    if not token:
        return None
    cur.execute(
        """
        SELECT
            u.id,
            s.user_id,
            s.expires_at,
            u.username,
            u.role,
            u.level,
            u.lesson_schedule,
            u.created_at,
            u.access_started_at,
            u.telegram_chat_id
        FROM user_sessions s
        JOIN users u ON u.id = s.user_id
        WHERE s.token = ?
        """,
        (token,),
    )
    session_row = cur.fetchone()
    if session_row is None:
        return None
    if session_row["expires_at"] <= datetime.now(timezone.utc).isoformat():
        cur.execute("DELETE FROM user_sessions WHERE token = ?", (token,))
        return None
    return session_row


def parse_iso_datetime(value: str):
    try:
        parsed = datetime.fromisoformat(value)
        if parsed.tzinfo is None:
            return parsed.replace(tzinfo=timezone.utc)
        return parsed
    except (TypeError, ValueError):
        return None


def utc_now():
    return datetime.now(timezone.utc).replace(tzinfo=timezone.utc)


def local_now():
    return utc_now().astimezone(LOCAL_TZ)


def to_local(dt: datetime):
    if dt is None:
        return None
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(LOCAL_TZ)


def to_utc(dt: datetime):
    if dt is None:
        return None
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=LOCAL_TZ)
    return dt.astimezone(timezone.utc)


def to_utc_naive_iso(dt: datetime):
    if dt is None:
        return ""
    utc_dt = to_utc(dt)
    if utc_dt is None:
        return ""
    return utc_dt.replace(tzinfo=None).isoformat()


def to_utc_iso(dt: datetime):
    if dt is None:
        return ""
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc).isoformat()
    return dt.astimezone(timezone.utc).isoformat()


def get_subscription_expires_at(created_at: str):
    created_dt = parse_iso_datetime(created_at)
    if created_dt is None:
        return None
    return created_dt + timedelta(days=30)


def build_achievements(
    level_label: str,
    completed: int,
    total: int,
    lessons_count: int,
    average_percent: float,
    earned_keys=None,
):
    course, is_express = normalize_level(level_label)
    achievements = []
    completed = int(completed or 0)
    total = int(total or 0)
    earned_keys = set(earned_keys or [])

    def add(key, title, title_ru, icon, points, description, description_ru, earned):
        is_earned = bool(earned) or key in earned_keys
        achievements.append(
            {
                "key": key,
                "title": title,
                "title_ru": title_ru,
                "icon": icon,
                "points": points,
                "description": description,
                "description_ru": description_ru,
                "earned": bool(is_earned),
            }
        )

    add(
        "first_lesson",
        "First lesson",
        "Первый урок",
        "📘",
        50,
        "Completed your first lesson.",
        "Завершен первый урок.",
        completed >= 1,
    )
    add(
        "quick_start",
        "Quick start",
        "Быстрый старт",
        "⚡",
        80,
        "Completed 3 lessons.",
        "Завершено 3 урока.",
        completed >= 3,
    )
    add(
        "learning_streak",
        "Learning streak",
        "Учебная серия",
        "🔥",
        120,
        "Completed 5 lessons.",
        "Завершено 5 уроков.",
        completed >= 5,
    )
    add(
        "lesson_master",
        "Lesson master",
        "Мастер уроков",
        "🏆",
        180,
        "Completed 10 lessons.",
        "Завершено 10 уроков.",
        completed >= 10,
    )
    add(
        "halfway",
        "Halfway there",
        "На полпути",
        "🎯",
        200,
        "Reached 50% of the course.",
        "Достигнуто 50% курса.",
        total > 0 and completed >= max(1, total // 2),
    )
    add(
        "finisher",
        "Course finisher",
        "Финишер курса",
        "🎓",
        400,
        "Finished the course.",
        "Курс завершен.",
        total > 0 and completed >= total,
    )
    add(
        "high_score",
        "High score",
        "Высокий балл",
        "📈",
        180,
        "Average quiz score is 80%+.",
        "Средний результат тестов 80%+.",
        lessons_count >= 3 and average_percent >= 80,
    )
    add(
        "quiz_master",
        "Quiz master",
        "Мастер тестов",
        "🧠",
        220,
        "Average quiz score is 90%+ (5+ lessons).",
        "Средний результат тестов 90%+ (5+ уроков).",
        lessons_count >= 5 and average_percent >= 90,
    )
    add(
        "perfect_score",
        "Perfect score",
        "Идеальный результат",
        "🌟",
        260,
        "Average quiz score is 98%+ (5+ lessons).",
        "Средний результат тестов 98%+ (5+ уроков).",
        lessons_count >= 5 and average_percent >= 98,
    )
    add(
        "express_track",
        "Express track",
        "Экспресс-трек",
        "🚄",
        150,
        "Learning in express mode.",
        "Обучение в экспресс-режиме.",
        bool(course and is_express),
    )
    return achievements


def get_user_achievement_keys(cur, user_id: int):
    cur.execute(
        "SELECT achievement_key FROM user_achievements WHERE user_id = ?",
        (user_id,),
    )
    return {row["achievement_key"] for row in cur.fetchall()}


def sync_user_achievements(cur, user_id: int, achievements, earned_keys=None):
    earned_keys = set(earned_keys or get_user_achievement_keys(cur, user_id))
    new_items = [
        item
        for item in (achievements or [])
        if item.get("earned") and item.get("key") and item["key"] not in earned_keys
    ]
    if not new_items:
        return earned_keys
    earned_at = utc_now().replace(tzinfo=None).isoformat()
    for item in new_items:
        points = int(item.get("points") or 0)
        cur.execute(
            """
            INSERT OR IGNORE INTO user_achievements (user_id, achievement_key, points, earned_at)
            VALUES (?, ?, ?, ?)
            """,
            (user_id, item["key"], points, earned_at),
        )
        earned_keys.add(item["key"])
    return earned_keys


def fetch_mentor_for_level(cur, level_label: str):
    course, _ = normalize_level(level_label)
    if course not in COURSE_LESSON_COUNTS:
        return None
    cur.execute(
        """
        SELECT id, name, level, phone, email, telegram_username, instagram_username, info, avatar_path, avatar_name
        FROM mentors
        WHERE LOWER(level) = LOWER(?)
        ORDER BY id DESC
        LIMIT 1
        """,
        (course,),
    )
    row = cur.fetchone()
    if row is None:
        return None
    avatar_url = ""
    if row["avatar_path"]:
        avatar_url = f"/api/mentors/avatar?id={row['id']}"
    return {
        "id": row["id"],
        "name": row["name"],
        "level": row["level"],
        "phone": row["phone"] or "",
        "email": row["email"] or "",
        "telegram_username": row["telegram_username"] or "",
        "instagram_username": row["instagram_username"] or "",
        "info": row["info"] or "",
        "avatar_url": avatar_url,
    }


def fetch_mentor_by_id(cur, mentor_id: int):
    safe_id = int(mentor_id or 0)
    if safe_id <= 0:
        return None
    cur.execute(
        """
        SELECT id, name, level, phone, email, telegram_username, instagram_username, info, avatar_path, avatar_name
        FROM mentors
        WHERE id = ?
        LIMIT 1
        """,
        (safe_id,),
    )
    row = cur.fetchone()
    if row is None:
        return None
    avatar_url = ""
    if row["avatar_path"]:
        avatar_url = f"/api/mentors/avatar?id={row['id']}"
    return {
        "id": row["id"],
        "name": row["name"],
        "level": row["level"],
        "phone": row["phone"] or "",
        "email": row["email"] or "",
        "telegram_username": row["telegram_username"] or "",
        "instagram_username": row["instagram_username"] or "",
        "info": row["info"] or "",
        "avatar_url": avatar_url,
    }


def build_progress_summary(cur, user_row):
    level_label = str(user_row["level"] or "").strip()
    course, _ = normalize_level(level_label)
    earned_keys = get_user_achievement_keys(cur, user_row["id"])
    access_started_raw = user_row["access_started_at"] or user_row["created_at"]
    access_started_dt = parse_iso_datetime(access_started_raw) or utc_now()
    expires_at = get_subscription_expires_at(user_row["created_at"] or "")
    remaining_days = 0
    remaining_hours = 0
    if expires_at is not None:
        remaining_seconds = max(0.0, (expires_at - utc_now()).total_seconds())
        remaining_days = int(remaining_seconds // 86400)
        remaining_hours = int((remaining_seconds % 86400) // 3600)

    if course not in COURSE_LESSON_COUNTS:
        achievements = build_achievements(level_label, 0, 0, 0, 0.0, earned_keys=earned_keys)
        sync_user_achievements(cur, user_row["id"], achievements, earned_keys=earned_keys)
        mentor_id = int((user_row["mentor_id"] if "mentor_id" in user_row.keys() else 0) or 0)
        mentor = fetch_mentor_by_id(cur, mentor_id) if mentor_id > 0 else None
        if mentor is None:
            mentor = fetch_mentor_for_level(cur, level_label)
        return {
            "level": level_label,
            "average_percent": 0.0,
            "lessons_count": 0,
            "remaining_days": remaining_days,
            "remaining_hours": remaining_hours,
            "completed_lessons": 0,
            "total_lessons": 0,
            "available_lessons": 0,
            "completed_lessons_list": [],
            "next_unlock_seconds": 0,
            "next_unlock_at": "",
            "achievements": achievements,
            "mentor": mentor,
        }

    cur.execute(
        """
        SELECT
            lesson_number,
            SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) AS correct_count,
            SUM(CASE WHEN is_correct = 0 THEN 1 ELSE 0 END) AS wrong_count
        FROM quiz_answer_events
        WHERE user_id = ? AND course = ? AND question_id IS NOT NULL
        GROUP BY lesson_number
        """,
        (user_row["id"], course),
    )
    rows = cur.fetchall()
    total_percent = 0.0
    lessons_count = 0
    for row in rows:
        correct = int(row["correct_count"] or 0)
        wrong = int(row["wrong_count"] or 0)
        total = correct + wrong
        if total <= 0:
            continue
        total_percent += (correct * 100.0) / total
        lessons_count += 1

    average_percent = total_percent / lessons_count if lessons_count > 0 else 0.0
    cur.execute(
        "SELECT DISTINCT lesson_number FROM task_completions WHERE user_id = ? AND course = ?",
        (user_row["id"], course),
    )
    completed_lessons = {int(row["lesson_number"]) for row in cur.fetchall()}

    cur.execute(
        """
        SELECT DISTINCT lesson_number
        FROM task_completions
        WHERE user_id = ? AND course = ? AND task_key = 'lesson_completed'
        """,
        (user_row["id"], course),
    )
    strict_completed_lessons = {int(row["lesson_number"]) for row in cur.fetchall()}
    cur.execute(
        """
        SELECT DISTINCT lesson_number
        FROM quiz_answer_events
        WHERE user_id = ? AND course = ? AND question_id IS NOT NULL
        """,
        (user_row["id"], course),
    )
    completed_lessons.update(int(row["lesson_number"]) for row in cur.fetchall())
    total_lessons = int(COURSE_LESSON_COUNTS.get(course, 0) or 0)
    schedule_raw = user_row["lesson_schedule"] if "lesson_schedule" in user_row.keys() else ""
    access_started_local = get_schedule_anchor_dt(access_started_dt, level_label, schedule_raw)
    now_local = local_now()
    user_role = str(user_row["role"] if "role" in user_row.keys() else "").strip().lower()
    is_privileged = user_role in ("admin", "mentor")
    available_lessons = total_lessons if is_privileged else get_available_lessons(
        access_started_local,
        level_label,
        schedule_raw,
        now_local,
        total_lessons,
    )

    next_required_lesson_number = total_lessons + 1
    if total_lessons > 0:
        for lesson_number in range(1, total_lessons + 1):
            if lesson_number not in strict_completed_lessons:
                next_required_lesson_number = lesson_number
                break

    next_lesson_available = bool(total_lessons > 0 and next_required_lesson_number <= available_lessons)
    next_lesson_unlock_seconds = 0
    next_lesson_unlock_at = ""
    if (
        total_lessons > 0
        and 1 <= next_required_lesson_number <= total_lessons
        and next_required_lesson_number > available_lessons
    ):
        next_required_unlock_dt = get_lesson_unlock_at(
            access_started_local,
            level_label,
            schedule_raw,
            next_required_lesson_number,
        )
        if next_required_unlock_dt is not None:
            next_lesson_unlock_seconds = int(max(0.0, (next_required_unlock_dt - now_local).total_seconds()))
            next_lesson_unlock_at = to_utc_iso(to_utc(next_required_unlock_dt))
    next_unlock_seconds = 0
    next_unlock_at = ""
    if total_lessons > 0 and available_lessons < total_lessons:
        next_unlock_at_dt = get_lesson_unlock_at(
            access_started_local,
            level_label,
            schedule_raw,
            available_lessons + 1,
        )
        if next_unlock_at_dt is not None:
            next_unlock_seconds = int(max(0.0, (next_unlock_at_dt - now_local).total_seconds()))
            next_unlock_at = to_utc_iso(to_utc(next_unlock_at_dt))

    achievements = build_achievements(
        level_label,
        len(completed_lessons),
        total_lessons,
        lessons_count,
        average_percent,
        earned_keys=earned_keys,
    )
    sync_user_achievements(cur, user_row["id"], achievements, earned_keys=earned_keys)
    mentor_id = int((user_row["mentor_id"] if "mentor_id" in user_row.keys() else 0) or 0)
    mentor = fetch_mentor_by_id(cur, mentor_id) if mentor_id > 0 else None
    if mentor is None:
        mentor = fetch_mentor_for_level(cur, level_label)

    return {
        "level": level_label,
        "average_percent": average_percent,
        "lessons_count": lessons_count,
        "remaining_days": remaining_days,
        "remaining_hours": remaining_hours,
        "completed_lessons": len(completed_lessons),
        "total_lessons": total_lessons,
        "available_lessons": int(available_lessons or 0),
        "completed_lessons_list": sorted(completed_lessons),
        "completed_lessons_strict_list": sorted(strict_completed_lessons),
        "next_unlock_seconds": next_unlock_seconds,
        "next_unlock_at": next_unlock_at,
        "next_required_lesson_number": int(next_required_lesson_number or 0),
        "next_lesson_available": bool(next_lesson_available),
        "next_lesson_unlock_seconds": int(next_lesson_unlock_seconds or 0),
        "next_lesson_unlock_at": next_lesson_unlock_at,
        "achievements": achievements,
        "mentor": mentor,
    }


def init_db():
    conn = get_connection()
    cur = conn.cursor()

    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            full_name TEXT NOT NULL DEFAULT '',
            level TEXT NOT NULL DEFAULT '',
            lesson_schedule TEXT NOT NULL DEFAULT '',
            phone TEXT NOT NULL DEFAULT '',
            telegram_chat_id INTEGER NOT NULL DEFAULT 0,
            mentor_id INTEGER NOT NULL DEFAULT 0,
            username TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL,
            password_hash TEXT NOT NULL,
            salt TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'student',
            created_at TEXT NOT NULL,
            access_started_at TEXT NOT NULL DEFAULT '',
            avatar_path TEXT NOT NULL DEFAULT '',
            avatar_name TEXT NOT NULL DEFAULT ''
        )
        """
    )

    cur.execute("PRAGMA table_info(users)")
    existing_columns = {row["name"] for row in cur.fetchall()}
    if "full_name" not in existing_columns:
        cur.execute("ALTER TABLE users ADD COLUMN full_name TEXT NOT NULL DEFAULT ''")
    if "level" not in existing_columns:
        cur.execute("ALTER TABLE users ADD COLUMN level TEXT NOT NULL DEFAULT ''")
    if "lesson_schedule" not in existing_columns:
        cur.execute("ALTER TABLE users ADD COLUMN lesson_schedule TEXT NOT NULL DEFAULT ''")
    if "phone" not in existing_columns:
        cur.execute("ALTER TABLE users ADD COLUMN phone TEXT NOT NULL DEFAULT ''")
    if "telegram_chat_id" not in existing_columns:
        cur.execute("ALTER TABLE users ADD COLUMN telegram_chat_id INTEGER NOT NULL DEFAULT 0")
    if "mentor_id" not in existing_columns:
        cur.execute("ALTER TABLE users ADD COLUMN mentor_id INTEGER NOT NULL DEFAULT 0")
    if "password" not in existing_columns:
        cur.execute("ALTER TABLE users ADD COLUMN password TEXT")
        cur.execute("UPDATE users SET password = '' WHERE password IS NULL")
    if "access_started_at" not in existing_columns:
        cur.execute("ALTER TABLE users ADD COLUMN access_started_at TEXT")
        cur.execute(
            "UPDATE users SET access_started_at = created_at WHERE access_started_at IS NULL OR access_started_at = ''"
        )
    if "avatar_path" not in existing_columns:
        cur.execute("ALTER TABLE users ADD COLUMN avatar_path TEXT NOT NULL DEFAULT ''")
    if "avatar_name" not in existing_columns:
        cur.execute("ALTER TABLE users ADD COLUMN avatar_name TEXT NOT NULL DEFAULT ''")
    cur.execute(
        """
        UPDATE users
        SET lesson_schedule = ?
        WHERE (lesson_schedule IS NULL OR lesson_schedule = '')
          AND level != ''
          AND LOWER(level) NOT LIKE '%express%'
        """,
        (DEFAULT_LESSON_SCHEDULE_KEY,),
    )
    cur.execute(
        """
        UPDATE users
        SET phone = '+' || phone
        WHERE phone != ''
          AND phone NOT LIKE '+%'
        """
    )

    # Security migration: clear plain-text passwords, rehash if needed
    cur.execute("SELECT id, password, password_hash, salt FROM users WHERE password IS NOT NULL AND password != ''")
    rows_to_migrate = cur.fetchall()
    for row in rows_to_migrate:
        user_id = row["id"]
        plain_pw = str(row["password"] or "").strip()
        existing_hash = str(row["password_hash"] or "").strip()
        existing_salt = str(row["salt"] or "").strip()
        if plain_pw and (not existing_hash or not existing_salt):
            # User has plain-text password but no hash — rehash it
            new_salt = secrets.token_hex(16)
            new_hash = hash_password(plain_pw, new_salt)
            cur.execute(
                "UPDATE users SET password = '', password_hash = ?, salt = ? WHERE id = ?",
                (new_hash, new_salt, user_id),
            )
        else:
            # Already has hash — just clear the plain-text password
            cur.execute("UPDATE users SET password = '' WHERE id = ?", (user_id,))

    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS mentors (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    level TEXT NOT NULL,
                    phone TEXT NOT NULL DEFAULT '',
                    email TEXT NOT NULL DEFAULT '',
                    telegram_username TEXT NOT NULL DEFAULT '',
                    instagram_username TEXT NOT NULL DEFAULT '',
                    info TEXT NOT NULL DEFAULT '',
                    avatar_path TEXT NOT NULL DEFAULT '',
                    avatar_name TEXT NOT NULL DEFAULT '',
                    created_at TEXT NOT NULL
                )
        """
    )
    cur.execute("PRAGMA table_info(mentors)")
    mentor_columns = {row["name"] for row in cur.fetchall()}
    if "name" not in mentor_columns:
        cur.execute("ALTER TABLE mentors ADD COLUMN name TEXT NOT NULL DEFAULT ''")
    if "level" not in mentor_columns:
        cur.execute("ALTER TABLE mentors ADD COLUMN level TEXT NOT NULL DEFAULT ''")
    if "phone" not in mentor_columns:
        cur.execute("ALTER TABLE mentors ADD COLUMN phone TEXT NOT NULL DEFAULT ''")
    if "email" not in mentor_columns:
        cur.execute("ALTER TABLE mentors ADD COLUMN email TEXT NOT NULL DEFAULT ''")
    if "telegram_username" not in mentor_columns:
        cur.execute("ALTER TABLE mentors ADD COLUMN telegram_username TEXT NOT NULL DEFAULT ''")
    if "instagram_username" not in mentor_columns:
        cur.execute("ALTER TABLE mentors ADD COLUMN instagram_username TEXT NOT NULL DEFAULT ''")
    if "info" not in mentor_columns:
        cur.execute("ALTER TABLE mentors ADD COLUMN info TEXT NOT NULL DEFAULT ''")
    if "avatar_path" not in mentor_columns:
        cur.execute("ALTER TABLE mentors ADD COLUMN avatar_path TEXT NOT NULL DEFAULT ''")
    if "avatar_name" not in mentor_columns:
        cur.execute("ALTER TABLE mentors ADD COLUMN avatar_name TEXT NOT NULL DEFAULT ''")
    if "created_at" not in mentor_columns:
        cur.execute("ALTER TABLE mentors ADD COLUMN created_at TEXT NOT NULL DEFAULT ''")
    cur.execute(
        """
        UPDATE mentors
        SET phone = '+' || phone
        WHERE phone != ''
          AND phone NOT LIKE '+%'
        """
    )

    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS admin_edit_pins (
            admin_username TEXT PRIMARY KEY,
            pin_hash TEXT NOT NULL DEFAULT '',
            salt TEXT NOT NULL DEFAULT '',
            expires_at TEXT NOT NULL DEFAULT '',
            attempts_left INTEGER NOT NULL DEFAULT 0,
            banned_until TEXT NOT NULL DEFAULT '',
            perm_code_hash TEXT NOT NULL DEFAULT '',
            perm_code_salt TEXT NOT NULL DEFAULT '',
            perm_code_plain TEXT NOT NULL DEFAULT ''
        )
        """
    )
    cur.execute("PRAGMA table_info(admin_edit_pins)")
    _pins_cols = {row["name"] for row in cur.fetchall()}
    if "perm_code_hash" not in _pins_cols:
        cur.execute("ALTER TABLE admin_edit_pins ADD COLUMN perm_code_hash TEXT NOT NULL DEFAULT ''")
    if "perm_code_salt" not in _pins_cols:
        cur.execute("ALTER TABLE admin_edit_pins ADD COLUMN perm_code_salt TEXT NOT NULL DEFAULT ''")
    if "perm_code_plain" not in _pins_cols:
        cur.execute("ALTER TABLE admin_edit_pins ADD COLUMN perm_code_plain TEXT NOT NULL DEFAULT ''")

    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS user_devices (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            username TEXT NOT NULL,
            device_hash TEXT NOT NULL,
            device_type TEXT NOT NULL,
            user_agent TEXT NOT NULL,
            first_seen_at TEXT NOT NULL,
            last_seen_at TEXT NOT NULL,
            login_count INTEGER NOT NULL DEFAULT 1,
            last_ip TEXT NOT NULL DEFAULT '',
            city TEXT NOT NULL DEFAULT '',
            region TEXT NOT NULL DEFAULT '',
            country TEXT NOT NULL DEFAULT '',
            timezone TEXT NOT NULL DEFAULT '',
            org TEXT NOT NULL DEFAULT '',
            UNIQUE(user_id, device_hash),
            FOREIGN KEY(user_id) REFERENCES users(id)
        )
        """
    )
    cur.execute("PRAGMA table_info(user_devices)")
    device_columns = {row["name"] for row in cur.fetchall()}
    if "city" not in device_columns:
        cur.execute("ALTER TABLE user_devices ADD COLUMN city TEXT NOT NULL DEFAULT ''")
    if "region" not in device_columns:
        cur.execute("ALTER TABLE user_devices ADD COLUMN region TEXT NOT NULL DEFAULT ''")
    if "country" not in device_columns:
        cur.execute("ALTER TABLE user_devices ADD COLUMN country TEXT NOT NULL DEFAULT ''")
    if "timezone" not in device_columns:
        cur.execute("ALTER TABLE user_devices ADD COLUMN timezone TEXT NOT NULL DEFAULT ''")
    if "org" not in device_columns:
        cur.execute("ALTER TABLE user_devices ADD COLUMN org TEXT NOT NULL DEFAULT ''")

    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS video_progress (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            course TEXT NOT NULL,
            lesson_number INTEGER NOT NULL,
            watched_seconds REAL NOT NULL DEFAULT 0,
            watched_minutes REAL NOT NULL DEFAULT 0,
            duration_seconds REAL NOT NULL DEFAULT 0,
            last_position_seconds REAL NOT NULL DEFAULT 0,
            first_seen_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            UNIQUE(user_id, course, lesson_number),
            FOREIGN KEY(user_id) REFERENCES users(id)
        )
        """
    )
    cur.execute("PRAGMA table_info(video_progress)")
    video_columns = {row["name"] for row in cur.fetchall()}
    if "watched_minutes" not in video_columns:
        cur.execute("ALTER TABLE video_progress ADD COLUMN watched_minutes REAL NOT NULL DEFAULT 0")


    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS task_completions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            course TEXT NOT NULL,
            lesson_number INTEGER NOT NULL,
            task_key TEXT NOT NULL,
            completed_at TEXT NOT NULL,
            UNIQUE(user_id, course, lesson_number, task_key),
            FOREIGN KEY(user_id) REFERENCES users(id)
        )
        """
    )   

    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS homework_submissions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            course TEXT NOT NULL,
            lesson_number INTEGER NOT NULL,
            submission_text TEXT NOT NULL,
            file_path TEXT NOT NULL DEFAULT '',
            original_name TEXT NOT NULL DEFAULT '',
            mime_type TEXT NOT NULL DEFAULT '',
            archive_path TEXT NOT NULL DEFAULT '',
            archive_name TEXT NOT NULL DEFAULT '',
            mentor_seen_at TEXT NOT NULL DEFAULT '',
            status TEXT NOT NULL DEFAULT 'new',
            feedback_text TEXT NOT NULL DEFAULT '',
            reviewer_username TEXT NOT NULL DEFAULT '',
            submitted_at TEXT NOT NULL,
            reviewed_at TEXT NOT NULL DEFAULT '',
            FOREIGN KEY(user_id) REFERENCES users(id)
        )
        """
    )
    cur.execute("PRAGMA table_info(homework_submissions)")
    homework_columns = {row["name"] for row in cur.fetchall()}
    if "archive_path" not in homework_columns:
        cur.execute("ALTER TABLE homework_submissions ADD COLUMN archive_path TEXT NOT NULL DEFAULT ''")
    if "archive_name" not in homework_columns:
        cur.execute("ALTER TABLE homework_submissions ADD COLUMN archive_name TEXT NOT NULL DEFAULT ''")
    if "mentor_seen_at" not in homework_columns:
        cur.execute("ALTER TABLE homework_submissions ADD COLUMN mentor_seen_at TEXT NOT NULL DEFAULT ''")
    if "score" not in homework_columns:
        cur.execute("ALTER TABLE homework_submissions ADD COLUMN score INTEGER NOT NULL DEFAULT 0")
    if "student_seen_at" not in homework_columns:
        cur.execute("ALTER TABLE homework_submissions ADD COLUMN student_seen_at TEXT NOT NULL DEFAULT ''")

    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS quiz_attempts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            course TEXT NOT NULL,
            lesson_number INTEGER NOT NULL,
            total_questions INTEGER NOT NULL,
            correct_answers INTEGER NOT NULL,
            submitted_at TEXT NOT NULL,
            FOREIGN KEY(user_id) REFERENCES users(id)
        )
        """
    )

    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS quiz_answers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            attempt_id INTEGER NOT NULL,
            question_id INTEGER NOT NULL,
            selected_option TEXT NOT NULL,
            correct_option TEXT NOT NULL,
            is_correct INTEGER NOT NULL,
            FOREIGN KEY(attempt_id) REFERENCES quiz_attempts(id)
        )
        """
    )

    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS user_sessions (
            token TEXT PRIMARY KEY,
            user_id INTEGER NOT NULL,
            created_at TEXT NOT NULL,
            expires_at TEXT NOT NULL,
            FOREIGN KEY(user_id) REFERENCES users(id)
        )
        """
    )

    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS knowledge_test_attempts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            total_questions INTEGER NOT NULL,
            correct_answers INTEGER NOT NULL,
            score_points INTEGER NOT NULL,
            recommended_level TEXT NOT NULL,
            submitted_at TEXT NOT NULL,
            FOREIGN KEY(user_id) REFERENCES users(id)
        )
        """
    )

    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS enrollment_requests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            full_name TEXT NOT NULL,
            phone TEXT NOT NULL,
            telegram_username TEXT NOT NULL DEFAULT '',
            level TEXT NOT NULL,
            price_label TEXT NOT NULL,
            lesson_schedule TEXT NOT NULL DEFAULT '',
            submitted_username TEXT NOT NULL DEFAULT '',
            seen_by_admin INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL
        )
        """
    )
    cur.execute("PRAGMA table_info(enrollment_requests)")
    enrollment_columns = {row["name"] for row in cur.fetchall()}
    if "seen_by_admin" not in enrollment_columns:
        cur.execute("ALTER TABLE enrollment_requests ADD COLUMN seen_by_admin INTEGER NOT NULL DEFAULT 0")
    if "lesson_schedule" not in enrollment_columns:
        cur.execute("ALTER TABLE enrollment_requests ADD COLUMN lesson_schedule TEXT NOT NULL DEFAULT ''")

    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS renewal_requests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            full_name TEXT NOT NULL,
            phone TEXT NOT NULL,
            telegram_username TEXT NOT NULL DEFAULT '',
            level TEXT NOT NULL,
            price_label TEXT NOT NULL,
            submitted_username TEXT NOT NULL DEFAULT ''
        )
        """
    )

    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS contact_messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            full_name TEXT NOT NULL,
            email TEXT NOT NULL,
            message TEXT NOT NULL,
            client_ip TEXT NOT NULL DEFAULT '',
            user_agent TEXT NOT NULL DEFAULT '',
            seen_by_admin INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL
        )
        """
    )
    cur.execute("PRAGMA table_info(contact_messages)")
    contact_columns = {row["name"] for row in cur.fetchall()}
    if "seen_by_admin" not in contact_columns:
        cur.execute("ALTER TABLE contact_messages ADD COLUMN seen_by_admin INTEGER NOT NULL DEFAULT 0")

    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS payment_checks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL,
            payment_date TEXT NOT NULL,
            file_path TEXT NOT NULL,
            original_name TEXT NOT NULL,
            uploaded_at TEXT NOT NULL
        )
        """
    )

    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS quiz_answer_events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            course TEXT NOT NULL,
            lesson_number INTEGER NOT NULL,
            question_id INTEGER,
            selected_option TEXT,
            is_correct INTEGER NOT NULL,
            created_at TEXT NOT NULL,
            FOREIGN KEY(user_id) REFERENCES users(id)
        )
        """
    )
    cur.execute("PRAGMA table_info(quiz_answer_events)")
    quiz_event_columns = {row["name"] for row in cur.fetchall()}
    if "question_id" not in quiz_event_columns:
        cur.execute("ALTER TABLE quiz_answer_events ADD COLUMN question_id INTEGER")
    if "selected_option" not in quiz_event_columns:
        cur.execute("ALTER TABLE quiz_answer_events ADD COLUMN selected_option TEXT")

    # Add telegram_chat_id to user_parents so parents can link their Telegram account
    cur.execute("PRAGMA table_info(user_parents)")
    parent_columns = {row["name"] for row in cur.fetchall()}
    if "telegram_chat_id" not in parent_columns:
        cur.execute("ALTER TABLE user_parents ADD COLUMN telegram_chat_id INTEGER NOT NULL DEFAULT 0")

    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS user_achievements (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            achievement_key TEXT NOT NULL,
            points INTEGER NOT NULL DEFAULT 0,
            earned_at TEXT NOT NULL,
            UNIQUE(user_id, achievement_key),
            FOREIGN KEY(user_id) REFERENCES users(id)
        )
        """
    )
    cur.execute(
        "CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements (user_id)"
    )
    cur.execute(
        """
        CREATE UNIQUE INDEX IF NOT EXISTS idx_quiz_answer_events_first_attempt
        ON quiz_answer_events (user_id, course, lesson_number, question_id)
        WHERE question_id IS NOT NULL
        """
    )

    cur.execute("SELECT id, level, lesson_schedule, created_at, access_started_at FROM users")
    for user_row in cur.fetchall():
        level_raw = str(user_row["level"] or "").strip()
        level, _ = normalize_level(level_raw)
        if level not in COURSE_LESSON_COUNTS:
            continue
        base_raw = user_row["access_started_at"] or user_row["created_at"]
        base_dt = parse_iso_datetime(base_raw) or utc_now()
        base_local = to_local(base_dt) or local_now()

        cur.execute(
            "SELECT MAX(lesson_number) AS max_lesson FROM task_completions WHERE user_id = ? AND course = ?",
            (user_row["id"], level),
        )
        max_task = cur.fetchone()["max_lesson"] or 0
        cur.execute(
            """
            SELECT MAX(lesson_number) AS max_lesson
            FROM quiz_answer_events
            WHERE user_id = ? AND course = ? AND question_id IS NOT NULL
            """,
            (user_row["id"], level),
        )
        max_quiz = cur.fetchone()["max_lesson"] or 0
        max_lesson = max(int(max_task), int(max_quiz), 1)
        schedule_raw = user_row["lesson_schedule"] if "lesson_schedule" in user_row.keys() else ""
        desired_dt = estimate_access_started_at(local_now(), level_raw, schedule_raw, max_lesson)
        if desired_dt < base_local:
            cur.execute(
                "UPDATE users SET access_started_at = ? WHERE id = ?",
                (to_utc_naive_iso(desired_dt), user_row["id"]),
            )
        elif not user_row["access_started_at"]:
            cur.execute(
                "UPDATE users SET access_started_at = ? WHERE id = ?",
                (to_utc_naive_iso(base_local), user_row["id"]),
            )

        # Dev/testing helper: ensure at least 5 lessons are unlocked for Nemat_7 (without reducing access).
        cur.execute(
            "SELECT id, role, level, lesson_schedule, access_started_at FROM users WHERE username = ?",
            ("Nemat_7",),
        )
        nemat = cur.fetchone()
        if nemat is not None and str(nemat["role"] or "").strip().lower() == "student":
            now_local = local_now()
            access_local = None
            access_raw = str(nemat["access_started_at"] or "").strip()
            if access_raw:
                parsed = parse_iso_datetime(access_raw)
                access_local = to_local(parsed) if parsed else None
            course_key, _ = normalize_level(str(nemat["level"] or "").strip())
            total_lessons = COURSE_LESSON_COUNTS.get(course_key)
            available = get_available_lessons(
                access_local,
                str(nemat["level"] or "").strip(),
                str(nemat["lesson_schedule"] or "").strip(),
                now_local,
                total_lessons=total_lessons,
            )
            if available < 5:
                desired_dt = estimate_access_started_at(
                    now_local,
                    str(nemat["level"] or "").strip(),
                    str(nemat["lesson_schedule"] or "").strip(),
                    5,
                )
                cur.execute(
                    "UPDATE users SET access_started_at = ? WHERE id = ?",
                    (to_utc_naive_iso(desired_dt), nemat["id"]),
                )

        # Dev/testing helper: open first 5 A1 lessons for Bekzod (for testing sequential gating + unlock schedule).
        cur.execute(
            "SELECT id, role, level, lesson_schedule, access_started_at FROM users WHERE username = ?",
            ("Bekzod",),
        )
        bekzod = cur.fetchone()
        if bekzod is None:
            cur.execute(
                "SELECT id, role, level, lesson_schedule, access_started_at FROM users WHERE LOWER(username) = LOWER(?)",
                ("Bekzod",),
            )
            bekzod = cur.fetchone()
        if bekzod is not None and str(bekzod["role"] or "").strip().lower() == "student":
            bekzod_level_raw = str(bekzod["level"] or "").strip()
            bekzod_course, _ = normalize_level(bekzod_level_raw)
            if bekzod_course == "a1":
                now_local = local_now()
                access_local = None
                access_raw = str(bekzod["access_started_at"] or "").strip()
                if access_raw:
                    parsed = parse_iso_datetime(access_raw)
                    access_local = to_local(parsed) if parsed else None
                total_lessons = COURSE_LESSON_COUNTS.get(bekzod_course)
                available = get_available_lessons(
                    access_local,
                    bekzod_level_raw,
                    str(bekzod["lesson_schedule"] or "").strip(),
                    now_local,
                    total_lessons=total_lessons,
                )
                if available < 5:
                    desired_dt = estimate_access_started_at(
                        now_local,
                        bekzod_level_raw,
                        str(bekzod["lesson_schedule"] or "").strip(),
                        5,
                    )
                    cur.execute(
                        "UPDATE users SET access_started_at = ? WHERE id = ?",
                        (to_utc_naive_iso(desired_dt), bekzod["id"]),
                    )

                # Keep only Lesson 1 marked as completed (so student must open other lessons in order).
                cur.execute(
                    """
                    DELETE FROM task_completions
                    WHERE user_id = ? AND course = ? AND task_key = 'lesson_completed' AND lesson_number > 1
                    """,
                    (bekzod["id"], bekzod_course),
                )
                completed_at = to_utc_naive_iso(utc_now())
                cur.execute(
                    """
                    INSERT OR REPLACE INTO task_completions (user_id, course, lesson_number, task_key, completed_at)
                    VALUES (?, ?, 1, 'lesson_completed', ?)
                    """,
                    (bekzod["id"], bekzod_course, completed_at),
                )

        cur.execute("SELECT id FROM users WHERE username = ?", (ADMIN_USERNAME,))
        admin = cur.fetchone()
        if admin is None:
            salt = secrets.token_hex(16)
            password_hash = hash_password(ADMIN_PASSWORD, salt)
            cur.execute(
                """
                INSERT INTO users (username, password, password_hash, salt, role, created_at, access_started_at)
                VALUES (?, '', ?, ?, 'admin', ?, ?)
                """,
                (ADMIN_USERNAME, password_hash, salt, datetime.now(timezone.utc).isoformat(), datetime.now(timezone.utc).isoformat()),
            )
        elif RAW_ADMIN_PASSWORD:
            # If admin already exists and EWMS_ADMIN_PASSWORD was explicitly set,
            # keep the DB password hash in sync with the configured value so local
            # restarts don't get stuck with an old generated password.
            cur.execute("SELECT id, password_hash, salt FROM users WHERE username = ?", (ADMIN_USERNAME,))
            admin_row = cur.fetchone()
            if admin_row is not None:
                stored_hash = str(admin_row["password_hash"] or "").strip()
                stored_salt = str(admin_row["salt"] or "").strip()
                if not stored_salt or hash_password(ADMIN_PASSWORD, stored_salt) != stored_hash:
                    new_salt = secrets.token_hex(16)
                    new_hash = hash_password(ADMIN_PASSWORD, new_salt)
                    cur.execute(
                        "UPDATE users SET password = '', password_hash = ?, salt = ? WHERE id = ?",
                        (new_hash, new_salt, admin_row["id"]),
    )

        # Seed second admin account (MrSam_admin)
        _MRSAM_ADMIN_USERNAME = "MrSam_admin"
        _MRSAM_ADMIN_PASSWORD = "MrSam0105"
        _MRSAM_ADMIN_PHONE = "+998933503459"
        cur.execute("SELECT id FROM users WHERE username = ?", (_MRSAM_ADMIN_USERNAME,))
        mrsam_admin = cur.fetchone()
        if mrsam_admin is None:
            _salt = secrets.token_hex(16)
            _hash = hash_password(_MRSAM_ADMIN_PASSWORD, _salt)
            cur.execute(
                """
                INSERT INTO users (username, password, password_hash, salt, role, phone, created_at, access_started_at)
                VALUES (?, '', ?, ?, 'admin', ?, ?, ?)
                """,
                (_MRSAM_ADMIN_USERNAME, _hash, _salt, _MRSAM_ADMIN_PHONE,
                 datetime.now(timezone.utc).isoformat(), datetime.now(timezone.utc).isoformat()),
            )
        else:
            # Keep password in sync
            cur.execute("SELECT id, password_hash, salt FROM users WHERE username = ?", (_MRSAM_ADMIN_USERNAME,))
            _row = cur.fetchone()
            if _row is not None:
                _stored_hash = str(_row["password_hash"] or "").strip()
                _stored_salt = str(_row["salt"] or "").strip()
                if not _stored_salt or hash_password(_MRSAM_ADMIN_PASSWORD, _stored_salt) != _stored_hash:
                    _new_salt = secrets.token_hex(16)
                    _new_hash = hash_password(_MRSAM_ADMIN_PASSWORD, _new_salt)
                    cur.execute(
                        "UPDATE users SET password = '', password_hash = ?, salt = ?, role = 'admin', phone = ? WHERE id = ?",
                        (_new_hash, _new_salt, _MRSAM_ADMIN_PHONE, _row["id"]),
                    )

    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS user_parents (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            relation TEXT NOT NULL DEFAULT '',
            first_name TEXT NOT NULL DEFAULT '',
            last_name TEXT NOT NULL DEFAULT '',
            phone TEXT NOT NULL DEFAULT '',
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            UNIQUE(user_id, relation),
            FOREIGN KEY(user_id) REFERENCES users(id)
        )
        """
    )

    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS daily_content (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            type TEXT NOT NULL,
            text TEXT NOT NULL DEFAULT '',
            active INTEGER NOT NULL DEFAULT 1,
            created_at TEXT NOT NULL
        )
        """
    )

    _default_motivations = [
        "Every expert was once a beginner. Keep going.",
        "You don't have to be great to start, but you have to start to be great.",
        "Mistakes are proof that you are trying.",
        "A new language is a new life.",
        "Progress, not perfection.",
        "Small steps every day lead to big results.",
        "Believe you can and you're halfway there.",
        "The secret to getting ahead is getting started.",
        "Fluency is built one word at a time.",
        "Your only limit is your own mind.",
        "Consistency beats talent every single time.",
        "Dream in English, think in English, speak in English.",
        "Every sentence you speak today is one step closer to fluency.",
        "Hard work beats talent when talent doesn't work hard.",
        "You are braver than you believe and more capable than you know.",
    ]
    _default_tips = [
        "Listen to English music and try to understand the lyrics — it trains your ear.",
        "Label objects around your home with their English names to build vocabulary passively.",
        "Watch your favourite shows with English subtitles instead of your native language.",
        "Speak out loud when you practise — thinking is not the same as speaking.",
        "Read one short English article every morning to start your day actively.",
        "Keep a small notebook for new words and review it before bed.",
        "Use new words in sentences immediately — that's how they stick.",
        "Don't be afraid to make mistakes; native speakers love when you try.",
        "Record yourself speaking and listen back — you'll spot patterns to improve.",
        "Find a language partner or join a speaking club to practise regularly.",
        "Learn common phrasal verbs in context, not as isolated lists.",
        "Watch English YouTube videos on topics you already love.",
        "Repeat new vocabulary out loud at least 3 times to lock it in memory.",
        "Set your phone and apps to English — constant exposure matters.",
        "Translate songs or movie quotes you love — it's fun and effective.",
    ]

    cur.execute("SELECT COUNT(*) as cnt FROM daily_content WHERE type = 'motivation'")
    if cur.fetchone()["cnt"] == 0:
        now_iso = utc_now().isoformat()
        for m in _default_motivations:
            cur.execute("INSERT INTO daily_content (type, text, active, created_at) VALUES ('motivation', ?, 1, ?)", (m, now_iso))

    cur.execute("SELECT COUNT(*) as cnt FROM daily_content WHERE type = 'tip'")
    if cur.fetchone()["cnt"] == 0:
        now_iso = utc_now().isoformat()
        for t in _default_tips:
            cur.execute("INSERT INTO daily_content (type, text, active, created_at) VALUES ('tip', ?, 1, ?)", (t, now_iso))

    conn.commit()
    conn.close()


def verify_admin_edit_code(cur: sqlite3.Cursor, admin_username: str, code: str) -> tuple[bool, str, str]:
    admin_username = str(admin_username or "").strip()
    code = str(code or "").strip()
    if not admin_username or not code:
        return False, "invalid_request", ""

    try:
        cur.execute("SELECT pin_hash, salt, expires_at, attempts_left, banned_until, perm_code_hash, perm_code_salt, perm_code_plain FROM admin_edit_pins WHERE admin_username = ?", (admin_username,))
    except Exception:
        cur.execute("SELECT pin_hash, salt, expires_at, attempts_left, banned_until FROM admin_edit_pins WHERE admin_username = ?", (admin_username,))
    gate = cur.fetchone()
    banned_until_raw = str(gate["banned_until"] if gate is not None else "" or "").strip()
    banned_until_dt = parse_iso_datetime(banned_until_raw) if banned_until_raw else None
    if banned_until_dt is not None and utc_now() < banned_until_dt:
        return False, "banned", ""

    if ADMIN_EDIT_PERMANENT_CODE and code == ADMIN_EDIT_PERMANENT_CODE:
        return True, "", "permanent"

    if gate is not None:
        perm_plain = str((gate["perm_code_plain"] if "perm_code_plain" in gate.keys() else None) or "")
        if perm_plain and code == perm_plain:
            return True, "", "permanent"
        perm_code_hash = str((gate["perm_code_hash"] if "perm_code_hash" in gate.keys() else None) or "")
        perm_code_salt = str((gate["perm_code_salt"] if "perm_code_salt" in gate.keys() else None) or "")
        if perm_code_hash and perm_code_salt:
            if hash_password(code, perm_code_salt) == perm_code_hash:
                return True, "", "permanent"

    if gate is None:
        return False, "pin_not_requested", ""

    expires_raw = str(gate["expires_at"] or "").strip()
    expires_dt = parse_iso_datetime(expires_raw) if expires_raw else None
    if expires_dt is None or utc_now() > expires_dt:
        return False, "pin_expired", ""

    expected_hash = str(gate["pin_hash"] or "")
    salt = str(gate["salt"] or "")
    attempts_left = int(gate["attempts_left"] or 0)
    if attempts_left <= 0:
        banned_until = to_utc_naive_iso(utc_now() + timedelta(minutes=ADMIN_EDIT_BAN_MINUTES))
        cur.execute("UPDATE admin_edit_pins SET banned_until = ? WHERE admin_username = ?", (banned_until, admin_username))
        return False, "banned", ""

    provided_hash = hash_password(code, salt)
    if provided_hash == expected_hash:
        cur.execute(
            "UPDATE admin_edit_pins SET attempts_left = ? WHERE admin_username = ?",
            (ADMIN_EDIT_PIN_MAX_ATTEMPTS, admin_username),
        )
        return True, "", "pin"

    attempts_left = max(0, attempts_left - 1)
    if attempts_left <= 0:
        banned_until = to_utc_naive_iso(utc_now() + timedelta(minutes=ADMIN_EDIT_BAN_MINUTES))
        cur.execute(
            "UPDATE admin_edit_pins SET attempts_left = ?, banned_until = ? WHERE admin_username = ?",
            (attempts_left, banned_until, admin_username),
        )
        return False, "banned", ""

    cur.execute("UPDATE admin_edit_pins SET attempts_left = ? WHERE admin_username = ?", (attempts_left, admin_username))
    return False, "invalid_code", ""


class Handler(BaseHTTPRequestHandler):
    def _set_headers(self, status=200, content_type="application/json"):
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        # Avoid aggressive browser caching during development.
        # Static HTML/CSS/JS are versioned client-side, but HTML itself can still be cached.
        self.send_header("Cache-Control", "no-store")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, X-Session-Token, Authorization")
        self.end_headers()

    def _get_session_token(self) -> str:
        token = self.headers.get("X-Session-Token", "").strip()
        if not token:
            auth_header = self.headers.get("Authorization", "")
            if auth_header.lower().startswith("bearer "):
                token = auth_header[7:].strip()
        if not token:
            parsed = urlparse(self.path)
            params = {k: v[0] for k, v in parse_qs(parsed.query).items()}
            token = params.get("session_token", "").strip() or params.get("token", "").strip()
        return token

    def _get_authenticated_user(self, conn: sqlite3.Connection):
        token = self._get_session_token()
        if not token:
            return None
        cur = conn.cursor()
        user = get_session_user(cur, token)
        return user

    def _require_admin(self, conn: sqlite3.Connection):
        user = self._get_authenticated_user(conn)
        if user is None:
            self._set_headers(401)
            self.wfile.write(json.dumps({"error": "unauthorized"}).encode("utf-8"))
            return None
        if user["role"] != "admin":
            self._set_headers(403)
            self.wfile.write(json.dumps({"error": "forbidden"}).encode("utf-8"))
            return None
        return user

    def _serve_static(self, path: str) -> bool:
        raw_path = unquote(path or "")
        if not raw_path:
            return False
        if raw_path.startswith("/"):
            raw_path = raw_path[1:]
        if not raw_path:
            raw_path = "index.html"
            
        if raw_path.startswith("backend/uploads/"):
            rel_path = raw_path[len("backend/uploads/"):]
            target = (DEFAULT_DB_DIR / "uploads" / rel_path).resolve()
            try:
                target.relative_to((DEFAULT_DB_DIR / "uploads").resolve())
            except ValueError:
                self._set_headers(403, "text/plain; charset=utf-8")
                self.wfile.write(b"Forbidden")
                return True
        else:
            root = WEB_ROOT.resolve()
            target = (root / raw_path).resolve()
            try:
                target.relative_to(root)
            except ValueError:
                self._set_headers(403, "text/plain; charset=utf-8")
                self.wfile.write(b"Forbidden")
                return True

        if target.is_dir():
            target = target / "index.html"
        if not target.exists():
            self._set_headers(404, "text/plain; charset=utf-8")
            self.wfile.write(b"Not found")
            return True
        content_type, _ = mimetypes.guess_type(str(target))
        if not content_type:
            content_type = "application/octet-stream"
        if content_type.startswith("text/"):
            content_type = f"{content_type}; charset=utf-8"
        self._set_headers(200, content_type)
        try:
            with open(target, "rb") as handle:
                self.wfile.write(handle.read())
        except OSError:
            self._set_headers(500, "text/plain; charset=utf-8")
            self.wfile.write(b"Failed to read file")
        return True

    def _read_form(self):
        length = int(self.headers.get("Content-Length", "0"))
        if length == 0:
            return {}
        body = self.rfile.read(length).decode("utf-8")
        return parse_qs(body)

    def _read_json(self):
        length = int(self.headers.get("Content-Length", "0"))
        if length == 0:
            return {}
        body = self.rfile.read(length).decode("utf-8")
        return json.loads(body)

    def do_OPTIONS(self):
        self._set_headers(204)

    def do_GET(self):
        parsed = urlparse(self.path)

        def _to_int_or(value, default):
            if value is None:
                return default
            if isinstance(value, bool):
                return default
            if isinstance(value, int):
                return value
            try:
                text = str(value).strip()
                if not text:
                    return default
                return int(text)
            except Exception:
                return default

        if not parsed.path.startswith("/api/"):
            if self._serve_static(parsed.path):
                return

        if self.path == "/api/health":
            self._set_headers(200)
            self.wfile.write(json.dumps({"status": "ok"}).encode("utf-8"))
            return

        if parsed.path == "/api/lessons/overrides":
            params = {key: values[0] for key, values in parse_qs(parsed.query).items()}
            course_raw = params.get("course", "").strip()
            course, _ = normalize_level(course_raw)
            if not course:
                self._set_headers(400)
                self.wfile.write(json.dumps({"error": "course is required"}).encode("utf-8"))
                return
            items = load_lesson_overrides(course)
            self._set_headers(200)
            self.wfile.write(json.dumps({"items": items}).encode("utf-8"))
            return

        if parsed.path == "/api/lessons/meta":
            params = {key: values[0] for key, values in parse_qs(parsed.query).items()}
            course_raw = params.get("course", "").strip()
            lesson_raw = params.get("lesson_number", "").strip() or params.get("lesson", "").strip()
            course, _ = normalize_level(course_raw)
            if not course:
                self._set_headers(400)
                self.wfile.write(json.dumps({"error": "course is required"}).encode("utf-8"))
                return
            try:
                lesson_number = int(lesson_raw)
            except (TypeError, ValueError):
                lesson_number = 0
            if lesson_number <= 0:
                self._set_headers(400)
                self.wfile.write(json.dumps({"error": "lesson_number is required"}).encode("utf-8"))
                return
            title = get_lesson_title(course, lesson_number)
            self._set_headers(200)
            self.wfile.write(json.dumps({"course": course, "lesson_number": lesson_number, "title": title}).encode("utf-8"))
            return

        if parsed.path == "/api/lessons/meta-range":
            params = {key: values[0] for key, values in parse_qs(parsed.query).items()}
            course_raw = params.get("course", "").strip()
            course, _ = normalize_level(course_raw)
            if not course:
                self._set_headers(400)
                self.wfile.write(json.dumps({"error": "course is required"}).encode("utf-8"))
                return
            try:
                start = int(params.get("from", "1"))
            except (TypeError, ValueError):
                start = 1
            try:
                end = int(params.get("to", "1"))
            except (TypeError, ValueError):
                end = start
            start = max(1, start)
            end = max(start, min(end, 300))
            items = {}
            for num in range(start, end + 1):
                title = get_lesson_title(course, num)
                if title:
                    items[str(num)] = title
            self._set_headers(200)
            self.wfile.write(json.dumps({"course": course, "from": start, "to": end, "items": items}).encode("utf-8"))
            return

        if parsed.path == "/api/certificates/overrides":
            items = load_certificate_overrides()
            self._set_headers(200)
            self.wfile.write(json.dumps({"items": items}).encode("utf-8"))
            return

        if parsed.path == "/api/subscriptions/overrides":
            items = load_subscription_overrides()
            self._set_headers(200)
            self.wfile.write(json.dumps({"items": items}).encode("utf-8"))
            return

        if parsed.path == "/api/team":
            items = load_team_overrides()
            safe_items = []
            indexed_items = list(enumerate(items if isinstance(items, list) else []))
            indexed_items.sort(
                key=lambda pair: _to_int_or(pair[1].get("order") if isinstance(pair[1], dict) else None, pair[0])
            )
            for idx, (_orig_idx, raw) in enumerate(indexed_items):
                if not isinstance(raw, dict):
                    continue
                member_id = str(raw.get("id", "") or "").strip()
                if not member_id:
                    continue
                header = str(raw.get("header", "") or "").strip()
                if not header:
                    continue
                avatar_url = str(raw.get("avatar_url", "") or "").strip()
                avatar_file = str(raw.get("avatar_file", "") or "").strip()
                if avatar_file:
                    avatar_url = f"/api/team/avatar?id={quote(member_id)}"
                order_value = _to_int_or(raw.get("order"), idx)
                safe_items.append(
                    {
                        "id": member_id,
                        "order": order_value,
                        "header": header,
                        "subheader": str(raw.get("subheader", "") or ""),
                        "achievements": raw.get("achievements", []) if isinstance(raw.get("achievements", []), list) else [],
                        "telegram_username": str(raw.get("telegram_username", "") or ""),
                        "instagram_username": str(raw.get("instagram_username", "") or ""),
                        "whatsapp_phone": str(raw.get("whatsapp_phone", "") or ""),
                        "avatar_url": avatar_url,
                    }
                )
            self._set_headers(200)
            self.wfile.write(json.dumps({"items": safe_items}).encode("utf-8"))
            return

        if parsed.path == "/api/team/avatar":
            params = {key: values[0] for key, values in parse_qs(parsed.query).items()}
            member_id = str(params.get("id", "") or "").strip()
            if not member_id:
                self._set_headers(400)
                self.wfile.write(json.dumps({"error": "id is required"}).encode("utf-8"))
                return
            items = load_team_overrides()
            match = None
            for raw in items:
                if isinstance(raw, dict) and str(raw.get("id", "") or "").strip() == member_id:
                    match = raw
                    break
            if match is None:
                self._set_headers(404)
                self.wfile.write(json.dumps({"error": "team member not found"}).encode("utf-8"))
                return
            avatar_file = str(match.get("avatar_file", "") or "").strip()
            if not avatar_file:
                self._set_headers(404)
                self.wfile.write(json.dumps({"error": "avatar not found"}).encode("utf-8"))
                return
            file_path = (TEAM_AVATAR_UPLOAD_DIR / avatar_file).resolve()
            try:
                file_path.relative_to(TEAM_AVATAR_UPLOAD_DIR.resolve())
            except ValueError:
                self._set_headers(403)
                self.wfile.write(json.dumps({"error": "forbidden"}).encode("utf-8"))
                return
            if not file_path.exists():
                self._set_headers(404)
                self.wfile.write(json.dumps({"error": "avatar missing on disk"}).encode("utf-8"))
                return
            data = file_path.read_bytes()
            content_type, _ = mimetypes.guess_type(file_path.name)
            self.send_response(200)
            self.send_header("Content-Type", content_type or "application/octet-stream")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(data)
            return

        if parsed.path == "/api/partners":
            partners = load_partners()
            safe = []
            for idx, item in enumerate(partners):
                if not isinstance(item, dict):
                    continue
                pid = str(item.get("id", "") or "").strip()
                name = str(item.get("name", "") or "").strip()
                if not pid or not name:
                    continue
                logo_file = str(item.get("logo_file", "") or "").strip()
                logo_url = f"/api/partners/logo?id={quote(pid)}" if logo_file else ""
                safe.append({
                    "id": pid,
                    "name": name,
                    "logo_url": logo_url,
                    "order": _to_int_or(item.get("order"), idx),
                })
            safe.sort(key=lambda x: x["order"])
            self._set_headers(200)
            self.wfile.write(json.dumps({"items": safe}).encode("utf-8"))
            return

        if parsed.path == "/api/partners/logo":
            params = {key: values[0] for key, values in parse_qs(parsed.query).items()}
            pid = str(params.get("id", "") or "").strip()
            if not pid:
                self._set_headers(400)
                self.wfile.write(json.dumps({"error": "id is required"}).encode("utf-8"))
                return
            partners = load_partners()
            match = next((p for p in partners if isinstance(p, dict) and str(p.get("id", "") or "").strip() == pid), None)
            if match is None:
                self._set_headers(404)
                self.wfile.write(json.dumps({"error": "partner not found"}).encode("utf-8"))
                return
            logo_file = str(match.get("logo_file", "") or "").strip()
            if not logo_file:
                self._set_headers(404)
                self.wfile.write(json.dumps({"error": "logo not found"}).encode("utf-8"))
                return
            file_path = (PARTNER_LOGO_UPLOAD_DIR / logo_file).resolve()
            try:
                file_path.relative_to(PARTNER_LOGO_UPLOAD_DIR.resolve())
            except ValueError:
                self._set_headers(403)
                return
            if not file_path.exists():
                self._set_headers(404)
                return
            data = file_path.read_bytes()
            content_type, _ = mimetypes.guess_type(file_path.name)
            self.send_response(200)
            self.send_header("Content-Type", content_type or "application/octet-stream")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(data)
            return

        if self.path.startswith("/api/quiz/questions"):
            params = {key: values[0] for key, values in parse_qs(parsed.query).items()}
            course = params.get("course", "").strip().lower()
            try:
              lesson_number = int(params.get("lesson", 0))
            except (TypeError, ValueError):
                lesson_number = 0

            if not course or lesson_number <= 0:
                self._set_headers(400)
                self.wfile.write(json.dumps({"error": "course and lesson are required"}).encode("utf-8"))
                return

            questions = load_quiz_questions(course, lesson_number)
            if questions is None:
                self._set_headers(404)
                self.wfile.write(json.dumps({"error": "quiz not found"}).encode("utf-8"))
                return

            self._set_headers(200)
            self.wfile.write(json.dumps({"questions": questions}).encode("utf-8"))
            return

        if self.path.startswith("/api/quiz/status"):
            params = {key: values[0] for key, values in parse_qs(parsed.query).items()}
            username = params.get("username", "").strip()
            course_raw = params.get("course", "").strip().lower()
            course, _ = normalize_level(course_raw)
            try:
                lesson_number = int(params.get("lesson", 0))
            except (TypeError, ValueError):
                lesson_number = 0

            if not username or not course or lesson_number <= 0:
                self._set_headers(400)
                self.wfile.write(json.dumps({"error": "username, course and lesson are required"}).encode("utf-8"))
                return

            conn = get_connection()
            cur = conn.cursor()
            cur.execute("SELECT id FROM users WHERE username = ?", (username,))
            user = cur.fetchone()
            if user is None:
                conn.close()
                self._set_headers(404)
                self.wfile.write(json.dumps({"error": "user not found"}).encode("utf-8"))
                return

            cur.execute(
                """
                SELECT id, submitted_at, correct_answers, total_questions
                FROM quiz_attempts
                WHERE user_id = ? AND course = ? AND lesson_number = ?
                ORDER BY submitted_at DESC
                LIMIT 1
                """,
                (user["id"], course, lesson_number),
            )
            row = cur.fetchone()
            conn.close()
            if row is None:
                self._set_headers(200)
                self.wfile.write(json.dumps({"has_attempt": False}).encode("utf-8"))
                return

            self._set_headers(200)
            self.wfile.write(
                json.dumps(
                    {
                        "has_attempt": True,
                        "attempt_id": row["id"],
                        "submitted_at": row["submitted_at"],
                        "correct_answers": row["correct_answers"],
                        "total_questions": row["total_questions"],
                    }
                ).encode("utf-8")
            )
            return

        if self.path.startswith("/api/task/completions"):
            params = {key: values[0] for key, values in parse_qs(parsed.query).items()}

            username = params.get("username", "").strip()
            if not username:
                self._set_headers(400)
                self.wfile.write(json.dumps({"error": "username is required"}).encode("utf-8"))
                return

            conn = get_connection()
            cur = conn.cursor()
            cur.execute("SELECT id FROM users WHERE username = ?", (username,))
            user = cur.fetchone()
            if user is None:
                conn.close()
                self._set_headers(404)
                self.wfile.write(json.dumps({"error": "user not found"}).encode("utf-8"))
                return

            cur.execute(
                """
                SELECT course, lesson_number, task_key, completed_at
                FROM task_completions
                WHERE user_id = ?
                ORDER BY completed_at DESC
                """,
                (user["id"],),
            )
            rows = [dict(row) for row in cur.fetchall()]
            conn.close()
            self._set_headers(200)
            self.wfile.write(json.dumps({"items": rows}).encode("utf-8"))
            return

        if parsed.path == "/api/presentation":
            params = {key: values[0] for key, values in parse_qs(parsed.query).items()}
            course_raw = params.get("course", "").strip()
            course, _ = normalize_level(course_raw)
            try:
                lesson_number = int(params.get("lesson", 0) or 0)
            except (TypeError, ValueError):
                lesson_number = 0
            token = self.headers.get("X-Session-Token", "").strip()
            if not token:
                auth_header = self.headers.get("Authorization", "")
                if auth_header.lower().startswith("bearer "):
                    token = auth_header[7:].strip()
            if not token:
                token = params.get("session_token", "").strip() or params.get("token", "").strip()
            if not course or lesson_number <= 0:
                self._set_headers(400)
                self.wfile.write(json.dumps({"error": "course and lesson are required"}).encode("utf-8"))
                return

            conn = get_connection()
            cur = conn.cursor()
            session_user = get_session_user(cur, token)
            conn.commit()
            conn.close()

            if session_user is None:
                self._set_headers(401)
                self.wfile.write(json.dumps({"error": "login required"}).encode("utf-8"))
                return

            user_level_raw = str(session_user["level"] or "").strip()
            user_level, _ = normalize_level(user_level_raw)
            user_role = (session_user["role"] or "").strip().lower()
            is_same_level = bool(user_level and course and user_level == course)
            if user_role != "admin":
                if not is_same_level:
                    self._set_headers(403)
                    self.wfile.write(json.dumps({"error": "level mismatch"}).encode("utf-8"))
                    return
                subscription_expires_at_dt = get_subscription_expires_at(session_user["created_at"])
                if subscription_expires_at_dt is not None and utc_now() > subscription_expires_at_dt:
                    self._set_headers(403)
                    self.wfile.write(json.dumps({"error": "subscription expired"}).encode("utf-8"))
                    return
                if lesson_number > 1:
                    access_started_raw = session_user["access_started_at"] or session_user["created_at"]
                    created_dt = parse_iso_datetime(access_started_raw)
                    if created_dt is not None:
                        schedule_raw = session_user["lesson_schedule"] if "lesson_schedule" in session_user.keys() else ""
                        access_started_local = get_schedule_anchor_dt(created_dt, user_level_raw, schedule_raw)
                        now_local = local_now()
                        available_lessons = get_available_lessons(
                            access_started_local,
                            user_level_raw,
                            schedule_raw,
                            now_local,
                        )
                        if lesson_number > available_lessons:
                            self._set_headers(403)
                            self.wfile.write(json.dumps({"error": "lesson locked"}).encode("utf-8"))
                            return

            presentation_path = get_presentation_path(course, lesson_number)
            if presentation_path is None:
                self._set_headers(404)
                self.wfile.write(json.dumps({"error": "presentation not found"}).encode("utf-8"))
                return

            try:
                content = presentation_path.read_bytes()
            except OSError:
                self._set_headers(500)
                self.wfile.write(json.dumps({"error": "failed to read presentation"}).encode("utf-8"))
                return

            self.send_response(200)
            self.send_header("Content-Type", "application/pdf")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
            self.send_header("Access-Control-Allow-Headers", "Content-Type, X-Session-Token, Authorization")
            self.send_header("Content-Disposition", f'inline; filename="{presentation_path.name}"')
            self.send_header("Cache-Control", "no-store")
            self.send_header("X-Content-Type-Options", "nosniff")
            self.end_headers()
            self.wfile.write(content)
            return

        if parsed.path == "/api/presentation/info":
            params = {key: values[0] for key, values in parse_qs(parsed.query).items()}
            course_raw = params.get("course", "").strip()
            course, _ = normalize_level(course_raw)
            try:
                lesson_number = int(params.get("lesson", 0) or 0)
            except (TypeError, ValueError):
                lesson_number = 0
            if not course or lesson_number <= 0:
                self._set_headers(400)
                self.wfile.write(json.dumps({"error": "course and lesson are required"}).encode("utf-8"))
                return

            presentation_path = get_presentation_path(course, lesson_number)
            if presentation_path is None:
                self._set_headers(200)
                self.wfile.write(json.dumps({"available": False}).encode("utf-8"))
                return

            url = ""
            try:
                rel = presentation_path.resolve().relative_to(WEB_ROOT.resolve())
                url = f"/{rel.as_posix()}"
            except (OSError, ValueError):
                try:
                    rel = presentation_path.resolve().relative_to(DEFAULT_DB_DIR.resolve())
                    url = f"/backend/uploads/{rel.as_posix()}"
                except (OSError, ValueError):
                    url = f"/backend/uploads/presentations/{presentation_path.name}"

            self._set_headers(200)
            self.wfile.write(
                json.dumps(
                    {
                        "available": True,
                        "file": presentation_path.name,
                        "url": url,
                    }
                ).encode("utf-8")
            )
            return

        if parsed.path == "/api/admin/overview":
            conn = get_connection()
            if not self._require_admin(conn):
                conn.close()
                return
            cur = conn.cursor()

            cur.execute("SELECT COUNT(*) AS total_users FROM users")
            total_users = cur.fetchone()["total_users"]

            cur.execute("SELECT COUNT(*) AS total_attempts FROM quiz_attempts")
            total_attempts = cur.fetchone()["total_attempts"]

            cur.execute(
                """
                SELECT AVG(CASE WHEN total_questions = 0 THEN 0.0 ELSE (correct_answers * 100.0 / total_questions) END) AS avg_score_percent
                FROM quiz_attempts
                """
            )
            avg_score_percent = cur.fetchone()["avg_score_percent"] or 0.0

            cur.execute(
                """
                SELECT full_name, level, username, phone, role, lesson_schedule, created_at
                FROM users
                ORDER BY created_at DESC
                LIMIT 30
                """
            )
            users = [dict(row) for row in cur.fetchall()]

            cur.execute(
                """
                SELECT u.username, qa.course, qa.lesson_number, qa.correct_answers, qa.total_questions, qa.submitted_at
                FROM quiz_attempts qa
                JOIN users u ON u.id = qa.user_id
                ORDER BY qa.submitted_at DESC
                LIMIT 40
                """
            )
            recent_attempts = [dict(row) for row in cur.fetchall()]

            cur.execute(
                """
                SELECT u.username, ka.correct_answers, ka.total_questions, ka.score_points, ka.recommended_level, ka.submitted_at
                FROM knowledge_test_attempts ka
                JOIN users u ON u.id = ka.user_id
                ORDER BY ka.submitted_at DESC
                LIMIT 60
                """
            )
            knowledge_test_attempts = [dict(row) for row in cur.fetchall()]

            cur.execute(
                """
                SELECT id, full_name, phone, telegram_username, level, price_label, lesson_schedule, submitted_username, seen_by_admin, created_at
                FROM enrollment_requests
                ORDER BY created_at DESC
                LIMIT 300
                """
            )
            enrollment_requests = [dict(row) for row in cur.fetchall()]
            pending_enrollment_requests = sum(
                1 for request in enrollment_requests if int(request.get("seen_by_admin", 0) or 0) == 0
            )

            cur.execute(
                """
                SELECT id, full_name, phone, telegram_username, level, price_label, submitted_username
                FROM renewal_requests
                ORDER BY id DESC
                LIMIT 300
                """
            )
            renewal_requests = [dict(row) for row in cur.fetchall()]

            level_tables = {
                level: {"lesson_count": lesson_count, "users": []}
                for level, lesson_count in COURSE_LESSON_COUNTS.items()
            }
            cur.execute(
                """
                SELECT id, full_name, username, created_at, level
                FROM users
                WHERE role = 'student'
                ORDER BY created_at DESC
                """
            )
            raw_level_users = cur.fetchall()

            for raw_user in raw_level_users:
                base_level, _ = normalize_level(raw_user["level"])
                lesson_count = COURSE_LESSON_COUNTS.get(base_level, 0)
                if lesson_count <= 0:
                    continue
                cur.execute(
                    """
                    SELECT DISTINCT lesson_number
                    FROM task_completions
                    WHERE user_id = ? AND course = ?
                    """,
                    (raw_user["id"], base_level),
                )
                completed_lessons = {int(row["lesson_number"]) for row in cur.fetchall()}
                lessons = {
                    str(lesson_number): int(lesson_number in completed_lessons)
                    for lesson_number in range(1, lesson_count + 1)
                }
                level_tables[base_level]["users"].append(
                    {
                        "name": raw_user["full_name"] or "",
                        "user": raw_user["username"] or "",
                        "created_at": raw_user["created_at"] or "",
                        "lessons": lessons,
                    }
                )
            conn.close()

            self._set_headers(200)
            self.wfile.write(
                json.dumps(
                    {
                        "stats": {
                            "total_users": total_users,
                            "total_attempts": total_attempts,
                            "avg_score_percent": avg_score_percent,
                            "pending_enrollment_requests": pending_enrollment_requests,
                        },
                        "users": users,
                        "recent_attempts": recent_attempts,
                        "knowledge_test_attempts": knowledge_test_attempts,
                        "enrollment_requests": enrollment_requests,
                        "renewal_requests": renewal_requests,
                        "level_tables": level_tables,
                    }
                ).encode("utf-8")
            )
            return

        if parsed.path == "/api/admin/device-log":
            conn = get_connection()
            if not self._require_admin(conn):
                conn.close()
                return
            cur = conn.cursor()

            cur.execute(
                """
                SELECT username, device_type, user_agent, first_seen_at, last_seen_at, login_count, last_ip,
                       city, region, country, timezone, org
                FROM user_devices
                ORDER BY last_seen_at DESC
                LIMIT 800
                """
            )
            rows = [dict(row) for row in cur.fetchall()]
            conn.close()
            self._set_headers(200)
            self.wfile.write(json.dumps({"items": rows}).encode("utf-8"))
            return

        if parsed.path == "/api/user/role":
            params = {key: values[0] for key, values in parse_qs(parsed.query).items()}
            username = params.get("username", "").strip()
            if not username:
                self._set_headers(400)
                self.wfile.write(json.dumps({"error": "username is required"}).encode("utf-8"))
                return

            conn = get_connection()
            cur = conn.cursor()
            cur.execute("SELECT username, full_name, role, level FROM users WHERE username = ?", (username,))
            user = cur.fetchone()
            conn.close()
            if user is None:
                self._set_headers(404)
                self.wfile.write(json.dumps({"error": "user not found"}).encode("utf-8"))
                return

            self._set_headers(200)
            self.wfile.write(
                json.dumps(
                    {
                        "username": user["username"],
                        "full_name": user["full_name"] or "",
                        "role": user["role"],
                        "level": user["level"],
                    }
                ).encode("utf-8")
            )
            return

        if parsed.path == "/api/user/progress-summary":
            params = {key: values[0] for key, values in parse_qs(parsed.query).items()}
            username = params.get("username", "").strip()
            if not username:
                self._set_headers(400)
                self.wfile.write(json.dumps({"error": "username is required"}).encode("utf-8"))
                return

            conn = get_connection()
            cur = conn.cursor()
            cur.execute(
                """
                SELECT id, username, full_name, level, lesson_schedule, mentor_id, created_at, access_started_at, avatar_path, avatar_name, role, phone
                FROM users
                WHERE username = ?
                """,
                (username,),
            )
            user = cur.fetchone()
            if user is None:
                conn.close()
                self._set_headers(404)
                self.wfile.write(json.dumps({"error": "user not found"}).encode("utf-8"))
                return

            summary = build_progress_summary(cur, user)
            summary["username"] = user["username"]
            summary["full_name"] = user["full_name"] or ""
            avatar_url = ""
            if "avatar_path" in user.keys() and user["avatar_path"]:
                avatar_url = f"/api/users/avatar?username={quote(user['username'])}"
            summary["avatar_url"] = avatar_url
            summary["role"] = str(user["role"] or "").strip().lower() if "role" in user.keys() else ""
            if summary["role"] == "mentor":
                own_phone = str(user["phone"] or "").strip() if "phone" in user.keys() else ""
                own_name = str(user["full_name"] or "").strip()
                own_mentor_profile = None
                if own_phone:
                    cur.execute("SELECT id FROM mentors WHERE phone = ? ORDER BY id DESC LIMIT 1", (own_phone,))
                    mrow = cur.fetchone()
                    if mrow:
                        own_mentor_profile = fetch_mentor_by_id(cur, int(mrow["id"]))
                if own_mentor_profile is None and own_name:
                    cur.execute(
                        "SELECT id FROM mentors WHERE LOWER(name) = LOWER(?) ORDER BY id DESC LIMIT 1", (own_name,)
                    )
                    mrow = cur.fetchone()
                    if mrow:
                        own_mentor_profile = fetch_mentor_by_id(cur, int(mrow["id"]))
                summary["own_mentor_profile"] = own_mentor_profile
            conn.commit()
            conn.close()
            self._set_headers(200)
            self.wfile.write(json.dumps(summary).encode("utf-8"))
            return

        if parsed.path == "/api/student/notifications/summary":
            params = {key: values[0] for key, values in parse_qs(parsed.query).items()}
            username = params.get("username", "").strip()
            if not username:
                self._set_headers(400)
                self.wfile.write(json.dumps({"error": "username is required"}).encode("utf-8"))
                return

            conn = get_connection()
            cur = conn.cursor()
            cur.execute("SELECT id, role FROM users WHERE username = ?", (username,))
            user = cur.fetchone()
            if user is None:
                conn.close()
                self._set_headers(404)
                self.wfile.write(json.dumps({"error": "user not found"}).encode("utf-8"))
                return
            if str(user["role"] or "").strip().lower() != "student":
                conn.close()
                self._set_headers(403)
                self.wfile.write(json.dumps({"error": "student access required"}).encode("utf-8"))
                return

            cur.execute(
                """
                SELECT COUNT(*) AS unread_count
                FROM homework_submissions
                WHERE user_id = ?
                  AND status = 'checked'
                  AND reviewed_at IS NOT NULL
                  AND reviewed_at != ''
                  AND (student_seen_at IS NULL OR student_seen_at = '')
                """,
                (user["id"],),
            )
            unread_row = cur.fetchone()
            unread = int((unread_row["unread_count"] or 0) if unread_row is not None else 0)
            conn.close()
            self._set_headers(200)
            self.wfile.write(json.dumps({"unread_count": unread}).encode("utf-8"))
            return

        if parsed.path == "/api/student/notifications/homework-reviews":
            params = {key: values[0] for key, values in parse_qs(parsed.query).items()}
            username = params.get("username", "").strip()
            try:
                limit = int(params.get("limit", 50))
            except (TypeError, ValueError):
                limit = 50
            limit = max(1, min(250, limit))
            if not username:
                self._set_headers(400)
                self.wfile.write(json.dumps({"error": "username is required"}).encode("utf-8"))
                return

            conn = get_connection()
            cur = conn.cursor()
            cur.execute("SELECT id, role FROM users WHERE username = ?", (username,))
            user = cur.fetchone()
            if user is None:
                conn.close()
                self._set_headers(404)
                self.wfile.write(json.dumps({"error": "user not found"}).encode("utf-8"))
                return
            if str(user["role"] or "").strip().lower() != "student":
                conn.close()
                self._set_headers(403)
                self.wfile.write(json.dumps({"error": "student access required"}).encode("utf-8"))
                return

            cur.execute(
                """
                SELECT COUNT(*) AS unread_count
                FROM homework_submissions
                WHERE user_id = ?
                  AND status = 'checked'
                  AND reviewed_at IS NOT NULL
                  AND reviewed_at != ''
                  AND (student_seen_at IS NULL OR student_seen_at = '')
                """,
                (user["id"],),
            )
            unread_row = cur.fetchone()
            unread = int((unread_row["unread_count"] or 0) if unread_row is not None else 0)
            cur.execute(
                """
                SELECT
                    id AS submission_id,
                    course,
                    lesson_number,
                    score,
                    feedback_text,
                    reviewer_username,
                    reviewed_at,
                    student_seen_at
                FROM homework_submissions
                WHERE user_id = ?
                  AND status = 'checked'
                  AND reviewed_at IS NOT NULL
                  AND reviewed_at != ''
                ORDER BY reviewed_at DESC, id DESC
                LIMIT ?
                """,
                (user["id"], limit),
            )
            rows = [dict(row) for row in cur.fetchall()]
            conn.close()
            for row in rows:
                row["is_unread"] = not bool(str(row.get("student_seen_at") or "").strip())
                row["has_comment"] = bool(str(row.get("feedback_text") or "").strip())
                row.pop("student_seen_at", None)

            self._set_headers(200)
            self.wfile.write(json.dumps({"unread_count": unread, "items": rows}).encode("utf-8"))
            return

        if parsed.path == "/api/users/avatar":
            params = {key: values[0] for key, values in parse_qs(parsed.query).items()}
            username = params.get("username", "").strip()
            if not username:
                self._set_headers(400)
                self.wfile.write(json.dumps({"error": "username is required"}).encode("utf-8"))
                return

            conn = get_connection()
            cur = conn.cursor()
            cur.execute("SELECT avatar_path, avatar_name FROM users WHERE username = ?", (username,))
            row = cur.fetchone()
            conn.close()
            if row is None:
                self._set_headers(404)
                self.wfile.write(json.dumps({"error": "user not found"}).encode("utf-8"))
                return
            file_path_raw = str(row["avatar_path"] or "").strip()
            if not file_path_raw:
                self._set_headers(404)
                self.wfile.write(json.dumps({"error": "avatar not found"}).encode("utf-8"))
                return
            file_path = Path(file_path_raw)
            if not file_path.exists():
                self._set_headers(404)
                self.wfile.write(json.dumps({"error": "avatar missing on disk"}).encode("utf-8"))
                return

            data = file_path.read_bytes()
            content_type, _ = mimetypes.guess_type(str(row["avatar_name"] or ""))
            if not content_type:
                content_type = "application/octet-stream"
            self.send_response(200)
            self.send_header("Content-Type", content_type)
            self.send_header("Access-Control-Allow-Origin", "*")
            self.send_header("Cache-Control", "no-store")
            self.send_header("X-Content-Type-Options", "nosniff")
            self.end_headers()
            self.wfile.write(data)
            return

        if parsed.path == "/api/mentor/students":
            params = {key: values[0] for key, values in parse_qs(parsed.query).items()}
            username = params.get("username", "").strip()
            if not username:
                self._set_headers(400)
                self.wfile.write(json.dumps({"error": "username is required"}).encode("utf-8"))
                return

            conn = get_connection()
            cur = conn.cursor()
            cur.execute("SELECT id, role, level, full_name, phone FROM users WHERE username = ?", (username,))
            mentor_user = cur.fetchone()
            if mentor_user is None:
                conn.close()
                self._set_headers(404)
                self.wfile.write(json.dumps({"error": "user not found"}).encode("utf-8"))
                return
            if str(mentor_user["role"] or "").strip().lower() != "mentor":
                conn.close()
                self._set_headers(403)
                self.wfile.write(json.dumps({"error": "mentor access required"}).encode("utf-8"))
                return

            course_level, _ = normalize_level(str(mentor_user["level"] or "").strip())
            if course_level not in COURSE_LESSON_COUNTS:
                conn.close()
                self._set_headers(200)
                self.wfile.write(json.dumps({"items": []}).encode("utf-8"))
                return

            mentor_profile_id = resolve_mentor_profile_id(cur, mentor_user)
            level_like = f"{course_level}%"
            if mentor_profile_id > 0:
                cur.execute(
                    """
                    WITH lesson_scores AS (
                        SELECT
                            user_id,
                            lesson_number,
                            (SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) * 100.0) / COUNT(*) AS percent
                        FROM quiz_answer_events
                        WHERE course = ? AND question_id IS NOT NULL
                        GROUP BY user_id, lesson_number
                    ),
                    avg_scores AS (
                        SELECT user_id, AVG(percent) AS average_percent
                        FROM lesson_scores
                        GROUP BY user_id
                    )
                    SELECT
                        u.username,
                        u.full_name,
                        u.level,
                        COALESCE(a.average_percent, 0.0) AS average_percent
                    FROM users u
                    LEFT JOIN avg_scores a ON a.user_id = u.id
                    WHERE u.role = 'student'
                      AND u.mentor_id = ?
                      AND LOWER(u.level) LIKE LOWER(?)
                    ORDER BY u.created_at DESC
                    LIMIT 250
                    """,
                    (course_level, mentor_profile_id, level_like),
                )
            else:
                cur.execute(
                    """
                    WITH lesson_scores AS (
                        SELECT
                            user_id,
                            lesson_number,
                            (SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) * 100.0) / COUNT(*) AS percent
                        FROM quiz_answer_events
                        WHERE course = ? AND question_id IS NOT NULL
                        GROUP BY user_id, lesson_number
                    ),
                    avg_scores AS (
                        SELECT user_id, AVG(percent) AS average_percent
                        FROM lesson_scores
                        GROUP BY user_id
                    )
                    SELECT
                        u.username,
                        u.full_name,
                        u.level,
                        COALESCE(a.average_percent, 0.0) AS average_percent
                    FROM users u
                    LEFT JOIN avg_scores a ON a.user_id = u.id
                    WHERE u.role = 'student' AND LOWER(u.level) LIKE LOWER(?)
                    ORDER BY u.created_at DESC
                    LIMIT 250
                    """,
                    (course_level, level_like),
                )
            items = [dict(row) for row in cur.fetchall()]
            conn.close()

            self._set_headers(200)
            self.wfile.write(json.dumps({"items": items}).encode("utf-8"))
            return

        if parsed.path == "/api/mentor/student-details":
            params = {key: values[0] for key, values in parse_qs(parsed.query).items()}
            username = params.get("username", "").strip()
            student_username = params.get("student_username", "").strip()
            if not username or not student_username:
                self._set_headers(400)
                self.wfile.write(json.dumps({"error": "username and student_username are required"}).encode("utf-8"))
                return

            conn = get_connection()
            cur = conn.cursor()
            cur.execute("SELECT id, role, level, full_name, phone FROM users WHERE username = ?", (username,))
            mentor_user = cur.fetchone()
            if mentor_user is None:
                conn.close()
                self._set_headers(404)
                self.wfile.write(json.dumps({"error": "user not found"}).encode("utf-8"))
                return
            if str(mentor_user["role"] or "").strip().lower() != "mentor":
                conn.close()
                self._set_headers(403)
                self.wfile.write(json.dumps({"error": "mentor access required"}).encode("utf-8"))
                return

            cur.execute(
                """
                SELECT id, username, full_name, level, lesson_schedule, mentor_id, phone, created_at, access_started_at
                FROM users
                WHERE username = ? AND role = 'student'
                """,
                (student_username,),
            )
            student = cur.fetchone()
            if student is None:
                conn.close()
                self._set_headers(404)
                self.wfile.write(json.dumps({"error": "student user not found"}).encode("utf-8"))
                return

            mentor_course, _ = normalize_level(str(mentor_user["level"] or "").strip())
            student_course, _ = normalize_level(str(student["level"] or "").strip())
            if mentor_course and student_course and mentor_course != student_course:
                conn.close()
                self._set_headers(403)
                self.wfile.write(json.dumps({"error": "level mismatch"}).encode("utf-8"))
                return
            mentor_profile_id = resolve_mentor_profile_id(cur, mentor_user)
            student_mentor_id = int((student["mentor_id"] if "mentor_id" in student.keys() else 0) or 0)
            if mentor_profile_id > 0 and student_mentor_id > 0 and student_mentor_id != mentor_profile_id:
                conn.close()
                self._set_headers(403)
                self.wfile.write(json.dumps({"error": "student is not assigned to this mentor"}).encode("utf-8"))
                return

            summary = build_progress_summary(cur, student)
            cur.execute(
                """
                SELECT relation, first_name, last_name, phone
                FROM user_parents
                WHERE user_id = ?
                ORDER BY relation ASC
                """,
                (int(student["id"] or 0),),
            )
            parents = [dict(r) for r in cur.fetchall()]
            conn.commit()
            conn.close()
            self._set_headers(200)
            self.wfile.write(json.dumps({"student": dict(student), "summary": summary, "parents": parents}).encode("utf-8"))
            return

        if parsed.path == "/api/mentor/homework/summary":
            params = {key: values[0] for key, values in parse_qs(parsed.query).items()}
            username = params.get("username", "").strip()
            if not username:
                self._set_headers(400)
                self.wfile.write(json.dumps({"error": "username is required"}).encode("utf-8"))
                return

            conn = get_connection()
            cur = conn.cursor()
            cur.execute("SELECT id, role, level FROM users WHERE username = ?", (username,))
            mentor_user = cur.fetchone()
            if mentor_user is None:
                conn.close()
                self._set_headers(404)
                self.wfile.write(json.dumps({"error": "user not found"}).encode("utf-8"))
                return
            if str(mentor_user["role"] or "").strip().lower() != "mentor":
                conn.close()
                self._set_headers(403)
                self.wfile.write(json.dumps({"error": "mentor access required"}).encode("utf-8"))
                return

            course_level, _ = normalize_level(str(mentor_user["level"] or "").strip())
            if course_level not in COURSE_LESSON_COUNTS:
                conn.close()
                self._set_headers(200)
                self.wfile.write(json.dumps({"total_new": 0, "students": []}).encode("utf-8"))
                return

            mentor_profile_id = resolve_mentor_profile_id(cur, mentor_user)
            level_like = f"{course_level}%"
            if mentor_profile_id > 0:
                cur.execute(
                    """
                    SELECT
                        u.username,
                        u.full_name,
                        COUNT(DISTINCT (hs.course || ':' || hs.lesson_number)) AS new_count,
                        MAX(hs.submitted_at) AS latest_submitted_at
                    FROM homework_submissions hs
                    JOIN users u ON u.id = hs.user_id
                    WHERE u.role = 'student'
                      AND u.mentor_id = ?
                      AND LOWER(u.level) LIKE LOWER(?)
                      AND hs.course = ?
                      AND (hs.mentor_seen_at IS NULL OR hs.mentor_seen_at = '')
                    GROUP BY u.id
                    ORDER BY latest_submitted_at DESC
                    LIMIT 250
                    """,
                    (mentor_profile_id, level_like, course_level),
                )
            else:
                cur.execute(
                    """
                    SELECT
                        u.username,
                        u.full_name,
                        COUNT(DISTINCT (hs.course || ':' || hs.lesson_number)) AS new_count,
                        MAX(hs.submitted_at) AS latest_submitted_at
                    FROM homework_submissions hs
                    JOIN users u ON u.id = hs.user_id
                    WHERE u.role = 'student'
                      AND LOWER(u.level) LIKE LOWER(?)
                      AND hs.course = ?
                      AND (hs.mentor_seen_at IS NULL OR hs.mentor_seen_at = '')
                    GROUP BY u.id
                    ORDER BY latest_submitted_at DESC
                    LIMIT 250
                    """,
                    (level_like, course_level),
                )
            students = [dict(row) for row in cur.fetchall()]
            total_new = sum(int(item.get("new_count") or 0) for item in students)
            conn.close()
            self._set_headers(200)
            self.wfile.write(json.dumps({"total_new": total_new, "students": students}).encode("utf-8"))
            return

        if parsed.path == "/api/mentor/homework/lessons":
            params = {key: values[0] for key, values in parse_qs(parsed.query).items()}
            username = params.get("username", "").strip()
            student_username = params.get("student_username", "").strip()
            if not username or not student_username:
                self._set_headers(400)
                self.wfile.write(json.dumps({"error": "username and student_username are required"}).encode("utf-8"))
                return

            conn = get_connection()
            cur = conn.cursor()
            cur.execute("SELECT id, role, level FROM users WHERE username = ?", (username,))
            mentor_user = cur.fetchone()
            if mentor_user is None:
                conn.close()
                self._set_headers(404)
                self.wfile.write(json.dumps({"error": "user not found"}).encode("utf-8"))
                return
            if str(mentor_user["role"] or "").strip().lower() != "mentor":
                conn.close()
                self._set_headers(403)
                self.wfile.write(json.dumps({"error": "mentor access required"}).encode("utf-8"))
                return

            cur.execute(
                "SELECT id, username, full_name, level, mentor_id FROM users WHERE username = ? AND role = 'student'",
                (student_username,),
            )
            student = cur.fetchone()
            if student is None:
                conn.close()
                self._set_headers(404)
                self.wfile.write(json.dumps({"error": "student user not found"}).encode("utf-8"))
                return

            mentor_course, _ = normalize_level(str(mentor_user["level"] or "").strip())
            student_course, _ = normalize_level(str(student["level"] or "").strip())
            if mentor_course and student_course and mentor_course != student_course:
                conn.close()
                self._set_headers(403)
                self.wfile.write(json.dumps({"error": "level mismatch"}).encode("utf-8"))
                return
            mentor_profile_id = resolve_mentor_profile_id(cur, mentor_user)
            student_mentor_id = int((student["mentor_id"] if "mentor_id" in student.keys() else 0) or 0)
            if mentor_profile_id > 0 and student_mentor_id > 0 and student_mentor_id != mentor_profile_id:
                conn.close()
                self._set_headers(403)
                self.wfile.write(json.dumps({"error": "student is not assigned to this mentor"}).encode("utf-8"))
                return

            cur.execute(
                """
                SELECT
                    hs.course,
                    hs.lesson_number,
                    MAX(hs.submitted_at) AS latest_submitted_at,
                    SUM(CASE WHEN (hs.mentor_seen_at IS NULL OR hs.mentor_seen_at = '') THEN 1 ELSE 0 END) AS new_count,
                    (
                        SELECT id
                        FROM homework_submissions hs2
                        WHERE hs2.user_id = hs.user_id
                          AND hs2.course = hs.course
                          AND hs2.lesson_number = hs.lesson_number
                        ORDER BY hs2.submitted_at DESC, hs2.id DESC
                        LIMIT 1
                    ) AS latest_submission_id
                FROM homework_submissions hs
                WHERE hs.user_id = ?
                GROUP BY hs.course, hs.lesson_number
                ORDER BY latest_submitted_at DESC
                """,
                (student["id"],),
            )
            items = [dict(row) for row in cur.fetchall()]
            conn.close()
            self._set_headers(200)
            self.wfile.write(json.dumps({"student": dict(student), "items": items}).encode("utf-8"))
            return

        if parsed.path == "/api/mentor/homework/download":
            params = {key: values[0] for key, values in parse_qs(parsed.query).items()}
            username = params.get("username", "").strip()
            try:
                submission_id = int(params.get("submission_id", 0))
            except (TypeError, ValueError):
                submission_id = 0
            if not username or submission_id <= 0:
                self._set_headers(400)
                self.wfile.write(json.dumps({"error": "username and submission_id are required"}).encode("utf-8"))
                return

            conn = get_connection()
            cur = conn.cursor()
            cur.execute("SELECT id, role, level FROM users WHERE username = ?", (username,))
            mentor_user = cur.fetchone()
            if mentor_user is None:
                conn.close()
                self._set_headers(404)
                self.wfile.write(json.dumps({"error": "user not found"}).encode("utf-8"))
                return
            if str(mentor_user["role"] or "").strip().lower() != "mentor":
                conn.close()
                self._set_headers(403)
                self.wfile.write(json.dumps({"error": "mentor access required"}).encode("utf-8"))
                return

            cur.execute(
                """
                SELECT
                    hs.id,
                    hs.user_id,
                    hs.course,
                    hs.lesson_number,
                    hs.archive_path,
                    hs.archive_name,
                    hs.mentor_seen_at,
                    u.username AS student_username,
                    u.level AS student_level,
                    u.mentor_id AS student_mentor_id
                FROM homework_submissions hs
                JOIN users u ON u.id = hs.user_id
                WHERE hs.id = ?
                """,
                (submission_id,),
            )
            row = cur.fetchone()
            if row is None:
                conn.close()
                self._set_headers(404)
                self.wfile.write(json.dumps({"error": "submission not found"}).encode("utf-8"))
                return

            mentor_course, _ = normalize_level(str(mentor_user["level"] or "").strip())
            student_course, _ = normalize_level(str(row["student_level"] or "").strip())
            if mentor_course and student_course and mentor_course != student_course:
                conn.close()
                self._set_headers(403)
                self.wfile.write(json.dumps({"error": "level mismatch"}).encode("utf-8"))
                return
            mentor_profile_id = resolve_mentor_profile_id(cur, mentor_user)
            student_mentor_id = int((row["student_mentor_id"] or 0) or 0)
            if mentor_profile_id > 0 and student_mentor_id > 0 and student_mentor_id != mentor_profile_id:
                conn.close()
                self._set_headers(403)
                self.wfile.write(json.dumps({"error": "student is not assigned to this mentor"}).encode("utf-8"))
                return

            archive_path_raw = str(row["archive_path"] or "").strip()
            archive_name = str(row["archive_name"] or "").strip() or f"homework_{submission_id}.zip"
            if not archive_path_raw:
                conn.close()
                self._set_headers(404)
                self.wfile.write(json.dumps({"error": "archive not available"}).encode("utf-8"))
                return
            archive_path = Path(archive_path_raw)
            if not archive_path.exists():
                conn.close()
                self._set_headers(404)
                self.wfile.write(json.dumps({"error": "archive missing on disk"}).encode("utf-8"))
                return

            if not str(row["mentor_seen_at"] or "").strip():
                seen_at = datetime.now(timezone.utc).isoformat()
                cur.execute(
                    "UPDATE homework_submissions SET mentor_seen_at = ? WHERE id = ? AND (mentor_seen_at IS NULL OR mentor_seen_at = '')",
                    (seen_at, submission_id),
                )
                conn.commit()
            conn.close()

            data = archive_path.read_bytes()
            self.send_response(200)
            self.send_header("Content-Type", "application/zip")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.send_header("Cache-Control", "no-store")
            self.send_header("X-Content-Type-Options", "nosniff")
            self.send_header("Content-Disposition", f"attachment; filename=\"{quote(archive_name)}\"")
            self.end_headers()
            self.wfile.write(data)
            return

        if parsed.path == "/api/student/homework/download":
            params = {key: values[0] for key, values in parse_qs(parsed.query).items()}
            username = params.get("username", "").strip()
            try:
                submission_id = int(params.get("submission_id", 0))
            except (TypeError, ValueError):
                submission_id = 0
            if not username or submission_id <= 0:
                self._set_headers(400)
                self.wfile.write(json.dumps({"error": "username and submission_id are required"}).encode("utf-8"))
                return

            conn = get_connection()
            cur = conn.cursor()
            cur.execute("SELECT id, role FROM users WHERE username = ?", (username,))
            user = cur.fetchone()
            if user is None:
                conn.close()
                self._set_headers(404)
                self.wfile.write(json.dumps({"error": "user not found"}).encode("utf-8"))
                return
            if str(user["role"] or "").strip().lower() != "student":
                conn.close()
                self._set_headers(403)
                self.wfile.write(json.dumps({"error": "student access required"}).encode("utf-8"))
                return

            cur.execute(
                """
                SELECT id, archive_path, archive_name
                FROM homework_submissions
                WHERE id = ? AND user_id = ?
                """,
                (submission_id, user["id"]),
            )
            row = cur.fetchone()
            conn.close()
            if row is None:
                self._set_headers(404)
                self.wfile.write(json.dumps({"error": "submission not found"}).encode("utf-8"))
                return
            archive_path_raw = str(row["archive_path"] or "").strip()
            archive_name = str(row["archive_name"] or "").strip() or f"homework_{submission_id}.zip"
            if not archive_path_raw:
                self._set_headers(404)
                self.wfile.write(json.dumps({"error": "archive not available"}).encode("utf-8"))
                return
            archive_path = Path(archive_path_raw)
            if not archive_path.exists():
                self._set_headers(404)
                self.wfile.write(json.dumps({"error": "archive missing on disk"}).encode("utf-8"))
                return

            data = archive_path.read_bytes()
            self.send_response(200)
            self.send_header("Content-Type", "application/zip")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.send_header("Cache-Control", "no-store")
            self.send_header("X-Content-Type-Options", "nosniff")
            self.send_header("Content-Disposition", f"attachment; filename=\"{quote(archive_name)}\"")
            self.end_headers()
            self.wfile.write(data)
            return

        if parsed.path == "/api/mentor/progress":
            params = {key: values[0] for key, values in parse_qs(parsed.query).items()}
            username = params.get("username", "").strip()
            student_username = params.get("student_username", "").strip()
            if not username or not student_username:
                self._set_headers(400)
                self.wfile.write(json.dumps({"error": "username and student_username are required"}).encode("utf-8"))
                return

            conn = get_connection()
            cur = conn.cursor()
            cur.execute("SELECT id, role, level, full_name, phone FROM users WHERE username = ?", (username,))
            mentor_user = cur.fetchone()
            if mentor_user is None:
                conn.close()
                self._set_headers(404)
                self.wfile.write(json.dumps({"error": "user not found"}).encode("utf-8"))
                return
            if str(mentor_user["role"] or "").strip().lower() != "mentor":
                conn.close()
                self._set_headers(403)
                self.wfile.write(json.dumps({"error": "mentor access required"}).encode("utf-8"))
                return

            cur.execute(
                "SELECT id, username, full_name, level, mentor_id FROM users WHERE username = ? AND role = 'student'",
                (student_username,),
            )
            student = cur.fetchone()
            if student is None:
                conn.close()
                self._set_headers(404)
                self.wfile.write(json.dumps({"error": "student user not found"}).encode("utf-8"))
                return

            mentor_course, _ = normalize_level(str(mentor_user["level"] or "").strip())
            student_course, _ = normalize_level(str(student["level"] or "").strip())
            if mentor_course and student_course and mentor_course != student_course:
                conn.close()
                self._set_headers(403)
                self.wfile.write(json.dumps({"error": "level mismatch"}).encode("utf-8"))
                return
            mentor_profile_id = resolve_mentor_profile_id(cur, mentor_user)
            student_mentor_id = int((student["mentor_id"] if "mentor_id" in student.keys() else 0) or 0)
            if mentor_profile_id > 0 and student_mentor_id > 0 and student_mentor_id != mentor_profile_id:
                conn.close()
                self._set_headers(403)
                self.wfile.write(json.dumps({"error": "student is not assigned to this mentor"}).encode("utf-8"))
                return
            course = student_course or mentor_course
            if course not in COURSE_LESSON_COUNTS:
                conn.close()
                self._set_headers(400)
                self.wfile.write(json.dumps({"error": "invalid level"}).encode("utf-8"))
                return

            student_id = int(student["id"] or 0)
            cur.execute(
                """
                SELECT
                    lesson_number,
                    SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) AS correct_count,
                    SUM(CASE WHEN is_correct = 0 THEN 1 ELSE 0 END) AS wrong_count
                FROM quiz_answer_events
                WHERE user_id = ? AND course = ? AND question_id IS NOT NULL
                GROUP BY lesson_number
                """,
                (student_id, course),
            )
            quiz_rows = {int(row["lesson_number"]): dict(row) for row in cur.fetchall()}
            cur.execute(
                """
                SELECT lesson_number, watched_seconds, watched_minutes, duration_seconds, updated_at
                FROM video_progress
                WHERE user_id = ? AND course = ?
                """,
                (student_id, course),
            )
            video_rows = {int(row["lesson_number"]): dict(row) for row in cur.fetchall()}

            lesson_numbers = sorted(set(quiz_rows.keys()) | set(video_rows.keys()))
            lessons = []
            for number in lesson_numbers:
                quiz = quiz_rows.get(number) or {}
                video = video_rows.get(number) or {}
                lessons.append(
                    {
                        "lesson_number": number,
                        "correct_count": int(quiz.get("correct_count") or 0),
                        "wrong_count": int(quiz.get("wrong_count") or 0),
                        "video_watched_seconds": float(video.get("watched_seconds") or 0),
                        "video_watched_minutes": float(video.get("watched_minutes") or 0),
                        "video_duration_seconds": float(video.get("duration_seconds") or 0),
                        "video_updated_at": video.get("updated_at") or "",
                    }
                )

            conn.close()
            self._set_headers(200)
            self.wfile.write(json.dumps({"course": course, "student": dict(student), "lessons": lessons}).encode("utf-8"))
            return

        if parsed.path == "/api/daily-content":
            conn = get_connection()
            cur = conn.cursor()
            tz_offset_hours = 5
            now_local = utc_now() + timedelta(hours=tz_offset_hours)
            epoch = datetime(2026, 1, 1)
            day_index = (now_local.date() - epoch.date()).days
            result = {}
            for content_type in ("motivation", "tip"):
                cur.execute(
                    "SELECT id, text FROM daily_content WHERE type = ? AND active = 1 ORDER BY id ASC",
                    (content_type,),
                )
                rows = cur.fetchall()
                if rows:
                    item = rows[day_index % len(rows)]
                    result[content_type] = {"id": item["id"], "text": item["text"]}
                else:
                    result[content_type] = None
            conn.close()
            self._set_headers(200)
            self.wfile.write(json.dumps(result).encode("utf-8"))
            return

        if parsed.path == "/api/leaderboard/achievements":
            params = {key: values[0] for key, values in parse_qs(parsed.query).items()}
            try:
                limit = int(params.get("limit", 10))
            except (TypeError, ValueError):
                limit = 10
            limit = max(1, min(limit, 50))
            level_filter = str(params.get("level", "") or "").strip()

            conn = get_connection()
            cur = conn.cursor()
            if level_filter:
                cur.execute(
                    """
                    SELECT
                        u.username,
                        u.full_name,
                        u.level,
                        COALESCE(SUM(ua.points), 0) AS total_points,
                        COUNT(ua.id) AS achievements_count
                    FROM users u
                    LEFT JOIN user_achievements ua ON ua.user_id = u.id
                    WHERE u.role = 'student' AND LOWER(u.level) = LOWER(?)
                    GROUP BY u.id
                    ORDER BY total_points DESC, achievements_count DESC, u.created_at ASC
                    LIMIT ?
                    """,
                    (level_filter, limit),
                )
            else:
                cur.execute(
                    """
                    SELECT
                        u.username,
                        u.full_name,
                        u.level,
                        COALESCE(SUM(ua.points), 0) AS total_points,
                        COUNT(ua.id) AS achievements_count
                    FROM users u
                    LEFT JOIN user_achievements ua ON ua.user_id = u.id
                    WHERE u.role = 'student'
                    GROUP BY u.id
                    ORDER BY total_points DESC, achievements_count DESC, u.created_at ASC
                    LIMIT ?
                    """,
                    (limit,),
                )
            rows = cur.fetchall()
            conn.close()
            items = []
            rank = 1
            for row in rows:
                items.append(
                    {
                        "rank": rank,
                        "username": row["username"],
                        "full_name": row["full_name"] or "",
                        "level": row["level"] or "",
                        "total_points": int(row["total_points"] or 0),
                        "achievements_count": int(row["achievements_count"] or 0),
                    }
                )
                rank += 1
            self._set_headers(200)
            self.wfile.write(json.dumps({"items": items}).encode("utf-8"))
            return

        if parsed.path == "/api/bot/admin/perm-code":
            params = {key: values[0] for key, values in parse_qs(parsed.query).items()}
            chat_id_raw = params.get("chat_id", "").strip()
            req_username = params.get("username", "").strip()
            try:
                req_chat_id = int(chat_id_raw)
            except (ValueError, TypeError):
                req_chat_id = 0
            if not req_chat_id:
                self._set_headers(400)
                self.wfile.write(json.dumps({"error": "chat_id required"}).encode("utf-8"))
                return
            conn = get_connection()
            cur = conn.cursor()
            cur.execute(
                "SELECT username FROM users WHERE role = 'admin' AND telegram_chat_id = ? LIMIT 1",
                (req_chat_id,),
            )
            admin_row = cur.fetchone()
            if admin_row is None and req_chat_id not in (TG_ADMIN_IDS or []):
                conn.close()
                self._set_headers(403)
                self.wfile.write(json.dumps({"error": "forbidden"}).encode("utf-8"))
                return
            if admin_row:
                lookup_username = str(admin_row["username"])
            elif req_username:
                lookup_username = req_username
            else:
                lookup_username = ADMIN_USERNAME
            try:
                cur.execute(
                    "SELECT perm_code_plain FROM admin_edit_pins WHERE admin_username = ?",
                    (lookup_username,),
                )
                row = cur.fetchone()
                perm_code_plain = str(row["perm_code_plain"] or "").strip() if row else ""
            except Exception:
                perm_code_plain = ""
            conn.close()
            self._set_headers(200)
            self.wfile.write(json.dumps({"perm_code": perm_code_plain}).encode("utf-8"))
            return

        if parsed.path == "/api/bot/profile":
            params = {key: values[0] for key, values in parse_qs(parsed.query).items()}
            phone_raw = params.get("phone", "").strip()
            phone = normalize_phone(phone_raw)
            if not phone:
                self._set_headers(400)
                self.wfile.write(json.dumps({"error": "phone is required"}).encode("utf-8"))
                return

            conn = get_connection()
            cur = conn.cursor()
            cur.execute(
                "SELECT id, full_name, username, level, lesson_schedule, mentor_id, created_at, access_started_at FROM users WHERE phone = ?",
                (phone,),
            )
            user = cur.fetchone()
            if user is None:
                conn.close()
                self._set_headers(404)
                self.wfile.write(json.dumps({"error": "user not found"}).encode("utf-8"))
                return

            summary = build_progress_summary(cur, user)
            summary["full_name"] = user["full_name"] or ""
            summary["username"] = user["username"] or ""
            next_lesson_num = int(summary.get("next_required_lesson_number") or 0)
            summary["next_required_lesson_title"] = get_lesson_title(str(user["level"] or ""), next_lesson_num) if next_lesson_num > 0 else ""
            conn.commit()
            conn.close()
            self._set_headers(200)
            self.wfile.write(json.dumps(summary).encode("utf-8"))
            return

        if parsed.path == "/api/bot/parents":
            params = {key: values[0] for key, values in parse_qs(parsed.query).items()}
            phone_raw = params.get("phone", "").strip()
            phone = normalize_phone(phone_raw)
            if not phone:
                self._set_headers(400)
                self.wfile.write(json.dumps({"error": "phone is required"}).encode("utf-8"))
                return

            conn = get_connection()
            cur = conn.cursor()
            cur.execute("SELECT id FROM users WHERE phone = ?", (phone,))
            user = cur.fetchone()
            if user is None:
                conn.close()
                self._set_headers(404)
                self.wfile.write(json.dumps({"error": "user not found"}).encode("utf-8"))
                return

            cur.execute(
                "SELECT relation, first_name, last_name, phone FROM user_parents WHERE user_id = ? ORDER BY relation ASC",
                (int(user["id"]),),
            )
            items = [dict(r) for r in cur.fetchall()]
            conn.close()
            self._set_headers(200)
            self.wfile.write(json.dumps({"items": items}).encode("utf-8"))
            return

        if parsed.path == "/api/bot/parents/upsert":
            # POST-only endpoint
            self._set_headers(405)
            self.wfile.write(json.dumps({"error": "method_not_allowed"}).encode("utf-8"))
            return

        if parsed.path == "/api/bot/parent-link-chat":
            # Link a parent's Telegram chat_id by their phone number.
            # Called by the bot when a parent shares their phone number.
            params = {key: values[0] for key, values in parse_qs(parsed.query).items()}
            phone_raw = params.get("phone", "").strip()
            phone = normalize_phone(phone_raw)
            chat_id_raw = str(params.get("chat_id", "") or "").strip()
            token = str(params.get("token", "") or "").strip()

            if not phone or not chat_id_raw:
                self._set_headers(400)
                self.wfile.write(json.dumps({"error": "phone and chat_id are required"}).encode("utf-8"))
                return
            try:
                chat_id = int(chat_id_raw)
            except (TypeError, ValueError):
                chat_id = 0
            if chat_id <= 0:
                self._set_headers(400)
                self.wfile.write(json.dumps({"error": "invalid chat_id"}).encode("utf-8"))
                return
            if BOT_SYNC_TOKEN and token != BOT_SYNC_TOKEN:
                self._set_headers(403)
                self.wfile.write(json.dumps({"error": "invalid token"}).encode("utf-8"))
                return

            conn = get_connection()
            cur = conn.cursor()
            cur.execute(
                "SELECT id, user_id, relation FROM user_parents WHERE phone = ?",
                (phone,),
            )
            rows = cur.fetchall()
            if not rows:
                conn.close()
                self._set_headers(404)
                self.wfile.write(json.dumps({"error": "parent not found"}).encode("utf-8"))
                return
            cur.execute(
                "UPDATE user_parents SET telegram_chat_id = ? WHERE phone = ?",
                (chat_id, phone),
            )
            conn.commit()
            conn.close()
            self._set_headers(200)
            self.wfile.write(json.dumps({"status": "ok", "chat_id": chat_id, "linked": len(rows)}).encode("utf-8"))
            return

        if parsed.path == "/api/bot/link-chat":
            params = {key: values[0] for key, values in parse_qs(parsed.query).items()}
            phone_raw = params.get("phone", "").strip()
            phone = normalize_phone(phone_raw)
            chat_id_raw = str(params.get("chat_id", "") or "").strip()
            token = str(params.get("token", "") or "").strip()

            if not phone or not chat_id_raw:
                self._set_headers(400)
                self.wfile.write(json.dumps({"error": "phone and chat_id are required"}).encode("utf-8"))
                return

            try:
                chat_id = int(chat_id_raw)
            except (TypeError, ValueError):
                chat_id = 0
            if chat_id <= 0:
                self._set_headers(400)
                self.wfile.write(json.dumps({"error": "invalid chat_id"}).encode("utf-8"))
                return

            if BOT_SYNC_TOKEN and token != BOT_SYNC_TOKEN:
                self._set_headers(403)
                self.wfile.write(json.dumps({"error": "invalid token"}).encode("utf-8"))
                return

            conn = get_connection()
            cur = conn.cursor()
            cur.execute("SELECT id FROM users WHERE phone = ?", (phone,))
            user = cur.fetchone()
            if user is None:
                conn.close()
                self._set_headers(404)
                self.wfile.write(json.dumps({"error": "user not found"}).encode("utf-8"))
                return

            cur.execute("UPDATE users SET telegram_chat_id = ? WHERE phone = ?", (chat_id, phone))
            conn.commit()
            conn.close()
            self._set_headers(200)
            self.wfile.write(json.dumps({"status": "ok", "chat_id": chat_id}).encode("utf-8"))
            return

        if parsed.path == "/api/admin/progress":
            params = {key: values[0] for key, values in parse_qs(parsed.query).items()}
            student_username = params.get("student_username", "").strip()
            if not student_username:
                self._set_headers(400)
                self.wfile.write(json.dumps({"error": "student_username is required"}).encode("utf-8"))
                return

            conn = get_connection()
            if not self._require_admin(conn):
                conn.close()
                return

            cur = conn.cursor()
            cur.execute(
                "SELECT id, full_name, username, level FROM users WHERE username = ? AND role = 'student'",
                (student_username,),
            )
            student = cur.fetchone()
            if student is None:
                conn.close()
                self._set_headers(404)
                self.wfile.write(json.dumps({"error": "student user not found"}).encode("utf-8"))
                return

            level_label = str(student["level"] or "").strip()
            course, _ = normalize_level(level_label)
            if course not in COURSE_LESSON_COUNTS:
                conn.close()
                self._set_headers(400)
                self.wfile.write(json.dumps({"error": "student level is not assigned"}).encode("utf-8"))
                return

            cur.execute(
                """
                SELECT
                    lesson_number,
                    SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) AS correct_count,
                    SUM(CASE WHEN is_correct = 0 THEN 1 ELSE 0 END) AS wrong_count
                FROM quiz_answer_events
                WHERE user_id = ? AND course = ? AND question_id IS NOT NULL
                GROUP BY lesson_number
                ORDER BY lesson_number
                """,
                (student["id"], course),
            )
            progress_map = {int(row["lesson_number"]): dict(row) for row in cur.fetchall()}

            cur.execute(
                """
                SELECT lesson_number, watched_seconds, watched_minutes, duration_seconds, last_position_seconds, updated_at
                FROM video_progress
                WHERE user_id = ? AND course = ?
                """,
                (student["id"], course),
            )
            video_map = {int(row["lesson_number"]): dict(row) for row in cur.fetchall()}

            lesson_count = COURSE_LESSON_COUNTS[course]
            lessons = []
            for lesson_number in range(1, lesson_count + 1):
                event_row = progress_map.get(lesson_number, {})
                video_row = video_map.get(lesson_number, {})
                lessons.append(
                    {
                        "lesson_number": lesson_number,
                        "correct_count": int(event_row.get("correct_count", 0) or 0),
                        "wrong_count": int(event_row.get("wrong_count", 0) or 0),
                        "video_watched_seconds": float(video_row.get("watched_seconds", 0) or 0),
                        "video_watched_minutes": float(video_row.get("watched_minutes", 0) or 0),
                        "video_duration_seconds": float(video_row.get("duration_seconds", 0) or 0),
                        "video_last_position_seconds": float(video_row.get("last_position_seconds", 0) or 0),
                        "video_updated_at": str(video_row.get("updated_at", "") or ""),
                    }
                )

            conn.close()
            self._set_headers(200)
            self.wfile.write(
                json.dumps(
                    {
                        "student": {
                            "full_name": student["full_name"] or "",
                            "username": student["username"] or "",
                            "level": level_label,
                        },
                        "course": course,
                        "lessons": lessons,
                    }
                ).encode("utf-8")
            )
            return

        if parsed.path == "/api/admin/team":
            conn = get_connection()
            if not self._require_admin(conn):
                conn.close()
                return
            conn.close()
            items = load_team_overrides()
            payload_items = []
            indexed_items = list(enumerate(items if isinstance(items, list) else []))
            indexed_items.sort(
                key=lambda pair: _to_int_or(pair[1].get("order") if isinstance(pair[1], dict) else None, pair[0])
            )
            for idx, (_orig_idx, raw) in enumerate(indexed_items):
                if not isinstance(raw, dict):
                    continue
                member_id = str(raw.get("id", "") or "").strip()
                header = str(raw.get("header", "") or "").strip()
                if not member_id or not header:
                    continue
                avatar_url = str(raw.get("avatar_url", "") or "").strip()
                avatar_file = str(raw.get("avatar_file", "") or "").strip()
                if avatar_file:
                    avatar_url = f"/api/team/avatar?id={quote(member_id)}"
                order_value = _to_int_or(raw.get("order"), idx)
                payload_items.append(
                    {
                        "id": member_id,
                        "order": order_value,
                        "header": header,
                        "subheader": str(raw.get("subheader", "") or ""),
                        "achievements": raw.get("achievements", []) if isinstance(raw.get("achievements", []), list) else [],
                        "telegram_username": str(raw.get("telegram_username", "") or ""),
                        "instagram_username": str(raw.get("instagram_username", "") or ""),
                        "whatsapp_phone": str(raw.get("whatsapp_phone", "") or ""),
                        "avatar_url": avatar_url,
                        "avatar_file": avatar_file,
                        "avatar_original_name": str(raw.get("avatar_original_name", "") or ""),
                    }
                )
            self._set_headers(200)
            self.wfile.write(json.dumps({"items": payload_items}).encode("utf-8"))
            return

        if parsed.path == "/api/admin/mentors":
            conn = get_connection()
            if not self._require_admin(conn):
                conn.close()
                return
            cur = conn.cursor()

            cur.execute(
                """
                    SELECT
                        m.id,
                        m.name,
                        m.level,
                        m.phone,
                        m.email,
                        m.telegram_username,
                        m.instagram_username,
                        m.info,
                        m.avatar_path,
                        m.avatar_name,
                        m.created_at,
                        COUNT(u.id) AS student_count
                    FROM mentors m
                    LEFT JOIN users u
                      ON u.role = 'student'
                     AND u.mentor_id = m.id
                    GROUP BY m.id
                    ORDER BY m.id DESC
                    """
                )
            mentors = []
            for row in cur.fetchall():
                avatar_url = f"/api/mentors/avatar?id={row['id']}" if row["avatar_path"] else ""
                mentors.append(
                    {
                        "id": row["id"],
                        "name": row["name"],
                        "level": row["level"],
                        "phone": row["phone"] or "",
                        "email": row["email"] or "",
                        "telegram_username": row["telegram_username"] or "",
                        "instagram_username": row["instagram_username"] or "",
                        "info": row["info"] or "",
                        "avatar_url": avatar_url,
                        "created_at": row["created_at"] or "",
                        "student_count": int(row["student_count"] or 0),
                    }
                )
            conn.close()

            self._set_headers(200)
            self.wfile.write(json.dumps({"items": mentors}).encode("utf-8"))
            return

        if parsed.path == "/api/mentors/avatar":
            params = {key: values[0] for key, values in parse_qs(parsed.query).items()}
            mentor_id = params.get("id", "").strip()
            if not mentor_id:
                self._set_headers(400)
                self.wfile.write(json.dumps({"error": "id is required"}).encode("utf-8"))
                return

            conn = get_connection()
            cur = conn.cursor()
            cur.execute("SELECT avatar_path, avatar_name FROM mentors WHERE id = ?", (mentor_id,))
            row = cur.fetchone()
            conn.close()
            if row is None or not row["avatar_path"]:
                self._set_headers(404)
                self.wfile.write(json.dumps({"error": "avatar not found"}).encode("utf-8"))
                return

            file_path = Path(row["avatar_path"])
            if not file_path.exists():
                self._set_headers(404)
                self.wfile.write(json.dumps({"error": "avatar missing on disk"}).encode("utf-8"))
                return

            data = file_path.read_bytes()
            content_type, _ = mimetypes.guess_type(file_path.name)
            self.send_response(200)
            self.send_header("Content-Type", content_type or "application/octet-stream")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(data)
            return

        if parsed.path == "/api/admin/payment-checks":
            conn = get_connection()
            if not self._require_admin(conn):
                conn.close()
                return
            cur = conn.cursor()

            cur.execute(
                """
                SELECT id, username, payment_date, original_name, uploaded_at
                FROM payment_checks
                ORDER BY uploaded_at DESC
                LIMIT 300
                """
            )
            checks = [dict(row) for row in cur.fetchall()]
            conn.close()

            self._set_headers(200)
            self.wfile.write(json.dumps({"items": checks}).encode("utf-8"))
            return

        if parsed.path == "/api/admin/payment-checks/file":
            params = {key: values[0] for key, values in parse_qs(parsed.query).items()}
            check_id = params.get("id", "").strip()
            if not check_id:
                self._set_headers(400)
                self.wfile.write(json.dumps({"error": "id is required"}).encode("utf-8"))
                return

            conn = get_connection()
            if not self._require_admin(conn):
                conn.close()
                return
            cur = conn.cursor()

            cur.execute(
                "SELECT file_path, original_name FROM payment_checks WHERE id = ?",
                (check_id,),
            )
            row = cur.fetchone()
            conn.close()
            if row is None:
                self._set_headers(404)
                self.wfile.write(json.dumps({"error": "file not found"}).encode("utf-8"))
                return

            file_path = Path(row["file_path"])
            if not file_path.exists():
                self._set_headers(404)
                self.wfile.write(json.dumps({"error": "file missing on disk"}).encode("utf-8"))
                return

            data = file_path.read_bytes()
            self.send_response(200)
            self.send_header("Content-Type", "application/octet-stream")
            self.send_header("Content-Disposition", f"attachment; filename={row['original_name']}")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(data)
            return

        if parsed.path == "/api/admin/enrollment-requests":
            conn = get_connection()
            if not self._require_admin(conn):
                conn.close()
                return
            cur = conn.cursor()

            cur.execute(
                """
                SELECT id, full_name, phone, telegram_username, level, price_label, submitted_username, seen_by_admin, created_at
                FROM enrollment_requests
                ORDER BY created_at DESC
                LIMIT 300
                """
            )
            rows = [dict(row) for row in cur.fetchall()]
            conn.close()
            pending_count = sum(1 for row in rows if int(row.get("seen_by_admin", 0) or 0) == 0)

            self._set_headers(200)
            self.wfile.write(json.dumps({"items": rows, "pending_count": pending_count}).encode("utf-8"))
            return

        if parsed.path == "/api/admin/renewal-requests":
            conn = get_connection()
            if not self._require_admin(conn):
                conn.close()
                return
            cur = conn.cursor()

            cur.execute(
                """
                SELECT id, full_name, phone, telegram_username, level, price_label, submitted_username
                FROM renewal_requests
                ORDER BY id DESC
                LIMIT 300
                """
            )
            rows = [dict(row) for row in cur.fetchall()]
            conn.close()

            self._set_headers(200)
            self.wfile.write(json.dumps({"items": rows}).encode("utf-8"))
            return

        if parsed.path == "/api/admin/contact-messages":
            conn = get_connection()
            if not self._require_admin(conn):
                conn.close()
                return
            cur = conn.cursor()

            cur.execute(
                """
                SELECT id, full_name, email, message, client_ip, user_agent, seen_by_admin, created_at
                FROM contact_messages
                ORDER BY created_at DESC
                LIMIT 200
                """
            )
            rows = [dict(row) for row in cur.fetchall()]
            pending_count = sum(1 for row in rows if int(row.get("seen_by_admin", 0) or 0) == 0)
            conn.close()

            self._set_headers(200)
            self.wfile.write(json.dumps({"items": rows, "pending_count": pending_count}).encode("utf-8"))
            return

        if parsed.path == "/api/admin/user-details":
            params = {key: values[0] for key, values in parse_qs(parsed.query).items()}
            target_username = params.get("target_username", "").strip()
            if not target_username:
                self._set_headers(400)
                self.wfile.write(json.dumps({"error": "target_username is required"}).encode("utf-8"))
                return

            conn = get_connection()
            if not self._require_admin(conn):
                conn.close()
                return
            cur = conn.cursor()

            cur.execute(
                """
                SELECT
                    id,
                    full_name,
                    username,
                    phone,
                    level,
                    lesson_schedule,
                    mentor_id,
                    role,
                    created_at,
                    access_started_at,
                    telegram_chat_id
                FROM users
                WHERE username = ?
                """,
                (target_username,),
            )
            row = cur.fetchone()
            if row is None:
                conn.close()
                self._set_headers(404)
                self.wfile.write(json.dumps({"error": "user not found"}).encode("utf-8"))
                return

            details = dict(row)
            # Never expose real passwords. UI expects a placeholder.
            details["password"] = "*****"
            mentor = None
            if str(details.get("role") or "").strip().lower() == "student":
                mentor_id = int(details.get("mentor_id") or 0)
                mentor = fetch_mentor_by_id(cur, mentor_id) if mentor_id > 0 else None
                if mentor is None:
                    mentor = fetch_mentor_for_level(cur, str(details.get("level") or "").strip())
            chat_id = int(details.get("telegram_chat_id") or 0)

            cur.execute(
                """
                SELECT relation, first_name, last_name, phone
                FROM user_parents
                WHERE user_id = ?
                ORDER BY relation ASC
                """,
                (int(details.get("id") or 0),),
            )
            parents = [dict(r) for r in cur.fetchall()]
            conn.close()

            self._set_headers(200)
            self.wfile.write(
                json.dumps(
                    {
                        "user": details,
                        "mentor": mentor,
                        "parents": parents,
                        "bot_user": {"chat_id": chat_id if chat_id > 0 else ""},
                    }
                ).encode("utf-8")
            )
            return

        self._set_headers(404)
        self.wfile.write(json.dumps({"error": "not found"}).encode("utf-8"))

    def do_POST(self):
        if self.path == "/api/contact":
            data = self._read_json()
            name = str(data.get("name", "")).strip()
            email = str(data.get("email", "")).strip()
            message = str(data.get("message", "")).strip()

            if not name or not email or not message:
                self._set_headers(400)
                self.wfile.write(json.dumps({"error": "name, email, and message are required"}).encode("utf-8"))
                return

            if "@" not in email or "." not in email:
                self._set_headers(400)
                self.wfile.write(json.dumps({"error": "invalid email"}).encode("utf-8"))
                return

            forwarded_for = self.headers.get("X-Forwarded-For", "")
            client_ip = ""
            if forwarded_for:
                client_ip = forwarded_for.split(",")[0].strip()
            if not client_ip:
                client_ip = self.client_address[0] if self.client_address else ""
            user_agent = self.headers.get("User-Agent", "")

            if not TG_BOT_TOKEN or not TG_ADMIN_IDS:
                self._set_headers(503)
                self.wfile.write(json.dumps({"error": "telegram bot is not configured"}).encode("utf-8"))
                return

            payload = build_contact_message(name, email, message, client_ip, user_agent)
            if not send_telegram_message(payload):
                self._set_headers(503)
                self.wfile.write(json.dumps({"error": "message delivery failed"}).encode("utf-8"))
                return

            conn = get_connection()
            cur = conn.cursor()
            cur.execute(
                """
                INSERT INTO contact_messages (full_name, email, message, client_ip, user_agent, seen_by_admin, created_at)
                VALUES (?, ?, ?, ?, ?, 0, ?)
                """,
                (
                    name,
                    email,
                    message,
                    client_ip,
                    user_agent,
                    datetime.now(timezone.utc).isoformat(),
                ),
            )
            conn.commit()
            conn.close()

            self._set_headers(200)
            self.wfile.write(json.dumps({"status": "sent"}).encode("utf-8"))
            return

        if self.path == "/api/admin/lessons/cover/upload":
            data = self._read_json()
            admin_username = str(data.get("admin_username", "")).strip()
            file_name = str(data.get("file_name", "")).strip()
            file_data = str(data.get("file_data", "")).strip()
            if not admin_username or not file_data:
                self._set_headers(400)
                self.wfile.write(json.dumps({"error": "admin_username and file_data are required"}).encode("utf-8"))
                return
            try:
                blob = base64.b64decode(file_data, validate=False)
            except (ValueError, TypeError):
                self._set_headers(400)
                self.wfile.write(json.dumps({"error": "invalid_file_data"}).encode("utf-8"))
                return
            if len(blob) <= 0 or len(blob) > MAX_COVER_BYTES:
                self._set_headers(400)
                self.wfile.write(json.dumps({"error": "file_too_large"}).encode("utf-8"))
                return
            ext = Path(file_name).suffix.lower() if file_name else ""
            if ext not in ALLOWED_COVER_EXTENSIONS:
                ext = ".png"
            safe_stem = re.sub(r"[^A-Za-z0-9_-]", "_", Path(file_name).stem)[:40] or "cover"
            stamp = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")
            token = secrets.token_hex(6)
            out_name = f"{safe_stem}_{stamp}_{token}{ext}"
            out_path = COVER_UPLOAD_DIR / out_name

            conn = get_connection()
            if not self._require_admin(conn):
                conn.close()
                return
            conn.close()

            try:
                out_path.write_bytes(blob)
            except OSError:
                self._set_headers(500)
                self.wfile.write(json.dumps({"error": "upload_failed"}).encode("utf-8"))
                return

            self._set_headers(200)
            self.wfile.write(json.dumps({"ok": True, "url": f"/backend/uploads/covers/{out_name}"}).encode("utf-8"))
            return

        if self.path == "/api/admin/certificates/image/upload":
            data = self._read_json()
            admin_username = str(data.get("admin_username", "")).strip()
            file_name = str(data.get("file_name", "")).strip()
            file_data = str(data.get("file_data", "")).strip()
            if not admin_username or not file_data:
                self._set_headers(400)
                self.wfile.write(json.dumps({"error": "admin_username and file_data are required"}).encode("utf-8"))
                return
            try:
                blob = base64.b64decode(file_data, validate=False)
            except (ValueError, TypeError):
                self._set_headers(400)
                self.wfile.write(json.dumps({"error": "invalid_file_data"}).encode("utf-8"))
                return
            if len(blob) <= 0 or len(blob) > MAX_COVER_BYTES:
                self._set_headers(400)
                self.wfile.write(json.dumps({"error": "file_too_large"}).encode("utf-8"))
                return
            ext = Path(file_name).suffix.lower() if file_name else ""
            if ext not in ALLOWED_COVER_EXTENSIONS:
                ext = ".png"
            safe_stem = re.sub(r"[^A-Za-z0-9_-]", "_", Path(file_name).stem)[:40] or "certificate"
            stamp = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")
            token = secrets.token_hex(6)
            out_name = f"{safe_stem}_{stamp}_{token}{ext}"
            out_path = CERTIFICATE_UPLOAD_DIR / out_name

            conn = get_connection()
            if not self._require_admin(conn):
                conn.close()
                return
            conn.close()

            try:
                out_path.write_bytes(blob)
            except OSError:
                self._set_headers(500)
                self.wfile.write(json.dumps({"error": "upload_failed"}).encode("utf-8"))
                return

            self._set_headers(200)
            self.wfile.write(json.dumps({"ok": True, "url": f"/backend/uploads/certificates/{out_name}"}).encode("utf-8"))
            return

        if self.path == "/api/admin/certificates/set-all":
            data = self._read_json()
            admin_username = str(data.get("admin_username", "")).strip()
            raw_items = data.get("items", None)
            if not admin_username or not isinstance(raw_items, list):
                self._set_headers(400)
                self.wfile.write(json.dumps({"error": "admin_username and items are required"}).encode("utf-8"))
                return

            conn = get_connection()
            if not self._require_admin(conn):
                conn.close()
                return
            conn.close()

            def normalize_section(value: str) -> str:
                raw = str(value or "").strip().lower()
                return raw if raw in {"ielts", "cefr"} else "cefr"

            next_items: list[dict] = []
            for item in raw_items[:500]:
                if not isinstance(item, dict):
                    continue
                cid = str(item.get("id", "")).strip()
                if not cid:
                    cid = f"cert_{secrets.token_hex(10)}"
                next_items.append(
                    {
                        "id": cid,
                        "section": normalize_section(str(item.get("section", ""))),
                        "name": str(item.get("name", "") or "").strip(),
                        "motto": str(item.get("motto", "") or "").strip(),
                        "image": str(item.get("image", "") or "").strip(),
                    }
                )

            if not save_certificate_overrides(next_items):
                self._set_headers(500)
                self.wfile.write(json.dumps({"error": "save_failed"}).encode("utf-8"))
                return
            self._set_headers(200)
            self.wfile.write(json.dumps({"ok": True, "count": len(next_items)}).encode("utf-8"))
            return

        if self.path == "/api/admin/team/avatar/upload":
            data = self._read_json()
            admin_username = str(data.get("admin_username", "")).strip()
            file_name = str(data.get("file_name", "")).strip()
            file_data = str(data.get("file_data", "")).strip()
            if not admin_username or not file_data:
                self._set_headers(400)
                self.wfile.write(json.dumps({"error": "admin_username and file_data are required"}).encode("utf-8"))
                return
            try:
                header, b64_data = file_data.split(",", 1)
            except ValueError:
                b64_data = file_data
            try:
                blob = base64.b64decode(b64_data, validate=False)
            except (ValueError, TypeError):
                self._set_headers(400)
                self.wfile.write(json.dumps({"error": "invalid_file_data"}).encode("utf-8"))
                return
            if len(blob) <= 0 or len(blob) > MAX_COVER_BYTES:
                self._set_headers(400)
                self.wfile.write(json.dumps({"error": "file_too_large"}).encode("utf-8"))
                return
            ext = Path(file_name).suffix.lower() if file_name else ""
            if ext not in ALLOWED_COVER_EXTENSIONS:
                ext = ".png"
            safe_stem = re.sub(r"[^A-Za-z0-9_-]", "_", Path(file_name).stem)[:40] or "team"
            stamp = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")
            token = secrets.token_hex(6)
            out_name = f"{safe_stem}_{stamp}_{token}{ext}"
            out_path = TEAM_AVATAR_UPLOAD_DIR / out_name

            conn = get_connection()
            if not self._require_admin(conn):
                conn.close()
                return
            conn.close()

            try:
                out_path.write_bytes(blob)
            except OSError:
                self._set_headers(500)
                self.wfile.write(json.dumps({"error": "upload_failed"}).encode("utf-8"))
                return

            self._set_headers(200)
            self.wfile.write(json.dumps({"ok": True, "file": out_name, "original_name": file_name}).encode("utf-8"))
            return

        if self.path == "/api/admin/team/set-all":
            data = self._read_json()
            admin_username = str(data.get("admin_username", "")).strip()
            raw_items = data.get("items", None)
            if not admin_username or not isinstance(raw_items, list):
                self._set_headers(400)
                self.wfile.write(json.dumps({"error": "admin_username and items are required"}).encode("utf-8"))
                return

            conn = get_connection()
            if not self._require_admin(conn):
                conn.close()
                return
            conn.close()

            next_items: list[dict] = []
            seen_ids: set[str] = set()
            for idx, item in enumerate(raw_items[:200]):
                safe = sanitize_team_member(item, idx)
                if safe is None:
                    continue
                if safe["id"] in seen_ids:
                    continue
                seen_ids.add(safe["id"])
                next_items.append(safe)

            if not save_team_overrides(next_items):
                self._set_headers(500)
                self.wfile.write(json.dumps({"error": "save_failed"}).encode("utf-8"))
                return
            self._set_headers(200)
            self.wfile.write(json.dumps({"ok": True, "count": len(next_items)}).encode("utf-8"))
            return

        if self.path == "/api/admin/partners/logo/upload":
            data = self._read_json()
            file_name = str(data.get("file_name", "")).strip()
            file_data = str(data.get("file_data", "")).strip()
            if not file_data:
                self._set_headers(400)
                self.wfile.write(json.dumps({"error": "file_data is required"}).encode("utf-8"))
                return
            try:
                _, b64_data = file_data.split(",", 1)
            except ValueError:
                b64_data = file_data
            try:
                blob = base64.b64decode(b64_data, validate=False)
            except (ValueError, TypeError):
                self._set_headers(400)
                self.wfile.write(json.dumps({"error": "invalid_file_data"}).encode("utf-8"))
                return
            if len(blob) <= 0 or len(blob) > MAX_COVER_BYTES:
                self._set_headers(400)
                self.wfile.write(json.dumps({"error": "file_too_large"}).encode("utf-8"))
                return
            ext = Path(file_name).suffix.lower() if file_name else ".png"
            if ext not in ALLOWED_COVER_EXTENSIONS:
                ext = ".png"
            safe_stem = re.sub(r"[^A-Za-z0-9_-]", "_", Path(file_name).stem)[:40] or "partner"
            stamp = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")
            token = secrets.token_hex(6)
            out_name = f"{safe_stem}_{stamp}_{token}{ext}"
            out_path = PARTNER_LOGO_UPLOAD_DIR / out_name
            conn = get_connection()
            if not self._require_admin(conn):
                conn.close()
                return
            conn.close()
            try:
                out_path.write_bytes(blob)
            except OSError:
                self._set_headers(500)
                self.wfile.write(json.dumps({"error": "upload_failed"}).encode("utf-8"))
                return
            self._set_headers(200)
            self.wfile.write(json.dumps({"ok": True, "file": out_name}).encode("utf-8"))
            return

        if self.path == "/api/admin/partners/set-all":
            data = self._read_json()
            raw_items = data.get("items", None)
            if not isinstance(raw_items, list):
                self._set_headers(400)
                self.wfile.write(json.dumps({"error": "items are required"}).encode("utf-8"))
                return
            conn = get_connection()
            if not self._require_admin(conn):
                conn.close()
                return
            conn.close()
            next_items: list[dict] = []
            seen_ids: set[str] = set()
            existing = {str(p.get("id", "") or "").strip(): p for p in load_partners() if isinstance(p, dict)}
            for idx, item in enumerate(raw_items[:200]):
                if not isinstance(item, dict):
                    continue
                pid = str(item.get("id", "") or "").strip()
                name = str(item.get("name", "") or "").strip()
                if not pid or not name:
                    continue
                if pid in seen_ids:
                    continue
                seen_ids.add(pid)
                prev = existing.get(pid, {})
                logo_file = str(item.get("logo_file", "") or prev.get("logo_file", "") or "").strip()
                next_items.append({"id": pid, "name": name, "logo_file": logo_file, "order": idx})
            if not save_partners(next_items):
                self._set_headers(500)
                self.wfile.write(json.dumps({"error": "save_failed"}).encode("utf-8"))
                return
            self._set_headers(200)
            self.wfile.write(json.dumps({"ok": True, "count": len(next_items)}).encode("utf-8"))
            return

        if self.path == "/api/admin/subscriptions/set-all":
            data = self._read_json()
            admin_username = str(data.get("admin_username", "")).strip()
            raw_items = data.get("items", None)
            if not admin_username or not isinstance(raw_items, list):
                self._set_headers(400)
                self.wfile.write(json.dumps({"error": "admin_username and items are required"}).encode("utf-8"))
                return

            conn = get_connection()
            if not self._require_admin(conn):
                conn.close()
                return
            conn.close()

            def parse_money(value) -> int:
                if value is None:
                    return 0
                if isinstance(value, bool):
                    return 0
                if isinstance(value, (int, float)):
                    return int(value)
                digits = re.sub(r"[^\d]", "", str(value or ""))
                if not digits:
                    return 0
                try:
                    return int(digits)
                except ValueError:
                    return 0

            def clamp_percent(value) -> int:
                try:
                    num = float(value)
                except (TypeError, ValueError):
                    return 0
                if not num or num <= 0:
                    return 0
                if num >= 100:
                    return 100
                return int(round(num))

            next_items: list[dict] = []
            for item in raw_items[:200]:
                if not isinstance(item, dict):
                    continue
                sid = str(item.get("id", "")).strip()
                if not sid:
                    sid = f"sub_{secrets.token_hex(10)}"
                name = str(item.get("name", "") or "").strip()
                badge = str(item.get("badge", "") or "").strip()
                features_raw = item.get("features", [])
                features: list[str] = []
                if isinstance(features_raw, list):
                    for feat in features_raw[:50]:
                        text = str(feat or "").strip()
                        if text:
                            features.append(text)
                price = parse_money(item.get("price", 0))
                old_price = parse_money(item.get("old_price", 0))
                discount_percent = clamp_percent(item.get("discount_percent", 0))
                ends_at_raw = str(item.get("discount_ends_at", "") or "").strip()
                ends_at = ""
                if ends_at_raw:
                    parsed_dt = parse_iso_datetime(ends_at_raw)
                    ends_at = parsed_dt.isoformat() if parsed_dt else ""

                next_items.append(
                    {
                        "id": sid,
                        "name": name,
                        "badge": badge,
                        "features": features,
                        "price": price,
                        "old_price": old_price,
                        "discount_percent": discount_percent,
                        "discount_ends_at": ends_at,
                    }
                )

            if not save_subscription_overrides(next_items):
                self._set_headers(500)
                self.wfile.write(json.dumps({"error": "save_failed"}).encode("utf-8"))
                return
            self._set_headers(200)
            self.wfile.write(json.dumps({"ok": True, "count": len(next_items)}).encode("utf-8"))
            return

        if self.path == "/api/admin/presentation/upload":
            data = self._read_json()
            admin_username = str(data.get("admin_username", "")).strip()
            course_raw = str(data.get("course", "")).strip()
            course, _ = normalize_level(course_raw)
            try:
                lesson_number = int(data.get("lesson_number", 0) or 0)
            except (TypeError, ValueError):
                lesson_number = 0
            file_name = str(data.get("file_name", "")).strip()
            file_data = str(data.get("file_data", "")).strip()
            if not admin_username or not course or lesson_number <= 0 or not file_data:
                self._set_headers(400)
                self.wfile.write(
                    json.dumps({"error": "admin_username, course, lesson_number, file_data are required"}).encode("utf-8")
                )
                return

            try:
                blob = base64.b64decode(file_data, validate=False)
            except (ValueError, TypeError):
                self._set_headers(400)
                self.wfile.write(json.dumps({"error": "invalid_file_data"}).encode("utf-8"))
                return
            if len(blob) <= 0 or len(blob) > MAX_PRESENTATION_BYTES:
                self._set_headers(400)
                self.wfile.write(json.dumps({"error": "file_too_large"}).encode("utf-8"))
                return
            if not blob.startswith(b"%PDF"):
                self._set_headers(400)
                self.wfile.write(json.dumps({"error": "not_a_pdf"}).encode("utf-8"))
                return

            conn = get_connection()
            if not self._require_admin(conn):
                conn.close()
                return
            conn.close()

            try:
                dest_dir = PRESENTATIONS_DIR / course / ""
                dest_dir.mkdir(parents=True, exist_ok=True)
            except OSError:
                self._set_headers(500)
                self.wfile.write(json.dumps({"error": "upload_failed"}).encode("utf-8"))
                return

            dest_path = (PRESENTATIONS_DIR / course / f"lesson-{lesson_number}.pdf").resolve()
            try:
                root = PRESENTATIONS_DIR.resolve()
                dest_path.relative_to(root)
            except ValueError:
                self._set_headers(400)
                self.wfile.write(json.dumps({"error": "invalid_path"}).encode("utf-8"))
                return

            try:
                dest_path.write_bytes(blob)
            except OSError:
                self._set_headers(500)
                self.wfile.write(json.dumps({"error": "upload_failed"}).encode("utf-8"))
                return

            self._set_headers(200)
            self.wfile.write(
                json.dumps(
                    {
                        "ok": True,
                        "url": f"/assets/presentations/{course}/lesson-{lesson_number}.pdf",
                        "file_name": file_name or dest_path.name,
                    }
                ).encode("utf-8")
            )
            return

        if self.path == "/api/admin/lessons/save":
            data = self._read_json()
            admin_username = str(data.get("admin_username", "")).strip()
            course_raw = str(data.get("course", "")).strip()
            course, _ = normalize_level(course_raw)
            try:
                lesson_number = int(data.get("lesson_number", 0) or 0)
            except (TypeError, ValueError):
                lesson_number = 0
            title = str(data.get("title", "")).strip()
            cover = str(data.get("cover", "")).strip()
            video = str(data.get("video", "")).strip()
            if not admin_username or not course or lesson_number <= 0:
                self._set_headers(400)
                self.wfile.write(json.dumps({"error": "admin_username, course, lesson_number are required"}).encode("utf-8"))
                return
            conn = get_connection()
            if not self._require_admin(conn):
                conn.close()
                return
            conn.close()

            items = load_lesson_overrides(course)
            by_num: dict[int, dict] = {}
            for item in items:
                try:
                    num = int(item.get("lesson_number", 0) or 0)
                except (TypeError, ValueError):
                    continue
                if num > 0:
                    by_num[num] = item
            current = by_num.get(lesson_number, {"lesson_number": lesson_number})
            current["lesson_number"] = lesson_number
            if title:
                current["title"] = title
            if cover or "cover" in data:
                current["cover"] = cover
            if video or "video" in data:
                current["video"] = video
            by_num[lesson_number] = current
            next_items = [by_num[n] for n in sorted(by_num.keys())]
            if not save_lesson_overrides(course, next_items):
                self._set_headers(500)
                self.wfile.write(json.dumps({"error": "save_failed"}).encode("utf-8"))
                return
            self._set_headers(200)
            self.wfile.write(json.dumps({"ok": True}).encode("utf-8"))
            return

        if self.path == "/api/admin/lessons/create":
            data = self._read_json()
            admin_username = str(data.get("admin_username", "")).strip()
            course_raw = str(data.get("course", "")).strip()
            course, _ = normalize_level(course_raw)
            title = str(data.get("title", "")).strip()
            cover = str(data.get("cover", "")).strip()
            video = str(data.get("video", "")).strip()
            if not admin_username or not course:
                self._set_headers(400)
                self.wfile.write(json.dumps({"error": "admin_username and course are required"}).encode("utf-8"))
                return
            conn = get_connection()
            if not self._require_admin(conn):
                conn.close()
                return
            conn.close()

            items = load_lesson_overrides(course)
            max_existing = 0
            for item in items:
                try:
                    num = int(item.get("lesson_number", 0) or 0)
                except (TypeError, ValueError):
                    continue
                max_existing = max(max_existing, num)
            max_baseline = int(COURSE_LESSON_COUNTS.get(course, 0) or 0)
            next_lesson = max(max_existing, max_baseline) + 1
            items.append(
                {
                    "lesson_number": next_lesson,
                    "title": title or f"Theme: Lesson {next_lesson}",
                    "cover": cover,
                    "video": video,
                }
            )
            if not save_lesson_overrides(course, items):
                self._set_headers(500)
                self.wfile.write(json.dumps({"error": "save_failed"}).encode("utf-8"))
                return
            self._set_headers(200)
            self.wfile.write(json.dumps({"ok": True, "lesson_number": next_lesson}).encode("utf-8"))
            return

        if self.path == "/api/admin/lessons/reorder":
            data = self._read_json()
            admin_username = str(data.get("admin_username", "")).strip()
            course_raw = str(data.get("course", "")).strip()
            course, _ = normalize_level(course_raw)
            order = data.get("order")
            if not admin_username or not course or not isinstance(order, list):
                self._set_headers(400)
                self.wfile.write(json.dumps({"error": "admin_username, course, order are required"}).encode("utf-8"))
                return
            conn = get_connection()
            if not self._require_admin(conn):
                conn.close()
                return
            conn.close()

            items = load_lesson_overrides(course)
            by_num: dict[int, dict] = {}
            for item in items:
                try:
                    num = int(item.get("lesson_number", 0) or 0)
                except (TypeError, ValueError):
                    continue
                if num > 0:
                    by_num[num] = item
            position = 1
            for raw in order:
                try:
                    n = int(raw or 0)
                except (TypeError, ValueError):
                    continue
                if n <= 0:
                    continue
                current = by_num.get(n, {"lesson_number": n})
                current["lesson_number"] = n
                current["position"] = position
                by_num[n] = current
                position += 1
            next_items = [by_num[n] for n in sorted(by_num.keys())]
            if not save_lesson_overrides(course, next_items):
                self._set_headers(500)
                self.wfile.write(json.dumps({"error": "save_failed"}).encode("utf-8"))
                return
            self._set_headers(200)
            self.wfile.write(json.dumps({"ok": True}).encode("utf-8"))
            return

        if self.path == "/api/admin/lessons/hide":
            data = self._read_json()
            admin_username = str(data.get("admin_username", "")).strip()
            course_raw = str(data.get("course", "")).strip()
            course, _ = normalize_level(course_raw)
            try:
                lesson_number = int(data.get("lesson_number", 0) or 0)
            except (TypeError, ValueError):
                lesson_number = 0
            try:
                is_hidden = int(data.get("is_hidden", 0) or 0)
            except (TypeError, ValueError):
                is_hidden = 0
            if not admin_username or not course or lesson_number <= 0:
                self._set_headers(400)
                self.wfile.write(json.dumps({"error": "admin_username, course, lesson_number are required"}).encode("utf-8"))
                return
            conn = get_connection()
            if not self._require_admin(conn):
                conn.close()
                return
            conn.close()

            items = load_lesson_overrides(course)
            by_num: dict[int, dict] = {}
            for item in items:
                try:
                    num = int(item.get("lesson_number", 0) or 0)
                except (TypeError, ValueError):
                    continue
                if num > 0:
                    by_num[num] = item
            current = by_num.get(lesson_number, {"lesson_number": lesson_number})
            current["lesson_number"] = lesson_number
            current["is_hidden"] = 1 if is_hidden else 0
            by_num[lesson_number] = current
            next_items = [by_num[n] for n in sorted(by_num.keys())]
            if not save_lesson_overrides(course, next_items):
                self._set_headers(500)
                self.wfile.write(json.dumps({"error": "save_failed"}).encode("utf-8"))
                return
            self._set_headers(200)
            self.wfile.write(json.dumps({"ok": True}).encode("utf-8"))
            return

        if self.path == "/api/admin/lessons/homework/save":
            data = self._read_json()
            admin_username = str(data.get("admin_username", "")).strip()
            course_raw = str(data.get("course", "")).strip()
            course, _ = normalize_level(course_raw)
            try:
                lesson_number = int(data.get("lesson_number", 0) or 0)
            except (TypeError, ValueError):
                lesson_number = 0
            homework = data.get("homework")
            if not admin_username or not course or lesson_number <= 0 or not isinstance(homework, list):
                self._set_headers(400)
                self.wfile.write(json.dumps({"error": "admin_username, course, lesson_number, homework are required"}).encode("utf-8"))
                return
            conn = get_connection()
            if not self._require_admin(conn):
                conn.close()
                return
            conn.close()

            normalized = []
            for item in homework:
                if isinstance(item, str):
                    normalized.append({"title": "", "detail": item})
                elif isinstance(item, dict):
                    normalized.append(
                        {
                            "title": str(item.get("title", "") or "").strip(),
                            "detail": str(item.get("detail", "") or "").strip(),
                        }
                    )

            items = load_lesson_overrides(course)
            by_num: dict[int, dict] = {}
            for item in items:
                try:
                    num = int(item.get("lesson_number", 0) or 0)
                except (TypeError, ValueError):
                    continue
                if num > 0:
                    by_num[num] = item
            current = by_num.get(lesson_number, {"lesson_number": lesson_number})
            current["lesson_number"] = lesson_number
            current["homework"] = normalized
            by_num[lesson_number] = current
            next_items = [by_num[n] for n in sorted(by_num.keys())]
            if not save_lesson_overrides(course, next_items):
                self._set_headers(500)
                self.wfile.write(json.dumps({"error": "save_failed"}).encode("utf-8"))
                return
            self._set_headers(200)
            self.wfile.write(json.dumps({"ok": True}).encode("utf-8"))
            return

        if self.path == "/api/admin/quiz/save":
            data = self._read_json()
            admin_username = str(data.get("admin_username", "")).strip()
            course_raw = str(data.get("course", "")).strip()
            course, _ = normalize_level(course_raw)
            try:
                lesson_number = int(data.get("lesson_number", 0) or 0)
            except (TypeError, ValueError):
                lesson_number = 0
            questions = data.get("questions")
            if not admin_username or not course or lesson_number <= 0 or not isinstance(questions, list):
                self._set_headers(400)
                self.wfile.write(
                    json.dumps({"error": "admin_username, course, lesson_number, questions are required"}).encode("utf-8")
                )
                return

            conn = get_connection()
            if not self._require_admin(conn):
                conn.close()
                return
            conn.close()

            safe_questions = []
            used_ids: set[int] = set()
            max_id = 0
            for item in questions:
                if not isinstance(item, dict):
                    continue
                try:
                    qid = int(item.get("id", 0) or 0)
                except (TypeError, ValueError):
                    qid = 0
                if qid <= 0 or qid in used_ids:
                    qid = max_id + 1
                used_ids.add(qid)
                max_id = max(max_id, qid)
                question = str(item.get("question", "") or "").strip()
                options_raw = item.get("options") if isinstance(item.get("options"), dict) else {}
                options = {
                    "A": str((options_raw.get("A") or options_raw.get("a") or "")).strip(),
                    "B": str((options_raw.get("B") or options_raw.get("b") or "")).strip(),
                    "C": str((options_raw.get("C") or options_raw.get("c") or "")).strip(),
                    "D": str((options_raw.get("D") or options_raw.get("d") or "")).strip(),
                }
                correct = str(item.get("correct", "") or "A").strip().upper()
                if correct not in {"A", "B", "C", "D"}:
                    correct = "A"
                safe_questions.append(
                    {
                        "id": qid,
                        "question": question,
                        "options": options,
                        "correct": correct,
                        "explanation": str(item.get("explanation", "") or "").strip(),
                        "explanation_simple": str(item.get("explanation_simple", "") or "").strip(),
                        "explanation_detailed": str(item.get("explanation_detailed", "") or "").strip(),
                    }
                )
            existing_questions = load_quiz_questions(course, lesson_number) or []
            existing_by_id = {}
            for existing in existing_questions:
                try:
                    existing_id = int(existing.get("id", 0) or 0)
                except (TypeError, ValueError):
                    continue
                if existing_id > 0:
                    existing_by_id[existing_id] = existing

            translate_cache: dict[tuple[str, str], str] = {}

            def translate_cached(text_value: str, target_lang: str) -> str:
                text_clean = str(text_value or "").strip()
                key = (text_clean, target_lang)
                if not text_clean:
                    return ""
                if key in translate_cache:
                    return translate_cache[key]
                translated = translate_text(text_clean, target_lang)
                translate_cache[key] = str(translated or "").strip()
                return translate_cache[key]

            for q in safe_questions:
                qid = int(q.get("id", 0) or 0)
                prev = existing_by_id.get(qid)
                prev_translations = _normalize_explanation_translation_map(prev.get("explanation_translations") if isinstance(prev, dict) else None)

                main_en = str(q.get("explanation", "") or "").strip()
                simple_en = str(q.get("explanation_simple", "") or "").strip() or _first_sentence(main_en) or main_en
                detailed_en = str(q.get("explanation_detailed", "") or "").strip() or main_en

                unchanged = False
                if isinstance(prev, dict):
                    prev_main = str(prev.get("explanation", "") or "").strip()
                    prev_simple = str(prev.get("explanation_simple", "") or "").strip() or _first_sentence(prev_main) or prev_main
                    prev_detailed = str(prev.get("explanation_detailed", "") or "").strip() or prev_main
                    unchanged = main_en == prev_main and simple_en == prev_simple and detailed_en == prev_detailed

                # Keep existing translations if the English source did not change and the admin did not provide overrides.
                if unchanged and prev_translations:
                    q["explanation_translations"] = prev_translations
                    continue

                if not TRANSLATE_URL:
                    # No translation backend configured: avoid serving stale translations after edits.
                    if unchanged and prev_translations:
                        q["explanation_translations"] = prev_translations
                    else:
                        q.pop("explanation_translations", None)
                    continue

                merged = dict(prev_translations) if unchanged else {}

                for lang_key in ("ru", "uz"):
                    mode_map = merged.get(lang_key, {})
                    if not isinstance(mode_map, dict):
                        mode_map = {}
                    translated_main = translate_cached(main_en, lang_key) if main_en else ""
                    translated_simple = translate_cached(simple_en, lang_key) if simple_en else ""
                    translated_detailed = translate_cached(detailed_en, lang_key) if detailed_en else ""
                    if translated_main:
                        mode_map["main"] = translated_main
                    if translated_simple:
                        mode_map["simple"] = translated_simple
                    if translated_detailed:
                        mode_map["detailed"] = translated_detailed
                    if mode_map:
                        merged[lang_key] = mode_map

                q["explanation_translations"] = merged if merged else {}
                if not q["explanation_translations"]:
                    q.pop("explanation_translations", None)

            quiz_path = get_quiz_path(course, lesson_number)
            if quiz_path is None:
                self._set_headers(400)
                self.wfile.write(json.dumps({"error": "invalid course or lesson"}).encode("utf-8"))
                return
            try:
                quiz_path.parent.mkdir(parents=True, exist_ok=True)
            except OSError:
                pass
            try:
                atomic_write_text(quiz_path, json.dumps(safe_questions, ensure_ascii=False, indent=2))
            except OSError:
                self._set_headers(500)
                self.wfile.write(json.dumps({"error": "save_failed"}).encode("utf-8"))
                return
            self._set_headers(200)
            self.wfile.write(json.dumps({"ok": True}).encode("utf-8"))
            return

        if self.path == "/api/admin/edit-access/request":
            data = self._read_json()
            if not TG_BOT_TOKEN:
                self._set_headers(400)
                self.wfile.write(json.dumps({"error": "telegram_bot_not_configured"}).encode("utf-8"))
                return

            conn = get_connection()
            admin_user = self._require_admin(conn)
            if not admin_user:
                conn.close()
                return
            admin_username = str(admin_user["username"] or "").strip()
            if not admin_username:
                conn.close()
                self._set_headers(400)
                self.wfile.write(json.dumps({"error": "admin_username_missing"}).encode("utf-8"))
                return
            cur = conn.cursor()

            cur.execute("SELECT banned_until FROM admin_edit_pins WHERE admin_username = ?", (admin_username,))
            gate = cur.fetchone()
            banned_until_raw = str(gate["banned_until"] if gate is not None else "" or "").strip()
            banned_until_dt = parse_iso_datetime(banned_until_raw) if banned_until_raw else None
            if banned_until_dt is not None and utc_now() < banned_until_dt:
                conn.close()
                self._set_headers(403)
                self.wfile.write(json.dumps({"error": "banned"}).encode("utf-8"))
                return

            pin = f"{secrets.randbelow(1000000):06d}"
            salt = secrets.token_hex(16)
            pin_hash = hash_password(pin, salt)
            expires_at = to_utc_naive_iso(utc_now() + timedelta(minutes=ADMIN_EDIT_PIN_TTL_MINUTES))

            try:
                cur.execute("SELECT perm_code_plain FROM admin_edit_pins WHERE admin_username = ?", (admin_username,))
                existing = cur.fetchone()
                existing_perm = str(existing["perm_code_plain"] or "").strip() if existing else ""
            except Exception:
                existing_perm = ""

            if existing_perm:
                perm_code = ""
                perm_salt = ""
                perm_hash = ""
                perm_plain = existing_perm
            else:
                _PERM_CHARS = string.ascii_uppercase + string.digits
                perm_code = ''.join(secrets.choice(_PERM_CHARS) for _ in range(8))
                perm_salt = secrets.token_hex(16)
                perm_hash = hash_password(perm_code, perm_salt)
                perm_plain = perm_code

            cur.execute(
                """
                INSERT INTO admin_edit_pins (admin_username, pin_hash, salt, expires_at, attempts_left, banned_until, perm_code_hash, perm_code_salt, perm_code_plain)
                VALUES (?, ?, ?, ?, ?, '', ?, ?, ?)
                ON CONFLICT(admin_username) DO UPDATE SET
                    pin_hash=excluded.pin_hash,
                    salt=excluded.salt,
                    expires_at=excluded.expires_at,
                    attempts_left=excluded.attempts_left,
                    banned_until='',
                    perm_code_hash=CASE WHEN excluded.perm_code_hash != '' THEN excluded.perm_code_hash ELSE perm_code_hash END,
                    perm_code_salt=CASE WHEN excluded.perm_code_salt != '' THEN excluded.perm_code_salt ELSE perm_code_salt END,
                    perm_code_plain=CASE WHEN excluded.perm_code_plain != '' THEN excluded.perm_code_plain ELSE perm_code_plain END
                """,
                (admin_username, pin_hash, salt, expires_at, ADMIN_EDIT_PIN_MAX_ATTEMPTS, perm_hash, perm_salt, perm_plain),
            )
            conn.commit()
            conn.close()

            try:
                admin_chat_id_raw = admin_user["telegram_chat_id"] if "telegram_chat_id" in admin_user.keys() else 0
                admin_chat_id = int(admin_chat_id_raw or 0)
            except (TypeError, ValueError):
                admin_chat_id = 0
            recipients = [admin_chat_id] if admin_chat_id > 0 else list(TG_ADMIN_IDS or [])
            if not recipients:
                self._set_headers(400)
                self.wfile.write(json.dumps({"error": "admin_telegram_not_linked"}).encode("utf-8"))
                return

            if perm_code:
                tg_text = (
                    f"🔑 PIN: {pin}  ({ADMIN_EDIT_PIN_TTL_MINUTES} min)\n\n"
                    f"🔐 Permanent code: {perm_code}\n"
                    f"Save it — won't be sent again. Use /mycode to view later."
                )
            else:
                tg_text = (
                    f"🔑 PIN: {pin}  ({ADMIN_EDIT_PIN_TTL_MINUTES} min)\n\n"
                    f"Use /mycode to view your permanent code."
                )
            sent = send_telegram_message_to(recipients, tg_text)
            if not sent:
                self._set_headers(400)
                self.wfile.write(json.dumps({"error": "telegram_send_failed"}).encode("utf-8"))
                return

            self._set_headers(200)
            self.wfile.write(json.dumps({"ok": True}).encode("utf-8"))
            return

        if self.path == "/api/admin/edit-access/verify":
            data = self._read_json()
            admin_username = str(data.get("admin_username", "")).strip()
            code = str(data.get("code", "")).strip()
            if not admin_username or not code:
                self._set_headers(400)
                self.wfile.write(json.dumps({"error": "admin_username and code are required"}).encode("utf-8"))
                return

            conn = get_connection()
            if not self._require_admin(conn):
                conn.close()
                return
            cur = conn.cursor()
            ok, error, method = verify_admin_edit_code(cur, admin_username, code)
            conn.commit()
            conn.close()
            if ok:
                self._set_headers(200)
                self.wfile.write(json.dumps({"ok": True, "method": method}).encode("utf-8"))
                return
            if error == "banned":
                self._set_headers(403)
                self.wfile.write(json.dumps({"ok": False, "error": "banned"}).encode("utf-8"))
                return
            self._set_headers(200 if error in {"invalid_code", "pin_not_requested", "pin_expired"} else 400)
            self.wfile.write(json.dumps({"ok": False, "error": error}).encode("utf-8"))
            return

        if self.path == "/api/admin/contact-messages/mark-seen":
            data = self._read_json()
            username = str(data.get("username", "")).strip()
            if not username:
                self._set_headers(400)
                self.wfile.write(json.dumps({"error": "username is required"}).encode("utf-8"))
                return

            conn = get_connection()
            if not self._require_admin(conn):
                conn.close()
                return
            cur = conn.cursor()

            cur.execute("UPDATE contact_messages SET seen_by_admin = 1 WHERE seen_by_admin = 0")
            conn.commit()
            conn.close()
            self._set_headers(200)
            self.wfile.write(json.dumps({"status": "ok"}).encode("utf-8"))
            return

        if self.path == "/api/register":
            data = self._read_json()
            username = data.get("username", "").strip()
            password = data.get("password", "")

            if not username or not password:
                self._set_headers(400)
                self.wfile.write(json.dumps({"error": "username and password are required"}).encode("utf-8"))
                return

            if len(password) < 6:
                self._set_headers(400)
                self.wfile.write(json.dumps({"error": "password must be at least 6 characters"}).encode("utf-8"))
                return

            conn = get_connection()
            cur = conn.cursor()
            cur.execute("SELECT id FROM users WHERE username = ?", (username,))
            if cur.fetchone() is not None:
                conn.close()
                self._set_headers(409)
                self.wfile.write(json.dumps({"error": "username already exists"}).encode("utf-8"))
                return

            salt = secrets.token_hex(16)
            password_hash = hash_password(password, salt)
            cur.execute(
                """
                INSERT INTO users (full_name, level, username, password, password_hash, salt, role, created_at, access_started_at)
                VALUES (?, ?, ?, '', ?, ?, 'student', ?, ?)
                """,
                ("", "", username, password_hash, salt, datetime.now(timezone.utc).isoformat(), datetime.now(timezone.utc).isoformat()),
            )
            conn.commit()
            conn.close()

            self._set_headers(201)
            self.wfile.write(json.dumps({"username": username}).encode("utf-8"))
            return

        if self.path == "/api/login":
            data = self._read_json()
            username = data.get("username", "").strip()
            password = data.get("password", "")

            conn = get_connection()
            cur = conn.cursor()
            cur.execute(
                "SELECT id, username, full_name, role, level, password_hash, salt FROM users WHERE username = ?",
                (username,),
            )
            user = cur.fetchone()
            if user is not None:
                stored_hash = str(user["password_hash"] or "").strip()
                stored_salt = str(user["salt"] or "").strip()
                if not stored_hash or not stored_salt or hash_password(password, stored_salt) != stored_hash:
                    user = None

            if user is None:
                conn.close()
                self._set_headers(401)
                self.wfile.write(json.dumps({"error": "invalid credentials"}).encode("utf-8"))
                return

            session_token, expires_at = create_session(cur, user["id"])
            user_agent = self.headers.get("User-Agent", "")
            forwarded_for = self.headers.get("X-Forwarded-For", "")
            client_ip = ""
            if forwarded_for:
                client_ip = forwarded_for.split(",")[0].strip()
            if not client_ip:
                client_ip = self.client_address[0] if self.client_address else ""
            record_user_device(cur, user["id"], user["username"], user_agent, client_ip)
            conn.commit()
            conn.close()

            self._set_headers(200)
            self.wfile.write(
                json.dumps(
                    {
                        "id": user["id"],
                        "username": user["username"],
                        "full_name": user["full_name"] or "",
                        "role": user["role"],
                        "level": user["level"] or "",
                        "session_token": session_token,
                        "session_expires_at": expires_at,
                    }
                ).encode("utf-8")
            )
            return

        if self.path == "/api/bot/login":
            data = self._read_json()
            phone_raw = str(data.get("phone", "") or "").strip()
            phone = normalize_phone(phone_raw)
            username = str(data.get("username", "") or "").strip()
            password = str(data.get("password", "") or "")

            if not phone or not username or not password:
                self._set_headers(400)
                self.wfile.write(json.dumps({"error": "phone, username and password are required"}).encode("utf-8"))
                return

            conn = get_connection()
            cur = conn.cursor()
            cur.execute(
                """
                SELECT id, username, full_name, role, level, phone, password_hash, salt
                FROM users
                WHERE phone = ?
                """,
                (phone,),
            )
            user = cur.fetchone()
            if user is None or str(user["username"] or "").strip() != username:
                conn.close()
                self._set_headers(401)
                self.wfile.write(json.dumps({"error": "invalid credentials"}).encode("utf-8"))
                return

            stored_hash = str(user["password_hash"] or "").strip()
            stored_salt = str(user["salt"] or "").strip()
            if not stored_hash or not stored_salt or hash_password(password, stored_salt) != stored_hash:
                conn.close()
                self._set_headers(401)
                self.wfile.write(json.dumps({"error": "invalid credentials"}).encode("utf-8"))
                return

            conn.close()
            self._set_headers(200)
            self.wfile.write(
                json.dumps(
                    {
                        "id": user["id"],
                        "username": user["username"],
                        "full_name": user["full_name"] or "",
                        "role": user["role"],
                        "level": user["level"] or "",
                        "phone": user["phone"] or "",
                    }
                ).encode("utf-8")
            )
            return

        if self.path == "/api/bot/parents/upsert":
            data = self._read_json()
            phone_raw = str(data.get("phone", "") or "").strip()
            phone = normalize_phone(phone_raw)
            token = str(data.get("token", "") or "").strip()
            relation = str(data.get("relation", "") or "").strip().lower()
            first_name = str(data.get("first_name", "") or "").strip()
            last_name = str(data.get("last_name", "") or "").strip()
            parent_phone_raw = str(data.get("parent_phone", "") or data.get("phone_parent", "") or "").strip()
            parent_phone = normalize_phone(parent_phone_raw)

            if BOT_SYNC_TOKEN and token != BOT_SYNC_TOKEN:
                self._set_headers(403)
                self.wfile.write(json.dumps({"error": "invalid token"}).encode("utf-8"))
                return

            if not phone or relation not in {"mother", "father"} or not first_name or not last_name or not parent_phone:
                self._set_headers(400)
                self.wfile.write(
                    json.dumps({"error": "phone, relation, first_name, last_name and parent_phone are required"}).encode("utf-8")
                )
                return

            conn = get_connection()
            cur = conn.cursor()
            cur.execute("SELECT id FROM users WHERE phone = ?", (phone,))
            user = cur.fetchone()
            if user is None:
                conn.close()
                self._set_headers(404)
                self.wfile.write(json.dumps({"error": "user not found"}).encode("utf-8"))
                return

            now = datetime.now(timezone.utc).isoformat()
            cur.execute(
                """
                INSERT INTO user_parents (user_id, relation, first_name, last_name, phone, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(user_id, relation) DO UPDATE SET
                    first_name=excluded.first_name,
                    last_name=excluded.last_name,
                    phone=excluded.phone,
                    updated_at=excluded.updated_at
                """,
                (int(user["id"]), relation, first_name, last_name, parent_phone, now, now),
            )
            conn.commit()
            conn.close()
            self._set_headers(200)
            self.wfile.write(json.dumps({"status": "ok"}).encode("utf-8"))
            return

        if self.path == "/api/enrollment-request":
            data = self._read_json()
            full_name = str(data.get("full_name", "")).strip()
            phone = str(data.get("phone", "")).strip()
            telegram_username = str(data.get("telegram_username", "")).strip()
            level = str(data.get("level", "")).strip()
            price_label = str(data.get("price_label", "")).strip()
            lesson_schedule_raw = str(data.get("lesson_schedule", "")).strip()
            submitted_username = str(data.get("username", "")).strip()

            if not full_name or not phone or not level or not price_label:
                self._set_headers(400)
                self.wfile.write(
                    json.dumps(
                        {
                            "error": "full_name, phone, level and price_label are required"
                        }
                    ).encode("utf-8")
                )
                return

            course_level, is_express = normalize_level(level)
            if course_level not in COURSE_LESSON_COUNTS:
                self._set_headers(400)
                self.wfile.write(json.dumps({"error": "invalid level"}).encode("utf-8"))
                return

            if re.fullmatch(r"\+?[0-9()\-\s]{7,20}", phone) is None:
                self._set_headers(400)
                self.wfile.write(json.dumps({"error": "invalid phone format"}).encode("utf-8"))
                return

            clean_telegram = telegram_username.lstrip("@")
            if clean_telegram and re.fullmatch(r"[A-Za-z0-9_]{4,32}", clean_telegram) is None:
                self._set_headers(400)
                self.wfile.write(json.dumps({"error": "invalid telegram_username format"}).encode("utf-8"))
                return

            lesson_schedule = ""
            if not is_express:
                lesson_schedule = normalize_schedule_key(lesson_schedule_raw)
                if not lesson_schedule:
                    self._set_headers(400)
                    self.wfile.write(json.dumps({"error": "invalid lesson_schedule"}).encode("utf-8"))
                    return

            created_at = datetime.now(timezone.utc).isoformat()
            conn = get_connection()
            cur = conn.cursor()
            cur.execute(
                """
                INSERT INTO enrollment_requests (
                    full_name, phone, telegram_username, level, price_label, lesson_schedule, submitted_username, seen_by_admin, created_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)
                """,
                (
                    full_name,
                    phone,
                    clean_telegram,
                    level.lower(),
                    price_label,
                    lesson_schedule,
                    submitted_username,
                    created_at,
                ),
            )
            request_id = cur.lastrowid
            conn.commit()
            conn.close()

            if TG_BOT_TOKEN and TG_ADMIN_IDS:
                payload = build_enrollment_request_message(
                    full_name,
                    level,
                    price_label,
                    phone,
                    clean_telegram,
                    submitted_username,
                    lesson_schedule,
                )
                send_telegram_message(payload)

            self._set_headers(201)
            self.wfile.write(
                json.dumps(
                    {
                        "status": "created",
                        "id": request_id,
                        "full_name": full_name,
                        "phone": phone,
                        "telegram_username": clean_telegram,
                        "level": level,
                        "price_label": price_label,
                        "lesson_schedule": lesson_schedule,
                        "created_at": created_at,
                    }
                ).encode("utf-8")
            )
            return

        if self.path == "/api/renewal-request":
            data = self._read_json()
            full_name = str(data.get("full_name", "")).strip()
            phone = str(data.get("phone", "")).strip()
            telegram_username = str(data.get("telegram_username", "")).strip()
            level = str(data.get("level", "")).strip()
            price_label = str(data.get("price_label", "")).strip()
            submitted_username = str(data.get("username", "")).strip()

            if not level or not price_label:
                self._set_headers(400)
                self.wfile.write(json.dumps({"error": "level and price_label are required"}).encode("utf-8"))
                return

            course_level, _ = normalize_level(level)
            if course_level not in COURSE_LESSON_COUNTS:
                self._set_headers(400)
                self.wfile.write(json.dumps({"error": "invalid level"}).encode("utf-8"))
                return

            clean_telegram = telegram_username.lstrip("@")
            if clean_telegram and re.fullmatch(r"[A-Za-z0-9_]{4,32}", clean_telegram) is None:
                self._set_headers(400)
                self.wfile.write(json.dumps({"error": "invalid telegram_username format"}).encode("utf-8"))
                return

            conn = get_connection()
            cur = conn.cursor()
            cur.execute(
                """
                INSERT INTO renewal_requests (
                    full_name, phone, telegram_username, level, price_label, submitted_username
                )
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (full_name, phone, clean_telegram, level.lower(), price_label, submitted_username),
            )
            request_id = cur.lastrowid
            conn.commit()
            conn.close()

            if TG_BOT_TOKEN and TG_ADMIN_IDS:
                payload = build_renewal_request_message(
                    full_name,
                    level,
                    price_label,
                    phone,
                    clean_telegram,
                    submitted_username,
                )
                send_telegram_message(payload)

            self._set_headers(201)
            self.wfile.write(json.dumps({"status": "created", "id": request_id}).encode("utf-8"))
            return

        if self.path == "/api/admin/enrollment-requests/mark-seen":
            data = self._read_json()
            admin_username = str(data.get("admin_username", "")).strip()
            if not admin_username:
                self._set_headers(400)
                self.wfile.write(json.dumps({"error": "admin_username is required"}).encode("utf-8"))
                return

            conn = get_connection()
            if not self._require_admin(conn):
                conn.close()
                return
            cur = conn.cursor()

            cur.execute("UPDATE enrollment_requests SET seen_by_admin = 1 WHERE seen_by_admin = 0")
            updated_rows = int(cur.rowcount or 0)
            conn.commit()
            conn.close()

            self._set_headers(200)
            self.wfile.write(json.dumps({"status": "ok", "updated_rows": updated_rows}).encode("utf-8"))
            return

        if self.path == "/api/admin/enrollment-requests/mark-one":
            data = self._read_json()
            admin_username = str(data.get("admin_username", "")).strip()
            request_id_raw = data.get("request_id", "")
            try:
                request_id = int(request_id_raw)
            except (TypeError, ValueError):
                request_id = 0
            if not admin_username or request_id <= 0:
                self._set_headers(400)
                self.wfile.write(
                    json.dumps({"error": "admin_username and valid request_id are required"}).encode("utf-8")
                )
                return

            conn = get_connection()
            if not self._require_admin(conn):
                conn.close()
                return
            cur = conn.cursor()

            cur.execute(
                "UPDATE enrollment_requests SET seen_by_admin = 1 WHERE id = ? AND seen_by_admin = 0",
                (request_id,),
            )
            updated_rows = int(cur.rowcount or 0)
            cur.execute("SELECT COUNT(*) AS pending_count FROM enrollment_requests WHERE seen_by_admin = 0")
            pending_row = cur.fetchone()
            pending_count = int(pending_row["pending_count"] if pending_row else 0)
            conn.commit()
            conn.close()

            self._set_headers(200)
            self.wfile.write(
                json.dumps(
                    {"status": "ok", "updated_rows": updated_rows, "pending_count": pending_count}
                ).encode("utf-8")
            )
            return

        if self.path == "/api/admin/enrollment-requests/delete":
            data = self._read_json()
            admin_username = str(data.get("admin_username", "")).strip()
            request_id_raw = data.get("request_id", "")
            try:
                request_id = int(request_id_raw)
            except (TypeError, ValueError):
                request_id = 0
            if not admin_username or request_id <= 0:
                self._set_headers(400)
                self.wfile.write(
                    json.dumps({"error": "admin_username and valid request_id are required"}).encode("utf-8")
                )
                return

            conn = get_connection()
            if not self._require_admin(conn):
                conn.close()
                return
            cur = conn.cursor()

            cur.execute("DELETE FROM enrollment_requests WHERE id = ?", (request_id,))
            deleted_rows = int(cur.rowcount or 0)
            cur.execute("SELECT COUNT(*) AS pending_count FROM enrollment_requests WHERE seen_by_admin = 0")
            pending_row = cur.fetchone()
            pending_count = int(pending_row["pending_count"] if pending_row else 0)
            conn.commit()
            conn.close()

            self._set_headers(200)
            self.wfile.write(
                json.dumps(
                    {"status": "deleted", "deleted_rows": deleted_rows, "pending_count": pending_count}
                ).encode("utf-8")
            )
            return

        if self.path == "/api/video-progress":
            data = self._read_json()
            username = str(data.get("username", "")).strip()
            course = str(data.get("course", "")).strip().lower()
            lesson_number_raw = data.get("lesson_number", 0)
            try:
                lesson_number = int(lesson_number_raw)
            except (TypeError, ValueError):
                lesson_number = 0
            watched_seconds = float(data.get("watched_seconds", 0) or 0)
            duration_seconds = float(data.get("duration_seconds", 0) or 0)
            last_position_seconds = float(data.get("last_position_seconds", 0) or 0)

            if not username or not course or lesson_number <= 0:
                self._set_headers(400)
                self.wfile.write(
                    json.dumps({"error": "username, course and lesson_number are required"}).encode("utf-8")
                )
                return

            if course not in COURSE_LESSON_COUNTS:
                self._set_headers(400)
                self.wfile.write(json.dumps({"error": "invalid course"}).encode("utf-8"))
                return

            lesson_count = COURSE_LESSON_COUNTS[course]
            if lesson_number > lesson_count:
                self._set_headers(400)
                self.wfile.write(json.dumps({"error": "invalid lesson_number"}).encode("utf-8"))
                return

            watched_seconds = max(0.0, watched_seconds)
            duration_seconds = max(0.0, duration_seconds)
            if duration_seconds > 0:
                watched_seconds = min(watched_seconds, duration_seconds)
                last_position_seconds = min(max(0.0, last_position_seconds), duration_seconds)
            else:
                last_position_seconds = max(0.0, last_position_seconds)

            conn = get_connection()
            cur = conn.cursor()
            cur.execute("SELECT id FROM users WHERE username = ?", (username,))
            user = cur.fetchone()
            if user is None:
                conn.close()
                self._set_headers(404)
                self.wfile.write(json.dumps({"error": "user not found"}).encode("utf-8"))
                return

            now = datetime.now(timezone.utc).isoformat()
            cur.execute(
                """
                SELECT id, watched_seconds, duration_seconds
                FROM video_progress
                WHERE user_id = ? AND course = ? AND lesson_number = ?
                """,
                (user["id"], course, lesson_number),
            )
            row = cur.fetchone()
            if row is None:
                cur.execute(
                    """
                    INSERT INTO video_progress (
                        user_id, course, lesson_number, watched_seconds, watched_minutes, duration_seconds,
                        last_position_seconds, first_seen_at, updated_at
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        user["id"],
                        course,
                        lesson_number,
                        watched_seconds,
                        round(watched_seconds / 60.0, 2),
                        duration_seconds,
                        last_position_seconds,
                        now,
                        now,
                    ),
                )
            else:
                next_watched = max(float(row["watched_seconds"] or 0), watched_seconds)
                next_duration = max(float(row["duration_seconds"] or 0), duration_seconds)
                if next_duration > 0:
                    next_watched = min(next_watched, next_duration)
                next_minutes = round(next_watched / 60.0, 2)
                cur.execute(
                    """
                    UPDATE video_progress
                    SET watched_seconds = ?, watched_minutes = ?, duration_seconds = ?, last_position_seconds = ?, updated_at = ?
                    WHERE id = ?
                    """,
                    (next_watched, next_minutes, next_duration, last_position_seconds, now, row["id"]),
                )

            conn.commit()
            conn.close()
            self._set_headers(200)
            self.wfile.write(json.dumps({"status": "ok"}).encode("utf-8"))
            return

        if self.path == "/api/mentor/self-update":
            data = self._read_json()
            username = str(data.get("username", "")).strip()
            name = str(data.get("name", "")).strip()
            phone_raw = str(data.get("phone", "")).strip()
            telegram_username = str(data.get("telegram_username", "")).strip()
            instagram_username = str(data.get("instagram_username", "")).strip()
            info = str(data.get("info", "")).strip()

            if not username or not name or not phone_raw:
                self._set_headers(400)
                self.wfile.write(json.dumps({"error": "username, name and phone are required"}).encode("utf-8"))
                return

            phone = normalize_phone(phone_raw)
            if not phone:
                self._set_headers(400)
                self.wfile.write(json.dumps({"error": "invalid phone format"}).encode("utf-8"))
                return

            clean_telegram = telegram_username.lstrip("@")
            if clean_telegram and re.fullmatch(r"[A-Za-z0-9_]{4,32}", clean_telegram) is None:
                self._set_headers(400)
                self.wfile.write(json.dumps({"error": "invalid telegram_username format"}).encode("utf-8"))
                return

            clean_instagram = instagram_username.lstrip("@")
            if clean_instagram and re.fullmatch(r"[A-Za-z0-9_.]{1,32}", clean_instagram) is None:
                self._set_headers(400)
                self.wfile.write(json.dumps({"error": "invalid instagram_username format"}).encode("utf-8"))
                return

            conn = get_connection()
            cur = conn.cursor()
            cur.execute("SELECT id, role, full_name, phone FROM users WHERE username = ?", (username,))
            mentor_user = cur.fetchone()
            if mentor_user is None:
                conn.close()
                self._set_headers(404)
                self.wfile.write(json.dumps({"error": "user not found"}).encode("utf-8"))
                return
            if str(mentor_user["role"] or "").strip().lower() != "mentor":
                conn.close()
                self._set_headers(403)
                self.wfile.write(json.dumps({"error": "mentor access required"}).encode("utf-8"))
                return

            user_id = int(mentor_user["id"] or 0)
            cur.execute("SELECT id FROM users WHERE phone = ? AND id != ?", (phone, user_id))
            if cur.fetchone() is not None:
                conn.close()
                self._set_headers(409)
                self.wfile.write(json.dumps({"error": "phone already exists"}).encode("utf-8"))
                return

            mentor_profile_id = 0
            old_phone = str(mentor_user["phone"] or "").strip()
            if old_phone:
                cur.execute("SELECT id FROM mentors WHERE phone = ? ORDER BY id DESC LIMIT 1", (old_phone,))
                row = cur.fetchone()
                if row is not None:
                    mentor_profile_id = int(row["id"] or 0)
            if mentor_profile_id <= 0:
                old_name = str(mentor_user["full_name"] or "").strip()
                if old_name:
                    cur.execute(
                        "SELECT id FROM mentors WHERE LOWER(name) = LOWER(?) ORDER BY id DESC LIMIT 1", (old_name,)
                    )
                    row = cur.fetchone()
                    if row is not None:
                        mentor_profile_id = int(row["id"] or 0)

            if mentor_profile_id <= 0:
                conn.close()
                self._set_headers(400)
                self.wfile.write(json.dumps({"error": "mentor profile not found"}).encode("utf-8"))
                return

            cur.execute(
                """
                UPDATE mentors
                SET name = ?, phone = ?, telegram_username = ?, instagram_username = ?, info = ?
                WHERE id = ?
                """,
                (name, phone, clean_telegram, clean_instagram, info, mentor_profile_id),
            )
            cur.execute("UPDATE users SET full_name = ?, phone = ? WHERE id = ?", (name, phone, user_id))
            conn.commit()
            conn.close()
            self._set_headers(200)
            self.wfile.write(json.dumps({"status": "updated"}).encode("utf-8"))
            return

        if self.path == "/api/admin/mentors/update":
            data = self._read_json()
            admin_username = str(data.get("admin_username", "")).strip()
            mentor_id = str(data.get("mentor_id", "")).strip()
            name = str(data.get("name", "")).strip()
            level_raw = str(data.get("level", "")).strip()
            phone_raw = str(data.get("phone", "")).strip()
            email = str(data.get("email", "")).strip()
            telegram_username = str(data.get("telegram_username", "")).strip()
            instagram_username = str(data.get("instagram_username", "")).strip()
            info = str(data.get("info", "")).strip()
            file_name = str(data.get("file_name", "")).strip()
            file_data = str(data.get("file_data", "")).strip()

            if telegram_username.startswith("@"):
                telegram_username = telegram_username[1:]
            if instagram_username.startswith("@"):
                instagram_username = instagram_username[1:]
            phone = normalize_phone(phone_raw)
            if instagram_username and re.fullmatch(r"[A-Za-z0-9_.]{1,32}", instagram_username) is None:
                self._set_headers(400)
                self.wfile.write(json.dumps({"error": "invalid instagram_username format"}).encode("utf-8"))
                return

            if (
                not admin_username
                or not mentor_id
                or not name
                or not level_raw
                or not phone
                or not email
                or not telegram_username
                or not info
            ):
                self._set_headers(400)
                self.wfile.write(
                    json.dumps(
                        {
                            "error": "admin_username, mentor_id, name, level, phone, email, telegram_username and info are required"
                        }
                    ).encode("utf-8")
                )
                return
            if "@" not in email or "." not in email:
                self._set_headers(400)
                self.wfile.write(json.dumps({"error": "invalid email"}).encode("utf-8"))
                return

            course_level, _ = normalize_level(level_raw)
            if course_level not in COURSE_LESSON_COUNTS:
                self._set_headers(400)
                self.wfile.write(json.dumps({"error": "invalid level"}).encode("utf-8"))
                return

            conn = get_connection()
            if not self._require_admin(conn):
                conn.close()
                return
            cur = conn.cursor()

            cur.execute("SELECT id, avatar_path, avatar_name FROM mentors WHERE id = ?", (mentor_id,))
            current = cur.fetchone()
            if current is None:
                conn.close()
                self._set_headers(404)
                self.wfile.write(json.dumps({"error": "mentor not found"}).encode("utf-8"))
                return

            avatar_path = current["avatar_path"] or ""
            avatar_name = current["avatar_name"] or ""
            if file_data:
                try:
                    header, b64_data = file_data.split(",", 1)
                except ValueError:
                    header = ""
                    b64_data = file_data

                try:
                    file_bytes = base64.b64decode(b64_data)
                except (ValueError, TypeError):
                    conn.close()
                    self._set_headers(400)
                    self.wfile.write(json.dumps({"error": "invalid file_data"}).encode("utf-8"))
                    return

                uploads_dir = DEFAULT_DB_DIR / "uploads" / "mentors"
                uploads_dir.mkdir(parents=True, exist_ok=True)
                safe_name = re.sub(r"[^A-Za-z0-9._-]", "_", file_name or "mentor")[:120] or "mentor"
                timestamp = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")
                stored_name = f"{course_level}_{timestamp}_{safe_name}"
                file_path = uploads_dir / stored_name
                file_path.write_bytes(file_bytes)
                avatar_path = str(file_path)
                avatar_name = file_name or safe_name

            cur.execute(
                """
                UPDATE mentors
                SET name = ?, level = ?, phone = ?, email = ?, telegram_username = ?, instagram_username = ?, info = ?, avatar_path = ?, avatar_name = ?
                WHERE id = ?
                """,
                (
                    name,
                    course_level,
                    phone,
                    email,
                    telegram_username,
                    instagram_username,
                    info,
                    avatar_path,
                    avatar_name,
                    mentor_id,
                ),
            )
            conn.commit()
            conn.close()

            self._set_headers(200)
            self.wfile.write(json.dumps({"status": "updated", "id": mentor_id}).encode("utf-8"))
            return

        if self.path == "/api/admin/mentors/create":
            data = self._read_json()
            admin_username = str(data.get("admin_username", "")).strip()
            name = str(data.get("name", "")).strip()
            level_raw = str(data.get("level", "")).strip()
            phone_raw = str(data.get("phone", "")).strip()
            email = str(data.get("email", "")).strip()
            telegram_username = str(data.get("telegram_username", "")).strip()
            instagram_username = str(data.get("instagram_username", "")).strip()
            info = str(data.get("info", "")).strip()
            file_name = str(data.get("file_name", "")).strip()
            file_data = str(data.get("file_data", "")).strip()

            if telegram_username.startswith("@"):
                telegram_username = telegram_username[1:]
            if instagram_username.startswith("@"):
                instagram_username = instagram_username[1:]
            phone = normalize_phone(phone_raw)
            if instagram_username and re.fullmatch(r"[A-Za-z0-9_.]{1,32}", instagram_username) is None:
                self._set_headers(400)
                self.wfile.write(json.dumps({"error": "invalid instagram_username format"}).encode("utf-8"))
                return

            if (
                not admin_username
                or not name
                or not level_raw
                or not phone
                or not email
                or not telegram_username
                or not info
                or not file_name
                or not file_data
            ):
                self._set_headers(400)
                self.wfile.write(
                    json.dumps(
                        {
                            "error": "admin_username, name, level, phone, email, telegram_username, info, file_name and file_data are required"
                        }
                    ).encode("utf-8")
                )
                return
            if "@" not in email or "." not in email:
                self._set_headers(400)
                self.wfile.write(json.dumps({"error": "invalid email"}).encode("utf-8"))
                return

            course_level, _ = normalize_level(level_raw)
            if course_level not in COURSE_LESSON_COUNTS:
                self._set_headers(400)
                self.wfile.write(json.dumps({"error": "invalid level"}).encode("utf-8"))
                return

            conn = get_connection()
            if not self._require_admin(conn):
                conn.close()
                return
            cur = conn.cursor()

            try:
                header, b64_data = file_data.split(",", 1)
            except ValueError:
                header = ""
                b64_data = file_data

            try:
                file_bytes = base64.b64decode(b64_data)
            except (ValueError, TypeError):
                conn.close()
                self._set_headers(400)
                self.wfile.write(json.dumps({"error": "invalid file_data"}).encode("utf-8"))
                return

            uploads_dir = DEFAULT_DB_DIR / "uploads" / "mentors"
            uploads_dir.mkdir(parents=True, exist_ok=True)
            safe_name = re.sub(r"[^A-Za-z0-9._-]", "_", file_name)[:120] or "mentor"
            timestamp = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")
            stored_name = f"{course_level}_{timestamp}_{safe_name}"
            file_path = uploads_dir / stored_name
            file_path.write_bytes(file_bytes)

            created_at = datetime.now(timezone.utc).isoformat()
            cur.execute(
                """
                INSERT INTO mentors (name, level, phone, email, telegram_username, instagram_username, info, avatar_path, avatar_name, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    name,
                    course_level,
                    phone,
                    email,
                    telegram_username,
                    instagram_username,
                    info,
                    str(file_path),
                    file_name,
                    created_at,
                ),
            )
            mentor_id = cur.lastrowid
            conn.commit()
            conn.close()

            self._set_headers(201)
            self.wfile.write(
                json.dumps({"status": "created", "id": mentor_id, "name": name, "level": course_level}).encode("utf-8")
            )
            return

        if self.path in ("/api/admin/daily-content/list", "/api/admin/daily-content/create",
                        "/api/admin/daily-content/update", "/api/admin/daily-content/delete"):
            data = self._read_json()
            admin_username = str(data.get("admin_username", "") or "").strip()
            code = str(data.get("code", "") or "").strip()
            if not admin_username or not code:
                self._set_headers(400)
                self.wfile.write(json.dumps({"error": "invalid_request"}).encode("utf-8"))
                return
            conn = get_connection()
            cur = conn.cursor()
            ok, error, _method = verify_admin_edit_code(cur, admin_username, code)
            if not ok:
                conn.commit()
                conn.close()
                self._set_headers(400)
                self.wfile.write(json.dumps({"error": error}).encode("utf-8"))
                return

            if self.path == "/api/admin/daily-content/list":
                content_type = str(data.get("type", "") or "").strip()
                if content_type not in ("motivation", "tip"):
                    conn.close()
                    self._set_headers(400)
                    self.wfile.write(json.dumps({"error": "invalid type"}).encode("utf-8"))
                    return
                cur.execute(
                    "SELECT id, text, active FROM daily_content WHERE type = ? ORDER BY id ASC",
                    (content_type,),
                )
                items = [{"id": r["id"], "text": r["text"], "active": bool(r["active"])} for r in cur.fetchall()]
                conn.close()
                self._set_headers(200)
                self.wfile.write(json.dumps({"items": items}).encode("utf-8"))
                return

            if self.path == "/api/admin/daily-content/create":
                content_type = str(data.get("type", "") or "").strip()
                text = str(data.get("text", "") or "").strip()
                if content_type not in ("motivation", "tip") or not text:
                    conn.close()
                    self._set_headers(400)
                    self.wfile.write(json.dumps({"error": "invalid_request"}).encode("utf-8"))
                    return
                now_iso = utc_now().isoformat()
                cur.execute(
                    "INSERT INTO daily_content (type, text, active, created_at) VALUES (?, ?, 1, ?)",
                    (content_type, text, now_iso),
                )
                new_id = cur.lastrowid
                conn.commit()
                conn.close()
                self._set_headers(200)
                self.wfile.write(json.dumps({"ok": True, "id": new_id}).encode("utf-8"))
                return

            if self.path == "/api/admin/daily-content/update":
                item_id = data.get("id")
                text = str(data.get("text", "") or "").strip()
                active = data.get("active")
                try:
                    item_id = int(item_id)
                except (TypeError, ValueError):
                    conn.close()
                    self._set_headers(400)
                    self.wfile.write(json.dumps({"error": "invalid id"}).encode("utf-8"))
                    return
                if text:
                    cur.execute("UPDATE daily_content SET text = ? WHERE id = ?", (text, item_id))
                if active is not None:
                    cur.execute("UPDATE daily_content SET active = ? WHERE id = ?", (1 if active else 0, item_id))
                conn.commit()
                conn.close()
                self._set_headers(200)
                self.wfile.write(json.dumps({"ok": True}).encode("utf-8"))
                return

            if self.path == "/api/admin/daily-content/delete":
                item_id = data.get("id")
                try:
                    item_id = int(item_id)
                except (TypeError, ValueError):
                    conn.close()
                    self._set_headers(400)
                    self.wfile.write(json.dumps({"error": "invalid id"}).encode("utf-8"))
                    return
                cur.execute("DELETE FROM daily_content WHERE id = ?", (item_id,))
                conn.commit()
                conn.close()
                self._set_headers(200)
                self.wfile.write(json.dumps({"ok": True}).encode("utf-8"))
                return

        if self.path == "/api/admin/users/create":
            data = self._read_json()
            admin_username = data.get("admin_username", "").strip()
            first_name = str(data.get("name", "")).strip()
            second_name = str(data.get("second_name", "")).strip()
            full_name = " ".join(part for part in [first_name, second_name] if part).strip()
            level = str(data.get("level", "")).strip()
            lesson_schedule_raw = str(data.get("lesson_schedule", "") or data.get("schedule", "")).strip()
            username = data.get("username", "").strip()
            password = data.get("password", "")
            phone_raw = data.get("phone", "").strip()
            phone = normalize_phone(phone_raw)
            role = str(data.get("role", "") or "student").strip().lower()
            if role not in {"student", "mentor"}:
                role = "student"
            mentor_id = int(data.get("mentor_id", 0) or 0)
            file_name = str(data.get("file_name", "")).strip()
            file_data = str(data.get("file_data", "")).strip()

            if not admin_username or not full_name or not level or not username or not password or not phone:
                self._set_headers(400)
                self.wfile.write(
                    json.dumps({"error": "admin_username, name, level, username, phone and password are required"}).encode(
                        "utf-8"
                    )
                )
                return

            course_level, _ = normalize_level(level)
            if course_level not in COURSE_LESSON_COUNTS:
                self._set_headers(400)
                self.wfile.write(json.dumps({"error": "invalid level"}).encode("utf-8"))
                return

            if len(password) < 6:
                self._set_headers(400)
                self.wfile.write(json.dumps({"error": "password must be at least 6 characters"}).encode("utf-8"))
                return

            conn = get_connection()
            if not self._require_admin(conn):
                conn.close()
                return
            cur = conn.cursor()

            cur.execute("SELECT id FROM users WHERE username = ?", (username,))
            if cur.fetchone() is not None:
                conn.close()
                self._set_headers(409)
                self.wfile.write(json.dumps({"error": "username already exists"}).encode("utf-8"))
                return

            cur.execute("SELECT id FROM users WHERE phone = ?", (phone,))
            if cur.fetchone() is not None:
                conn.close()
                self._set_headers(409)
                self.wfile.write(json.dumps({"error": "phone already exists"}).encode("utf-8"))
                return

            if role != "student":
                mentor_id = 0
            if mentor_id < 0:
                mentor_id = 0
            if role == "student" and mentor_id:
                cur.execute("SELECT id, level FROM mentors WHERE id = ?", (mentor_id,))
                mentor_row = cur.fetchone()
                if mentor_row is None:
                    conn.close()
                    self._set_headers(400)
                    self.wfile.write(json.dumps({"error": "mentor not found"}).encode("utf-8"))
                    return
                mentor_course, _ = normalize_level(str(mentor_row["level"] or "").strip())
                if mentor_course and mentor_course != course_level:
                    conn.close()
                    self._set_headers(400)
                    self.wfile.write(json.dumps({"error": "mentor level mismatch"}).encode("utf-8"))
                    return

            salt = secrets.token_hex(16)
            password_hash = hash_password(password, salt)
            created_at = datetime.now(timezone.utc).isoformat()
            level_label = level.lower()
            if role == "mentor":
                level_label = course_level
            lesson_schedule_key = "" if role == "mentor" else get_user_schedule_key(level_label, lesson_schedule_raw)
            cur.execute(
                """
                INSERT INTO users (
                    full_name,
                    level,
                    lesson_schedule,
                    phone,
                    mentor_id,
                    username,
                    password,
                    password_hash,
                    salt,
                    role,
                    created_at,
                    access_started_at
                )
                VALUES (?, ?, ?, ?, ?, ?, '', ?, ?, ?, ?, ?)
                """,
                (
                    full_name,
                    level_label,
                    lesson_schedule_key,
                    phone,
                    mentor_id,
                    username,
                    password_hash,
                    salt,
                    role,
                    created_at,
                    created_at,
                ),
            )

            if role == "mentor" and file_data:
                try:
                    header, b64_data = file_data.split(",", 1)
                except ValueError:
                    header = ""
                    b64_data = file_data
                try:
                    file_bytes = base64.b64decode(b64_data)
                except (ValueError, TypeError):
                    conn.close()
                    self._set_headers(400)
                    self.wfile.write(json.dumps({"error": "invalid file_data"}).encode("utf-8"))
                    return

                uploads_dir = DEFAULT_DB_DIR / "uploads" / "mentors"
                uploads_dir.mkdir(parents=True, exist_ok=True)
                safe_name = re.sub(r"[^A-Za-z0-9._-]", "_", file_name or "mentor")[:120] or "mentor"
                timestamp = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")
                stored_name = f"{course_level}_{timestamp}_{safe_name}"
                file_path = uploads_dir / stored_name
                file_path.write_bytes(file_bytes)

                cur.execute("SELECT id FROM mentors WHERE phone = ? ORDER BY id DESC LIMIT 1", (phone,))
                existing = cur.fetchone()
                if existing is not None:
                    cur.execute(
                        """
                        UPDATE mentors
                        SET name = ?, level = ?, avatar_path = ?, avatar_name = ?
                        WHERE id = ?
                        """,
                        (full_name, course_level, str(file_path), file_name or safe_name, existing["id"]),
                    )
                else:
                    cur.execute(
                        """
                        INSERT INTO mentors (name, level, phone, avatar_path, avatar_name, created_at)
                        VALUES (?, ?, ?, ?, ?, ?)
                        """,
                        (full_name, course_level, phone, str(file_path), file_name or safe_name, created_at),
                    )
            conn.commit()
            conn.close()

            self._set_headers(201)
            self.wfile.write(
                json.dumps(
                    {
                        "status": "created",
                        "name": full_name,
                        "level": level,
                        "username": username,
                        "lesson_schedule": lesson_schedule_key,
                        "created_at": created_at,
                        "role": role,
                    }
                ).encode("utf-8")
            )
            return

        if self.path == "/api/user/avatar":
            data = self._read_json()
            username = str(data.get("username", "")).strip()
            file_name = str(data.get("file_name", "")).strip()
            file_data = str(data.get("file_data", "")).strip()

            if not username or not file_data:
                self._set_headers(400)
                self.wfile.write(json.dumps({"error": "username and file_data are required"}).encode("utf-8"))
                return

            conn = get_connection()
            cur = conn.cursor()
            cur.execute("SELECT id, role, phone, full_name FROM users WHERE username = ?", (username,))
            user = cur.fetchone()
            if user is None:
                conn.close()
                self._set_headers(404)
                self.wfile.write(json.dumps({"error": "user not found"}).encode("utf-8"))
                return

            try:
                header, b64_data = file_data.split(",", 1)
            except ValueError:
                header = ""
                b64_data = file_data
            try:
                file_bytes = base64.b64decode(b64_data)
            except (ValueError, TypeError):
                conn.close()
                self._set_headers(400)
                self.wfile.write(json.dumps({"error": "invalid file_data"}).encode("utf-8"))
                return

            uploads_dir = DEFAULT_DB_DIR / "uploads" / "users"
            uploads_dir.mkdir(parents=True, exist_ok=True)
            safe_name = re.sub(r"[^A-Za-z0-9._-]", "_", file_name or "avatar")[:120] or "avatar"
            timestamp = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")
            stored_name = f"{timestamp}_{safe_name}"
            file_path = uploads_dir / stored_name
            try:
                file_path.write_bytes(file_bytes)
            except OSError:
                conn.close()
                self._set_headers(500)
                self.wfile.write(json.dumps({"error": "failed to save file"}).encode("utf-8"))
                return

            cur.execute(
                "UPDATE users SET avatar_path = ?, avatar_name = ? WHERE username = ?",
                (str(file_path), file_name or safe_name, username),
            )
            if str(user["role"] or "").strip().lower() == "mentor":
                mentor_phone = str(user["phone"] or "").strip()
                mentor_name = str(user["full_name"] or "").strip()
                mentor_record_id = 0
                if mentor_phone:
                    cur.execute("SELECT id FROM mentors WHERE phone = ? ORDER BY id DESC LIMIT 1", (mentor_phone,))
                    m_row = cur.fetchone()
                    if m_row:
                        mentor_record_id = int(m_row["id"])
                if not mentor_record_id and mentor_name:
                    cur.execute(
                        "SELECT id FROM mentors WHERE LOWER(name) = LOWER(?) ORDER BY id DESC LIMIT 1", (mentor_name,)
                    )
                    m_row = cur.fetchone()
                    if m_row:
                        mentor_record_id = int(m_row["id"])
                if mentor_record_id:
                    cur.execute(
                        "UPDATE mentors SET avatar_path = ?, avatar_name = ? WHERE id = ?",
                        (str(file_path), file_name or safe_name, mentor_record_id),
                    )
            conn.commit()
            conn.close()
            self._set_headers(200)
            self.wfile.write(json.dumps({"status": "updated"}).encode("utf-8"))
            return

        if self.path == "/api/admin/users/update":
            data = self._read_json()
            admin_username = str(data.get("admin_username", "")).strip()
            target_username = str(data.get("username", "")).strip()
            full_name = str(data.get("name", "")).strip()
            level_raw = str(data.get("level", "")).strip()
            lesson_schedule_raw = str(data.get("lesson_schedule", "") or data.get("schedule", "")).strip()
            phone_raw = str(data.get("phone", "")).strip()
            password = str(data.get("password", "") or "").strip()
            phone = normalize_phone(phone_raw)

            if not admin_username or not target_username or not full_name or not level_raw or not phone:
                self._set_headers(400)
                self.wfile.write(
                    json.dumps(
                        {"error": "admin_username, username, name, level and phone are required"}
                    ).encode("utf-8")
                )
                return

            course_level, _ = normalize_level(level_raw)
            if course_level not in COURSE_LESSON_COUNTS:
                self._set_headers(400)
                self.wfile.write(json.dumps({"error": "invalid level"}).encode("utf-8"))
                return

            if password and len(password) < 6:
                self._set_headers(400)
                self.wfile.write(json.dumps({"error": "password must be at least 6 characters"}).encode("utf-8"))
                return

            conn = get_connection()
            if not self._require_admin(conn):
                conn.close()
                return
            cur = conn.cursor()

            cur.execute("SELECT id, role, phone, lesson_schedule FROM users WHERE username = ?", (target_username,))
            target = cur.fetchone()
            if target is None:
                conn.close()
                self._set_headers(404)
                self.wfile.write(json.dumps({"error": "user not found"}).encode("utf-8"))
                return
            if str(target["role"] or "").lower() != "student":
                conn.close()
                self._set_headers(400)
                self.wfile.write(json.dumps({"error": "only students can be edited"}).encode("utf-8"))
                return

            if phone != (target["phone"] or ""):
                cur.execute("SELECT id FROM users WHERE phone = ? AND username != ?", (phone, target_username))
                if cur.fetchone() is not None:
                    conn.close()
                    self._set_headers(409)
                    self.wfile.write(json.dumps({"error": "phone already exists"}).encode("utf-8"))
                    return

            lesson_schedule_key = target["lesson_schedule"] or ""
            if lesson_schedule_raw:
                lesson_schedule_key = get_user_schedule_key(level_raw, lesson_schedule_raw)

            update_fields = [
                "full_name = ?",
                "level = ?",
                "lesson_schedule = ?",
                "phone = ?",
            ]
            level_label = level_raw.strip().lower()
            update_values = [full_name, level_label, lesson_schedule_key, phone]

            if password:
                salt = secrets.token_hex(16)
                password_hash = hash_password(password, salt)
                update_fields.extend(["password = ''", "password_hash = ?", "salt = ?"])
                update_values.extend([password_hash, salt])

            update_values.append(target_username)
            cur.execute(
                f"UPDATE users SET {', '.join(update_fields)} WHERE username = ?",
                update_values,
            )
            conn.commit()
            conn.close()

            self._set_headers(200)
            self.wfile.write(
                json.dumps(
                    {
                        "status": "updated",
                        "username": target_username,
                        "level": level_label,
                        "lesson_schedule": lesson_schedule_key,
                    }
                ).encode("utf-8")
            )
            return

        if self.path == "/api/admin/users/reset-password":
            data = self._read_json()
            admin_username = str(data.get("admin_username", "")).strip()
            target_username = str(data.get("target_username", "") or data.get("username", "")).strip()
            code = str(data.get("code", "")).strip()
            requested_password = str(data.get("new_password", "") or data.get("password", "") or "").strip()
            if not admin_username or not target_username or not code:
                self._set_headers(400)
                self.wfile.write(
                    json.dumps({"error": "admin_username, target_username and code are required"}).encode("utf-8")
                )
                return

            conn = get_connection()
            if not self._require_admin(conn):
                conn.close()
                return
            cur = conn.cursor()
            ok, error, _method = verify_admin_edit_code(cur, admin_username, code)
            if not ok:
                conn.commit()
                conn.close()
                if error == "banned":
                    self._set_headers(403)
                    self.wfile.write(json.dumps({"error": "banned"}).encode("utf-8"))
                    return
                self._set_headers(400)
                self.wfile.write(json.dumps({"error": error}).encode("utf-8"))
                return

            cur.execute("SELECT id, role FROM users WHERE username = ?", (target_username,))
            user = cur.fetchone()
            if user is None:
                conn.commit()
                conn.close()
                self._set_headers(404)
                self.wfile.write(json.dumps({"error": "user not found"}).encode("utf-8"))
                return

            temp_password = requested_password if requested_password else secrets.token_urlsafe(9)
            if len(temp_password) < 6:
                conn.commit()
                conn.close()
                self._set_headers(400)
                self.wfile.write(json.dumps({"error": "password must be at least 6 characters"}).encode("utf-8"))
                return
            salt = secrets.token_hex(16)
            password_hash = hash_password(temp_password, salt)
            cur.execute(
                "UPDATE users SET password = '', password_hash = ?, salt = ? WHERE id = ?",
                (password_hash, salt, user["id"]),
            )
            conn.commit()
            conn.close()
            self._set_headers(200)
            self.wfile.write(json.dumps({"status": "ok", "password": temp_password}).encode("utf-8"))
            return

        if self.path == "/api/admin/users/extend-subscription":
            data = self._read_json()
            admin_username = str(data.get("admin_username", "")).strip()
            target_username = str(data.get("username", "")).strip()
            renewal_id = str(data.get("renewal_id", "")).strip()

            if not admin_username or not target_username:
                self._set_headers(400)
                self.wfile.write(json.dumps({"error": "admin_username and username are required"}).encode("utf-8"))
                return

            conn = get_connection()
            if not self._require_admin(conn):
                conn.close()
                return
            cur = conn.cursor()

            cur.execute("SELECT id, created_at, access_started_at FROM users WHERE username = ?", (target_username,))
            user = cur.fetchone()
            if user is None:
                conn.close()
                self._set_headers(404)
                self.wfile.write(json.dumps({"error": "user not found"}).encode("utf-8"))
                return

            new_created_at = datetime.now(timezone.utc).isoformat()
            access_started_at = user["access_started_at"] or user["created_at"]
            cur.execute(
                "UPDATE users SET created_at = ?, access_started_at = ? WHERE id = ?",
                (new_created_at, access_started_at, user["id"]),
            )

            deleted_rows = 0
            if renewal_id:
                cur.execute("DELETE FROM renewal_requests WHERE id = ?", (renewal_id,))
                deleted_rows = int(cur.rowcount or 0)
            conn.commit()
            conn.close()

            self._set_headers(200)
            self.wfile.write(
                json.dumps(
                    {
                        "status": "extended",
                        "created_at": new_created_at,
                        "renewal_deleted": deleted_rows,
                    }
                ).encode("utf-8")
            )
            return

        if self.path == "/api/admin/users/delete":
            data = self._read_json()
            admin_username = str(data.get("admin_username", "")).strip()
            target_username = str(data.get("username", "")).strip()

            if not admin_username or not target_username:
                self._set_headers(400)
                self.wfile.write(json.dumps({"error": "admin_username and username are required"}).encode("utf-8"))
                return

            conn = get_connection()
            if not self._require_admin(conn):
                conn.close()
                return
            cur = conn.cursor()

            cur.execute("SELECT id, role FROM users WHERE username = ?", (target_username,))
            user = cur.fetchone()
            if user is None:
                conn.close()
                self._set_headers(404)
                self.wfile.write(json.dumps({"error": "user not found"}).encode("utf-8"))
                return

            if user["role"] == "admin":
                conn.close()
                self._set_headers(400)
                self.wfile.write(json.dumps({"error": "cannot delete admin user"}).encode("utf-8"))
                return

            user_id = user["id"]
            cur.execute("DELETE FROM user_sessions WHERE user_id = ?", (user_id,))
            cur.execute("DELETE FROM task_completions WHERE user_id = ?", (user_id,))
            cur.execute("DELETE FROM quiz_answers WHERE attempt_id IN (SELECT id FROM quiz_attempts WHERE user_id = ?)", (user_id,))
            cur.execute("DELETE FROM quiz_attempts WHERE user_id = ?", (user_id,))
            cur.execute("DELETE FROM knowledge_test_attempts WHERE user_id = ?", (user_id,))
            cur.execute("DELETE FROM quiz_answer_events WHERE user_id = ?", (user_id,))
            cur.execute("DELETE FROM user_achievements WHERE user_id = ?", (user_id,))
            cur.execute("DELETE FROM users WHERE id = ?", (user_id,))

            cur.execute("DELETE FROM enrollment_requests WHERE submitted_username = ?", (target_username,))
            cur.execute("DELETE FROM renewal_requests WHERE submitted_username = ?", (target_username,))
            cur.execute("DELETE FROM payment_checks WHERE username = ?", (target_username,))

            conn.commit()
            conn.close()

            self._set_headers(200)
            self.wfile.write(json.dumps({"status": "deleted"}).encode("utf-8"))
            return

        if self.path == "/api/admin/payment-checks/upload":
            data = self._read_json()
            admin_username = str(data.get("admin_username", "")).strip()
            username = str(data.get("username", "")).strip()
            payment_date = str(data.get("payment_date", "")).strip()
            file_name = str(data.get("file_name", "")).strip()
            file_data = str(data.get("file_data", "")).strip()

            if not admin_username or not username or not payment_date or not file_name or not file_data:
                self._set_headers(400)
                self.wfile.write(json.dumps({"error": "admin_username, username, payment_date, file_name and file_data are required"}).encode("utf-8"))
                return

            conn = get_connection()
            if not self._require_admin(conn):
                conn.close()
                return
            cur = conn.cursor()

            try:
                header, b64_data = file_data.split(",", 1)
            except ValueError:
                header = ""
                b64_data = file_data

            try:
                file_bytes = base64.b64decode(b64_data)
            except (ValueError, TypeError):
                conn.close()
                self._set_headers(400)
                self.wfile.write(json.dumps({"error": "invalid file_data"}).encode("utf-8"))
                return

            uploads_dir = DEFAULT_DB_DIR / "uploads" / "payments"
            uploads_dir.mkdir(parents=True, exist_ok=True)
            safe_name = re.sub(r"[^A-Za-z0-9._-]", "_", file_name)[:120] or "payment"
            timestamp = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")
            stored_name = f"{username}_{timestamp}_{safe_name}"
            file_path = uploads_dir / stored_name
            file_path.write_bytes(file_bytes)

            uploaded_at = datetime.now(timezone.utc).isoformat()
            cur.execute(
                """
                INSERT INTO payment_checks (username, payment_date, file_path, original_name, uploaded_at)
                VALUES (?, ?, ?, ?, ?)
                """,
                (username, payment_date, str(file_path), file_name, uploaded_at),
            )
            check_id = cur.lastrowid
            conn.commit()
            conn.close()

            self._set_headers(201)
            self.wfile.write(
                json.dumps(
                    {
                        "status": "uploaded",
                        "id": check_id,
                        "username": username,
                        "payment_date": payment_date,
                        "file_name": file_name,
                        "uploaded_at": uploaded_at,
                    }
                ).encode("utf-8")
            )
            return

        if self.path == "/api/admin/progress/reset":
            data = self._read_json()
            admin_username = data.get("admin_username", "").strip()
            student_username = data.get("student_username", "").strip()
            lesson_number = int(data.get("lesson_number", 0))

            if not admin_username or not student_username or lesson_number <= 0:
                self._set_headers(400)
                self.wfile.write(
                    json.dumps({"error": "admin_username, student_username and lesson_number are required"}).encode(
                        "utf-8"
                    )
                )
                return

            conn = get_connection()
            cur = conn.cursor()

            cur.execute("SELECT id, role FROM users WHERE username = ?", (admin_username,))
            admin_user = cur.fetchone()
            if admin_user is None:
                conn.close()
                self._set_headers(404)
                self.wfile.write(json.dumps({"error": "admin user not found"}).encode("utf-8"))
                return

            if admin_user["role"] != "admin":
                conn.close()
                self._set_headers(403)
                self.wfile.write(json.dumps({"error": "admin access required"}).encode("utf-8"))
                return

            cur.execute(
                "SELECT id, level FROM users WHERE username = ? AND role = 'student'",
                (student_username,),
            )
            student = cur.fetchone()
            if student is None:
                conn.close()
                self._set_headers(404)
                self.wfile.write(json.dumps({"error": "student user not found"}).encode("utf-8"))
                return

            level_label = str(student["level"] or "").strip()
            course, _ = normalize_level(level_label)
            lesson_count = COURSE_LESSON_COUNTS.get(course, 0)
            if lesson_count <= 0:
                conn.close()
                self._set_headers(400)
                self.wfile.write(json.dumps({"error": "student level is not assigned"}).encode("utf-8"))
                return

            if lesson_number > lesson_count:
                conn.close()
                self._set_headers(400)
                self.wfile.write(json.dumps({"error": "invalid lesson_number"}).encode("utf-8"))
                return

            cur.execute(
                """
                DELETE FROM quiz_answer_events
                WHERE user_id = ? AND course = ? AND lesson_number = ?
                """,
                (student["id"], course, lesson_number),
            )
            deleted_rows = cur.rowcount

            conn.commit()
            conn.close()

            self._set_headers(200)
            self.wfile.write(
                json.dumps(
                    {
                        "status": "reset",
                        "student_username": student_username,
                        "course": course,
                        "lesson_number": lesson_number,
                        "deleted_rows": int(deleted_rows or 0),
                    }
                ).encode("utf-8")
            )
            return

        if self.path == "/api/access/check":
            data = self._read_json()
            course_raw = str(data.get("course", "")).strip()
            course, _ = normalize_level(course_raw)
            lesson_number = int(data.get("lesson_number", 0))
            token = str(data.get("session_token", "")).strip()

            if OPEN_ACCESS:
                self._set_headers(200)
                self.wfile.write(json.dumps({"allowed": True, "guest_mode": True, "reason": "open_access"}).encode("utf-8"))
                return

            conn = get_connection()
            cur = conn.cursor()
            session_user = get_session_user(cur, token)
            conn.commit()
            conn.close()

            if session_user is None:
                if lesson_number <= 1:
                    self._set_headers(200)
                    self.wfile.write(json.dumps({"allowed": True, "guest_mode": True}).encode("utf-8"))
                    return
                self._set_headers(200)
                self.wfile.write(json.dumps({"allowed": False, "guest_mode": True, "reason": "login_required"}).encode("utf-8"))
                return

            user_level_raw = str(session_user["level"] or "").strip()
            user_level, _ = normalize_level(user_level_raw)
            user_role = (session_user["role"] or "").strip().lower()
            is_same_level = bool(user_level and course and user_level == course)

            subscription_expires_at = None
            subscription_expired = False
            if user_role not in ("admin", "mentor") and is_same_level:
                subscription_expires_at_dt = get_subscription_expires_at(session_user["created_at"])
                if subscription_expires_at_dt is not None:
                    subscription_expires_at = to_utc_iso(subscription_expires_at_dt)
                    subscription_expired = utc_now() > subscription_expires_at_dt

            if subscription_expired:
                self._set_headers(200)
                self.wfile.write(
                    json.dumps(
                        {
                            "allowed": False,
                            "guest_mode": False,
                            "reason": "subscription_expired",
                            "username": session_user["username"],
                            "role": session_user["role"],
                            "level": user_level_raw,
                            "subscription_expires_at": subscription_expires_at or "",
                        }
                    ).encode("utf-8")
                )
                return
            if user_role != "admin" and user_level and course and user_level != course and lesson_number > 1:
                self._set_headers(200)
                self.wfile.write(
                    json.dumps(
                        {
                            "allowed": False,
                            "guest_mode": False,
                            "reason": "level_mismatch",
                            "username": session_user["username"],
                            "role": session_user["role"],
                            "level": user_level_raw,
                            "subscription_expires_at": subscription_expires_at or "",
                        }
                    ).encode("utf-8")
                )
                return

            if user_role not in ("admin", "mentor") and is_same_level and lesson_number > 1:
                cur = None
                access_started_raw = session_user["access_started_at"] or session_user["created_at"]
                created_dt = parse_iso_datetime(access_started_raw)
                if created_dt is not None:
                    # Enforce sequential progression: only already completed lessons and the next required lesson
                    # can be opened (even if lessons are already unlocked by schedule).
                    conn = get_connection()
                    cur = conn.cursor()
                    cur.execute(
                        """
                        SELECT DISTINCT lesson_number
                        FROM task_completions
                        WHERE user_id = ? AND course = ? AND task_key = 'lesson_completed'
                        """,
                        (session_user["id"], course),
                    )
                    strict_completed = {int(row["lesson_number"]) for row in cur.fetchall()}
                    lesson_count = int(COURSE_LESSON_COUNTS.get(user_level, 0) or 0)
                    next_required = lesson_count + 1
                    if lesson_count > 0:
                        for n in range(1, lesson_count + 1):
                            if n not in strict_completed:
                                next_required = n
                                break
                    if lesson_number > next_required:
                        conn.close()
                        self._set_headers(200)
                        self.wfile.write(
                            json.dumps(
                                {
                                    "allowed": False,
                                    "guest_mode": False,
                                    "reason": "prerequisite",
                                    "username": session_user["username"],
                                    "role": session_user["role"],
                                    "level": user_level_raw,
                                    "required_lesson_number": int(next_required or 0),
                                    "subscription_expires_at": subscription_expires_at or "",
                                }
                            ).encode("utf-8")
                        )
                        return
                    # If user is trying to open the next required lesson or any already completed lesson,
                    # allow schedule check below to decide availability for the next required one.
                    conn.close()
                    schedule_raw = session_user["lesson_schedule"] if "lesson_schedule" in session_user.keys() else ""
                    access_started_local = get_schedule_anchor_dt(created_dt, user_level_raw, schedule_raw)
                    now_local = local_now()
                    available_lessons = get_available_lessons(
                        access_started_local,
                        user_level_raw,
                        schedule_raw,
                        now_local,
                    )
                    if lesson_number > available_lessons:
                        next_unlock_at_dt = get_lesson_unlock_at(
                            access_started_local,
                            user_level_raw,
                            schedule_raw,
                            lesson_number,
                        )
                        self._set_headers(200)
                        self.wfile.write(
                            json.dumps(
                                {
                                    "allowed": False,
                                    "guest_mode": False,
                                    "reason": "scheduled",
                                    "username": session_user["username"],
                                    "role": session_user["role"],
                                    "level": user_level_raw,
                                    "available_lessons": available_lessons,
                                    "next_unlock_at": to_utc_iso(to_utc(next_unlock_at_dt)) if next_unlock_at_dt else "",
                                    "lesson_schedule": get_user_schedule_key(user_level_raw, schedule_raw),
                                    "subscription_expires_at": subscription_expires_at or "",
                                }
                            ).encode("utf-8")
                        )
                        return

            self._set_headers(200)
            self.wfile.write(
                json.dumps(
                    {
                        "allowed": True,
                        "guest_mode": False,
                        "username": session_user["username"],
                        "role": session_user["role"],
                        "level": user_level_raw,
                        "subscription_expires_at": subscription_expires_at or "",
                    }
                ).encode("utf-8")
            )
            return

        if self.path == "/api/knowledge-test/submit":
            data = self._read_json()
            username = data.get("username", "").strip()
            total_questions = int(data.get("total_questions", 0))
            correct_answers = int(data.get("correct_answers", 0))
            score_points = int(data.get("score_points", 0))
            recommended_level = str(data.get("recommended_level", "")).strip().upper()

            if not username or total_questions <= 0 or correct_answers < 0 or score_points < 0 or not recommended_level:
                self._set_headers(400)
                self.wfile.write(
                    json.dumps(
                        {
                            "error": "username, total_questions, correct_answers, score_points and recommended_level are required"
                        }
                    ).encode("utf-8")
                )
                return

            if recommended_level not in {"A1", "A2", "B1", "B2"}:
                self._set_headers(400)
                self.wfile.write(json.dumps({"error": "invalid recommended_level"}).encode("utf-8"))
                return

            if correct_answers > total_questions:
                self._set_headers(400)
                self.wfile.write(json.dumps({"error": "correct_answers cannot exceed total_questions"}).encode("utf-8"))
                return

            conn = get_connection()
            cur = conn.cursor()
            cur.execute("SELECT id FROM users WHERE username = ?", (username,))
            user = cur.fetchone()
            if user is None:
                conn.close()
                self._set_headers(404)
                self.wfile.write(json.dumps({"error": "user not found"}).encode("utf-8"))
                return

            submitted_at = datetime.now(timezone.utc).isoformat()
            cur.execute(
                """
                INSERT INTO knowledge_test_attempts (
                    user_id, total_questions, correct_answers, score_points, recommended_level, submitted_at
                )
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (user["id"], total_questions, correct_answers, score_points, recommended_level, submitted_at),
            )
            attempt_id = cur.lastrowid
            conn.commit()
            conn.close()

            self._set_headers(200)
            self.wfile.write(
                json.dumps(
                    {
                        "status": "saved",
                        "attempt_id": attempt_id,
                        "username": username,
                        "total_questions": total_questions,
                        "correct_answers": correct_answers,
                        "score_points": score_points,
                        "recommended_level": recommended_level,
                        "submitted_at": submitted_at,
                    }
                ).encode("utf-8")
            )
            return

        if self.path == "/api/task/complete":
            data = self._read_json()
            username = data.get("username", "").strip()
            course = data.get("course", "").strip()
            lesson_number = int(data.get("lesson_number", 0))
            task_key = data.get("task_key", "").strip()

            if not username or not course or not lesson_number or not task_key:
                self._set_headers(400)
                self.wfile.write(
                    json.dumps({"error": "username, course, lesson_number, task_key are required"}).encode("utf-8")
                )
                return

            conn = get_connection()
            cur = conn.cursor()
            cur.execute("SELECT id FROM users WHERE username = ?", (username,))
            user = cur.fetchone()
            if user is None:
                conn.close()
                self._set_headers(404)
                self.wfile.write(json.dumps({"error": "user not found"}).encode("utf-8"))
                return

            cur.execute(
                """
                INSERT OR REPLACE INTO task_completions (id, user_id, course, lesson_number, task_key, completed_at)
                VALUES (
                    (SELECT id FROM task_completions WHERE user_id = ? AND course = ? AND lesson_number = ? AND task_key = ?),
                    ?, ?, ?, ?, ?
                )
                """,
                (
                    user["id"],
                    course,
                    lesson_number,
                    task_key,
                    user["id"],
                    course,
                    lesson_number,
                    task_key,
                    datetime.now(timezone.utc).isoformat(),
                ),
            )
            cur.execute(
                "SELECT id, level, lesson_schedule, created_at, access_started_at FROM users WHERE id = ?",
                (user["id"],),
            )
            user_row = cur.fetchone()
            if user_row is not None:
                build_progress_summary(cur, user_row)
            conn.commit()
            conn.close()

            self._set_headers(200)
            self.wfile.write(json.dumps({"status": "saved"}).encode("utf-8"))
            return

        if self.path == "/api/task/uncomplete":
            data = self._read_json()
            username = data.get("username", "").strip()
            course = data.get("course", "").strip()
            lesson_number = int(data.get("lesson_number", 0))
            task_key = data.get("task_key", "").strip()

            if not username or not course or not lesson_number or not task_key:
                self._set_headers(400)
                self.wfile.write(
                    json.dumps({"error": "username, course, lesson_number, task_key are required"}).encode("utf-8")
                )
                return

            conn = get_connection()
            cur = conn.cursor()
            cur.execute("SELECT id FROM users WHERE username = ?", (username,))
            user = cur.fetchone()
            if user is None:
                conn.close()
                self._set_headers(404)
                self.wfile.write(json.dumps({"error": "user not found"}).encode("utf-8"))
                return

            cur.execute(
                "DELETE FROM task_completions WHERE user_id = ? AND course = ? AND lesson_number = ? AND task_key = ?",
                (user["id"], course, lesson_number, task_key),
            )
            conn.commit()
            conn.close()
            self._set_headers(200)
            self.wfile.write(json.dumps({"status": "deleted"}).encode("utf-8"))
            return

        if self.path == "/api/quiz/submit":
            data = self._read_json()
            username = data.get("username", "").strip()
            course = data.get("course", "").strip().lower()
            lesson_number = int(data.get("lesson_number", 0))
            raw_answers = data.get("answers", [])
            raw_first_attempts = data.get("first_attempts", [])

            if (
                not username
                or not course
                or not lesson_number
                or not isinstance(raw_answers, list)
                or not isinstance(raw_first_attempts, list)
            ):
                self._set_headers(400)
                self.wfile.write(
                    json.dumps(
                        {"error": "username, course, lesson_number, answers and first_attempts are required"}
                    ).encode("utf-8")
                )
                return

            questions = load_quiz_questions(course, lesson_number)
            if questions is None:
                self._set_headers(404)
                self.wfile.write(json.dumps({"error": "quiz not found"}).encode("utf-8"))
                return

            user_answers = {}
            for item in raw_answers:
                if not isinstance(item, dict):
                    continue
                try:
                    qid = int(item.get("question_id", 0))
                except (TypeError, ValueError):
                    continue
                selected = str(item.get("selected_option", "")).strip().upper()
                if qid > 0 and selected in {"A", "B", "C", "D"}:
                    user_answers[qid] = selected

            evaluated_answers = []
            correct_count = 0
            question_map = {int(item["id"]): item for item in questions}
            for question in questions:
                qid = question["id"]
                correct_option = question["correct"]
                selected_option = user_answers.get(qid, "")
                is_correct = int(selected_option == correct_option)
                correct_count += is_correct
                evaluated_answers.append(
                    {
                        "question_id": qid,
                        "selected_option": selected_option,
                        "correct_option": correct_option,
                        "is_correct": is_correct,
                    }
                )

            first_attempt_answers = {}
            for item in raw_first_attempts:
                if not isinstance(item, dict):
                    continue
                try:
                    qid = int(item.get("question_id", 0))
                except (TypeError, ValueError):
                    continue
                selected = str(item.get("selected_option", "")).strip().upper()
                if (
                    qid > 0
                    and selected in {"A", "B", "C", "D"}
                    and qid in question_map
                    and qid not in first_attempt_answers
                ):
                    first_attempt_answers[qid] = selected

            conn = get_connection()
            cur = conn.cursor()
            cur.execute("SELECT id FROM users WHERE username = ?", (username,))
            user = cur.fetchone()
            if user is None:
                conn.close()
                self._set_headers(404)
                self.wfile.write(json.dumps({"error": "user not found"}).encode("utf-8"))
                return

            submitted_at = datetime.now(timezone.utc).isoformat()
            cur.execute(
                """
                INSERT INTO quiz_attempts (user_id, course, lesson_number, total_questions, correct_answers, submitted_at)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (user["id"], course, lesson_number, len(questions), correct_count, submitted_at),
            )
            attempt_id = cur.lastrowid

            cur.executemany(
                """
                INSERT INTO quiz_answers (attempt_id, question_id, selected_option, correct_option, is_correct)
                VALUES (?, ?, ?, ?, ?)
                """,
                [
                    (
                        attempt_id,
                        answer["question_id"],
                        answer["selected_option"],
                        answer["correct_option"],
                        answer["is_correct"],
                    )
                    for answer in evaluated_answers
                ],
            )

            # Auto-reset lesson progress for this user when a new run starts.
            # New run is identified by the presence of the first question in first_attempts.
            first_question_id = min(question_map.keys()) if question_map else 0
            should_reset_progress = first_question_id > 0 and first_question_id in first_attempt_answers
            if should_reset_progress:
                cur.execute(
                    """
                    DELETE FROM quiz_answer_events
                    WHERE user_id = ? AND course = ? AND lesson_number = ?
                    """,
                    (user["id"], course, lesson_number),
                )

            cur.executemany(
                """
                INSERT OR IGNORE INTO quiz_answer_events (
                    user_id, course, lesson_number, question_id, selected_option, is_correct, created_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                [
                    (
                        user["id"],
                        course,
                        lesson_number,
                        qid,
                        selected,
                        int(selected == str(question_map[qid]["correct"]).strip().upper()),
                        submitted_at,
                    )
                    for qid, selected in first_attempt_answers.items()
                ],
            )
            cur.execute(
                "SELECT id, full_name, level, lesson_schedule, created_at, access_started_at FROM users WHERE id = ?",
                (user["id"],),
            )
            user_row = cur.fetchone()
            if user_row is not None:
                build_progress_summary(cur, user_row)
            conn.commit()

            # Notify parents about quiz result (after commit, before close)
            student_full_name = str(user_row["full_name"] if user_row else "").strip() or username
            conn.close()
            if len(questions) > 0:
                pct = round(correct_count / len(questions) * 100)
                course_label = format_course_label(course)
                notify_parents(
                    int(user["id"]),
                    f"📊 Ваш ребёнок {student_full_name} выполнил задания {course_label} урока {lesson_number} на {pct}%.\n"
                    f"Правильных ответов: {correct_count} из {len(questions)}.",
                )

            self._set_headers(200)
            self.wfile.write(
                json.dumps(
                    {
                        "status": "saved",
                        "attempt_id": attempt_id,
                        "total_questions": len(questions),
                        "correct_answers": correct_count,
                        "submitted_at": submitted_at,
                    }
                ).encode("utf-8")
            )
            return

        if self.path == "/api/mentor/homework/review":
            data = self._read_json()
            username = str(data.get("username", "")).strip()
            try:
                submission_id = int(data.get("submission_id", 0))
            except (TypeError, ValueError):
                submission_id = 0
            try:
                score = int(data.get("score", 0))
            except (TypeError, ValueError):
                score = 0
            comment = str(data.get("comment", "")).strip()

            if not username or submission_id <= 0 or score < 1 or score > 5:
                self._set_headers(400)
                self.wfile.write(
                    json.dumps({"error": "username, submission_id and score (1-5) are required"}).encode("utf-8")
                )
                return

            conn = get_connection()
            cur = conn.cursor()
            cur.execute("SELECT id, role, level FROM users WHERE username = ?", (username,))
            mentor_user = cur.fetchone()
            if mentor_user is None:
                conn.close()
                self._set_headers(404)
                self.wfile.write(json.dumps({"error": "user not found"}).encode("utf-8"))
                return
            if str(mentor_user["role"] or "").strip().lower() != "mentor":
                conn.close()
                self._set_headers(403)
                self.wfile.write(json.dumps({"error": "mentor access required"}).encode("utf-8"))
                return

            cur.execute(
                """
                SELECT
                    hs.id,
                    hs.user_id,
                    hs.course,
                    hs.lesson_number,
                    u.username AS student_username,
                    u.level AS student_level,
                    u.mentor_id AS student_mentor_id
                FROM homework_submissions hs
                JOIN users u ON u.id = hs.user_id
                WHERE hs.id = ?
                """,
                (submission_id,),
            )
            row = cur.fetchone()
            if row is None:
                conn.close()
                self._set_headers(404)
                self.wfile.write(json.dumps({"error": "submission not found"}).encode("utf-8"))
                return

            mentor_course, _ = normalize_level(str(mentor_user["level"] or "").strip())
            student_course, _ = normalize_level(str(row["student_level"] or "").strip())
            if mentor_course and student_course and mentor_course != student_course:
                conn.close()
                self._set_headers(403)
                self.wfile.write(json.dumps({"error": "level mismatch"}).encode("utf-8"))
                return

            mentor_profile_id = resolve_mentor_profile_id(cur, mentor_user)
            student_mentor_id = int((row["student_mentor_id"] or 0) or 0)
            if mentor_profile_id > 0 and student_mentor_id > 0 and student_mentor_id != mentor_profile_id:
                conn.close()
                self._set_headers(403)
                self.wfile.write(json.dumps({"error": "student is not assigned to this mentor"}).encode("utf-8"))
                return

            reviewed_at = datetime.now(timezone.utc).isoformat()
            cur.execute(
                """
                UPDATE homework_submissions
                SET status = ?,
                    feedback_text = ?,
                    reviewer_username = ?,
                    reviewed_at = ?,
                    score = ?,
                    student_seen_at = '',
                    mentor_seen_at = CASE
                        WHEN mentor_seen_at IS NULL OR mentor_seen_at = '' THEN ?
                        ELSE mentor_seen_at
                    END
                WHERE id = ?
                """,
                ("checked", comment, username, reviewed_at, score, reviewed_at, submission_id),
            )
            # Mark all submissions for this lesson as seen by the mentor, so badge counts represent
            # lessons pending review (not older submissions that the mentor has already handled).
            cur.execute(
                """
                UPDATE homework_submissions
                SET mentor_seen_at = CASE
                    WHEN mentor_seen_at IS NULL OR mentor_seen_at = '' THEN ?
                    ELSE mentor_seen_at
                END
                WHERE user_id = ?
                  AND course = ?
                  AND lesson_number = ?
                """,
                (reviewed_at, row["user_id"], row["course"], row["lesson_number"]),
            )

            # Fetch student full_name for parent notification
            cur.execute("SELECT full_name FROM users WHERE id = ?", (row["user_id"],))
            student_name_row = cur.fetchone()
            student_full_name = str(student_name_row["full_name"] if student_name_row else "").strip()

            conn.commit()
            conn.close()

            # Notify parents about homework grade
            if student_full_name:
                course_label = format_course_label(str(row["course"] or ""))
                lesson_num = int(row["lesson_number"])
                score_stars = "⭐" * score
                notify_parents(
                    int(row["user_id"]),
                    f"📝 Ваш ребёнок {student_full_name} получил оценку {score}/5 {score_stars} "
                    f"за домашнее задание {course_label} урока {lesson_num}."
                    + (f"\n💬 Комментарий: {comment}" if comment else ""),
                )

            self._set_headers(200)
            self.wfile.write(
                json.dumps({"status": "saved", "id": submission_id, "score": score, "reviewed_at": reviewed_at}).encode(
                    "utf-8"
                )
            )
            return

        if self.path == "/api/student/notifications/mark-seen":
            data = self._read_json()
            username = str(data.get("username", "")).strip()
            submission_ids_raw = data.get("submission_ids", None)
            mark_all = bool(data.get("all", False))
            if not username:
                self._set_headers(400)
                self.wfile.write(json.dumps({"error": "username is required"}).encode("utf-8"))
                return
 
            submission_ids: list[int] = []
            if isinstance(submission_ids_raw, list):
                for value in submission_ids_raw:
                    try:
                        submission_ids.append(int(value))
                    except (TypeError, ValueError):
                        continue
            submission_ids = [sid for sid in submission_ids if sid > 0]

            conn = get_connection()
            cur = conn.cursor()
            cur.execute("SELECT id, role FROM users WHERE username = ?", (username,))
            user = cur.fetchone()
            if user is None:
                conn.close()
                self._set_headers(404)
                self.wfile.write(json.dumps({"error": "user not found"}).encode("utf-8"))
                return
            if str(user["role"] or "").strip().lower() != "student":
                conn.close()
                self._set_headers(403)
                self.wfile.write(json.dumps({"error": "student access required"}).encode("utf-8"))
                return

            seen_at = datetime.now(timezone.utc).isoformat()
            updated = 0
            if mark_all or not submission_ids:
                cur.execute(
                    """
                    UPDATE homework_submissions
                    SET student_seen_at = ?
                    WHERE user_id = ?
                      AND status = 'checked'
                      AND reviewed_at IS NOT NULL
                      AND reviewed_at != ''
                      AND (student_seen_at IS NULL OR student_seen_at = '')
                    """,
                    (seen_at, user["id"]),
                )
                updated = int(cur.rowcount or 0)
            else:
                placeholders = ", ".join(["?"] * len(submission_ids))
                params = [seen_at, user["id"], *submission_ids]
                cur.execute(
                    f"""
                    UPDATE homework_submissions
                    SET student_seen_at = ?
                    WHERE user_id = ?
                      AND id IN ({placeholders})
                      AND status = 'checked'
                      AND reviewed_at IS NOT NULL
                      AND reviewed_at != ''
                      AND (student_seen_at IS NULL OR student_seen_at = '')
                    """,
                    params,
                )
                updated = int(cur.rowcount or 0)

            conn.commit()
            conn.close()
            self._set_headers(200)
            self.wfile.write(json.dumps({"status": "ok", "updated": updated}).encode("utf-8"))
            return

        if self.path == "/api/homework/submit":
            data = self._read_json()
            username = str(data.get("username", "")).strip()
            course_raw = str(data.get("course", "")).strip().lower()
            course, _ = normalize_level(course_raw)
            lesson_number = int(data.get("lesson_number", 0))
            submission_text = str(data.get("text", "")).strip()
            file_name = str(data.get("file_name", "")).strip()
            file_data = str(data.get("file_data", "")).strip()
            file_type = str(data.get("file_type", "")).strip()
            files_raw = data.get("files", None)

            if not username or not course or lesson_number <= 0 or not submission_text:
                self._set_headers(400)
                self.wfile.write(
                    json.dumps({"error": "username, course, lesson_number and text are required"}).encode("utf-8")
                )
                return

            if course not in COURSE_LESSON_COUNTS:
                self._set_headers(400)
                self.wfile.write(json.dumps({"error": "invalid course"}).encode("utf-8"))
                return

            conn = get_connection()
            cur = conn.cursor()
            cur.execute("SELECT id FROM users WHERE username = ?", (username,))
            user = cur.fetchone()
            if user is None:
                conn.close()
                self._set_headers(404)
                self.wfile.write(json.dumps({"error": "user not found"}).encode("utf-8"))
                return

            stored_path = ""
            original_name = ""
            mime_type = ""
            stored_paths: list[str] = []
            original_names: list[str] = []
            mime_types: list[str] = []

            submitted_at = datetime.now(timezone.utc).isoformat()

            attachments: list[dict] = []
            if isinstance(files_raw, list) and files_raw:
                for entry in files_raw[:20]:
                    if not isinstance(entry, dict):
                        continue
                    entry_name = str(entry.get("file_name", "")).strip()
                    entry_data = str(entry.get("file_data", "")).strip()
                    entry_type = str(entry.get("file_type", "")).strip()
                    if not entry_name or not entry_data:
                        conn.close()
                        self._set_headers(400)
                        self.wfile.write(json.dumps({"error": "file_name and file_data are required"}).encode("utf-8"))
                        return
                    attachments.append({"file_name": entry_name, "file_data": entry_data, "file_type": entry_type})
            elif file_name or file_data:
                if not file_name or not file_data:
                    conn.close()
                    self._set_headers(400)
                    self.wfile.write(json.dumps({"error": "file_name and file_data are required together"}).encode("utf-8"))
                    return
                attachments.append({"file_name": file_name, "file_data": file_data, "file_type": file_type})

            if attachments:
                uploads_dir = DEFAULT_DB_DIR / "uploads" / "homework"
                uploads_dir.mkdir(parents=True, exist_ok=True)

                timestamp = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")
                nonce = secrets.token_hex(4)

                for index, attach in enumerate(attachments):
                    entry_name = str(attach.get("file_name", "")).strip()
                    entry_data = str(attach.get("file_data", "")).strip()
                    entry_type = str(attach.get("file_type", "")).strip()

                    ext = Path(entry_name).suffix.lower()
                    if ext and ext not in HOMEWORK_ALLOWED_EXTENSIONS:
                        conn.close()
                        self._set_headers(400)
                        self.wfile.write(json.dumps({"error": "file type is not allowed"}).encode("utf-8"))
                        return

                    try:
                        header, b64_data = entry_data.split(",", 1)
                    except ValueError:
                        header = ""
                        b64_data = entry_data

                    try:
                        file_bytes = base64.b64decode(b64_data)
                    except (ValueError, TypeError):
                        conn.close()
                        self._set_headers(400)
                        self.wfile.write(json.dumps({"error": "invalid file_data"}).encode("utf-8"))
                        return

                    if len(file_bytes) > HOMEWORK_MAX_BYTES:
                        conn.close()
                        self._set_headers(400)
                        self.wfile.write(json.dumps({"error": "file is too large"}).encode("utf-8"))
                        return

                    entry_mime = ""
                    if header.startswith("data:") and ";" in header:
                        entry_mime = header[5:].split(";")[0].strip()
                    if not entry_mime:
                        guessed_type, _ = mimetypes.guess_type(entry_name)
                        entry_mime = guessed_type or entry_type or ""

                    safe_name = re.sub(r"[^A-Za-z0-9._-]", "_", entry_name)[:120] or "homework"
                    stored_name = f"{username}_{course}_{lesson_number}_{timestamp}_{nonce}_{index + 1}_{safe_name}"
                    file_path = uploads_dir / stored_name
                    try:
                        file_path.write_bytes(file_bytes)
                    except OSError:
                        conn.close()
                        self._set_headers(500)
                        self.wfile.write(json.dumps({"error": "failed to save file"}).encode("utf-8"))
                        return

                    stored_paths.append(str(file_path))
                    original_names.append(entry_name)
                    mime_types.append(entry_mime)

                if stored_paths:
                    stored_path = stored_paths[0]
                    original_name = original_names[0] if original_names else ""
                    mime_type = mime_types[0] if mime_types else ""

            cur.execute(
                "SELECT id FROM homework_submissions WHERE user_id = ? AND course = ? AND lesson_number = ? LIMIT 1",
                (user["id"], course, lesson_number),
            )
            if cur.fetchone() is not None:
                conn.close()
                self._set_headers(409)
                self.wfile.write(json.dumps({"error": "homework already submitted"}).encode("utf-8"))
                return

            cur.execute(
                """
                INSERT INTO homework_submissions (
                    user_id, course, lesson_number, submission_text,
                    file_path, original_name, mime_type,
                    archive_path, archive_name, mentor_seen_at,
                    status,
                    feedback_text, reviewer_username, submitted_at, reviewed_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, '', '', '', 'new', '', '', ?, '')
                """,
                (
                    user["id"],
                    course,
                    lesson_number,
                    submission_text,
                    stored_path,
                    original_name,
                    mime_type,
                    submitted_at,
                ),
            )
            submission_id = cur.lastrowid

            archive_path = ""
            archive_name = ""
            try:
                archives_dir = (
                    DEFAULT_DB_DIR
                    / "uploads"
                    / "homework_archives"
                    / re.sub(r"[^A-Za-z0-9._-]", "_", username)[:80]
                    / course
                    / f"lesson_{lesson_number}"
                )
                archives_dir.mkdir(parents=True, exist_ok=True)
                timestamp = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")
                archive_name = f"homework_{course}_lesson{lesson_number}_{submission_id}_{timestamp}.zip"
                archive_path_obj = archives_dir / archive_name

                homework_txt = (
                    f"Student: {username}\n"
                    f"Course: {course}\n"
                    f"Lesson: {lesson_number}\n"
                    f"Submitted at (UTC): {submitted_at}\n"
                    "\n"
                    f"{submission_text}\n"
                )
                with zipfile.ZipFile(archive_path_obj, "w", compression=zipfile.ZIP_DEFLATED) as zf:
                    zf.writestr("homework.txt", homework_txt)
                    if stored_paths:
                        for idx, path_str in enumerate(stored_paths):
                            try:
                                attach_path = Path(path_str)
                                attach_original = original_names[idx] if idx < len(original_names) else attach_path.name
                                safe_attach_name = re.sub(r"[^A-Za-z0-9._-]", "_", attach_original)[:120] or "attachment"
                                prefix = f"{idx + 1:02d}_" if len(stored_paths) > 1 else ""
                                zf.write(attach_path, arcname=f"attachment/{prefix}{safe_attach_name}")
                            except OSError:
                                # If attachment is missing, keep the archive with text.
                                pass
                archive_path = str(archive_path_obj)
            except Exception:
                archive_path = ""
                archive_name = ""

            if archive_path:
                cur.execute(
                    "UPDATE homework_submissions SET archive_path = ?, archive_name = ? WHERE id = ?",
                    (archive_path, archive_name, submission_id),
                )
            conn.commit()
            conn.close()

            self._set_headers(201)
            self.wfile.write(
                json.dumps(
                    {
                        "status": "submitted",
                        "id": submission_id,
                        "submitted_at": submitted_at,
                        "archive_ready": bool(archive_path),
                    }
                ).encode("utf-8")
            )
            return

        if self.path == "/api/quiz/answer-event":
            # Temporarily disabled while View Progress is being reworked.
            self._set_headers(503)
            self.wfile.write(json.dumps({"error": "view_progress_temporarily_disabled"}).encode("utf-8"))
            return

            data = self._read_json()
            username = data.get("username", "").strip()
            course = data.get("course", "").strip().lower()
            lesson_number = int(data.get("lesson_number", 0))
            question_id = int(data.get("question_id", 0))
            selected_option = str(data.get("selected_option", "")).strip().upper()

            if not username or not course or lesson_number <= 0:
                self._set_headers(400)
                self.wfile.write(
                    json.dumps({"error": "username, course and lesson_number are required"}).encode("utf-8")
                )
                return

            if course not in COURSE_LESSON_COUNTS:
                self._set_headers(400)
                self.wfile.write(json.dumps({"error": "invalid course"}).encode("utf-8"))
                return

            if question_id <= 0 or selected_option not in {"A", "B", "C", "D"}:
                self._set_headers(400)
                self.wfile.write(json.dumps({"error": "question_id and selected_option are required"}).encode("utf-8"))
                return

            questions = load_quiz_questions(course, lesson_number)
            if questions is None:
                self._set_headers(404)
                self.wfile.write(json.dumps({"error": "quiz not found"}).encode("utf-8"))
                return

            question = next((item for item in questions if int(item.get("id", 0)) == question_id), None)
            if question is None:
                self._set_headers(400)
                self.wfile.write(json.dumps({"error": "invalid question_id"}).encode("utf-8"))
                return

            is_correct = int(selected_option == str(question.get("correct", "")).strip().upper())

            conn = get_connection()
            cur = conn.cursor()
            cur.execute("SELECT id FROM users WHERE username = ?", (username,))
            user = cur.fetchone()
            if user is None:
                conn.close()
                self._set_headers(404)
                self.wfile.write(json.dumps({"error": "user not found"}).encode("utf-8"))
                return

            cur.execute(
                """
                INSERT OR IGNORE INTO quiz_answer_events (
                    user_id, course, lesson_number, question_id, selected_option, is_correct, created_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (user["id"], course, lesson_number, question_id, selected_option, is_correct, datetime.now(timezone.utc).isoformat()),
            )
            inserted = cur.rowcount == 1
            conn.commit()
            conn.close()

            self._set_headers(200)
            self.wfile.write(
                json.dumps(
                    {
                        "status": "saved" if inserted else "duplicate",
                        "recorded": inserted,
                        "is_correct": bool(is_correct),
                    }
                ).encode("utf-8")
            )
            return

        self._set_headers(404)
        self.wfile.write(json.dumps({"error": "not found"}).encode("utf-8"))


def main():
    import argparse

    parser = argparse.ArgumentParser(description="EWMS API server")
    parser.add_argument("--host", default=HOST)
    parser.add_argument("--port", type=int, default=PORT)
    args = parser.parse_args()

    init_db()
    server = ThreadingHTTPServer((args.host, args.port), Handler)
    print(f"API server running on http://{args.host}:{args.port}")
    print(f"Admin login: {ADMIN_USERNAME}")
    server.serve_forever()


if __name__ == "__main__":
    main()
