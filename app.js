require("dotenv").config();
const { Cron } = require("croner");
const prismaServices = require("./services/prismaServices");
const axiosServices = require("./services/axiosServices");
const utils = require("./utils");

const ADDON_API_ENDPOINT = "http://localhost:4000";

const monitoringAnimesServices = async () => {
  try {
    await axiosServices.senderNofitication(process.env.BOT_TOKEN, process.env.GROUP_ID, `Monit Anime Start [${utils.currentTime()}]`);
    const liveListAnimes = await axiosServices.getAllAnimes(ADDON_API_ENDPOINT, "https://otakudesu.lol/anime-list");
    const localCountAnimes = await prismaServices.getCountAnimes();
    await axiosServices.senderNofitication(process.env.BOT_TOKEN, process.env.GROUP_ID, `LIVE=${liveListAnimes.length}\nLOCAL=${localCountAnimes}\n[${utils.currentTime()}]`);
    if (liveListAnimes.length <= localCountAnimes) {
      await axiosServices.senderNofitication(process.env.BOT_TOKEN, process.env.GROUP_ID, `Anime Up To Date [${utils.currentTime()}]`);
      return axiosServices.senderNofitication(process.env.BOT_TOKEN, process.env.GROUP_ID, `Monit Anime End [${utils.currentTime()}]`);
    }
    const localAllAnimes = await prismaServices.getAllAnimes();
    const updatedAnimes = utils.compareAndListed(localAllAnimes, liveListAnimes);
    await axiosServices.senderNofitication(process.env.BOT_TOKEN, process.env.GROUP_ID, `Update Anime ${updatedAnimes.length} [${utils.currentTime()}]`);
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
          releaseDate: new Date(details.releaseDate)
        };
      }
      detailWithTrouble.lists.push({
        ...updateAnime,
        ...details,
      });
    }));
    const filteredUndefinedDetails = updatedWithDetails.filter((updatedList) => updatedList !== undefined);
    console.log(filteredUndefinedDetails);
    await axiosServices.senderNofitication(process.env.BOT_TOKEN, process.env.GROUP_ID, `Anime Trouble ${JSON.stringify(detailWithTrouble)} [${utils.currentTime()}]`);
    await axiosServices.senderNofitication(process.env.BOT_TOKEN, process.env.GROUP_ID, `Monit Anime End [${utils.currentTime()}]`);
  } catch (error) {
    await axiosServices.senderNofitication(process.env.BOT_TOKEN, process.env.GROUP_ID, error.message);
  }
}

const monitoringEpisodeServices = async () => {
  try {
    await axiosServices.senderNofitication(process.env.BOT_TOKEN, process.env.GROUP_ID, `Monit Episode Start [${utils.currentTime()}]`);
    console.log(`Program Start [${utils.currentTime()}]`);
    const updatedAnimes = [];
    // Get Animes Ongoing From Supabase DB
    console.log(`Get Animes Ongoing [${utils.currentTime()}]`);
    const ongoingAnimes = await prismaServices.animesOngoing();
    console.log(ongoingAnimes);
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
    console.log(updatedAnimes);
    // Get Embed Player From Updated Link Episode
    console.log(`Get Embed Player [${utils.currentTime()}]`);
    const payloadForUpdate = await Promise.all(updatedAnimes.map(async (anime) => {
      const [textEpisode] = anime.link.match(/.episode-[0-9]{1,6}/);
      const [,numEps] = textEpisode.split("-episode-");
      const embedLink = await axiosServices.getEmbedUpdatedAnime(ADDON_API_ENDPOINT, anime.link);
      return {
        notif: {
          title: anime.title,
          episode: numEps,
        },
        payload: {    
          animeId: anime.id,
          episodeType: "Tv",
          streamStrategy: "Otakudesu",
          numEpisode: parseInt(numEps),
          sourceDefault: embedLink,
          sourceHd: "NULL",
          originalSourceEp: anime.link,
          publish: "Publish",
        }
      }
    }));
    await axiosServices.senderNofitication(process.env.BOT_TOKEN, process.env.GROUP_ID, `Jumlah Anime Update ${updatedAnimes.length}`);
    console.log(payloadForUpdate);
    payloadForUpdate.forEach(async (update, idx) => {
      setTimeout(async () => {
        await prismaServices.createEpisode(update.payload);
        await axiosServices.senderSuccessUpdateAnime(process.env.BOT_TOKEN, process.env.GROUP_ID, update.notif.title, update.notif.episode);
      }, (idx * 10000))
    });
    await axiosServices.senderNofitication(process.env.BOT_TOKEN, process.env.GROUP_ID, `Monit Episode End [${utils.currentTime()}]`);
  } catch (error) {
    await axiosServices.senderNofitication(process.env.BOT_TOKEN, process.env.GROUP_ID, error.message);
  }
}

Cron("0 */6 * * *", { timezone: "Asia/Jakarta" }, () => {
});

(async () => {
  await monitoringAnimesServices()
})()