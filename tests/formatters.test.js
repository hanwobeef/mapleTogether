import assert from "node:assert/strict";
import test from "node:test";
import { formatCombatPower } from "../src/utils/formatters.js";

test("formats combat power with Korean eok/man units", () => {
  assert.equal(formatCombatPower(280000000), "2억 8000만 0000");
  assert.equal(formatCombatPower(123456789), "1억 2345만 6789");
  assert.equal(formatCombatPower(10000), "1만 0000");
  assert.equal(formatCombatPower(9999), "9,999");
});
