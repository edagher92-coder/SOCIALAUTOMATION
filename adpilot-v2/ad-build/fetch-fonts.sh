#!/usr/bin/env bash
# Fetch the display fonts used by render.js (OFL-licensed Google Fonts).
set -e
mkdir -p "$(dirname "$0")/fonts"
cd "$(dirname "$0")/fonts"
curl -fsSL "https://github.com/google/fonts/raw/main/ofl/anton/Anton-Regular.ttf" -o Anton.ttf
curl -fsSL "https://github.com/google/fonts/raw/main/ofl/montserrat/Montserrat%5Bwght%5D.ttf" -o Montserrat.ttf
echo "fonts ready: $(ls)"
