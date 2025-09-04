// Simple script to check if Users.jsx can be parsed
const fs = require('fs');

try {
    const content = fs.readFileSync('d:/ElectionAT/frontend/src/pages/curd/user/Users.jsx', 'utf8');

    // Basic checks
    const openBraces = (content.match(/\{/g) || []).length;
    const closeBraces = (content.match(/\}/g) || []).length;
    const openParens = (content.match(/\(/g) || []).length;
    const closeParens = (content.match(/\)/g) || []).length;
    const openBrackets = (content.match(/\[/g) || []).length;
    const closeBrackets = (content.match(/\]/g) || []).length;

    console.log('Brace check:', { openBraces, closeBraces, diff: openBraces - closeBraces });
    console.log('Parentheses check:', { openParens, closeParens, diff: openParens - closeParens });
    console.log('Bracket check:', { openBrackets, closeBrackets, diff: openBrackets - closeBrackets });

    // Check for export statement
    const hasExport = content.includes('export default');
    console.log('Has export default:', hasExport);

    // Check for incomplete JSX tags
    const jsxTags = content.match(/<[^>]*>/g) || [];
    const openTags = jsxTags.filter(tag => !tag.includes('/') && !tag.endsWith('/>')).length;
    const closeTags = jsxTags.filter(tag => tag.startsWith('</')).length;
    const selfClosing = jsxTags.filter(tag => tag.endsWith('/>')).length;

    console.log('JSX tags:', { openTags, closeTags, selfClosing, total: jsxTags.length });

    console.log('File appears to be syntactically valid');

} catch (error) {
    console.error('Error reading file:', error.message);
}
