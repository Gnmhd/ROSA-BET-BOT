require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });
const API_KEY = process.env.ODDS_API_KEY;
const SPORT = "soccer";

client.on('messageCreate', async (msg) => {
  if (msg.author.bot) return;
  let ct = msg.content.toLowerCase();
  if (!ct.startsWith('!analyse') &&!ct.startsWith('!live')) return;
  let q = msg.content.split(' ').slice(1).join(' ');
  if (q.length < 2) return msg.reply("Usage:!analyse Liverpool");
  await msg.channel.sendTyping();
  try {
    let url = `https://api.the-odds-api.com/v4/sports/${SPORT}/odds/?regions=eu,uk&markets=h2h&oddsFormat=decimal&apiKey=${API_KEY}`;
    let res = await fetch(url);
    let raw = await res.json();
    if (!Array.isArray(raw)) {
      console.log(raw);
      return msg.reply("⚠️ API: " + (raw.message || "Plus de crédits"));
    }
    let m = raw.find(x => x.home_team.toLowerCase().includes(q.toLowerCase()) || x.away_team.toLowerCase().includes(q.toLowerCase()));
    if (!m) return msg.reply("Match non trouvé pour: " + q);

    let url2 = `https://api.the-odds-api.com/v4/sports/${SPORT}/scores/?daysFrom=1&apiKey=${API_KEY}`;
    let res2 = await fetch(url2);
    let raw2 = await res2.json();
    let scores = Array.isArray(raw2)? raw2 : [];
    let live = scores.find(s => s.id === m.id);
    let isLive = live &&!live.completed && live.scores;

    let hs="0", as="0";
    let minute=new Date(m.commence_time).toLocaleTimeString('fr-FR');
    if (isLive){
      let h=live.scores.find(s=>s.name===m.home_team);
      let a=live.scores.find(s=>s.name===m.away_team);
      hs=h?h.score:"0"; as=a?a.score:"0"; minute="LIVE";
    }

    let bm=m.bookmakers[0]?.markets[0]?.outcomes||[];
    let ho=parseFloat(bm.find(o=>o.name===m.home_team)?.price||2.5);
    let ao=parseFloat(bm.find(o=>o.name===m.away_team)?.price||2.5);

    let totalBut=(ho<1.7||ao<1.7)?"Over 2.5 (3 buts)":"Under 2.5";
    if(isLive){let t=parseInt(hs)+parseInt(as); totalBut=t<2?"Over 2.5 (encore "+(3-t)+" buts)":"Under 4.5";}

    let totalCorner=(ho<2||ao<2)?"Over 9.5 corners":"Over 8.5 corners";
    let gg=Math.abs(ho-ao)>2.5?"NG (NO)":"GG OUI (YES)";
    let exact=ao<1.6?"1-2":ho<1.6?"2-0":"1-1";
    if(isLive) exact=hs+"-"+(parseInt(as)+1)+" FINAL";

    let comp=""; let list=[];
    m.bookmakers.forEach(b=>{
      let o=b.markets[0].outcomes.find(x=>x.name===(ao<ho?m.away_team:m.home_team));
      if(o) list.push({n:b.title,p:o.price});
    });
    list.sort((a,b)=>a.p-b.p);
    list.slice(0,5).forEach((b,i)=>{
      comp+=(i==0?"🥇":i==1?"🥈":"▫️")+" "+b.n+" @"+b.p+(i==0?" MEILLEURE\n":"\n");
    });

    let embed=new EmbedBuilder()
   .setTitle((isLive?"🔴 LIVE: ":"📊 DU JOUR: ")+m.home_team+" vs "+m.away_team+(isLive?" "+hs+"-"+as:""))
   .setDescription("**"+minute+"**")
   .setColor(isLive?0xFF0000:0xFFD700)
   .addFields(
      {name:"⚽ TOTAL BUT",value:totalBut,inline:false},
      {name:"🚩 TOTAL CORNER",value:totalCorner,inline:false},
      {name:"🥅 GG/NG",value:gg,inline:false},
      {name:"🏁 SCORE EXACT",value:exact,inline:false},
      {name:"📊 BOOKMAKERS",value:comp||"Pinnacle @1.28",inline:false}
    )
   .setFooter({text:"ROSA-BET V11.1a LIVE DU JOUR"});
    msg.reply({embeds:[embed]});
  } catch(e){ console.log(e); msg.reply("Erreur: "+e.message); }
});

client.once('ready',()=>{console.log("ROSA V11.1a ONLINE "+client.user.tag);});
client.login(process.env.DISCORD_TOKEN);
