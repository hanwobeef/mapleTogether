import { useState } from 'react';
import { X, Save, Search } from 'lucide-react';
import { fetchFullCharacterData } from '../utils/nexonApi';
import './EditModal.css';

const DEFAULT_STATS = {
  str: 1000,
  dex: 1000,
  intel: 1000,
  luk: 1000,
  starforce: 150,
  bossDamage: 200,
  arcaneForce: 600,
  sacredPower: 0,
};

const POPULAR_JOBS = [
  '히어로', '팔라딘', '다크나이트', '아크메이지(불,독)', '아크메이지(썬,콜)', '비숍',
  '보우마스터', '신궁', '패스파인더', '나이트로드', '섀도어', '듀얼블레이드',
  '캡틴', '바이퍼', '캐논슈터', '소울마스터', '플레임위자드', '윈드브레이커',
  '나이트워커', '스트라이커', '미하일', '아란', '에반', '메르세데스', '팬텀',
  '루미너스', '은월', '데몬슬레이어', '데몬어벤져', '배틀메이지', '와일드헌터',
  '메카닉', '블래스터', '제논', '카이저', '카데나', '엔젤릭버스터', '패스파인더',
  '아델', '일 리움', '칼리', '아크', '라라', '호영', '제로', '키네시스'
];

export default function EditModal({ character, onClose, onSave }) {
  const [name, setName] = useState(() => character?.name || '');
  const [level, setLevel] = useState(() => character?.level || 250);
  const [job, setJob] = useState(() => character?.job || '히어로');
  const [combatPower, setCombatPower] = useState(() => character?.combatPower || 10000000);
  const [stats, setStats] = useState(() => character?.stats || DEFAULT_STATS);
  const [avatar, setAvatar] = useState(() => character?.avatar || '');
  const [equipment, setEquipment] = useState(() => character?.equipment || null);
  const [owner, setOwner] = useState(() => character?.owner || '');
  const [tagInput, setTagInput] = useState(() => Array.isArray(character?.tags) ? character.tags.join(', ') : '');
  const [isLoadingApi, setIsLoadingApi] = useState(false);
  const [nexonData, setNexonData] = useState(null);

  const handleLoadFromNexon = async () => {
    if (!name.trim()) {
      alert('조회할 캐릭터명을 입력해주세요.');
      return;
    }
    
    setIsLoadingApi(true);
    try {
      const charData = await fetchFullCharacterData(name.trim());
      setLevel(charData.level);
      
      // 직업 목록에 매칭 확인 또는 임의지정
      if (POPULAR_JOBS.includes(charData.job)) {
        setJob(charData.job);
      } else {
        // 직업 목록에 없으면 목록에 임시로 넣어 노출하거나 그대로 사용 가능하게 대응
        setJob(charData.job);
      }
      
      setCombatPower(charData.combatPower);
      setStats(charData.stats);
      setAvatar(charData.avatar);
      setEquipment(charData.equipment);
      setNexonData(charData); // Store the full fetched data
      
      alert(`넥슨 OpenAPI에서 [${charData.name}] 캐릭터 데이터를 성공적으로 불러왔습니다!`);
    } catch (error) {
      alert(`OpenAPI 데이터를 불러오는데 실패했습니다: ${error.message}`);
    } finally {
      setIsLoadingApi(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('이름을 입력해주세요.');
      return;
    }
    if (level < 1 || level > 300) {
      alert('레벨은 1부터 300 사이여야 합니다.');
      return;
    }
    
    const charData = {
      ...(character || {}),
      ...(nexonData || {}),
      name: name.trim(),
      level: parseInt(level),
      job: job,
      combatPower: parseInt(combatPower) || 0,
      stats: stats,
      avatar: avatar,
      equipment: equipment,
      owner: owner.trim() || '미지정',
      tags: tagInput.split(',').map(tag => tag.trim()).filter(Boolean)
    };
    
    onSave(charData);
  };

  const handleOverlayClick = (e) => {
    if (e.target.className === 'modal-overlay') {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content">
        {/* Close Button */}
        <button className="modal-close-btn" onClick={onClose} title="닫기">
          <X size={20} />
        </button>

        {/* Modal Header */}
        <div className="edit-modal-header">
          <h2>{character ? '캐릭터 정보 수정' : '새로운 캐릭터 등록'}</h2>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="edit-form">
          <div className="form-sections-container">
            {/* Section 1: Search Nickname */}
            <div className="form-section">
              <label className="nickname-label">캐릭터 닉네임 <span className="required">*</span></label>
              <div className="input-with-button">
                <input 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  placeholder="조회할 닉네임을 입력하세요"
                  maxLength={12}
                  required
                />
                <button
                  type="button"
                  className="btn btn-primary btn-fetch-api"
                  onClick={handleLoadFromNexon}
                  disabled={isLoadingApi}
                >
                  <Search size={14} />
                  {isLoadingApi ? '조회 중...' : '조회'}
                </button>
              </div>
            </div>

            <div className="form-section">
              <div className="form-row">
                <div className="form-field">
                  <label>소유자</label>
                  <input
                    type="text"
                    value={owner}
                    onChange={(e) => setOwner(e.target.value)}
                    placeholder="같이 하는 사람 이름 또는 닉네임"
                    maxLength={20}
                  />
                </div>
                <div className="form-field">
                  <label>태그</label>
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    placeholder="본캐, 검마팟, 보스돌이"
                    maxLength={80}
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Character Image Preview */}
            <div className="avatar-preview-section">
              {isLoadingApi ? (
                <div className="avatar-preview-loading">
                  <div className="spinner spin" />
                  <p>넥슨 OpenAPI에서 정보를 조회하고 있습니다...</p>
                </div>
              ) : avatar ? (
                <div className="avatar-preview-display">
                  <img src={avatar} alt={`${name} 캐릭터 이미지`} className="preview-image" />
                  <div className="preview-meta">
                    <span className="preview-lvl">Lv.{level}</span>
                    <span className="preview-job">{job}</span>
                  </div>
                </div>
              ) : (
                <div className="avatar-preview-placeholder">
                  <p>닉네임을 입력한 뒤 [조회] 버튼을 누르면</p>
                  <p className="sub-text">실시간 캐릭터 이미지를 확인할 수 있습니다.</p>
                </div>
              )}
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="edit-form-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              취소
            </button>
            <button type="submit" className="btn btn-primary" disabled={!avatar}>
              <Save size={16} /> 대시보드 등록
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
