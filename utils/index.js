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

module.exports = {
  currentTime,
  compareAndListed,
};