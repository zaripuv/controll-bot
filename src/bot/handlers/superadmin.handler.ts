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

  bot.action("delete_operator", async (ctx: BotContext) => {
    if (ctx.session.role !== "SUPER_ADMIN") {
      return ctx.reply("❌ Ruxsat yo‘q");
    }

    await ctx.answerCbQuery();

    try {
      const { data } = await api.get("/users/operators", {
        headers: {
          Authorization: `Bearer ${ctx.session.token}`,
        },
      });

      if (!data.length) {
        return ctx.reply("Operator yo‘q");
      }

      for (const op of data) {
        await ctx.reply(
          `👤 ${op.username}\nRole: ${op.role}`,
          Markup.inlineKeyboard([
            [Markup.button.callback("🗑 Delete", `delete_operator_${op.id}`)],
          ]),
        );
      }
    } catch (err) {
      console.log(err);
      await ctx.reply("❌ Xatolik");
    }
  });

  bot.action(/delete_operator_(\d+)/, async (ctx: any) => {
    const id = ctx.match[1];

    try {
      await api.delete(`/users/${id}`, {
        headers: {
          Authorization: `Bearer ${ctx.session.token}`,
        },
      });

      await ctx.answerCbQuery("Operator o‘chirildi");

      await ctx.editMessageText("🗑 Operator o‘chirildi");
    } catch (err) {
      console.log(err);

      await ctx.answerCbQuery("Xatolik");
    }
  });

  bot.action("create_project", async (ctx: BotContext) => {
    await ctx.answerCbQuery();
    await ctx.scene.enter("create-project-scene");
  });

  bot.hears("📁 Projects", async (ctx: BotContext) => {
    if (ctx.session.role !== "SUPER_ADMIN") {
      return ctx.reply("❌ Ruxsat yo‘q");
    }

    await ctx.reply(
      "📁 Projects panel",
      Markup.inlineKeyboard([
        [Markup.button.callback("➕ Create Project", "create_project")],
        [Markup.button.callback("📋 Project List", "project_list")],
      ]),
    );
  });

  bot.action("project_list", async (ctx: BotContext) => {
    await ctx.answerCbQuery();

    const { data } = await api.get("/projects", {
      headers: {
        Authorization: `Bearer ${ctx.session.token}`,
      },
    });

    if (!data.length) {
      return ctx.reply("Loyihalar yo‘q");
    }

    for (const p of data) {
      await ctx.reply(
        `📁 ${p.name}
🔗 ${p.link}
💰 Reward: ${p.reward}

👨‍💼 Vote operator: ${p.voteOperator?.username || "—"}
💳 Payment operator: ${p.paymentOperator?.username || "—"}`,
        Markup.inlineKeyboard([
          [
            Markup.button.callback(
              "👨‍💼 Assign Vote Operator",
              `assign_vote_${p.id}`,
            ),
          ],
          [
            Markup.button.callback(
              "💳 Assign Payment Operator",
              `assign_pay_${p.id}`,
            ),
          ],
          [Markup.button.callback("📊 Stats", `project_stats_${p.id}`)],
        ]),
      );
    }
  });

  bot.action(/assign_vote_(\d+)/, async (ctx: any) => {
    const projectId = ctx.match[1];

    const { data } = await api.get("/users/operators", {
      headers: {
        Authorization: `Bearer ${ctx.session.token}`,
      },
    });

    const voteOperators = data.filter((o: any) => o.role === "VOTE_OPERATOR");

    const buttons = voteOperators.map((op: any) => {
      return [
        Markup.button.callback(
          `👨‍💼 ${op.username}`,
          `set_vote_${projectId}_${op.id}`,
        ),
      ];
    });

    await ctx.reply(
      "👨‍💼 Vote operatorni tanlang:",
      Markup.inlineKeyboard(buttons),
    );
  });

  bot.action(/assign_pay_(\d+)/, async (ctx: any) => {
    const projectId = ctx.match[1];

    const { data } = await api.get("/users/operators", {
      headers: {
        Authorization: `Bearer ${ctx.session.token}`,
      },
    });

    const payOperators = data.filter((o: any) => o.role === "PAYMENT_OPERATOR");

    const buttons = payOperators.map((op: any) => {
      return [
        Markup.button.callback(
          `💳 ${op.username}`,
          `set_pay_${projectId}_${op.id}`,
        ),
      ];
    });

    await ctx.reply(
      "💳 Payment operatorni tanlang:",
      Markup.inlineKeyboard(buttons),
    );
  });

  bot.action(/set_vote_(\d+)_(\d+)/, async (ctx: any) => {
    const projectId = ctx.match[1];
    const operatorId = ctx.match[2];

    await api.patch(
      `/projects/${projectId}`,
      {
        voteOperatorId: Number(operatorId),
      },
      {
        headers: {
          Authorization: `Bearer ${ctx.session.token}`,
        },
      },
    );

    await ctx.answerCbQuery("Vote operator biriktirildi");
    await ctx.reply(
      "📁 Project yangilandi",
      Markup.inlineKeyboard([
        [Markup.button.callback("📋 Project List", "project_list")],
      ]),
    );
  });

  bot.action(/set_pay_(\d+)_(\d+)/, async (ctx: any) => {
    const projectId = ctx.match[1];
    const operatorId = ctx.match[2];

    await api.patch(
      `/projects/${projectId}`,
      {
        paymentOperatorId: Number(operatorId),
      },
      {
        headers: {
          Authorization: `Bearer ${ctx.session.token}`,
        },
      },
    );

    await ctx.answerCbQuery("Payment operator biriktirildi");
    await ctx.reply(
      "📁 Project yangilandi",
      Markup.inlineKeyboard([
        [Markup.button.callback("📋 Project List", "project_list")],
      ]),
    );
  });

  bot.action(/project_stats_(\d+)/, async (ctx: any) => {
    const id = ctx.match[1];

    const { data } = await api.get(`/projects/${id}/stats`, {
      headers: {
        Authorization: `Bearer ${ctx.session.token}`,
      },
    });

    await ctx.reply(
      `📊 PROJECT STATS

📝 Submissions
• Total: ${data.submissions.total}
• Approved: ${data.submissions.approved}
• Rejected: ${data.submissions.rejected}
• Expired: ${data.submissions.expired}

💰 Withdrawals
• Paid: ${data.withdrawals.paid}
• Total paid: ${data.withdrawals.totalPaidAmount}`,
    );
  });
};
