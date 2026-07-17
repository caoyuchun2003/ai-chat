#!/usr/bin/env bash
# 注入 QIANFAN_API_KEY 后 bsam package + deploy（Key 不入库）
set -euo pipefail

export PATH="${HOME}/Library/Python/3.9/bin:${HOME}/.local/bin:${PATH}"

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if ! command -v bsam >/dev/null 2>&1; then
  echo "未找到 bsam。先: pip3 install --user bce-sam-cli"
  exit 1
fi

if [[ -z "${QIANFAN_API_KEY:-}" && -n "${QIANFAN_AK:-}" ]]; then
  export QIANFAN_API_KEY="$QIANFAN_AK"
fi

if [[ -z "${QIANFAN_API_KEY:-}" ]]; then
  echo "请先 export QIANFAN_API_KEY=千帆BearerKey"
  exit 1
fi

BASE_TEMPLATE="${ROOT}/template.yaml"
DEPLOY_TEMPLATE="${ROOT}/template.deploy.yaml"
trap 'rm -f "$DEPLOY_TEMPLATE"' EXIT

python3 - "$BASE_TEMPLATE" "$DEPLOY_TEMPLATE" <<'PY'
import os, sys
src, dst = sys.argv[1], sys.argv[2]
text = open(src, encoding="utf-8").read()
ak = os.environ["QIANFAN_API_KEY"].replace("'", "''")
line = f"          QIANFAN_API_KEY: '{ak}'\n"
if "QIANFAN_API_KEY:" in text:
    import re
    text = re.sub(r"^[ \t]*QIANFAN_API_KEY:.*$", line.rstrip(), text, flags=re.M)
else:
    text = text.replace(
        "          ALLOW_ORIGIN:",
        line + "          ALLOW_ORIGIN:",
        1,
    )
open(dst, "w", encoding="utf-8").write(text)
print("已生成 template.deploy.yaml（含 QIANFAN_API_KEY，不入库）")
PY

echo ">>> bsam package"
bsam package -t "$DEPLOY_TEMPLATE"
echo ">>> bsam deploy"
bsam deploy -t "$DEPLOY_TEMPLATE"
rm -f "$ROOT"/*.zip "$ROOT"/src/*.zip
echo "部署完成。在控制台复制 HTTP 触发器 URL，设为 GitHub Actions Variable API_URL。"
