import { useRef, useState } from 'react';
import { UPLOAD_URL, MAX_FILES, MAX_FILE_SIZE_MB, ACCEPTED_EXTENSIONS } from '../config.js';

const STATUS_LABEL = {
  pending: '待上傳',
  uploading: '上傳中…',
  done: '✅ 已上傳',
  error: '❌ 失敗',
};

function extOf(name) {
  return name.split('.').pop().toLowerCase();
}

export default function UploadPanel({ onFinish }) {
  const [files, setFiles] = useState([]); // { file, name, status, error }
  const [busy, setBusy] = useState(false);
  const inputRef = useRef(null);

  const doneFiles = files.filter((f) => f.status === 'done');
  const pendingFiles = files.filter((f) => f.status === 'pending' || f.status === 'error');

  const [sizeWarning, setSizeWarning] = useState('');

  const addFiles = (fileList) => {
    const incoming = Array.from(fileList);
    const tooBig = incoming.filter((f) => f.size > MAX_FILE_SIZE_MB * 1024 * 1024);
    setSizeWarning(
      tooBig.length > 0
        ? `以下檔案超過 ${MAX_FILE_SIZE_MB}MB 上限，已略過：${tooBig.map((f) => f.name).join('、')}`
        : ''
    );
    setFiles((prev) => {
      const next = [...prev];
      for (const file of incoming) {
        if (next.length >= MAX_FILES) break;
        if (!ACCEPTED_EXTENSIONS.includes(extOf(file.name))) continue;
        if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) continue;
        if (next.some((f) => f.name === file.name)) continue;
        next.push({ file, name: file.name, status: 'pending', error: null });
      }
      return next;
    });
    if (inputRef.current) inputRef.current.value = '';
  };

  const removeFile = (name) => {
    setFiles((prev) => prev.filter((f) => f.name !== name));
  };

  const uploadOne = async (entry) => {
    const url = `${UPLOAD_URL}?filename=${encodeURIComponent(entry.name)}&ext=${extOf(entry.name)}`;
    const form = new FormData();
    form.append('file', entry.file, entry.name);
    const res = await fetch(url, { method: 'POST', body: form });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  };

  const handleUpload = async () => {
    setBusy(true);
    for (const entry of files) {
      if (entry.status === 'done' || entry.status === 'uploading') continue;
      setFiles((prev) =>
        prev.map((f) => (f.name === entry.name ? { ...f, status: 'uploading', error: null } : f))
      );
      try {
        await uploadOne(entry);
        setFiles((prev) =>
          prev.map((f) => (f.name === entry.name ? { ...f, status: 'done' } : f))
        );
      } catch (err) {
        setFiles((prev) =>
          prev.map((f) =>
            f.name === entry.name ? { ...f, status: 'error', error: err.message } : f
          )
        );
      }
    }
    setBusy(false);
  };

  return (
    <section className="upload-panel">
      <h2>1️⃣ RAG 知識上傳</h2>
      <p className="hint">
        最多 {MAX_FILES} 個檔案（每檔上限 {MAX_FILE_SIZE_MB}MB），支援：{ACCEPTED_EXTENSIONS.map((e) => `.${e}`).join('、')}
      </p>
      {sizeWarning && <div className="notice">{sizeWarning}</div>}

      <div
        className="dropzone"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          addFiles(e.dataTransfer.files);
        }}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          hidden
          accept={ACCEPTED_EXTENSIONS.map((e) => `.${e}`).join(',')}
          onChange={(e) => addFiles(e.target.files)}
        />
        <p>📂 點擊選擇檔案，或將檔案拖曳到這裡</p>
        <p className="hint">已選擇 {files.length} / {MAX_FILES}</p>
      </div>

      {files.length > 0 && (
        <ul className="file-list">
          {files.map((f) => (
            <li key={f.name} className={`file-item ${f.status}`}>
              <span className="file-name">{f.name}</span>
              <span className="file-status">
                {STATUS_LABEL[f.status]}
                {f.error ? `（${f.error}）` : ''}
              </span>
              {f.status !== 'uploading' && f.status !== 'done' && (
                <button className="btn-icon" onClick={() => removeFile(f.name)} title="移除">
                  ✕
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      <div className="upload-actions">
        <button
          className="btn primary"
          onClick={handleUpload}
          disabled={busy || pendingFiles.length === 0}
        >
          {busy ? '上傳中…' : `⬆️ 上傳（${pendingFiles.length} 個待上傳）`}
        </button>
        <button
          className="btn success"
          onClick={() => onFinish(doneFiles)}
          disabled={busy || doneFiles.length === 0}
        >
          ✔️ 完成，開始問答
        </button>
      </div>
    </section>
  );
}
