require("dotenv").config();
const { default: axios } = require("axios");

const senderSuccessUpdateEpisode = async (teleToken, teleMessageId, title, episode) => {
  const message = `✅ ANIME UPDATE\n>>${title}<<\n>>Episode ${episode}<<\n`;
  await axios.get(`https://api.telegram.org/bot${teleToken}/sendMessage`, {
    params: {
      chat_id: teleMessageId,
      text: message,
    }
  });
};

const senderSuccessUpdateNewAnime = async (teleToken, teleMessageId, title) => {
  const message = `🔅 ANIME NEW\n>>${title}<<\n`;
  await axios.get(`https://api.telegram.org/bot${teleToken}/sendMessage`, {
    params: {
      chat_id: teleMessageId,
      text: message,
    }
  });
};

const senderNofitication = async (teleToken, teleMessageId, text) => {
  const message = `>> NOTIFIKASI <<\n${text}`;
  await axios.get(`https://api.telegram.org/bot${teleToken}/sendMessage`, {
    params: {
      chat_id: teleMessageId,
      text: message,
    }
  });
};

module.exports = {
  senderSuccessUpdateEpisode,
  senderSuccessUpdateNewAnime,
  senderNofitication,
};