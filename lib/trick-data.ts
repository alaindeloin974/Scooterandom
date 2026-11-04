export type Difficulty = "Easy" | "Medium" | "Hard" | "Impossible";
export type Obstacle = "Rail" | "Ledge" | "Ramp" | "Manual Pad" | "Pyramid" | "Funbox";
export type Stage = { type: string; trick: string };

export const approach = ["No trick","Fakie","Wiskas","X-up ride","Switch","Tap","Nollie","Fakie Manual","Fakie Nose Manual"];
export const rotations = ["No trick","180° Frontside","180° Backside","360° Backside","360° Frontside"];
export const scooter = ["No trick","Bar","Tailwhip","X-up","No hand","Tabletop","Lookback","Tail grab","Double Barspin","Nothing","Banihana","Double Whip","Double Heel","Fullwhip","Full Heel","Finger","Fingerheel","Briwhip","Rotorwhip","Rotor Heel","Fulltwist","Frontbri","Inward","Fullheeltwist","Rotortwist","Rotorheeltwist"];
export const railApproach = ["No trick","Fakie","wiskas","x up ride","switch","tap","nollie","Fakie Manual","fakie nose many"];
export const railRotations = ["No trick","180° Backside","180° Frontside","270 fs","270 bs","360° back side","360 fronside"];
export const railScooter = ["no trick","Bar","Tailwhip","heelwhip","x up","no hand","tabletop","lookback","turndown","tail grab","Double Barspin","nothing","banihana","Double Whip","double heel","bartwist","Fullwhip","full heel","finger","fingerheel","briwhip","untwist","rotorwhip","rotor heel","fulltwist","frontbri","inward","fullheeltwist","rotortwist","rotorheeltwist","finger rotor twist","finger rotor heeltwist"];
export const railGrinds = ["bs board","fs board","fs 50","bs 50","fs lip","bs lip","feebzer","fs feebzer","fs lipzer","bs lipzer","predator","fs predator","icepick","bs overcrook","fs icepick","fs overcrook","over 50","over fs 50","fs nosegrind","bs nosegrind","bscrook","fscrook","blunt","backside blunt","over ice","over fs ice"];
export const ledgeGrinds = ["Feeble","FS Feeble","Smith","FS Smith","BS Board","FS Board","FS 50","BS 50","FS Lip","BS Lip","Icepick","BS Overcrook","FS Icepick","FS Overcrook","Blunt","Backside Blunt","Wiskas Backside Feeble","Wiskas Frontside Feeble","Over Ice","Over FS Ice"];
export const manualRides = ["Manual","Nose Manual","Wiskas","X-up Ride","No Hand Ride"];
export const manualScooter = ["Bar","Tailwhip","X-up","No hand","Tabletop","Lookback","Tail grab","Double Barspin","Nothing","Banihana","Double Whip","Double Heel","Fullwhip","Full Heel","Finger","Fingerheel","Briwhip","Rotorwhip","Rotor Heel","Fulltwist","Whip Rewind","Heel Rewind","Frontbri","Inward","Buttercup","FS Buttercup","Fullheeltwist","Rotortwist","Rotorheeltwist","Flair","Backflip to Fakie"];

const difficultyWindow: Record<Difficulty,[number,number]> = {
  Easy:[0,0.3], Medium:[0.12,0.68], Hard:[0.38,0.88], Impossible:[0.62,1]
};
function weightedPick(list:string[], difficulty:Difficulty):string {
  if (!list.length) return "No trick";
  const [low,high]=difficultyWindow[difficulty];
  const start=Math.min(list.length-1,Math.floor(low*list.length));
  const end=Math.max(start,Math.min(list.length-1,Math.ceil(high*list.length)-1));
  const eligible=list.slice(start,end+1);
  const weights=eligible.map((_,i)=>Math.pow(0.72,i));
  const total=weights.reduce((a,b)=>a+b,0);
  let roll=Math.random()*total;
  for(let i=0;i<eligible.length;i++){roll-=weights[i];if(roll<=0)return eligible[i];}
  return eligible[eligible.length-1];
}
const pick=(list:string[],d:Difficulty)=>weightedPick(list,d);
const rand=(min:number,max:number)=>Math.floor(Math.random()*(max-min+1))+min;
const comboLength:Record<Difficulty,[number,number]> = {
  Easy:[3,5], Medium:[4,6], Hard:[5,7], Impossible:[6,9]
};
const add=(out:Stage[],type:string,trick:string)=>{if(trick.toLowerCase()!=="no trick")out.push({type,trick});};
const addExit=(out:Stage[],d:Difficulty,obstacle:Obstacle)=> {
  const candidate=Math.random()<0.5?pick(rotations,d):pick(obstacle==="Manual Pad"?manualScooter:scooter,d);
  if(candidate.toLowerCase()!=="no trick")add(out,"Exit trick",candidate);
};
const addRailExit=(out:Stage[],d:Difficulty)=> {
  const candidate=Math.random()<0.5?pick(railRotations,d):pick(railScooter,d);
  if(candidate.toLowerCase()!=="no trick")add(out,"Exit trick",candidate);
};

export function generateCombo(obstacle:Obstacle,difficulty:Difficulty,squareRail=false):Stage[] {
  const out:Stage[]=[];
  const a=()=>pick(approach,difficulty);
  const r=()=>pick(rotations,difficulty);
  const s=()=>pick(obstacle==="Manual Pad"?manualScooter:scooter,difficulty);
  if(obstacle==="Ramp"||obstacle==="Pyramid"||obstacle==="Funbox"){
    if(Math.random()<0.65)add(out,"Approach",a());
    if(obstacle==="Ramp"){
      const rotation=Math.random()<0.9?(Math.random()<0.5?"180° Frontside":"180° Backside"):pick(rotations.slice(0,1).concat(rotations.slice(3)),difficulty);
      add(out,"Rotation",rotation);
    } else add(out,"Rotation",r());
    const aerialRange:Record<Difficulty,[number,number]>={Easy:[1,2],Medium:[1,3],Hard:[2,4],Impossible:[3,5]};
    const [minAerial,maxAerial]=aerialRange[difficulty];
    const aerialCount=rand(minAerial,maxAerial);
    for(let i=0;i<aerialCount&&out.length<5;i++)add(out,"Aerial trick",s());
    return out.slice(0,5);
  }
  if(obstacle==="Manual Pad"){
    add(out,"Approach",a());add(out,"Rotation",r());add(out,"Scooter trick",s());
    const [minLength,maxLength]=comboLength[difficulty];
    const target=rand(minLength,maxLength);
    add(out,"Manual pad",pick(manualRides,difficulty));
    let previousRide="";
    while(out.length<target){
      if(Math.random()<0.58){
        const choices=manualRides.filter(x=>x!==previousRide);
        const ride=pick(choices,difficulty);add(out,"Manual pad",ride);previousRide=ride;
      } else addExit(out,difficulty,obstacle);
    }
    return out;
  }
  const [minLength,maxLength]=comboLength[difficulty];
  const target=rand(minLength,maxLength);
  if(obstacle==="Rail"){
    // Rail combos are about 30% shorter; trick selection and difficulty weighting stay unchanged.
    const railMin=Math.max(1,Math.round(minLength*0.7));
    const railMax=Math.max(railMin,Math.round(maxLength*0.7));
    const railTarget=rand(railMin,railMax);
    const grinds=squareRail?railGrinds:railGrinds.filter(x=>x!=="blunt"&&x!=="backside blunt");
    let selectedRotation="No trick";
    if(out.length<railTarget-1&&Math.random()<0.5)add(out,"Approach",pick(railApproach,difficulty));
    if(out.length<railTarget-1&&Math.random()<0.5){
      selectedRotation=pick(railRotations,difficulty);
      add(out,"Rotation",selectedRotation);
    }
    if(out.length<railTarget-1&&Math.random()<0.5)add(out,"Scooter trick",pick(railScooter,difficulty));
    const restricted=["bs lip","fs lip","bs board","fs board"];
    const rotationGrinds=selectedRotation==="270 fs"||selectedRotation==="270 bs"?grinds.filter(x=>restricted.includes(x)):grinds;
    const nextGrinds=(previous:string)=> {
      let allowed=rotationGrinds;
      if(previous==="bs board") allowed=allowed.filter(x=>!x.includes("lip")&&x!=="fs board");
      if(previous==="bs lip"||previous==="fs lip") allowed=allowed.filter(x=>x!=="fs board"&&x!=="bs board"&&x!=="bs lipzer");
      if(previous==="180° Frontside") allowed=allowed.filter(x=>x!=="bs board");
      if(previous==="180° Backside") allowed=allowed.filter(x=>x!=="fs board");
      if(previous==="fs 50") allowed=allowed.filter(x=>x!=="bs board");
      if(previous==="fs board") allowed=allowed.filter(x=>x!=="bs lip"&&x!=="bs lipzer");
      return allowed;
    };
    const firstGrindOptions=nextGrinds(selectedRotation);
    let previousGrind=pick(firstGrindOptions.length?firstGrindOptions:rotationGrinds,difficulty);
    add(out,"Rail grind",previousGrind);
    while(out.length<railTarget){
      if(Math.random()<0.45){
        const before=out.length;
        addRailExit(out,difficulty);
        if(out.length===before){
          const available=nextGrinds(previousGrind).filter(x=>x!==previousGrind);
          previousGrind=pick(available.length?available:rotationGrinds,difficulty);
          add(out,"Rail grind",previousGrind);
        }
      } else {
        const available=nextGrinds(previousGrind).filter(x=>x!==previousGrind);
        previousGrind=pick(available.length?available:rotationGrinds,difficulty);
        add(out,"Rail grind",previousGrind);
      }
    }
    return out;
  }
  const grinds=ledgeGrinds;
  add(out,"Approach",a());add(out,"Rotation",r());add(out,"Scooter trick",s());
  let previousGrind="";
  while(out.length<target){
    const remaining=target-out.length;
    if(remaining===1||Math.random()<0.48)addExit(out,difficulty,obstacle);
    else {
      const available=grinds.filter(x=>x!==previousGrind);
      const grind=pick(available,difficulty);
      add(out,"Ledge grind",grind);
      previousGrind=grind;
    }
  }
  return out;
}
