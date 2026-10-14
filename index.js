const http = require('http');
http.createServer((req,res)=>{res.writeHead(200);res.end("Live");}).listen(process.env.PORT || 10000, ()=>console.log("HTTP OK"));

const token = process.env.TOKEN?.trim();
console.log("TOKEN present:",!!token, "len:",token?.length);

fetch("https://discord.com/api/v10/users/@me", { headers: { Authorization: `Bot ${token}` } })
  .then(r => r.json().then(j => console.log("TOKEN TEST:", r.status, j.username || j.message)))
  .catch(e => console.log("FETCH ERROR", e.message));

const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });
client.once('ready',()=>console.log(`READY ${client.user.tag}`));
client.on('messageCreate', async m => {
  if(m.author.bot) return;
  if(m.content.toLowerCase().includes('!coupon')){
    await m.channel.send(`Coupon: ROSA-${Math.random().toString(36).slice(2,7).toUpperCase()} Cote 12.5`);
  }
});
client.login(token).then(()=>console.log("login sent")).catch(e=>console.log("LOGIN FAILED:", e.message, e.code));
