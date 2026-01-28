"use client";

import { cn } from "@/lib/cn";
import Editor from "@monaco-editor/react";
import { useMemo, useState } from "react";

const languageOptions = [
  { value: "cpp", label: "GNU C++17", monaco: "cpp" },
  { value: "py", label: "Python 3", monaco: "python" }
];

const themeOptions = [
  { value: "light", label: "Light", monaco: "light" },
  { value: "dark", label: "Dark", monaco: "vs-dark" }
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

  const monacoLanguage = useMemo(() => {
    return languageOptions.find((l) => l.value === language)?.monaco ?? "cpp";
  }, [language]);

  const monacoTheme = useMemo(() => {
    return themeOptions.find((t) => t.value === theme)?.monaco ?? "vs-dark";
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
      <div className="h-[420px]">
        <Editor
          language={monacoLanguage}
          onChange={(v) => setValue(v ?? "")}
          options={{
            fontSize: 14,
            minimap: { enabled: false },
            wordWrap: "on",
            scrollBeyondLastLine: false
          }}
          theme={monacoTheme}
          value={value}
        />
      </div>
      <textarea className={cn("hidden")} name={name} readOnly value={value} />
    </div>
  );
}

