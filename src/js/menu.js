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
    state.menuOpen = false;
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
                if (!menuItem.options.disabled()) menuItem.action();
                else evt.stopPropagation(); // Prevent propagation that would result in menu closure
            });
            dom.menuList.appendChild(menuItemDOM);
            dom.menuListItems.push(menuItemDOM);
        });
    };

    /**
     * Adds a new item to the overflow menu
     * @param idx Index number for the item (useful for pushing to an arbitrary list location)
     * @param title Title to show in the menu
     * @param action Action to execute when the menu item is selected
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
            if (menuItem.options.disabled()) dom.menuListItems[idx].classList.add('disabled');
            else dom.menuListItems[idx].classList.remove('disabled');

            if (menuItem.options.hidden()) dom.menuListItems[idx].classList.add('hidden');
            else dom.menuListItems[idx].classList.remove('hidden');
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
        state.menuOpen = event.state && event.state.menuOpen;
        commit();
    });

    postCommitHooks.push( function showHideMenu () {
        if (state.menuOpen) {
            updateDynamicMenuItems();
            dom.menu.classList.add('show');
        }
        else dom.menu.classList.remove('show');
    });

    // Add static menu item
    addMenuItem(100, 'About', function () { alert('DDR Calc'); });

    loadNextModule();
}).catch(function (err) {
    console.error("Error in menu.js:", err, "\nModule loading has been halted");
});
