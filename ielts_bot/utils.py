from datetime import datetime


def utc_now():
    return datetime.utcnow().isoformat()


def escape_html(value: str) -> str:
    return (
        str(value or "")
        .replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
    )
