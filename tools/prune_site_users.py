import sqlite3
import sys
from pathlib import Path


SKIP_TABLE_PREFIXES = ("bot_",)
SKIP_TABLES = {"mentors"}


def main(argv: list[str] | None = None) -> int:
    argv = list(sys.argv if argv is None else argv)
    keep_usernames = [a.strip() for a in argv[1:] if a.strip()] or ["azamat_admin"]

    repo_root = Path(__file__).resolve().parents[1]
    db_path = repo_root / "backend" / "database.db"
    if not db_path.exists():
        print("missing db:", db_path)
        return 1

    con = sqlite3.connect(db_path)
    con.row_factory = sqlite3.Row
    cur = con.cursor()

    placeholders = ",".join("?" for _ in keep_usernames)
    cur.execute(f"SELECT id, username FROM users WHERE username IN ({placeholders})", keep_usernames)
    keep_rows = cur.fetchall()
    keep_ids = {int(r["id"]) for r in keep_rows}
    if not keep_ids:
        print("keep users not found:", keep_usernames)
        con.close()
        return 1

    keep_usernames_found = {str(r["username"]) for r in keep_rows}
    missing = [u for u in keep_usernames if u not in keep_usernames_found]
    if missing:
        print("warning: some keep users not found:", missing)

    cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
    tables = [str(r["name"]) for r in cur.fetchall()]

    kept_ids_placeholders = ",".join("?" for _ in keep_ids)
    kept_ids_args = tuple(sorted(keep_ids))

    for table in tables:
        if table == "users":
            continue
        if table in SKIP_TABLES or table.startswith(SKIP_TABLE_PREFIXES):
            continue
        cur.execute(f"PRAGMA table_info({table})")
        cols = {str(r["name"]) for r in cur.fetchall()}
        if "user_id" in cols:
            cur.execute(
                f"DELETE FROM {table} WHERE user_id NOT IN ({kept_ids_placeholders})",
                kept_ids_args,
            )
        elif "username" in cols:
            cur.execute(
                f"DELETE FROM {table} WHERE username NOT IN ({placeholders})",
                keep_usernames,
            )

    cur.execute(
        f"DELETE FROM users WHERE username NOT IN ({placeholders})",
        keep_usernames,
    )

    con.commit()
    con.close()
    print("kept users:", ", ".join(sorted(keep_usernames_found)))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

