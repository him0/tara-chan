import { createReadStream } from "fs";
import { App } from "@slack/bolt";
import { LogLevel } from "@slack/logger";
// bolt 公式 tutorial https://slack.dev/bolt-js/ja-jp/tutorial/getting-started
// 神記事 https://qiita.com/seratch/items/1a460c08c3e245b56441
import { webkit } from "playwright";

const app = new App({
  logLevel: process.env.DEBUG === "1" ? LogLevel.DEBUG : LogLevel.INFO,
  socketMode: true,
  token: process.env.SLACK_BOT_TOKEN,
  appToken: process.env.SLACK_APP_TOKEN,
});

(async () => {
  await app.start();

  app.message("hi", async ({ message, say }) => {
    if (message.subtype) return;
    await say(`<@${message.user}> よお！兄弟！`);
  });

  app.event("app_mention", async ({ body, say }) => {
    await say("気安くメンションするんじゃねえ、次やったら金とるからな");
  });

  app.message(
    /^(screenshot|スクショ) (.*)/,
    async ({ context, message, say }) => {
      const url = context.matches[2].replace(">", "").replace("<", "");
      const filename = "screenshot.png";
      const filePath = `./tmp/${filename}`;

      if (message.subtype) return;
      await say(
        `<@${message.user}> ${url} のスクショだな、分かったよ、ちょいと待な`
      );

      const browser = await webkit.launch();
      const browserContext = await browser.newContext();
      const page = await browserContext.newPage();
      await page.goto(url, { waitUntil: "networkidle" });
      await page.screenshot({ path: filePath });
      await browser.close();

      await app.client.files.upload({
        filename,
        file: createReadStream(filePath),
        channels: message.channel,
      });

      if (message.subtype) return;
      await say(`<@${message.user}> おら、俺のとっておきだ☆`);
    }
  );

  console.log("⚡️ Bolt app is running!");
})();
