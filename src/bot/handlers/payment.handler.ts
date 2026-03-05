import { Markup } from "telegraf";
import { BotContext } from "../../types";
import { api } from "../api";

export const registerPaymentHandlers = (bot: any) => {
  // Pending withdrawals ro‘yxati
  bot.hears("💰 Kutilayotgan to'lovlar", async (ctx: BotContext) => {
    if (ctx.session.role !== "PAYMENT_OPERATOR") {
      return ctx.reply("❌ Sizda ruxsat yo‘q");
    }

    try {
      const { data } = await api.get("/withdrawal?status=PENDING", {
        headers: {
          Authorization: `Bearer ${ctx.session.token}`,
        },
      });

      if (!data.length) {
        return ctx.reply("📭 Kutilayotgan to'lovlar yo‘q");
      }

      for (const w of data) {
        await ctx.reply(
          `👤 ${w.user?.username || "User"}\n💳 ${w.cardNumber}\n💰 ${w.amount}`,
          Markup.inlineKeyboard([
            [Markup.button.callback("✅ To'lov qilish", `pay_${w.id}`)],
          ]),
        );
      }
    } catch (err: any) {
      console.log(err.response?.data);
      ctx.reply("❌ Xatolik yuz berdi");
    }
  });

  // APPROVE
  bot.action(/pay_(\d+)/, async (ctx: any) => {
    const id = ctx.match[1];

    try {
      // LOCK
      await api.patch(
        `/withdrawal/${id}/lock`,
        {},
        {
          headers: {
            Authorization: `Bearer ${ctx.session.token}`,
          },
        },
      );

      const { data } = await api.patch(
        `/withdrawal/${id}/approve`,
        {},
        {
          headers: {
            Authorization: `Bearer ${ctx.session.token}`,
          },
        },
      );

      // USERGA NOTIFICATION
      if (data.telegramId) {
        await ctx.telegram.sendMessage(
          data.telegramId,
          `💸 Kartangizga ${data.amount} so‘m to‘lov amalga oshirildi, kartangizni tekshirib ko'rishingiz mumkin.\n✅ To‘lov muvaffaqiyatli yakunlandi.`,
        );
      }

      await ctx.answerCbQuery("To‘lov bajarildi ✅");
      await ctx.editMessageText("💸 To‘lov bajarildi");
    } catch (err: any) {
      console.log(err.response?.data || err.message);
      await ctx.answerCbQuery("❌ Xatolik yuz berdi");
    }
  });
};
