/*! DDR Calc | https://github.com/Andrew67/ddr-calc */
/* Contains functionality for showing a pop-up menu in the top-left corner / About screen */
'use strict';

// Start loading CSS asynchronously
// Note: some elements in this module (overlay, scrim) depend on the games module loading first
addStylesheet('menu');
// Kick off after icon loaded
fetch('img/md-more_vert.svg')
.then(function (img) {
    return img.text();
}).then(function (menuBtn) {
    // Load HTML for the menu button
    var container = document.createElement('div');
    container.innerHTML = '<span id="menu-btn" class="overlay">' + menuBtn + '</span>';
    document.getElementById('display').appendChild(container.firstChild);

    // Load HTML for the pop-up menu
    container.innerHTML = '<div id="menu" class="full-screen-overlay">' +
            '<div id="menu-popup">' +
                '<ul></ul>' +
            '</div>' +
        '</div>';
    document.getElementById('app').appendChild(container.firstChild);

    // Set up menu variables
    dom.menu = document.getElementById('menu');
    dom.menuList = document.querySelector('#menu-popup > ul');
    dom.menuListItems = [];
    state.menuOpen = Boolean(history.state && history.state.menuOpen);
    var menuItems = [];

    /** Builds the menu DOM based on the items currently added in state.menuItems */
    var buildMenu = function buildMenu () {
        menuItems.sort(function (a, b) { return a.idx - b.idx; });
        dom.menuList.innerHTML = '';
        dom.menuListItems = [];
        menuItems.forEach(function (menuItem) {
            var menuItemDOM = document.createElement('li');
            menuItemDOM.textContent = menuItem.title;
            menuItemDOM.addEventListener('click', function (evt) {
                var preventPropagation = menuItem.options.disabled();

                if (!menuItem.options.disabled()) {
                    state.menuOpen = false;
                    menuItem.action();
                    // Menu item action has replaced the state, so no pop is necessary
                    preventPropagation = !history.state || !history.state.menuOpen;
                }

                // Prevent propagation that would result in unwanted history pop
                if (preventPropagation) evt.stopPropagation();
            });
            dom.menuList.appendChild(menuItemDOM);
            dom.menuListItems.push(menuItemDOM);
        });
    };

    /**
     * Adds a new item to the overflow menu
     * @param idx Index number for the item (useful for pushing to an arbitrary list location)
     * @param title Title to show in the menu
     * @param action Action to execute when the menu item is selected. Should use history.replaceState and not pushState
     * @param options Additional options object (such as disabled, hidden)
     */
    window.addMenuItem = function addMenuItem (idx, title, action, options) {
        var defaultOptions = {
            disabled: function () { return false; },
            hidden: function () { return false; }
        };
        menuItems.push({
            idx: idx,
            title: title,
            action: action,
            options: Object.assign({}, defaultOptions, options)
        });
        buildMenu();
    };

    /** Updates DOM to match hidden/disabled status for menu entries as required **/
    var updateDynamicMenuItems = function updateDynamicMenuItems () {
        menuItems.forEach(function (menuItem, idx) {
            dom.menuListItems[idx].classList.toggle('disabled', menuItem.options.disabled());
            dom.menuListItems[idx].classList.toggle('hidden', menuItem.options.hidden());
        });
    };

    // Show the menu when the button is clicked, hide when the invisible scrim is clicked
    // Using history.pushState and onpopstate so that browser/Android back button can dismiss the settings
    // Based on code from games module
    document.getElementById('menu-btn').addEventListener('click', function () {
        state.menuOpen = true;
        commit();
        history.pushState({ menuOpen: true }, "", "");
    });
    document.getElementById('menu').addEventListener('click', function () {
        history.back();
    });
    window.addEventListener('popstate', function (event) {
        state.menuOpen = Boolean(event.state && event.state.menuOpen);
        commit();
    });

    postCommitHooks.push( function showHideMenu () {
        if (state.menuOpen) updateDynamicMenuItems();
        dom.menu.classList.toggle('show', state.menuOpen);
    });

    // Load HTML for the about screen
    container.innerHTML = '<div id="about" class="full-screen-overlay">' +
            '<div class="scrim"></div>' +
            '<div id="about-box">' +
                '<div id="app-logo">' +
                    '<img src="img/icon-192.png" width="72" height="72" alt="App Icon">' +
                    '<h1>DDR Calc <span id="app-version">Version 2.1.0</span></h1>' +
                    '<h2>&copy; 2018&ndash;2019 Andrés Cordero</h2>' +
                '</div>' +
                '<ul>' +
                    '<li><a href="https://github.com/Andrew67/ddr-calc" target="_blank" rel="noopener">Project Site / Usage Guide</a>' +
                    '<li>DDR Arrow by <a href="https://inkjuse.deviantart.com/art/DDR-Arrow-111309080" target="_blank" rel="noopener">inkjuse</a>' +
                    '<li>Gamepad by <a href="https://fontawesome.com/license/free" target="_blank" rel="noopener">FontAwesome</a>' +
                    '<li>Other icons by <a href="https://material.io/tools/icons/" target="_blank" rel="noopener">Google</a>' +
                '</ul>' +
            '</div>' +
        '</div>';
    document.getElementById('app').appendChild(container.firstChild);

    // Set up About screen
    dom.about = document.getElementById('about');
    state.aboutOpen = Boolean(history.state && history.state.aboutOpen);

    // Show/hide code
    addMenuItem(100, 'About', function () {
        state.aboutOpen = true;
        commit();
        history.replaceState({ aboutOpen: true }, "", "");
    });
    document.querySelector('#about .scrim')
        .addEventListener('click', function () { history.back(); });
    window.addEventListener('popstate', function (event) {
        state.aboutOpen = Boolean(event.state && event.state.aboutOpen);
        commit();
    });

    postCommitHooks.push( function showHideAbout () {
        dom.about.classList.toggle('show', state.aboutOpen);
    });

    commit();
    loadNextModule();
}).catch(function (err) {
    console.error("Error in menu.js:", err, "\nModule loading has been halted");
});
