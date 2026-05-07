import React from "react";

type MarkdownRendererProps = {
  content: string;
  className?: string;
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatInlineMarkdown(value: string) {
  const escapedValue = escapeHtml(value);
  const codePlaceholders: string[] = [];

  const protectedCode = escapedValue.replace(/`([^`]+)`/g, (_, codeContent: string) => {
    const placeholder = `__CODE_PLACEHOLDER_${codePlaceholders.length}__`;
    codePlaceholders.push(`<code>${codeContent}</code>`);
    return placeholder;
  });

  const formattedValue = protectedCode
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/~~(.+?)~~/g, "<del>$1</del>")
    .replace(/(?<!\*)\*(?!\s)(.+?)(?<!\s)\*(?!\*)/g, "<em>$1</em>")
    .replace(
      /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
      '<a href="$2" target="_blank" rel="noreferrer">$1</a>',
    );

  return codePlaceholders.reduce(
    (currentValue, codeSnippet, index) =>
      currentValue.replace(`__CODE_PLACEHOLDER_${index}__`, codeSnippet),
    formattedValue,
  );
}

function renderMarkdown(content: string) {
  const lines = content.replace(/\r\n/g, "\n").split("\n");
  const blocks: string[] = [];
  let currentParagraph: string[] = [];
  let currentList: string[] = [];
  let currentOrderedList: string[] = [];
  let currentQuote: string[] = [];
  let currentCodeBlock: string[] = [];
  let isCodeBlock = false;

  const flushParagraph = () => {
    if (currentParagraph.length > 0) {
      blocks.push(`<p>${currentParagraph.map(formatInlineMarkdown).join("<br />")}</p>`);
      currentParagraph = [];
    }
  };

  const flushLists = () => {
    if (currentList.length > 0) {
      blocks.push(`<ul>${currentList.map((item) => `<li>${formatInlineMarkdown(item)}</li>`).join("")}</ul>`);
      currentList = [];
    }

    if (currentOrderedList.length > 0) {
      blocks.push(`<ol>${currentOrderedList.map((item) => `<li>${formatInlineMarkdown(item)}</li>`).join("")}</ol>`);
      currentOrderedList = [];
    }
  };

  const flushQuote = () => {
    if (currentQuote.length > 0) {
      blocks.push(
        `<blockquote>${currentQuote.map((item) => `<p>${formatInlineMarkdown(item)}</p>`).join("")}</blockquote>`,
      );
      currentQuote = [];
    }
  };

  const flushCodeBlock = () => {
    if (currentCodeBlock.length > 0) {
      blocks.push(`<pre><code>${escapeHtml(currentCodeBlock.join("\n"))}</code></pre>`);
      currentCodeBlock = [];
    }
  };

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();

    if (line.trim().startsWith("```")) {
      flushParagraph();
      flushLists();
      flushQuote();

      if (isCodeBlock) {
        flushCodeBlock();
        isCodeBlock = false;
      } else {
        isCodeBlock = true;
      }

      continue;
    }

    if (isCodeBlock) {
      currentCodeBlock.push(rawLine);
      continue;
    }

    if (!line.trim()) {
      flushParagraph();
      flushLists();
      flushQuote();
      continue;
    }

    const quoteMatch = /^>\s?(.*)$/.exec(line.trim());
    if (quoteMatch) {
      flushParagraph();
      flushLists();
      currentQuote.push(quoteMatch[1]);
      continue;
    }

    flushQuote();

    const headingMatch = /^(#{1,3})\s+(.*)$/.exec(line.trim());
    if (headingMatch) {
      flushParagraph();
      flushLists();
      const headingLevel = headingMatch[1].length;
      blocks.push(`<h${headingLevel}>${formatInlineMarkdown(headingMatch[2])}</h${headingLevel}>`);
      continue;
    }

    const bulletMatch = /^[-*]\s+(.*)$/.exec(line.trim());
    if (bulletMatch) {
      flushParagraph();
      currentList.push(bulletMatch[1]);
      continue;
    }

    const orderedMatch = /^\d+\.\s+(.*)$/.exec(line.trim());
    if (orderedMatch) {
      flushParagraph();
      currentOrderedList.push(orderedMatch[1]);
      continue;
    }

    flushLists();
    currentParagraph.push(line);
  }

  flushParagraph();
  flushLists();
  flushQuote();
  flushCodeBlock();

  return blocks.join("");
}

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
    />
  );
}