import { describe, it, expect } from "vitest";
import { looksLikeMarkdown, markdownToHtml } from "@/lib/markdown-paste";

describe("markdown paste", () => {
  it("ignores plain text", () => {
    expect(looksLikeMarkdown("Só um texto normal, sem nada.")).toBe(false);
  });
  it("detects headings and bold", () => {
    expect(looksLikeMarkdown("# Título")).toBe(true);
    expect(looksLikeMarkdown("um **destaque** aqui")).toBe(true);
  });
  it("converts headings", () => {
    expect(markdownToHtml("# Título\n\ntexto")).toContain("<h1>Título</h1>");
  });
  it("converts task lists to tiptap format", () => {
    const html = markdownToHtml("- [ ] a\n- [x] b");
    expect(html).toContain('data-type="taskList"');
    expect(html).toContain('data-checked="true"');
    expect(html).not.toContain("<input");
  });
  it("keeps inline markdown inline", () => {
    expect(markdownToHtml("um **x**")).toBe("um <strong>x</strong>");
  });
});
