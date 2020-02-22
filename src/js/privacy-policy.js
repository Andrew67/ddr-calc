/*! DDR Calc | https://github.com/Andrew67/ddr-calc */
/* Contains functionality for the privacy policy page */
if (history.length > 1 && !navigator['standalone']) {
    document.body.classList.add('show-toolbar');
    document.getElementById('i-arrow-left').addEventListener('click', function () {
        history.back();
    });
}
if (localStorage.getItem('dark-mode') === 'true' || window.matchMedia('(prefers-color-scheme: dark)').matches) {
    document.body.classList.add('dark');
}