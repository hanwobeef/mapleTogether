/**
 * 프리셋 정보를 기반으로 캐릭터의 전투력 및 스탯을 보정(시뮬레이션)합니다.
 * 1번 방식 (차이값 계산: Delta Calculation) 적용
 */

// 1. 장비 잠재옵션 파싱 헬퍼
function parsePotential(potentialStr, statsDelta) {
  if (!potentialStr) return;
  const clean = potentialStr.replace(/\s+/g, '').normalize('NFC');
  
  // % 옵션 매칭 (예: "STR:+9%", "올스탯:+6%")
  const percentMatch = clean.match(/^([A-Za-z가-힣0-9%]+):?\+(\d+)%/);
  if (percentMatch) {
    const type = percentMatch[1];
    const val = parseInt(percentMatch[2]) || 0;
    
    if (type.includes("올스탯") || type.includes("올스텟")) {
      statsDelta.percentSTR += val;
      statsDelta.percentDEX += val;
      statsDelta.percentINT += val;
      statsDelta.percentLUK += val;
    } else if (type.includes("STR") || type.includes("힘")) {
      statsDelta.percentSTR += val;
    } else if (type.includes("DEX") || type.includes("민첩")) {
      statsDelta.percentDEX += val;
    } else if (type.includes("INT") || type.includes("지력")) {
      statsDelta.percentINT += val;
    } else if (type.includes("LUK") || type.includes("운")) {
      statsDelta.percentLUK += val;
    } else if (type.includes("공격력")) {
      statsDelta.percentAttackPower += val;
    } else if (type.includes("마력")) {
      statsDelta.percentMagicPower += val;
    } else if (type.includes("보스공격") || type.includes("보공") || type.includes("보스공격시데미지")) {
      statsDelta.percentBossDamage += val;
    } else if (type.includes("데미지") && !type.includes("최종")) {
      statsDelta.percentDamage += val;
    } else if (type.includes("최종데미지")) {
      statsDelta.percentFinalDamage += val;
    } else if (type.includes("크리티컬데미지") || type.includes("크뎀")) {
      statsDelta.percentCritDamage += val;
    }
    return;
  }
  
  // 고정값 옵션 매칭 (예: "STR:+12", "공격력:+10")
  const flatMatch = clean.match(/^([A-Za-z가-힣0-9]+):?\+(\d+)$/);
  if (flatMatch) {
    const type = flatMatch[1];
    const val = parseInt(flatMatch[2]) || 0;
    if (type.includes("STR") || type.includes("힘")) {
      statsDelta.flatSTR += val;
    } else if (type.includes("DEX") || type.includes("민첩")) {
      statsDelta.flatDEX += val;
    } else if (type.includes("INT") || type.includes("지력")) {
      statsDelta.flatINT += val;
    } else if (type.includes("LUK") || type.includes("운")) {
      statsDelta.flatLUK += val;
    } else if (type.includes("공격력")) {
      statsDelta.flatAttackPower += val;
    } else if (type.includes("마력")) {
      statsDelta.flatMagicPower += val;
    }
  }
}

// 2. 어빌리티 파싱 헬퍼
function parseAbility(abilityStr, statsDelta) {
  if (!abilityStr) return;
  const clean = abilityStr.replace(/\s+/g, '').normalize('NFC');
  
  if (clean.includes("보스공격")) {
    const match = clean.match(/(\d+)%/);
    if (match) statsDelta.percentBossDamage += parseInt(match[1]) || 0;
  } else if (clean.includes("상태이상") && clean.includes("데미지")) {
    const match = clean.match(/(\d+)%/);
    if (match) statsDelta.percentDamage += parseInt(match[1]) || 0;
  } else if (clean.includes("데미지") && !clean.includes("최종")) {
    const match = clean.match(/(\d+)%/);
    if (match) statsDelta.percentDamage += parseInt(match[1]) || 0;
  } else if (clean.includes("공격력")) {
    const match = clean.match(/(\d+)(증가)?$/);
    if (match) statsDelta.flatAttackPower += parseInt(match[1]) || 0;
  } else if (clean.includes("마력")) {
    const match = clean.match(/(\d+)(증가)?$/);
    if (match) statsDelta.flatMagicPower += parseInt(match[1]) || 0;
  } else if (clean.includes("STR") || clean.includes("힘")) {
    const match = clean.match(/(\d+)(증가)?$/);
    if (match) statsDelta.flatSTR += parseInt(match[1]) || 0;
  } else if (clean.includes("DEX") || clean.includes("민첩")) {
    const match = clean.match(/(\d+)(증가)?$/);
    if (match) statsDelta.flatDEX += parseInt(match[1]) || 0;
  } else if (clean.includes("INT") || clean.includes("지력")) {
    const match = clean.match(/(\d+)(증가)?$/);
    if (match) statsDelta.flatINT += parseInt(match[1]) || 0;
  } else if (clean.includes("LUK") || clean.includes("운")) {
    const match = clean.match(/(\d+)(증가)?$/);
    if (match) statsDelta.flatLUK += parseInt(match[1]) || 0;
  }
}

// 3. 하이퍼스탯 파싱 헬퍼
function parseHyperStat(statObj, statsDelta) {
  if (!statObj || !statObj.type) return;
  const { type, value } = statObj;
  const val = parseInt(value) || 0;
  
  if (type === "힘" || type === "STR") {
    statsDelta.flatSTR += val;
  } else if (type === "민첩성" || type === "DEX") {
    statsDelta.flatDEX += val;
  } else if (type === "지력" || type === "INT") {
    statsDelta.flatINT += val;
  } else if (type === "운" || type === "LUK") {
    statsDelta.flatLUK += val;
  } else if (type === "공격력/마력" || type === "공격력" || type === "마력") {
    statsDelta.flatAttackPower += val;
    statsDelta.flatMagicPower += val;
  } else if (type === "데미지") {
    statsDelta.percentDamage += val;
  } else if (type === "보스 데미지" || type === "보스데미지") {
    statsDelta.percentBossDamage += val;
  } else if (type === "크리티컬 데미지" || type === "크뎀") {
    statsDelta.percentCritDamage += val;
  }
}

// 4. 링크스킬 파싱 헬퍼
function parseLinkSkill(effectStr, statsDelta) {
  if (!effectStr) return;
  const clean = effectStr.replace(/\s+/g, '').normalize('NFC');
  
  if (clean.includes("보스공격") || clean.includes("보스데미지")) {
    const match = clean.match(/(\d+)%/);
    if (match) statsDelta.percentBossDamage += parseInt(match[1]) || 0;
  } else if (clean.includes("올스탯") || clean.includes("올스텟")) {
    const match = clean.match(/(\d+)%/);
    if (match) {
      const val = parseInt(match[1]) || 0;
      statsDelta.percentSTR += val;
      statsDelta.percentDEX += val;
      statsDelta.percentINT += val;
      statsDelta.percentLUK += val;
    }
  } else if (clean.includes("데미지") && !clean.includes("최종")) {
    const match = clean.match(/(\d+)%/);
    if (match) statsDelta.percentDamage += parseInt(match[1]) || 0;
  } else if (clean.includes("최종데미지")) {
    const match = clean.match(/(\d+)%/);
    if (match) statsDelta.percentFinalDamage += parseInt(match[1]) || 0;
  } else if (clean.includes("크리티컬데미지") || clean.includes("크뎀")) {
    const match = clean.match(/(\d+)%/);
    if (match) statsDelta.percentCritDamage += parseInt(match[1]) || 0;
  } else if (clean.includes("공격력")) {
    const match = clean.match(/(\d+)(증가)?$/);
    if (match) {
      statsDelta.flatAttackPower += parseInt(match[1]) || 0;
    }
  }
}

// 5. 유니온 점령 효과 파싱 헬퍼
function parseUnionRaider(unionStr, statsDelta) {
  if (!unionStr) return;
  const clean = unionStr.replace(/\s+/g, '').normalize('NFC');
  
  if (clean.includes("보스데미지") || clean.includes("보공")) {
    const match = clean.match(/(\d+(\.\d+)?)%/);
    if (match) statsDelta.percentBossDamage += parseFloat(match[1]) || 0;
  } else if (clean.includes("크리티컬데미지") || clean.includes("크뎀")) {
    const match = clean.match(/(\d+(\.\d+)?)%/);
    if (match) statsDelta.percentCritDamage += parseFloat(match[1]) || 0;
  } else if (clean.includes("STR") || clean.includes("힘")) {
    const match = clean.match(/(\d+)/);
    if (match) statsDelta.flatSTR += parseInt(match[1]) || 0;
  } else if (clean.includes("DEX") || clean.includes("민첩")) {
    const match = clean.match(/(\d+)/);
    if (match) statsDelta.flatDEX += parseInt(match[1]) || 0;
  } else if (clean.includes("INT") || clean.includes("지력")) {
    const match = clean.match(/(\d+)/);
    if (match) statsDelta.flatINT += parseInt(match[1]) || 0;
  } else if (clean.includes("LUK") || clean.includes("운")) {
    const match = clean.match(/(\d+)/);
    if (match) statsDelta.flatLUK += parseInt(match[1]) || 0;
  } else if (clean.includes("공격력")) {
    const match = clean.match(/(\d+)/);
    if (match) statsDelta.flatAttackPower += parseInt(match[1]) || 0;
  } else if (clean.includes("마력")) {
    const match = clean.match(/(\d+)/);
    if (match) statsDelta.flatMagicPower += parseInt(match[1]) || 0;
  } else if (clean.includes("데미지") && !clean.includes("최종")) {
    const match = clean.match(/(\d+(\.\d+)?)%/);
    if (match) statsDelta.percentDamage += parseFloat(match[1]) || 0;
  }
}

// 스탯 델타 구조 초기화
const createEmptyDelta = () => ({
  flatSTR: 0, percentSTR: 0,
  flatDEX: 0, percentDEX: 0,
  flatINT: 0, percentINT: 0,
  flatLUK: 0, percentLUK: 0,
  flatAttackPower: 0, percentAttackPower: 0,
  flatMagicPower: 0, percentMagicPower: 0,
  percentDamage: 0,
  percentBossDamage: 0,
  percentFinalDamage: 0,
  percentCritDamage: 0
});

export function getSimulatedSpec(character) {
  if (!character) {
    return {
      combatPower: 0,
      stats: {
        str: 1000, dex: 1000, intel: 1000, luk: 1000,
        starforce: 0, bossDamage: 0, arcaneForce: 0, sacredPower: 0,
        attackPower: 0, magicPower: 0, damage: 0, finalDamage: 0, critDamage: 0
      }
    };
  }

  const { combatPower, stats, presets, activePresets, selectedPresets } = character;
  
  const safeStats = stats || {
    str: 1000, dex: 1000, intel: 1000, luk: 1000,
    starforce: 0, bossDamage: 0, arcaneForce: 0, sacredPower: 0,
    attackPower: 0, magicPower: 0, damage: 0, finalDamage: 0, critDamage: 0
  };

  const oldP = activePresets || { equipment: 1, ability: 1, hyperStat: 1, linkSkill: 1, union: 1 };
  const newP = selectedPresets || { equipment: 1, ability: 1, hyperStat: 1, linkSkill: 1, union: 1 };

  // 프리셋 번호가 구프리셋(Original)과 현프리셋(Selected)이 전부 일치하면 계산하지 않고 고정값 리턴
  const isIdentical = (
    oldP.equipment === newP.equipment &&
    oldP.ability === newP.ability &&
    oldP.hyperStat === newP.hyperStat &&
    oldP.linkSkill === newP.linkSkill &&
    oldP.union === newP.union
  );

  if (isIdentical) {
    return {
      combatPower: combatPower || 0,
      stats: {
        ...safeStats,
        intel: safeStats.intel || safeStats.int || safeStats.intellect || 1000
      }
    };
  }

  // 델타 누적용 객체 생성
  const deltaOld = createEmptyDelta();
  const deltaNew = createEmptyDelta();

  const accumulatePresetStats = (presetNos, deltaObj) => {
    // 1. 장비 스탯 합산
    const equipPreset = presets?.equipment?.[`preset${presetNos.equipment}`] || {};
    // 프리셋이 비어있으면 현재 장착 장비로 폴백
    const activeEquip = Object.keys(equipPreset).length > 0 
      ? equipPreset 
      : (character.equipment || {});

    Object.values(activeEquip).forEach(item => {
      if (!item) return;
      const to = item.totalOption || {};
      deltaObj.flatSTR += parseInt(to.str || to.STR) || 0;
      deltaObj.flatDEX += parseInt(to.dex || to.DEX) || 0;
      deltaObj.flatINT += parseInt(to.int || to.INT || to.intel) || 0;
      deltaObj.flatLUK += parseInt(to.luk || to.LUK) || 0;
      deltaObj.flatAttackPower += parseInt(to.attack_power || to.ATTACK_POWER) || 0;
      deltaObj.flatMagicPower += parseInt(to.magic_power || to.MAGIC_POWER) || 0;
      deltaObj.percentDamage += parseInt(to.damage) || 0;
      deltaObj.percentBossDamage += parseInt(to.boss_damage) || 0;
      
      if (item.potentials) {
        item.potentials.forEach(p => parsePotential(p, deltaObj));
      }
      if (item.addPotentials) {
        item.addPotentials.forEach(p => parsePotential(p, deltaObj));
      }
    });

    // 2. 어빌리티 스탯 합산
    const abilityPreset = presets?.ability?.[`preset${presetNos.ability}`] || [];
    abilityPreset.forEach(ab => parseAbility(ab.value, deltaObj));

    // 3. 하이퍼스탯 합산
    const hyperPreset = presets?.hyperStat?.[`preset${presetNos.hyperStat}`] || [];
    hyperPreset.forEach(hs => parseHyperStat(hs, deltaObj));

    // 4. 링크스킬 합산
    const linkPreset = presets?.linkSkill?.[`preset${presetNos.linkSkill}`] || [];
    linkPreset.forEach(ls => parseLinkSkill(ls.effect, deltaObj));

    // 5. 유니온 합산
    const unionPreset = presets?.union?.[`preset${presetNos.union}`] || [];
    unionPreset.forEach(un => parseUnionRaider(un, deltaObj));
  };

  // 기존 프리셋 스탯 합산 및 새로운 프리셋 스탯 합산
  accumulatePresetStats(oldP, deltaOld);
  accumulatePresetStats(newP, deltaNew);

  // 차이값(Delta) 계산
  const delta = {
    flatSTR: deltaNew.flatSTR - deltaOld.flatSTR,
    percentSTR: deltaNew.percentSTR - deltaOld.percentSTR,
    flatDEX: deltaNew.flatDEX - deltaOld.flatDEX,
    percentDEX: deltaNew.percentDEX - deltaOld.percentDEX,
    flatINT: deltaNew.flatINT - deltaOld.flatINT,
    percentINT: deltaNew.percentINT - deltaOld.percentINT,
    flatLUK: deltaNew.flatLUK - deltaOld.flatLUK,
    percentLUK: deltaNew.percentLUK - deltaOld.percentLUK,
    flatAttackPower: deltaNew.flatAttackPower - deltaOld.flatAttackPower,
    percentAttackPower: deltaNew.percentAttackPower - deltaOld.percentAttackPower,
    flatMagicPower: deltaNew.flatMagicPower - deltaOld.flatMagicPower,
    percentMagicPower: deltaNew.percentMagicPower - deltaOld.percentMagicPower,
    percentDamage: deltaNew.percentDamage - deltaOld.percentDamage,
    percentBossDamage: deltaNew.percentBossDamage - deltaOld.percentBossDamage,
    percentFinalDamage: deltaNew.percentFinalDamage - deltaOld.percentFinalDamage,
    percentCritDamage: deltaNew.percentCritDamage - deltaOld.percentCritDamage
  };

  // 기본 스탯 세팅
  const str = safeStats.str || 1000;
  const dex = safeStats.dex || 1000;
  const intel = safeStats.intel || safeStats.int || safeStats.intellect || 1000;
  const luk = safeStats.luk || 1000;
  const attackPower = safeStats.attackPower || 0;
  const magicPower = safeStats.magicPower || 0;
  const damage = safeStats.damage || 0;
  const bossDamage = safeStats.bossDamage || 0;
  const finalDamage = safeStats.finalDamage || 0;
  const critDamage = safeStats.critDamage || 0;

  // 아케인포스/어센틱포스를 기반으로 주스탯 % 비적용 대상인 심볼 스탯 계산
  const arcaneForce = safeStats.arcaneForce || 0;
  const sacredPower = safeStats.sacredPower || 0;
  const symbolStat = (arcaneForce * 10) + (sacredPower * 50);

  // 직업 기반 주스탯 / 부스탯 타입 정밀 검출
  const job = character.job || "";
  let primaryStatType = "str";
  let secondaryStatType = "dex";
  let isXenon = false;
  let isDaemonAvenger = false;

  const jobLower = job.toLowerCase();
  if (jobLower.includes("제논")) {
    isXenon = true;
  } else if (jobLower.includes("데몬어벤져")) {
    isDaemonAvenger = true;
  } else if (
    jobLower.includes("마법사") || jobLower.includes("아크메이지") || jobLower.includes("비숍") ||
    jobLower.includes("루미너스") || jobLower.includes("플레임위자드") || jobLower.includes("에반") ||
    jobLower.includes("일리움") || jobLower.includes("라라") || jobLower.includes("키네시스") ||
    jobLower.includes("배틀메이지")
  ) {
    primaryStatType = "intel";
    secondaryStatType = "luk";
  } else if (
    jobLower.includes("궁수") || jobLower.includes("보우마스터") || jobLower.includes("신궁") ||
    jobLower.includes("패스파인더") || jobLower.includes("윈드브레이커") || jobLower.includes("메르세데스") ||
    jobLower.includes("와일드헌터")
  ) {
    primaryStatType = "dex";
    secondaryStatType = "str";
  } else if (
    jobLower.includes("도적") || jobLower.includes("나이트로드") || jobLower.includes("섀도어") ||
    jobLower.includes("듀얼블레이드") || jobLower.includes("나이트워커") || jobLower.includes("팬텀") ||
    jobLower.includes("칼리") || jobLower.includes("호영")
  ) {
    primaryStatType = "luk";
    secondaryStatType = "dex";
  } else if (
    jobLower.includes("해적") || jobLower.includes("바이퍼") || jobLower.includes("캡틴") ||
    jobLower.includes("캐논슈터") || jobLower.includes("스트라이커") || jobLower.includes("은월") ||
    jobLower.includes("아크") || jobLower.includes("메카닉") || jobLower.includes("블래스터")
  ) {
    if (jobLower.includes("캡틴") || jobLower.includes("메카닉")) {
      primaryStatType = "dex";
      secondaryStatType = "str";
    } else {
      primaryStatType = "str";
      secondaryStatType = "dex";
    }
  }

  // 주스탯 % 역산 공식 적용
  const getUpdatedStatDynamic = (origVal, deltaFlat, statKey, isPrimary) => {
    const sym = isPrimary ? symbolStat : 0;
    const statSubjectToPercent = Math.max(10, origVal - sym);
    
    const oldPercentField = `percent${statKey.toUpperCase()}`;
    const pOldVal = deltaOld[oldPercentField] || 0;
    const pNewVal = deltaNew[oldPercentField] || 0;
    
    const pOld = 1 + pOldVal / 100;
    const pNew = 1 + pNewVal / 100;
    
    const scaleRatio = pNew / Math.max(0.1, pOld);
    const updated = (statSubjectToPercent * scaleRatio) + (deltaFlat * pNew) + sym;
    return Math.max(10, Math.round(updated));
  };

  const newStr = getUpdatedStatDynamic(str, delta.flatSTR, "str", primaryStatType === "str");
  const newDex = getUpdatedStatDynamic(dex, delta.flatDEX, "dex", primaryStatType === "dex");
  const newInt = getUpdatedStatDynamic(intel, delta.flatINT, "int", primaryStatType === "intel");
  const newLuk = getUpdatedStatDynamic(luk, delta.flatLUK, "luk", primaryStatType === "luk");

  // 공격력 / 마력 역산 공식 적용
  const getUpdatedAtt = (origVal, deltaFlat, isMagic) => {
    const pOldField = isMagic ? "percentMagicPower" : "percentAttackPower";
    const pOldVal = deltaOld[pOldField] || 0;
    const pNewVal = deltaNew[pOldField] || 0;
    
    const pOld = 1 + pOldVal / 100;
    const pNew = 1 + pNewVal / 100;
    
    const scaleRatio = pNew / Math.max(0.1, pOld);
    const updated = (origVal * scaleRatio) + (deltaFlat * pNew);
    return Math.max(0, Math.round(updated));
  };

  const newAttackPower = getUpdatedAtt(attackPower, delta.flatAttackPower, false);
  const newMagicPower = getUpdatedAtt(magicPower, delta.flatMagicPower, true);

  // 일반 스탯 차이 단순 덧셈 보정
  const newDamage = Math.max(0, damage + delta.percentDamage);
  const newBossDamage = Math.max(0, bossDamage + delta.percentBossDamage);
  const newFinalDamage = Math.max(0, finalDamage + delta.percentFinalDamage);
  const newCritDamage = Math.max(0, critDamage + delta.percentCritDamage);

  // 1) 스탯 요인 변화비(fStat) 계산
  const fStat = (() => {
    if (isXenon) {
      const oldSum = str + dex + luk;
      const newSum = newStr + newDex + newLuk;
      return newSum / Math.max(1, oldSum);
    }
    if (isDaemonAvenger) {
      return newStr / Math.max(1, str);
    }

    const origPrimary = primaryStatType === "str" ? str : primaryStatType === "dex" ? dex : primaryStatType === "intel" ? intel : luk;
    const origSecondary = secondaryStatType === "str" ? str : secondaryStatType === "dex" ? dex : secondaryStatType === "intel" ? intel : luk;
    
    const newPrimary = primaryStatType === "str" ? newStr : primaryStatType === "dex" ? newDex : primaryStatType === "intel" ? newInt : newLuk;
    const newSecondary = secondaryStatType === "str" ? newStr : secondaryStatType === "dex" ? newDex : secondaryStatType === "intel" ? newInt : newLuk;
    
    const oldFactor = origPrimary * 4 + origSecondary;
    const newFactor = newPrimary * 4 + newSecondary;
    return newFactor / Math.max(1, oldFactor);
  })();

  // 2) 공격력 / 마력 요인 변화비(fAtt)
  const isMagicJob = (primaryStatType === "intel");
  const oldAttVal = isMagicJob ? magicPower : attackPower;
  const newAttVal = isMagicJob ? newMagicPower : newAttackPower;
  const fAtt = newAttVal / Math.max(1, oldAttVal);

  // 3) 데미지 / 보공 요인 변화비(fDmg)
  const oldDmgFactor = 1 + (damage + bossDamage) / 100;
  const newDmgFactor = 1 + (newDamage + newBossDamage) / 100;
  const fDmg = newDmgFactor / Math.max(0.1, oldDmgFactor);

  // 4) 최종데미지 요인 변화비(fFinal)
  const oldFinalFactor = 1 + finalDamage / 100;
  const newFinalFactor = 1 + newFinalDamage / 100;
  const fFinal = newFinalFactor / Math.max(0.1, oldFinalFactor);

  // 5) 크리티컬 데미지 요인 변화비(fCrit)
  const oldCritFactor = 1 + critDamage / 100;
  const newCritFactor = 1 + newCritDamage / 100;
  const fCrit = newCritFactor / Math.max(0.1, oldCritFactor);

  // 최종 예상 전투력 연산
  const origCombatPower = combatPower || 0;
  const simulatedCombatPower = Math.round(origCombatPower * fStat * fAtt * fDmg * fFinal * fCrit);

  return {
    combatPower: simulatedCombatPower,
    stats: {
      str: newStr,
      dex: newDex,
      intel: newInt,
      luk: newLuk,
      starforce: safeStats.starforce || 0,
      bossDamage: newBossDamage,
      arcaneForce: safeStats.arcaneForce || 0,
      sacredPower: safeStats.sacredPower || 0,
      attackPower: newAttackPower,
      magicPower: newMagicPower,
      damage: newDamage,
      finalDamage: newFinalDamage,
      critDamage: newCritDamage
    }
  };
}
