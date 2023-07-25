const axios = require("axios");
const slugs = require("slugs");
const animeServices = require("./animeServices");
const axiosServices = require("./axiosServices");
const telegramServices = require("./telegramServices");
const utils = require("../utils");

const endpoint = "https://fuzzy-gold-dolphin.cyclic.app/api/v1";

const injectAnimeServices = async (botToken, chatId) => {
  try {
    const { data: { data: animes } } = await axios.get(`${endpoint}/animes/search`, {
      params: {
        querySearch: "",
        currentPage: 1,
        pageSize: 2
      },
    });
    await telegramServices.senderNofitication(botToken, chatId, `>>${animes.length}<<\n[${utils.currentTime()}]`);
    for (let animeIdx = 0; animeIdx < animes.length; animeIdx++) {
      try {
        const uploadedPoster = await axiosServices.uploadImage(animes[animeIdx].poster, animes[animeIdx].title);
        const postedAnime = await animeServices.postNewAnime({
          title: animes[animeIdx].title,
          rating: animes[animeIdx].rating,
          description: animes[animeIdx].description,
          poster: uploadedPoster,
          status: animes[animeIdx].status.toUpperCase(),
          type: animes[animeIdx].type.toUpperCase(),
          genres: animes[animeIdx].anime_genres.join(","),
          releaseDate: animes[animeIdx].releaseDate,
        });
        await telegramServices.senderSuccessUpdateNewAnime(botToken, chatId, animes[animeIdx].title);
        await animeServices.postNewAnimeSource({
          animeId: postedAnime.id,
          link: animes[animeIdx].originalSource.replace(".asia", ".lol"),
          scrapingStrategy: "OTAKUDESU",
        });
        const { data: { data: { episodes }} } = await axios.get(`${endpoint}/episodes/${animes[animeIdx].animeId}/animes`);
        for (let episodeIdx = 0; episodeIdx < episodes.length; episodeIdx++) {
          try {
            const episodeSlug = utils.createEpisodeSlug(
              slugs(animes[animeIdx].title),
              episodes[episodeIdx].episodeType,
              episodes[episodeIdx].numEpisode
            );
            const postedEpisode = await animeServices.postNewEpisode({
              episode_slug: episodeSlug,
              episode_type: episodes[episodeIdx].episodeType.toUpperCase(),
              number_episode: episodes[episodeIdx].numEpisode,
              url_source: episodes[episodeIdx].originalSourceEp.replace(".asia", ".lol"),
              anime_id: postedAnime.id,
            });
            await animeServices.postNewEpisodeSource({
              url_source: episodes[episodeIdx].sourceDefault,
              anime_id: postedEpisode.anime_id,
              episode_id: postedEpisode.episode_id,
            });
          } catch (error) {
            console.log(error);
            await telegramServices.senderNofitication(botToken, chatId, error.stack);
          }
        }
      } catch (error) {
        console.log(error);
        await telegramServices.senderNofitication(botToken, chatId, error.stack);
      }
    }
  } catch (error) {
    console.log(error);
    await telegramServices.senderNofitication(botToken, chatId, error.stack);
  }
};

module.exports = {
  injectAnimeServices
};
