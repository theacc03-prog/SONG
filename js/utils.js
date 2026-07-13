export const MOEDA = 'Francos';

export function esc(str = '') {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

export function money(valor = 0) {
    return `${Number(valor).toLocaleString('pt-BR')} ${MOEDA}`;
}

export function makeId() {
    return `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function formatDate(ts) {
    if (!ts) return '';
    return new Date(ts).toLocaleDateString('pt-BR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
}

export const FOTO_PADRAO = 'https://placehold.co/300x300/192233/D2B37C?text=GHL';

export function prestigioInfo(valor) {
    const v = Math.max(0, Math.min(50, Number(valor) || 0));
    let label;
    if (v <= 10) label = 'Escândalo';
    else if (v <= 20) label = 'Mal falado';
    else if (v <= 29) label = 'Discrição';
    else if (v <= 39) label = 'Bem-visto';
    else label = 'Nome de Ouro';
    return { valor: v, label, pct: (v / 50) * 100 };
}

export function prestigioGaugeHTML(valor) {
    const { label, pct, valor: v } = prestigioInfo(valor);
    return `
        <div class="prestigio-gauge">
            <div class="prestigio-topo">
                <span class="prestigio-titulo">Reputação</span>
                <span class="prestigio-num">${v} / 50</span>
            </div>
            <div class="prestigio-barra">
                <div class="prestigio-marcador" style="left:${pct}%;"></div>
            </div>
            <div class="prestigio-extremos">
                <span>Escândalo</span>
                <span class="prestigio-atual">${esc(label)}</span>
                <span>Nome de Ouro</span>
            </div>
        </div>
    `;
}
