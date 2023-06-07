'use strict';

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');
const deleteAllBtn = document.getElementById('deleteAll-btn');
const deleteBtn = document.querySelectorAll('.delete_btn');

let map, mapEvent;

class Workout {
    
    constructor(coords, distance, duration) {
        this.date = new Date();
        this.id = (Date.now() + ''.slice(-5));
        this.click = 0;
        this.coords = coords;
        this.distance = distance;
        this.duration = duration;
    }

    // Increamentclick() {
    //     this.click++;
    // }
}

class Cycling extends Workout {
    type = 'cycling';
    emoji = '🚴‍♀️';
    constructor(coords, distance, duration, elevationGain) {
        super(coords, distance, duration);
        this.elevationGain = elevationGain;
        this.calculateElevation();
    }

    calculateElevation() {
        this.speed = this.distance / this.duration;
        return this.speed;
    }
}

class Running extends Workout {
    type = 'running';
    emoji = '🏃‍♂️';
    constructor(coords, distance, duration, cadence) {
        super(coords, distance, duration);
        this.cadence = cadence;
        this.calculateStep();
    }

    calculateStep() {
        this.step = this.distance / this.duration;
        return this.step;
    }
}

// const cycle = new Cycling([39,-12],27,95,523);
// console.log(cycle)
// // const r = cycle.calculateElevation();
// // console.log(r)

class App {

    #map;
    #mapEvent;
    #workoutList = [];

    constructor() {
        this.getPosition();

        this.getLocalStorageData();

        form.addEventListener('submit', this.newWorkout.bind(this));

        inputType.addEventListener('change', this.toggleElevationField.bind(this));

        containerWorkouts.addEventListener('click', this.moveToLocation.bind(this));

        deleteAllBtn.addEventListener('click', this.deleteAllData.bind(this));

        deleteBtn.forEach((btn) => btn.onclick = this.deleteData.bind(this));
    }

    getPosition() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(this.loadMap.bind(this),
                function () {
                    alert("Please Allow Location Permission...");
                },
                { enableHighAccuracy: true })
        }

    }

    loadMap(position) {

        const { latitude, longitude } = position.coords;
        // console.log(latitude, longitude);
        const coordination_arr = [latitude, longitude];
        //Leaflet library for map
        this.#map = L.map('map').setView(coordination_arr, 13);

        L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(this.#map);

        L.marker(coordination_arr).addTo(this.#map)
            .bindPopup('A pretty CSS popup.<br> Easily customizable.')
            .openPopup();

        this.#map.on('click', this.showForm.bind(this));

        //render markers after map is ready
        this.#workoutList.forEach((workout) => {
            this.renderWorkoutMarker(workout);
        })
    }

    showForm(mapE) {
        // console.log(mapE)
        this.#mapEvent = mapE;
        // console.log(this.#mapEvent);
        form.classList.remove('hidden');
        inputDistance.focus();
    }

    toggleElevationField() {
        inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
        inputElevation.closest('.form__row').classList.toggle('form__row--hidden');

        if (inputCadence.closest('.form__row').classList.contains('form__row--hidden')) {
            inputElevation.setAttribute('required', 'true');
        } else {
            inputCadence.setAttribute('required', 'true');
        }
    }

    newWorkout(e) {
        e.preventDefault();

        const type = inputType.value;
        const distance = Number(inputDistance.value);
        const duration = Number(inputDuration.value);
        let workout;

        const { lat, lng } = this.#mapEvent.latlng;

        const validInputs = (...inputs) => inputs.every(inp => Number.isFinite(inp));

        const testPositiveValue = (...inputs) => inputs.every(inp => inp > 0);

        if (type === 'running') {
            const cadence = Number(inputCadence.value);
            if (!validInputs(distance, duration, cadence))
                return alert('Please enter positive Number in the field...');
            if (!testPositiveValue(distance, duration, cadence))
                return alert('Enter positive number...');

            //if all the conditions are true then create an object
            workout = new Running([lat, lng], distance, duration, cadence);

        }

        if (type === 'cycling') {
            const elevation = Number(inputElevation.value);
            if (!validInputs(distance, duration, elevation))
                return alert('Please enter positive Number in the field...');
            if (!testPositiveValue(distance, duration))
                return alert('Enter positive number...');

            workout = new Cycling([lat, lng], distance, duration, elevation);
        }

        this.#workoutList.push(workout);
        // console.log(this.#workoutList);
        this.renderWorkoutMarker(workout);
        this.renderWorkout(workout);
        this.hideForm();

        //localstorage API
        this.setDataIntoLocalStorage();


    }


    //hiding the form when form data has been submited...
    hideForm() {
        inputCadence.value = inputDistance.value = inputDuration.value = inputElevation.value = '';
        form.style.display = 'none';
        form.classList.add('hidden');
        setTimeout(() => (form.style.display = 'grid'), 1000);
    }

    renderWorkout(workout) {
        const des = this.setDiscriptionOfWorkoutList(workout);
        let html = `<li class="workout workout--${workout.type}" data-id="${workout.id}">
        <h2 class="workout__title">${des}</h2>
        <button class="delete_btn" onclick>❎</button>
        <div class="workout__details">
          <span class="workout__icon">${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'}</span>
          <span class="workout__value">${workout.distance}</span>
          <span class="workout__unit">km</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">⏱</span>
          <span class="workout__value">${workout.duration}</span>
          <span class="workout__unit">min</span>
        </div>`;

        if (workout.type === 'running') {
            html += `
            <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.step.toFixed(1)}</span>
            <span class="workout__unit">min/km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">🦶🏼</span>
            <span class="workout__value">${workout.cadence}</span>
            <span class="workout__unit">spm</span>
          </div>
        </li>`;
            form.insertAdjacentHTML('afterend', html);
        }

        if (workout.type === 'cycling') {
            html += `
            <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.speed.toFixed(1)}</span>
            <span class="workout__unit">km/h</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⛰</span>
            <span class="workout__value">${workout.elevationGain}</span>
            <span class="workout__unit">m</span>
          </div>
        </li>`;
            form.insertAdjacentHTML('afterend', html);
        }

    }

    setDiscriptionOfWorkoutList(workout) {
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

        //creating workoutDate object from workout.date because workout.date gives current date and time not a valid Date object...
        const workoutDate = new Date(workout.date);
        
        this.description = `${workout.type.charAt(0).toUpperCase().concat(workout.type.slice(1))} on ${months[workoutDate.getMonth()]} ${workoutDate.getDate()}`;
        // console.log(this.description)
        return this.description;
    }

    renderWorkoutMarker(workout) {
        L.marker(workout.coords).addTo(this.#map)
            .bindPopup(L.popup({
                autoClose: false,
                closeOnClick: false, //ESC key closing popup,
                className: `${workout.type}-popup`,
            })).setPopupContent(`${workout.emoji}` + this.setDiscriptionOfWorkoutList(workout))
            .openPopup();
        // console.log(`${workout.type}`)
        inputCadence.value = inputDistance.value = inputDuration.value = inputElevation.value = ' ';

    }

    moveToLocation(e) {
        const adjParentElement = e.target.closest('.workout');
        const clickedElement = e.target;
        // console.log(adjParentElement);
        if( clickedElement.getAttribute('class') === 'delete_btn') {
            this.deleteData.bind(this)(clickedElement);
        }

        //when we write into the input field of the form then we click on the form so because of event delegation this event occure and ..
        //to stop this event for particularly input field we have to provide condition....
        if (!adjParentElement) return;
        // console.log(adjParentElement.dataset.id)

        // console.log(adjParentElement.dataset.id)
        const workout = this.#workoutList.find((workout) => workout.id === adjParentElement.dataset.id);
        // console.log(workout);

        this.#map.setView(workout.coords, 13, {
            animate: true,
            pan: {
                duration: 1,
            }
        });
        // workout.Increamentclick();
    }

    setDataIntoLocalStorage() {
        localStorage.setItem('workouts', JSON.stringify(this.#workoutList));
    }

    getLocalStorageData() {
        const data = JSON.parse(localStorage.getItem('workouts'));
        // console.log(data);

        if (!data) return;

        this.#workoutList = data;
        this.#workoutList.forEach((workout) => {
            this.renderWorkout(workout);
        });
    }


    deleteAllData () {
        localStorage.removeItem('workouts');
        location.reload();
    }

    deleteData(clickedElement) {
        const tar =clickedElement.closest('.workout');
        // console.log(tar);
        const id = tar.dataset.id;
        //data is array of object
        const data = JSON.parse(localStorage.getItem('workouts'));

        const targetIndex = data.findIndex((item) => item.id === id);
        console.log(targetIndex)
 
        if(targetIndex !== -1) {
            data.splice(targetIndex,1);
            localStorage.setItem('workouts', JSON.stringify(data));
            location.reload();
        }
    }
}

const app = new App();
