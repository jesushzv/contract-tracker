const fs = require('fs');
const path = require('path');

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // 1. Remove all dark: classes (including things like dark:hover:bg-slate-900, dark:text-white)
      // We use a regex that matches "dark:" followed by any non-whitespace characters
      content = content.replace(/\bdark:[^\s"'`]+/g, '');
      
      // 2. Fix the malformed ones that start with : like " :bg-slate-900/30"
      content = content.replace(/(?<=[\s"'`]):[a-zA-Z0-9\-\/\[\]#]+/g, '');
      
      // 3. Clean up multiple spaces inside classNames
      content = content.replace(/className=(["'`])(.*?)(\1)/g, (match, quote, classList) => {
        // remove extra spaces and trim
        const cleaned = classList.replace(/\s+/g, ' ').trim();
        return `className=${quote}${cleaned}${quote}`;
      });
      
      fs.writeFileSync(fullPath, content);
    }
  }
}

processDirectory(path.join(__dirname, 'app'));
console.log("Done cleaning classes.");
