from typing import Optional
import math
import base64
import json
import random
import re

import config
import content
import db
import i18n
import keyboards
import site_api
import telegram_api
from utils import escape_html, utc_now
import os


def role_for_chat_id(chat_id: int):
    if chat_id in config.ADMIN_IDS:
        return "admin"
    if chat_id in config.MENTOR_IDS:
        return "mentor"
    return "user"


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
    chat_ids = db.get_all_chat_ids()
    sent = 0
    for chat_id in chat_ids:
        if telegram_api.send_message(chat_id, text) is not None:
            sent += 1
    return sent


def _extract_photo_file_id(result: Optional[dict]) -> str:
    if not isinstance(result, dict):
        return ""
    photos = result.get("photo")
    if not isinstance(photos, list):
        return ""
    for item in reversed(photos):
        if isinstance(item, dict) and item.get("file_id"):
            return str(item["file_id"])
    return ""


def _store_cover_file_id(chat_id: int, result: Optional[dict]):
    file_id = _extract_photo_file_id(result)
    if file_id:
        db.set_cover_file_id(chat_id, file_id)


def _store_profile_cover_file_id(chat_id: int, result: Optional[dict]):
    file_id = _extract_photo_file_id(result)
    if file_id:
        db.set_profile_cover_file_id(chat_id, file_id)


def render_start_message(chat_id: int, first_name: str, lang: str, message_id: Optional[int] = None, has_photo: bool = False):
    site_full_name = ""
    try:
        site_full_name = str(db.get_site_full_name(chat_id) or "").strip()
    except Exception:
        site_full_name = ""
    if not site_full_name:
        try:
            phone = db.get_user_phone(chat_id)
            profile = site_api.fetch_profile_by_phone(phone)
            if isinstance(profile, dict):
                fetched_name = str(profile.get("full_name") or "").strip()
                if fetched_name:
                    db.set_site_full_name(chat_id, fetched_name)
                    site_full_name = fetched_name
        except Exception:
            pass
    display_name = site_full_name or first_name or ("друг" if lang == "ru" else "friend")
    text = i18n.t(
        lang,
        "start_caption",
        bot_name=escape_html(config.BOT_NAME),
        name=escape_html(display_name),
    )
    markup = keyboards.build_start_keyboard(lang)
    local_cover = os.path.join(config.BASE_DIR.parent, "assets", "images", "cover.jpg")
    if os.path.exists(local_cover):
        cover_source = local_cover
    else:
        cover_source = f"{config.SITE_WEB_URL.rstrip('/')}/assets/images/cover.jpg" if config.SITE_WEB_URL else ""
        if not cover_source:
            cover_source = _absolute_url("/assets/images/cover.jpg")
    _replace_with_photo(chat_id, message_id, has_photo, cover_source, text, reply_markup=markup)


def handle_start(chat_id: int, first_name: str, lang: str):
    phone = db.get_user_phone(chat_id)
    site_username = db.get_site_username(chat_id)
    if not phone or not site_username:
        db.set_state(chat_id, "awaiting_phone")
        telegram_api.send_message(
            chat_id,
            i18n.t(lang, "phone_request"),
            reply_markup=keyboards.build_remove_keyboard(lang),
        )
        return
    render_start_message(chat_id, first_name, lang)


def handle_help(chat_id: int, lang: str, message_id: Optional[int] = None, has_photo: bool = False):
    text = i18n.t(lang, "help")
    _replace_with_text(chat_id, message_id, has_photo, text, reply_markup=keyboards.build_back_to_menu_keyboard(lang))


def handle_logout(chat_id: int, lang: str):
    db.logout_user(chat_id)
    db.set_state(chat_id, "awaiting_phone")
    telegram_api.send_message(
        chat_id,
        i18n.t(lang, "logout_done") + "\n\n" + i18n.t(lang, "phone_request"),
        reply_markup=keyboards.build_remove_keyboard(lang),
    )


def handle_login(chat_id: int, lang: str, first_name: str = ""):
    db.logout_user(chat_id)
    db.set_state(chat_id, "awaiting_phone")
    telegram_api.send_message(
        chat_id,
        i18n.t(lang, "phone_request"),
        reply_markup=keyboards.build_remove_keyboard(lang),
    )


def render_menu(chat_id: int, lang: str, message_id: Optional[int] = None, has_photo: bool = False):
    text = i18n.t(lang, "menu_title")
    markup = keyboards.build_menu_keyboard(lang)
    _replace_with_text(chat_id, message_id, has_photo, text, reply_markup=markup)


def render_language_selection(chat_id: int, lang: str, message_id: Optional[int] = None, has_photo: bool = False):
    text = i18n.t(lang, "language_prompt")
    markup = keyboards.build_language_inline_keyboard(lang)
    _replace_with_text(chat_id, message_id, has_photo, text, reply_markup=markup)


def handle_menu(chat_id: int, lang: str):
    render_menu(chat_id, lang)


def _format_subscription_left(lang: str, days: int, hours: int):
    if days <= 0 and hours <= 0:
        return "—"
    if lang == "ru":
        return f"{days} дн {hours} ч"
    return f"{days}d {hours}h"


def _format_next_unlock(lang: str, seconds: int):
    if seconds <= 0:
        return "—"
    days = seconds // 86400
    hours = (seconds % 86400) // 3600
    minutes = (seconds % 3600) // 60
    if days:
        if lang == "ru":
            return f"{days} д {hours} ч" if hours else f"{days} д"
        return f"{days}d {hours}h" if hours else f"{days}d"
    if hours:
        if minutes:
            return f"{hours} ч {minutes} мин" if lang == "ru" else f"{hours}h {minutes}m"
        return f"{hours} ч" if lang == "ru" else f"{hours}h"
    return f"{minutes} мин" if lang == "ru" else f"{minutes} min"


def _format_achievements(profile: Optional[dict], lang: str, detailed: bool = False):
    items = []
    if isinstance(profile, dict):
        raw_items = profile.get("achievements") or []
        if isinstance(raw_items, list):
            for item in raw_items:
                if not isinstance(item, dict):
                    continue
                earned = bool(item.get("earned", True))
                if not detailed and not earned:
                    continue
                icon = str(item.get("icon") or "").strip() or "⭐"
                title = item.get("title_ru") if lang == "ru" else item.get("title")
                if not title:
                    title = item.get("title") or item.get("title_ru") or ""
                title = str(title or "").strip()
                description = item.get("description_ru") if lang == "ru" else item.get("description")
                if not description:
                    description = item.get("description") or item.get("description_ru") or ""
                description = str(description or "").strip()
                points = item.get("points")
                if title:
                    items.append(
                        {
                            "icon": icon,
                            "title": title,
                            "description": description,
                            "points": points,
                            "earned": earned,
                        }
                    )
    if not items:
        return i18n.t(lang, "achievements_empty")
    if detailed:
        lines = []
        for item in items:
            title = escape_html(item["title"])
            description = escape_html(item.get("description") or "")
            icon = escape_html(item.get("icon") or "⭐")
            points = item.get("points")
            points_text = f" (+{points} XP)" if isinstance(points, (int, float)) else ""
            tail = f" — {description}" if description else ""
            status = "✅" if item.get("earned") else "🔒"
            lines.append(f"• {status} {icon} {title}{points_text}{tail}")
        return "\n".join(lines)

    compact = [f"{escape_html(item['icon'])} {escape_html(item['title'])}" for item in items]
    return ", ".join(compact)


def _absolute_url(path: str):
    if not path:
        return ""
    if path.startswith("http://") or path.startswith("https://"):
        return path
    if path.startswith("/"):
        return f"{config.SITE_API_URL.rstrip('/')}{path}"
    return f"{config.SITE_API_URL.rstrip('/')}/{path}"


def _replace_with_text(chat_id: int, message_id: Optional[int], has_photo: bool, text: str, reply_markup=None):
    if message_id is not None:
        if not has_photo:
            if telegram_api.edit_message_text(chat_id, message_id, text, reply_markup=reply_markup) is not None:
                return
        telegram_api.delete_message(chat_id, message_id)
    telegram_api.send_message(chat_id, text, reply_markup=reply_markup)


def _replace_with_photo(
    chat_id: int,
    message_id: Optional[int],
    has_photo: bool,
    photo_url: str,
    caption: str,
    reply_markup=None,
):
    if message_id is not None:
        if has_photo and not (photo_url and os.path.exists(photo_url)):
            if telegram_api.edit_message_media(chat_id, message_id, photo_url, caption=caption, reply_markup=reply_markup) is not None:
                return
        telegram_api.delete_message(chat_id, message_id)
    result = telegram_api.send_photo(chat_id, photo_url, caption=caption, reply_markup=reply_markup)
    if result is None:
        telegram_api.send_message(chat_id, caption, reply_markup=reply_markup)


def _normalize_level(raw_level: str) -> str:
    value = (raw_level or "").strip().upper()
    if not value:
        return ""
    if value in content.LEVELS:
        return value
    for candidate in content.LEVELS:
        if value.startswith(candidate):
            return candidate
    return ""


def _lesson_page_url(level: str, lesson_number: int) -> str:
    if not level or lesson_number <= 0:
        return ""
    base = config.SITE_WEB_URL.rstrip("/")
    if not base:
        return ""
    return f"{base}/lesson.html?course={level.lower()}&lesson={lesson_number}"


CYRILLIC_LATIN_MAP = {
    "а": "a",
    "б": "b",
    "в": "v",
    "г": "g",
    "д": "d",
    "е": "e",
    "ё": "e",
    "ж": "zh",
    "з": "z",
    "и": "i",
    "й": "i",
    "к": "k",
    "л": "l",
    "м": "m",
    "н": "n",
    "о": "o",
    "п": "p",
    "р": "r",
    "с": "s",
    "т": "t",
    "у": "u",
    "ф": "f",
    "х": "h",
    "ц": "ts",
    "ч": "ch",
    "ш": "sh",
    "щ": "shch",
    "ы": "y",
    "э": "e",
    "ю": "yu",
    "я": "ya",
    "ъ": "",
    "ь": "",
}


def _transliterate_login(value: str) -> str:
    raw = str(value or "")
    out = []
    for char in raw:
        lower = char.lower()
        if "a" <= lower <= "z" or lower.isdigit():
            out.append(lower)
            continue
        if lower in CYRILLIC_LATIN_MAP:
            out.append(CYRILLIC_LATIN_MAP[lower])
    return "".join(out)


def _build_username_base(full_name: str) -> str:
    first_word = str(full_name or "").strip().split()
    first_word = first_word[0] if first_word else ""
    base = _transliterate_login(first_word)
    base = re.sub(r"[^a-z0-9]", "", base)
    return base or "student"


def _generate_username(full_name: str) -> str:
    base = _build_username_base(full_name)
    digits = "".join(str(random.randint(0, 9)) for _ in range(5))
    return f"{base}{digits}"


def _generate_password() -> str:
    chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789"
    return "".join(random.choice(chars) for _ in range(8))


def _normalize_schedule_key(value: str) -> str:
    raw = str(value or "").strip().lower()
    if not raw:
        return ""
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


def _is_express_request(level_raw: str, price_label: str) -> bool:
    level_lower = str(level_raw or "").lower()
    price_lower = str(price_label or "").lower()
    return "express" in level_lower or "express" in price_lower


def _normalize_request_level(level_raw: str, price_label: str) -> str:
    raw = str(level_raw or "").strip().lower()
    base = re.sub(r"[-_ ]express$", "", raw).strip() or "a1"
    if _is_express_request(level_raw, price_label):
        return f"{base}-express"
    return raw or base


def _get_profile_level(chat_id: int, lang: str) -> str | None:
    phone = db.get_user_phone(chat_id)
    if not phone:
        db.set_state(chat_id, "awaiting_phone")
        telegram_api.send_message(
            chat_id,
            i18n.t(lang, "phone_request"),
            reply_markup=keyboards.build_remove_keyboard(lang),
        )
        return None
    profile = site_api.fetch_profile_by_phone(phone)
    if not profile or profile.get("error"):
        return ""
    return str(profile.get("level") or "").strip()


def render_profile(chat_id: int, lang: str, message_id: Optional[int] = None, has_photo: bool = False):
    phone = db.get_user_phone(chat_id)
    profile = site_api.fetch_profile_by_phone(phone)
    level = "—"
    total = "—"
    completed = 0
    progress = "—"
    subscription_left = "—"
    next_unlock = "—"
    achievements = i18n.t(lang, "achievements_empty")
    if profile and not profile.get("error"):
        level = str(profile.get("level") or "—")
        average_percent = profile.get("average_percent")
        if average_percent is not None:
            try:
                progress = f"{int(round(float(average_percent)))}%"
            except (TypeError, ValueError):
                progress = "—"
        completed = int(profile.get("completed_lessons") or 0)
        total_value = int(profile.get("total_lessons") or 0)
        total = total_value if total_value > 0 else "—"
        subscription_left = _format_subscription_left(
            lang,
            int(profile.get("remaining_days") or 0),
            int(profile.get("remaining_hours") or 0),
        )
        next_unlock = _format_next_unlock(lang, int(profile.get("next_unlock_seconds") or 0))
        achievements = _format_achievements(profile, lang)

    text = i18n.t(
        lang,
        "profile",
        level=escape_html(level),
        progress=progress,
        subscription=subscription_left,
        achievements=achievements,
        completed=completed,
        total=total,
        next_unlock=next_unlock,
    )
    markup = keyboards.build_profile_keyboard(lang)
    profile_cover_file_id = db.get_profile_cover_file_id(chat_id)
    cover = profile_cover_file_id or config.PROFILE_COVER_URL
    if cover:
        _replace_with_photo(chat_id, message_id, has_photo, cover, text, reply_markup=markup)
        return
    _replace_with_text(chat_id, message_id, has_photo, text, reply_markup=markup)


def handle_profile(chat_id: int, lang: str):
    phone = db.get_user_phone(chat_id)
    if not phone:
        db.set_state(chat_id, "awaiting_phone")
        telegram_api.send_message(
            chat_id,
            i18n.t(lang, "phone_request"),
            reply_markup=keyboards.build_remove_keyboard(lang),
        )
        return
    render_profile(chat_id, lang)


def render_achievements(chat_id: int, lang: str, message_id: Optional[int] = None, has_photo: bool = False):
    phone = db.get_user_phone(chat_id)
    profile = site_api.fetch_profile_by_phone(phone)
    items = _format_achievements(profile, lang, detailed=True)
    text = i18n.t(lang, "achievements_title", items=items)
    markup = keyboards.build_achievements_keyboard(lang)
    _replace_with_text(chat_id, message_id, has_photo, text, reply_markup=markup)


def handle_achievements(chat_id: int, lang: str):
    phone = db.get_user_phone(chat_id)
    if not phone:
        db.set_state(chat_id, "awaiting_phone")
        telegram_api.send_message(
            chat_id,
            i18n.t(lang, "phone_request"),
            reply_markup=keyboards.build_remove_keyboard(lang),
        )
        return
    render_achievements(chat_id, lang)


def render_leaderboard(chat_id: int, lang: str, message_id: Optional[int] = None, has_photo: bool = False):
    items = site_api.fetch_achievements_leaderboard()
    if not items:
        text = i18n.t(lang, "leaderboard_empty")
    else:
        lines = []
        medals = {1: "🥇", 2: "🥈", 3: "🥉"}
        for index, item in enumerate(items, start=1):
            rank = item.get("rank") if isinstance(item, dict) else None
            rank_value = int(rank) if isinstance(rank, (int, float)) else index
            name = ""
            if isinstance(item, dict):
                name = item.get("full_name") or item.get("username") or ""
            name = escape_html(str(name or "—"))
            level = ""
            if isinstance(item, dict):
                level = str(item.get("level") or "").strip()
            level_label = f" ({escape_html(level)})" if level else ""
            points = 0
            if isinstance(item, dict):
                points = int(item.get("total_points") or 0)
            medal = medals.get(index)
            prefix = f"{medal} {rank_value}." if medal else f"{rank_value}."
            lines.append(f"{prefix} {name}{level_label} — {points} XP")
        text = i18n.t(lang, "leaderboard_title", items="\n".join(lines))

    markup = keyboards.build_leaderboard_keyboard(lang)
    _replace_with_text(chat_id, message_id, has_photo, text, reply_markup=markup)


def render_contact_mentor(chat_id: int, lang: str, message_id: Optional[int] = None, has_photo: bool = False):
    phone = db.get_user_phone(chat_id)
    profile = site_api.fetch_profile_by_phone(phone)
    mentor = profile.get("mentor") if isinstance(profile, dict) else None
    if not mentor or not mentor.get("name"):
        text = i18n.t(lang, "mentor_missing")
        markup = keyboards.build_back_keyboard(lang)
        _replace_with_text(chat_id, message_id, has_photo, text, reply_markup=markup)
        return

    name = escape_html(str(mentor.get("name") or "—"))
    phone_value = escape_html(str(mentor.get("phone") or "—"))
    telegram_value = str(mentor.get("telegram_username") or "").strip()
    if telegram_value and not telegram_value.startswith("@"):
        telegram_value = f"@{telegram_value}"
    telegram_value = escape_html(telegram_value or "—")
    info_value = escape_html(str(mentor.get("info") or "").strip())
    text = i18n.t(
        lang,
        "mentor_contact",
        name=name,
        phone=phone_value,
        telegram=telegram_value,
        info=info_value,
    )
    avatar_url = _absolute_url(str(mentor.get("avatar_url") or "").strip())
    markup = keyboards.build_back_keyboard(lang)
    if avatar_url:
        _replace_with_photo(chat_id, message_id, has_photo, avatar_url, text, reply_markup=markup)
        return
    _replace_with_text(chat_id, message_id, has_photo, text, reply_markup=markup)
    return


def handle_contact_mentor(chat_id: int, lang: str):
    phone = db.get_user_phone(chat_id)
    if not phone:
        db.set_state(chat_id, "awaiting_phone")
        telegram_api.send_message(
            chat_id,
            i18n.t(lang, "phone_request"),
            reply_markup=keyboards.build_remove_keyboard(lang),
        )
        return
    render_contact_mentor(chat_id, lang)


def handle_news(chat_id: int, lang: str, message_id: Optional[int] = None, has_photo: bool = False):
    items = db.fetch_latest_news(config.DEFAULT_NEWS_LIMIT)
    if not items:
        text = i18n.t(lang, "no_news")
        _replace_with_text(chat_id, message_id, has_photo, text, reply_markup=keyboards.build_back_to_menu_keyboard(lang))
        return
    blocks = [format_news_item(item) for item in items]
    text = i18n.t(lang, "last_news", items="\n\n".join(blocks))
    _replace_with_text(chat_id, message_id, has_photo, text, reply_markup=keyboards.build_back_to_menu_keyboard(lang))


def render_lesson_calendar(
    chat_id: int,
    lang: str,
    page: int = 1,
    message_id: Optional[int] = None,
    has_photo: bool = False,
):
    phone = db.get_user_phone(chat_id)
    if not phone:
        db.set_state(chat_id, "awaiting_phone")
        telegram_api.send_message(
            chat_id,
            i18n.t(lang, "phone_request"),
            reply_markup=keyboards.build_remove_keyboard(lang),
        )
        return
    profile = site_api.fetch_profile_by_phone(phone)
    if not profile or profile.get("error"):
        telegram_api.send_message(chat_id, i18n.t(lang, "calendar_empty"), reply_markup=keyboards.build_back_to_menu_keyboard(lang))
        return

    level_raw = str(profile.get("level") or "").strip()
    level = _normalize_level(level_raw)
    if not level:
        telegram_api.send_message(chat_id, i18n.t(lang, "level_none"), reply_markup=keyboards.build_back_to_menu_keyboard(lang))
        return

    titles_map = content.get_lesson_titles(level)
    total_lessons = int(profile.get("total_lessons") or 0)
    if total_lessons <= 0:
        total_lessons = int(content.COURSE_LESSON_COUNTS.get(level, 0) or 0)
    if total_lessons <= 0 and titles_map:
        total_lessons = max(titles_map.keys(), default=0)
    if total_lessons <= 0:
        telegram_api.send_message(chat_id, i18n.t(lang, "calendar_empty"), reply_markup=keyboards.build_back_to_menu_keyboard(lang))
        return

    completed_count = int(profile.get("completed_lessons") or 0)
    completed_list = profile.get("completed_lessons_list")
    completed_set = set()
    if isinstance(completed_list, list):
        for item in completed_list:
            try:
                completed_set.add(int(item))
            except (TypeError, ValueError):
                continue
    if not completed_set and completed_count > 0:
        completed_set = set(range(1, min(completed_count, total_lessons) + 1))

    if "available_lessons" in profile:
        try:
            available_lessons = int(profile.get("available_lessons") or 0)
        except (TypeError, ValueError):
            available_lessons = 0
    else:
        available_lessons = total_lessons

    page_size = 5
    total_pages = max(1, int(math.ceil(total_lessons / page_size)))
    page = max(1, min(int(page or 1), total_pages))
    start_index = (page - 1) * page_size + 1
    end_index = min(total_lessons, start_index + page_size - 1)

    next_unlock_seconds = int(profile.get("next_unlock_seconds") or 0)
    lines = []
    for lesson_number in range(start_index, end_index + 1):
        raw_title = titles_map.get(lesson_number) or ""
        topic = ""
        if raw_title:
            match = re.search(r"Lesson\s+\d+\s*[:\-]\s*(.+)$", raw_title, re.IGNORECASE)
            if match:
                topic = match.group(1).strip()
            elif re.search(r"\bLesson\s+\d+\b", raw_title, re.IGNORECASE):
                topic = ""
            else:
                topic = raw_title.strip()
        title = f"Lesson {lesson_number}: {topic}" if topic else f"Lesson {lesson_number}"
        title = escape_html(title)
        url = _lesson_page_url(level, lesson_number)
        link = f'<a href="{escape_html(url)}">{title}</a>' if url else title
        if lesson_number in completed_set:
            status = i18n.t(lang, "lesson_completed")
        elif lesson_number <= max(0, available_lessons):
            status = i18n.t(lang, "lesson_incomplete")
        else:
            if lesson_number == max(0, available_lessons) + 1 and next_unlock_seconds > 0:
                eta = _format_next_unlock(lang, next_unlock_seconds)
                status = i18n.t(lang, "lesson_unlocks_in", time=escape_html(eta))
            else:
                status = i18n.t(lang, "lesson_locked")
        lines.append(f"• {link} — {status}")

    text = i18n.t(
        lang,
        "calendar_title",
        level=escape_html(level),
        completed=completed_count,
        total=total_lessons,
        page=page,
        pages=total_pages,
        items="\n".join(lines),
    )
    markup = keyboards.build_calendar_pagination(lang, page, total_pages)
    _replace_with_text(chat_id, message_id, has_photo, text, reply_markup=markup)


def handle_lesson_calendar(chat_id: int, lang: str):
    render_lesson_calendar(chat_id, lang)


def handle_daily_material(chat_id: int, lang: str, message_id: Optional[int] = None, has_photo: bool = False):
    text = i18n.t(lang, "daily_title", text=escape_html(content.pick_daily_material()))
    _replace_with_text(chat_id, message_id, has_photo, text, reply_markup=keyboards.build_back_to_menu_keyboard(lang))


def _normalize_phone_input(raw: str) -> str:
    value = (raw or "").strip()
    if not value:
        return ""
    cleaned = re.sub(r"[()\s\-._]", "", value)
    if cleaned.startswith("00"):
        cleaned = "+" + cleaned[2:]
    cleaned = re.sub(r"[^+\d]", "", cleaned)
    if cleaned.count("+") > 1:
        cleaned = cleaned.replace("+", "")
        cleaned = "+" + cleaned
    if cleaned.startswith("+"):
        cleaned = "+" + re.sub(r"\D", "", cleaned[1:])
    else:
        cleaned = re.sub(r"\D", "", cleaned)
    return cleaned


def _format_parent_line(item: dict, lang: str) -> str:
    relation = str(item.get("relation") or "").strip().lower()
    relation_label = ""
    if relation == "mother":
        relation_label = i18n.label(lang, "mother")
    elif relation == "father":
        relation_label = i18n.label(lang, "father")
    first_name = escape_html(str(item.get("first_name") or "").strip())
    last_name = escape_html(str(item.get("last_name") or "").strip())
    phone = escape_html(str(item.get("phone") or "").strip())
    full_name = " ".join([p for p in [first_name, last_name] if p]).strip() or "—"
    head = f"{relation_label} — {full_name}" if relation_label else full_name
    return f"• {head}\n  {phone}" if phone else f"• {head}"


def render_parents(chat_id: int, lang: str, message_id: Optional[int] = None, has_photo: bool = False):
    phone = db.get_user_phone(chat_id)
    if not phone:
        _set_state_with_payload(chat_id, "awaiting_phone", {"next": "parents"})
        telegram_api.send_message(
            chat_id,
            i18n.t(lang, "phone_request"),
            reply_markup=keyboards.build_remove_keyboard(lang),
        )
        return
    items = db.list_parents(chat_id)
    if not items:
        body = i18n.t(lang, "parents_empty")
    else:
        body = "\n\n".join([_format_parent_line(item, lang) for item in items[:10]])
    text = i18n.t(lang, "parents_title", items=body)
    _replace_with_text(
        chat_id,
        message_id,
        has_photo,
        text,
        reply_markup=keyboards.build_parents_root_keyboard(lang),
    )


def start_add_parent_flow(chat_id: int, lang: str, message_id: Optional[int] = None, has_photo: bool = False):
    phone = db.get_user_phone(chat_id)
    if not phone:
        _set_state_with_payload(chat_id, "awaiting_phone", {"next": "parents"})
        _replace_with_text(chat_id, message_id, has_photo, i18n.t(lang, "phone_request"), reply_markup=keyboards.build_remove_keyboard(lang))
        return
    # Ask for first name first — each step sends a NEW message (no editing)
    _set_state_with_payload(chat_id, "awaiting_parent_first_name", {})
    telegram_api.send_message(chat_id, i18n.t(lang, "parent_add_first_name"), reply_markup=keyboards.build_parents_cancel_keyboard(lang))


def handle_parent_self_link(chat_id: int, lang: str):
    """Entry point for parents who want to link their Telegram without a site account."""
    db.set_state(chat_id, "awaiting_parent_self_phone")
    telegram_api.send_message(chat_id, i18n.t(lang, "parent_self_start"))


def handle_tip(chat_id: int, lang: str, message_id: Optional[int] = None, has_photo: bool = False):
    text = i18n.t(lang, "tip_title", text=escape_html(content.pick_tip()))
    _replace_with_text(chat_id, message_id, has_photo, text, reply_markup=keyboards.build_back_to_menu_keyboard(lang))


def start_level_flow(chat_id: int, lang: str):
    text = i18n.t(lang, "level_prompt")
    db.set_state(chat_id, "awaiting_level")
    telegram_api.send_message(chat_id, text, reply_markup=keyboards.build_level_keyboard(lang))


def handle_level(chat_id: int, lang: str, message_id: Optional[int] = None, has_photo: bool = False):
    current = _get_profile_level(chat_id, lang)
    if current is None:
        return
    if not current:
        _replace_with_text(
            chat_id,
            message_id,
            has_photo,
            i18n.t(lang, "level_none"),
            reply_markup=keyboards.build_back_to_menu_keyboard(lang),
        )
        return
    text = i18n.t(lang, "level_current", level=escape_html(current))
    _replace_with_text(chat_id, message_id, has_photo, text, reply_markup=keyboards.build_back_to_menu_keyboard(lang))


def handle_recommendations(chat_id: int, lang: str, message_id: Optional[int] = None, has_photo: bool = False):
    raw_level = _get_profile_level(chat_id, lang)
    if raw_level is None:
        return
    if not raw_level:
        _replace_with_text(
            chat_id,
            message_id,
            has_photo,
            i18n.t(lang, "level_none"),
            reply_markup=keyboards.build_back_to_menu_keyboard(lang),
        )
        return
    level = _normalize_level(raw_level)
    if not level:
        _replace_with_text(
            chat_id,
            message_id,
            has_photo,
            i18n.t(lang, "level_none"),
            reply_markup=keyboards.build_back_to_menu_keyboard(lang),
        )
        return
    tips = content.LEVEL_RECOMMENDATIONS.get(level, [])
    if not tips:
        _replace_with_text(
            chat_id,
            message_id,
            has_photo,
            i18n.t(lang, "recommend_empty"),
            reply_markup=keyboards.build_back_to_menu_keyboard(lang),
        )
        return
    lines = "\n".join([f"• {escape_html(item)}" for item in tips])
    text = i18n.t(lang, "recommend_title", level=escape_html(level), items=lines)
    _replace_with_text(chat_id, message_id, has_photo, text, reply_markup=keyboards.build_back_to_menu_keyboard(lang))


def render_admin_panel(chat_id: int, lang: str, message_id: Optional[int] = None, has_photo: bool = False):
    text = i18n.t(lang, "admin_panel")
    markup = keyboards.build_admin_root_keyboard(lang)
    if message_id is not None:
        telegram_api.edit_message_text(chat_id, message_id, text, reply_markup=markup)
        return
    return telegram_api.send_message(chat_id, text, reply_markup=markup)


def render_admin_mark_requests(chat_id: int, lang: str, message_id: Optional[int] = None):
    items = site_api.fetch_admin_enrollment_requests()
    pending = [item for item in items if int(item.get("seen_by_admin", 0) or 0) == 0]
    if not pending:
        text = i18n.t(lang, "admin_mark_requests_empty")
        markup = keyboards.build_admin_mark_requests_keyboard(lang, [])
    else:
        lines = []
        request_ids = []
        display_index = 0
        for item in pending:
            if display_index >= 15:
                break
            request_id = int(item.get("id") or 0)
            if request_id <= 0:
                continue
            display_index += 1
            request_ids.append(request_id)
            status = f"<b>{display_index}.</b> <b>NEW</b>"
            lines.append(_format_admin_request_line(item, status))
        text = i18n.t(lang, "admin_mark_requests_title", items="\n\n".join(lines))
        markup = keyboards.build_admin_mark_requests_keyboard(lang, request_ids)
    if message_id is not None:
        telegram_api.edit_message_text(chat_id, message_id, text, reply_markup=markup)
        return
    return telegram_api.send_message(chat_id, text, reply_markup=markup)


def render_admin_mark_request_detail(chat_id: int, lang: str, request_id: int, message_id: Optional[int] = None):
    if request_id <= 0:
        text = i18n.t(lang, "admin_mark_request_missing")
        markup = keyboards.build_admin_mark_requests_keyboard(lang, [])
    else:
        items = site_api.fetch_admin_enrollment_requests()
        pending = [item for item in items if int(item.get("seen_by_admin", 0) or 0) == 0]
        target = None
        index = 0
        for idx, item in enumerate(pending, start=1):
            if int(item.get("id") or 0) == request_id:
                target = item
                index = idx
                break
        if not target:
            text = i18n.t(lang, "admin_mark_request_missing")
            markup = keyboards.build_admin_mark_requests_keyboard(lang, [])
        else:
            line = _format_admin_request_line(target, "")
            text = i18n.t(lang, "admin_mark_request_detail", index=index, item=line)
            markup = keyboards.build_admin_mark_request_action_keyboard(lang, request_id)
    if message_id is not None:
        telegram_api.edit_message_text(chat_id, message_id, text, reply_markup=markup)
        return
    return telegram_api.send_message(chat_id, text, reply_markup=markup)


def handle_admin_panel(chat_id: int, lang: str):
    render_admin_panel(chat_id, lang)


def render_admin_menu(chat_id: int, lang: str, message_id: Optional[int] = None):
    text = i18n.t(lang, "admin_panel")
    markup = keyboards.build_admin_inline_keyboard(lang)
    if message_id is not None:
        telegram_api.edit_message_text(chat_id, message_id, text, reply_markup=markup)
        return
    return telegram_api.send_message(chat_id, text, reply_markup=markup)


def handle_mentor_panel(chat_id: int, lang: str):
    text = i18n.t(lang, "mentor_panel")
    telegram_api.send_message(chat_id, text, reply_markup=keyboards.build_mentor_keyboard(lang))


def handle_admin_stats(chat_id: int, lang: str):
    total_users, news_count = db.get_admin_stats()
    text = i18n.t(lang, "admin_stats", users=total_users, news=news_count)
    telegram_api.send_message(chat_id, text, reply_markup=keyboards.build_admin_inline_keyboard(lang))


def _format_admin_lines(items: list, build_line):
    lines = []
    for idx, item in enumerate(items, start=1):
        if idx > 15:
            break
        try:
            lines.append(build_line(item))
        except Exception:
            continue
    return lines


def _load_state_payload(state: Optional[dict]) -> dict:
    if not state:
        return {}
    raw = state.get("payload") or ""
    if not raw:
        return {}
    try:
        payload = json.loads(raw)
    except json.JSONDecodeError:
        return {}
    return payload if isinstance(payload, dict) else {}


def _set_state_with_payload(chat_id: int, state: str, payload: dict):
    db.set_state(chat_id, state, json.dumps(payload or {}, ensure_ascii=False))


def _format_admin_request_line(item: dict, status_label: str = "") -> str:
    name = escape_html(str(item.get("full_name") or "-"))
    level = escape_html(str(item.get("level") or "-"))
    price = escape_html(str(item.get("price_label") or ""))
    phone = escape_html(str(item.get("phone") or ""))
    schedule_raw = str(item.get("lesson_schedule") or "")
    schedule_key = _normalize_schedule_key(schedule_raw)
    schedule_label = ""
    if schedule_key == "mwf":
        schedule_label = "Mon / Wed / Fri"
    elif schedule_key == "tthsa":
        schedule_label = "Tue / Thu / Sat"
    tg = str(item.get("telegram_username") or "").strip()
    tg = f"@{tg.lstrip('@')}" if tg else ""
    user = escape_html(str(item.get("submitted_username") or ""))
    created = str(item.get("created_at") or "")
    created = escape_html(created.replace("T", " ")[:16]) if created else ""

    header_parts = [f"{name} ({level})"]
    if price:
        header_parts.append(price)
    header = " - ".join(header_parts)
    if status_label:
        header = f"{status_label} {header}"

    schedule_part = f"Schedule: {schedule_label}" if schedule_label else ""
    meta_parts = [p for p in [phone, tg, schedule_part, user, created] if p]
    if meta_parts:
        return f"{header}\n" + " | ".join(meta_parts)
    return header


def render_admin_requests(chat_id: int, lang: str, message_id: Optional[int] = None):
    items = site_api.fetch_admin_enrollment_requests()
    if not items:
        text = i18n.t(lang, "admin_requests_title", items=i18n.t(lang, "admin_empty"))
    else:
        def build_line(item):
            status = "<b>NEW</b>" if int(item.get("seen_by_admin", 0) or 0) == 0 else "CREATED"
            return _format_admin_request_line(item, status)

        lines = _format_admin_lines(items[:5], build_line)
        text = i18n.t(lang, "admin_requests_title", items="\n\n".join(lines))
        max_id = max((int(item.get("id") or 0) for item in items), default=0)
        if max_id:
            db.set_meta("last_enrollment_request_id", str(max_id))

    markup = keyboards.build_admin_requests_keyboard(lang)
    if isinstance(markup, dict) and config.SITE_WEB_URL:
        web_url = f"{config.SITE_WEB_URL}/admin.html"
        rows = list(markup.get("inline_keyboard") or [])
        rows.insert(
            max(0, len(rows) - 1),
            [{"text": i18n.label(lang, "admin_more_requests"), "url": web_url}],
        )
        markup["inline_keyboard"] = rows
    if message_id is not None:
        telegram_api.edit_message_text(chat_id, message_id, text, reply_markup=markup)
        return
    return telegram_api.send_message(chat_id, text, reply_markup=markup)


def render_admin_create_user_requests(chat_id: int, lang: str, message_id: Optional[int] = None):
    items = site_api.fetch_admin_enrollment_requests()
    pending = [item for item in items if int(item.get("seen_by_admin", 0) or 0) == 0]
    if not pending:
        text = i18n.t(lang, "admin_create_user_pick_empty")
        markup = keyboards.build_admin_create_user_pick_keyboard(lang, [])
    else:
        lines = []
        request_ids = []
        display_index = 0
        for item in pending:
            if display_index >= 15:
                break
            request_id = int(item.get("id") or 0)
            if request_id <= 0:
                continue
            display_index += 1
            request_ids.append(request_id)
            status = f"<b>{display_index}.</b>"
            lines.append(_format_admin_request_line(item, status))
        text = i18n.t(lang, "admin_create_user_pick_title", items="\n\n".join(lines))
        markup = keyboards.build_admin_create_user_pick_keyboard(lang, request_ids)
    if message_id is not None:
        telegram_api.edit_message_text(chat_id, message_id, text, reply_markup=markup)
        return
    return telegram_api.send_message(chat_id, text, reply_markup=markup)


def start_admin_create_user_from_request(
    chat_id: int,
    lang: str,
    item: dict,
    message_id: Optional[int] = None,
):
    request_id = int(item.get("id") or 0)
    full_name = str(item.get("full_name") or "").strip()
    phone = str(item.get("phone") or "").strip()
    level_raw = str(item.get("level") or "").strip()
    price_label = str(item.get("price_label") or "").strip()
    schedule_raw = str(item.get("lesson_schedule") or "").strip()
    level_value = _normalize_request_level(level_raw, price_label)
    username = _generate_username(full_name)
    password = _generate_password()
    schedule_key = _normalize_schedule_key(schedule_raw)
    payload = {
        "request_id": request_id,
        "name": full_name,
        "phone": phone,
        "level": level_value,
        "username": username,
        "password": password,
        "price_label": price_label,
        "schedule": schedule_key,
    }
    summary_line = _format_admin_request_line(item, "")
    summary_text = i18n.t(
        lang,
        "admin_create_user_summary",
        item=summary_line,
        username=escape_html(username),
        password=escape_html(password),
    )
    summary_markup = keyboards.build_admin_create_user_back_keyboard(lang)
    if message_id is not None:
        telegram_api.edit_message_text(chat_id, message_id, summary_text, reply_markup=summary_markup)
    else:
        telegram_api.send_message(chat_id, summary_text, reply_markup=summary_markup)
    if _is_express_request(level_raw, price_label):
        payload["schedule"] = ""
    _set_state_with_payload(chat_id, "admin_create_user_receipt", payload)
    _send_create_user_prompt(chat_id, lang, "admin_create_user_receipt")


def render_admin_status(chat_id: int, lang: str, message_id: Optional[int] = None):
    items = site_api.fetch_admin_enrollment_requests()
    pending = [item for item in items if int(item.get("seen_by_admin", 0) or 0) == 0]
    if not pending:
        text = i18n.t(lang, "admin_status_empty")
        markup = keyboards.build_admin_status_keyboard(lang, [])
    else:
        lines = []
        request_ids = []
        display_index = 0
        for item in pending:
            if display_index >= 15:
                break
            request_id = int(item.get("id") or 0)
            if request_id <= 0:
                continue
            display_index += 1
            request_ids.append(request_id)
            status = f"<b>{display_index}.</b> IN PROGRESS"
            lines.append(_format_admin_request_line(item, status))
        text = i18n.t(lang, "admin_status_title", items="\n\n".join(lines))
        markup = keyboards.build_admin_status_keyboard(lang, request_ids)
    if message_id is not None:
        telegram_api.edit_message_text(chat_id, message_id, text, reply_markup=markup)
        return
    return telegram_api.send_message(chat_id, text, reply_markup=markup)


def render_admin_status_detail(chat_id: int, lang: str, request_id: int, message_id: Optional[int] = None):
    if request_id <= 0:
        text = i18n.t(lang, "admin_mark_request_missing")
        markup = keyboards.build_admin_status_keyboard(lang, [])
    else:
        items = site_api.fetch_admin_enrollment_requests()
        pending = [item for item in items if int(item.get("seen_by_admin", 0) or 0) == 0]
        target = None
        index = 0
        for idx, item in enumerate(pending, start=1):
            if int(item.get("id") or 0) == request_id:
                target = item
                index = idx
                break
        if not target:
            text = i18n.t(lang, "admin_mark_request_missing")
            markup = keyboards.build_admin_status_keyboard(lang, [])
        else:
            line = _format_admin_request_line(target, "IN PROGRESS")
            text = i18n.t(lang, "admin_status_detail", index=index, item=line)
            markup = keyboards.build_admin_status_action_keyboard(lang, request_id)
    if message_id is not None:
        telegram_api.edit_message_text(chat_id, message_id, text, reply_markup=markup)
        return
    return telegram_api.send_message(chat_id, text, reply_markup=markup)


def render_admin_solved(chat_id: int, lang: str, message_id: Optional[int] = None):
    items = site_api.fetch_admin_enrollment_requests()
    solved = [item for item in items if int(item.get("seen_by_admin", 0) or 0) == 1]
    if not solved:
        text = i18n.t(lang, "admin_solved_empty")
    else:
        lines = []
        for idx, item in enumerate(solved, start=1):
            if idx > 15:
                break
            status = f"<b>{idx}.</b> DONE"
            lines.append(_format_admin_request_line(item, status))
        text = i18n.t(lang, "admin_solved_title", items="\n\n".join(lines))
    markup = keyboards.build_admin_solved_keyboard(lang)
    if message_id is not None:
        telegram_api.edit_message_text(chat_id, message_id, text, reply_markup=markup)
        return
    return telegram_api.send_message(chat_id, text, reply_markup=markup)


def render_admin_renewals(chat_id: int, lang: str, message_id: Optional[int] = None):
    items = site_api.fetch_admin_renewal_requests()
    if not items:
        text = i18n.t(lang, "admin_renewals_title", items=i18n.t(lang, "admin_empty"))
    else:
        def build_line(item):
            name = escape_html(str(item.get("full_name") or "—"))
            level = escape_html(str(item.get("level") or "—"))
            price = escape_html(str(item.get("price_label") or ""))
            phone = escape_html(str(item.get("phone") or ""))
            tg = str(item.get("telegram_username") or "").strip()
            tg = f"@{tg.lstrip('@')}" if tg else ""
            user = escape_html(str(item.get("submitted_username") or ""))
            parts = [f"{name} ({level})", price]
            contact = " | ".join([p for p in [phone, tg] if p])
            line = " — ".join([p for p in parts if p])
            if contact:
                line = f"{line}\n{contact}"
            if user:
                line = f"{line}\n{user}"
            return line

        lines = _format_admin_lines(items, build_line)
        text = i18n.t(lang, "admin_renewals_title", items="\n\n".join(lines))
        max_id = max((int(item.get("id") or 0) for item in items), default=0)
        if max_id:
            db.set_meta("last_renewal_request_id", str(max_id))

    markup = keyboards.build_admin_inline_keyboard(lang)
    if message_id is not None:
        telegram_api.edit_message_text(chat_id, message_id, text, reply_markup=markup)
        return
    return telegram_api.send_message(chat_id, text, reply_markup=markup)


def render_admin_messages(chat_id: int, lang: str, message_id: Optional[int] = None):
    items = site_api.fetch_admin_contact_messages()
    if not items:
        text = i18n.t(lang, "admin_messages_title", items=i18n.t(lang, "admin_empty"))
    else:
        def build_line(item):
            status = "NEW" if int(item.get("seen_by_admin", 0) or 0) == 0 else "SEEN"
            name = escape_html(str(item.get("full_name") or "—"))
            email = escape_html(str(item.get("email") or ""))
            message = str(item.get("message") or "").strip().replace("\n", " ")
            if len(message) > 120:
                message = message[:117].rstrip() + "..."
            message = escape_html(message)
            created = str(item.get("created_at") or "")
            created = escape_html(created.replace("T", " ")[:16]) if created else ""
            header = f"{status} {name}"
            if email:
                header = f"{header} | {email}"
            if created:
                header = f"{header} | {created}"
            return f"{header}\n{message}"

        lines = _format_admin_lines(items, build_line)
        text = i18n.t(lang, "admin_messages_title", items="\n\n".join(lines))
        max_id = max((int(item.get("id") or 0) for item in items), default=0)
        if max_id:
            db.set_meta("last_contact_message_id", str(max_id))

    markup = keyboards.build_admin_inline_keyboard(lang)
    if message_id is not None:
        telegram_api.edit_message_text(chat_id, message_id, text, reply_markup=markup)
        return
    return telegram_api.send_message(chat_id, text, reply_markup=markup)


def _send_create_user_prompt(chat_id: int, lang: str, key: str):
    if key == "admin_create_user_level":
        reply_markup = keyboards.build_admin_level_keyboard(lang)
    elif key == "admin_create_user_schedule":
        reply_markup = keyboards.build_admin_schedule_keyboard(lang)
    else:
        reply_markup = keyboards.build_admin_create_user_back_keyboard(lang)
    telegram_api.send_message(chat_id, i18n.t(lang, key), reply_markup=reply_markup)


def start_admin_create_user(chat_id: int, lang: str):
    render_admin_create_user_requests(chat_id, lang)


def _pick_receipt_file(message: dict):
    photos = message.get("photo")
    if isinstance(photos, list) and photos:
        photo = photos[-1]
        if isinstance(photo, dict) and photo.get("file_id"):
            return {
                "file_id": str(photo["file_id"]),
                "file_name": "receipt.jpg",
                "mime_type": "image/jpeg",
            }
    document = message.get("document")
    if isinstance(document, dict) and document.get("file_id"):
        mime_type = str(document.get("mime_type") or "").strip()
        file_name = str(document.get("file_name") or "").strip() or "receipt"
        if mime_type and not (mime_type.startswith("image/") or mime_type == "application/pdf"):
            return {"error": "invalid_type"}
        return {
            "file_id": str(document["file_id"]),
            "file_name": file_name,
            "mime_type": mime_type or "application/octet-stream",
        }
    return {}


def handle_admin_create_user_receipt(chat_id: int, lang: str, message: dict):
    payload = _load_state_payload(db.get_state(chat_id))
    level_value = str(payload.get("level") or "")
    price_label = str(payload.get("price_label") or "")
    is_express = _is_express_request(level_value, price_label)
    if is_express:
        payload["schedule"] = ""
    else:
        schedule_value = str(payload.get("schedule") or "").strip()
        if not schedule_value and payload.get("request_id"):
            schedule_value = "mwf"
            payload["schedule"] = schedule_value
        if not schedule_value:
            telegram_api.send_message(chat_id, i18n.t(lang, "admin_create_user_invalid_schedule"))
            _set_state_with_payload(chat_id, "admin_create_user_schedule", payload)
            _send_create_user_prompt(chat_id, lang, "admin_create_user_schedule")
            return

    picked = _pick_receipt_file(message or {})
    if not picked:
        telegram_api.send_message(chat_id, i18n.t(lang, "admin_create_user_receipt"))
        return
    if picked.get("error") == "invalid_type":
        telegram_api.send_message(chat_id, i18n.t(lang, "admin_create_user_receipt_type"))
        return

    file_id = picked.get("file_id") or ""
    file_name = picked.get("file_name") or "receipt"
    mime_type = picked.get("mime_type") or "application/octet-stream"
    info = telegram_api.get_file(file_id) if file_id else None
    file_path = info.get("file_path") if isinstance(info, dict) else ""
    file_bytes = telegram_api.download_file_bytes(file_path) if file_path else None
    if not file_bytes:
        telegram_api.send_message(chat_id, i18n.t(lang, "admin_create_user_receipt_error"))
        return

    username = str(payload.get("username") or "").strip() or _generate_username(payload.get("name", ""))
    password = str(payload.get("password") or "").strip() or _generate_password()
    payload["username"] = username
    payload["password"] = password
    result = None
    error = None
    for attempt in range(2):
        result = site_api.admin_create_user(
            {
                "name": payload.get("name", ""),
                "phone": payload.get("phone", ""),
                "level": payload.get("level", ""),
                "lesson_schedule": payload.get("schedule", ""),
                "username": payload.get("username", ""),
                "password": payload.get("password", ""),
            }
        )
        if not isinstance(result, dict):
            error = "request_failed"
            break
        error = result.get("error")
        if not error:
            break
        if "username" in str(error).lower() and attempt == 0:
            payload["username"] = _generate_username(payload.get("name", ""))
            continue
        break

    if error:
        safe_error = escape_html(str(error))
        telegram_api.send_message(chat_id, i18n.t(lang, "admin_create_user_error", error=safe_error))
        db.clear_state(chat_id)
        render_admin_create_user_requests(chat_id, lang)
        return

    username = str(result.get("username") or payload.get("username") or "").strip()
    encoded = base64.b64encode(file_bytes).decode("ascii")
    file_data = f"data:{mime_type};base64,{encoded}"
    payment_date = (utc_now() or "").split("T")[0]
    upload_result = site_api.admin_upload_payment_check(
        {
            "username": username,
            "payment_date": payment_date,
            "file_name": file_name,
            "file_data": file_data,
        }
    )
    if isinstance(upload_result, dict) and upload_result.get("error"):
        telegram_api.send_message(chat_id, i18n.t(lang, "admin_create_user_receipt_upload_failed"))

    request_id = int(payload.get("request_id") or 0)
    if request_id:
        site_api.admin_mark_enrollment_request(request_id)

    db.clear_state(chat_id)
    telegram_api.send_message(
        chat_id,
        i18n.t(
            lang,
            "admin_create_user_success",
            username=escape_html(username),
            password=escape_html(payload.get("password") or password),
        ),
        reply_markup=keyboards.build_admin_create_user_back_keyboard(lang),
    )


def handle_admin_create_user_input(chat_id: int, lang: str, state_name: str, text: str):
    payload = _load_state_payload(db.get_state(chat_id))
    value = (text or "").strip()
    if value and i18n.matches(value, "back"):
        db.clear_state(chat_id)
        render_admin_panel(chat_id, lang)
        return

    if state_name == "admin_create_user_name":
        if not value:
            _send_create_user_prompt(chat_id, lang, "admin_create_user_name")
            return
        payload["name"] = value
        _set_state_with_payload(chat_id, "admin_create_user_phone", payload)
        _send_create_user_prompt(chat_id, lang, "admin_create_user_phone")
        return

    if state_name == "admin_create_user_phone":
        digits = re.sub(r"\D", "", value)
        if len(digits) < 7:
            telegram_api.send_message(chat_id, i18n.t(lang, "admin_create_user_invalid_phone"))
            _send_create_user_prompt(chat_id, lang, "admin_create_user_phone")
            return
        payload["phone"] = value
        _set_state_with_payload(chat_id, "admin_create_user_level", payload)
        _send_create_user_prompt(chat_id, lang, "admin_create_user_level")
        return

    if state_name == "admin_create_user_level":
        if not _normalize_level(value):
            telegram_api.send_message(chat_id, i18n.t(lang, "admin_create_user_invalid_level"))
            _send_create_user_prompt(chat_id, lang, "admin_create_user_level")
            return
        payload["level"] = value
        _set_state_with_payload(chat_id, "admin_create_user_schedule", payload)
        _send_create_user_prompt(chat_id, lang, "admin_create_user_schedule")
        return

    if state_name == "admin_create_user_schedule":
        level_value = str(payload.get("level") or "")
        price_label = str(payload.get("price_label") or "")
        if _is_express_request(level_value, price_label):
            payload["schedule"] = ""
            _set_state_with_payload(chat_id, "admin_create_user_receipt", payload)
            _send_create_user_prompt(chat_id, lang, "admin_create_user_receipt")
            return
        schedule_key = _normalize_schedule_key(value)
        if not schedule_key:
            telegram_api.send_message(chat_id, i18n.t(lang, "admin_create_user_invalid_schedule"))
            _send_create_user_prompt(chat_id, lang, "admin_create_user_schedule")
            return
        payload["schedule"] = schedule_key
        _set_state_with_payload(chat_id, "admin_create_user_receipt", payload)
        _send_create_user_prompt(chat_id, lang, "admin_create_user_receipt")
        return

    if state_name == "admin_create_user_username":
        if not value or re.search(r"\s", value):
            telegram_api.send_message(chat_id, i18n.t(lang, "admin_create_user_invalid_username"))
            _send_create_user_prompt(chat_id, lang, "admin_create_user_username")
            return
        payload["username"] = value
        _set_state_with_payload(chat_id, "admin_create_user_password", payload)
        _send_create_user_prompt(chat_id, lang, "admin_create_user_password")
        return

    if state_name == "admin_create_user_password":
        if len(value) < 6:
            telegram_api.send_message(chat_id, i18n.t(lang, "admin_create_user_short_password"))
            _send_create_user_prompt(chat_id, lang, "admin_create_user_password")
            return
        payload["password"] = value
        _set_state_with_payload(chat_id, "admin_create_user_receipt", payload)
        _send_create_user_prompt(chat_id, lang, "admin_create_user_receipt")
        return

    if state_name == "admin_create_user_receipt":
        telegram_api.send_message(chat_id, i18n.t(lang, "admin_create_user_receipt"))
        return


def start_news_flow(chat_id: int, lang: str):
    text = i18n.t(lang, "news_flow_prompt")
    db.set_state(chat_id, "awaiting_news_text")
    telegram_api.send_message(chat_id, text, reply_markup=keyboards.build_admin_inline_keyboard(lang))


def save_news_from_message(chat_id: int, author_name: str, raw_text: str, lang: str):
    raw_text = (raw_text or "").strip()
    if not raw_text:
        telegram_api.send_message(chat_id, i18n.t(lang, "news_empty"), reply_markup=keyboards.build_admin_inline_keyboard(lang))
        return
    title = ""
    body = raw_text
    if "\n" in raw_text:
        first_line, rest = raw_text.split("\n", 1)
        if len(first_line.strip()) <= 80:
            title = first_line.strip()
            body = rest.strip()
    db.add_news(title, body, chat_id, author_name or "")
    db.clear_state(chat_id)
    preview = format_news_item({"title": title, "body": body, "created_at": utc_now()})
    broadcast_text = i18n.t(lang, "news_title", item=preview)
    sent = broadcast_message(broadcast_text)
    telegram_api.send_message(
        chat_id,
        i18n.t(lang, "news_saved", count=sent),
        reply_markup=keyboards.build_admin_inline_keyboard(lang),
    )


def handle_cancel(chat_id: int, lang: str):
    state = db.get_state(chat_id)
    if not state:
        telegram_api.send_message(chat_id, i18n.t(lang, "cancel_none"), reply_markup=keyboards.build_remove_keyboard(lang))
        return
    if state.get("state", "").startswith("admin_create_user_"):
        db.clear_state(chat_id)
        telegram_api.send_message(
            chat_id,
            i18n.t(lang, "admin_create_user_cancelled"),
            reply_markup=keyboards.build_admin_root_keyboard(lang),
        )
        return
    db.clear_state(chat_id)
    telegram_api.send_message(chat_id, i18n.t(lang, "cancel_done"), reply_markup=keyboards.build_remove_keyboard(lang))


def start_language_flow(chat_id: int, lang: str):
    render_language_selection(chat_id, lang)


def handle_text(chat_id: int, role: str, first_name: str, text: str, lang: str):
    normalized = (text or "").strip()
    lowered = normalized.lower()

    state = db.get_state(chat_id)
    if state and state.get("state", "").startswith("admin_create_user_"):
        if role != "admin":
            db.clear_state(chat_id)
            telegram_api.send_message(chat_id, i18n.t(lang, "access_denied"), reply_markup=keyboards.build_remove_keyboard(lang))
            return
        handle_admin_create_user_input(chat_id, lang, state.get("state") or "", normalized)
        return
    if state and state.get("state") == "awaiting_phone":
        phone_norm = _normalize_phone_input(normalized)
        digits = re.sub(r"\D", "", phone_norm)
        if len(digits) < 7:
            telegram_api.send_message(chat_id, i18n.t(lang, "phone_error"), reply_markup=keyboards.build_remove_keyboard(lang))
            return
        profile = None
        try:
            profile = site_api.fetch_profile_by_phone(phone_norm)
        except Exception:
            profile = None
        if not profile:
            link = f"{config.SITE_WEB_URL.rstrip('/')}/index.html"
            telegram_api.send_message(
                chat_id,
                i18n.t(lang, "login_user_not_found", link=escape_html(link)),
                reply_markup=keyboards.build_remove_keyboard(lang),
            )
            db.set_state(chat_id, "awaiting_phone")
            return
        payload = _load_state_payload(state)
        payload["phone"] = phone_norm
        _set_state_with_payload(chat_id, "awaiting_login_username", payload)
        telegram_api.send_message(
            chat_id,
            i18n.t(lang, "login_username_request"),
            reply_markup=keyboards.build_remove_keyboard(lang),
        )
        return
    if state and state.get("state") == "awaiting_login_username":
        if not normalized:
            telegram_api.send_message(chat_id, i18n.t(lang, "login_username_request"), reply_markup=keyboards.build_remove_keyboard(lang))
            return
        payload = _load_state_payload(state)
        payload["username"] = normalized
        _set_state_with_payload(chat_id, "awaiting_login_password", payload)
        telegram_api.send_message(chat_id, i18n.t(lang, "login_password_request"), reply_markup=keyboards.build_remove_keyboard(lang))
        return
    if state and state.get("state") == "awaiting_login_password":
        payload = _load_state_payload(state)
        phone = str(payload.get("phone") or "").strip()
        username = str(payload.get("username") or "").strip()
        password = normalized
        if not phone or not username or not password:
            telegram_api.send_message(chat_id, i18n.t(lang, "login_password_request"), reply_markup=keyboards.build_remove_keyboard(lang))
            return
        try:
            result = site_api.bot_login(phone, username, password)
        except Exception:
            result = {"error": "request_failed"}
        if not isinstance(result, dict) or result.get("error"):
            _set_state_with_payload(chat_id, "awaiting_login_username", {"phone": phone})
            telegram_api.send_message(chat_id, i18n.t(lang, "login_invalid"), reply_markup=keyboards.build_remove_keyboard(lang))
            return
        db.set_user_phone(chat_id, phone)
        db.set_site_username(chat_id, str(result.get("username") or username))
        db.set_site_role(chat_id, str(result.get("role") or ""))
        site_full_name = str(result.get("full_name") or "").strip()
        if site_full_name:
            db.set_site_full_name(chat_id, site_full_name)
        level = str(result.get("level") or "").strip()
        if level:
            db.set_user_level(chat_id, level)
        try:
            site_api.link_telegram_chat_id(phone, chat_id)
        except Exception:
            pass
        db.clear_state(chat_id)
        display_name = site_full_name or first_name or ""
        telegram_api.send_message(
            chat_id,
            i18n.t(lang, "login_success", name=escape_html(display_name)),
            reply_markup=keyboards.build_remove_keyboard(lang),
        )
        render_start_message(chat_id, first_name, lang)
        return
    if state and state.get("state") == "awaiting_news_text":
        if lowered in {"/cancel", "отмена"}:
            db.clear_state(chat_id)
            telegram_api.send_message(chat_id, i18n.t(lang, "cancel_done"), reply_markup=keyboards.build_admin_inline_keyboard(lang))
            return
        if role != "admin":
            db.clear_state(chat_id)
            telegram_api.send_message(chat_id, i18n.t(lang, "access_denied"), reply_markup=keyboards.build_remove_keyboard(lang))
            return
        save_news_from_message(chat_id, first_name or "", normalized, lang)
        return

    if state and state.get("state") == "awaiting_parent_first_name":
        if not normalized:
            telegram_api.send_message(chat_id, i18n.t(lang, "parent_add_first_name"), reply_markup=keyboards.build_parents_cancel_keyboard(lang))
            return
        payload = _load_state_payload(state)
        payload["first_name"] = normalized
        _set_state_with_payload(chat_id, "awaiting_parent_last_name", payload)
        telegram_api.send_message(chat_id, i18n.t(lang, "parent_add_last_name"), reply_markup=keyboards.build_parents_cancel_keyboard(lang))
        return

    if state and state.get("state") == "awaiting_parent_last_name":
        if not normalized:
            telegram_api.send_message(chat_id, i18n.t(lang, "parent_add_last_name"), reply_markup=keyboards.build_parents_cancel_keyboard(lang))
            return
        payload = _load_state_payload(state)
        payload["last_name"] = normalized
        _set_state_with_payload(chat_id, "awaiting_parent_phone", payload)
        telegram_api.send_message(chat_id, i18n.t(lang, "parent_add_phone"), reply_markup=keyboards.build_parents_cancel_keyboard(lang))
        return

    if state and state.get("state") == "awaiting_parent_phone":
        phone = _normalize_phone_input(normalized)
        digits = re.sub(r"\D", "", phone)
        if len(digits) < 7:
            telegram_api.send_message(chat_id, i18n.t(lang, "parent_phone_error"), reply_markup=keyboards.build_parents_cancel_keyboard(lang))
            return
        payload = _load_state_payload(state)
        payload["phone"] = phone
        _set_state_with_payload(chat_id, "awaiting_parent_relation", payload)
        telegram_api.send_message(chat_id, i18n.t(lang, "parent_add_relation"), reply_markup=keyboards.build_parent_relation_keyboard(lang))
        return

    if state and state.get("state") == "awaiting_parent_self_phone":
        phone = _normalize_phone_input(normalized)
        digits = re.sub(r"\D", "", phone)
        if len(digits) < 7:
            telegram_api.send_message(chat_id, i18n.t(lang, "parent_phone_error"))
            return
        result = site_api.link_parent_chat(phone, chat_id)
        db.clear_state(chat_id)
        if isinstance(result, dict) and result.get("status") == "ok":
            telegram_api.send_message(chat_id, i18n.t(lang, "parent_self_success"))
        else:
            telegram_api.send_message(chat_id, i18n.t(lang, "parent_self_not_found", phone=phone))
        return

    if state and state.get("state") == "awaiting_level":
        db.clear_state(chat_id)
        telegram_api.send_message(
            chat_id,
            i18n.t(lang, "level_profile_only"),
            reply_markup=keyboards.build_remove_keyboard(lang),
        )
        return

    if state and state.get("state") == "awaiting_language":
        # Legacy state from the old reply-keyboard flow; clear and continue.
        db.clear_state(chat_id)

    if i18n.matches(normalized, "menu"):
        handle_menu(chat_id, lang)
        return
    if i18n.matches(normalized, "profile"):
        handle_profile(chat_id, lang)
        return
    if i18n.matches(normalized, "achievements"):
        handle_achievements(chat_id, lang)
        return
    if i18n.matches(normalized, "contact_mentor"):
        handle_contact_mentor(chat_id, lang)
        return
    if i18n.matches(normalized, "calendar"):
        handle_lesson_calendar(chat_id, lang)
        return
    if i18n.matches(normalized, "news"):
        handle_news(chat_id, lang)
        return
    if i18n.matches(normalized, "parents"):
        render_parents(chat_id, lang)
        return
    if i18n.matches(normalized, "tip"):
        handle_tip(chat_id, lang)
        return
    if i18n.matches(normalized, "recommend"):
        handle_recommendations(chat_id, lang)
        return
    if i18n.matches(normalized, "level"):
        handle_level(chat_id, lang)
        return
    if i18n.matches(normalized, "language"):
        start_language_flow(chat_id, lang)
        return
    if i18n.matches(normalized, "help"):
        handle_help(chat_id, lang)
        return
    if i18n.matches(normalized, "add_news"):
        if role != "admin":
            telegram_api.send_message(chat_id, i18n.t(lang, "access_denied"), reply_markup=keyboards.build_remove_keyboard(lang))
            return
        start_news_flow(chat_id, lang)
        return
    if i18n.matches(normalized, "stats"):
        if role != "admin":
            telegram_api.send_message(chat_id, i18n.t(lang, "access_denied"), reply_markup=keyboards.build_remove_keyboard(lang))
            return
        handle_admin_stats(chat_id, lang)
        return
    if i18n.matches(normalized, "admin_requests"):
        if role != "admin":
            telegram_api.send_message(chat_id, i18n.t(lang, "access_denied"), reply_markup=keyboards.build_remove_keyboard(lang))
            return
        render_admin_requests(chat_id, lang)
        return
    if i18n.matches(normalized, "admin_renewals"):
        if role != "admin":
            telegram_api.send_message(chat_id, i18n.t(lang, "access_denied"), reply_markup=keyboards.build_remove_keyboard(lang))
            return
        render_admin_renewals(chat_id, lang)
        return
    if i18n.matches(normalized, "admin_messages"):
        if role != "admin":
            telegram_api.send_message(chat_id, i18n.t(lang, "access_denied"), reply_markup=keyboards.build_remove_keyboard(lang))
            return
        render_admin_messages(chat_id, lang)
        return
    if i18n.matches(normalized, "tasks"):
        if role != "mentor":
            telegram_api.send_message(chat_id, i18n.t(lang, "access_denied"), reply_markup=keyboards.build_remove_keyboard(lang))
            return
        telegram_api.send_message(chat_id, i18n.t(lang, "feature_soon"), reply_markup=keyboards.build_mentor_keyboard(lang))
        return
    if i18n.matches(normalized, "back"):
        telegram_api.send_message(chat_id, i18n.t(lang, "main_menu"), reply_markup=keyboards.build_remove_keyboard(lang))
        return

    telegram_api.send_message(chat_id, i18n.t(lang, "unknown"), reply_markup=keyboards.build_remove_keyboard(lang))


def handle_command(chat_id: int, role: str, first_name: str, username: str, text: str, lang: str):
    parts = (text or "").split()
    command = parts[0].lower()
    args = parts[1:]

    if command == "/cancel":
        handle_cancel(chat_id, lang)
        return
    if command == "/start":
        handle_start(chat_id, first_name, lang)
        return
    if command == "/login":
        handle_login(chat_id, lang, first_name)
        return
    if command == "/help":
        handle_help(chat_id, lang)
        return
    if command == "/logout":
        handle_logout(chat_id, lang)
        return
    if command == "/myid":
        telegram_api.send_message(chat_id, i18n.t(lang, "chat_id", chat_id=chat_id))
        return
    if command == "/calendar":
        handle_lesson_calendar(chat_id, lang)
        return
    if command == "/news":
        handle_news(chat_id, lang)
        return
    if command == "/menu":
        handle_menu(chat_id, lang)
        return
    if command == "/profile":
        handle_profile(chat_id, lang)
        return
    if command == "/daily":
        handle_daily_material(chat_id, lang)
        return
    if command == "/parents":
        render_parents(chat_id, lang)
        return
    if command == "/parent":
        handle_parent_self_link(chat_id, lang)
        return
    if command == "/tip":
        handle_tip(chat_id, lang)
        return
    if command == "/recommend":
        handle_recommendations(chat_id, lang)
        return
    if command == "/level":
        handle_level(chat_id, lang)
        return
    if command == "/language":
        start_language_flow(chat_id, lang)
        return
    if command == "/mycode":
        if role != "admin":
            telegram_api.send_message(chat_id, i18n.t(lang, "access_denied"), reply_markup=keyboards.build_remove_keyboard(lang))
            return
        perm_code = site_api.get_admin_perm_code(chat_id)
        if perm_code:
            telegram_api.send_message(chat_id, f"🔐 Your permanent admin code:\n\n{perm_code}")
        else:
            telegram_api.send_message(chat_id, "No permanent code found. Request a PIN from the admin panel first.")
        return
    if command == "/admin":
        if role != "admin":
            telegram_api.send_message(chat_id, i18n.t(lang, "access_denied"), reply_markup=keyboards.build_remove_keyboard(lang))
            return
        handle_admin_panel(chat_id, lang)
        return
    if command == "/mentor":
        if role != "mentor":
            telegram_api.send_message(chat_id, i18n.t(lang, "access_denied"), reply_markup=keyboards.build_remove_keyboard(lang))
            return
        handle_mentor_panel(chat_id, lang)
        return
    if command == "/news_add":
        if role != "admin":
            telegram_api.send_message(chat_id, i18n.t(lang, "access_denied"), reply_markup=keyboards.build_remove_keyboard(lang))
            return
        if args:
            raw_text = " ".join(args)
            save_news_from_message(chat_id, first_name or username or "", raw_text, lang)
            return
        start_news_flow(chat_id, lang)
        return
    if command == "/broadcast":
        if role != "admin":
            telegram_api.send_message(chat_id, i18n.t(lang, "access_denied"), reply_markup=keyboards.build_remove_keyboard(lang))
            return
        raw_text = " ".join(args).strip()
        if not raw_text:
            telegram_api.send_message(
                chat_id,
                i18n.t(lang, "broadcast_need_text"),
                reply_markup=keyboards.build_admin_inline_keyboard(lang),
            )
            return
        message = i18n.t(lang, "broadcast_title", message=escape_html(raw_text))
        sent = broadcast_message(message)
        telegram_api.send_message(
            chat_id,
            i18n.t(lang, "broadcast_sent", count=sent),
            reply_markup=keyboards.build_admin_inline_keyboard(lang),
        )
        return

    handle_text(chat_id, role, first_name, text, lang)


def handle_update(update: dict):
    message = update.get("message") or update.get("edited_message")
    callback = update.get("callback_query")
    if callback:
        cb_id = callback.get("id")
        msg = callback.get("message", {})
        chat = msg.get("chat", {})
        chat_id = chat.get("id")
        if chat_id is None:
            return
        from_user = callback.get("from", {})
        username = from_user.get("username", "") or ""
        first_name = from_user.get("first_name", "") or ""
        last_name = from_user.get("last_name", "") or ""
        role = role_for_chat_id(int(chat_id))
        db.upsert_bot_user(int(chat_id), username, first_name, last_name, role)
        lang = db.get_user_language(int(chat_id)) or config.DEFAULT_LANGUAGE
        data = callback.get("data") or ""
        if cb_id:
            telegram_api.answer_callback(cb_id)
        message_id = msg.get("message_id")
        has_photo = bool(msg.get("photo"))
        if data == "open_start":
            render_start_message(int(chat_id), first_name, lang, message_id=message_id, has_photo=has_photo)
            return
        if data == "open_achievements":
            phone = db.get_user_phone(int(chat_id))
            if not phone:
                db.set_state(int(chat_id), "awaiting_phone")
                telegram_api.send_message(
                    chat_id,
                    i18n.t(lang, "phone_request"),
                    reply_markup=keyboards.build_remove_keyboard(lang),
                )
                return
            render_achievements(int(chat_id), lang, message_id=message_id, has_photo=has_photo)
            return
        if data == "open_leaderboard":
            render_leaderboard(int(chat_id), lang, message_id=message_id, has_photo=has_photo)
            return
        if data == "open_contact":
            phone = db.get_user_phone(int(chat_id))
            if not phone:
                db.set_state(int(chat_id), "awaiting_phone")
                telegram_api.send_message(
                    chat_id,
                    i18n.t(lang, "phone_request"),
                    reply_markup=keyboards.build_remove_keyboard(lang),
                )
                return
            render_contact_mentor(int(chat_id), lang, message_id=message_id, has_photo=has_photo)
            return
        if data == "open_profile":
            phone = db.get_user_phone(int(chat_id))
            if not phone:
                db.set_state(int(chat_id), "awaiting_phone")
                telegram_api.send_message(
                    chat_id,
                    i18n.t(lang, "phone_request"),
                    reply_markup=keyboards.build_remove_keyboard(lang),
                )
                return
            render_profile(int(chat_id), lang, message_id=message_id, has_photo=has_photo)
            return
        if data == "open_menu":
            state = db.get_state(int(chat_id))
            if state and state.get("state", "").startswith("awaiting_parent_"):
                db.clear_state(int(chat_id))
            render_menu(int(chat_id), lang, message_id=message_id, has_photo=has_photo)
            return
        if data == "menu_calendar":
            render_lesson_calendar(int(chat_id), lang, page=1, message_id=message_id, has_photo=has_photo)
            return
        if data.startswith("calendar_page:"):
            try:
                page = int(data.split(":", 1)[1])
            except (TypeError, ValueError):
                page = 1
            render_lesson_calendar(int(chat_id), lang, page=page, message_id=message_id, has_photo=has_photo)
            return
        if data.startswith("calendar_refresh:"):
            try:
                page = int(data.split(":", 1)[1])
            except (TypeError, ValueError):
                page = 1
            render_lesson_calendar(int(chat_id), lang, page=page, message_id=message_id, has_photo=has_photo)
            return
        if data == "menu_news":
            handle_news(int(chat_id), lang, message_id=message_id, has_photo=has_photo)
            return
        if data == "menu_parents":
            render_parents(int(chat_id), lang, message_id=message_id, has_photo=has_photo)
            return
        if data == "parents_add":
            start_add_parent_flow(int(chat_id), lang, message_id=message_id, has_photo=has_photo)
            return
        if data == "parents_cancel":
            state = db.get_state(int(chat_id))
            if state and state.get("state", "").startswith("awaiting_parent_"):
                db.clear_state(int(chat_id))
            render_parents(int(chat_id), lang, message_id=message_id, has_photo=has_photo)
            return
        if data.startswith("parents_rel:"):
            relation = (data.split(":", 1)[1] or "").strip().lower()
            state = db.get_state(int(chat_id))
            if not (state and state.get("state") == "awaiting_parent_relation"):
                render_parents(int(chat_id), lang, message_id=message_id, has_photo=has_photo)
                return
            payload = _load_state_payload(state)
            phone = str(payload.get("phone") or "").strip()
            first = str(payload.get("first_name") or "").strip()
            last = str(payload.get("last_name") or "").strip()
            if relation not in ("mother", "father") or not phone or not first or not last:
                db.clear_state(int(chat_id))
                render_parents(int(chat_id), lang, message_id=message_id, has_photo=has_photo)
                return
            db.add_parent(int(chat_id), phone, first, last, relation)
            db.clear_state(int(chat_id))
            telegram_api.send_message(chat_id, i18n.t(lang, "parent_saved"), reply_markup=keyboards.build_remove_keyboard(lang))
            render_parents(int(chat_id), lang, message_id=message_id, has_photo=has_photo)
            return
        if data == "menu_tip":
            handle_tip(int(chat_id), lang, message_id=message_id, has_photo=has_photo)
            return
        if data == "menu_recommend":
            handle_recommendations(int(chat_id), lang, message_id=message_id, has_photo=has_photo)
            return
        if data == "menu_level":
            handle_level(int(chat_id), lang, message_id=message_id, has_photo=has_photo)
            return
        if data == "menu_language":
            render_language_selection(int(chat_id), lang, message_id=message_id, has_photo=has_photo)
            return
        if data == "menu_help":
            handle_help(int(chat_id), lang, message_id=message_id, has_photo=has_photo)
            return
        if data == "admin_add_news":
            if role != "admin":
                telegram_api.send_message(chat_id, i18n.t(lang, "access_denied"), reply_markup=keyboards.build_remove_keyboard(lang))
                return
            start_news_flow(int(chat_id), lang)
            return
        if data == "admin_panel":
            if role != "admin":
                telegram_api.send_message(chat_id, i18n.t(lang, "access_denied"), reply_markup=keyboards.build_remove_keyboard(lang))
                return
            render_admin_panel(int(chat_id), lang, message_id=message_id, has_photo=has_photo)
            return
        if data == "admin_menu":
            if role != "admin":
                telegram_api.send_message(chat_id, i18n.t(lang, "access_denied"), reply_markup=keyboards.build_remove_keyboard(lang))
                return
            render_admin_menu(int(chat_id), lang, message_id=message_id)
            return
        if data == "admin_stats":
            if role != "admin":
                telegram_api.send_message(chat_id, i18n.t(lang, "access_denied"), reply_markup=keyboards.build_remove_keyboard(lang))
                return
            handle_admin_stats(int(chat_id), lang)
            return
        if data == "admin_status":
            if role != "admin":
                telegram_api.send_message(chat_id, i18n.t(lang, "access_denied"), reply_markup=keyboards.build_remove_keyboard(lang))
                return
            render_admin_status(int(chat_id), lang, message_id=message_id)
            return
        if data == "admin_requests":
            if role != "admin":
                telegram_api.send_message(chat_id, i18n.t(lang, "access_denied"), reply_markup=keyboards.build_remove_keyboard(lang))
                return
            state = db.get_state(int(chat_id))
            if state and state.get("state", "").startswith("admin_create_user_"):
                db.clear_state(int(chat_id))
            render_admin_requests(int(chat_id), lang, message_id=message_id)
            return
        if data == "admin_create_user":
            if role != "admin":
                telegram_api.send_message(chat_id, i18n.t(lang, "access_denied"), reply_markup=keyboards.build_remove_keyboard(lang))
                return
            start_admin_create_user(int(chat_id), lang)
            return
        if data.startswith("admin_create_level:"):
            if role != "admin":
                telegram_api.send_message(chat_id, i18n.t(lang, "access_denied"), reply_markup=keyboards.build_remove_keyboard(lang))
                return
            state = db.get_state(int(chat_id)) or {}
            if not state or not str(state.get("state") or "").startswith("admin_create_user_"):
                telegram_api.send_message(chat_id, i18n.t(lang, "admin_create_user_cancelled"), reply_markup=keyboards.build_admin_inline_keyboard(lang))
                return
            level_key = data.split(":", 1)[1].strip().lower()
            if level_key not in {"a1", "a1-express", "a2", "a2-express", "b1", "b1-express", "b2", "b2-express"}:
                telegram_api.send_message(chat_id, i18n.t(lang, "admin_create_user_invalid_level"))
                return
            payload = _load_state_payload(state)
            payload["level"] = level_key
            _set_state_with_payload(chat_id, "admin_create_user_schedule", payload)
            _send_create_user_prompt(chat_id, lang, "admin_create_user_schedule")
            return
        if data.startswith("admin_create_schedule:"):
            if role != "admin":
                telegram_api.send_message(chat_id, i18n.t(lang, "access_denied"), reply_markup=keyboards.build_remove_keyboard(lang))
                return
            schedule_key = _normalize_schedule_key(data.split(":", 1)[1])
            if not schedule_key:
                telegram_api.send_message(chat_id, i18n.t(lang, "admin_create_user_invalid_schedule"))
                _send_create_user_prompt(chat_id, lang, "admin_create_user_schedule")
                return
            state = db.get_state(int(chat_id)) or {}
            if not state or not str(state.get("state") or "").startswith("admin_create_user_"):
                telegram_api.send_message(chat_id, i18n.t(lang, "admin_create_user_cancelled"), reply_markup=keyboards.build_admin_inline_keyboard(lang))
                return
            payload = _load_state_payload(state)
            level_value = str(payload.get("level") or "")
            price_label = str(payload.get("price_label") or "")
            if _is_express_request(level_value, price_label):
                payload["schedule"] = ""
            else:
                payload["schedule"] = schedule_key
            _set_state_with_payload(chat_id, "admin_create_user_receipt", payload)
            _send_create_user_prompt(chat_id, lang, "admin_create_user_receipt")
            return
        if data.startswith("admin_create_pick:"):
            if role != "admin":
                telegram_api.send_message(chat_id, i18n.t(lang, "access_denied"), reply_markup=keyboards.build_remove_keyboard(lang))
                return
            try:
                request_id = int(data.split(":", 1)[1] or 0)
            except ValueError:
                request_id = 0
            items = site_api.fetch_admin_enrollment_requests()
            picked = None
            for item in items:
                try:
                    item_id = int(item.get("id") or 0)
                except (TypeError, ValueError):
                    item_id = 0
                if item_id == request_id and int(item.get("seen_by_admin", 0) or 0) == 0:
                    picked = item
                    break
            if not picked:
                telegram_api.send_message(chat_id, i18n.t(lang, "admin_mark_request_missing"))
                render_admin_create_user_requests(int(chat_id), lang)
                return
            start_admin_create_user_from_request(int(chat_id), lang, picked, message_id=message_id)
            return
        if data == "admin_mark_requests":
            if role != "admin":
                telegram_api.send_message(chat_id, i18n.t(lang, "access_denied"), reply_markup=keyboards.build_remove_keyboard(lang))
                return
            render_admin_mark_requests(int(chat_id), lang, message_id=message_id)
            return
        if data == "mentor_tasks":
            if role != "mentor":
                telegram_api.send_message(chat_id, i18n.t(lang, "access_denied"), reply_markup=keyboards.build_remove_keyboard(lang))
                return
            telegram_api.send_message(chat_id, i18n.t(lang, "feature_soon"), reply_markup=keyboards.build_mentor_keyboard(lang))
            return
        if data.startswith("level_pick:"):
            db.clear_state(int(chat_id))
            telegram_api.send_message(chat_id, i18n.t(lang, "level_profile_only"), reply_markup=keyboards.build_remove_keyboard(lang))
            return
        if data == "admin_renewals":
            if role != "admin":
                telegram_api.send_message(chat_id, i18n.t(lang, "access_denied"), reply_markup=keyboards.build_remove_keyboard(lang))
                return
            render_admin_renewals(int(chat_id), lang, message_id=message_id)
            return
        if data == "admin_messages":
            if role != "admin":
                telegram_api.send_message(chat_id, i18n.t(lang, "access_denied"), reply_markup=keyboards.build_remove_keyboard(lang))
                return
            render_admin_messages(int(chat_id), lang, message_id=message_id)
            return
        if data == "admin_status_solved":
            if role != "admin":
                telegram_api.send_message(chat_id, i18n.t(lang, "access_denied"), reply_markup=keyboards.build_remove_keyboard(lang))
                return
            render_admin_solved(int(chat_id), lang, message_id=message_id)
            return
        if data.startswith("admin_mark_pick:"):
            if role != "admin":
                telegram_api.send_message(chat_id, i18n.t(lang, "access_denied"), reply_markup=keyboards.build_remove_keyboard(lang))
                return
            try:
                request_id = int(data.split(":", 1)[1] or 0)
            except ValueError:
                request_id = 0
            render_admin_mark_request_detail(int(chat_id), lang, request_id, message_id=message_id)
            return
        if data.startswith("admin_status_pick:"):
            if role != "admin":
                telegram_api.send_message(chat_id, i18n.t(lang, "access_denied"), reply_markup=keyboards.build_remove_keyboard(lang))
                return
            try:
                request_id = int(data.split(":", 1)[1] or 0)
            except ValueError:
                request_id = 0
            render_admin_status_detail(int(chat_id), lang, request_id, message_id=message_id)
            return
        if data.startswith("admin_mark_done:"):
            if role != "admin":
                telegram_api.send_message(chat_id, i18n.t(lang, "access_denied"), reply_markup=keyboards.build_remove_keyboard(lang))
                return
            try:
                request_id = int(data.split(":", 1)[1] or 0)
            except ValueError:
                request_id = 0
            result = site_api.admin_mark_enrollment_request(request_id)
            if isinstance(result, dict) and result.get("error"):
                telegram_api.send_message(chat_id, i18n.t(lang, "admin_mark_request_missing"))
                render_admin_mark_requests(int(chat_id), lang, message_id=message_id)
                return
            telegram_api.send_message(chat_id, i18n.t(lang, "admin_mark_request_done"))
            render_admin_mark_requests(int(chat_id), lang, message_id=message_id)
            return
        if data.startswith("admin_status_done:"):
            if role != "admin":
                telegram_api.send_message(chat_id, i18n.t(lang, "access_denied"), reply_markup=keyboards.build_remove_keyboard(lang))
                return
            try:
                request_id = int(data.split(":", 1)[1] or 0)
            except ValueError:
                request_id = 0
            result = site_api.admin_mark_enrollment_request(request_id)
            if isinstance(result, dict) and result.get("error"):
                telegram_api.send_message(chat_id, i18n.t(lang, "admin_mark_request_missing"))
                render_admin_status(int(chat_id), lang, message_id=message_id)
                return
            telegram_api.send_message(chat_id, i18n.t(lang, "admin_mark_request_done"))
            render_admin_status(int(chat_id), lang, message_id=message_id)
            return
        if data.startswith("admin_mark_delete:"):
            if role != "admin":
                telegram_api.send_message(chat_id, i18n.t(lang, "access_denied"), reply_markup=keyboards.build_remove_keyboard(lang))
                return
            try:
                request_id = int(data.split(":", 1)[1] or 0)
            except ValueError:
                request_id = 0
            result = site_api.admin_delete_enrollment_request(request_id)
            if isinstance(result, dict) and result.get("error"):
                telegram_api.send_message(chat_id, i18n.t(lang, "admin_mark_request_missing"))
                render_admin_mark_requests(int(chat_id), lang, message_id=message_id)
                return
            telegram_api.send_message(chat_id, i18n.t(lang, "admin_mark_request_deleted"))
            render_admin_mark_requests(int(chat_id), lang, message_id=message_id)
            return
        if data.startswith("admin_status_delete:"):
            if role != "admin":
                telegram_api.send_message(chat_id, i18n.t(lang, "access_denied"), reply_markup=keyboards.build_remove_keyboard(lang))
                return
            try:
                request_id = int(data.split(":", 1)[1] or 0)
            except ValueError:
                request_id = 0
            result = site_api.admin_delete_enrollment_request(request_id)
            if isinstance(result, dict) and result.get("error"):
                telegram_api.send_message(chat_id, i18n.t(lang, "admin_mark_request_missing"))
                render_admin_status(int(chat_id), lang, message_id=message_id)
                return
            telegram_api.send_message(chat_id, i18n.t(lang, "admin_mark_request_deleted"))
            render_admin_status(int(chat_id), lang, message_id=message_id)
            return
        if data == "set_lang_ru":
            db.set_user_language(int(chat_id), "ru")
            render_menu(int(chat_id), "ru", message_id=message_id, has_photo=has_photo)
            return
        if data == "set_lang_en":
            db.set_user_language(int(chat_id), "en")
            render_menu(int(chat_id), "en", message_id=message_id, has_photo=has_photo)
            return
        return

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
    db.upsert_bot_user(int(chat_id), username, first_name, last_name, role)
    lang = db.get_user_language(int(chat_id)) or config.DEFAULT_LANGUAGE

    contact = message.get("contact")
    if contact and contact.get("user_id") == chat_id:
        phone = str(contact.get("phone_number") or "").strip()
        if phone:
            db.set_user_phone(int(chat_id), phone)
            db.clear_state(chat_id)
            telegram_api.send_message(chat_id, i18n.t(lang, "phone_saved"), reply_markup=keyboards.build_remove_keyboard())
            render_start_message(int(chat_id), first_name, lang)
            return

    state = db.get_state(int(chat_id))
    if state and state.get("state") == "admin_create_user_receipt":
        if message.get("photo") or message.get("document"):
            handle_admin_create_user_receipt(int(chat_id), lang, message)
            return

    text = message.get("text") or ""
    if not text:
        telegram_api.send_message(chat_id, i18n.t(lang, "send_text_only"))
        return

    if text.strip().startswith("/"):
        handle_command(int(chat_id), role, first_name, username, text.strip(), lang)
    else:
        handle_text(int(chat_id), role, first_name, text.strip(), lang)

