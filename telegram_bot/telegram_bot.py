import json
import os
import shutil
import sqlite3
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
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
LEGACY_DB_PATH = BASE_DIR.parent / "backend" / "database.db"
DEFAULT_DB_DIR = Path(os.environ.get("EWMS_DB_DIR") or (Path.home() / ".ewms"))
DEFAULT_DB_DIR.mkdir(parents=True, exist_ok=True)
DB_PATH = DEFAULT_DB_DIR / "database.db"
if LEGACY_DB_PATH.exists() and not DB_PATH.exists():
    try:
        shutil.copy2(LEGACY_DB_PATH, DB_PATH)
    except OSError:
        pass


BOT_NAME = "IELTS Bot"
DEFAULT_NEWS_LIMIT = 5
LONG_POLL_TIMEOUT = 30
SITE_API_URL = os.environ.get("SITE_API_URL", "http://127.0.0.1:8000").rstrip("/")
SITE_WEB_URL = os.environ.get("SITE_WEB_URL", "http://127.0.0.1:8020").rstrip("/")
BOT_SYNC_TOKEN = os.environ.get("BOT_SYNC_TOKEN", "").strip()


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

ADMIN_IDS = parse_id_list(os.environ.get("TG_ADMIN_IDS", ""))
MENTOR_IDS = parse_id_list(os.environ.get("TG_MENTOR_IDS", ""))

API_ROOT = f"https://api.telegram.org/bot{TG_BOT_TOKEN}/"


def utc_now():
    return datetime.now(timezone.utc).isoformat()


def escape_html(value: str) -> str:
    return (
        str(value or "")
        .replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
    )

EXPRESS_LEVEL_SUFFIXES = ("-express", " express", "_express")


def normalize_level(value: str):
    raw = str(value or "").strip().lower()
    is_express = False
    for suffix in EXPRESS_LEVEL_SUFFIXES:
        if raw.endswith(suffix):
            raw = raw[: -len(suffix)].strip()
            is_express = True
            break
    return raw, is_express


def first_name_only(full_name: str) -> str:
    raw = str(full_name or "").strip()
    if not raw:
        return ""
    return raw.split()[0]


def send_photo(chat_id: int, photo: str, caption: str = "", reply_markup=None):
    payload = {
        "chat_id": chat_id,
        "photo": str(photo or "").strip(),
        "parse_mode": "HTML",
    }
    if caption:
        payload["caption"] = caption
    if reply_markup is not None:
        payload["reply_markup"] = json.dumps(reply_markup, ensure_ascii=False)
    return api_call("sendPhoto", payload)


def api_call(method: str, params: dict):
    data = urllib.parse.urlencode(params).encode("utf-8")
    req = urllib.request.Request(API_ROOT + method, data=data)
    try:
        with urllib.request.urlopen(req, timeout=60) as response:
            payload = response.read().decode("utf-8", errors="ignore")
    except urllib.error.URLError:
        return None
    try:
        data = json.loads(payload)
    except json.JSONDecodeError:
        return None
    if not data.get("ok"):
        return None
    return data.get("result")


def send_message(chat_id: int, text: str, reply_markup=None):
    payload = {
        "chat_id": chat_id,
        "text": text,
        "parse_mode": "HTML",
        "disable_web_page_preview": True,
    }
    if reply_markup is not None:
        payload["reply_markup"] = json.dumps(reply_markup, ensure_ascii=False)
    return api_call("sendMessage", payload)

def edit_message_text(chat_id: int, message_id: int, text: str, reply_markup=None):
    payload = {
        "chat_id": chat_id,
        "message_id": message_id,
        "text": text,
        "parse_mode": "HTML",
        "disable_web_page_preview": True,
    }
    if reply_markup is not None:
        payload["reply_markup"] = json.dumps(reply_markup, ensure_ascii=False)
    return api_call("editMessageText", payload)


def edit_message_reply_markup(chat_id: int, message_id: int, reply_markup=None):
    payload = {"chat_id": chat_id, "message_id": message_id}
    if reply_markup is not None:
        payload["reply_markup"] = json.dumps(reply_markup, ensure_ascii=False)
    return api_call("editMessageReplyMarkup", payload)


def answer_callback_query(callback_query_id: str, text: str = "", show_alert: bool = False):
    payload = {"callback_query_id": callback_query_id}
    if text:
        payload["text"] = text
    if show_alert:
        payload["show_alert"] = True
    return api_call("answerCallbackQuery", payload)


def build_inline_keyboard(rows):
    return {"inline_keyboard": rows}


def build_start_inline_keyboard():
    return build_inline_keyboard([[{"text": "Профиль", "callback_data": "nav:profile"}, {"text": "Меню", "callback_data": "nav:menu"}]])


def build_profile_keyboard():
    return build_inline_keyboard(
        [
            [{"text": "⬅️ Назад", "callback_data": "prof:back_menu"}],
            [{"text": "🏆 Список лидеров", "callback_data": "prof:leaders"}, {"text": "🧑‍🏫 Ментор", "callback_data": "prof:mentor"}],
        ]
    )


def build_back_to_profile_keyboard():
    return build_inline_keyboard([[{"text": "⬅️ Назад", "callback_data": "prof:back_profile"}]])


def build_menu_inline_keyboard(role: str):
    rows = [
        [{"text": "Новости", "callback_data": "act:news"}, {"text": "Материал дня", "callback_data": "act:daily"}],
        [{"text": "Совет IELTS", "callback_data": "act:tip"}, {"text": "Рекомендации", "callback_data": "act:recommend"}],
        [{"text": "Уровень", "callback_data": "act:level"}, {"text": "Помощь", "callback_data": "act:help"}],
    ]
    lowered = str(role or "").lower()
    if lowered == "admin":
        rows.append([{"text": "Админ-панель", "callback_data": "act:admin"}])
    if lowered == "mentor":
        rows.append([{"text": "Окно ментора", "callback_data": "act:mentor"}])
    rows.append([{"text": "Закрыть", "callback_data": "nav:close"}])
    return build_inline_keyboard(rows)


def build_full_menu_inline_keyboard(role: str):
    rows = [
        [{"text": "📅 Календарь уроков", "callback_data": "menu:calendar"}, {"text": "👨‍👩‍👧 Родители", "callback_data": "menu:parents"}],
        [{"text": "💡 Совет IELTS", "callback_data": "menu:tip"}, {"text": "🎯 Рекомендации", "callback_data": "menu:recommend"}],
        [{"text": "🌐 Язык", "callback_data": "menu:lang"}, {"text": "❓ Помощь", "callback_data": "menu:help"}],
        [{"text": "⬅️ Назад", "callback_data": "menu:back"}],
    ]
    return build_inline_keyboard(rows)


def humanize_duration_ru(seconds: int) -> str:
    seconds = int(seconds or 0)
    if seconds <= 0:
        return "сейчас"
    minutes = seconds // 60
    hours = minutes // 60
    days = hours // 24
    if days > 0:
        rem_h = hours % 24
        return f"{days}д {rem_h}ч"
    if hours > 0:
        rem_m = minutes % 60
        return f"{hours}ч {rem_m}м"
    if minutes > 0:
        rem_s = seconds % 60
        return f"{minutes}м {rem_s}с"
    return f"{seconds}с"


def get_profile_summary_for_chat(chat_id: int):
    user = get_bot_user(chat_id) or {}
    phone = str(user.get("phone") or "").strip()
    if not phone:
        return 401, {"error": "not_logged_in"}
    return site_get_json("/api/bot/profile", {"phone": phone})


def get_phone_for_chat(chat_id: int) -> str:
    user = get_bot_user(chat_id) or {}
    return str(user.get("phone") or "").strip()


def get_existing_parent(phone: str, relation: str):
    status, payload = site_get_json("/api/bot/parents", {"phone": phone})
    if status != 200 or not isinstance(payload, dict):
        return None
    items = payload.get("items")
    if not isinstance(items, list):
        return None
    for item in items:
        if not isinstance(item, dict):
            continue
        if str(item.get("relation") or "").strip().lower() == str(relation or "").strip().lower():
            return item
    return None


def upsert_parent(phone: str, relation: str, first_name: str, last_name: str, parent_phone: str):
    payload = {
        "phone": phone,
        "relation": relation,
        "first_name": first_name,
        "last_name": last_name,
        "parent_phone": parent_phone,
    }
    if BOT_SYNC_TOKEN:
        payload["token"] = BOT_SYNC_TOKEN
    return site_post_json("/api/bot/parents/upsert", payload)


def render_calendar_page(summary: dict, page: int, page_size: int = 6):
    total_lessons = int(summary.get("total_lessons") or 0)
    available_lessons = int(summary.get("available_lessons") or 0)
    completed = set(int(x) for x in (summary.get("completed_lessons_strict_list") or []) if str(x).isdigit())
    next_required = int(summary.get("next_required_lesson_number") or 0)
    next_unlock_seconds = int(summary.get("next_lesson_unlock_seconds") or 0)
    next_after_open_unlock_seconds = int(summary.get("next_unlock_seconds") or 0)
    course, _ = normalize_level(str(summary.get("level") or "").strip())

    page = max(0, int(page or 0))
    start = page * page_size + 1
    end = min(total_lessons, start + page_size - 1)
    if total_lessons <= 0:
        return "📅 <b>Календарь уроков</b>\n\nУ вас пока не назначен уровень.", 0, False, False

    titles = {}
    if course:
        status, payload = site_get_json("/api/lessons/meta-range", {"course": course, "from": str(start), "to": str(end)})
        if status == 200 and isinstance(payload, dict):
            raw = payload.get("items")
            if isinstance(raw, dict):
                titles = {int(k): str(v) for k, v in raw.items() if str(k).isdigit()}

    lines = [f"📅 <b>Календарь уроков</b>", f"Уровень: <b>{escape_html(str(summary.get('level') or '').strip())}</b>", ""]
    next_after_open_lesson = available_lessons + 1 if available_lessons > 0 else 1
    for lesson in range(start, end + 1):
        theme = str(titles.get(lesson) or "").replace("Theme: ", "").strip()
        theme_part = f" — <i>{escape_html(theme)}</i>" if theme else ""
        if lesson in completed:
            status = "✅"
            extra = ""
        elif lesson <= available_lessons:
            status = "🆕"
            extra = ""
        else:
            status = "🔒"
            extra = ""
            # Show schedule unlock timer on the first locked lesson after the open ones.
            if lesson == next_after_open_lesson and next_after_open_unlock_seconds > 0:
                extra = f" — откроется через <b>{escape_html(humanize_duration_ru(next_after_open_unlock_seconds))}</b>"
            # Fallback: show next required lesson timer (sequential progression) when applicable.
            elif lesson == next_required and next_unlock_seconds > 0:
                extra = f" — откроется через <b>{escape_html(humanize_duration_ru(next_unlock_seconds))}</b>"
        lines.append(f"{status} Урок <b>{lesson}</b>{theme_part}{extra}")

    has_prev = page > 0
    has_next = end < total_lessons
    return "\n".join(lines), page, has_prev, has_next


def build_calendar_keyboard(page: int, has_prev: bool, has_next: bool):
    rows = [
        [{"text": "🔄 Обновить", "callback_data": f"cal:refresh:{page}"}, {"text": "📋 Меню", "callback_data": "nav:menu"}]
    ]
    nav = []
    if has_prev:
        nav.append({"text": "⬅️ Back", "callback_data": f"cal:prev:{page}"})
    if has_next:
        nav.append({"text": "Next ➡️", "callback_data": f"cal:next:{page}"})
    if nav:
        rows.append(nav)
    return build_inline_keyboard(rows)


def site_get_json(path: str, params=None):
    query = urllib.parse.urlencode(params or {})
    url = f"{SITE_API_URL}{path}"
    if query:
        url = url + "?" + query
    req = urllib.request.Request(url, method="GET")
    try:
        with urllib.request.urlopen(req, timeout=10) as response:
            status = int(getattr(response, "status", 200) or 200)
            payload = response.read().decode("utf-8", errors="ignore")
    except urllib.error.HTTPError as err:
        try:
            payload = err.read().decode("utf-8", errors="ignore")
        except Exception:
            payload = ""
        return int(err.code or 0), safe_json_loads(payload) or {}
    except urllib.error.URLError:
        return 0, {"error": "network_error"}
    return status, safe_json_loads(payload) or {}


def site_post_json(path: str, payload: dict):
    url = f"{SITE_API_URL}{path}"
    data = json.dumps(payload or {}, ensure_ascii=False).encode("utf-8")
    req = urllib.request.Request(url, data=data, method="POST")
    req.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(req, timeout=12) as response:
            status = int(getattr(response, "status", 200) or 200)
            body = response.read().decode("utf-8", errors="ignore")
    except urllib.error.HTTPError as err:
        try:
            body = err.read().decode("utf-8", errors="ignore")
        except Exception:
            body = ""
        return int(err.code or 0), safe_json_loads(body) or {}
    except urllib.error.URLError:
        return 0, {"error": "network_error"}
    return status, safe_json_loads(body) or {}


def safe_json_loads(value: str):
    try:
        return json.loads(value or "")
    except json.JSONDecodeError:
        return None


def build_main_keyboard():
    return {
        "keyboard": [
            ["Новости", "Материал дня"],
            ["Совет IELTS", "Рекомендации"],
            ["Уровень", "Помощь"],
        ],
        "resize_keyboard": True,
        "one_time_keyboard": False,
    }


def build_admin_keyboard():
    return {
        "keyboard": [
            ["Добавить новость", "Статистика"],
            ["Назад"],
        ],
        "resize_keyboard": True,
        "one_time_keyboard": False,
    }


def build_mentor_keyboard():
    return {
        "keyboard": [
            ["Сегодняшние задачи"],
            ["Назад"],
        ],
        "resize_keyboard": True,
        "one_time_keyboard": False,
    }


def build_remove_keyboard():
    return {"remove_keyboard": True}


def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def ensure_db():
    conn = get_connection()
    cur = conn.cursor()
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS bot_users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            chat_id INTEGER NOT NULL UNIQUE,
            username TEXT NOT NULL DEFAULT '',
            first_name TEXT NOT NULL DEFAULT '',
            last_name TEXT NOT NULL DEFAULT '',
            role TEXT NOT NULL DEFAULT 'user',
            news_subscribed INTEGER NOT NULL DEFAULT 1,
            created_at TEXT NOT NULL,
            last_seen_at TEXT NOT NULL
        )
        """
    )
    cur.execute("PRAGMA table_info(bot_users)")
    user_columns = {row["name"] for row in cur.fetchall()}
    if "level" not in user_columns:
        cur.execute("ALTER TABLE bot_users ADD COLUMN level TEXT NOT NULL DEFAULT ''")
    if "phone" not in user_columns:
        cur.execute("ALTER TABLE bot_users ADD COLUMN phone TEXT NOT NULL DEFAULT ''")
    if "account_username" not in user_columns:
        cur.execute("ALTER TABLE bot_users ADD COLUMN account_username TEXT NOT NULL DEFAULT ''")
    if "account_full_name" not in user_columns:
        cur.execute("ALTER TABLE bot_users ADD COLUMN account_full_name TEXT NOT NULL DEFAULT ''")
    if "news_subscribed" not in user_columns:
        cur.execute("ALTER TABLE bot_users ADD COLUMN news_subscribed INTEGER NOT NULL DEFAULT 1")
    cur.execute("UPDATE bot_users SET news_subscribed = 1 WHERE news_subscribed IS NULL OR news_subscribed != 1")
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS bot_news (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL DEFAULT '',
            body TEXT NOT NULL,
            created_at TEXT NOT NULL,
            created_by_chat_id INTEGER,
            created_by_name TEXT NOT NULL DEFAULT ''
        )
        """
    )
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS bot_states (
            chat_id INTEGER PRIMARY KEY,
            state TEXT NOT NULL,
            payload TEXT NOT NULL DEFAULT '',
            updated_at TEXT NOT NULL
        )
        """
    )
    conn.commit()
    conn.close()


def check_site_api():
    url = f"{SITE_API_URL}/api/health"
    try:
        with urllib.request.urlopen(url, timeout=3) as response:
            payload = response.read().decode("utf-8", errors="ignore")
    except Exception as e:
        print("Site API is not reachable:", url, e)
        return False
    try:
        data = json.loads(payload)
    except json.JSONDecodeError:
        print("Site API returned invalid JSON:", url)
        return False
    if data.get("status") != "ok":
        print("Site API health check failed:", data)
        return False
    print("Site API connected:", url)
    return True


def upsert_bot_user(chat_id: int, username: str, first_name: str, last_name: str, role: str):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT id FROM bot_users WHERE chat_id = ?", (chat_id,))
    row = cur.fetchone()
    now = utc_now()
    if row is None:
        cur.execute(
            """
            INSERT INTO bot_users (chat_id, username, first_name, last_name, role, news_subscribed, created_at, last_seen_at)
            VALUES (?, ?, ?, ?, ?, 1, ?, ?)
            """,
            (chat_id, username or "", first_name or "", last_name or "", role, now, now),
        )
    else:
        cur.execute(
            """
            UPDATE bot_users
            SET username = ?, first_name = ?, last_name = ?, role = ?, news_subscribed = 1, last_seen_at = ?
            WHERE chat_id = ?
            """,
            (username or "", first_name or "", last_name or "", role, now, chat_id),
        )
    conn.commit()
    conn.close()


def get_bot_user(chat_id: int):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM bot_users WHERE chat_id = ?", (chat_id,))
    row = cur.fetchone()
    conn.close()
    return dict(row) if row is not None else None


def set_bot_account(chat_id: int, phone: str, account_username: str, role: str, level: str = "", account_full_name: str = ""):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute(
        """
        UPDATE bot_users
        SET phone = ?, account_username = ?, role = ?, level = ?, account_full_name = ?
        WHERE chat_id = ?
        """,
        (phone or "", account_username or "", role or "user", level or "", account_full_name or "", chat_id),
    )
    conn.commit()
    conn.close()


def clear_bot_account(chat_id: int):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute(
        """
        UPDATE bot_users
        SET phone = '', account_username = '', account_full_name = '', role = 'user', level = ''
        WHERE chat_id = ?
        """,
        (chat_id,),
    )
    conn.commit()
    conn.close()



def set_state(chat_id: int, state: str, payload: str = ""):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("REPLACE INTO bot_states (chat_id, state, payload, updated_at) VALUES (?, ?, ?, ?)", (chat_id, state, payload, utc_now()))
    conn.commit()
    conn.close()


def clear_state(chat_id: int):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("DELETE FROM bot_states WHERE chat_id = ?", (chat_id,))
    conn.commit()
    conn.close()


def get_state(chat_id: int):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT state, payload FROM bot_states WHERE chat_id = ?", (chat_id,))
    row = cur.fetchone()
    conn.close()
    if row is None:
        return None
    return {"state": row["state"], "payload": row["payload"]}


def decode_state_payload(raw: str):
    try:
        data = json.loads(raw or "")
    except json.JSONDecodeError:
        data = {}
    return data if isinstance(data, dict) else {}


def encode_state_payload(payload: dict):
    return json.dumps(payload or {}, ensure_ascii=False)


LEVELS = ("A1", "A2", "B1", "B2")

LEVEL_RECOMMENDATIONS = {
    "A1": [
        "Повторяйте базовые времена: Present Simple, To be.",
        "Ежедневно учите 10-15 базовых слов и сразу используйте их в предложениях.",
        "Слушайте короткие диалоги и повторяйте вслух.",
    ],
    "A2": [
        "Закрепляйте Past Simple и Future Simple на коротких рассказах.",
        "Делайте мини-письма на 6-8 предложений о себе и планах.",
        "Смотрите видео с субтитрами и выписывайте полезные фразы.",
    ],
    "B1": [
        "Тренируйте связность речи: because, however, although.",
        "Разбирайте IELTS Speaking Part 2 и учитесь держать 1-2 минуты.",
        "Пишите короткие эссе и проверяйте ошибки по чек-листу.",
    ],
    "B2": [
        "Прокачивайте Academic Vocabulary и коллокации.",
        "Делайте задания Reading на время, затем анализируйте ошибки.",
        "Пишите Task 2 с четкой структурой: introduction, 2 body, conclusion.",
    ],
}

DAILY_MATERIALS = [
    "Грамматика: Present Simple — утверждения, вопросы, отрицания.",
    "Лексика: 15 слов на тему Education + 5 фразовых глаголов.",
    "Listening: короткий диалог на 2-3 минуты с повторением.",
    "Speaking: опиши свой день за 8-10 предложений.",
    "Reading: маленькая статья и 5 вопросов к ней.",
    "Writing: мини-эссе на 120-150 слов.",
]

IELTS_TIPS = [
    "В Listening сначала читай вопросы, потом слушай — так легче ловить ключевые слова.",
    "В Reading отмечай ключевые слова в вопросах и ищи перефраз.",
    "В Writing Task 2 всегда используй четкую структуру абзацев.",
    "В Speaking используй примеры из личного опыта — так речь звучит естественнее.",
    "Следи за временем: лучше ответить на все вопросы, чем застрять на одном.",
    "Проверяй частые ошибки: артикли, предлоги, согласование времен.",
]


def get_user_level(chat_id: int) -> str:
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT level FROM bot_users WHERE chat_id = ?", (chat_id,))
    row = cur.fetchone()
    conn.close()
    if row is None:
        return ""
    return str(row["level"] or "").upper()


def set_user_level(chat_id: int, level: str):
    level_value = str(level or "").upper()
    if level_value not in LEVELS:
        return False
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("UPDATE bot_users SET level = ? WHERE chat_id = ?", (level_value, chat_id))
    conn.commit()
    conn.close()
    return True


def build_level_keyboard():
    return {
        "keyboard": [
            ["A1", "A2"],
            ["B1", "B2"],
            ["Назад"],
        ],
        "resize_keyboard": True,
        "one_time_keyboard": True,
    }


def pick_daily_material():
    index = datetime.now(timezone.utc).date().toordinal() % len(DAILY_MATERIALS)
    return DAILY_MATERIALS[index]


def pick_tip():
    index = datetime.now(timezone.utc).date().toordinal() % len(IELTS_TIPS)
    return IELTS_TIPS[index]

def add_news(title: str, body: str, created_by_chat_id: int, created_by_name: str):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute(
        """
        INSERT INTO bot_news (title, body, created_at, created_by_chat_id, created_by_name)
        VALUES (?, ?, ?, ?, ?)
        """,
        (title or "", body or "", utc_now(), created_by_chat_id, created_by_name or ""),
    )
    conn.commit()
    conn.close()


def fetch_latest_news(limit: int):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute(
        """
        SELECT id, title, body, created_at
        FROM bot_news
        ORDER BY id DESC
        LIMIT ?
        """,
        (limit,),
    )
    rows = [dict(row) for row in cur.fetchall()]
    conn.close()
    return rows


def get_all_chat_ids():
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT chat_id FROM bot_users")
    ids = [row["chat_id"] for row in cur.fetchall()]
    conn.close()
    return ids


def get_admin_stats():
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT COUNT(*) AS total FROM bot_users")
    total_users = cur.fetchone()["total"]
    cur.execute("SELECT COUNT(*) AS total FROM bot_news")
    news_count = cur.fetchone()["total"]
    conn.close()
    return total_users, news_count


def format_news_item(item: dict):
    title = escape_html(item.get("title") or "")
    body = escape_html(item.get("body") or "")
    created_at = escape_html(item.get("created_at") or "")
    parts = []
    if title:
        parts.append(f"<b>{title}</b>")
    parts.append(body)
    parts.append(f"<i>{created_at}</i>")
    return "\n".join(parts)


def broadcast_message(text: str):
    chat_ids = get_all_chat_ids()
    sent = 0
    for chat_id in chat_ids:
        if send_message(chat_id, text) is not None:
            sent += 1
        time.sleep(0.05)
    return sent


def role_for_chat_id(chat_id: int):
    user = get_bot_user(chat_id)
    if user:
        phone = str(user.get("phone") or "").strip()
        role = str(user.get("role") or "").strip()
        if phone and role:
            return role
    if chat_id in ADMIN_IDS:
        return "admin"
    if chat_id in MENTOR_IDS:
        return "mentor"
    return "user"


def is_logged_in(chat_id: int):
    user = get_bot_user(chat_id)
    return bool(user and str(user.get("phone") or "").strip())


def build_signup_link() -> str:
    # Pricing is shown inside the "Upgrade to Pro" modal on the main page.
    return f"{SITE_WEB_URL}/index.html"


def start_login_flow(chat_id: int, first_name: str = ""):
    if is_logged_in(chat_id):
        user = get_bot_user(chat_id) or {}
        role = escape_html(str(user.get("role") or "user"))
        account_username = escape_html(str(user.get("account_username") or ""))
        level = escape_html(str(user.get("level") or ""))
        account_full_name = str(user.get("account_full_name") or "").strip()
        if not account_full_name and user.get("phone"):
            status, profile = site_get_json("/api/bot/profile", {"phone": str(user.get("phone") or "").strip()})
            if status == 200 and isinstance(profile, dict):
                account_full_name = str(profile.get("full_name") or "").strip()
                if account_full_name:
                    set_bot_account(
                        chat_id,
                        str(user.get("phone") or "").strip(),
                        str(user.get("account_username") or "").strip(),
                        str(user.get("role") or "user").strip(),
                        str(user.get("level") or "").strip(),
                        account_full_name,
                    )
                    user["account_full_name"] = account_full_name
        hello_name = escape_html(first_name_only(account_full_name) or first_name or "друг")
        send_message(
            chat_id,
            f"👋 <b>Привет, {hello_name}!</b>\n\n"
            f"Добро пожаловать в <b>{escape_html(BOT_NAME)}</b> — здесь ты учишься шаг за шагом и видишь свой прогресс.\n\n"
            f"Нажми <b>Профиль</b>, чтобы посмотреть статистику, рейтинг и контакты ментора.",
            reply_markup=build_start_inline_keyboard(),
        )
        return
    clear_state(chat_id)
    set_state(chat_id, "awaiting_login_phone", encode_state_payload({}))
    text = (
        f"<b>{BOT_NAME}</b>\n"
        "🔐 <b>Вход</b>\n"
        "Отправьте номер телефона (как в профиле на сайте).\n"
        "Пример: <code>+998901234567</code>\n\n"
        "Отмена: /cancel"
    )
    send_message(chat_id, text, reply_markup=build_remove_keyboard())


def finish_login_flow(chat_id: int, first_name: str, user_payload: dict):
    phone = str(user_payload.get("phone") or "").strip()
    account_username = str(user_payload.get("username") or "").strip()
    account_full_name = str(user_payload.get("full_name") or user_payload.get("fullName") or "").strip()
    role = str(user_payload.get("role") or "user").strip() or "user"
    level = str(user_payload.get("level") or "").strip()
    set_bot_account(chat_id, phone, account_username, role, level, account_full_name)
    clear_state(chat_id)
    hello_name = escape_html(first_name_only(account_full_name) or first_name or "друг")
    msg = (
        f"✅ <b>Готово!</b>\n"
        f"👋 Привет, <b>{hello_name}</b>!\n\n"
        f"Ты вошёл в аккаунт: <b>{escape_html(account_username)}</b>\n"
        f"Роль: <b>{escape_html(role)}</b>"
    )
    if level:
        msg += f"\nУровень: <b>{escape_html(level)}</b>"
    send_message(chat_id, msg, reply_markup=build_start_inline_keyboard())

def format_profile_screen(chat_id: int) -> str:
    user = get_bot_user(chat_id) or {}
    phone = str(user.get("phone") or "").strip()
    if not phone:
        return "🔐 Сначала войдите через /login."

    status, summary = site_get_json("/api/bot/profile", {"phone": phone})
    if status != 200 or not isinstance(summary, dict):
        return "⚠️ Не удалось загрузить профиль. Попробуйте позже."

    full_name = str(summary.get("full_name") or user.get("account_full_name") or "").strip()
    level = str(summary.get("level") or user.get("level") or "").strip()
    avg = float(summary.get("average_percent") or 0.0)
    avg_label = f"{int(round(avg))}%"
    achievements = summary.get("achievements") if isinstance(summary.get("achievements"), list) else []
    earned = sum(1 for a in achievements if isinstance(a, dict) and a.get("earned"))
    total = len([a for a in achievements if isinstance(a, dict)]) or 0
    ach_percent = int(round((earned * 100.0) / total)) if total > 0 else 0
    remaining_days = int(summary.get("remaining_days") or 0)
    remaining_hours = int(summary.get("remaining_hours") or 0)

    lines = []
    name_first = first_name_only(full_name) or "друг"
    lines.append(f"👤 <b>Профиль</b>")
    lines.append(f"👋 Привет, <b>{escape_html(name_first)}</b>! Рады видеть тебя в <b>{escape_html(BOT_NAME)}</b>.")
    if full_name:
        lines.append(f"🧑 Полное имя: <b>{escape_html(full_name)}</b>")
    if level:
        lines.append(f"🎯 Уровень: <b>{escape_html(level)}</b>")
    lines.append(f"📈 Average progress: <b>{escape_html(avg_label)}</b>")
    lines.append(f"🏅 Achievements: <b>{earned}/{total}</b> (<b>{ach_percent}%</b>)")
    lines.append(f"⏳ Подписка: <b>{remaining_days} д</b> <b>{remaining_hours} ч</b> осталось")
    return "\n".join(lines)


def format_leaderboard_screen(level_label: str) -> str:
    course, _ = normalize_level(level_label)
    params = {"limit": "10"}
    if course:
        params["level"] = course
    status, payload = site_get_json("/api/leaderboard/achievements", params)
    if status != 200 or not isinstance(payload, dict) or not isinstance(payload.get("items"), list):
        return "🏆 <b>Список лидеров</b>\n\n⚠️ Не удалось загрузить рейтинг."
    items = payload.get("items") or []
    if not items:
        return "🏆 <b>Список лидеров</b>\n\nПока нет данных."
    lines = ["🏆 <b>Список лидеров</b>", ""]
    for row in items:
        if not isinstance(row, dict):
            continue
        rank = int(row.get("rank") or 0)
        medal = "🥇" if rank == 1 else "🥈" if rank == 2 else "🥉" if rank == 3 else f"#{rank}"
        name = str(row.get("full_name") or row.get("username") or "-").strip()
        points = int(row.get("total_points") or 0)
        lines.append(f"{medal} <b>{escape_html(name)}</b> — <b>{points} XP</b>")
    return "\n".join(lines)


def handle_logout(chat_id: int):
    clear_state(chat_id)
    clear_bot_account(chat_id)
    send_message(chat_id, "Вы вышли из аккаунта. Используйте /login или /start, чтобы войти снова.", reply_markup=build_remove_keyboard())


def format_profile_message(chat_id: int) -> str:
    user = get_bot_user(chat_id) or {}
    phone = str(user.get("phone") or "").strip()
    account_username = str(user.get("account_username") or "").strip()
    account_full_name = str(user.get("account_full_name") or "").strip()
    role = str(user.get("role") or "").strip() or "user"
    level = str(user.get("level") or "").strip()
    if phone and not account_full_name:
        status, profile = site_get_json("/api/bot/profile", {"phone": phone})
        if status == 200 and isinstance(profile, dict):
            account_full_name = str(profile.get("full_name") or "").strip()
    lines = [f"👤 <b>Профиль</b>"]
    lines.append(f"🪪 chat_id: <code>{chat_id}</code>")
    if account_username:
        lines.append(f"🆔 username: <b>{escape_html(account_username)}</b>")
    if account_full_name:
        lines.append(f"🧑 имя: <b>{escape_html(account_full_name)}</b>")
    if phone:
        lines.append(f"📞 phone: <code>{escape_html(phone)}</code>")
    if level:
        lines.append(f"🎯 уровень: <b>{escape_html(level)}</b>")
    lines.append(f"👤 роль: <b>{escape_html(role)}</b>")
    # Parents from site DB.
    if phone:
        status, payload = site_get_json("/api/bot/parents", {"phone": phone})
        if status == 200 and isinstance(payload, dict):
            items = payload.get("items")
            if isinstance(items, list) and items:
                lines.append("")
                lines.append("👨‍👩‍👧 <b>Родители</b>")
                for item in items:
                    if not isinstance(item, dict):
                        continue
                    rel = str(item.get("relation") or "").strip().lower()
                    label = "Мама" if rel == "mother" else "Папа" if rel == "father" else rel or "—"
                    name = " ".join([str(item.get("first_name") or "").strip(), str(item.get("last_name") or "").strip()]).strip()
                    pphone = str(item.get("phone") or "").strip()
                    details = " — ".join([v for v in [name, pphone] if v]) or "—"
                    lines.append(f"• <b>{escape_html(label)}</b>: {escape_html(details)}")
    return "\n".join(lines)


def format_mentor_screen(summary: dict) -> tuple[str, str]:
    mentor = summary.get("mentor") if isinstance(summary, dict) else None
    if not isinstance(mentor, dict):
        return "🧑‍🏫 <b>Ментор</b>\n\nПока ментор не назначен.", ""
    name = str(mentor.get("name") or "-").strip()
    tg = str(mentor.get("telegram_username") or "").strip()
    phone = str(mentor.get("phone") or "").strip()
    email = str(mentor.get("email") or "").strip()
    avatar_url = str(mentor.get("avatar_url") or "").strip()
    full_avatar_url = f"{SITE_API_URL}{avatar_url}" if avatar_url.startswith("/") else avatar_url

    lines = ["🧑‍🏫 <b>Ваш ментор</b>", f"👤 Имя: <b>{escape_html(name)}</b>", ""]
    contact_lines = []
    if tg:
        contact_lines.append(f"💬 Telegram: <b>@{escape_html(tg.lstrip('@'))}</b>")
    if phone:
        contact_lines.append(f"📱 WhatsApp: <b>{escape_html(phone)}</b>")
    if email:
        contact_lines.append(f"📧 Gmail: <b>{escape_html(email)}</b>")
    if not contact_lines:
        contact_lines.append("📩 Контакты: —")
    lines.extend(contact_lines)
    return "\n".join(lines), full_avatar_url


def build_parents_keyboard():
    return build_inline_keyboard(
        [
            [{"text": "👩 Мама", "callback_data": "par:add:mother"}, {"text": "👨 Папа", "callback_data": "par:add:father"}],
            [{"text": "📋 Меню", "callback_data": "nav:menu"}],
        ]
    )


def build_parent_saved_keyboard(relation: str):
    relation = str(relation or "").strip().lower()
    return build_inline_keyboard(
        [
            [{"text": "📋 Меню", "callback_data": "nav:menu"}, {"text": "✏️ Редактировать", "callback_data": f"par:edit:{relation}"}],
        ]
    )


def build_parent_edit_skip_keyboard(field_key: str):
    return build_inline_keyboard(
        [
            [{"text": "💾 Save (не менять)", "callback_data": f"par:skip:{field_key}"}],
        ]
    )


def keyboard_for_role(role: str):
    return build_remove_keyboard()


def handle_parent_start(chat_id: int, first_name: str = ""):
    clear_state(chat_id)
    set_state(chat_id, "awaiting_parent_self_phone", encode_state_payload({}))
    send_message(
        chat_id,
        "👨‍👩‍👧 <b>Раздел для родителей</b>\n\n"
        "Введите ваш номер телефона (который ваш ребёнок указал при добавлении вас в профиле), "
        "и вы начнёте получать уведомления о его результатах.\n\n"
        "Пример: <code>+998901234567</code>\n\nОтмена: /cancel",
        reply_markup=build_remove_keyboard(),
    )


def handle_start(chat_id: int, first_name: str):
    name = escape_html(first_name.strip()) if first_name and first_name.strip() else "друг"
    text = (
        f"👋 Привет, <b>{name}</b>!\n"
        "\n"
        "🎓 <b>English with Mr.Sam</b> — онлайн-платформа для подготовки к <b>IELTS</b> и сертификации по <b>CEFR</b> (A1–B2).\n"
        "\n"
        "✅ По системе обучения нашей платформы уже <b>более 100 учеников</b> достигли желаемых результатов по IELTS и CEFR.\n"
        "\n"
        "🌐 Платформа включает:\n"
        "• Уроки и задания по уровням (A1, A2, B1, B2)\n"
        "• Тесты и домашние задания\n"
        "• Личный кабинет и отслеживание прогресса\n"
        "• Таблица лидеров и сертификаты\n"
        "\n"
        "📲 Для более подробной информации:\n"
        f"🔗 Сайт: <a href=\"{SITE_WEB_URL}\">english-with-mr-sam.vercel.app</a>\n"
        "📢 Канал: <a href=\"https://t.me/English_With_MrSam\">@English_With_MrSam</a>\n"
        "\n"
        "━━━━━━━━━━━━━━━━━━━━\n"
        "🔐 <b>Вы ученик платформы?</b> → /login\n"
        "👨‍👩‍👧 <b>Вы родитель ученика?</b> → /parent\n"
    )
    keyboard = build_inline_keyboard([
        [
            {"text": "🔐 Войти как ученик", "callback_data": "nav:login"},
            {"text": "👨‍👩‍👧 Я родитель", "callback_data": "nav:parent"},
        ],
        [
            {"text": "🌐 Перейти на сайт", "url": SITE_WEB_URL},
            {"text": "📢 Наш канал", "url": "https://t.me/English_With_MrSam"},
        ],
    ])
    send_message(chat_id, text, reply_markup=keyboard)


def handle_help(chat_id: int):
    text = (
        "🧭 <b>Помощь</b>\n\n"
        "Команды:\n"
        "🔐 /login — войти\n"
        "🚪 /logout — выйти\n"
        "📰 /news — новости\n"
        "📚 /daily — материал дня\n"
        "💡 /tip — совет IELTS\n"
        "🎯 /recommend — рекомендации по уровню\n"
        "🏷️ /level — выбрать уровень\n"
        "🪪 /myid — показать chat_id\n"
        "❓ /help — помощь\n\n"
        "Можно просто написать сообщение — подскажу, что делать дальше."
    )
    send_message(chat_id, text, reply_markup=build_remove_keyboard())


def handle_news(chat_id: int):
    items = fetch_latest_news(DEFAULT_NEWS_LIMIT)
    if not items:
        text = "📰 Пока нет новостей. Как только появятся — сразу пришлю."
        send_message(chat_id, text, reply_markup=build_remove_keyboard())
        return
    blocks = [format_news_item(item) for item in items]
    text = "📰 <b>Последние новости</b>\n\n" + "\n\n".join(blocks)
    send_message(chat_id, text, reply_markup=build_remove_keyboard())


def handle_daily_material(chat_id: int):
    text = "📚 <b>Материал дня</b>\n" + escape_html(pick_daily_material())
    send_message(chat_id, text, reply_markup=build_remove_keyboard())


def handle_tip(chat_id: int):
    text = "💡 <b>Совет IELTS</b>\n" + escape_html(pick_tip())
    send_message(chat_id, text, reply_markup=build_remove_keyboard())


def start_level_flow(chat_id: int):
    text = "🏷️ Выберите ваш уровень (A1–B2)."
    set_state(chat_id, "awaiting_level")
    send_message(chat_id, text, reply_markup=build_level_keyboard())


def handle_level(chat_id: int):
    current = get_user_level(chat_id)
    if current:
        text = f"Ваш текущий уровень: <b>{escape_html(current)}</b>.\nХотите изменить?"
    else:
        text = "Уровень пока не выбран."
    set_state(chat_id, "awaiting_level")
    send_message(chat_id, text, reply_markup=build_level_keyboard())


def handle_recommendations(chat_id: int):
    level = get_user_level(chat_id)
    if not level:
        start_level_flow(chat_id)
        return
    tips = LEVEL_RECOMMENDATIONS.get(level, [])
    if not tips:
        send_message(chat_id, "Рекомендации пока не готовы.", reply_markup=build_remove_keyboard())
        return
    lines = "\n".join([f"• {escape_html(item)}" for item in tips])
    text = f"<b>Рекомендации для {escape_html(level)}</b>\n{lines}"
    send_message(chat_id, text, reply_markup=build_remove_keyboard())

def handle_admin_panel(chat_id: int):
    text = (
        "🛠️ <b>Админ-панель</b>\n"
        "✅ Доступ подтвержден.\n\n"
        "Действия:\n"
        "• Добавить новость\n"
        "• Статистика"
    )
    send_message(chat_id, text, reply_markup=build_remove_keyboard())


def handle_mentor_panel(chat_id: int):
    text = (
        "🧑‍🏫 <b>Окно ментора</b>\n"
        "✅ Доступ подтвержден.\n\n"
        "Пока доступно:\n"
        "• Сегодняшние задачи (скоро)"
    )
    send_message(chat_id, text, reply_markup=build_remove_keyboard())


def handle_admin_stats(chat_id: int):
    total_users, news_count = get_admin_stats()
    text = (
        "📊 <b>Статистика бота</b>\n"
        f"Всего пользователей: {total_users}\n"
        f"Новостей в базе: {news_count}"
    )
    send_message(chat_id, text, reply_markup=build_remove_keyboard())


def start_news_flow(chat_id: int):
    text = (
        "Отправьте текст новости одним сообщением.\n"
        "Если первая строка короткая, я возьму ее как заголовок.\n\n"
        "Для отмены отправьте /cancel."
    )
    set_state(chat_id, "awaiting_news_text")
    send_message(chat_id, text, reply_markup=build_remove_keyboard())


def save_news_from_message(chat_id: int, author_name: str, raw_text: str):
    raw_text = (raw_text or "").strip()
    if not raw_text:
        send_message(chat_id, "Текст новости пустой. Попробуйте еще раз.", reply_markup=build_remove_keyboard())
        return
    title = ""
    body = raw_text
    if "\n" in raw_text:
        first_line, rest = raw_text.split("\n", 1)
        if len(first_line.strip()) <= 80:
            title = first_line.strip()
            body = rest.strip()
    add_news(title, body, chat_id, author_name or "")
    clear_state(chat_id)
    preview = format_news_item({"title": title, "body": body, "created_at": utc_now()})
    broadcast_text = "<b>Новости сайта</b>\n\n" + preview
    sent = broadcast_message(broadcast_text)
    send_message(chat_id, f"Новость сохранена и отправлена {sent} пользователям.", reply_markup=build_remove_keyboard())


def try_check_phone_exists(phone_raw: str):
    status, data = site_get_json("/api/bot/profile", {"phone": phone_raw})
    if status == 200:
        return True, data
    if status == 404:
        return False, {"error": "user_not_found"}
    return False, data or {"error": "request_failed"}


def try_bot_login(phone_raw: str, username: str, password: str):
    status, data = site_post_json(
        "/api/bot/login",
        {"phone": phone_raw, "username": username, "password": password},
    )
    return status, data or {}


def try_link_chat(phone_raw: str, chat_id: int):
    params = {"phone": phone_raw, "chat_id": str(int(chat_id))}
    if BOT_SYNC_TOKEN:
        params["token"] = BOT_SYNC_TOKEN
    status, data = site_get_json("/api/bot/link-chat", params)
    return status, data or {}


def try_link_parent_chat(phone: str, chat_id: int):
    """Link a parent's Telegram by their phone stored in user_parents."""
    params: dict = {"phone": phone, "chat_id": str(int(chat_id))}
    if BOT_SYNC_TOKEN:
        params["token"] = BOT_SYNC_TOKEN
    status, data = site_get_json("/api/bot/parent-link-chat", params)
    return status, data or {}


def handle_text(chat_id: int, role: str, first_name: str, text: str):
    normalized = (text or "").strip()
    lowered = normalized.lower()

    state = get_state(chat_id)
    if state and state.get("state") in {"parent_first", "parent_last", "parent_phone"}:
        payload = decode_state_payload(state.get("payload") or "")
        try:
            flow_message_id = int(payload.get("message_id") or 0)
        except (TypeError, ValueError):
            flow_message_id = 0
        mode = str(payload.get("mode") or "").strip().lower()
        relation = str(payload.get("relation") or "").strip().lower()
        if lowered in {"/cancel", "отмена"}:
            clear_state(chat_id)
            send_message(chat_id, "Действие отменено.", reply_markup=build_start_inline_keyboard())
            return

        if state.get("state") == "parent_first":
            payload["first_name"] = normalized
            set_state(chat_id, "parent_last", encode_state_payload(payload))
            if mode == "edit":
                prompt = f"Введите новую фамилию или нажмите Save.\nТекущая: <b>{escape_html(str(payload.get('last_name') or '-'))}</b>"
                if flow_message_id:
                    edit_message_text(chat_id, flow_message_id, prompt, reply_markup=build_parent_edit_skip_keyboard("last"))
                else:
                    send_message(chat_id, prompt, reply_markup=build_parent_edit_skip_keyboard("last"))
            else:
                send_message(chat_id, "Введите фамилию родителя.")
            return

        if state.get("state") == "parent_last":
            payload["last_name"] = normalized
            set_state(chat_id, "parent_phone", encode_state_payload(payload))
            if mode == "edit":
                prompt = f"Введите новый номер или нажмите Save.\nТекущий: <b>{escape_html(str(payload.get('parent_phone') or '-'))}</b>"
                if flow_message_id:
                    edit_message_text(chat_id, flow_message_id, prompt, reply_markup=build_parent_edit_skip_keyboard("phone"))
                else:
                    send_message(chat_id, prompt, reply_markup=build_parent_edit_skip_keyboard("phone"))
            else:
                send_message(chat_id, "Введите номер телефона родителя (например, <code>+998901234567</code>).")
            return

        if state.get("state") == "parent_phone":
            payload["parent_phone"] = normalized
            phone = get_phone_for_chat(chat_id)
            status, res = upsert_parent(
                phone,
                relation,
                str(payload.get("first_name") or "").strip(),
                str(payload.get("last_name") or "").strip(),
                str(payload.get("parent_phone") or "").strip(),
            )
            clear_state(chat_id)
            if status == 200:
                label = "Маму" if relation == "mother" else "Папу" if relation == "father" else "родителя"
                first = escape_html(str(payload.get("first_name") or "").strip())
                last = escape_html(str(payload.get("last_name") or "").strip())
                pphone = escape_html(str(payload.get("parent_phone") or "").strip())
                msg = f"✅ Сохранено: {label}.\n{first} {last} — {pphone}"
                if mode == "edit" and flow_message_id:
                    edit_message_text(chat_id, flow_message_id, msg, reply_markup=build_parent_saved_keyboard(relation))
                else:
                    send_message(chat_id, msg, reply_markup=build_parent_saved_keyboard(relation))
                return
            send_message(chat_id, "Не удалось сохранить. Проверьте данные и попробуйте ещё раз.", reply_markup=build_parents_keyboard())
            return

    if state and state.get("state") == "awaiting_parent_self_phone":
        if lowered in {"/cancel", "отмена"}:
            clear_state(chat_id)
            send_message(chat_id, "Действие отменено.", reply_markup=build_remove_keyboard())
            return
        phone = normalized.strip()
        status, data = try_link_parent_chat(phone, chat_id)
        clear_state(chat_id)
        if status == 200 and isinstance(data, dict) and data.get("status") == "ok":
            send_message(
                chat_id,
                "✅ <b>Готово!</b>\n\nВаш Telegram подключён. Теперь вы будете получать уведомления об успехах вашего ребёнка в <b>English with Mr.Sam</b>.",
                reply_markup=build_remove_keyboard(),
            )
        elif status == 404:
            send_message(
                chat_id,
                f"❌ Номер <b>{escape_html(phone)}</b> не найден в системе.\n\nПопросите вашего ребёнка добавить ваш номер телефона через меню «Родители» в боте.",
                reply_markup=build_remove_keyboard(),
            )
        else:
            send_message(
                chat_id,
                "⚠️ Не удалось подключиться. Проверьте номер и попробуйте снова.",
                reply_markup=build_remove_keyboard(),
            )
        return

    if state and state.get("state") in {"awaiting_login_phone", "awaiting_login_username", "awaiting_login_password"}:
        if lowered in {"/cancel", "отмена", "назад"}:
            clear_state(chat_id)
            send_message(chat_id, "Вход отменен. Используйте /login, чтобы начать заново.", reply_markup=build_remove_keyboard())
            return
        payload = decode_state_payload(state.get("payload") or "")
        step = state.get("state")
        if step == "awaiting_login_phone":
            phone_raw = normalized
            exists, info = try_check_phone_exists(phone_raw)
            if not exists:
                link = build_signup_link()
                send_message(
                    chat_id,
                    "Такого пользователя не существует.\n"
                    f"Создайте аккаунт на сайте: {escape_html(link)}\n\n"
                    "Потом вернитесь и выполните /login.",
                    reply_markup=build_remove_keyboard(),
                )
                clear_state(chat_id)
                return
            payload["phone"] = phone_raw
            set_state(chat_id, "awaiting_login_username", encode_state_payload(payload))
            send_message(chat_id, "Введите логин (username) от профиля.", reply_markup=build_remove_keyboard())
            return
        if step == "awaiting_login_username":
            payload["username"] = normalized
            set_state(chat_id, "awaiting_login_password", encode_state_payload(payload))
            send_message(chat_id, "Введите пароль от профиля.", reply_markup=build_remove_keyboard())
            return
        if step == "awaiting_login_password":
            phone_raw = str(payload.get("phone") or "").strip()
            username = str(payload.get("username") or "").strip()
            password = normalized
            attempts = int(payload.get("attempts") or 0)
            status, login_data = try_bot_login(phone_raw, username, password)
            if status != 200:
                attempts += 1
                payload["attempts"] = attempts
                set_state(chat_id, "awaiting_login_password", encode_state_payload(payload))
                if attempts >= 3:
                    clear_state(chat_id)
                    send_message(chat_id, "Не удалось войти (3 попытки). Запустите /login и попробуйте снова.", reply_markup=build_remove_keyboard())
                    return
                send_message(chat_id, "Неверный логин или пароль. Попробуйте еще раз.", reply_markup=build_remove_keyboard())
                return
            # Link Telegram chat_id to the site account so admin PINs can be delivered.
            try_link_chat(phone_raw, chat_id)
            finish_login_flow(chat_id, first_name, login_data)
            return

    if state and state.get("state") == "awaiting_news_text":
        if lowered in {"/cancel", "отмена"}:
            clear_state(chat_id)
            send_message(chat_id, "Создание новости отменено.", reply_markup=build_remove_keyboard())
            return
        if role != "admin":
            clear_state(chat_id)
            send_message(chat_id, "Доступ запрещен.", reply_markup=build_remove_keyboard())
            return
        save_news_from_message(chat_id, first_name or "", normalized)
        return

    if state and state.get("state") == "awaiting_level":
        if lowered in {"назад", "/cancel", "отмена"}:
            clear_state(chat_id)
            send_message(chat_id, "Выбор уровня отменен.", reply_markup=build_remove_keyboard())
            return
        upper_level = normalized.upper()
        if upper_level in LEVELS:
            set_user_level(chat_id, upper_level)
            clear_state(chat_id)
            send_message(chat_id, f"Уровень сохранен: <b>{escape_html(upper_level)}</b>.", reply_markup=build_remove_keyboard())
            return
        send_message(chat_id, "Пожалуйста, выберите уровень A1, A2, B1 или B2.", reply_markup=build_level_keyboard())
        return

    if lowered == "новости":
        handle_news(chat_id)
        return
    if lowered == "материал дня":
        handle_daily_material(chat_id)
        return
    if lowered == "совет ielts":
        handle_tip(chat_id)
        return
    if lowered == "рекомендации":
        handle_recommendations(chat_id)
        return
    if lowered == "уровень":
        handle_level(chat_id)
        return
    if lowered == "помощь":
        handle_help(chat_id)
        return
    if lowered == "добавить новость":
        if role != "admin":
            send_message(chat_id, "Доступ запрещен.", reply_markup=build_remove_keyboard())
            return
        start_news_flow(chat_id)
        return
    if lowered == "статистика":
        if role != "admin":
            send_message(chat_id, "Доступ запрещен.", reply_markup=build_remove_keyboard())
            return
        handle_admin_stats(chat_id)
        return
    if lowered == "сегодняшние задачи":
        if role != "mentor":
            send_message(chat_id, "Доступ запрещен.", reply_markup=build_remove_keyboard())
            return
        send_message(chat_id, "Функция в разработке.", reply_markup=build_remove_keyboard())
        return
    if lowered == "назад":
        send_message(chat_id, "Главное меню.", reply_markup=build_remove_keyboard())
        return

    text = (
        "Я не понял сообщение.\n"
        "Напишите /help, чтобы увидеть доступные команды."
    )
    send_message(chat_id, text, reply_markup=build_remove_keyboard())


def handle_command(chat_id: int, role: str, first_name: str, username: str, text: str):
    parts = (text or "").split()
    command = parts[0].lower()
    args = parts[1:]

    if command == "/start":
        handle_start(chat_id, first_name)
        return
    if command == "/login":
        start_login_flow(chat_id, first_name)
        return
    if command == "/logout":
        handle_logout(chat_id)
        return
    if command == "/cancel":
        clear_state(chat_id)
        send_message(chat_id, "Действие отменено.", reply_markup=build_remove_keyboard())
        return
    if command == "/help":
        handle_help(chat_id)
        return
    if command == "/myid":
        send_message(chat_id, f"Ваш chat_id: {chat_id}")
        return
    if command == "/news":
        handle_news(chat_id)
        return
    if command == "/daily":
        handle_daily_material(chat_id)
        return
    if command == "/tip":
        handle_tip(chat_id)
        return
    if command == "/recommend":
        handle_recommendations(chat_id)
        return
    if command == "/level":
        handle_level(chat_id)
        return
    if command == "/parent":
        handle_parent_start(chat_id, first_name)
        return
    if command == "/admin":
        if role != "admin":
            send_message(chat_id, "Доступ запрещен.", reply_markup=build_remove_keyboard())
            return
        handle_admin_panel(chat_id)
        return
    if command == "/mentor":
        if role != "mentor":
            send_message(chat_id, "Доступ запрещен.", reply_markup=build_remove_keyboard())
            return
        handle_mentor_panel(chat_id)
        return
    if command == "/news_add":
        if role != "admin":
            send_message(chat_id, "Доступ запрещен.", reply_markup=build_remove_keyboard())
            return
        if args:
            raw_text = " ".join(args)
            save_news_from_message(chat_id, first_name or username or "", raw_text)
            return
        start_news_flow(chat_id)
        return
    if command == "/broadcast":
        if role != "admin":
            send_message(chat_id, "Доступ запрещен.", reply_markup=build_remove_keyboard())
            return
        raw_text = " ".join(args).strip()
        if not raw_text:
            send_message(chat_id, "Укажите текст рассылки после команды /broadcast.", reply_markup=build_remove_keyboard())
            return
        text = "<b>Сообщение от команды</b>\n\n" + escape_html(raw_text)
        sent = broadcast_message(text)
        send_message(chat_id, f"Рассылка отправлена {sent} пользователям.", reply_markup=build_remove_keyboard())
        return

    handle_text(chat_id, role, first_name, text)


def handle_update(update: dict):
    callback = update.get("callback_query")
    if callback:
        callback_id = str(callback.get("id") or "")
        message = callback.get("message") or {}
        chat = message.get("chat", {}) or {}
        chat_id = chat.get("id")
        if chat_id is None:
            return
        message_id = int(message.get("message_id") or 0)
        data = str(callback.get("data") or "").strip()
        role = role_for_chat_id(int(chat_id))
        if callback_id:
            answer_callback_query(callback_id)

        if data == "nav:login":
            first_name = str(callback.get("from", {}).get("first_name") or "").strip()
            start_login_flow(int(chat_id), first_name)
            return
        if data == "nav:parent":
            first_name = str(callback.get("from", {}).get("first_name") or "").strip()
            handle_parent_start(int(chat_id), first_name)
            return
        if data == "nav:close":
            if message_id:
                edit_message_reply_markup(int(chat_id), message_id, build_remove_keyboard())
            else:
                send_message(int(chat_id), "Ок.", reply_markup=build_remove_keyboard())
            return
        if data == "nav:menu":
            if message_id:
                edit_message_text(int(chat_id), message_id, "Меню\nВыберите раздел кнопками ниже.", reply_markup=build_full_menu_inline_keyboard(role))
            else:
                send_message(int(chat_id), "Меню\nВыберите раздел кнопками ниже.", reply_markup=build_full_menu_inline_keyboard(role))
            return
        if data == "nav:profile":
            text = format_profile_screen(int(chat_id))
            if message_id:
                edit_message_text(int(chat_id), message_id, text, reply_markup=build_profile_keyboard())
            else:
                send_message(int(chat_id), text, reply_markup=build_profile_keyboard())
            return
        if data == "prof:back_menu":
            if message_id:
                edit_message_text(int(chat_id), message_id, "Меню\nВыберите раздел кнопками ниже.", reply_markup=build_full_menu_inline_keyboard(role))
            else:
                send_message(int(chat_id), "Меню\nВыберите раздел кнопками ниже.", reply_markup=build_full_menu_inline_keyboard(role))
            return
        if data == "prof:back_profile":
            text = format_profile_screen(int(chat_id))
            if message_id:
                edit_message_text(int(chat_id), message_id, text, reply_markup=build_profile_keyboard())
            else:
                send_message(int(chat_id), text, reply_markup=build_profile_keyboard())
            return
        if data == "prof:leaders":
            phone = get_phone_for_chat(int(chat_id))
            if not phone:
                if message_id:
                    edit_message_text(int(chat_id), message_id, "Сначала войдите через /login.", reply_markup=build_start_inline_keyboard())
                else:
                    send_message(int(chat_id), "Сначала войдите через /login.", reply_markup=build_start_inline_keyboard())
                return
            status, summary = site_get_json("/api/bot/profile", {"phone": phone})
            level_label = str(summary.get("level") or "") if status == 200 and isinstance(summary, dict) else ""
            text = format_leaderboard_screen(level_label)
            if message_id:
                edit_message_text(int(chat_id), message_id, text, reply_markup=build_back_to_profile_keyboard())
            else:
                send_message(int(chat_id), text, reply_markup=build_back_to_profile_keyboard())
            return
        if data == "prof:mentor":
            phone = get_phone_for_chat(int(chat_id))
            if not phone:
                if message_id:
                    edit_message_text(int(chat_id), message_id, "Сначала войдите через /login.", reply_markup=build_start_inline_keyboard())
                else:
                    send_message(int(chat_id), "Сначала войдите через /login.", reply_markup=build_start_inline_keyboard())
                return
            status, summary = site_get_json("/api/bot/profile", {"phone": phone})
            if status != 200 or not isinstance(summary, dict):
                text = "🧑‍🏫 <b>Ментор</b>\n\n⚠️ Не удалось загрузить данные."
                if message_id:
                    edit_message_text(int(chat_id), message_id, text, reply_markup=build_back_to_profile_keyboard())
                else:
                    send_message(int(chat_id), text, reply_markup=build_back_to_profile_keyboard())
                return
            text, avatar = format_mentor_screen(summary)
            if avatar:
                # Send avatar as a separate message (no buttons), and show info+Back in the current message.
                send_photo(int(chat_id), avatar)
            if message_id:
                edit_message_text(int(chat_id), message_id, text, reply_markup=build_back_to_profile_keyboard())
            else:
                send_message(int(chat_id), text, reply_markup=build_back_to_profile_keyboard())
            return
        if data == "menu:back":
            if message_id:
                edit_message_text(int(chat_id), message_id, "<b>IELTS Bot</b>\nВыберите действие:", reply_markup=build_start_inline_keyboard())
            else:
                send_message(int(chat_id), "<b>IELTS Bot</b>\nВыберите действие:", reply_markup=build_start_inline_keyboard())
            return
        if data == "menu:calendar":
            status, summary = get_profile_summary_for_chat(int(chat_id))
            if status != 200 or not isinstance(summary, dict):
                text = "Сначала войдите через /login."
                if message_id:
                    edit_message_text(int(chat_id), message_id, text, reply_markup=build_start_inline_keyboard())
                else:
                    send_message(int(chat_id), text, reply_markup=build_start_inline_keyboard())
                return
            page = 0
            text, page, has_prev, has_next = render_calendar_page(summary, page)
            kb = build_calendar_keyboard(page, has_prev, has_next)
            if message_id:
                edit_message_text(int(chat_id), message_id, text, reply_markup=kb)
            else:
                send_message(int(chat_id), text, reply_markup=kb)
            set_state(int(chat_id), "calendar", encode_state_payload({"page": page}))
            return
        if data.startswith("cal:"):
            parts = data.split(":")
            action = parts[1] if len(parts) > 1 else ""
            try:
                page = int(parts[2]) if len(parts) > 2 else 0
            except ValueError:
                page = 0
            state = get_state(int(chat_id))
            if state and state.get("state") == "calendar":
                payload = decode_state_payload(state.get("payload") or "")
                page = int(payload.get("page") or page or 0)
            if action == "next":
                page += 1
            elif action == "prev":
                page = max(0, page - 1)
            elif action == "refresh":
                page = max(0, page)

            status, summary = get_profile_summary_for_chat(int(chat_id))
            if status != 200 or not isinstance(summary, dict):
                if message_id:
                    edit_message_text(int(chat_id), message_id, "Сначала войдите через /login.", reply_markup=build_start_inline_keyboard())
                else:
                    send_message(int(chat_id), "Сначала войдите через /login.", reply_markup=build_start_inline_keyboard())
                return
            text, page, has_prev, has_next = render_calendar_page(summary, page)
            kb = build_calendar_keyboard(page, has_prev, has_next)
            if message_id:
                edit_message_text(int(chat_id), message_id, text, reply_markup=kb)
            else:
                send_message(int(chat_id), text, reply_markup=kb)
            set_state(int(chat_id), "calendar", encode_state_payload({"page": page}))
            return
        if data == "menu:parents":
            phone = get_phone_for_chat(int(chat_id))
            if not phone:
                text = "Сначала войдите через /login."
                if message_id:
                    edit_message_text(int(chat_id), message_id, text, reply_markup=build_start_inline_keyboard())
                else:
                    send_message(int(chat_id), text, reply_markup=build_start_inline_keyboard())
                return
            existing = {}
            status, payload = site_get_json("/api/bot/parents", {"phone": phone})
            if status == 200 and isinstance(payload, dict) and isinstance(payload.get("items"), list):
                for item in payload["items"]:
                    if isinstance(item, dict):
                        existing[str(item.get("relation") or "").strip().lower()] = item
            lines = ["👨‍👩‍👧 <b>Родители</b>", "Выберите, кого добавить или обновить:"]
            if "mother" in existing:
                m = existing["mother"]
                lines.append(f"• Мама: {escape_html((str(m.get('first_name') or '') + ' ' + str(m.get('last_name') or '')).strip())} — {escape_html(str(m.get('phone') or '').strip())}")
            if "father" in existing:
                f = existing["father"]
                lines.append(f"• Папа: {escape_html((str(f.get('first_name') or '') + ' ' + str(f.get('last_name') or '')).strip())} — {escape_html(str(f.get('phone') or '').strip())}")
            text = "\n".join(lines)
            if message_id:
                edit_message_text(int(chat_id), message_id, text, reply_markup=build_parents_keyboard())
            else:
                send_message(int(chat_id), text, reply_markup=build_parents_keyboard())
            return
        if data.startswith("par:add:") or data.startswith("par:edit:"):
            phone = get_phone_for_chat(int(chat_id))
            if not phone:
                if message_id:
                    edit_message_text(int(chat_id), message_id, "Сначала войдите через /login.", reply_markup=build_start_inline_keyboard())
                else:
                    send_message(int(chat_id), "Сначала войдите через /login.", reply_markup=build_start_inline_keyboard())
                return
            parts = data.split(":")
            mode = parts[1]
            relation = parts[2] if len(parts) > 2 else ""
            relation = relation.strip().lower()
            existing = get_existing_parent(phone, relation) or {}
            payload = {
                "mode": mode,
                "relation": relation,
                "first_name": str(existing.get("first_name") or "").strip(),
                "last_name": str(existing.get("last_name") or "").strip(),
                "parent_phone": str(existing.get("phone") or "").strip(),
                # For "add" mode keep message_id=0 so every step sends a NEW message
                "message_id": int(message_id or 0) if mode == "edit" else 0,
            }
            set_state(int(chat_id), "parent_first", encode_state_payload(payload))
            if mode == "edit":
                prompt = f"Введите новое имя или нажмите Save.\nТекущее: <b>{escape_html(payload['first_name'] or '-')}</b>"
                if message_id:
                    edit_message_text(int(chat_id), message_id, prompt, reply_markup=build_parent_edit_skip_keyboard("first"))
                else:
                    send_message(int(chat_id), prompt, reply_markup=build_parent_edit_skip_keyboard("first"))
            else:
                # "add" mode — always new message, no skip button
                send_message(int(chat_id), "Введите имя родителя.")
            return
        if data.startswith("par:skip:"):
            state = get_state(int(chat_id))
            if not state:
                return
            payload = decode_state_payload(state.get("payload") or "")
            relation = str(payload.get("relation") or "").strip().lower()
            mode = str(payload.get("mode") or "").strip().lower()
            field_key = data.split(":", 2)[2] if ":" in data else ""
            if state.get("state") == "parent_first" and field_key == "first":
                set_state(int(chat_id), "parent_last", encode_state_payload(payload))
                prompt = "Введите фамилию родителя."
                if mode == "edit":
                    prompt = f"Введите новую фамилию или нажмите Save.\nТекущая: <b>{escape_html(str(payload.get('last_name') or '-') )}</b>"
                if message_id:
                    edit_message_text(int(chat_id), message_id, prompt, reply_markup=build_parent_edit_skip_keyboard("last"))
                else:
                    send_message(int(chat_id), prompt, reply_markup=build_parent_edit_skip_keyboard("last"))
                return
            if state.get("state") == "parent_last" and field_key == "last":
                set_state(int(chat_id), "parent_phone", encode_state_payload(payload))
                prompt = "Введите номер телефона родителя (например, <code>+998901234567</code>)."
                if mode == "edit":
                    prompt = f"Введите новый номер телефона или нажмите Save.\nТекущий: <b>{escape_html(str(payload.get('parent_phone') or '-') )}</b>"
                if message_id:
                    edit_message_text(int(chat_id), message_id, prompt, reply_markup=build_parent_edit_skip_keyboard("phone"))
                else:
                    send_message(int(chat_id), prompt, reply_markup=build_parent_edit_skip_keyboard("phone"))
                return
            if state.get("state") == "parent_phone" and field_key == "phone":
                # Save existing values as-is.
                phone = get_phone_for_chat(int(chat_id))
                status, res = upsert_parent(
                    phone,
                    relation,
                    str(payload.get("first_name") or "").strip(),
                    str(payload.get("last_name") or "").strip(),
                    str(payload.get("parent_phone") or "").strip(),
                )
                clear_state(int(chat_id))
                if status == 200:
                    label = "Маму" if relation == "mother" else "Папу" if relation == "father" else "родителя"
                    msg = f"✅ Сохранено: {label}.\n{escape_html(str(payload.get('first_name') or '').strip())} {escape_html(str(payload.get('last_name') or '').strip())} — {escape_html(str(payload.get('parent_phone') or '').strip())}"
                    if message_id:
                        edit_message_text(int(chat_id), message_id, msg, reply_markup=build_parent_saved_keyboard(relation))
                    else:
                        send_message(int(chat_id), msg, reply_markup=build_parent_saved_keyboard(relation))
                else:
                    if message_id:
                        edit_message_text(int(chat_id), message_id, "Не удалось сохранить. Попробуйте позже.", reply_markup=build_parents_keyboard())
                    else:
                        send_message(int(chat_id), "Не удалось сохранить. Попробуйте позже.", reply_markup=build_parents_keyboard())
                return
        if data == "menu:tip":
            handle_tip(int(chat_id))
            return
        if data == "menu:recommend":
            handle_recommendations(int(chat_id))
            return
        if data == "menu:lang":
            if message_id:
                edit_message_text(int(chat_id), message_id, "🌐 Язык — скоро.", reply_markup=build_full_menu_inline_keyboard(role))
            else:
                send_message(int(chat_id), "🌐 Язык — скоро.", reply_markup=build_full_menu_inline_keyboard(role))
            return
        if data == "menu:help":
            handle_help(int(chat_id))
            return

        if data == "act:news":
            handle_news(int(chat_id))
            return
        if data == "act:daily":
            handle_daily_material(int(chat_id))
            return
        if data == "act:tip":
            handle_tip(int(chat_id))
            return
        if data == "act:recommend":
            handle_recommendations(int(chat_id))
            return
        if data == "act:level":
            start_level_flow(int(chat_id))
            return
        if data == "act:help":
            handle_help(int(chat_id))
            return
        if data == "act:admin":
            if role != "admin":
                send_message(int(chat_id), "Доступ запрещен.", reply_markup=build_remove_keyboard())
                return
            handle_admin_panel(int(chat_id))
            return
        if data == "act:mentor":
            if role != "mentor":
                send_message(int(chat_id), "Доступ запрещен.", reply_markup=build_remove_keyboard())
                return
            handle_mentor_panel(int(chat_id))
            return
        return

    message = update.get("message") or update.get("edited_message")
    if not message:
        return
    chat = message.get("chat", {})
    chat_id = chat.get("id")
    if chat_id is None:
        return
    from_user = message.get("from", {})
    username = from_user.get("username", "") or ""
    first_name = from_user.get("first_name", "") or ""
    last_name = from_user.get("last_name", "") or ""
    role = role_for_chat_id(int(chat_id))
    upsert_bot_user(int(chat_id), username, first_name, last_name, role)

    text = message.get("text") or ""
    if not text:
        send_message(chat_id, "Пришлите, пожалуйста, текстовое сообщение.")
        return

    if text.strip().startswith("/"):
        handle_command(int(chat_id), role, first_name, username, text.strip())
    else:
        handle_text(int(chat_id), role, first_name, text.strip())


def get_updates(offset: int):
    params = {
        "timeout": LONG_POLL_TIMEOUT,
        "offset": offset,
    }
    return api_call("getUpdates", params) or []


def set_bot_commands():
    commands = [
        {"command": "start", "description": "Запуск бота"},
        {"command": "login", "description": "Войти в аккаунт"},
        {"command": "logout", "description": "Выйти из аккаунта"},
        {"command": "news", "description": "Последние новости"},
        {"command": "daily", "description": "Материал дня"},
        {"command": "tip", "description": "Совет IELTS"},
        {"command": "recommend", "description": "Рекомендации по уровню"},
        {"command": "level", "description": "Выбрать уровень"},
        {"command": "myid", "description": "Показать chat_id"},
        {"command": "parent", "description": "Для родителей — получать уведомления"},
        {"command": "help", "description": "Подсказка"},
    ]
    api_call("setMyCommands", {"commands": json.dumps(commands, ensure_ascii=False)})


def main():
    ensure_db()
    check_site_api()
    set_bot_commands()
    offset = 0
    while True:
        updates = get_updates(offset)
        for update in updates:
            offset = max(offset, update.get("update_id", 0) + 1)
            handle_update(update)
        time.sleep(0.2)


if __name__ == "__main__":
    main()
