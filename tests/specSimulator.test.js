import test from 'node:test';
import assert from 'node:assert/strict';
import { getSimulatedSpec } from '../src/utils/specSimulator.js';

test('returns safe defaults for missing character', () => {
  const result = getSimulatedSpec(null);

  assert.equal(result.combatPower, 0);
  assert.equal(result.stats.str, 1000);
  assert.equal(result.stats.starforce, 0);
});

test('returns original combat power when presets are unchanged', () => {
  const character = {
    combatPower: 123456,
    stats: {
      str: 10000,
      dex: 4000,
      intel: 1000,
      luk: 1000,
      attackPower: 1000,
      magicPower: 0,
      damage: 100,
      bossDamage: 150,
      finalDamage: 20,
      critDamage: 40
    },
    activePresets: { equipment: 1, ability: 1, hyperStat: 1, linkSkill: 1, union: 1 },
    selectedPresets: { equipment: 1, ability: 1, hyperStat: 1, linkSkill: 1, union: 1 }
  };

  const result = getSimulatedSpec(character);

  assert.equal(result.combatPower, 123456);
  assert.equal(result.stats.str, 10000);
});

test('estimates higher spec when selected equipment preset is stronger', () => {
  const character = {
    job: '히어로',
    combatPower: 1000000,
    stats: {
      str: 10000,
      dex: 4000,
      intel: 1000,
      luk: 1000,
      starforce: 200,
      bossDamage: 150,
      arcaneForce: 0,
      sacredPower: 0,
      attackPower: 1000,
      magicPower: 0,
      damage: 100,
      finalDamage: 20,
      critDamage: 40
    },
    activePresets: { equipment: 1, ability: 1, hyperStat: 1, linkSkill: 1, union: 1 },
    selectedPresets: { equipment: 2, ability: 1, hyperStat: 1, linkSkill: 1, union: 1 },
    presets: {
      equipment: {
        preset1: {
          weapon: {
            totalOption: { str: 100, dex: 40, attack_power: 10 },
            potentials: ['STR : +9%']
          }
        },
        preset2: {
          weapon: {
            totalOption: { str: 300, dex: 80, attack_power: 40 },
            potentials: ['STR : +21%']
          }
        },
        preset3: {}
      },
      ability: { preset1: [], preset2: [], preset3: [] },
      hyperStat: { preset1: [], preset2: [], preset3: [] },
      linkSkill: { preset1: [], preset2: [], preset3: [] },
      union: { preset1: [], preset2: [], preset3: [], preset4: [], preset5: [] }
    }
  };

  const result = getSimulatedSpec(character);

  assert.ok(result.stats.str > character.stats.str);
  assert.ok(result.stats.attackPower > character.stats.attackPower);
  assert.ok(result.combatPower > character.combatPower);
});
