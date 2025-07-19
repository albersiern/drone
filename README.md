# 🚁 Drone AR Visualization

Интерактивное приложение для визуализации телеметрии дрона с AR-элементами, объединяющее видео, 3D-объекты и карту.

## ✨ Возможности

- **Синхронизация видео и телеметрии** — воспроизведение видео с дрона синхронизировано с данными полёта
- **3D AR-маркеры** — интерактивные геолокационные пины поверх видео
- **Карта Cesium** — отображение траектории полёта и POI на 3D-карте
- **Hover-эффекты** — анимированные подсказки при наведении на маркеры
- **Responsive дизайн** — адаптивный интерфейс для разных экранов

## 🚀 Быстрый старт

### 1. Клонирование репозитория
```bash
git clone https://github.com/albersiern/drone.git
cd drone
```

### 2. Установка зависимостей
```bash
npm install
# или
pnpm install
# или
yarn install
```

### 3. Добавление медиа-файлов
Поместите следующие файлы в папку `public/`:
- `DJI_0381.mp4` — видео с дрона
- `telemetry/DJI_0381.json` — файл телеметрии

### 4. Запуск приложения
```bash
npm run dev
# или
pnpm dev
# или
yarn dev
```

Приложение будет доступно по адресу: `http://localhost:5173`

## 📁 Структура проекта

```
src/
├── components/          # React компоненты
│   ├── CesiumPanel.tsx  # 3D карта Cesium
│   └── VideoBackground.tsx # Видео-плеер
├── three/              # Three.js 3D сцена
│   ├── SceneRoot.tsx   # Корневой компонент сцены
│   ├── StaticObject.tsx # AR-маркеры
│   └── TelemetryCamera.tsx # Камера
├── hooks/              # React хуки
│   └── useTelemetryPlayback.ts # Синхронизация телеметрии
├── stores/             # Zustand стейт
│   ├── telemetry.ts    # Данные телеметрии
│   └── poi.ts          # Точки интереса
└── services/           # Сервисы
    └── ws.ts           # WebSocket (будущее)
```

## 🎮 Управление

- **Видео**: стандартные элементы управления HTML5 video
- **3D-сцена**: OrbitControls для навигации мышью
- **AR-маркеры**: наведите мышь для дополнительной информации
- **Карта**: стандартное управление Cesium (зум, поворот, перемещение)

## 🛠 Технологии

- **React 18** + **TypeScript** — основной фреймворк
- **Three.js** + **React Three Fiber** — 3D-рендеринг
- **Cesium** + **Resium** — 3D-карта
- **Zustand** — управление состоянием
- **Vite** — сборщик и dev-сервер
- **Drei** — утилиты для Three.js

## 📋 Требования к файлам

### Видео (`DJI_0381.mp4`)
- Формат: MP4
- Кодек: H.264 (рекомендуется)
- Размещение: `public/DJI_0381.mp4`

### Телеметрия (`telemetry/DJI_0381.json`)
JSON-файл с массивом точек:
```json
[
  {
    "t": 0.0,
    "lat": 53.9125,
    "lon": 27.544722,
    "alt": 150,
    "yaw": 0,
    "pitch": 0,
    "roll": 0
  }
]
```

## 🔧 Настройка

### Cesium Access Token
В файле `src/components/CesiumPanel.tsx` замените токен на свой:
```typescript
Ion.defaultAccessToken = 'YOUR_CESIUM_TOKEN'
```

### Координаты центра карты
В `CesiumPanel.tsx` измените координаты:
```typescript
const MINskCoordinates = { 
  lat: 53.9125, 
  lon: 27.544722, 
  height: 150 
}
```

## 🚀 Сборка для продакшена

```bash
npm run build
# или
pnpm build
```

Собранные файлы будут в папке `dist/`

## 📝 Лицензия

MIT License

## 🤝 Вклад в проект

1. Fork репозитория
2. Создайте feature-ветку
3. Внесите изменения
4. Создайте Pull Request
      // Alternatively, use this for stricter rules
      ...tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      ...tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
