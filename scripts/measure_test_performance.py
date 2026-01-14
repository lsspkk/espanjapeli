#!/usr/bin/env python3
"""
Test Performance Measurement Script

Measures Vitest test suite performance and generates baseline metrics.
This script runs the test suite multiple times and collects timing data.

Usage:
    python scripts/measure_test_performance.py [--runs N] [--output FILE]

Options:
    --runs N        Number of test runs to perform (default: 3)
    --output FILE   Output JSON file path (default: reports/test-performance-baseline.json)
"""

import subprocess
import json
import time
import argparse
import sys
from pathlib import Path
from typing import Dict, List, Any
from datetime import datetime


def run_tests_with_json_reporter() -> Dict[str, Any]:
    """Run tests with JSON reporter and return parsed results."""
    print("Running tests with JSON reporter...")
    
    result = subprocess.run(
        ["npm", "test", "--", "--run", "--reporter=json"],
        cwd="svelte",
        capture_output=True,
        text=True,
        timeout=180
    )
    
    # Parse JSON output (skip non-JSON lines like warnings)
    lines = result.stdout.split('\n')
    json_line = None
    for line in lines:
        if line.strip().startswith('{'):
            json_line = line
            break
    
    if not json_line:
        raise ValueError("Could not find JSON output in test results")
    
    return json.loads(json_line)


def run_tests_timed() -> float:
    """Run tests and return total execution time in seconds."""
    print("Running timed test execution...")
    
    start_time = time.time()
    
    result = subprocess.run(
        ["npm", "test", "--", "--run"],
        cwd="svelte",
        capture_output=True,
        text=True,
        timeout=180
    )
    
    end_time = time.time()
    duration = end_time - start_time
    
    print(f"  Test run completed in {duration:.2f}s")
    
    return duration


def extract_test_file_timings(json_results: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Extract timing information for each test file."""
    test_files = []
    
    for test_result in json_results.get('testResults', []):
        file_name = test_result.get('name', 'unknown')
        start_time = test_result.get('startTime', 0)
        end_time = test_result.get('endTime', 0)
        duration = (end_time - start_time) / 1000.0  # Convert to seconds
        
        test_count = len(test_result.get('assertionResults', []))
        
        # Calculate average test duration
        avg_test_duration = duration / test_count if test_count > 0 else 0
        
        test_files.append({
            'file': file_name.replace('/home/lvp/study/espanjapeli/svelte/', ''),
            'duration_seconds': round(duration, 3),
            'test_count': test_count,
            'avg_test_duration': round(avg_test_duration, 3),
            'status': test_result.get('status', 'unknown')
        })
    
    # Sort by duration (slowest first)
    test_files.sort(key=lambda x: x['duration_seconds'], reverse=True)
    
    return test_files


def measure_test_performance(num_runs: int = 3) -> Dict[str, Any]:
    """Run tests multiple times and collect performance metrics."""
    print(f"\n{'='*60}")
    print(f"Test Performance Measurement - {num_runs} runs")
    print(f"{'='*60}\n")
    
    # First run with JSON reporter to get detailed data
    json_results = run_tests_with_json_reporter()
    test_file_timings = extract_test_file_timings(json_results)
    
    # Multiple timed runs to get average
    print(f"\nPerforming {num_runs} timed runs...")
    run_times = []
    for i in range(num_runs):
        print(f"\nRun {i+1}/{num_runs}:")
        duration = run_tests_timed()
        run_times.append(duration)
    
    # Calculate statistics
    avg_time = sum(run_times) / len(run_times)
    min_time = min(run_times)
    max_time = max(run_times)
    
    # Extract summary from JSON results
    summary = {
        'total_test_files': json_results.get('numTotalTestSuites', 0),
        'total_tests': json_results.get('numTotalTests', 0),
        'passed_tests': json_results.get('numPassedTests', 0),
        'failed_tests': json_results.get('numFailedTests', 0),
    }
    
    # Compile results
    results = {
        'measurement_date': datetime.now().isoformat(),
        'num_runs': num_runs,
        'timing': {
            'average_seconds': round(avg_time, 2),
            'min_seconds': round(min_time, 2),
            'max_seconds': round(max_time, 2),
            'all_runs': [round(t, 2) for t in run_times]
        },
        'summary': summary,
        'test_file_timings': test_file_timings,
        'slowest_10_files': test_file_timings[:10],
        'vitest_config': {
            'environment': 'jsdom',
            'pool': 'default',
            'isolate': 'default',
            'globals': True
        }
    }
    
    return results


def generate_analysis_report(results: Dict[str, Any], output_path: Path) -> None:
    """Generate markdown analysis report."""
    report_path = output_path.parent / 'test-performance-analysis.md'
    
    timing = results['timing']
    summary = results['summary']
    slowest = results['slowest_10_files']
    
    report = f"""# Test Performance Analysis

**Generated:** {results['measurement_date']}  
**Test Runs:** {results['num_runs']}

## Summary

- **Total Test Files:** {summary['total_test_files']}
- **Total Tests:** {summary['total_tests']}
- **Passed:** {summary['passed_tests']}
- **Failed:** {summary['failed_tests']}

## Timing Results

- **Average Duration:** {timing['average_seconds']}s
- **Min Duration:** {timing['min_seconds']}s
- **Max Duration:** {timing['max_seconds']}s
- **All Runs:** {', '.join(f"{t}s" for t in timing['all_runs'])}

## Slowest 10 Test Files

| File | Duration (s) | Tests | Avg/Test (s) |
|------|--------------|-------|--------------|
"""
    
    for file_info in slowest:
        file_name = file_info['file'].split('/')[-1]
        report += f"| {file_name} | {file_info['duration_seconds']} | {file_info['test_count']} | {file_info['avg_test_duration']} |\n"
    
    report += f"""

## Current Configuration

- **Environment:** {results['vitest_config']['environment']}
- **Pool:** {results['vitest_config']['pool']}
- **Isolate:** {results['vitest_config']['isolate']}
- **Globals:** {results['vitest_config']['globals']}

## Observations

### Performance Characteristics

1. **Total Suite Duration:** ~{timing['average_seconds']}s for {summary['total_tests']} tests
2. **Average Test Speed:** ~{round(timing['average_seconds'] / summary['total_tests'] * 1000, 1)}ms per test
3. **File Count:** {summary['total_test_files']} test files

### Bottlenecks to Investigate

"""
    
    # Identify potential bottlenecks
    slow_threshold = 1.0  # Files taking more than 1 second
    slow_files = [f for f in results['test_file_timings'] if f['duration_seconds'] > slow_threshold]
    
    if slow_files:
        report += f"**{len(slow_files)} files take longer than {slow_threshold}s:**\n\n"
        for file_info in slow_files[:5]:
            report += f"- `{file_info['file'].split('/')[-1]}` - {file_info['duration_seconds']}s ({file_info['test_count']} tests)\n"
    
    report += """

### Potential Optimization Areas

1. **Component Rendering Tests:** Many component tests may be rendering full components unnecessarily
2. **Test Isolation:** Each test file may be creating fresh environments
3. **Import Time:** Large imports (e.g., story data, word lists) may slow down test startup
4. **Setup/Teardown:** Mock setup and cleanup may be inefficient

## Next Steps

1. Analyze test implementation patterns (Task 25.2)
2. Research Vitest optimization strategies (Task 25.3)
3. Create specific optimization recommendations (Task 25.4)

---

*This is a baseline measurement. After optimizations, re-run this script to measure improvements.*
"""
    
    print(f"\nWriting analysis report to: {report_path}")
    report_path.write_text(report)


def main():
    parser = argparse.ArgumentParser(description='Measure test performance')
    parser.add_argument('--runs', type=int, default=3, help='Number of test runs (default: 3)')
    parser.add_argument('--output', type=str, default='reports/test-performance-baseline.json',
                        help='Output JSON file path')
    
    args = parser.parse_args()
    
    # Ensure we're in the project root
    project_root = Path(__file__).parent.parent
    output_path = project_root / args.output
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    try:
        # Measure performance
        results = measure_test_performance(num_runs=args.runs)
        
        # Save results
        print(f"\nSaving results to: {output_path}")
        with open(output_path, 'w') as f:
            json.dump(results, f, indent=2)
        
        # Generate analysis report
        generate_analysis_report(results, output_path)
        
        print(f"\n{'='*60}")
        print("✅ Test performance measurement complete!")
        print(f"{'='*60}")
        print(f"\nResults saved to:")
        print(f"  - {output_path}")
        print(f"  - {output_path.parent / 'test-performance-analysis.md'}")
        
    except Exception as e:
        print(f"\n❌ Error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main()
