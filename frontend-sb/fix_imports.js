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
    } else if (file.endsWith('.tsx')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk('app');
files.push('components/templates/DashboardLayout/DashboardLayout.tsx');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  // Replace old atoms
  content = content.replace(/@\/components\/ui\/Button/g, '@/components/atoms');
  content = content.replace(/@\/components\/ui\/Input/g, '@/components/atoms');
  content = content.replace(/@\/components\/ui\/Badge/g, '@/components/atoms');
  
  // Replace old molecules
  content = content.replace(/@\/components\/ui\/Card/g, '@/components/molecules');
  content = content.replace(/@\/components\/ui\/Table/g, '@/components/molecules');
  
  // Replace old organisms
  content = content.replace(/@\/components\/layout\/Sidebar/g, '@/components/organisms');
  content = content.replace(/@\/components\/layout\/TopBar/g, '@/components/organisms');

  // Fix duplicate imports if they occur (e.g., if Card and Table are imported separately, they might become two imports from '@/components/molecules'). We can let ESLint or manual fixes handle this if it causes issues, but for now simple replacement works since we just changed the path string.
  
  fs.writeFileSync(file, content);
});
console.log('Imports updated');
