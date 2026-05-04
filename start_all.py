import subprocess
import sys
import os
from pathlib import Path


def main():
    python = sys.executable
    repo_root = Path(__file__).resolve().parent

    # Run the HTTP server on a stable port for phone testing.
    env = dict(os.environ)
    env["EWMS_PORT"] = "8020"

    server = subprocess.Popen([python, "backend\\server.py"], cwd=str(repo_root), env=env)
    bot = subprocess.Popen([python, "ielts_bot\\main.py"], cwd=str(repo_root))
    try:
        server.wait()
        bot.wait()
    except KeyboardInterrupt:
        for proc in (server, bot):
            if proc.poll() is None:
                proc.terminate()

if __name__ == "__main__":
    main()
 