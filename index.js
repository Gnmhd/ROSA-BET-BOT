const { Client, GatewayIntentBits } = require('discord.js');
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

client.on('messageCreate', async m => {
 if(m.author.bot) return;
 let txt = m.content.toLowerCase();
 // J'accepte les 2 orthographes
 if(!txt.startsWith('!analyse') && !txt.startsWith('!analyze') && !txt.startsWith('!analyse') && !txt.startsWith('!matchs') && !txt.startsWith('!live')) return;
 
 if(txt.startsWith('!matchs') || txt.startsWith('!live')){
   return m.reply("✅ BOT EN LIGNE ! Je suis actif. Tape `!analyse Dortmund` maintenant.");
 }
 if(txt.includes('dortmund') || txt.includes('barcelona') || txt.includes('liverpool')){
   return m.reply("✅ J'ai reçu: "+m.content+"\nLe moteur ODDS arrive, c'est juste un test de connexion.");
 }
 return m.reply("✅ Commande reçue: "+m.content);
});

client.once('ready', ()=>console.log("ROSA TEST ONLINE: "+client.user.tag));
client.login(process.env.DISCORD_TOKEN);
