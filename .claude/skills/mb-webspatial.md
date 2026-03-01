# Skill: WebSpatial SDK Patterns for MemoryBridge

## Reference: https://webspatial.dev/docs/quick-example

## Installation
```bash
npm install @webspatial/react-sdk
```

## vite.config.ts Setup
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { webSpatialPlugin } from '@webspatial/vite-plugin'  // if available

export default defineConfig({
  plugins: [react(), webSpatialPlugin()],
  server: { port: 5173 }
})
```

## main.tsx — Enable Spatial Before React Renders
```typescript
import { enableSpatial } from '@webspatial/react-sdk'
import { createRoot } from 'react-dom/client'
import App from './App'

// MUST be called before React renders
enableSpatial()

createRoot(document.getElementById('root')!).render(<App />)
```

## SpaceProvider + Space Pattern
```tsx
import { SpaceProvider, Space } from '@webspatial/react-sdk'

// Wrap entire app with SpaceProvider
function App() {
  return (
    <SpaceProvider>
      <SpatialMemoryRoom />
    </SpaceProvider>
  )
}

// Each 3D element is a <Space> with position
function FloatingPhotoPanel({ memory, depth }: { memory: Memory; depth: number }) {
  return (
    <Space
      style={{
        transform: `translateZ(${depth}px)`,
        width: 300,
        height: 400,
      }}
    >
      <img src={memory.photoUrl} alt={memory.caption} className="w-full h-full object-cover rounded-2xl" />
    </Space>
  )
}
```

## Era Z-Depth Mapping
```typescript
const ERA_DEPTH: Record<string, number> = {
  childhood: -300,    // farthest in the past
  'young-adult': -200,
  family: -100,
  recent: 0,          // closest to viewer
}

function getDepth(era: string): number {
  return ERA_DEPTH[era] ?? 0
}
```

## visionOS Detection + Fallback
```typescript
function SpatialMemoryRoom({ memories }: { memories: Memory[] }) {
  const [isSpatial, setIsSpatial] = useState(false)

  useEffect(() => {
    // XRSystem available → visionOS
    setIsSpatial(typeof window !== 'undefined' && 'XRSystem' in window)
  }, [])

  if (!isSpatial) return <FallbackRoom memories={memories} />
  return <WebSpatialRoom memories={memories} />
}
```

## Gaze Interaction Pattern
```tsx
function FloatingPhotoPanel({ memory, onSelect }: { memory: Memory; onSelect: (m: Memory) => void }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <Space
      onPointerEnter={() => setExpanded(true)}  // gaze enter
      onPointerLeave={() => setExpanded(false)} // gaze exit
      onClick={() => onSelect(memory)}           // pinch
      style={{
        transform: `scale(${expanded ? 1.4 : 1}) translateZ(...)`,
        transition: 'transform 0.3s ease',
        cursor: 'pointer',
      }}
    >
      <img src={memory.photoUrl} className="rounded-2xl object-cover" />
      {expanded && <Caption text={memory.caption} date={memory.date} />}
    </Space>
  )
}
```

## CSS 3D Fallback Room (FallbackRoom.tsx)
```tsx
export function FallbackRoom({ memories }: { memories: Memory[] }) {
  return (
    <div
      style={{
        perspective: '1200px',
        perspectiveOrigin: '50% 40%',
        height: '100vh',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div style={{ transformStyle: 'preserve-3d', width: '100%', height: '100%' }}>
        {memories.map((m, i) => (
          <div
            key={m.id}
            style={{
              position: 'absolute',
              left: `${15 + (i % 5) * 16}%`,
              top: `${20 + Math.floor(i / 5) * 35}%`,
              transform: `translateZ(${getDepth(m.era)}px) rotateY(${(i % 5 - 2) * 8}deg)`,
              transition: 'transform 0.3s ease',
            }}
          >
            <MemoryCard memory={m} />
          </div>
        ))}
      </div>
    </div>
  )
}
```

## Key Rules
- NEVER import Three.js or Babylon.js — WebSpatial handles 3D
- Quick-example pattern only — do not customize beyond floating panels
- Max 12 panels at once in visionOS (performance) — paginate larger sets
- Pinch/click handler MUST work — gaze is bonus
- Always provide FallbackRoom — judges may test on non-Vision Pro devices
