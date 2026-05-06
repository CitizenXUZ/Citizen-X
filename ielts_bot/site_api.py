import json
import time
import urllib.error
import urllib.request
import urllib.parse

import config

PROFILE_CACHE = {}
PROFILE_CACHE_TTL = 20
PROFILE_CACHE_STALE_TTL = 180


def check_site_api():
    url = f"{config.SITE_API_URL}/api/health"
    try:
        with urllib.request.urlopen(url, timeout=3) as response:
            payload = response.read().decode("utf-8", errors="ignore")
    except urllib.error.URLError:
        print("Site API is not reachable:", url)
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


def fetch_profile_by_phone(phone: str):
    if not phone:
        return None
    now = time.time()
    cached = PROFILE_CACHE.get(phone)
    if cached:
        cached_at, cached_value = cached
        if now - cached_at <= PROFILE_CACHE_TTL:
            return cached_value
    url = f"{config.SITE_API_URL}/api/bot/profile?phone={urllib.parse.quote(phone)}"
    try:
        with urllib.request.urlopen(url, timeout=2.5) as response:
            payload = response.read().decode("utf-8", errors="ignore")
    except urllib.error.URLError:
        if cached:
            cached_at, cached_value = cached
            if now - cached_at <= PROFILE_CACHE_STALE_TTL:
                return cached_value
        return None
    try:
        data = json.loads(payload)
    except json.JSONDecodeError:
        return cached[1] if cached else None
    PROFILE_CACHE[phone] = (now, data)
    return data


def fetch_achievements_leaderboard(limit: int = 10):
    try:
        safe_limit = int(limit)
    except (TypeError, ValueError):
        safe_limit = 10
    safe_limit = max(1, min(safe_limit, 50))
    url = f"{config.SITE_API_URL}/api/leaderboard/achievements?limit={safe_limit}"
    try:
        with urllib.request.urlopen(url, timeout=3) as response:
            payload = response.read().decode("utf-8", errors="ignore")
    except urllib.error.URLError:
        return []
    try:
        data = json.loads(payload)
    except json.JSONDecodeError:
        return []
    items = data.get("items") if isinstance(data, dict) else None
    return items if isinstance(items, list) else []


def _fetch_admin_items(path: str):
    username = config.SITE_ADMIN_USERNAME
    if not username:
        return []
    url = f"{config.SITE_API_URL}{path}?username={urllib.parse.quote(username)}"
    try:
        with urllib.request.urlopen(url, timeout=4) as response:
            payload = response.read().decode("utf-8", errors="ignore")
    except urllib.error.URLError:
        return []
    try:
        data = json.loads(payload)
    except json.JSONDecodeError:
        return []
    items = data.get("items") if isinstance(data, dict) else None
    return items if isinstance(items, list) else []


def fetch_admin_enrollment_requests():
    return _fetch_admin_items("/api/admin/enrollment-requests")


def fetch_admin_renewal_requests():
    return _fetch_admin_items("/api/admin/renewal-requests")


def fetch_admin_contact_messages():
    return _fetch_admin_items("/api/admin/contact-messages")


def _post_json(path: str, payload: dict, timeout: float = 4.0) -> dict:
    url = f"{config.SITE_API_URL}{path}"
    body = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(url, data=body, headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as response:
            raw = response.read().decode("utf-8", errors="ignore")
    except urllib.error.HTTPError as exc:
        try:
            raw = exc.read().decode("utf-8", errors="ignore")
        except Exception:
            return {"error": "request_failed"}
    except urllib.error.URLError:
        return {"error": "request_failed"}
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        return {"error": "invalid_response"}


def admin_create_user(payload: dict) -> dict:
    data = dict(payload or {})
    data["admin_username"] = config.SITE_ADMIN_USERNAME
    return _post_json("/api/admin/users/create", data)


def admin_mark_enrollment_request(request_id: int) -> dict:
    payload = {"admin_username": config.SITE_ADMIN_USERNAME, "request_id": request_id}
    return _post_json("/api/admin/enrollment-requests/mark-one", payload)


def admin_delete_enrollment_request(request_id: int) -> dict:
    payload = {"admin_username": config.SITE_ADMIN_USERNAME, "request_id": request_id}
    return _post_json("/api/admin/enrollment-requests/delete", payload)


def admin_upload_payment_check(payload: dict) -> dict:
    data = dict(payload or {})
    data["admin_username"] = config.SITE_ADMIN_USERNAME
    return _post_json("/api/admin/payment-checks/upload", data, timeout=8.0)


def link_telegram_chat_id(phone: str, chat_id: int) -> bool:
    if not phone or not chat_id:
        return False
    token = getattr(config, "BOT_SYNC_TOKEN", "") or ""
    params = {
        "phone": phone,
        "chat_id": str(int(chat_id)),
    }
    if token:
        params["token"] = token
    url = f"{config.SITE_API_URL}/api/bot/link-chat?{urllib.parse.urlencode(params)}"
    try:
        with urllib.request.urlopen(url, timeout=2.5) as response:
            payload = response.read().decode("utf-8", errors="ignore")
    except urllib.error.URLError:
        return False
    try:
        data = json.loads(payload)
    except json.JSONDecodeError:
        return False
    return isinstance(data, dict) and data.get("status") == "linked"


def link_parent_chat(phone: str, chat_id: int) -> dict:
    """Link a parent's Telegram chat_id by their phone number stored in user_parents."""
    if not phone or not chat_id:
        return {"error": "missing_params"}
    token = getattr(config, "BOT_SYNC_TOKEN", "") or ""
    params: dict = {"phone": phone, "chat_id": str(int(chat_id))}
    if token:
        params["token"] = token
    url = f"{config.SITE_API_URL}/api/bot/parent-link-chat?{urllib.parse.urlencode(params)}"
    try:
        with urllib.request.urlopen(url, timeout=3) as response:
            return json.loads(response.read().decode("utf-8", errors="ignore"))
    except urllib.error.HTTPError as exc:
        try:
            return json.loads(exc.read().decode("utf-8", errors="ignore"))
        except Exception:
            return {"error": "request_failed"}
    except urllib.error.URLError:
        return {"error": "request_failed"}
    except json.JSONDecodeError:
        return {"error": "invalid_response"}


def bot_login(phone: str, username: str, password: str) -> dict:
    payload = {"phone": phone or "", "username": username or "", "password": password or ""}
    return _post_json("/api/bot/login", payload, timeout=4.0)


def get_admin_perm_code(chat_id: int) -> str:
    params = {"chat_id": str(int(chat_id))}
    admin_username = getattr(config, "SITE_ADMIN_USERNAME", "")
    if admin_username:
        params["username"] = admin_username
    url = f"{config.SITE_API_URL}/api/bot/admin/perm-code?{urllib.parse.urlencode(params)}"
    try:
        with urllib.request.urlopen(url, timeout=3) as response:
            data = json.loads(response.read().decode("utf-8", errors="ignore"))
            return str(data.get("perm_code") or "").strip()
    except Exception:
        return ""
