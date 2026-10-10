import { countHtmlWords, truncateHtmlByWords } from './truncate-html';

describe('truncateHtmlByWords', () => {
  it('keeps the first half of the words', () => {
    expect(
      truncateHtmlByWords(
        '<p>one two three four</p><p>five six seven eight</p>',
      ),
    ).toBe('<p>one two three four</p>');
  });

  // A fixed character or word limit would leave a short blog untouched.
  it('scales the cut to the length of the blog', () => {
    expect(truncateHtmlByWords('<p>one two three four</p>')).toBe(
      '<p>one two</p>',
    );
  });

  it('cuts inside a text node and closes every open tag', () => {
    expect(
      truncateHtmlByWords(
        '<ul><li><p>alpha beta</p></li><li><p>gamma <strong>delta epsilon</strong> zeta</p></li></ul><p>eta theta iota kappa</p>',
      ),
    ).toBe(
      '<ul><li><p>alpha beta</p></li><li><p>gamma <strong>delta epsilon</strong></p></li></ul>',
    );
  });

  it('never counts tags or attributes as words', () => {
    expect(
      truncateHtmlByWords(
        '<p><a href="https://example.com/a long path" class="x y z">one two</a></p><p>three four</p>',
      ),
    ).toBe(
      '<p><a href="https://example.com/a long path" class="x y z">one two</a></p>',
    );
  });

  it('keeps characters as they are rather than encoding them', () => {
    expect(
      truncateHtmlByWords('<p>Tom &amp; Jerry — café</p><p>a b c d e</p>'),
    ).toBe('<p>Tom &amp; Jerry — café</p>');
  });

  it('returns an empty string for a body with no words', () => {
    expect(truncateHtmlByWords('<p></p>')).toBe('');
  });
});

describe('countHtmlWords', () => {
  it('counts words in text only, never tags or attributes', () => {
    expect(
      countHtmlWords(
        '<h2>A heading</h2><p><a href="https://example.com/a b" class="x y">one two</a> three</p>',
      ),
    ).toBe(5);
  });

  it('returns zero for a body with no words', () => {
    expect(countHtmlWords('<p></p>')).toBe(0);
  });
});
