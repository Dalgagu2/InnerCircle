#!/bin/bash
# Inner Circle - Full App Setup Script
# Run this from inside your InnerCircle project folder:
#   cd ~/InnerCircle && bash setup.sh

echo "🔧 Installing dependencies..."
npx expo install @react-native-async-storage/async-storage expo-status-bar

echo ""
echo "✅ Dependencies installed!"
echo ""
echo "Now copy the app files. Run these commands:"
echo ""
echo "  npx expo start"
echo ""
echo "Then scan the QR code with your phone."
echo ""
echo "🎉 Done! Your full Inner Circle app is ready."
