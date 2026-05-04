import sqlite3
from pathlib import Path


def main() -> int:
    db = Path.home() / ".ewms" / "database.db"
    print("db:", db)
    if not db.exists():
        print("missing")
        return 1

    con = sqlite3.connect(db)
    con.row_factory = sqlite3.Row
    cur = con.cursor()
    cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='users'")
    print("users_table:", bool(cur.fetchone()))

    if db.exists():
        cur.execute("SELECT id, username, role, level FROM users ORDER BY id LIMIT 20")
        print("users:", [dict(r) for r in cur.fetchall()])

    con.close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

