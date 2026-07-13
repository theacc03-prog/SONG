const FRASES = [
    'Acendendo os lustres de cristal…',
    'Servindo o champagne…',
    'Polindo as maçanetas douradas…',
    'Arrumando os salões de mármore…',
    'Afinando o piano do salão de baile…',
    'Anunciando a chegada dos hóspedes…',
    'Selando os últimos segredos…'
];

const DURACAO_PADRAO = 4200;

function digitar(el, texto, velocidade) {
    return new Promise(resolve => {
        let i = 0;
        (function passo() {
            el.textContent = texto.slice(0, i);
            i++;
            if (i <= texto.length) {
                setTimeout(passo, velocidade);
            } else {
                resolve();
            }
        })();
    });
}

function apagar(el, texto, velocidade) {
    return new Promise(resolve => {
        let i = texto.length;
        (function passo() {
            el.textContent = texto.slice(0, i);
            i--;
            if (i >= 0) {
                setTimeout(passo, velocidade);
            } else {
                resolve();
            }
        })();
    });
}

async function cicloDeFrases(el) {

    const ordem = [...FRASES].sort(() => Math.random() - 0.5);

    for (const frase of ordem) {
        await digitar(el, frase, 42);
        await new Promise(r => setTimeout(r, 700));
        await apagar(el, frase, 18);
        await new Promise(r => setTimeout(r, 150));
    }

    cicloDeFrases(el);

}

window.addEventListener('load', () => {

    const screen = document.getElementById('loading-screen');

    if (!screen) return;

    const frase = document.getElementById('loading-phrase');
    const video = screen.querySelector('video');

    if (frase) {
        cicloDeFrases(frase);
    }

    function agendarFadeOut(duracaoMs) {
        setTimeout(() => {
            screen.classList.add('fade-out');
        }, duracaoMs);
    }

    if (video) {

        video.loop = false;
        let duracaoResolvida = false;

        if (video.readyState >= 1 && video.duration) {
            duracaoResolvida = true;
            agendarFadeOut(video.duration * 1000);
        } else {
            video.addEventListener('loadedmetadata', () => {
                if (duracaoResolvida) return;
                duracaoResolvida = true;
                agendarFadeOut(video.duration * 1000);
            }, { once: true });

            // caso os metadados demorem, nao trava a tela pra sempre
            setTimeout(() => {
                if (duracaoResolvida) return;
                duracaoResolvida = true;
                agendarFadeOut(DURACAO_PADRAO);
            }, 2000);
        }

    } else {
        agendarFadeOut(DURACAO_PADRAO);
    }

});
