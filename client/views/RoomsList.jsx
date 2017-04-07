import React from 'react';
import PureRenderMixin from 'react-addons-pure-render-mixin';
import ImmutablePropTypes from 'react-immutable-proptypes';
import {connect} from 'react-redux';
import * as MDL from 'react-mdl';


export class RoomsList extends React.Component {
  static propTypes = {
    rooms: ImmutablePropTypes.mapOf(ImmutablePropTypes.record, React.PropTypes.string).isRequired
    , onRoomClick: React.PropTypes.func
  };

  static defaultProps = {
    onRoomClick: () => null
  };

  constructor(props) {
    super(props);
    this.shouldComponentUpdate = PureRenderMixin.shouldComponentUpdate.bind(this);
  }

  render() {
    //console.log(this.props.rooms.map((room, roomId) => roomId).valueSeq().toArray())
    return <MDL.List className="RoomsList">
      {this.props.rooms.map((room, roomId) =>
      <MDL.ListItem key={roomId}>
        <span>
          <a href="#" onClick={() => this.props.onRoomClick(roomId)}>
            {room.name}
          </a>
          &nbsp;({room.users.size}/{room.maxUsers})
        </span>
      </MDL.ListItem>).valueSeq().toArray()}
    </MDL.List>;
  }
}
