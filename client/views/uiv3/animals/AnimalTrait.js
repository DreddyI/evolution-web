import React from 'react';
import T from "i18n-react";
import cn from "classnames";

import {compose} from "recompose";
import {connect} from "react-redux";
import withStyles from '@material-ui/core/styles/withStyles';

import {InteractionSource} from "../InteractionManager";

import Typography from "@material-ui/core/Typography";

import GameStyles from "../GameStyles";

import {DND_ITEM_TYPE} from "../../game/dnd/DND_ITEM_TYPE";
import {PHASE} from "../../../../shared/models/game/GameModel";
import {TRAIT_TARGET_TYPE} from "../../../../shared/models/game/evolution/constants";
import * as tt from "../../../../shared/models/game/evolution/traitTypes";

import {openQuestionMetamorphose, openQuestionRecombination} from "../../../actions/modal";
import {traitActivateRequest, traitAmbushActivateRequest} from "../../../../shared/actions/trait";
import styled from "../../../styles/styled";
import AnimalLinkedTrait from "./AnimalLinkedTrait";

export const AnimalTraitBody = styled('div')({
  ...GameStyles.animalTrait
  , ...GameStyles.addTraitColors((colorConfig) => ({
    background: colorConfig.fill
    , '& .AnimalTraitText': {
      color: colorConfig.text
      , fontSize: 14
      , display: 'flex'
      , '& .name': {
        ...GameStyles.ellipsis
        , flex: '1 1 0'
      }
    }
    , '&.disabled': {
      background: colorConfig.fillDisabled
      , '& .AnimalTraitText': {
        color: colorConfig.textDisabled
      }
    }
    , '&.canStart': {
      background: colorConfig.fillActive
      , cursor: 'pointer'
      , '& .AnimalTraitText': {
        color: colorConfig.textActive
        , fontWeight: 500
      }
      , '&:hover': {
        background: colorConfig.fillActiveHover
        , '& .AnimalTraitText': {
          color: colorConfig.textActiveHover
        }
      }
    }
    , '&.value': {
      background: colorConfig.fillValue
      , '& .AnimalTraitText': {
        color: colorConfig.textValue
        , fontWeight: 500
      }
    }
  }))
});

export class TraitBase extends React.PureComponent {
  onClick = e => {
    const {canStart, startInteraction} = this.props;
    canStart && startInteraction(e);
  };

  render() {
    const {trait, canStart, disabled} = this.props;
    const cnAnimalTrait = cn(
      'AnimalTrait2'
      , trait.type
      , {
        canStart
        , value: trait.value
        , disabled: disabled || trait.disabled
      }
    );
    return (
      <AnimalTraitBody className={cnAnimalTrait} onClick={this.onClick}>
        <Typography className='AnimalTraitText'>
          <span className='name'>{T.translate('Game.Trait.' + trait.type)}</span>
          <span className='food'>{trait.getDataModel().food > 0 ? ' +' + trait.getDataModel().food : null}</span>
        </Typography>
      </AnimalTraitBody>
    )
  }
}

const AnimalTrait = (props) => {
  const trait = props.trait;
  const traitDataModel = trait.getDataModel();
  if (trait.type === tt.TraitMetamorphose) {
    return <InteractiveTraitMetamorphose {...props}/>;
  } else if (trait.type === tt.TraitRecombination) {
    return <InteractiveTraitRecombination {...props}/>;
  } else if (trait.type === tt.TraitAmbush) {
    return <InteractiveTraitAmbush {...props}/>;
  } else if (traitDataModel.playerControllable && traitDataModel.targetType === TRAIT_TARGET_TYPE.ANIMAL) {
    return <InteractiveTrait {...props}/>;
  } else if (traitDataModel.playerControllable) {
    return <InteractiveTraitClickable {...props}/>;
  } else {
    return <TraitBase {...props}/>;
  }
};

export const AnimalTraitWrapper = (props) => {
  if (props.trait.isLinked()) {
    return (
      <AnimalLinkedTrait trait={props.trait} sourceAnimal={props.sourceAnimal}>
        <AnimalTrait {...props}/>
      </AnimalLinkedTrait>
    );
  }
  return <AnimalTrait {...props}/>;
};

const checkCanStartBase = (game, animal) => (game.userId === animal.ownerId);

const checkCanStart = ({game}, {trait, sourceAnimal}) => (
  checkCanStartBase(game, sourceAnimal)
  && (game.isPlayerTurn() || trait.getDataModel().transient)
  && game.status.phase === PHASE.FEEDING
  && !trait.checkActionFails(game, sourceAnimal)
);

const checkCanStartAmbush = ({game}, {trait, sourceAnimal}) => {
  const traitCarnivorous = sourceAnimal.hasTrait(tt.TraitCarnivorous);
  return (
    checkCanStartBase(game, sourceAnimal)
    && game.status.phase === PHASE.AMBUSH
    && traitCarnivorous
    && !traitCarnivorous.checkActionFails(game, sourceAnimal)
  )
};

export const InteractiveTraitMetamorphose = compose(
  connect((state, props) => ({canStart: checkCanStart(state, props)}), (dispatch, {trait, sourceAnimal}) => ({
    startInteraction: () => dispatch(openQuestionMetamorphose({trait, sourceAnimal}))
  }))
)(TraitBase);

export const InteractiveTraitRecombination = compose(
  connect((state, props) => ({canStart: checkCanStart(state, props)}), (dispatch, {trait, sourceAnimal}) => ({
    startInteraction: () => dispatch(openQuestionRecombination({trait, sourceAnimal}))
  }))
)(TraitBase);

export const InteractiveTraitAmbush = compose(
  connect((state, props) => ({
    canStart: checkCanStartAmbush(state, props)
  }), (dispatch, {trait, sourceAnimal}) => ({
    startInteraction: () => dispatch(traitAmbushActivateRequest(sourceAnimal.id, trait.value))
  }))
)(TraitBase);

export const InteractiveTraitClickable = compose(
  connect((state, props) => ({canStart: checkCanStart(state, props)}), (dispatch, {trait, sourceAnimal}) => ({
    startInteraction: () => dispatch(traitActivateRequest(sourceAnimal.id, trait.id))
  }))
)(TraitBase);

export const InteractiveTrait = compose(
  connect((state, props) => ({canStart: checkCanStart(state, props)}), {traitActivateRequest})
  , InteractionSource(DND_ITEM_TYPE.TRAIT, {
    canStart: ({canStart}) => canStart
    , onStart: ({trait, sourceAnimal}) => ({trait, sourceAnimal})
  })
)(TraitBase);

export default AnimalTraitWrapper;