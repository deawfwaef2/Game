#!/usr/bin/env python3
# Re-encodes the CC0 source packs (downloaded to /var/tmp/snd, see src/audio/CREDITS.md) into src/audio/*.mp3.
import subprocess, os, json
import os
os.chdir('/var/tmp/snd')
K='kenney_rpg-audio/Audio/'; I='kenney_impact-sounds/Audio/'; U='kenney_interface-sounds/Audio/'
O='oga_Owlish_Media_Sound_Effects/'; R='oga_100-CC0-SFX_0/'; R2='oga_sfx_100_v2/'; L='oga_sfx_loops/'
OUT='/home/user/Game/src/audio/'
# name: (source, max seconds, loop?, gain dB)
S={
 'step_wood1':(I+'footstep_wood_000.ogg',0.6,0,-4),'step_wood2':(I+'footstep_wood_001.ogg',0.6,0,-4),'step_wood3':(I+'footstep_wood_002.ogg',0.6,0,-4),'step_wood4':(I+'footstep_wood_003.ogg',0.6,0,-4),
 'step_hard1':(I+'footstep_concrete_000.ogg',0.6,0,-4),'step_hard2':(I+'footstep_concrete_001.ogg',0.6,0,-4),'step_hard3':(I+'footstep_concrete_002.ogg',0.6,0,-4),
 'pick':(K+'cloth2.ogg',0.8,0,0),'pick2':(K+'handleSmallLeather.ogg',0.8,0,0),'place':(I+'impactPlate_light_000.ogg',0.6,0,-2),'place2':(I+'impactWood_light_002.ogg',0.6,0,-2),
 'zip':(O+'Cloth, Rustle/212180__owlstorm__bag-zipper.wav',1.6,0,0),'blanket':(O+'Cloth, Rustle/320142__owlstorm__blanket-movement-4.wav',2.0,0,0),
 'bite':(O+'Impacts/fruit1.wav',0.7,0,0),'bite2':(O+'Impacts/fruit2.wav',0.7,0,0),'gulp':(O+'Impacts/gulp1.wav',0.8,0,0),'sip':(O+'Human/drink-sip-and-swallow.wav',2.2,0,0),
 'tap':(O+'Water/tap-water-1.wav',3.0,0,-2),'kettle':(O+'Water/kettle-boil.wav',5.0,0,-3),'pot':(K+'metalPot1.ogg',1.0,0,-2),'pot2':(K+'metalPot2.ogg',1.0,0,-2),
 'flush':(R+'toilet_01.ogg',5.0,0,0),'shower':(L+'water_flowing.ogg',6.0,1,-4),'boil':(L+'water_boiling.ogg',5.0,1,-6),
 'dishes':(R+'dishes_01.ogg',1.5,0,-2),'dishes2':(R+'dishes_03.ogg',1.5,0,-2),'sweep':(O+'Impacts/scrape1.wav',1.4,0,-4),'cloth':(K+'cloth3.ogg',1.0,0,0),
 'yawn':(O+'Human/yawn1.wav',3.0,0,-3),'cough':(O+'Human/cough2.wav',1.5,0,-3),'breath':(O+'Human/breath-male.wav',3.0,0,-6),
 'page':(O+'Paper/pageturn1.wav',1.2,0,0),'page2':(K+'bookFlip2.ogg',1.0,0,0),'bookopen':(K+'bookOpen.ogg',1.0,0,0),'bookclose':(K+'bookClose.ogg',1.0,0,0),
 'pencil':(O+'Paper/pencil-scratch-1.wav',2.5,0,-2),'paper':(R+'paper_02.ogg',1.2,0,0),'crumple':(O+'Paper/crumples1.wav',1.5,0,-2),'letter':(O+'Paper/tissue-pull.wav',1.2,0,0),
 'knock':(I+'impactWood_heavy_001.ogg',0.5,0,2),'door_open':(K+'doorOpen_1.ogg',1.5,0,-2),'door_close':(K+'doorClose_2.ogg',1.5,0,-2),'fridge_open':(R+'microwave_door_open.ogg',1.2,0,-2),'fridge_close':(R+'microwave_door_close.ogg',1.2,0,-2),
 'switch':(R+'switch_01.ogg',0.6,0,-2),'switch2':(R2+'sfx100v2_switch_02.ogg',0.6,0,-2),'tools':(R+'tools_02.ogg',1.6,0,-2),'tools2':(R+'tools_04.ogg',1.6,0,-2),'snip':(K+'metalClick.ogg',0.5,0,-2),
 'splash':(R+'splash_01.ogg',1.2,0,-2),'spray':(O+'Water/spray-bottle.wav',1.0,0,-2),'coins':(K+'handleCoins.ogg',1.2,0,0),'bell':(I+'impactBell_heavy_000.ogg',1.6,0,-8),
 'click':(U+'click_002.ogg',0.3,0,-4),'select':(U+'select_002.ogg',0.4,0,-4),'confirm':(U+'confirmation_002.ogg',0.8,0,-4),'error':(U+'error_004.ogg',0.6,0,-6),'open':(U+'open_002.ogg',0.5,0,-6),'close':(U+'close_002.ogg',0.5,0,-6),
 'thunder':(R2+'sfx100v2_thunder_01.ogg',6.0,0,-4),'rain':(L+'rain.ogg',8.0,1,-2),'clock':(O+'Ambience/loopable-ticking-clock.wav',6.0,1,-10),'city':(R2+'sfx100v2_loop_highway.ogg',8.0,1,-6),
 'radio_static':(L+'noise_01.ogg',3.0,1,-10),'drawer':(I+'impactWood_light_000.ogg',0.6,0,-2),'can':(I+'impactTin_medium_001.ogg',0.6,0,-2),
}
M={'m_vaporware':'music/003_Vaporware_1.mp3','m_light':'music/first_light_particles_1.mp3','m_nostalgia':'music/piano_nostalgia.ogg','m_sadness':'music/Sadness.ogg','m_jrpg':'music/JRPG_Piano.mp3','m_emotional':'music/untitled.mp3'}
meta={}
for n,(src,mx,loop,g) in S.items():
    af=f'volume={g}dB'
    if not loop: af+=f',afade=t=out:st={max(0,mx-0.15)}:d=0.15'
    cmd=['ffmpeg','-v','error','-y','-i',src,'-t',str(mx),'-ac','1','-ar','32000','-af',af,'-b:a','40k',OUT+n+'.mp3']
    subprocess.run(cmd,check=True); meta[n]=loop
for n,src in M.items():
    subprocess.run(['ffmpeg','-v','error','-y','-i',src,'-ac','1','-ar','44100','-af','loudnorm=I=-20:TP=-2','-b:a','56k',OUT+n+'.mp3'],check=True)
tot=sum(os.path.getsize(OUT+f) for f in os.listdir(OUT)); print('files',len(os.listdir(OUT)),'bytes',tot)
