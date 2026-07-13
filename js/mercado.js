import { auth, db } from './firebase.js';

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/9.17.1/firebase-auth.js";

import {
    ref,
    onValue
} from "https://www.gstatic.com/firebasejs/9.17.1/firebase-database.js";

import { esc, money } from './utils.js';

const saldoEl = document.getElementById('mercado-saldo');
const itensEl = document.getElementById('mercado-itens');

function renderItens(itens) {

    if (!itens || !Object.keys(itens).length) {
        return `<div class="jornal-empty">O catálogo do Mercado está vazio no momento.</div>`;
    }

    return Object.values(itens).map(item => `
        <div class="card">
            <h3>${esc(item.nome)}</h3>
            <p class="subtle">${esc(item.descricao || '')}</p>
            <p style="font-family:var(--fonte-plaqueta); color:var(--dourado); letter-spacing:1px;">${money(item.preco || 0)}</p>
        </div>
    `).join('');

}

if (itensEl) {
    onValue(ref(db, 'mercado/itens'), snap => {
        itensEl.innerHTML = renderItens(snap.val());
    });
}

onAuthStateChanged(auth, user => {

    if (!saldoEl || !user) return;

    onValue(ref(db, `hospedes/${user.uid}/saldo`), snap => {
        saldoEl.textContent = money(snap.val() || 0);
    });

});
