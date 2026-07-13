import { Check, Edit, Eye } from 'lucide-react';
import { getSimulatedSpec } from '../utils/specSimulator';
import { getTagTone } from '../utils/tagOptions';
import './ComparisonTable.css';

function formatNumber(value) {
  return new Intl.NumberFormat().format(value || 0);
}

const DEFAULT_SELECTED_PRESETS = {
  equipment: 1,
  ability: 1,
  hyperStat: 1,
  linkSkill: 1,
  union: 1
};

function PresetSelect({ label, value, max = 3, onChange }) {
  return (
    <label className="compare-preset-select" title={`${label} 프리셋`}>
      <span aria-hidden="true">{label}</span>
      <select value={value} onChange={(e) => onChange(Number(e.target.value))}>
        {Array.from({ length: max }, (_, idx) => idx + 1).map(num => (
          <option key={num} value={num}>{num}</option>
        ))}
      </select>
    </label>
  );
}

export default function ComparisonTable({
  characters,
  selectedIds,
  onToggleCandidate,
  onDetailClick,
  onEditClick,
  onUpdatePresets
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
            <th>프리셋</th>
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
            const isSelected = selectedIds.includes(character.id);
            const selectedPresets = {
              ...DEFAULT_SELECTED_PRESETS,
              ...(character.selectedPresets || {})
            };

            const handlePresetChange = (type, presetNo) => {
              onUpdatePresets?.(character.id, type, presetNo);
            };

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
                    {character.avatar && (
                      <div className="compare-avatar-frame">
                        <img src={character.avatar} alt="" />
                      </div>
                    )}
                    <div>
                      <strong>{character.name}</strong>
                      <span>Lv.{character.level}</span>
                    </div>
                  </div>
                </td>
                <td>{character.job}</td>
                <td>{character.worldName || '-'}</td>
                <td className="numeric highlight">{formatNumber(simulated.combatPower)}</td>
                <td>
                  <div className="compare-preset-controls" aria-label={`${character.name} 프리셋 설정`}>
                    <PresetSelect
                      label="장"
                      value={selectedPresets.equipment}
                      onChange={(value) => handlePresetChange('equipment', value)}
                    />
                    <PresetSelect
                      label="어"
                      value={selectedPresets.ability}
                      onChange={(value) => handlePresetChange('ability', value)}
                    />
                    <PresetSelect
                      label="하"
                      value={selectedPresets.hyperStat}
                      onChange={(value) => handlePresetChange('hyperStat', value)}
                    />
                    <PresetSelect
                      label="링"
                      value={selectedPresets.linkSkill}
                      onChange={(value) => handlePresetChange('linkSkill', value)}
                    />
                    <PresetSelect
                      label="유"
                      value={selectedPresets.union}
                      max={5}
                      onChange={(value) => handlePresetChange('union', value)}
                    />
                  </div>
                </td>
                <td className="numeric">{stats.bossDamage || 0}%</td>
                <td className="numeric">{stats.critDamage || 0}%</td>
                <td className="numeric">{stats.arcaneForce || 0} / {stats.sacredPower || 0}</td>
                <td className="numeric">{character.unionInfo?.level || 0}</td>
                <td>
                  <div className="compare-tags">
                    {(character.tags || []).length > 0
                      ? character.tags.map(tag => <span key={tag} className={`tag-tone-${getTagTone(tag)}`}>{tag}</span>)
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
