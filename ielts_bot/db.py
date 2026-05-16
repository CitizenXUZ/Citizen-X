import sqlite3

import config
from utils import utc_now


def get_connection():
    conn = sqlite3.connect(config.DB_PATH)
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
    if "news_subscribed" not in user_columns:
        cur.execute("ALTER TABLE bot_users ADD COLUMN news_subscribed INTEGER NOT NULL DEFAULT 1")
    if "language" not in user_columns:
        default_lang = config.DEFAULT_LANGUAGE if config.DEFAULT_LANGUAGE in ("ru", "en") else "ru"
        cur.execute(f"ALTER TABLE bot_users ADD COLUMN language TEXT NOT NULL DEFAULT '{default_lang}'")
    if "phone" not in user_columns:
        cur.execute("ALTER TABLE bot_users ADD COLUMN phone TEXT NOT NULL DEFAULT ''")
    if "cover_file_id" not in user_columns:
        cur.execute("ALTER TABLE bot_users ADD COLUMN cover_file_id TEXT NOT NULL DEFAULT ''")
    if "profile_cover_file_id" not in user_columns:
        cur.execute("ALTER TABLE bot_users ADD COLUMN profile_cover_file_id TEXT NOT NULL DEFAULT ''")
    if "last_unlock_notified_at" not in user_columns:
        cur.execute("ALTER TABLE bot_users ADD COLUMN last_unlock_notified_at TEXT NOT NULL DEFAULT ''")
    if "pending_unlock_at" not in user_columns:
        cur.execute("ALTER TABLE bot_users ADD COLUMN pending_unlock_at TEXT NOT NULL DEFAULT ''")
    if "last_backlog_count" not in user_columns:
        cur.execute("ALTER TABLE bot_users ADD COLUMN last_backlog_count INTEGER NOT NULL DEFAULT 0")
    if "site_username" not in user_columns:
        cur.execute("ALTER TABLE bot_users ADD COLUMN site_username TEXT NOT NULL DEFAULT ''")
    if "site_role" not in user_columns:
        cur.execute("ALTER TABLE bot_users ADD COLUMN site_role TEXT NOT NULL DEFAULT ''")
    if "site_full_name" not in user_columns:
        cur.execute("ALTER TABLE bot_users ADD COLUMN site_full_name TEXT NOT NULL DEFAULT ''")
    cur.execute("UPDATE bot_users SET news_subscribed = 1 WHERE news_subscribed IS NULL OR news_subscribed != 1")
    cur.execute(
        "UPDATE bot_users SET language = ? WHERE language IS NULL OR language = ''",
        (config.DEFAULT_LANGUAGE,),
    )

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

    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS bot_meta (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL DEFAULT ''
        )
        """
    )

    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS bot_parents (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_chat_id INTEGER NOT NULL,
            phone TEXT NOT NULL DEFAULT '',
            first_name TEXT NOT NULL DEFAULT '',
            last_name TEXT NOT NULL DEFAULT '',
            relation TEXT NOT NULL DEFAULT '',
            created_at TEXT NOT NULL,
            FOREIGN KEY (user_chat_id) REFERENCES bot_users(chat_id)
        )
        """
    )
    conn.commit()
    conn.close()


def upsert_bot_user(chat_id: int, username: str, first_name: str, last_name: str, role: str):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT id FROM bot_users WHERE chat_id = ?", (chat_id,))
    row = cur.fetchone()
    now = utc_now()
    if row is None:
        cur.execute(
            """
            INSERT INTO bot_users (
                chat_id, username, first_name, last_name, role, news_subscribed, language, created_at, last_seen_at
            )
            VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?)
            """,
            (chat_id, username or "", first_name or "", last_name or "", role, config.DEFAULT_LANGUAGE, now, now),
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


def set_state(chat_id: int, state: str, payload: str = ""):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute(
        "REPLACE INTO bot_states (chat_id, state, payload, updated_at) VALUES (?, ?, ?, ?)",
        (chat_id, state, payload, utc_now()),
    )
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


def get_meta(key: str) -> str:
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT value FROM bot_meta WHERE key = ?", (key,))
    row = cur.fetchone()
    conn.close()
    if row is None:
        return ""
    return str(row["value"] or "")


def set_meta(key: str, value: str):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute(
        "REPLACE INTO bot_meta (key, value) VALUES (?, ?)",
        (key, value or ""),
    )
    conn.commit()
    conn.close()


def get_admin_stats():
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT COUNT(*) AS total FROM bot_users")
    total_users = cur.fetchone()["total"]
    cur.execute("SELECT COUNT(*) AS total FROM bot_news")
    news_count = cur.fetchone()["total"]
    conn.close()
    return total_users, news_count


def get_users_for_notifications():
    conn = get_connection()
    cur = conn.cursor()
    cur.execute(
        """
        SELECT chat_id, phone, language, last_unlock_notified_at, pending_unlock_at, last_backlog_count
        FROM bot_users
        WHERE phone IS NOT NULL AND phone != ''
        """
    )
    rows = [dict(row) for row in cur.fetchall()]
    conn.close()
    return rows


def set_last_unlock_notified_at(chat_id: int, unlock_at: str):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute(
        "UPDATE bot_users SET last_unlock_notified_at = ? WHERE chat_id = ?",
        (unlock_at or "", chat_id),
    )
    conn.commit()
    conn.close()


def set_pending_unlock_at(chat_id: int, unlock_at: str):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute(
        "UPDATE bot_users SET pending_unlock_at = ? WHERE chat_id = ?",
        (unlock_at or "", chat_id),
    )
    conn.commit()
    conn.close()


def set_last_backlog_count(chat_id: int, count: int):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute(
        "UPDATE bot_users SET last_backlog_count = ? WHERE chat_id = ?",
        (int(count or 0), chat_id),
    )
    conn.commit()
    conn.close()


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
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("UPDATE bot_users SET level = ? WHERE chat_id = ?", (level, chat_id))
    conn.commit()
    conn.close()


def get_user_language(chat_id: int) -> str:
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT language FROM bot_users WHERE chat_id = ?", (chat_id,))
    row = cur.fetchone()
    conn.close()
    if row is None:
        return ""
    return str(row["language"] or "")


def set_user_language(chat_id: int, lang: str):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("UPDATE bot_users SET language = ? WHERE chat_id = ?", (lang, chat_id))
    conn.commit()
    conn.close()


def get_user_phone(chat_id: int) -> str:
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT phone FROM bot_users WHERE chat_id = ?", (chat_id,))
    row = cur.fetchone()
    conn.close()
    if row is None:
        return ""
    return str(row["phone"] or "")


def set_user_phone(chat_id: int, phone: str):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("UPDATE bot_users SET phone = ? WHERE chat_id = ?", (phone, chat_id))
    conn.commit()
    conn.close()


def get_site_username(chat_id: int) -> str:
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT site_username FROM bot_users WHERE chat_id = ?", (chat_id,))
    row = cur.fetchone()
    conn.close()
    if row is None:
        return ""
    return str(row["site_username"] or "")


def set_site_username(chat_id: int, username: str):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("UPDATE bot_users SET site_username = ? WHERE chat_id = ?", (username or "", chat_id))
    conn.commit()
    conn.close()


def get_site_role(chat_id: int) -> str:
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT site_role FROM bot_users WHERE chat_id = ?", (chat_id,))
    row = cur.fetchone()
    conn.close()
    if row is None:
        return ""
    return str(row["site_role"] or "")


def set_site_role(chat_id: int, role: str):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("UPDATE bot_users SET site_role = ? WHERE chat_id = ?", (role or "", chat_id))
    conn.commit()
    conn.close()


def get_site_full_name(chat_id: int) -> str:
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT site_full_name FROM bot_users WHERE chat_id = ?", (chat_id,))
    row = cur.fetchone()
    conn.close()
    if row is None:
        return ""
    return str(row["site_full_name"] or "")


def set_site_full_name(chat_id: int, full_name: str):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("UPDATE bot_users SET site_full_name = ? WHERE chat_id = ?", (full_name or "", chat_id))
    conn.commit()
    conn.close()


def get_cover_file_id(chat_id: int) -> str:
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT cover_file_id FROM bot_users WHERE chat_id = ?", (chat_id,))
    row = cur.fetchone()
    conn.close()
    if row is None:
        return ""
    return str(row["cover_file_id"] or "")


def set_cover_file_id(chat_id: int, file_id: str):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("UPDATE bot_users SET cover_file_id = ? WHERE chat_id = ?", (file_id or "", chat_id))
    conn.commit()
    conn.close()


def get_profile_cover_file_id(chat_id: int) -> str:
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT profile_cover_file_id FROM bot_users WHERE chat_id = ?", (chat_id,))
    row = cur.fetchone()
    conn.close()
    if row is None:
        return ""
    return str(row["profile_cover_file_id"] or "")


def set_profile_cover_file_id(chat_id: int, file_id: str):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("UPDATE bot_users SET profile_cover_file_id = ? WHERE chat_id = ?", (file_id or "", chat_id))
    conn.commit()
    conn.close()


def add_parent(user_chat_id: int, phone: str, first_name: str, last_name: str, relation: str):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute(
        """
        INSERT INTO bot_parents (user_chat_id, phone, first_name, last_name, relation, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
        """,
        (user_chat_id, phone or "", first_name or "", last_name or "", relation or "", utc_now()),
    )
    conn.commit()
    conn.close()


def list_parents(user_chat_id: int) -> list[dict]:
    conn = get_connection()
    cur = conn.cursor()
    cur.execute(
        """
        SELECT id, phone, first_name, last_name, relation, created_at
        FROM bot_parents
        WHERE user_chat_id = ?
        ORDER BY id DESC
        """,
        (user_chat_id,),
    )
    rows = [dict(row) for row in cur.fetchall()]
    conn.close()
    return rows


def delete_parents(user_chat_id: int):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("DELETE FROM bot_parents WHERE user_chat_id = ?", (user_chat_id,))
    conn.commit()
    conn.close()


def logout_user(chat_id: int):
    """
    Clears the bound account data for this Telegram chat_id so the user can log in again.
    """
    set_user_phone(chat_id, "")
    set_user_level(chat_id, "")
    set_site_username(chat_id, "")
    set_site_role(chat_id, "")
    set_site_full_name(chat_id, "")
    delete_parents(chat_id)
    clear_state(chat_id)
