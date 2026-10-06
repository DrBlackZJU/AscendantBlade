/* Full-song battle music: sustained enemy-count thresholds and boss priority.
   BPM values are approximate; the four-bar grid is a scheduling aid, not verified
   phrase markers. Resume markers use the candidate cuts from full-track analysis. */
const AshMusic = (() => {
  'use strict';
  const TRACKS = [
    {src:'music/music-0.mp3', name:'The Gathering Gale', bpm:152,
      cuts:[0,32.3,69.3,94.9,119.7,140.7]}, // double-time grid
    {src:'music/music-1.mp3', name:'Where Steel Meets Silk', bpm:136,
      cuts:[0,27.5,53,77.9,110.7,136.4,157.5]},
    {src:'music/music-2.mp3', name:'Banners in the Glare', bpm:152, cuts:[0]}
  ];
  const clamp = n => Math.max(0, Math.min(1, n));
  class BattleMusic {
    constructor({createAudio=src=>{
      const audio=new Audio(src);audio.hidden=true;
      audio.setAttribute('aria-hidden','true');document.body.append(audio);return audio;
    }, volume=.2, enabled=true, onTransition=()=>{}}={}) {
      this.tracks=TRACKS.map(track=>{
        const audio=createAudio(track.src);
        audio.preload='auto';audio.loop=true;audio.volume=0;
        return {audio, requested:false, failed:false, blocked:false, generation:0, resumeTime:0};
      });
      this.volume=clamp(volume);this.enabled=enabled;this.muted=false;this.onTransition=onTransition;
      this.running=false;this.stopped=true;this.current=0;this.envelope=0;
      this.intensity=0;this.age=0;this.bossActive=false;this.postBossLow=false;this.pending=null;this.transition=null;
      this.applyVolume();
    }
    play(index) {
      const track=this.tracks[index];
      if(track.requested||track.failed||track.blocked)return;
      track.requested=true;
      const generation=++track.generation;
      try {
        const result=track.audio.play();
        if(result?.catch)result.catch(error=>{
          if(generation!==track.generation)return;
          track.requested=false;
          if(error.name==='AbortError')return;
          track.blocked=true;
          if(error.name!=='NotAllowedError'){
            track.failed=true;console.warn('音乐暂时无法播放：'+TRACKS[index].src,error);
          }
        });
      }catch(error){track.requested=false;track.blocked=true;}
    }
    pauseTrack(index) {
      const track=this.tracks[index];
      track.generation++;track.requested=false;track.audio.pause();
    }
    start(initialLevel=0) {
      for(let i=0;i<this.tracks.length;i++){
        this.pauseTrack(i);this.tracks[i].audio.volume=0;
        this.tracks[i].resumeTime=0;
        try{this.tracks[i].audio.currentTime=0;}catch(error){/* Metadata may still be loading. */}
      }
      this.current=initialLevel;this.intensity=0;this.age=0;this.bossActive=false;this.postBossLow=false;
      this.envelope=0;this.pending=null;this.transition=null;
      this.stopped=false;this.running=true;this.unlock();
    }
    unlock() {
      for(const track of this.tracks)track.blocked=false;
      if(this.running&&!this.stopped)this.play(this.current);
    }
    setRunning(running) {
      if(this.stopped||running===this.running)return;
      this.running=running;
      if(running)this.play(this.current);
      else for(let i=0;i<this.tracks.length;i++)this.pauseTrack(i);
    }
    stop() {
      this.stopped=true;this.pending=null;this.transition=null;
      // Paused music need not resume just to fade out.
      if(!this.running){this.envelope=0;this.applyVolume();}
    }
    setVolume(volume) {this.volume=clamp(volume);this.applyVolume();}
    setEnabled(enabled) {this.enabled=enabled;this.applyVolume();}
    setMuted(muted) {this.muted=muted;this.applyVolume();}
    applyVolume() {
      for(let i=0;i<this.tracks.length;i++){
        const audio=this.tracks[i].audio;
        audio.muted=this.muted||!this.enabled;
        // Keep the slider scale and saved preference; reduce every tier by 15%.
        audio.volume=i===this.current?this.volume*this.envelope*.85:0;
      }
    }
    desiredLevel(enemyCount) {
      if(this.current===0)return enemyCount>40?2:enemyCount>15?1:0;
      if(this.current===1)return enemyCount>40?2:enemyCount<=10?0:1;
      return enemyCount<=30?1:2;
    }
    beginTransition(to) {
      if(to===this.current){
        if(this.transition?.to!==to)this.transition=null;
        this.pending=null;return;
      }
      if(this.transition?.to===to)return;
      const next=this.tracks[to];
      if(next.failed||next.audio.error||next.audio.readyState<3)return;
      const up=to>this.current;
      // A boss can interrupt an unfinished downgrade without a volume jump.
      this.transition={to,up,phase:'out',elapsed:0,from:this.envelope,out:up?.65:1.5,in:up?1:2};
      this.pending=null;
    }
    update(dt, {enemyCount=0, boss=false}={}) {
      dt=Math.max(0,Math.min(dt,.1));
      if(this.stopped){
        this.envelope=Math.max(0,this.envelope-dt/.8);this.applyVolume();
        if(this.envelope===0&&this.running){
          for(let i=0;i<this.tracks.length;i++)this.pauseTrack(i);
          this.running=false;
        }
        return;
      }
      if(!this.running)return;
      if(this.bossActive&&!boss)this.postBossLow=enemyCount<=15;
      this.bossActive=boss;
      if(boss||enemyCount>15)this.postBossLow=false;
      const immediate=boss?2:this.postBossLow?0:null;
      if(immediate!==null){
        this.pending=null;this.beginTransition(immediate);
        if(!boss&&this.current===0&&!this.transition)this.postBossLow=false;
      }
      const audio=this.tracks[this.current].audio;
      // Buffering cannot consume threshold holds or transition fades.
      if(audio.paused||audio.readyState<3)return;
      this.age+=dt;
      // Smoothed intensity remains diagnostic; exact counts control the holds.
      const target=Math.max(clamp(enemyCount/40),boss?1:0);
      this.intensity+=(target-this.intensity)*(1-Math.exp(-dt*(target>this.intensity?1:.15)));
      if(this.transition){
        const transition=this.transition;
        transition.elapsed+=dt;
        if(transition.phase==='out'){
          this.envelope=transition.from*Math.max(0,1-transition.elapsed/transition.out);
          if(this.envelope===0){
            // Commit only when an upgrade actually leaves the track. Use its
            // media clock so a completed full-song loop also resets the marker.
            if(transition.up&&this.current<2){
              const track=this.tracks[this.current],time=track.audio.currentTime;
              track.resumeTime=TRACKS[this.current].cuts.reduce((latest,cut)=>cut<=time?cut:latest,0);
            }
            this.pauseTrack(this.current);this.current=transition.to;this.age=0;
            const next=this.tracks[this.current].audio;
            next.currentTime=this.tracks[this.current].resumeTime;
            transition.phase='in';transition.elapsed=0;this.play(this.current);
            if(transition.up&&this.enabled&&!this.muted&&this.volume>0)this.onTransition();
          }
        }else{
          this.envelope=Math.min(1,transition.elapsed/transition.in);
          if(this.envelope===1)this.transition=null;
        }
        this.applyVolume();return;
      }
      this.envelope=Math.min(1,this.envelope+dt/1.5);this.applyVolume();
      if(immediate!==null)return;
      const desired=this.desiredLevel(enemyCount);
      if(desired===this.current){this.pending=null;return;}
      if(!this.pending||this.pending.to!==desired)this.pending={to:desired,held:0,boundary:null};
      const pending=this.pending,up=desired>this.current;
      pending.held+=dt;
      if(pending.held+1e-9<(up?5:10))return;
      const next=this.tracks[desired];
      if(next.failed||next.audio.error||next.audio.readyState<3)return;
      // Schedule against the actual media clock, including after a full-song loop.
      const barGroup=16*60/TRACKS[this.current].bpm;
      if(pending.boundary===null){
        pending.boundary=(Math.floor(audio.currentTime/barGroup)+1)*barGroup;
        pending.previousTime=audio.currentTime;
      }
      const wrapped=audio.currentTime<pending.previousTime;
      pending.previousTime=audio.currentTime;
      if(!wrapped&&audio.currentTime<pending.boundary)return;
      this.beginTransition(desired);
    }
    snapshot() {
      return {level:this.current,intensity:this.intensity,volume:this.volume,enabled:this.enabled,muted:this.muted,
        running:this.running,stopped:this.stopped,pending:this.pending?.to??null,
        transition:this.transition?.phase??null,time:this.tracks[this.current].audio.currentTime,
        resumeTimes:this.tracks.map(track=>track.resumeTime)};
    }
  }
  return {BattleMusic,TRACKS};
})();
if(typeof module!=='undefined'&&module.exports)module.exports=AshMusic;
