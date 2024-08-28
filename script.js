

const demosSection = document.getElementById('demos');

var model = undefined;

/******************************** Loading the model ************************************/

cocoSsd.load().then(function (loadedModel) {
  model = loadedModel;
  // Show demo section now the model is ready to use.
  demosSection.classList.remove('invisible');
});

/******************************** Camera Setup ************************************/

const video = document.getElementById('webcam');
const liveView = document.getElementById('liveView');

// Check if webcam access is supported.
function hasGetUserMedia() {
  return !!(navigator.mediaDevices &&
    navigator.mediaDevices.getUserMedia);
}

// Keep a reference to all the child elements we create for removal.
var children = [];

// Check if the webcam is supported
if (hasGetUserMedia()) {
  const enableWebcamButton = document.getElementById('webcamButton');
  enableWebcamButton.addEventListener('click', enableCam);
} else {
  console.warn('getUserMedia() is not supported by your browser');
}

// Enable the live webcam view and start classification.
function enableCam(event) {
  if (!model) {
    console.log('Wait! Model not loaded yet.');
    return;
  }

  // Hide the button.
  event.target.classList.add('removed');

  // getUsermedia parameters.
  const constraints = {
    video: true
  };

  // Activate the webcam stream.
  navigator.mediaDevices.getUserMedia(constraints).then(function (stream) {
    video.srcObject = stream;
    video.addEventListener('loadeddata', predictWebcam);
  });
}

/******************************** Timer of the interview ************************************/

let startTime = 0;// Variable to store the start time
let endTime;   // Variable to store the end time
let elapsedSeconds = 0; // Variable to store the elapsed time in seconds
let timerInterval; // Variable to store the interval for updating the timer display

//*** Off-screen time counter ****/
let countOfZeroPeopleDetected = 0;
let thereArePeopleOnTheScreen = 0;

document.getElementById("webcamButton").addEventListener("click", function () {
  // Start the timer when "Enable Webcam" button is clicked
  startTime = new Date().getTime(); // Get the current time in milliseconds
  updateTimer(); // Update the timer display immediately

  // Set up an interval to update the timer display every second
  timerInterval = setInterval(updateTimer, 1000);
});

document.getElementById("endInterview").addEventListener("click", function () {
  // Stop the timer when "Finish the interview" button is clicked
  clearInterval(timerInterval); // Clear the interval
  endTime = new Date().getTime(); // Get the current time in milliseconds
  calculateElapsedSeconds(); // Calculate the elapsed time in seconds
  updateTimerDisplay(); // Update the timer display on the webpage


  const percentage = (countOfZeroPeopleDetected / thereArePeopleOnTheScreen) * 100;
  const roundedPercentage = Math.round(percentage * 100) / 100; // Rounds to 2 decimal places
  console.log("Off-screen time: " + roundedPercentage + " %")


});



function updateTimerDisplay() {
  // Update the timer display with the elapsed time
  const formattedTime = formatTime(elapsedSeconds);
  const timerDisplay = document.getElementById("timerDisplay");
  timerDisplay.textContent = "Elapsed Time: " + formattedTime;
}

function updateTimer() {
  // Update the timer display with the elapsed time
  const currentTime = new Date().getTime();
  elapsedSeconds = Math.floor((currentTime - startTime) / 1000);
  // Display the elapsed time in a desired format (e.g., HH:MM:SS)
  const formattedTime = formatTime(elapsedSeconds);
  console.log(formattedTime); // Display the formatted time (you can update this to show it on the webpage)
}

function calculateElapsedSeconds() {
  // Calculate the total elapsed time in seconds
  elapsedSeconds = Math.floor((endTime - startTime) / 1000);
  console.log("Total interview time: " + elapsedSeconds + " seconds"); 
}

function formatTime(seconds) {
  // Format the time in HH:MM:SS
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  return (
    padZero(hours) + ":" + padZero(minutes) + ":" + padZero(remainingSeconds)
  );
}

function padZero(num) {
  // Helper function to add a leading zero to single-digit numbers
  return num < 10 ? "0" + num : num;
}

/******************************** Prediction loop! ***********************************/

function predictWebcam() {
  const phoneAlertButton = document.getElementById('phoneAlertButton');
  let numberOfPeopleDetected = 0;

  // Now let's start classifying the stream.
  model.detect(video).then(function (predictions) {
    // Remove any highlighting from the previous frame.
    for (let i = 0; i < children.length; i++) {
      liveView.removeChild(children[i]);
    }
    children.splice(0);

    // Now let's loop through predictions and draw them to the live view if they have a high confidence score.
    for (let n = 0; n < predictions.length; n++) {
      if (predictions[n].class === 'person' && predictions[n].score > 0.66) {
        numberOfPeopleDetected++;
        isPersonVisible = true;
        
      }

      const peopleCountElement = document.getElementById('peopleCount');
      peopleCountElement.textContent = `検出された人数: ${numberOfPeopleDetected}`;


      // If we are over 66% sure we classified it right, draw it!
      if (predictions[n].score > 0.66) {
        const p = document.createElement('p');
        p.innerText = predictions[n].class + ' - with ' + Math.round(parseFloat(predictions[n].score) * 100) + '% confidence.';
        p.style = 'left: ' + predictions[n].bbox[0] + 'px;' +
          'top: ' + predictions[n].bbox[1] + 'px;' +
          'width: ' + (predictions[n].bbox[2] - 10) + 'px;';

        const highlighter = document.createElement('div');
        highlighter.setAttribute('class', 'highlighter');
        highlighter.style = 'left: ' + predictions[n].bbox[0] + 'px; top: ' +
          predictions[n].bbox[1] + 'px; width: ' +
          predictions[n].bbox[2] + 'px; height: ' +
          predictions[n].bbox[3] + 'px;';

        liveView.appendChild(highlighter);
        liveView.appendChild(p);

        children.push(highlighter);
        children.push(p);

        const detectedClassDiv = document.getElementById('detectedClass');
        detectedClassDiv.innerText = `検出クラス: ${predictions[n].class}`;
      } 


      if (predictions[n].class === 'cell phone') {
        phoneAlertButton.style.display = 'block';
      } else {
        phoneAlertButton.style.display = 'none';
      }


      if (numberOfPeopleDetected === 0){
        console.log("Person left the screen")
        countOfZeroPeopleDetected++;
      } else if (numberOfPeopleDetected > 0){
        thereArePeopleOnTheScreen++;
      }

      
    }

    window.requestAnimationFrame(predictWebcam);
  });
}
