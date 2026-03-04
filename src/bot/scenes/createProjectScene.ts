import { Markup, Scenes } from "telegraf";
import { BotContext } from "../../types";
import { api } from "../api";

interface State extends Scenes.WizardSessionData {
  name?: string;
  link?: string;
  reward?: number;
}

export const createProjectScene = new Scenes.WizardScene<BotContext>(
  "create-project-scene",

  async (ctx) => {
    await ctx.reply("📁 Project nomi:");
    return ctx.wizard.next();
  },

  async (ctx: any) => {
    ctx.wizard.state.name = ctx.message.text;

    await ctx.reply("🔗 Project link:");
    return ctx.wizard.next();
  },

  async (ctx: any) => {
    ctx.wizard.state.link = ctx.message.text;

    await ctx.reply("💰 Reward summasi:");
    return ctx.wizard.next();
  },

  async (ctx: any) => {
    const reward = Number(ctx.message.text);

    if (isNaN(reward)) {
      await ctx.reply("❌ Reward son bo‘lishi kerak");
      return ctx.wizard.back();
    }

    ctx.wizard.state.reward = reward;

    try {
      await api.post(
        "/projects",
        {
          name: ctx.wizard.state.name,
          link: ctx.wizard.state.link,
          reward: ctx.wizard.state.reward,
        },
        {
          headers: {
            Authorization: `Bearer ${ctx.session.token}`,
          },
        },
      );

      await ctx.reply("✅ Project yaratildi");

      await ctx.reply(
        "📁 Projects panel",
        Markup.inlineKeyboard([
          [Markup.button.callback("📋 Project List", "project_list")],
        ]),
      );
    } catch (err: any) {
      await ctx.reply("❌ Xatolik");
    }

    return ctx.scene.leave();
  },
);
