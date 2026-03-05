import { Markup } from "telegraf";

export const superAdminKeyboard = () => {
  return Markup.keyboard([
    ["📊 Barcha Statistika"],
    ["📁 Loyihalar"],
    ["📢 Ovozchilar"],
    ["💸 To'lovchilar"],
    ["👥 Operatorlarni Boshqarish"]
  ]).resize();
};