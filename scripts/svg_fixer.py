#!/usr/bin/env python3
"""
SVG Fixer Script
Checks and fixes SVG files for invalid characters and validates their structure.
"""

import os
import sys
import re
from pathlib import Path
from typing import List, Tuple, Dict
import xml.etree.ElementTree as ET
from collections import defaultdict

try:
    from lxml import etree
    LXML_AVAILABLE = True
except ImportError:
    LXML_AVAILABLE = False
    print("Warning: lxml not available. Install with: pip install lxml")
    print("Continuing with basic validation only...\n")


class SVGIssue:
    """Represents an issue found in an SVG file."""
    def __init__(self, severity: str, issue_type: str, description: str, line_num: int = None):
        self.severity = severity  # 'error', 'warning', 'info'
        self.issue_type = issue_type
        self.description = description
        self.line_num = line_num
    
    def __str__(self):
        line_info = f" (line {self.line_num})" if self.line_num else ""
        return f"[{self.severity.upper()}] {self.issue_type}: {self.description}{line_info}"


class SVGFixer:
    """Checks and fixes SVG files."""
    
    # Common problematic characters and their replacements
    CHAR_REPLACEMENTS = {
        '\ufffd': '?',  # Replacement character
        '\u00bf': '¿',  # Inverted question mark (ensure it's correct)
        '\u00a1': '¡',  # Inverted exclamation mark (ensure it's correct)
        '\x00': '',     # Null character
        '\x01': '',     # Start of heading
        '\x02': '',     # Start of text
        '\x03': '',     # End of text
        '\x04': '',     # End of transmission
        '\x05': '',     # Enquiry
        '\x06': '',     # Acknowledge
        '\x07': '',     # Bell
        '\x08': '',     # Backspace
        '\x0b': '',     # Vertical tab
        '\x0c': '',     # Form feed
        '\x0e': '',     # Shift out
        '\x0f': '',     # Shift in
    }
    
    def __init__(self, svg_dir: str, fix: bool = False, verbose: bool = False):
        self.svg_dir = Path(svg_dir)
        self.fix = fix
        self.verbose = verbose
        self.results = defaultdict(list)  # filename -> [SVGIssue]
    
    def find_svg_files(self) -> List[Path]:
        """Find all SVG files in the directory recursively."""
        svg_files = list(self.svg_dir.rglob("*.svg"))
        print(f"Found {len(svg_files)} SVG files\n")
        return svg_files
    
    def check_invalid_chars(self, content: str, filename: str) -> List[SVGIssue]:
        """Check for invalid or problematic characters."""
        issues = []
        lines = content.split('\n')
        
        for line_num, line in enumerate(lines, 1):
            # Check for replacement character
            if '\ufffd' in line:
                issues.append(SVGIssue(
                    'error',
                    'Invalid Character',
                    f'Found replacement character (�) - indicates encoding issue: "{line.strip()}"',
                    line_num
                ))
            
            # Check for null bytes and other control characters
            for char_code in range(0x20):
                if char_code in [0x09, 0x0a, 0x0d]:  # Allow tab, newline, carriage return
                    continue
                if chr(char_code) in line:
                    issues.append(SVGIssue(
                        'error',
                        'Control Character',
                        f'Found control character (code {char_code}) in line',
                        line_num
                    ))
            
            # Check for common encoding issues in Spanish text
            if '�' in line:
                # Try to identify what it should be based on context
                context = line.strip()
                suggestion = ""
                if context.startswith('�'):
                    suggestion = " (likely should be '¡')"
                elif context.endswith('�'):
                    suggestion = " (likely should be '¿')"
                
                issues.append(SVGIssue(
                    'error',
                    'Encoding Issue',
                    f'Found � character{suggestion}: "{context}"',
                    line_num
                ))
            
            # Check for unescaped special XML characters in attribute values
            if 'aria-label=' in line or 'title=' in line:
                # Extract attribute value
                match = re.search(r'(?:aria-label|title)="([^"]*)"', line)
                if match:
                    attr_value = match.group(1)
                    # Check for unescaped & that's not part of an entity
                    if '&' in attr_value and not re.search(r'&(?:amp|lt|gt|quot|apos|#\d+|#x[0-9a-fA-F]+);', attr_value):
                        issues.append(SVGIssue(
                            'warning',
                            'Unescaped Character',
                            f'Unescaped & in attribute: "{attr_value}"',
                            line_num
                        ))
        
        return issues
    
    def validate_xml_structure(self, filepath: Path) -> List[SVGIssue]:
        """Validate XML/SVG structure."""
        issues = []
        
        # Try with lxml first (more strict)
        if LXML_AVAILABLE:
            try:
                parser = etree.XMLParser(recover=False, encoding='utf-8')
                with open(filepath, 'rb') as f:
                    etree.parse(f, parser)
            except etree.XMLSyntaxError as e:
                issues.append(SVGIssue(
                    'error',
                    'XML Syntax Error',
                    str(e),
                    e.lineno if hasattr(e, 'lineno') else None
                ))
            except Exception as e:
                issues.append(SVGIssue(
                    'error',
                    'Parse Error',
                    f'{type(e).__name__}: {str(e)}'
                ))
        
        # Fallback to standard library
        try:
            ET.parse(filepath)
        except ET.ParseError as e:
            issues.append(SVGIssue(
                'error',
                'XML Parse Error',
                f'{str(e)}'
            ))
        except Exception as e:
            issues.append(SVGIssue(
                'error',
                'File Error',
                f'{type(e).__name__}: {str(e)}'
            ))
        
        return issues
    
    def check_svg_structure(self, filepath: Path) -> List[SVGIssue]:
        """Check SVG-specific structure requirements."""
        issues = []
        
        try:
            tree = ET.parse(filepath)
            root = tree.getroot()
            
            # Check if root is svg element
            if not root.tag.endswith('svg'):
                issues.append(SVGIssue(
                    'error',
                    'Invalid Root',
                    f'Root element should be <svg>, found {root.tag}'
                ))
            
            # Check for xmlns attribute
            if 'xmlns' not in root.attrib and '{http://www.w3.org/2000/svg}' not in root.tag:
                issues.append(SVGIssue(
                    'warning',
                    'Missing Namespace',
                    'SVG missing xmlns="http://www.w3.org/2000/svg" attribute'
                ))
            
            # Check for viewBox or width/height
            if 'viewBox' not in root.attrib and ('width' not in root.attrib or 'height' not in root.attrib):
                issues.append(SVGIssue(
                    'warning',
                    'Missing Dimensions',
                    'SVG missing both viewBox and width/height attributes'
                ))
        
        except Exception as e:
            # If we can't parse, the XML validation will catch it
            pass
        
        return issues
    
    def fix_content(self, content: str, filename: str) -> Tuple[str, List[str]]:
        """Fix common issues in SVG content."""
        fixes_applied = []
        original = content
        
        # Fix replacement character in Spanish context
        if '�Hola' in content or '�Qu' in content or '�C' in content:
            content = content.replace('�H', '¡H').replace('�Q', '¿Q').replace('�C', '¿C')
            fixes_applied.append("Replaced � with ¡ or ¿ based on Spanish context")
        
        # Replace other problematic characters
        for bad_char, replacement in self.CHAR_REPLACEMENTS.items():
            if bad_char in content:
                content = content.replace(bad_char, replacement)
                char_name = repr(bad_char)
                fixes_applied.append(f"Replaced {char_name} with '{replacement}'")
        
        # Fix encoding declaration if missing
        if '<?xml' not in content:
            content = '<?xml version="1.0" encoding="UTF-8"?>\n' + content
            fixes_applied.append("Added XML declaration with UTF-8 encoding")
        elif 'encoding=' not in content.split('\n')[0]:
            content = content.replace('<?xml version="1.0"?>', 
                                     '<?xml version="1.0" encoding="UTF-8"?>', 1)
            fixes_applied.append("Added UTF-8 encoding to XML declaration")
        
        # Ensure proper line endings
        if '\r\n' in content:
            content = content.replace('\r\n', '\n')
            fixes_applied.append("Normalized line endings to LF")
        
        return content, fixes_applied
    
    def process_file(self, filepath: Path):
        """Process a single SVG file."""
        filename = str(filepath.relative_to(self.svg_dir))
        issues = []
        
        # Read file
        try:
            with open(filepath, 'r', encoding='utf-8', errors='replace') as f:
                content = f.read()
        except Exception as e:
            issues.append(SVGIssue('error', 'File Read Error', str(e)))
            self.results[filename] = issues
            return
        
        # Check for invalid characters
        issues.extend(self.check_invalid_chars(content, filename))
        
        # Validate XML structure
        issues.extend(self.validate_xml_structure(filepath))
        
        # Check SVG structure
        issues.extend(self.check_svg_structure(filepath))
        
        # Apply fixes if requested
        if self.fix and issues:
            fixed_content, fixes_applied = self.fix_content(content, filename)
            
            if fixed_content != content:
                try:
                    with open(filepath, 'w', encoding='utf-8') as f:
                        f.write(fixed_content)
                    
                    for fix in fixes_applied:
                        issues.append(SVGIssue('info', 'Fixed', fix))
                    
                    print(f"✓ Fixed: {filename}")
                    if self.verbose:
                        for fix in fixes_applied:
                            print(f"  - {fix}")
                
                except Exception as e:
                    issues.append(SVGIssue('error', 'Fix Failed', str(e)))
        
        self.results[filename] = issues
    
    def run(self):
        """Run the SVG checker/fixer."""
        print(f"SVG Checker/Fixer")
        print(f"=" * 60)
        print(f"Directory: {self.svg_dir}")
        print(f"Mode: {'FIX' if self.fix else 'CHECK ONLY'}")
        print(f"=" * 60)
        print()
        
        svg_files = self.find_svg_files()
        
        if not svg_files:
            print("No SVG files found!")
            return
        
        # Process all files
        for svg_file in svg_files:
            self.process_file(svg_file)
        
        # Generate report
        self.print_report()
    
    def print_report(self):
        """Print a summary report."""
        print("\n" + "=" * 60)
        print("REPORT")
        print("=" * 60 + "\n")
        
        # Count issues by severity
        error_count = 0
        warning_count = 0
        info_count = 0
        files_with_issues = 0
        
        for filename, issues in sorted(self.results.items()):
            if issues:
                files_with_issues += 1
                print(f"\n{filename}:")
                for issue in issues:
                    if issue.severity == 'error':
                        error_count += 1
                    elif issue.severity == 'warning':
                        warning_count += 1
                    elif issue.severity == 'info':
                        info_count += 1
                    print(f"  {issue}")
        
        # Summary
        print("\n" + "=" * 60)
        print("SUMMARY")
        print("=" * 60)
        print(f"Total files checked: {len(self.results)}")
        print(f"Files with issues: {files_with_issues}")
        print(f"Errors: {error_count}")
        print(f"Warnings: {warning_count}")
        if self.fix:
            print(f"Fixes applied: {info_count}")
        print()
        
        if error_count > 0:
            print("⚠️  Found errors that need attention!")
            return 1
        elif warning_count > 0:
            print("⚠️  Found warnings - consider reviewing")
            return 0
        else:
            print("✓ All SVG files look good!")
            return 0


def main():
    import argparse
    
    parser = argparse.ArgumentParser(
        description='Check and fix SVG files for invalid characters and structure issues'
    )
    parser.add_argument(
        'directory',
        nargs='?',
        default='svelte/static/peppa_advanced_spanish_images/svg',
        help='Directory containing SVG files (default: svelte/static/peppa_advanced_spanish_images/svg)'
    )
    parser.add_argument(
        '--fix',
        action='store_true',
        help='Automatically fix issues where possible'
    )
    parser.add_argument(
        '-v', '--verbose',
        action='store_true',
        help='Verbose output'
    )
    parser.add_argument(
        '--install-deps',
        action='store_true',
        help='Install required dependencies (lxml)'
    )
    
    args = parser.parse_args()
    
    # Install dependencies if requested
    if args.install_deps:
        import subprocess
        print("Installing dependencies...")
        subprocess.check_call([sys.executable, '-m', 'pip', 'install', 'lxml'])
        print("Dependencies installed!\n")
        return 0
    
    # Get project root (assuming script is in scripts/ folder)
    script_dir = Path(__file__).parent
    project_root = script_dir.parent
    svg_dir = project_root / args.directory
    
    if not svg_dir.exists():
        print(f"Error: Directory not found: {svg_dir}")
        return 1
    
    # Run the fixer
    fixer = SVGFixer(svg_dir, fix=args.fix, verbose=args.verbose)
    return fixer.run()


if __name__ == '__main__':
    sys.exit(main())
