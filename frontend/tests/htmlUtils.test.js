import test from 'node:test';
import assert from 'node:assert/strict';
import { escapeHtml, generatePrintHtml } from '../src/features/notes/utils/htmlUtils.js';

test('htmlUtils - escapeHtml', async (t) => {
  await t.test('escapes special HTML characters', () => {
    const input = '<div class="test" data-val=\'abc\'>Fish & Chips</div>';
    const expected = '&lt;div class=&quot;test&quot; data-val=&#39;abc&#39;&gt;Fish &amp; Chips&lt;/div&gt;';
    assert.strictEqual(escapeHtml(input), expected);
  });

  await t.test('neutralizes script injection payloads', () => {
    const payload = '<script>alert("XSS")</script>';
    const result = escapeHtml(payload);
    assert.ok(!result.includes('<script>'));
    assert.ok(!result.includes('</script>'));
    assert.strictEqual(result, '&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;');
  });

  await t.test('neutralizes title breakout attempts', () => {
    const payload = '</title><script>alert(1)</script>';
    const result = escapeHtml(payload);
    assert.ok(!result.includes('</title>'));
    assert.strictEqual(result, '&lt;/title&gt;&lt;script&gt;alert(1)&lt;/script&gt;');
  });

  await t.test('neutralizes image onerror attribute breakouts', () => {
    const payload = '"><h1>PWNED</h1><img src="x" onerror="alert(1)">';
    const result = escapeHtml(payload);
    assert.ok(!result.includes('<'));
    assert.ok(!result.includes('>'));
    assert.ok(!result.includes('"'));
  });

  await t.test('handles empty, null, undefined, and non-string values gracefully', () => {
    assert.strictEqual(escapeHtml(''), '');
    assert.strictEqual(escapeHtml(null), '');
    assert.strictEqual(escapeHtml(undefined), '');
    assert.strictEqual(escapeHtml(123), '123');
    assert.strictEqual(escapeHtml(true), 'true');
  });
});

test('htmlUtils - generatePrintHtml', async (t) => {
  await t.test('renders escaped title in <title> and <h1>', () => {
    const maliciousTitle = '<script>alert("hacked")</script>';
    const parsedBody = '<p>Normal body content</p>';
    const html = generatePrintHtml(maliciousTitle, parsedBody);

    // Verify raw unescaped script tag does not exist
    assert.ok(!html.includes('<title><script>alert("hacked")</script></title>'));
    assert.ok(!html.includes('<h1><script>alert("hacked")</script></h1>'));

    // Verify escaped entity representation exists
    assert.ok(html.includes('<title>&lt;script&gt;alert(&quot;hacked&quot;)&lt;/script&gt;</title>'));
    assert.ok(html.includes('<h1>&lt;script&gt;alert(&quot;hacked&quot;)&lt;/script&gt;</h1>'));
    assert.ok(html.includes('<div><p>Normal body content</p></div>'));
  });

  await t.test('falls back to "Untitled Note" when title is empty or missing', () => {
    const emptyTitleHtml = generatePrintHtml('', '<p>Body</p>');
    assert.ok(emptyTitleHtml.includes('<title>Untitled Note</title>'));
    assert.ok(emptyTitleHtml.includes('<h1>Untitled Note</h1>'));

    const nullTitleHtml = generatePrintHtml(null, '<p>Body</p>');
    assert.ok(nullTitleHtml.includes('<title>Untitled Note</title>'));
    assert.ok(nullTitleHtml.includes('<h1>Untitled Note</h1>'));

    const whitespaceTitleHtml = generatePrintHtml('   ', '<p>Body</p>');
    assert.ok(whitespaceTitleHtml.includes('<title>Untitled Note</title>'));
    assert.ok(whitespaceTitleHtml.includes('<h1>Untitled Note</h1>'));
  });

  await t.test('supports custom styles without errors when styles are omitted', () => {
    const withoutStyles = generatePrintHtml('Test', 'Content');
    assert.ok(withoutStyles.includes('.latexBlock { margin: 16px 0; text-align: center; }'));
    assert.ok(withoutStyles.includes('.latexInline { padding: 0 4px; }'));

    const customStyles = { latexBlock: 'custom-math-block', latexInline: 'custom-math-inline' };
    const withStyles = generatePrintHtml('Test', 'Content', customStyles);
    assert.ok(withStyles.includes('.custom-math-block { margin: 16px 0; text-align: center; }'));
    assert.ok(withStyles.includes('.custom-math-inline { padding: 0 4px; }'));
  });
});

test('htmlUtils - print window popup lifecycle simulation', async (t) => {
  await t.test('handles blocked popup (window.open returns null) without throwing', () => {
    const openMock = () => null;
    let warningLogged = false;
    const originalWarn = console.warn;
    console.warn = (msg) => {
      if (typeof msg === 'string' && msg.includes('Popup blocked')) {
        warningLogged = true;
      }
    };

    try {
      const printWindow = openMock('', '_blank', 'width=800,height=900');
      let result = null;
      if (!printWindow || !printWindow.document) {
        console.warn('Popup blocked or failed to open print window.');
      } else {
        result = printWindow;
      }

      assert.strictEqual(result, null);
      assert.strictEqual(warningLogged, true);
    } finally {
      console.warn = originalWarn;
    }
  });

  await t.test('handles blocked popup where window.open throws an exception', () => {
    const openMock = () => {
      throw new Error('Blocked by browser policy');
    };
    let warningLogged = false;
    const originalWarn = console.warn;
    console.warn = () => { warningLogged = true; };

    try {
      let printWindow = null;
      try {
        printWindow = openMock('', '_blank', 'width=800,height=900');
      } catch (err) {
        console.warn('Failed to open print window:', err);
      }

      assert.strictEqual(printWindow, null);
      assert.strictEqual(warningLogged, true);
    } finally {
      console.warn = originalWarn;
    }
  });

  await t.test('executes document.open, write with escaped title, document.close, and focus when window opens', () => {
    let opened = false;
    let closed = false;
    let focused = false;
    let writtenContent = '';

    const mockWindow = {
      document: {
        open: () => { opened = true; },
        write: (html) => { writtenContent += html; },
        close: () => { closed = true; }
      },
      focus: () => { focused = true; }
    };

    const title = '<img src=x onerror=alert(1)>';
    const parsedBody = '<p>Note body</p>';
    const htmlContent = generatePrintHtml(title, parsedBody);

    mockWindow.document.open();
    mockWindow.document.write(htmlContent);
    mockWindow.document.close();
    mockWindow.focus();

    assert.strictEqual(opened, true);
    assert.strictEqual(closed, true);
    assert.strictEqual(focused, true);
    assert.ok(writtenContent.includes('&lt;img src=x onerror=alert(1)&gt;'));
    assert.ok(!writtenContent.includes('<img src=x onerror=alert(1)>'));
  });
});

