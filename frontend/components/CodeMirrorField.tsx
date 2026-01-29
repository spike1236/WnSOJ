"use client";

import CodeMirror from "@uiw/react-codemirror";
import { cpp } from "@codemirror/lang-cpp";
import { markdown as markdownLanguage } from "@codemirror/lang-markdown";
import { python } from "@codemirror/lang-python";
import { EditorView } from "@codemirror/view";
import { oneDark } from "@codemirror/theme-one-dark";
import { useMemo, useState } from "react";

type FieldLanguage = "cpp" | "py" | "markdown" | "text";

export default function CodeMirrorField({
  name,
  defaultValue = "",
  language = "text",
  height = "240px",
  theme = "light"
}: {
  name: string;
  defaultValue?: string;
  language?: FieldLanguage;
  height?: string;
  theme?: "light" | "dark";
}) {
  const [value, setValue] = useState(defaultValue);

  const extensions = useMemo(() => {
    const lang =
      language === "cpp"
        ? cpp()
        : language === "py"
          ? python()
          : language === "markdown"
            ? markdownLanguage()
            : [];
    return [lang, EditorView.lineWrapping];
  }, [language]);

  const cmTheme = useMemo(() => {
    return theme === "dark" ? oneDark : undefined;
  }, [theme]);

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

