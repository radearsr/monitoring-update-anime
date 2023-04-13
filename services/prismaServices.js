const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

// Get All Animes With Status Ongoing
const animesOngoing = async () => {
  const animes = await prisma.animes.findMany({
    take: 2,
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
  }) 
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
  if (!addedEpisode.id) throw new InvariantError("Gagal menambahkan episode ke database");
  return {
    animeId: addedEpisode.animeId,
    episodeId: addedEpisode.id,
    numEpisode: addedEpisode.numEpisode,
  };
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


// (async () => {
//   const result = await getAllAnimes();
//   console.log(result)
// })();

module.exports = {
  animesOngoing,
  createEpisode,
  getCountAnimes,
  getAllAnimes,
};
