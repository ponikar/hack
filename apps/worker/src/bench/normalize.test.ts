import assert from "node:assert/strict";
import type { SessionResult, StepResult } from "@watchdog/shared";
import { actLabel, gotoLabel, normalize, stepLabel } from "./normalize";

const step = (index: number, op: string, label: string, status: StepResult["status"], extra: Partial<StepResult> = {}): StepResult => ({ index, op, label, status, ms: 0, ...extra });
const result = (archetype: SessionResult["archetype"], status: SessionResult["status"], steps: StepResult[]): SessionResult => ({
  sessionId: "s", persona: archetype === "feed-reader" ? "grok" : "chatgpt-atlas", archetype, template: archetype === "feed-reader" ? "feed-reader" : "search-first",
  goal: "g", status, summary: "summary", steps, durationMs: 1,
});

assert.equal(actLabel("open site search and search for 'cart drawer shoes'"), "search");
assert.equal(actLabel("open the product 'Trail Runner'"), "product");
assert.equal(actLabel("open the first in-stock product in this category"), "product");
assert.equal(actLabel("select variant Size M"), "variant");
assert.equal(actLabel("choose any available option for Size"), "variant");
assert.equal(actLabel("try to add to cart without choosing any option"), "variant");
assert.equal(actLabel("add to cart"), "add_to_cart");
assert.equal(actLabel("close the cart drawer, then reopen it from the header cart icon"), "cart");
assert.equal(actLabel("from the cart drawer, proceed to checkout"), "checkout");
assert.equal(actLabel("proceed to checkout"), "checkout");
assert.equal(actLabel("click buy now"), "checkout");
assert.equal(actLabel("place the order with test card 4242 4242 4242 4242"), "payment");
assert.equal(actLabel("wiggle"), null);

assert.equal(gotoLabel("https://x.test/"), "home");
assert.equal(gotoLabel("https://x.test/collections/all"), "home");
assert.equal(gotoLabel("https://x.test/products/trail-runner"), "product");
assert.equal(gotoLabel("https://x.test/cart"), "cart");

assert.equal(stepLabel({ op: "fetch", label: "fetch https://x.test/" }), "fetch");
assert.equal(stepLabel({ op: "stop", label: "payment gate" }), "payment");
assert.equal(stepLabel({ op: "dismiss", label: "dismiss newsletter popup" }, "product"), "product");
assert.equal(stepLabel({ op: "goto", label: "open https://x.test/products/a" }), "product");

const passGate = normalize(result("browser-agent", "pass", [
  step(0, "goto", "open https://x.test/", "ok"),
  step(1, "act", "open site search and search for 'Trail Runner'", "ok"),
  step(2, "act", "open the product 'Trail Runner'", "ok"),
  step(3, "act", "add to cart", "ok"),
  step(4, "act", "proceed to checkout", "ok"),
  step(5, "stop", "payment gate", "stopped", { reason: "payment gate" }),
]));
assert.deepEqual([passGate.reachedCheckout, passGate.stoppedAt, passGate.blocker], [true, "payment", null]);

const passDemo = normalize(result("browser-agent", "pass", [step(0, "act", "place the order with test card 4242 4242 4242 4242", "ok")]));
assert.deepEqual([passDemo.reachedCheckout, passDemo.stoppedAt], [true, null]);

const popup = normalize(result("browser-agent", "blocked", [
  step(0, "goto", "open https://x.test/products/a", "ok"),
  step(1, "dismiss", "dismiss newsletter popup", "blocked", { blocker: "overlay", reason: "modal" }),
]));
assert.deepEqual([popup.reachedCheckout, popup.stoppedAt, popup.blocker, popup.reason], [false, "product", "overlay", "modal"]);

const waf = normalize(result("browser-agent", "blocked", [step(0, "goto", "open https://x.test/", "blocked", { blocker: "waf", reason: "HTTP 403" })]));
assert.deepEqual([waf.reachedCheckout, waf.stoppedAt, waf.blocker], [false, "home", "waf"]);

const atc = normalize(result("browser-agent", "fail", [
  step(0, "goto", "open https://x.test/products/a", "ok"),
  step(1, "act", "add to cart", "failed", { reason: "No matching control found on the page." }),
]));
assert.deepEqual([atc.reachedCheckout, atc.stoppedAt], [false, "add_to_cart"]);

const feedOk = normalize(result("feed-reader", "pass", [step(0, "fetch", "fetch https://x.test/", "ok")]));
assert.deepEqual([feedOk.reachedCheckout, feedOk.stoppedAt, feedOk.reason], [null, null, null]);

const feedFail = normalize(result("feed-reader", "fail", [step(0, "fetch", "fetch https://x.test/", "failed", { reason: "Without JavaScript, no price." })]));
assert.deepEqual([feedFail.reachedCheckout, feedFail.stoppedAt, feedFail.reason], [null, "fetch", "Without JavaScript, no price."]);

console.log("normalize: all assertions passed");
