# POWER FLOW RENDERER SPECIFICATION
**GridAssist Operations Theater Phase 2**

---

## 1. Technical Engine Architecture

The **Power Flow Renderer** is an optimized HTML5 Canvas 2D engine responsible for drawing overhead line vectors and particle current flows.

```
                    Canvas Frame Execution Loop (60 FPS)
                                     │
                 ┌───────────────────┴───────────────────┐
                 ▼                                       ▼
    Layer 1: Electrical Line Vectors        Layer 2: Particle Flow Systems
    • Normal lines (#10B981)                • Calculate particle position p(t)
    • Failed spans (#EF4444 glow)          • Halts particles on dark edges
    • Dimmed non-selected lines             • Renders glowing emerald dots
```

---

## 2. Dynamic Line Span Rendering Rules

1. **Energized Span:** Draw solid 2px line in Emerald (`#10B981`), drop-shadow blur 4px.
2. **De-energized (Dark) Span:** Draw dashed 1.5px line in Dark Charcoal (`#333B4D`), 0 blur.
3. **Fault Frontier Span:** Draw solid 5px line in Glowing Crimson (`#EF4444`), drop-shadow blur 16px, animated dashed overlay.
4. **Dimmed Non-Selected Span:** Set `ctx.globalAlpha = 0.15` when inspecting another active incident.

---

## 3. Particle System Execution Algorithm

```typescript
function drawPowerParticles(
  ctx: CanvasRenderingContext2D,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  animOffset: number,
  isEnergized: boolean
) {
  if (!isEnergized) return; // Particles HALT instantly when line loses power

  const dx = toX - fromX;
  const dy = toY - fromY;
  const distance = Math.hypot(dx, dy);
  if (distance === 0) return;

  const particleCount = 2;
  for (let i = 0; i < particleCount; i++) {
    const progress = ((animOffset * 1.3 + i * (distance / particleCount)) % distance) / distance;
    const px = fromX + dx * progress;
    const py = fromY + dy * progress;

    ctx.fillStyle = '#6EE7B7';
    ctx.shadowColor = '#10B981';
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.arc(px, py, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }
}
```
