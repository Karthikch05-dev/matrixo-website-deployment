'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Underline from '@tiptap/extension-underline'
import Placeholder from '@tiptap/extension-placeholder'
import { 
  FaBold, 
  FaItalic, 
  FaUnderline, 
  FaListUl, 
  FaListOl,
  FaLink,
  FaUnlink
} from 'react-icons/fa'
import { useCallback, useEffect, useState } from 'react'

// ============================================
// RICH TEXT EDITOR COMPONENT
// Using TipTap for proper rich text editing
// ============================================

interface RichTextEditorProps {
  content: string
  onChange: (html: string) => void
  placeholder?: string
  editable?: boolean
  minHeight?: string
}

// Toolbar Button Component
const ToolbarButton = ({ 
  onClick, 
  isActive, 
  icon: Icon, 
  title 
}: { 
  onClick: () => void
  isActive?: boolean
  icon: React.ComponentType<{ className?: string }>
  title: string
}) => (
  <button
    type="button"
    onClick={onClick}
    title={title}
    className={`
      p-2 rounded-lg transition-colors
      ${isActive 
        ? 'bg-primary-500 text-white' 
        : 'bg-neutral-700 text-neutral-300 hover:bg-neutral-600 hover:text-white'
      }
    `}
  >
    <Icon className="text-sm" />
  </button>
)

export default function RichTextEditor({
  content,
  onChange,
  placeholder = 'Enter description...',
  editable = true,
  minHeight = '150px'
}: RichTextEditorProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        autolink: true, // Auto-detect URLs and convert to links
        linkOnPaste: true,
        HTMLAttributes: {
          class: 'text-primary-400 underline hover:text-primary-300 cursor-pointer',
          target: '_blank',
          rel: 'noopener noreferrer',
        },
      }),
      Placeholder.configure({
        placeholder,
        emptyEditorClass: 'is-editor-empty',
      }),
    ],
    content: content || '',
    editable,
    editorProps: {
      attributes: {
        // Single line class to avoid DOMTokenList InvalidCharacterError
        class: 'prose prose-invert prose-sm max-w-none focus:outline-none prose-p:my-2 prose-p:leading-relaxed prose-ul:my-2 prose-ul:list-disc prose-ul:pl-6 prose-ol:my-2 prose-ol:list-decimal prose-ol:pl-6 prose-li:my-1 prose-a:text-primary-400 prose-a:underline prose-a:cursor-pointer prose-strong:text-white prose-strong:font-bold prose-em:italic',
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    immediatelyRender: false, // Prevent SSR hydration mismatch
  })

  // Update content when prop changes
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content || '')
    }
  }, [content, editor])

  // Update editable state
  useEffect(() => {
    if (editor) {
      editor.setEditable(editable)
    }
  }, [editable, editor])

  // Add link handler
  const setLink = useCallback(() => {
    if (!editor) return

    const previousUrl = editor.getAttributes('link').href
    const url = window.prompt('Enter URL:', previousUrl || 'https://')

    if (url === null) return

    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }, [editor])

  if (!mounted || !editor) {
    return (
      <div 
        className="bg-neutral-800 border border-neutral-700 rounded-xl p-4 animate-pulse"
        style={{ minHeight }}
      >
        <div className="h-4 bg-neutral-700 rounded w-3/4 mb-2" />
        <div className="h-4 bg-neutral-700 rounded w-1/2" />
      </div>
    )
  }

  return (
    <div className="rich-text-editor">
      {/* Toolbar - Only shown when editable */}
      {editable && (
        <div className="flex items-center gap-1 p-2 bg-neutral-800 border border-neutral-700 rounded-t-xl border-b-0">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            isActive={editor.isActive('bold')}
            icon={FaBold}
            title="Bold (Ctrl+B)"
          />
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            isActive={editor.isActive('italic')}
            icon={FaItalic}
            title="Italic (Ctrl+I)"
          />
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            isActive={editor.isActive('underline')}
            icon={FaUnderline}
            title="Underline (Ctrl+U)"
          />
          
          <div className="w-px h-6 bg-neutral-600 mx-1" />
          
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            isActive={editor.isActive('bulletList')}
            icon={FaListUl}
            title="Bullet List"
          />
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            isActive={editor.isActive('orderedList')}
            icon={FaListOl}
            title="Numbered List"
          />
          
          <div className="w-px h-6 bg-neutral-600 mx-1" />
          
          <ToolbarButton
            onClick={setLink}
            isActive={editor.isActive('link')}
            icon={FaLink}
            title="Add Link"
          />
          {editor.isActive('link') && (
            <ToolbarButton
              onClick={() => editor.chain().focus().unsetLink().run()}
              icon={FaUnlink}
              title="Remove Link"
            />
          )}
        </div>
      )}

      {/* Editor Content */}
      <div 
        className={`
          bg-neutral-800 border border-neutral-700 p-4 overflow-y-auto
          ${editable ? 'rounded-b-xl' : 'rounded-xl'}
          ${editable ? 'cursor-text' : 'cursor-default'}
        `}
        style={{ minHeight }}
        onClick={() => editable && editor.chain().focus().run()}
      >
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}

// ============================================
// READ-ONLY HTML RENDERER
// For displaying task descriptions
// ============================================

// Helper function to auto-link plain text URLs (for backward compatibility)
function autoLinkUrls(text: string): string {
  // If already contains anchor tags, don't double-process
  if (text.includes('<a ')) {
    return text
  }
  
  // URL regex pattern
  const urlPattern = /(https?:\/\/[^\s<>"{}|\\^`[\]]+)/gi
  
  return text.replace(urlPattern, (url) => {
    return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-primary-400 underline hover:text-primary-300 cursor-pointer">${url}</a>`
  })
}

interface RichTextRendererProps {
  content: string
  className?: string
}

export function RichTextRenderer({ content, className = '' }: RichTextRendererProps) {
  const [mounted, setMounted] = useState(false)
  const [sanitizedHTML, setSanitizedHTML] = useState('')

  useEffect(() => {
    setMounted(true)
    if (content && content !== '<p></p>') {
      // Auto-link plain text URLs for backward compatibility with old tasks
      const linkedContent = autoLinkUrls(content)
      
      // Sanitize HTML to prevent XSS - only on client side
      import('dompurify').then((DOMPurify) => {
        const sanitized = DOMPurify.default.sanitize(linkedContent, {
          ADD_ATTR: ['target', 'rel', 'class'],
          ADD_TAGS: ['a'],
        })
        setSanitizedHTML(sanitized)
      })
    }
  }, [content])

  if (!content || content === '<p></p>') {
    return (
      <p className="text-neutral-500 text-sm italic">No description provided</p>
    )
  }

  if (!mounted) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-neutral-700 rounded w-3/4 mb-2" />
        <div className="h-4 bg-neutral-700 rounded w-1/2" />
      </div>
    )
  }

  return (
    <div 
      className={`
        prose prose-invert prose-sm max-w-none
        prose-p:my-2 prose-p:leading-relaxed prose-p:text-neutral-300
        prose-ul:my-2 prose-ul:list-disc prose-ul:pl-6 prose-ul:text-neutral-300
        prose-ol:my-2 prose-ol:list-decimal prose-ol:pl-6 prose-ol:text-neutral-300
        prose-li:my-1 prose-li:text-neutral-300
        prose-a:text-primary-400 prose-a:underline prose-a:cursor-pointer hover:prose-a:text-primary-300
        prose-strong:text-white prose-strong:font-bold
        prose-em:italic prose-em:text-neutral-300
        ${className}
      `}
      dangerouslySetInnerHTML={{ __html: sanitizedHTML || content }}
      onClick={(e) => {
        // Handle link clicks to open in new tab
        const target = e.target as HTMLElement
        if (target.tagName === 'A') {
          e.preventDefault()
          const href = target.getAttribute('href')
          if (href) {
            window.open(href, '_blank', 'noopener,noreferrer')
          }
        }
      }}
    />
  )
}
