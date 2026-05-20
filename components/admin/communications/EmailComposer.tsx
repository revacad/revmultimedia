'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import { useEffect } from 'react'

interface EmailComposerProps {
  value: string
  onChange: (html: string) => void
}

function ToolbarButton({
  label,
  active,
  onClick,
}: {
  label: string
  active?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      title={label}
      onClick={onClick}
      className={`flex h-8 min-w-8 items-center justify-center rounded-md px-2 font-body text-xs font-semibold transition-colors ${
        active ? 'bg-[#FDF0F6] text-[#C74A86]' : 'text-[#5A5A7A] hover:bg-[#EFEFF5]'
      }`}
    >
      {label}
    </button>
  )
}

export default function EmailComposer({ value, onChange }: EmailComposerProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] } }),
      Underline,
      Link.configure({ openOnClick: false }),
    ],
    content: value || '<p></p>',
    onUpdate: ({ editor: ed }) => {
      onChange(ed.getHTML())
    },
    editorProps: {
      attributes: {
        class:
          'min-h-[200px] px-4 py-4 font-body text-sm text-[#1A1A2E] outline-none prose prose-sm max-w-none',
        style: 'font-family: DM Sans, sans-serif',
      },
    },
  })

  useEffect(() => {
    if (!editor) return
    const current = editor.getHTML()
    if (value !== current && value !== (current === '<p></p>' ? '' : current)) {
      editor.commands.setContent(value || '<p></p>', { emitUpdate: false })
    }
  }, [value, editor])

  if (!editor) return null

  const setLink = () => {
    const previous = editor.getAttributes('link').href as string | undefined
    const url = window.prompt('URL', previous ?? 'https://')
    if (url === null) return
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }

  return (
    <div className="overflow-hidden rounded-lg border border-[#EFEFF5]">
      <div className="flex flex-wrap gap-1 border-b border-[#EFEFF5] bg-[#F7F8FC] p-2">
        <ToolbarButton
          label="B"
          active={editor.isActive('bold')}
          onClick={() => editor.chain().focus().toggleBold().run()}
        />
        <ToolbarButton
          label="I"
          active={editor.isActive('italic')}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        />
        <ToolbarButton
          label="U"
          active={editor.isActive('underline')}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        />
        <ToolbarButton label="Link" active={editor.isActive('link')} onClick={setLink} />
        <ToolbarButton
          label="• List"
          active={editor.isActive('bulletList')}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        />
        <ToolbarButton
          label="1. List"
          active={editor.isActive('orderedList')}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        />
        <ToolbarButton
          label="H2"
          active={editor.isActive('heading', { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        />
        <ToolbarButton
          label="H3"
          active={editor.isActive('heading', { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        />
        <ToolbarButton
          label="Clear"
          onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
        />
      </div>
      <EditorContent editor={editor} />
    </div>
  )
}
