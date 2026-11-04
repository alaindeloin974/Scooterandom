"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { generateCombo, type Difficulty, type Obstacle, type Stage } from "@/lib/trick-data";
import { Disc3, Heart, Copy, Trophy, LogOut, Zap, RotateCcw, X } from "lucide-react";

const obstacles: Obstacle[] = ["Rail","Ledge","Ramp","Manual Pad","Pyramid","Funbox"];
const difficulties: Difficulty[] = ["Easy","Medium","Hard","Impossible"];
const letters = ["S","C","O","O","T"] as const;
type Player = { name:string; letters:number; skips:number };
const initialPlayers:Player[]=[{name:"Rider 1",letters:0,skips:3},{name:"Rider 2",letters:0,skips:3}];

export default function Home(){
  const [obstacle,setObstacle]=useState<Obstacle>("Rail");
  const [difficulty,setDifficulty]=useState<Difficulty>("Easy");
  const [squareRail,setSquareRail]=useState(false);
  const [combo,setCombo]=useState<Stage[]>(()=>generateCombo("Rail","Easy"));
  const [wheelSpinning,setWheelSpinning]=useState(false);
  const [saved,setSaved]=useState<string[]>([]);
  const [user,setUser]=useState<any>(null);
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [authMode,setAuthMode]=useState<"signup"|"signin">("signup");
  const [authMessage,setAuthMessage]=useState("");
  const [busy,setBusy]=useState(false);
  const [gameStarted,setGameStarted]=useState(false);
  const [players,setPlayers]=useState<Player[]>(initialPlayers);
  const [turn,setTurn]=useState(0);
  const [attempts,setAttempts]=useState(3);
  const [actedPlayers,setActedPlayers]=useState<number[]>([]);
  const [removalsLeft,setRemovalsLeft]=useState(3);
  const [skippedThisTurn,setSkippedThisTurn]=useState(false);
  const [gameCombo,setGameCombo]=useState<Stage[]>([]);
  const [gameOver,setGameOver]=useState(false);
  const [winner,setWinner]=useState("");

  useEffect(()=>{
    if(!supabase)return;
    supabase.auth.getSession().then(({data})=>setUser(data.session?.user??null));
    const {data:listener}=supabase.auth.onAuthStateChange((_event,session)=>setUser(session?.user??null));
    return ()=>listener.subscription.unsubscribe();
  },[]);

  const makeCombo=()=>setWheelSpinning(true);
  const finishWheelSpin=()=>{setCombo(generateCombo(obstacle,difficulty,squareRail));setWheelSpinning(false);};
  const comboText=(items:Stage[])=>items.map(x=>x.trick).join(" → ");
  const saveCombo=async()=>{
    const text=comboText(combo);
    setSaved(prev=>prev.includes(text)?prev:[text,...prev]);
    if(supabase&&user) await supabase.from("saved_combos").insert({user_id:user.id,tricks:combo.map(x=>x.trick),style:obstacle,difficulty});
  };
  const copyCombo=async(items:Stage[])=>{try{await navigator.clipboard.writeText(comboText(items));}catch{}};
  const handleAuth=async()=>{
    if(!supabase){setAuthMessage("Supabase is not configured.");return;}
    setBusy(true);setAuthMessage("");
    const result=authMode==="signup"?await supabase.auth.signUp({email,password}):await supabase.auth.signInWithPassword({email,password});
    if(result.error)setAuthMessage(result.error.message);
    else setAuthMessage(authMode==="signup"?"Check your email to confirm your account.":"Welcome back!");
    setBusy(false);
  };
  const startGame=()=>{
    const readyPlayers=players.map((p,i)=>({...p,name:p.name.trim()||"Rider "+(i+1),letters:0,skips:3}));
    setPlayers(readyPlayers);setTurn(0);setAttempts(3);setActedPlayers([]);setRemovalsLeft(3);
    setSkippedThisTurn(false);setGameOver(false);setWinner("");
    setGameCombo(generateCombo(obstacle,difficulty,squareRail));setGameStarted(true);
  };
  const nextTurn=(nextPlayers=players)=>{
    const active=nextPlayers.map((p,i)=>i).filter(i=>nextPlayers[i].letters<5);
    if(active.length<=1){setGameOver(true);setWinner(nextPlayers[active[0]]?.name??"");return;}
    const acted=[...actedPlayers,turn];
    const remaining=active.filter(i=>!acted.includes(i));
    if(remaining.length===0){setActedPlayers([]);setTurn(active[0]);setGameCombo(generateCombo(obstacle,difficulty,squareRail));}
    else {setActedPlayers(acted);const next=Array.from({length:nextPlayers.length},(_,step)=>(turn+step+1)%nextPlayers.length).find(i=>remaining.includes(i));if(next!==undefined)setTurn(next);}
    setAttempts(3);setSkippedThisTurn(false);
  };
  const landed=()=>nextTurn();
  const missed=()=>{if(attempts>1){setAttempts(v=>v-1);return;}const updated=players.map((p,i)=>i===turn?{...p,letters:Math.min(5,p.letters+1)}:p);setPlayers(updated);nextTurn(updated);};
  const skip=()=>{if(players[turn].skips<=0)return;const updated=players.map((p,i)=>i===turn?{...p,skips:p.skips-1}:p);setPlayers(updated);nextTurn(updated);};
  const removeGameTrick=(index:number)=>{if(removalsLeft<=0||gameCombo.length<=1)return;setGameCombo(current=>current.filter((_,i)=>i!==index));setRemovalsLeft(value=>value-1);};
  const resetGame=()=>{setGameStarted(false);setGameOver(false);setPlayers(initialPlayers.map(p=>({...p})));setActedPlayers([]);setRemovalsLeft(3);};

  return <main className="min-h-screen bg-[#fffaf0] text-[#171717]">
    <header className="sticky top-0 z-30 border-b-2 border-black/10 bg-[#fffaf0]/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
        <a href="#" className="flex items-center gap-2 text-xl font-black tracking-tight sm:text-2xl"><span className="rounded-xl bg-[#ff9f1c] px-2 py-1">CTS</span> CALL THE SHOTS <span className="text-[#f07819]">GENERATOR</span></a>
        <nav className="hidden gap-7 text-sm font-extrabold md:flex"><a href="#generator">GENERATOR</a><a href="#call-the-shots">CALL THE SHOTS</a><a href="#account">ACCOUNT</a></nav>
        <div className="hidden items-center gap-3 md:flex">{user?<><span className="text-sm font-bold">{user.email}</span><button onClick={()=>supabase?.auth.signOut()} className="rounded-full border-2 border-black px-4 py-2 text-sm font-black"><LogOut size={15} className="mr-1 inline"/> LOG OUT</button></>:<a href="#account" className="rounded-full bg-black px-5 py-2.5 text-sm font-black text-white">JOIN THE CREW</a>}</div>
      </div>
    </header>
    <section className="relative overflow-hidden bg-[#ff9f1c]"><div className="mx-auto grid max-w-7xl gap-8 px-5 py-16 md:grid-cols-[1.1fr_.9fr] md:items-center md:py-24">
      <div><div className="mb-5 inline-flex items-center gap-2 rounded-full border-2 border-black bg-[#c8f169] px-4 py-2 text-xs font-black tracking-widest"><Zap size={15}/> CALL THE SHOTS GENERATOR</div><h1 className="text-6xl font-black leading-[.9] tracking-[-.07em] md:text-8xl">FIND YOUR<br/><span className="text-white" style={{WebkitTextStroke:"2px #171717"}}>NEXT COMBO.</span></h1><p className="mt-6 max-w-lg text-lg font-semibold">Pick an obstacle. Get a line. Call your friends and see who can land it.</p><a href="#generator" className="mt-8 inline-flex rounded-full border-2 border-black bg-black px-7 py-4 font-black text-white shadow-[5px_5px_0_#fff]">GENERATE A COMBO ↓</a></div>
      <div className="rotate-2 rounded-[2rem] border-[5px] border-black bg-[#c8f169] p-3 shadow-[12px_12px_0_#171717]"><div className="flex aspect-[4/3] flex-col justify-between rounded-2xl bg-[linear-gradient(135deg,#8bd3dd,#f8b84e_55%,#f07819)] p-6"><div className="text-xs font-black tracking-widest">CALL THE SHOTS / RIDE LOUD</div><div><div className="text-7xl">🛴</div><div className="text-5xl font-black leading-none">MAKE<br/>YOUR<br/>OWN LINE.</div></div><div className="text-xs font-black">STREET • PARK • FLAT</div></div></div>
    </div></section>

    <section id="generator" className="mx-auto max-w-7xl px-5 py-20">
      <div className="mb-10"><p className="font-black tracking-[.2em] text-[#ed7817]">01 / BUILD YOUR LINE</p><h2 className="mt-2 text-4xl font-black md:text-6xl">COMBO GENERATOR<span className="text-[#ed7817]">.</span></h2></div>
      <div className="grid grid-cols-1 gap-4">
        <div className="rounded-[1.5rem] border-2 border-black bg-white p-5 shadow-[5px_5px_0_#171717]">
          <h3 className="mb-3 text-lg font-black">SESSION SETTINGS</h3><label className="mb-2 block text-xs font-black tracking-widest">OBSTACLE</label>
          <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3">{obstacles.map(o=><button key={o} onClick={()=>setObstacle(o)} className={`rounded-xl border-2 border-black px-3 py-3 text-sm font-black ${obstacle===o?"bg-[#c8f169]":"bg-white"}`}>{o}</button>)}</div>
          {obstacle==="Rail"&&<label className="mb-4 flex items-center gap-3 rounded-xl bg-orange-50 p-3 text-sm font-black"><input type="checkbox" checked={squareRail} onChange={e=>setSquareRail(e.target.checked)} className="h-5 w-5 accent-orange-500"/> SQUARE RAIL <span className="ml-auto text-xs font-semibold text-black/50">Blunts enabled</span></label>}
          <label className="mb-2 block text-xs font-black tracking-widest">DIFFICULTY</label><select value={difficulty} onChange={e=>setDifficulty(e.target.value as Difficulty)} className="mb-6 w-full rounded-xl border-2 border-black bg-white p-3 font-bold">{difficulties.map(d=><option key={d}>{d}</option>)}</select>
        </div>
        <div className="rounded-[2rem] border-2 border-black bg-[#171717] p-5 text-white shadow-[7px_7px_0_#ff9f1c] md:p-6">
          <button onClick={makeCombo} disabled={wheelSpinning} className="mb-4 flex w-full items-center justify-center gap-3 rounded-xl border-2 border-black bg-[#ff9f1c] py-3 font-black text-black shadow-[4px_4px_0_#c8f169] disabled:cursor-wait"><span onAnimationEnd={finishWheelSpin} className={wheelSpinning?"inline-flex animate-[spin_900ms_cubic-bezier(.2,.8,.2,1)]":"inline-flex"}><Disc3 size={34} strokeWidth={2.5}/></span><span>{wheelSpinning?"SPINNING...":"SPIN TO GENERATE"}</span></button>
          <div className="flex items-center justify-between"><span className="text-xs font-black tracking-[.2em] text-[#c8f169]">YOUR LINE</span><span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold">{obstacle.toUpperCase()} / {difficulty.toUpperCase()}</span></div>
          <div className="my-8 flex flex-wrap items-center gap-x-2 gap-y-3">{combo.map((stage,i)=><div key={i} className="flex items-center gap-2"><div className="rounded-xl bg-[#c8f169] px-3 py-3 text-black sm:px-4"><span className="mr-2 text-[9px] font-black tracking-widest opacity-60">{stage.type.toUpperCase()}</span><span className="text-base font-black sm:text-lg">{stage.trick}</span></div>{i<combo.length-1&&<span className="text-xl font-black text-[#ff9f1c]">→</span>}</div>)}</div>
          <div className="flex flex-wrap gap-3 border-t border-white/20 pt-6"><button onClick={saveCombo} className="flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-black text-black"><Heart size={16}/> SAVE COMBO</button><button onClick={()=>copyCombo(combo)} className="rounded-full border border-white/40 px-5 py-3 text-sm font-black"><Copy size={16} className="mr-2 inline"/>COPY LINE</button><button onClick={makeCombo} className="rounded-full border border-white/40 px-5 py-3 text-sm font-black"><RotateCcw size={16} className="mr-2 inline"/>REROLL</button></div>
          {saved.length>0&&<p className="mt-4 text-xs text-white/60">Saved this session: {saved.length} combo(s)</p>}
        </div>
      </div>
    </section>

    <section id="call-the-shots" className="bg-[#c8f169] py-20"><div className="mx-auto max-w-7xl px-5">
      <div className="mb-10"><p className="font-black tracking-[.2em] text-[#42601c]">02 / MULTIPLAYER GAME</p><h2 className="mt-2 text-4xl font-black md:text-6xl">CALL THE SHOTS<span className="text-[#ed7817]">.</span></h2><p className="mt-3 max-w-2xl font-semibold">Play with 2 to 8 riders. Take turns landing the generated combo. Miss all 3 tries and take a letter. Spell SCOOT and you\u0027re out — last rider standing wins.</p></div>
      {!gameStarted?<div className="rounded-[2rem] border-2 border-black bg-white p-7 shadow-[7px_7px_0_#171717]"><h3 className="text-2xl font-black">SET UP YOUR GAME</h3><div className="mt-5"><div className="mb-3 flex items-center justify-between"><span className="text-xs font-black tracking-widest">PARTICIPANTS ({players.length}/8)</span><div className="flex gap-2"><button type="button" onClick={()=>setPlayers(p=>p.length>2?p.slice(0,-1):p)} disabled={players.length<=2} className="h-9 w-9 rounded-lg border-2 border-black font-black disabled:opacity-30">−</button><button type="button" onClick={()=>setPlayers(p=>p.length<8?[...p,{name:"Rider "+(p.length+1),letters:0,skips:3}]:p)} disabled={players.length>=8} className="h-9 w-9 rounded-lg border-2 border-black font-black disabled:opacity-30">+</button></div></div><div className="grid gap-3 sm:grid-cols-2">{players.map((p,i)=><label key={i} className="text-xs font-black tracking-widest">RIDER {i+1}<input value={p.name} maxLength={20} onChange={e=>setPlayers(old=>old.map((item,index)=>index===i?{...item,name:e.target.value}:item))} placeholder={"Rider "+(i+1)} className="mt-2 w-full rounded-xl border-2 border-black p-3 text-sm font-bold tracking-normal"/></label>)}</div></div><div className="mt-5 grid gap-4 sm:grid-cols-2"><div><label className="mb-2 block text-xs font-black tracking-widest">OBSTACLE</label><select value={obstacle} onChange={e=>setObstacle(e.target.value as Obstacle)} className="w-full rounded-xl border-2 border-black p-3 font-bold">{obstacles.map(o=><option key={o}>{o}</option>)}</select></div><div><label className="mb-2 block text-xs font-black tracking-widest">DIFFICULTY</label><select value={difficulty} onChange={e=>setDifficulty(e.target.value as Difficulty)} className="w-full rounded-xl border-2 border-black p-3 font-bold">{difficulties.map(d=><option key={d}>{d}</option>)}</select></div></div>{obstacle==="Rail"&&<label className="mt-4 flex items-center gap-3 text-sm font-black"><input type="checkbox" checked={squareRail} onChange={e=>setSquareRail(e.target.checked)} className="h-5 w-5"/> SQUARE RAIL</label>}<button onClick={startGame} className="mt-6 rounded-xl border-2 border-black bg-[#ff9f1c] px-7 py-4 font-black shadow-[4px_4px_0_#171717]">START GAME</button><p className="mt-4 text-xs font-semibold text-black/55">All riders use the same obstacle and difficulty. Each rider gets 3 tries per combo and 3 skips for the whole game. Spell SCOOT to be eliminated; the last rider remaining wins.</p></div>
      :<div className="grid gap-6 lg:grid-cols-[.8fr_1.2fr]">
        <div className="rounded-[2rem] border-2 border-black bg-white p-6 shadow-[7px_7px_0_#171717]"><div className="flex items-center justify-between"><h3 className="text-xl font-black">SCOOT SCORE</h3><Trophy/></div>{players.map((p,i)=><div key={i} className={`mt-4 rounded-xl border-2 border-black p-4 ${turn===i&&!gameOver?"bg-[#c8f169]":"bg-white"} ${p.letters>=5?"opacity-50":""}`}><div className="flex justify-between font-black"><span>{p.name}{turn===i&&!gameOver?" — YOUR TURN":p.letters>=5?" — OUT":""}</span><span>{p.letters}/5</span></div><div className="mt-3 flex gap-2">{letters.map((letter,index)=><div key={index} className={`flex h-10 flex-1 items-center justify-center rounded-lg border-2 border-black text-lg font-black ${index<p.letters?"bg-[#ff9f1c]":"bg-white"}`}>{index<p.letters?letter:"·"}</div>)}</div><p className="mt-2 text-xs font-bold text-black/55">Skips left: {p.skips}</p></div>)}{gameOver&&<div className="mt-5 rounded-xl bg-black p-4 text-white"><p className="text-xs font-black tracking-widest text-[#c8f169]">GAME OVER</p><p className="mt-1 text-2xl font-black">{winner} WINS!</p><button onClick={resetGame} className="mt-3 rounded-full bg-[#ff9f1c] px-4 py-2 text-sm font-black text-black">PLAY AGAIN</button></div>}</div>
        <div className="rounded-[2rem] border-2 border-black bg-[#171717] p-6 text-white shadow-[7px_7px_0_#ff9f1c]"><div className="flex items-center justify-between"><span className="text-xs font-black tracking-[.2em] text-[#c8f169]">CURRENT CHALLENGE</span><span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold">{obstacle} / {difficulty}</span></div>{!gameOver?<><p className="mt-3 text-2xl font-black">{players[turn].name}, call the shot!</p><p className="mt-1 text-xs font-bold text-white/55">Same shared combo for every rider • {removalsLeft} trick removals left for the game</p><div className="my-6 flex flex-col gap-3">{gameCombo.map((stage,i)=><div key={i} className="relative rounded-xl bg-white px-4 py-3 pr-12 text-black"><span className="block text-[9px] font-black tracking-widest text-black/50">{stage.type.toUpperCase()}</span><span className="text-lg font-black">{stage.trick}</span><button type="button" onClick={()=>removeGameTrick(i)} disabled={removalsLeft===0||gameCombo.length<=1} aria-label={"Remove "+stage.trick+" from the shared combo"} title="Remove this trick for everyone" className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full border-2 border-black bg-[#ff9f1c] text-black disabled:cursor-not-allowed disabled:opacity-30"><X size={17} strokeWidth={3}/></button></div>)}</div><div className="mt-5 grid gap-3 sm:grid-cols-2"><button onClick={landed} className="rounded-xl bg-[#c8f169] px-4 py-4 font-black text-black">LANDED IT!</button><button onClick={missed} className="rounded-xl border-2 border-white px-4 py-4 font-black">MISSED</button></div><button onClick={skip} disabled={players[turn].skips===0} className="mt-3 w-full rounded-xl border border-white/40 px-4 py-3 text-sm font-black disabled:opacity-30">SKIP COMBO ({players[turn].skips} LEFT)</button></>:<p className="mt-6 text-white/70">Start another game to play again.</p>}<p className="mt-5 text-xs text-white/45">Land it to pass your turn. Miss all 3 tries to receive a letter. A skip uses one of your 3 game skips and passes your turn. Everyone plays the same combo before the next one is generated.</p></div>
      </div>}
    </div></section>

    <section id="account" className="mx-auto max-w-7xl px-5 py-20"><div className="grid gap-10 md:grid-cols-2 md:items-center"><div><p className="font-black tracking-[.2em] text-[#ed7817]">03 / YOUR RIDER CARD</p><h2 className="mt-2 text-4xl font-black md:text-6xl">YOUR RIDING.<br/>YOUR PROGRESS.</h2><p className="mt-5 max-w-md font-semibold text-black/65">Sign in to keep your saved combos and rider profile.</p></div><div className="rounded-[2rem] border-2 border-black bg-white p-7 shadow-[8px_8px_0_#ff9f1c]">{user?<><h3 className="text-2xl font-black">YOU'RE IN THE CREW</h3><p className="mt-2 text-sm font-semibold">{user.email}</p><button onClick={()=>supabase?.auth.signOut()} className="mt-5 rounded-full border-2 border-black px-5 py-3 text-sm font-black">SIGN OUT <LogOut className="ml-2 inline" size={15}/></button></>:<><h3 className="text-2xl font-black">{authMode==="signup"?"JOIN THE CREW":"WELCOME BACK"}</h3><div className="my-5 grid grid-cols-2 rounded-xl border-2 border-black p-1"><button onClick={()=>setAuthMode("signup")} className={`rounded-lg py-2 text-sm font-black ${authMode==="signup"?"bg-[#c8f169]":""}`}>SIGN UP</button><button onClick={()=>setAuthMode("signin")} className={`rounded-lg py-2 text-sm font-black ${authMode==="signin"?"bg-[#c8f169]":""}`}>SIGN IN</button></div><label className="mb-2 block text-xs font-black tracking-widest">EMAIL</label><input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="rider@email.com" className="mb-4 w-full rounded-xl border-2 border-black p-3 font-semibold"/><label className="mb-2 block text-xs font-black tracking-widest">PASSWORD</label><input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="At least 6 characters" className="mb-5 w-full rounded-xl border-2 border-black p-3 font-semibold"/><button disabled={busy||!email||password.length<6} onClick={handleAuth} className="w-full rounded-xl border-2 border-black bg-[#ff9f1c] py-4 font-black disabled:opacity-50">{busy?"PLEASE WAIT...":authMode==="signup"?"CREATE MY ACCOUNT":"SIGN IN"}</button>{authMessage&&<p className="mt-4 text-sm font-bold text-[#b45309]">{authMessage}</p>}</>}</div></div></section>
    <footer className="flex flex-wrap items-center justify-between gap-3 border-t-2 border-black px-5 py-7 text-xs font-black"><span>CALL THE SHOTS GENERATOR © 2026</span><span>BUILT FOR THE RIDE 🛴</span></footer>
  </main>;
}
