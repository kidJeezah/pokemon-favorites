const SPRITE_BASE = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon';

/** 96×96 list sprite, keyed by pokemon id — static GitHub asset, bypasses the proxy. */
export const spriteUrl = (id: number) => `${SPRITE_BASE}/${id}.png`;

/** Official artwork for the detail modal, keyed by pokemon id. */
export const artworkUrl = (id: number) => `${SPRITE_BASE}/other/official-artwork/${id}.png`;
