import TelegramBot from "node-telegram-bot-api";
import { logger } from "../lib/logger";
import { handleStart, handleMessage } from "./handlers";
import { handleAdminAuth, isInAdminAuth, startAdminAuth } from "./admin";

async function setupBotCommands(bot: TelegramBot) {
  try {
    await bot.setMyCommands([
      { command: "start", description: "🚀 Botni boshlash" },
    ]);
    await (bot as any).setChatMenuButton({
      menu_button: { type: "commands" },
    });
    logger.info("Bot commands and menu button set");
  } catch (err) {
    logger.warn({ err }, "Could not set menu button, skipping");
  }
}

export function startBot() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    logger.error("TELEGRAM_BOT_TOKEN is not set. Bot will not start.");
    return;
  }

  const bot = new TelegramBot(token, { polling: true });
  logger.info("Telegram bot started");
  setupBotCommands(bot);

  bot.onText(/\/start/, async (msg) => {
    try { await handleStart(bot, msg); }
    catch (err) { logger.error({ err }, "Error handling /start"); }
  });

  bot.onText(/\/admin/, async (msg) => {
    try {
      const chatId = msg.chat.id;
      const userId = msg.from!.id;
      startAdminAuth(userId);
      await bot.sendMessage(chatId, "🔐 Admin paneliga kirish\n\nIsmingizni kiriting:", {
        reply_markup: { remove_keyboard: true },
      });
    } catch (err) { logger.error({ err }, "Error handling /admin"); }
  });

  bot.on("message", async (msg) => {
    try {
      if (msg.text?.startsWith("/start") || msg.text?.startsWith("/admin")) return;
      await handleMessage(bot, msg);
    } catch (err) { logger.error({ err }, "Error handling message"); }
  });

  bot.on("polling_error", (err) => {
    logger.error({ err }, "Telegram polling error");
  });

  return bot;
}}
