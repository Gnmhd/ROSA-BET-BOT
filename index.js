const http = require('http');
http.createServer((req,res)=>{res.writeHead(200);res.end("Live");}).listen(process.env.PORT || 10000, ()=>console.log("HTTP OK"));

const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

console.log("TOKEN present:",!!process.env.TOKEN);

function genCode(){return "ROSA-"+Math.random().toString(36).substring(2,8).toUpperCase();}
function getCoupons(){
  return [
    {title:"COUPON SAFE COTE 10",code:genCode(),matches:"Man City Win + Arsenal 1X",odds:"10.45",color:0x2ECC71},
    {title:"COUPON COTE 20+",code:genCode(),matches:"Inter 1X + Barca BTTS",odds:"22.30",color:0xF1C40F},
    {title:"COUPON FUN COTE 50+",code:genCode(),matches:"Bayern 2-0 + PSG 3-1",odds:"54.80",color:0xE74C3C}
  ];
}

client.once('ready',()=>console.log(`READY ${client.user.tag}`));
client.on('messageCreate', async m => {
  if(m.author.bot) return;
  if(m.content.toLowerCase().includes('!coupon')){
    for(const c of getCoupons()){
      const embed = new EmbedBuilder().setTitle(c.title).setDescription(`**${c.matches}**\nCode: \`${c.code}\`\nCote: ${c.odds}`).setColor(c.color);
      await m.channel.send({embeds:[embed]});
    }
  }
});

client.login(process.env.TOKEN).catch(e=>console.log("LOGIN FAILED:", e.message));
