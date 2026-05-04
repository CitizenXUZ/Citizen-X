from datetime import datetime
from pathlib import Path
import html
import re


LEVELS = ("A1", "A2", "B1", "B2")

LEVEL_RECOMMENDATIONS = {
    "A1": [
        "Повторяйте базовые времена: Present Simple, To be.",
        "Ежедневно учите 10-15 слов и используйте их в предложениях.",
        "Слушайте короткие диалоги и повторяйте вслух.",
    ],
    "A2": [
        "Закрепляйте Past Simple и Future Simple на коротких историях.",
        "Пишите мини-письма на 6-8 предложений о себе и планах.",
        "Смотрите видео с субтитрами и выписывайте полезные фразы.",
    ],
    "B1": [
        "Тренируйте связность речи: because, however, although.",
        "Разбирайте IELTS Speaking Part 2 и держите 1-2 минуты.",
        "Пишите короткие эссе и проверяйте ошибки по чек-листу.",
    ],
    "B2": [
        "Прокачивайте Academic Vocabulary и коллокации.",
        "Делайте задания Reading на время, затем анализируйте ошибки.",
        "Пишите Task 2 со структурой: introduction, 2 body, conclusion.",
    ],
}

DAILY_MATERIALS = [
    "Грамматика: Present Simple — утверждения, вопросы, отрицания.",
    "Лексика: 15 слов на тему Education + 5 фразовых глаголов.",
    "Listening: короткий диалог на 2-3 минуты с повторением.",
    "Speaking: опиши свой день за 8-10 предложений.",
    "Reading: небольшая статья и 5 вопросов к ней.",
    "Writing: мини-эссе на 120-150 слов.",
]

IELTS_TIPS = [
    "В Listening сначала читайте вопросы, потом слушайте — так легче ловить ключевые слова.",
    "В Reading отмечайте ключевые слова в вопросах и ищите перефраз.",
    "В Writing Task 2 всегда используйте четкую структуру абзацев.",
    "В Speaking приводите примеры из личного опыта — так речь звучит естественно.",
    "Следите за временем: лучше ответить на все вопросы, чем застрять на одном.",
    "Проверяйте частые ошибки: артикли, предлоги, согласование времен.",
]

COURSE_LESSON_COUNTS = {
    "A1": 21,
    "A2": 13,
    "B1": 27,
    "B2": 8,
}

_LESSON_TITLE_CACHE: dict[str, dict[int, str]] = {}


def get_lesson_titles(level: str) -> dict[int, str]:
    key = (level or "").strip().upper()
    if not key:
        return {}
    cached = _LESSON_TITLE_CACHE.get(key)
    if cached is not None:
        return cached
    root_dir = Path(__file__).resolve().parent.parent
    html_path = root_dir / f"{key.lower()}.html"
    titles: dict[int, str] = {}
    if html_path.exists():
        try:
            raw = html_path.read_text(encoding="utf-8", errors="ignore")
        except OSError:
            raw = ""
        pattern = re.compile(r"<h3>\s*(Lesson\s+\d+\s*:[^<]+)</h3>", re.IGNORECASE)
        for match in pattern.finditer(raw):
            title = html.unescape(match.group(1)).strip()
            number_match = re.search(r"Lesson\s+(\d+)", title, re.IGNORECASE)
            if not number_match:
                continue
            try:
                number = int(number_match.group(1))
            except ValueError:
                continue
            titles[number] = title
    _LESSON_TITLE_CACHE[key] = titles
    return titles


def pick_daily_material():
    index = datetime.utcnow().date().toordinal() % len(DAILY_MATERIALS)
    return DAILY_MATERIALS[index]


def pick_tip():
    index = datetime.utcnow().date().toordinal() % len(IELTS_TIPS)
    return IELTS_TIPS[index]
