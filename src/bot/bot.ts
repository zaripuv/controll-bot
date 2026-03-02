import { Telegraf, session, Scenes } from "telegraf";
import { loginScene } from "./scenes/login.scene";
import { api } from "./api";
import { BotContext } from "../types";
import { registerOperatorHandlers } from "./handlers/operator.handler";
import { userKeyboard } from "./keyboards/user.keyboard";
import { submitScene } from "./scenes/submit.scene";
import "dotenv/config";

const bot = new Telegraf<BotContext>(process.env.BOT_TOKEN!);

const stage = new Scenes.Stage<BotContext>([
  loginScene,
  submitScene,
]);

bot.use(session());
bot.use(stage.middleware());

bot.command("login", (ctx) => ctx.scene.enter("login-scene"));

bot.start(async (ctx) => {
  try {
    const telegramId = ctx.from?.id;

    const { data } = await api.post("/auth/telegram", {
      telegramId: telegramId?.toString(),
    });

    ctx.session.token = data.accessToken;
    ctx.session.role = "USER";

    await ctx.reply(
      "✅ Tizimga xush kelibsiz!",
      userKeyboard()
    );

  } catch {
    await ctx.reply("❌ Auth xatolik");
  }
});

bot.hears("📝 Submit", (ctx) => {
  ctx.scene.enter("submit-scene");
});

registerOperatorHandlers(bot);

bot.launch();

console.log("🤖 Bot ishga tushdi");

console.log("JWT_SECRET BOT:", process.env.JWT_SECRET);