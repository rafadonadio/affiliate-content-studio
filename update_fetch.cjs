const fs = require('fs');
const path = require('path');
const configImport = "import { API_URL } from '../config.js';\n";

function walk(dir) {
  fs.readdirSync(dir).forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes("fetch('/api/") || content.includes("fetch(\"/api/") || content.includes("fetch(`/api/")) {
        content = content.replace(/fetch\(['"`]\/api\//g, "fetch(API_URL + '/api/");
        if (!content.includes("from '../config")) {
          content = configImport + content;
        }
        fs.writeFileSync(fullPath, content);
        console.log('Updated ' + fullPath);
      }
    }
  });
}

walk('src/components');
