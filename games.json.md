# games.json
Contains game-version specific metadata, for game picker functionality (and later Target BPM).
The games will always be ordered by `id`, which is correlated to when each game came out chronologically.
Thanks to RemyWiki for the speed mod information.


Fields:
* `id` - game ID (internal use)
* `name` - name to display in UI (some games share speed mods and are combined)
* `shortName` (optional) - name to display in parts of the UI where the combined name is too long
* `mods` - speed mods in regular play
* `hasPremiumPlay` - whether this game version offers premium play
* `premiumPlayMods` - additional speed mods available in regular play


mods/premiumPlayMods details:
* mods and premiumPlayMods are set up as a Map, where
  * array of arrays
  * first entry is key (integer)
  * second entry is array of valid decimal add-ons for that integer
  * can be fed directly into JavaScript's `new Map()`