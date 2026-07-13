import { auth, db } from './firebase.js';

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/9.17.1/firebase-auth.js";

import {
    ref,
    onValue,
    get,
    update,
    remove,
    push,
    set
} from "https://www.gstatic.com/firebasejs/9.17.1/firebase-database.js";

import { esc, formatDate, money, FOTO_PADRAO, prestigioInfo } from './utils.js';

const loginGate = document.getElementById('admin-login-gate');
const negadoGate = document.getElementById('admin-negado-gate');
const content = document.getElementById('admin-content');

if (!content) {
    // pagina sem painel admin — nada a fazer
} else {

    let souAdmin = false;
    let hospedes = {};
    let admins = {};
    let jornalPosts = {};
    let itens = {};
    let conteudo = {};

    const REGISTRO_CONTEUDO = [
        { chave: 'home-tagline', label: 'Home — legenda sob o botão Entrée', padrao: 'Um RPG narrativo de intrigas, elegância e escolhas.' },
        { chave: 'home-historia-kicker', label: 'Home — chamada acima do título da história', padrao: 'Bem-vindos à Belle Époque' },
        { chave: 'home-historia-titulo', label: 'Home — título da seção história', padrao: 'Uma temporada de mistérios' },
        { chave: 'home-historia-p1', label: 'Home — história, parágrafo 1', padrao: 'No coração de Paris, o Grand Hôtel Lumière ergue-se como um monumento ao luxo e à sofisticação — mármore branco, lustres de cristal e salões onde a alta sociedade parisiense troca sorrisos ensaiados e segredos inconfessáveis. Cada hóspede carrega uma história; nem todas são o que parecem.' },
        { chave: 'home-historia-p2', label: 'Home — história, parágrafo 2', padrao: 'Esta é a apresentação de uma nova temporada: intrigas de corredor, alianças frágeis e um mistério que se esconde atrás da elegância impecável do hotel mais desejado da cidade. Entre, sente-se e observe — em Paris, 1850, a aparência raramente conta toda a verdade.' },
        { chave: 'home-chamada-kicker', label: 'Home — chamada final, texto pequeno', padrao: 'O mistério da temporada' },
        { chave: 'home-chamada-titulo', label: 'Home — chamada final, título', padrao: 'As portas estão abertas' },
        { chave: 'home-chamada-texto', label: 'Home — chamada final, texto', padrao: 'Uma nova edição do Grand Hôtel Lumière está prestes a começar. Reserve o seu lugar entre a elite parisiense — e descubra o que realmente se esconde atrás do brilho dos lustres.' },
        { chave: 'hotel-subtitulo', label: 'Página Hotel — subtítulo', padrao: 'Um mapa dos salões, quartos e corredores do Grand Hôtel Lumière — cada ambiente esconde algo diferente.' },
        { chave: 'paris-subtitulo', label: 'Página Paris — subtítulo', padrao: 'A cidade luz se estende para além do Grand Hôtel Lumière — cafés, teatros e boutiques esperam por quem ousa explorar.' },
        { chave: 'mercado-subtitulo', label: 'Página Mercado — subtítulo', padrao: 'A vida financeira da alta sociedade parisiense — acessível apenas a hóspedes registrados.' },
        { chave: 'funcionamento-subtitulo', label: 'Página Funcionamento — subtítulo', padrao: 'Como jogar, narrar e conviver dentro do Grand Hôtel Lumière.' },
        { chave: 'hospedes-subtitulo', label: 'Página Hóspedes — subtítulo', padrao: 'Todos que já cruzaram as portas douradas do Grand Hôtel Lumière — nem todos são o que parecem.' },
        { chave: 'auth-subtitulo', label: 'Página Entrar — subtítulo', padrao: 'Hóspedes registrados podem acompanhar seu saldo e participar do Mercado do hotel.' },
        { chave: 'jornal-subtitulo', label: 'Página Jornal — subtítulo', padrao: 'Manchetes, fofocas e anúncios da alta sociedade parisiense' }
    ];

    /* =========================
       GATE DE ACESSO
    ========================= */

    onAuthStateChanged(auth, async user => {

        loginGate.classList.add('hidden');
        negadoGate.classList.add('hidden');
        content.classList.add('hidden');

        if (!user) {
            loginGate.classList.remove('hidden');
            return;
        }

        const snap = await get(ref(db, `admins/${user.uid}`));
        souAdmin = snap.val() === true;

        if (!souAdmin) {
            negadoGate.classList.remove('hidden');
            return;
        }

        content.classList.remove('hidden');
        iniciarListeners();

    });

    /* =========================
       TABS
    ========================= */

    document.querySelectorAll('.admin-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.admin-painel').forEach(p => p.classList.remove('active'));
            tab.classList.add('active');
            document.querySelector(`.admin-painel[data-admin-painel="${tab.dataset.adminTab}"]`).classList.add('active');
        });
    });

    let listenersIniciados = false;

    function iniciarListeners() {

        if (listenersIniciados) return;
        listenersIniciados = true;

        onValue(ref(db, 'hospedes'), snap => {
            hospedes = snap.val() || {};
            renderHospedes();
            renderSaldos();
        });

        onValue(ref(db, 'admins'), snap => {
            admins = snap.val() || {};
            renderPermissoes();
        });

        onValue(ref(db, 'jornal'), snap => {
            jornalPosts = snap.val() || {};
            renderJornal();
        });

        onValue(ref(db, 'mercado/itens'), snap => {
            itens = snap.val() || {};
            renderItens();
        });

        onValue(ref(db, 'conteudo'), snap => {
            conteudo = snap.val() || {};
            renderConteudo();
        });

    }

    /* =========================
       ABA HOSPEDES
    ========================= */

    function renderHospedes() {

        const list = document.getElementById('admin-hospedes-list');
        const contagem = document.getElementById('admin-hospedes-contagem');
        const entradas = Object.entries(hospedes);

        contagem.textContent = `${entradas.length} hóspede${entradas.length === 1 ? '' : 's'}`;

        if (!entradas.length) {
            list.innerHTML = `<div class="admin-vazio">Nenhum hóspede registrado.</div>`;
            return;
        }

        list.innerHTML = entradas.map(([id, h]) => {

            const { label, valor } = prestigioInfo(h.prestigio);

            return `
                <div class="admin-linha">
                    <img class="admin-linha-foto" src="${esc(h.foto || FOTO_PADRAO)}" alt="">
                    <div class="admin-linha-principal">
                        <div class="admin-linha-nome">${esc(h.nome || 'Sem nome')}</div>
                        <div class="admin-linha-sub">${esc(label)} — ${valor}/50</div>
                    </div>
                    <div class="admin-linha-acoes">
                        <input type="number" class="admin-input-mini" id="pts-${id}" placeholder="±pts">
                        <input type="text" class="admin-input-texto" id="motivo-${id}" placeholder="Motivo (aparece na crônica)">
                        <button class="admin-btn-mini" data-aplicar-prestigio="${id}">Aplicar</button>
                        <button class="admin-btn-mini perigo" data-remover-hospede="${id}">Remover ficha</button>
                    </div>
                </div>
            `;

        }).join('');

        list.querySelectorAll('[data-aplicar-prestigio]').forEach(btn => {
            btn.addEventListener('click', () => aplicarPontos(btn.dataset.aplicarPrestigio));
        });

        list.querySelectorAll('[data-remover-hospede]').forEach(btn => {
            btn.addEventListener('click', () => removerHospede(btn.dataset.removerHospede));
        });

    }

    async function aplicarPontos(id) {

        const ptsInput = document.getElementById(`pts-${id}`);
        const motivoInput = document.getElementById(`motivo-${id}`);
        const pontos = Number(ptsInput.value);
        const motivo = motivoInput.value.trim();

        if (!pontos || !motivo) {
            alert('Preencha os pontos e o motivo.');
            return;
        }

        const atual = hospedes[id]?.prestigio ?? 25;
        const novo = Math.max(0, Math.min(50, atual + pontos));

        try {

            await update(ref(db, `hospedes/${id}`), { prestigio: novo });

            const entradaId = push(ref(db, `hospedes/${id}/historico`)).key;
            await set(ref(db, `hospedes/${id}/historico/${entradaId}`), {
                pontos,
                motivo,
                data: Date.now()
            });

            ptsInput.value = '';
            motivoInput.value = '';

        } catch (err) {
            alert('Erro ao aplicar pontos: ' + err.message);
        }

    }

    async function removerHospede(id) {

        if (!confirm('Remover a ficha deste hóspede? Isso não exclui a conta de login, apenas os dados do dossiê.')) return;

        try {
            await remove(ref(db, `hospedes/${id}`));
        } catch (err) {
            alert('Erro ao remover: ' + err.message);
        }

    }

    /* =========================
       ABA JORNAL
    ========================= */

    document.getElementById('jn-publicar')?.addEventListener('click', async () => {

        const categoria = document.getElementById('jn-categoria').value.trim();
        const titulo = document.getElementById('jn-titulo').value.trim();
        const autor = document.getElementById('jn-autor').value.trim();
        const resumo = document.getElementById('jn-resumo').value.trim();

        if (!titulo || !resumo) {
            alert('Preencha ao menos o título e o texto.');
            return;
        }

        try {

            const id = push(ref(db, 'jornal')).key;
            await set(ref(db, `jornal/${id}`), {
                categoria: categoria || 'Manchete',
                titulo,
                autor: autor || 'Redação',
                resumo,
                data: Date.now()
            });

            document.getElementById('jn-categoria').value = '';
            document.getElementById('jn-titulo').value = '';
            document.getElementById('jn-autor').value = '';
            document.getElementById('jn-resumo').value = '';

        } catch (err) {
            alert('Erro ao publicar: ' + err.message);
        }

    });

    function renderJornal() {

        const list = document.getElementById('admin-jornal-list');
        const entradas = Object.entries(jornalPosts).sort(([, a], [, b]) => (b.data || 0) - (a.data || 0));

        if (!entradas.length) {
            list.innerHTML = `<div class="admin-vazio">Nenhuma edição publicada ainda.</div>`;
            return;
        }

        list.innerHTML = entradas.map(([id, post]) => `
            <div class="admin-linha">
                <div class="admin-linha-principal">
                    <div class="admin-linha-nome">${esc(post.titulo || 'Sem título')}</div>
                    <div class="admin-linha-sub">${esc(post.categoria || '')} — ${esc(post.autor || '')} — ${formatDate(post.data)}</div>
                </div>
                <div class="admin-linha-acoes">
                    <button class="admin-btn-mini perigo" data-remover-post="${id}">Excluir</button>
                </div>
            </div>
        `).join('');

        list.querySelectorAll('[data-remover-post]').forEach(btn => {
            btn.addEventListener('click', async () => {
                if (!confirm('Excluir esta edição do jornal?')) return;
                try {
                    await remove(ref(db, `jornal/${btn.dataset.removerPost}`));
                } catch (err) {
                    alert('Erro ao excluir: ' + err.message);
                }
            });
        });

    }

    /* =========================
       ABA MERCADO
    ========================= */

    function renderSaldos() {

        const list = document.getElementById('admin-saldo-list');
        const entradas = Object.entries(hospedes);

        if (!entradas.length) {
            list.innerHTML = `<div class="admin-vazio">Nenhum hóspede registrado.</div>`;
            return;
        }

        list.innerHTML = entradas.map(([id, h]) => `
            <div class="admin-linha">
                <img class="admin-linha-foto" src="${esc(h.foto || FOTO_PADRAO)}" alt="">
                <div class="admin-linha-principal">
                    <div class="admin-linha-nome">${esc(h.nome || 'Sem nome')}</div>
                    <div class="admin-linha-sub">${money(h.saldo || 0)}</div>
                </div>
                <div class="admin-linha-acoes">
                    <input type="number" class="admin-input-mini" id="saldo-${id}" placeholder="±valor">
                    <button class="admin-btn-mini" data-aplicar-saldo="${id}">Aplicar</button>
                </div>
            </div>
        `).join('');

        list.querySelectorAll('[data-aplicar-saldo]').forEach(btn => {
            btn.addEventListener('click', async () => {

                const id = btn.dataset.aplicarSaldo;
                const input = document.getElementById(`saldo-${id}`);
                const valor = Number(input.value);

                if (!valor) return;

                const atual = hospedes[id]?.saldo || 0;

                try {
                    await update(ref(db, `hospedes/${id}`), { saldo: atual + valor });
                    input.value = '';
                } catch (err) {
                    alert('Erro ao ajustar saldo: ' + err.message);
                }

            });
        });

    }

    document.getElementById('mk-adicionar')?.addEventListener('click', async () => {

        const nome = document.getElementById('mk-nome').value.trim();
        const preco = Number(document.getElementById('mk-preco').value) || 0;
        const descricao = document.getElementById('mk-descricao').value.trim();

        if (!nome) {
            alert('Dê um nome ao item.');
            return;
        }

        try {

            const id = push(ref(db, 'mercado/itens')).key;
            await set(ref(db, `mercado/itens/${id}`), { nome, preco, descricao });

            document.getElementById('mk-nome').value = '';
            document.getElementById('mk-preco').value = '';
            document.getElementById('mk-descricao').value = '';

        } catch (err) {
            alert('Erro ao adicionar item: ' + err.message);
        }

    });

    function renderItens() {

        const list = document.getElementById('admin-itens-list');
        const entradas = Object.entries(itens);

        if (!entradas.length) {
            list.innerHTML = `<div class="admin-vazio">Nenhum item no catálogo.</div>`;
            return;
        }

        list.innerHTML = entradas.map(([id, item]) => `
            <div class="admin-linha">
                <div class="admin-linha-principal">
                    <div class="admin-linha-nome">${esc(item.nome)}</div>
                    <div class="admin-linha-sub">${money(item.preco || 0)} — ${esc(item.descricao || '')}</div>
                </div>
                <div class="admin-linha-acoes">
                    <button class="admin-btn-mini perigo" data-remover-item="${id}">Excluir</button>
                </div>
            </div>
        `).join('');

        list.querySelectorAll('[data-remover-item]').forEach(btn => {
            btn.addEventListener('click', async () => {
                if (!confirm('Remover este item do catálogo?')) return;
                try {
                    await remove(ref(db, `mercado/itens/${btn.dataset.removerItem}`));
                } catch (err) {
                    alert('Erro ao remover: ' + err.message);
                }
            });
        });

    }

    /* =========================
       ABA CONTEUDO
    ========================= */

    function renderConteudo() {

        const list = document.getElementById('admin-conteudo-list');
        if (!list) return;

        list.innerHTML = REGISTRO_CONTEUDO.map(item => {

            const valorAtual = conteudo[item.chave] || item.padrao;
            const personalizado = Boolean(conteudo[item.chave]);

            return `
                <div class="admin-linha" style="flex-direction:column; align-items:stretch;">
                    <div class="admin-linha-nome" style="margin-bottom:8px;">
                        ${esc(item.label)}
                        ${personalizado ? '<span class="admin-badge">Personalizado</span>' : ''}
                    </div>
                    <textarea rows="2" id="ct-${item.chave}">${esc(valorAtual)}</textarea>
                    <div class="admin-linha-acoes" style="justify-content:flex-end; margin-top:10px;">
                        <button class="admin-btn-mini perigo" data-resetar-conteudo="${item.chave}" ${personalizado ? '' : 'disabled'}>Restaurar padrão</button>
                        <button class="admin-btn-mini" data-salvar-conteudo="${item.chave}">Salvar</button>
                    </div>
                </div>
            `;

        }).join('');

        list.querySelectorAll('[data-salvar-conteudo]').forEach(btn => {
            btn.addEventListener('click', async () => {

                const chave = btn.dataset.salvarConteudo;
                const texto = document.getElementById(`ct-${chave}`).value.trim();

                try {
                    await set(ref(db, `conteudo/${chave}`), texto);
                } catch (err) {
                    alert('Erro ao salvar: ' + err.message);
                }

            });
        });

        list.querySelectorAll('[data-resetar-conteudo]').forEach(btn => {
            btn.addEventListener('click', async () => {

                if (!confirm('Restaurar o texto padrão? Sua alteração será perdida.')) return;

                try {
                    await remove(ref(db, `conteudo/${btn.dataset.resetarConteudo}`));
                } catch (err) {
                    alert('Erro ao restaurar: ' + err.message);
                }

            });
        });

    }

    /* =========================
       ABA PERMISSOES
    ========================= */

    function renderPermissoes() {

        const list = document.getElementById('admin-permissoes-list');
        const entradas = Object.entries(hospedes);

        if (!entradas.length) {
            list.innerHTML = `<div class="admin-vazio">Nenhum hóspede registrado.</div>`;
            return;
        }

        list.innerHTML = entradas.map(([id, h]) => {

            const ehAdmin = admins[id] === true;

            return `
                <div class="admin-linha">
                    <img class="admin-linha-foto" src="${esc(h.foto || FOTO_PADRAO)}" alt="">
                    <div class="admin-linha-principal">
                        <div class="admin-linha-nome">${esc(h.nome || 'Sem nome')}</div>
                        <div class="admin-linha-sub">${ehAdmin ? '<span class="admin-badge">Administrador</span>' : 'Hóspede comum'}</div>
                    </div>
                    <div class="admin-linha-acoes">
                        <button class="admin-btn-mini ${ehAdmin ? 'ativo' : ''}" data-toggle-admin="${id}">
                            ${ehAdmin ? 'Remover admin' : 'Tornar admin'}
                        </button>
                    </div>
                </div>
            `;

        }).join('');

        list.querySelectorAll('[data-toggle-admin]').forEach(btn => {
            btn.addEventListener('click', async () => {

                const id = btn.dataset.toggleAdmin;
                const ehAdmin = admins[id] === true;

                if (id === auth.currentUser?.uid && ehAdmin) {
                    if (!confirm('Você está prestes a remover seu próprio acesso de administrador. Continuar?')) return;
                }

                try {
                    if (ehAdmin) {
                        await remove(ref(db, `admins/${id}`));
                    } else {
                        await set(ref(db, `admins/${id}`), true);
                    }
                } catch (err) {
                    alert('Erro ao alterar permissão: ' + err.message);
                }

            });
        });

    }

}
