import { BotContext } from "../../types";
import { api } from "../api";
import { Markup } from "telegraf";

export const registerSuperAdminHandlers = (bot: any) => {
  bot.action("add_operator", async (ctx: BotContext) => {
    await ctx.answerCbQuery();
    await ctx.scene.enter("create-operator-scene");
  });

  bot.hears("📊 System Stats", async (ctx: BotContext) => {
    if (ctx.session.role !== "SUPER_ADMIN") {
      return ctx.reply("❌ Ruxsat yo‘q");
    }

    try {
      const { data } = await api.get("/stats/global", {
        headers: {
          Authorization: `Bearer ${ctx.session.token}`,
        },
      });

      await ctx.reply(
        `📊 SYSTEM STATISTICS

📝 SUBMISSIONS
• Total: ${data.submissions.total}
• Approved: ${data.submissions.approved}
• Rejected: ${data.submissions.rejected}
• Expired: ${data.submissions.expired}

💳 WITHDRAWALS
• Total: ${data.withdrawals.total}
• Paid: ${data.withdrawals.paid}
• Cancelled: ${data.withdrawals.cancelled}
• Total Paid Amount: ${data.withdrawals.totalPaidAmount}

━━━━━━━━━━━━━━━━━━`,
      );
    } catch (err) {
      console.log(err);
      await ctx.reply("❌ Xatolik");
    }
  });

  bot.hears("📈 Vote Operators Stats", async (ctx: BotContext) => {
    if (ctx.session.role !== "SUPER_ADMIN") {
      return ctx.reply("❌ Ruxsat yo‘q");
    }

    try {
      const { data } = await api.get("/stats/vote-operators", {
        headers: {
          Authorization: `Bearer ${ctx.session.token}`,
        },
      });

      if (!data.length) {
        return ctx.reply("Operator yo‘q");
      }

      let message = "📈 VOTE OPERATORS STATS\n\n";

      for (const op of data) {
        const approved = op.reviewedSubs.filter(
          (s: any) => s.status === "APPROVED",
        ).length;
        const rejected = op.reviewedSubs.filter(
          (s: any) => s.status === "REJECTED",
        ).length;

        message += `👤 ${op.username}\n`;
        message += `   ✅ Approved: ${approved}\n`;
        message += `   ❌ Rejected: ${rejected}\n\n`;
      }

      await ctx.reply(message);
    } catch {
      await ctx.reply("❌ Xatolik");
    }
  });

  bot.hears("💰 Payment Operators Stats", async (ctx: BotContext) => {
    if (ctx.session.role !== "SUPER_ADMIN") {
      return ctx.reply("❌ Ruxsat yo‘q");
    }

    try {
      const { data } = await api.get("/stats/payment-operators", {
        headers: {
          Authorization: `Bearer ${ctx.session.token}`,
        },
      });

      if (!data.length) {
        return ctx.reply("Payment operator yo‘q");
      }

      let message = "💰 PAYMENT OPERATORS STATS\n\n";

      for (const op of data) {
        const paid = op.processedWiths.filter(
          (w: any) => w.status === "PAID",
        ).length;

        const totalPaid = op.processedWiths
          .filter((w: any) => w.status === "PAID")
          .reduce((sum: number, w: any) => sum + Number(w.amount), 0);

        message += `👤 ${op.username}\n`;
        message += `   💸 Paid Withdrawals: ${paid}\n`;
        message += `   💰 Total Paid: ${totalPaid}\n\n`;
      }

      await ctx.reply(message);
    } catch {
      await ctx.reply("❌ Xatolik");
    }
  });

  bot.hears("👥 Manage Operators", async (ctx: BotContext) => {
    if (ctx.session.role !== "SUPER_ADMIN") {
      return ctx.reply("❌ Ruxsat yo‘q");
    }

    await ctx.reply(
      "Operator boshqaruvi:",
      Markup.inlineKeyboard([
        [Markup.button.callback("➕ Add Operator", "add_operator")],
        [Markup.button.callback("🗑 Delete Operator", "delete_operator")],
      ]),
    );
  });
};
