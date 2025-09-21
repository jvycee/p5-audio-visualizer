# Logic Pro Audio Unit Plugin Development Plan

## Overview
Converting our p5.js audio visualizer to a native Logic Pro Audio Unit plugin using JUCE framework.

## Why JUCE Plugin?
- Direct audio stream access in Logic Pro (no audio routing needed)
- Native 60fps OpenGL graphics performance
- Professional Audio Unit integration
- Real-time FFT analysis of Logic's audio output

## Setup Instructions

### Prerequisites
- macOS with Xcode installed
- Xcode command line tools: `xcode-select --install`

### JUCE Installation (2025 Method)
```bash
bash <(curl -fsSL https://raw.githubusercontent.com/danielraffel/JUCE-Plugin-Starter/main/scripts/dependencies.sh)
```

This installs:
- JUCE framework
- Core Audio Utility Classes for AU development
- CMake build system
- Projucer (JUCE project manager)

## Visualization Modes to Port

### 1. Cherry Blossoms
- Organic petal formations responding to frequency spectrum
- Multi-layered bezier curves with bloom effects
- Sunset/cyber color interpolation

### 2. Snowflakes
- Crystalline branch structures
- 6-fold symmetry with audio-reactive segments
- Frequency-mapped branch growth

### 3. Spore Molds
- Living branch systems that grow over time
- FFT energy controls branch spawning
- Organic, unexpected growth patterns

### 4. Conversation Flow
- Node-based visualization representing audio as dialogue
- Bezier curves connecting frequency nodes
- Audio amplitude affects connection thickness

## Technical Architecture

### Audio Processing
```cpp
// Real-time FFT analysis in JUCE
juce::dsp::FFT fft(fftOrder);
juce::dsp::WindowingFunction<float> window(fftSize, juce::dsp::WindowingFunction<float>::hann);
```

### Graphics Rendering
```cpp
// OpenGL component for smooth 60fps visuals
class VisualizerComponent : public juce::OpenGLAppComponent
{
    void paint(juce::Graphics& g) override;
    void render() override; // OpenGL rendering
};
```

### Color Palette
```cpp
// Albuquerque sunset + cyberpunk
juce::Colour sunset[] = {0xff5e4d, 0xff8c42, 0xffb347, 0xffd670};
juce::Colour cyber[] = {0x00fff9, 0x00d4ff, 0xbd00ff, 0xff00e5};
```

## Development Steps
1. ✅ Research JUCE framework
2. 🔄 Install JUCE and dependencies
3. Create Audio Unit project template
4. Port p5.js algorithms to JUCE C++
5. Implement real-time FFT audio analysis
6. Add mode switching UI controls
7. Build and test in Logic Pro
8. Package for distribution

## File Structure
```
LogicProVisualizer/
├── Source/
│   ├── PluginProcessor.cpp     # Audio processing
│   ├── PluginEditor.cpp        # UI and graphics
│   ├── Visualizers/
│   │   ├── CherryBlossom.cpp
│   │   ├── Snowflake.cpp
│   │   ├── SporeMold.cpp
│   │   └── ConversationFlow.cpp
│   └── Graphics/
│       ├── Palette.h
│       └── Utils.h
├── CMakeLists.txt
└── README.md
```

## Installation Location
Compiled plugin installs to: `~/Library/Audio/Plug-Ins/Components/`

## Testing
Use JUCE Plugin Host or directly in Logic Pro as an Audio Effect insert.

## Next Steps
Continue development on machine with Logic Pro installed for full testing workflow.