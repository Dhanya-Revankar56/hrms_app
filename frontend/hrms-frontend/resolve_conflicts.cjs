const fs = require('fs');
const path = require('path');

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  if (content.includes('<<<<<<< HEAD')) {
    // This regex grabs everything from HEAD to the separator, saving it in $1,
    // and discards everything from the separator to the end marker.
    const regex = /<<<<<<< HEAD\r?\n([\s\S]*?)=======\r?\n[\s\S]*?>>>>>>> [^\r\n]*(?:\r?\n)?/g;
    const newContent = content.replace(regex, '$1');
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log(`Resolved conflicts in: ${filePath}`);
    return true;
  }
  return false;
}

function walk(dir) {
  let results = [];
  try {
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
      file = path.join(dir, file);
      const stat = fs.statSync(file);
      if (stat && stat.isDirectory()) { 
        results = results.concat(walk(file));
      } else { 
        results.push(file);
      }
    });
  } catch (err) {
    console.error("Error reading dir: ", dir);
  }
  return results;
}

const srcDir = path.join(__dirname, 'src');
console.log(`Scanning directory: ${srcDir}...`);
const files = walk(srcDir);
let count = 0;
files.forEach(file => {
  if (processFile(file)) {
    count++;
  }
});
console.log(`🎉 Successfully resolved conflicts in ${count} files.`);
