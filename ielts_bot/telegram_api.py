import json
import mimetypes
import os
import uuid
import urllib.error
import urllib.parse
import urllib.request

import config


API_ROOT = f"https://api.telegram.org/bot{config.TG_BOT_TOKEN}/"


def api_call(method: str, params: dict):
    data = urllib.parse.urlencode(params).encode("utf-8")
    req = urllib.request.Request(API_ROOT + method, data=data)
    try:
        with urllib.request.urlopen(req, timeout=60) as response:
            payload = response.read().decode("utf-8", errors="ignore")
    except (urllib.error.URLError, TimeoutError, OSError):
        return None
    try:
        data = json.loads(payload)
    except json.JSONDecodeError:
        return None
    if not data.get("ok"):
        return None
    return data.get("result")


def api_call_multipart(method: str, fields: dict, files: dict):
    boundary = f"----EWMSBoundary{uuid.uuid4().hex}"
    body = bytearray()

    for name, value in (fields or {}).items():
        body.extend(f"--{boundary}\r\n".encode("utf-8"))
        body.extend(f'Content-Disposition: form-data; name="{name}"\r\n\r\n'.encode("utf-8"))
        body.extend(str(value).encode("utf-8"))
        body.extend(b"\r\n")

    for name, file_info in (files or {}).items():
        filename, content, content_type = file_info
        body.extend(f"--{boundary}\r\n".encode("utf-8"))
        body.extend(
            f'Content-Disposition: form-data; name="{name}"; filename="{filename}"\r\n'.encode("utf-8")
        )
        body.extend(f"Content-Type: {content_type}\r\n\r\n".encode("utf-8"))
        body.extend(content)
        body.extend(b"\r\n")

    body.extend(f"--{boundary}--\r\n".encode("utf-8"))

    req = urllib.request.Request(API_ROOT + method, data=bytes(body))
    req.add_header("Content-Type", f"multipart/form-data; boundary={boundary}")
    req.add_header("Content-Length", str(len(body)))
    try:
        with urllib.request.urlopen(req, timeout=60) as response:
            payload = response.read().decode("utf-8", errors="ignore")
    except (urllib.error.URLError, TimeoutError, OSError):
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


def send_photo(chat_id: int, photo: str, caption: str = "", reply_markup=None):
    if photo and os.path.exists(photo):
        content_type, _ = mimetypes.guess_type(photo)
        if not content_type:
            content_type = "application/octet-stream"
        with open(photo, "rb") as handle:
            content = handle.read()
        fields = {
            "chat_id": chat_id,
            "caption": caption or "",
            "parse_mode": "HTML",
        }
        if reply_markup is not None:
            fields["reply_markup"] = json.dumps(reply_markup, ensure_ascii=False)
        files = {"photo": (os.path.basename(photo), content, content_type)}
        return api_call_multipart("sendPhoto", fields, files)

    payload = {
        "chat_id": chat_id,
        "photo": photo,
        "caption": caption or "",
        "parse_mode": "HTML",
    }
    if reply_markup is not None:
        payload["reply_markup"] = json.dumps(reply_markup, ensure_ascii=False)
    return api_call("sendPhoto", payload)


def get_updates(offset: int, timeout: int):
    params = {
        "timeout": timeout,
        "offset": offset,
    }
    return api_call("getUpdates", params) or []


def set_bot_commands(commands):
    api_call("setMyCommands", {"commands": json.dumps(commands, ensure_ascii=False)})


def answer_callback(query_id: str, text: str = ""):
    payload = {"callback_query_id": query_id}
    if text:
        payload["text"] = text
    return api_call("answerCallbackQuery", payload)


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


def edit_message_caption(chat_id: int, message_id: int, caption: str, reply_markup=None):
    payload = {
        "chat_id": chat_id,
        "message_id": message_id,
        "caption": caption or "",
        "parse_mode": "HTML",
    }
    if reply_markup is not None:
        payload["reply_markup"] = json.dumps(reply_markup, ensure_ascii=False)
    return api_call("editMessageCaption", payload)


def edit_message_media(chat_id: int, message_id: int, media_url: str, caption: str = "", reply_markup=None):
    media = {"type": "photo", "media": media_url, "caption": caption or "", "parse_mode": "HTML"}
    payload = {
        "chat_id": chat_id,
        "message_id": message_id,
        "media": json.dumps(media, ensure_ascii=False),
    }
    if reply_markup is not None:
        payload["reply_markup"] = json.dumps(reply_markup, ensure_ascii=False)
    return api_call("editMessageMedia", payload)


def delete_message(chat_id: int, message_id: int):
    return api_call("deleteMessage", {"chat_id": chat_id, "message_id": message_id})


def get_file(file_id: str):
    return api_call("getFile", {"file_id": file_id})


def download_file_bytes(file_path: str):
    if not file_path:
        return None
    url = f"https://api.telegram.org/file/bot{config.TG_BOT_TOKEN}/{file_path}"
    req = urllib.request.Request(url)
    try:
        with urllib.request.urlopen(req, timeout=20) as response:
            return response.read()
    except urllib.error.URLError:
        return None
