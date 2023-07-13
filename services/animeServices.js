const { default: axios } = require("axios");

const getAnimesCount = async () => {
  const { data: resposeData } =  await axios.get(`${process.env.API_UTAMA}/animes/count`, {
    params: {
      scraping_strategy: "ANIMEINDO",
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

module.exports = {
  getAnimesCount,
  getAllAnimesWithoutFilter,
  postNewAnime,
  postNewAnimeSource
};
