// n8n webhook 端點設定
const N8N_BASE = 'https://a3g.app.n8n.cloud/webhook';

export const UPLOAD_URL = `${N8N_BASE}/rag-upload`;
export const CLEAR_URL = `${N8N_BASE}/rag-clear`;
export const CHAT_URL = `${N8N_BASE}/rag-chat`;

export const MAX_FILES = 5;
export const MAX_FILE_SIZE_MB = 15;
export const ACCEPTED_EXTENSIONS = ['pdf', 'docx', 'txt', 'md', 'csv', 'xlsx', 'xls'];
