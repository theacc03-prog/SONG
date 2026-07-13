document.addEventListener('DOMContentLoaded', () => {

    const toggle = document.getElementById('nav-toggle');
    const links = document.getElementById('nav-links');

    toggle?.addEventListener('click', () => {
        links?.classList.toggle('open');
    });

    const current = window.location.pathname.split('/').pop() || 'index.html';

    document.querySelectorAll('nav.nav-links a').forEach(link => {

        if (link.getAttribute('href') === current) {
            link.classList.add('active');
        }

    });

});
