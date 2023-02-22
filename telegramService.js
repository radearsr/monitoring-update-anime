exports.senderSuccessUpdateAnime = async (axios, teleToken, teleMessageId, title, episode) => {
  const message = `✅ ANIME UPDATE\n>>${title}<<\n>>Episode ${episode}<<\n`;
  await axios.get(`https://api.telegram.org/bot${teleToken}/sendMessage`, {
    params: {
      chat_id: teleMessageId,
      text: message,
    }
  });
};

// exports.sendWarningDomainMessage = async (ctx, chatId, datas) => {
//   const parsingData = datas.map((data) => {
//     return `Hosting    : ${data.hosting}\nDomain   : ${data.domain}\nSisa Hari  : ${data.remaining} Hari\nExpired    : ${data.expired}\nSegera Perpanjang Domain!!\n`;
//   }).join("\n");
//   const message = `>>>>> Domain Expired <<<<<\n\n${parsingData}`;
//   await ctx.telegram.sendMessage(chatId, message);
// };
