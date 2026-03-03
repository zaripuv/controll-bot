import { Scenes, Markup } from "telegraf";
import { BotContext } from "../../types";
import { api } from "../api";

interface CreateOpState extends Scenes.WizardSessionData {
  username?: string;
  password?: string;
}

export const createOperatorScene = new Scenes.WizardScene<BotContext>(
  "create-operator-scene",

  async (ctx) => {
    await ctx.reply("👤 Username kiriting:");
    return ctx.wizard.next();
  },

  async (ctx) => {
    (ctx.wizard.state as CreateOpState).username = (ctx.message as any)?.text;
    await ctx.reply("🔐 Parol kiriting:");
    return ctx.wizard.next();
  },

  async (ctx) => {
    (ctx.wizard.state as CreateOpState).password = (ctx.message as any)?.text;

    await ctx.reply(
      "Rolni tanlang:",
      Markup.inlineKeyboard([
        [Markup.button.callback("👨‍💼 Vote Operator", "role_vote")],
        [Markup.button.callback("💳 Payment Operator", "role_payment")]
      ])
    );

    return ctx.wizard.next();
  },

  async (ctx: any) => {
    const state = ctx.wizard.state as CreateOpState;

    const role =
      ctx.callbackQuery?.data === "role_vote"
        ? "VOTE_OPERATOR"
        : "PAYMENT_OPERATOR";

    try {
      await api.post(
        "/users/create-operator",
        {
          username: state.username,
          password: state.password,
          role
        },
        {
          headers: {
            Authorization: `Bearer ${ctx.session.token}`
          }
        }
      );

      await ctx.reply("✅ Operator muvaffaqiyatli yaratildi!");

    } catch (err: any) {
      await ctx.reply(
        "❌ Xatolik: " + (err.response?.data?.message || "Server error")
      );
    }

    return ctx.scene.leave();
  }
);