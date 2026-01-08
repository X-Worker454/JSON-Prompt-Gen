# JSON Prompt Gen

**Professional AI Video Prompt Generator**

A modern, offline-first Progressive Web App (PWA) designed to help creators build complex, cinematic, JSON-structured prompts for advanced AI video generation models (like Veo, Sora, etc.).

## 🚀 Key Features

*   **Cinematic Prompt Builder**: Drag-and-drop timeline interface for constructing multi-scene narratives.
*   **Visual Dictionary**: Integrated glossary of filmmaking terms (camera moves, lighting, aesthetics) to inspect and learn.
*   **AI Integration (LLM)**: Connect your own API key (OpenAI, Anthropic, Gemini) to automatically enhance, rewrite, and polish your prompts.
*   **Privacy First**: All data runs locally in your browser. API keys are stored in LocalStorage encryption.
*   **Offline Capable**: Fully functional PWA that works without an internet connection (except for AI features).
*   **One-Click Export**: Generate clean, schema-compliant JSON payloads optimized for video model APIs.

## 🛠️ Technology Stack

*   **Frontend**: Vanilla HTML5, CSS3 (Glassmorphism), JavaScript (ES6+).
*   **State Management**: LocalStorage for history and settings.
*   **PWA**: Service Worker for offline caching and installation.
*   **Design**: Custom CSS variables, responsive grid, and modern aesthetic.

## 📦 Installation & Setup

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/yourusername/json-prompt-gen.git
    cd json-prompt-gen
    ```

2.  **Run Locally (Development)**:
    Since this is a static site, you can use any static file server.
    ```bash
    # Using python
    python -m http.server 8000

    # Using Node (npx)
    npx http-server .
    ```

3.  **Install as PWA**:
    *   Open the app in Chrome/Edge.
    *   Click the "Install JSON Prompt Gen" icon in the address bar.

## 📖 Documentation

Full documentation is available inside the application at the **Docs** page (`documentation.html`), covering:
*   Quick Start Guide
*   Core Concepts (Scenes, Parameters)
*   AI Enhancement Workflows
*   Visual Dictionary Usage

## 🤝 Contributing

We welcome contributions! Please check out the `CONTRIBUTING.md` (if available) or submit a Pull Request.

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---
*Built with ❤️ for the Cinematic AI Video Community.*
