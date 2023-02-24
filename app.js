require("dotenv").config();
const axios = require("axios");
const fs = require("fs");
const cron = require("node-cron");
const {
  senderSuccessUpdateAnime,
  senderNofitication,
} = require("./telegramService");
const {
  currentTime
} = require("./DateService")
const {
  localConf,
  publicConf,
  connectToDatabase,
  queryDatabase,
  logging,
} = require("./database/functions");

const getMasterLink = async (mongoId, totalEps) => {
  const con = await connectToDatabase(publicConf);
  const [result] = await queryDatabase(con, "SELECT od.mongodb, ol.link, od.title FROM otakudesu_lists AS ol JOIN otakudesu_detail AS od ON ol.id=od.listId WHERE od.mongodb=?", [mongoId]);
  return {
    id: result.mongodb,
    link: result.link,
    title: result.title,
    totalEps,
  };
}

const getAllAnimesOngoing = async (endpoint) => {
  const { data } = await axios.get(`${endpoint}/api/v1/animes/list?status=ongoing&type=series`);
  if (data.status === "success") {
    return data.data;
  } else {
    return [];
  }
};

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

const loginAPI = async () => {
  const login = await axios.post("https://api.deyapro.com/api/v1/authentications", {
    username: "radea_surya",
    password: "radea123"
  });
  return writeTokenToFile(login.data.data.accessToken, login.data.data.refreshToken);
};

const readTokenFromFile = () => (
  new Promise((resolve, reject) => {
    fs.readFile("./token.json", "utf8", (err, jsonStr) => {
      if (err) {
        reject(err);
      }
      resolve(jsonStr);
    })
  })
);

const writeTokenToFile = (accessToken, refreshToken) => {
  const tokens = {
    accessToken,
    refreshToken
  }
  const jsonString = JSON.stringify(tokens)
  return new Promise((resolve, reject) => {
    fs.writeFile('./token.json', jsonString, err => {
      if (err) {
        reject('Error writing file', err);
      }
      resolve("success");
    })
  });
}

const checkAccessToken = async (accessToken) => {
  try {
    console.log("CheckAccessToken");
    const { data } = await axios.post("https://api.deyapro.com/api/v1/episodes", {}, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      },
    });
    console.log("Token masih bisa");
    return accessToken;
  } catch (error) {
    if (error.response) {
      if (error.response.data.message === "Token tidak valid") {
        console.log(error.response.data);
        await loginAPI();
      } else if (error.response.data.message === "Access token expired") {
        console.log(error.response.data);
        await loginAPI();
      }
    }
  }
}

const updateAPIAnime = async (accessToken, notif, payload) => {
  try {
    console.log(`Update Method Running [${currentTime(new Date().toISOString())}]`);
    const addNewEpisode = await axios.post("https://api.deyapro.com/api/v1/episodes", payload, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      },
    });
    console.log(addNewEpisode.data.data);
    await senderSuccessUpdateAnime(axios, process.env.BOT_TOKEN, process.env.GROUP_ID, notif.title, notif.episode);
  } catch (error) {
    console.log(error);
  }
}

const getAccessToken = async () => {
  const token = JSON.parse(await readTokenFromFile());
  await checkAccessToken(token.accessToken);
  const newToken = JSON.parse(await readTokenFromFile());
  return newToken.accessToken;
}


cron.schedule("0 */6 * * *", () => {
  (async () => {
    try {
      await senderNofitication(axios, process.env.BOT_TOKEN, process.env.GROUP_ID, `Program Start [${currentTime(new Date().toISOString())}]`);
      console.log(`Program Start [${currentTime(new Date().toISOString())}]`);
      const updatedAnimes = [];
      // Get Animes Ongoing From Main API
      console.log(`Get Animes Ongoing [${currentTime(new Date().toISOString())}]`);
      const ongoingAnimes = await getAllAnimesOngoing("https://api.deyapro.com");
      // Get Details Anime From SQL
      console.log(`Get Details Anime [${currentTime(new Date().toISOString())}]`);
      const detailAnimes = await Promise.all(ongoingAnimes.map(async (anime) => {
        return getMasterLink(anime.id, anime.totalEps)
      }));
      // Get Updated Link Episode
      console.log(`Get Updated Link Episode [${currentTime(new Date().toISOString())}]`);
      await Promise.all(detailAnimes.map(async (anime) => {
        const updatedLinks = await checkUpdatedAnime("https://addon.deyapro.com", anime.link, anime.totalEps);
        if (updatedLinks.length >= 1) {
          updatedLinks.forEach((link) => {
            updatedAnimes.push({
              id: anime.id,
              title: anime.title,
              link
            });
          });
        }
      }));
      // Get Embed Player From Updated Link Episode
      console.log(`Get Embed Player [${currentTime(new Date().toISOString())}]`);
      const payloadForUpdate = await Promise.all(updatedAnimes.map(async (anime) => {
        const [textEpisode] = anime.link.match(/.episode-[0-9]{1,6}/);
        const [,numEps] = textEpisode.split("-episode-");
        const embedLink = await getEmbedUpdatedAnime("https://addon.deyapro.com", anime.link);
        return {
          notif: {
            title: anime.title,
            episode: numEps,
          },
          payload: {
            numEpisode: parseFloat(numEps),
            source360p: embedLink,
            source480p: "-",
            source720p: "-",
            result360p: "-",
            result480p:"-",
            result720p: "-",
            animeId: anime.id,
            published: true
          }
        }
      }));
    
      const accessToken = await getAccessToken();
      console.log("🚀 ~ file: app.js:191 ~ accessToken:", accessToken)
      console.log(`Update Anime / Addding new episode [${currentTime(new Date().toISOString())}]`);
      await senderNofitication(axios, process.env.BOT_TOKEN, process.env.GROUP_ID, `Jumlah Anime Update ${updatedAnimes.length}`);
      payloadForUpdate.forEach(async (update, idx) => {
        setTimeout(async () => {
          await updateAPIAnime(accessToken, update.notif, update.payload);
        }, (idx * 10000))
      });
      await senderNofitication(axios, process.env.BOT_TOKEN, process.env.GROUP_ID, `Monitoring End [${currentTime(new Date().toISOString())}]`);
    } catch (error) {
      await senderNofitication(axios, process.env.BOT_TOKEN, process.env.GROUP_ID, error.message);
    }
  })();
})
