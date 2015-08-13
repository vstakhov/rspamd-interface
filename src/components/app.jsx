var React = require('react');
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
function supportsSessionStorage() {
  return typeof(Storage) !== "undefined";
}

function getAuthCredentials() {
  var ret = {
    authenticated: false,
    server: 'localhost:11334',
    password: '',
    loaded: false
  }
  if (supportsSessionStorage()) {
    ret.password = localStorage.getItem('Password');
  } else {
    ret.password = $.cookie('rspamdpasswd');
  }

  if (ret.password !== '') {
    if (supportsSessionStorage()) {
      ret.server = localStorage.getItem('Server');
    } else {
      ret.server = $.cookie('rspamdserver');
    }
    ret.authenticated = true;
  }

  return ret;
}

function ajaxURI(path, state) {
  return 'http://' + state.server + path;
}

var App = React.createClass({
  getInitialState: function() {
    return getAuthCredentials();
  },

  componentDidMount: function() {
    if (this.state.authenticated) {
      $.ajax({
        dataType: 'json',
        cache: false,
        url: ajaxURI('/auth', this.state),
        data: {password: this.state.password},
        success : function(data) {
          var state = this.state;
          state.loaded = true;
          state.data = data;
          this.setState(state);
        }.bind(this),
        error : function() {
          var state = this.state;
          state.authenticated = false;
          this.setState(state);
        }.bind(this)
      });
    }
  },

  render : function() {

    if (this.state.loaded) {
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
    } else if (!this.state.authenticated) {
      /* Show login form */
      return <LoginForm server={this.state.server}
        password={this.state.password} parent={this}/>;
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
