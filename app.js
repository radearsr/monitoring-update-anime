require("dotenv").config();
const { Cron } = require("croner");
const { Telegraf } = require("telegraf")
const services = require("./services/monitoringServices");
const injectServices = require("./services/injectServices");
const axios = require("axios");

const bot = new Telegraf(process.env.BOT_TOKEN);

Cron("0 */4 * * *", { timezone: "Asia/Jakarta" }, async () => {
  await monitoringEpisodeServices(process.env.BOT_TOKEN, process.env.GROUP_ID);
});

bot.command("newanime", async (ctx) => {
  await services.monitoringAnimesServices(process.env.BOT_TOKEN, ctx.chat.id);
});

bot.command("newepisode", async (ctx) => {
  await services.monitoringEpisodeServices(process.env.BOT_TOKEN, ctx.chat.id);
});

bot.command("injectA", async (ctx) => {
  const endpoint = "https://denonime-api.vercel.app/api/v1";
  const { data: { data: animes } } = await axios.get(`${endpoint}/animes/search`, {
    params: {
      querySearch: "",
      currentPage: 1,
      pageSize: 1400,
    },
  });
  animes.forEach((anime, idx) => {
    setTimeout(async () => {
      await injectServices.injectAnimeVersi2(process.env.BOT_TOKEN, ctx.chat.id, anime);
    }, 30000 * idx);
  });
});

// (async () => {
//   const endpoint = "https://denonime-api.vercel.app/api/v1";
//   const { data: { data: animes } } = await axios.get(`${endpoint}/animes/search`, {
//     params: {
//       querySearch: "",
//       currentPage: 2,
//       pageSize: 400
//     },
//   });
//   animes.forEach((anime, idx) => {
//     setTimeout(async () => {
//       await injectServices.injectAnimeVersi2(process.env.BOT_TOKEN, "-995715127", anime);
//     }, 35000 * idx);
//   });
// })() 

bot.launch();
