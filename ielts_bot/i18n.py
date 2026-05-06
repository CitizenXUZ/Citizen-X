SUPPORTED_LANGS = ("ru", "en")

BUTTONS = {
    "news": {"ru": "📰 Новости", "en": "📰 News"},
    "calendar": {"ru": "📅 Календарь уроков", "en": "📅 Lesson Calendar"},
    "daily": {"ru": "📆 Материал дня", "en": "📆 Daily Material"},
    "parents": {"ru": "👨‍👩‍👧 Родители", "en": "👨‍👩‍👧 Parents"},
    "tip": {"ru": "💡 Совет IELTS", "en": "💡 IELTS Tip"},
    "recommend": {"ru": "🎯 Рекомендации", "en": "🎯 Recommendations"},
    "level": {"ru": "📊 Уровень", "en": "📊 Level"},
    "help": {"ru": "❓ Помощь", "en": "❓ Help"},
    "language": {"ru": "🌐 Язык", "en": "🌐 Language"},
    "profile": {"ru": "👤 Профиль", "en": "👤 Profile"},
    "menu": {"ru": "📋 Меню", "en": "📋 Menu"},
    "achievements": {"ru": "🏅 Достижения", "en": "🏅 Achievements"},
    "leaderboard": {"ru": "🏆 Лидерборд", "en": "🏆 Leaderboard"},
    "contact_mentor": {"ru": "🧑‍🏫 Связаться с ментором", "en": "🧑‍🏫 Contact with Mentor"},
    "add_news": {"ru": "➕ Добавить новость", "en": "➕ Add News"},
    "stats": {"ru": "📈 Статистика", "en": "📈 Stats"},
    "admin_requests": {"ru": "Purchase Requests", "en": "Purchase Requests"},
    "admin_renewals": {"ru": "Renewal Requests", "en": "Renewal Requests"},
    "admin_messages": {"ru": "Site Messages", "en": "Site Messages"},
    "admin_menu": {"ru": "Menu", "en": "Menu"},
    "admin_status": {"ru": "Status", "en": "Status"},
    "admin_solved": {"ru": "See solved requests", "en": "See solved requests"},
    "admin_create_user": {"ru": "Create User", "en": "Create User"},
    "admin_mark_requests": {"ru": "Mark Request", "en": "Mark Request"},
    "admin_more_requests": {"ru": "See more Requests", "en": "See more Requests"},
    "admin_mark_done": {"ru": "Done", "en": "Done"},
    "admin_mark_delete": {"ru": "Delete", "en": "Delete"},
    "tasks": {"ru": "✅ Сегодняшние задачи", "en": "✅ Today Tasks"},
    "back": {"ru": "⬅️ Назад", "en": "⬅️ Back"},
    "cancel": {"ru": "❌ Отмена", "en": "❌ Cancel"},
    "add_parent": {"ru": "➕ Добавить родителя", "en": "➕ Add parent"},
    "mother": {"ru": "👩 Мать", "en": "👩 Mother"},
    "father": {"ru": "👨 Отец", "en": "👨 Father"},
    "lang_ru": {"ru": "🇷🇺 Русский", "en": "🇷🇺 Russian"},
    "lang_en": {"ru": "🇬🇧 English", "en": "🇬🇧 English"},
    "open_lesson": {"ru": "▶️ Открыть урок", "en": "▶️ Open lesson"},
    "page_prev": {"ru": "⬅️ Назад", "en": "⬅️ Prev"},
    "page_next": {"ru": "➡️ Далее", "en": "➡️ Next"},
    "refresh": {"ru": "🔄 Обновить", "en": "🔄 Refresh"},
}

STRINGS = {
    "start_caption": {
        "ru": "<b>{bot_name}</b>\nПривет, {name}.",
        "en": "<b>{bot_name}</b>\nHi, {name}.",
    },
    "menu_title": {
        "ru": "<b>Меню</b>\nВыберите раздел кнопками ниже.",
        "en": "<b>Menu</b>\nChoose a section using the buttons below.",
    },
    "help": {
        "ru": (
            "<b>Помощь</b>\n"
            "Основные команды:\n"
            "/calendar — календарь уроков\n"
            "/news — последние новости\n"
            "/menu — открыть меню\n"
            "/profile — профиль\n"
            "/parents — родители\n"
            "/tip — совет IELTS\n"
            "/recommend — рекомендации по уровню\n"
            "/language — выбрать язык\n"
            "/logout — выйти из аккаунта\n"
            "/myid — показать chat_id\n"
            "/help — помощь"
        ),
        "en": (
            "<b>Help</b>\n"
            "Main commands:\n"
            "/calendar — lesson calendar\n"
            "/news — latest news\n"
            "/menu — open menu\n"
            "/profile — profile\n"
            "/parents — parents\n"
            "/tip — IELTS tip\n"
            "/recommend — level recommendations\n"
            "/language — choose language\n"
            "/logout — log out\n"
            "/myid — show chat_id\n"
            "/help — help"
        ),
    },
    "no_news": {
        "ru": "Пока нет новостей. Как только появятся, я сразу пришлю.",
        "en": "No news yet. As soon as there is, I'll send it.",
    },
    "last_news": {
        "ru": "<b>Последние новости</b>\n\n{items}",
        "en": "<b>Latest news</b>\n\n{items}",
    },
    "daily_title": {
        "ru": "<b>Материал дня</b>\n{text}",
        "en": "<b>Daily material</b>\n{text}",
    },
    "parents_title": {
        "ru": "<b>Родители</b>\n{items}",
        "en": "<b>Parents</b>\n{items}",
    },
    "parents_empty": {
        "ru": "Пока не добавлено ни одного родителя.",
        "en": "No parents added yet.",
    },
    "parent_add_phone": {
        "ru": "Введите номер телефона родителя (например, +998901234567).",
        "en": "Enter the parent's phone number (e.g., +998901234567).",
    },
    "parent_add_first_name": {
        "ru": "Введите имя родителя.",
        "en": "Enter the parent's first name.",
    },
    "parent_add_last_name": {
        "ru": "Введите фамилию родителя.",
        "en": "Enter the parent's last name.",
    },
    "parent_add_relation": {
        "ru": "Кем он/она вам приходится?",
        "en": "Who is this person to you?",
    },
    "parent_phone_error": {
        "ru": "Пожалуйста, введите корректный номер телефона.",
        "en": "Please enter a valid phone number.",
    },
    "parent_saved": {
        "ru": "✅ Родитель добавлен.",
        "en": "✅ Parent saved.",
    },
    "parent_self_start": {
        "ru": (
            "👨‍👩‍👧 <b>Раздел для родителей</b>\n\n"
            "Введите ваш номер телефона (который ваш ребёнок указал в вашем профиле на сайте), "
            "и вы начнёте получать уведомления об его результатах."
        ),
        "en": (
            "👨‍👩‍👧 <b>Parent section</b>\n\n"
            "Enter your phone number (the one your child added in your profile on the site) "
            "to receive progress notifications."
        ),
    },
    "parent_self_success": {
        "ru": (
            "✅ <b>Готово!</b>\n\n"
            "Ваш Telegram подключён. Теперь вы будете получать уведомления об успехах "
            "вашего ребёнка в <b>English with Mr.Sam</b>."
        ),
        "en": (
            "✅ <b>Done!</b>\n\n"
            "Your Telegram is now linked. You will receive notifications about your child's "
            "progress in <b>English with Mr.Sam</b>."
        ),
    },
    "parent_self_not_found": {
        "ru": (
            "❌ Номер <b>{phone}</b> не найден.\n\n"
            "Попросите вашего ребёнка добавить ваш номер телефона через меню «Родители» в боте."
        ),
        "en": (
            "❌ Phone <b>{phone}</b> is not registered.\n\n"
            "Ask your child to add your phone number via the 'Parents' menu in the bot."
        ),
    },
    "tip_title": {
        "ru": "<b>Совет IELTS</b>\n{text}",
        "en": "<b>IELTS tip</b>\n{text}",
    },
    "recommend_title": {
        "ru": "<b>Рекомендации для {level}</b>\n{items}",
        "en": "<b>Recommendations for {level}</b>\n{items}",
    },
    "recommend_empty": {
        "ru": "Рекомендации пока не готовы.",
        "en": "Recommendations are not ready yet.",
    },
    "calendar_title": {
        "ru": "<b>Календарь уроков ({level})</b>\nПройдено: <b>{completed} / {total}</b>\nСтраница {page}/{pages}\n\n{items}",
        "en": "<b>Lesson calendar ({level})</b>\nCompleted: <b>{completed} / {total}</b>\nPage {page}/{pages}\n\n{items}",
    },
    "calendar_empty": {
        "ru": "Уроки для этого уровня пока не найдены.",
        "en": "No lessons found for this level yet.",
    },
    "lesson_completed": {
        "ru": "✅ Выполнено",
        "en": "✅ Completed",
    },
    "lesson_incomplete": {
        "ru": "⏳ Не выполнено",
        "en": "⏳ Not completed",
    },
    "lesson_locked": {
        "ru": "🔒 Закрыт",
        "en": "🔒 Locked",
    },
    "lesson_unlocks_in": {
        "ru": "⏰ Откроется через {time}",
        "en": "⏰ Opens in {time}",
    },
    "lesson_backlog_warning": {
        "ru": (
            "🚨 <b>ВНИМАНИЕ</b> 🚨\n"
            "Вы не выполнили <b>{count} урока</b> подряд.\n"
            "Пожалуйста, выполните их в ближайшее время, иначе вам может грозить отчисление от курса.\n\n"
            "🤝 Если вам что-то даётся сложно или возникают трудности, "
            "обязательно свяжитесь с ментором и сообщите об этом — мы поможем."
        ),
        "en": (
            "🚨 <b>IMPORTANT</b> 🚨\n"
            "You have not completed <b>{count} lessons</b> in a row.\n"
            "Please finish them soon, otherwise you may be removed from the course.\n\n"
            "🤝 If something feels difficult or you face any challenges, "
            "please contact your mentor — we will help."
        ),
    },
    "level_prompt": {
        "ru": "Уровень берется из вашего профиля.",
        "en": "Your level is taken from your profile.",
    },
    "level_current": {
        "ru": "Ваш уровень в профиле: <b>{level}</b>.",
        "en": "Your profile level: <b>{level}</b>.",
    },
    "level_none": {
        "ru": "В профиле не указан уровень. Укажите его на сайте и попробуйте снова.",
        "en": "No level found in your profile. Set it on the site and try again.",
    },
    "level_saved": {
        "ru": "Уровень сохранен: <b>{level}</b>.",
        "en": "Level saved: <b>{level}</b>.",
    },
    "level_choose_error": {
        "ru": "Пожалуйста, выберите уровень A1, A2, B1 или B2.",
        "en": "Please choose level A1, A2, B1, or B2.",
    },
    "level_cancelled": {
        "ru": "Выбор уровня отменен.",
        "en": "Level selection cancelled.",
    },
    "level_profile_only": {
        "ru": "Уровень теперь берется из профиля. Изменить его в боте нельзя.",
        "en": "Your level is now taken from your profile. It can't be changed in the bot.",
    },
    "unknown": {
        "ru": "Я не понял сообщение.\nНапишите /help, чтобы увидеть доступные команды.",
        "en": "I didn't understand that.\nType /help to see available commands.",
    },
    "main_menu": {
        "ru": "Главное меню.",
        "en": "Main menu.",
    },
    "access_denied": {
        "ru": "Доступ запрещен.",
        "en": "Access denied.",
    },
    "admin_panel": {
        "ru": "<b>Админ-панель</b>\nДоступ подтвержден.\nВыберите действие ниже.",
        "en": "<b>Admin panel</b>\nAccess granted.\nChoose an action below.",
    },
    "mentor_panel": {
        "ru": "<b>Окно ментора</b>\nДоступ подтвержден.\n\nПока доступно:\n• Сегодняшние задачи (скоро)",
        "en": "<b>Mentor panel</b>\nAccess granted.\n\nAvailable:\n• Today tasks (soon)",
    },
    "admin_stats": {
        "ru": "<b>Статистика бота</b>\nВсего пользователей: {users}\nНовостей в базе: {news}",
        "en": "<b>Bot stats</b>\nTotal users: {users}\nNews in database: {news}",
    },
    "admin_requests_title": {
        "ru": "<b>Заявки на покупку</b>\n{items}",
        "en": "<b>Purchase requests</b>\n{items}",
    },
    "admin_renewals_title": {
        "ru": "<b>Запросы на продление</b>\n{items}",
        "en": "<b>Renewal requests</b>\n{items}",
    },
    "admin_messages_title": {
        "ru": "<b>Сообщения с сайта</b>\n{items}",
        "en": "<b>Messages from site</b>\n{items}",
    },
    "admin_status_title": {
        "ru": "<b>Requests status</b>\n{items}\n\nSelect a request number below.",
        "en": "<b>Requests status</b>\n{items}\n\nSelect a request number below.",
    },
    "admin_status_empty": {
        "ru": "No active requests yet.",
        "en": "No active requests yet.",
    },
    "admin_status_detail": {
        "ru": "<b>Request #{index}</b>\n{item}",
        "en": "<b>Request #{index}</b>\n{item}",
    },
    "admin_solved_title": {
        "ru": "<b>Solved requests</b>\n{items}",
        "en": "<b>Solved requests</b>\n{items}",
    },
    "admin_solved_empty": {
        "ru": "No solved requests yet.",
        "en": "No solved requests yet.",
    },
    "admin_mark_requests_title": {
        "ru": "<b>Requests without the Created mark</b>\n{items}\n\nChoose a request number below.",
        "en": "<b>Requests without the Created mark</b>\n{items}\n\nChoose a request number below.",
    },
    "admin_mark_requests_empty": {
        "ru": "No requests without the Created mark yet.",
        "en": "No requests without the Created mark yet.",
    },
    "admin_mark_request_detail": {
        "ru": "<b>Request #{index}</b>\n{item}",
        "en": "<b>Request #{index}</b>\n{item}",
    },
    "admin_mark_request_missing": {
        "ru": "Request not found or already processed.",
        "en": "Request not found or already processed.",
    },
    "admin_mark_request_done": {
        "ru": "Done. Created mark set.",
        "en": "Done. Created mark set.",
    },
    "admin_mark_request_deleted": {
        "ru": "Request deleted.",
        "en": "Request deleted.",
    },
    "admin_create_user_pick_title": {
        "ru": "<b>Pending purchase requests</b>\n{items}\n\nChoose a request number below.",
        "en": "<b>Pending purchase requests</b>\n{items}\n\nChoose a request number below.",
    },
    "admin_create_user_pick_empty": {
        "ru": "No pending requests to create users.",
        "en": "No pending requests to create users.",
    },
    "admin_create_user_summary": {
        "ru": "Creating user from request:\n{item}\n\nLogin: <b>{username}</b>\nPassword: <b>{password}</b>",
        "en": "Creating user from request:\n{item}\n\nLogin: <b>{username}</b>\nPassword: <b>{password}</b>",
    },
    "admin_create_user_name": {
        "ru": "Enter the student's full name.",
        "en": "Enter the student's full name.",
    },
    "admin_create_user_phone": {
        "ru": "Enter the phone number (e.g. +998...).",
        "en": "Enter the phone number (e.g. +998...).",
    },
    "admin_create_user_level": {
        "ru": "Enter the level (A1, A2, B1, B2) or e.g. A1 Express.",
        "en": "Enter the level (A1, A2, B1, B2) or e.g. A1 Express.",
    },
    "admin_create_user_schedule": {
        "ru": "Choose schedule: MWF or TTHSA.",
        "en": "Choose schedule: MWF or TTHSA.",
    },
    "admin_create_user_invalid_schedule": {
        "ru": "Schedule is invalid. Choose MWF or TTHSA.",
        "en": "Schedule is invalid. Choose MWF or TTHSA.",
    },
    "admin_create_user_username": {
        "ru": "Enter the login username.",
        "en": "Enter the login username.",
    },
    "admin_create_user_password": {
        "ru": "Enter a password (min 6 characters).",
        "en": "Enter a password (min 6 characters).",
    },
    "admin_create_user_success": {
        "ru": "User created: <b>{username}</b>\nPassword: <b>{password}</b>.",
        "en": "User created: <b>{username}</b>\nPassword: <b>{password}</b>.",
    },
    "admin_create_user_error": {
        "ru": "Could not create user: {error}",
        "en": "Could not create user: {error}",
    },
    "admin_create_user_cancelled": {
        "ru": "User creation cancelled.",
        "en": "User creation cancelled.",
    },
    "admin_create_user_invalid_level": {
        "ru": "Invalid level. Use A1, A2, B1, B2 or an Express variant.",
        "en": "Invalid level. Use A1, A2, B1, B2 or an Express variant.",
    },
    "admin_create_user_invalid_phone": {
        "ru": "Phone number looks invalid. Try again.",
        "en": "Phone number looks invalid. Try again.",
    },
    "admin_create_user_invalid_username": {
        "ru": "Username must not contain spaces.",
        "en": "Username must not contain spaces.",
    },
    "admin_create_user_short_password": {
        "ru": "Password is too short (min 6 characters).",
        "en": "Password is too short (min 6 characters).",
    },
    "admin_create_user_receipt": {
        "ru": "Send a screenshot or PDF receipt.",
        "en": "Send a screenshot or PDF receipt.",
    },
    "admin_create_user_receipt_error": {
        "ru": "Could not download the file. Please send again.",
        "en": "Could not download the file. Please send again.",
    },
    "admin_create_user_receipt_type": {
        "ru": "Only image or PDF is accepted. Send a screenshot or PDF.",
        "en": "Only image or PDF is accepted. Send a screenshot or PDF.",
    },
    "admin_create_user_receipt_upload_failed": {
        "ru": "User created, but receipt upload failed.",
        "en": "User created, but receipt upload failed.",
    },
    "admin_empty": {
        "ru": "Пока нет записей.",
        "en": "No entries yet.",
    },
    "news_flow_prompt": {
        "ru": (
            "Отправьте текст новости одним сообщением.\n"
            "Если первая строка короткая, я возьму ее как заголовок.\n\n"
            "Для отмены отправьте /cancel."
        ),
        "en": (
            "Send the news text in one message.\n"
            "If the first line is short, I'll use it as a title.\n\n"
            "To cancel, send /cancel."
        ),
    },
    "news_saved": {
        "ru": "Новость сохранена и отправлена {count} пользователям.",
        "en": "News saved and sent to {count} users.",
    },
    "news_empty": {
        "ru": "Текст новости пустой. Попробуйте еще раз.",
        "en": "News text is empty. Try again.",
    },
    "broadcast_need_text": {
        "ru": "Укажите текст рассылки после команды /broadcast.",
        "en": "Provide broadcast text after /broadcast.",
    },
    "broadcast_sent": {
        "ru": "Рассылка отправлена {count} пользователям.",
        "en": "Broadcast sent to {count} users.",
    },
    "broadcast_title": {
        "ru": "<b>Сообщение от команды</b>\n\n{message}",
        "en": "<b>Message from the team</b>\n\n{message}",
    },
    "cancel_none": {
        "ru": "Отменять нечего.",
        "en": "Nothing to cancel.",
    },
    "cancel_done": {
        "ru": "Действие отменено.",
        "en": "Action cancelled.",
    },
    "news_title": {
        "ru": "<b>Новости платформы</b>\n\n{item}",
        "en": "<b>Platform news</b>\n\n{item}",
    },
    "send_text_only": {
        "ru": "Пришлите, пожалуйста, текстовое сообщение.",
        "en": "Please send a text message.",
    },
    "language_prompt": {
        "ru": "Выберите язык бота.",
        "en": "Choose the bot language.",
    },
    "language_saved": {
        "ru": "Язык сохранен: <b>{label}</b>.",
        "en": "Language saved: <b>{label}</b>.",
    },
    "feature_soon": {
        "ru": "Функция в разработке.",
        "en": "Feature is in progress.",
    },
    "chat_id": {
        "ru": "Ваш chat_id: {chat_id}",
        "en": "Your chat_id: {chat_id}",
    },
    "phone_request": {
        "ru": "Пожалуйста, отправьте номер телефона текстом (тот, что в аккаунте на платформе).",
        "en": "Please send your phone number as text (the one used on the platform).",
    },
    "login_user_not_found": {
        "ru": "❌ Пользователь с таким номером телефона не найден.\n\nСоздать аккаунт можно здесь: {link}",
        "en": "❌ No user found with this phone number.\n\nCreate an account here: {link}",
    },
    "login_username_request": {
        "ru": "Введите логин (username) от аккаунта на платформе.",
        "en": "Enter your platform username (login).",
    },
    "login_password_request": {
        "ru": "Введите пароль от аккаунта.",
        "en": "Enter your account password.",
    },
    "login_invalid": {
        "ru": "❌ Неверный логин или пароль. Попробуйте еще раз.",
        "en": "❌ Invalid username or password. Please try again.",
    },
    "login_success": {
        "ru": "✅ Вход выполнен. Добро пожаловать, {name}!",
        "en": "✅ Logged in. Welcome, {name}!",
    },
    "logout_done": {
        "ru": "✅ Вы вышли из аккаунта в боте.",
        "en": "✅ You have logged out of the bot account.",
    },
    "phone_button": {
        "ru": "Отправить номер телефона",
        "en": "Share phone number",
    },
    "phone_saved": {
        "ru": "Спасибо! Номер сохранен.",
        "en": "Thanks! Phone number saved.",
    },
    "phone_error": {
        "ru": "Номер телефона выглядит неверно. Попробуйте еще раз.",
        "en": "Phone number looks invalid. Try again.",
    },
    "profile": {
        "ru": (
            "<b>Профиль</b>\n"
            "Ваш уровень: <b>{level}</b>\n"
            "Средний прогресс: <b>{progress}</b>\n"
            "Остаток подписки: <b>{subscription}</b>\n"
            "Достижения: {achievements}\n"
            "Уроков пройдено: <b>{completed} / {total}</b>\n"
            "Следующий урок откроется через: <b>{next_unlock}</b>"
        ),
        "en": (
            "<b>Profile</b>\n"
            "Your level: <b>{level}</b>\n"
            "Average progress: <b>{progress}</b>\n"
            "Subscription time left: <b>{subscription}</b>\n"
            "Achievements: {achievements}\n"
            "Lessons completed: <b>{completed} / {total}</b>\n"
            "Next lesson unlocks in: <b>{next_unlock}</b>"
        ),
    },
    "achievements_title": {
        "ru": "<b>Достижения</b>\n{items}",
        "en": "<b>Achievements</b>\n{items}",
    },
    "achievements_empty": {
        "ru": "Пока нет достижений. Все цели еще впереди!",
        "en": "No achievements yet. Your milestones are ahead!",
    },
    "leaderboard_title": {"ru": "<b>Лидерборд</b>\n{items}", "en": "<b>Leaderboard</b>\n{items}"},
    "leaderboard_empty": {"ru": "Пока нет данных для лидерборда.", "en": "No leaderboard data yet."},
    "mentor_contact": {
        "ru": (
            "<b>Ваш ментор</b>\n"
            "Имя: <b>{name}</b>\n"
            "Телефон: <b>{phone}</b>\n"
            "Telegram: <b>{telegram}</b>\n"
            "{info}"
        ),
        "en": (
            "<b>Your mentor</b>\n"
            "Name: <b>{name}</b>\n"
            "Phone: <b>{phone}</b>\n"
            "Telegram: <b>{telegram}</b>\n"
            "{info}"
        ),
    },
    "mentor_missing": {
        "ru": "Ментор пока не назначен. Мы свяжемся с вами скоро.",
        "en": "A mentor is not assigned yet. We will contact you soon.",
    },
    "lesson_unlock_soon": {
        "ru": "⏰ Скоро откроется следующий урок (через {time}).",
        "en": "⏰ Next lesson unlocks in {time}.",
    },
    "lesson_available": {
        "ru": "✅ Урок <b>{lesson}</b> теперь доступен! Вы можете приступить к нему прямо сейчас.",
        "en": "✅ Lesson <b>{lesson}</b> is now available! You can start it now.",
    },
}


def t(lang: str, key: str, **kwargs) -> str:
    lang_code = lang if lang in SUPPORTED_LANGS else "ru"
    template = STRINGS.get(key, {}).get(lang_code) or STRINGS.get(key, {}).get("ru") or ""
    if kwargs:
        return template.format(**kwargs)
    return template


def label(lang: str, key: str) -> str:
    lang_code = lang if lang in SUPPORTED_LANGS else "ru"
    return BUTTONS.get(key, {}).get(lang_code) or BUTTONS.get(key, {}).get("ru") or ""


def matches(text: str, key: str) -> bool:
    normalized = (text or "").strip().lower()
    for lang in SUPPORTED_LANGS:
        value = BUTTONS.get(key, {}).get(lang, "")
        if value and normalized == value.strip().lower():
            return True
    return False


def language_from_text(text: str):
    normalized = (text or "").strip().lower()
    if normalized in {BUTTONS["lang_ru"]["ru"].lower(), BUTTONS["lang_ru"]["en"].lower(), "ru", "russian", "рус"}:
        return "ru"
    if normalized in {BUTTONS["lang_en"]["ru"].lower(), BUTTONS["lang_en"]["en"].lower(), "en", "english", "анг"}:
        return "en"
    return ""


