let recognition;
let currentSpeechLang = "en-US";
let systemState = "idle";

let emailID = "";
let password = "";

const spokenBox = () => document.getElementById("spokenText");
const passwordSection = () => document.getElementById("passwordSection");
const passwordInput = () => document.getElementById("passwordInput");

/* ================= SPEAK ================= */

function speak(text, callback){

    const msg = new SpeechSynthesisUtterance(text);
    msg.lang = currentSpeechLang;

    msg.onend = function(){
        if(callback) callback();
    };

    speechSynthesis.cancel();
    speechSynthesis.speak(msg);

    spokenBox().innerText += "\nSystem: " + text;
}

/* ================= BEEP ================= */

function beep(){

    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();

    osc.type = "sine";
    osc.frequency.setValueAtTime(850, audioCtx.currentTime);

    osc.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + 0.2);
}

/* ================= LISTEN ================= */

function listen(callback){

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;

    recognition = new SR();
    recognition.lang = currentSpeechLang;
    recognition.interimResults = false;
    recognition.continuous = false;

    recognition.onresult = function(event){

        let text = event.results[0][0].transcript.trim().toLowerCase();

        spokenBox().innerText += "\nYou: " + text;

        callback(text);
    };

    recognition.onerror = function(){

        speak("I did not hear you. Please try again.", () => {

            beep();
            setTimeout(() => listen(callback), 600);

        });
    };

    recognition.start();
}

/* ================= START ASSISTANT ================= */

function startVoiceAssistant(){

    spokenBox().innerText = "";

    speak(
        "Voice assistant started. Which language do you prefer? English, Tamil, Hindi, Telugu or Malayalam?",
        () => {

            beep();

            systemState = "language";

            setTimeout(() => listen(handleCommand), 600);
        }
    );
}

/* ================= HANDLE COMMAND ================= */

function handleCommand(text){

/* ===== EXIT ===== */

if(text.includes("quit") || text.includes("exit") || text.includes("stop")){

fetch("/logout");

speak("Voice assistant stopped. Goodbye.");

systemState="idle";

if(recognition) recognition.stop();

return;
}

/* ===== LANGUAGE ===== */

if(systemState === "language"){

if(text.includes("tamil")){

currentSpeechLang="ta-IN";

speak("மொழி தமிழ் அமைக்கப்பட்டது. உங்கள் மின்னஞ்சல் ஐடி சொல்லுங்கள்.",()=>{

beep();
systemState="email";
setTimeout(()=>listen(handleCommand),600);

});

}

else if(text.includes("hindi")){

currentSpeechLang="hi-IN";

speak("भाषा हिंदी सेट की गई है। अपना जीमेल आईडी बोलिए।",()=>{

beep();
systemState="email";
setTimeout(()=>listen(handleCommand),600);

});

}

else if(text.includes("telugu")){

currentSpeechLang="te-IN";

speak("భాష తెలుగుగా మార్చబడింది. మీ జీమెయిల్ ఐడి చెప్పండి.",()=>{

beep();
systemState="email";
setTimeout(()=>listen(handleCommand),600);

});

}

else if(text.includes("malayalam")){

currentSpeechLang="ml-IN";

speak("ഭാഷ മലയാളമായി സജ്ജമാക്കി. നിങ്ങളുടെ ജിമെയിൽ ഐഡി പറയുക.",()=>{

beep();
systemState="email";
setTimeout(()=>listen(handleCommand),600);

});

}

else{

currentSpeechLang="en-US";

speak("Language set to English. Tell your Gmail ID.",()=>{

beep();
systemState="email";
setTimeout(()=>listen(handleCommand),600);

});

}

return;
}

/* ===== EMAIL ===== */

if(systemState==="email"){

emailID = normalizeEmail(text);

speak(
"You said "+emailID+". Please type your app password in the input box.",
()=>{

passwordSection().style.display="block";

passwordInput().focus();

systemState="waiting_password";

});

return;
}

/* ===== MENU COMMANDS ===== */

if(systemState==="menu"){

if(text.includes("send")){

speak("Opening send mail page.",()=>{
window.location.href="/send";
});

}

else if(text.includes("inbox")){

speak("Opening inbox page.",()=>{
window.location.href="/inbox";
});

}

else if(text.includes("otp")){

speak("Opening otp page.",()=>{
window.location.href="/otp";
});

}

else{

speak("Say send mail, check inbox or generate otp.",()=>{

beep();
setTimeout(()=>listen(handleCommand),600);

});

}

return;
}

}

/* ================= PASSWORD INPUT ================= */

passwordInput().addEventListener("keydown",function(e){

if(e.key==="Enter"){

password=this.value.trim();

if(!password){

speak("Password cannot be empty.");

return;
}

fetch("/set_credentials",{

method:"POST",
headers:{"Content-Type":"application/json"},
body:JSON.stringify({

email:emailID,
password:password

})

})

.then(res=>res.json())
.then(data=>{

if(data.status){

passwordSection().style.display="none";

this.value="";

speak("Login successful. Opening menu page.",()=>{

window.location.href="/menu";

});

}

else{

speak("Login failed. Please type password again.");

this.value="";

}

});

}

});

/* ================= EMAIL NORMALIZER ================= */

function normalizeEmail(text){

let email=text.toLowerCase().trim();

email=email.replace(/\s+/g,"");

email=email.replace(/attherate|at the rate|at/g,"@");

email=email.replace(/dot/g,".");

if(email.includes("@gmail.com")) return email;

if(email.includes("@gmail") && !email.includes(".com"))
return email+".com";

if(!email.includes("@"))
return email+"@gmail.com";

return email;

}


