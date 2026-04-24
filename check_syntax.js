const code = require('fs').readFileSync('js/data.js', 'utf8');
const cleaned = code
  .replace(/getPastDate\(\d+\)/g, '"2026-04-01"')
  .replace(/getFutureDate\(\d+\)/g, '"2026-06-30"')
  .replace(/new Date\('[^']+'\)/g, 'new Date()')
  .replace(/new Date\(\)/g, 'new Date()');
try {
  new Function(cleaned)();
  console.log('✅ SYNTAX OK');
} catch(e) {
  console.log('❌ SYNTAX ERROR:', e.message);
  // Find line number
  const lines = cleaned.split('\n');
  const match = e.stack && e.stack.match(/<anonymous>:(\d+)/);
  if (match) {
    const lineNum = parseInt(match[1]);
    console.log('Near line', lineNum, ':', lines.slice(lineNum-3, lineNum+2).join('\n'));
  }
}
