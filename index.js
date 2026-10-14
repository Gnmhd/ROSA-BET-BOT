const http = require('http');
http.createServer((req,res)=>{res.writeHead(200);res.end("Live");}).listen(process.env.PORT || 10000, ()=>console.log("HTTP OK"));

const { Client, GatewayIntentBits } = require('discord.js');
const token = process.env.TOKEN ? process.env.TOKEN.trim() : "";
console.log("TOKEN len:", token.length);

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

client.once('ready', () => console.log(`READY ${client.user.tag}`));
client.on('shardError', e => console.log("SHARD ERROR", e.message));
client.on('error', e => console.log("ERROR", e.message));

client.on('messageCreate', async m => {
  if(m.author.bot) return;
  if(m.content.toLowerCase().includes('!coupon')){
    m.channel.send(`**ROSA-BET** Coupon: ROSA-${Math.random().toString(36).slice(2,7).toUpperCase()} | Cote 12.5`);
  }
});

console.log("Trying login...");
client.login(token).then(()=>console.log("login promise ok")).catch(e=>console.log("LOGIN FAILED:", e.message));
