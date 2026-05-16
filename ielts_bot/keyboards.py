import i18n


def build_main_keyboard(lang: str):
    return build_menu_keyboard(lang)


def build_start_keyboard(lang: str):
    return {
        "inline_keyboard": [
            [
                {"text": i18n.label(lang, "profile"), "callback_data": "open_profile"},
                {"text": i18n.label(lang, "menu"), "callback_data": "open_menu"},
            ],
        ]
    }


def build_profile_keyboard(lang: str):
    return {
        "inline_keyboard": [
            [
                {"text": i18n.label(lang, "achievements"), "callback_data": "open_achievements"},
            ],
            [
                {"text": i18n.label(lang, "contact_mentor"), "callback_data": "open_contact"},
            ],
            [
                {"text": i18n.label(lang, "back"), "callback_data": "open_start"},
            ],
        ]
    }


def build_achievements_keyboard(lang: str):
    return {
        "inline_keyboard": [
            [
                {"text": i18n.label(lang, "leaderboard"), "callback_data": "open_leaderboard"},
            ],
            [
                {"text": i18n.label(lang, "back"), "callback_data": "open_profile"},
            ],
        ]
    }


def build_leaderboard_keyboard(lang: str):
    return {
        "inline_keyboard": [
            [
                {"text": i18n.label(lang, "back"), "callback_data": "open_achievements"},
            ],
        ]
    }


def build_back_keyboard(lang: str):
    return {
        "inline_keyboard": [
            [
                {"text": i18n.label(lang, "back"), "callback_data": "open_start"},
            ],
        ]
    }


def build_menu_keyboard(lang: str):
    return {
        "inline_keyboard": [
            [
                {"text": i18n.label(lang, "calendar"), "callback_data": "menu_calendar"},
                {"text": i18n.label(lang, "parents"), "callback_data": "menu_parents"},
            ],
            [
                {"text": i18n.label(lang, "tip"), "callback_data": "menu_tip"},
                {"text": i18n.label(lang, "recommend"), "callback_data": "menu_recommend"},
            ],
            [
                {"text": i18n.label(lang, "language"), "callback_data": "menu_language"},
                {"text": i18n.label(lang, "help"), "callback_data": "menu_help"},
            ],
            [
                {"text": i18n.label(lang, "back"), "callback_data": "open_start"},
            ],
        ]
    }


def build_parents_root_keyboard(lang: str):
    return {
        "inline_keyboard": [
            [
                {"text": i18n.label(lang, "add_parent"), "callback_data": "parents_add"},
            ],
            [
                {"text": i18n.label(lang, "back"), "callback_data": "open_menu"},
            ],
        ]
    }


def build_parents_cancel_keyboard(lang: str):
    return {
        "inline_keyboard": [
            [
                {"text": i18n.label(lang, "cancel"), "callback_data": "parents_cancel"},
                {"text": i18n.label(lang, "back"), "callback_data": "open_menu"},
            ],
        ]
    }


def build_parent_relation_keyboard(lang: str):
    return {
        "inline_keyboard": [
            [
                {"text": i18n.label(lang, "mother"), "callback_data": "parents_rel:mother"},
                {"text": i18n.label(lang, "father"), "callback_data": "parents_rel:father"},
            ],
            [
                {"text": i18n.label(lang, "cancel"), "callback_data": "parents_cancel"},
                {"text": i18n.label(lang, "back"), "callback_data": "open_menu"},
            ],
        ]
    }


def build_back_to_menu_keyboard(lang: str):
    return {"inline_keyboard": [[{"text": i18n.label(lang, "back"), "callback_data": "open_menu"}]]}


def build_contact_mentor_inline_keyboard(lang: str):
    return {
        "inline_keyboard": [
            [
                {"text": i18n.label(lang, "contact_mentor"), "callback_data": "open_contact"},
            ]
        ]
    }


def build_calendar_pagination(lang: str, page: int, total_pages: int):
    row = []
    if page > 1:
        row.append({"text": i18n.label(lang, "page_prev"), "callback_data": f"calendar_page:{page - 1}"})
    if page < total_pages:
        row.append({"text": i18n.label(lang, "page_next"), "callback_data": f"calendar_page:{page + 1}"})
    rows = []
    rows.append([{"text": i18n.label(lang, "refresh"), "callback_data": f"calendar_refresh:{page}"}])
    if row:
        rows.append(row)
    rows.append([{"text": i18n.label(lang, "back"), "callback_data": "open_menu"}])
    return {"inline_keyboard": rows}


def build_admin_keyboard(lang: str):
    return build_admin_inline_keyboard(lang)


def build_admin_inline_keyboard(lang: str):
    return {
        "inline_keyboard": [
            [
                {"text": i18n.label(lang, "add_news"), "callback_data": "admin_add_news"},
                {"text": i18n.label(lang, "stats"), "callback_data": "admin_stats"},
            ],
            [
                {"text": i18n.label(lang, "admin_create_user"), "callback_data": "admin_create_user"},
            ],
            [
                {"text": i18n.label(lang, "admin_requests"), "callback_data": "admin_requests"},
                {"text": i18n.label(lang, "admin_renewals"), "callback_data": "admin_renewals"},
            ],
            [
                {"text": i18n.label(lang, "admin_messages"), "callback_data": "admin_messages"},
            ],
            [
                {"text": i18n.label(lang, "back"), "callback_data": "admin_panel"},
            ],
        ]
    }


def build_admin_requests_keyboard(lang: str):
    return {
        "inline_keyboard": [
            [
                {"text": i18n.label(lang, "admin_mark_requests"), "callback_data": "admin_mark_requests"},
            ],
            [
                {"text": i18n.label(lang, "back"), "callback_data": "admin_panel"},
            ],
        ]
    }


def build_admin_mark_requests_keyboard(lang: str, request_ids: list):
    rows = []
    row = []
    for idx, request_id in enumerate(request_ids, start=1):
        row.append({"text": str(idx), "callback_data": f"admin_mark_pick:{request_id}"})
        if len(row) >= 5:
            rows.append(row)
            row = []
    if row:
        rows.append(row)
    rows.append([{"text": i18n.label(lang, "back"), "callback_data": "admin_requests"}])
    return {"inline_keyboard": rows}


def build_admin_mark_request_action_keyboard(lang: str, request_id: int):
    return {
        "inline_keyboard": [
            [
                {"text": i18n.label(lang, "admin_mark_done"), "callback_data": f"admin_mark_done:{request_id}"},
                {"text": i18n.label(lang, "admin_mark_delete"), "callback_data": f"admin_mark_delete:{request_id}"},
            ],
            [
                {"text": i18n.label(lang, "back"), "callback_data": "admin_mark_requests"},
            ],
        ]
    }


def build_admin_create_user_pick_keyboard(lang: str, request_ids: list):
    rows = []
    row = []
    for idx, request_id in enumerate(request_ids, start=1):
        row.append({"text": str(idx), "callback_data": f"admin_create_pick:{request_id}"})
        if len(row) >= 5:
            rows.append(row)
            row = []
    if row:
        rows.append(row)
    rows.append([{"text": i18n.label(lang, "back"), "callback_data": "admin_menu"}])
    return {"inline_keyboard": rows}


def build_admin_create_user_back_keyboard(lang: str):
    return {"inline_keyboard": [[{"text": i18n.label(lang, "back"), "callback_data": "admin_menu"}]]}


def build_admin_schedule_keyboard(lang: str):
    return {
        "inline_keyboard": [
            [
                {"text": "MWF", "callback_data": "admin_create_schedule:mwf"},
                {"text": "TTHSA", "callback_data": "admin_create_schedule:tthsa"},
            ],
            [
                {"text": i18n.label(lang, "back"), "callback_data": "admin_create_user"},
            ],
        ]
    }


def build_admin_level_keyboard(lang: str):
    return {
        "inline_keyboard": [
            [
                {"text": "A1", "callback_data": "admin_create_level:a1"},
                {"text": "A1 Express", "callback_data": "admin_create_level:a1-express"},
            ],
            [
                {"text": "A2", "callback_data": "admin_create_level:a2"},
                {"text": "A2 Express", "callback_data": "admin_create_level:a2-express"},
            ],
            [
                {"text": "B1", "callback_data": "admin_create_level:b1"},
                {"text": "B1 Express", "callback_data": "admin_create_level:b1-express"},
            ],
            [
                {"text": "B2", "callback_data": "admin_create_level:b2"},
                {"text": "B2 Express", "callback_data": "admin_create_level:b2-express"},
            ],
            [
                {"text": i18n.label(lang, "back"), "callback_data": "admin_create_user"},
            ],
        ]
    }


def build_admin_status_keyboard(lang: str, request_ids: list):
    rows = []
    row = []
    for idx, request_id in enumerate(request_ids, start=1):
        row.append({"text": str(idx), "callback_data": f"admin_status_pick:{request_id}"})
        if len(row) >= 5:
            rows.append(row)
            row = []
    if row:
        rows.append(row)
    rows.append([{"text": i18n.label(lang, "admin_solved"), "callback_data": "admin_status_solved"}])
    rows.append([{"text": i18n.label(lang, "back"), "callback_data": "admin_menu"}])
    return {"inline_keyboard": rows}


def build_admin_status_action_keyboard(lang: str, request_id: int):
    return {
        "inline_keyboard": [
            [
                {"text": i18n.label(lang, "admin_mark_done"), "callback_data": f"admin_status_done:{request_id}"},
                {"text": i18n.label(lang, "admin_mark_delete"), "callback_data": f"admin_status_delete:{request_id}"},
            ],
            [
                {"text": i18n.label(lang, "back"), "callback_data": "admin_status"},
            ],
        ]
    }


def build_admin_solved_keyboard(lang: str):
    return {
        "inline_keyboard": [
            [
                {"text": i18n.label(lang, "back"), "callback_data": "admin_status"},
            ],
        ]
    }


def build_admin_root_keyboard(lang: str):
    return {
        "inline_keyboard": [
            [
                {"text": i18n.label(lang, "admin_menu"), "callback_data": "admin_menu"},
            ],
            [
                {"text": i18n.label(lang, "back"), "callback_data": "open_start"},
            ],
        ]
    }


def build_mentor_keyboard(lang: str):
    return {
        "inline_keyboard": [
            [
                {"text": i18n.label(lang, "tasks"), "callback_data": "mentor_tasks"},
            ],
            [
                {"text": i18n.label(lang, "back"), "callback_data": "open_start"},
            ],
        ]
    }


def build_level_keyboard(lang: str):
    return {
        "inline_keyboard": [
            [
                {"text": "A1", "callback_data": "level_pick:a1"},
                {"text": "A2", "callback_data": "level_pick:a2"},
            ],
            [
                {"text": "B1", "callback_data": "level_pick:b1"},
                {"text": "B2", "callback_data": "level_pick:b2"},
            ],
            [
                {"text": i18n.label(lang, "back"), "callback_data": "open_menu"},
            ],
        ]
    }


def build_language_keyboard(lang: str):
    return build_language_inline_keyboard(lang)


def build_language_inline_keyboard(lang: str):
    return {
        "inline_keyboard": [
            [
                {"text": i18n.label(lang, "lang_ru"), "callback_data": "set_lang_ru"},
                {"text": i18n.label(lang, "lang_en"), "callback_data": "set_lang_en"},
            ],
            [
                {"text": i18n.label(lang, "back"), "callback_data": "open_menu"},
            ],
        ]
    }


def build_phone_keyboard(lang: str):
    return {"remove_keyboard": True}


def build_remove_keyboard(lang: str | None = None):
    return {"remove_keyboard": True}
