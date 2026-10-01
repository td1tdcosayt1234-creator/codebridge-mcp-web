---
name: cool-html-game
description: Make a single-file HTML5 canvas game feel premium — juice it with particles, screen shake, hit-stop, parallax, glow, WebAudio SFX, touch controls, HUD, combos and levels. No external assets.
---

# Cool Single-File HTML5 Game

Use this skill when generating or refining a playable game in ONE self-contained
HTML file (inline `<style>` + `<script>`, no CDNs, no images, no external URLs).

## Must-have game feel (juice)

1. **Particles** — burst on score/death/pickup (10–30 rects/circles with gravity + fade).
2. **Screen shake** — small trauma-based offset on hits/explosions, decays fast.
3. **Hit-stop** — freeze 60–120ms on big moments (death, level-up) for punch.
4. **Parallax background** — 2–3 layers (stars/grid/city) scrolling at different speeds.
5. **Glow** — `shadowBlur` + bright palette on player, food, projectiles (neon look, cheap).
6. **Squash & stretch** — scale player/enemy briefly on bounce, eat, shoot.
7. **Score popups** — floating "+10" text rising and fading where points happen.
8. **Combo system** — quick successive scores multiply (x2, x3…), resets after 2s idle.

## Sound without files (WebAudio)

- Tiny `beep(freq, dur, type)` helper using `AudioContext` (created on first user gesture).
- Different pitch for eat / shoot / hit / win / game-over. Mute toggle button (`M` key).

## Controls & HUD

- Keyboard (arrows/WASD/space) AND touch (swipe + tap buttons) — both always work.
- Visible HUD: score, best (localStorage), level/lives, start + restart + pause controls.
- Game-over panel with final score + "press R / tap to restart".

## Structure that stays small

- `reset()` sets full state; `step(dt)` updates; `draw()` renders; `loop(ts)` drives.
- Fixed timestep accumulator (e.g. 120Hz logic) so speed is device-independent.
- Keep under ~1200 lines. No frameworks. Canvas 2D only.

## Difficulty curve

- Speed/size/spawn-rate scales with score; show LEVEL UP flash + brief slow-mo.
- First 10 seconds forgiving (slower enemies, bigger pickups).

## Never do

- External `<script src>`, `<link>`, images, fonts, or fetch calls.
- `alert()`/`confirm()` — draw messages on canvas/DOM instead.
- Unbounded particle arrays — cap at ~300, reuse dead particles.
