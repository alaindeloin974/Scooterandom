"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Zap, Trophy, UserRound, Shuffle, Heart, LogOut, Menu, X, Flame, Target, Star } from "lucide-react";

type Trick = { name: string; level: "Easy" | "Medium" | "Hard" | "Insane"; styles: string[] };
const TRICKS: Trick[] = [
  { name: "Bunny Hop", level: "Easy", styles: ["Street", "Park", "Flat"] },
  { name: "180", level: "Easy", styles: ["Street", "Park", "Flat"] },
  { name: "Barspin", level: "Easy", styles: ["Street", "Park", "Flat"] },
  { name: "Tailwhip", level: "Easy", styles: ["Street", "Park", "Flat"] },
  { name: "One Foot", level: "Easy", styles: ["Park", "Flat"] },
  { name: "No Footer", level: "Easy", styles: ["Park", "Flat"] },
  { name: "360", level: "Medium", styles: ["Street", "Park"] },
  { name: "Heelwhip", level: "Medium", styles: ["Street", "Park", "Flat"] },
  { name: "Fingerwhip", level: "Medium", styles: ["Street", "Park"] },
  { name: "Bar to Bar", level: "Medium", styles: ["Street", "Park"] },
  { name: "Whip to Bar", level: "Hard", styles: ["Street", "Park"] },
  { name: "Bri Flip", level: "Hard", styles: ["Street", "Park"] },
  { name: "Backflip", level: "Hard", styles: ["Park"] },
  { name: "Frontflip", level: "Hard", styles: ["Park"] },
  { name: "Double Tailwhip", level: "Hard", styles: ["Park"] },
  { name: "360 Tailwhip", level: "Insane", styles: ["Park", "Street"] },
  { name: "Cashroll", level: "Insane", styles: ["Park"] },
  { name: "Flair", level: "Insane", styles: ["Park"] },
  { name: "Triple Tailwhip", level: "Insane", styles: ["Park"] }
];
const levels = ["Easy", "Medium", "Hard", "Insane"] as const;
const challenges = [
  { title: "Warm-up session", detail: "Generate a combo with 2 tricks and give it a try.", xp: 50, tag: "DAILY", icon: "⚡" },
  { title: "Whip it good", detail: "Land a Tailwhip in a combo.", xp: 100, tag: "DAILY", icon: "🌀" },
  { title: "Push your limits", detail: "Generate a Hard or Insane combo.", xp: 150, tag: "WEEKLY", icon: "🔥" }
];

export default function Home() {
  const [style, setStyle] = useState("Park");
  const [difficulty, setDifficulty] = useState("Any");
  const [count, setCount] = useState(3);
  const [combo, setCombo] = useState<Trick[]>([TRICKS[6], TRICKS[3], TRICKS[2]]);
  const [saved, setSaved] = useState<string[]>([]);
  const [user, setUser] = useState<any>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signup");
  const [authMessage, setAuthMessage] = useState("");
  const [profile, setProfile] = useState<any>(null);
  const [xp, setXp] = useState(0);
  const [completed, setCompleted] = useState<string[]>([]);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null));
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!supabase || !user) { setProfile(null); return; }
    supabase.from("profiles").select("*").eq("id", user.id).single().then(({ data }) => setProfile(data));
    supabase.from("profiles").select("xp").eq("id", user.id).single().then(({ data }) => setXp(data?.xp ?? 0));
    supabase.from("challenge_completions").select("challenge_title").eq("user_id", user.id).then(({ data }) => setCompleted((data ?? []).map((x: any) => x.challenge_title)));
  }, [user]);

  const generate = () => {
    let pool = TRICKS.filter(t => t.styles.includes(style));
    if (difficulty !== "Any") pool = pool.filter(t => t.level === difficulty);
    if (!pool.length) pool = TRICKS.filter(t => t.styles.includes(style));
    const picked: Trick[] = [];
    while (picked.length < count) {
      const next = pool[Math.floor(Math.random() * pool.length)];
      if (!picked.some(t => t.name === next.name) || pool.length < count) picked.push(next);
      if (picked.length > 20) break;
    }
    setCombo(picked);
  };

  const handleAuth = async () => {
    if (!supabase) { setAuthMessage("Connect Supabase first: add your project URL and anon key to .env.local."); return; }
    setBusy(true); setAuthMessage("");
    const result = authMode === "signup"
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password });
    if (result.error) setAuthMessage(result.error.message);
    else if (authMode === "signup") setAuthMessage("Check your email to confirm your account, then sign in.");
    else setAuthMessage("Welcome back!");
    setBusy(false);
  };

  const saveCombo = async () => {
    const key = combo.map(t => t.name).join(" → ");
    setSaved(prev => prev.includes(key) ? prev : [key, ...prev]);
    if (supabase && user) await supabase.from("saved_combos").insert({ user_id: user.id, tricks: combo.map(t => t.name), style, difficulty });
  };

  const completeChallenge = async (c: typeof challenges[number]) => {
    if (!user || !supabase) { setAuthMessage("Sign in to save challenge progress."); return; }
    if (completed.includes(c.title)) return;
    const { error } = await supabase.from("challenge_completions").insert({ user_id: user.id, challenge_title: c.title, xp_earned: c.xp });
    if (!error) {
      await supabase.from("profiles").update({ xp: xp + c.xp }).eq("id", user.id);
      setCompleted(prev => [...prev, c.title]); setXp(prev => prev + c.xp);
    } else setAuthMessage(error.message);
  };

  const rank = xp >= 1000 ? "Pro Rider" : xp >= 400 ? "Skilled Rider" : xp >= 100 ? "Rising Rider" : "New Rider";
  const comboText = combo.map(t => t.name).join(" → ");

  return (
    <main className="min-h-screen bg-[#fffaf0] text-[#171717]">
      <header className="sticky top-0 z-30 border-b-2 border-black/10 bg-[#fffaf0]/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <a href="#" className="flex items-center gap-2 text-2xl font-black tracking-tight"><span className="rounded-xl bg-[#ff9f1c] px-2 py-1">SG</span> SCOOT<span className="text-[#f07819]">GEN</span></a>
          <nav className="hidden items-center gap-7 text-sm font-extrabold md:flex">
            <a href="#generator" className="hover:text-orange-600">GENERATOR</a><a href="#challenges" className="hover:text-orange-600">CHALLENGES</a><a href="#community" className="hover:text-orange-600">COMMUNITY</a>
          </nav>
          <div className="hidden items-center gap-3 md:flex">
            {user ? <><span className="text-sm font-bold">{user.email}</span><button onClick={() => supabase?.auth.signOut()} className="rounded-full border-2 border-black px-4 py-2 text-sm font-black hover:bg-black hover:text-white"><LogOut size={15} className="mr-1 inline"/> LOG OUT</button></> : <a href="#account" className="rounded-full bg-black px-5 py-2.5 text-sm font-black text-white hover:bg-[#f07819]">JOIN THE CREW</a>}
          </div>
          <button className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle menu">{mobileOpen ? <X/> : <Menu/>}</button>
        </div>
        {mobileOpen && <div className="flex flex-col gap-4 border-t px-5 py-4 font-black md:hidden"><a href="#generator">GENERATOR</a><a href="#challenges">CHALLENGES</a><a href="#account">ACCOUNT</a></div>}
      </header>

      <section className="relative overflow-hidden bg-[#ff9f1c]">
        <div className="absolute -right-16 -top-24 h-72 w-72 rounded-full border-[35px] border-white/20"/>
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-16 md:grid-cols-[1.1fr_.9fr] md:items-center md:py-24">
          <div className="relative z-10">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border-2 border-black bg-[#c8f169] px-4 py-2 text-xs font-black tracking-widest"><Flame size={15}/> THE FREESTYLE SCOOTER HUB</div>
            <h1 className="max-w-3xl text-6xl font-black leading-[.9] tracking-[-.07em] md:text-8xl">FIND YOUR<br/><span className="text-white" style={{WebkitTextStroke:"2px #171717"}}>NEXT COMBO.</span></h1>
            <p className="mt-6 max-w-lg text-lg font-semibold">Random tricks. Real challenges. One more try. Build your skills and ride your own line.</p>
            <a href="#generator" className="mt-8 inline-flex items-center gap-2 rounded-full border-2 border-black bg-black px-7 py-4 font-black text-white shadow-[5px_5px_0_#fff] transition hover:translate-x-1 hover:translate-y-1 hover:shadow-none">GENERATE A COMBO <Zap size={18}/></a>
          </div>
          <div className="relative rotate-2 rounded-[2rem] border-[5px] border-black bg-[#c8f169] p-3 shadow-[12px_12px_0_#171717]">
            <div className="flex aspect-[4/3] flex-col justify-between overflow-hidden rounded-2xl bg-[radial-gradient(circle_at_70%_30%,#fff7a8,transparent_35%),linear-gradient(135deg,#8bd3dd,#f8b84e_55%,#f07819)] p-6">
              <div className="flex justify-between text-xs font-black tracking-widest"><span>SCOOTGEN / 001</span><span>RIDE LOUD</span></div>
              <div><div className="text-7xl">🛴</div><div className="mt-2 text-4xl font-black leading-none tracking-tighter">MAKE<br/>YOUR<br/>OWN LINE.</div></div>
              <div className="flex justify-between text-xs font-black"><span>STREET • PARK • FLAT</span><span>EST. 2026</span></div>
            </div>
          </div>
        </div>
      </section>

      <section id="generator" className="mx-auto max-w-7xl px-5 py-20">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4"><div><p className="font-black tracking-[.2em] text-[#ed7817]">01 / THE GOOD STUFF</p><h2 className="mt-2 text-4xl font-black tracking-tight md:text-6xl">COMBO GENERATOR<span className="text-[#ed7817]">.</span></h2></div><span className="rounded-full border-2 border-black px-4 py-2 text-xs font-black">NO TWO RUNS THE SAME</span></div>
        <div className="grid gap-6 lg:grid-cols-[.8fr_1.2fr]">
          <div className="rounded-[2rem] border-2 border-black bg-white p-6 shadow-[7px_7px_0_#171717]">
            <h3 className="mb-6 text-xl font-black">BUILD YOUR SESSION</h3>
            <label className="mb-2 block text-xs font-black tracking-widest">RIDING STYLE</label>
            <div className="mb-6 grid grid-cols-3 gap-2">{["Park","Street","Flat"].map(s=><button key={s} onClick={()=>setStyle(s)} className={`rounded-xl border-2 border-black px-3 py-3 text-sm font-black ${style===s?"bg-[#c8f169]":"bg-white hover:bg-orange-50"}`}>{s}</button>)}</div>
            <label className="mb-2 block text-xs font-black tracking-widest">DIFFICULTY</label>
            <select value={difficulty} onChange={e=>setDifficulty(e.target.value)} className="mb-6 w-full rounded-xl border-2 border-black bg-white p-3 font-bold"><option>Any</option>{levels.map(l=><option key={l}>{l}</option>)}</select>
            <div className="mb-2 flex justify-between text-xs font-black tracking-widest"><label>NUMBER OF TRICKS</label><span>{count}</span></div>
            <input aria-label="Number of tricks" type="range" min="2" max="8" value={count} onChange={e=>setCount(Number(e.target.value))} className="mb-8 w-full accent-[#ed7817]"/>
            <button onClick={generate} className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-black bg-[#ff9f1c] py-4 font-black shadow-[4px_4px_0_#171717] transition hover:translate-x-1 hover:translate-y-1 hover:shadow-none"><Shuffle size={18}/> GENERATE COMBO</button>
          </div>
          <div className="rounded-[2rem] border-2 border-black bg-[#171717] p-6 text-white shadow-[7px_7px_0_#ff9f1c] md:p-8">
            <div className="flex items-center justify-between"><span className="text-xs font-black tracking-[.2em] text-[#c8f169]">YOUR RANDOM LINE</span><span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold">{style.toUpperCase()}</span></div>
            <div className="my-8 flex flex-wrap items-center gap-3">{combo.map((t,i)=><div key={`${t.name}-${i}`} className="flex items-center gap-3"><div className="min-w-24 rounded-2xl bg-[#c8f169] px-4 py-5 text-center text-lg font-black text-black"><span className="mb-1 block text-[10px] tracking-widest">TRICK {i+1}</span>{t.name}</div>{i<combo.length-1&&<span className="text-2xl font-black text-[#ff9f1c]">→</span>}</div>)}</div>
            <div className="flex flex-wrap gap-2">{combo.map((t,i)=><span key={i} className="rounded-full border border-white/30 px-3 py-1 text-xs font-bold text-white/80">{t.level}</span>)}</div>
            <div className="mt-8 flex flex-wrap gap-3 border-t border-white/20 pt-6"><button onClick={saveCombo} className="flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-black text-black hover:bg-[#c8f169]"><Heart size={16}/> SAVE COMBO</button><button onClick={()=>navigator.clipboard?.writeText(comboText)} className="rounded-full border border-white/40 px-5 py-3 text-sm font-black hover:bg-white/10">COPY LINE</button></div>
            {saved.length>0&&<p className="mt-4 text-xs text-white/60">Saved this session: {saved.length} combo(s)</p>}
          </div>
        </div>
      </section>

      <section id="challenges" className="bg-[#c8f169] py-20">
        <div className="mx-auto max-w-7xl px-5"><div className="mb-10"><p className="font-black tracking-[.2em] text-[#42601c]">02 / LEVEL UP</p><h2 className="mt-2 text-4xl font-black tracking-tight md:text-6xl">TAKE THE CHALLENGE<span className="text-[#ed7817]">.</span></h2></div>
          <div className="grid gap-5 md:grid-cols-3">{challenges.map(c=><div key={c.title} className="rounded-[1.7rem] border-2 border-black bg-white p-6 shadow-[6px_6px_0_#171717]"><div className="flex items-center justify-between"><span className="rounded-full bg-[#ff9f1c] px-3 py-1 text-[10px] font-black tracking-widest">{c.tag}</span><span className="text-3xl">{c.icon}</span></div><h3 className="mt-6 text-2xl font-black">{c.title}</h3><p className="mt-2 min-h-12 text-sm font-medium text-black/65">{c.detail}</p><div className="mt-5 flex items-center justify-between"><span className="font-black text-[#e87512]">+{c.xp} XP</span><button disabled={completed.includes(c.title)} onClick={()=>completeChallenge(c)} className="rounded-full border-2 border-black bg-black px-4 py-2 text-xs font-black text-white hover:bg-[#ed7817] disabled:bg-[#c8f169] disabled:text-black">{completed.includes(c.title)?"COMPLETED":"CLAIM"}</button></div></div>)}</div>
          <p className="mt-6 text-sm font-bold">Note: Challenges are self-reported. Only claim a challenge after you've attempted it.</p>
        </div>
      </section>

      <section id="account" className="mx-auto grid max-w-7xl gap-10 px-5 py-20 md:grid-cols-2 md:items-center">
        <div><p className="font-black tracking-[.2em] text-[#ed7817]">03 / YOUR RIDER CARD</p><h2 className="mt-2 text-4xl font-black tracking-tight md:text-6xl">YOUR PROGRESS.<br/>YOUR STYLE.</h2><p className="mt-5 max-w-md font-semibold text-black/65">Create your free rider account to keep your XP, save your combos and collect challenge completions.</p>
          {user&&<div className="mt-8 rounded-2xl border-2 border-black bg-[#ff9f1c] p-5"><div className="flex items-center gap-3"><div className="rounded-full bg-black p-3 text-white"><UserRound/></div><div><p className="font-black">{profile?.username || user.email}</p><p className="text-sm font-bold">{rank}</p></div></div><div className="mt-5 flex items-center justify-between"><span className="font-black">TOTAL XP</span><span className="text-3xl font-black">{xp}</span></div><div className="mt-2 h-3 overflow-hidden rounded-full border border-black bg-white"><div className="h-full bg-black" style={{width:`${Math.min(100,xp%400/4)}%`}}/></div></div>}
        </div>
        <div className="rounded-[2rem] border-2 border-black bg-white p-7 shadow-[8px_8px_0_#ff9f1c]">
          {user ? <><div className="mb-5 flex items-center gap-2"><Trophy className="text-[#ed7817]"/><h3 className="text-2xl font-black">YOU'RE IN THE CREW</h3></div><p className="mb-5 text-sm font-medium">Your account is ready. Keep riding and stacking XP.</p><button onClick={()=>supabase?.auth.signOut()} className="rounded-full border-2 border-black px-5 py-3 text-sm font-black">SIGN OUT</button></> :
          <><h3 className="text-2xl font-black">{authMode==="signup"?"JOIN THE CREW":"WELCOME BACK"}</h3><p className="mb-6 mt-2 text-sm font-medium text-black/60">Create an account or sign in to save your progress.</p><div className="mb-5 grid grid-cols-2 rounded-xl border-2 border-black p-1"><button onClick={()=>setAuthMode("signup")} className={`rounded-lg py-2 text-sm font-black ${authMode==="signup"?"bg-[#c8f169]":""}`}>SIGN UP</button><button onClick={()=>setAuthMode("signin")} className={`rounded-lg py-2 text-sm font-black ${authMode==="signin"?"bg-[#c8f169]":""}`}>SIGN IN</button></div><label className="mb-2 block text-xs font-black tracking-widest">EMAIL</label><input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="rider@email.com" className="mb-4 w-full rounded-xl border-2 border-black p-3 font-semibold"/><label className="mb-2 block text-xs font-black tracking-widest">PASSWORD</label><input type="password" minLength={6} value={password} onChange={e=>setPassword(e.target.value)} placeholder="At least 6 characters" className="mb-5 w-full rounded-xl border-2 border-black p-3 font-semibold"/><button disabled={busy||!email||password.length<6} onClick={handleAuth} className="w-full rounded-xl border-2 border-black bg-[#ff9f1c] py-4 font-black shadow-[4px_4px_0_#171717] disabled:opacity-50">{busy?"PLEASE WAIT...":authMode==="signup"?"CREATE MY ACCOUNT":"SIGN IN"}</button>{authMessage&&<p className="mt-4 text-sm font-bold text-[#b45309]">{authMessage}</p>}</>}
          {!supabase&&<p className="mt-4 rounded-xl bg-orange-50 p-3 text-xs font-semibold text-orange-800">Developer setup required: connect a Supabase project to activate accounts and cloud saves.</p>}
        </div>
      </section>

      <section id="community" className="border-y-2 border-black bg-[#171717] px-5 py-14 text-center text-white"><div className="mx-auto max-w-3xl"><Star className="mx-auto mb-4 text-[#ff9f1c]" size={34}/><h2 className="text-4xl font-black md:text-5xl">ONE MORE TRY.</h2><p className="mt-3 font-semibold text-white/65">Find your line. Push your limits. Have fun doing it.</p></div></section>
      <footer className="flex flex-wrap items-center justify-between gap-3 px-5 py-7 text-xs font-black"><span>SCOOTGEN © 2026</span><span>BUILT FOR THE RIDE 🛴</span></footer>
    </main>
  );
}
