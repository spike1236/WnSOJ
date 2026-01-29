"use client";

import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { Markdown } from "tiptap-markdown";
import { useEffect, useMemo, useRef } from "react";

function ToolbarButton({
  active = false,
  disabled = false,
  label,
  onClick
}: {
  active?: boolean;
  disabled?: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className={[
        "inline-flex h-9 items-center justify-center rounded-lg border px-3 text-sm font-medium",
        active ? "bg-slate-900 text-white" : "bg-white hover:bg-slate-50",
        disabled ? "opacity-50 hover:bg-white" : ""
      ].join(" ")}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  );
}

export default function TiptapMarkdownEditor({
  value,
  onChange,
  height,
  theme
}: {
  value: string;
  onChange: (next: string) => void;
  height: string;
  theme: "light" | "dark";
}) {
  const lastValueRef = useRef<string>(value);

  const extensions = useMemo(() => {
    return [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] }
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        linkOnPaste: true
      }),
      Placeholder.configure({
        placeholder: "Write here…"
      }),
      Markdown.configure({
        transformPastedText: true
      })
    ];
  }, []);

  const editor = useEditor({
    extensions,
    content: value,
    editorProps: {
      attributes: {
        class: "ProseMirror focus:outline-none"
      }
    },
    onUpdate({ editor }) {
      const storage = editor.storage as { markdown?: { getMarkdown?: () => string } };
      const next = storage.markdown?.getMarkdown?.() ?? "";
      if (next === lastValueRef.current) return;
      lastValueRef.current = next;
      onChange(next);
    }
  });

  useEffect(() => {
    if (!editor) return;
    if (value === lastValueRef.current) return;
    lastValueRef.current = value;
    editor.commands.setContent(value);
  }, [editor, value]);

  const containerClass =
    theme === "dark"
      ? "overflow-auto rounded-xl border border-slate-800 bg-slate-950 p-3 text-slate-100"
      : "overflow-auto rounded-xl border bg-white p-3 text-slate-900";

  return (
    <div className="grid gap-3 rounded-xl border bg-slate-50 p-3">
      <div className="flex flex-wrap gap-2">
        <ToolbarButton
          active={!!editor?.isActive("bold")}
          disabled={!editor}
          label="Bold"
          onClick={() => editor?.chain().focus().toggleBold().run()}
        />
        <ToolbarButton
          active={!!editor?.isActive("italic")}
          disabled={!editor}
          label="Italic"
          onClick={() => editor?.chain().focus().toggleItalic().run()}
        />
        <ToolbarButton
          active={!!editor?.isActive("code")}
          disabled={!editor}
          label="Code"
          onClick={() => editor?.chain().focus().toggleCode().run()}
        />
        <ToolbarButton
          active={!!editor?.isActive("bulletList")}
          disabled={!editor}
          label="Bullets"
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
        />
        <ToolbarButton
          active={!!editor?.isActive("orderedList")}
          disabled={!editor}
          label="Numbered"
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
        />
        <ToolbarButton
          active={!!editor?.isActive("blockquote")}
          disabled={!editor}
          label="Quote"
          onClick={() => editor?.chain().focus().toggleBlockquote().run()}
        />
        <ToolbarButton
          active={!!editor?.isActive("heading", { level: 2 })}
          disabled={!editor}
          label="H2"
          onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
        />
        <ToolbarButton
          disabled={!editor}
          label="Link"
          onClick={() => {
            if (!editor) return;
            const previous = editor.getAttributes("link").href as string | undefined;
            const url = window.prompt("Link URL", previous ?? "");
            if (url === null) return;
            if (!url.trim()) {
              editor.chain().focus().unsetLink().run();
              return;
            }
            editor.chain().focus().setLink({ href: url.trim() }).run();
          }}
        />
        <ToolbarButton disabled={!editor} label="Undo" onClick={() => editor?.chain().focus().undo().run()} />
        <ToolbarButton disabled={!editor} label="Redo" onClick={() => editor?.chain().focus().redo().run()} />
      </div>

      <div className={containerClass} style={{ height }}>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

