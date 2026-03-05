import { Telegraf, session, Scenes } from "telegraf";
import { loginScene } from "./scenes/login.scene";
import { api } from "./api";
import { BotContext } from "../types";
import { registerOperatorHandlers } from "./handlers/operator.handler";
import { userKeyboard } from "./keyboards/user.keyboard";
import { submitScene } from "./scenes/submit.scene";
import { withdrawalScene } from "./scenes/withdrawal.scene";
import { registerPaymentHandlers } from "./handlers/payment.handler";
import { registerSuperAdminHandlers } from "./handlers/superadmin.handler";
import { registerUserHandlers } from "./handlers/user.handler";
import { createOperatorScene } from "./scenes/createOperator.scene";
import { createProjectScene } from "./scenes/createProjectScene";
import "dotenv/config";

const bot = new Telegraf<BotContext>(process.env.BOT_TOKEN!);

const stage = new Scenes.Stage<BotContext>([
  loginScene,
  submitScene,
  withdrawalScene,
  createOperatorScene,
  createProjectScene,
]);

bot.use(session());
bot.use(stage.middleware());

bot.command("login", (ctx) => ctx.scene.enter("login-scene"));

bot.start(async (ctx) => {
  const startPayload = ctx.startPayload;

  try {
    const telegramId = ctx.from?.id;

    const { data } = await api.post("/auth/telegram", {
      telegramId: telegramId?.toString(),
      referralCode: startPayload || null,
    });

    ctx.session.token = data.accessToken;
    ctx.session.role = "USER";

    await ctx.reply("✅ Telegram botga xush kelibsiz!", userKeyboard());
  } catch {
    await ctx.reply("❌ Auth xatolik");
  }
});

bot.hears("📊 Ulashish statistikasi", async (ctx) => {
  const { data } = await api.get("/users/referral-stats", {
    headers: {
      Authorization: `Bearer ${ctx.session.token}`,
    },
  });

  await ctx.reply(
    `📊 Sizning referral statistikangiz

👥 Taklif qilganlar: ${data.totalReferrals}

💰 Referral bonus: ${data.totalEarned} so'm`,
  );
});

bot.hears("🕊 Yuborish", (ctx) => {
  ctx.scene.enter("submit-scene");
});

// Withdraw bosilganda
bot.hears("💳 To'lov", (ctx) => {
  ctx.scene.enter("withdrawal-scene");
});

// Balance ko‘rish
bot.hears("💰 Balance", async (ctx) => {
  try {
    const { data } = await api.get("/users/me", {
      headers: {
        Authorization: `Bearer ${ctx.session.token}`,
      },
    });

    await ctx.reply(`💰 Sizning balansingiz: ${data.balance}`);
  } catch {
    await ctx.reply("❌ Balance olishda xatolik");
  }
});

registerSuperAdminHandlers(bot);
registerOperatorHandlers(bot);
registerPaymentHandlers(bot);
registerUserHandlers(bot);

bot.launch();

console.log("🤖 Bot ishga tushdi");