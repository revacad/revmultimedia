'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import TextAlign from '@tiptap/extension-text-align'
import Placeholder from '@tiptap/extension-placeholder'
import { useEffect } from 'react'

interface RichTextEditorProps {
  content?: string
  onChange?: (html: string) => void
  placeholder?: string
  onImageUpload?: (file: File) => Promise<string>
  minHeight?: number
}

export function RichTextEditor({
  content = '',
  onChange,
  placeholder = 'Start writing...',
  onImageUpload,
  minHeight = 300,
}: RichTextEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Link.configure({ openOnClick: false }),
      Image.configure({ allowBase64: false }),
      Placeholder.configure({ placeholder }),
    ],
    content,
    onUpdate: ({ editor: ed }) => {
      onChange?.(ed.getHTML())
    },
  })

  useEffect(() => {
    return () => {
      editor?.destroy()
    }
  }, [editor])

  const handleImageUpload = async () => {
    if (!onImageUpload || !editor) return

    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/jpeg,image/png,image/webp'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      try {
        const url = await onImageUpload(file)
        editor.chain().focus().setImage({ src: url }).run()
      } catch {
        // upload failed — caller may surface errors elsewhere
      }
    }
    input.click()
  }

  if (!editor) return null

  const toolbarButtonStyle = (active: boolean) => ({
    padding: '6px 8px',
    border: 'none',
    borderRadius: '6px',
    backgroundColor: active ? '#FDF0F6' : 'transparent',
    color: active ? '#C74A86' : '#5A5A7A',
    cursor: 'pointer',
    fontFamily: 'DM Sans, sans-serif',
    fontSize: '13px',
    fontWeight: active ? 600 : 400,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '32px',
    height: '32px',
  })

  return (
    <div
      style={{
        border: '1.5px solid #D8D8E8',
        borderRadius: '12px',
        overflow: 'hidden',
        backgroundColor: 'white',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '2px',
          padding: '8px 12px',
          borderBottom: '1px solid #EFEFF5',
          backgroundColor: '#F7F8FC',
          alignItems: 'center',
        }}
      >
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          style={toolbarButtonStyle(editor.isActive('heading', { level: 2 }))}
          title="Heading 2"
        >
          H2
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          style={toolbarButtonStyle(editor.isActive('heading', { level: 3 }))}
          title="Heading 3"
        >
          H3
        </button>

        <div style={{ width: '1px', height: '24px', backgroundColor: '#EFEFF5', margin: '0 4px' }} />

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          style={toolbarButtonStyle(editor.isActive('bold'))}
          title="Bold"
        >
          <strong>B</strong>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          style={toolbarButtonStyle(editor.isActive('italic'))}
          title="Italic"
        >
          <em>I</em>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          style={toolbarButtonStyle(editor.isActive('underline'))}
          title="Underline"
        >
          <span style={{ textDecoration: 'underline' }}>U</span>
        </button>

        <div style={{ width: '1px', height: '24px', backgroundColor: '#EFEFF5', margin: '0 4px' }} />

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          style={toolbarButtonStyle(editor.isActive('bulletList'))}
          title="Bullet list"
        >
          ≡
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          style={toolbarButtonStyle(editor.isActive('orderedList'))}
          title="Numbered list"
        >
          1.
        </button>

        <div style={{ width: '1px', height: '24px', backgroundColor: '#EFEFF5', margin: '0 4px' }} />

        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          style={toolbarButtonStyle(editor.isActive({ textAlign: 'left' }))}
          title="Align left"
        >
          ⬅
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          style={toolbarButtonStyle(editor.isActive({ textAlign: 'center' }))}
          title="Align center"
        >
          ☰
        </button>

        <div style={{ width: '1px', height: '24px', backgroundColor: '#EFEFF5', margin: '0 4px' }} />

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          style={toolbarButtonStyle(editor.isActive('blockquote'))}
          title="Quote"
        >
          &quot;
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          style={toolbarButtonStyle(false)}
          title="Divider"
        >
          —
        </button>

        {onImageUpload && (
          <>
            <div style={{ width: '1px', height: '24px', backgroundColor: '#EFEFF5', margin: '0 4px' }} />
            <button
              type="button"
              onClick={handleImageUpload}
              style={toolbarButtonStyle(false)}
              title="Insert image"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
            </button>
          </>
        )}

        <div style={{ marginLeft: 'auto' }}>
          <button
            type="button"
            onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
            style={toolbarButtonStyle(false)}
            title="Clear formatting"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>

      <div style={{ minHeight }}>
        <EditorContent editor={editor} style={{ padding: '16px' }} />
      </div>
    </div>
  )
}
