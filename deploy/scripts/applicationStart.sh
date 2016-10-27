mkdir -p /votesup/log
/usr/bin/forever /votesup/app.js > /votesup/log/server.log 2>&1 &
