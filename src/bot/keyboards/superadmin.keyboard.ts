import { Markup } from "telegraf";

export const superAdminKeyboard = () => {
  return Markup.keyboard([
    ["📊 System Stats"],
    ["📈 Vote Operators Stats"],
    ["💰 Payment Operators Stats"],
    ["👥 Manage Operators"]
  ]).resize();
};