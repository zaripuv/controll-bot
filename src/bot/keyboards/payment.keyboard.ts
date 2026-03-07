import { Markup } from "telegraf";

export const paymentKeyboard = () => {
  return Markup.keyboard([
    ["Kutilayotgan to'lovlar"],
  ]).resize();
};