'use strict';
const assert=require('node:assert/strict');
const {BattleMusic}=require('../music.js');
function setup(){
  const audios=[];
  const music=new BattleMusic({enabled:true,createAudio:()=>{
    const audio={currentTime:0,duration:[162.873,178.573,180][audios.length],readyState:4,
      paused:true,error:null,play(){this.paused=false;},pause(){this.paused=true;}};
    audios.push(audio);return audio;
  }});
  music.start();
  return {music,audios};
}
function tick(music,audios,seconds,state={enemyCount:20,boss:false}){
  for(let t=0;t<seconds-1e-9;t+=.05){
    for(const audio of audios)if(!audio.paused)audio.currentTime=(audio.currentTime+.05)%audio.duration;
    music.update(.05,state);
  }
}
function leave(music,audios,to){
  music.beginTransition(to);
  tick(music,audios,1.6,{enemyCount:20,boss:to===2});
  assert.equal(music.current,to);
}
{
  const {music,audios}=setup();
  audios[0].currentTime=80;
  // BOSS priority interrupts level 0 immediately; return bypasses enemy holds.
  tick(music,audios,.75,{enemyCount:5,boss:true});
  assert.equal(music.current,2);
  assert.equal(music.tracks[0].resumeTime,69.3);
  tick(music,audios,1.6,{enemyCount:5,boss:false});
  assert.equal(music.current,0);
  assert.ok(audios[0].currentTime>=69.3&&audios[0].currentTime<70);
  audios[0].currentTime=126;
  leave(music,audios,2);
  assert.equal(music.tracks[0].resumeTime,119.7,'Later interruptions advance the bookmark');
}
{
  const {music,audios}=setup();
  audios[0].currentTime=40;leave(music,audios,1);
  assert.equal(music.tracks[0].resumeTime,32.3);
  audios[1].currentTime=90;leave(music,audios,2);
  assert.equal(music.tracks[1].resumeTime,77.9);
  leave(music,audios,1);
  assert.ok(audios[1].currentTime>=77.9&&audios[1].currentTime<78.1);
  // Downgrading must not overwrite the marker saved by an upgrade.
  audios[1].currentTime=145;leave(music,audios,0);
  assert.equal(music.tracks[1].resumeTime,77.9);
  assert.ok(audios[0].currentTime>=32.3&&audios[0].currentTime<32.5);
  leave(music,audios,1);
  assert.ok(audios[1].currentTime>=77.9&&audios[1].currentTime<79);
  assert.deepEqual(music.snapshot().resumeTimes,[32.3,77.9,0]);
  music.start();
  assert.deepEqual(music.snapshot().resumeTimes,[0,0,0]);
  assert.ok(audios.every(audio=>audio.currentTime===0));
}
{
  const {music,audios}=setup();
  music.tracks[0].resumeTime=140.7;
  audios[0].currentTime=5;leave(music,audios,2);
  assert.equal(music.tracks[0].resumeTime,0,'After looping, the opening section resumes at zero');
  audios[2].currentTime=60;leave(music,audios,0);leave(music,audios,2);
  assert.ok(audios[2].currentTime<1,'BOSS music still starts at zero');
}
{
  const {music,audios}=setup();
  audios[0].currentTime=100;
  music.beginTransition(2);music.beginTransition(0);
  assert.equal(music.tracks[0].resumeTime,0,'A canceled upgrade does not save a marker');
  music.setRunning(false);
  const before=audios[0].currentTime;
  tick(music,audios,1);
  music.setRunning(true);
  assert.equal(audios[0].currentTime,before,'Pause resumes at the exact media position');
}
console.log('Music resume: BOSS interruption, independent markers, upgrade/downgrade return, progression, loop, cancellation, pause and new-run reset passed.');
