#!/bin/zsh
# Bear Kitchen dev server 守护脚本：确保 5173 上的永远是最新代码
# 用法: ./start-dev.sh  （已在跑则不动，没跑则启动）

PORT=5173
NODE=/Users/tan/.workbuddy/binaries/node/versions/22.12.0/bin/node
DIR="/Users/tan/WorkBuddy/2026-08-13-16-37-27/bear-kitchen"
LOG="$DIR/.dev-server.log"
PIDFILE="$DIR/.dev-server.pid"

# 已在监听则直接退出
if curl -s --noproxy '*' -o /dev/null --max-time 2 "http://localhost:$PORT"; then
  echo "dev server already running on :$PORT"
  exit 0
fi

cd "$DIR" || exit 1
nohup "$NODE" node_modules/vite/bin/vite.js --port "$PORT" --strictPort > "$LOG" 2>&1 &
echo $! > "$PIDFILE"

# 等待就绪（最多 15 秒）
for i in {1..15}; do
  sleep 1
  if curl -s --noproxy '*' -o /dev/null --max-time 2 "http://localhost:$PORT"; then
    echo "dev server started on :$PORT (pid $(cat "$PIDFILE"))"
    exit 0
  fi
done
echo "FAILED to start, see $LOG"
exit 1
