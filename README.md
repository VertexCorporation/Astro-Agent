# Astro Agent

Yerel ortamda calisan, terminal ve web arayuzu ile kullanilan bir AI kodlama araci.

## Kurulum

```bash
git clone https://github.com/vertexcorporation/Astro-Agent.git
cd Astro-Agent
npm install
cd packages/cli
npm run build
npm install -g .
```

## Kullanim

Proje klasorunde:

```bash
asg
```

Web arayuzu otomatik acilir: `http://127.0.0.1:3135`

## Portlar

| Port | Ne ise yarar |
|------|-------------|
| 3135 | Web UI |
| 3131 | Auth / MCP API |
| 3133 | Browser Bridge (WebSocket) |

## Ozellikler

- **Fusion Mode** — iki modeli sirayla calistirir (plan + kod)
- **Browser Bridge** — Chrome extension ile tarayici kontrolu
- **MCP** — harici araclari baglama (Blender, Godot, ozel sunucular)
- **Compaction** — token kullanimini kontrol altinda tutar
- **Astro Sentinel** — dosya degisikliklerini izler

## MCP

Yan panelden MCP Manager ile harici sunucu baglantisi yapilabilir.

---

Vertex Corporation
