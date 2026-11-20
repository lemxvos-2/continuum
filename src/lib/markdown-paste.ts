import { Marked } from "marked";

const BLOCK_PATTERNS = [
  /^#{1,6}\s+\S/m,
  /^\s*[-*+]\s+\[[ xX]\]\s+/m,
  /^\s*[-*+]\s+\S/m,
  /^\s*\d+\.\s+\S/m,
  /^>\s?\S/m,
  /^```/m,
  /^\s*(-{3,}|\*{3,})\s*$/m,
  /^\|.+\|\s*$/m,
];
const INLINE_PATTERNS = [
  /\*\*[^*\n]+\*\*/,
  /__[^_\n]+__/,
  /~~[^~\n]+~~/,
  /`[^`\n]+`/,
  /\[[^\]\n]+\]\([^)\s]+\)/,
  /(^|\s)\*[^*\s][^*\n]*\*(?=\s|$|[.,!?])/,
];

export function looksLikeMarkdown(text: string): boolean {
  if (!text || !text.trim()) return false;
  return BLOCK_PATTERNS.some((r) => r.test(text)) || INLINE_PATTERNS.some((r) => r.test(text));
}

export function isInlineMarkdown(text: string): boolean {
  return !text.includes("\n") && !BLOCK_PATTERNS.some((r) => r.test(text));
}

const md = new Marked({ gfm: true, breaks: false });
md.use({
  renderer: {
    list(token) {
      if (token.items.some((i) => i.task)) {
        const body = token.items
          .map((item) => {
            const inner = this.parser.parse(item.tokens.filter((t) => t.type !== "checkbox"))
              .replace(/^<input[^>]*>\s*/, "");
            const content = /^\s*<p>/.test(inner) ? inner : `<p>${inner}</p>`;
            return `<li data-type="taskItem" data-checked="${!!item.checked}">${content}</li>`;
          })
          .join("");
        return `<ul data-type="taskList">${body}</ul>\n`;
      }
      return false;
    },
  },
});

export function markdownToHtml(text: string): string {
  const normalized = text.replace(/\r\n?/g, "\n");
  if (isInlineMarkdown(normalized)) return md.parseInline(normalized) as string;
  return md.parse(normalized) as string;
}
