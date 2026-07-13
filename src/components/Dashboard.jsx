import { useState, useEffect } from 'react';
import CharacterCard from './CharacterCard';
import DetailModal from './DetailModal';
import EditModal from './EditModal';
import { RefreshCw, UserPlus, ShieldAlert, Sparkles, Sun, Moon } from 'lucide-react';
import { fetchFullCharacterData } from '../utils/nexonApi';
import './Dashboard.css';

const INITIAL_CHARACTERS = [];
const STORAGE_KEYS = {
  characters: 'maple_dashboard_characters',
  lastUpdated: 'maple_dashboard_last_updated',
  storageVersion: 'maple_dashboard_storage_version',
  theme: 'maple_dashboard_theme'
};
const STORAGE_VERSION = '1';

function loadCharacters() {
  const version = localStorage.getItem(STORAGE_KEYS.storageVersion);
  if (version && version !== STORAGE_VERSION) {
    localStorage.removeItem(STORAGE_KEYS.characters);
    localStorage.setItem(STORAGE_KEYS.storageVersion, STORAGE_VERSION);
    return INITIAL_CHARACTERS;
  }

  const saved = localStorage.getItem(STORAGE_KEYS.characters);
  if (!saved) return INITIAL_CHARACTERS;

  try {
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed : INITIAL_CHARACTERS;
  } catch {
    localStorage.removeItem(STORAGE_KEYS.characters);
    return INITIAL_CHARACTERS;
  }
}

function loadLastUpdatedSeconds() {
  const saved = Number(localStorage.getItem(STORAGE_KEYS.lastUpdated));
  if (!Number.isFinite(saved) || saved <= 0) return 900;
  const diffMs = Date.now() - saved;
  return Math.max(0, Math.floor(diffMs / 1000));
}

function formatElapsed(seconds) {
  if (seconds < 60) return '방금 전';

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}분 전`;

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (hours < 24) {
    return remainingMinutes === 0 ? `${hours}시간 전` : `${hours}시간 ${remainingMinutes}분 전`;
  }

  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  return remainingHours === 0 ? `${days}일 전` : `${days}일 ${remainingHours}시간 전`;
}

export default function Dashboard() {
  const [characters, setCharacters] = useState(loadCharacters);

  const [theme, setTheme] = useState(() => localStorage.getItem(STORAGE_KEYS.theme) || 'dark');
  const [selectedChar, setSelectedChar] = useState(null);
  const [editChar, setEditChar] = useState(null); // char data or 'new'
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshFailures, setRefreshFailures] = useState([]);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [timeCounter, setTimeCounter] = useState(loadLastUpdatedSeconds);
  const lastUpdated = formatElapsed(timeCounter);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_KEYS.theme, theme);
  }, [theme]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.characters, JSON.stringify(characters));
      localStorage.setItem(STORAGE_KEYS.storageVersion, STORAGE_VERSION);
    } catch (error) {
      console.warn('캐릭터 정보를 localStorage에 저장하지 못했습니다:', error);
    }
  }, [characters]);

  // Simulate updating time counter (runs every second for accurate timing)
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeCounter(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    setRefreshFailures([]);
    try {
      // 모든 캐릭터에 대해 실제 OpenAPI를 호출하여 실시간 데이터 수집
      const updatedCharacters = await Promise.all(
        characters.map(async (char) => {
          try {
            const freshData = await fetchFullCharacterData(char.name);
            return {
              ...char,
              ...freshData
            };
          } catch (err) {
            // 개별 캐릭터 갱신 실패 시 기존 상태 유지
            return {
              ...char,
              refreshError: err.message || '알 수 없는 오류'
            };
          }
        })
      );
      const failed = updatedCharacters
        .filter(char => char.refreshError)
        .map(char => `${char.name}: ${char.refreshError}`);

      setCharacters(updatedCharacters.map(char => {
        const cleaned = { ...char };
        delete cleaned.refreshError;
        return cleaned;
      }));
      setRefreshFailures(failed);

      // 모달 등에 활성화되어 있는 캐릭터들의 정보도 동기화
      if (selectedChar) {
        const freshSelected = updatedCharacters.find(c => c.id === selectedChar.id);
        if (freshSelected) setSelectedChar(freshSelected);
      }

      const now = Date.now();
      localStorage.setItem(STORAGE_KEYS.lastUpdated, now.toString());
      setTimeCounter(0); // 갱신 타이머 리셋
    } catch (error) {
      setRefreshFailures([`전체 새로고침 오류: ${error.message}`]);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSaveCharacter = (charData) => {
    if (charData.id) {
      // Edit existing
      setCharacters(prev => prev.map(c => c.id === charData.id ? charData : c));
    } else {
      // Add new
      const newId = characters.length > 0 ? Math.max(...characters.map(c => c.id)) + 1 : 1;
      const avatars = [
        '/avatars/dark_knight.png',
        '/avatars/night_lord.png',
        '/avatars/bishop.png',
        '/avatars/bowmaster.png'
      ];
      // Select random avatar or match job
      let matchedAvatar = avatars[Math.floor(Math.random() * avatars.length)];
      const jobLower = charData.job.toLowerCase();
      if (jobLower.includes('전사') || jobLower.includes('나이트') || jobLower.includes('히어로') || jobLower.includes('팔라딘')) {
        matchedAvatar = '/avatars/dark_knight.png';
      } else if (jobLower.includes('도적') || jobLower.includes('로드') || jobLower.includes('섀도어') || jobLower.includes('듀블')) {
        matchedAvatar = '/avatars/night_lord.png';
      } else if (jobLower.includes('법사') || jobLower.includes('숍') || jobLower.includes('아크') || jobLower.includes('썬콜') || jobLower.includes('불독')) {
        matchedAvatar = '/avatars/bishop.png';
      } else if (jobLower.includes('궁수') || jobLower.includes('마스터') || jobLower.includes('윈브') || jobLower.includes('메르')) {
        matchedAvatar = '/avatars/bowmaster.png';
      }

      const newChar = {
        ...charData,
        id: newId,
        avatar: charData.avatar || matchedAvatar,
        trend: charData.dailyExp > 0 ? 'up' : 'none',
        bossClear: charData.bossClear || {
          easySignus: true, hardHilla: true, chaosPinkbean: true, chaosZakum: true,
          chaosPapulatus: false, normalMagnus: true, chaosPierre: false,
          chaosVonBon: false, chaosCrimsonQueen: false, chaosVellum: false,
          hardMagnus: false, normalLotus: false, normalDamien: false,
          hardLotus: false, hardDamien: false, normalLucid: false, normalWill: false,
          hardLucid: false, hardWill: false, chaosDusk: false, hardDunkel: false,
          hardHilla2: false, normalSeren: false, hardSeren: false, kalos: false, kaling: false
        }
      };
      setCharacters(prev => [...prev, newChar]);
    }
    const now = Date.now();
    localStorage.setItem(STORAGE_KEYS.lastUpdated, now.toString());
    setTimeCounter(0);
    setEditChar(null);
  };

  const handleDeleteCharacter = (id) => {
    if (window.confirm('정말 이 캐릭터를 대시보드에서 삭제하시겠습니까?')) {
      setCharacters(prev => prev.filter(c => c.id !== id));
      if (selectedChar && selectedChar.id === id) setSelectedChar(null);
    }
  };

  const handleRefreshSingleCharacter = async (charId, charName) => {
    try {
      const freshData = await fetchFullCharacterData(charName);
      setCharacters(prev =>
        prev.map(c => c.id === charId ? { ...c, ...freshData } : c)
      );
      if (selectedChar && selectedChar.id === charId) {
        setSelectedChar(prev => ({ ...prev, ...freshData }));
      }
      const now = Date.now();
      localStorage.setItem(STORAGE_KEYS.lastUpdated, now.toString());
      setTimeCounter(0);
      setRefreshFailures(prev => prev.filter(message => !message.startsWith(`${charName}:`)));
    } catch (error) {
      alert(`[${charName}] 캐릭터 정보 갱신에 실패했습니다: ${error.message}`);
      throw error;
    }
  };

  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    setCharacters(prev => {
      const updated = [...prev];
      const draggedItem = updated[draggedIndex];
      updated.splice(draggedIndex, 1);
      updated.splice(index, 0, draggedItem);
      return updated;
    });
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleUpdatePresets = (charId, type, presetNo) => {
    setCharacters(prev => prev.map(c => {
      if (c.id === charId) {
        const updatedPresets = { ...c.selectedPresets, [type]: presetNo };
        const updated = { ...c, selectedPresets: updatedPresets };
        if (selectedChar && selectedChar.id === charId) {
          setSelectedChar(updated);
        }
        return updated;
      }
      return c;
    }));
  };



  return (
    <div className="dashboard-wrapper">
      <div className="dashboard-header">
        <div className="title-section">
          <h1 className="dashboard-title">MAPLE TOGETHER</h1>
          <div className="status-indicator">
            <span className="indicator-dot"></span>
            <span className="status-text">캐릭터 정보 갱신: {lastUpdated}</span>
            <button
              className={`refresh-btn ${isRefreshing ? 'refreshing' : ''}`}
              onClick={handleRefresh}
              disabled={isRefreshing}
              title="정보 새로고침"
            >
              <RefreshCw className={`refresh-icon ${isRefreshing ? 'spin' : ''}`} size={14} />
            </button>
          </div>
        </div>
        <div className="actions-section">
          <button
            className="btn btn-secondary theme-toggle-btn"
            onClick={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
            title={theme === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환'}
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            {theme === 'dark' ? '라이트 모드' : '다크 모드'}
          </button>
          <button className="btn btn-secondary btn-add" onClick={() => setEditChar('new')}>
            <UserPlus size={16} />
            캐릭터 등록
          </button>
        </div>
      </div>

      {characters.length === 0 ? (
        <div className="empty-dashboard">
          <ShieldAlert size={48} className="empty-icon" />
          <h2>등록된 캐릭터가 없습니다</h2>
          <p>오른쪽 위의 '캐릭터 등록' 버튼을 눌러 첫 번째 캐릭터를 추가해보세요.</p>
          <button className="btn btn-primary mt-4" onClick={() => setEditChar('new')}>
            <UserPlus size={16} />
            지금 등록하기
          </button>
        </div>
      ) : (
        <div className="cards-grid">
          {characters.map((char, idx) => (
            <CharacterCard 
              key={char.id}
              character={char}
              index={idx}
              onDetailClick={() => setSelectedChar(char)}
              onEditClick={() => setEditChar(char)}
              onDeleteClick={() => handleDeleteCharacter(char.id)}
              onRefresh={handleRefreshSingleCharacter}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragEnd={handleDragEnd}
              isDragging={draggedIndex === idx}
            />
          ))}
        </div>
      )}

      {refreshFailures.length > 0 && (
        <div className="refresh-failures" role="status">
          <strong>일부 정보를 갱신하지 못했습니다.</strong>
          {refreshFailures.map(message => (
            <span key={message}>{message}</span>
          ))}
        </div>
      )}

      {/* Footer Info */}
      <div className="dashboard-footer">
        <p className="footer-note">
          <Sparkles size={12} className="inline-icon" /> 카드를 마우스로 가리키면 수정 및 삭제 버튼이 나타납니다.
        </p>
        <p className="footer-copyright">© 2026 MapleTogether Dashboard. Designed for MapleStory Users.</p>
        <p className="footer-font-credit">이 페이지에는 메이플스토리가 제공한 메이플스토리 서체가 적용되어 있습니다.</p>
      </div>

      {/* Modals */}
      {selectedChar && (
        <DetailModal
          character={selectedChar}
          onClose={() => setSelectedChar(null)}
          onUpdatePresets={handleUpdatePresets}
          onRefresh={handleRefreshSingleCharacter}
        />
      )}

      {editChar && (
        <EditModal
          character={editChar === 'new' ? null : editChar}
          onClose={() => setEditChar(null)}
          onSave={handleSaveCharacter}
        />
      )}
    </div>
  );
}
