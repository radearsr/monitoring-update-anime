require("dotenv").config();
const { default: axios } = require("axios");
const slugs = require("slugs");


const checkUpdatedAnime = async (linkPage, totalEps) => {
  const { data } = await axios.post(`${process.env.ADDON_API_ENDPOINT}/api/monitoring`, {
    link: linkPage,
    lastTotalEps: totalEps,
  });
  if (data.status === "success" ) {
    return data.data;
  } else {
    return [];
  }
};

const getEmbedUpdatedAnime = async (linkPage) => {
  const { data } = await axios.post(`${process.env.ADDON_API_ENDPOINT}/api/embed`, {
    link: linkPage,
  });
  if (data.status === "success") {
    return data.data;
  } else {
    return [];
  }
};

const getAllAnimes = async (linkPage) => {
  const { data } = await axios.post(`${process.env.ADDON_API_ENDPOINT}/api/animes`, {
    link: linkPage,
  });
  if (data.status === "success") {
    return data.data;
  } else {
    return [];
  }
};

const getDetailAnime = async (linkPage) => {
  const { data } = await axios.post(`${process.env.ADDON_API_ENDPOINT}/api/details`, {
    link: linkPage,
  });
  if (data.status === "success") {
    return data.data;
  } else {
    return [];
  }
};

const uploadImage  = async (linkPoster, title) => {
  console.log({ linkPoster, title });
  const imageTitle = slugs(title);
  const { data: resposeData } = await axios.post(`${process.env.ASSET_MANAGER_ENPOINT}/upload`, {
    poster: linkPoster,
    title: imageTitle
  });
  return resposeData.data.access;
};




module.exports = {
  checkUpdatedAnime,
  getEmbedUpdatedAnime,
  getAllAnimes,
  getDetailAnime,
  uploadImage,
};
