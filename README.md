# Delhi Police AI Dashboard 🚔

A modern, high-performance web application designed for traffic management and vehicle analysis using state-of-the-art AI. This system integrates automatic number plate recognition, image authenticity verification, and a robust real-time database.

## 🚀 Features

- **Automatic Number Plate Recognition (ANPR)**: Powered by Roboflow for high-accuracy license plate extraction.
- **AI-Powered Image Analysis**: Utilizes Google Gemini for advanced visual content understanding and traffic violation detection.
- **Image Authenticity Verification**: Integration with Sightengine to ensure images are genuine and not manipulated.
- **Real-time Data Management**: Built with Supabase for instant updates on vehicle logs and review status.
- **Modern UI/UX**: Responsive dashboard built with Next.js 16 (App Router), Tailwind CSS, and Lucide icons.

## 🛠️ Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/)
- **Database & Auth**: [Supabase](https://supabase.com/)
- **AI Models**: 
  - Roboflow (ANPR)
  - Google Gemini (General Vision)
- **Image Verification**: Sightengine
- **Styling**: Tailwind CSS

## 📋 Prerequisites

Before running the project, ensure you have:
- Node.js 18+ installed
- A Supabase project set up
- API keys for:
  - Google Gemini
  - Roboflow
  - Sightengine

## ⚙️ Installation & Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Dadajihu/delhi-police.git
   cd delhi-police
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env.local` file in the root directory and add the following:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   GEMINI_API_KEY=your_gemini_key
   ROBOFLOW_API_KEY=your_roboflow_key
   SIGHTENGINE_API_USER=your_sightengine_user
   SIGHTENGINE_API_SECRET=your_sightengine_secret
   ```

4. **Run the Development Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) to view the app.

## 📁 Project Structure

- `/src/app`: Next.js App Router pages and API routes.
- `/src/components`: Reusable UI components.
- `/src/lib`: Utility functions and shared logic (Supabase client, hashing, etc.).
- `/supabase`: SQL schema definitions for the database setup.

## 📄 License

This project is private and intended for internal use.
