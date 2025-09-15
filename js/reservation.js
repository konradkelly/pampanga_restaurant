<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bella Vista Restaurant - Reservations</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }

        .container {
            max-width: 900px;
            margin: 0 auto;
            background: white;
            border-radius: 15px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            overflow: hidden;
        }

        .header {
            background: linear-gradient(135deg, #2c3e50 0%, #4a6741 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }

        .header h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
        }

        .header p {
            opacity: 0.9;
            font-size: 1.1em;
        }

        .step-container {
            padding: 40px;
        }

        .steps {
            display: flex;
            justify-content: center;
            margin-bottom: 40px;
            flex-wrap: wrap;
        }

        .step {
            display: flex;
            align-items: center;
            margin: 0 15px;
            opacity: 0.4;
            transition: all 0.3s ease;
        }

        .step.active {
            opacity: 1;
        }

        .step.completed {
            opacity: 0.7;
        }

        .step-number {
            width: 35px;
            height: 35px;
            border-radius: 50%;
            background: #ddd;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            margin-right: 10px;
            transition: all 0.3s ease;
        }

        .step.active .step-number {
            background: #667eea;
            color: white;
        }

        .step.completed .step-number {
            background: #27ae60;
            color: white;
        }

        .form-step {
            display: none;
        }

        .form-step.active {
            display: block;
            animation: fadeIn 0.3s ease;
        }

        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }

        .form-group {
            margin-bottom: 25px;
        }

        label {
            display: block;
            margin-bottom: 8px;
            font-weight: 600;
            color: #333;
        }

        input, select {
            width: 100%;
            padding: 12px 15px;
            border: 2px solid #e0e0e0;
            border-radius: 8px;
            font-size: 16px;
            transition: border-color 0.3s ease;
        }

        input:focus, select:focus {
            outline: none;
            border-color: #667eea;
        }

        .calendar {
            display: grid;
            grid-template-columns: repeat(7, 1fr);
            gap: 5px;
            margin-top: 15px;
        }

        .calendar-header {
            text-align: center;
            font-weight: bold;
            padding: 10px;
            background: #f8f9fa;
        }

        .calendar-day {
            aspect-ratio: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 1px solid #e0e0e0;
            cursor: pointer;
            transition: all 0.2s ease;
            background: white;
        }

        .calendar-day:hover {
            background: #f0f0f0;
        }

        .calendar-day.available {
            background: #e8f5e8;
            border-color: #27ae60;
        }

        .calendar-day.selected {
            background: #667eea;
            color: white;
        }

        .calendar-day.disabled {
            background: #f5f5f5;
            color: #ccc;
            cursor: not-allowed;
        }

        .time-slots {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
            gap: 10px;
            margin-top: 15px;
        }

        .time-slot {
            padding: 12px;
            border: 2px solid #e0e0e0;
            border-radius: 8px;
            text-align: center;
            cursor: pointer;
            transition: all 0.2s ease;
            background: white;
        }

        .time-slot:hover {
            border-color: #667eea;
        }

        .time-slot.selected {
            background: #667eea;
            color: white;
            border-color: #667eea;
        }

        .time-slot.unavailable {
            background: #f5f5f5;
            color: #ccc;
            cursor: not-allowed;
            border-color: #ddd;
        }

        .button-group {
            display: flex;
            justify-content: space-between;
            margin-top: 30px;
            flex-wrap: wrap;
            gap: 10px;
        }

        .btn {
            padding: 12px 30px;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            cursor: pointer;
            transition: all 0.3s ease;
            font-weight: 600;
        }

        .btn-primary {
            background: #667eea;
            color: white;
        }

        .btn-primary:hover {
            background: #5a6fd8;
            transform: translateY(-2px);
        }

        .btn-secondary {
            background: #f8f9fa;
            color: #333;
            border: 2px solid #e0e0e0;
        }

        .btn-secondary:hover {
            background: #e9ecef;
        }

        .summary-card {
            background: #f8f9fa;
            padding: 25px;
            border-radius: 10px;
            border: 2px solid #e0e0e0;
        }

        .summary-item {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            padding: 5px 0;
        }

        .summary-item:last-child {
            margin-bottom: 0;
            padding-top: 15px;
            border-top: 2px solid #e0e0e0;
            font-weight: bold;
        }

        .loading {
            display: none;
            text-align: center;
            color: #667eea;
            font-style: italic;
        }

        .success-message {
            display: none;
            text-align: center;
            color: #27ae60;
            background: #e8f5e8;
            padding: 20px;
            border-radius: 10px;
            margin-top: 20px;
        }

        @media (max-width: 768px) {
            .steps {
                flex-direction: column;
                align-items: center;
            }

            .step {
                margin: 5px 0;
            }

            .time-slots {
                grid-template-columns: repeat(2, 1fr);
            }

            .button-group {
                flex-direction: column;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Bella Vista Restaurant</h1>
            <p>Reserve your table for an unforgettable dining experience</p>
        </div>

        <div class="step-container">
            <div class="steps">
                <div class="step active" data-step="1">
                    <div class="step-number">1</div>
                    <div>Party Size</div>
                </div>
                <div class="step" data-step="2">
                    <div class="step-number">2</div>
                    <div>Date</div>
                </div>
                <div class="step" data-step="3">
                    <div class="step-number">3</div>
                    <div>Time</div>
                </div>
                <div class="step" data-step="4">
                    <div class="step-number">4</div>
                    <div>Details</div>
                </div>
                <div class="step" data-step="5">
                    <div class="step-number">5</div>
                    <div>Confirm</div>
                </div>
            </div>

            <!-- Step 1: Party Size -->
            <div class="form-step active" id="step1">
                <h2>How many guests?</h2>
                <div class="form-group">
                    <label for="partySize">Party Size</label>
                    <select id="partySize">
                        <option value="">Select party size</option>
                        <option value="1">1 Guest</option>
                        <option value="2">2 Guests</option>
                        <option value="3">3 Guests</option>
                        <option value="4">4 Guests</option>
                        <option value="5">5 Guests</option>
                        <option value="6">6 Guests</option>
                        <option value="7">7 Guests</option>
                        <option value="8">8 Guests</option>
                        <option value="8+">8+ Guests (Call for availability)</option>
                    </select>
                </div>
                <div class="button-group">
                    <div></div>
                    <button class="btn btn-primary" onclick="nextStep()">Next</button>
                </div>
            </div>

            <!-- Step 2: Date Selection -->
            <div class="form-step" id="step2">
                <h2>Choose your date</h2>
                <div class="form-group">
                    <label>Available Dates</label>
                    <div class="calendar" id="calendar"></div>
                </div>
                <div class="button-group">
                    <button class="btn btn-secondary" onclick="prevStep()">Back</button>
                    <button class="btn btn-primary" onclick="nextStep()">Next</button>
                </div>
            </div>

            <!-- Step 3: Time Selection -->
            <div class="form-step" id="step3">
                <h2>Select your time</h2>
                <div class="loading" id="loadingTimes">Loading available times...</div>
                <div class="form-group">
                    <label>Available Times</label>
                    <div class="time-slots" id="timeSlots"></div>
                </div>
                <div class="button-group">
                    <button class="btn btn-secondary" onclick="prevStep()">Back</button>
                    <button class="btn btn-primary" onclick="nextStep()">Next</button>
                </div>
            </div>

            <!-- Step 4: Guest Details -->
            <div class="form-step" id="step4">
                <h2>Guest Information</h2>
                <div class="form-group">
                    <label for="guestName">Full Name</label>
                    <input type="text" id="guestName" placeholder="Enter your full name">
                </div>
                <div class="form-group">
                    <label for="guestEmail">Email Address</label>
                    <input type="email" id="guestEmail" placeholder="Enter your email">
                </div>
                <div class="form-group">
                    <label for="guestPhone">Phone Number</label>
                    <input type="tel" id="guestPhone" placeholder="Enter your phone number">
                </div>
                <div class="form-group">
                    <label for="specialRequests">Special Requests (Optional)</label>
                    <input type="text" id="specialRequests" placeholder="Allergies, celebrations, preferences...">
                </div>
                <div class="button-group">
                    <button class="btn btn-secondary" onclick="prevStep()">Back</button>
                    <button class="btn btn-primary" onclick="nextStep()">Review Booking</button>
                </div>
            </div>

            <!-- Step 5: Confirmation -->
            <div class="form-step" id="step5">
                <h2>Confirm Your Reservation</h2>
                <div class="summary-card" id="reservationSummary">
                    <!-- Summary will be populated by JavaScript -->
                </div>
                <div class="button-group">
                    <button class="btn btn-secondary" onclick="prevStep()">Back</button>
                    <button class="btn btn-primary" onclick="confirmReservation()">Confirm Reservation</button>
                </div>
                <div class="success-message" id="successMessage">
                    <h3>🎉 Reservation Confirmed!</h3>
                    <p>Your table has been reserved. You'll receive a confirmation email shortly.</p>
                </div>
            </div>
        </div>
    </div>

    <script>
        // Reservation data
        let reservation = {
            partySize: '',
            date: '',
            time: '',
            guestName: '',
            guestEmail: '',
            guestPhone: '',
            specialRequests: ''
        };

        let currentStep = 1;
        const totalSteps = 5;

        // Sample availability data (in a real app, this would come from your backend)
        const availability = {
            '2025-09-15': ['6:00 PM', '6:30 PM', '7:00 PM', '8:00 PM', '8:30 PM'],
            '2025-09-16': ['6:00 PM', '7:00 PM', '7:30 PM', '8:00 PM'],
            '2025-09-17': ['6:30 PM', '7:00 PM', '8:00 PM', '8:30 PM', '9:00 PM'],
            '2025-09-18': ['6:00 PM', '6:30 PM', '7:30 PM', '8:00 PM'],
            '2025-09-19': ['6:00 PM', '7:00 PM', '7:30 PM', '8:00 PM', '8:30 PM'],
            '2025-09-20': ['6:30 PM', '7:00 PM', '8:00 PM', '9:00 PM'],
            '2025-09-21': ['6:00 PM', '6:30 PM', '7:00 PM', '7:30 PM', '8:00 PM']
        };

        function nextStep() {
            if (validateCurrentStep()) {
                updateStepDisplay(currentStep + 1);
            }
        }

        function prevStep() {
            updateStepDisplay(currentStep - 1);
        }

        function updateStepDisplay(step) {
            // Hide current step
            document.getElementById(`step${currentStep}`).classList.remove('active');
            document.querySelector(`[data-step="${currentStep}"]`).classList.remove('active');
            if (step > currentStep) {
                document.querySelector(`[data-step="${currentStep}"]`).classList.add('completed');
            } else {
                document.querySelector(`[data-step="${currentStep}"]`).classList.remove('completed');
            }

            currentStep = step;

            // Show new step
            document.getElementById(`step${currentStep}`).classList.add('active');
            document.querySelector(`[data-step="${currentStep}"]`).classList.add('active');

            // Special handling for specific steps
            if (currentStep === 2) {
                generateCalendar();
            } else if (currentStep === 3) {
                loadAvailableTimes();
            } else if (currentStep === 5) {
                generateSummary();
            }
        }

        function validateCurrentStep() {
            switch (currentStep) {
                case 1:
                    const partySize = document.getElementById('partySize').value;
                    if (!partySize) {
                        alert('Please select a party size');
                        return false;
                    }
                    reservation.partySize = partySize;
                    return true;

                case 2:
                    if (!reservation.date) {
                        alert('Please select a date');
                        return false;
                    }
                    return true;

                case 3:
                    if (!reservation.time) {
                        alert('Please select a time');
                        return false;
                    }
                    return true;

                case 4:
                    const name = document.getElementById('guestName').value.trim();
                    const email = document.getElementById('guestEmail').value.trim();
                    const phone = document.getElementById('guestPhone').value.trim();

                    if (!name || !email || !phone) {
                        alert('Please fill in all required fields');
                        return false;
                    }

                    if (!isValidEmail(email)) {
                        alert('Please enter a valid email address');
                        return false;
                    }

                    reservation.guestName = name;
                    reservation.guestEmail = email;
                    reservation.guestPhone = phone;
                    reservation.specialRequests = document.getElementById('specialRequests').value.trim();
                    return true;

                default:
                    return true;
            }
        }

        function isValidEmail(email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return emailRegex.test(email);
        }

        function generateCalendar() {
            const calendar = document.getElementById('calendar');
            calendar.innerHTML = '';

            // Add day headers
            const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            days.forEach(day => {
                const header = document.createElement('div');
                header.className = 'calendar-header';
                header.textContent = day;
                calendar.appendChild(header);
            });

            // Get current date and generate next 14 days
            const today = new Date();
            const startDate = new Date(today);
            startDate.setDate(today.getDate() + 1); // Start from tomorrow

            for (let i = 0; i < 14; i++) {
                const date = new Date(startDate);
                date.setDate(startDate.getDate() + i);
                
                const dayElement = document.createElement('div');
                dayElement.className = 'calendar-day';
                dayElement.textContent = date.getDate();
                
                const dateString = date.toISOString().split('T')[0];
                
                if (availability[dateString]) {
                    dayElement.classList.add('available');
                    dayElement.addEventListener('click', () => selectDate(dateString, dayElement));
                } else {
                    dayElement.classList.add('disabled');
                }

                calendar.appendChild(dayElement);
            }
        }

        function selectDate(dateString, element) {
            // Remove previous selection
            document.querySelectorAll('.calendar-day.selected').forEach(day => {
                day.classList.remove('selected');
            });

            // Select new date
            element.classList.add('selected');
            reservation.date = dateString;
        }

        function loadAvailableTimes() {
            const loadingEl = document.getElementById('loadingTimes');
            const timeSlotsEl = document.getElementById('timeSlots');
            
            loadingEl.style.display = 'block';
            timeSlotsEl.innerHTML = '';

            // Simulate API call delay
            setTimeout(() => {
                loadingEl.style.display = 'none';
                
                const times = availability[reservation.date] || [];
                
                times.forEach(time => {
                    const timeSlot = document.createElement('div');
                    timeSlot.className = 'time-slot';
                    timeSlot.textContent = time;
                    timeSlot.addEventListener('click', () => selectTime(time, timeSlot));
                    timeSlotsEl.appendChild(timeSlot);
                });

                if (times.length === 0) {
                    timeSlotsEl.innerHTML = '<p>No available times for this date. Please select another date.</p>';
                }
            }, 800);
        }

        function selectTime(time, element) {
            // Remove previous selection
            document.querySelectorAll('.time-slot.selected').forEach(slot => {
                slot.classList.remove('selected');
            });

            // Select new time
            element.classList.add('selected');
            reservation.time = time;
        }

        function generateSummary() {
            const summaryEl = document.getElementById('reservationSummary');
            const date = new Date(reservation.date);
            const formattedDate = date.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            });

            summaryEl.innerHTML = `
                <div class="summary-item">
                    <span>Restaurant:</span>
                    <span>Bella Vista Restaurant</span>
                </div>
                <div class="summary-item">
                    <span>Guest Name:</span>
                    <span>${reservation.guestName}</span>
                </div>
                <div class="summary-item">
                    <span>Email:</span>
                    <span>${reservation.guestEmail}</span>
                </div>
                <div class="summary-item">
                    <span>Phone:</span>
                    <span>${reservation.guestPhone}</span>
                </div>
                <div class="summary-item">
                    <span>Date:</span>
                    <span>${formattedDate}</span>
                </div>
                <div class="summary-item">
                    <span>Time:</span>
                    <span>${reservation.time}</span>
                </div>
                <div class="summary-item">
                    <span>Party Size:</span>
                    <span>${reservation.partySize} ${reservation.partySize === '1' ? 'Guest' : 'Guests'}</span>
                </div>
                ${reservation.specialRequests ? `
                <div class="summary-item">
                    <span>Special Requests:</span>
                    <span>${reservation.specialRequests}</span>
                </div>
                ` : ''}
                <div class="summary-item">
                    <span>Reservation Total:</span>
                    <span>FREE</span>
                </div>
            `;
        }

        function confirmReservation() {
            // In a real app, this would make an API call to save the reservation
            console.log('Reservation confirmed:', reservation);
            
            // Simulate API call
            const confirmBtn = document.querySelector('#step5 .btn-primary');
            const originalText = confirmBtn.textContent;
            confirmBtn.textContent = 'Confirming...';
            confirmBtn.disabled = true;

            setTimeout(() => {
                document.getElementById('reservationSummary').style.display = 'none';
                document.querySelector('#step5 .button-group').style.display = 'none';
                document.getElementById('successMessage').style.display = 'block';
                
                // In a real app, you might redirect or reset the form
            }, 2000);
        }

        // Initialize calendar when page loads
        document.addEventListener('DOMContentLoaded', function() {
            // You could add any initialization code here
        });
    </script>
</body>
</html>