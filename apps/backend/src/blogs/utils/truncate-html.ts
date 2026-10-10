import { parseDocument } from 'htmlparser2';
import render from 'dom-serializer';
import { hasChildren, isText, type AnyNode, type ParentNode } from 'domhandler';

// A word plus the whitespace before it, so joining a prefix keeps the spacing.
const WORD = /\s*\S+/g;

const countWords = (node: AnyNode): number => {
  if (isText(node)) return node.data.match(WORD)?.length ?? 0;
  if (!hasChildren(node)) return 0;
  return node.children.reduce((total, child) => total + countWords(child), 0);
};

// Words in the text only, measured the same way as the cut below.
export const countHtmlWords = (html: string): number =>
  countWords(parseDocument(html));

// Spends `budget` words in document order and drops every node after the cut.
const cutAfter = (parent: ParentNode, budget: number): number => {
  const { children } = parent;

  for (let index = 0; index < children.length; index++) {
    if (budget <= 0) {
      children.length = index;
      break;
    }

    const node = children[index];

    if (isText(node)) {
      const words = node.data.match(WORD) ?? [];
      if (words.length > budget) node.data = words.slice(0, budget).join('');
      budget -= Math.min(words.length, budget);
    } else if (hasChildren(node)) {
      budget = cutAfter(node, budget);
    }
  }

  return budget;
};

/**
 * The first `ratio` of the words in an HTML body, counted from text only so
 * tags and attributes never count. The tree is re-serialized, so every tag
 * open at the cut is closed.
 */
export const truncateHtmlByWords = (html: string, ratio = 0.5): string => {
  const document = parseDocument(html);
  cutAfter(document, Math.floor(countWords(document) * ratio));
  return render(document, { encodeEntities: 'utf8' });
};
