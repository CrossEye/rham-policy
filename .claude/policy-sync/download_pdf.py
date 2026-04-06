"""
download_pdf.py

Downloads a single PDF from the RHAM website given its URL.
No Playwright needed — the file URLs work with a simple HTTP request.

Usage:
  python .claude/policy-sync/download_pdf.py <url> <output_path>

Example:
  python .claude/policy-sync/download_pdf.py \
    "https://www.rhamschools.org/common/pages/GetFile.ashx?key=06ZSBn5f" \
    "pdfs/9314 - Board Meeting Conduct.pdf"
"""

import sys
import urllib.request
import os


def download_pdf(url, output_path):
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/pdf,*/*',
        'Referer': 'https://www.rhamschools.org/b_o_e/board_of_education_policies',
    }
    req = urllib.request.Request(url, headers=headers)
    os.makedirs(os.path.dirname(output_path) if os.path.dirname(output_path) else '.', exist_ok=True)
    with urllib.request.urlopen(req, timeout=30) as response:
        with open(output_path, 'wb') as f:
            f.write(response.read())
    size_kb = os.path.getsize(output_path) // 1024
    print(f"Downloaded ({size_kb} KB): {output_path}")


if __name__ == '__main__':
    if len(sys.argv) != 3:
        print('Usage: python download_pdf.py <url> <output_path>')
        sys.exit(1)
    download_pdf(sys.argv[1], sys.argv[2])
