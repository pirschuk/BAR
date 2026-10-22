#!/usr/bin/env bash
# PostToolUse (Write|Edit): tsc --noEmit после правки .ts/.tsx.
# Ошибки компиляции возвращаются Claude через exit 2 — он обязан их исправить.
input=$(cat)
file=$(printf '%s' "$input" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{const j=JSON.parse(s);process.stdout.write(j.tool_input?.file_path||"")}catch{}})')

case "$file" in
  *.ts|*.tsx) ;;
  *) exit 0 ;;
esac

cd "${CLAUDE_PROJECT_DIR:-.}" || exit 0
# До инициализации проекта (Шаг 0) проверять нечего.
[ -f tsconfig.json ] && [ -x node_modules/.bin/tsc ] || exit 0

# Шаблон Vite использует project references (в tsconfig.app.json уже noEmit) → tsc -b.
if grep -q '"references"' tsconfig.json; then
  out=$(node_modules/.bin/tsc -b 2>&1)
else
  out=$(node_modules/.bin/tsc --noEmit -p tsconfig.json 2>&1)
fi
status=$?
if [ $status -ne 0 ]; then
  echo "tsc --noEmit: ошибки типов после правки $file" >&2
  printf '%s\n' "$out" | head -40 >&2
  exit 2
fi
exit 0
