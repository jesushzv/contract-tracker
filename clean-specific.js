const fs = require('fs');
const path = require('path');

const targetFiles = [
  'app/dashboard/documents/page.tsx',
  'app/dashboard/insights/page.tsx',
  'app/dashboard/settings/page.tsx',
  'app/contracts/new/page.tsx',
  'app/components/wizard/ClausesAndPaymentStep.tsx',
  'app/components/wizard/ClientDetailsStep.tsx',
  'app/components/wizard/ContractPreview.tsx',
  'app/components/wizard/FinancialSchemeStep.tsx',
  'app/components/wizard/TemplateGallery.tsx',
  'app/components/ContractListView.tsx',
  'app/components/ContractPipeline.tsx'
];

function cleanFile(filePath) {
  const fullPath = path.join(__dirname, filePath);
  if (!fs.existsSync(fullPath)) {
    console.warn("File not found:", fullPath);
    return;
  }
  let content = fs.readFileSync(fullPath, 'utf8');
  
  // 1. Remove all dark: classes
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
  console.log("Cleaned:", filePath);
}

targetFiles.forEach(cleanFile);
console.log("Done cleaning specific files.");
