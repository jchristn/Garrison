#!/usr/bin/env python3
"""Convert one Azure Functions 2019 native invocation row to the benchmark CSV contract.

Minute aggregates become simultaneous bursts at each selected bin boundary. The
1000 ms default compresses each source minute by 60x; it does not reconstruct
unknown subminute timing. Source/license information belongs in caller provenance.
"""
import argparse
import csv
import hashlib
import io
import json
from pathlib import Path
import re
import sys


def convert(source, row_number, first_minute, minute_count, bin_ms):
    """Validate the native schema and selected counts before producing any output."""
    if not 1 <= row_number <= 10000000:
        raise ValueError('row must be a one-based data row in 1..10000000')
    if not 1 <= first_minute <= 1440 or not 1 <= minute_count <= 1440 or first_minute + minute_count - 1 > 1440:
        raise ValueError('minute window must be nonempty and entirely within 1..1440')
    if not 1 <= bin_ms <= 3600000:
        raise ValueError('bin-ms must be in 1..3600000')
    expected = ['HashOwner', 'HashApp', 'HashFunction', 'Trigger'] + [str(value) for value in range(1, 1441)]
    with source.open(newline='', encoding='utf-8-sig') as handle:
        reader = csv.reader(handle)
        if next(reader, None) != expected:
            raise ValueError('expected the Azure Functions 2019 invocation schema with minutes 1..1440')
        selected = None
        for index, row in enumerate(reader, 1):
            if index == row_number:
                selected = row
                break
    if selected is None:
        raise ValueError('selected data row does not exist in the input')
    if len(selected) != len(expected):
        raise ValueError('selected data row is incomplete or has extra fields')
    counts = []
    for minute in range(first_minute, first_minute + minute_count):
        value = selected[minute + 3]
        if not re.fullmatch(r'[0-9]{1,10}', value):
            raise ValueError('selected counts must be unsigned decimal integers')
        count = int(value)
        if count > 1000000:
            raise ValueError('one bin exceeds the one-million-arrival limit')
        counts.append(count)
    if not 1 <= sum(counts) <= 1000000:
        raise ValueError('selected window must contain 1..1000000 arrivals')
    output = io.StringIO()
    writer = csv.writer(output, lineterminator='\n')
    writer.writerow(['offsetMs', 'count'])
    writer.writerows((index * bin_ms, count) for index, count in enumerate(counts))
    digest = hashlib.sha256()
    with source.open('rb') as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b''):
            digest.update(chunk)
    content = output.getvalue()
    provenance = {'sourceFileSha256': digest.hexdigest(), 'selectedDataRow': row_number,
                  'firstMinute': first_minute, 'minuteCount': minute_count, 'binMs': bin_ms,
                  'sourceMinuteDurationMs': 60000, 'compressionFactor': 60000 / bin_ms,
                  'arrivals': sum(counts), 'derivedCsvSha256': hashlib.sha256(content.encode()).hexdigest(),
                  'timingSemantics': 'Minute aggregate counts become simultaneous bursts at bin boundaries. Unknown subminute timing is not reconstructed.'}
    return content, provenance


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--input', type=Path, required=True)
    parser.add_argument('--output', type=Path, required=True)
    parser.add_argument('--row', type=int, required=True, help='One-based data row, excluding the header')
    parser.add_argument('--first-minute', type=int, required=True)
    parser.add_argument('--minute-count', type=int, required=True)
    parser.add_argument('--bin-ms', type=int, default=1000)
    parser.add_argument('--provenance', type=Path)
    options = parser.parse_args()
    paths = [options.input, options.output] + ([options.provenance] if options.provenance else [])
    if len(set(path.resolve() for path in paths)) != len(paths):
        parser.error('input, output and provenance paths must differ')
    try:
        content, provenance = convert(options.input, options.row, options.first_minute, options.minute_count, options.bin_ms)
        options.output.write_text(content, encoding='utf-8')
        if options.provenance:
            options.provenance.write_text(json.dumps(provenance, indent=2) + '\n', encoding='utf-8')
    except (OSError, ValueError, csv.Error) as error:
        parser.error(str(error))
    print(json.dumps(provenance, indent=2))
    return 0


if __name__ == '__main__':
    sys.exit(main())
