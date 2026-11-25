#!/usr/bin/env bash
set -euo pipefail
umask 077

BASE=${BASE:-/home/univates}
COMPOSE_DIR=${COMPOSE_DIR:-$BASE/bruxel}
BACKUP_DIR=${BACKUP_DIR:-$BASE/backups}
LOG_FILE=${LOG_FILE:-$BACKUP_DIR/backup.log}
RETENTION_DAYS=${RETENTION_DAYS:-7}
MIN_FREE_MB=${MIN_FREE_MB:-500}
DOCKER=${DOCKER:-docker}

COMPOSE="$DOCKER compose -f $COMPOSE_DIR/docker-compose.yml"
DUMP_CMD=${DUMP_CMD:-"$COMPOSE exec -T db pg_dump -U bruxel -Fc bruxel"}
VERIFY_DUMP_CMD=${VERIFY_DUMP_CMD:-"$COMPOSE exec -T db pg_restore -l"}
UPLOADS_CMD=${UPLOADS_CMD:-"$COMPOSE exec -T backend tar czf - -C /app/uploads ."}

mkdir -p "$BACKUP_DIR" "$(dirname "$LOG_FILE")"
exec 9>"$BACKUP_DIR/.backup.lock"
flock -n 9 || { echo "outro backup em andamento" >&2; exit 1; }

log() { echo "$(date -Is) $*" | tee -a "$LOG_FILE"; }

TS=$(date +%Y%m%d_%H%M%S)
DUMP_FINAL="$BACKUP_DIR/db_$TS.dump"
UPLOADS_FINAL="$BACKUP_DIR/uploads_$TS.tar.gz"
DUMP_TMP="$DUMP_FINAL.tmp"
UPLOADS_TMP="$UPLOADS_FINAL.tmp"

limpar() { rm -f "$DUMP_TMP" "$UPLOADS_TMP"; }
trap limpar EXIT
trap 'log "ERRO: backup falhou na linha $LINENO"' ERR

log "backup iniciado"

LIVRE_MB=$(df -Pm "$BACKUP_DIR" | awk 'NR==2 {print $4}')
if [ "$LIVRE_MB" -lt "$MIN_FREE_MB" ]; then
  log "ERRO: espaco livre ${LIVRE_MB}MB abaixo do minimo de ${MIN_FREE_MB}MB"
  exit 1
fi

bash -c "$DUMP_CMD" > "$DUMP_TMP"
[ -s "$DUMP_TMP" ] || { log "ERRO: dump vazio"; exit 1; }
bash -c "$VERIFY_DUMP_CMD" < "$DUMP_TMP" > /dev/null || { log "ERRO: dump invalido (pg_restore -l falhou)"; exit 1; }

bash -c "$UPLOADS_CMD" > "$UPLOADS_TMP"
tar tzf "$UPLOADS_TMP" > /dev/null || { log "ERRO: tar de uploads corrompido"; exit 1; }

mv "$DUMP_TMP" "$DUMP_FINAL"
mv "$UPLOADS_TMP" "$UPLOADS_FINAL"

find "$BACKUP_DIR" -maxdepth 1 -type f \( -name 'db_*.dump' -o -name 'uploads_*.tar.gz' \) -mtime +"$RETENTION_DAYS" -delete

log "backup concluido: $(basename "$DUMP_FINAL") ($(du -h "$DUMP_FINAL" | cut -f1)), $(basename "$UPLOADS_FINAL") ($(du -h "$UPLOADS_FINAL" | cut -f1))"
