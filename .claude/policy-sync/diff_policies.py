"""
diff_policies.py

Compares two RHAM policy JSON snapshots and reports what was added, deleted,
or modified (URL changed = PDF was replaced on the server).

Usage:
  python .claude/policy-sync/diff_policies.py                      # auto-finds two most recent
  python .claude/policy-sync/diff_policies.py <new.json>           # diffs most-recent vs new
  python .claude/policy-sync/diff_policies.py <old.json> <new.json>

Output:
  Human-readable report to stdout.
  JSON report saved to RawData/diff_report_YYYY-MM-DD.json
  Final line: OUTPUT_FILE:<path>
"""

import json
import sys
import glob
import os
import datetime


def find_json_files(rawdata_dir='RawData'):
    files = sorted(glob.glob(os.path.join(rawdata_dir, 'Policies_*.json')))
    return files


def load_policies(path):
    with open(path) as f:
        data = json.load(f)
    return {p['number']: p for p in data if p.get('number')}


def diff_policies(baseline_path, current_path):
    baseline = load_policies(baseline_path)
    current = load_policies(current_path)

    added = []
    deleted = []
    modified = []
    unchanged = []

    for num, policy in current.items():
        if num not in baseline:
            added.append(policy)
        elif policy['url'] != baseline[num]['url']:
            modified.append({
                'number': num,
                'name': policy['name'],
                'old_name': baseline[num]['name'],
                'old_url': baseline[num]['url'],
                'new_url': policy['url'],
                'url_changed': True,
                'name_changed': policy['name'] != baseline[num]['name'],
            })
        elif policy['name'] != baseline[num]['name']:
            modified.append({
                'number': num,
                'name': policy['name'],
                'old_name': baseline[num]['name'],
                'old_url': baseline[num]['url'],
                'new_url': policy['url'],
                'url_changed': False,
                'name_changed': True,
            })
        else:
            unchanged.append(policy)

    for num, policy in baseline.items():
        if num not in current:
            deleted.append(policy)

    return {
        'baseline': baseline_path,
        'current': current_path,
        'added': added,
        'deleted': deleted,
        'modified': modified,
        'unchanged_count': len(unchanged),
    }


def main():
    files = find_json_files()

    if len(sys.argv) == 3:
        baseline_path, current_path = sys.argv[1], sys.argv[2]
    elif len(sys.argv) == 2:
        if not files:
            print('ERROR: No baseline JSON found in RawData/')
            sys.exit(1)
        baseline_path = files[-1]
        current_path = sys.argv[1]
    else:
        if len(files) < 2:
            print('ERROR: Need at least 2 Policies_*.json files in RawData/, or provide paths as arguments.')
            sys.exit(1)
        baseline_path, current_path = files[-2], files[-1]

    result = diff_policies(baseline_path, current_path)

    print(f"Baseline: {result['baseline']}")
    print(f"Current:  {result['current']}")
    print()

    print(f"ADDED ({len(result['added'])}):")
    for p in result['added']:
        print(f"  {p['number']} - {p['name']}")
        print(f"    url: {p['url']}")

    print()
    print(f"DELETED ({len(result['deleted'])}):")
    for p in result['deleted']:
        print(f"  {p['number']} - {p['name']}")

    print()
    print(f"MODIFIED ({len(result['modified'])}):")
    for m in result['modified']:
        changes = []
        if m['url_changed']:
            changes.append('PDF replaced')
        if m['name_changed']:
            changes.append(f"renamed: '{m['old_name']}' → '{m['name']}'")
        print(f"  {m['number']} - {m['name']} ({', '.join(changes)})")
        if m['url_changed']:
            print(f"    new url: {m['new_url']}")

    print()
    print(f"UNCHANGED: {result['unchanged_count']}")

    # Save JSON report (without unchanged list to keep it small)
    today = datetime.date.today().isoformat()
    report_path = os.path.join('RawData', f'diff_report_{today}.json')
    with open(report_path, 'w') as f:
        json.dump(result, f, indent=2)

    print(f"\nReport saved to: {report_path}")
    print(f"OUTPUT_FILE:{report_path}")

    # Exit code: 0 if no changes, 1 if changes exist
    has_changes = result['added'] or result['deleted'] or result['modified']
    sys.exit(0 if not has_changes else 1)


if __name__ == '__main__':
    main()
