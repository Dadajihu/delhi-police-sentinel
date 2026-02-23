# 🛡️ Sentinel AI | Delhi Traffic Police Enforcement

Sentinel AI is a cutting-edge web platform designed for the **Delhi Traffic Police** to bridge the gap between citizen vigilance and official enforcement. It leverages AI to process traffic violations reported by citizens, streamlining the legal challan issuance process.

---

## ✨ Key Features

-   **📸 Citizen Reporter**: Mobile-first interface for citizens to upload photo/video evidence of traffic violations.
-   **🤖 AI-Powered Analysis**: Integrated license plate recognition and violation classification (Roboflow & Gemini).
-   **⚖️ Officer Dashboard**: Comprehensive queue management for police officers to review cases and issue digital challans.
-   **🔒 Integrity Focused**: Every piece of evidence is hashed and timestamped to ensure a tamper-proof audit trail for legal proceedings.
-   **📱 PWA Ready**: Optimized for mobile web with "Add to Home Screen" support, providing a native-app-like experience.

---

## 🛠️ Tech Stack

-   **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
-   **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
-   **Database & Auth**: [Supabase](https://supabase.com/)
-   **Icons**: [Lucide React](https://lucide.dev/)
-   **Hosting**: Recommended for [Vercel](https://vercel.com/)

---

## 🚀 Getting Started

### Prerequisites

-   Node.js 20+
-   A Supabase project
-   Roboflow/Gemini API keys for AI processing

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/Dadajihu/delhi-police-sentinel.git
    cd delhi-police-sentinel
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Environment Setup:**
    Rename `.env.example` to `.env.local` and add your credentials:
    ```env
    NEXT_PUBLIC_SUPABASE_URL=your_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
    ROBOFLOW_API_KEY=your_roboflow_key
    GEMINI_API_KEY=your_gemini_key
    ```

4.  **Run locally:**
    ```bash
    npm run dev
    ```

---

## 📱 Mobile Experience

Though this is now a web platform, it is fully optimized for mobile devices. 
-   **On iOS**: Open in Safari → Share → Add to Home Screen.
-   **On Android**: Open in Chrome → Three Dots → Install App.

---

## ⚖️ License

Official Internal Platform for Delhi Traffic Police. &copy; 2026.
