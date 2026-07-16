const fs = require('fs');
const files = [
  'app/documents/page.tsx',
  'app/insights/page.tsx',
  'app/components/ContractDetail.tsx',
  'app/components/wizard/ContractPreview.tsx',
  'app/components/modals/FreelancerEditModal.tsx'
];

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  // Remove dark:something classes
  let newContent = content.replace(/dark:[a-zA-Z0-9\-\/]+\s?/g, '');
  // Also clean up any double spaces or trailing spaces inside classNames left over
  newContent = newContent.replace(/className="([^"]+)"/g, (match, p1) => {
    return `className="${p1.replace(/\s+/g, ' ').trim()}"`;
  });
  // Fix the documents page title specifically
  newContent = newContent.replace(/text-3xl font-black text-slate-900/g, 'text-2xl font-bold text-slate-900');
  fs.writeFileSync(file, newContent);
  console.log('Processed', file);
});
