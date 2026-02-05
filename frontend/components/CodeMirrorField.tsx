"use client";

import CodeMirror from "@uiw/react-codemirror";
import { cpp } from "@codemirror/lang-cpp";
import { defaultHighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { markdown as markdownLanguage } from "@codemirror/lang-markdown";
import { python } from "@codemirror/lang-python";
import { EditorView } from "@codemirror/view";
import { oneDark } from "@codemirror/theme-one-dark";
import { githubLight } from "@uiw/codemirror-theme-github";
import { useEffect, useMemo, useState } from "react";
import { useResolvedTheme, type ThemeMode } from "@/lib/useResolvedTheme";

type FieldLanguage = "cpp" | "py" | "markdown" | "text";

export default function CodeMirrorField({
  name,
  defaultValue = "",
  language = "text",
  height = "240px",
  theme = "system"
}: {
  name: string;
  defaultValue?: string;
  language?: FieldLanguage;
  height?: string;
  theme?: ThemeMode;
}) {
  const [value, setValue] = useState(defaultValue);
  const resolvedTheme = useResolvedTheme(theme);

  useEffect(() => {
    setValue(defaultValue);
  }, [defaultValue]);

  const extensions = useMemo(() => {
    const lang =
      language === "cpp"
        ? cpp()
        : language === "py"
          ? python()
          : language === "markdown"
            ? markdownLanguage()
            : [];
    return [lang, EditorView.lineWrapping, syntaxHighlighting(defaultHighlightStyle, { fallback: true })];
  }, [language]);

  const cmTheme = useMemo(() => {
    return resolvedTheme === "dark" ? oneDark : githubLight;
  }, [resolvedTheme]);

  return (
    <div className="rounded-2xl border bg-white shadow-sm">
      <CodeMirror
        basicSetup={{
          lineNumbers: true,
          highlightActiveLine: true,
          highlightActiveLineGutter: true,
          foldGutter: true
        }}
        className="overflow-hidden rounded-2xl"
        extensions={extensions}
        height={height}
        onChange={(v) => setValue(v)}
        theme={cmTheme}
        value={value}
      />
      <textarea className="hidden" name={name} readOnly value={value} />
    </div>
  );
}
