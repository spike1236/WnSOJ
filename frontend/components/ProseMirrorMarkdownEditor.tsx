"use client";

import { useEffect, useMemo, useRef } from "react";
import { EditorState, Plugin } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { history, redo, undo } from "prosemirror-history";
import { keymap } from "prosemirror-keymap";
import { baseKeymap, toggleMark, wrapIn } from "prosemirror-commands";
import { dropCursor } from "prosemirror-dropcursor";
import { gapCursor } from "prosemirror-gapcursor";
import { defaultMarkdownParser, defaultMarkdownSerializer } from "prosemirror-markdown";

function safeParse(markdown: string) {
  try {
    return defaultMarkdownParser.parse(markdown);
  } catch {
    return defaultMarkdownParser.parse("");
  }
}

export default function ProseMirrorMarkdownEditor({
  value,
  onChange
}: {
  value: string;
  onChange: (next: string) => void;
}) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const viewRef = useRef<EditorView | null>(null);
  const lastValueRef = useRef<string>(value);

  const plugins = useMemo(() => {
    const schema = defaultMarkdownParser.schema;
    const updatePlugin = new Plugin({
      view() {
        return {
          update(view) {
            const next = defaultMarkdownSerializer.serialize(view.state.doc);
            if (next === lastValueRef.current) return;
            lastValueRef.current = next;
            onChange(next);
          }
        };
      }
    });

    return [
      history(),
      keymap({
        "Mod-z": undo,
        "Mod-y": redo,
        "Mod-Shift-z": redo,
        "Mod-b": toggleMark(schema.marks.strong),
        "Mod-i": toggleMark(schema.marks.em),
        "Mod-`": toggleMark(schema.marks.code),
        "Ctrl->": wrapIn(schema.nodes.blockquote)
      }),
      keymap(baseKeymap),
      dropCursor(),
      gapCursor(),
      updatePlugin
    ];
  }, [onChange]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const state = EditorState.create({
      doc: safeParse(value),
      plugins
    });

    const view = new EditorView(host, {
      state,
      attributes: {
        class: "ProseMirror prose-mirror"
      }
    });

    viewRef.current = view;
    lastValueRef.current = value;

    return () => {
      viewRef.current?.destroy();
      viewRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    if (value === lastValueRef.current) return;

    lastValueRef.current = value;
    const nextState = EditorState.create({
      doc: safeParse(value),
      plugins
    });
    view.updateState(nextState);
  }, [plugins, value]);

  return <div ref={hostRef} />;
}

