# games.json
Contains game-version specific metadata, for game picker functionality (and later Target BPM).
Thanks to RemyWiki for the speedmod information.


Fields:
* id - game ID (internal use)
* name - name to display in UI (some games share speedmods and are combined)
* shortName (optional) - name to display in parts of the UI where the combined name is too long
* mods - speed mods in regular play
* hasPremiumPlay - whether this game version offers premium play
* premiumPlayMods - additional speed mods available in regular play


mods/premiumPlayMods details:
* mods and premiumPlayMods are set up as a Map, where
  * array of arrays
  * first entry is key (integer)
  * second entry is array of valid decimal add-ons for that integer
  * can be fed directly to JavaScript's `new Map()`