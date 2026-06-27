#!/bin/bash
# LibConnect Backend Server Start Script
# Run this before using the app on your phone

echo "🚀 Starting LibConnect Backend Server..."
echo ""

# Get current WiFi IP
WIFI_IP=$(ipconfig getifaddr en0 2>/dev/null || ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1)
echo "📡 Your WiFi IP: $WIFI_IP"
echo "📱 Make sure your phone is on the SAME WiFi network"
echo ""
echo "✅ Backend will be available at: http://$WIFI_IP:8000/api"
echo ""
echo "Press Ctrl+C to stop the server"
echo "─────────────────────────────────────"

cd /Users/arvindhada/Library-App/backend
node src/server.js
