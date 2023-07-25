require("dotenv").config();
const { Cron } = require("croner");
const { Telegraf } = require("telegraf")
const services = require("./services/monitoringServices");
const injectServices = require("./services/injectServices");

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
  await injectServices.injectAnimeServices(process.env.BOT_TOKEN, ctx.chat.id);
});

bot.launch();
