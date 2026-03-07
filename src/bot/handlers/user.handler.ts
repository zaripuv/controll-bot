import { BotContext } from "../../types";
import { api } from "../api";

export const registerUserHandlers = (bot: any) => {
  bot.hears("👥 Do'stlarni Taklif Qilish", async (ctx: BotContext) => {
    const { data } = await api.get("/users/referral", {
      headers: {
        Authorization: `Bearer ${ctx.session.token}`,
      },
    });

    await ctx.reply(
      `👥 Do‘stlaringizni taklif qiling!

Sizning havolangiz:

${data.link}

Har bir do‘st uchun:
💰 5000 so‘m bonus`,
    );
  });
};
