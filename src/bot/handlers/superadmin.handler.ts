import { BotContext } from "../../types";
import { api } from "../api";
import { Markup } from "telegraf";

export const registerSuperAdminHandlers = (bot: any) => {
  bot.action("add_operator", async (ctx: BotContext) => {
    await ctx.answerCbQuery();
    await ctx.scene.enter("create-operator-scene");
  });

  bot.hears("📊 Barcha Statistika", async (ctx: BotContext) => {
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
        `📊 UMUMIY STATISTIKA

📝 KO'RSATKICHLAR
• Jami: ${data.submissions.total}
• Tasdiqlangan: ${data.submissions.approved}
• Rad etilgan: ${data.submissions.rejected}
• Expired: ${data.submissions.expired}

💳 To'lovlar
• Jami: ${data.withdrawals.total}
• To'lov qilingan: ${data.withdrawals.paid}
• Bekor qilingan: ${data.withdrawals.cancelled}
• Jami to'lov miqdori: ${data.withdrawals.totalPaidAmount}

━━━━━━━━━━━━━━━━━━`,
      );
    } catch (err) {
      console.log(err);
      await ctx.reply("❌ Xatolik yuz berdi");
    }
  });

  bot.hears("📢 Ovozchilar", async (ctx: BotContext) => {
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

      let message = "📈 OVOZ OPERATOR STATISTIKASI\n\n";

      for (const op of data) {
        const approved = op.reviewedSubs.filter(
          (s: any) => s.status === "APPROVED",
        ).length;
        const rejected = op.reviewedSubs.filter(
          (s: any) => s.status === "REJECTED",
        ).length;

        message += `👤 ${op.username}\n`;
        message += `   ✅ Tasdiqlangan: ${approved}\n`;
        message += `   ❌ Rad etilgan: ${rejected}\n\n`;
      }

      await ctx.reply(message);
    } catch {
      await ctx.reply("❌ Xatolik yuz berdi");
    }
  });

  bot.hears("💸 To'lovchilar", async (ctx: BotContext) => {
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
        return ctx.reply("To'lov operator yo‘q");
      }

      let message = "💰 TO'LOV OPERATOR STATISTIKASI\n\n";

      for (const op of data) {
        const paid = op.processedWiths.filter(
          (w: any) => w.status === "PAID",
        ).length;

        const totalPaid = op.processedWiths
          .filter((w: any) => w.status === "PAID")
          .reduce((sum: number, w: any) => sum + Number(w.amount), 0);

        message += `👤 ${op.username}\n`;
        message += `   💸 To'lov qilingan: ${paid}\n`;
        message += `   💰 Jami to'lov: ${totalPaid}\n\n`;
      }

      await ctx.reply(message);
    } catch {
      await ctx.reply("❌ Xatolik yuz berdi");
    }
  });

  bot.hears("👥 Operatorlarni Boshqarish", async (ctx: BotContext) => {
    if (ctx.session.role !== "SUPER_ADMIN") {
      return ctx.reply("❌ Ruxsat yo‘q");
    }

    await ctx.reply(
      "Operator boshqaruvi:",
      Markup.inlineKeyboard([
        [Markup.button.callback("➕ Operator qo'shish", "add_operator")],
        [Markup.button.callback("🗑 Operator o'chirish", "delete_operator")],
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
            [Markup.button.callback("🗑 O'chirish", `delete_operator_${op.id}`)],
          ]),
        );
      }
    } catch (err) {
      console.log(err);
      await ctx.reply("❌ Xatolik yuz berdi");
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

      await ctx.answerCbQuery("❌ Xatolik yuz berdi");
    }
  });

  bot.action("create_project", async (ctx: BotContext) => {
    await ctx.answerCbQuery();
    await ctx.scene.enter("create-project-scene");
  });

  bot.hears("📁 Loyihalar", async (ctx: BotContext) => {
    if (ctx.session.role !== "SUPER_ADMIN") {
      return ctx.reply("❌ Ruxsat yo‘q");
    }

    await ctx.reply(
      "📁 Loyihalar paneli",
      Markup.inlineKeyboard([
        [Markup.button.callback("➕ Loyiha yaratish", "create_project")],
        [Markup.button.callback("📋 Loyihalar ro'yxati", "project_list")],
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
💰 Mukofot summasi: ${p.reward}

👨‍💼 Ovoz operator: ${p.voteOperator?.username || "—"}
💳 To'lov operator: ${p.paymentOperator?.username || "—"}`,
        Markup.inlineKeyboard([
          [
            Markup.button.callback(
              "👨‍💼 Ovoz Operator Biriktirish",
              `assign_vote_${p.id}`,
            ),
          ],
          [
            Markup.button.callback(
              "💳 To'lov Operator Biriktirish",
              `assign_pay_${p.id}`,
            ),
          ],
          [Markup.button.callback("📊 Statistika", `project_stats_${p.id}`)],
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
      "👨‍💼 Ovoz operatorni tanlang:",
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
      "💳 To'lov operatorni tanlang:",
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

    await ctx.answerCbQuery("Ovoz operator biriktirildi");
    await ctx.reply(
      "📁 Loyiha yangilandi",
      Markup.inlineKeyboard([
        [Markup.button.callback("📋 Loyihalar ro'yxati", "project_list")],
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

    await ctx.answerCbQuery("To'lov operator biriktirildi");
    await ctx.reply(
      "📁 Loyiha yangilandi",
      Markup.inlineKeyboard([
        [Markup.button.callback("📋 Loyihalar ro'yxati", "project_list")],
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
      `📊 LOYIHA STATISTIKASI

📝 Ovozlar
• Jami: ${data.submissions.total}
• Tasdiqlangan: ${data.submissions.approved}
• Rad etilgan: ${data.submissions.rejected}
• Muddati o'tgan: ${data.submissions.expired}

💰 To'lovlar
• To'lov qilingan: ${data.withdrawals.paid}
• Jami to'lov: ${data.withdrawals.totalPaidAmount}`,
    );
  });
};
