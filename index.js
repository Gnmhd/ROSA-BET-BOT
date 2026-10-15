const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });
const KEY = process.env.ODDS_API_KEY;
const LEAGUES = ["soccer_germany_bundesliga","soccer_spain_la_liga","soccer_epl","soccer_france_ligue_one"];
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
 let txt = m.content.toLowerCase();
 if(!txt.startsWith('!analyse') &&!txt.startsWith('!analyze') &&!txt.startsWith('!analyse') &&!txt.startsWith('!matchs') &&!txt.startsWith('!live')) return;
 await m.channel.sendTyping();
 try{
  let all=await getMatches();
  if(!Array.isArray(all)) return m.reply("⚠️ API: "+(all.message||JSON.stringify(all).slice(0,150)));

  if(txt.startsWith('!matchs') || txt.startsWith('!live')){
   if(all.length==0) return m.reply("0 match aujourd'hui - crédits épuisés ou pas de matchs");
   let list=all.slice(0,15).map(x=>`⚽ **${x.home_team} vs ${x.away_team}** - ${new Date(x.commence_time).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})}`).join('\n');
   let embed=new EmbedBuilder().setTitle(`📅 MATCHS EN TEMPS RÉEL DU JOUR (${all.length})`).setDescription(list).setColor(0x00FF00).setFooter({text:"Fais!analyse Dortmund"});
   return m.reply({embeds:[embed]});
  }

  let q=m.content.split(' ').slice(1).join(' ').trim().toLowerCase();
  let match=all.find(x=>x.home_team.toLowerCase().includes(q)||x.away_team.toLowerCase().includes(q));
  if(!match){
   let dispo=all.slice(0,5).map(x=>`• ${x.home_team} vs ${x.away_team}`).join('\n');
   return m.reply(`Match non trouvé: **${q}**\nDispo:\n${dispo}\nFais!matchs`);
  }

  let bms=match.bookmakers||[];
  let outs=bms[0]?.markets[0]?.outcomes||[];
  let ho=parseFloat(outs.find(o=>o.name===match.home_team)?.price||2.2);
  let ao=parseFloat(outs.find(o=>o.name===match.away_team)?.price||2.2);

  let totalBut=ho<1.7||ao<1.7?"**Over 2.5** 🔥 Favori écrase":"**Under 2.5** 🛡️ Serré";
  let totalCorn=Math.abs(ho-ao)>1.5?"**Over 9.5 corners** 🚩 Domination":"**Over 8.5 corners** 🚩";
  let gg=Math.abs(ho-ao)<0.9?"**GG OUI (YES)** 🥅 Les 2 marquent":"**NG (NO)** 🥅 Clean sheet";
  let score=ao<1.8?"**0-2** ou **1-2**":"**2-0** ou **2-1**";
  if(ho>2.5 && ao>2.5) score="**1-1**";

  let fav=ho<ao?match.home_team:match.away_team;
  let list=[];
  bms.forEach(b=>{let o=b.markets[0].outcomes.find(x=>x.name===fav); if(o) list.push({n:b.title,p:o.price});});
  list.sort((a,b)=>a.p-b.p);
  let comp=list.slice(0,5).map((x,i)=>`${i==0?'🥇':i==1?'🥈':'▫️'} ${x.n} @${x.p}${i==0?' MEILLEURE':''}`).join('\n');

  let embed=new EmbedBuilder()
 .setTitle(`📊 DU JOUR: ${match.home_team} vs ${match.away_team}`)
 .setDescription(`${new Date(match.commence_time).toLocaleString('fr-FR')} - ${match.sport_title}\n**Match en temps réel du jour**`)
 .setColor(0xFFD700)
 .addFields(
    {name:"⚽ TOTAL BUT (under or over)", value:totalBut, inline:false},
    {name:"🚩 TOTAL CORNER (under or over)", value:totalCorn, inline:false},
    {name:"🥅 GG ou NG", value:gg, inline:false},
    {name:"🏁 SCORE EXACT", value:score, inline:false},
    {name:"📊 COMPARÉ BOOKMAKERS", value:comp||"Pinnacle @1.85", inline:false}
  )
 .setFooter({text:"ROSA-BET V12 FINAL - 5 FONCTIONS"});
  m.reply({embeds:[embed]});
 }catch(e){ m.reply("Erreur: "+e.message); }
});

client.once('ready', ()=>console.log("ROSA V12 FINAL ONLINE"));
client.login(process.env.DISCORD_TOKEN);
