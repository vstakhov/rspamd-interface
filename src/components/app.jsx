var React = require('react');
var Common = require('../common.js');
var Router = require('react-router'),
  RouteHandler = Router.RouteHandler,
  Route = Router.Route;

var ReactBootstrap = require('react-bootstrap'),
  Nav = ReactBootstrap.Nav,
  ListGroup = ReactBootstrap.ListGroup;

var ReactRouterBootstrap = require('react-router-bootstrap'),
  NavItemLink = ReactRouterBootstrap.NavItemLink,
  ButtonLink = ReactRouterBootstrap.ButtonLink,
  ListGroupItemLink = ReactRouterBootstrap.ListGroupItemLink;
var LoginForm = require('./login.jsx')

var App = React.createClass({
  getInitialState: function() {
    return Common.getAuthCredentials();
  },

  loadAjaxData: function() {
    $.ajax({
      dataType: 'json',
      cache: false,
      url: Common.ajaxURI('/auth', this.state),
      data: {password: this.state.password},
      success : function(data) {
        var state = this.state;
        state.stage = 'loaded';
        state.data = data;
        this.setState(state);
      }.bind(this),
      error : function() {
        var state = this.state;
        state.stage = 'need_auth';
        this.setState(state);
      }.bind(this)
    });
  },

  componentDidMount: function() {
    if (this.state.stage = 'got_auth') {
      this.loadAjaxData();
    }
  },

  render : function() {

    if (this.state.stage === 'loaded') {
      return (
        <div>
          NavItemLink<br/>
          <Nav>
            <NavItemLink params={{
              someparam: 'hello'
            }} to="destination">
              Linky!
            </NavItemLink>
          </Nav>
          <br/>
          ButtonLink<br/>
          <ButtonLink params={{
            someparam: 'hello'
          }} to="destination">
            Linky!
          </ButtonLink>
          <br/>
          <ListGroup>
            <ListGroupItemLink params={{
              someparam: 'hello'
            }} to="destination">
              Linky!
            </ListGroupItemLink>
          </ListGroup>
          <RouteHandler/>
          {this.state.data.toString()}
        </div>
      );
    } else if (this.state.stage === 'need_auth') {
      /* Show login form */
      return <LoginForm server={this.state.server}
        password={this.state.password} parent={this}/>;
    }
    else {
      this.loadAjaxData();
    }
    
    return <div></div>;
  }
});

var Destination = React.createClass({
  render: function() {
    return <div>You made it!</div>;
  }
});

var routes = (
  <Route handler={App} path="/">
    <Route handler={Destination} name="destination" path="destination/:someparam"/>
  </Route>
);

Router.run(routes, function(Handler) {
  React.render(<Handler/>, document.body);
});
