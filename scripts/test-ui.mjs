import { chromium } from "playwright-core";

const errors = [];
const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: true,
});
const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
page.on("pageerror", (e) => errors.push("PAGEERROR: " + e.message));
page.on("console", (m) => { if (m.type() === "error") errors.push("CONSOLE: " + m.text()); });

const base = "http://127.0.0.1:8788/";
await page.goto(base, { waitUntil: "domcontentloaded" });
console.log("home title:", await page.title());
console.log("hero:", await page.locator("h1").first().innerText());

await page.locator("[data-session='read']").click();
await page.waitForTimeout(200);
console.log("session:", await page.locator("#session-count").innerText());

await page.goto(base + "#/plan", { waitUntil: "domcontentloaded" });
console.log("plan weeks:", await page.locator(".week-card").count());

await page.goto(base + "#/labs", { waitUntil: "domcontentloaded" });
console.log("methods:", await page.locator(".method-card").count());

await page.goto(base + "#/lab/reading", { waitUntil: "domcontentloaded" });
await page.locator("#reading-passage .w").nth(1).click();
await page.locator("#guess-input").fill("places");
await page.locator("#guess-reveal").click();
console.log("reading reveal:", (await page.locator(".reveal .en-def").innerText()).slice(0, 50));

await page.goto(base + "#/lab/four-word", { waitUntil: "domcontentloaded" });
await page.locator("#fw-text").fill("I want to stay stable and stick to the common plan across the week.");
await page.locator("#fw-check").click();
console.log("four-word result:", (await page.locator("#fw-result").innerText()).replace(/\n/g, " | ").slice(0, 140));

await page.goto(base + "#/lab/variations", { waitUntil: "domcontentloaded" });
await page.locator("#var-text").fill("I can have your tickets booked in a few days.\nGive me a few days to book your tickets.\nI can reserve them if you like.\nIf you give me a few days, I can book them.");
await page.locator("#var-check").click();
console.log("variations result:", (await page.locator("#var-result").innerText()).replace(/\n/g, " | ").slice(0, 160));

await page.goto(base + "#/lab/writing", { waitUntil: "domcontentloaded" });
await page.locator("#write-text").fill("Yesterday I walked to my favorite restaurant. The street was quiet, and the sky was a strange orange color. I took a photo of an old man looking at the trash bins.");
await page.locator("#write-check").click();
console.log("writing result:", (await page.locator("#write-result").innerText()).replace(/\n/g, " | ").slice(0, 170));

await page.goto(base + "#/dictionary/serendipity", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(1800);
console.log("dict card:", (await page.locator("#dict-card").innerText()).replace(/\n/g, " | ").slice(0, 130));
console.log("vocab fallback:", await page.locator("#vocab-frame").count() === 0 ? "shown" : "iframe still there");

await page.goto(base + "#/coach", { waitUntil: "domcontentloaded" });
await page.locator("#coach-input").fill("Please check: I look forward to meet you.");
await page.locator("#coach-form").evaluate((f) => f.requestSubmit());
await page.waitForTimeout(500);
console.log("coach messages:", await page.locator(".msg").count());

await page.goto(base + "#/immerse/routine", { waitUntil: "domcontentloaded" });
const before = await page.locator(".routine-item.done").count();
await page.locator("[data-routine] .check").first().click();
const after = await page.locator(".routine-item.done").count();
console.log("routine toggle:", before, "->", after);

await page.goto(base + "#/notebook?tab=words", { waitUntil: "domcontentloaded" });
console.log("notebook empty:", await page.locator(".empty").count());

await page.goto(base + "#/", { waitUntil: "domcontentloaded" });
await page.locator("#open-settings").click();
console.log("settings modal:", await page.locator(".modal h2").innerText());
await page.locator(".modal-close").click();

await page.setViewportSize({ width: 390, height: 844 });
await page.goto(base + "#/", { waitUntil: "domcontentloaded" });
console.log("mobile topbar visible:", await page.locator("#topbar").isVisible());
await page.locator("#nav-toggle").click();
console.log("mobile nav open:", await page.evaluate(() => document.body.classList.contains("nav-open")));
await page.screenshot({ path: "C:/Users/Liuzifeng/AppData/Local/Temp/ebrain-mobile.png", fullPage: true });

console.log("\nERRORS:", errors.length);
for (const e of errors) console.log(e);

await browser.close();
