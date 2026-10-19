#!/usr/bin/env python3
"""Atomically publish a self-contained offline HTML before packing anything else."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
import subprocess
import json
import base64
ROOT=Path(__file__).resolve().parents[1]
SRC=ROOT/'src'
for name in ['data.js','catalog-gen.js','core.js','scene.js','ui.js','world.js','store.js','realism.js','navigation.js','city-film.js','interior.js','fixtures.js','lighting.js','life-text.js','life.js','life-more.js','life-world.js','life-real.js','life-home.js','life-items.js','life-catalog.js','life-body.js','store-real.js','audio.js','levels.js','level-minigames.js','survival.js']:
    subprocess.run(['node','--check',str(SRC/name)],check=True,capture_output=True)
html=(SRC/'template.html').read_text()
assets={'models':{},'textures':{}}
for p in sorted((SRC/'assets'/'models').glob('*.glb')):
    assets['models'][p.stem]=base64.b64encode(p.read_bytes()).decode()
for p in sorted((SRC/'assets'/'textures').glob('*')):
    if p.suffix.lower() not in ['.jpg','.jpeg','.png']:continue
    mime='image/png' if p.suffix.lower()=='.png' else 'image/jpeg'
    assets['textures'][p.stem]='data:'+mime+';base64,'+base64.b64encode(p.read_bytes()).decode()
credits='/* Offline hand assets, MIT license:\n'+(SRC/'assets'/'WEBXR-HANDS-LICENSE.txt').read_text()+'\nThree.js and addons (MIT):\n'+(SRC/'vendor'/'THREE-LICENSE.txt').read_text()+'\nPoly Haven furniture and materials: CC0-1.0. See assets/manifest.json. */\n'
audio={p.stem:base64.b64encode(p.read_bytes()).decode() for p in sorted((SRC/'audio').glob('*.mp3'))}
html=html.replace('/* AUDIO_DATA */','/* Sounds and music: CC0 (Kenney, rubberduck, OwlishMedia, cynicmusic, Yoiyami, Wolfgang_, Kistol, Joth, extenz via OpenGameArt). See src/audio/CREDITS.md */\nconst AUDIO_DATA='+json.dumps(audio,separators=(',',':'))+';')
html=html.replace('/* ROOM_ASSETS */',credits+'const OFFLINE_ROOM='+json.dumps(assets,separators=(',',':'))+';')
for marker,file in [('STYLE','style.css'),('WORLD_STYLE','world.css'),('REALISM_STYLE','realism.css'),('NAV_STYLE','navigation.css'),('CITY_FILM_STYLE','city-film.css'),('ROOM_TOOLS','vendor/room-tools.min.js'),('ENGINE','vendor/three.min.js'),('DATA','data.js'),('CORE','core.js'),('SCENE','scene.js'),('UI','ui.js'),('WORLD','world.js'),('STORE','store.js'),('REALISM','realism.js'),('NAVIGATION','navigation.js'),('CITY_FILM','city-film.js'),('INTERIOR','interior.js'),('FIXTURES','fixtures.js'),('LIGHTING','lighting.js'),('LIFE_TEXT','life-text.js'),('LIFE','life.js'),('LIFE_MORE','life-more.js'),('LIFE_WORLD','life-world.js'),('LIFE_REAL','life-real.js'),('LIFE_HOME','life-home.js'),('LIFE_ITEMS','life-items.js'),('LIFE_CATALOG','life-catalog.js'),('LIFE_BODY','life-body.js'),('STORE_REAL','store-real.js'),('AUDIO','audio.js'),('LEVELS','levels.js'),('LEVEL_MINIGAMES','level-minigames.js'),('SURVIVAL','survival.js')]:
    text=(SRC/file).read_text()
    if marker=='DATA': text+='\n'+(SRC/'catalog-gen.js').read_text()
    if marker!='STYLE': text=text.replace('</script','<\\/script')
    html=html.replace('/* '+marker+' */',text)
assert '/* ENGINE */' not in html
assert '<script src=' not in html
assert len(html.encode())<32_000_000
# Never expose a partially written/uncompiled root entry point.
tmp=ROOT/'index.html.tmp';tmp.write_text(html);tmp.replace(ROOT/'index.html')
# The sample room is index.html#sample (no second 12 MB copy in the repository).
old_sample=ROOT/'写实房间样片.html'
if old_sample.exists(): old_sample.unlink()
(ROOT/'dist').mkdir(exist_ok=True)
zip_tmp=ROOT/'dist'/'Game-playable.zip.tmp'
with ZipFile(zip_tmp,'w',ZIP_DEFLATED,compresslevel=8) as z:
    names=['index.html','README.md','DESIGN.md','HANDOFF.md','tests/RESULTS.md','tools/build.py','tools/bundle-vendor.cjs']
    names += [str(p.relative_to(ROOT)) for p in sorted((ROOT/'tools').glob('*')) if p.suffix in ['.py','.cjs'] and p.is_file()]
    names += [str(p.relative_to(ROOT)) for p in sorted(SRC.rglob('*')) if p.is_file()]
    names += [str(p.relative_to(ROOT)) for p in sorted((ROOT/'tests').glob('*.cjs'))]
    for name in dict.fromkeys(names):
        f=ROOT/name
        if f.exists():z.write(f,name)
zip_tmp.replace(ROOT/'dist'/'Game-playable.zip')
old_zip=ROOT/'Game-playable.zip'
if old_zip.exists(): old_zip.unlink()
print(f'Built offline HTML: {len(html.encode()):,} bytes; ZIP: {(ROOT/"dist"/"Game-playable.zip").stat().st_size:,} bytes (local dist/)')
