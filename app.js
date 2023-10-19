require('dotenv').config();
const express = require('express');

const chatRoute = require('./routes/chat');

const { Client, RemoteAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const QRCode = require('qrcode');
const { PassThrough } = require('stream');

// Require database
const { MongoStore } = require('wwebjs-mongo');
const mongoose = require('mongoose');

let globalQR;
let isConnected = false;

const connect = async () => {
  // Load the session data
  mongoose.connect(process.env.MONGODB_URI).then(() => {
    const store = new MongoStore({ mongoose: mongoose });
    global.client = new Client({
      puppeteer: { args: ['--no-sandbox', '--disable-dev-shm-usage'] },
      authStrategy: new RemoteAuth({
        store: store,
        backupSyncIntervalMs: 300000,
      }),
    });

    client.on('qr', (qr) => {
      globalQR = qr;
      qrcode.generate(qr, { small: true });
    });

    client.on('ready', () => {
      isConnected = true;
      console.log('Client is ready!');
    });

    client.on('message', (message) => {
      console.log('message', message.body);
      if (message.body === '!ping') {
        console.log(message.from);
        client.sendMessage(message.from, 'pong');
      }
    });

    client.initialize();
  });
};

(() => {
  if (!process.env.API_KEY) {
    throw Error('API_KEY must be set');
  }
  console.log(`API Key: ${process.env.API_KEY}`);

  connect();
})();

const app = express();
const port = process.env.PORT || 5000;

app.use(express.json({ limit: '50mb' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  console.log(req.method + ' : ' + req.path);
  next();
});

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, API-Key'
  );
  next();
});

app.use('/connect', async (req, res) => {
  await connect();
  if (globalQR) {
    try {
      const qrStream = new PassThrough();
      const result = await QRCode.toFileStream(qrStream, globalQR, {
        type: 'png',
        width: 200,
        errorCorrectionLevel: 'H',
      });

      qrStream.pipe(res);
    } catch (err) {
      console.error('Failed to return content', err);
    }
  } else {
    res.status(404).send({ status: 'error', message: 'qr not ready' });
  }
});

// app.use((req, res, next) => {
//   const apiKey = req.get('API-Key');
//   if (!apiKey || apiKey !== process.env.API_KEY) {
//     res
//       .status(401)
//       .send({ status: 'Unauthorized', message: 'Invalid or Missing Key' });
//   } else {
//     next();
//   }
// });

app.use('/chat', chatRoute);

app.use('*', (req, res) => {
  res.status(404).send({ status: 'error', message: 'Not Found' });
});

app.listen(port, () => {
  console.log(`Server Running Live on Port: ${port}`);
});
