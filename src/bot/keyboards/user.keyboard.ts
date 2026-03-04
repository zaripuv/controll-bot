import { Markup } from "telegraf";

export const userKeyboard = () => {
  return Markup.keyboard([
    ["📝 Submit"],
    ["💰 Balance"],
    ["💳 Withdraw"],
    ["👥 Invite Friends"],
     ["📊 Referral Stats"]
  ]).resize();
};