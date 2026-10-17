#!/usr/bin/env python3
"""Atomically publish a self-contained offline HTML before packing anything else."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
import subprocess
import json
import base64
ROOT=Path(__file__).resolve().parents[1]
SRC=ROOT/'src'
for name in ['data.js','core.js','scene.js','ui.js','world.js','store.js','realism.js']:
    subprocess.run(['node','--check',str(SRC/name)],check=True,capture_output=True)
html=(SRC/'template.html').read_text()
assets={'models':{},'textures':{}}
for p in sorted((SRC/'assets'/'models').glob('*.glb')):
    assets['models'][p.stem]=base64.b64encode(p.read_bytes()).decode()
for p in sorted((SRC/'assets'/'textures').glob('*')):
    if p.suffix.lower() not in ['.jpg','.jpeg','.png']:continue
    mime='image/png' if p.suffix.lower()=='.png' else 'image/jpeg'
    assets['textures'][p.stem]='data:'+mime+';base64,'+base64.b64encode(p.read_bytes()).decode()
credits='/* Offline hand assets, MIT license:\n'+(SRC/'assets'/'WEBXR-HANDS-LICENSE.txt').read_text()+'\nPoly Haven furniture and materials: CC0-1.0. See assets/manifest.json. */\n'
html=html.replace('/* ROOM_ASSETS */',credits+'const OFFLINE_ROOM='+json.dumps(assets,separators=(',',':'))+';')
for marker,file in [('STYLE','style.css'),('WORLD_STYLE','world.css'),('REALISM_STYLE','realism.css'),('ROOM_TOOLS','vendor/room-tools.min.js'),('ENGINE','vendor/three.min.js'),('DATA','data.js'),('CORE','core.js'),('SCENE','scene.js'),('UI','ui.js'),('WORLD','world.js'),('STORE','store.js'),('REALISM','realism.js')]:
    text=(SRC/file).read_text()
    if marker!='STYLE': text=text.replace('</script','<\\/script')
    html=html.replace('/* '+marker+' */',text)
assert '/* ENGINE */' not in html
assert '<script src=' not in html
assert len(html.encode())<20_000_000
# Never expose a partially written/uncompiled root entry point.
tmp=ROOT/'index.html.tmp';tmp.write_text(html);tmp.replace(ROOT/'index.html')
# A separate self-contained entry opens the sample immediately, without touching the saved run.
sample=html.replace('</body>',"<script>ROOM_READY.then(function(){if(R.ready)roomStartSample();});</script></body>")
sample_tmp=ROOT/'写实房间样片.html.tmp';sample_tmp.write_text(sample);sample_tmp.replace(ROOT/'写实房间样片.html')
zip_tmp=ROOT/'Game-playable.zip.tmp'
with ZipFile(zip_tmp,'w',ZIP_DEFLATED,compresslevel=8) as z:
    names=['index.html','写实房间样片.html','README.md','DESIGN.md','HANDOFF.md','tests/RESULTS.md','tools/build.py']
    names += [str(p.relative_to(ROOT)) for p in sorted(SRC.rglob('*')) if p.is_file()]
    names += [str(p.relative_to(ROOT)) for p in sorted((ROOT/'tests').glob('*.cjs'))]
    for name in dict.fromkeys(names):
        f=ROOT/name
        if f.exists():z.write(f,name)
zip_tmp.replace(ROOT/'Game-playable.zip')
print(f'Playable HTML published: {len(html.encode()):,} bytes; ZIP: {(ROOT/"Game-playable.zip").stat().st_size:,} bytes')
