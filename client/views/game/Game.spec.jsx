import React from 'react';

import TestBackend from 'react-dnd-test-backend';
import { DragDropContext } from 'react-dnd';

import {List, Map} from 'immutable';
import {Game, DDCGame} from './Game.jsx';

import {UserModel, STATUS} from '../../../shared/models/UserModel';
import {PlayerModel} from '../../../shared/models/game/PlayerModel';
import {RoomModel} from '../../../shared/models/RoomModel';
import {GameModel, GameModelClient, TEST_DECK_SIZE, TEST_HAND_SIZE} from '../../../shared/models/game/GameModel';
import {CardModel} from '../../../shared/models/game/CardModel';
import {roomCreateRequest, roomJoinRequest, gameCreateRequest, gameReadyRequest} from '../../../shared/actions/actions';

describe('Game', () => {
  //describe('Empty Navigation', () => {
  //  const clientStore0 = mockClientStore();
  //  const $Game = shallow(<GameView store={clientStore0}/>).shallow();
  //  //expect('asdf').ok;
  //});
  const hand = CardModel.generate(TEST_HAND_SIZE);
  const props = {
    user: new UserModel({
      id: 'User0'
      , login: 'User0'
      , status: STATUS.OFFLINE
    })
    , game: new GameModelClient({
      id: null
      , userId: 'User0'
      , roomId: null
      , deck: TEST_DECK_SIZE - TEST_HAND_SIZE - TEST_HAND_SIZE
      , players: Map({
        User0: new PlayerModel({
          id: 'User0'
          , hand: hand
          , status: STATUS.LOADING
        })
        , User1: new PlayerModel({
          id: 'User1'
          , hand: TEST_HAND_SIZE
          , status: STATUS.LOADING
        })
      })
    })
    , $ready: () => {}
    , $playCard: () => {}
  };

  it('Displays default game', () => {
    const $Game = shallow(<Game {...props}/>);

    expect($Game.find({name: 'Deck'}).props().children.length, 'Deck.length > 0').equal(TEST_DECK_SIZE - TEST_HAND_SIZE - TEST_HAND_SIZE);
    expect($Game.find({name: 'Hand'}).props().children.length, 'Hand.length > 0').equal(TEST_HAND_SIZE);

    //console.log(clientStore0.getState().get('game'))
    //console.log($Game.debug())
    //console.log($Game.find({name: 'Hand'}).props().cards.size)
  });

  it('Displays DDCGame', () => {
    const TestContext = DragDropContext(TestBackend)(Game);
    const $Game = mount(<TestContext {...props}/>);

    const dndBackend = $Game.instance().getManager().getBackend();

    const cardHID = $Game.find('DragSource(Component)').get(1).getHandlerId();

    dndBackend.simulateBeginDrag([cardHID]);


    const PlayerContinentHID = $Game.find('DropTarget(PlayerContinentDropTargetZone)').get(0).getHandlerId()

    dndBackend.simulateHover([PlayerContinentHID]);

    dndBackend.simulateDrop();
  });
});

//  const [serverStore, {clientStore0, User0}, {clientStore1, User1}] = mockStores(2);
//  clientStore0.dispatch(roomCreateRequest());
//  const roomId = serverStore.getState().get('rooms').first().id;
//  clientStore0.dispatch(roomJoinRequest(roomId));
//  clientStore1.dispatch(roomJoinRequest(roomId));
//  clientStore0.dispatch(gameCreateRequest(roomId));
//  clientStore0.dispatch(gameReadyRequest());
//  clientStore1.dispatch(gameReadyRequest());