import { useState } from 'react';
import { Compass, Edit, Trash2, RefreshCw, GripVertical } from 'lucide-react';
import { getSimulatedSpec } from '../utils/specSimulator';
import { getTagTone } from '../utils/tagOptions';
import { formatCombatPower } from '../utils/formatters';
import './CharacterCard.css';

export default function CharacterCard({ 
  character, 
  index,
  onDetailClick, 
  onEditClick, 
  onDeleteClick,
  onRefresh,
  onDragStart,
  onDragOver,
  onDragEnd,
  isDragging,
  isPartyCandidate = false,
  onTogglePartyCandidate
}) {
  const { id, name, level, job, avatar, worldName, currentExpRate, expHistory, owner, tags = [] } = character;
  const { combatPower: currentCombatPower } = getSimulatedSpec(character);
  const [isCardRefreshing, setIsCardRefreshing] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState(null);

  // Handle individual card refresh
  const handleCardRefresh = async (e) => {
    e.stopPropagation();
    if (isCardRefreshing) return;
    setIsCardRefreshing(true);
    try {
      await onRefresh(id, name);
    } catch (err) {
      console.error("캐릭터 갱신 실패:", err);
    } finally {
      setIsCardRefreshing(false);
    }
  };

  // Render Sparkline Graph for 7-day EXP trend with hover tooltip
  const renderSparkline = () => {
    if (!expHistory || expHistory.length < 2) {
      return <div className="sparkline-no-data">추이 없음</div>;
    }
    
    const values = expHistory.map(h => h.expRate);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min === 0 ? 1 : max - min;
    
    const width = 240; // Fixed inner viewBox width
    const height = 40; // Graph height
    
    // Map 7 points to SVG coords
    const points = expHistory.map((h, i) => {
      const x = (i / (expHistory.length - 1)) * width;
      // y goes from top(0) to bottom(height), so we subtract from height
      const y = height - 4 - ((h.expRate - min) / range) * (height - 8);
      return { x, y, ...h };
    });
    
    const pathData = `M ${points.map(p => `${p.x},${p.y}`).join(' L ')}`;
    const fillPathData = `${pathData} L ${width},${height} L 0,${height} Z`;
    
    return (
      <div className="sparkline-section">
        {/* Graph Dates Axis Label */}
        <div className="sparkline-axis-dates">
          <span>{expHistory[0].date}</span>
          <span className="trend-title-text">7일 경험치 추이</span>
          <span>{expHistory[expHistory.length - 1].date}</span>
        </div>

        <div className="sparkline-chart-container" style={{ position: 'relative' }}>
          <svg 
            width="100%" 
            height={height} 
            viewBox={`0 0 ${width} ${height}`} 
            preserveAspectRatio="none" 
            className="sparkline-svg"
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <defs>
              <linearGradient id={`spark-grad-${character.id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--brand-cyan)" stopOpacity="0.25" />
                <stop offset="100%" stopColor="var(--brand-cyan)" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path
              d={fillPathData}
              fill={`url(#spark-grad-${character.id})`}
            />
            <path
              d={pathData}
              fill="none"
              stroke="var(--brand-cyan)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            
            {/* Hover Guide Line */}
            {hoveredIndex !== null && points[hoveredIndex] && (
              <line 
                x1={points[hoveredIndex].x} 
                y1={0} 
                x2={points[hoveredIndex].x} 
                y2={height} 
                stroke="rgba(34, 211, 238, 0.4)" 
                strokeWidth="1.5" 
                strokeDasharray="2,2" 
              />
            )}

            {/* Interaction Circles */}
            {points.map((p, i) => (
              <circle
                key={i}
                cx={p.x}
                cy={p.y}
                r={hoveredIndex === i ? 5 : 2.5}
                fill={hoveredIndex === i ? "#ffffff" : "var(--brand-cyan)"}
                stroke="var(--brand-cyan)"
                strokeWidth={hoveredIndex === i ? 2.5 : 1}
                style={{ cursor: 'pointer', transition: 'r 0.1s ease, fill 0.1s ease' }}
                onMouseEnter={() => setHoveredIndex(i)}
              />
            ))}
          </svg>

          {/* Interactive Hover HTML Tooltip */}
          {hoveredIndex !== null && points[hoveredIndex] && (
            <div 
              className="sparkline-tooltip"
              style={{
                left: `${(hoveredIndex / (expHistory.length - 1)) * 100}%`,
                transform: 'translateX(-50%) translateY(-100%)',
                top: '-8px'
              }}
            >
              <div className="tooltip-date">{points[hoveredIndex].date}</div>
              <div className="tooltip-values">
                <span className="tooltip-lvl">Lv.{points[hoveredIndex].level}</span>
                <span className="tooltip-exp">{points[hoveredIndex].expRate.toFixed(3)}%</span>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div 
      className={`character-card ${isCardRefreshing ? 'card-loading' : ''} ${isDragging ? 'dragging' : ''}`}
      draggable
      onDragStart={(e) => onDragStart(e, index)}
      onDragOver={(e) => onDragOver(e, index)}
      onDragEnd={onDragEnd}
    >
      {/* Quick Action Overlay (Edit/Delete) */}
      <div className={`card-quick-actions ${isCardRefreshing ? 'active' : ''}`}>
        <button 
          className={`quick-action-btn refresh ${isCardRefreshing ? 'refreshing' : ''}`}
          onClick={handleCardRefresh}
          disabled={isCardRefreshing}
          title="실시간 정보 갱신"
        >
          <RefreshCw size={14} className={isCardRefreshing ? 'spin' : ''} />
        </button>
        <button className="quick-action-btn edit" onClick={onEditClick} title="수정" disabled={isCardRefreshing}>
          <Edit size={14} />
        </button>
        <button className="quick-action-btn delete" onClick={onDeleteClick} title="삭제" disabled={isCardRefreshing}>
          <Trash2 size={14} />
        </button>
      </div>

      {/* Card Header */}
      <div className="card-header">
        <div className="char-name-lvl">
          <GripVertical size={14} className="char-drag-handle" title="드래그하여 순서 변경" />
          <span className="char-lvl">[Lv.{level}]</span>
          <div className="char-name-container">
            <h3 className="char-name">{name}</h3>
            <span className="char-name-tooltip">{name}</span>
          </div>
          {worldName && <span className="char-world">{worldName}</span>}
        </div>
        <span className="char-job">{job}</span>
      </div>

      <div className="card-meta-row">
        <span className="owner-badge">{owner || '미지정'}</span>
        {tags.length > 0 && (
          <div className="tag-list">
            {tags.slice(0, 3).map(tag => <span key={tag} className={`tag-tone-${getTagTone(tag)}`}>{tag}</span>)}
            {tags.length > 3 && <span>+{tags.length - 3}</span>}
          </div>
        )}
      </div>

      {/* Character Image Container */}
      <div className="char-avatar-container">
        {avatar ? (
          <img src={avatar} alt={`${name} 아바타`} className="char-avatar" />
        ) : (
          <div className="char-avatar-placeholder">
            <span>(캐릭터 렌더링 이미지)</span>
          </div>
        )}
      </div>

      {/* Stats Summary */}
      <div className="card-stats">
        <div className="stat-row">
          <div className="stat-label">
            <Compass size={14} className="stat-icon" />
            <span>전투력</span>
          </div>
          <span className="stat-value combat-power">{formatCombatPower(currentCombatPower)}</span>
        </div>
        
        {/* EXP Progress Track */}
        <div className="exp-progress-wrapper">
          <div className="exp-text-row">
            <span className="exp-label">경험치</span>
            <span className="exp-percent">{currentExpRate !== undefined ? currentExpRate.toFixed(3) : '0.000'}%</span>
          </div>
          <div className="exp-progress-track">
            <div className="exp-progress-fill" style={{ width: `${currentExpRate || 0}%` }} />
          </div>
        </div>

        {/* 7-day EXP Sparkline Area */}
        {renderSparkline()}
      </div>

      {/* Card Action Buttons */}
      <div className="card-buttons">
        {onTogglePartyCandidate && (
          <button
            className={`btn btn-secondary card-btn-candidate ${isPartyCandidate ? 'active' : ''}`}
            onClick={onTogglePartyCandidate}
          >
            {isPartyCandidate ? '후보 선택됨' : '파티 후보'}
          </button>
        )}
        <button className="btn btn-primary card-btn-detail" onClick={onDetailClick}>
          세부 정보
        </button>
      </div>
    </div>
  );
}
