require("dotenv").config();
const async = require("async");
const axiosServices = require("./axiosServices");
const telegramServices = require("./telegramServices");
const animeServices = require("./animeServices");
const logger = require("../utils/loggingUtils");
const utils = require("../utils");
const slugs = require("slugs");


const updateAnimeQueue = async.queue((task, completed) => {
  logger.info(`[${utils.currentTime()}] TASK INSERT ANIME ${task.link}`);
  setTimeout(async () => {
    try {
      logger.info(`[${utils.currentTime()}] GET ANIME DETAILS`);
      const details = await axiosServices.getDetailAnime(task.link);
      const actualDate = utils.fixingDateFromText(details.releaseDate);
      if (new Date(actualDate) == "Invalid Date") {
        throw new Error(`INVALID_DATE__(${details.releaseDate})__(${task.link})`);
      }
      logger.info(
        `[${utils.currentTime()}] UPLOAD POSTER START (${details.poster})`
      );
      const uploadedPoster = await axiosServices.uploadImage(
        details.poster,
        details.title
      );
      logger.info(`[${utils.currentTime()}] POST ANIME START`);
      const postedAnime = await animeServices.postNewAnime({
        ...details,
        releaseDate: actualDate,
        status: task.status.toUpperCase(),
        type: task.type.toUpperCase(),
        rating: parseFloat(details.rating),
        poster: uploadedPoster,
      });
      logger.info(`[${utils.currentTime()}] POST ANIME SOURCE START`);
      await animeServices.postNewAnimeSource({
        animeId: postedAnime.id,
        link: task.link,
        scrapingStrategy: "OTAKUDESU",
      });
      logger.info(`[${utils.currentTime()}] TASK ANIME END\n`);
      completed(null, details);
    } catch (error) {
      logger.error(`[${utils.currentTime()}] TASK ANIME ERROR\n`);
      logger.error(error);
      completed(error, null);
    }
  }, 5000);
}, 1);

const monitoringAnimesServices = async (botToken, chatId) => {
  try {
    logger.info(`[${utils.currentTime()}] Monit Anime Start`);
    await telegramServices.senderNofitication(
      botToken,
      chatId,
      `Monit Anime Start [${utils.currentTime()}]`
    );

    logger.info(
      `[${utils.currentTime()}] LIVE ANIME FROM ${process.env.OTAKUDESU_URL}`
    );

    const liveAnimeLists = await axiosServices.getAllAnimes(
      process.env.OTAKUDESU_URL
    );
    const liveAnimesCount = liveAnimeLists.length;

    logger.info(
      `[${utils.currentTime()}] LOCAL ANIME FROM ${process.env.API_UTAMA}`
    );

    const localAnimesCount = await animeServices.getAnimesCount("OTAKUDESU");

    await telegramServices.senderNofitication(
      botToken,
      chatId,
      `>> LIVE <<\n>> ${liveAnimesCount} <<\n>> LOCAL <<\n>>${localAnimesCount}<<\n[${utils.currentTime()}]`
    );

    logger.info(
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

    logger.info(`[${utils.currentTime()}] COMPARE ANIME LIST`);

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
          logger.error(error);
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
    logger.error(error);
    await telegramServices.senderNofitication(botToken, chatId, error.message);
  }
};

const updateEpisodeQueue = async.queue((task, completed) => {
  logger.info(`[${utils.currentTime()}] TASK INSERT EPISODE ${task.episodeLink}`);
  setTimeout(async () => {
    try {
      logger.info(`[${utils.currentTime()}] GET NUM AND TYPE EPISODE`);
      const { episodeType, numEps } =
      utils.getEpisodeTypeAndNumberEpisode(task.episodeLink);
      const embedVideo = await axiosServices.getEmbedUpdatedAnime(
        task.episodeLink
      );
      logger.info(`[${utils.currentTime()}] CREATE EPISODE SLUG`);
      const episodeSlug = utils.createEpisodeSlug(
        slugs(task.animeTitle),
        episodeType,
        numEps
      );
      logger.info(`[${utils.currentTime()}] POST NEW EPISODE`);
      const createdEpisode = await animeServices.postNewEpisode({
        episode_slug: episodeSlug,
        episode_type: episodeType,
        number_episode: parseInt(numEps),
        url_source: task.episodeLink,
        anime_id: task.animeId,
      });
      logger.info(`[${utils.currentTime()}] POST NEW SOURCES`);
      await animeServices.postNewEpisodeSource({
        ...createdEpisode,
        url_source: embedVideo,
      });
      logger.info(`[${utils.currentTime()}] TASK EPISODE END\n`);
      completed(null, { animeTitle: task.animeTitle, numEps });
    } catch (error) {
      logger.error(`[${utils.currentTime()}] TASK EPISODE ERROR\n`);
      completed(error, null);
    }
  }, 5000);
});

const checkingEpisodeQueue = async.queue((task, completed) => {
  const {
    id: animeId,
    title: animeTitle,
    anime_detail_sources: animeSources,
    episodes,
  } = task;
  logger.info(`[${utils.currentTime()}] TASK CHECK START ${animeTitle} | ${animeId}\n`);
  setTimeout(() => {
    const animeTotalEpisodes = episodes.length;
    animeSources.forEach(async (animeSource) => {
      try {
        const episodeLinks = await axiosServices.checkUpdatedAnime(animeSource.url_source, 0);
        logger.info(`[${utils.currentTime()}] COMPARE EPISODE LIST`);
        const updatedEpisodeLinks = utils.compareAndListedEpisode(episodes, episodeLinks)
        if (!updatedEpisodeLinks.length) throw new Error("EPISODE_UP_TO_DATE");
        logger.info(`[${utils.currentTime()}] CURRENT EPS ${animeTotalEpisodes}`);
        logger.info(`[${utils.currentTime()}] TASK CHECK END`);
        const remapEpisodeLinks = updatedEpisodeLinks.map((episodeLink) => ({ episodeLink, animeId, animeTitle}))
        completed(null, remapEpisodeLinks);
      } catch (error) {
        logger.error(`[${utils.currentTime()}] CHECKING ERROR ${animeTitle}__${error.message}\n`);
        completed(error, null);
      }
    });
  }, 3000);
});

const monitoringEpisodeServices = async (botToken, chatId) => {
  try {
    logger.info(`[${utils.currentTime()}] Monit Episode Start`);
    await telegramServices.senderNofitication(
      botToken,
      chatId,
      `Monit Episode Start [${utils.currentTime()}]`
    );
    logger.info(`[${utils.currentTime()}] Get Animes Ongoing`);
    const ongoingAnimeLists = await animeServices.getOngoingAnimes();

    logger.info(`[${utils.currentTime()}] Get Updated Link Episode`);
    
    ongoingAnimeLists.forEach((ongoingAnime) => {
      checkingEpisodeQueue.push(ongoingAnime, async (error, taskResult) => {
        if (error) {
          logger.error(error);
          return await telegramServices.senderNofitication(
            botToken,
            chatId,
            `${error.message}__${ongoingAnime.title}`
          );
        }
        taskResult.forEach((task) => {
          updateEpisodeQueue.push(task, async (error, taskResult) => {
            if (error) {
              return await telegramServices.senderNofitication(
                botToken,
                chatId,
                `${error.message}__${task.animeTitle}`
              );
            }
            await telegramServices.senderSuccessUpdateEpisode(
              botToken,
              chatId,
              taskResult.animeTitle,
              taskResult.numEps
            );
          });
        });
      })
    });
    await telegramServices.senderNofitication(
      botToken,
      chatId,
      `Monit Episode End [${utils.currentTime()}]`
    );
  } catch (error) {
    logger.error(error);
    await telegramServices.senderNofitication(botToken, chatId, error.message);
  }
};


module.exports = {
  monitoringAnimesServices,
  monitoringEpisodeServices,
};
