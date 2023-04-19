const { PrismaClient } = require("@prisma/client");
const slugs = require("slugs");
const fs = require("fs");
const prisma = new PrismaClient();

// Get All Animes With Status Ongoing
const animesOngoing = async () => {
  const animes = await prisma.animes.findMany({
    include: {
      _count: {
        select: {
          episodes: true,
        },
      },
    },
    where: {
      status: "Ongoing",
    }
  });
  const remapAnimes = animes.map((anime) => {
    return {
      animeId: anime.animeId,
      title: anime.title,
      originalSource: anime.originalSource,
      totalEpisode: anime._count.episodes,
    }
  });
  return remapAnimes;
};

const createEpisode = async (payload) => {
  const addedEpisode = await prisma.episodes.create({
    data: {
      animeId: payload.animeId,
      episodeType: payload.episodeType,
      streamStrategy: payload.streamStrategy,
      numEpisode: payload.numEpisode,
      sourceDefault: payload.sourceDefault,
      sourceHd: payload.sourceHd,
      originalSourceEp: payload.originalSourceEp,
      publish: payload.publish,
    },
  });
  if (!addedEpisode.id) throw new Error("Gagal menambahkan episode ke database");
  return {
    animeId: addedEpisode.animeId,
    episodeId: addedEpisode.id,
    numEpisode: addedEpisode.numEpisode,
  };
};

const updateAnimeLastUpdateEpisode = async (animeId) => {
  const updatedAnimes = await prisma.animes.update({
    where: {
      animeId,
    },
    data: {
      lastUpdateEpisode: new Date(),
    },
  });
  if (!updatedAnimes) throw new Error("Gagal Memperbarui LastUpdateEpisode");
};

const getCountAnimes = async () => {
  const totalAnime = await prisma.animes.count();
  return totalAnime;
};

const getAllAnimes = async () => {
  const animes = await prisma.animes.findMany({
    select: {
      title: true,
      originalSource: true,
    },
  });
  return animes;
};

const createNewAnime = async (payload) => {
  const slug = slugs(payload.title);
  const publish = payload.publish ? "Publish" : "NonPublish";
  const addedAnime = await prisma.animes.create({
    data: {
      title: payload.title,
      rating: payload.rating,
      originalSource: payload.originalSource,
      description: payload.description,
      poster: payload.poster,
      type: payload.type,
      releaseDate: new Date(payload.releaseDate),
      status: payload.status,
      slug,
      publish,
    },
  });
  if (!addedAnime.animeId) throw new Error("Gagal menambahkan anime");
  return {
    animeId: addedAnime.animeId,
    title: addedAnime.title,
    slug: addedAnime.slug,
  };
};

const createAnimeGenres = async (genres, animeId) => {
  const splitedGenre = genres.split(",");
  const matchesGenre = await Promise.all(splitedGenre.map(async (genre) => {
    const result = await prisma.genres.findFirst({
      where: {
        name: {
          contains: genre.toLowerCase().trim(),
          mode: "insensitive",
        },
      },
    });
    if (result) {
      return { animeId, genreId: result.genreId };
    }
    return "";
  }));
  const matchesGenreFiltered = matchesGenre.filter((data) => data !== "");
  await prisma.anime_genres.createMany({
    data: matchesGenreFiltered,
  });
};

// (async () => {
//   const result = await getAllAnimes();
//   console.log(result)
// })();

module.exports = {
  animesOngoing,
  createEpisode,
  getCountAnimes,
  getAllAnimes,
  createAnimeGenres,
  createNewAnime,
  updateAnimeLastUpdateEpisode,
};
