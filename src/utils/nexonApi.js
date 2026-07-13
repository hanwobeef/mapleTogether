/**
 * NEXON Open API Client for MapleStory
 * 
 * 가이드 주소: https://openapi.nexon.com/ko/game/maplestory/?id=14
 * 
 * * API Key는 보안상 코드에 직접 노출하지 않고,
 *   - 운영: VITE_NEXON_API_PROXY_URL로 서버 프록시를 호출합니다.
 *   - 로컬 실험: .env의 VITE_NEXON_API_KEY를 임시로 사용할 수 있습니다.
 */

// 운영 배포에서는 프론트에 API 키를 넣지 말고 VITE_NEXON_API_PROXY_URL을 사용하세요.
// 로컬 개발에서만 VITE_NEXON_API_KEY를 직접 사용할 수 있습니다.
const ENV = import.meta.env || {};
const API_KEY = ENV.VITE_NEXON_API_KEY || "";
const API_PROXY_URL = ENV.VITE_NEXON_API_PROXY_URL || "";
const BASE_URL = "https://open.api.nexon.com/maplestory/v1";
const REQUEST_CACHE_TTL_MS = 5 * 60 * 1000;
const MAX_CONCURRENT_REQUESTS = Math.max(
  1,
  Number(ENV.VITE_NEXON_API_CONCURRENCY || 4)
);

const requestCache = new Map();
let activeRequests = 0;
const requestQueue = [];

function getRuntimeOrigin() {
  return globalThis.location?.origin || "http://localhost";
}

function getApiBaseUrl() {
  return (API_PROXY_URL || BASE_URL).replace(/\/$/, "");
}

function getCacheKey(endpoint, params) {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}=${params[key]}`)
    .join("&");
  return `${endpoint}?${sortedParams}`;
}

function enqueueRequest(task) {
  return new Promise((resolve, reject) => {
    const run = async () => {
      activeRequests += 1;
      try {
        resolve(await task());
      } catch (error) {
        reject(error);
      } finally {
        activeRequests -= 1;
        const next = requestQueue.shift();
        if (next) next();
      }
    };

    if (activeRequests < MAX_CONCURRENT_REQUESTS) {
      run();
    } else {
      requestQueue.push(run);
    }
  });
}

/**
 * 어제 날짜를 YYYY-MM-DD 형식의 KST 기준으로 반환합니다.
 * (넥슨 API는 전날 데이터가 보통 오전 2시 이후 제공되므로 어제 날짜 조회가 가장 안정적입니다)
 */
function getTargetDate(daysAgo = 1) {
  const date = new Date();
  // 한국 시간(KST, UTC+9) 보정
  const kstOffset = 9 * 60 * 60 * 1000;
  const kstDate = new Date(date.getTime() + kstOffset);

  // 지정된 일수만큼 전날 데이터를 요청
  kstDate.setDate(kstDate.getDate() - daysAgo);

  const yyyy = kstDate.getUTCFullYear();
  const mm = String(kstDate.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(kstDate.getUTCDate()).padStart(2, '0');

  return `${yyyy}-${mm}-${dd}`;
}

/**
 * API 공통 Fetch 함수 (인증 헤더 포함)
 */
async function fetchFromNexon(endpoint, params = {}) {
  if (!API_PROXY_URL && !API_KEY) {
    throw new Error("NEXON OpenAPI 설정이 없습니다. .env에 VITE_NEXON_API_PROXY_URL 또는 로컬 개발용 VITE_NEXON_API_KEY를 설정해주세요.");
  }

  const cacheKey = getCacheKey(endpoint, params);
  const cached = requestCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < REQUEST_CACHE_TTL_MS) {
    return cached.data;
  }

  const url = new URL(`${getApiBaseUrl()}${endpoint}`, getRuntimeOrigin());
  Object.keys(params).forEach(key => {
    if (params[key] !== undefined && params[key] !== null) {
      url.searchParams.append(key, params[key]);
    }
  });

  const headers = {
    "accept": "application/json"
  };
  if (!API_PROXY_URL) {
    headers["x-nxopen-api-key"] = API_KEY;
  }

  const data = await enqueueRequest(async () => {
    const response = await fetch(url.toString(), {
      method: "GET",
      headers
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error?.message || `API 요청에 실패했습니다. (상태 코드: ${response.status})`);
    }

    return response.json();
  });

  requestCache.set(cacheKey, {
    data,
    timestamp: Date.now()
  });
  return data;
}

/**
 * 캐릭터 이름을 통해 고유 캐릭터 식별자(ocid)를 가져옵니다.
 */
export async function getCharacterOcid(characterName) {
  const data = await fetchFromNexon("/id", { character_name: characterName });
  return data.ocid;
}

/**
 * 캐릭터 기본 정보(레벨, 직업, 아바타 이미지 등)를 가져옵니다.
 */
export async function getCharacterBasic(ocid, date) {
  return fetchFromNexon("/character/basic", { ocid, date });
}

/**
 * 캐릭터 능력치 정보(전투력, 스탯포스, 주요 주스탯 등)를 가져옵니다.
 */
export async function getCharacterStat(ocid, date) {
  return fetchFromNexon("/character/stat", { ocid, date });
}

/**
 * 캐릭터 장착 장비 정보를 가져옵니다.
 */
export async function getCharacterItemEquipment(ocid, date) {
  return fetchFromNexon("/character/item-equipment", { ocid, date });
}

/**
 * 캐릭터 장착 장비 세트효과 정보를 가져옵니다.
 */
export async function getCharacterSetEffect(ocid, date) {
  return fetchFromNexon("/character/set-effect", { ocid, date });
}

/**
 * 캐릭터 캐시 장비(코디) 정보를 가져옵니다.
 */
export async function getCharacterCashItemEquipment(ocid, date) {
  return fetchFromNexon("/character/cashitem-equipment", { ocid, date });
}

/**
 * 캐릭터 펫 장비 정보를 가져옵니다.
 */
export async function getCharacterPetEquipment(ocid, date) {
  return fetchFromNexon("/character/pet-equipment", { ocid, date });
}

/**
 * 캐릭터 어빌리티 정보를 가져옵니다.
 */
export async function getCharacterAbility(ocid, date) {
  return fetchFromNexon("/character/ability", { ocid, date });
}

/**
 * 캐릭터 하이퍼스탯 정보를 가져옵니다.
 */
export async function getCharacterHyperStat(ocid, date) {
  return fetchFromNexon("/character/hyper-stat", { ocid, date });
}

/**
 * 캐릭터 링크스킬 정보를 가져옵니다.
 */
export async function getCharacterLinkSkill(ocid, date) {
  return fetchFromNexon("/character/link-skill", { ocid, date });
}

/**
 * 캐릭터 유니온 기본 정보를 가져옵니다.
 */
export async function getCharacterUnion(ocid, date) {
  return fetchFromNexon("/user/union", { ocid, date });
}

/**
 * 캐릭터 유니온 레이더 배치 및 효과 정보를 가져옵니다.
 */
export async function getCharacterUnionRaider(ocid, date) {
  return fetchFromNexon("/user/union-raider", { ocid, date });
}

function parseStatNumber(value, fallback = 0) {
  const parsed = Number.parseFloat(String(value ?? "").replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeStatName(value) {
  return String(value || "").replace(/\s+/g, "").toLowerCase().normalize("NFC");
}

function findStatValue(statEntries, { aliases = [], includes = [], excludes = [] }, fallback = 0) {
  const normalizedAliases = aliases.map(normalizeStatName);
  const normalizedIncludes = includes.map(normalizeStatName);
  const normalizedExcludes = excludes.map(normalizeStatName);

  const exactMatch = statEntries.find(entry => (
    normalizedAliases.includes(normalizeStatName(entry.stat_name))
  ));

  const partialMatch = exactMatch || statEntries.find(entry => {
    const name = normalizeStatName(entry.stat_name);
    return (
      normalizedIncludes.every(keyword => name.includes(keyword)) &&
      normalizedExcludes.every(keyword => !name.includes(keyword))
    );
  });

  return parseStatNumber(partialMatch?.stat_value, fallback);
}

export function mapFinalStatsForDashboard(finalStat = []) {
  const statEntries = Array.isArray(finalStat) ? finalStat : [];

  return {
    str: findStatValue(statEntries, { aliases: ["STR", "힘"] }, 1000),
    dex: findStatValue(statEntries, { aliases: ["DEX", "민첩"] }, 1000),
    intel: findStatValue(statEntries, { aliases: ["INT", "지력"] }, 1000),
    luk: findStatValue(statEntries, { aliases: ["LUK", "운"] }, 1000),
    starforce: findStatValue(statEntries, { aliases: ["스타포스"] }),
    bossDamage: findStatValue(statEntries, {
      aliases: ["보스 데미지", "보스데미지", "보스 몬스터 데미지"],
      includes: ["보스", "데미지"]
    }),
    arcaneForce: findStatValue(statEntries, { aliases: ["아케인포스"] }),
    sacredPower: findStatValue(statEntries, { aliases: ["어센틱포스"] }),
    attackPower: findStatValue(statEntries, { aliases: ["공격력"] }),
    magicPower: findStatValue(statEntries, { aliases: ["마력"] }),
    damage: findStatValue(statEntries, {
      aliases: ["데미지"],
      includes: ["데미지"],
      excludes: ["보스", "최종", "크리티컬"]
    }),
    finalDamage: findStatValue(statEntries, {
      aliases: ["최종 데미지", "최종데미지"],
      includes: ["최종", "데미지"]
    }),
    critDamage: findStatValue(statEntries, {
      aliases: ["크리티컬 데미지", "크리티컬데미지"],
      includes: ["크리티컬", "데미지"]
    }),
    combatPower: findStatValue(statEntries, { aliases: ["전투력"] })
  };
}

function normalizeOptionText(option) {
  if (!option) return "";
  if (typeof option === "string") return option;
  return option.set_option || option.option || option.value || option.stat_value || "";
}

export function mapEquipmentSetEffects(setEffect = []) {
  if (!Array.isArray(setEffect)) return [];

  return setEffect
    .filter(effect => effect && effect.set_name)
    .map(effect => ({
      name: effect.set_name,
      totalSetCount: parseStatNumber(effect.total_set_count),
      activeOptions: Array.isArray(effect.set_effect_info)
        ? effect.set_effect_info
          .map(info => ({
            count: parseStatNumber(info.set_count),
            option: normalizeOptionText(info)
          }))
          .filter(info => info.count > 0 && info.option)
        : [],
      fullOptions: Array.isArray(effect.set_option_full)
        ? effect.set_option_full
          .map(info => ({
            count: parseStatNumber(info.set_count),
            option: normalizeOptionText(info)
          }))
          .filter(info => info.count > 0 && info.option)
        : []
    }))
    .filter(effect => effect.totalSetCount > 0 || effect.activeOptions.length > 0);
}

export function mapEquipmentSetEffectPresets(setEffectData = {}, activePresetNo = 1) {
  const presets = {
    preset1: mapEquipmentSetEffects(setEffectData.set_effect_preset_1),
    preset2: mapEquipmentSetEffects(setEffectData.set_effect_preset_2),
    preset3: mapEquipmentSetEffects(setEffectData.set_effect_preset_3)
  };
  const defaultSetEffects = mapEquipmentSetEffects(setEffectData.set_effect);
  const activePresetKey = `preset${activePresetNo}`;

  if (presets[activePresetKey]?.length === 0 && defaultSetEffects.length > 0) {
    presets[activePresetKey] = defaultSetEffects;
  }

  if (presets.preset1.length === 0 && defaultSetEffects.length > 0) {
    presets.preset1 = defaultSetEffects;
  }

  return {
    defaultSetEffects,
    presets
  };
}

/**
 * 넥슨 Open API로 조회한 원본 데이터를 우리 대시보드 스펙 양식에 맞추어 변환합니다.
 */
export async function fetchFullCharacterData(characterName) {
  try {
    // 1. OCID 조회
    const ocid = await getCharacterOcid(characterName);

    // 2. 오늘 날짜로 조회가 가능한지 먼저 시도 (폴백 적용)
    let latestDate = getTargetDate(0);
    let basic;
    try {
      basic = await getCharacterBasic(ocid, latestDate);
    } catch {
      latestDate = getTargetDate(1);
      basic = await getCharacterBasic(ocid, latestDate);
    }

    // 3. 결정된 최신 기준 날짜로 스탯 및 모든 프리셋 정보 병렬 조회
    const [stat, equipment, setEffect, cashEquipment, petEquipment, ability, hyperStat, linkSkill, union, unionRaider] = await Promise.all([
      getCharacterStat(ocid, latestDate),
      getCharacterItemEquipment(ocid, latestDate),
      getCharacterSetEffect(ocid, latestDate).catch(() => ({})),
      getCharacterCashItemEquipment(ocid, latestDate).catch(() => ({})),
      getCharacterPetEquipment(ocid, latestDate).catch(() => ({})),
      getCharacterAbility(ocid, latestDate).catch(() => ({})),
      getCharacterHyperStat(ocid, latestDate).catch(() => ({})),
      getCharacterLinkSkill(ocid, latestDate).catch(() => ({})),
      getCharacterUnion(ocid, latestDate).catch(() => ({})),
      getCharacterUnionRaider(ocid, latestDate).catch(() => ({}))
    ]);

    // 4. 기준 날짜로부터 최근 7일간의 날짜 배열 생성
    const startOffset = latestDate === getTargetDate(0) ? 0 : 1;
    const dates = Array.from({ length: 7 }, (_, i) => getTargetDate(startOffset + i));

    // 5. 최근 7일치 기본 정보를 병렬 조회하여 경험치 추이 데이터 가공
    const basicHistoryPromises = dates.map(d => 
      getCharacterBasic(ocid, d).catch(() => null)
    );
    const basicHistory = await Promise.all(basicHistoryPromises);

    // 6. 일주일간의 경험치 및 레벨 변화 히스토리 추출 (오래된 날짜부터 정렬 - 7일 전 ➔ 어제)
    const expRateHistory = [];
    for (let i = 6; i >= 0; i--) {
      const basicInfo = basicHistory[i];
      expRateHistory.push({
        date: dates[i].substring(5), // "MM-DD" 포맷
        level: basicInfo ? parseInt(basicInfo.character_level) : 200,
        expRate: basicInfo ? parseFloat(basicInfo.character_exp_rate) : 0.0
      });
    }

    // 7. 스탯 배열 매핑 (final_stat)
    const mappedStats = mapFinalStatsForDashboard(stat.final_stat);

    // 8. 장비 매핑 공통 헬퍼
    const slotMap = {
      "무기": "weapon",
      "엠블렘": "emblem",
      "보조무기": "subWeapon",
      "모자": "hat",
      "상의": "top",
      "하의": "bottom",
      "신발": "shoes",
      "장갑": "gloves",
      "망토": "cape",
      "어깨장식": "shoulder",
      "반지1": "ring1",
      "반지2": "ring2",
      "반지3": "ring3",
      "반지4": "ring4",
      "펜던트": "pendant1",      // API returns "펜던트"
      "펜던트2": "pendant2",
      "벨트": "belt",
      "귀고리": "earring",
      "얼굴장식": "faceAcc",
      "눈장식": "eyeAcc",
      "뱃지": "badge",
      "기계 심장": "heart",       // API returns "기계 심장" (with space)
      "포켓 아이템": "pocket",    // API returns "포켓 아이템"
      "훈장": "medal"            // API returns "훈장"
    };

    const mapEquipmentList = (itemList) => {
      const mapped = {};
      if (itemList) {
        itemList.forEach(item => {
          const slotName = item.item_equipment_slot || item.item_equipment_part;
          const mappedKey = slotMap[slotName];
          if (mappedKey) {
            const starforceVal = item.starforce && item.starforce !== "0" ? item.starforce : null;
            const starForceText = starforceVal ? ` (★${starforceVal})` : "";
            const potentialText = item.potential_option_grade ? ` (${item.potential_option_grade})` : "";
            mapped[mappedKey] = {
              name: item.item_name,
              icon: item.item_icon,
              starforce: starforceVal ? parseInt(starforceVal) : null,
              grade: item.potential_option_grade || null,
              raw: `${item.item_name}${starForceText}${potentialText}`,
              // Rich details for custom tooltip
              potentialGrade: item.potential_option_grade || null,
              addPotentialGrade: item.additional_potential_option_grade || null,
              potentials: [
                item.potential_option_1,
                item.potential_option_2,
                item.potential_option_3
              ].filter(Boolean),
              addPotentials: [
                item.additional_potential_option_1,
                item.additional_potential_option_2,
                item.additional_potential_option_3
              ].filter(Boolean),
              scrollUpgrade: item.scroll_upgrade || null,
              totalOption: item.item_total_option || {},
              baseOption: item.item_base_option || {},
              addOption: item.item_add_option || {},
              etcOption: item.item_etc_option || {},
              starforceOption: item.item_starforce_option || {}
            };
          }
        });
      }
      return mapped;
    };

    // 장비 프리셋 파싱
    const activeEquipPresetNo = equipment.preset_no ? parseInt(equipment.preset_no) : 1;
    const { defaultSetEffects, presets: setEffectPresets } = mapEquipmentSetEffectPresets(setEffect, activeEquipPresetNo);
    const equipmentPresets = {
      preset1: mapEquipmentList(equipment.item_equipment_preset_1),
      preset2: mapEquipmentList(equipment.item_equipment_preset_2),
      preset3: mapEquipmentList(equipment.item_equipment_preset_3),
    };
    
    // 현재 적용 중인 기본 장비 설정
    const defaultEquip = equipment.item_equipment && equipment.item_equipment.length > 0
      ? mapEquipmentList(equipment.item_equipment)
      : (equipmentPresets[`preset${activeEquipPresetNo}`] || {});

    // 프리셋 배열이 비어있다면, 현재 적용 중인 기본 장비로 폴백
    if (Object.keys(equipmentPresets.preset1).length === 0 && Object.keys(defaultEquip).length > 0) {
      equipmentPresets.preset1 = defaultEquip;
    }
    if (Object.keys(equipmentPresets.preset2).length === 0 && Object.keys(defaultEquip).length > 0) {
      equipmentPresets.preset2 = defaultEquip;
    }
    if (Object.keys(equipmentPresets.preset3).length === 0 && Object.keys(defaultEquip).length > 0) {
      equipmentPresets.preset3 = defaultEquip;
    }

    const mapCashItemList = (itemList) => {
      if (!Array.isArray(itemList)) return [];
      return itemList
        .filter(item => item && (item.cash_item_name || item.item_name))
        .map(item => ({
          name: item.cash_item_name || item.item_name,
          icon: item.cash_item_icon || item.item_icon,
          part: item.cash_item_equipment_part || item.item_equipment_part || item.cash_item_equipment_slot || "코디",
          slot: item.cash_item_equipment_slot || item.item_equipment_slot || item.cash_item_equipment_part || "코디",
          description: item.cash_item_description || item.item_description || "",
          label: item.cash_item_label || "",
          dateExpire: item.date_expire || null,
          dateOptionExpire: item.date_option_expire || null,
          options: item.cash_item_option || item.item_option || []
        }));
    };

    const activeCashPresetNo = cashEquipment.preset_no ? parseInt(cashEquipment.preset_no) : 1;
    const cashEquipmentPresets = {
      preset1: mapCashItemList(cashEquipment.cash_item_equipment_preset_1),
      preset2: mapCashItemList(cashEquipment.cash_item_equipment_preset_2),
      preset3: mapCashItemList(cashEquipment.cash_item_equipment_preset_3)
    };
    const defaultCashEquipment = Array.isArray(cashEquipment.cash_item_equipment_base)
      ? mapCashItemList(cashEquipment.cash_item_equipment_base)
      : (cashEquipmentPresets[`preset${activeCashPresetNo}`] || []);

    if (cashEquipmentPresets.preset1.length === 0 && defaultCashEquipment.length > 0) {
      cashEquipmentPresets.preset1 = defaultCashEquipment;
    }
    if (cashEquipmentPresets.preset2.length === 0 && defaultCashEquipment.length > 0) {
      cashEquipmentPresets.preset2 = defaultCashEquipment;
    }
    if (cashEquipmentPresets.preset3.length === 0 && defaultCashEquipment.length > 0) {
      cashEquipmentPresets.preset3 = defaultCashEquipment;
    }

    const normalizePetList = (value) => {
      if (!value) return [];
      if (Array.isArray(value)) return value.filter(Boolean);
      if (typeof value === "object") {
        return Object.entries(value)
          .filter(([key, item]) => item && !key.toLowerCase().includes("icon"))
          .map(([key, item]) => (
            typeof item === "object"
              ? item
              : { name: item, icon: value[`${key}_icon`] || "" }
          ));
      }
      return [value];
    };

    const mapPetEquipment = (petIndex) => {
      const name = petEquipment[`pet_${petIndex}_name`];
      const nickname = petEquipment[`pet_${petIndex}_nickname`];
      const icon = petEquipment[`pet_${petIndex}_icon`];
      const equipmentItem = petEquipment[`pet_${petIndex}_equipment`];
      const autoSkill = petEquipment[`pet_${petIndex}_auto_skill`];
      const petType = petEquipment[`pet_${petIndex}_pet_type`];
      const skills = petEquipment[`pet_${petIndex}_skill`];

      if (!name && !nickname && !icon && !equipmentItem) return null;

      return {
        slot: petIndex,
        name: name || nickname || `${petIndex}번 펫`,
        nickname: nickname || "",
        icon: icon || "",
        type: petType || "",
        description: petEquipment[`pet_${petIndex}_description`] || "",
        equipment: equipmentItem ? {
          name: equipmentItem.item_name || equipmentItem.pet_equipment_name || equipmentItem.name || "펫 장비",
          icon: equipmentItem.item_icon || equipmentItem.pet_equipment_icon || equipmentItem.icon || "",
          description: equipmentItem.item_description || equipmentItem.pet_equipment_description || "",
          options: equipmentItem.item_option || equipmentItem.pet_equipment_option || []
        } : null,
        autoSkill: normalizePetList(autoSkill),
        skills: normalizePetList(skills)
      };
    };

    const pets = [1, 2, 3].map(mapPetEquipment).filter(Boolean);

    // 9. 어빌리티 프리셋 파싱
    const activeAbilityPresetNo = ability.preset_no ? parseInt(ability.preset_no) : 1;
    const mapAbilityPreset = (presetObj) => {
      if (!presetObj || !presetObj.ability_info) return [];
      return presetObj.ability_info.map(info => ({
        grade: info.ability_grade,
        value: info.ability_value
      }));
    };
    const abilityPresets = {
      preset1: mapAbilityPreset(ability.ability_preset_1),
      preset2: mapAbilityPreset(ability.ability_preset_2),
      preset3: mapAbilityPreset(ability.ability_preset_3),
    };

    // 10. 하이퍼스탯 프리셋 파싱
    const activeHyperPresetNo = hyperStat.use_preset_no ? parseInt(hyperStat.use_preset_no) : 1;
    const mapHyperStatPreset = (presetList) => {
      if (!presetList) return [];
      return presetList
        .filter(stat => stat.stat_level > 0)
        .map(stat => ({
          type: stat.stat_type,
          level: stat.stat_level,
          value: stat.stat_value
        }));
    };
    const hyperStatPresets = {
      preset1: mapHyperStatPreset(hyperStat.hyper_stat_preset_1),
      preset2: mapHyperStatPreset(hyperStat.hyper_stat_preset_2),
      preset3: mapHyperStatPreset(hyperStat.hyper_stat_preset_3),
    };

    // 11. 링크스킬 프리셋 파싱
    const activeLinkPresetNo = linkSkill.use_preset_no ? parseInt(linkSkill.use_preset_no) : 1;
    const mapLinkSkillPreset = (presetList) => {
      if (!presetList) return [];
      return presetList.map(skill => ({
        name: skill.skill_name,
        level: skill.skill_level,
        effect: skill.skill_effect,
        icon: skill.skill_icon
      }));
    };
    
    const defaultLinkSkill = mapLinkSkillPreset(linkSkill.character_link_skill);
    const linkSkillPresets = {
      preset1: mapLinkSkillPreset(linkSkill.character_link_skill_preset_1),
      preset2: mapLinkSkillPreset(linkSkill.character_link_skill_preset_2),
      preset3: mapLinkSkillPreset(linkSkill.character_link_skill_preset_3),
    };

    // If preset lists are empty, fallback to default equipped link skills
    if (linkSkillPresets.preset1.length === 0 && defaultLinkSkill.length > 0) {
      linkSkillPresets.preset1 = defaultLinkSkill;
    }
    if (linkSkillPresets.preset2.length === 0 && defaultLinkSkill.length > 0) {
      linkSkillPresets.preset2 = defaultLinkSkill;
    }
    if (linkSkillPresets.preset3.length === 0 && defaultLinkSkill.length > 0) {
      linkSkillPresets.preset3 = defaultLinkSkill;
    }

    // 12. 유니온 레이더 프리셋 파싱
    const activeUnionPresetNo = unionRaider.use_preset_no ? parseInt(unionRaider.use_preset_no) : 1;
    const mapUnionPreset = (presetObj) => {
      if (!presetObj || !presetObj.union_raider_stat) return [];
      return presetObj.union_raider_stat;
    };
    const unionPresets = {
      preset1: mapUnionPreset(unionRaider.union_raider_preset_1),
      preset2: mapUnionPreset(unionRaider.union_raider_preset_2),
      preset3: mapUnionPreset(unionRaider.union_raider_preset_3),
      preset4: mapUnionPreset(unionRaider.union_raider_preset_4),
      preset5: mapUnionPreset(unionRaider.union_raider_preset_5),
    };

    const unionLevel = union.union_level || 0;
    const unionGrade = union.union_grade || "없음";
    const combatPowerVal = mappedStats.combatPower || 10000000;

    return {
      name: basic.character_name,
      level: parseInt(basic.character_level) || 200,
      job: basic.character_class,
      combatPower: combatPowerVal,
      currentExpRate: basic.character_exp_rate ? parseFloat(basic.character_exp_rate) : 0.0,
      avatar: basic.character_image || "/avatars/dark_knight.png",
      stats: {
        str: mappedStats.str,
        dex: mappedStats.dex,
        intel: mappedStats.intel,
        luk: mappedStats.luk,
        starforce: mappedStats.starforce,
        bossDamage: mappedStats.bossDamage,
        arcaneForce: mappedStats.arcaneForce,
        sacredPower: mappedStats.sacredPower,
        attackPower: mappedStats.attackPower,
        magicPower: mappedStats.magicPower,
        damage: mappedStats.damage,
        finalDamage: mappedStats.finalDamage,
        critDamage: mappedStats.critDamage
      },
      equipment: defaultEquip,
      setEffects: defaultSetEffects.length > 0
        ? defaultSetEffects
        : (setEffectPresets[`preset${activeEquipPresetNo}`] || []),
      cashEquipment: defaultCashEquipment,
      petEquipment: pets,
      worldName: basic.world_name,
      expHistory: expRateHistory,
      
      // 프리셋 풀 데이터
      presets: {
        equipment: equipmentPresets,
        setEffects: setEffectPresets,
        cashEquipment: cashEquipmentPresets,
        ability: abilityPresets,
        hyperStat: hyperStatPresets,
        linkSkill: linkSkillPresets,
        union: unionPresets
      },

      // 유니온 등급 정보
      unionInfo: {
        level: unionLevel,
        grade: unionGrade
      },

      // API 조회 시점에 실제로 활성화되어 있던 프리셋 번호 (시뮬레이터용 원본 기준점)
      activePresets: {
        equipment: activeEquipPresetNo,
        cashEquipment: activeCashPresetNo,
        ability: activeAbilityPresetNo,
        hyperStat: activeHyperPresetNo,
        linkSkill: activeLinkPresetNo,
        union: activeUnionPresetNo
      },

      // 기본적으로 활성화되어 있는 현재 프리셋 번호
      selectedPresets: {
        equipment: activeEquipPresetNo,
        cashEquipment: activeCashPresetNo,
        ability: activeAbilityPresetNo,
        hyperStat: activeHyperPresetNo,
        linkSkill: activeLinkPresetNo,
        union: activeUnionPresetNo
      }
    };
  } catch (error) {
    throw new Error(error.message || "Nexon OpenAPI 데이터를 불러오지 못했습니다.", { cause: error });
  }
}
