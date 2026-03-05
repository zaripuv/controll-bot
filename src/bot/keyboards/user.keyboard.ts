import { Markup } from "telegraf";

export const userKeyboard = () => {
  return Markup.keyboard([
    ["📢 Ovoz Berish"],
    ["💰 Balance"],
    ["💳 Pul Yechish"],
    ["👥 Do'stlarni Taklif Qilish"],
     ["📊 Mening Statistikam"]
  ]).resize();
};