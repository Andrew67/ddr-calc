/*! DDR Calc | https://github.com/Andrew67/ddr-calc */
/* Contains functions that should run synchronously and early to avoid flicker.
 * Formerly actually in-line with the HTML but that loosens the Content-Security-Policy. */
'use strict';

// In-line browser compatibility check, so that the incompatibility dialog is dismissed ASAP
if ('fetch' in window) document.getElementById('browser-dialog').remove();
if (!('forEach' in NodeList.prototype)) { // noinspection JSValidateTypes
    NodeList.prototype.forEach = Array.prototype.forEach;
}

// In-line dark mode check, so that dark mode is applied flicker-free
if (localStorage.getItem('dark-mode') === 'true' || window.matchMedia('(prefers-color-scheme: dark)').matches) {
    document.body.classList.add('theme-dark');
    document.querySelector('meta[name=theme-color]').content = '#121212';
}

// In-line Android OS version check, to pull in Roboto from Google Fonts
// Workaround added for Ubuntu Touch Morph Browser which pretends to be Android 4.4
if (navigator.userAgent.includes('Android 4.') && !navigator.userAgent.includes('Ubuntu')) {
    const stylesheet = document.createElement('link');
    stylesheet.rel = 'stylesheet';
    stylesheet.href = 'https://fonts.googleapis.com/css?family=Roboto:300,400,500&display=swap';
    document.head.appendChild(stylesheet);
}
