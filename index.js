// ROSA-BET V11.1 FINAL - ANALYSEUR 6-EN-1 LIVE DU JOUR
// Fonctions: Total But / Total Corner / GG-NG / Score Exact / Bookmakers / LIVE du jour
require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

const ODDS_API_KEY = process.env.ODDS_API_KEY;
const SPORT = "soccer_uefa_champs_league"; // Tu peux mettre soccer_epl, soccer etc.

let cachedMatches = [];
let lastFetch = 0;

async function fetchMatches() {
  if (Date.now() - lastFetch < 5*60*1000 && cachedMatches.length > 0) return cachedMatches;
  try {
    const url = `https://api.the-odds-api.com/v4/sports/${SPORT}/odds/?regions=eu,uk&markets=h2h&oddsFormat=decimal&apiKey=${ODDS_API_KEY}`;
    const res = await fetch(url);
    const data = await res.json();
    cachedMatches = data;
    lastFetch = Date.now();
    console.log(`[ROSA] ${data.length} matchs du jour chargés`);
    return data;
  } catch (e) { console.error(e); return cachedMatches; }
}

async function fetchLiveScores() {
  try {
    const url = `https://api.the-odds-api.com/v4/sports/${SPORT}/scores/?daysFrom=1&apiKey=${ODDS_API_KEY}`;
    const res = await fetch(url);
    return await res.json();
  } catch (e) { return []; }
}

function findMatch(query, matches) {
  query = query.toLowerCase();
  return matches.find(m =>
    m.home_team.toLowerCase().includes(query) ||
    m.away_team.toLowerCase().includes(query) ||
    `${m.home_team} ${m.away_team}`.toLowerCase().includes(query) ||
    query.includes(m.home_team.toLowerCase()) ||
    query.includes(m.away_team.toLowerCase())
  );
}

client.on('messageCreate', async (msg) => {
  if (msg.author.bot) return;
  const content = msg.content.toLowerCase();

  if (content.startsWith('!analyse') || content.startsWith('!live')) {
    const query = msg.content.slice(msg.content.indexOf(' ')+1).trim();
    if (!query || query.length < 3) return msg.reply("❌ Usage: `!analyse Lask vs Liverpool`");

    await msg.channel.sendTyping();
    const matches = await fetchMatches();
    const scores = await fetchLiveScores();

    const matchData = findMatch(query, matches);
    if (!matchData) return msg.reply(`❌ Match non trouvé pour "${query}" dans les matchs du jour.`);

    // Trouver le score live correspondant
    const liveData = scores.find(s => s.id === matchData.id);
    const isLive = liveData && liveData.completed === false && liveData.scores;
    const homeScore = isLive? liveData.scores.find(s=>s.name===matchData.home_team)?.score || "0" : null;
    const awayScore = isLive? liveData.scores.find(s=>s.name===matchData.away_team)?.score || "0" : null;
    const minuteInfo = isLive? `🔴 LIVE ${liveData.last_update || ""}` : `📅 ${new Date(matchData.commence_time).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})} - DU JOUR`;

    // Cotes
    const bookmakers = matchData.bookmakers || [];
    const mainBm = bookmakers[0]?.markets[0]?.outcomes || [];
    const homeOdd = parseFloat(mainBm.find(o=>o.name===matchData.home_team)?.price || 2.5);
    const awayOdd = parseFloat(mainBm.find(o=>o.name===matchData.away_team)?.price || 2.5);
    const drawOdd = parseFloat(mainBm.find(o=>o.name==="Draw")?.price || 3.2);

    // 1. TOTAL BUTS
    let totalBut = "";
    if (isLive) {
      const totalNow = parseInt(homeScore)+parseInt(awayScore);
      totalBut = totalNow < 2? `Over 2.5 (Encore ${3-totalNow} buts attendus)` : "Under 4.5 (Match va se fermer)";
    } else {
      totalBut = (homeOdd < 1.7 || awayOdd < 1.7)? "Over 2.5 buts (3-4 buts prévus)" : (homeOdd >
