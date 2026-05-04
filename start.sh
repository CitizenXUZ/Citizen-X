#!/bin/bash
echo "Starting backend server..."
python backend/server.py --host 0.0.0.0 --port ${PORT:-8000} &

echo "Starting telegram bot..."
python telegram_bot/telegram_bot.py &

# Wait for any process to exit
wait -n
  
# Exit with status of process that exited first
exit $?
