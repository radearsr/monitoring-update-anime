const { default: axios } = require("axios");

const checkUpdatedAnime = async (endpoint, linkPage, totalEps) => {
  const { data } = await axios.post(`${endpoint}/api/monitoring`, {
    link: linkPage,
    lastTotalEps: totalEps,
  });
  if (data.status === "success" ) {
    return data.data;
  } else {
    return [];
  }
};

const getEmbedUpdatedAnime = async (endpoint, linkPage) => {
  const { data } = await axios.post(`${endpoint}/api/embed`, {
    link: linkPage,
  });
  if (data.status === "success") {
    return data.data;
  } else {
    return [];
  }
};

const getAllAnimes = async (endpoint, linkPage) => {
  const { data } = await axios.post(`${endpoint}/api/animes`, {
    link: linkPage,
  });
  if (data.status === "success") {
    return data.data;
  } else {
    return [];
  }
};

const getDetailAnime = async (endpoint, linkPage) => {
  const { data } = await axios.post(`${endpoint}/api/details`, {
    link: linkPage,
  });
  if (data.status === "success") {
    return data.data;
  } else {
    return [];
  }
};

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
  checkUpdatedAnime,
  getEmbedUpdatedAnime,
  getAllAnimes,
  getDetailAnime,
  senderSuccessUpdateEpisode,
  senderSuccessUpdateNewAnime,
  senderNofitication,
};
