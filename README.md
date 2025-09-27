# 🏠 Hostel SuperApp

A comprehensive all-in-one web application for hostel residents to manage expenses, events, social interactions, and daily activities.

![Hostel SuperApp](https://img.shields.io/badge/Next.js-15.5.4-blue)
![Firebase](https://img.shields.io/badge/Firebase-Latest-orange)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-cyan)

## ✨ Features

### 🏠 Core Management
- **💰 Expense Splitter** - Split bills like Splitwise with real-time balance tracking
- **🍽️ Mess Menu & Ratings** - Daily menu with 5-star rating system
- **📅 Event Planner** - Organize study sessions, parties, and activities
- **🧺 Laundry Queue** - Book washing machine time slots

### 👥 Social Features
- **📱 Social Wall** - Share memes, images, documents with hashtag support
- **💬 Chat System** - Private and group messaging with file sharing
- **🦉 Night Owl Tracker** - See who's awake during late hours
- **👤 User Profiles** - Google authentication with status tracking

### 🛡️ Admin Dashboard
- **👨‍💼 User Management** - Role management and user administration
- **🔍 Content Moderation** - Approve/reject posts and manage content
- **📊 Analytics** - System usage statistics and activity monitoring
- **⚙️ System Controls** - Complete admin control panel

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Firebase project with Authentication, Firestore, Realtime Database, and Storage enabled
- Vercel account for deployment

### Local Development

1. **Clone and install dependencies:**
```bash
git clone <your-repo-url>
cd hostel-superapp
npm install
```

2. **Configure Firebase:**
   - Create a Firebase project at [Firebase Console](https://console.firebase.google.com)
   - Enable Authentication (Google provider)
   - Create Firestore Database
   - Create Realtime Database
   - Enable Storage
   - Copy your config to `.env.local`

3. **Set up environment variables:**
```bash
cp .env.local.example .env.local
# Edit .env.local with your Firebase configuration
```

4. **Run development server:**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## 🏗️ Tech Stack

- **Frontend:** Next.js 15.5.4 with React 19
- **Styling:** Tailwind CSS 4.0
- **Language:** TypeScript
- **Database:** Firebase Firestore + Realtime Database
- **Authentication:** Firebase Auth (Google)
- **Storage:** Firebase Storage
- **Deployment:** Vercel
- **UI Components:** Radix UI + Lucide React

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── admin/             # Admin dashboard
│   ├── chat/              # Chat system
│   ├── events/            # Event management
│   ├── expenses/          # Expense splitting
│   ├── laundry/           # Laundry booking
│   ├── mess/              # Mess menu & ratings
│   ├── night-owls/        # Night owl tracker
│   └── wall/              # Social wall
├── components/            # Reusable UI components
├── contexts/              # React contexts (Auth)
├── lib/                   # Utilities and Firebase config
└── types/                 # TypeScript type definitions
```

## 🔧 Configuration

### Firebase Setup

1. **Authentication:**
   - Enable Google sign-in method
   - Add your domain to authorized domains

2. **Firestore Rules:**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // All authenticated users can read/write shared collections
    match /{collection}/{document} {
      allow read, write: if request.auth != null;
    }
  }
}
```

3. **Storage Rules:**
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

4. **Realtime Database Rules:**
```json
{
  "rules": {
    ".read": "auth != null",
    ".write": "auth != null"
  }
}
```

## 🚀 Deployment

### Deploy to Vercel

1. **Connect to Vercel:**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

2. **Set Environment Variables in Vercel:**
   - Go to your Vercel dashboard
   - Navigate to Settings > Environment Variables
   - Add all variables from `.env.production`

3. **Configure Firebase for Production:**
   - Update Firebase project settings
   - Add your Vercel domain to authorized domains
   - Update CORS settings if needed

### Custom Domain (Optional)

1. Add your custom domain in Vercel dashboard
2. Update DNS records as instructed
3. Update Firebase authorized domains
4. Update `NEXT_PUBLIC_APP_URL` environment variable

## 📱 Usage Guide

### For Students:
1. **Sign in** with Google account
2. **Split expenses** with roommates
3. **Rate daily meals** and view menu
4. **Plan events** and join activities
5. **Book laundry slots** to avoid conflicts
6. **Share memes** and connect on social wall
7. **Chat** with friends and groups
8. **Find study buddies** during night hours

### For Admins:
1. **Manage users** and assign roles
2. **Moderate content** on social wall
3. **Monitor activity** and usage statistics
4. **Handle reports** and maintain community guidelines

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Firebase for backend infrastructure
- Vercel for seamless deployment
- Next.js team for the amazing framework
- Tailwind CSS for beautiful styling
- All hostel residents who inspired this project

## 📞 Support

For support and questions:
- Create an issue in this repository
- Contact the admin through the app
- Check the documentation in `/docs`

---

**Made with ❤️ for hostel communities everywhere**

🏠 **Happy Hostel Living!** 🎉