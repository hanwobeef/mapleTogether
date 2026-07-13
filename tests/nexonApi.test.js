import assert from "node:assert/strict";
import test from "node:test";
import { mapFinalStatsForDashboard } from "../src/utils/nexonApi.js";

test("maps Nexon final_stat boss monster damage to dashboard bossDamage", () => {
  const stats = mapFinalStatsForDashboard([
    { stat_name: "STR", stat_value: "12,345" },
    { stat_name: "보스 몬스터 데미지", stat_value: "423%" },
    { stat_name: "데미지", stat_value: "98%" },
    { stat_name: "최종 데미지", stat_value: "76.5%" },
    { stat_name: "크리티컬 데미지", stat_value: "121.0%" },
    { stat_name: "전투력", stat_value: "123,456,789" }
  ]);

  assert.equal(stats.str, 12345);
  assert.equal(stats.bossDamage, 423);
  assert.equal(stats.damage, 98);
  assert.equal(stats.finalDamage, 76.5);
  assert.equal(stats.critDamage, 121);
  assert.equal(stats.combatPower, 123456789);
});
