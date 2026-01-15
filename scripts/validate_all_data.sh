#!/bin/bash
#
# Comprehensive Data Validation Script
# 
# This script runs all V4 data validation scripts to ensure data integrity
# across stories, vocabulary, frequency data, and manifest files.
#
# Usage:
#   ./scripts/validate_all_data.sh
#
# Output:
#   - Console output showing test results
#   - Detailed reports in reports/ directory
#
# Exit codes:
#   0 - All validations passed
#   1 - One or more validations failed
#

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Espanjapeli V4 Data Validation${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check if Python is available
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}Error: python3 is not installed${NC}"
    exit 1
fi

# Check if pytest is available
if ! python3 -c "import pytest" &> /dev/null; then
    echo -e "${YELLOW}Warning: pytest not found, installing...${NC}"
    pip install pytest
fi

# Create reports directory if it doesn't exist
mkdir -p "$PROJECT_ROOT/reports"

# Track overall success
ALL_PASSED=true

# Function to run a validation script
run_validation() {
    local script_name=$1
    local description=$2
    
    echo ""
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}Running: $description${NC}"
    echo -e "${BLUE}========================================${NC}"
    
    if python3 "$SCRIPT_DIR/$script_name"; then
        echo -e "${GREEN}✓ $description passed${NC}"
    else
        echo -e "${RED}✗ $description failed${NC}"
        ALL_PASSED=false
    fi
}

# Run all validation scripts
run_validation "test_story_data_integrity.py" "Story Data Integrity Tests"
run_validation "validate_manifest.py" "Manifest Validation"
run_validation "validate_frequency_data.py" "Frequency Data Validation"
run_validation "validate_vocabulary_database.py" "Vocabulary Database Validation"

# Optional: Run cross-reference validation if script exists
if [ -f "$SCRIPT_DIR/validate_story_vocabulary_crossref.py" ]; then
    run_validation "validate_story_vocabulary_crossref.py" "Story-Vocabulary Cross-Reference"
fi

# Generate comprehensive report if script exists
if [ -f "$SCRIPT_DIR/generate_data_consistency_report.py" ]; then
    echo ""
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}Generating Comprehensive Report${NC}"
    echo -e "${BLUE}========================================${NC}"
    
    if python3 "$SCRIPT_DIR/generate_data_consistency_report.py"; then
        echo -e "${GREEN}✓ Comprehensive report generated${NC}"
    else
        echo -e "${YELLOW}⚠ Could not generate comprehensive report${NC}"
    fi
fi

# Summary
echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Validation Summary${NC}"
echo -e "${BLUE}========================================${NC}"

if [ "$ALL_PASSED" = true ]; then
    echo -e "${GREEN}✓ All validations passed!${NC}"
    echo ""
    echo "Reports generated in: $PROJECT_ROOT/reports/"
    echo ""
    echo "Available reports:"
    ls -1 "$PROJECT_ROOT/reports/"*validation*.txt "$PROJECT_ROOT/reports/"*consistency*.md 2>/dev/null || echo "  (no reports found)"
    exit 0
else
    echo -e "${RED}✗ Some validations failed${NC}"
    echo ""
    echo "Check the reports in: $PROJECT_ROOT/reports/"
    echo ""
    echo "Available reports:"
    ls -1 "$PROJECT_ROOT/reports/"*validation*.txt "$PROJECT_ROOT/reports/"*consistency*.md 2>/dev/null || echo "  (no reports found)"
    exit 1
fi
