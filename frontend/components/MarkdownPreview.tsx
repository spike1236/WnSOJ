"use client";

import ReactMarkdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";

export default function MarkdownPreview({ content }: { content: string }) {
  return (
    <div className="prose-md">
      <ReactMarkdown
        rehypePlugins={[rehypeRaw, rehypeKatex]}
        remarkPlugins={[remarkGfm, remarkMath, remarkBreaks]}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

