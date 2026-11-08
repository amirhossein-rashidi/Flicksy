// Hidden test for Telegram Rich Messages (Bot API 10.1+): /richtest
// It sends a few sample messages and then tells what Telegram accepted or rejected.

const APP_URL = "https://flicksy.rashidi-a96.workers.dev/";

async function call(env, method, payload) {
  try {
    const res = await fetch("https://api.telegram.org/bot" + env.BOT_TOKEN + "/" + method, {
      method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload),
    });
    return await res.json();
  } catch (e) {
    return { ok: false, description: "network error" };
  }
}

const BODY =
  "<h2>📖 Flicksy help</h2>" +
  "<p>Everything you can do in this chat:</p>" +
  "<table bordered><tr><th>Command</th><th>What it does</th></tr>" +
  "<tr><td>/search</td><td>find a movie or series</td></tr>" +
  "<tr><td>/lists</td><td>your lists</td></tr>" +
  "<tr><td>/settings</td><td>language and backup</td></tr></table>" +
  "<hr/>" +
  "<details><summary>🔎 Searching</summary><p>Tap <b>Search</b> and type a name.</p><pre><code>@flicksyrobot inception</code></pre></details>" +
  "<details><summary>📚 Lists</summary><p>Share a list with a friend in any chat.</p></details>";

export async function runRichTest(env, chatId) {
  const results = [];
  const variants = [
    ["1 html: heading, table, details, code", { rich_message: { html: BODY } }],
    ["2 html + tg-button url", { rich_message: { html: BODY + '<tg-button-row><tg-button type="url" url="' + APP_URL + '">Open Flicksy</tg-button></tg-button-row>' } }],
    ["3 html + tg-button web_app", { rich_message: { html: BODY + '<tg-button-row><tg-button type="web_app" url="' + APP_URL + '">Open Flicksy</tg-button></tg-button-row>' } }],
    ["4 html + reply_markup (url + web_app)", {
      rich_message: { html: BODY },
      reply_markup: { inline_keyboard: [[{ text: "🌐 Open Flicksy", web_app: { url: APP_URL } }], [{ text: "Link", url: "https://t.me/flicksyrobot" }]] },
    }],
    ["5 markdown: table + code", { rich_message: { markdown: "## Flicksy help\n\n| Command | Does |\n|---|---|\n| /search | find a title |\n\n```\n@flicksyrobot inception\n```" } }],
  ];
  for (const v of variants) {
    const r = await call(env, "sendRichMessage", Object.assign({ chat_id: chatId }, v[1]));
    results.push(v[0] + " → " + (r && r.ok ? "OK" : "FAILED: " + ((r && r.description) || "no answer")));
  }
  await call(env, "sendMessage", { chat_id: chatId, text: "Rich test results:\n\n" + results.join("\n") });
}
