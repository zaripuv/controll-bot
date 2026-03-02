import { Context, Scenes } from "telegraf";

export interface WizardState extends Scenes.WizardSessionData {
  username?: string;
}

export interface SessionData extends Scenes.SceneSession<Scenes.WizardSessionData> {
  token?: string;
  role?: string;
}

export interface BotContext extends Context {
  scene: Scenes.SceneContextScene<BotContext, Scenes.WizardSessionData>;
  wizard: Scenes.WizardContextWizard<BotContext>;
  session: SessionData;
}