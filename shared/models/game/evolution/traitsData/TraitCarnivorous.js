import logger from '~/shared/utils/logger';
import uuid from 'uuid';
import {List, fromJS} from 'immutable';
import {
  TRAIT_TARGET_TYPE
  , TRAIT_COOLDOWN_DURATION
  , TRAIT_COOLDOWN_PLACE
  , TRAIT_COOLDOWN_LINK
  , TRAIT_ANIMAL_FLAG
} from '../constants';
import {
  server$traitKillAnimal
  , server$startFeeding
  , server$startFeedingFromGame
  , server$traitStartCooldown
  , server$traitActivate
  , traitQuestion
  , server$traitDefenceQuestion
  , server$traitDefenceAnswer
  , server$traitIntellectQuestion
  , server$traitIntellectAnswer
  , server$traitAnswerSuccess
  , server$traitNotify_Start
  , server$traitNotify_End
  , server$traitAnimalAttachTrait
  , server$traitAnimalRemoveTrait
  , traitAmbushEnd
  , server$traitSetValue
} from '../../../../actions/actions';
import {
  checkTraitActivation
  , checkIfTraitDisabledByIntellect
} from '../../../../actions/trait.checks';
import {selectGame} from '../../../../selectors';

import {TraitModel} from '../TraitModel';
import {QuestionRecord} from '../../GameModel';

import {
  TraitMimicry
  , TraitRunning
  , TraitTailLoss
  , TraitShell
  , TraitInkCloud
} from './index';

import {
  TraitScavenger
  , TraitSymbiosis
  , TraitSharpVision
  , TraitCamouflage
  , TraitMassive
  , TraitPoisonous
  , TraitBurrowing
  , TraitSwimming
  , TraitFlight
  , TraitIntellect
  , TraitAnglerfish
} from '../traitTypes/index';

export const endHunt = (game, sourceAnimal, traitCarnivorous, targetAnimal) => (dispatch) => {
  dispatch(server$traitStartCooldown(game.id, traitCarnivorous, sourceAnimal));
  dispatch(endHuntNoCd(game, sourceAnimal, traitCarnivorous, targetAnimal));
};

export const endHuntNoCd = (game, sourceAnimal, traitCarnivorous, targetAnimal) => (dispatch) => {
  if (game.ambush) {
    const {animal} = game.locateAnimal(game.ambush);
    if (animal) {
      dispatch(traitAmbushEnd(game.id, animal));
      dispatch(server$startFeedingFromGame(game.id, animal.id, 1));
    }
  }
  const traitAnglerfish = sourceAnimal.hasTrait(TraitAnglerfish);
  if (traitAnglerfish) {
    const traitIntellect = sourceAnimal.hasTrait(TraitIntellect);
    dispatch(server$traitAnimalRemoveTrait(game, sourceAnimal, traitAnglerfish));
    dispatch(server$traitAnimalRemoveTrait(game, sourceAnimal, traitIntellect));
  }
  if (traitCarnivorous.value) dispatch(server$traitSetValue(game, sourceAnimal, traitCarnivorous, false));
  dispatch(server$traitNotify_End(game.id, sourceAnimal.id, traitCarnivorous, targetAnimal.id));
};

const countUnavoidableDefenses = (game, sourceAnimal, targetAnimal) => {
  let defenses = 0;
  if (sourceAnimal.hasTrait(TraitSwimming) && !targetAnimal.hasTrait(TraitSwimming))
    defenses++;
  return defenses;
};

export const getStaticDefenses = (game, sourceAnimal, targetAnimal) =>
  targetAnimal.traits.filter((trait) =>
    (trait.type === TraitCamouflage && !sourceAnimal.hasTrait(TraitSharpVision))
    || (trait.type === TraitSymbiosis && trait.linkSource)
    || (trait.type === TraitMassive && !sourceAnimal.hasTrait(TraitMassive))
    || (trait.type === TraitBurrowing && targetAnimal.isSaturated())
    || (trait.type === TraitSwimming && !sourceAnimal.hasTrait(TraitSwimming))
    || (trait.type === TraitShell && targetAnimal.hasFlag(TRAIT_ANIMAL_FLAG.SHELL))
    || (trait.type === TraitFlight && (sourceAnimal.traits.size >= targetAnimal.traits.size))
  ).toArray();

export const getAffectiveDefenses = (game, sourceAnimal, targetAnimal) => [
  targetAnimal.hasTrait(TraitPoisonous)
].filter(trait => !!trait);

export const getActiveDefenses = (game, sourceAnimal, targetAnimal) =>
  targetAnimal.traits.filter((trait) =>
    (trait.type === TraitRunning.type)
    || (trait.type === TraitMimicry.type && trait.checkAction(game, targetAnimal))
    || (trait.type === TraitTailLoss.type && trait.checkAction(game, targetAnimal))
    || (trait.type === TraitShell.type && trait.checkAction(game, targetAnimal))
    || (trait.type === TraitInkCloud.type && trait.checkAction(game, targetAnimal))
  ).toArray();

export const TraitCarnivorous = {
  type: 'TraitCarnivorous'
  , food: 1
  , targetType: TRAIT_TARGET_TYPE.ANIMAL
  , playerControllable: true
  , checkTraitPlacement: (animal) => !animal.hasTrait(TraitScavenger)
  , cooldowns: fromJS([
    ['TraitCarnivorous', TRAIT_COOLDOWN_PLACE.ANIMAL, TRAIT_COOLDOWN_DURATION.TURN]
    , [TRAIT_COOLDOWN_LINK.EATING, TRAIT_COOLDOWN_PLACE.PLAYER, TRAIT_COOLDOWN_DURATION.ROUND]
  ])
  , action: (game, sourceAnimal, trait, targetAnimal) => (dispatch, getState) => {
    /**
     * Check for counter-attack (aka anglerfish)
     */

    const animalAnglerfish = game.getPlayer(targetAnimal.ownerId).continent.filter(animal =>
      animal.traits.size === 1
      && animal.traits.get(0).type === TraitAnglerfish
      && animal.traits.get(0).checkAction(game, animal)
      && (targetAnimal === animal || animal.traits.get(0).value === true)
    ).get(0);

    if (animalAnglerfish) {
      const newTraitCarnivorous = TraitModel.new('TraitCarnivorous');
      const newTraitIntellect = TraitModel.new(TraitIntellect);

      dispatch(endHunt(game, sourceAnimal, trait, targetAnimal));

      dispatch(server$traitAnimalAttachTrait(game, animalAnglerfish, newTraitCarnivorous));
      dispatch(server$traitAnimalAttachTrait(game, animalAnglerfish, newTraitIntellect));
      const reselectedGame = selectGame(getState, game.id);
      const {animal: revealledAnglerfish} = reselectedGame.locateAnimal(animalAnglerfish.id, animalAnglerfish.ownerId);
      if (TraitCarnivorous.checkTarget(reselectedGame, revealledAnglerfish, sourceAnimal)) {
        dispatch(server$traitActivate(game, animalAnglerfish, newTraitCarnivorous, sourceAnimal));
      } else {
        dispatch(server$traitAnimalRemoveTrait(game, animalAnglerfish, newTraitIntellect));
      }
      return true;
    }

    /**
     * Get defenses info
     */

    logger.debug(`TraitCarnivorous: ${sourceAnimal.id} > ${targetAnimal.id}`);
    const possibleDefenses = [];
    let possibleDefenseTargets = 0;
    let traitMimicry, traitMimicryTargets, traitTailLoss, traitTailLossTargets, traitRunning, traitShell, traitInkCloud;

    const traitIntellect = sourceAnimal.hasTrait(TraitIntellect);
    let disabledTid = traitIntellect && traitIntellect.value;

    getActiveDefenses(game, sourceAnimal, targetAnimal)
      .forEach((defenseTrait) => {
        if (defenseTrait.id === disabledTid || defenseTrait.type === disabledTid) return;

        if (defenseTrait.type === TraitRunning.type) {
          traitRunning = defenseTrait;
          possibleDefenses.push(defenseTrait);
        } else if (defenseTrait.type === TraitMimicry.type) {
          traitMimicry = defenseTrait;
          traitMimicryTargets = TraitMimicry.getTargets(game, sourceAnimal, TraitCarnivorous, targetAnimal);
          possibleDefenseTargets += traitMimicryTargets.size;
          if (traitMimicryTargets.size > 0) possibleDefenses.push(defenseTrait);
        } else if (defenseTrait.type === TraitTailLoss.type) {
          traitTailLoss = defenseTrait;
          traitTailLossTargets = targetAnimal.traits;
          possibleDefenseTargets += traitTailLossTargets.size;
          if (traitTailLossTargets.size > 0) possibleDefenses.push(defenseTrait);
        } else if (defenseTrait.type === TraitShell.type) {
          traitShell = defenseTrait;
          possibleDefenses.push(defenseTrait);
        } else if (defenseTrait.type === TraitInkCloud.type) {
          traitInkCloud = defenseTrait;
          possibleDefenses.push(defenseTrait);
        }
      });

    /**
     * Get Intellect info
     * After defenses because we need to know, if it will be useful to use intellect.
     */

    if (traitIntellect && !disabledTid) {
      // default intellect found, need to ask
      const unavoidableDefenses = countUnavoidableDefenses(game, sourceAnimal, targetAnimal);
      const staticDefenses = getStaticDefenses(game, sourceAnimal, targetAnimal)
      if (unavoidableDefenses === 0 && staticDefenses.length === 0) {
        const affectiveDefenses = getAffectiveDefenses(game, sourceAnimal, targetAnimal);

        if (possibleDefenses.length === 0 && affectiveDefenses.length === 0) {
        } //do nothing
        else if (possibleDefenses.length === 1 && affectiveDefenses.length === 0) disabledTid = possibleDefenses[0].id;
        else if (possibleDefenses.length === 0 && affectiveDefenses.length === 1) disabledTid = affectiveDefenses[0].id;
        else {
          const defaultIntellect = (questionId) => {
            const targetId = (possibleDefenses.length > 0 ? possibleDefenses[0].id
              : affectiveDefenses.length > 0 ? affectiveDefenses[0].id
              : true);
            return server$traitIntellectAnswer(game.id, questionId, traitIntellect.id, targetId);
          };
          dispatch(server$traitIntellectQuestion(game.id, sourceAnimal, trait, targetAnimal, defaultIntellect));
          return false;
        }
      }
    }

    /**
     * Actual attack started - check for running first
     * */

    if (traitRunning && !!TraitRunning.action()) {
      dispatch(server$traitNotify_Start(game, targetAnimal, traitRunning, sourceAnimal));
      dispatch(endHunt(game, sourceAnimal, trait, targetAnimal));
      return true;
    }

    /**
     * Make function for default defense
     * */
    // if user has no options or if user didn't respond - outcome will be the same, so we DRY

    const defaultDefence = (questionId) => (dispatch, getState) => {
      if (traitTailLoss && traitTailLossTargets.size > 0 && traitTailLoss.id !== disabledTid && disabledTid !== true) {
        dispatch(server$traitDefenceAnswer(game.id
          , questionId
          , TraitTailLoss.type
          , traitTailLossTargets.last().id
        ));
        return false;
      } else if (traitMimicry && traitMimicryTargets.size > 0 && traitMimicry.id !== disabledTid && disabledTid !== true) {
        dispatch(server$traitDefenceAnswer(game.id
          , questionId
          , TraitMimicry.type
          , traitMimicryTargets.get(0).id
        ));
        return false;
      } else if (traitShell && traitShell.id !== disabledTid && disabledTid !== true) {
        dispatch(server$traitDefenceAnswer(game.id
          , questionId
          , traitShell.id
        ));
        return false;
      } else if (traitInkCloud && traitInkCloud.id !== disabledTid && disabledTid !== true) {
        dispatch(server$traitDefenceAnswer(game.id
          , questionId
          , traitInkCloud.id
        ));
        return false;
      } else {
        dispatch(server$traitAnswerSuccess(game.id, questionId));
        dispatch(endHunt(game, sourceAnimal, trait, targetAnimal));

        const poisonous = targetAnimal.hasTrait(TraitPoisonous);
        if (poisonous) {
          dispatch(server$traitActivate(game, targetAnimal, poisonous, sourceAnimal));
        }

        dispatch(server$traitKillAnimal(game.id, sourceAnimal, targetAnimal));

        dispatch(server$startFeeding(game.id, sourceAnimal, 2, 'TraitCarnivorous'));

        // Scavenge
        const currentPlayerIndex = game.getPlayer(sourceAnimal.ownerId).index;
        // Selecing new game to not touch killed animal
        game.constructor.sortPlayersFromIndex(selectGame(getState, game.id), currentPlayerIndex).some(player => player.continent.some(animal => {
          const traitScavenger = animal.hasTrait(TraitScavenger);
          if (traitScavenger && animal.canEat(game) > 0) {
            dispatch(server$startFeeding(game.id, animal, 1, 'TraitScavenger', sourceAnimal.id));
            return true;
          }
        }));
        return true;
      }
    };

    /**
     * Now we determine if we need to ask user at all
     * */

    logger.debug(`possibleDefences: ${possibleDefenses.length}/${possibleDefenseTargets}`)
    if (possibleDefenseTargets > 1) {
      dispatch(server$traitDefenceQuestion(game.id, sourceAnimal, trait, targetAnimal, defaultDefence));
      return false;
    } else {
      const question = QuestionRecord.new(QuestionRecord.DEFENSE, sourceAnimal, trait.id, targetAnimal);
      logger.debug('server$traitDefenceQuestionInstant', question.id, sourceAnimal.id, trait.id, targetAnimal.id);
      dispatch(traitQuestion(game.id, question));
      return dispatch(defaultDefence(question.id));
    }
  }
  , $checkAction: (game, sourceAnimal) => {
    return sourceAnimal.canEat(game)
  }
  , checkTarget: (game, sourceAnimal, targetAnimal) => {
    const unavoidable = countUnavoidableDefenses(game, sourceAnimal, targetAnimal);
    if (unavoidable > 0) return false;

    const defenses = getStaticDefenses(game, sourceAnimal, targetAnimal).length;

    return sourceAnimal.hasTrait(TraitIntellect)
      ? defenses < 2
      : defenses < 1;
  }
};