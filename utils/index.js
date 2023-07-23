const slugs = require("slugs");

const currentTime = () => {
  const date = new Date();
  let hours = date.getHours();
  let minutes = date.getMinutes();
  let seconds = date.getSeconds();
  hours = hours < 10 ? `0${hours}` : hours;
  minutes = minutes < 10 ? "0" + minutes : minutes;
  const strTime = `${hours}:${minutes}:${seconds}`;
  return `${date.getDate()}/${date.getMonth()+1}/${date.getFullYear()} ${strTime}`;
};

const compareAndListed = (localAnimeLists, liveAnimeLists) => {
  const resultAnimes = []
  liveAnimeLists.forEach((liveAnime) => {
    const newAnimeSlug = slugs(liveAnime.title);
    const sameAnimeSlug = localAnimeLists.find((localAnime) => (localAnime.anime_slug === newAnimeSlug));
    if (!sameAnimeSlug) {
      resultAnimes.push(liveAnime);
    }
  });
  return resultAnimes;
};

const getEpisodeTypeAndNumberEpisode = (linkEpisode) => {
  const [,slugAnime] = linkEpisode.split("/episode/");
  let episodeType;
  let textEpisode;
  let numEps;
  if (slugAnime.includes("-ova")) {
    [textEpisode] = slugAnime.match(/.ova-[0-9]{1,6}/);
    [,numEps] = textEpisode.split("ova-");
    episodeType = "OVA";
  } else if (slugAnime.includes("bagian")) {
    [textEpisode] = slugAnime.match(/.bagian-[0-9]{1,6}/);
    [,numEps] = textEpisode.split("bagian-");
    episodeType = "TV";
  } else if (slugAnime.includes("episode")) {
    [textEpisode] = slugAnime.match(/.episode-[0-9]{1,6}/);
    [,numEps] = textEpisode.split("episode-");
    episodeType = "TV";
  } else if ((/.-[0-9]{1,6}-/).test(anime.link)){
    [textEpisode] = slugAnime.match(/.-[0-9]{1,6}/);
    [,numEps] = textEpisode.split("-");
    episodeType = "TV";
  } else {
    numEps = 1;
    episodeType = "MV";
  }
  numEps = numEps < 10 ? `0${numEps}` : numEps;
  return { episodeType, numEps };
};

const createEpisodeSlug = (animeSlug, episodeType, numEpisode) => {
  let slug;
  switch (episodeType) {
    case "MV":
      slug = `${animeSlug}`;
      return slug.toLowerCase();
    case "OVA":
      slug = `${animeSlug}-${episodeType}-${numEpisode}`;
      return slug.toLowerCase();
    default:
      slug = `${animeSlug}-episode-${numEpisode}`;
      return slug.toLowerCase();
  }
}
module.exports = {
  currentTime,
  compareAndListed,
  getEpisodeTypeAndNumberEpisode,
  createEpisodeSlug
};