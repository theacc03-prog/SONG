import {
    auth,
    db
} from './firebase.js';

import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/9.17.1/firebase-auth.js";

import {
    ref,
    set,
    get
} from "https://www.gstatic.com/firebasejs/9.17.1/firebase-database.js";

/* =========================
   ESTADO DE NAVEGACAO
   (roda em toda pagina que inclui este modulo)
========================= */

onAuthStateChanged(auth, async user => {

    const navAccount = document.getElementById('nav-account');
    const requireAuth = document.body.dataset.requireAuth === 'true';
    const gate = document.getElementById('auth-gate');
    const gated = document.getElementById('gated-content');
    const navAdminLink = document.getElementById('nav-admin-link');

    if (navAccount) {

        if (user) {
            navAccount.textContent = 'Sair';
            navAccount.onclick = () => window.authSystem.logout();
        } else {
            navAccount.textContent = 'Entrar';
            navAccount.onclick = () => { window.location.href = 'auth.html'; };
        }

    }

    if (requireAuth) {

        if (user) {
            gate?.classList.add('hidden');
            gated?.classList.remove('hidden');
        } else {
            gate?.classList.remove('hidden');
            gated?.classList.add('hidden');
        }

    }

    if (navAdminLink) {

        if (user) {
            const snap = await get(ref(db, `admins/${user.uid}`));
            navAdminLink.classList.toggle('hidden', snap.val() !== true);
        } else {
            navAdminLink.classList.add('hidden');
        }

    }

});

/* =========================
   AUTH SYSTEM
========================= */

window.authSystem = {

    login: async () => {

        const email = document.getElementById('email')?.value.trim();
        const pass = document.getElementById('pass')?.value.trim();

        if (!email || !pass) {
            alert('Preencha e-mail e senha.');
            return;
        }

        try {

            await signInWithEmailAndPassword(auth, email, pass);
            window.location.href = 'index.html';

        } catch (err) {

            alert('Erro ao entrar: ' + err.message);

        }

    },

    register: async () => {

        const nome = document.getElementById('reg-name')?.value.trim();
        const email = document.getElementById('reg-email')?.value.trim();
        const pass = document.getElementById('reg-pass')?.value.trim();

        if (!nome || !email || !pass) {
            alert('Preencha todos os campos.');
            return;
        }

        try {

            const res = await createUserWithEmailAndPassword(auth, email, pass);

            await set(ref(db, `hospedes/${res.user.uid}`), {
                nome,
                titulo: '',
                linhagem: '',
                quarto: '',
                genero: '',
                estadoCivil: '',
                idade: null,
                saldo: 0,
                bio: '',
                foto: '',
                opiniaoPublica: '',
                prestigio: 25,
                historico: {},
                criadoEm: Date.now()
            });

            window.location.href = 'index.html';

        } catch (err) {

            alert('Erro ao registrar: ' + err.message);

        }

    },

    logout: async () => {

        try {
            await signOut(auth);
            window.location.href = 'index.html';
        } catch (err) {
            alert('Erro ao sair.');
        }

    }

};
