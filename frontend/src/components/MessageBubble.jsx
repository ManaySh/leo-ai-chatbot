import React from 'react';

export default function MessageBubble({ message, isOwn }) {
  const base = 'max-w-[80%] rounded-2xl px-4 py-2 text-sm leading-relaxed whitespace-pre-wrap';
  const own = 'bg-indigo-600 text-white ml-auto rounded-br-sm';
  const other = 'bg-slate-800 text-slate-100 mr-auto rounded-bl-sm';
  const system = 'bg-slate-900 text-slate-400 mx-auto border border-slate-800';

  if (message.role === 'system') {
    return (
      <div className={`${base} ${system}`}>{message.content}</div>
    );
  }

  return (
    <div className={`${base} ${isOwn ? own : other}`}>
      {!isOwn && <div className="text-[11px] text-slate-300/80 mb-1">{message.name || 'AI'}</div>}
      <div>{message.content}</div>
    </div>
  );
}
