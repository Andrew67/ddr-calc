export type GameMods = Map<string, string[]>;
export type GameModsJSON = Array<[string, string[]]>;

export interface GameJSON {
  id: number;
  name: string;
  shortName?: string;
  mods: GameModsJSON;
  hasPremiumPlay: boolean;
  premiumPlayMods: GameModsJSON;
}

export interface Game {
  id: number;
  name: string;
  shortName?: string;
  mods: GameMods;
  hasPremiumPlay: boolean;
  premiumPlayMods: GameMods;
  allMods?: GameMods;
}
