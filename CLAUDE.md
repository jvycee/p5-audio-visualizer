# Claude Development Guide

## Project Overview
Audio visualizer with Albuquerque sunset cyberpunk aesthetic. Started as p5.js web app, evolving to Logic Pro Audio Unit plugin.

## Key Documentation
- p5.js Reference: https://p5js.org/reference/
- p5.sound Library: https://p5js.org/reference/p5.sound/
- JUCE Framework: https://juce.com/
- JUCE Tutorials: https://juce.com/tutorials/
- Audio Unit Programming Guide: https://developer.apple.com/library/archive/documentation/MusicAudio/Conceptual/AudioUnitProgrammingGuide/

## Current Development Path
**Phase 1: ✅ Web Prototype** - p5.js visualization with Electron app
**Phase 2: 🔄 Logic Pro Plugin** - JUCE Audio Unit for direct audio access

## Visual Aesthetic
- **Palette**: Albuquerque sunset (#ff5e4d, #ff8c42, #ffb347) + cyberpunk (#00fff9, #bd00ff)
- **Style**: Organic, minimal 2D patterns
- **Inspiration**: Cherry blossoms, snowflakes, spore molds, conversation flows
- **Focus**: Cinema and composition over complexity

## Visualization Modes
1. **Cherry Blossoms** - Organic petal formations responding to frequency spectrum
2. **Snowflakes** - Crystalline branch structures with 6-fold symmetry
3. **Spore Molds** - Living branch systems that grow with FFT energy
4. **Conversation Flow** - Node-based audio dialogue visualization

## Development Guidelines
- Prioritize real-time performance (60fps target)
- Keep visualizations modular and mode-switchable
- Focus on organic, unexpected visual patterns
- Test with Logic Pro audio sources

## Technical Stack
**Web Version:**
- p5.js for graphics and animation
- p5.sound for audio processing
- Electron for native app

**Plugin Version:**
- JUCE framework for Audio Unit development
- C++ with OpenGL graphics
- FFT analysis for real-time audio response
- CMake build system

## Development Commands
```bash
# Web version
npm start

# Plugin development (after JUCE setup)
cmake --build build --target LogicProVisualizer_AU
```

## Project Structure
```
p5-audio-visualizer/
├── Web Version/
│   ├── index.html
│   ├── sketch.js
│   ├── main.js (Electron)
│   └── package.json
├── Plugin Version/
│   └── See PLUGIN_PLAN.md
└── Documentation/
    ├── CLAUDE.md
    ├── PLUGIN_PLAN.md
    └── README.md
```