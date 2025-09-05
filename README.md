# ClickMate

ClickMate is a modern React Native (Expo) app designed to help you find a buddy for every moment—whether you're seeking friendship, adventure, or just someone to chat with.

---

## Features

- **User Authentication:** Secure sign up and login using Firebase.
- **Profile Management:** Edit your profile, bio, and interests.
- **Smart Search:** Find matches based on your mood or interests.
- **Real-Time Chat:** Instant messaging with matched users.
- **Explore Section:** Discover hikes, movies, and activities to do together.
- **People List:** See your friends and unread messages.
- **Beautiful UI:** Custom themes and responsive design using Tailwind CSS and NativeWind.
- **Cross-Platform:** Works on iOS, Android, and Web.

---

## Getting Started

### Prerequisites

- **Node.js**: v21.4.0
- **Expo SDK**: v50.0
- **Expo CLI**: Installed globally

### Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/yourusername/clickmate.git
   cd clickmate
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Install Expo SDK v50.0:**

   ```bash
   npx expo install expo@50.0.0
   ```

4. **Start the development server:**
   ```bash
   npm start
   ```
   or
   ```bash
   npx expo start
   ```

---

## Project Structure

```
clickmate/
│
├── App.jsx                # Main app entry
├── _layout.jsx            # Navigation and layout
├── AuthContext.jsx        # Auth provider/context
├── constant.js            # App constants
├── FirebaseConfig.js      # Firebase setup
├── app/
│   ├── components/        # Reusable UI components
│   ├── screens/           # App screens (Home, Explore, Profile, etc.)
│   └── state/             # Recoil atoms for state management
├── assets/                # Images, fonts, icons
├── package.json           # Project dependencies and scripts
├── babel.config.js        # Babel configuration
├── tailwind.config.js     # Tailwind CSS config
├── metro.config.js        # Metro bundler config
└── README.md              # Project documentation
```

---

## Testing

ClickMate uses **Jest** and **React Native Testing Library** for unit and component tests.

To run tests:

```bash
npm test
```

---

## Contributing

Contributions are welcome! Please open issues or submit pull requests for improvements and bug fixes.

---

## License

This project is licensed under the [Apache License 2.0](assets/fonts/LICENSE.txt).

---

## Contact

For questions or support, open an issue or contact [subhomkundu@gmail.com](mailto:subhomkundu@gmail.com).

---

## Acknowledgements

- [Expo](https://expo.dev/)
- [Firebase](https://firebase.google.com/)
- [React Native](https://reactnative.dev/)
- [NativeWind](https://www.nativewind.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
