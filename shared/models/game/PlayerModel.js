import {Record, List, Map} from 'immutable';
import {UserModel} from '../UserModel';
import {CardModel} from './CardModel';
import {AnimalModel} from './evolution/AnimalModel';

export class PlayerModel extends Record({
  id: null
  , hand: List()
  , continent: List()
  , index: -1
  , ready: false
  , playing: true
  , ended: false
  , acted: false
  , skipped: 0
}) {
  toOthers() {
    return this
      .update('hand', hand => hand.map((card) => card.toOthers()))
      .set('continent', this.continent.map(animalModel => animalModel.toOthers()));
  }

  toClient() {
    return this.update('hand', hand => hand.map((card) => card.toClient()))
  }

  static fromServer(js) {
    return js == null
      ? null
      : new PlayerModel(js)
      .set('hand', List(js.hand).map(card => CardModel.fromServer(card)))
      .set('continent', List(js.continent).map(animalModel => AnimalModel.fromServer(animalModel)));
  }

  static new(userId, index) {
    return new PlayerModel({id: userId, index})
  }

  countScore() {
    return this.continent.reduce((score, animal) => score + animal.countScore(), 0);
  }

  getCard(index) {
    return this.hand.get(index);
  }

  getAnimal(index) {
    return this.continent.get(index);
  }
}