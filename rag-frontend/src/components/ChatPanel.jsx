import { useEffect, useRef, useState } from 'react';
import { CHAT_URL } from '../config.js';

export default function ChatPanel({ sessionId }) {
  const [messages, setMessages] = useState([]); // { role: 'user' | 'ai' | 'error', text }
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const ask = async () => {
    const q = question.trim();
    if (!q || loading) return;
    setQuestion('');
    setMessages((prev) => [...prev, { role: 'user', text: q }]);
    setLoading(true);
    try {
      const res = await fetch(CHAT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q, sessionId }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const answer = data.answer ?? data.output ?? JSON.stringify(data);
      setMessages((prev) => [...prev, { role: 'ai', text: answer }]);
    } catch (err) {
      setMessages((prev) => [...prev, { role: 'error', text: `查詢失敗：${err.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="chat-panel">
      <h2>2️⃣ 知識庫問答</h2>
      <div className="chat-window">
        {messages.length === 0 && (
          <p className="chat-empty">輸入問題，AI 會從你上傳的文件中尋找答案。</p>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`bubble ${m.role}`}>
            {m.text}
          </div>
        ))}
        {loading && <div className="bubble ai loading">思考中…</div>}
        <div ref={bottomRef} />
      </div>
      <div className="chat-input-row">
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              ask();
            }
          }}
          placeholder="輸入你的問題…（Enter 送出，Shift+Enter 換行）"
          rows={2}
          disabled={loading}
        />
        <button className="btn primary" onClick={ask} disabled={loading || !question.trim()}>
          {loading ? '…' : '送出'}
        </button>
      </div>
    </section>
  );
}
