CIDDNEISTEquipmentBookingAdmin SPA - Ready to Deploy

Steps:

1. Create Firebase Project: https://console.firebase.google.com/
2. Enable Firestore database.
3. Add initial equipment documents in collection "equipment":
   Fields: name, description (optional), quantity
4. Copy your Firebase Web Config into app.js
   (replace AIzaSyDJZd4zyYVwTJP-3H1LeFJ7JFZ5xhKwJZM, ciddneistequipmentbooking, etc.)
5. Host:
   - GitHub Pages: push folder → Settings → Pages → Deploy
   - Netlify: drag & drop folder → SPA live
6. Open index.html → SPA is ready.

Features:
- Book equipment with time slots.
- Visual calendar view of bookings.
- Admin panel to add/remove equipment (password protected).
- Prevents double bookings automatically.

Security Notes:
- Admin password is client-side; for higher security, integrate Firebase Auth with roles.

