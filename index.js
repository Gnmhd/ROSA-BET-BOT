require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });
const API_KEY = process.env.ODDS_API_KEY;
const LEAGUES = ["soccer_epl","soccer_spain_la_liga","soccer_uefa_champs_league","soccer_uefa_europa_league","soccer_france_ligue_one","soccer_germany_bundesliga","soccer_italy_serie_a"];

client.on('messageCreate', async (msg) => {
  if (msg.author.bot) return;
  let ct = msg.content.toLowerCase();
  if (!ct.startsWith('!analyse') &&!ct.startsWith('!live') &&!ct.startsWith('!matchs') &&!ct.startsWith('!prono')) return;

  if (ct.startsWith('!matchs') || ct.startsWith('!prono')) {
    await msg.channel.sendTyping();
    try{
      let all=[];
      for(let lg of LEAGUES.slice(0,3)){
        let url = `https://api.the-odds-api.com/v4/sports/${lg}/odds/?regions=eu,uk&markets=h2h&oddsFormat=decimal&apiKey=${API_KEY}`;
        let res=await fetch(url); let raw=await res.json();
        if(Array.isArray(raw)) all.push(...raw.slice(0,5));
      }
      if(all.length==0) return msg.reply("Aucun match dispo aujourd'hui (0 crédits ou pas de matchs)");
      let list = all.map(m=>`• ${m.home_team} vs ${m.away_team}`).join('\n');
      return msg.reply("**📅 MATCHS DU JOUR:**\n"+list+"\n\nFais `!analyse Liverpool`");
    }catch(e){ return msg.reply("Erreur!matchs: "+e.message); }
  }

  let q = msg.content.split(' ').slice(1).join(' ');
  if (q.length < 2) return msg.reply("Usage:!analyse Liverpool");
  await msg.channel.sendTyping();
  try {
    let found=null;
    for(let lg of LEAGUES){
      let url = `https://api.the-odds-api.com/v4/sports/${lg}/odds/?regions=eu,uk&markets=h2h&oddsFormat=decimal&apiKey=${API_KEY}`;
      let res = await fetch(url);
      let raw = await res.json();
      if (!Array.isArray(raw)) { console.log(lg+" =>",raw); continue; }
      let m = raw.find(x => x.home_team.toLowerCase().includes(q.toLowerCase()) || x.away_team.toLowerCase().includes(q.toLowerCase()));
      if(m){ found=m; break; }
    }
    if (!found) return msg.reply("Match non trouvé pour: "+q+"\nFais `!matchs` pour voir les matchs du jour");

    let m=found;
    let bm=m.bookmakers[0]?.markets[0]?.outcomes||[];
    let ho=parseFloat(bm.find(o=>o.name===m.home_team)?.price||2.5);
    let ao=parseFloat(bm.find(o=>o.name===m.away_team)?.price||2.5);

    let totalBut=(ho<1.7||ao<1.7)?"Over 2.5 (3 buts)":"Under 2.5";
    let totalCorner=(ho<2||ao<2)?"Over 9.5 corners":"Over 8.5 corners";
    let gg=Math.abs(ho-ao)>2.5?"NG (NO)":"GG OUI (YES)";
    let exact=ao<1.6?"1-2":ho<1.6?"2-0":"1-1";
    let comp=""; let list=[];
    m.bookmakers.forEach(b=>{let o=b.markets[0].outcomes.find(x=>x.name===(ao<ho?m.away_team:m.home_team)); if(o) list.push({n:b.title,p:o.price});});
    list.sort((a,b)=>a.p-b.p);
    list.slice(0,5).forEach((b,i)=>{comp+=(i==0?"🥇":i==1?"🥈":"▫️")+" "+b.n+" @"+b.p+(i==0?" MEILLEURE\n":"\n");});

    let embed=new EmbedBuilder()
  .setTitle("📊 DU JOUR: "+m.home_team+" vs "+m.away_team)
  .setDescription("**"+new Date(m.commence_time).toLocaleString('fr-FR')+"** - "+m.sport_title)
  .setColor(0xFFD700)
  .addFields(
      {name:"⚽ TOTAL BUT",value:totalBut,inline:false},
      {name:"🚩 TOTAL CORNER",value:totalCorner,inline:false},
      {name:"🥅 GG/NG",value:gg,inline:false},
      {name:"🏁 SCORE EXACT",value:exact,inline:false},
      {name:"📊 BOOKMAKERS",value:comp||"Pinnacle @1.28",inline:false}
    )
  .setFooter({text:"ROSA-BET V11.2 MULTI-LIGUES"});
    msg.reply({embeds:[embed]});
  } catch(e){ console.log(e); msg.reply("Erreur: "+e.message); }
});

client.once('ready',()=>{console.log("ROSA V11.2 ONLINE "+client.user.tag);});
client.login(process.env.DISCORD_TOKEN);
