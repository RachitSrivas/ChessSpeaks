# ♟️ ChessSpeaks

ChessSpeaks is a modern, full-stack, voice-controlled Chess platform built for accessibility and speed. It allows users to play completely hands-free using state-of-the-art AI voice transcription or seamlessly connect with players globally in real-time.

## 🚀 Features

- **🗣️ Voice-Controlled Gameplay:** Speak your moves naturally (e.g., "Pawn to E4" or "Knight takes F6") using Groq's lightning-fast Whisper AI model.
- **🌍 Real-time Multiplayer:** Play against friends globally with instantaneous move synchronization powered by WebSockets.
- **🤖 Play against AI:** Challenge Stockfish 18 Lite in offline mode, with adjustable difficulty.
- **🔊 AI Narration:** The game dynamically reads out your opponent's moves and game states (Check, Checkmate, Draw).
- **📊 Global Dashboard & Rating System:** Secure authentication via Supabase tracks your games, win/loss records, and your global ELO rating!
- **⚡ Extremely Fast:** Built with React, Vite, and Groq's LPU inference engine for near-instantaneous voice processing.

---

## ⌨️ Keyboard Shortcuts

To make the game completely accessible and hands-free, we implemented global hotkeys:

- **`Spacebar` (Hold to Speak):** Press and hold the Spacebar, say your move aloud, and release the key to automatically execute the move.
- **`F` (Toggle Voice):** Instantly toggle the game's Text-to-Speech narration ON or OFF.

---

## 🛠️ Tech Stack

- **Frontend:** React, Vite, React Router
- **Backend (Multiplayer):** Node.js, Express, Socket.io
- **Database & Auth:** Supabase (PostgreSQL)
- **Voice AI (Speech-to-Text):** Groq Cloud API (Whisper-large-v3)
- **Chess Engine:** Chess.js (Move Validation) & Stockfish.js (AI Opponent)
- **Deployment:** Vercel (Frontend) & Render (Backend)

---

## 💻 Local Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/RachitSrivas/ChessSpeaks.git
   cd ChessSpeaks
   ```

2. **Install Frontend Dependencies:**
   ```bash
   npm install
   ```

3. **Install Backend Dependencies:**
   ```bash
   cd server
   npm install
   cd ..
   ```

4. **Environment Variables:**
   Create a `.env` file in the root directory and add the following keys:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_GROQ_API_KEY=your_groq_api_key
   VITE_SOCKET_URL=http://localhost:3001  # Use this for local development
   ```

5. **Run the Application:**
   Open two terminals.
   - Terminal 1 (Backend): `cd server && npm start`
   - Terminal 2 (Frontend): `npm run dev`

---

## 🎮 How to Play

1. **Create an account:** Sign up with your email to track your rating.
2. **Choose a mode:** Select "Play against AI" to practice against Stockfish, or "Play with Online Player" to enter multiplayer.
3. **Multiplayer:** Type a shared "Room ID" (e.g., `123`) and select your color. Have your friend enter the exact same Room ID and choose the opposite color.
4. **Make Moves:** You can either drag-and-drop the pieces with your mouse, OR hold `Spacebar` and speak your move (e.g., "e4", "Knight to C3", or "Castle Kingside").
5. **Win:** Checkmate your opponent to increase your ELO rating on your Dashboard!
