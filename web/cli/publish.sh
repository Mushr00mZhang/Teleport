docker load <teleport_web.tar
docker compose -p telteport_web down
docker compose -p telteport_web up -d --remove-orphans
