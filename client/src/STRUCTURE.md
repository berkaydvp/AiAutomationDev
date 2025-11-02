# Client Folder Structure

```
src/
├── components/
│   ├── chat/              # Chat ile ilgili componentler
│   │   ├── ChatInput.jsx
│   │   ├── ChatInput.css
│   │   ├── ChatMessage.jsx
│   │   ├── ChatMessage.css
│   │   └── index.js       # Export barrel
│   │
│   ├── common/            # Ortak kullanılan componentler
│   │   ├── AuthModal.jsx
│   │   ├── AuthModal.css
│   │   ├── Header.jsx
│   │   ├── Header.css
│   │   ├── ToolsModal.jsx
│   │   ├── ToolsModal.css
│   │   └── index.js       # Export barrel
│   │
│   └── admin/             # Admin paneline özel componentler
│       └── index.js
│
├── pages/
│   ├── Auth/              # Authentication sayfaları
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   ├── Auth.css
│   │   └── index.js       # Export barrel
│   │
│   ├── Admin/             # Admin panel sayfası
│   │   ├── AdminPanel.jsx
│   │   ├── AdminPanel.css
│   │   └── index.js       # Export barrel
│   │
│   ├── Home/              # Ana sayfa
│   │   ├── Home.jsx
│   │   ├── Home.css
│   │   └── index.js       # Export barrel
│   │
│   └── Chat/              # Chat sayfası
│       ├── Chat.jsx
│       └── index.js       # Export barrel
│
├── App.jsx
├── App.css
├── main.jsx
└── index.css
```

## Import Kullanımı

### Barrel Exports ile (Önerilen)

```javascript
// Pages
import { Home } from './pages/Home'
import { Login, Register } from './pages/Auth'
import { Chat } from './pages/Chat'
import { AdminPanel } from './pages/Admin'

// Components
import { ChatInput, ChatMessage } from './components/chat'
import { Header, ToolsModal, AuthModal } from './components/common'
```

### Klasör Organizasyonu Prensipleri

1. **Pages**: Her sayfa kendi klasöründe, CSS dosyası ile birlikte
2. **Components**: Kullanım alanına göre gruplandırılmış
   - `chat/`: Chat özelliklerine özel
   - `common/`: Tüm uygulama genelinde kullanılan
   - `admin/`: Admin paneline özel
3. **Barrel Exports**: Her klasörde `index.js` ile temiz import paths

## Yeni Component Ekleme

1. İlgili klasörde component dosyasını oluştur
2. CSS dosyasını yanına ekle
3. `index.js` dosyasına export ekle

```javascript
// components/chat/index.js
export { default as YeniComponent } from './YeniComponent'
```
