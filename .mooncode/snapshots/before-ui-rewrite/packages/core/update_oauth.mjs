import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const imgPath = "C:\\Users\\theay\\Desktop\\MoonCode\\packages\\cli\\src\\modes\\interactive\\assets\\vertexlogo.png";
const base64Img = fs.readFileSync(imgPath, 'base64');
const ext = path.extname(imgPath).replace('.', '');
const dataUri = `data:image/${ext};base64,${base64Img}`;

const oauthPagePath = "C:\\Users\\theay\\Desktop\\MoonCode\\packages\\core\\src\\utils\\oauth\\oauth-page.ts";
let content = fs.readFileSync(oauthPagePath, 'utf8');

// Replace the logo
content = content.replace(/const LOGO_SVG = `[\s\S]*?`;/, `const LOGO_SVG = \`<img src="${dataUri}" alt="Logo" style="width: 140px; height: 140px; object-fit: contain; border-radius: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);" />\`;`);

// Replace styles
content = content.replace(/--text: #fafafa;/, '--text: #111827;');
content = content.replace(/--text-dim: #a1a1aa;/, '--text-dim: #4b5563;');
content = content.replace(/--page-bg: #09090b;/, '--page-bg: #ffffff;');
content = content.replace(/html { color-scheme: dark; }/, 'html { color-scheme: light; }');
content = content.replace(/background: var\(--page-bg\);/, 'background: var(--page-bg); background-image: radial-gradient(#e5e7eb 1px, transparent 1px); background-size: 20px 20px;');

// Better text styling
content = content.replace(/<h1>\$\{heading\}<\/h1>/, `<h1 style="font-size: 32px; color: #1f2937; margin-bottom: 12px;">\${heading}</h1>`);
content = content.replace(/<p>\$\{message\}<\/p>/, `<p style="font-size: 18px; color: #4b5563; font-weight: 500; background: #f3f4f6; padding: 12px 24px; border-radius: 8px; display: inline-block;">\${message}</p>`);

fs.writeFileSync(oauthPagePath, content);
console.log("Updated oauth-page.ts successfully.");
