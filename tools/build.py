#!/usr/bin/env python3
"""Atomically publish a self-contained offline HTML before packing anything else."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
import subprocess
import json
ROOT=Path(__file__).resolve().parents[1]
SRC=ROOT/'src'
for name in ['data.js','core.js','scene.js','ui.js','world.js']:
    subprocess.run(['node','--check',str(SRC/name)],check=True,capture_output=True)
html=(SRC/'template.html').read_text()
for marker,file in [('STYLE','style.css'),('WORLD_STYLE','world.css'),('ENGINE','vendor/three.min.js'),('DATA','data.js'),('CORE','core.js'),('SCENE','scene.js'),('UI','ui.js'),('WORLD','world.js')]:
    text=(SRC/file).read_text()
    if marker!='STYLE': text=text.replace('</script','<\\/script')
    html=html.replace('/* '+marker+' */',text)
assert '/* ENGINE */' not in html
assert '<script src=' not in html
assert len(html.encode())<4_000_000
# Never expose a partially written/uncompiled root entry point.
tmp=ROOT/'index.html.tmp';tmp.write_text(html);tmp.replace(ROOT/'index.html')
zip_tmp=ROOT/'Game-playable.zip.tmp'
with ZipFile(zip_tmp,'w',ZIP_DEFLATED,compresslevel=8) as z:
    for name in ['index.html','README.md','DESIGN.md','HANDOFF.md','tests/RESULTS.md','src/vendor/THREE-LICENSE.txt']:
        f=ROOT/name
        if f.exists():z.write(f,name)
zip_tmp.replace(ROOT/'Game-playable.zip')
print(f'Playable HTML published: {len(html.encode()):,} bytes; ZIP: {(ROOT/"Game-playable.zip").stat().st_size:,} bytes')
