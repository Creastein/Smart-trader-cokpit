# Smart Trader Cockpit

AI-Powered Technical Analysis & Decision Support System for traders. Upload market snapshots and get instant AI-driven trading recommendations with entry, target, and stop-loss levels.

![Version](https://img.shields.io/badge/version-1.0-blue)
![Next.js](https://img.shields.io/badge/Next.js-16.1.3-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)

## ✨ Features

- **Dual-Mode Analysis**
  - 📊 **Scalping Mode**: For quick hit-and-run trades (order book reading, momentum)
  - 📈 **Swing Mode**: For position trading (trend following, daily charts)

- **AI-Powered Insights**
  - Google Gemini AI integration for intelligent chart analysis
  - Automated technical analysis with confidence scoring
  - Entry zones, targets, and stop-loss recommendations
  - Risk/reward ratio calculation

- **Modern UI/UX**
  - Dark theme optimized for traders
  - Drag-and-drop image upload
  - Real-time analysis progress
  - Toast notifications for better feedback
  - Cooldown mechanism to prevent API abuse

- **Demo Mode**
  - Test the application without API quota usage
  - Realistic mock responses for both trading modes

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ installed
- Google Gemini API key ([Get one here](https://aistudio.google.com/apikey))

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd smart-trader-cockpit
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Copy `.env.local.example` to `.env.local`:
   ```bash
   cp .env.local.example .env.local
   ```

   Then edit `.env.local` and add your API key:
   ```env
   GEMINI_API_KEY=your_actual_api_key_here
   DEMO_MODE=false
   ```

4. **Verify your API key (optional)**
   ```bash
   npm run verify
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📖 Usage

1. **Select Trading Mode**: Choose between Scalping or Swing mode
2. **Upload Chart**: Drag and drop or click to upload a trading chart image
   - Maximum file size: 5MB
   - Supported formats: JPEG, PNG, GIF, WebP
3. **Analyze**: Click "Analyze Market Structure" button
4. **Review Results**: Get AI-powered trading recommendations

## 🔒 Security

**IMPORTANT**: Never commit your `.env.local` file to version control!

- Your API key is sensitive and should be kept secret
- The `.env.local` file is already in `.gitignore`
- For production deployment, use environment variables from your hosting platform
- See [SECURITY.md](./SECURITY.md) for more security guidelines

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **UI**: Tailwind CSS, Lucide Icons
- **AI**: Google Gemini API (@google/generative-ai)
- **Validation**: Zod
- **Notifications**: react-hot-toast

## 📁 Project Structure

```
smart-trader-cockpit/
├── src/
│   ├── app/
│   │   ├── api/analyze/route.ts    # AI analysis endpoint
│   │   ├── layout.tsx               # Root layout
│   │   ├── page.tsx                 # Main page
│   │   └── globals.css              # Global styles
│   ├── components/
│   │   ├── ModeSelector.tsx         # Trading mode selection
│   │   ├── UploadZone.tsx           # Image upload component
│   │   └── AnalysisResult.tsx       # Results display
│   └── lib/
│       └── logger.ts                # Conditional logging utility
├── scripts/
│   └── verify-key.js                # API key verification script
├── .env.local.example               # Environment variables template
└── package.json
```

## 🧪 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run verify` - Verify Gemini API key

## ⚙️ Configuration

### Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `GEMINI_API_KEY` | Your Google Gemini API key | Yes | - |
| `DEMO_MODE` | Use mock responses instead of real API | No | `false` |

### Demo Mode

For testing without using API quota, set `DEMO_MODE=true` in `.env.local`. The app will return realistic mock responses.

## 🐛 Troubleshooting

### "API configuration error"
- Ensure `GEMINI_API_KEY` is set in `.env.local`
- Run `npm run verify` to check if your API key is valid

### "File too large"
- Maximum upload size is 5MB
- Compress your image before uploading

### "Invalid file type"
- Only JPEG, PNG, GIF, and WebP formats are supported

## 📝 License

This project is for personal use.

## 🤝 Contributing

This is a personal project, but suggestions and feedback are welcome!

## ⚠️ Disclaimer

**This tool provides AI-generated trading suggestions and should NOT be considered as financial advice.**
- Always do your own research
- Never risk more than you can afford to lose
- Past performance does not guarantee future results
- Trading involves significant risk

---

**Built with ❤️ for traders**
