# 🎮 R3F Walking Game

A 3D walking game built with **React Three Fiber** and **Rapier.js** featuring infinite world generation using Perlin noise.

## ✨ Features

- **3D Physics World**: Built with React Three Fiber and Rapier.js for realistic physics
- **Player Character**: Controllable character with WASD/arrow keys and Space to jump  
- **Infinite Terrain**: Procedurally generated using fractal Perlin noise algorithms
- **Chunk Streaming**: Efficient world loading/unloading based on player position
- **Third-Person Camera**: Smooth camera that follows the player with interpolation
- **Atmospheric Effects**: Dynamic lighting, shadows, and fog for immersion
- **TypeScript**: Fully typed for better development experience

## 🎮 Controls

- **WASD** or **Arrow Keys**: Move around
- **Space**: Jump
- **Mouse**: Look around (first-person view with pointer lock)
- **Click**: Activate pointer lock for mouse control

## 🚀 Getting Started

### Prerequisites
- **Node.js** 20.19+ or 22.12+ (for Vite compatibility)
- **npm**, **yarn**, or **pnpm**

### Installation & Development

```bash
# Clone the repository
git clone https://github.com/beastful/r3f-game.git
cd r3f-game

# Install dependencies (this will generate package-lock.json)
npm install

# Start development server
npm run dev

# Build for production  
npm run build

# Run linting
npm run lint

# Preview production build locally
npm run preview
```

### 📦 Package Management
This repository doesn't include `package-lock.json` to avoid lock file conflicts. The dependencies will be resolved based on the version ranges in `package.json` when you run `npm install`.

## 🌐 Deployment

### Deploy to Vercel

1. **Fork/Clone this repository**

2. **Deploy to Vercel:**
   - Visit [vercel.com](https://vercel.com)
   - Import your repository
   - Vercel will automatically detect the Vite framework
   - Click Deploy!

3. **Alternative: Vercel CLI**
   ```bash
   # Install Vercel CLI
   npm i -g vercel
   
   # Deploy
   vercel
   ```

The app is optimized for Vercel deployment with:
- Automatic framework detection
- Optimized build configuration
- Code splitting for better performance
- Proper caching headers for static assets

## 🏗️ Architecture

### Core Components
- **Game**: Main game orchestrator component
- **Player**: Character physics and camera controls  
- **Terrain**: Infinite chunk-based world generation
- **Environment**: Lighting, fog, and atmospheric effects

### Key Technologies
- **React Three Fiber**: React wrapper for Three.js
- **Rapier.js**: Physics engine for collision and movement
- **Simplex Noise**: Perlin noise for realistic terrain generation
- **TypeScript**: Type safety and better developer experience

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

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

export default defineConfig([
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
