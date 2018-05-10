import React, {Component} from 'react';
import SockJS from 'sockjs-client';
import {Stomp} from "stompjs/lib/stomp.js";
import Polyline from '@mapbox/polyline';

import {generateLocation} from "../utils/locationMock";
import {SERVER_URL} from "../utils/constants";

class BussLocationSupplier extends Component {
  constructor() {
    super();

    this.state = {
      value: '',
      coordinates: [],
      coordinatePosition: 0
    };

    this.handleChange = this.handleChange.bind(this);
    this.send = this.send.bind(this);
  }

  componentDidMount() {
    // this.getDirections("46.771556,23.626013", "46.753446,23.533058");
  }

  async getDirections(startLoc, destinationLoc) {
    try {
      let resp = await fetch(`https://maps.googleapis.com/maps/api/directions/json?v=3.exp&origin=${startLoc}&destination=${destinationLoc}`);
      let respJson = await resp.json();
      let points = Polyline.decode(respJson.routes[0].overview_polyline.points);

      let duration = respJson.routes[0].legs[0].duration.text;
      let coordinates = points.map((point) => {
        return {
          latitude: point[0],
          longitude: point[1]
        }
      });
      this.setState({coordinates: coordinates});
      return coordinates;
    }
    catch (error) {
      alert(error);
      return error
    }
  }

  handleChange(event) {
    this.setState({value: event.target.value});
  }

  _newCoordinate(stompClient) {
    let newLocation = generateLocation(this.state.value, this.state.coordinatePosition);

    stompClient.send(`/app/new-coordinate/${this.state.value}`, {}, JSON.stringify(newLocation.payload));
    this.setState({coordinatePosition: newLocation.nextPosition});
  }

  send(e) {
    e.preventDefault();

    let socket = new SockJS(`${SERVER_URL}/locations`);
    let stompClient = Stomp.over(socket);

    stompClient.connect({},
      frame => {
        console.log('Connected: ' + frame);
        setInterval(() => this._newCoordinate(stompClient), 5000);
      },
      error => console.log(`error websocket ${error}`)
    );

  }

  render() {
    return (
      <form onSubmit={this.send}>
        <label>
          Name:
          <input type="text" value={this.state.value} onChange={this.handleChange}/>
        </label>
        <input type="submit" value="Submit"/>
      </form>
    );
  }
}

export default BussLocationSupplier;
