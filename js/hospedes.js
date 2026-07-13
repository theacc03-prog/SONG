import { auth, db } from './firebase.js';

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/9.17.1/firebase-auth.js";

import {
    ref,
    onValue,
    update
} from "https://www.gstatic.com/firebasejs/9.17.1/firebase-database.js";

import { esc, formatDate, FOTO_PADRAO, prestigioGaugeHTML } from './utils.js';

let hospedes = {};
let usuarioAtual = null;

const list = document.getElementById('hospedes-list');
const contagem = document.getElementById('hospedes-contagem');
const btnMeuPerfil = document.getElementById('btn-meu-perfil');
const modalRoot = document.getElementById('modal-root');

/* =========================
   RENDER DA LISTA
========================= */

function cardHTML(id, h) {
    return `
        <div class="card dossie-card" data-uid="${id}">
            <div class="dossie-card-top">
                <span>Registro do hotel</span>
                <span>Quarto Nº ${esc(h.quarto || '—')}</span>
            </div>
            <span class="script dossie-titulo">${esc(h.titulo || 'Hóspede')}</span>
            <h3 class="dossie-nome">${esc(h.nome || 'Sem nome')}</h3>
            <img class="dossie-foto" src="${esc(h.foto || FOTO_PADRAO)}" alt="${esc(h.nome || 'Hóspede')}">
            <div class="dossie-info">
                <div>
                    <span class="dossie-info-label">Casa</span>
                    <span class="dossie-info-valor">${esc(h.linhagem || '—')}</span>
                </div>
                <div>
                    <span class="dossie-info-label">Idade</span>
                    <span class="dossie-info-valor">${h.idade ? h.idade + ' anos' : '—'}</span>
                </div>
            </div>
            ${prestigioGaugeHTML(h.prestigio)}
            <span class="btn-ghost dossie-abrir">Abrir ficha completa →</span>
        </div>
    `;
}

function renderGrid() {

    const entradas = Object.entries(hospedes);

    if (!entradas.length) {
        list.innerHTML = `<div class="jornal-empty">Nenhum hóspede registrado ainda.</div>`;
        contagem.textContent = 'Nenhum hóspede registrado.';
        return;
    }

    contagem.textContent = `Exibindo ${entradas.length} hóspede${entradas.length > 1 ? 's' : ''}.`;

    list.innerHTML = entradas
        .sort(([, a], [, b]) => (b.prestigio || 0) - (a.prestigio || 0))
        .map(([id, h]) => cardHTML(id, h))
        .join('');

}

if (list) {
    onValue(ref(db, 'hospedes'), snap => {
        hospedes = snap.val() || {};
        renderGrid();
    });
}

/* =========================
   MODAL — DOSSIÊ COMPLETO
========================= */

function cronicaHTML(historico) {

    const itens = Object.values(historico || {}).sort((a, b) => (b.data || 0) - (a.data || 0));

    if (!itens.length) {
        return `<div class="cronica-vazio">Nenhum registro de estadia ainda para este hóspede.</div>`;
    }

    return itens.map(item => `
        <div class="cronica-item">
            <span class="cronica-pontos ${item.pontos >= 0 ? 'positivo' : 'negativo'}">
                ${item.pontos >= 0 ? '▲' : '▼'} ${Math.abs(item.pontos)} pts
            </span>
            <p class="cronica-motivo">${esc(item.motivo || '')}</p>
            <p class="subtle">${formatDate(item.data)}</p>
        </div>
    `).join('');

}

function abrirModal(id) {

    const h = hospedes[id];
    if (!h) return;

    const souEu = usuarioAtual === id;

    modalRoot.innerHTML = `
        <div class="dossie-modal-backdrop" id="dossie-backdrop">
            <div class="dossie-modal">
                <button class="dossie-modal-fechar" id="dossie-fechar">✕</button>

                <div class="dossie-modal-cabecalho">
                    <span class="dossie-modal-tag">Ficha do hóspede</span>
                    <span class="script dossie-titulo">${esc(h.titulo || 'Hóspede')}</span>
                    <h2 style="margin-bottom:0;">${esc(h.nome || 'Sem nome')}</h2>
                    <p class="subtle" style="margin-top:6px;">${esc(h.linhagem ? 'Casa ' + h.linhagem : '')}${h.quarto ? ' — Quarto Nº ' + esc(h.quarto) : ''}</p>
                    <img class="dossie-modal-foto" src="${esc(h.foto || FOTO_PADRAO)}" alt="${esc(h.nome || 'Hóspede')}">
                </div>

                ${prestigioGaugeHTML(h.prestigio)}

                <div class="dossie-tabs" style="margin-top:26px;">
                    <button class="dossie-tab active" data-tab="detalhe">Ficha</button>
                    <button class="dossie-tab" data-tab="cronica">Registro de estadia</button>
                </div>

                <div class="dossie-tab-painel active" data-painel="detalhe">
                    <div class="dossie-campos">
                        <div>
                            <span class="dossie-campo-label">Casa</span>
                            <p class="dossie-campo-valor">${esc(h.linhagem || '—')}</p>
                        </div>
                        <div>
                            <span class="dossie-campo-label">Gênero</span>
                            <p class="dossie-campo-valor">${esc(h.genero || '—')}</p>
                        </div>
                        <div>
                            <span class="dossie-campo-label">Estado civil</span>
                            <p class="dossie-campo-valor">${esc(h.estadoCivil || '—')}</p>
                        </div>
                        <div>
                            <span class="dossie-campo-label">Idade</span>
                            <p class="dossie-campo-valor">${h.idade ? h.idade + ' anos' : '—'}</p>
                        </div>
                    </div>
                    <p>${esc(h.bio || 'Ainda não escreveu sua história.')}</p>
                    <div class="dossie-opiniao">
                        <span class="dossie-opiniao-label">O que dizem nos corredores</span>
                        "${esc(h.opiniaoPublica || 'Ninguém ainda comentou sobre este hóspede.')}"
                    </div>
                </div>

                <div class="dossie-tab-painel" data-painel="cronica">
                    ${cronicaHTML(h.historico)}
                </div>

                ${souEu ? `<button class="btn dossie-editar-btn" id="dossie-editar">Editar minha ficha</button>` : ''}
            </div>
        </div>
    `;

    document.getElementById('dossie-fechar').onclick = fecharModal;
    document.getElementById('dossie-backdrop').addEventListener('click', e => {
        if (e.target.id === 'dossie-backdrop') fecharModal();
    });

    modalRoot.querySelectorAll('.dossie-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            modalRoot.querySelectorAll('.dossie-tab').forEach(t => t.classList.remove('active'));
            modalRoot.querySelectorAll('.dossie-tab-painel').forEach(p => p.classList.remove('active'));
            tab.classList.add('active');
            modalRoot.querySelector(`.dossie-tab-painel[data-painel="${tab.dataset.tab}"]`).classList.add('active');
        });
    });

    if (souEu) {
        document.getElementById('dossie-editar').onclick = () => abrirEdicao(id, h);
    }

}

function fecharModal() {
    modalRoot.innerHTML = '';
}

list?.addEventListener('click', e => {
    const card = e.target.closest('.dossie-card');
    if (card) abrirModal(card.dataset.uid);
});

/* =========================
   EDICAO DO PROPRIO PERFIL
========================= */

function abrirEdicao(id, h) {

    modalRoot.innerHTML = `
        <div class="dossie-modal-backdrop" id="edicao-backdrop">
            <div class="dossie-modal">
                <button class="dossie-modal-fechar" id="edicao-fechar">✕</button>
                <h3 class="center">Editar minha ficha</h3>

                <label for="ed-titulo">Título (Lady, Lord, Monsieur...)</label>
                <input type="text" id="ed-titulo" value="${esc(h.titulo || '')}">

                <label for="ed-nome">Nome completo</label>
                <input type="text" id="ed-nome" value="${esc(h.nome || '')}">

                <label for="ed-linhagem">Casa / Família</label>
                <input type="text" id="ed-linhagem" value="${esc(h.linhagem || '')}">

                <label for="ed-quarto">Número do quarto</label>
                <input type="text" id="ed-quarto" value="${esc(h.quarto || '')}" placeholder="Ex: 214">

                <label for="ed-genero">Gênero</label>
                <input type="text" id="ed-genero" value="${esc(h.genero || '')}">

                <label for="ed-estadocivil">Estado civil</label>
                <input type="text" id="ed-estadocivil" value="${esc(h.estadoCivil || '')}">

                <label for="ed-idade">Idade</label>
                <input type="number" id="ed-idade" value="${esc(h.idade || '')}">

                <label for="ed-foto">URL da foto</label>
                <input type="text" id="ed-foto" value="${esc(h.foto || '')}" placeholder="https://...">

                <label for="ed-bio">Sua história</label>
                <textarea id="ed-bio" rows="4">${esc(h.bio || '')}</textarea>

                <button class="btn form-wide" id="edicao-salvar">Salvar alterações</button>
            </div>
        </div>
    `;

    document.getElementById('edicao-fechar').onclick = fecharModal;
    document.getElementById('edicao-backdrop').addEventListener('click', e => {
        if (e.target.id === 'edicao-backdrop') fecharModal();
    });

    document.getElementById('edicao-salvar').onclick = async () => {

        try {
            await update(ref(db, `hospedes/${id}`), {
                titulo: document.getElementById('ed-titulo').value.trim(),
                nome: document.getElementById('ed-nome').value.trim(),
                linhagem: document.getElementById('ed-linhagem').value.trim(),
                quarto: document.getElementById('ed-quarto').value.trim(),
                genero: document.getElementById('ed-genero').value.trim(),
                estadoCivil: document.getElementById('ed-estadocivil').value.trim(),
                idade: Number(document.getElementById('ed-idade').value) || null,
                foto: document.getElementById('ed-foto').value.trim(),
                bio: document.getElementById('ed-bio').value.trim()
            });
            fecharModal();
        } catch (err) {
            alert('Erro ao salvar: ' + err.message);
        }

    };

}

/* =========================
   BOTAO "MEU PERFIL" NA TOOLBAR
========================= */

onAuthStateChanged(auth, user => {

    usuarioAtual = user ? user.uid : null;

    if (!btnMeuPerfil) return;

    if (user) {
        btnMeuPerfil.classList.remove('hidden');
        btnMeuPerfil.onclick = () => {
            const h = hospedes[user.uid];
            if (h) abrirEdicao(user.uid, h);
        };
    } else {
        btnMeuPerfil.classList.add('hidden');
    }

});
