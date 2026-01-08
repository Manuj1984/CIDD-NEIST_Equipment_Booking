// ====================
// Add your Firebase config here
// ====================
const firebaseConfig = {
  apiKey: "AIzaSyDJZd4zyYVwTJP-3H1LeFJ7JFZ5xhKwJZM",
  authDomain: "ciddneistequipmentbooking.firebaseapp.com",
  projectId: "ciddneistequipmentbooking",
  storageBucket: "ciddneistequipmentbooking.appspot.com",
  messagingSenderId: "259132812634",
  appId: "1:259132812634:web:60aaa47d89ffbda4561763",
  measurementId: "G-Y8W1GC57JW"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Elements
const equipmentSelect = document.getElementById('equipment-select');
const adminPasswordInput = document.getElementById('admin-password');
const adminActionsDiv = document.getElementById('admin-actions');
const addEquipBtn = document.getElementById('add-equip-btn');
const removeEquipBtn = document.getElementById('remove-equip-btn');
const removeEquipSelect = document.getElementById('remove-equip-select');
const equipNameInput = document.getElementById('equip-name');
const equipDescInput = document.getElementById('equip-desc');
const equipQtyInput = document.getElementById('equip-qty');

const ADMIN_PASSWORD = "ciddadmin123"; // change this to a secure password

// Store equipment data locally
let equipmentMap = {};
let calendar;

// Load equipment from Firestore
function loadEquipment() {
  db.collection('equipment').get().then(snapshot => {
    equipmentMap = {};
    equipmentSelect.innerHTML = '';
    snapshot.forEach(doc => {
      const data = doc.data();
      equipmentMap[doc.id] = data.name; // Map id → name
      const option = document.createElement('option');
      option.value = doc.id;
      option.textContent = data.name;
      equipmentSelect.appendChild(option);
    });
    loadRemoveEquipOptions();
  }).then(() => {
    if(!calendar) initCalendar();
    loadBookings();
  });
}

// Initialize FullCalendar
function initCalendar() {
  const calendarEl = document.getElementById('calendar');
  calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: 'dayGridMonth',
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,timeGridDay'
    },
    events: []
  });
  calendar.render();
}

// Load bookings and display on calendar
function loadBookings() {
  db.collection('bookings').get().then(snapshot => {
    const events = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      const [startTime, endTime] = data.time_slot.split('-');
      events.push({
        title: `${equipmentMap[data.equipment_id]} - ${data.user_name}`,
        start: `${data.date}T${startTime}`,
        end: `${data.date}T${endTime}`
      });
    });
    calendar.removeAllEvents();
    calendar.addEventSource(events);
  });
}

// Booking submission
document.getElementById('book-btn').addEventListener('click', () => {
  const equipmentId = equipmentSelect.value;
  const date = document.getElementById('date').value;
  const timeSlot = document.getElementById('time-slot').value;
  const userName = document.getElementById('user-name').value;

  if (!equipmentId || !date || !timeSlot || !userName) {
    alert('Please fill all fields');
    return;
  }

  db.collection('bookings')
    .where('equipment_id', '==', equipmentId)
    .where('date', '==', date)
    .get()
    .then(snapshot => {
      const conflict = snapshot.docs.find(doc => doc.data().time_slot === timeSlot);
      if (conflict) {
        alert('This equipment is already booked for the selected time slot.');
      } else {
        db.collection('bookings').add({
          equipment_id: equipmentId,
          date: date,
          time_slot: timeSlot,
          user_name: userName
        }).then(() => {
          alert('Booking successful!');
          loadBookings();
        });
      }
    });
});

// Admin Password Check
adminPasswordInput.addEventListener('input', () => {
  if(adminPasswordInput.value === ADMIN_PASSWORD) {
    adminActionsDiv.style.display = 'block';
    loadRemoveEquipOptions();
  } else {
    adminActionsDiv.style.display = 'none';
  }
});

// Add Equipment
addEquipBtn.addEventListener('click', () => {
  const name = equipNameInput.value.trim();
  const desc = equipDescInput.value.trim();
  const qty = parseInt(equipQtyInput.value);

  if(!name || isNaN(qty)) {
    alert("Please enter valid name and quantity.");
    return;
  }

  db.collection('equipment').add({
    name: name,
    description: desc,
    quantity: qty
  }).then(() => {
    alert("Equipment added successfully!");
    equipNameInput.value = '';
    equipDescInput.value = '';
    equipQtyInput.value = '';
    loadEquipment();
  });
});

// Remove Equipment
removeEquipBtn.addEventListener('click', () => {
  const equipId = removeEquipSelect.value;
  if(!equipId) return;

  if(confirm("Are you sure you want to remove this equipment?")) {
    db.collection('equipment').doc(equipId).delete().then(() => {
      alert("Equipment removed successfully!");
      loadEquipment();
    });
  }
});

// Load Remove Dropdown Options
function loadRemoveEquipOptions() {
  removeEquipSelect.innerHTML = '';
  db.collection('equipment').get().then(snapshot => {
    snapshot.forEach(doc => {
      const option = document.createElement('option');
      option.value = doc.id;
      option.textContent = doc.data().name;
      removeEquipSelect.appendChild(option);
    });
  });
}

// Initial load
loadEquipment();