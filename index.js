const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const client = new Client({ intents: [32811] });
const KEY = process.env.ODDS_API_KEY;
const LEAGUES = ["soccer_epl","soccer_spain_la_liga","soccer_france_ligue_one"];
let CACHE = { d: [], t: 0 };

async function getMatches(){
 if(Date.now()-CACHE.t < 600000 && CACHE.d.length>0) return CACHE.d;
 let all=[];
 for(let lg of LEAGUES){
  try{
   let url=`https://api.the-odds-api.com/v4/sports/${lg}/odds/?regions=eu,uk&markets=h2h&oddsFormat=decimal&apiKey=${KEY}`;
   let r=await fetch(url); let j=await r.json();
   if(Array.isArray(j)) all.push(...j);
  }catch(e){}
 }
 CACHE={d:all, t:Date.now()}; return all;
}

client.on('messageCreate', async m=>{
 if(m.author.bot) return;
 let c=m.content.toLowerCase();
 if(!c.startsWith('!analyse') &&!c.startsWith('!matchs') &&!c.startsWith('!live')) return;
 await m.channel.sendTyping();
 try{
  let all=await getMatches();
  if(!Array.isArray(all)) return m.reply("API Error: "+JSON.stringify(all).slice(0,100));
  if(c.startsWith('!matchs')||c.startsWith('!live')){
   if(all.length==0) return m.reply("0 match aujourd'hui");
   let txt=all.slice(0,12).map(x=>`• ${x.home_team} vs ${x.away_team}`).join('\n');
   return m.reply("**📅 MATCHS EN TEMPS RÉEL DU JOUR:**\n"+txt+"\n\nFais `!analyse Liverpool`");
  }
  let q=m.content.split(' ').slice(1).join(' ').toLowerCase();
  if(q.length<2) return m.reply("Usage:!analyse Liverpool");
  let match=all.find(x=>x.home_team.toLowerCase().includes(q)||x.away_team.toLowerCase().includes(q));
  if(!match) return m.reply(`Non trouvé: ${q}\nFais!matchs`);

  let bms=match.bookmakers||[];
  let outs=bms[0]?.markets[0]?.outcomes||[];
  let ho=parseFloat(outs.find(o=>o.name===match.home_team)?.price||2.2);
  let ao=parseFloat(outs.find(o=>o.name===match.away_team)?.price||2.2);

  let totalBut=ho<1.7||ao<1.7?"Over 2.5 🔥":"Under 2.5 🛡️";
  let totalCorn=Math.abs(ho-ao)>1.5?"Over 9.5 corners 🚩":"Over 8.5 corners 🚩";
  let gg=Math.abs(ho-ao)<0.8?"GG OUI 🥅":"NG 🥅";
  let score=ao<1.8?"0-2":ho<1.8?"2-0":"1-1";

  let fav=ho<ao?match.home_team:match.away_team;
  let list=[];
  bms.forEach(b=>{let o=b.markets[0].outcomes.find(x=>x.name===fav); if(o) list.push({n:b.title,p:o.price});});
  list.sort((a,b)=>a.p-b.p);
  let comp=list.slice(0,5).map((x,i)=>`${i==0?'🥇':i==1?'🥈':'▫️'} ${x.n} @${x.p}`).join('\n');

  let embed=new EmbedBuilder()
  .setTitle(`📊 ${match.home_team} vs ${match.away_team}`)
  .setDescription(new Date(match.commence_time).toLocaleString('fr-FR')+" - "+match.sport_title)
  .setColor(0xFFD700)
  .addFields(
    {name:"⚽ TOTAL BUT", value:totalBut, inline:false},
    {name:"🚩 TOTAL CORNER", value:totalCorn, inline:false},
    {name:"🥅 GG ou NG", value:gg, inline:false},
    {name:"🏁 SCORE EXACT", value:score, inline:false},
    {name:"📊 COMPARÉ BOOKMAKERS", value:comp||"Pinnacle @1.85", inline:false}
   )
  .setFooter({text:"ROSA-BET V12 FINAL"});
  m.reply({embeds:[embed]});
 }catch(e){ m.reply("Erreur: "+e.message); }
});

client.once('ready',()=>console.log("ROSA V12 ONLINE"));
client.login(process.env.DISCORD_TOKEN);
