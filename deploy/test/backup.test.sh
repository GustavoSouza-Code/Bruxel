#!/usr/bin/env bash
set -uo pipefail

AQUI=$(cd "$(dirname "$0")" && pwd)
SCRIPT="$AQUI/../backup.sh"
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT
FALHAS=0

PGHOST_T=${TEST_PGHOST:-/tmp}
PGPORT_T=${TEST_PGPORT:-5433}
PGUSER_T=${TEST_PGUSER:-bruxel}
PGDB_T=${TEST_PGDB:-bruxel}

mkdir -p "$TMP/uploads/produtos"
echo "conteudo-da-imagem" > "$TMP/uploads/produtos/a.jpg"

export BACKUP_DIR="$TMP/backups"
export LOG_FILE="$TMP/backup.log"
export RETENTION_DAYS=7
export DUMP_CMD="pg_dump -h $PGHOST_T -p $PGPORT_T -U $PGUSER_T -Fc $PGDB_T"
export UPLOADS_CMD="tar czf - -C $TMP/uploads ."
export VERIFY_DUMP_CMD="pg_restore -l"
export MIN_FREE_MB=1

checar() {
  local nome=$1; shift
  if "$@"; then echo "ok   $nome"; else echo "FALHA $nome"; FALHAS=$((FALHAS+1)); fi
}

bash "$SCRIPT" >"$TMP/saida1.txt" 2>&1
checar "script termina com sucesso" test $? -eq 0
checar "gera dump .dump" bash -c "ls $BACKUP_DIR/db_*.dump >/dev/null 2>&1"
checar "gera tar de uploads" bash -c "ls $BACKUP_DIR/uploads_*.tar.gz >/dev/null 2>&1"
checar "dump e legivel pelo pg_restore" bash -c "pg_restore -l $BACKUP_DIR/db_*.dump | grep -q products"
checar "tar contem a imagem" bash -c "tar tzf $BACKUP_DIR/uploads_*.tar.gz | grep -q produtos/a.jpg"
checar "nao deixa arquivos .tmp" bash -c "! ls $BACKUP_DIR/*.tmp >/dev/null 2>&1"
checar "log registra conclusao" grep -q "backup concluido" "$LOG_FILE"

touch -d "10 days ago" "$BACKUP_DIR/db_antigo.dump" "$BACKUP_DIR/uploads_antigo.tar.gz"
bash "$SCRIPT" >/dev/null 2>&1
checar "remove backups com mais de 7 dias" bash -c "! ls $BACKUP_DIR/*antigo* >/dev/null 2>&1"
checar "mantem backups recentes" bash -c "ls $BACKUP_DIR/db_*.dump | wc -l | grep -q '^[12]$'"

ANTES=$(ls "$BACKUP_DIR" | sort)
DUMP_CMD="false" bash "$SCRIPT" >/dev/null 2>&1
checar "falha quando o dump falha" test $? -ne 0
DEPOIS=$(ls "$BACKUP_DIR" | sort)
checar "dump falho nao deixa arquivo parcial" test "$ANTES" = "$DEPOIS"

UPLOADS_CMD="false" bash "$SCRIPT" >/dev/null 2>&1
checar "falha quando o tar de uploads falha" test $? -ne 0

MIN_FREE_MB=999999999 bash "$SCRIPT" >/dev/null 2>&1
checar "falha sem espaco livre minimo" test $? -ne 0

echo
if [ "$FALHAS" -eq 0 ]; then echo "todos os testes passaram"; else echo "$FALHAS teste(s) falharam"; exit 1; fi
