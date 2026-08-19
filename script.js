const optionsButton = document.getElementById("options");
const optionsCloseButton = document.getElementById("optionsClose");
const layer1 = document.getElementById("layer1");

optionsButton.addEventListener("click", () => {
    layer1.classList.toggle("hide");
});

optionsCloseButton.addEventListener("click", () => {
    layer1.classList.toggle("hide");
});

// themeslop taken from https://explainers.dev/css-theme-switcher/


// creates fieldset where the radio buttons go
if (document.querySelector("#themeselect")) {

    const themeNames = ["Basic White", "Basic Dark", "Funky"];
    const themePath = ["./stylesheets/"];
    const ssNum = document.querySelectorAll("link[rel='stylesheet']").length;
    const theme = localStorage.getItem('userTheme');

    if (theme !== null && theme !== 'basic-white') createLink(theme);

    const fieldset = document.createElement('fieldset');
    const legend = document.createElement("legend");
    legend.innerText = "Select Theme";
    fieldset.appendChild(legend);

    themeNames.forEach((themeName) => {
        let input = document.createElement("input");
        let label = document.createElement("label");
        input.setAttribute("type", "radio");
        input.setAttribute("name", "stylesheet");

        // if it's the first pass, add default theme (basic white)
        if (themeName === themeNames[0]) {
            input.setAttribute("id", "basic-white");
            input.setAttribute("value", "basic-white");
            // initially, basic white is selected
            input.checked = true;
            label.setAttribute("for", "basic-white");
        } // otherwise add the values for the alternate themes
        else {
            // format theme for use as an ID
            let themeSlug = themeName.toLowerCase().replace(" ", "-");
            input.setAttribute("id", themeSlug);
            input.setAttribute("value", themeSlug);
            if (theme === themeSlug) input.checked = true; // if the theme is not basic white, set the button to checked
            label.setAttribute("for", themeSlug);
        }

        label.textContent = themeName;
        fieldset.appendChild(input);
        fieldset.appendChild(label);

        document.querySelector("#themeselect").appendChild(fieldset);
    });

    fieldset.addEventListener("change", (event) => {
        let selectedTheme = event.target.value;
        let stylesheets = document.querySelectorAll("link[rel='stylesheet']");
        if (stylesheets.length > ssNum && selectedTheme === "Basic White"){
            document.querySelector('head').removeChild(stylesheets[ssNum]);
        }
        else if (stylesheets.length > ssNum && selectedTheme !== "Basic White") {
            stylesheets[ssNum].setAttribute('href', themePath + selectedTheme + ".css");
        }
        else {
            createLink(selectedTheme);
            localStorage.setItem('userTheme', selectedTheme);
        }
    });

    function createLink(themeFile) {
        let link = document.createElement("link");
        link.setAttribute("rel", "stylesheet");
        link.setAttribute("href", themePath + themeFile + ".css");
        document.querySelector("head").appendChild(link);
    }
}




// ------------------ functionality - complete, no touchy ---------------

const RPC_URL = "ws://127.0.0.1:17893/";
let socket = null;
const consoles = ["Nintendo Switch 2", "Nintendo Switch", "Wii U", "Nintendo 3DS", "Wii", "Nintendo DS", "Nintendo GameCube", "Game Boy Advance", "Nintendo 64", "Virtual Boy", "Super Nintendo Entertainment System", "Game Boy", "Nintendo Entertainment System"];

function updateTrack(track) {
    if (!track) {
        // fallback data if no music is playing (i.e. just opened NM)
        document.getElementById("song").textContent = "Nothing Playing";
        document.getElementById("game").textContent = "No Video Games";
        document.getElementById("hardware").textContent = "No Console";
        document.getElementById("playlist").textContent = "No Playlist";
        document.getElementById("status").textContent = "Nothing playing";
        document.getElementById("thumbnail").removeAttribute("src");
        return;
    }

    // song game and playlist variables are analagous to track.track, track.game, track.playlist from the JSON object respectively
    const song = track.track || {};
    const game = track.game || {};
    const playlist = track.playlist || {};

    document.getElementById("song").textContent = song.name || "Unknown"; // either the song name or the fallback string if it's illegal
    document.getElementById("game").textContent = game.gameName || "Unknown"; // ditto
    document.getElementById("hardware").textContent = game.formalHardware || "Unknown"; // ditto
    document.getElementById("playlist").textContent = playlist.playlistName || "Unknown"; // you get it by now
    
    // play or pause
    if (track.paused) {
        document.getElementById("status").textContent = "Paused";
    } 
    else {
        document.getElementById("status").textContent = "Playing";
    }

    // adds the song thumbnail if found
    if (song.thumbnailURL) {
        document.getElementById("thumbnail").src = song.thumbnailURL;
    } 
    else {
        document.getElementById("thumbnail").removeAttribute("src");
    }

    // add game thumbnail if found
    if (game.gameImage) {
        document.getElementById("gameIcon").classList.remove("hidden");
        document.getElementById("gameIcon").src = game.gameImage;
    }
    else {
        document.getElementById("gameIcon").classList.add("hidden");
        document.getElementById("gameIcon").removeAttribute("src");
    }

    if (playlist.playlistImageURL == "star") {
        document.getElementById("playlistIcon").classList.remove("hidden");
        document.getElementById("playlistIcon").src = "./hwIcons/star.png";
    }
    else if (playlist.playlistImageURL){
        document.getElementById("playlistIcon").classList.remove("hidden");
        document.getElementById("playlistIcon").src = playlist.playlistImageURL;
    }   
    else {
        document.getElementById("playlistIcon").classList.add("hidden");
        document.getElementById("playlistIcon").removeAttribute("src");
    }

    // adds game system icon if found
    const hardware = (game.formalHardware || "").replace(/\u00a0/g, " ").trim(); // remove stupid nbsp character from hardware names
    const hwIcon = document.getElementById("hwIcon");

    if (consoles.includes(hardware)) {
        hwIcon.classList.remove("hidden");
        hwIcon.src = "./hwIcons/" + hardware + ".png";
    }
    else {
        hwIcon.classList.add("hidden");
        hwIcon.removeAttribute("src");
    }
    
}


// scary websocket stuff
function connect() {
    const connectStatus = document.getElementById("status");
    connectStatus.textContent = "Connecting...";
    socket = new WebSocket(RPC_URL);

    // success
    socket.addEventListener("open", () => {
        console.log("Connected to Nintendo Music RPC.");
        connectStatus.textContent = "Connected to Nintendo Music RPC Extension";
    });


    // message arrived
    socket.addEventListener("message", (event) => {

        try {
            const message = JSON.parse(event.data);
            console.log("Received RPC message:", message);

            // message is a track
            if (message.type === "track") {
                updateTrack(message.track);
            }
        } 
        catch (error) {
            console.error("Could not parse RPC message:", error);
        }
    });


    // websocket had an error
    socket.addEventListener("error", (error) => {
        console.error("Nintendo Music RPC WebSocket error:", error);
        connectStatus.textContent = "Connection error";
    });

    // attempt to reconnect if connection failed
    socket.addEventListener("close", () => {
        console.log("Disconnected from Nintendo Music RPC.");
        connectStatus.textContent = "Disconnected — retrying...";
        setTimeout(connect, 2000);
    });
}


// connect on page load
connect();
