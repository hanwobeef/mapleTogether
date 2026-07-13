import { useState } from 'react';
import { X, Sword, Shield, Layers, Zap, Users, SlidersHorizontal, RefreshCw } from 'lucide-react';
import { getSimulatedSpec } from '../utils/specSimulator';
import './DetailModal.css';

const SLOT_LAYOUT = [
  { key: 'ring1', name: '반지1', label: 'RING 1', col: 1, row: 1 },
  { key: 'ring2', name: '반지2', label: 'RING 2', col: 1, row: 2 },
  { key: 'ring3', name: '반지3', label: 'RING 3', col: 1, row: 3 },
  { key: 'ring4', name: '반지4', label: 'RING 4', col: 1, row: 4 },
  { key: 'pocket', name: '포켓', label: 'POCKET', col: 1, row: 5 },
  { key: 'belt', name: '벨트', label: 'BELT', col: 1, row: 6 },

  { key: 'pendant1', name: '펜던트1', label: 'PENDANT 1', col: 2, row: 1 },
  { key: 'pendant2', name: '펜던트2', label: 'PENDANT 2', col: 2, row: 2 },
  { key: 'faceAcc', name: '얼굴장식', label: 'FACE', col: 2, row: 3 },
  { key: 'eyeAcc', name: '눈장식', label: 'EYE', col: 2, row: 4 },
  { key: 'earring', name: '귀고리', label: 'EAR', col: 2, row: 5 },
  { key: 'badge', name: '뱃지', label: 'BADGE', col: 2, row: 6 },

  { key: 'emblem', name: '엠블렘', label: 'EMBLEM', col: 3, row: 5 },
  { key: 'medal', name: '훈장', label: 'MEDAL', col: 3, row: 6 },

  { key: 'hat', name: '모자', label: 'HAT', col: 4, row: 1 },
  { key: 'top', name: '상의', label: 'TOP', col: 4, row: 2 },
  { key: 'bottom', name: '하의', label: 'BOTTOM', col: 4, row: 3 },
  { key: 'shoes', name: '신발', label: 'SHOES', col: 4, row: 4 },
  { key: 'weapon', name: '무기', label: 'WEAPON', col: 4, row: 5 },
  { key: 'android', name: '안드로이드', label: 'ANDROID', col: 4, row: 6 },

  { key: 'cape', name: '망토', label: 'CAPE', col: 5, row: 1 },
  { key: 'gloves', name: '장갑', label: 'GLOVES', col: 5, row: 2 },
  { key: 'shoulder', name: '어깨장식', label: 'SHOULDER', col: 5, row: 3 },
  { key: 'subWeapon', name: '보조무기', label: 'SUB WP', col: 5, row: 4 },
  { key: 'heart', name: '기계심장', label: 'HEART', col: 5, row: 5 },
  { key: 'stone', name: '코어/기타', label: 'ETC', col: 5, row: 6 }
];

const getItemGradeClass = (item) => {
  if (!item) return 'empty';
  let gradeText = '';
  if (typeof item === 'object') {
    gradeText = item.grade || '';
  } else if (typeof item === 'string') {
    gradeText = item;
  }
  
  if (!gradeText) return 'grade-normal';
  
  const clean = gradeText.toString().trim().toLowerCase().normalize('NFC');
  if (clean.includes('레전') || clean.includes('legend')) return 'grade-legendary';
  if (clean.includes('유니') || clean.includes('uniq')) return 'grade-unique';
  if (clean.includes('에픽') || clean.includes('epic')) return 'grade-epic';
  if (clean.includes('레어') || clean.includes('rare')) return 'grade-rare';
  return 'grade-normal';
};

const getCleanItemName = (item) => {
  if (!item) return '';
  if (typeof item === 'object') return item.name;
  return item
    .replace(/\s*\(★\d+\)/g, '')
    .replace(/\s*\(레전더리\)/g, '')
    .replace(/\s*\(유니크\)/g, '')
    .replace(/\s*\(에픽\)/g, '')
    .replace(/\s*\(레어\)/g, '')
    .trim();
};

const getShortItemName = (item) => {
  const clean = getCleanItemName(item);
  if (!clean) return '';
  const parts = clean.split(' ');
  if (parts.length > 1) {
    const prefix = parts[0].substring(0, 4);
    const suffix = parts[parts.length - 1].substring(0, 3);
    return `${prefix}\n${suffix}`;
  }
  return clean.substring(0, 4);
};

const getItemStarforce = (item) => {
  if (!item) return null;
  if (typeof item === 'object') return item.starforce;
  const match = item.match(/\(★(\d+)\)/);
  return match ? match[1] : null;
};

const getTooltipGradeClass = (gradeText) => {
  if (!gradeText || typeof gradeText !== 'string') return 'normal';
  const clean = gradeText.trim().toLowerCase().normalize('NFC');
  if (clean.includes('레전') || clean.includes('legend')) return 'legendary';
  if (clean.includes('유니') || clean.includes('uniq')) return 'unique';
  if (clean.includes('에픽') || clean.includes('epic')) return 'epic';
  if (clean.includes('레어') || clean.includes('rare')) return 'rare';
  return 'normal';
};

const getTooltipPosition = ({ x, y }) => {
  const tooltipWidth = 330;
  const margin = 12;
  const cursorGap = 18;
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  const left = Math.min(
    Math.max(margin, x + cursorGap),
    viewportWidth - tooltipWidth - margin
  );
  const top = y > viewportHeight * 0.52
    ? margin
    : Math.min(y + cursorGap, viewportHeight * 0.18);

  return { left, top };
};

export default function DetailModal({ character, onClose, onUpdatePresets, onRefresh }) {
  const { id, name, level, job, avatar, worldName, presets, unionInfo, selectedPresets, activePresets } = character;
  const [isPresetModalOpen, setIsPresetModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hoveredItem, setHoveredItem] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const handleRefreshClick = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      await onRefresh(id, name);
    } catch (err) {
      console.error("캐릭터 상세 정보 갱신 실패:", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat().format(num);
  };

  const handleOverlayClick = (e) => {
    if (e.target.className === 'modal-overlay') {
      onClose();
    }
  };

  // 기존 캐릭터와의 하위 호환성을 위한 안전망 설정
  const safePresets = presets || {
    equipment: { preset1: {}, preset2: {}, preset3: {} },
    ability: { preset1: [], preset2: [], preset3: [] },
    hyperStat: { preset1: [], preset2: [], preset3: [] },
    linkSkill: { preset1: [], preset2: [], preset3: [] },
    union: { preset1: [], preset2: [], preset3: [], preset4: [], preset5: [] }
  };

  const safeSelectedPresets = selectedPresets || {
    equipment: 1,
    ability: 1,
    hyperStat: 1,
    linkSkill: 1,
    union: 1
  };
  const safeActivePresets = activePresets || safeSelectedPresets;
  const isSimulatedPreset = (
    safeActivePresets.equipment !== safeSelectedPresets.equipment ||
    safeActivePresets.ability !== safeSelectedPresets.ability ||
    safeActivePresets.hyperStat !== safeSelectedPresets.hyperStat ||
    safeActivePresets.linkSkill !== safeSelectedPresets.linkSkill ||
    safeActivePresets.union !== safeSelectedPresets.union
  );

  const safeUnionInfo = unionInfo || { level: 0, grade: '없음' };

  // 선택된 프리셋 번호 기준의 실제 렌더링 데이터 추출
  let currentEquip = (safePresets.equipment && safePresets.equipment[`preset${safeSelectedPresets.equipment}`]) || {};
  // 선택된 프리셋이 완전히 비어있을 경우, 현재 장착 중인 기본 장비(character.equipment)를 폴백으로 사용
  if (Object.keys(currentEquip).length === 0 && character.equipment && Object.keys(character.equipment).length > 0) {
    currentEquip = character.equipment;
  }
  const currentAbility = (safePresets.ability && safePresets.ability[`preset${safeSelectedPresets.ability}`]) || [];
  const currentHyperStat = (safePresets.hyperStat && safePresets.hyperStat[`preset${safeSelectedPresets.hyperStat}`]) || [];
  const currentLinkSkill = (safePresets.linkSkill && safePresets.linkSkill[`preset${safeSelectedPresets.linkSkill}`]) || [];
  const currentUnion = (safePresets.union && safePresets.union[`preset${safeSelectedPresets.union}`]) || [];

  // 프리셋에 따른 스펙/전투력 시뮬레이션 계산
  const { combatPower: currentCombatPower, stats: currentStats } = getSimulatedSpec(character);

  const renderStatRow = (item, key, label, suffix = '') => {
    const getVal = (optionObj, k) => {
      if (!optionObj) return 0;
      return parseInt(optionObj[k] || (k === 'int' ? optionObj['intel'] : 0)) || 0;
    };

    const total = getVal(item.totalOption, key);
    if (total === 0) return null;
    
    const base = getVal(item.baseOption, key);
    const add = getVal(item.addOption, key);
    const etc = getVal(item.etcOption, key);
    const star = getVal(item.starforceOption, key);
    
    const hasBreakdown = (add > 0 || etc > 0 || star > 0);
    
    return (
      <div key={key} className="tooltip-stat-row">
        <span className="tooltip-stat-label">{label}: </span>
        <span className="tooltip-stat-val">
          +{total}{suffix}
          {hasBreakdown && (
            <span className="tooltip-stat-breakdown">
              {" "}({base} + <span className="text-add">+{add}</span> + <span className="text-etc">+{etc}</span> + <span className="text-star">+{star}</span>)
            </span>
          )}
        </span>
      </div>
    );
  };

  const getGradeClass = (gradeText) => {
    if (!gradeText || typeof gradeText !== 'string') return 'normal';
    const clean = gradeText.trim().toLowerCase().normalize('NFC');
    if (clean.includes('레전') || clean.includes('legend')) return 'legendary';
    if (clean.includes('유니') || clean.includes('uniq')) return 'unique';
    if (clean.includes('에픽') || clean.includes('epic')) return 'epic';
    if (clean.includes('레어') || clean.includes('rare')) return 'rare';
    return 'normal';
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content detail-preset-mode">
        {/* Close Button */}
        <button className="modal-close-btn" onClick={onClose} title="닫기">
          <X size={20} />
        </button>

        {/* Modal Header */}
        <div className="detail-modal-header">
          <div className="detail-header-avatar">
            <img src={avatar} alt={name} />
          </div>
          <div className="detail-header-info">
            <div className="detail-name-row">
              <span className="detail-lvl">Lv.{level}</span>
              <h2>{name}</h2>
              {worldName && <span className="detail-world">({worldName})</span>}
              <span className="detail-job-badge">{job}</span>
            </div>
            <div className="detail-power-row">
              <Sword size={14} className="icon-gold" />
              <span>{isSimulatedPreset ? '예상 전투력' : '전투력'}: <strong className="text-gold">{formatNumber(currentCombatPower)}</strong></span>
            </div>
          </div>
          {/* 우측 상단 액션 버튼 그룹 */}
          <div className="detail-header-actions">
            <button 
              className={`btn btn-secondary btn-detail-refresh ${isRefreshing ? 'refreshing' : ''}`} 
              onClick={handleRefreshClick}
              disabled={isRefreshing}
              title="캐릭터 실시간 데이터 새로고침"
            >
              <RefreshCw size={14} className={isRefreshing ? 'spin' : ''} />
              <span>{isRefreshing ? '갱신 중...' : '정보 갱신'}</span>
            </button>
            <button className="btn btn-secondary btn-preset-toggle" onClick={() => setIsPresetModalOpen(true)}>
              <SlidersHorizontal size={14} />
              프리셋 설정
            </button>
          </div>
        </div>

        {/* 1. 프리셋 설정 서브 모달 */}
        {isPresetModalOpen && (
          <div className="preset-sub-modal-overlay" onClick={(e) => { if (e.target.className === 'preset-sub-modal-overlay') setIsPresetModalOpen(false); }}>
            <div className="preset-sub-modal">
              <div className="sub-modal-header">
                <h3>프리셋 설정</h3>
                <button className="sub-modal-close" onClick={() => setIsPresetModalOpen(false)}>
                  <X size={16} />
                </button>
              </div>
              <div className="sub-modal-body">
                {/* 장비 프리셋 */}
                <div className="preset-radio-group">
                  <span className="group-label">장비 프리셋</span>
                  <div className="radio-options">
                    {[1, 2, 3].map(num => (
                      <label key={num} className={`radio-label ${safeSelectedPresets.equipment === num ? 'active' : ''}`}>
                        <input 
                          type="radio" 
                          name="equipment" 
                          value={num} 
                          checked={safeSelectedPresets.equipment === num}
                          onChange={() => onUpdatePresets(id, 'equipment', num)}
                        />
                        <span>{num}번</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* 링크 스킬 프리셋 */}
                <div className="preset-radio-group mt-3">
                  <span className="group-label">링크 스킬</span>
                  <div className="radio-options">
                    {[1, 2, 3].map(num => (
                      <label key={num} className={`radio-label ${safeSelectedPresets.linkSkill === num ? 'active' : ''}`}>
                        <input 
                          type="radio" 
                          name="linkSkill" 
                          value={num} 
                          checked={safeSelectedPresets.linkSkill === num}
                          onChange={() => onUpdatePresets(id, 'linkSkill', num)}
                        />
                        <span>{num}번</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* 어빌리티 프리셋 */}
                <div className="preset-radio-group mt-3">
                  <span className="group-label">어빌리티</span>
                  <div className="radio-options">
                    {[1, 2, 3].map(num => (
                      <label key={num} className={`radio-label ${safeSelectedPresets.ability === num ? 'active' : ''}`}>
                        <input 
                          type="radio" 
                          name="ability" 
                          value={num} 
                          checked={safeSelectedPresets.ability === num}
                          onChange={() => onUpdatePresets(id, 'ability', num)}
                        />
                        <span>{num}번</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* 하이퍼스탯 프리셋 */}
                <div className="preset-radio-group mt-3">
                  <span className="group-label">하이퍼스탯</span>
                  <div className="radio-options">
                    {[1, 2, 3].map(num => (
                      <label key={num} className={`radio-label ${safeSelectedPresets.hyperStat === num ? 'active' : ''}`}>
                        <input 
                          type="radio" 
                          name="hyperStat" 
                          value={num} 
                          checked={safeSelectedPresets.hyperStat === num}
                          onChange={() => onUpdatePresets(id, 'hyperStat', num)}
                        />
                        <span>{num}번</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* 유니온 프리셋 (5개) */}
                <div className="preset-radio-group mt-3">
                  <span className="group-label">유니온 레이더</span>
                  <div className="radio-options">
                    {[1, 2, 3, 4, 5].map(num => (
                      <label key={num} className={`radio-label ${safeSelectedPresets.union === num ? 'active' : ''}`}>
                        <input 
                          type="radio" 
                          name="union" 
                          value={num} 
                          checked={safeSelectedPresets.union === num}
                          onChange={() => onUpdatePresets(id, 'union', num)}
                        />
                        <span>{num}번</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <button className="btn-preset-confirm" onClick={() => setIsPresetModalOpen(false)}>
                설정 완료
              </button>
            </div>
          </div>
        )}

        {/* 2. 상세 정보 영역 (상하 레이아웃) */}
        <div className="detail-main-layout">
          {/* 상단 단독 영역: 장착 정보 */}
          <div className="detail-top-section">
            <div className="info-card-section">
              <div className="section-title-row">
                <Layers size={16} className="icon-cyan" />
                <span>장착 정보 (프리셋 {safeSelectedPresets.equipment})</span>
              </div>
              
              <div className="equip-inventory-wrapper">
                <div className="inventory-header">
                  <div className="inventory-tab active">장비</div>
                  <div className="inventory-tab disabled">코디</div>
                  <div className="inventory-tab disabled">펫</div>
                </div>
                <div className="equip-inventory-grid">
                  {/* 중앙 캐릭터 아바타 배치 영역 */}
                  <div className="equip-avatar-area" style={{ gridColumn: 3, gridRow: '1 / span 4' }}>
                    <div className="avatar-aura"></div>
                    <img src={avatar} alt={name} className="equip-avatar-img" />
                  </div>

                  {/* 장비 슬롯 렌더링 */}
                  {SLOT_LAYOUT.map((slot) => {
                    const itemText = currentEquip[slot.key];
                    const gradeClass = getItemGradeClass(itemText);
                    const cleanName = getCleanItemName(itemText);
                    const shortName = getShortItemName(itemText);
                    const starforce = getItemStarforce(itemText);

                    return (
                      <div 
                        key={slot.key}
                        className={`equip-slot ${gradeClass}`}
                        style={{ gridColumn: slot.col, gridRow: slot.row }}
                        onMouseEnter={(e) => {
                          if (itemText) {
                            setHoveredItem({ item: itemText, slotName: slot.name });
                            setMousePos({ x: e.clientX, y: e.clientY });
                          }
                        }}
                        onMouseMove={(e) => {
                          if (itemText) {
                            setMousePos({ x: e.clientX, y: e.clientY });
                          }
                        }}
                        onMouseLeave={() => setHoveredItem(null)}
                      >
                        {itemText ? (
                          <div className="equip-slot-inner populated">
                            {/* 진짜 장비 이미지 아이콘 렌더링 (없을 때만 한글 약칭 노출) */}
                            {typeof itemText === 'object' && itemText.icon ? (
                              <img src={itemText.icon} alt={cleanName} className="slot-item-icon" />
                            ) : (
                              <span className="slot-item-name">{shortName}</span>
                            )}
                            {starforce && <span className="slot-starforce">★{starforce}</span>}
                          </div>
                        ) : (
                          <div className="equip-slot-inner empty">
                            <span className="slot-placeholder">{slot.label}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* 하단 영역: 상세 사양 2단 레이아웃 */}
          <div className="detail-bottom-section">
            {/* 하단 좌측: 스펙, 어빌리티, 하이퍼스탯 */}
            <div className="detail-bottom-left">
              {/* 기본 스펙 정보 */}
              <div className="info-card-section">
                <div className="section-title-row">
                  <Shield size={16} className="icon-cyan" />
                  <span>기본 스펙 정보</span>
                </div>
                <div className="stats-grid compact">
                  <div className="stat-box compact">
                    <span className="stat-name">STR</span>
                    <span className="stat-num">{formatNumber(currentStats.str)}</span>
                  </div>
                  <div className="stat-box compact">
                    <span className="stat-name">DEX</span>
                    <span className="stat-num">{formatNumber(currentStats.dex)}</span>
                  </div>
                  <div className="stat-box compact">
                    <span className="stat-name">INT</span>
                    <span className="stat-num">{formatNumber(currentStats.intel)}</span>
                  </div>
                  <div className="stat-box compact">
                    <span className="stat-name">LUK</span>
                    <span className="stat-num">{formatNumber(currentStats.luk)}</span>
                  </div>
                  <div className="stat-box compact highlight">
                    <span className="stat-name">스타포스</span>
                    <span className="stat-num">{currentStats.starforce}★</span>
                  </div>
                  <div className="stat-box compact highlight">
                    <span className="stat-name">보스 데미지</span>
                    <span className="stat-num">{currentStats.bossDamage}%</span>
                  </div>
                  <div className="stat-box compact highlight">
                    <span className="stat-name">아케인포스</span>
                    <span className="stat-num">{currentStats.arcaneForce}</span>
                  </div>
                  <div className="stat-box compact highlight">
                    <span className="stat-name">어센틱포스</span>
                    <span className="stat-num">{currentStats.sacredPower}</span>
                  </div>
                </div>
              </div>

              {/* 어빌리티 */}
              <div className="info-card-section mt-4">
                <div className="section-title-row">
                  <Zap size={16} className="icon-cyan" />
                  <span>어빌리티 (프리셋 {safeSelectedPresets.ability})</span>
                </div>
                {currentAbility.length > 0 ? (
                  <div className="ability-display-list">
                    {currentAbility.map((ability, idx) => {
                      const gradeClass = getGradeClass(ability.grade);
                      return (
                        <div key={idx} className={`ability-row grade-${gradeClass}`}>
                          <span className="ability-grade-badge">{ability.grade || '일반'}</span>
                          <span className="ability-value-text">{ability.value}</span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="no-preset-data">활성화된 어빌리티가 없습니다.</div>
                )}
              </div>

              {/* 하이퍼스탯 */}
              <div className="info-card-section mt-4">
                <div className="section-title-row">
                  <Layers size={16} className="icon-cyan" />
                  <span>하이퍼스탯 (프리셋 {safeSelectedPresets.hyperStat})</span>
                </div>
                {currentHyperStat.length > 0 ? (
                  <div className="hyper-display-grid">
                    {currentHyperStat.map((stat, idx) => (
                      <div key={idx} className="hyper-stat-box">
                        <span className="hyper-type">{stat.type}</span>
                        <span className="hyper-lvl">Lv.{stat.level}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="no-preset-data">투자된 하이퍼스탯이 없습니다.</div>
                )}
              </div>
            </div>

            {/* 하단 우측: 링크스킬, 유니온 */}
            <div className="detail-bottom-right">
              {/* 링크 스킬 */}
              <div className="info-card-section">
                <div className="section-title-row">
                  <Zap size={16} className="icon-cyan" />
                  <span>링크 스킬 (프리셋 {safeSelectedPresets.linkSkill})</span>
                </div>
                {currentLinkSkill.length > 0 ? (
                  <div className="link-display-grid">
                    {currentLinkSkill.map((skill, idx) => (
                      <div key={idx} className="link-skill-item" title={skill.effect}>
                        {skill.icon ? (
                          <img src={skill.icon} alt={skill.name} className="link-skill-icon" />
                        ) : (
                          <div className="link-skill-placeholder" />
                        )}
                        <div className="link-skill-info">
                          <span className="link-skill-name">{skill.name}</span>
                          <span className="link-skill-lvl">Lv.{skill.level}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="no-preset-data">장착된 링크 스킬이 없습니다.</div>
                )}
              </div>

              {/* 유니온 레이더 */}
              <div className="info-card-section mt-4">
                <div className="section-title-row">
                  <Users size={16} className="icon-cyan" />
                  <span>유니온 (프리셋 {safeSelectedPresets.union})</span>
                </div>
                <div className="union-header-summary">
                  <div className="union-sum-item">
                    <span className="sum-label">유니온 레벨</span>
                    <span className="sum-val">{safeUnionInfo.level}</span>
                  </div>
                  <div className="union-sum-item">
                    <span className="sum-label">유니온 등급</span>
                    <span className="sum-val">{safeUnionInfo.grade}</span>
                  </div>
                </div>
                {currentUnion.length > 0 ? (
                  <div className="union-effect-list">
                    {currentUnion.map((effect, idx) => (
                      <div key={idx} className="union-effect-row">
                        <span className="effect-text">{effect}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="no-preset-data">활성화된 유니온 공격대 효과가 없습니다.</div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* MapleStory Style Equipment Tooltip */}
        {hoveredItem && (
          (() => {
            const tooltipPosition = getTooltipPosition(mousePos);
            const potentialGrade = getTooltipGradeClass(hoveredItem.item.grade);
            const addPotentialGrade = getTooltipGradeClass(hoveredItem.item.addPotentialGrade);
            return (
          <div 
            className={`equip-tooltip-box grade-${potentialGrade}`}
            style={{
              position: 'fixed',
              left: `${tooltipPosition.left}px`,
              top: `${tooltipPosition.top}px`,
              zIndex: 9999,
              pointerEvents: 'none'
            }}
          >
            {/* Tooltip Header: Stars */}
            {hoveredItem.item.starforce && (
              <div className="tooltip-stars">
                {Array.from({ length: Math.ceil(Math.min(hoveredItem.item.starforce, 25) / 15) }).map((_, rowIndex) => (
                  <span key={rowIndex} className="tooltip-star-row">
                    {Array.from({
                      length: Math.ceil(Math.min(15, Math.min(hoveredItem.item.starforce, 25) - rowIndex * 15) / 5)
                    }).map((__, groupIndex) => {
                      const remainingStars = Math.min(hoveredItem.item.starforce, 25) - rowIndex * 15 - groupIndex * 5;
                      return (
                        <span key={groupIndex} className="tooltip-star-group">
                          {Array.from({ length: Math.min(5, remainingStars) }).map((___, starIndex) => (
                            <span key={starIndex} className="tooltip-star">★</span>
                          ))}
                        </span>
                      );
                    })}
                  </span>
                ))}
              </div>
            )}
            
            {/* Tooltip Header: Name & Grade */}
            <div className="tooltip-item-name-row">
              <h4 className="tooltip-item-name">{getCleanItemName(hoveredItem.item)}</h4>
              {hoveredItem.item.grade && (
                <span className="tooltip-grade-badge">({hoveredItem.item.grade} 아이템)</span>
              )}
            </div>
            
            <div className="tooltip-divider" />
            
            {/* Tooltip Body: Icon & 분류 */}
            <div className="tooltip-body-main">
              <div className="tooltip-item-icon-wrapper">
                {typeof hoveredItem.item === 'object' && hoveredItem.item.icon ? (
                  <img src={hoveredItem.item.icon} alt={hoveredItem.item.name} className="tooltip-item-icon" />
                ) : (
                  <div className="tooltip-icon-placeholder" />
                )}
              </div>
              <div className="tooltip-item-meta">
                <div><span className="meta-label">장비분류 :</span> {hoveredItem.slotName}</div>
                <div><span className="meta-label">교환설정 :</span> 교환 불가</div>
                {hoveredItem.item.scrollUpgrade && (
                  <div><span className="meta-label">업그레이드 횟수 :</span> {hoveredItem.item.scrollUpgrade}</div>
                )}
              </div>
            </div>
            
            {/* Stats list */}
            {typeof hoveredItem.item === 'object' && hoveredItem.item.totalOption && Object.keys(hoveredItem.item.totalOption).length > 0 && (
              <>
                <div className="tooltip-divider" />
                <div className="tooltip-stats-list">
                  {renderStatRow(hoveredItem.item, 'str', 'STR')}
                  {renderStatRow(hoveredItem.item, 'dex', 'DEX')}
                  {renderStatRow(hoveredItem.item, 'int', 'INT')}
                  {renderStatRow(hoveredItem.item, 'intel', 'INT')}
                  {renderStatRow(hoveredItem.item, 'luk', 'LUK')}
                  {renderStatRow(hoveredItem.item, 'max_hp', '최대 HP')}
                  {renderStatRow(hoveredItem.item, 'attack_power', '공격력')}
                  {renderStatRow(hoveredItem.item, 'magic_power', '마력')}
                  {renderStatRow(hoveredItem.item, 'boss_damage', '보스 데미지', '%')}
                  {renderStatRow(hoveredItem.item, 'ignore_monster_armor', '몬스터 방어율 무시', '%')}
                  {renderStatRow(hoveredItem.item, 'all_stat', '올스탯', '%')}
                </div>
              </>
            )}
            
            {/* Potentials */}
            {typeof hoveredItem.item === 'object' && hoveredItem.item.potentials && hoveredItem.item.potentials.length > 0 && (
              <>
                <div className="tooltip-divider" />
                <div className={`tooltip-potentials-section potential-grade-${potentialGrade}`}>
                  <div className="potentials-title">■ 잠재능력</div>
                  {hoveredItem.item.potentials.map((line, idx) => (
                    <div key={idx} className="potential-line">{line}</div>
                  ))}
                </div>
              </>
            )}

            {/* Additional Potentials */}
            {typeof hoveredItem.item === 'object' && hoveredItem.item.addPotentials && hoveredItem.item.addPotentials.length > 0 && (
              <>
                <div className="tooltip-divider" />
                <div className={`tooltip-potentials-section additional potential-grade-${addPotentialGrade}`}>
                  <div className="potentials-title">■ 에디셔널 잠재능력</div>
                  {hoveredItem.item.addPotentials.map((line, idx) => (
                    <div key={idx} className="potential-line">{line}</div>
                  ))}
                </div>
              </>
            )}

            {/* String Fallback for old characters */}
            {typeof hoveredItem.item === 'string' && (
              <>
                <div className="tooltip-divider" />
                <div className="tooltip-fallback-info">
                  <p>기존 캐시 데이터 형식의 아이템입니다.</p>
                  <p className="fallback-note">상세 정보를 보시려면 캐릭터 정보를 한번 [정보 갱신] 해주세요.</p>
                </div>
              </>
            )}
          </div>
            );
          })()
        )}
      </div>
    </div>
  );
}
