const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

const SYSTEM_PROMPT = 'You are a helpful AI assistant. Be concise and friendly.';
const MODEL = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';

function toGroqMessages(roomMessages) {
  const out = [{ role: 'system', content: SYSTEM_PROMPT }];

  for (const m of roomMessages || []) {
    if (!m || !m.role || !m.content) continue;
    if (m.role === 'user') out.push({ role: 'user', content: m.content });
    if (m.role === 'assistant') out.push({ role: 'assistant', content: m.content });
  }

  return out;
}

function parseSseLines(buffer) {
  const parts = buffer.split('\n');
  return parts;
}

export async function* streamGroqResponse({ messages }) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('Missing GROQ_API_KEY');

  const res = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      stream: true,
      temperature: 0.3,
      messages: toGroqMessages(messages),
    }),
  });

  if (!res.ok || !res.body) {
    const txt = await res.text().catch(() => '');
    throw new Error(`Groq API error: ${res.status} ${txt}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder('utf-8');

  let pending = '';

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    pending += decoder.decode(value, { stream: true });

    const lines = parseSseLines(pending);
    pending = lines.pop() || '';

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) continue;
      if (!line.startsWith('data:')) continue;

      const data = line.slice('data:'.length).trim();
      if (data === '[DONE]') return;

      let json;
      try {
        json = JSON.parse(data);
      } catch {
        continue;
      }

      const delta = json?.choices?.[0]?.delta?.content;
      if (typeof delta === 'string' && delta.length > 0) {
        yield delta;
      }
    }
  }
}
