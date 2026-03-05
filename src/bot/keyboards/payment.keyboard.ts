import { Markup } from "telegraf";

export const paymentKeyboard = () => {
  return Markup.keyboard([
    ["Boshlash"],
  ]).resize();
};