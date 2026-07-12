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

  // 1. Status Colors Refactor
  content = content.replace(/text-green-[456]00(?:\s+dark:text-green-[456]00)?/g, 'text-success');
  content = content.replace(/text-yellow-[456]00(?:\s+dark:text-yellow-[456]00)?/g, 'text-warning');
  content = content.replace(/text-red-[456]00(?:\s+dark:text-red-[456]00)?/g, 'text-error');
  content = content.replace(/text-error(?:\s+dark:text-error)?/g, 'text-error');

  // Background statuses
  content = content.replace(/bg-green-[45]00\/10/g, 'bg-success/15');
  content = content.replace(/bg-yellow-[45]00\/10/g, 'bg-warning/15');
  content = content.replace(/bg-red-[45]00\/10/g, 'bg-error/15');
  
  // Border statuses
  content = content.replace(/border-green-[45]00\/20/g, 'border-success/20');
  content = content.replace(/border-yellow-[45]00\/20/g, 'border-warning/20');
  content = content.replace(/border-red-[45]00\/20/g, 'border-error/20');

  // 2. Buttons Hover & Active
  // Replace hover:bg-blue-700 with hover:bg-primary/90
  content = content.replace(/bg-blue-600(?:\s+hover:bg-blue-700)?/g, 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm');
  content = content.replace(/hover:bg-blue-700/g, 'hover:bg-primary/90');
  
  // Replace text-blue-600 dark:text-blue-400 with text-primary
  content = content.replace(/text-blue-600(?:\s+dark:text-blue-[456]00)?/g, 'text-primary');
  content = content.replace(/hover:text-blue-[347]00(?:\s+dark:hover:text-blue-[34]00)?/g, 'hover:text-primary/80');

  // 3. Inputs consistency
  // Convert standard inputs to proper focus rings
  content = content.replace(/focus:border-blue-500 focus:ring-2 focus:ring-blue-500\/20/g, 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background');
  content = content.replace(/focus:border-blue-500/g, 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background');
  content = content.replace(/border-border text-foreground text-sm/g, 'border-input text-foreground text-sm');

  // 4. Badges Consistency
  // Replace generic badges with semantic UI badge look
  content = content.replace(/bg-success\/15 text-success border border-success\/20/g, 'bg-success text-success-foreground border-transparent shadow-sm');
  content = content.replace(/bg-warning\/15 text-warning border border-warning\/20/g, 'bg-warning text-warning-foreground border-transparent shadow-sm');
  content = content.replace(/bg-error\/15 text-error border border-error\/20/g, 'bg-destructive text-destructive-foreground border-transparent shadow-sm');
  
  // Replace other hardcoded hex colors
  content = content.replace(/text-purple-600(?:\s+dark:text-purple-[456]00)?/g, 'text-primary');
  content = content.replace(/hover:text-purple-[347]00(?:\s+dark:hover:text-purple-[34]00)?/g, 'hover:text-primary/80');

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

console.log(`Semantic refactoring complete. Changed ${changedFiles} files.`);
