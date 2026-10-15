const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

const API_KEY = process.env.ODDS_API_KEY;
const LEAGUES = ["soccer_epl","soccer_spain_la_liga","soccer_uefa_champs_league","soccer_france_ligue_one","soccer_germany_bundesliga"];
let CACHE = { data: [], time: 0 };

async function getAllMatches() {
  // Cache 10 minutes pour ne pas brûler les 500 crédits
  if (Date.now() - CACHE.time < 10*60*1000 && CACHE.data.length>0) return CACHE.data;
  let all=[];
  for(let lg of LEAGUES){
    try{
      let url=`https://api.the-odds-api.com/v4/sports/${lg}/odds/?regions=eu,uk&markets=h2h&oddsFormat=decimal&apiKey=${API_KEY}`;
      let r=await fetch(url); let d=await r.json();
      if(Array.isArray(d)) all.push(...d);
    }catch(e){}
  }
  CACHE={data:all, time:Date.now()};
  return all;
}

function analyseOdds(match){
  let bm = match.bookmakers[0]?.markets[0]?.outcomes || [];
  let homeOdd = parseFloat(bm.find(o=>o.name===match.home_team)?.price||2.5);
  let awayOdd = parseFloat(bm.find(o=>o.name===match.away_team)?.price||2.5);
  let drawOdd = parseFloat(bm.find(o=>o.name==="Draw")?.price||3.2);

  // 1. TOTAL BUT
  let totalBut = "";
  if(homeOdd<1.60 || awayOdd<1.60) totalBut="**Over 2.5** 🔥 (Favori fort = beaucoup de buts)";
  else if(drawOdd<3.0) totalBut="**Under 2.5** 🛡️ (Match serré)";
  else totalBut="**Over 2.5** ⚽";

  // 2. TOTAL CORNER
  let totalCorner = "";
  if(Math.abs(homeOdd-awayOdd)>2) totalCorner="**Over 9.5 corners** 🚩 (Domination à domicile/extérieur)";
  else totalCorner="**Over 8.5 corners** 🚩";

  // 3. GG / NG
  let gg = "";
  if(Math.abs(homeOdd-awayOdd)<0.8 && homeOdd<2.8 && awayOdd<2.8) gg="**GG OUI (YES)** 🥅 - Les 2 équipes marquent";
  else if(homeOdd<1.70 || awayOdd<1.70) gg="**NG (NO)** 🥅 - Clean sheet probable";
  else gg="**GG OUI (YES)**";

  // 4. SCORE EXACT
  let score="";
  if(awayOdd<1.80) score="**0-2** ou **1-2** (Victoire extérieur)";
  else if(homeOdd<1.80) score="**2-0** ou **2-1** (Victoire domicile)";
  else score="**1-1** ou **1-0**";

  // 5. COMPARÉ BOOKMAKERS
  let favTeam = homeOdd<awayOdd? match.home_team : match.away_team;
  let compList=[];
  match.bookmakers.forEach(b=>{
    let o=b.markets[0].outcomes.find(x=>x.name===favTeam);
    if(o) compList.push({book:b.title, cote:o.price});
  });
  compList.sort((a,b)=>a.cote-b.cote);
  let compText = compList.slice(0,5).map((b,i)=>`${
