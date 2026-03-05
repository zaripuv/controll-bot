import { Markup } from "telegraf";

export const operatorKeyboard = () => {
  return Markup.keyboard([
    ["Boshlash"],
  ]).resize();
};