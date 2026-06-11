const SPRITE_BASE = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon';

export const spriteUrl = (id: number) => `${SPRITE_BASE}/${id}.png`;
