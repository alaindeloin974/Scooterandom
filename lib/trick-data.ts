export type Difficulty = "Easy" | "Medium" | "Hard" | "Impossible";
export type Obstacle = "Rail" | "Ledge" | "Ramp" | "Manual Pad" | "Pyramid" | "Funbox";
export type Stage = { type: string; trick: string };

export const approach = ["No trick","Fakie","Wiskas","X-up ride","Switch","Tap","Nollie","Fakie Manual","Fakie Nose Manual"];
export const rotations = ["No trick","180° Frontside","180° Backside","360° Backside","360° Frontside"];
export const scooter = ["No trick","Bar","Tailwhip","X-up","No hand","Tabletop","Lookback","Tail grab","Double Barspin","Nothing","Banihana","Double Whip","Double Heel","Fullwhip","Full Heel","Finger","Fingerheel","Briwhip","Rotorwhip","Rotor Heel","Fulltwist","Frontbri","Inward","Fullheeltwist","Rotortwist","Rotorheeltwist"];
export const railGrinds = ["BS Board","FS Board","FS 50","BS 50","FS Lip","BS Lip","Predator","FS Predator","Icepick","BS Overcrook","FS Icepick","FS Overcrook","Over 50","Over FS 50","BSCrook","FSCrook","Blunt","Backside Blunt","Over Ice","Over FS Ice"];
export const ledgeGrinds = ["Feeble","FS Feeble","Smith","FS Smith","BS Board","FS Board","FS 50","BS 50","FS Lip","BS Lip","Icepick","BS Overcrook","FS Icepick","FS Overcrook","Blunt","Backside Blunt","Wiskas Backside Feeble","Wiskas Frontside Feeble","Over Ice","Over FS Ice"];
export const manualRides = ["Manual","Nose Manual","Wiskas","X-up Ride","No Hand Ride"];
export const manualScooter = ["Bar","Tailwhip","X-up","No hand","Tabletop","Lookback","Tail grab","Double Barspin","Nothing","Bani(h)ana","Double Whip","Double Heel","Fullwhip","Full Heel","Finger","Fingerheel","Briwhip","Rotorwhip","Rotor Heel","Fulltwist","Whip Rewind","Heel Rewind","Frontbri","Inward","Buttercup","FS Buttercup","Fullheeltwist","Rotortwist","Rotorheeltwist","Flair","Backflip to Fakie"];

const difficultyWindow: Record<Difficulty,[number,number]> = {
  Easy:[0,0.42], Medium:[0.12,0.68], Hard:[0.38,0.88], Impossible:[0.62,1]
};
function weightedPick(list:string[], difficulty:Difficulty):string {
  if (!list.length) return "No trick";
  const [low,high]=difficultyWindow[difficulty];
  const start=Math.min(list.length-1,Math.floor(low*list.length));
  const end=Math.max(start,Math.min(list.length-1,Math.ceil(high*list.length)-1));
  const eligible=list.slice(start,end+1);
  // Bias toward the easier end of the eligible band; Impossible naturally starts near the hardest tricks.
  const weights=eligible.map((_,i)=>Math.pow(0.72,i));
  const total=weights.reduce((a,b)=>a+b,0);
  let roll=Math.random()*total;
  for(let i=0;i<eligible.length;i++){roll-=weights[i];if(roll<=0)return eligible[i];}
  return eligible[eligible.length-1];
}
const pick=(list:string[],d:Difficulty)=>weightedPick(list,d);
const rand=(min:number,max:number)=>Math.floor(Math.random()*(max-min+1))+min;
const add=(out:Stage[],type:string,trick:string)=>out.push({type,trick});

export function generateCombo(obstacle:Obstacle,difficulty:Difficulty,squareRail=false):Stage[] {
  const out:Stage[]=[];
  const a=()=>pick(approach,difficulty);
  const r=()=>pick(rotations,difficulty);
  const s=()=>pick(obstacle==="Manual Pad"?manualScooter:scooter,difficulty);
  if(obstacle==="Ramp"||obstacle==="Pyramid"||obstacle==="Funbox"){
    if(Math.random()<0.65)add(out,"Approach",a());
    if(obstacle==="Ramp"){
      const rotation=Math.random()<0.9?(Math.random()<0.5?"180° Frontside":"180° Backside"):pick(rotations.slice(0,1).concat(rotations.slice(3)),difficulty);
      if(rotation!=="No trick")add(out,"Rotation",rotation);
    } else {
      const rotation=pick(rotations,difficulty);
      if(rotation!=="No trick")add(out,"Rotation",rotation);
    }
    const aerialRange:Record<Difficulty,[number,number]>={Easy:[1,2],Medium:[1,3],Hard:[2,4],Impossible:[3,5]};\n    const [minAerial,maxAerial]=aerialRange[difficulty];\n    const aerialCount=rand(minAerial,maxAerial);
    for(let i=0;i<aerialCount && out.length<5;i++)add(out,"Aerial trick",s());
    return out.slice(0,5);
  }
  add(out,"Approach",a());
  add(out,"Rotation",r());
  add(out,"Scooter trick",s());
  const target=rand(5,9);
  if(obstacle==="Manual Pad"){
    add(out,"Manual pad",pick(manualRides,difficulty));
    while(out.length<target){
      if(Math.random()<0.58)add(out,"Manual pad",pick(manualRides,difficulty));
      else add(out,"Exit trick",Math.random()<0.5?r():s());
    }
  } else {
    const grinds=obstacle==="Rail"?(squareRail?railGrinds:railGrinds.filter(x=>x!=="Blunt"&&x!=="Backside Blunt")):ledgeGrinds;
    add(out,obstacle==="Rail"?"Rail grind":"Ledge grind",pick(grinds,difficulty));
    while(out.length<target){
      const remaining=target-out.length;
      if(remaining===1 || Math.random()<0.48)add(out,"Exit trick",Math.random()<0.5?r():s());
      else add(out,obstacle==="Rail"?"Rail grind":"Ledge grind",pick(grinds,difficulty));
    }
  }
  return out;
}
