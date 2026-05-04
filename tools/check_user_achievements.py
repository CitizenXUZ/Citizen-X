import sqlite3
from pathlib import Path
import sys


def main() -> int:
    username = sys.argv[1] if len(sys.argv) > 1 else "java0_o"
    db = Path.home() / ".ewms" / "database.db"
    if not db.exists():
        print("missing db:", db)
        return 1

    con = sqlite3.connect(db)
    con.row_factory = sqlite3.Row
    cur = con.cursor()
    cur.execute("SELECT id FROM users WHERE username=?", (username,))
    row = cur.fetchone()
    if not row:
        print("missing user:", username)
        return 2
    user_id = row["id"]
    cur.execute("SELECT achievement_key, points FROM user_achievements WHERE user_id=? ORDER BY achievement_key", (user_id,))
    items = [dict(r) for r in cur.fetchall()]
    print("user:", username, "id:", user_id, "count:", len(items))
    print(items)
    con.close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

