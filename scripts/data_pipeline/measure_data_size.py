#!/usr/bin/env python3
"""
Measure and report data file sizes for V4 frequency data.

Reports raw and gzipped sizes to help with bundle optimization.

Usage:
    python measure_data_size.py

Output:
    Prints size report to console
"""

import gzip
import json
from pathlib import Path
import tempfile


SCRIPT_DIR = Path(__file__).parent
DATA_DIR = SCRIPT_DIR.parent.parent / "svelte" / "static" / "data"


def measure_json_size(filepath: Path) -> dict:
    """Measure raw and gzipped JSON size, return stats dict."""
    raw_size = filepath.stat().st_size
    
    # Measure gzip size without creating permanent file
    with open(filepath, 'rb') as f_in:
        raw_data = f_in.read()
    
    with tempfile.NamedTemporaryFile(suffix='.gz', delete=False) as tmp:
        with gzip.open(tmp.name, 'wb') as f_out:
            f_out.write(raw_data)
        gzip_size = Path(tmp.name).stat().st_size
        Path(tmp.name).unlink()  # Clean up temp file
    
    # Load and count words
    with open(filepath) as f:
        data = json.load(f)
    word_count = data.get('wordCount', len(data.get('words', {})))
    
    compression_ratio = 100 * (1 - gzip_size / raw_size) if raw_size > 0 else 0
    
    return {
        "file": filepath.name,
        "raw_bytes": raw_size,
        "gzip_bytes": gzip_size,
        "compression_pct": compression_ratio,
        "word_count": word_count
    }


def format_bytes(size: int) -> str:
    """Format bytes as human-readable string."""
    if size < 1024:
        return f"{size} B"
    elif size < 1024 * 1024:
        return f"{size/1024:.1f} KB"
    else:
        return f"{size/1024/1024:.2f} MB"


def print_report(stats: list[dict]):
    """Print formatted report."""
    print("=" * 70)
    print("FREQUENCY DATA SIZE REPORT")
    print("=" * 70)
    print()
    
    for s in stats:
        print(f"{s['file']}:")
        print(f"  Raw:         {format_bytes(s['raw_bytes']):>12} ({s['raw_bytes']:,} bytes)")
        print(f"  Gzipped:     {format_bytes(s['gzip_bytes']):>12} ({s['gzip_bytes']:,} bytes)")
        print(f"  Compression: {s['compression_pct']:.1f}%")
        print(f"  Words:       {s['word_count']:,}")
        print()
    
    # Summary
    total_raw = sum(s['raw_bytes'] for s in stats)
    total_gzip = sum(s['gzip_bytes'] for s in stats)
    print("-" * 70)
    print(f"TOTAL:         {format_bytes(total_raw):>12} raw / {format_bytes(total_gzip):>12} gzipped")
    print("=" * 70)


def main():
    """Measure all frequency files and print report."""
    if not DATA_DIR.exists():
        print(f"Error: {DATA_DIR} not found. Run filter_frequency.py first.")
        return 1
    
    files = sorted(DATA_DIR.glob("frequency-*.json"))
    if not files:
        print(f"No frequency files found in {DATA_DIR}")
        return 1
    
    stats = [measure_json_size(f) for f in files]
    print_report(stats)
    return 0


if __name__ == "__main__":
    exit(main())
