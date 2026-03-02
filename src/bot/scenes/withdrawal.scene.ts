import { Scenes } from "telegraf";
import { api } from "../api";

export const withdrawalScene = new Scenes.WizardScene(
  "withdrawal-scene",

  async (ctx) => {
    await ctx.reply("💳 Kartani kiriting:");
    return ctx.wizard.next();
  },

  async (ctx: any) => {
    ctx.wizard.state.cardNumber = ctx.message.text;
    await ctx.reply("💰 Summani kiriting:");
    return ctx.wizard.next();
  },

  async (ctx: any) => {
    const { cardNumber } = ctx.wizard.state;
    const amount = ctx.message.text;

    try {
      const token = ctx.session.token;

      await api.post(
        "/withdrawal",
        { cardNumber, amount },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      await ctx.reply("⏳ Withdrawal yuborildi.");
    } catch (err: any) {
      await ctx.reply("❌ Xatolik: " + err.response?.data?.message);
    }

    return ctx.scene.leave();
  }
);