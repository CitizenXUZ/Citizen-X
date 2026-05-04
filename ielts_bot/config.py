import os
import shutil
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent


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


def parse_id_list(raw: str):
    ids = set()
    for token in str(raw or "").replace(",", " ").split():
        token = token.strip()
        if not token:
            continue
        try:
            ids.add(int(token))
        except ValueError:
            continue
    return ids


TG_BOT_TOKEN = os.environ.get("TG_BOT_TOKEN", "").strip()
if not TG_BOT_TOKEN:
    raise SystemExit("TG_BOT_TOKEN is not set. Set it and restart the bot.")

BOT_NAME = os.environ.get("BOT_NAME", "English with Mr.Sam")
DEFAULT_LANGUAGE = os.environ.get("BOT_DEFAULT_LANG", "ru").strip().lower() or "ru"
if DEFAULT_LANGUAGE not in ("ru", "en"):
    DEFAULT_LANGUAGE = "ru"
DEFAULT_NEWS_LIMIT = int(os.environ.get("BOT_NEWS_LIMIT", "5") or 5)
LONG_POLL_TIMEOUT = int(os.environ.get("BOT_LONG_POLL_TIMEOUT", "30") or 30)
SITE_API_URL = os.environ.get("SITE_API_URL", "http://127.0.0.1:8000").rstrip("/")
SITE_WEB_URL = os.environ.get("SITE_WEB_URL", SITE_API_URL).rstrip("/")
SITE_ADMIN_USERNAME = os.environ.get("SITE_ADMIN_USERNAME", "azamat_admin").strip()
BOT_SYNC_TOKEN = os.environ.get("BOT_SYNC_TOKEN", "").strip()
LESSON_NOTIFY_ENABLED = os.environ.get("BOT_LESSON_NOTIFY", "1").strip().lower() not in {"0", "false", "no", "off"}
LESSON_NOTIFY_WINDOW_MIN = int(os.environ.get("BOT_LESSON_NOTIFY_WINDOW_MIN", "60") or 60)
LESSON_NOTIFY_POLL_SECONDS = int(os.environ.get("BOT_LESSON_NOTIFY_POLL_SECONDS", "300") or 300)
LESSON_NOTIFY_QUIET_START = os.environ.get("BOT_LESSON_NOTIFY_QUIET_START", "22:00").strip()
LESSON_NOTIFY_QUIET_END = os.environ.get("BOT_LESSON_NOTIFY_QUIET_END", "08:00").strip()
LESSON_NOTIFY_TIMEZONE = os.environ.get("BOT_LESSON_NOTIFY_TIMEZONE", "Asia/Tashkent").strip()
ADMIN_NOTIFY_ENABLED = os.environ.get("BOT_ADMIN_NOTIFY", "1").strip().lower() not in {"0", "false", "no", "off"}
ADMIN_NOTIFY_POLL_SECONDS = int(os.environ.get("BOT_ADMIN_NOTIFY_POLL_SECONDS", "300") or 300)
BOT_COVER_URL = os.environ.get(
    "BOT_COVER_URL",
    "https://i.pinimg.com/736x/a6/06/9e/a6069e71f6e0be7c66d24ee793f81729.jpg",
).strip()
PROFILE_COVER_URL = os.environ.get("BOT_PROFILE_COVER_URL", BOT_COVER_URL).strip()

ADMIN_IDS = parse_id_list(os.environ.get("TG_ADMIN_IDS", ""))
MENTOR_IDS = parse_id_list(os.environ.get("TG_MENTOR_IDS", ""))

LEGACY_DB_PATH = BASE_DIR.parent / "backend" / "database.db"
DEFAULT_DB_DIR = Path(os.environ.get("EWMS_DB_DIR") or (Path.home() / ".ewms"))
DEFAULT_DB_DIR.mkdir(parents=True, exist_ok=True)
DB_PATH = DEFAULT_DB_DIR / "database.db"
if LEGACY_DB_PATH.exists() and not DB_PATH.exists():
    try:
        shutil.copy2(LEGACY_DB_PATH, DB_PATH)
    except OSError:
        pass
