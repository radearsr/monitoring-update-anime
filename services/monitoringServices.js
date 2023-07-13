require("dotenv").config();
const axiosServices = require("./axiosServices");
const telegramServices = require("./telegramServices");
const animeServices = require("./animeServices");
const utils = require("../utils");

const monitoringAnimesServices = async (botToken, chatId) => {
  try {
    await telegramServices.senderNofitication(botToken, chatId, `Monit Anime Start [${utils.currentTime()}]`);
    const liveAnimeLists = await axiosServices.getAllAnimes(process.env.OTAKUDESU_URL);
    // console.log(liveAnimeLists);
    const liveAnimesCount = liveAnimeLists.length;
    const localAnimesCount = await animeServices.getAnimesCount();

    await telegramServices.senderNofitication(botToken, chatId, `>> LIVE <<\n>> ${liveAnimesCount} <<\n>> LOCAL <<\n>>${localAnimesCount}<<\n[${utils.currentTime()}]`);

    if (liveAnimesCount <= localAnimesCount) {
      await telegramServices.senderNofitication(botToken, chatId, `Anime Up To Date [${utils.currentTime()}]`);
      return telegramServices.senderNofitication(botToken, chatId, `Monit Anime End [${utils.currentTime()}]`);
    }

    const localAnimeLists = await animeServices.getAllAnimesWithoutFilter();
    const updatedAnimes = utils.compareAndListed(localAnimeLists, liveAnimeLists);

    await telegramServices.senderNofitication(botToken, chatId, `Update Anime ${updatedAnimes.length} [${utils.currentTime()}]`);

    for (let idx = 0; idx < updatedAnimes.length; idx++) {
      try {
        const details = await axiosServices.getDetailAnime(updatedAnimes[idx].link);
        if (new Date(details.releaseDate) != "Invalid Date") {
          const uploadedPoster = await axiosServices.uploadImage(details.poster, details.title);
          const postedAnime = await animeServices.postNewAnime({
            ...details,
            status: updatedAnimes[idx].status.toUpperCase(),
            type: updatedAnimes[idx].type.toUpperCase(),
            rating: parseFloat(details.rating),
            poster: uploadedPoster,
          });
          await animeServices.postNewAnimeSource({
            animeId: postedAnime.id,
            link: updatedAnimes[idx].link,
            scrapingStrategy: "OTAKUDESU"
          });
          await telegramServices.senderSuccessUpdateNewAnime(botToken, chatId, postedAnime.title);
        }
      } catch (error) {
        // console.log(error);
        await telegramServices.senderNofitication(botToken, chatId, `${updatedAnimes[idx].title}\n${JSON.stringify(error.response.data) ||  error.message}`);
      }
    }
  } catch (error) {
    console.log(error);
    await telegramServices.senderNofitication(botToken, chatId, error.message);
  }
}

// const monitoringEpisodeServices = async (botToken, chatId) => {
//   try {
//     await axiosServices.senderNofitication(botToken, chatId, `Monit Episode Start [${utils.currentTime()}]`);
//     console.log(`Program Start [${utils.currentTime()}]`);
//     const updatedAnimes = [];
//     // Get Animes Ongoing From Supabase DB
//     console.log(`Get Animes Ongoing [${utils.currentTime()}]`);
//     const ongoingAnimes = await prismaServices.animesOngoing();
//     // console.log({ ongoingAnimes });
//     // Get Updated Link Episode
//     console.log(`Get Updated Link Episode [${utils.currentTime()}]`);
//     await Promise.all(ongoingAnimes.map(async (anime) => {
//       const updatedLinks = await axiosServices.checkUpdatedAnime(ADDON_API_ENDPOINT, anime.originalSource, anime.totalEpisode);
//       if (updatedLinks.length >= 1) {
//         updatedLinks.forEach((link) => {
//           updatedAnimes.push({
//             id: anime.animeId,
//             title: anime.title,
//             link
//           });
//         });
//       }
//     }));
//     console.log(updatedAnimes);
//     // Get Embed Player From Updated Link Episode
//     console.log(`Get Embed Player [${utils.currentTime()}]`);
//     const payloadForUpdate = await Promise.all(updatedAnimes.map(async (anime) => {
//       const [,slugAnime] = anime.link.split("/episode/");
//       let episodeType;
//       let textEpisode;
//       let numEps;
//       if (slugAnime.includes("-ova")) {
//         [textEpisode] = slugAnime.match(/.ova-[0-9]{1,6}/);
//         [,numEps] = textEpisode.split("ova-");
//         episodeType = "Ova";
//       } else if (slugAnime.includes("bagian")) {
//         [textEpisode] = slugAnime.match(/.bagian-[0-9]{1,6}/);
//         [,numEps] = textEpisode.split("bagian-");
//         episodeType = "Tv";
//       } else if (slugAnime.includes("episode")) {
//         [textEpisode] = slugAnime.match(/.episode-[0-9]{1,6}/);
//         [,numEps] = textEpisode.split("episode-");
//         episodeType = "Tv";
//       } else if ((/.-[0-9]{1,6}-/).test(anime.link)){
//         [textEpisode] = slugAnime.match(/.-[0-9]{1,6}/);
//         [,numEps] = textEpisode.split("-");
//         episodeType = "Tv";
//       } else {
//         numEps = 1;
//         episodeType = "Tv";
//       }
//       const embedLink = await axiosServices.getEmbedUpdatedAnime(ADDON_API_ENDPOINT, anime.link);
//       return {
//         notif: {
//           title: anime.title,
//           episode: numEps,
//         },
//         payload: {    
//           animeId: anime.id,
//           episodeType,
//           streamStrategy: "Otakudesu",
//           numEpisode: parseInt(numEps),
//           sourceDefault: embedLink,
//           sourceHd: "NULL",
//           originalSourceEp: anime.link,
//           publish: "Publish",
//         }
//       }
//     }));
//     await axiosServices.senderNofitication(botToken, chatId, `Jumlah Anime Update ${updatedAnimes.length}`);
//     payloadForUpdate.forEach(async (update, idx) => {
//       setTimeout(async () => {
//         const createdEps = await prismaServices.createEpisode(update.payload);
//         await prismaServices.updateAnimeLastUpdateEpisode(createdEps.animeId);
//         await axiosServices.senderSuccessUpdateEpisode(botToken, chatId, update.notif.title, update.notif.episode);
//       }, (idx * 10000))
//     });
//     await axiosServices.senderNofitication(botToken, chatId, `Monit Episode End [${utils.currentTime()}]`);
//   } catch (error) {
//     console.log(error);
//     await axiosServices.senderNofitication(botToken, chatId, error.message);
//   }
// }

module.exports = {
  monitoringAnimesServices
};
