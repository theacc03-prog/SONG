import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-app.js";

import {
    getAuth
} from "https://www.gstatic.com/firebasejs/9.17.1/firebase-auth.js";

import {
    getDatabase
} from "https://www.gstatic.com/firebasejs/9.17.1/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyDY1BuNeFlcsDdUxNmDFzOVMU8i9OoghZI",
    authDomain: "song-rpg.firebaseapp.com",
    databaseURL: "https://song-rpg-default-rtdb.firebaseio.com/",
    projectId: "song-rpg",
    storageBucket: "song-rpg.firebasestorage.app",
    messagingSenderId: "767454436523",
    appId: "1:767454436523:web:83b1bf291953c2f9f7abee",
    measurementId: "G-FXR8BGLJ1E"
};

const firebaseApp = initializeApp(firebaseConfig);

export const auth = getAuth(firebaseApp);
export const db = getDatabase(firebaseApp);
