import React from 'react';

export default function TypingIndicator({ visible }) {
  if (!visible) return null;

  return (
    <div className="text-xs text-slate-400 px-2 py-1">AI is typing...</div>
  );
}
