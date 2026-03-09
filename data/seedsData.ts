export interface Seed {
  id: string;
  name: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  description: string;
  growthGoal: number;
  stages: string[];
}

export const seedsData: Seed[] = [
  {
    id: 'sun_fern',
    name: 'Sun-Kissed Fern',
    rarity: 'common',
    description: 'A resilient fern that thrives in bright light, symbolizing adaptability and growth.',
    growthGoal: 3,
    stages: ['seedling.png', 'growing.png', 'mature.png']
  },
  {
    id: 'moon_bloom',
    name: 'Moonlight Bloom',
    rarity: 'common',
    description: 'A delicate flower that opens at night, representing hidden potential and quiet strength.',
    growthGoal: 4,
    stages: ['seedling.png', 'budding.png', 'blooming.png', 'mature.png']
  },
  {
    id: 'crystal_cactus',
    name: 'Crystal Cactus',
    rarity: 'common',
    description: 'A hardy cactus with translucent spines, embodying protection and clarity.',
    growthGoal: 3,
    stages: ['seedling.png', 'growing.png', 'mature.png']
  },
  {
    id: 'golden_rose',
    name: 'Golden Rose',
    rarity: 'rare',
    description: 'A rare rose with golden petals, symbolizing achievement and excellence.',
    growthGoal: 5,
    stages: ['seedling.png', 'budding.png', 'blooming.png', 'golden.png', 'mature.png']
  },
  {
    id: 'starlight_orchid',
    name: 'Starlight Orchid',
    rarity: 'rare',
    description: 'An orchid that glows faintly in darkness, representing hope and guidance.',
    growthGoal: 4,
    stages: ['seedling.png', 'growing.png', 'glowing.png', 'mature.png']
  },
  {
    id: 'emerald_vine',
    name: 'Emerald Vine',
    rarity: 'rare',
    description: 'A climbing vine with emerald leaves, symbolizing progress and upward growth.',
    growthGoal: 4,
    stages: ['seedling.png', 'climbing.png', 'leafing.png', 'mature.png']
  },
  {
    id: 'phoenix_palm',
    name: 'Phoenix Palm',
    rarity: 'epic',
    description: 'A majestic palm that rises from its own ashes, embodying rebirth and resilience.',
    growthGoal: 6,
    stages: ['seedling.png', 'sprouting.png', 'growing.png', 'towering.png', 'blooming.png', 'mature.png']
  },
  {
    id: 'diamond_lily',
    name: 'Diamond Lily',
    rarity: 'epic',
    description: 'A lily with diamond-like petals, representing purity and precious achievements.',
    growthGoal: 5,
    stages: ['seedling.png', 'budding.png', 'sparkling.png', 'radiant.png', 'mature.png']
  },
  {
    id: 'thunder_oak',
    name: 'Thunder Oak',
    rarity: 'epic',
    description: 'A mighty oak that draws strength from storms, symbolizing power and endurance.',
    growthGoal: 6,
    stages: ['seedling.png', 'sprouting.png', 'growing.png', 'strong.png', 'mighty.png', 'mature.png']
  },
  {
    id: 'rainbow_iris',
    name: 'Rainbow Iris',
    rarity: 'epic',
    description: 'An iris with petals that shimmer in all colors, representing diversity and beauty.',
    growthGoal: 5,
    stages: ['seedling.png', 'budding.png', 'colorful.png', 'vibrant.png', 'mature.png']
  },
  {
    id: 'celestial_lotus',
    name: 'Celestial Lotus',
    rarity: 'legendary',
    description: 'A lotus that floats above water, symbolizing enlightenment and transcendence.',
    growthGoal: 7,
    stages: ['seedling.png', 'floating.png', 'budding.png', 'blooming.png', 'radiant.png', 'enlightened.png', 'mature.png']
  },
  {
    id: 'eternal_rose',
    name: 'Eternal Rose',
    rarity: 'legendary',
    description: 'A rose that never wilts, representing everlasting love and timeless beauty.',
    growthGoal: 7,
    stages: ['seedling.png', 'budding.png', 'blooming.png', 'eternal.png', 'timeless.png', 'immortal.png', 'mature.png']
  },
  {
    id: 'cosmic_fern',
    name: 'Cosmic Fern',
    rarity: 'legendary',
    description: 'A fern with leaves that contain miniature galaxies, embodying infinite possibilities.',
    growthGoal: 8,
    stages: ['seedling.png', 'sprouting.png', 'starry.png', 'cosmic.png', 'galactic.png', 'infinite.png', 'universal.png', 'mature.png']
  },
  {
    id: 'wisdom_tree',
    name: 'Wisdom Tree',
    rarity: 'legendary',
    description: 'An ancient tree that whispers knowledge to those who listen, representing wisdom and learning.',
    growthGoal: 8,
    stages: ['seedling.png', 'sprouting.png', 'growing.png', 'wise.png', 'knowledgeable.png', 'enlightened.png', 'sage.png', 'mature.png']
  },
  {
    id: 'harmony_bamboo',
    name: 'Harmony Bamboo',
    rarity: 'rare',
    description: 'Bamboo that sways in perfect rhythm with the wind, symbolizing balance and harmony.',
    growthGoal: 4,
    stages: ['seedling.png', 'growing.png', 'swaying.png', 'mature.png']
  },
  {
    id: 'courage_dandelion',
    name: 'Courage Dandelion',
    rarity: 'common',
    description: 'A dandelion that spreads its seeds fearlessly, representing courage and new beginnings.',
    growthGoal: 3,
    stages: ['seedling.png', 'blooming.png', 'mature.png']
  },
  {
    id: 'serenity_lavender',
    name: 'Serenity Lavender',
    rarity: 'rare',
    description: 'Lavender with calming purple blooms, embodying peace and tranquility.',
    growthGoal: 4,
    stages: ['seedling.png', 'budding.png', 'blooming.png', 'mature.png']
  },
  {
    id: 'victory_laurel',
    name: 'Victory Laurel',
    rarity: 'epic',
    description: 'A laurel tree with golden leaves, symbolizing triumph and achievement.',
    growthGoal: 5,
    stages: ['seedling.png', 'growing.png', 'golden.png', 'triumphant.png', 'mature.png']
  },
  {
    id: 'dream_poppy',
    name: 'Dream Poppy',
    rarity: 'rare',
    description: 'A poppy that blooms in the realm of dreams, representing imagination and creativity.',
    growthGoal: 4,
    stages: ['seedling.png', 'dreaming.png', 'blooming.png', 'mature.png']
  },
  {
    id: 'destiny_aster',
    name: 'Destiny Aster',
    rarity: 'epic',
    description: 'An aster that blooms according to the stars, embodying fate and destiny.',
    growthGoal: 6,
    stages: ['seedling.png', 'starry.png', 'destined.png', 'fated.png', 'prophetic.png', 'mature.png']
  }
]; 