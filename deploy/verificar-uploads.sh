#!/usr/bin/env bash
set -euo pipefail

BASE=${BASE:-/home/univates}
COMPOSE_DIR=${COMPOSE_DIR:-$BASE/bruxel}
DOCKER=${DOCKER:-docker}
MIN_FREE_MB=${MIN_FREE_MB:-500}
COMPOSE="$DOCKER compose -f $COMPOSE_DIR/docker-compose.yml"

falhou=0
ok() { echo "ok     $1"; }
erro() { echo "FALHA  $1"; falhou=1; }

if $COMPOSE exec -T backend sh -c 'mountpoint -q /app/uploads || grep -q " /app/uploads " /proc/mounts'; then
  ok "/app/uploads e um volume montado"
else
  erro "/app/uploads nao esta montado como volume (as imagens somem ao recriar o container)"
fi

if $COMPOSE exec -T backend sh -c 't=/app/uploads/.escrita_$$; echo teste > "$t" && rm -f "$t"'; then
  ok "backend consegue gravar em /app/uploads"
else
  erro "sem permissao de escrita em /app/uploads"
fi

LIVRE=$($COMPOSE exec -T backend sh -c "df -Pm /app/uploads | awk 'NR==2 {print \$4}'" | tr -d '\r')
if [ "${LIVRE:-0}" -ge "$MIN_FREE_MB" ]; then
  ok "espaco livre: ${LIVRE} MB"
else
  erro "espaco livre ${LIVRE:-?} MB abaixo do minimo de ${MIN_FREE_MB} MB"
fi

QTD=$($COMPOSE exec -T backend sh -c 'find /app/uploads -type f | wc -l' | tr -d '\r')
echo "info   arquivos em /app/uploads: $QTD"

exit $falhou
