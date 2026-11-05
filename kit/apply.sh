#!/usr/bin/env bash
# Развернуть набор правил разработки PWA в другом проекте.
#   kit/apply.sh <папка-проекта> <Название> <owner/repo> [порт=5173] [слоган]
# Пример: kit/apply.sh ../hlth HLTH pirschuk/hlth 5174 "Худеем на здоровье"
# Существующие файлы не перезаписываются — для них кладётся копия с суффиксом .kit (сравнить и слить вручную).
set -euo pipefail
dst=${1:?папка проекта}; app=${2:?название}; full=${3:?owner/repo}; port=${4:-5173}; tagline=${5:-приложение}
owner=${full%%/*}; repo=${full##*/}
slug=$(printf '%s' "$repo" | tr '[:upper:]' '[:lower:]' | tr -c 'a-z0-9\n' '-')
src="$(cd "$(dirname "$0")" && pwd)/template"
mkdir -p "$dst"
cd "$src"
find . -type f | while read -r f; do
  out="$dst/${f#./}"
  mkdir -p "$(dirname "$out")"
  [ -e "$out" ] && out="$out.kit"
  sed -e "s|{{APP}}|$app|g" -e "s|{{OWNER}}|$owner|g" -e "s|{{REPO}}|$repo|g" -e "s|{{SLUG}}|$slug|g" \
      -e "s|{{PORT}}|$port|g" -e "s|{{TAGLINE}}|$tagline|g" "$f" > "$out"
  case "$f" in *.sh) chmod +x "$out" ;; esac
  echo "  + ${out#$dst/}"
done
cat <<MSG

Готово. Дальше в $dst:
  1. В CLAUDE.md заполнить {{BACKEND}}, {{AGENTS}}, {{THEME}}; в скилле design-system — разделы 4–6 (токены).
  2. Сверить файлы *.kit с существующими и слить.
  3. package.json: скрипты dev (--port $port --strictPort), build:gh-pages, engines.node >=22.12 — см. kit/README.md.
  4. vite.config.ts, index.html, .gitignore — см. kit/README.md («Код проекта»).
MSG
