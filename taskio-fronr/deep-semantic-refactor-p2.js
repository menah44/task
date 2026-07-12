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

  // 1. Sidebar specific active states that use crazy colors
  // Replace active sidebar items (bg-[color]/10 text-[color] border border-[color]/20)
  // With a clean bg-accent text-accent-foreground font-semibold
  const colors = ['primary', 'success', 'warning', 'error', 'blue-600', 'purple-600', 'indigo-600', 'gray-600', 'blue-400', 'purple-400', 'indigo-400'];
  
  content = content.replace(/bg-[a-z0-9-]+\/10 text-[a-z0-9-]+ border border-[a-z0-9-]+\/20/g, 'bg-accent text-accent-foreground border-transparent shadow-sm');
  
  // Also clean up hover states in Sidebar that colorize icons weirdly
  content = content.replace(/group-hover:text-purple-500/g, 'group-hover:text-foreground');
  content = content.replace(/group-hover:text-blue-500/g, 'group-hover:text-foreground');
  content = content.replace(/group-hover:text-indigo-500/g, 'group-hover:text-foreground');
  content = content.replace(/group-hover:text-warning/g, 'group-hover:text-foreground');
  content = content.replace(/group-hover:text-success/g, 'group-hover:text-foreground');
  content = content.replace(/group-hover:text-error/g, 'group-hover:text-foreground');
  content = content.replace(/group-hover:text-primary/g, 'group-hover:text-foreground');

  // Fix buttons in empty states or general places
  content = content.replace(/bg-blue-600 hover:bg-blue-700 text-white/g, 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm');
  content = content.replace(/text-blue-400/g, 'text-primary');
  content = content.replace(/text-purple-400/g, 'text-primary');
  content = content.replace(/text-yellow-400/g, 'text-warning');
  content = content.replace(/text-green-400/g, 'text-success');

  // Clean cards and borders to use shadow-sm
  content = content.replace(/bg-card rounded-2xl p-6 shadow-sm border border-border/g, 'bg-card rounded-2xl p-6 shadow-sm border border-border');
  
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

console.log(`Phase 2 semantic refactoring complete. Changed ${changedFiles} files.`);
