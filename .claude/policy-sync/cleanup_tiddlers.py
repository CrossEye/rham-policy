"""
cleanup_tiddlers.py

Removes all tiddler files for a given policy number.
Handles all variants: Policy1234.tid, Policy1234(s1).tid, Policy1234(legal).tid, etc.

Usage:
  python .claude/policy-sync/cleanup_tiddlers.py <policy_number> [--dry-run]

Examples:
  python .claude/policy-sync/cleanup_tiddlers.py 9314
  python .claude/policy-sync/cleanup_tiddlers.py 6141.32
  python .claude/policy-sync/cleanup_tiddlers.py 6146a --dry-run
"""

import sys
import os
import glob


def cleanup_policy(policy_number, tiddlers_dir='tiddlers', dry_run=False):
    """Find and remove all .tid files for the given policy number."""
    pattern = os.path.join(tiddlers_dir, f'Policy{policy_number}*.tid')
    files = sorted(glob.glob(pattern))

    if not files:
        print(f'No tiddler files found matching: Policy{policy_number}*.tid')
        return []

    print(f"{'Would remove' if dry_run else 'Removing'} {len(files)} file(s) for Policy{policy_number}:")
    for f in files:
        print(f"  {os.path.basename(f)}")
        if not dry_run:
            os.remove(f)

    return files


def main():
    if len(sys.argv) < 2:
        print('Usage: python cleanup_tiddlers.py <policy_number> [--dry-run]')
        print('Example: python cleanup_tiddlers.py 9314')
        sys.exit(1)

    policy_number = sys.argv[1]
    dry_run = '--dry-run' in sys.argv

    removed = cleanup_policy(policy_number, dry_run=dry_run)

    if removed and not dry_run:
        print(f'\nDone. Removed {len(removed)} file(s).')
    elif not removed:
        sys.exit(1)


if __name__ == '__main__':
    main()
