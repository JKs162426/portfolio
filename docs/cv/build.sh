#!/bin/bash
# Genera el CV en PDF con Chrome a partir de docs/cv/cv.html.
#
#   docs/cv/build.sh                         → public/cv.pdf (versión web, SIN teléfono)
#   CV_PHONE="+1 (…) …" docs/cv/build.sh     → además, una copia privada con teléfono
#                                              en ~/Desktop/Jesus-Figueroa-CV.pdf
#
# El teléfono nunca se guarda en el repo: solo entra por la variable de entorno.
set -euo pipefail
cd "$(dirname "$0")/../.."
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT

render() { # $1 = html, $2 = pdf
  "$CHROME" --headless=new --disable-gpu --no-pdf-header-footer \
    --virtual-time-budget=6000 --print-to-pdf="$2" "file://$1" 2>/dev/null
  local pages
  pages=$(python3 -c 'import re,sys; print(len(re.findall(rb"/Type\s*/Page[^s]", open(sys.argv[1], "rb").read())))' "$2")
  [ "$pages" = "1" ] || { echo "⚠ $2 tiene $pages páginas (debería ser 1)"; exit 1; }
  # Una página no basta: html/body tienen overflow:hidden, así que lo que no
  # cabe se corta en silencio. Se mide si alguna columna se desborda.
  local overflow
  overflow=$("$CHROME" --headless=new --disable-gpu --virtual-time-budget=6000 --window-size=816,1056 \
    --run-all-compositor-stages-before-draw --dump-dom "file://$1" 2>/dev/null \
    | grep -o 'data-overflow="[^"]*"' | head -1)
  [ "$overflow" = 'data-overflow="none"' ] || { echo "⚠ $2: hay contenido cortado ($overflow)"; exit 1; }
  echo "✓ $2"
}

sed 's#<!--PHONE-->##' docs/cv/cv.html > "$TMP/public.html"
render "$TMP/public.html" "$PWD/public/cv.pdf"

if [ -n "${CV_PHONE:-}" ]; then
  sed "s#<!--PHONE-->#<span>${CV_PHONE}</span>#" docs/cv/cv.html > "$TMP/private.html"
  render "$TMP/private.html" "$HOME/Desktop/Jesus-Figueroa-CV.pdf"
fi
