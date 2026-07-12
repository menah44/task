const fs = require('fs');
const path = require('path');

const directories = ['app', 'components'];

const replacements = {
  'bg-[#0d1117]': 'bg-background',
  'bg-[#161b22]': 'bg-card',
  'bg-[#1f242c]': 'bg-muted',
  'border-[#30363d]': 'border-border',
  'text-[#c9d1d9]': 'text-foreground',
  'text-gray-400': 'text-muted-foreground',
};

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

directories.forEach(dir => {
  const files = walkDir(dir);
  files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let newContent = content;
    
    for (const [oldVal, newVal] of Object.entries(replacements)) {
      newContent = newContent.split(oldVal).join(newVal);
    }
    
    if (newContent !== content) {
      fs.writeFileSync(file, newContent, 'utf8');
      changedFiles++;
      console.log(`Updated ${file}`);
    }
  });
});

console.log(`Refactoring complete. Changed ${changedFiles} files.`);
