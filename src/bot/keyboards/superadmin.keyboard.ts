import { Markup } from "telegraf";

export const superAdminKeyboard = () => {
  return Markup.keyboard([
    ["📊 System Stats"],
    ["📁 Projects"],
    ["📈 Vote Operators Stats"],
    ["💰 Payment Operators Stats"],
    ["👥 Manage Operators"]
  ]).resize();
};