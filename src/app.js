require("dotenv/config");
const { Client } = require("discord.js");
const { OpenAI } = require("openai");

const client = new Client({
  intents: ["Guilds", "GuildMessages", "GuildMembers", "MessageContent"],
});

client.on("ready", () => {
  console.log("bot is online.");
});

const IGNORE_PREFIX = "!";
const CHANNEL = ["1215540002663047189"];

const openai = new OpenAI({
  apiKey: process.env.OPENAI_KEY,
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) {
    return;
  }

  if (message.content.startsWith(IGNORE_PREFIX)) {
    return;
  }

  if (
    !CHANNEL.includes(message.channelId) &&
    !message.mentions.users.has(client.user.id)
  ) {
    return;
  }

  await message.channel.sendTyping();

  const sendTypingInterval = setInterval(() => {
    message.channel.sendTyping();
  }, 5000);

  let conversation = [];
  conversation.push({
    role: "system",
    content: "saya adalah chat bot yang paling ramah.",
  });

  let prevMessages = await message.channel.messages.fetch({ limit: 10 });
  prevMessages.reverse();

  prevMessages.forEach((msg) => {
    if (msg.author.bot && msg.author.id !== client.user.id) {
      return;
    }

    if (msg.content.startsWith(IGNORE_PREFIX)) {
      return;
    }

    const username = msg.author.username
      .replace(/\s+/g, "_")
      .replace(/[^\w\s]/gi, "");

    if (msg.author.id === client.user.id) {
      conversation.push({
        role: "assistant",
        name: username,
        content: msg.content,
      });

      return;
    }

    conversation.push({
      role: "user",
      name: username,
      content: msg.content,
    });
  });

  const res = await openai.chat.completions
    .create({
      model: "gpt-3.5-turbo",
      messages: conversation,
    })
    .catch((error) => console.error("OPEN AI Error:\n", error));

  clearInterval(sendTypingInterval);

  if (!res) {
    message.reply("saya sedang mengalami masalah, cobalah lain waktu.");
    return;
  }
  message.reply(res.choices[0].message.content);
});

client.login(process.env.BOT_TOKEN);
