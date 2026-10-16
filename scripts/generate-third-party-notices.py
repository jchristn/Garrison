#!/usr/bin/env python3
"""Generate an application dependency inventory and preserve supplied license/notice texts in a ZIP.
Run after dotnet restore/build and npm ci. No network requests or project changes are made.
"""
import argparse
import importlib.metadata
import json
from pathlib import Path
import re
import subprocess
import xml.etree.ElementTree as ET
import zipfile

ROOT = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser()
parser.add_argument('--artifacts', type=Path, default=ROOT / 'artifacts')
args = parser.parse_args()
rows = []
texts = {}
seen = set()
upstream = ROOT / 'assets/licenses/upstream-license-texts.zip'
upstream_sources = ROOT / 'assets/licenses/upstream-sources.json'
fallbacks = {}
if upstream.exists():
    with zipfile.ZipFile(upstream) as archive:
        for filename in archive.namelist():
            name, version, textname = filename.rsplit('/', 2)
            fallbacks.setdefault((name.lower(), version), []).append((textname, archive.read(filename)))

def record(ecosystem, name, version, license_id, url, files):
    key = (ecosystem, name.lower(), version)
    if key in seen:
        return
    seen.add(key)
    entries = []
    if not files:
        files = fallbacks.get((name.lower(), version), [])
    for filename, content in files:
        path = f'{ecosystem}/{name}/{version}/{Path(filename).name}'
        texts[path] = content
        entries.append(path)
    rows.append(dict(ecosystem=ecosystem, name=name, version=version,
                     license=license_id or 'See upstream license', source=url,
                     texts=sorted(set(entries))))

for project in ['Garrison.Core', 'Garrison.Harnesses', 'Garrison.Server', 'Garrison.Worker', 'Garrison.ProviderHarness']:
    asset = args.artifacts / 'obj' / project / 'project.assets.json'
    if not asset.exists():
        asset = ROOT / 'src' / project / 'obj' / 'project.assets.json'
    data = json.loads(asset.read_text())
    for key, lib in data['libraries'].items():
        if lib.get('type') != 'package':
            continue
        name, version = key.rsplit('/', 1)
        package = next((Path(p) / lib['path'] for p in data['packageFolders'] if (Path(p) / lib['path']).is_dir()), None)
        if package is None:
            raise SystemExit(f'Missing restored package: {key}')
        spec = ET.parse(next(package.glob('*.nuspec'))).getroot()
        metadata = next(e for e in spec if e.tag.split('}')[-1] == 'metadata')
        fields = {e.tag.split('}')[-1]: e for e in metadata}
        license_id = fields['license'].text if 'license' in fields else None
        url = fields['projectUrl'].text if 'projectUrl' in fields else f'https://www.nuget.org/packages/{name}/{version}'
        files = []
        archives = list(package.glob('*.nupkg'))
        if archives:
            with zipfile.ZipFile(archives[0]) as archive:
                for filename in archive.namelist():
                    if re.search(r'(^|/)(licen[cs]e|notice|third.party.notices)([._-]|$)', filename, re.I):
                        files.append((filename, archive.read(filename)))
        record('nuget', name, version, license_id, url, files)

for project in [ROOT / 'dashboard', ROOT / 'sdk/js']:
    lock = json.loads((project / 'package-lock.json').read_text())
    for location, metadata in lock.get('packages', {}).items():
        if not location or metadata.get('dev'):
            continue
        package = project / location
        info = json.loads((package / 'package.json').read_text())
        files = [(p.name, p.read_bytes()) for p in package.iterdir()
                 if p.is_file() and re.match(r'(licen[cs]e|notice|copying)([._-]|$)', p.name, re.I)]
        record('npm', info['name'], info['version'], info.get('license'), info.get('homepage', metadata.get('resolved')), files)

# The Python SDK runtime dependencies are resolved from the environment used for its harness.
for name in ['requests', 'urllib3', 'charset-normalizer', 'idna', 'certifi']:
    dist = importlib.metadata.distribution(name)
    files = [(str(p), Path(dist.locate_file(p)).read_bytes()) for p in dist.files or []
             if re.search(r'(^|/)(licen[cs]e|notice|copying)([._-]|$)', str(p), re.I)]
    record('python', dist.metadata['Name'], dist.version,
           dist.metadata.get('License-Expression') or dist.metadata.get('License'),
           dist.metadata.get('Home-page') or 'https://pypi.org/project/' + name, files)

output = subprocess.check_output(['go', 'list', '-m', '-json', 'all'], cwd=ROOT / 'sdk/go', text=True)
decoder = json.JSONDecoder()
while output.strip():
    item, end = decoder.raw_decode(output.lstrip())
    output = output.lstrip()[end:]
    if item.get('Main'):
        continue
    directory = Path(item['Dir'])
    files = [(p.name, p.read_bytes()) for p in directory.iterdir()
             if p.is_file() and re.match(r'(licen[cs]e|notice|patents)([._-]|$)', p.name, re.I)]
    record('go', item['Path'], item['Version'], 'See bundled license', 'https://' + item['Path'], files)

rows.sort(key=lambda item: (item['ecosystem'], item['name'].lower(), item['version']))
archive = ROOT / 'assets/licenses/third-party-licenses.zip'
with zipfile.ZipFile(archive, 'w', zipfile.ZIP_DEFLATED) as target:
    for filename, content in sorted(texts.items()):
        info = zipfile.ZipInfo(filename, date_time=(2020, 1, 1, 0, 0, 0))
        target.writestr(info, content, compress_type=zipfile.ZIP_DEFLATED)
(ROOT / 'assets/licenses/dependencies.json').write_text(json.dumps(rows, indent=2) + '\n')
lines = ['# Third-party notices', '',
         'Garrison is licensed under the MIT license in LICENSE.md. Its application dependencies retain their own licenses and copyrights.', '',
         'Unmodified license and notice files supplied by restored packages are preserved in [the license archive](assets/licenses/third-party-licenses.zip). The [machine-readable inventory](assets/licenses/dependencies.json) identifies the exact resolved versions and archive paths. For packages without a supplied license file, the archive includes upstream texts with source URLs and SHA-256 hashes in [the provenance manifest](assets/licenses/upstream-sources.json). AWS texts use the current upstream branch because the packages do not record a source commit.', '',
         'This inventory covers the .NET application, browser runtime bundles, and Python/Go SDK runtime dependencies. JavaScript SDK runtime has no external dependencies. Build/test tools, the operating system, .NET/Node/Python/Go runtimes, and optional external services retain their own distribution notices. Container base images and harness CLIs must be reviewed separately when images are distributed.', '',
         'Regenerate with `python3 scripts/generate-third-party-notices.py --artifacts <dotnet-artifacts-directory>` after restoring dependencies. Python versions reflect the harness environment because the SDK declares a supported range rather than a lockfile.', '',
         '| Ecosystem | Package | Version | License | Bundled texts |', '|---|---|---|---|---|']
for row in rows:
    license_id = str(row['license']).splitlines()[0].replace('|', '/')
    lines.append(f"| {row['ecosystem']} | [{row['name']}]({row['source']}) | {row['version']} | {license_id} | {len(row['texts'])} |")
(ROOT / 'THIRD_PARTY_NOTICES.md').write_text('\n'.join(lines) + '\n')
# Ship browser runtime notices with the independently built dashboard image.
public = ROOT / 'dashboard/public'
with zipfile.ZipFile(public / 'third-party-licenses.zip', 'w', zipfile.ZIP_DEFLATED) as target:
    for filename, content in sorted(texts.items()):
        if filename.startswith('npm/'):
            info = zipfile.ZipInfo(filename, date_time=(2020, 1, 1, 0, 0, 0))
            target.writestr(info, content, compress_type=zipfile.ZIP_DEFLATED)
browser = ['Garrison browser runtime dependency notices', '',
           'Unmodified license texts are in third-party-licenses.zip beside this file.', '']
for row in rows:
    if row['ecosystem'] == 'npm':
        browser.append(row['name'] + ' ' + row['version'] + ': ' + str(row['license']))
(public / 'third-party-notices.txt').write_text('\n'.join(browser) + '\n')
print(f'Inventoried {len(rows)} packages; preserved {len(texts)} supplied license/notice files.')
missing = [r for r in rows if not r['texts']]
print(f'{len(missing)} packages rely on upstream license expressions/links rather than a bundled text.')

if missing:
    raise SystemExit("Missing license texts; add reviewed upstream sources before distribution.")
