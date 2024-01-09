const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const mongoose = require('mongoose');

const token = '6520329227:AAGKYsnqkOdXXLiV4VVLKWKqol5mF8wCvj8'; // Replace with your Telegram API token
const bot = new TelegramBot(token, { polling: true });

mongoose.connect("mongodb://127.0.0.1:27017/telegram_data", {
  useNewUrlParser: true,
  useUnifiedTopology: true // Adding this option for newer versions of Mongoose
});

const DB = mongoose.connection;

DB.on('error', console.error.bind(console, "Connection Error"));
DB.once('open', () => {
  console.log("Connected to DB");
});

const dataSchema = new mongoose.Schema({
  Word: String,
  Definition: String,
  Example: String,
  Audio: String,
  Date: { type: Date, default: Date.now } // Use type Date for Date fields
});

const Data = mongoose.model('Data', dataSchema);

bot.on('message', async function (msg) {
  if (msg.text === 'HISTORY') {
    try {
      const telegramData = await Data.find({ userID: msg.from.id });
      if (telegramData.length === 0) {
        bot.sendMessage(msg.chat.id, "No history found for this user.");
      } else {
        for (const data of telegramData) {
          const messages = [
            bot.sendMessage(msg.chat.id, "👇"),
            bot.sendMessage(msg.chat.id, "Word: " + data.Word),
            bot.sendMessage(msg.chat.id, "Definition: " + data.Definition),
            bot.sendMessage(msg.chat.id, "Example: " + data.Example),
            bot.sendMessage(msg.chat.id, "Audio: " + data.Audio)
          ];
          await Promise.all(messages);
        }
      }
    } catch (error) {
      console.error("Error fetching data from the database");
      bot.sendMessage(msg.chat.id, "Error fetching data from the database");
    }
  } else {
    axios.get('https://api.dictionaryapi.dev/api/v2/entries/en/' + msg.text)
      .then(async (response) => {
        const data = response.data;
        if (data[0] == undefined) {
          console.log(msg.text + " - Word not available in dictionary");
          bot.sendMessage(msg.chat.id, "Word not available in dictionary");
        } else {
          const word = data[0].word;
          const meanings = data[0].meanings[0];
          const definition = meanings.definitions[0].definition || "Not available";
          const example = meanings.definitions[0].example || "Not available";
          const audio = (data[0].phonetics && data[0].phonetics[0] && data[0].phonetics[0].audio) ? data[0].phonetics[0].audio : "Not available";

          const newData = new Data({
            Audio: audio,
            Example: example,
            Word: word,
            Definition: definition,
            userID: msg.from.id
          });

          newData.save()
            .then(() => {
              console.log(word + " stored successfully in the database");
              bot.sendMessage(msg.chat.id, word + " stored successfully");
            })
            .catch((error) => {
              console.error("Error storing data in the database:", error);
              bot.sendMessage(msg.chat.id, "Error storing data in the database");
            });

          const messages = [
            bot.sendMessage(msg.chat.id, word),
            bot.sendMessage(msg.chat.id, "Definition: " + definition),
            bot.sendMessage(msg.chat.id, "Example: " + example),
            bot.sendMessage(msg.chat.id, "Audio: " + audio)
          ];

          await Promise.all(messages);
        }
      })
      .catch((error) => {
        console.error("Error fetching data from the API");
        bot.sendMessage(msg.chat.id, "Error fetching data from the API");
      });
  }
});
