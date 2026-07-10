import { useMemo, useState } from 'react';
import UploadPanel from './components/UploadPanel.jsx';
import ChatPanel from './components/ChatPanel.jsx';
import { CLEAR_URL } from './config.js';

export default function App() {
  const [phase, setPhase] = useState('upload'); // 'upload' | 'chat'
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [clearing, setClearing] = useState(false);
  const [notice, setNotice] = useState('');
  const sessionId = useMemo(
    () => `web-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    []
  );

  const handleFinish = (files) => {
    setUploadedFiles(files);
    setPhase('chat');
  };

  const handleClearKnowledgeBase = async () => {
    if (!window.confirm('確定要清空知識庫嗎？所有已上傳文件的向量資料都會被刪除。')) return;
    setClearing(true);
    setNotice('');
    try {
      const res = await fetch(CLEAR_URL, { method: 'POST' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setUploadedFiles([]);
      setPhase('upload');
      setNotice('知識庫已清空，可以重新上傳文件。');
    } catch (err) {
      setNotice(`清空失敗：${err.message}`);
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>📚 RAG 知識庫系統</h1>
        <p>上傳文件建立知識庫，再向 AI 提問（Gemini + Mistral fallback / Qdrant 向量資料庫）</p>
      </header>

      {notice && <div className="notice">{notice}</div>}

      {phase === 'upload' && (
        <UploadPanel onFinish={handleFinish} />
      )}

      {phase === 'chat' && (
        <>
          <section className="uploaded-summary">
            <h2>✅ 知識庫文件（{uploadedFiles.length} 個）</h2>
            <ul>
              {uploadedFiles.map((f) => (
                <li key={f.name}>{f.name}</li>
              ))}
            </ul>
            <div className="summary-actions">
              <button className="btn secondary" onClick={() => setPhase('upload')}>
                ➕ 繼續上傳文件
              </button>
              <button className="btn danger" onClick={handleClearKnowledgeBase} disabled={clearing}>
                {clearing ? '清空中…' : '🗑️ 清空知識庫'}
              </button>
            </div>
          </section>
          <ChatPanel sessionId={sessionId} />
        </>
      )}
    </div>
  );
}
