import { Markup } from "telegraf";

export const operatorKeyboard = () => {
  return Markup.keyboard([
    ["📋 Pending submissions"],
  ]).resize();
};