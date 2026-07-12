const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else { 
      if (file.endsWith('.tsx') || file.endsWith('.ts')) results.push(file);
    }
  });
  return results;
}

const files = walk('./app');
let changed = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // Find any className that contains bg-primary and text-foreground and replace text-foreground with text-primary-foreground
  content = content.replace(/className=\"([^\"]*bg-primary[^\"]*)\"/g, (match, classList) => {
    if (classList.includes('text-foreground')) {
      return `className=\"${classList.replace('text-foreground', 'text-primary-foreground shadow-sm')}\"`;
    }
    return match;
  });

  // Also replace any bg-blue-500/600 text-foreground
  content = content.replace(/className=\"([^\"]*bg-blue-[56]00[^\"]*)\"/g, (match, classList) => {
    if (classList.includes('text-foreground')) {
      return `className=\"${classList.replace('text-foreground', 'text-white shadow-sm')}\"`;
    }
    return match;
  });

  if (content !== original) {
    fs.writeFileSync(file, content);
    console.log('Fixed:', file);
    changed++;
  }
});

console.log('Total files fixed:', changed);
