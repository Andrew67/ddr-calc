/*! DDR Calc | https://github.com/Andrew67/ddr-calc */
/* Contains functionality for showing a pop-up menu in the top-left corner / About screen */
'use strict';

// Note: some elements in this module (overlay, scrim) depend on the games module loading first
(function initMenuModule () {
    // Load HTML for the menu button
    const container = document.createElement('div');
    container.innerHTML = `<button id="menu-btn" class="overlay" title="Menu">
        <svg width="24" height="24" aria-hidden="true"><use xlink:href="${getSvgUrl('md-more_vert')}#more_vert"/></svg>
    </button>`;
    document.getElementById('display').appendChild(container.firstElementChild);

    // Load HTML for the pop-up menu
    container.innerHTML = '<div id="menu" class="full-screen-overlay">' +
            '<div id="menu-popup">' +
                '<ul></ul>' +
            '</div>' +
        '</div>';
    dom.app.appendChild(container.firstChild);

    // Set up menu variables
    dom.menu = document.getElementById('menu');
    dom.menuList = document.querySelector('#menu-popup > ul');
    dom.menuListItems = [];
    state.menuOpen = Boolean(history.state && history.state.menuOpen);
    const menuItems = [];

    // Dismiss the menu with keyboard
    // TODO: Common dialog code
    dom.menu.addEventListener('keyup', function (e) {
        if (state.menuOpen && e.key === 'Escape') history.back();
    });

    /** Builds the menu DOM based on the items currently added in state.menuItems */
    const buildMenu = function buildMenu () {
        menuItems.sort(function (a, b) { return a.idx - b.idx; });
        dom.menuList.innerHTML = '';
        dom.menuListItems = [];
        menuItems.forEach(function (menuItem) {
            const menuListItemContainer = document.createElement('li'),
                  menuItemDOM = document.createElement('button');
            menuItemDOM.addEventListener('click', function menuItemAction (evt) {
                let preventPropagation = menuItem.options.disabled();

                if (!menuItem.options.disabled()) {
                    state.menuOpen = false;
                    menuItem.action();
                    // Menu item action has replaced the state, so no pop is necessary
                    preventPropagation = !history.state || !history.state.menuOpen;
                }

                // Prevent propagation that would result in unwanted history pop
                if (preventPropagation) evt.stopPropagation();
            });
            menuListItemContainer.appendChild(menuItemDOM);
            dom.menuList.appendChild(menuListItemContainer);
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
        const defaultOptions = {
            title: function () { return title; },
            disabled: function () { return false; },
            hidden: function () { return false; }
        };
        menuItems.push({
            idx: idx,
            action: action,
            options: Object.assign({}, defaultOptions, options)
        });
        buildMenu();
    };

    /** Updates DOM to match hidden/disabled status for menu entries as required **/
    const updateDynamicMenuItems = function updateDynamicMenuItems () {
        menuItems.forEach(function (menuItem, idx) {
            const el = dom.menuListItems[idx];
            el.textContent = menuItem.options.title();
            el.disabled = menuItem.options.disabled();
            el.hidden = menuItem.options.hidden();
        });
    };

    // Show the menu when the button is clicked, hide when the invisible scrim is clicked
    // Using history.pushState and onpopstate so that browser/Android back button can dismiss the settings
    // Based on code from games module
    document.getElementById('menu-btn').addEventListener('click', function openMenu () {
        if (!state.menuOpen) {
            state.menuOpen = true;
            commit();
            history.pushState({ menuOpen: true }, "", "");
        }
    });
    document.getElementById('menu').addEventListener('click', function () {
        history.back();
    });
    window.addEventListener('popstate', function handleMenuStateChange (event) {
        const newMenuOpen = Boolean(event.state && event.state.menuOpen);
        if (state.menuOpen !== newMenuOpen) {
            state.menuOpen = newMenuOpen;
            commit();
        }
    });

    postCommitHooks.push( function showHideMenu () {
        if (state.menuOpen) updateDynamicMenuItems();
        dom.menu.classList.toggle('show', state.menuOpen);
    });

    // Load HTML for the about screen
    container.innerHTML = '<div id="about" class="full-screen-overlay scrim">' +
    '<div id="about-box">' +
        '<div id="app-logo">' +
            '<img src="img/logo-192.png" width="64" height="64" alt="" loading="lazy">' +
            '<h1>DDR Calc <span id="app-version">Version ' + (version || '9999') +
                (isGPlay ? 'g' : '') + (arePointerEventsSupported ? '' : 'p') +
                (isMobileSafari ? 's' : '') + (isIOS12 ? 't' : '') + (isIOS10Standalone ? 'd' : '') +
            '</span></h1>' +
            '<h2>&copy; 2018&ndash;2021 Andrés Cordero</h2>' +
        '</div>' +
        '<ul>' +
            '<li><a href="https://github.com/Andrew67/ddr-calc" target="_blank" rel="noopener">Project Site / Usage Guide</a>' +
            '<li><a href="privacy-policy.html" target="_blank" rel="noopener">Privacy Policy</a>' +
            '<li>Available speed modifiers per mix compiled from ' +
                (!isGPlay ? '<a href="https://remywiki.com/" target="_blank" rel="noopener">RemyWiki</a>' : 'RemyWiki') +
            '<li>DDR Arrow by ' +
                (!isGPlay ? '<a href="https://inkjuse.deviantart.com/art/DDR-Arrow-111309080" target="_blank" rel="noopener">inkjuse</a>' :
                    'inkjuse on DeviantArt') +
            '<li>Mini-calculator icon from <a href="https://icons.getbootstrap.com/" target="_blank" rel="noopener">Bootstrap Icons</a>' +
            '<li>“<a href="https://thenounproject.com/search/?q=target&i=32462" target="_blank" rel="noopener">Target</a>” ' +
                'icon by Chris Kerr from <a href="https://thenounproject.com/" target="_blank" rel="noopener">the Noun Project</a>.' +
            '<li>Gamepad icon by <a href="https://fontawesome.com/license/free" target="_blank" rel="noopener">FontAwesome</a>' +
            '<li>Other icons from <a href="https://material.io/tools/icons/" target="_blank" rel="noopener">Material Design</a>' +
        '</ul>' +
    '</div>' +
    '</div>';
    dom.app.appendChild(container.firstChild);

    // Set up About screen
    dom.about = document.getElementById('about');
    state.aboutOpen = Boolean(history.state && history.state.aboutOpen);

    addMenuItem(100, 'About', function openAbout () {
        state.aboutOpen = true;
        commit();
        history.replaceState({ aboutOpen: true }, "", "");
    });
    dom.about.addEventListener('click', function (e) {
        if (e.target === this) history.back();
    });
    dom.about.addEventListener('keyup', function (e) {
        if (state.aboutOpen && e.key === 'Escape') history.back();
    });
    window.addEventListener('popstate', function handleAboutStateChange (event) {
        const newAboutOpen = Boolean(event.state && event.state.aboutOpen);
        if (state.aboutOpen !== newAboutOpen) {
            state.aboutOpen = newAboutOpen;
            commit();
        }
    });

    postCommitHooks.push( function showHideAbout () {
        dom.about.classList.toggle('show', state.aboutOpen);
    });

    // Set up top-level Privacy Policy shortcut for Google Play users
    if (isGPlay) {
        addMenuItem(200, 'Privacy Policy', function () {
            // The original code with no timeout began to fail starting in Chrome 76
            setTimeout(() => location.assign('privacy-policy.html'), 300);
        });
    }

    // Set up "Force Reload" shortcut for iOS 12 home-screen app users
    // iOS 12.2-12.4 introduced behavior where the page state is always frozen, which also causes updates to get stuck
    // Resolved in iOS 13
    if (isIOS12) {
        addMenuItem(99, 'Force Reload', function () {
            history.replaceState({}, '', '');
            location.reload();
        });
    }

    commit();
    loadNextModule();
})();
