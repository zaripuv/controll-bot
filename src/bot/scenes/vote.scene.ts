import { Scenes } from "telegraf";
import { api } from "../api";

export const voteScene = new Scenes.WizardScene(
  "vote-scene",

  async (ctx) => {
    await ctx.reply("📞 Telefon raqamingizni kiriting:");
    return ctx.wizard.next();
  },

  async (ctx: any) => {
    ctx.wizard.state.phone = ctx.message.text;
    await ctx.reply("🔐 SMS kodni kiriting:");
    return ctx.wizard.next();
  },

  async (ctx: any) => {
    const smsCode = ctx.message.text;
    const phone = ctx.wizard.state.phone;

    try {
      // Bot USER login qilmaydi
      // Telegram ID orqali userni backendda aniqlash kerak bo‘ladi
      // Hozircha test uchun token kerak bo‘ladi

      const token = ctx.session.token;

      await api.post(
        "/submission",
        { phone, smsCode },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      await ctx.reply("⏳ So‘rov yuborildi. Tasdiqlanishini kuting.");
    } catch (err: any) {
      await ctx.reply("❌ Xatolik: " + err.response?.data?.message);
    }

    return ctx.scene.leave();
  }
);