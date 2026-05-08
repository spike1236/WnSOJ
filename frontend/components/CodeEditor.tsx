"use client";

import { cn } from "@/lib/cn";
import CodeMirror from "@uiw/react-codemirror";
import { cpp } from "@codemirror/lang-cpp";
import { defaultHighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { python } from "@codemirror/lang-python";
import { EditorView } from "@codemirror/view";
import { oneDark } from "@codemirror/theme-one-dark";
import { githubLight } from "@uiw/codemirror-theme-github";
import { useMemo, useState } from "react";
import { useResolvedTheme, type ThemeMode } from "@/lib/useResolvedTheme";

const languageOptions = [
  { value: "cpp", label: "GNU C++23" },
  { value: "py", label: "Python 3.12" }
];

const themeOptions = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" }
];

export default function CodeEditor({
  name,
  defaultLanguage = "cpp",
  defaultTheme = "system",
  defaultValue = ""
}: {
  name: string;
  defaultLanguage?: "cpp" | "py";
  defaultTheme?: ThemeMode;
  defaultValue?: string;
}) {
  const [language, setLanguage] = useState(defaultLanguage);
  const [theme, setTheme] = useState(defaultTheme);
  const [value, setValue] = useState(defaultValue);
  const resolvedTheme = useResolvedTheme(theme);

  const extensions = useMemo(() => {
    const lang = language === "py" ? python() : cpp();
    return [lang, EditorView.lineWrapping, syntaxHighlighting(defaultHighlightStyle, { fallback: true })];
  }, [language]);

  const cmTheme = useMemo(() => {
    return resolvedTheme === "dark" ? oneDark : githubLight;
  }, [resolvedTheme]);

  return (
    <div className="surface overflow-hidden">
      <div className="flex flex-col gap-3 border-b bg-slate-50/80 p-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Language</span>
            <select
              className="h-9 rounded-[8px] border bg-white px-2 text-sm outline-none ring-blue-600 focus:ring-2"
              name="language"
              onChange={(e) => setLanguage(e.target.value as "cpp" | "py")}
              value={language}
            >
              {languageOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Theme</span>
            <select
              className="h-9 rounded-[8px] border bg-white px-2 text-sm outline-none ring-blue-600 focus:ring-2"
              onChange={(e) => setTheme(e.target.value as ThemeMode)}
              value={theme}
            >
              {themeOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
      <CodeMirror
        basicSetup={{
          lineNumbers: true,
          highlightActiveLine: true,
          highlightActiveLineGutter: true,
          foldGutter: true
        }}
        className="overflow-hidden"
        extensions={extensions}
        height="420px"
        onChange={(v) => setValue(v)}
        theme={cmTheme}
        value={value}
      />
      <textarea className={cn("hidden")} name={name} readOnly value={value} />
    </div>
  );
}
