// Firebase Config
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

// DOM Elements
const equipmentSelect = document.getElementById("equipment-select");
const bookBtn = document.getElementById("book-btn");
const dateInput = document.getElementById("date");
const timeSlotInput = document.getElementById("time-slot");
const userNameInput = document.getElementById("user-name");
const divisionInput = document.getElementById("division");
const purposeInput = document.getElementById("purpose");

const adminPasswordInput = document.getElementById("admin-password");
const adminActionsDiv = document.getElementById("admin-actions");

const addEquipBtn = document.getElementById("add-equip-btn");
const removeEquipBtn = document.getElementById("remove-equip-btn");
const removeEquipSelect = document.getElementById("remove-equip-select");

const equipNameInput = document.getElementById("equip-name");
const equipDescInput = document.getElementById("equip-desc");
const equipQtyInput = document.getElementById("equip-qty");

const divisionFilter = document.getElementById("division-filter");
const tableBody = document.getElementById("pending-bookings-table");

const ADMIN_PASSWORD = "ciddadmin123";
let equipmentMap = {};
let calendar;

// Load Equipments
function loadEquipment() {
  db.collection("equipments").get().then(snapshot => {
    equipmentMap = {};
    equipmentSelect.innerHTML = "";
    snapshot.forEach(doc => {
      const data = doc.data();
      equipmentMap[doc.id] = data.name;
      const opt = document.createElement("option");
      opt.value = doc.id;
      opt.textContent = data.name;
      equipmentSelect.appendChild(opt);
    });
    loadRemoveEquipOptions();
    if (!calendar) initCalendar();
    loadBookings();
  });
}

// Calendar
function initCalendar() {
  const calendarEl = document.getElementById("calendar");
  calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: "dayGridMonth",
    headerToolbar: { left:"prev,next today", center:"title", right:"dayGridMonth,timeGridWeek" }
  });
  calendar.render();
}

// Load Bookings
function loadBookings() {
  db.collection("bookings").get().then(snapshot => {
    calendar.removeAllEvents();
    snapshot.forEach(doc => {
      const data = doc.data();
      const [startTime,endTime] = data.booking.timeSlot.split("-");
      const colorMap = { pending:"orange", approved:"green", rejected:"red" };
      calendar.addEvent({
        title:`${data.equipment.equipmentName} - ${data.user.name}`,
        start:`${data.booking.date}T${startTime}`,
        end:`${data.booking.date}T${endTime}`,
        color: colorMap[data.status]
      });
    });
  });
}

// Booking Submission
bookBtn.addEventListener("click", () => {
  const equipmentId = equipmentSelect.value;
  const date = dateInput.value;
  const timeSlot = timeSlotInput.value;
  const userName = userNameInput.value;
  const division = divisionInput.value || "Not specified";
  const purpose = purposeInput.value || "Not specified";

  if (!equipmentId || !date || !timeSlot || !userName) { alert("Please fill all fields"); return; }

  db.collection("bookings")
    .where("equipment.equipmentId","==",equipmentId)
    .where("booking.date","==",date)
    .where("booking.timeSlot","==",timeSlot)
    .where("status","in",["pending","approved"])
    .get().then(snapshot => {
      if(!snapshot.empty){ alert("This slot is already booked!"); return; }

      db.collection("bookings").add({
        tokenNo:"CIDD-"+Date.now(),
        equipment:{ equipmentId:equipmentId, equipmentName:equipmentMap[equipmentId] },
        booking:{ date:date, timeSlot:timeSlot },
        user:{ name:userName, division:division },
        purpose:purpose,
        status:"pending",
        timestamps:{ createdAt:firebase.firestore.FieldValue.serverTimestamp(), approvedAt:null, rejectedAt:null }
      }).then(()=>{
        alert("Booking submitted for approval");
        loadBookings();
        refreshAdminTable();
        // Clear form
        dateInput.value=""; timeSlotInput.value=""; userNameInput.value=""; purposeInput.value=""; divisionInput.value="";
      });
    });
});

// Admin Password
adminPasswordInput.addEventListener("input",()=>{
  if(adminPasswordInput.value===ADMIN_PASSWORD){
    adminActionsDiv.style.display="block";
    refreshAdminTable();
  } else { adminActionsDiv.style.display="none"; }
});

// Equipment Management
addEquipBtn.addEventListener("click",()=>{
  const name=equipNameInput.value.trim();
  const desc=equipDescInput.value.trim();
  const qty=parseInt(equipQtyInput.value);
  if(!name||isNaN(qty)){ alert("Invalid input"); return; }

  db.collection("equipments").add({ name, description:desc, quantity:qty, status:"active" })
    .then(()=>{ equipNameInput.value=""; equipDescInput.value=""; equipQtyInput.value=""; loadEquipment(); });
});

removeEquipBtn.addEventListener("click",()=>{
  const id=removeEquipSelect.value;
  if(!id) return;
  if(confirm("Remove equipment?")) db.collection("equipments").doc(id).delete().then(loadEquipment);
});

function loadRemoveEquipOptions(){
  removeEquipSelect.innerHTML="";
  db.collection("equipments").get().then(snapshot=>{
    snapshot.forEach(doc=>{
      const opt=document.createElement("option");
      opt.value=doc.id;
      opt.textContent=doc.data().name;
      removeEquipSelect.appendChild(opt);
    });
  });
}

// Pending Bookings + Division Filter
function refreshPendingBookings(){
  const selectedDivision = divisionFilter.value || "All";
  tableBody.innerHTML="";
  db.collection("bookings").where("status","==","pending").get().then(snapshot=>{
    snapshot.forEach(doc=>{
      const data=doc.data();
      if(selectedDivision==="All"||data.user.division===selectedDivision){
        const row=document.createElement("tr");
        row.classList.add(data.status);
        row.innerHTML=`
          <td>${data.tokenNo}</td>
          <td>${data.equipment.equipmentName}</td>
          <td>${data.booking.date}</td>
          <td>${data.booking.timeSlot}</td>
          <td>${data.user.name}</td>
          <td>${data.user.division}</td>
          <td>${data.purpose}</td>
          <td>
            <button class="approve-btn" onclick="approveBooking('${doc.id}')">Approve</button>
            <button class="reject-btn" onclick="rejectBooking('${doc.id}')">Reject</button>
          </td>`;
        tableBody.appendChild(row);
      }
    });
  });
}

divisionFilter.addEventListener("change",refreshPendingBookings);

function updateDivisionFilter(){
  const divisions=new Set();
  db.collection("bookings").get().then(snapshot=>{
    snapshot.forEach(doc=>{ if(doc.data().user.division) divisions.add(doc.data().user.division); });
    const current=divisionFilter.value;
    divisionFilter.innerHTML=`<option value="All">All</option>`;
    divisions.forEach(div=>{
      const opt=document.createElement("option");
      opt.value=div;
      opt.textContent=div;
      divisionFilter.appendChild(opt);
    });
    if(current && [...divisions].includes(current)) divisionFilter.value=current;
  });
}

function refreshAdminTable(){ updateDivisionFilter(); refreshPendingBookings(); }

// Approve / Reject
function approveBooking(id){
  if(!confirm("Approve this booking?")) return;
  db.collection("bookings").doc(id).update({ status:"approved", "timestamps.approvedAt":firebase.firestore.FieldValue.serverTimestamp() })
    .then(()=>{ alert("Booking approved"); refreshAdminTable(); loadBookings(); });
}

function rejectBooking(id){
  if(!confirm("Reject this booking?")) return;
  db.collection("bookings").doc(id).update({ status:"rejected", "timestamps.rejectedAt":firebase.firestore.FieldValue.serverTimestamp() })
    .then(()=>{ alert("Booking rejected"); refreshAdminTable(); loadBookings(); });
}

// Initial Load
loadEquipment();