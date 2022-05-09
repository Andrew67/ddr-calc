export type GameMods = Map<string, string[]>;

export interface GameJSON {
    id: number;
    name: string;
    shortName?: string;
    mods: Array<Array<string|Array<string>>>;
    hasPremiumPlay: boolean;
    premiumPlayMods: Array<Array<string|Array<string>>>;
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
