require("dotenv").config();
const express = require("express");
const { WAConnection } = require("@adiwajshing/baileys");
const cache = require("./cache");
const chatRoute = require("./routes/chat");

global.client = new WAConnection();
client.version = [3, 3234, 9];
client.logger.level = "warn";

(() => {
  if (!process.env.API_KEY) {
    throw Error("API_KEY must be set");
  }
  console.log(`API Key: ${process.env.API_KEY}`);
})();

const app = express();
const port = process.env.PORT || 5000;

app.use(express.json({ limit: "50mb" }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
client.on("open", async () => {
  const authInfo = await client.base64EncodedAuthInfo();
  await cache.set("session", JSON.stringify(authInfo));
});

client.on("connecting", () => {
  console.log(`Connecting to client...`);
});

client.on("chats-received", () => {
  console.log("Client is ready!");
});

client.on("chat-update", async (chatUpdate) => {
  const isChatReceived = chatUpdate.messages && chatUpdate.count;
  const isChatSended = chatUpdate.messages;

  if (isChatReceived) {
    const {
      message,
      key: { remoteJid },
    } = chatUpdate.messages.all()[0];
    if (message.conversation === "random") {
      await client.sendMessage(remoteJid, randomWords(), MessageType.text);
    }
    console.log(`Chat Received from: ${remoteJid}:`, message);
  } else if (isChatSended) {
    const {
      message,
      key: { remoteJid },
      status,
    } = chatUpdate.messages.all()[0];
    if (status === 2) {
      console.log(`Chat Sended to: ${remoteJid}:`, message);
    }
  }
});

(async () => {
  const session = await cache.get("session");
  if (session) {
    console.log("Session founded from cache", session);
    client.loadAuthInfo(JSON.parse(session));
  }

  client.connect().catch((err) => {
    console.log("error trying to connect to whatsapp: ", err);
    cache.del("session");
    client.connect();
  });
})();

app.use((req, res, next) => {
  console.log(req.method + " : " + req.path);
  next();
});

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, API-Key"
  );
  next();
});

app.use((req, res, next) => {
  const apiKey = req.get("API-Key");
  if (!apiKey || apiKey !== process.env.API_KEY) {
    res
      .status(401)
      .send({ status: "Unauthorized", message: "Invalid or Missing Key" });
  } else {
    next();
  }
});

app.use("/chat", chatRoute);

app.use("*", (req, res) => {
  res.status(404).send({ status: "error", message: "Not Found" });
});

app.listen(port, () => {
  console.log(`Server Running Live on Port: ${port}`);
});
