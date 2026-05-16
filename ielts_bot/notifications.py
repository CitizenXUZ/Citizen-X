import threading
import time
from datetime import datetime, time as dt_time, timezone

import config
import content
import db
import i18n
import keyboards
import site_api
import telegram_api
from utils import escape_html

try:
    from zoneinfo import ZoneInfo
except ImportError:  # pragma: no cover
    ZoneInfo = None


def _format_eta(lang: str, seconds: int) -> str:
    if seconds <= 0:
        return "0 мин" if lang == "ru" else "0 min"
    minutes = int(round(seconds / 60))
    if minutes < 60:
        return f"{minutes} мин" if lang == "ru" else f"{minutes} min"
    hours = minutes // 60
    minutes = minutes % 60
    if hours < 24:
        if minutes:
            return f"{hours} ч {minutes} мин" if lang == "ru" else f"{hours}h {minutes}m"
        return f"{hours} ч" if lang == "ru" else f"{hours}h"
    days = hours // 24
    hours = hours % 24
    if hours:
        return f"{days} д {hours} ч" if lang == "ru" else f"{days}d {hours}h"
    return f"{days} д" if lang == "ru" else f"{days}d"


def _should_notify(next_unlock_seconds: int, next_unlock_at: str, last_notified_at: str) -> bool:
    if not next_unlock_at:
        return False
    if next_unlock_seconds <= 0:
        return False
    if next_unlock_seconds > max(1, config.LESSON_NOTIFY_WINDOW_MIN) * 60:
        return False
    if last_notified_at and last_notified_at == next_unlock_at:
        return False
    return True


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


def _lesson_url(profile: dict) -> str:
    level_raw = str(profile.get("level") or "")
    level = _normalize_level(level_raw)
    if not level:
        return ""
    base = config.SITE_WEB_URL.rstrip("/")
    if not base:
        return ""
    try:
        next_required = int(profile.get("next_required_lesson_number") or 1)
    except (TypeError, ValueError):
        next_required = 1
    next_required = max(1, next_required)
    course = level.lower()
    return f"{base}/lesson.html?course={course}&lesson={next_required}"


def _parse_time(raw: str, fallback: dt_time) -> dt_time:
    value = str(raw or "").strip()
    if not value:
        return fallback
    parts = value.split(":")
    if len(parts) != 2:
        return fallback
    try:
        hour = int(parts[0])
        minute = int(parts[1])
    except ValueError:
        return fallback
    if hour < 0 or hour > 23 or minute < 0 or minute > 59:
        return fallback
    return dt_time(hour=hour, minute=minute)


def _get_timezone():
    if ZoneInfo is None:
        return None
    try:
        return ZoneInfo(config.LESSON_NOTIFY_TIMEZONE)
    except Exception:
        return None


def _now_local():
    tz = _get_timezone()
    if tz is None:
        return datetime.now()
    return datetime.now(tz)


def _is_quiet_time(now_local: datetime) -> bool:
    start = _parse_time(config.LESSON_NOTIFY_QUIET_START, dt_time(22, 0))
    end = _parse_time(config.LESSON_NOTIFY_QUIET_END, dt_time(8, 0))
    now_minutes = now_local.hour * 60 + now_local.minute
    start_minutes = start.hour * 60 + start.minute
    end_minutes = end.hour * 60 + end.minute
    if start_minutes == end_minutes:
        return False
    if start_minutes < end_minutes:
        return start_minutes <= now_minutes < end_minutes
    return now_minutes >= start_minutes or now_minutes < end_minutes


def _parse_iso(dt_value: str):
    raw = str(dt_value or "").strip()
    if not raw:
        return None
    try:
        parsed = datetime.fromisoformat(raw)
    except ValueError:
        return None
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)
    return parsed.astimezone(timezone.utc)


def _build_open_lesson_markup(lang: str, url: str):
    if not url:
        return None
    return {
        "inline_keyboard": [
            [
                {"text": i18n.label(lang, "open_lesson"), "url": url},
            ]
        ]
    }


def check_lesson_notifications():
    users = db.get_users_for_notifications()
    now_local = _now_local()
    quiet_now = _is_quiet_time(now_local)
    now_utc = datetime.now(timezone.utc)
    for user in users:
        chat_id = int(user["chat_id"])
        phone = str(user.get("phone") or "").strip()
        if not phone:
            continue
        lang = str(user.get("language") or config.DEFAULT_LANGUAGE)
        profile = site_api.fetch_profile_by_phone(phone)
        if not profile or profile.get("error"):
            continue
        next_unlock_seconds = int(profile.get("next_unlock_seconds") or 0)
        next_unlock_at = str(profile.get("next_unlock_at") or "").strip()
        last_notified_at = str(user.get("last_unlock_notified_at") or "").strip()
        pending_unlock_at = str(user.get("pending_unlock_at") or "").strip()
        try:
            last_backlog_count = int(user.get("last_backlog_count") or 0)
        except (TypeError, ValueError):
            last_backlog_count = 0
        try:
            available_lessons = int(profile.get("available_lessons") or 0)
        except (TypeError, ValueError):
            available_lessons = 0
        completed_list = profile.get("completed_lessons_list")
        if isinstance(completed_list, list):
            completed_count = len([item for item in completed_list if isinstance(item, int)])
        else:
            completed_count = int(profile.get("completed_lessons") or 0)
        backlog_count = max(0, available_lessons - completed_count)

        def _maybe_warn_backlog():
            if backlog_count >= 3 and last_backlog_count < 3:
                warning = i18n.t(lang, "lesson_backlog_warning", count=backlog_count)
                warn_markup = keyboards.build_contact_mentor_inline_keyboard(lang)
                telegram_api.send_message(chat_id, warning, reply_markup=warn_markup)
            if backlog_count != last_backlog_count:
                db.set_last_backlog_count(chat_id, backlog_count)
        pending_dt = _parse_iso(pending_unlock_at)
        if quiet_now:
            if not pending_unlock_at and next_unlock_at:
                db.set_pending_unlock_at(chat_id, next_unlock_at)
                pending_unlock_at = next_unlock_at
                pending_dt = _parse_iso(pending_unlock_at)
            elif pending_dt is not None and pending_dt > now_utc and next_unlock_at and next_unlock_at != pending_unlock_at:
                db.set_pending_unlock_at(chat_id, next_unlock_at)
                pending_unlock_at = next_unlock_at
                pending_dt = _parse_iso(pending_unlock_at)
            continue

        if next_unlock_at and next_unlock_at != pending_unlock_at:
            db.set_pending_unlock_at(chat_id, next_unlock_at)
            pending_unlock_at = next_unlock_at
            pending_dt = _parse_iso(pending_unlock_at)
        url = _lesson_url(profile)
        markup = _build_open_lesson_markup(lang, url)

        if pending_dt and pending_dt <= now_utc and last_notified_at != pending_unlock_at:
            next_required = int(profile.get("next_required_lesson_number") or 1)
            lesson_title = str(profile.get("next_required_lesson_title") or "").strip()
            lesson_label = escape_html(lesson_title) if lesson_title else f"Lesson {next_required}"
            text = i18n.t(lang, "lesson_available", lesson=lesson_label)
            if telegram_api.send_message(chat_id, text, reply_markup=markup) is not None:
                db.set_last_unlock_notified_at(chat_id, pending_unlock_at)
            _maybe_warn_backlog()
            continue

        if not _should_notify(next_unlock_seconds, next_unlock_at, last_notified_at):
            _maybe_warn_backlog()
            continue
        eta = _format_eta(lang, next_unlock_seconds)
        text = i18n.t(lang, "lesson_unlock_soon", time=escape_html(eta))
        if telegram_api.send_message(chat_id, text, reply_markup=markup) is not None:
            db.set_last_unlock_notified_at(chat_id, next_unlock_at)
        _maybe_warn_backlog()


def _get_admin_lang(chat_id: int) -> str:
    lang = db.get_user_language(chat_id)
    if lang in ("ru", "en"):
        return lang
    return config.DEFAULT_LANGUAGE


def _send_admin_message(text: str):
    for chat_id in config.ADMIN_IDS:
        lang = _get_admin_lang(chat_id)
        telegram_api.send_message(chat_id, text)


def _notify_new_items(items: list, last_id_key: str, format_line, title_ru: str, title_en: str):
    last_raw = db.get_meta(last_id_key)
    try:
        last_id = int(last_raw or 0)
    except ValueError:
        last_id = 0
    if last_id == 0 and items:
        max_id = max((int(item.get("id") or 0) for item in items), default=0)
        if max_id:
            db.set_meta(last_id_key, str(max_id))
        return
    new_items = [item for item in items if int(item.get("id") or 0) > last_id]
    if not new_items:
        return
    new_items.sort(key=lambda item: int(item.get("id") or 0))
    max_id = int(new_items[-1].get("id") or last_id)
    for item in new_items:
        line = format_line(item)
        if not line:
            continue
        for chat_id in config.ADMIN_IDS:
            lang = _get_admin_lang(chat_id)
            title = title_ru if lang == "ru" else title_en
            telegram_api.send_message(chat_id, f"{title}\n{line}")
    if max_id > last_id:
        db.set_meta(last_id_key, str(max_id))


def check_admin_notifications():
    if not config.ADMIN_NOTIFY_ENABLED or not config.SITE_ADMIN_USERNAME:
        return
    enrollment = site_api.fetch_admin_enrollment_requests()
    renewal = site_api.fetch_admin_renewal_requests()

    def format_enrollment(item):
        name = str(item.get("full_name") or "—")
        level = str(item.get("level") or "—")
        phone = str(item.get("phone") or "")
        tg = str(item.get("telegram_username") or "")
        tg = f"@{tg.lstrip('@')}" if tg else ""
        price = str(item.get("price_label") or "")
        user = str(item.get("submitted_username") or "")
        created = str(item.get("created_at") or "")
        created = created.replace("T", " ")[:16] if created else ""
        parts = [f"{name} ({level})", price]
        contact = " • ".join([p for p in [phone, tg] if p])
        meta = " • ".join([p for p in [user, created] if p])
        line = " — ".join([p for p in parts if p])
        if contact:
            line = f"{line}\n{contact}"
        if meta:
            line = f"{line}\n{meta}"
        return line.strip()

    def format_renewal(item):
        name = str(item.get("full_name") or "—")
        level = str(item.get("level") or "—")
        phone = str(item.get("phone") or "")
        tg = str(item.get("telegram_username") or "")
        tg = f"@{tg.lstrip('@')}" if tg else ""
        price = str(item.get("price_label") or "")
        user = str(item.get("submitted_username") or "")
        parts = [f"{name} ({level})", price]
        contact = " • ".join([p for p in [phone, tg] if p])
        line = " — ".join([p for p in parts if p])
        if contact:
            line = f"{line}\n{contact}"
        if user:
            line = f"{line}\n{user}"
        return line.strip()

    _notify_new_items(enrollment, "last_enrollment_request_id", format_enrollment, "🧾 Новый запрос на покупку", "🧾 New purchase request")
    _notify_new_items(renewal, "last_renewal_request_id", format_renewal, "🔁 Новый запрос на продление", "🔁 New renewal request")


def _notification_loop():
    last_admin_check = 0.0
    while True:
        try:
            check_lesson_notifications()
        except Exception:
            pass
        if config.ADMIN_NOTIFY_ENABLED:
            now = time.time()
            if now - last_admin_check >= max(60, int(config.ADMIN_NOTIFY_POLL_SECONDS)):
                try:
                    check_admin_notifications()
                except Exception:
                    pass
                last_admin_check = now
        time.sleep(max(60, int(config.LESSON_NOTIFY_POLL_SECONDS)))


def start_lesson_notification_worker():
    if not config.LESSON_NOTIFY_ENABLED:
        return None
    thread = threading.Thread(target=_notification_loop, daemon=True)
    thread.start()
    return thread
