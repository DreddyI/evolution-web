import React from 'react';
import T from "i18n-react";

import {branch, compose, renderNothing, withState} from "recompose";
import {connect} from 'react-redux';
import withStyles from "@material-ui/core/styles/withStyles";

import {TraitMimicry, TraitTailLoss} from '../../../../shared/models/game/evolution/traitsData/index';

import Typography from "@material-ui/core/Typography";
import DialogTitle from "@material-ui/core/DialogTitle";
import DialogContent from "@material-ui/core/DialogContent";
import DialogActions from "@material-ui/core/DialogActions";
import Button from "@material-ui/core/Button";

import Dialog from "../../../app/modals/Dialog";
import {Timer} from "../../utils/Timer";
import {Animal} from "../animals/Animal";
import AnimalTraitChooseList from "./AnimalTraitChooseList";

import {traitAnswerRequest} from "../../../../shared/actions/trait";
import {QuestionRecord} from "../../../../shared/models/game/GameModel";
import {checkIfTraitDisabledByIntellect} from "../../../../shared/actions/trait.checks";
import * as tt from "../../../../shared/models/game/evolution/traitTypes";
import User from "../../utils/User";
// import IconAttack from '@material-ui/icons/KeyboardArrowRight';
import SvgIcon from '@material-ui/core/SvgIcon';
import GameStyles from "../GameStyles";
import * as PropTypes from "prop-types";

const IconAttack = (props) => (
  <SvgIcon {...props} viewBox={'8 9 8 6'}>
    <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/>
  </SvgIcon>
);
// const IconAttack = (props) => (
//   <svg {...props} viewBox={'8 5 10 10'}>
//     <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" />
//   </svg>
// );

const styles = {
  content: {
    textAlign: 'center'
    , display: 'flex'
    , justifyContent: 'center'
    , alignItems: 'flex-end'
  }
  , defenceContainer: {
    display: 'flex'
    , flexDirection: 'column'
    , textAlign: 'center'
    , alignItems: 'center'
  }
  , defenceContainerTitle: {
    // maxWidth: GameStyles.defaultWidth
  }
  , iconAttack: {
    color: 'red'
    , fontSize: 96
    , width: 48
    , height: GameStyles.animal.height
  }
  , mimicryAnimalContainer: {
    display: 'flex'
    , flexFlow: 'row wrap'
    , justifyContent: 'center'
    , overflowY: 'auto'
  }
};

class QuestionDefence extends React.PureComponent {
  getTargetAnimal = () => {
    const game = this.props.game;
    return game.locateAnimal(game.question.targetAid, game.question.targetPid)
  };

  getAttackAnimal = () => {
    const game = this.props.game;
    return game.locateAnimal(game.question.sourceAid, game.question.sourcePid)
  };

  checkForAllowingNoDefence = () => {
    const {game} = this.props;
    const targetAnimal = this.getTargetAnimal();
    const attackAnimal = this.getAttackAnimal();
    const traitCarnivorous = attackAnimal.hasTrait(tt.TraitCarnivorous);
    const traitTailLoss = targetAnimal.hasTrait(tt.TraitTailLoss);
    const targetsTailLoss = traitTailLoss
      && !checkIfTraitDisabledByIntellect(attackAnimal, traitTailLoss)
      && TraitTailLoss.getTargets(game, targetAnimal, traitTailLoss, attackAnimal, traitCarnivorous);

    const traitMimicry = targetAnimal.hasTrait(tt.TraitMimicry);
    const targetsMimicry = traitMimicry
      && !traitMimicry.checkActionFails(game, targetAnimal)
      && !checkIfTraitDisabledByIntellect(attackAnimal, traitMimicry)
      && TraitMimicry.getTargets(game, targetAnimal, traitMimicry, attackAnimal, traitCarnivorous);

    const otherTraits = [
      targetAnimal.hasTrait(tt.TraitShell)
      , targetAnimal.hasTrait(tt.TraitInkCloud)
      , targetAnimal.hasTrait(tt.TraitRunning)
      , targetAnimal.hasTrait(tt.TraitCnidocytes)
    ].filter(t => !!t // Really has trait
      && !t.checkActionFails(game, targetAnimal) // And can activate it
      && !checkIfTraitDisabledByIntellect(attackAnimal, t) // And it's not blocked by attacking intellect
    );

    return otherTraits.every(t => t.getDataModel().optional)
      && !(traitTailLoss && targetsTailLoss.size > 0)
      && !(traitMimicry && targetsMimicry.size > 0);
  };

  getMode = () => {
    const {game, selectedTrait, setSelectedTrait, traitAnswerRequest} = this.props;
    const targetAnimal = this.getTargetAnimal();
    const attackAnimal = this.getAttackAnimal();
    const traitCarnivorous = attackAnimal.hasTrait(tt.TraitCarnivorous);
    const defaultMode = {
      checkTrait: trait => {
        if (checkIfTraitDisabledByIntellect(attackAnimal, trait)) return;
        switch (trait.type) {
          case tt.TraitTailLoss: {
            const targets = TraitTailLoss.getTargets(game, targetAnimal, trait, attackAnimal, traitCarnivorous);
            return targets && targets.size > 0;
          }
          case tt.TraitMimicry: {
            const targets = TraitMimicry.getTargets(game, targetAnimal, trait, attackAnimal, traitCarnivorous);
            return !trait.checkActionFails(game, targetAnimal)
              && targets && targets.size > 0;
          }
          case tt.TraitShell:
          case tt.TraitInkCloud:
          case tt.TraitRunning:
          case tt.TraitCnidocytes: {
            return !trait.checkActionFails(game, targetAnimal);
          }
        }
      }
      , onSelectTrait: trait => e => {
        switch (trait.type) {
          case tt.TraitTailLoss:
          case tt.TraitMimicry:
            setSelectedTrait(trait);
            break;
          default:
            setSelectedTrait(null);
            traitAnswerRequest(trait.id);
        }
      }
    };
    if (selectedTrait) {
      switch (selectedTrait.type) {
        case tt.TraitTailLoss:
          return {
            checkTrait: trait => TraitTailLoss.checkTarget(game, targetAnimal, trait)
            , onSelectTrait: (trait) => e => traitAnswerRequest(selectedTrait.id, trait.id)
          };
        case tt.TraitMimicry:
          return {
            checkTrait: () => false
            , onSelectAnimal: (animal) => e => traitAnswerRequest(selectedTrait.id, animal.id)
          }
      }
    }
    return defaultMode;
  };

  render() {
    const {classes, game, traitAnswerRequest, selectedTrait, setSelectedTrait} = this.props;
    const targetAnimal = this.getTargetAnimal();
    const attackAnimal = this.getAttackAnimal();

    const mode = this.getMode(game, targetAnimal, attackAnimal, selectedTrait);

    const disableTrait = (trait) => checkIfTraitDisabledByIntellect(attackAnimal, trait);

    const allowNothing = this.checkForAllowingNoDefence(game, targetAnimal, attackAnimal);
    const onSelectNothing = e => traitAnswerRequest(true);
    return (
      <Dialog open={true}>
        <DialogTitle>
          {T.translate('Game.UI.TraitDefenceDialog.AttackedBy')}
          &nbsp;
          <User id={game.question.sourcePid} variant='simple'/>:
        </DialogTitle>
        <DialogContent>
          <Typography align='center'>
            <T.span text='Game.UI.TraitDefenceDialog.Time'/>:&nbsp;
            <Timer start={game.question.time} duration={game.settings.timeTraitResponse}/>
          </Typography>

          {selectedTrait && <Typography align='center'>
            <span>{T.translate(`Game.UI.TraitDefenceDialog.DefendOption.${selectedTrait.type}`)}</span>
            &nbsp;
            <a onClick={e => setSelectedTrait(null)}>{T.translate(`Game.UI.TraitDefenceDialog.Cancel`)}</a>
          </Typography>}

          <div className={classes.content}>
            <div className={classes.defenceContainer}>
              <Animal animal={attackAnimal}>
                <AnimalTraitChooseList traitList={attackAnimal.traits.toList()}/>
              </Animal>
            </div>

            <IconAttack className={classes.iconAttack}/>

            <div className={classes.animalWrapper}>
              <Animal animal={targetAnimal}>
                <AnimalTraitChooseList
                  traitList={targetAnimal.traits.toList()}
                  checkTrait={mode.checkTrait}
                  onSelectTrait={mode.onSelectTrait}
                  disableTrait={disableTrait}
                />
              </Animal>
            </div>
          </div>
          {selectedTrait && selectedTrait.type === tt.TraitMimicry && this.renderMimicry(mode)}
        </DialogContent>
        <DialogActions>
          {allowNothing && <Button variant='contained'
                                   color='primary'
                                   onClick={onSelectNothing}>
            {T.translate('Game.UI.TraitDefenceDialog.Nothing')}
          </Button>}
        </DialogActions>
      </Dialog>
    );
  }

  renderMimicry(mode) {
    const {classes, game} = this.props;
    const targetAnimal = this.getTargetAnimal();
    const attackAnimal = this.getAttackAnimal();
    const traitCarnivorous = attackAnimal.hasTrait(tt.TraitCarnivorous);
    const traitMimicry = targetAnimal.hasTrait(tt.TraitMimicry);
    const targetsMimicry = traitMimicry
      && !traitMimicry.checkActionFails(game, targetAnimal)
      && !checkIfTraitDisabledByIntellect(attackAnimal, traitMimicry)
      && TraitMimicry.getTargets(game, targetAnimal, traitMimicry, attackAnimal, traitCarnivorous);
    return (
      <div className={classes.mimicryAnimalContainer}>
        {targetsMimicry.map(animal => <Animal
          key={animal.id}
          animal={animal}
          canInteract={true}
          acceptInteraction={mode.onSelectAnimal(animal)}
        >
          <AnimalTraitChooseList traitList={animal.traits.toList()}/>
        </Animal>)}
      </div>
    );
  }
}

QuestionDefence.propTypes = {
  classes: PropTypes.any,
  game: PropTypes.any,
  traitAnswerRequest: PropTypes.any,
  selectedTrait: PropTypes.any,
  setSelectedTrait: PropTypes.any
};

export default compose(
  withStyles(styles)
  , connect(
    ({game}) => ({game})
    , {traitAnswerRequest}
  )
  , branch(({game}) => !(game && game.question && game.question.id && game.question.type === QuestionRecord.DEFENSE), renderNothing)
  , withState('selectedTrait', 'setSelectedTrait', null)
)(QuestionDefence);