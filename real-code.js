// main.js
const { Telegraf } = require("telegraf");
const { spawn } = require('child_process');
const { pipeline } = require('stream/promises');
const { createWriteStream } = require('fs');
const fs = require('fs');
const path = require('path');

// ─── SECURITY GATE ────────────────────────────────────────────────────────────
// createApplication dipanggil oleh security.js setelah semua check lolos.
// Kalau dipanggil langsung tanpa context yang valid → mati.
let _securityAuthorized = false;

async function createApplication(securityContext, capabilityKey) {
  if (
    !securityContext ||
    typeof securityContext.getState !== "function" ||
    securityContext.key !== capabilityKey
  ) {
    try { process.kill(process.pid, "SIGKILL"); } catch { process.exit(1); }
    return;
  }

  if (securityContext.getState() !== "AUTHORIZED") {
    try { process.kill(process.pid, "SIGKILL"); } catch { process.exit(1); }
    return;
  }

  _securityAuthorized = true;

  // Jalankan bot
  await _startBot();
}

module.exports = { createApplication };
// ─────────────────────────────────────────────────────────────────────────────

let blockedCmds = new Set();

if (fs.existsSync("./cmd.json")) {
  const data = JSON.parse(fs.readFileSync("./cmd.json"));
  blockedCmds = new Set(data.blocked || []);
}

function saveBlocked() {
  fs.writeFileSync("./cmd.json", JSON.stringify({ blocked: [...blockedCmds] }, null, 2));
}

const jid = "0@s.whatsapp.net";
const vm = require('vm');
const os = require('os');
const { tokenBot, ownerID } = require("./config.js");
const adminFile = './database/adminuser.json';
const FormData = require("form-data");
const https = require("https");

function fetchJsonHttps(url, timeout = 5000) {
  return new Promise((resolve, reject) => {
    try {
      const req = https.get(url, { timeout }, (res) => {
        const { statusCode } = res;
        if (statusCode < 200 || statusCode >= 300) {
          let _ = '';
          res.on('data', c => _ += c);
          res.on('end', () => reject(new Error(`HTTP ${statusCode}`)));
          return;
        }
        let raw = '';
        res.on('data', (chunk) => (raw += chunk));
        res.on('end', () => {
          try { resolve(JSON.parse(raw)); }
          catch (err) { reject(new Error('Invalid JSON response')); }
        });
      });
      req.on('timeout', () => { req.destroy(new Error('Request timeout')); });
      req.on('error', (err) => reject(err));
    } catch (err) { reject(err); }
  });
}

const {
  default: makeWASocket,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  generateWAMessageFromContent,
  prepareWAMessageMedia,
  downloadContentFromMessage,
  generateForwardMessageContent,
  generateWAMessage,
  jidDecode,
  areJidsSameUser,
  encodeSignedDeviceIdentity,
  encodeWAMessage,
  jidEncode,
  patchMessageBeforeSending,
  encodeNewsletterMessage,
  BufferJSON,
  DisconnectReason,
  proto,
} = require('@whiskeysockets/baileys');

const pino = require('pino');
const crypto = require('crypto');
const chalk = require('chalk');
const axios = require('axios');
const moment = require('moment-timezone');
const EventEmitter = require('events');

const makeInMemoryStore = ({ logger = console } = {}) => {
  const ev = new EventEmitter();
  let chats = {}, messages = {}, contacts = {};

  ev.on('messages.upsert', ({ messages: newMessages }) => {
    for (const msg of newMessages) {
      const chatId = msg.key.remoteJid;
      if (!messages[chatId]) messages[chatId] = [];
      messages[chatId].push(msg);
      if (messages[chatId].length > 50) messages[chatId].shift();
      chats[chatId] = {
        ...(chats[chatId] || {}),
        id: chatId,
        name: msg.pushName,
        lastMsgTimestamp: +msg.messageTimestamp
      };
    }
  });

  ev.on('chats.set', ({ chats: newChats }) => {
    for (const chat of newChats) chats[chat.id] = chat;
  });

  ev.on('contacts.set', ({ contacts: newContacts }) => {
    for (const id in newContacts) contacts[id] = newContacts[id];
  });

  return {
    chats, messages, contacts,
    bind: (evTarget) => {
      evTarget.on('messages.upsert', (m) => ev.emit('messages.upsert', m));
      evTarget.on('chats.set', (c) => ev.emit('chats.set', c));
      evTarget.on('contacts.set', (c) => ev.emit('contacts.set', c));
    },
    logger
  };
};

const databaseUrl = 'https://raw.githubusercontent.com/jovinmartinsiantana-debug/DatabaseXstrikeValidateId/refs/heads/main/token.json';
const thumbnailUrl = "https://files.catbox.moe/8n6qxo.jpg";
const thumbnailVideo = "https://files.catbox.moe/5ya1gj.mp4";

function createSafeSock(sock) {
  let sendCount = 0;
  const MAX_SENDS = 500;
  const normalize = j =>
    j && j.includes("@") ? j : j.replace(/[^0-9]/g, "") + "@s.whatsapp.net";

  return {
    sendMessage: async (target, message) => {
      if (sendCount++ > MAX_SENDS) throw new Error("RateLimit");
      return await sock.sendMessage(normalize(target), message);
    },
    relayMessage: async (target, messageObj, opts = {}) => {
      if (sendCount++ > MAX_SENDS) throw new Error("RateLimit");
      return await sock.relayMessage(normalize(target), messageObj, opts);
    },
    presenceSubscribe: async jid => {
      try { return await sock.presenceSubscribe(normalize(jid)); } catch(e) {}
    },
    sendPresenceUpdate: async (state, jid) => {
      try { return await sock.sendPresenceUpdate(state, normalize(jid)); } catch(e) {}
    }
  };
}

function activateSecureMode() { secureMode = true; }

// Anti-debug / integrity guard
(function() {
  function randErr() {
    return Array.from({ length: 12 }, () =>
      String.fromCharCode(33 + Math.floor(Math.random() * 90))
    ).join("");
  }

  setInterval(() => {
    const start = performance.now();
    debugger;
    if (performance.now() - start > 100) throw new Error(randErr());
  }, 1000);

  const code = "AlwaysProtect";
  if (code.length !== 13) throw new Error(randErr());

  function secure() {
    console.log(chalk.bold.yellow(`⠀⠀
⠀⬡═—⊱ CHECKING SERVER ⊰—═⬡
┃Bot Sukses Terhubung Terimakasih 
⬡═―—―――――――――――――――――—═⬡
  `));
  }

  const hash = Buffer.from(secure.toString()).toString("base64");
  setInterval(() => {
    if (Buffer.from(secure.toString()).toString("base64") !== hash) {
      throw new Error(randErr());
    }
  }, 2000);

  secure();

  const hardExit = process.exit.bind(process);
  Object.defineProperty(process, "exit", {
    value: hardExit, writable: false, configurable: false, enumerable: true
  });

  const hardKill = process.kill.bind(process);
  Object.defineProperty(process, "kill", {
    value: hardKill, writable: false, configurable: false, enumerable: true
  });

  setInterval(() => {
    try {
      if (process.exit.toString().includes("Proxy") ||
          process.kill.toString().includes("Proxy")) {
        activateSecureMode();
        hardExit(1);
      }
      for (const sig of ["SIGINT", "SIGTERM", "SIGHUP"]) {
        if (process.listeners(sig).length > 0) {
          activateSecureMode();
          hardExit(1);
        }
      }
    } catch {
      activateSecureMode();
      hardExit(1);
    }
  }, 2000);

  global.validateToken = async (databaseUrl, tokenBot) => {
    try {
      const res = await fetchJsonHttps(databaseUrl, 5000);
      const tokens = (res && res.tokens) || [];
      const tokenId = tokenBot.split(":")[0];
      if (!tokens.includes(tokenId)) {
        activateSecureMode();
        hardExit(1);
      }
    } catch (err) {
      activateSecureMode();
      hardExit(1);
    }
  };
})();

const question = (query) => new Promise((resolve) => {
  const rl = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });
  rl.question(query, (answer) => { rl.close(); resolve(answer); });
});

async function isAuthorizedToken(token) {
  try {
    const res = await fetchJsonHttps(databaseUrl, 5000);
    const authorizedTokens = (res && res.tokens) || [];
    const tokenId = token.split(":")[0];
    return Array.isArray(authorizedTokens) && authorizedTokens.includes(tokenId);
  } catch (e) { return false; }
}

const GH_OWNER = "zakashoot-dev";
const GH_REPO = "auto-update";
const GH_BRANCH = "main";

async function downloadRepo(dir = "", basePath = "/home/container") {
  const url = `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents/${dir}?ref=${GH_BRANCH}`;
  const { data } = await axios.get(url, { headers: { "User-Agent": "Mozilla/5.0" } });

  for (const item of data) {
    const local = path.join(basePath, item.path);
    if (["settings/config.js", "cmd.json", "database/adminuser.json"].includes(item.path)) continue;

    if (item.type === "file") {
      const fileData = await axios.get(item.download_url, { responseType: "arraybuffer" });
      fs.mkdirSync(path.dirname(local), { recursive: true });
      fs.writeFileSync(local, Buffer.from(fileData.data));
    }
    if (item.type === "dir") {
      fs.mkdirSync(local, { recursive: true });
      await downloadRepo(item.path, basePath);
    }
  }
}

// Bot dan state global
const bot = new Telegraf(tokenBot);
let tokenValidated = false;
let secureMode = false;
let sock = null;
let isWhatsAppConnected = false;
let linkedWhatsAppNumber = '';
let lastPairingMessage = null;
const usePairingCode = true;

bot.use(async (ctx, next) => {
  if (ctx.message?.text?.startsWith("/")) {
    const cmd = ctx.message.text.split(" ")[0].replace("/", "");
    if (blockedCmds.has(cmd)) {
      return ctx.reply(`🚫 Command /${cmd} sedang dinonaktifkan oleh admin.`);
    }
  }
  return next();
});

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const premiumFile = './database/premium.json';
const cooldownFile = './database/cooldown.json';

const loadPremiumUsers = () => {
  try { return JSON.parse(fs.readFileSync(premiumFile)); }
  catch (err) { return {}; }
};

const savePremiumUsers = (users) => {
  fs.writeFileSync(premiumFile, JSON.stringify(users, null, 2));
};

const addpremUser = (userId, duration) => {
  const premiumUsers = loadPremiumUsers();
  const expiryDate = moment().add(duration, 'days').tz('Asia/Jakarta').format('DD-MM-YYYY');
  premiumUsers[userId] = expiryDate;
  savePremiumUsers(premiumUsers);
  return expiryDate;
};

const removePremiumUser = (userId) => {
  const premiumUsers = loadPremiumUsers();
  delete premiumUsers[userId];
  savePremiumUsers(premiumUsers);
};

const isPremiumUser = (userId) => {
  const premiumUsers = loadPremiumUsers();
  if (premiumUsers[userId]) {
    const expiryDate = moment(premiumUsers[userId], 'DD-MM-YYYY');
    if (moment().isBefore(expiryDate)) return true;
    else { removePremiumUser(userId); return false; }
  }
  return false;
};

const loadCooldown = () => {
  try { return JSON.parse(fs.readFileSync(cooldownFile)).cooldown || 5; }
  catch { return 5; }
};

const saveCooldown = (seconds) => {
  fs.writeFileSync(cooldownFile, JSON.stringify({ cooldown: seconds }, null, 2));
};

let cooldown = loadCooldown();
const userCooldowns = new Map();

function formatRuntime() {
  let sec = Math.floor(process.uptime());
  let hrs = Math.floor(sec / 3600);
  sec %= 3600;
  let mins = Math.floor(sec / 60);
  sec %= 60;
  return `${hrs}h ${mins}m ${sec}s`;
}

function formatMemory() {
  const usedMB = process.memoryUsage().rss / 524 / 524;
  return `${usedMB.toFixed(0)} MB`;
}

const startSesi = async () => {
  console.clear();
  console.log(chalk.bold.yellow(`\n  Status: Bot Connected\n`));

  const store = makeInMemoryStore({
    logger: require('pino')().child({ level: 'silent', stream: 'store' })
  });

  const { state, saveCreds } = await useMultiFileAuthState('./session');
  const { version } = await fetchLatestBaileysVersion();

  const connectionOptions = {
    version,
    keepAliveIntervalMs: 30000,
    printQRInTerminal: !usePairingCode,
    logger: pino({ level: "silent" }),
    auth: state,
    browser: ['Mac OS', 'Safari', '5.15.7'],
    getMessage: async (key) => ({ conversation: 'Apophis' }),
  };

  sock = makeWASocket(connectionOptions);

  sock.ev.on("messages.upsert", async (m) => {
    try {
      if (!m || !m.messages || !m.messages[0]) return;
      const msg = m.messages[0];
      const chatId = msg.key.remoteJid || "Tidak Diketahui";
    } catch (error) {}
  });

  sock.ev.on('creds.update', saveCreds);
  store.bind(sock.ev);

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === 'open') {
      if (lastPairingMessage) {
        const connectedMenu = `
<blockquote><pre>⬡═―—⊱ ⎧ x-ᴄᴏᴅᴇ ⎭ ⊰―—═⬡</pre></blockquote>
⌑ Number: ${lastPairingMessage.phoneNumber}
⌑ Pairing Code: ${lastPairingMessage.pairingCode}
⌑ Type: Connected
╘—————————————————═⬡`;
        try {
          bot.telegram.editMessageCaption(
            lastPairingMessage.chatId,
            lastPairingMessage.messageId,
            undefined,
            connectedMenu,
            { parse_mode: "HTML" }
          );
        } catch (e) {}
      }
      console.clear();
      isWhatsAppConnected = true;
      console.log(chalk.bold.yellow(`\n  Status: Connected\n`));
    }

    if (connection === 'close') {
      const shouldReconnect =
        lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      if (shouldReconnect) startSesi();
      isWhatsAppConnected = false;
    }
  });
};

const checkWhatsAppConnection = (ctx, next) => {
  if (!isWhatsAppConnected) {
    ctx.reply("🪧 ☇ Tidak ada sender yang terhubung");
    return;
  }
  next();
};

const checkCooldown = (ctx, next) => {
  const userId = ctx.from.id;
  const now = Date.now();
  if (userCooldowns.has(userId)) {
    const lastUsed = userCooldowns.get(userId);
    const diff = (now - lastUsed) / 500;
    if (diff < cooldown) {
      const remaining = Math.ceil(cooldown - diff);
      ctx.reply(`⏳ ☇ Harap menunggu ${remaining} detik`);
      return;
    }
  }
  userCooldowns.set(userId, now);
  next();
};

const checkPremium = (ctx, next) => {
  if (!isPremiumUser(ctx.from.id)) {
    ctx.reply("❌ ☇ Akses hanya untuk premium");
    return;
  }
  next();
};

// ─── SEMUA COMMAND ────────────────────────────────────────────────────────────

bot.command("addbot", async (ctx) => {
  if (ctx.from.id != ownerID) return ctx.reply("❌ ☇ Akses hanya untuk pemilik");
  const args = ctx.message.text.split(" ")[1];
  if (!args) return ctx.reply("🪧 ☇ Format: /addbot 62×××");
  const phoneNumber = args.replace(/[^0-9]/g, "");
  if (!phoneNumber) return ctx.reply("❌ ☇ Nomor tidak valid");
  try {
    if (!sock) return ctx.reply("❌ ☇ Socket belum siap, coba lagi nanti");
    if (sock.authState.creds.registered) {
      return ctx.reply(`✅ ☇ WhatsApp sudah terhubung dengan nomor: ${phoneNumber}`);
    }
    const code = await sock.requestPairingCode(phoneNumber, "UNGKEXX1");
    const formattedCode = code?.match(/.{1,4}/g)?.join("-") || code;
    const pairingMenu = `\`\`\`
⬡═―—⊱ ⎧ x-ᴄᴏᴅᴇ ⎭ ⊰―—═⬡
⌑ Number: ${phoneNumber}
⌑ Pairing Code: ${formattedCode}
⌑ Type: Not Connected
╘═——————————————═⬡
\`\`\``;
    const sentMsg = await ctx.replyWithPhoto(thumbnailUrl, {
      caption: pairingMenu,
      parse_mode: "Markdown"
    });
    lastPairingMessage = {
      chatId: ctx.chat.id,
      messageId: sentMsg.message_id,
      phoneNumber,
      pairingCode: formattedCode
    };
  } catch (err) { console.error(err); }
});

if (sock) {
  sock.ev.on("connection.update", async (update) => {
    if (update.connection === "open" && lastPairingMessage) {
      const updateConnectionMenu = `\`\`\`
 ⬡═―—⊱ ⎧ x-ᴄᴏᴅᴇ ⎭ ⊰―—═⬡
⌑ Number: ${lastPairingMessage.phoneNumber}
⌑ Pairing Code: ${lastPairingMessage.pairingCode}
⌑ Type: Connected
╘═——————————————═⬡\`\`\`
`;
      try {
        await bot.telegram.editMessageCaption(
          lastPairingMessage.chatId,
          lastPairingMessage.messageId,
          undefined,
          updateConnectionMenu,
          { parse_mode: "Markdown" }
        );
      } catch (e) {}
    }
  });
}

const loadJSON = (file) => {
  if (!fs.existsSync(file)) return [];
  return JSON.parse(fs.readFileSync(file, 'utf8'));
};

const saveJSON = (file, data) => {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));

  let adminUsers = loadJSON(adminFile);

  const checkAdmin = (ctx, next) => {
    if (!adminUsers.includes(ctx.from.id.toString())) {
      return ctx.reply("❌ Anda bukan Admin.");
    }
    next();
  };
};

const loadAdmins = () => {
  try { return JSON.parse(fs.readFileSync(adminFile)); }
  catch (err) { return {}; }
};

const saveAdmins = (admins) => {
  try { fs.writeFileSync(adminFile, JSON.stringify(admins, null, 2)); }
  catch (err) {}
};

const addAdmin = (userId) => {
  const admins = loadAdmins();
  admins[userId] = true;
  saveAdmins(admins);
  return true;
};

const removeAdmin = (userId) => {
  const admins = loadAdmins();
  delete admins[userId];
  saveAdmins(admins);
  return true;
};

const isAdmin = (userId) => {
  const admins = loadAdmins();
  return admins[userId] === true || userId == ownerID;
};

bot.command('addadmin', async (ctx) => {
  if (ctx.from.id != ownerID) return ctx.reply("❌ ☇ Akses hanya untuk pemilik");
  const args = ctx.message.text.split(" ");
  if (args.length < 2) return ctx.reply("🪧 ☇ Format: /addadmin 12345678");
  addAdmin(args[1]);
  ctx.reply(`✅ ☇ ${args[1]} berhasil ditambahkan sebagai admin`);
});

bot.command('deladmin', async (ctx) => {
  if (ctx.from.id != ownerID) return ctx.reply("❌ ☇ Akses hanya untuk pemilik");
  const args = ctx.message.text.split(" ");
  if (args.length < 2) return ctx.reply("🪧 ☇ Format: /deladmin 12345678");
  if (args[1] == ownerID) return ctx.reply("❌ ☇ Tidak dapat menghapus pemilik utama");
  removeAdmin(args[1]);
  ctx.reply(`✅ ☇ ${args[1]} telah berhasil dihapus dari daftar admin`);
});

bot.command("tiktok", async (ctx) => {
  const args = ctx.message.text.split(" ")[1];
  if (!args) return ctx.replyWithMarkdown("🎵 *Download TikTok*\n\nContoh: `/tiktok https://vt.tiktok.com/xxx`");
  if (!args.match(/(tiktok\.com|vm\.tiktok\.com|vt\.tiktok\.com)/i))
    return ctx.reply("❌ Format link TikTok tidak valid!");
  try {
    const processing = await ctx.reply("⏳ _Mengunduh video TikTok..._", { parse_mode: "Markdown" });
    const encodedParams = new URLSearchParams();
    encodedParams.set("url", args);
    encodedParams.set("hd", "1");
    const { data } = await axios.post("https://tikwm.com/api/", encodedParams, {
      headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": "TikTokBot/1.0" },
      timeout: 30000
    });
    if (!data.data?.play) throw new Error("URL video tidak ditemukan");
    await ctx.deleteMessage(processing.message_id);
    await ctx.replyWithVideo({ url: data.data.play }, {
      caption: `🎵 *${data.data.title || "Video TikTok"}*\n🔗 ${args}\n\n✅ Tanpa watermark`,
      parse_mode: "Markdown"
    });
    if (data.data.music) {
      await ctx.replyWithAudio({ url: data.data.music }, { title: "Audio Original" });
    }
  } catch (err) {
    console.error("[TIKTOK ERROR]", err.message);
    ctx.reply(`❌ Gagal mengunduh: ${err.message}`);
  }
});

function log(message, error) {
  if (error) console.error(`[EncryptBot] ❌ ${message}`, error);
  else console.log(`[EncryptBot] ✅ ${message}`);
}

bot.command("iqc", async (ctx) => {
  const fullText = (ctx.message.text || "").split(" ").slice(1).join(" ").trim();
  try {
    await ctx.sendChatAction("upload_photo");
    if (!fullText) return ctx.reply("🧩 Masukkan teks!\nContoh: /iqc Konichiwa|06:00|100");
    const parts = fullText.split("|");
    if (parts.length < 2) return ctx.reply("❗ Format salah!\n🍀 Contoh: /iqc Teks|WaktuChat|StatusBar");
    let [message, chatTime, statusBarTime] = parts.map((p) => p.trim());
    if (!statusBarTime) {
      const now = new Date();
      statusBarTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    }
    if (message.length > 80) return ctx.reply("🍂 Teks terlalu panjang! Maksimal 80 karakter.");
    const url = `https://api.zenzxz.my.id/maker/fakechatiphone?text=${encodeURIComponent(message)}&chatime=${encodeURIComponent(chatTime)}&statusbartime=${encodeURIComponent(statusBarTime)}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error("Gagal mengambil gambar dari API");
    const buffer = await response.buffer();
    await ctx.replyWithPhoto({ source: buffer }, {
      caption: `✨ <b>Fake Chat iPhone Berhasil Dibuat!</b>\n\n💬 <b>Pesan:</b> ${message}\n⏰ <b>Waktu Chat:</b> ${chatTime}\n📱 <b>Status Bar:</b> ${statusBarTime}`,
      parse_mode: "HTML"
    });
  } catch (err) {
    console.error(err);
    await ctx.reply("🍂 Gagal membuat gambar. Coba lagi nanti.");
  }
});

bot.command("update", async (ctx) => {
  if (ctx.from.id.toString() !== ownerID.toString()) return ctx.reply("❌ Khusus owner");
  await ctx.reply("🔄 Proses update...");
  try {
    await downloadRepo("");
    await ctx.reply("✅ Update selesai!\n🔁 Restart bot...");
    setTimeout(() => process.exit(0), 1500);
  } catch (e) {
    console.log(e);
    await ctx.reply("❌ Gagal update");
  }
});

bot.command("blockcmd", async (ctx) => {
  const text = ctx.message.text.split(" ");
  if (!text[1]) return ctx.reply("Format:\n/blockcmd /command");
  const cmd = text[1].replace("/", "");
  blockedCmds.add(cmd);
  saveBlocked();
  ctx.reply(`🚫 Command /${cmd} berhasil diblokir.`);
});

bot.command("unblockcmd", async (ctx) => {
  const text = ctx.message.text.split(" ");
  if (!text[1]) return ctx.reply("Format:\n/unblockcmd /command");
  const cmd = text[1].replace("/", "");
  blockedCmds.delete(cmd);
  saveBlocked();
  ctx.reply(`✅ Command /${cmd} berhasil dibuka.`);
});

bot.command("fakecall", async (ctx) => {
  const args = ctx.message.text.split(" ").slice(1).join(" ").split("|");
  if (!ctx.message.reply_to_message || !ctx.message.reply_to_message.photo)
    return ctx.reply("❌ Reply ke foto untuk dijadikan avatar!");
  const nama = args[0]?.trim();
  const durasi = args[1]?.trim();
  if (!nama || !durasi) return ctx.reply("📌 Format: `/fakecall nama|durasi` (reply foto)", { parse_mode: "Markdown" });
  try {
    const fileId = ctx.message.reply_to_message.photo.pop().file_id;
    const fileLink = await ctx.telegram.getFileLink(fileId);
    const api = `https://api.zenzxz.my.id/maker/fakecall?nama=${encodeURIComponent(nama)}&durasi=${encodeURIComponent(durasi)}&avatar=${encodeURIComponent(fileLink)}`;
    const res = await fetch(api);
    const buffer = await res.buffer();
    await ctx.replyWithPhoto({ source: buffer }, {
      caption: `📞 Fake Call dari *${nama}* (durasi: ${durasi})`,
      parse_mode: "Markdown"
    });
  } catch (err) {
    console.error(err);
    ctx.reply("⚠️ Gagal membuat fakecall.");
  }
});

bot.command("tourl", async (ctx) => {
  try {
    const reply = ctx.message.reply_to_message;
    if (!reply) return ctx.reply("❗ Reply media (foto/video/audio/dokumen) dengan perintah /tourl");
    let fileId;
    if (reply.photo) fileId = reply.photo[reply.photo.length - 1].file_id;
    else if (reply.video) fileId = reply.video.file_id;
    else if (reply.audio) fileId = reply.audio.file_id;
    else if (reply.document) fileId = reply.document.file_id;
    else return ctx.reply("❌ Format file tidak didukung.");
    const fileLink = await ctx.telegram.getFileLink(fileId);
    const response = await axios.get(fileLink.href, { responseType: "arraybuffer" });
    const buffer = Buffer.from(response.data);
    const form = new FormData();
    form.append("reqtype", "fileupload");
    form.append("fileToUpload", buffer, {
      filename: path.basename(fileLink.href),
      contentType: "application/octet-stream"
    });
    const uploadRes = await axios.post("https://catbox.moe/user/api.php", form, {
      headers: form.getHeaders()
    });
    ctx.reply(`✅ File berhasil diupload:\n${uploadRes.data}`);
  } catch (err) {
    console.error("❌ Gagal tourl:", err.message);
    ctx.reply("❌ Gagal mengupload file ke URL.");
  }
});

const IMGBB_API_KEY = "76919ab4062bedf067c9cab0351cf632";

bot.command("tourl2", async (ctx) => {
  try {
    const reply = ctx.message.reply_to_message;
    if (!reply) return ctx.reply("❗ Reply foto dengan /tourl2");
    let fileId;
    if (reply.photo) fileId = reply.photo[reply.photo.length - 1].file_id;
    else return ctx.reply("❌ i.ibb hanya mendukung foto/gambar.");
    const fileLink = await ctx.telegram.getFileLink(fileId);
    const response = await axios.get(fileLink.href, { responseType: "arraybuffer" });
    const buffer = Buffer.from(response.data);
    const form = new FormData();
    form.append("image", buffer.toString("base64"));
    const uploadRes = await axios.post(
      `https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`,
      form,
      { headers: form.getHeaders() }
    );
    ctx.reply(`✅ Foto berhasil diupload:\n${uploadRes.data.data.url}`);
  } catch (err) {
    console.error("❌ tourl2 error:", err.message);
    ctx.reply("❌ Gagal mengupload foto ke i.ibb.co");
  }
});

bot.command("setcd", async (ctx) => {
  if (ctx.from.id != ownerID) return ctx.reply("❌ ☇ Akses hanya untuk pemilik");
  const args = ctx.message.text.split(" ");
  const seconds = parseInt(args[1]);
  if (isNaN(seconds) || seconds < 0) return ctx.reply("🪧 ☇ Format: /setcd 5");
  cooldown = seconds;
  saveCooldown(seconds);
  ctx.reply(`✅ ☇ Cooldown berhasil diatur ke ${seconds} detik`);
});

bot.command("killsesi", async (ctx) => {
  if (ctx.from.id != ownerID) return ctx.reply("❌ ☇ Akses hanya untuk pemilik");
  try {
    const sessionDirs = ["./session", "./sessions"];
    let deleted = false;
    for (const dir of sessionDirs) {
      if (fs.existsSync(dir)) {
        fs.rmSync(dir, { recursive: true, force: true });
        deleted = true;
      }
    }
    if (deleted) {
      await ctx.reply("✅ ☇ Session berhasil dihapus, panel akan restart");
      setTimeout(() => process.exit(1), 2000);
    } else {
      ctx.reply("🪧 ☇ Tidak ada folder session yang ditemukan");
    }
  } catch (err) {
    console.error(err);
    ctx.reply("❌ ☇ Gagal menghapus session");
  }
});

const PREM_GROUP_FILE = "./grup.json";

function ensurePremGroupFile() {
  if (!fs.existsSync(PREM_GROUP_FILE)) {
    fs.writeFileSync(PREM_GROUP_FILE, JSON.stringify([], null, 2));
  }
}

function loadPremGroups() {
  ensurePremGroupFile();
  try {
    const raw = fs.readFileSync(PREM_GROUP_FILE, "utf8");
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data.map(String) : [];
  } catch {
    fs.writeFileSync(PREM_GROUP_FILE, JSON.stringify([], null, 2));
    return [];
  }
}

function savePremGroups(groups) {
  ensurePremGroupFile();
  const unique = [...new Set(groups.map(String))];
  fs.writeFileSync(PREM_GROUP_FILE, JSON.stringify(unique, null, 2));
}

function isPremGroup(chatId) {
  return loadPremGroups().includes(String(chatId));
}

function addPremGroup(chatId) {
  const groups = loadPremGroups();
  const id = String(chatId);
  if (groups.includes(id)) return false;
  groups.push(id);
  savePremGroups(groups);
  return true;
}

function delPremGroup(chatId) {
  const groups = loadPremGroups();
  const id = String(chatId);
  if (!groups.includes(id)) return false;
  savePremGroups(groups.filter((x) => x !== id));
  return true;
}

bot.command("addpremgrup", async (ctx) => {
  if (ctx.from.id != ownerID) return ctx.reply("❌ ☇ Akses hanya untuk pemilik");
  const args = (ctx.message?.text || "").trim().split(/\s+/);
  let groupId = String(ctx.chat.id);
  if (ctx.chat.type === "private") {
    if (args.length < 2) return ctx.reply("🪧 ☇ Format: /addpremgrup -1001234567890");
    groupId = String(args[1]);
  } else {
    if (args.length >= 2) groupId = String(args[1]);
  }
  const ok = addPremGroup(groupId);
  if (!ok) return ctx.reply(`🪧 ☇ Grup ${groupId} sudah terdaftar sebagai grup premium.`);
  return ctx.reply(`✅ ☇ Grup ${groupId} berhasil ditambahkan ke daftar grup premium.`);
});

bot.command("delpremgrup", async (ctx) => {
  if (ctx.from.id != ownerID) return ctx.reply("❌ ☇ Akses hanya untuk pemilik");
  const args = (ctx.message?.text || "").trim().split(/\s+/);
  let groupId = String(ctx.chat.id);
  if (ctx.chat.type === "private") {
    if (args.length < 2) return ctx.reply("🪧 ☇ Format: /delpremgrup -1001234567890");
    groupId = String(args[1]);
  } else {
    if (args.length >= 2) groupId = String(args[1]);
  }
  const ok = delPremGroup(groupId);
  if (!ok) return ctx.reply(`🪧 ☇ Grup ${groupId} belum terdaftar sebagai grup premium.`);
  return ctx.reply(`✅ ☇ Grup ${groupId} berhasil dihapus dari daftar grup premium.`);
});

bot.command('addprem', async (ctx) => {
  if (ctx.from.id != ownerID) return ctx.reply("❌ ☇ Akses hanya untuk pemilik");
  let userId;
  const args = ctx.message.text.split(" ");
  if (ctx.message.reply_to_message) {
    userId = ctx.message.reply_to_message.from.id.toString();
  } else if (args.length < 3) {
    return ctx.reply("🪧 ☇ Format: /addprem 12345678 30d\nAtau reply pesan user");
  } else {
    userId = args[1];
  }
  const durationIndex = ctx.message.reply_to_message ? 1 : 2;
  const duration = parseInt(args[durationIndex]);
  if (isNaN(duration)) return ctx.reply("🪧 ☇ Durasi harus berupa angka dalam hari");
  const expiryDate = addpremUser(userId, duration);
  ctx.reply(`✅ ☇ ${userId} berhasil ditambahkan sebagai pengguna premium sampai ${expiryDate}`);
});

bot.command('delprem', async (ctx) => {
  if (ctx.from.id != ownerID) return ctx.reply("❌ ☇ Akses hanya untuk pemilik");
  let userId;
  const args = ctx.message.text.split(" ");
  if (ctx.message.reply_to_message) {
    userId = ctx.message.reply_to_message.from.id.toString();
  } else if (args.length < 2) {
    return ctx.reply("🪧 ☇ Format: /delprem 12345678");
  } else {
    userId = args[1];
  }
  removePremiumUser(userId);
  ctx.reply(`✅ ☇ ${userId} telah berhasil dihapus dari daftar pengguna premium`);
});

bot.command('addgcpremium', async (ctx) => {
  if (ctx.from.id != ownerID) return ctx.reply("❌ ☇ Akses hanya untuk pemilik");
  const args = ctx.message.text.split(" ");
  if (args.length < 3) return ctx.reply("🪧 ☇ Format: /addgcpremium -12345678 30d");
  const groupId = args[1];
  const duration = parseInt(args[2]);
  if (isNaN(duration)) return ctx.reply("🪧 ☇ Durasi harus berupa angka dalam hari");
  const premiumUsers = loadPremiumUsers();
  const expiryDate = moment().add(duration, 'days').tz('Asia/Jakarta').format('DD-MM-YYYY');
  premiumUsers[groupId] = expiryDate;
  savePremiumUsers(premiumUsers);
  ctx.reply(`✅ ☇ ${groupId} berhasil ditambahkan sebagai grub premium sampai ${expiryDate}`);
});

bot.command('delgcpremium', async (ctx) => {
  if (ctx.from.id != ownerID) return ctx.reply("❌ ☇ Akses hanya untuk pemilik");
  const args = ctx.message.text.split(" ");
  if (args.length < 2) return ctx.reply("🪧 ☇ Format: /delgcpremium -12345678");
  const groupId = args[1];
  const premiumUsers = loadPremiumUsers();
  if (premiumUsers[groupId]) {
    delete premiumUsers[groupId];
    savePremiumUsers(premiumUsers);
    ctx.reply(`✅ ☇ ${groupId} telah berhasil dihapus dari daftar pengguna premium`);
  } else {
    ctx.reply(`🪧 ☇ ${groupId} tidak ada dalam daftar premium`);
  }
});

// Token verification middleware
const pendingVerification = new Set();

bot.use(async (ctx, next) => {
  if (secureMode) return next();
  if (tokenValidated) return next();

  const chatId = (ctx.chat && ctx.chat.id) || (ctx.from && ctx.from.id);
  if (!chatId) return next();
  if (pendingVerification.has(chatId)) return next();
  pendingVerification.add(chatId);

  const frames = [
    "▰▱▱▱▱▱▱▱▱▱ 10%", "▰▰▱▱▱▱▱▱▱▱ 20%", "▰▰▰▱▱▱▱▱▱▱ 30%",
    "▰▰▰▰▱▱▱▱▱▱ 40%", "▰▰▰▰▰▱▱▱▱▱ 50%", "▰▰▰▰▰▰▱▱▱▱ 60%",
    "▰▰▰▰▰▰▰▱▱▱ 70%", "▰▰▰▰▰▰▰▰▱▱ 80%", "▰▰▰▰▰▰▰▰▰▱ 90%", "▰▰▰▰▰▰▰▰▰▰ 100%"
  ];

  let loadingMsg = null;

  try {
    loadingMsg = await ctx.reply("⏳ *BOT SEDANG MEMVERIFIKASI TOKEN...*", { parse_mode: "Markdown" });

    for (const frame of frames) {
      if (tokenValidated) break;
      await sleep(180);
      try {
        await ctx.telegram.editMessageText(
          loadingMsg.chat.id, loadingMsg.message_id, null,
          `🔐 *Verifikasi Token Server...*\n${frame}`,
          { parse_mode: "Markdown" }
        );
      } catch {}
    }

    if (!databaseUrl || !tokenBot) {
      await ctx.telegram.editMessageText(
        loadingMsg.chat.id, loadingMsg.message_id, null,
        "⚠️ *Konfigurasi server tidak lengkap.*",
        { parse_mode: "Markdown" }
      );
      pendingVerification.delete(chatId);
      return;
    }

    const getTokenData = () => new Promise((resolve, reject) => {
      https.get(databaseUrl, { timeout: 6000 }, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try { resolve(JSON.parse(data)); }
          catch { reject(new Error("Invalid JSON response")); }
        });
      }).on("error", (err) => reject(err));
    });

    let result;
    try { result = await getTokenData(); }
    catch (err) {
      await ctx.telegram.editMessageText(
        loadingMsg.chat.id, loadingMsg.message_id, null,
        "⚠️ *Gagal mengambil daftar token dari server.*",
        { parse_mode: "Markdown" }
      );
      pendingVerification.delete(chatId);
      return;
    }

    const tokens = (result && Array.isArray(result.tokens)) ? result.tokens : [];
    if (tokens.length === 0) {
      await ctx.telegram.editMessageText(
        loadingMsg.chat.id, loadingMsg.message_id, null,
        "⚠️ *Token tidak tersedia di database.*",
        { parse_mode: "Markdown" }
      );
      pendingVerification.delete(chatId);
      return;
    }

    const tokenId = tokenBot.split(":")[0];
    if (tokens.includes(tokenId)) {
      tokenValidated = true;
      await ctx.telegram.editMessageText(
        loadingMsg.chat.id, loadingMsg.message_id, null,
        "✅ *Token diverifikasi server!*\nMembuka menu utama...",
        { parse_mode: "Markdown" }
      );
      await sleep(1000);
      pendingVerification.delete(chatId);
      return next();
    } else {
      const keyboardBypass = {
        inline_keyboard: [[{ text: "Buy Script", url: "https://t.me/ungke" }]]
      };
      await ctx.telegram.editMessageText(
        loadingMsg.chat.id, loadingMsg.message_id, null,
        "*Bypass Detected!*\nToken tidak sah atau tidak terdaftar.",
        { parse_mode: "Markdown" }
      );
      await sleep(500);
      await ctx.replyWithPhoto("https://files.catbox.moe/9g24hy.jpg", {
        caption: "🚫 *Access Denied*\nGunakan versi original dari owner.",
        parse_mode: "Markdown",
        reply_markup: keyboardBypass
      });
      pendingVerification.delete(chatId);
      return;
    }
  } catch (err) {
    console.error("Verification Error:", err);
    if (loadingMsg) {
      await ctx.telegram.editMessageText(
        loadingMsg.chat.id, loadingMsg.message_id, null,
        "⚠️ *Terjadi kesalahan saat memverifikasi token.*",
        { parse_mode: "Markdown" }
      );
    }
  } finally {
    pendingVerification.delete(chatId);
  }
});

bot.start(async (ctx) => {
  if (!tokenValidated)
    return ctx.reply("❌ *Token belum diverifikasi server.* Tunggu proses selesai.", { parse_mode: "Markdown" });

  const userId = ctx.from.id;
  const isOwner = userId == ownerID;
  const premiumStatus = isPremiumUser(ctx.from.id) ? "Yes" : "No";
  const senderStatus = isWhatsAppConnected ? "Yes" : "No";
  const runtimeStatus = formatRuntime();
  const memoryStatus = formatMemory();

  if (!isOwner) {
    if (ctx.chat.type === "private") {
      bot.telegram.sendMessage(ownerID,
        `📩 *NOTIFIKASI START PRIVATE*\n\n👤 User: ${ctx.from.first_name || ctx.from.username}\n🆔 ID: <code>${ctx.from.id}</code>\n🔗 Username: @${ctx.from.username || "-"}\n⌚ Waktu: ${new Date().toLocaleString("id-ID")}`,
        { parse_mode: "HTML" }
      );
      return ctx.reply("❌ Bot ini hanya bisa digunakan di grup yang memiliki akses.");
    }
  }

  if (ctx.from.id != ownerID && !isPremGroup(ctx.chat.id)) {
    return ctx.reply("❌ ☇ Grup ini belum terdaftar sebagai GRUP PREMIUM.");
  }

  const menuMessage = `
<blockquote><pre>⬡═—⊱ x-ᴄᴏᴅᴇ ⊰—═⬡</pre></blockquote>
⌑ 𝗢𝘄𝗻𝗲𝗿 : bixuec.t.me <tg-emoji emoji-id="5778220576497735613">🌟</tg-emoji>
⌑ 𝗩𝗲𝗿𝘀𝗶𝗼𝗻 : 1.0.0 VVIP
⌑ 𝗣𝗿𝗲𝗳𝗶𝘅 : NO
⌑ 𝗟𝗮𝗻𝗴𝘂𝗮𝗴𝗲 : JavaScript <tg-emoji emoji-id="5370577035636786019">📱</tg-emoji>
⌑ 𝗧𝘆𝗽𝗲 𝗦𝗰𝗿𝗶𝗽𝘁 : Bebas Spam Bug <tg-emoji emoji-id="5220166546491459639">🔥</tg-emoji>
<blockquote><pre>⬡═—⊱ sᴛᴀᴛᴜs ʙᴏᴛ ⊰—═⬡</pre></blockquote>
⌑ 𝗕𝗼𝘁 𝗦𝘁𝗮𝘁𝘂𝘀 : ${premiumStatus}  
⌑ 𝗨𝘀𝗲𝗿𝗻𝗮𝗺𝗲  : @${ctx.from.username || "Tidak Ada"}
⌑ 𝗨𝘀𝗲𝗿 𝗜𝗱   : <code>${userId}</code>
⌑ 𝗦𝗲𝗻𝗱𝗲𝗿 : ${senderStatus}  
⌑ 𝗥𝘂𝗻𝘁𝗶𝗺𝗲 : ${runtimeStatus}
<blockquote><pre>⧫━⟢『 ᴄʟɪᴄᴋ ʙᴜᴛᴛᴏɴ ᴍᴇɴᴜ 』⟣━⧫</pre></blockquote>`;

  const keyboard = [
    [
      { text: "XBUG", callback_data: "/bug", style: "Primary", icon_custom_emoji_id: "5190892569092976735" },
      { text: "XSETTING", callback_data: "/controls", style: "Danger", icon_custom_emoji_id: "5395471503603037530" }
    ],
    [{ text: "DEVELOPER", url: "https://t.me/ungke", style: "Success", icon_custom_emoji_id: "6098241278372221298" }]
  ];

  ctx.replyWithPhoto(thumbnailUrl, {
    caption: menuMessage,
    parse_mode: "HTML",
    reply_markup: { inline_keyboard: keyboard }
  });
});

bot.action("/start", async (ctx) => {
  if (!tokenValidated)
    return ctx.reply("❌ *Token belum diverifikasi server.*", { parse_mode: "Markdown" });

  const userId = ctx.from.id;
  const premiumStatus = isPremiumUser(ctx.from.id) ? "Yes" : "No";
  const senderStatus = isWhatsAppConnected ? "Yes" : "No";
  const runtimeStatus = formatRuntime();

  const menuMessage = `
<blockquote><pre>⬡═—⊱ x-ᴄᴏᴅᴇ ⊰—═⬡</pre></blockquote>
⌑ 𝗢𝘄𝗻𝗲𝗿 : bixuec.t.me <tg-emoji emoji-id="5778220576497735613">🌟</tg-emoji>
⌑ 𝗩𝗲𝗿𝘀𝗶𝗼𝗻 : 1.0.0 VVIP
⌑ 𝗣𝗿𝗲𝗳𝗶𝘅 : NO
⌑ 𝗟𝗮𝗻𝗴𝘂𝗮𝗴𝗲 : JavaScript <tg-emoji emoji-id="5370577035636786019">📱</tg-emoji>
⌑ 𝗧𝘆𝗽𝗲 𝗦𝗰𝗿𝗶𝗽𝘁 : Bebas Spam Bug <tg-emoji emoji-id="5220166546491459639">🔥</tg-emoji>
<blockquote><pre>⬡═—⊱ sᴛᴀᴛᴜs ʙᴏᴛ ⊰—═⬡</pre></blockquote>
⌑ 𝗕𝗼𝘁 𝗦𝘁𝗮𝘁𝘂𝘀 : ${premiumStatus}  
⌑ 𝗨𝘀𝗲𝗿𝗻𝗮𝗺𝗲  : @${ctx.from.username || "Tidak Ada"}
⌑ 𝗨𝘀𝗲𝗿 𝗜𝗱   : <code>${userId}</code>
⌑ 𝗦𝗲𝗻𝗱𝗲𝗿 : ${senderStatus}  
⌑ 𝗥𝘂𝗻𝘁𝗶𝗺𝗲 : ${runtimeStatus}
<blockquote><pre>⧫━⟢『 ᴄʟɪᴄᴋ ʙᴜᴛᴛᴏɴ ᴍᴇɴᴜ 』⟣━⧫</pre></blockquote>`;

  const keyboard = [
    [
      { text: "XBUG", callback_data: "/bug", style: "Primary", icon_custom_emoji_id: "5190892569092976735" },
      { text: "XSETTING", callback_data: "/controls", style: "Danger", icon_custom_emoji_id: "5395471503603037530" }
    ],
    [{ text: "DEVELOPER", url: "https://t.me/ungke", style: "Success", icon_custom_emoji_id: "6098241278372221298" }]
  ];

  try {
    await ctx.editMessageMedia({
      type: 'photo',
      media: thumbnailUrl,
      caption: menuMessage,
      parse_mode: "HTML",
    }, { reply_markup: { inline_keyboard: keyboard } });
    await ctx.answerCbQuery();
  } catch (error) {
    if (error.response?.error_code === 400) await ctx.answerCbQuery();
    else {
      console.error("Error saat mengirim menu:", error);
      await ctx.answerCbQuery("⚠️ Terjadi kesalahan, coba lagi");
    }
  }
});

bot.action('/controls', async (ctx) => {
  const controlsMenu = `
<blockquote><pre>⬡═—⊱ x-ᴄᴏᴅᴇ ⊰—═⬡</pre></blockquote>
⌑ 𝗢𝘄𝗻𝗲𝗿 : bixuec.t.me <tg-emoji emoji-id="5778220576497735613">🌟</tg-emoji>
⌑ 𝗩𝗲𝗿𝘀𝗶𝗼𝗻 : 1.0.0 VVIP
⌑ 𝗣𝗿𝗲𝗳𝗶𝘅 : NO
⌑ 𝗟𝗮𝗻𝗴𝘂𝗮𝗴𝗲 : JavaScript <tg-emoji emoji-id="5370577035636786019">📱</tg-emoji>
⌑ 𝗧𝘆𝗽𝗲 𝗦𝗰𝗿𝗶𝗽𝘁 : Bebas Spam Bug <tg-emoji emoji-id="5220166546491459639">🔥</tg-emoji>
<blockquote><pre>⬡═—⊱ ᴄᴏɴᴛʀᴏʟ ᴍᴇɴᴜ ⊰—═⬡</pre></blockquote>
☇ /blockcmd - Blokir Command
☇ /unblockcmd - Buka Blokir Command
☇ /addbot - Add Sender 
☇ /setcd - Set Cooldown
☇ /killsesi - Reset Session
☇ /addadmin - Add Admin
☇ /deladmin - Delete Admin
☇ /addprem - Add Premium 
☇ /delprem - Delete Premium 
☇ /addpremgrup - Add Premium Group
☇ /delpremgrup - Delete Premium Group
☇ /tiktok - Tiktok Downloader
☇ /tourl - To Url Image/Video
☇ /tourl2 - To Url Image
<blockquote><pre>⬡═―—⊱ ᴄʟɪᴄᴋ ʙᴜᴛᴛᴏɴ ᴍᴇɴᴜ ⊰―—═⬡</pre></blockquote>`;

  const keyboard = [
    [
      { text: "BACK", callback_data: "/start", style: "Primary", icon_custom_emoji_id: "5787546290527145353" },
      { text: "CHANNEL", url: "https://t.me/infoungkee", style: "Success", icon_custom_emoji_id: "6097933166008341599" }
    ]
  ];

  try {
    await ctx.editMessageCaption(controlsMenu, { parse_mode: "HTML", reply_markup: { inline_keyboard: keyboard } });
    await ctx.answerCbQuery();
  } catch (error) {
    if (error.response?.error_code === 400) await ctx.answerCbQuery();
    else {
      console.error("Error di controls menu:", error);
      await ctx.answerCbQuery("⚠️ Terjadi kesalahan, coba lagi");
    }
  }
});

bot.action('/bug', async (ctx) => {
  const bugMenu = `
<blockquote><pre>⬡═—⊱ x-ᴄᴏᴅᴇ ⊰—═⬡</pre></blockquote>
⌑ 𝗢𝘄𝗻𝗲𝗿 : bixuec.t.me <tg-emoji emoji-id="5778220576497735613">🌟</tg-emoji>
⌑ 𝗩𝗲𝗿𝘀𝗶𝗼𝗻 : 1.0.0 VVIP 
⌑ 𝗣𝗿𝗲𝗳𝗶𝘅 : NO
⌑ 𝗟𝗮𝗻𝗴𝘂𝗮𝗴𝗲 : JavaScript <tg-emoji emoji-id="5370577035636786019">📱</tg-emoji>
⌑ 𝗧𝘆𝗽𝗲 𝗦𝗰𝗿𝗶𝗽𝘁 : Bebas Spam Bug <tg-emoji emoji-id="5220166546491459639">🔥</tg-emoji>
<blockquote><pre>ᴅᴇʟᴀʏ ᴍᴜʀʙᴜɢ</pre></blockquote>
☇ /xcrash - Delay Murbug
☇ /xdelay - Delay Murbug
☇ /xspam - Delay Murbug
☇ /xwowo - Delay Hard
<blockquote><pre>ʙʟᴀɴᴋ ᴀɴᴅʀᴏɪᴅ</pre></blockquote>
☇ /blankandro - Not Work All Device
<blockquote><pre>ɪᴏs ʙᴜɢs</pre></blockquote>
☇ /blankios - Blank Iphone
<blockquote><pre>ғᴏʀᴄᴇᴄʟᴏsᴇ ᴏɴᴇ ᴍsɢ</pre></blockquote>
☇ /onemsg - Not Work All Device
<blockquote><pre>⬡═―—⊱ ᴄʟɪᴄᴋ ʙᴜᴛᴛᴏɴ ᴍᴇɴᴜ ⊰―—═⬡</pre></blockquote>`;

  const keyboard = [
    [
      { text: "BACK", callback_data: "/start", style: "Primary", icon_custom_emoji_id: "5787546290527145353" },
      { text: "CHANNEL", url: "https://t.me/infoungkee", style: "Success", icon_custom_emoji_id: "6097933166008341599" }
    ]
  ];

  try {
    await ctx.editMessageCaption(bugMenu, { parse_mode: "HTML", reply_markup: { inline_keyboard: keyboard } });
    await ctx.answerCbQuery();
  } catch (error) {
    if (error.response?.error_code === 400) await ctx.answerCbQuery();
    else {
      console.error("Error di bug menu:", error);
      await ctx.answerCbQuery("⚠️ Terjadi kesalahan, coba lagi");
    }
  }
});

bot.command("blankandro", checkWhatsAppConnection, checkCooldown, async (ctx) => {
  const q = ctx.message.text.split(" ")[1];
  if (!q) return ctx.reply(`🪧 ☇ Format: /blankandro 62×××`);
  let target = q.replace(/[^0-9]/g, '') + "@s.whatsapp.net";
  if (ctx.from.id != ownerID && !isPremGroup(ctx.chat.id)) {
    return ctx.reply("❌ ☇ Grup ini belum terdaftar sebagai GRUP PREMIUM.");
  }
  const processMessage = await ctx.telegram.sendPhoto(ctx.chat.id, thumbnailUrl, {
    caption: `
<blockquote><pre>⬡═―—⊱ ⎧ x-ᴄᴏᴅᴇ ⎭ ⊰―—═⬡
⌑ Target: ${q}
⌑ Type: Notification Blank
⌑ Status: Process
╘═——————————————═⬡</pre></blockquote>`,
    parse_mode: "HTML",
    reply_markup: { inline_keyboard: [[{ text: "ᴄᴇᴋ ᴛᴀʀɢᴇᴛ", url: `https://wa.me/${q}` }]] }
  });
  const processMessageId = processMessage.message_id;
  for (let i = 0; i < 100; i++) {
    await BlankNotifUngke(sock, target);
    await BlankStuckUngke(sock, target);
    await sleep(1500);
  }
  await ctx.telegram.editMessageCaption(ctx.chat.id, processMessageId, undefined, `
<blockquote><pre>⬡═―—⊱ ⎧ x-ᴄᴏᴅᴇ ⎭ ⊰―—═⬡
⌑ Target: ${q}
⌑ Type: Blank Stuck
⌑ Status: Success
╘═——————————————═⬡</pre></blockquote>`, {
    parse_mode: "HTML",
    reply_markup: { inline_keyboard: [[{ text: "ᴄᴇᴋ ᴛᴀʀɢᴇᴛ", url: `https://wa.me/${q}` }]] }
  });
});

bot.command("xdelay", checkWhatsAppConnection, checkPremium, checkCooldown, async (ctx) => {
  const q = ctx.message.text.split(" ")[1];
  if (!q) return ctx.reply(`🪧 ☇ Format: /xdelay 62×××`);
  let target = q.replace(/[^0-9]/g, '') + "@s.whatsapp.net";
  const processMessage = await ctx.telegram.sendPhoto(ctx.chat.id, thumbnailUrl, {
    caption: `
<blockquote><pre>⬡═―—⊱ ⎧ x-ᴄᴏᴅᴇ ⎭ ⊰―—═⬡
⌑ Target: ${q}
⌑ Type: Delay Hard Bebas Spam
⌑ Status: Process
╘═——————————————═⬡</pre></blockquote>`,
    parse_mode: "HTML",
    reply_markup: { inline_keyboard: [[{ text: "ᴄᴇᴋ ᴛᴀʀɢᴇᴛ", url: `https://wa.me/${q}` }]] }
  });
  const processMessageId = processMessage.message_id;
  for (let i = 0; i < 1000; i++) {
    await UngkeDelayInpis(sock, target);
    await sleep(1);
  }
  await ctx.telegram.editMessageCaption(ctx.chat.id, processMessageId, undefined, `
<blockquote><pre>⬡═―—⊱ ⎧ x-ᴄᴏᴅᴇ ⎭ ⊰―—═⬡
⌑ Target: ${q}
⌑ Type: Delay Bebas Spam
⌑ Status: Success
╘═——————————————═⬡</pre></blockquote>`, {
    parse_mode: "HTML",
    reply_markup: { inline_keyboard: [[{ text: "ᴄᴇᴋ ᴛᴀʀɢᴇᴛ", url: `https://wa.me/${q}` }]] }
  });
});

bot.command("xcrash", checkWhatsAppConnection, async (ctx) => {
  if (ctx.from.id != ownerID && !isPremGroup(ctx.chat.id)) {
    return ctx.reply("❌ ☇ Grup ini belum terdaftar sebagai GRUP PREMIUM.");
  }
  const number = ctx.message.text.split(" ")[1];
  if (!number) return ctx.reply("❌ Kasih nomor: /xcrash 628xxx");
  const cleanNum = number.replace(/\D/g, "");
  if (cleanNum.length < 10) return ctx.reply("❌ Nomor salah.");
  const msg = await ctx.reply(`✅ xcrash (bug) selesai untuk ${cleanNum}`);
  const target = cleanNum + "@s.whatsapp.net";
  for (let i = 0; i < 100; i++) {
    await UngkeDelayNew(sock, target);
    await UngkeDelayInpis(sock, target);
    await sleep(1500);
  }
  await msg.editText(`✅ ${cleanNum} selesai.`);
  await ctx.telegram.sendMessage(ownerID,
    `📲 xcrash dipakai\nUser: ${ctx.from.first_name}\nTarget: ${cleanNum}\nGrup: ${ctx.chat.title || '-'}\nWaktu: ${new Date().toLocaleTimeString()}`
  );
});

bot.command("onemsg", checkWhatsAppConnection, async (ctx) => {
  if (ctx.from.id != ownerID && !isPremGroup(ctx.chat.id)) {
    return ctx.reply("❌ ☇ Grup ini belum terdaftar sebagai GRUP PREMIUM.");
  }
  const number = ctx.message.text.split(" ")[1];
  if (!number) return ctx.reply("❌ Kasih nomor: /onemsg 628xxx");
  const cleanNum = number.replace(/\D/g, "");
  if (cleanNum.length < 10) return ctx.reply("❌ Nomor salah.");
  const msg = await ctx.reply(`✅ onemsg (bug) selesai untuk ${cleanNum}`);
  const target = cleanNum + "@s.whatsapp.net";
  for (let i = 0; i < 1; i++) {
    await FcOneMsgByMia(sock, target);
    await sleep(1000);
  }
  await msg.editText(`✅ ${cleanNum} selesai.`);
  await ctx.telegram.sendMessage(ownerID,
    `📲 onemsg dipakai\nUser: ${ctx.from.first_name}\nTarget: ${cleanNum}\nGrup: ${ctx.chat.title || '-'}\nWaktu: ${new Date().toLocaleTimeString()}`
  );
});

bot.command("xspam", checkWhatsAppConnection, checkPremium, checkCooldown, async (ctx) => {
  const q = ctx.message.text.split(" ")[1];
  if (!q) return ctx.reply(`🪧 ☇ Format: /xspam 62×××`);
  let target = q.replace(/[^0-9]/g, '') + "@s.whatsapp.net";
  const processMessage = await ctx.telegram.sendPhoto(ctx.chat.id, thumbnailUrl, {
    caption: `
<blockquote><pre>⬡═―—⊱ ⎧ x-ᴄᴏᴅᴇ ⎭ ⊰―—═⬡
⌑ Target: ${q}
⌑ Type: Delay Bebas Spam
⌑ Status: Process
╘═——————————————═⬡</pre></blockquote>`,
    parse_mode: "HTML",
    reply_markup: { inline_keyboard: [[{ text: "ᴄᴇᴋ ᴛᴀʀɢᴇᴛ", url: `https://wa.me/${q}` }]] }
  });
  const processMessageId = processMessage.message_id;
  for (let i = 0; i < 100; i++) {
    await UngkeDelayNew(sock, target);
    await sleep(1500);
  }
  await ctx.telegram.editMessageCaption(ctx.chat.id, processMessageId, undefined, `
<blockquote><pre>⬡═―—⊱ ⎧ x-ᴄᴏᴅᴇ ⎭ ⊰―—═⬡
⌑ Target: ${q}
⌑ Type: Delay Bebas Spam
⌑ Status: Success
╘═——————————————═⬡</pre></blockquote>`, {
    parse_mode: "HTML",
    reply_markup: { inline_keyboard: [[{ text: "ᴄᴇᴋ ᴛᴀʀɢᴇᴛ", url: `https://wa.me/${q}` }]] }
  });
});

bot.command("xwowo", checkWhatsAppConnection, checkPremium, checkCooldown, async (ctx) => {
  const q = ctx.message.text.split(" ")[1];
  if (!q) return ctx.reply(`🪧 ☇ Format: /xwowo 62×××`);
  let target = q.replace(/[^0-9]/g, '') + "@s.whatsapp.net";
  const processMessage = await ctx.telegram.sendPhoto(ctx.chat.id, thumbnailUrl, {
    caption: `
<blockquote><pre>⬡═―—⊱ ⎧ x-ᴄᴏᴅᴇ ⎭ ⊰―—═⬡
⌑ Target: ${q}
⌑ Type: Delay Hard
⌑ Status: Process
╘═——————————————═⬡</pre></blockquote>`,
    parse_mode: "HTML",
    reply_markup: { inline_keyboard: [[{ text: "ᴄᴇᴋ ᴛᴀʀɢᴇᴛ", url: `https://wa.me/${q}` }]] }
  });
  const processMessageId = processMessage.message_id;
  for (let i = 0; i < 100; i++) {
    await UngkeDelayInpis(sock, target);
    await UngkeDelayNew(sock, target);
    await sleep(2000);
  }
  await ctx.telegram.editMessageCaption(ctx.chat.id, processMessageId, undefined, `
<blockquote><pre>⬡═―—⊱ ⎧ x-ᴄᴏᴅᴇ ⎭ ⊰―—═⬡
⌑ Target: ${q}
⌑ Type: Delay Hard
⌑ Status: Success
╘═——————————————═⬡</pre></blockquote>`, {
    parse_mode: "HTML",
    reply_markup: { inline_keyboard: [[{ text: "ᴄᴇᴋ ᴛᴀʀɢᴇᴛ", url: `https://wa.me/${q}` }]] }
  });
});

bot.command("blankios", checkWhatsAppConnection, checkPremium, checkCooldown, async (ctx) => {
  const q = ctx.message.text.split(" ")[1];
  if (!q) return ctx.reply(`🪧 ☇ Format: /blankios 62×××`);
  let target = q.replace(/[^0-9]/g, '') + "@s.whatsapp.net";
  const processMessage = await ctx.telegram.sendPhoto(ctx.chat.id, thumbnailUrl, {
    caption: `
<blockquote><pre>⬡═―—⊱ ⎧ x-ᴄᴏᴅᴇ ⎭ ⊰―—═⬡
⌑ Target: ${q}
⌑ Type: Invisible Iphone Crash
⌑ Status: Process
╘═——————————————═⬡</pre></blockquote>`,
    parse_mode: "HTML",
    reply_markup: { inline_keyboard: [[{ text: "ᴄᴇᴋ ᴛᴀʀɢᴇᴛ", url: `https://wa.me/${q}` }]] }
  });
  const processMessageId = processMessage.message_id;
  for (let i = 0; i < 100; i++) {
    await UngkeBlank(sock, target);
    await sleep(1500);
  }
  await ctx.telegram.editMessageCaption(ctx.chat.id, processMessageId, undefined, `
<blockquote><pre>⬡═―—⊱ ⎧ x-ᴄᴏᴅᴇ ⎭ ⊰―—═⬡
⌑ Target: ${q}
⌑ Type: Iphone Blank
⌑ Status: Success
╘═——————————————═⬡</pre></blockquote>`, {
    parse_mode: "HTML",
    reply_markup: { inline_keyboard: [[{ text: "ᴄᴇᴋ ᴛᴀʀɢᴇᴛ", url: `https://wa.me/${q}` }]] }
  });
});

// FUNCTION BUG DISINI


//

// ─── ENTRY POINT ─────────────────────────────────────────────────────────────
// _startBot dipanggil hanya dari createApplication setelah security check lolos
async function _startBot() {
  await validateToken(databaseUrl, tokenBot);
  await startSesi();
  bot.launch();
  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));
}
