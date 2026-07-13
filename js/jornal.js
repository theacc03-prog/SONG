import { db } from './firebase.js';

import {
    ref,
    onValue
} from "https://www.gstatic.com/firebasejs/9.17.1/firebase-database.js";

import { esc, formatDate } from './utils.js';

function renderPosts(data) {

    if (!data || !Object.keys(data).length) {
        return `<div class="jornal-empty">Nenhuma edição publicada ainda. Volte em breve para as primeiras manchetes do Grand Hôtel Lumière.</div>`;
    }

    return Object.entries(data)
        .sort(([, a], [, b]) => (b.data || 0) - (a.data || 0))
        .map(([id, post]) => `
            <article class="jornal-item">
                <div class="categoria">${esc(post.categoria || 'Manchete')}</div>
                <h3>${esc(post.titulo || 'Sem título')}</h3>
                <p class="corpo">${esc(post.resumo || '')}</p>
                <div class="meta">${esc(post.autor || 'Redação')} — ${formatDate(post.data)}</div>
            </article>
        `)
        .join('');

}

const list = document.getElementById('jornal-list');

if (list) {
    onValue(ref(db, 'jornal'), snap => {
        list.innerHTML = renderPosts(snap.val());
    });
}
