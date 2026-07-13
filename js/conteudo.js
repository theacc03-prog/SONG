import { db } from './firebase.js';

import {
    ref,
    onValue
} from "https://www.gstatic.com/firebasejs/9.17.1/firebase-database.js";

document.querySelectorAll('[data-edit-key]').forEach(el => {

    const chave = el.dataset.editKey;

    onValue(ref(db, `conteudo/${chave}`), snap => {
        const valor = snap.val();
        if (valor) el.textContent = valor;
    });

});
