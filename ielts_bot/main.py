import time
import traceback

import config
import db
import handlers
import notifications
import site_api
import telegram_api


def main():
    db.ensure_db()
    site_api.check_site_api()
    notifications.start_lesson_notification_worker()
    commands = [
        {"command": "start", "description": "Запуск бота"},
        {"command": "login", "description": "Войти в аккаунт"},
        {"command": "help", "description": "Подсказка"},
        {"command": "calendar", "description": "Календарь уроков"},
        {"command": "logout", "description": "Выйти из аккаунта"},
    ]
    telegram_api.set_bot_commands(commands)

    offset = 0
    while True:
        try:
            updates = telegram_api.get_updates(offset, config.LONG_POLL_TIMEOUT)
        except Exception:
            traceback.print_exc()
            time.sleep(1.0)
            continue
        for update in updates:
            offset = max(offset, update.get("update_id", 0) + 1)
            try:
                handlers.handle_update(update)
            except Exception:
                traceback.print_exc()
        time.sleep(0.2)


if __name__ == "__main__":
    main()
