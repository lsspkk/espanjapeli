#!/bin/bash
# Fix script: Remove duplicate SVG content from files
# Keeps only the first <svg>...</svg> block in each affected file

SVG_DIR="/home/lvp/study/espanjapeli/svelte/static/peppa_advanced_spanish_images/svg"

# List of files with duplicate SVG tags (detected via grep)
FILES=(
  "15_do_you_want_to_play_with_me.svg"
  "16_i_am_hungry.svg"
  "17_there_is_a_rainbow.svg"
  "18_lets_go_to_school.svg"
  "19_how_delicious.svg"
  "20_lets_visit_grandparents.svg"
  "22_lets_count_to_ten.svg"
)

echo "=== Fixing SVG files with duplicate <svg> tags ==="
echo ""

for file in "${FILES[@]}"; do
  filepath="$SVG_DIR/$file"
  
  if [[ ! -f "$filepath" ]]; then
    echo "[SKIP] File not found: $file"
    continue
  fi
  
  # Count how many <svg tags are in the file
  svg_count=$(grep -c '<svg' "$filepath")
  
  if [[ "$svg_count" -le 1 ]]; then
    echo "[OK]   $file — only 1 <svg> tag, no fix needed"
    continue
  fi
  
  # Find line number of first </svg>
  first_close_line=$(grep -n '</svg>' "$filepath" | head -1 | cut -d: -f1)
  
  if [[ -z "$first_close_line" ]]; then
    echo "[ERR]  $file — no </svg> found, skipping"
    continue
  fi
  
  # Get total lines before fix
  total_lines=$(wc -l < "$filepath")
  
  # Extract only lines 1 through first_close_line (the first SVG)
  head -n "$first_close_line" "$filepath" > "$filepath.tmp"
  mv "$filepath.tmp" "$filepath"
  
  # Get new line count
  new_lines=$(wc -l < "$filepath")
  
  echo "[FIX]  $file — kept lines 1-$first_close_line (was $total_lines lines, now $new_lines lines)"
done

echo ""
echo "=== Done ==="

