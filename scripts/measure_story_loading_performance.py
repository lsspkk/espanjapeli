#!/usr/bin/env python3
"""
Performance measurement script for story loading optimization.
Measures data transfer, request counts, and loading times.

Task 28.7: Performance Testing and Validation
"""

import json
import os
import sys
from pathlib import Path
from typing import Dict, List, Tuple
from datetime import datetime


def get_file_size(filepath: Path) -> int:
    """Get file size in bytes."""
    if not filepath.exists():
        return 0
    return filepath.stat().st_size


def format_bytes(size: int) -> str:
    """Format bytes to human-readable string."""
    for unit in ['B', 'KB', 'MB', 'GB']:
        if size < 1024.0:
            return f"{size:.1f}{unit}"
        size /= 1024.0
    return f"{size:.1f}TB"


def analyze_story_files(stories_dir: Path) -> Dict:
    """Analyze all story files and manifest."""
    manifest_path = stories_dir / "manifest.json"
    
    if not manifest_path.exists():
        print(f"Error: Manifest not found at {manifest_path}")
        sys.exit(1)
    
    # Load manifest
    with open(manifest_path, 'r', encoding='utf-8') as f:
        manifest = json.load(f)
    
    manifest_size = get_file_size(manifest_path)
    story_count = len(manifest.get('stories', []))
    
    # Analyze individual story files
    story_files: List[Tuple[str, int]] = []
    total_story_size = 0
    
    for level_dir in ['a1', 'a2', 'b1', 'b2']:
        level_path = stories_dir / level_dir
        if level_path.exists():
            for story_file in level_path.glob('*.json'):
                size = get_file_size(story_file)
                story_files.append((story_file.name, size))
                total_story_size += size
    
    # Calculate statistics
    story_files.sort(key=lambda x: x[1], reverse=True)
    
    avg_story_size = total_story_size / len(story_files) if story_files else 0
    min_story_size = min(story_files, key=lambda x: x[1])[1] if story_files else 0
    max_story_size = max(story_files, key=lambda x: x[1])[1] if story_files else 0
    
    return {
        'manifest_size': manifest_size,
        'story_count': story_count,
        'story_file_count': len(story_files),
        'total_story_size': total_story_size,
        'avg_story_size': avg_story_size,
        'min_story_size': min_story_size,
        'max_story_size': max_story_size,
        'largest_stories': story_files[:5],  # Top 5 largest
        'smallest_stories': story_files[-5:],  # Bottom 5 smallest
    }


def calculate_loading_scenarios(data: Dict) -> Dict:
    """Calculate different loading scenarios."""
    manifest_size = data['manifest_size']
    total_story_size = data['total_story_size']
    avg_story_size = data['avg_story_size']
    
    # Scenario 1: Old approach - load all stories
    old_approach = {
        'name': 'Old Approach (Load All Stories)',
        'files_loaded': data['story_file_count'] + 1,  # All stories + manifest
        'data_transferred': manifest_size + total_story_size,
        'http_requests': data['story_file_count'] + 1,
    }
    
    # Scenario 2: New approach - manifest only, then on-demand
    new_approach_initial = {
        'name': 'New Approach (Manifest Only)',
        'files_loaded': 1,  # Only manifest
        'data_transferred': manifest_size,
        'http_requests': 1,
    }
    
    # Scenario 3: New approach - manifest + 1 story (typical user action)
    new_approach_one_story = {
        'name': 'New Approach (Manifest + 1 Story)',
        'files_loaded': 2,
        'data_transferred': manifest_size + avg_story_size,
        'http_requests': 2,
    }
    
    # Scenario 4: New approach - manifest + 3 stories (power user)
    new_approach_three_stories = {
        'name': 'New Approach (Manifest + 3 Stories)',
        'files_loaded': 4,
        'data_transferred': manifest_size + (avg_story_size * 3),
        'http_requests': 4,
    }
    
    return {
        'old_approach': old_approach,
        'new_approach_initial': new_approach_initial,
        'new_approach_one_story': new_approach_one_story,
        'new_approach_three_stories': new_approach_three_stories,
    }


def calculate_time_estimates(data_size: int) -> Dict:
    """Calculate estimated loading times for different connection speeds."""
    # Connection speeds in Kbps (kilobits per second)
    connections = {
        'Slow 3G': 750,
        'Fast 3G': 1500,
        '4G': 5000,
        'Fast 4G': 10000,
        'WiFi (10 Mbps)': 10000,
        'WiFi (50 Mbps)': 50000,
    }
    
    # Convert bytes to kilobits
    data_kilobits = (data_size * 8) / 1024
    
    times = {}
    for name, speed_kbps in connections.items():
        # Time in seconds = data (kilobits) / speed (kilobits per second)
        time_seconds = data_kilobits / speed_kbps
        times[name] = time_seconds
    
    return times


def calculate_improvements(old_scenario: Dict, new_scenario: Dict) -> Dict:
    """Calculate improvement percentages."""
    data_reduction = ((old_scenario['data_transferred'] - new_scenario['data_transferred']) 
                     / old_scenario['data_transferred'] * 100)
    
    request_reduction = ((old_scenario['http_requests'] - new_scenario['http_requests']) 
                        / old_scenario['http_requests'] * 100)
    
    return {
        'data_reduction_percent': data_reduction,
        'request_reduction_percent': request_reduction,
        'data_saved': old_scenario['data_transferred'] - new_scenario['data_transferred'],
        'requests_saved': old_scenario['http_requests'] - new_scenario['http_requests'],
    }


def generate_report(data: Dict, scenarios: Dict) -> str:
    """Generate a detailed performance report."""
    lines = []
    lines.append("=" * 80)
    lines.append("STORY LOADING PERFORMANCE MEASUREMENT REPORT")
    lines.append("=" * 80)
    lines.append(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    lines.append(f"Task: 28.7 - Performance Testing and Validation")
    lines.append("")
    
    # File Analysis
    lines.append("-" * 80)
    lines.append("FILE ANALYSIS")
    lines.append("-" * 80)
    lines.append(f"Manifest Size:        {format_bytes(data['manifest_size'])}")
    lines.append(f"Story Count:          {data['story_count']}")
    lines.append(f"Story Files Found:    {data['story_file_count']}")
    lines.append(f"Total Story Size:     {format_bytes(data['total_story_size'])}")
    lines.append(f"Average Story Size:   {format_bytes(data['avg_story_size'])}")
    lines.append(f"Smallest Story:       {format_bytes(data['min_story_size'])}")
    lines.append(f"Largest Story:        {format_bytes(data['max_story_size'])}")
    lines.append("")
    
    # Largest stories
    lines.append("Top 5 Largest Stories:")
    for filename, size in data['largest_stories']:
        lines.append(f"  - {filename:<40} {format_bytes(size)}")
    lines.append("")
    
    # Loading Scenarios
    lines.append("-" * 80)
    lines.append("LOADING SCENARIOS COMPARISON")
    lines.append("-" * 80)
    lines.append("")
    
    old = scenarios['old_approach']
    new_initial = scenarios['new_approach_initial']
    new_one = scenarios['new_approach_one_story']
    new_three = scenarios['new_approach_three_stories']
    
    # Old Approach
    lines.append(f"📊 {old['name']}")
    lines.append(f"   Files Loaded:      {old['files_loaded']}")
    lines.append(f"   Data Transferred:  {format_bytes(old['data_transferred'])}")
    lines.append(f"   HTTP Requests:     {old['http_requests']}")
    lines.append("")
    
    # New Approach - Initial
    lines.append(f"✨ {new_initial['name']}")
    lines.append(f"   Files Loaded:      {new_initial['files_loaded']}")
    lines.append(f"   Data Transferred:  {format_bytes(new_initial['data_transferred'])}")
    lines.append(f"   HTTP Requests:     {new_initial['http_requests']}")
    
    improvement = calculate_improvements(old, new_initial)
    lines.append(f"   📈 Improvement:     {improvement['data_reduction_percent']:.1f}% data reduction")
    lines.append(f"                      {improvement['request_reduction_percent']:.1f}% fewer requests")
    lines.append(f"                      {format_bytes(improvement['data_saved'])} saved")
    lines.append("")
    
    # New Approach - One Story
    lines.append(f"✨ {new_one['name']}")
    lines.append(f"   Files Loaded:      {new_one['files_loaded']}")
    lines.append(f"   Data Transferred:  {format_bytes(new_one['data_transferred'])}")
    lines.append(f"   HTTP Requests:     {new_one['http_requests']}")
    
    improvement = calculate_improvements(old, new_one)
    lines.append(f"   📈 Improvement:     {improvement['data_reduction_percent']:.1f}% data reduction")
    lines.append(f"                      {improvement['request_reduction_percent']:.1f}% fewer requests")
    lines.append(f"                      {format_bytes(improvement['data_saved'])} saved")
    lines.append("")
    
    # New Approach - Three Stories
    lines.append(f"✨ {new_three['name']}")
    lines.append(f"   Files Loaded:      {new_three['files_loaded']}")
    lines.append(f"   Data Transferred:  {format_bytes(new_three['data_transferred'])}")
    lines.append(f"   HTTP Requests:     {new_three['http_requests']}")
    
    improvement = calculate_improvements(old, new_three)
    lines.append(f"   📈 Improvement:     {improvement['data_reduction_percent']:.1f}% data reduction")
    lines.append(f"                      {improvement['request_reduction_percent']:.1f}% fewer requests")
    lines.append(f"                      {format_bytes(improvement['data_saved'])} saved")
    lines.append("")
    
    # Time Estimates
    lines.append("-" * 80)
    lines.append("ESTIMATED LOADING TIMES")
    lines.append("-" * 80)
    lines.append("")
    
    for scenario_name, scenario in [
        ('Old Approach', old),
        ('New Approach (Initial)', new_initial),
        ('New Approach (1 Story)', new_one),
    ]:
        lines.append(f"{scenario_name}:")
        times = calculate_time_estimates(scenario['data_transferred'])
        for conn_name, time_sec in times.items():
            lines.append(f"  {conn_name:<20} {time_sec:.2f}s")
        lines.append("")
    
    # Key Findings
    lines.append("-" * 80)
    lines.append("KEY FINDINGS")
    lines.append("-" * 80)
    
    initial_improvement = calculate_improvements(old, new_initial)
    lines.append(f"✅ Initial page load optimized by {initial_improvement['data_reduction_percent']:.1f}%")
    lines.append(f"✅ Reduced HTTP requests from {old['http_requests']} to {new_initial['http_requests']}")
    lines.append(f"✅ Data saved on initial load: {format_bytes(initial_improvement['data_saved'])}")
    lines.append("")
    
    one_story_improvement = calculate_improvements(old, new_one)
    lines.append(f"✅ Even with 1 story loaded, still {one_story_improvement['data_reduction_percent']:.1f}% improvement")
    lines.append(f"✅ Typical user saves {format_bytes(one_story_improvement['data_saved'])} of data")
    lines.append("")
    
    lines.append("🎯 RECOMMENDATION: The new lazy-loading approach provides significant")
    lines.append("   performance improvements, especially on slower connections.")
    lines.append("")
    
    lines.append("=" * 80)
    
    return "\n".join(lines)


def save_json_results(data: Dict, scenarios: Dict, output_path: Path):
    """Save detailed results as JSON for further analysis."""
    results = {
        'timestamp': datetime.now().isoformat(),
        'task': '28.7',
        'file_analysis': data,
        'scenarios': scenarios,
        'improvements': {
            'manifest_only': calculate_improvements(
                scenarios['old_approach'],
                scenarios['new_approach_initial']
            ),
            'manifest_plus_one_story': calculate_improvements(
                scenarios['old_approach'],
                scenarios['new_approach_one_story']
            ),
            'manifest_plus_three_stories': calculate_improvements(
                scenarios['old_approach'],
                scenarios['new_approach_three_stories']
            ),
        }
    }
    
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(results, f, indent=2)
    
    print(f"✅ JSON results saved to: {output_path}")


def main():
    """Main execution function."""
    # Determine project root
    script_dir = Path(__file__).parent
    project_root = script_dir.parent
    stories_dir = project_root / "svelte" / "static" / "stories"
    reports_dir = project_root / "reports"
    
    # Ensure reports directory exists
    reports_dir.mkdir(exist_ok=True)
    
    print("=" * 80)
    print("Story Loading Performance Measurement")
    print("=" * 80)
    print(f"Analyzing stories in: {stories_dir}")
    print("")
    
    # Analyze files
    data = analyze_story_files(stories_dir)
    
    # Calculate scenarios
    scenarios = calculate_loading_scenarios(data)
    
    # Generate report
    report = generate_report(data, scenarios)
    
    # Print to console
    print(report)
    
    # Save text report
    report_path = reports_dir / "story-loading-performance-results.txt"
    with open(report_path, 'w', encoding='utf-8') as f:
        f.write(report)
    print(f"✅ Report saved to: {report_path}")
    
    # Save JSON results
    json_path = reports_dir / "story-loading-performance-results.json"
    save_json_results(data, scenarios, json_path)
    
    print("")
    print("✅ Performance measurement complete!")


if __name__ == "__main__":
    main()
