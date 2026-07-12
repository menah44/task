const fs = require('fs');
const path = require('path');

const directories = ['app', 'components'];

function walkDir(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(walkDir(fullPath));
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      results.push(fullPath);
    }
  });
  return results;
}

let changedFiles = 0;

function refactorFile(file) {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  // Colors
  content = content.replace(/text-gray-[345]00/g, 'text-muted-foreground');
  content = content.replace(/text-gray-[89]00/g, 'text-foreground');
  content = content.replace(/text-gray-600/g, 'text-muted-foreground');
  
  // Backgrounds
  content = content.replace(/bg-\[#21262d\]/g, 'bg-muted');
  content = content.replace(/hover:bg-\[#21262d\]/g, 'hover:bg-accent');
  content = content.replace(/bg-\[#30363d\]/g, 'bg-accent');
  content = content.replace(/hover:bg-\[#30363d\]/g, 'hover:bg-accent');
  content = content.replace(/bg-gray-50/g, 'bg-muted');
  content = content.replace(/bg-gray-100/g, 'bg-muted');
  content = content.replace(/bg-gray-800/g, 'bg-muted');
  content = content.replace(/bg-gray-900/g, 'bg-card');
  
  // Borders
  content = content.replace(/border-gray-[12]00/g, 'border-border');
  content = content.replace(/border-gray-[78]00/g, 'border-border');
  
  const textWhiteRegex = /(<[a-zA-Z0-9]+[^>]*className=(?:\{`|["'])[^"'}]+)(text-white)([^"'}]+(?:`\}|["']))/g;
  
  content = content.replace(textWhiteRegex, (match, p1, p2, p3) => {
      if (
          match.includes('bg-blue-') || 
          match.includes('bg-primary') || 
          match.includes('bg-red-') || 
          match.includes('bg-error') || 
          match.includes('bg-success') || 
          match.includes('bg-green-') || 
          match.includes('bg-purple-') || 
          match.includes('bg-indigo-') ||
          match.includes('bg-yellow-') ||
          match.includes('bg-warning')
      ) {
          return match;
      }
      return p1 + 'text-foreground' + p3;
  });

  const hoverTextWhiteRegex = /(<[a-zA-Z0-9]+[^>]*className=(?:\{`|["'])[^"'}]+)(hover:text-white)([^"'}]+(?:`\}|["']))/g;
  content = content.replace(hoverTextWhiteRegex, (match, p1, p2, p3) => {
    if (
          match.includes('bg-blue-') || 
          match.includes('bg-primary') || 
          match.includes('bg-red-') || 
          match.includes('bg-error') || 
          match.includes('bg-success') || 
          match.includes('bg-green-') || 
          match.includes('bg-purple-') || 
          match.includes('bg-indigo-') ||
          match.includes('bg-yellow-') ||
          match.includes('bg-warning')
      ) {
          return match; 
      }
      return p1 + 'hover:text-foreground' + p3;
  });

  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
    changedFiles++;
    console.log(`Updated ${file}`);
  }
}

directories.forEach(dir => {
  const files = walkDir(dir);
  files.forEach(refactorFile);
});

console.log(`Deep refactoring complete. Changed ${changedFiles} files.`);
