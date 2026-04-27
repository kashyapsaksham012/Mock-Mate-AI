# 🤖 Mock Mate AI - Your Ultimate AI Interview Coach

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Gemini](https://img.shields.io/badge/Google_Gemini-AI-orange?style=for-the-badge&logo=google)](https://deepmind.google/technologies/gemini/)
[![Drizzle](https://img.shields.io/badge/Drizzle_ORM-v0.30-C5F74F?style=for-the-badge&logo=drizzle)](https://orm.drizzle.team/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-blue?style=for-the-badge&logo=postgresql)](https://neon.tech/)

**Mock Mate AI** is a cutting-edge, AI-powered interview preparation platform designed to help job seekers master their interview skills. By leveraging Google's Gemini AI, the platform provides personalized mock interviews based on your actual resume and target job descriptions.

---

## 🚀 Features

- **📄 Smart Resume Parsing**: Upload your resume in PDF or DOCX format. Our AI extracts your experience, skills, and roles with high precision.
- **🎯 Personalized Interview Generation**: Generate mock interview questions tailored to your specific role, job level, domain, and focus areas (e.g., System Design, Coding, Behavioral).
- **🧠 AI-Driven Insights**: Powered by Google Gemini 1.5 Flash for intelligent question generation and structured feedback.
- **💳 Subscription Model**: Integrated with Stripe for premium feature access.
- **🔐 Secure Authentication**: User authentication and profile management handled by Clerk.
- **☁️ Cloud Storage**: Resumes are securely stored using Cloudinary with a local fallback system.
- **⚡ Real-time Feedback**: Get instant hints and technical evaluation for each question.

---

## 🛠️ How it Works

1. **Upload**: Users upload their resume. The backend extracts text using `pdf-parse` or `mammoth`.
2. **Analyze**: Gemini AI parses the text into a structured JSON profile (Skills, Experience, Current Role).
3. **Customize**: Users set their target role, difficulty level, and focus areas (e.g., "System Design" or "Backend").
4. **Generate**: The system merges the resume profile with the user's settings to generate 8-10 highly relevant interview questions.
5. **Practice**: Users go through the interview session with AI-generated hints and guidance.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Authentication**: Clerk
- **State Management**: React Hooks & Context API

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **ORM**: Drizzle ORM
- **Database**: PostgreSQL (via Neon Database)
- **AI Integration**: Google Generative AI (Gemini SDK)
- **File Handling**: Cloudinary (Cloud) / Local Storage

---

## 🏁 Getting Started

### Prerequisites
- **Node.js** (v18.0.0 or higher)
- **npm** or **yarn**
- **PostgreSQL** database (Neon recommended)
- **Google Gemini API Key**
- **Clerk API Keys**
- **Cloudinary Account** (for file uploads)

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/kashyapsaksham012/Mock-Mate-AI.git
   cd Mock-Mate-AI
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Environment Setup**:
   Create `.env` files in both `frontend` and `backend` directories using the provided examples.

   **Backend (`backend/.env`)**:
   ```env
   PORT=3001
   DATABASE_URL=your_postgresql_url
   GEMINI_API_KEY=your_gemini_api_key
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```

   **Frontend (`frontend/.env`)**:
   ```env
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_pub_key
   CLERK_SECRET_KEY=your_clerk_secret_key
   NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
   ```

4. **Database Migration**:
   ```bash
   cd backend
   npm run db:generate
   npm run db:push
   ```

### Running Locally

You can run both the frontend and backend concurrently from the root directory:

```bash
# Start Backend
npm run backend:dev

# Start Frontend
npm run frontend:dev
```

- **Frontend**: [http://localhost:3000](http://localhost:3000)
- **Backend**: [http://localhost:3001](http://localhost:3001)

---

## 📁 Project Structure

```text
├── backend/                # Express.js server & Business Logic
│   ├── src/
│   │   ├── modules/        # Domain-driven modules (Resume, Interview, etc.)
│   │   ├── models/         # Drizzle Schema
│   │   └── config/         # App configuration
├── frontend/               # Next.js Application
│   ├── src/
│   │   ├── app/            # App Router pages
│   │   ├── components/     # UI Components
│   │   └── lib/            # API services & Utils
└── package.json            # Workspace configuration
```

---

## 🛡️ License

Distributed under the MIT License. See `LICENSE` for more information.

---

## 🤝 Contributing

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

**Developed with ❤️ by [Saksham Kashyap](https://github.com/kashyapsaksham012)**
