import { Markup } from "telegraf";
import { BotContext } from "../../types";
import { api } from "../api";

export const registerOperatorHandlers = (bot: any) => {

  bot.hears("📋 Kutilayotgan ovozlar", async (ctx: BotContext) => {

    if (ctx.session.role !== "VOTE_OPERATOR") {
      return ctx.reply("❌ Sizda ruxsat yo‘q");
    }

    try {
      const { data } = await api.get("/submission?status=PENDING", {
        headers: {
          Authorization: `Bearer ${ctx.session.token}`,
        },
      });

      if (!data.length) {
        return ctx.reply("📭 Kutilayotgan ovozlar yo‘q");
      }

      for (const sub of data) {

        // Agar SMS hali kelmagan bo‘lsa
        if (!sub.smsCode) {
          await ctx.reply(
            `📞 ${sub.phone}\n⏳ SMS kutilmoqda...`
          );
          continue;
        }

        // SMS kelgan bo‘lsa approve/reject chiqadi
        await ctx.reply(
          `📞 ${sub.phone}\n🔐 ${sub.smsCode}`,
          Markup.inlineKeyboard([
            [
              Markup.button.callback("✅ Tasdiqlash", `approve_${sub.id}`),
              Markup.button.callback("❌ Rad etish", `reject_${sub.id}`),
            ],
          ])
        );
      }

    } catch (err: any) {
      console.log(err.response?.data);
      ctx.reply("❌ Xatolik yuz berdi");
    }
  });


  bot.action(/approve_(\d+)/, async (ctx: any) => {
    const id = ctx.match[1];

    try {
      const { data } = await api.patch(
        `/submission/${id}/review`,
        { status: "APPROVED" },
        {
          headers: {
            Authorization: `Bearer ${ctx.session.token}`,
          },
        }
      );

      if (data.telegramId) {
        await ctx.telegram.sendMessage(
          data.telegramId.toString(),
          `🎉 Sizning ovozingiz tasdiqlandi!\n💰 Bonus balansingizga qo‘shildi teshkirib ko'rishingiz mumkin.`
        );
      }

      await ctx.answerCbQuery("✅ Tasdiqlandi");
      await ctx.editMessageText("✅ Tasdiqlandi");

    } catch (err: any) {
      console.log(err.response?.data || err.message);
      await ctx.answerCbQuery("Xatolik yuz berdi");
    }
  });


  bot.action(/reject_(\d+)/, async (ctx: any) => {
    const id = ctx.match[1];

    try {
      const { data } = await api.patch(
        `/submission/${id}/review`,
        { status: "REJECTED" },
        {
          headers: {
            Authorization: `Bearer ${ctx.session.token}`,
          },
        }
      );

      if (data.telegramId) {
        await ctx.telegram.sendMessage(
          data.telegramId.toString(),
          `❌ Sizning ovozingiz rad etildi.\n📞 Ma'lumotlarni tekshirib qayta urinib ko‘ring.`
        );
      }

      await ctx.answerCbQuery("❌ Rad etildi");
      await ctx.editMessageText("❌ Rad etildi");

    } catch (err: any) {
      console.log(err.response?.data || err.message);
      await ctx.answerCbQuery("❌ Xatolik yuz berdi");
    }
  });

};