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
      stompClient: null,
      intervalId: null,

      value: '',
      activeLines: [],
      coordinates: [],
      coordinatePosition: {
        'default': 0
      }
    };

    this.handleChange = this.handleChange.bind(this);
    this.send = this.send.bind(this);
    this.disconnect = this.disconnect.bind(this);
  }

  componentDidMount() {
    // this.getDirections("46.771556,23.626013", "46.753446,23.533058");

    let socket = new SockJS(`${SERVER_URL}/locations`);
    let stompClient = Stomp.over(socket);
    this.setState({stompClient});

    stompClient.connect({},
      frame => console.log('Connected: ' + frame),
      error => console.log(`error websocket ${error}`)
    );
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

  _newCoordinate() {
    this.state.activeLines.forEach(line => this._sendCoord(line));
  }

  _sendCoord(line) {
    let coordinatePosition = Object.assign({}, this.state.coordinatePosition);

    let newLocation = generateLocation(line, coordinatePosition[line]);

    this.state.stompClient.send(`/app/new-coordinate/${line}`, {}, JSON.stringify(newLocation.payload));

    coordinatePosition[line] = newLocation.nextPosition;
    this.setState({coordinatePosition});
  }

  send(e) {
    e.preventDefault();

    let value = this.state.value;
    let activeLines = [...this.state.activeLines, value];
    let coordinatePosition = Object.assign({}, this.state.coordinatePosition);
    coordinatePosition[value] = 0;

    let intervalId = setInterval(() => this._newCoordinate(), 5000);
    this.setState({
      intervalId,
      activeLines,
      coordinatePosition
    });

    // this.state.stompClient.subscribe('/topic/line.*', coordinate =>
    //   console.log("--------------- coordinate received: " + coordinate)
    // );
  }

  disconnect() {
    console.log("disconnecting...");

    this.state.stompClient.disconnect();
    clearInterval(this.state.intervalId);
  }

  render() {
    return (
      <form onSubmit={this.send}>
        <label>
          Name:
          <input type="text" value={this.state.value} onChange={this.handleChange}/>
        </label>
        <input type="submit" value="Submit"/>
        <button type="button" onClick={this.disconnect}>Disconnect</button>
      </form>
    );
  }
}

export default BussLocationSupplier;
