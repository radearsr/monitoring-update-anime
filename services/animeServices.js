const { default: axios } = require("axios");

const getAnimesCount = async (scrapingStrategy) => {
  const { data: resposeData } =  await axios.get(`${process.env.API_UTAMA}/animes/count`, {
    params: {
      scraping_strategy: scrapingStrategy,
    },
  });
  return resposeData.animes_count;
};

const getAllAnimesWithoutFilter = async () => {
  const { data: resposeData } =  await axios.get(`${process.env.API_UTAMA}/animes/all`);
  return resposeData.data;
};

const postNewAnime = async (payload) => {
  const { data: resposeData } =  await axios.post(`${process.env.API_UTAMA}/animes`, {
    title: payload.title,
    rating: payload.rating,
    synopsis: payload.description,
    poster: payload.poster,
    status: payload.status,
    anime_type: payload.type,
    genres: payload.genres,
    release_date: payload.releaseDate,
    published: true,
  });
  return resposeData.data;
};

const postNewAnimeSource = async (payload) => {
  const { data: resposeData } =  await axios.post(`${process.env.API_UTAMA}/animes/sources`, {
    anime_id: payload.animeId,
    url_source: payload.link,
    scraping_strategy: payload.scrapingStrategy,
    monitoring: true,
  });
  return resposeData.data;
};

const getOngoingAnimes = async () => {
  const { data: responseData } = await axios.get(`${process.env.API_UTAMA}/animes/ongoing`);
  return responseData.data;
}

const postNewEpisode = async (payload) => {
  const { data: responseData } = await axios.post(`${process.env.API_UTAMA}/episodes`, {
    episode_slug: payload.episode_slug,
    episode_type: payload.episode_type,
    number_episode: payload.number_episode,
    url_source: payload.url_source,
    anime_id: payload.anime_id,
    published: true,
  });
  return responseData.data;
}

const postNewEpisodeSource = async (payload) => {
  const { data: responseData } = await axios.post(`${process.env.API_UTAMA}/episodes/sources`, {
    label: "DEFAULT",
    url_source: payload.url_source,
    scraping_strategy: "OTAKUDESU",
    anime_id: payload.anime_id,
    episode_id: payload.episode_id,
  });
  return responseData.data;
}
module.exports = {
  getAnimesCount,
  getAllAnimesWithoutFilter,
  postNewAnime,
  postNewAnimeSource,
  getOngoingAnimes,
  postNewEpisode,
  postNewEpisodeSource
};
