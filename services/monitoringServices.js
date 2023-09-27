require("dotenv").config();
const async = require("async");
const axiosServices = require("./axiosServices");
const telegramServices = require("./telegramServices");
const animeServices = require("./animeServices");
const utils = require("../utils");
const slugs = require("slugs");

const updateAnimeQueue = async.queue((task, completed) => {
  console.log(`[${utils.currentTime()}] TASK INSERT ${task.link}`);
  setTimeout(async () => {
    try {
      console.log(`[${utils.currentTime()}] GET ANIME DETAILS`);
      const details = await axiosServices.getDetailAnime(task.link);
      if (new Date(details.releaseDate) == "Invalid Date") {
        throw new Error(`INVALID_DATE__${task.link}`);
      }
      console.log(
        `[${utils.currentTime()}] UPLOAD POSTER START (${details.poster})`
      );
      const uploadedPoster = await axiosServices.uploadImage(
        details.poster,
        details.title
      );
      console.log(`[${utils.currentTime()}] POST ANIME START`);
      const postedAnime = await animeServices.postNewAnime({
        ...details,
        status: task.status.toUpperCase(),
        type: task.type.toUpperCase(),
        rating: parseFloat(details.rating),
        poster: uploadedPoster,
      });
      console.log(`[${utils.currentTime()}] POST ANIME SOURCE START`);
      await animeServices.postNewAnimeSource({
        animeId: postedAnime.id,
        link: task.link,
        scrapingStrategy: "OTAKUDESU",
      });
      console.log(`[${utils.currentTime()}] TASK END\n`);
      completed(null, details);
    } catch (error) {
      console.log(`[${utils.currentTime()}] TASK ERROR\n`);
      console.log(error);
      completed(error, null);
    }
  }, 5000);
}, 1);

const monitoringAnimesServices = async (botToken, chatId) => {
  try {
    console.log(`[${utils.currentTime()}] Monit Anime Start`);
    await telegramServices.senderNofitication(
      botToken,
      chatId,
      `Monit Anime Start [${utils.currentTime()}]`
    );

    console.log(
      `[${utils.currentTime()}] LIVE ANIME FROM ${process.env.OTAKUDESU_URL}`
    );

    const liveAnimeLists = await axiosServices.getAllAnimes(
      process.env.OTAKUDESU_URL
    );
    const liveAnimesCount = liveAnimeLists.length;

    console.log(
      `[${utils.currentTime()}] LOCAL ANIME FROM ${process.env.API_UTAMA}`
    );

    const localAnimesCount = await animeServices.getAnimesCount("OTAKUDESU");

    await telegramServices.senderNofitication(
      botToken,
      chatId,
      `>> LIVE <<\n>> ${liveAnimesCount} <<\n>> LOCAL <<\n>>${localAnimesCount}<<\n[${utils.currentTime()}]`
    );

    console.log(
      `[${utils.currentTime()}] LIVE |${liveAnimesCount}| LOCAL |${localAnimesCount}|`
    );

    if (liveAnimesCount <= localAnimesCount) {
      await telegramServices.senderNofitication(
        botToken,
        chatId,
        `Anime Up To Date [${utils.currentTime()}]`
      );
      return telegramServices.senderNofitication(
        botToken,
        chatId,
        `Monit Anime End [${utils.currentTime()}]`
      );
    }

    const localAnimeLists = await animeServices.getAllAnimesWithoutFilter();

    console.log(`[${utils.currentTime()}] COMPARE ANIME LIST`);

    const updatedAnimes = utils.compareAndListed(
      localAnimeLists,
      liveAnimeLists
    );

    await telegramServices.senderNofitication(
      botToken,
      chatId,
      `Update Anime ${updatedAnimes.length} [${utils.currentTime()}]`
    );

    updatedAnimes.forEach((updatedAnime) => {
      updateAnimeQueue.push(updatedAnime, async (error, taskResult) => {
        if (error) {
          await telegramServices.senderNofitication(
            botToken,
            chatId,
            error.message
          );
        } else {
          await telegramServices.senderSuccessUpdateNewAnime(
            botToken,
            chatId,
            taskResult.title
          );
        }
      });
    });
  } catch (error) {
    console.log(error);
    await telegramServices.senderNofitication(botToken, chatId, error.message);
  }
};

const monitoringEpisodeServices = async (botToken, chatId) => {
  try {
    await telegramServices.senderNofitication(
      botToken,
      chatId,
      `Monit Episode Start [${utils.currentTime()}]`
    );
    console.log(`Program Start [${utils.currentTime()}]`);
    console.log(`Get Animes Ongoing [${utils.currentTime()}]`);
    const ongoingAnimeLists = await animeServices.getOngoingAnimes();

    console.log(`Get Updated Link Episode [${utils.currentTime()}]`);

    for (let idxAnime = 0; idxAnime < ongoingAnimeLists.length; idxAnime++) {
      const {
        id: animeId,
        title: animeTitle,
        anime_detail_sources: animeSources,
        episodes,
      } = ongoingAnimeLists[idxAnime];

      await telegramServices.senderNofitication(
        botToken,
        chatId,
        `CHECKING ${animeTitle} [${utils.currentTime()}]`
      );
      const animeTotalEpisodes = episodes.length;

      for (let idxSource = 0; idxSource < animeSources.length; idxSource++) {
        try {
          const { url_source: animeUrlSource } = animeSources[idxSource];
          const episodeLinks = await axiosServices.checkUpdatedAnime(
            animeUrlSource,
            animeTotalEpisodes
          );
          for (
            let idxEpisode = 0;
            idxEpisode < episodeLinks.length;
            idxEpisode++
          ) {
            try {
              const { episodeType, numEps } =
                utils.getEpisodeTypeAndNumberEpisode(episodeLinks[idxEpisode]);
              const embedVideo = await axiosServices.getEmbedUpdatedAnime(
                episodeLinks[idxEpisode]
              );
              const episodeSlug = utils.createEpisodeSlug(
                slugs(animeTitle),
                episodeType,
                numEps
              );
              const createdEpisode = await animeServices.postNewEpisode({
                episode_slug: episodeSlug,
                episode_type: episodeType,
                number_episode: parseInt(numEps),
                url_source: episodeLinks[idxEpisode],
                anime_id: animeId,
              });
              await animeServices.postNewEpisodeSource({
                ...createdEpisode,
                url_source: embedVideo,
              });
              await telegramServices.senderSuccessUpdateEpisode(
                botToken,
                chatId,
                animeTitle,
                numEps
              );
            } catch (error) {
              console.log(error);
              await telegramServices.senderNofitication(
                botToken,
                chatId,
                error.message
              );
            }
          }
          await telegramServices.senderNofitication(
            botToken,
            chatId,
            `UP TO DATE ${animeTitle} [${utils.currentTime()}]`
          );
        } catch (error) {
          console.log(error);
          await telegramServices.senderNofitication(
            botToken,
            chatId,
            error.message
          );
        }
      }
    }
    await telegramServices.senderNofitication(
      botToken,
      chatId,
      `Monit Episode End [${utils.currentTime()}]`
    );
  } catch (error) {
    console.log(error);
    await telegramServices.senderNofitication(botToken, chatId, error.message);
  }
};

module.exports = {
  monitoringAnimesServices,
  monitoringEpisodeServices,
};
