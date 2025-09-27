# Pokémon Mini App

A simple web application that allows users to search for Pokémon, view their details, and simulate battles using the PokéAPI.

## 🚀 Live Demo

**🌐 [Try the Live App](https://quocle2308-pokemon-mini-app.netlify.app)**

## 🎮 Features

- **⚔️ Battle Mode**: Search for your fighter, get random opponent, compare stats
- **📖 Pokédex Mode**: Search any Pokémon by name/ID for detailed information
- **📋 Pokémon List**: Browse all 1025+ Pokémon with filters and sorting
- **🎯 Quiz Mode**: Test your knowledge of Pokémon types

## 🛠️ Setup

1. Clone the repository:
```bash
git clone https://github.com/QuocLe2308/pokemon-mini-app.git
cd pokemon-mini-app
```

2. Open `index.html` in your web browser or serve locally:
```bash
python -m http.server 8000
```

## 🤖 AI Usage

### AI Tools Used
- **Cursor AI**: Primary development tool for code generation and debugging
- **GitHub Copilot**: Code completion and suggestions

### What AI Generated
- **HTML Structure**: Main application layout with semantic HTML5
- **CSS Styling**: Responsive design with animations and gradients
- **JavaScript Logic**: All core functionality including:
  - PokéAPI integration and data fetching
  - Type effectiveness calculations
  - Battle simulation algorithms
  - Quiz game mechanics
  - Pokémon list with filtering and sorting

### How I Debugged and Improved AI Output
- **Type Effectiveness Matrix**: AI initially provided incomplete data, I refined the type chart for accuracy
- **Error Handling**: AI created basic code, I enhanced error handling and user feedback
- **Performance Optimization**: AI suggested simple implementation, I optimized with batch loading and efficient DOM updates
- **User Experience**: AI created functional code, I added welcome messages, loading indicators, and smooth transitions
- **Code Organization**: AI generated working code, I refactored for maintainability and added comprehensive comments

## 🎨 Design Choices

### Why 4 Modes Instead of 1
- **Battle Mode**: Meets "Simple Battle Simulator" requirement but enhanced
- **Pokédex Mode**: Meets "Pokémon Search" requirement with detailed information
- **Pokémon List Mode**: Added browsing and comparison features
- **Quiz Mode**: Meets "Pokémon Quiz" requirement with scoring system

### Technical Decisions
- **Vanilla JavaScript**: No framework to keep it simple
- **PokéAPI v2**: Free API with complete data
- **Responsive Design**: Mobile-first approach
- **Error Handling**: Graceful fallbacks for network issues

## 🚀 Deployment

Deployed on Netlify with automatic deployment from GitHub main branch.