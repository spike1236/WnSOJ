import ReactMarkdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";

export default function Markdown({ content }: { content: string }) {
  return (
    <div className="prose-md">
      <ReactMarkdown
        rehypePlugins={[rehypeKatex]}
        remarkPlugins={[remarkGfm, remarkMath, remarkBreaks]}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
