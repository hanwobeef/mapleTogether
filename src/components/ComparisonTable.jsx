import { Check, Edit, Eye } from 'lucide-react';
import { getSimulatedSpec } from '../utils/specSimulator';
import './ComparisonTable.css';

function formatNumber(value) {
  return new Intl.NumberFormat().format(value || 0);
}

function getMainStat(stats = {}) {
  const entries = [
    ['STR', stats.str],
    ['DEX', stats.dex],
    ['INT', stats.intel || stats.int],
    ['LUK', stats.luk]
  ];
  return entries.reduce((best, current) => ((current[1] || 0) > (best[1] || 0) ? current : best), entries[0]);
}

export default function ComparisonTable({
  characters,
  selectedIds,
  onToggleCandidate,
  onDetailClick,
  onEditClick
}) {
  return (
    <div className="comparison-table-wrapper">
      <table className="comparison-table">
        <thead>
          <tr>
            <th>후보</th>
            <th>소유자</th>
            <th>캐릭터</th>
            <th>직업</th>
            <th>월드</th>
            <th>전투력</th>
            <th>주스탯</th>
            <th>보공</th>
            <th>크뎀</th>
            <th>포스</th>
            <th>유니온</th>
            <th>태그</th>
            <th>작업</th>
          </tr>
        </thead>
        <tbody>
          {characters.map(character => {
            const simulated = getSimulatedSpec(character);
            const stats = simulated.stats || {};
            const [mainStatName, mainStatValue] = getMainStat(stats);
            const isSelected = selectedIds.includes(character.id);
            return (
              <tr key={character.id} className={isSelected ? 'selected' : ''}>
                <td>
                  <button
                    className={`candidate-toggle ${isSelected ? 'active' : ''}`}
                    onClick={() => onToggleCandidate(character.id)}
                    title={isSelected ? '파티 후보에서 제외' : '파티 후보로 선택'}
                  >
                    <Check size={14} />
                  </button>
                </td>
                <td>{character.owner}</td>
                <td>
                  <div className="compare-character-cell">
                    {character.avatar && <img src={character.avatar} alt="" />}
                    <div>
                      <strong>{character.name}</strong>
                      <span>Lv.{character.level}</span>
                    </div>
                  </div>
                </td>
                <td>{character.job}</td>
                <td>{character.worldName || '-'}</td>
                <td className="numeric highlight">{formatNumber(simulated.combatPower)}</td>
                <td className="numeric">{mainStatName} {formatNumber(mainStatValue)}</td>
                <td className="numeric">{stats.bossDamage || 0}%</td>
                <td className="numeric">{stats.critDamage || 0}%</td>
                <td className="numeric">{stats.arcaneForce || 0} / {stats.sacredPower || 0}</td>
                <td className="numeric">{character.unionInfo?.level || 0}</td>
                <td>
                  <div className="compare-tags">
                    {(character.tags || []).length > 0
                      ? character.tags.map(tag => <span key={tag}>{tag}</span>)
                      : <span className="muted">없음</span>}
                  </div>
                </td>
                <td>
                  <div className="compare-actions">
                    <button onClick={() => onDetailClick(character)} title="세부 정보">
                      <Eye size={14} />
                    </button>
                    <button onClick={() => onEditClick(character)} title="수정">
                      <Edit size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
