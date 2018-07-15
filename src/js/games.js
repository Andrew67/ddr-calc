/*! DDR Calc | https://github.com/Andrew67/ddr-calc */
/* Contains functionality for selecting a game and disabling keys based on valid combinations */
'use strict';

// Kick off after game data loaded
fetch('games.json').then(function (response) {
    return response.json();
}).then(function (gameData) {
    // Map game data by ID for easier retrieval without walking the array
    // Furthermore, convert the mods and premiumPlayMods into their respective Map forms
    var gameDataById = new Map(gameData.map(function (game) {
        return [game.id, Object.assign({}, game, {
            mods: new Map(game.mods),
            premiumPlayMods: new Map(game.premiumPlayMods),
            // Contains a merger of mods and premiumPlayMods, which are all available mods in premium play mode
            allMods: (function() {
                var m = new Map(game.mods);
                game.premiumPlayMods.forEach(function (pM) {
                    var key = pM[0], values = pM[1];
                    if (m.has(key)) m.set(key, m.get(key).concat(values));
                    else m.set(key, values);
                });
                return m;
            })()
        })];
    }));

    // Load CSS and HTML for the game button
    addStylesheet('games');
    var container = document.createElement('div');
    container.innerHTML = '<span id="game-btn" class="overlay">' +
        '<span id="game-premium-enabled"></span>' +
        '<span class="svg-icon"><svg><use xlink:href="img/fa-gamepad.svg#icon"></use></svg></span>' +
        '<span id="game-name">&nbsp;</span>' +
        '</span>';
    document.getElementById('display').appendChild(container.firstChild);

    // Set up calc variables
    state.gameid = 0;
    state.premiumPlayEnabled = true;
    computedState.gamename = '';
    dom.gamename = document.getElementById('game-name');
    dom.premiumPlayEnabled = document.getElementById('game-premium-enabled');

    // Set the game name based on the selected game ID
    computedState.hooks.push(function setGameName () {
        if (state.gameid === 0 || !gameDataById.has(state.gameid)) computedState.gamename = 'No game selected';
        else computedState.gamename = gameDataById.get(state.gameid).name;
    });
    postCommitHooks.push(function updateGameNameAndPremiumPlay () {
        dom.gamename.textContent = computedState.gamename;
        dom.premiumPlayEnabled.textContent = (!state.gameid || !gameDataById.get(state.gameid).hasPremiumPlay) ? '' : (
            state.premiumPlayEnabled ? 'Premium Play On' : 'Premium Play Off'
        );
    });

    // Disable speedmod keys in SPEEDMOD mode based on:
    // integer keys: based on current game selected, whether the mods map contains an entry for it
    // decimal keys: based on current game and integer selected, whether the mods map value contains an entry for it
    computedState.hooks.push(function disableKeysInSpeedmodModeBasedOnGameAndIntegerSelection () {
        // Skip computation if a game has not been selected or we're not in speedmod mode
        if (state.gameid && state.mode === MODE.SPEEDMOD) {
            var availableMods = state.premiumPlayEnabled ?
                gameDataById.get(state.gameid).allMods : gameDataById.get(state.gameid).mods;

            keysForEach(function (key, type, keyState) {
                if (type === KEYTYPE.INT) keyState.disabled = !availableMods.has(key);
                else if (type === KEYTYPE.DEC) {
                    var currentInt = state.speedModInt || '0'; // no integer is treated as 0
                    // Don't let your guard down! If we don't check for the integer first, and the user inputs one,
                    // then switches game version, we could run into a missing object scenario!
                    keyState.disabled = !(availableMods.has(currentInt) &&
                        availableMods.get(currentInt).includes(key));
                }
            });
        }
    });

    // Init plug-in state into calculator
    computedState.update();
    commit();

    loadNextModule();
}).catch(function (err) {
    console.error("Error in games.js:", err, "\nModule loading has been halted");
});
