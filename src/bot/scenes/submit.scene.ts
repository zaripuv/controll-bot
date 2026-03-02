import { Scenes } from "telegraf";
import { api } from "../api";
import { BotContext } from "../../types";

interface SubmitState extends Scenes.WizardSessionData {
  phone?: string;
}

export const submitScene = new Scenes.WizardScene<BotContext>(
  "submit-scene",

  async (ctx) => {
    await ctx.reply("📱 Telefon raqam kiriting:");
    return ctx.wizard.next();
  },

  async (ctx) => {
    (ctx.wizard.state as SubmitState).phone = (ctx.message as any)?.text;
    await ctx.reply("🔐 SMS code kiriting:");
    return ctx.wizard.next();
  },

  async (ctx) => {
    const phone = (ctx.wizard.state as SubmitState).phone;
    const smsCode = (ctx.message as any)?.text;

    try {
      await api.post(
        "/submission",
        { phone, smsCode },
        {
          headers: {
            Authorization: `Bearer ${ctx.session.token}`,
          },
        }
      );

      await ctx.reply("✅ Submission yuborildi");
    } catch (err: any) {
  console.log("ERROR:", err.response?.data);
  await ctx.reply("❌ Xatolik yuz berdi");
}

console.log("SESSION TOKEN:", ctx.session.token);

    return ctx.scene.leave();
  }
);