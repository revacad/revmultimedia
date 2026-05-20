'use client'

import { useRef, useState } from 'react'

const EMOJI_CATEGORIES: Record<string, string[]> = {
  Smileys: ['😀', '😊', '🙂', '😉', '😍', '🥳', '😎', '🤔', '😅', '🙏'],
  Gestures: ['👍', '👋', '✌️', '🤝', '💪', '👏', '🙌', '✨', '🎉', '❤️'],
  Objects: ['📱', '💻', '📧', '📅', '🎓', '📚', '✅', '⭐', '🔔', '💡'],
  Symbols: ['✔️', '❗', '❓', '➡️', '🔥', '💯', '🌟', '🇬🇭', '🎬', '🎨'],
}

interface WhatsAppComposerProps {
  value: string
  onChange: (text: string) => void
}

export default function WhatsAppComposer({ value, onChange }: WhatsAppComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [showEmoji, setShowEmoji] = useState(false)

  const len = value.length
  const warn = len >= 900
  const over = len > 1024

  function wrapSelection(before: string, after: string) {
    const el = textareaRef.current
    if (!el) return
    const start = el.selectionStart
    const end = el.selectionEnd
    const selected = value.slice(start, end) || 'text'
    const next = value.slice(0, start) + before + selected + after + value.slice(end)
    onChange(next.slice(0, 1024))
    requestAnimationFrame(() => {
      el.focus()
      const pos = start + before.length + selected.length + after.length
      el.setSelectionRange(pos, pos)
    })
  }

  function insertEmoji(emoji: string) {
    const el = textareaRef.current
    if (!el) {
      onChange((value + emoji).slice(0, 1024))
      return
    }
    const start = el.selectionStart
    const end = el.selectionEnd
    const next = value.slice(0, start) + emoji + value.slice(end)
    onChange(next.slice(0, 1024))
    setShowEmoji(false)
    requestAnimationFrame(() => {
      el.focus()
      const pos = start + emoji.length
      el.setSelectionRange(pos, pos)
    })
  }

  return (
    <div>
      <div className="mb-2 flex flex-wrap gap-1 rounded-lg border border-[#EFEFF5] bg-[#F7F8FC] p-2">
        <button
          type="button"
          className="rounded-md px-2 py-1 font-body text-xs font-semibold text-[#5A5A7A] hover:bg-[#EFEFF5]"
          onClick={() => wrapSelection('*', '*')}
        >
          Bold (*)
        </button>
        <button
          type="button"
          className="rounded-md px-2 py-1 font-body text-xs font-semibold text-[#5A5A7A] hover:bg-[#EFEFF5]"
          onClick={() => wrapSelection('_', '_')}
        >
          Italic (_)
        </button>
        <button
          type="button"
          className="rounded-md px-2 py-1 font-body text-xs font-semibold text-[#5A5A7A] hover:bg-[#EFEFF5]"
          onClick={() => wrapSelection('~', '~')}
        >
          Strike (~)
        </button>
        <button
          type="button"
          className="rounded-md px-2 py-1 font-body text-xs font-semibold text-[#C74A86] hover:bg-[#FDF0F6]"
          onClick={() => setShowEmoji((v) => !v)}
        >
          Emoji
        </button>
      </div>

      {showEmoji && (
        <div className="mb-2 max-h-40 overflow-y-auto rounded-lg border border-[#EFEFF5] bg-white p-3">
          {Object.entries(EMOJI_CATEGORIES).map(([category, emojis]) => (
            <div key={category} className="mb-2">
              <p className="mb-1 font-body text-xs font-semibold text-[#9898B8]">{category}</p>
              <div className="flex flex-wrap gap-1">
                {emojis.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    className="rounded p-1 text-lg hover:bg-[#F7F8FC]"
                    onClick={() => insertEmoji(emoji)}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value.slice(0, 1024))}
        rows={6}
        className="w-full rounded-lg border border-[#EFEFF5] px-4 py-3 font-body text-sm text-[#1A1A2E] focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
        placeholder="WhatsApp message…"
      />
      <p
        className={`mt-1 text-right font-body text-xs ${
          over ? 'text-[#E84A4A]' : warn ? 'text-[#C4701E]' : 'text-[#9898B8]'
        }`}
      >
        {len}/1024
      </p>
    </div>
  )
}
