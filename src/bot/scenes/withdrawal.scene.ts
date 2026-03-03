import { Scenes } from "telegraf";
import { api } from "../api";
import { BotContext } from "../../types";
import { onlinePaymentOperators } from "../realtime";

interface WithdrawState extends Scenes.WizardSessionData {
  cardNumber?: string;
}

export const withdrawalScene = new Scenes.WizardScene<BotContext>(
  "withdrawal-scene",

  // 1️⃣ Karta so‘raymiz
  async (ctx) => {
    if (ctx.session.role !== "USER") {
      await ctx.reply("❌ Sizda ruxsat yo‘q");
      return ctx.scene.leave();
    }

    await ctx.reply("💳 Kartani kiriting:");
    return ctx.wizard.next();
  },

  // 2️⃣ Karta saqlaymiz
  async (ctx) => {
    const cardNumber = (ctx.message as any)?.text;

    if (!cardNumber) {
      await ctx.reply("❌ Karta raqam noto‘g‘ri");
      return ctx.scene.leave();
    }

    (ctx.wizard.state as WithdrawState).cardNumber = cardNumber;

    await ctx.reply("💰 Summani kiriting:");
    return ctx.wizard.next();
  },

  // 3️⃣ Summani yuboramiz
  async (ctx) => {
    const amountText = (ctx.message as any)?.text;
    const amount = Number(amountText);

    if (!amount || amount <= 0) {
      await ctx.reply("❌ Noto‘g‘ri summa");
      return ctx.scene.leave();
    }

    const { cardNumber } = ctx.wizard.state as WithdrawState;

    try {
      // 🔥 backenddan qaytgan withdrawal ni olamiz
      const { data } = await api.post(
        "/withdrawal",
        { cardNumber, amount },
        {
          headers: {
            Authorization: `Bearer ${ctx.session.token}`,
          },
        }
      );

      // 🔥 REALTIME PUSH (toza variant)
      for (const telegramId of onlinePaymentOperators.values()) {
        await ctx.telegram.sendMessage(
          telegramId,
          `💰 Yangi withdrawal so‘rovi\n💳 ${data.cardNumber}\n💵 ${data.amount}`
        );
      }

      await ctx.reply("⏳ Withdrawal yuborildi. To‘lov tekshirilmoqda...");

    } catch (err: any) {
      await ctx.reply(
        "❌ Xatolik: " + (err.response?.data?.message || "Server error")
      );
    }

    return ctx.scene.leave();
  }
);