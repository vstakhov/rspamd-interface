var React = require('react');
var Common = require('../common.js');
var Router = require('react-router'),
  RouteHandler = Router.RouteHandler,
  Route = Router.Route;

var ReactBootstrap = require('react-bootstrap'),
  Nav = ReactBootstrap.Nav,
  Navbar = ReactBootstrap.Navbar,
  NavItem = ReactBootstrap.NavItem,
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
        this.setState({
          data: data,
          stage: 'loaded'
        });
      }.bind(this),
      error : function() {
        this.setState({
          stage: 'need_auth'
        });
      }.bind(this)
    });
  },

  componentDidMount: function() {
    if (this.state.stage = 'got_auth') {
      this.loadAjaxData();
    }
  },

  onLoginFormSubmit: function(server, password) {
    this.setState({
      stage: 'got_auth',
      server: server,
      password: password
    })
  },

  disconnect: function() {
    Common.cleanCredentials();
    this.setState({
      stage: 'need_auth'
    });
  },

  render : function() {

    if (this.state.stage === 'loaded') {
      return (
        <div>
          <Navbar brand={<a href="#">Rspamd interface</a>}>
          <Nav>
            <NavItem eventKey={1} to="status">Status</NavItem>
            <NavItem eventKey={2} to="configuration">Configuration</NavItem>
            <NavItem eventKey={3} to="learning">Learning</NavItem>
            <NavItem eventKey={4} to="history">History</NavItem>
            <NavItem eventKey={5} onClick={this.disconnect}>Disconnect</NavItem>
          </Nav>
          </Navbar>
          <RouteHandler/>
          {JSON.stringify(this.state.data)}
        </div>
      );
    } else if (this.state.stage === 'need_auth') {
      /* Show login form */
      return <LoginForm server={this.state.server}
        password={this.state.password} onSubmit={this.onLoginFormSubmit}/>;
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
    <Route handler={App} name="status" path="status/"/>
    <Route handler={App} name="configuration" path="configuration/"/>
    <Route handler={App} name="learning" path="learn/"/>
    <Route handler={App} name="history" path="history/"/>
  </Route>
);

Router.run(routes, function(Handler) {
  React.render(<Handler/>, document.body);
});
