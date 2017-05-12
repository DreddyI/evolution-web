export const CTT_PARAMETER = (i => ({
  ANIMAL: 1 << i++
  , SELF: 1 << i++
  , ENEMY: 1 << i++
  , LINK: 1 << i++
  , ONEWAY: 1 << i++
}))(0);

export const CARD_TARGET_TYPE = {
  ANIMAL_SELF: CTT_PARAMETER.ANIMAL + CTT_PARAMETER.SELF
  , ANIMAL_ENEMY: CTT_PARAMETER.ANIMAL + CTT_PARAMETER.ENEMY
  , LINK_SELF: CTT_PARAMETER.ANIMAL + CTT_PARAMETER.SELF + CTT_PARAMETER.LINK
  , LINK_SELF_ONEWAY: CTT_PARAMETER.ANIMAL + CTT_PARAMETER.SELF + CTT_PARAMETER.LINK + CTT_PARAMETER.ONEWAY
  , LINK_ENEMY: CTT_PARAMETER.ANIMAL + CTT_PARAMETER.ENEMY + CTT_PARAMETER.LINK
};

export const CARD_SOURCE = {
  DECK: 'DECK'
  , HAND: 'HAND'
};

export const TRAIT_TARGET_TYPE = {
  ANIMAL: 'ANIMAL'
  , TRAIT: 'TRAIT'
  , NONE: 'NONE'
};

export const TRAIT_COOLDOWN_PLACE = {
  ANIMAL: 'ANIMAL'
  , PLAYER: 'PLAYER'
  , GAME: 'GAME'
  , OTHER_ANIMALS: 'OTHER_ANIMALS'
  , TRAIT: 'TRAIT'
};

export const TRAIT_COOLDOWN_DURATION = {
  ACTIVATION: 'ACTIVATION'
  , ROUND: 'ROUND'
  , TWO_TURNS: 'TWO_ROUNDS'
  , TURN: 'PHASE'
};

export const TRAIT_COOLDOWN_LINK = {
  EATING: 'EATING'
};

export const TRAIT_ANIMAL_FLAG = {
  HIBERNATED: 'HIBERNATED'
  , POISONED: 'POISONED'
  , SHELL: 'SHELL'
};

export const ANIMAL_DEATH_REASON = {
  STARVE: 'STARVE'
  , KILL: 'KILL'
  , POISON: 'POISON'
  , NEOPLASM: 'NEOPLASM'
};