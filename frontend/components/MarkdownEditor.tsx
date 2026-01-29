"use client";

import { useMemo, useState } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { markdown as markdownLanguage } from "@codemirror/lang-markdown";
import { EditorView } from "@codemirror/view";
import { oneDark } from "@codemirror/theme-one-dark";
import MarkdownPreview from "@/components/MarkdownPreview";
import ProseMirrorMarkdownEditor from "@/components/ProseMirrorMarkdownEditor";

type ViewMode = "write" | "preview" | "split";
type EditorMode = "markdown" | "rich";

export default function MarkdownEditor({
  name,
  defaultValue = "",
  height = "320px"
}: {
  name: string;
  defaultValue?: string;
  height?: string;
}) {
  const [value, setValue] = useState(defaultValue);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [mode, setMode] = useState<EditorMode>("markdown");
  const [view, setView] = useState<ViewMode>("split");

  const extensions = useMemo(() => {
    return [markdownLanguage(), EditorView.lineWrapping];
  }, []);

  const cmTheme = useMemo(() => {
    return theme === "dark" ? oneDark : undefined;
  }, [theme]);

  return (
    <div className="rounded-2xl border bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b bg-slate-50 p-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-600">Editor</span>
            <select
              className="h-9 rounded-lg border bg-white px-2 text-sm outline-none ring-blue-600 focus:ring-2"
              onChange={(e) => setMode(e.target.value as EditorMode)}
              value={mode}
            >
              <option value="markdown">Markdown</option>
              <option value="rich">Rich text</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-600">View</span>
            <select
              className="h-9 rounded-lg border bg-white px-2 text-sm outline-none ring-blue-600 focus:ring-2"
              onChange={(e) => setView(e.target.value as ViewMode)}
              value={view}
            >
              <option value="split">Split</option>
              <option value="write">Write</option>
              <option value="preview">Preview</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-600">Theme</span>
            <select
              className="h-9 rounded-lg border bg-white px-2 text-sm outline-none ring-blue-600 focus:ring-2"
              onChange={(e) => setTheme(e.target.value as "light" | "dark")}
              value={theme}
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </div>
        </div>
        <div className="text-xs text-slate-500">Changes are saved as Markdown.</div>
      </div>

      <div className={view === "split" ? "grid gap-4 p-4 md:grid-cols-2" : "p-4"}>
        {view !== "preview" ? (
          mode === "rich" ? (
            <div className="overflow-auto rounded-xl border bg-white p-3" style={{ height }}>
              <ProseMirrorMarkdownEditor onChange={setValue} value={value} />
            </div>
          ) : (
            <div className="rounded-xl border">
              <CodeMirror
                basicSetup={{
                  lineNumbers: true,
                  highlightActiveLine: true,
                  highlightActiveLineGutter: true,
                  foldGutter: true
                }}
                className="overflow-hidden rounded-xl"
                extensions={extensions}
                height={height}
                onChange={(v) => setValue(v)}
                theme={cmTheme}
                value={value}
              />
            </div>
          )
        ) : null}

        {view !== "write" ? (
          <div className="overflow-auto rounded-xl border bg-white p-4" style={{ height }}>
            <MarkdownPreview content={value || ""} />
          </div>
        ) : null}
      </div>

      <textarea className="hidden" name={name} readOnly value={value} />
    </div>
  );
}
