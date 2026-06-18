
const fs = require("fs");
const file = "packages/cli/src/modes/web/web-ui.html";
let content = fs.readFileSync(file, "utf8");

const newCSS = `		[data-theme="mooncode"] {
			--bg:          #0B0C10;
			--bg2:         #111216;
			--sidebar:     #0D0E12;
			--surface:     #111216;
			--surface2:    #15161A;
			--border:      rgba(255,255,255,0.06);
			--fg:          #E2E4E9;
			--muted:       #8E929E;
			--accent:      #5E5CE6;
			--accent2:     #32D74B;
			--user-bubble: #17181D;
			--user-border: rgba(255,255,255,0.1);
			--code-bg:     #08090C;
			--shadow:      0 8px 32px rgba(0,0,0,0.8);
		}
		[data-theme="dracula"] {
			--bg:          #282a36;
			--bg2:         #21222c;
			--sidebar:     #1e1f29;
			--surface:     #282a36;
			--surface2:    #44475a;
			--border:      rgba(255,255,255,0.05);
			--fg:          #f8f8f2;
			--muted:       #6272a4;
			--accent:      #bd93f9;
			--accent2:     #50fa7b;
			--user-bubble: #21222c;
			--user-border: rgba(189,147,249,0.3);
			--code-bg:     #191a21;
			--shadow:      0 8px 32px rgba(0,0,0,0.7);
		}
		[data-theme="nord"] {
			--bg:          #2e3440;
			--bg2:         #3b4252;
			--sidebar:     #242933;
			--surface:     #2e3440;
			--surface2:    #434c5e;
			--border:      rgba(255,255,255,0.05);
			--fg:          #eceff4;
			--muted:       #d8dee9;
			--accent:      #81a1c1;
			--accent2:     #8fbcbb;
			--user-bubble: #3b4252;
			--user-border: rgba(129,161,193,0.3);
			--code-bg:     #242933;
			--shadow:      0 8px 32px rgba(0,0,0,0.7);
		}
		[data-theme="solarized-dark"] {
			--bg:          #002b36;
			--bg2:         #073642;
			--sidebar:     #00212b;
			--surface:     #002b36;
			--surface2:    #073642;
			--border:      rgba(255,255,255,0.05);
			--fg:          #839496;
			--muted:       #586e75;
			--accent:      #268bd2;
			--accent2:     #2aa198;
			--user-bubble: #073642;
			--user-border: rgba(38,139,210,0.3);
			--code-bg:     #001f27;
			--shadow:      0 8px 32px rgba(0,0,0,0.7);
		}
		[data-theme="snow"] {
			--bg:          #ffffff;
			--bg2:         #f8f9fa;
			--sidebar:     #f1f3f5;
			--surface:     #ffffff;
			--surface2:    #e9ecef;
			--border:      rgba(0,0,0,0.06);
			--fg:          #212529;
			--muted:       #868e96;
			--accent:      #339af0;
			--accent2:     #20c997;
			--user-bubble: #f8f9fa;
			--user-border: rgba(51,154,240,0.2);
			--code-bg:     #f8f9fa;
			--shadow:      0 4px 12px rgba(0,0,0,0.05);
		}
		[data-theme="github-light"] {
			--bg:          #ffffff;
			--bg2:         #f6f8fa;
			--sidebar:     #f6f8fa;
			--surface:     #ffffff;
			--surface2:    #eaeef2;
			--border:      rgba(0,0,0,0.08);
			--fg:          #24292f;
			--muted:       #57606a;
			--accent:      #0969da;
			--accent2:     #2da44e;
			--user-bubble: #f6f8fa;
			--user-border: rgba(9,105,218,0.2);
			--code-bg:     #f6f8fa;
			--shadow:      0 4px 12px rgba(0,0,0,0.05);
		}
		[data-theme="solarized-light"] {
			--bg:          #fdf6e3;
			--bg2:         #eee8d5;
			--sidebar:     #eee8d5;
			--surface:     #fdf6e3;
			--surface2:    #e5dfcc;
			--border:      rgba(0,0,0,0.08);
			--fg:          #657b83;
			--muted:       #93a1a1;
			--accent:      #268bd2;
			--accent2:     #2aa198;
			--user-bubble: #eee8d5;
			--user-border: rgba(38,139,210,0.2);
			--code-bg:     #f6efd5;
			--shadow:      0 4px 12px rgba(0,0,0,0.05);
		}
		[data-theme="sepia"] {
			--bg:          #f4ecd8;
			--bg2:         #e9dfc4;
			--sidebar:     #e9dfc4;
			--surface:     #f4ecd8;
			--surface2:    #ded2b3;
			--border:      rgba(0,0,0,0.08);
			--fg:          #433422;
			--muted:       #7a6549;
			--accent:      #d4a853;
			--accent2:     #c8855a;
			--user-bubble: #e9dfc4;
			--user-border: rgba(212,168,83,0.3);
			--code-bg:     #e9dfc4;
			--shadow:      0 4px 12px rgba(0,0,0,0.05);
		}`;

const newHTML = `				<div class="theme-card" id="theme-mooncode" onclick="setTheme(` + "`mooncode`" + `)">
					<div class="theme-preview" style="background:linear-gradient(135deg,#0B0C10 40%,#111216);border-bottom:1px solid #1a1b1e;">
						<div style="position:absolute;bottom:8px;left:10px;display:flex;gap:4px;">
							<div style="width:36px;height:8px;border-radius:4px;background:#5E5CE6;opacity:0.7;"></div>
							<div style="width:22px;height:8px;border-radius:4px;background:#32D74B;opacity:0.5;"></div>
						</div>
					</div>
					<div class="theme-name">MoonCode</div>
				</div>
				<div class="theme-card" id="theme-dracula" onclick="setTheme(` + "`dracula`" + `)">
					<div class="theme-preview" style="background:linear-gradient(135deg,#282a36 40%,#44475a);border-bottom:1px solid #1e1f29;">
						<div style="position:absolute;bottom:8px;left:10px;display:flex;gap:4px;">
							<div style="width:36px;height:8px;border-radius:4px;background:#bd93f9;opacity:0.7;"></div>
							<div style="width:22px;height:8px;border-radius:4px;background:#50fa7b;opacity:0.5;"></div>
						</div>
					</div>
					<div class="theme-name">Dracula</div>
				</div>
				<div class="theme-card" id="theme-nord" onclick="setTheme(` + "`nord`" + `)">
					<div class="theme-preview" style="background:linear-gradient(135deg,#2e3440 40%,#3b4252);border-bottom:1px solid #242933;">
						<div style="position:absolute;bottom:8px;left:10px;display:flex;gap:4px;">
							<div style="width:36px;height:8px;border-radius:4px;background:#81a1c1;opacity:0.7;"></div>
							<div style="width:22px;height:8px;border-radius:4px;background:#8fbcbb;opacity:0.5;"></div>
						</div>
					</div>
					<div class="theme-name">Nord</div>
				</div>
				<div class="theme-card" id="theme-solarized-dark" onclick="setTheme(` + "`solarized-dark`" + `)">
					<div class="theme-preview" style="background:linear-gradient(135deg,#002b36 40%,#073642);border-bottom:1px solid #00212b;">
						<div style="position:absolute;bottom:8px;left:10px;display:flex;gap:4px;">
							<div style="width:36px;height:8px;border-radius:4px;background:#268bd2;opacity:0.7;"></div>
							<div style="width:22px;height:8px;border-radius:4px;background:#2aa198;opacity:0.5;"></div>
						</div>
					</div>
					<div class="theme-name">Solarized Koyu</div>
				</div>

				<!-- LIGHT THEMES -->
				<div class="theme-card" id="theme-snow" onclick="setTheme(` + "`snow`" + `)">
					<div class="theme-preview" style="background:linear-gradient(135deg,#ffffff 40%,#f8f9fa);border-bottom:1px solid #e9ecef;">
						<div style="position:absolute;bottom:8px;left:10px;display:flex;gap:4px;">
							<div style="width:36px;height:8px;border-radius:4px;background:#339af0;opacity:0.7;"></div>
							<div style="width:22px;height:8px;border-radius:4px;background:#20c997;opacity:0.5;"></div>
						</div>
					</div>
					<div class="theme-name" style="background:#ffffff;color:#212529;">Kar Beyazı</div>
				</div>
				<div class="theme-card" id="theme-github-light" onclick="setTheme(` + "`github-light`" + `)">
					<div class="theme-preview" style="background:linear-gradient(135deg,#f6f8fa 40%,#eaeef2);border-bottom:1px solid #d0d7de;">
						<div style="position:absolute;bottom:8px;left:10px;display:flex;gap:4px;">
							<div style="width:36px;height:8px;border-radius:4px;background:#0969da;opacity:0.7;"></div>
							<div style="width:22px;height:8px;border-radius:4px;background:#2da44e;opacity:0.5;"></div>
						</div>
					</div>
					<div class="theme-name" style="background:#f6f8fa;color:#24292f;">Github Açık</div>
				</div>
				<div class="theme-card" id="theme-solarized-light" onclick="setTheme(` + "`solarized-light`" + `)">
					<div class="theme-preview" style="background:linear-gradient(135deg,#fdf6e3 40%,#eee8d5);border-bottom:1px solid #e5dfcc;">
						<div style="position:absolute;bottom:8px;left:10px;display:flex;gap:4px;">
							<div style="width:36px;height:8px;border-radius:4px;background:#268bd2;opacity:0.7;"></div>
							<div style="width:22px;height:8px;border-radius:4px;background:#2aa198;opacity:0.5;"></div>
						</div>
					</div>
					<div class="theme-name" style="background:#fdf6e3;color:#657b83;">Solarized Açık</div>
				</div>
				<div class="theme-card" id="theme-sepia" onclick="setTheme(` + "`sepia`" + `)">
					<div class="theme-preview" style="background:linear-gradient(135deg,#f4ecd8 40%,#e9dfc4);border-bottom:1px solid #ded2b3;">
						<div style="position:absolute;bottom:8px;left:10px;display:flex;gap:4px;">
							<div style="width:36px;height:8px;border-radius:4px;background:#d4a853;opacity:0.7;"></div>
							<div style="width:22px;height:8px;border-radius:4px;background:#c8855a;opacity:0.5;"></div>
						</div>
					</div>
					<div class="theme-name" style="background:#f4ecd8;color:#433422;">Sepya (Kitap)</div>
				</div>`;

// Replace CSS
const cssStart = /\[data-theme="mooncode"\]\s*\{[\s\S]*?\[data-theme="chill"\]\s*\{[\s\S]*?\}/;
content = content.replace(cssStart, newCSS);

// Replace HTML
const htmlStart = /<div class="theme-card" id="theme-chill"[\s\S]*?<div class="theme-name" style="background:#f5f6f9;color:#343b58;">Tokyo Light<\/div>\s*<\/div>/;
content = content.replace(htmlStart, newHTML);

fs.writeFileSync(file, content);
console.log("Replaced themes successfully.");

