# Inner Circle - Full App Setup Guide

## What You're Getting

This is the complete Inner Circle friendship tracker app with:
- **Dashboard** with contact cards, urgency tracking, and progress bars
- **5-tier friendship system** with color-coded categories
- **Interaction logging** (coffee, call, text, hangout, etc.)
- **Time tracking** showing how long since you last contacted someone
- **Urgency alerts** (green → yellow → orange → red)
- **Search** across all contacts
- **Dashboard & Tier views** for different perspectives
- **Contact notes** for remembering details about people
- **Persistent storage** so your data survives app restarts
- **Onboarding flow** for first-time users
- **Settings screen** with notification preferences and data export
- **Pull-to-refresh** on the main screen

## File Structure

```
InnerCircle/
├── app/
│   ├── _layout.tsx              ← Root layout (dark status bar)
│   └── (tabs)/
│       ├── _layout.tsx          ← Tab bar config (Home + Settings)
│       ├── index.tsx            ← Main dashboard screen
│       └── settings.tsx         ← Settings screen
├── components/
│   ├── AddContactModal.tsx      ← Add new contact form
│   ├── ContactCard.tsx          ← Individual contact card
│   ├── ContactDetailModal.tsx   ← Contact detail / log interaction
│   └── OnboardingScreen.tsx     ← First-time user walkthrough
├── constants/
│   ├── theme.ts                 ← Colors, tier config, interaction types
│   └── types.ts                 ← TypeScript interfaces
└── utils/
    ├── storage.ts               ← AsyncStorage save/load functions
    └── time.ts                  ← Time calculations and urgency logic
```

## Setup Instructions

### Step 1: Install the dependency
```bash
cd ~/InnerCircle
npx expo install @react-native-async-storage/async-storage
```

### Step 2: Copy the files
Copy each file from this package into your InnerCircle project,
matching the folder structure above. You'll need to:

1. Create the folders if they don't exist:
```bash
mkdir -p constants utils components
```

2. Copy each file to its correct location (see structure above)

3. Replace any existing files in app/(tabs)/ with the new versions

### Step 3: Run it
```bash
npx expo start
```

Scan the QR code with your phone and you should see the onboarding screen!

## How to Use

- **Add contacts**: Tap "+ Add" button
- **View contact details**: Tap any contact card
- **Log interaction**: Tap a contact → choose type → tap "Log"
- **Change tier**: Tap a contact → tap tier buttons
- **Delete contact**: Long-press a contact card (or use Delete in detail view)
- **Search**: Type in the search bar
- **Switch views**: Toggle between Dashboard and By Tier
- **Filter by tier**: Tap the T1-T5 filter chips
- **Pull to refresh**: Pull down on the contact list

## Tier System

| Tier | Label | Check-in Frequency | Color |
|------|-------|-------------------|-------|
| 1 | Inner Circle | Every 3 days | Red |
| 2 | Close Friends | Every 7 days | Orange |
| 3 | Good Friends | Every 14 days | Yellow |
| 4 | Casual Friends | Every 30 days | Blue |
| 5 | Acquaintances | Every 90 days | Purple |
