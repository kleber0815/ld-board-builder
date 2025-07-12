# LD Board Builder

A web-based board builder application for the Lucky Defense game community. Create, share, and discover custom game board layouts with an intuitive drag-and-drop interface.

This Project was fully build by the Cursor IDE AI.

## 🎮 Features

### Core Functionality
- **Interactive Board Builder**: Create custom board layouts with drag-and-drop unit placement
- **Multiple Game Modes**: Support for both Regular Mode and Guild Battle boards
- **Map Variety**: Choose from 5 different regular maps (Normal, Hard, Hell, God, Primeval) and Guild Battle maps
- **Unit Categories**: Access units across all rarity tiers (Common, Rare, Epic, Legendary, Mythic, Immortal)
- **Real-time Preview**: See your board layout as you build it

### Community Features
- **Board Discovery**: Browse and search through community-created boards
- **Board Sharing**: Save and share your custom board layouts
- **Advanced Filtering**: Filter boards by map type and search by title
- **Pagination**: Navigate through large collections of boards

### User Experience
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Dark/Light Theme**: Toggle between themes for comfortable viewing
- **Screenshot Export**: Capture and download your board layouts as images
- **Intuitive Navigation**: Clean, modern interface with easy-to-use controls

## 🚀 Getting Started

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- No additional software installation required

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/ld-board-builder.git
   cd ld-board-builder
   ```

2. Open `index.html` in your web browser, or serve the files using a local web server:
   ```bash
   # Using Python 3
   python -m http.server 8000
   
   # Using Node.js (if you have http-server installed)
   npx http-server
   
   # Using PHP
   php -S localhost:8000
   ```

3. Navigate to `http://localhost:8000` in your browser

## 📖 How to Use

### Creating a Board
1. **Navigate to Builder**: Click the "Builder" link in the navigation
2. **Select Game Mode**: Choose between "Regular Mode" or "Guild Battle"
3. **Choose a Map**: Select from available maps for your chosen mode
4. **Add Units**: 
   - Browse units by rarity using the tabbed interface
   - Click on a unit to select it
   - Click on any grid cell to place the unit
   - Right-click to remove units from cells
5. **Save Your Board**: Add a title and description, then save to share with the community

### Discovering Boards
1. **Navigate to Discover**: Click the "Discover" link in the navigation
2. **Search and Filter**: 
   - Use the search bar to find boards by title
   - Filter by specific maps using the dropdown
3. **Browse Results**: View boards in a grid layout with pagination
4. **View Details**: Click on any board to see full details and layout

### Taking Screenshots
- Use the "Take Screenshot" button in the builder to capture your current board layout
- The image will be automatically downloaded to your device

## 🛠️ Technical Details

### Architecture
- **Frontend**: Vanilla JavaScript with ES6 modules
- **Backend**: Supabase for authentication and data storage
- **Styling**: Custom CSS with CSS Grid and Flexbox
- **Build**: No build process required - pure HTML/CSS/JS

### Project Structure
```
ld-board-builder/
├── assets/                 # Images and static assets
│   ├── boards/            # Game board backgrounds
│   ├── units/             # Unit images by rarity
│   └── favicon.webp       # App icon
├── css/                   # Stylesheets
│   ├── components.css     # Component-specific styles
│   ├── main.css          # Main application styles
│   ├── pages.css         # Page-specific styles
│   ├── reset.css         # CSS reset
│   └── variables.css     # CSS custom properties
├── scripts/              # JavaScript modules
│   ├── components/       # Reusable UI components
│   ├── pages/           # Page-specific logic
│   ├── api.js           # API communication
│   ├── auth.js          # Authentication logic
│   ├── main.js          # Application entry point
│   ├── router.js        # Client-side routing
│   ├── supabase.js      # Database configuration
│   ├── theme.js         # Theme management
│   └── utils.js         # Utility functions
├── units.json           # Unit data and metadata
└── index.html           # Main HTML file
```

### Key Technologies
- **Supabase**: Backend-as-a-Service for authentication and data storage
- **HTML2Canvas**: Client-side screenshot generation
- **CSS Grid**: Responsive layout system
- **ES6 Modules**: Modern JavaScript module system

### Browser Support
- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## 🤝 Contributing

We welcome contributions from the Lucky Defense community! Here's how you can help:

### Development Setup
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Test thoroughly across different browsers
5. Commit your changes: `git commit -m 'Add amazing feature'`
6. Push to the branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

### Areas for Contribution
- **New Features**: Additional unit types, board themes, or sharing options
- **UI/UX Improvements**: Better mobile experience, accessibility enhancements
- **Performance**: Optimize image loading, reduce bundle size
- **Documentation**: Improve guides, add tutorials
- **Bug Fixes**: Report and fix issues

## 🙏 Acknowledgments

- **Lucky Defense Community**: For inspiration and feedback
- **Contributors**: Everyone who has helped improve this tool

## 🔗 Links

- **Lucky Defense Discord**: [Join our community](https://discord.com/invite/luckydefense)
- **Lucky Defense Reddit**: [r/luckydefense](https://www.reddit.com/r/luckydefense/)
- **Lucky Defense Guides**: [luckydefenseguides.com](https://luckydefenseguides.com/)

## 📊 Project Status

- ✅ Core board building functionality
- ✅ Community board sharing
- ✅ Responsive design
- ✅ Dark/light theme support
- ✅ Screenshot export
- 🔄 Ongoing improvements and new features

---

**Built with ❤️ for the Lucky Defense community**
