import { Scenes } from "telegraf";
import { api } from "../api";
import { BotContext, WizardState } from "../../types";
import { operatorKeyboard } from "../keyboards/operator.keyboard";
import { userKeyboard } from "../keyboards/user.keyboard";
import { onlineOperators } from "../realtime";

export const loginScene = new Scenes.WizardScene<BotContext>(
  "login-scene",

  async (ctx) => {
    await ctx.reply("👤 Username kiriting:");
    return ctx.wizard.next();
  },

  async (ctx) => {
    (ctx.wizard.state as WizardState).username = (ctx.message as any)?.text;
    await ctx.reply("🔐 Parol kiriting:");
    return ctx.wizard.next();
  },

  async (ctx) => {
    const username = (ctx.wizard.state as WizardState).username;
    const password = (ctx.message as any)?.text;

    try {
      const { data } = await api.post("/login", { username, password });

      ctx.session.token = data.accessToken;
      ctx.session.role = data.role;

      if (ctx.session.role === "VOTE_OPERATOR") {

        // ✅ OPERATORNI ONLINE RO‘YXATGA QO‘SHAMIZ
        if (ctx.from?.id) {
          onlineOperators.set(ctx.from.id, ctx.from.id.toString());
        }

        await ctx.reply(
          "👨‍💼 Operator panel",
          operatorKeyboard()
        );

      } else if (ctx.session.role === "USER") {

        await ctx.reply(
          "✅ Login muvaffaqiyatli!",
          userKeyboard()
        );

      } else {
        await ctx.reply("✅ Login muvaffaqiyatli!");
      }

      console.log("ROLE FROM BACKEND:", data.role);

    } catch (err: any) {
      console.log("LOGIN ERROR:", err.response?.data || err.message);
      await ctx.reply("❌ Login xato");
    }

    return ctx.scene.leave();
  }
);