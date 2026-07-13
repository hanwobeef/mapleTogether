import assert from "node:assert/strict";
import test from "node:test";
import {
  mapEquipmentSetEffectPresets,
  mapEquipmentSetEffects,
  mapFinalStatsForDashboard
} from "../src/utils/nexonApi.js";

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

test("maps active equipment set effects for detail modal display", () => {
  const effects = mapEquipmentSetEffects([
    {
      set_name: "아케인셰이드 세트",
      total_set_count: "5",
      set_effect_info: [
        { set_count: "2", set_option: "올스탯 : +50" },
        { set_count: "5", set_option: "보스 몬스터 공격 시 데미지 : +30%" }
      ],
      set_option_full: [
        { set_count: "6", set_option: "공격력 : +30" }
      ]
    }
  ]);

  assert.equal(effects.length, 1);
  assert.equal(effects[0].name, "아케인셰이드 세트");
  assert.equal(effects[0].totalSetCount, 5);
  assert.deepEqual(effects[0].activeOptions, [
    { count: 2, option: "올스탯 : +50" },
    { count: 5, option: "보스 몬스터 공격 시 데미지 : +30%" }
  ]);
});

test("maps equipment set effect presets when Nexon response includes preset data", () => {
  const { presets } = mapEquipmentSetEffectPresets({
    set_effect_preset_1: [
      {
        set_name: "앱솔랩스 세트",
        total_set_count: "5",
        set_effect_info: [{ set_count: "5", set_option: "공격력 : +30" }]
      }
    ],
    set_effect_preset_2: [
      {
        set_name: "아케인셰이드 세트",
        total_set_count: "6",
        set_effect_info: [{ set_count: "6", set_option: "보스 몬스터 공격 시 데미지 : +30%" }]
      }
    ]
  }, 1);

  assert.equal(presets.preset1[0].name, "앱솔랩스 세트");
  assert.equal(presets.preset2[0].name, "아케인셰이드 세트");
  assert.equal(presets.preset2[0].totalSetCount, 6);
});
