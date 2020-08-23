/*! DDR Calc | https://github.com/Andrew67/ddr-calc */
/* Contains functionality for showing a bottom sheet with a list of songs to choose a BPM from */
'use strict';

// Start loading CSS asynchronously
// Support for setting the current game is provided by the games module
// The menu module must load first so that we can register our entry
addStylesheet('songlist');
// Kick off after icon loaded
fetch('img/md-close.svg')
.then(function (img) {
    return img.text();
}).then(function initSongListModule (closeBtnData) {
    const closeBtn = `<button class="svg-icon" id="song-list-close" title="Close">${closeBtnData}</button>`;

    // Load HTML and event handlers for the song list
    dom.songListContainer = document.getElementById('song-list-container');
    dom.songListContainer.innerHTML = `<div id="song-list">
            <div class="toolbar">${closeBtn}</div>
            <ul>
                <li>
                    <img src="img/songs/The_legend_of_MAX.png" alt="">
                    <h1>The legend of MAX</h1>
                    <h2>ZZ</h2>
                    <ul>
                        <li data-bpm="83"><button>83</button>
                        <li data-bpm="333"><button>333</button>
                    </ul>
                </li>
            </ul>
        </div>`;
    document.getElementById('song-list-close')
        .addEventListener('click', () => state.songListOpen && history.back());
    dom.songList = document.getElementById('song-list');
    dom.songListItemContainer = document.querySelector('#song-list > ul');
    dom.songListItemContainer.addEventListener('click', evt => {
        const bpmElement = evt.target.closest('[data-bpm]');
        if (bpmElement) {
            const newBpm = bpmElement.dataset.bpm.padStart(3, '0');
            if (state.songBpm !== newBpm) {
                state.songBpm = newBpm;
                computedState.update();
                commit();
            }
        }
    });

    // Set up song list variables
    state.songListOpen = Boolean(history.state && history.state.songListOpen);

    // Set up menu entry
    addMenuItem(3, 'Song List', function () {
        state.songListOpen = true;
        commit();
        history.replaceState({ songListOpen: true }, "", "");
    }, {
        hidden: () => state.songListOpen
    });

    // Handle show/hide with history API
    window.addEventListener('popstate', function handleSongListStateChange (event) {
        // Commit state change upon actual change (avoids running a postCommit hook on every browser navigation)
        const newSongListOpen = Boolean(event.state && event.state.songListOpen);
        if (state.songListOpen !== newSongListOpen) {
            state.songListOpen = newSongListOpen;
            commit();
        }
    });
    postCommitHooks.push(function showHideSongList () {
        dom.songListContainer.classList.toggle('show', state.songListOpen);
    });

    // This dynamic style tag will handle marking the active BPM as selected by leveraging the browser engine
    let previousBpm = null;
    const updateSelectedBpm = function updateSelectedBpm() {
        // Be careful! state.songBpm is user input, sanitize and validate accordingly to avoid XSS
        const songBpm = Number(state.songBpm);
        if (state.songBpm !== previousBpm && state.songListOpen && !isNaN(songBpm) && songBpm < 1000) {
            dom.songList.querySelectorAll(`[data-bpm='${songBpm}']`)
                .forEach(e => e.setAttribute('aria-current', 'true'));
            dom.songList.querySelectorAll(`[data-bpm]:not([data-bpm='${songBpm}'])`)
                .forEach(e => e.removeAttribute('aria-current'));
            previousBpm = state.songBpm;
        }
    };
    postCommitHooks.push(updateSelectedBpm);

    commit();
});