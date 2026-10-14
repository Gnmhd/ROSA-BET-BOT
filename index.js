const http = require('http');
http.createServer((req,res)=>{res.writeHead(200);res.end("Live");}).listen(process.env.PORT || 10000, ()=>console.log("HTTP OK"));

const { Client, GatewayIntentBits } = require('discord.js');
const token = process.env.TOKEN? process.env.TOKEN.trim() : "";
const FOOTBALL_KEY = process.env.FOOTBALL_KEY? process.env.FOOTBALL_KEY.trim() : "";
console.log("TOKEN len:", token.length, "FOOTBALL_KEY len:", FOOTBALL_KEY.length);

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

async function getVraisMatchs() {
  try {
    const today = new Date().toISOString().split('T')[0]; // 2026-05-13
    const res = await fetch(`https://v3.football.api-sports.io/fixtures?date=${today}&status=NS`, {
      headers: { "x-apisports-key": FOOTBALL_KEY }
    });
    const data = await res.json();
    console.log("API matchs trouvés:", data.results);

    if(!data.response || data.response.length === 0) return null;

    // prend 3 matchs au hasard parmi les matchs du jour
    const shuffled = data.response.sort(()=>0.5-Math.random()).slice(0,3);
    return shuffled.map(f => ({
      match: `${f.teams.home.name} vs ${f.teams.away.name}`,
      league: f.league.name,
      heure: new Date(f.fixture.date).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'}),
      prono: f.teams.home.name + " ou Nul", // tu peux changer la logique ici
      cote: (1.50 + Math.random()*0.5).toFixed(2) // cote simulée car API cotes est payante
    }));
  } catch(e) {
    console.log("API ERROR", e.message);
    return null;
  }
}

async function genererCouponReel() {
  const matchs = await getVraisMatchs();

  if(!matchs) {
    return "⚠️ Pas de matchs aujourd'hui dans l'API, ou clé invalide.\nVérifie FOOTBALL_KEY sur Railway.\n\nEn attendant, utilise les pronos manuels.";
  }

  const coteTotale = matchs.reduce((a,m)=>a*parseFloat(m.cote),1).toFixed(2);
  let txt = `🔥 **ROSA-BET - VRAIS MATCHS DU JOUR** 🔥\n*Source: API-Football Live*\n\n`;
  matchs.forEach((m,i)=>{
    txt+=`**${i+1}. ${m.match}** (${m.league} - ${m.heure})\n> ${m.prono} @${m.cote}\n`;
  });
  txt+=`\n💰 **Cote Totale: ${coteTotale}**\n\n💎 **VIP** WhatsApp +228 96 35 22 13`;
  return txt;
}

client.once('ready', () => console.log(`READY ${client.user.tag}`));

client.on('messageCreate', async m => {
  if(m.author.bot) return;
  if(m.content.toLowerCase().includes('!coupon') || m.content.toLowerCase().includes('!prono')) {
    m.channel.send("⏳ Je récupère les vrais matchs du jour...");
    const coupon = await genererCouponReel();
    m.channel.send(coupon);
  }
});

client.login(token);
