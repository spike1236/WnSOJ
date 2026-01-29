"use client";

import { cn } from "@/lib/cn";
import CodeMirror from "@uiw/react-codemirror";
import { cpp } from "@codemirror/lang-cpp";
import { python } from "@codemirror/lang-python";
import { EditorView } from "@codemirror/view";
import { oneDark } from "@codemirror/theme-one-dark";
import { useMemo, useState } from "react";

const languageOptions = [
  { value: "cpp", label: "GNU C++17" },
  { value: "py", label: "Python 3" }
];

const themeOptions = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" }
];

export default function CodeEditor({
  name,
  defaultLanguage = "cpp",
  defaultTheme = "dark",
  defaultValue = ""
}: {
  name: string;
  defaultLanguage?: "cpp" | "py";
  defaultTheme?: "light" | "dark";
  defaultValue?: string;
}) {
  const [language, setLanguage] = useState(defaultLanguage);
  const [theme, setTheme] = useState(defaultTheme);
  const [value, setValue] = useState(defaultValue);

  const extensions = useMemo(() => {
    const lang = language === "py" ? python() : cpp();
    return [lang, EditorView.lineWrapping];
  }, [language]);

  const cmTheme = useMemo(() => {
    return theme === "dark" ? oneDark : undefined;
  }, [theme]);

  return (
    <div className="rounded-2xl border bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b bg-slate-50 p-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-600">Language</span>
            <select
              className="h-9 rounded-lg border bg-white px-2 text-sm outline-none ring-blue-600 focus:ring-2"
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
            <span className="text-xs font-semibold text-slate-600">Theme</span>
            <select
              className="h-9 rounded-lg border bg-white px-2 text-sm outline-none ring-blue-600 focus:ring-2"
              onChange={(e) => setTheme(e.target.value as "light" | "dark")}
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
        <div className="text-xs text-slate-500">Source code is submitted to the judge for testing.</div>
      </div>
      <CodeMirror
        basicSetup={{
          lineNumbers: true,
          highlightActiveLine: true,
          highlightActiveLineGutter: true,
          foldGutter: true
        }}
        className="overflow-hidden rounded-b-2xl"
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
