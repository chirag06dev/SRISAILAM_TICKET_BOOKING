// --- CONFIGURATION ---
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzuiFNXoami-XiV6tb1yn1QybQGIW-fOHWWeV6hgSrdQCpuSzQ28iCmiJ09B6Z_Eyyy/exec";

// --- LIMITS ---
const LIMIT_BANGALORE = 155;
const LIMIT_BELAGAVI = 38;

// --- DATA ---
const bangaloreStops = [
    "ATTIGUPPE METRO STATION", "BALAMURI SRI SIDDI VINAYAKA TEMPLE, SAHAKARANAGAR", 
    "BANASHANKARI BUS STAND (VINAYAK TEMPLE)", "DLF AKSHAY NAGAR", "DODDAKALLASANDRA METRO STATION", 
    "ESTEEM MALL HEBBAL", "GORGUNTEPALYA", "JALAHALLI CROSS", "KAMAKYA THEATRE, KATRIGUPPE", 
    "KR PURAM RAILWAY STATION", "NAGARBHAVI CIRCLE (FOOTOVER BRIDGE)", "NAYANDAHALLI METRO STATION", 
    "PAVITHRA PARADISE, BASAVESHWARA NAGAR", "PRAKRUTHI APARTMENTS, RAJARAJESHAWARI NAGAR", 
    "RAJAJINAGAR METRO STATION", "ROYAL MEENAKSHI MALL", "ROYAL PARK RESIDENCY", "RR NAGAR ARCH", 
    "SMD ALTEZZ APARTMENT, WHITEFIELD", "SOAP FACTORY", "SOUTH END METRO STATION", "SUMANAHALLI BRIDGE"
].sort();

const belagaviStops = [
    "BALLARI BY-PASS", "BELAGAVI", "HOSPET BY-PASS", "HUBBALLI", "KALABHAVAN, DHARWAD", "KURNOOL"
].sort();

// --- UPI DATA ---
const qrCodes = {
    bangalore: {
        "BASAVARAJ": { name: "BASAVARAJ R YADWAD", img: "qr_basu.jpg", id: "basu.yadwad-2@okaxis" },
        "VENKAT": { name: "VENKAT S", img: "qr_venkat.jpg", id: "talk2venkat-1@oksbi" },
        "SHIVASHANKAR": { name: "SHIVASHANKAR KURADAGI", img: "qr_shiva.jpg", id: "9900990144@pthdfc" }
    },
    belagavi: { name: "VEERESH", img: "qr_veeresh.jpg", id: "9916273777" }
};

const pastParticipants = ["ABHINAV ASUNDI", "ANAND YADWAD", "ARUNKUMAR PATIL", "BASAVARAJ YADWAD"];

// --- GLOBAL STATE ---
let currentStep = 0;
let totalPassengers = 1;
let passengersData = [];
let cachedSeatData = null; 
let adminDataPromise = null;
let preparedPaymentData = null; 

// --- FUNCTIONS ---

// *** UPDATED: BOOKING IS NOW CLOSED ***
function openModal() {
    alert("⚠️ BOOKINGS CLOSED: All seats are full.");
    return; // This stops the code here. The modal will NOT open.

    // (Original code below is unreachable now, preserving logic for future use)
    /*
    const modal = document.getElementById('booking-modal');
    if(modal) {
        modal.classList.remove('hidden');
        const opt1 = document.querySelector('.seat-option');
        if(opt1) selectSeat(1, opt1);
        goToStep(0);
        
        cachedSeatData = null; 
        fetch(GOOGLE_SCRIPT_URL)
            .then(res => res.json())
            .then(data => { cachedSeatData = data; })
            .catch(err => console.error("Background sync failed", err));
    }
    */
}

function closeModal() {
    const modal = document.getElementById('booking-modal');
    if(modal) modal.classList.add('hidden');
}

function selectSeat(num, el) {
    totalPassengers = num;
    const input = document.getElementById('seat-count');
    if(input) input.value = num;
    
    document.querySelectorAll('.seat-option').forEach(opt => opt.classList.remove('selected'));
    if(el) el.classList.add('selected');
}

function startBooking() {
    try {
        const val = document.getElementById('seat-count').value;
        totalPassengers = parseInt(val) || 1; 
        generatePassengerSteps(totalPassengers);
        goToStep(1);
    } catch(e) {
        alert("System Error: " + e.message);
    }
}

function goToStep(index) {
    currentStep = index;
    const stepLabel = document.getElementById('step-number');
    
    document.getElementById('step-seats').classList.add('hidden');
    document.getElementById('step-payment').classList.add('hidden');
    document.querySelectorAll('.passenger-step').forEach(s => s.classList.add('hidden'));

    if (index === 0) {
        if(stepLabel) stepLabel.innerText = "1";
        document.getElementById('step-seats').classList.remove('hidden');
    } else if (index <= totalPassengers) {
        if(stepLabel) stepLabel.innerText = "2";
        const step = document.getElementById(`passenger-step-${index}`);
        if(step) step.classList.remove('hidden');
    } else {
        if(stepLabel) stepLabel.innerText = "3";
        checkAvailabilityAndShowPayment(); 
    }
    
    const modalContent = document.querySelector('.modal-content');
    if(modalContent) modalContent.scrollTop = 0;
}

function toggleType(idx, type) {
    const tBtn = document.getElementById(`type_trekker_${idx}`);
    const pBtn = document.getElementById(`type_pilgrim_${idx}`);
    const input = document.getElementById(`type_${idx}`);
    
    if(tBtn && pBtn && input) {
        tBtn.className = type === 'Trekker' ? 'segment-option active' : 'segment-option';
        pBtn.className = type === 'Pilgrim' ? 'segment-option active' : 'segment-option';
        input.value = type;
    }
}

function updateAgeCategoryDisplay(index, val) {
    const display = document.getElementById(`age_category_text_${index}`);
    const inputField = document.getElementById(`age_${index}`);
    const age = parseInt(val);
    if(!age) { if(display) display.innerText = ""; return; }
    
    if (age > 80) {
        alert("Age limit is 80 years.");
        if(inputField) inputField.value = ""; 
        if(display) display.innerText = ""; 
    } else {
        if(display) display.innerText = "Type of Yaatri : " + getAgeCategoryString(age);
    }
}

function getAgeCategoryString(age) {
    if (age <= 3) return "Infant";
    if (age <= 6) return "Young Children";
    if (age <= 15) return "Children";
    if (age <= 25) return "Young Adult";
    if (age <= 40) return "Adult";
    if (age <= 50) return "Senior Adult";
    if (age <= 60) return "Super Adult";
    return "Senior Citizen";
}

function generatePassengerSteps(count) {
    const container = document.getElementById('passenger-steps-container');
    if(!container) return;
    container.innerHTML = "";
    
    let opts = `<option value="" disabled selected>Select Pickup Point</option>`;
    opts += `<optgroup label="BANGALORE">` + bangaloreStops.map(s => `<option value="${s}">${s}</option>`).join('') + `</optgroup>`;
    opts += `<optgroup label="BELAGAVI">` + belagaviStops.map(s => `<option value="${s}">${s}</option>`).join('') + `</optgroup>`;

    for(let i=1; i<=count; i++) {
        const div = document.createElement('div');
        div.id = `passenger-step-${i}`;
        div.className = "step-view passenger-step hidden";
        div.innerHTML = `
            <h2 class="modal-title">Passenger ${i}</h2>
            <div class="form-group">
                <label class="field-label">Participation Type</label>
                <div class="segmented-control">
                    <div id="type_trekker_${i}" class="segment-option active" onclick="toggleType(${i}, 'Trekker')">⛰️ Trekker</div>
                    <div id="type_pilgrim_${i}" class="segment-option" onclick="toggleType(${i}, 'Pilgrim')">🚌 Pilgrim</div>
                </div>
                <input type="hidden" id="type_${i}" value="Trekker">
            </div>
            <div class="form-group"><label class="field-label">Full Name</label><input type="text" id="name_${i}" list="past-participants" placeholder="As per Aadhar"></div>
            <div style="display:flex; gap:10px;">
                <div class="form-group" style="flex:1"><label class="field-label">Gender</label><select id="gender_${i}"><option>Male</option><option>Female</option></select></div>
                <div class="form-group" style="flex:1">
                    <label class="field-label">Age (Max 80)</label>
                    <input type="number" id="age_${i}" min="1" max="80" oninput="updateAgeCategoryDisplay(${i}, this.value)">
                    <div id="age_category_text_${i}" class="age-category-display"></div>
                </div>
            </div>
            <div class="form-group"><label class="field-label">Phone</label><input type="tel" id="phone_${i}" maxlength="10"></div>
            <div class="form-group"><label class="field-label">Pickup</label><select id="pickup_${i}">${opts}</select></div>
            
            <label class="custom-checkbox-wrapper">
                <input type="checkbox" id="first_time_${i}">
                <span class="checkmark"></span>
                <span class="checkbox-text">First time joining?</span>
            </label>

            <div class="health-declaration-box">
                <h4>Health Declaration</h4>
                <p>I hereby declare that I have NOT been suffering from any infectious diseases and do not cause any problem to other co-yaatris.</p>
                <p>I am fully aware about the risks associated with this paadayatre. If I participate in paadayatre, I also confirm that I am physically fit and fine to take up this paadayatre.</p>
                <p>I understand that carrying/usage of plastic, Liquor, match boxes, any weapons and hazardous items, lighting fire, cooking etc. are strictly prohibited.</p>
                <p>I also would confirm that</p>
                <ul>
                    <li>I don’t cause any harm and disturbance to wildlife and its habitant.</li>
                    <li>I do not light fire or smoke inside the forest.</li>
                    <li>I am aware of legalities involved in such violations and relevant acts and rules.</li>
                </ul>
                <p>I will abide to the guidelines given by the forest department staff.</p>
            </div>

            <label class="custom-checkbox-wrapper">
                <input type="checkbox" id="health_${i}">
                <span class="checkmark"></span>
                <span class="checkbox-text" style="color:#d35400; font-weight:700;">I Agree & Declare (Mandatory)</span>
            </label>

            <button class="primary-btn black-btn" onclick="validateAndNext(${i})" style="margin-top:20px;">Next</button>
        `;
        container.appendChild(div);
    }
    
    const dl = document.getElementById('past-participants');
    if(dl) {
        dl.innerHTML = "";
        pastParticipants.forEach(n => { 
            let opt = document.createElement('option'); 
            opt.value = n; 
            dl.appendChild(opt); 
        });
    }
}

function validateAndNext(i) {
    const name = document.getElementById(`name_${i}`).value;
    const age = document.getElementById(`age_${i}`).value;
    const phone = document.getElementById(`phone_${i}`).value;
    const pickup = document.getElementById(`pickup_${i}`).value;
    const health = document.getElementById(`health_${i}`).checked;
    const firstTime = document.getElementById(`first_time_${i}`).checked;
    
    if(!name || !age || !phone || !pickup) { alert("Please fill all details"); return; }
    if(parseInt(age) > 80) { alert("Age limit is 80."); return; }
    if(!health) { alert("Please accept the health declaration"); return; }

    passengersData[i-1] = {
        fullName: name, 
        age: age, 
        phone: phone, 
        pickup: pickup,
        type: document.getElementById(`type_${i}`).value,
        gender: document.getElementById(`gender_${i}`).value,
        firstTime: firstTime ? "Yes" : "No",
        category: getAgeCategoryString(age)
    };
    goToStep(i+1);
}

// --- OPTIMIZED AVAILABILITY CHECK ---
function checkAvailabilityAndShowPayment() {
    const btn = document.querySelector(`#passenger-step-${totalPassengers} button`);
    if(btn) { btn.disabled = true; btn.innerText = "Checking availability..."; }

    if(cachedSeatData) {
        processSeatLimit(cachedSeatData, btn);
    } else {
        fetch(GOOGLE_SCRIPT_URL)
        .then(res => res.json())
        .then(data => {
            cachedSeatData = data; 
            processSeatLimit(data, btn);
        })
        .catch(err => {
            console.error(err);
            alert("Could not verify seat count. Proceeding...");
            if(btn) { btn.disabled = false; btn.innerText = "Next"; }
            showPayment();
        });
    }
}

function processSeatLimit(data, btn) {
    let blrCount = 0, belCount = 0;
    data.forEach(p => {
        if(bangaloreStops.includes(p.pickup)) blrCount++;
        else belCount++;
    });

    const firstPickup = passengersData[0].pickup;
    const isBangalore = bangaloreStops.includes(firstPickup);
    
    if (isBangalore) {
        // BLOCKED FOR BANGALORE
        alert("Banglore buses seats are full");
        if(btn) { btn.disabled = false; btn.innerText = "Next"; }
        return; 
    } else {
        if (belCount + totalPassengers > LIMIT_BELAGAVI) {
            alert(`Sorry, seats for BELAGAVI are full! (Remaining: ${Math.max(0, LIMIT_BELAGAVI - belCount)})`);
            if(btn) { btn.disabled = false; btn.innerText = "Next"; }
            return; 
        }
    }

    if(btn) { btn.disabled = false; btn.innerText = "Next"; }
    showPayment();
}

function showPayment() {
    const payStep = document.getElementById('step-payment');
    if(payStep) payStep.classList.remove('hidden');
    
    const firstPickup = passengersData[0].pickup;
    const dropdownDiv = document.getElementById('bangalore-payee-select');
    const detailsDiv = document.getElementById('payment-details-wrapper');
    const dropdown = document.getElementById('payee-dropdown');

    if(dropdown) dropdown.selectedIndex = 0; 
    
    if (bangaloreStops.includes(firstPickup)) {
        if(dropdownDiv) dropdownDiv.classList.remove('hidden');
        if(detailsDiv) detailsDiv.classList.add('hidden');
    } else {
        if(dropdownDiv) dropdownDiv.classList.add('hidden');
        if(detailsDiv) detailsDiv.classList.remove('hidden');
        renderPayeeDetails(qrCodes.belagavi);
    }
}

function updateBangalorePayee(key) {
    if (!key) return;
    const payee = qrCodes.bangalore[key];
    renderPayeeDetails(payee);
    const detailsDiv = document.getElementById('payment-details-wrapper');
    if(detailsDiv) detailsDiv.classList.remove('hidden');
}

function renderPayeeDetails(payee) {
    const qrImg = document.getElementById('payment-qr');
    const nameTxt = document.getElementById('pay-to-name-large');
    const upiTxt = document.getElementById('upi-id-display');
    
    if(qrImg) qrImg.src = payee.img;
    if(nameTxt) nameTxt.innerText = "Pay to: " + payee.name;
    if(upiTxt) upiTxt.innerText = payee.id || "UPI ID";
}

function copyUPI() {
    const el = document.getElementById('upi-id-display');
    if(!el) return;
    const text = el.innerText;
    navigator.clipboard.writeText(text).then(() => {
        const toast = document.getElementById('copy-toast');
        if(toast) {
            toast.classList.remove('hidden');
            setTimeout(() => toast.classList.add('hidden'), 2000);
        }
    }).catch(err => {
        alert("Copy manually: " + text);
    });
}

function handleFileSelect(input) {
    if(input.files.length > 0) {
        const txt = document.getElementById('file-text');
        const wrap = document.getElementById('upload-wrapper');
        if(txt) txt.innerText = "Selected: " + input.files[0].name;
        if(wrap) wrap.classList.add('file-selected');

        const reader = new FileReader();
        reader.onload = function(e) {
            const img = new Image();
            img.src = e.target.result;
            img.onload = function() {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 450; 
                let width = img.width;
                let height = img.height;

                if (width > MAX_WIDTH) {
                    height *= MAX_WIDTH / width;
                    width = MAX_WIDTH;
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                preparedPaymentData = canvas.toDataURL('image/jpeg', 0.4); 
            }
        };
        reader.readAsDataURL(input.files[0]);
    }
}

function submitBooking() {
    if(!preparedPaymentData) { alert("Please upload payment screenshot."); return; }

    const firstPickup = passengersData[0].pickup;
    let paidToName = "Unknown";

    if (belagaviStops.includes(firstPickup)) {
        paidToName = "VEERESH G";
    } else {
        const dropdown = document.getElementById('payee-dropdown');
        const key = dropdown ? dropdown.value : null; 
        if(key && qrCodes.bangalore[key]) {
            paidToName = qrCodes.bangalore[key].name;
        } else {
            paidToName = "BANGALORE (Not Selected)";
        }
    }

    const btn = document.querySelector('.submit-btn');
    if(btn) { btn.innerText = "Confirming..."; btn.disabled = true; }
    
    const payload = {
        bookingId: "YATRA-" + Math.floor(1000 + Math.random()*9000),
        passengers: passengersData,
        paymentImage: preparedPaymentData, 
        paidTo: paidToName 
    };
    
    fetch(GOOGLE_SCRIPT_URL, { method: "POST", body: JSON.stringify(payload) })
    .then(res => res.json())
    .then(data => {
        const payStep = document.getElementById('step-payment');
        if(payStep) payStep.classList.add('hidden');
        
        const list = data.bookings ? data.bookings : [];
        let htmlList = '';
        list.forEach(b => {
            htmlList += `<div style="margin-bottom:8px;"><strong>${b.name}</strong><br><span style="color:#34C759; font-weight:700">${b.id}</span></div>`;
        });

        const screen = document.getElementById('success-screen');
        if(screen) {
            screen.innerHTML = `
                <div style="text-align:center; padding:20px;">
                    <img src="shiva_lingam.png" style="width:80px; margin-bottom:20px;">
                    <h2 style="font-size:32px; margin-bottom:10px;">Booking Confirmed!</h2>
                    <div style="background:#f5f5f7; padding:20px; border-radius:16px; text-align:left; margin-bottom:20px;">${htmlList}</div>
                    <button onclick="window.location.reload()" class="primary-btn black-btn">Done</button>
                </div>
            `;
            screen.classList.remove('hidden');
        }
    })
    .catch(err => {
        alert("Error: " + err.message);
        if(btn) { btn.innerText = "Retry"; btn.disabled = false; }
    });
}

function openAdminLogin() {
    adminDataPromise = fetch(GOOGLE_SCRIPT_URL).then(res => res.json());

    const input = prompt("Admin Password:");
    const pwd = input ? input.trim() : "";
    const keyPart1 = "MB";
    const keyPart2 = "hramara";
    const keyPart3 = "@26";
    
    if(pwd === keyPart1 + keyPart2 + keyPart3) {
        document.getElementById('admin-dashboard').classList.remove('hidden');
        loadAdminData();
    } else if (input !== null) { 
        alert("Invalid Password");
    }
}

function closeAdmin() { 
    const dash = document.getElementById('admin-dashboard');
    if(dash) dash.classList.add('hidden'); 
}

function loadAdminData() {
    const statsDiv = document.getElementById('demo-stats');
    if(statsDiv) statsDiv.innerText = "Loading...";
    
    const promise = adminDataPromise || fetch(GOOGLE_SCRIPT_URL).then(res => res.json());

    promise.then(data => {
        let blrCount = 0, belCount = 0;
        const blrList = [], belList = [];
        data.forEach(p => {
            if(bangaloreStops.includes(p.pickup)) { blrCount++; blrList.push(p); }
            else { belCount++; belList.push(p); }
        });
        
        if(statsDiv) statsDiv.innerText = `Total: ${data.length}`;
        const busStats = document.getElementById('bus-stats');
        if(busStats) busStats.innerHTML = `BANGALORE: ${blrCount}/${LIMIT_BANGALORE} <br> BELAGAVI: ${belCount}/${LIMIT_BELAGAVI}`;
        
        const render = (tableId, list) => {
            const table = document.getElementById(tableId);
            if(!table) return;
            const tbody = table.querySelector('tbody');
            if(!tbody) return;
            
            tbody.innerHTML = "";
            list.forEach(r => {
                const row = document.createElement('tr');
                const c1 = document.createElement('td'); c1.textContent = r.name;
                const c2 = document.createElement('td'); c2.textContent = r.phone;
                const c3 = document.createElement('td'); c3.textContent = r.pickup;
                row.append(c1, c2, c3);
                tbody.appendChild(row);
            });
        };
        render('table-bangalore', blrList);
        render('table-belagavi', belList);
    });
}

function downloadExcel(type) {
    const table = document.getElementById(`table-${type}`);
    if(table) {
        const wb = XLSX.utils.table_to_book(table);
        XLSX.writeFile(wb, `Manifest_${type}.xlsx`);
    }
}