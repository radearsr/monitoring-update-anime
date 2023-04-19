require("dotenv").config();
const { Cron } = require("croner");
const { Telegraf } = require("telegraf")
const prismaServices = require("./services/prismaServices");
const axiosServices = require("./services/axiosServices");
const utils = require("./utils");
const fs = require("fs");

const ADDON_API_ENDPOINT = "https://addon.deyapro.com";
const bot = new Telegraf(process.env.BOT_TOKEN);

const monitoringAnimesServices = async (botToken, chatId) => {
  try {
    await axiosServices.senderNofitication(botToken, chatId, `Monit Anime Start [${utils.currentTime()}]`);
    const liveListAnimes = await axiosServices.getAllAnimes(ADDON_API_ENDPOINT, "https://otakudesu.lol/anime-list");
    const localCountAnimes = await prismaServices.getCountAnimes();
    await axiosServices.senderNofitication(botToken, chatId, `LIVE=${liveListAnimes.length}\nLOCAL=${localCountAnimes}\n[${utils.currentTime()}]`);
    if (liveListAnimes.length <= localCountAnimes) {
      await axiosServices.senderNofitication(botToken, chatId, `Anime Up To Date [${utils.currentTime()}]`);
      return axiosServices.senderNofitication(botToken, chatId, `Monit Anime End [${utils.currentTime()}]`);
    }
    const localAllAnimes = await prismaServices.getAllAnimes();
    const updatedAnimes = utils.compareAndListed(localAllAnimes, liveListAnimes);
    await axiosServices.senderNofitication(botToken, chatId, `Update Anime ${updatedAnimes.length} [${utils.currentTime()}]`);
    const detailWithTrouble = {
      lists: []
    };
    const updatedWithDetails = await Promise.all(updatedAnimes.map(async (updateAnime) => {
      const details = await axiosServices.getDetailAnime(ADDON_API_ENDPOINT, updateAnime.link);
      if (new Date(details.releaseDate).toString() !== "Invalid Date") {
        return {
          ...updateAnime,
          ...details,
          rating: parseFloat(details.rating),
          releaseDate: new Date(details.releaseDate),
          originalSource: updateAnime.link,
          publish: true,
        };
      }
      detailWithTrouble.lists.push({
        ...updateAnime,
        ...details,
      });
    }));
    const animesPayloadFiltered = updatedWithDetails.filter((updatedList) => updatedList !== undefined);
    // console.log(animesPayloadFiltered);
    animesPayloadFiltered.forEach((animePayload, idx) => {
      setTimeout(async () => {
        const addedAnime = await prismaServices.createNewAnime(animePayload);
        await axiosServices.senderSuccessUpdateNewAnime(botToken, chatId, addedAnime.title);
        await prismaServices.createAnimeGenres(animePayload.genres, addedAnime.animeId);
      }, idx * 10000);
    });
    await axiosServices.senderNofitication(botToken, chatId, `Anime Trouble ${JSON.stringify(detailWithTrouble)} [${utils.currentTime()}]`);
    await axiosServices.senderNofitication(botToken, chatId, `Monit Anime End [${utils.currentTime()}]`);
  } catch (error) {
    await axiosServices.senderNofitication(botToken, chatId, error.message);
  }
}

const monitoringEpisodeServices = async (botToken, chatId) => {
  try {
    await axiosServices.senderNofitication(botToken, chatId, `Monit Episode Start [${utils.currentTime()}]`);
    console.log(`Program Start [${utils.currentTime()}]`);
    const updatedAnimes = [];
    // Get Animes Ongoing From Supabase DB
    console.log(`Get Animes Ongoing [${utils.currentTime()}]`);
    const ongoingAnimes = await prismaServices.animesOngoing();
    // console.log(ongoingAnimes);
    // Get Updated Link Episode
    console.log(`Get Updated Link Episode [${utils.currentTime()}]`);
    await Promise.all(ongoingAnimes.map(async (anime) => {
      const updatedLinks = await axiosServices.checkUpdatedAnime(ADDON_API_ENDPOINT, anime.originalSource, anime.totalEpisode);
      if (updatedLinks.length >= 1) {
        updatedLinks.forEach((link) => {
          updatedAnimes.push({
            id: anime.animeId,
            title: anime.title,
            link
          });
        });
      }
    }));
    // console.log(updatedAnimes);
    // Get Embed Player From Updated Link Episode
    console.log(`Get Embed Player [${utils.currentTime()}]`);
    const payloadForUpdate = await Promise.all(updatedAnimes.map(async (anime) => {
      let episodeType;
      let textEpisode;
      let numEps;
      if (anime.link.includes("ova")) {
        [textEpisode] = anime.link.match(/.ova-[0-9]{1,6}/);
        [,numEps] = textEpisode.split("ova-");
        episodeType = "Ova";
      } else if (anime.link.includes("bagian")) {
        [textEpisode] = anime.link.match(/.bagian-[0-9]{1,6}/);
        [,numEps] = textEpisode.split("bagian-");
        episodeType = "Tv";
      } else if (anime.link.includes("episode")) {
        [textEpisode] = anime.link.match(/.episode-[0-9]{1,6}/);
        [,numEps] = textEpisode.split("episode-");
        episodeType = "Tv";
      } else {
        numEps = 1;
        episodeType = "Tv";
      }
      const embedLink = await axiosServices.getEmbedUpdatedAnime(ADDON_API_ENDPOINT, anime.link);
      return {
        notif: {
          title: anime.title,
          episode: numEps,
        },
        payload: {    
          animeId: anime.id,
          episodeType,
          streamStrategy: "Otakudesu",
          numEpisode: parseInt(numEps),
          sourceDefault: embedLink,
          sourceHd: "NULL",
          originalSourceEp: anime.link,
          publish: "Publish",
        }
      }
    }));
    await axiosServices.senderNofitication(botToken, chatId, `Jumlah Anime Update ${updatedAnimes.length}`);
    payloadForUpdate.forEach(async (update, idx) => {
      setTimeout(async () => {
        const createdEps = await prismaServices.createEpisode(update.payload);
        await prismaServices.updateAnimeLastUpdateEpisode(createdEps.animeId);
        await axiosServices.senderSuccessUpdateEpisode(botToken, chatId, update.notif.title, update.notif.episode);
      }, (idx * 10000))
    });
    await axiosServices.senderNofitication(botToken, chatId, `Monit Episode End [${utils.currentTime()}]`);
  } catch (error) {
    console.log(error);
    await axiosServices.senderNofitication(botToken, chatId, error.message);
  }
}

Cron("0 */4 * * *", { timezone: "Asia/Jakarta" }, async () => {
  await monitoringEpisodeServices(process.env.BOT_TOKEN, process.env.GROUP_ID);
});

bot.command("newanime", async (ctx) => {
  await monitoringAnimesServices(process.env.BOT_TOKEN, ctx.chat.id);
});

bot.command("newepisode", async (ctx) => {
  await monitoringEpisodeServices(process.env.BOT_TOKEN, ctx.chat.id);
});

bot.launch();
