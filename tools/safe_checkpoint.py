#!/usr/bin/env python3
"""Commit without a large loose-object spike in the capped persistent workspace.
The complete existing .git is copied to /var/tmp, committed/repacked/verified there,
then exchanged atomically. All refs, tags and history are preserved. No auth is stored.
Usage: python tools/safe_checkpoint.py -m "message" [--tag TAG] -- file ...
"""
from pathlib import Path
import argparse,subprocess,os,tempfile,shutil,ctypes,hashlib
ROOT=Path(__file__).resolve().parents[1]
p=argparse.ArgumentParser();p.add_argument('-m','--message',required=True);p.add_argument('--tag');p.add_argument('files',nargs='+');args=p.parse_args()
def git(*cmd,env=None,ok=(0,)):
    r=subprocess.run(['git',*cmd],cwd=ROOT,env=env,text=True,capture_output=True,timeout=180)
    if r.returncode not in ok:raise RuntimeError(r.stderr or r.stdout)
    return r.stdout.strip()
def fingerprint():
    index=ROOT/'.git/index'
    return (git('rev-parse','HEAD'),git('show-ref'),hashlib.sha256(index.read_bytes()).hexdigest())
git('diff','--check');before=fingerprint()
base=Path(tempfile.mkdtemp(prefix='closed365-checkpoint-',dir='/var/tmp'));metadata=base/'git'
if os.stat(base).st_dev!=os.stat(ROOT/'.git').st_dev:raise RuntimeError('Atomic exchange needs /var/tmp on the same filesystem')
shutil.copytree(ROOT/'.git',metadata)
env=os.environ.copy();env['GIT_DIR']=str(metadata);env['GIT_WORK_TREE']=str(ROOT);env.pop('GIT_OBJECT_DIRECTORY',None);env.pop('GIT_ALTERNATE_OBJECT_DIRECTORIES',None)
git('add','--',*args.files,env=env)
r=subprocess.run(['git','diff','--cached','--quiet'],cwd=ROOT,env=env)
if r.returncode==0:print('No staged change.');raise SystemExit(0)
print(git('commit','-m',args.message,env=env))
if args.tag:
    exists=subprocess.run(['git','show-ref','--verify','--quiet','refs/tags/'+args.tag],cwd=ROOT,env=env)
    if exists.returncode==0:raise RuntimeError('Refusing to replace an existing tag')
    git('tag','-a',args.tag,'-m',args.message,env=env)
git('repack','-a','-d','--window=32','--depth=64',env=env);git('fsck','--full','--no-dangling',env=env)
if fingerprint()!=before:raise RuntimeError('Repository metadata changed concurrently; original .git left untouched')
r=subprocess.run(['git','diff','--quiet','--',*args.files],cwd=ROOT,env=env)
if r.returncode:raise RuntimeError('Selected files changed during checkpoint; original .git left untouched')
du=lambda x:int(subprocess.check_output(['du','-s','-B1',str(x)]).split()[0])
projected=du(ROOT.parent)-du(ROOT/'.git')+du(metadata)
if projected>=127_000_000:raise RuntimeError('Compacted workspace would exceed safety margin: '+str(projected))
ret=ctypes.CDLL(None,use_errno=True).renameat2(-100,os.fsencode(ROOT/'.git'),-100,os.fsencode(metadata),2)
if ret:raise OSError(ctypes.get_errno(),'Atomic metadata exchange failed')
git('fsck','--full','--no-dangling')
print('CHECKPOINT',git('rev-parse','HEAD'));print('Workspace bytes',du(ROOT.parent));print(git('status','--short'))
