require("dotenv").config();
const { Cron } = require("croner");
const prismaServices = require("./services/prismaServices");
const axiosServices = require("./services/axiosServices");
const utils = require("./utils");

const monitoringServices = async () => {
  try {
    await axiosServices.senderNofitication(process.env.BOT_TOKEN, process.env.GROUP_ID, `Program Start [${utils.currentTime()}]`);
    console.log(`Program Start [${utils.currentTime()}]`);
    const updatedAnimes = [];
    // Get Animes Ongoing From Supabase DB
    console.log(`Get Animes Ongoing [${utils.currentTime()}]`);
    const ongoingAnimes = await prismaServices.animesOngoing();
    console.log(ongoingAnimes);
    // Get Updated Link Episode
    console.log(`Get Updated Link Episode [${utils.currentTime()}]`);
    await Promise.all(ongoingAnimes.map(async (anime) => {
      const updatedLinks = await axiosServices.checkUpdatedAnime("https://addon.deyapro.com", anime.originalSource, anime.totalEpisode);
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
      const embedLink = await axiosServices.getEmbedUpdatedAnime("https://addon.deyapro.com", anime.link);
      return {
        notif: {
          title: anime.title,
          episode: numEps,
        },
        payload: {    
          animeId: anime.id,
          episodeType: "Tv",
          streamStrategy: "Otakudesu",
          numEpisode: numEps,
          sourceDefault: embedLink,
          sourceHd: "NULL",
          originalSourceEp: anime.link,
          publish: true
        }
      }
    }));
    await axiosServices.senderNofitication(process.env.BOT_TOKEN, process.env.GROUP_ID, `Jumlah Anime Update ${updatedAnimes.length}`);
    console.log(payloadForUpdate);
    // payloadForUpdate.forEach(async (update, idx) => {
    //   setTimeout(async () => {
    //     await prismaServices.createEpisode(update.payload);
    //     await axiosServices.senderSuccessUpdateAnime(process.env.BOT_TOKEN, process.env.GROUP_ID, update.notif.title, update.notif.episode);
    //   }, (idx * 10000))
    // });
    // await axiosServices.senderNofitication(process.env.BOT_TOKEN, process.env.GROUP_ID, `Monitoring End [${utils.currentTime()}]`);
  } catch (error) {
    await axiosServices.senderNofitication(process.env.BOT_TOKEN, process.env.GROUP_ID, error.message);
  }
}

Cron("0 */6 * * *", { timezone: "Asia/Jakarta" }, () => {
});

(async () => {
  await monitoringServices()
})()