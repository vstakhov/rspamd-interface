var React = require('react');
var Common = require('../common.js');
var ReactBootstrap = require('react-bootstrap'),
  Modal = ReactBootstrap.Modal,
  Button = ReactBootstrap.Button,
  Input = ReactBootstrap.Input;

module.exports = React.createClass({
  getInitialState: function() {
    return {
      server: this.props.server,
      password: this.props.password,
      show: true
    }
  },

  validationRe: /^\S+:\d{2,5}$/,

  handleChange: function() {
    this.setState({
      server: this.refs.serverInput.getValue(),
      password: this.refs.passwordInput.getValue(),
      show: true
    });
  },

  validationState: function() {
    if (!this.validationRe.test(this.state.server)) {
      return 'error';
    }
    return 'success';
  },

  submit: function() {
    Common.saveCredentials(this.state)
    var pstate = this.props.parent.state;
    pstate.password = this.state.password;
    pstate.server = this.state.server;
    pstate.stage = 'got_auth';
    this.props.parent.setState(pstate);
    var lstate = this.state;
    lstate.show = false;
    this.setState(lstate);
  },

  render: function() {
    return (
      <div className='static-modal'>
        <Modal.Dialog show={this.state.show}>
          <Modal.Header>
            <Modal.Title>Login to rspamd</Modal.Title>
          </Modal.Header>

          <Modal.Body>
            <Input groupClassName='input-group'
                label='Server'
                labelClassName='label'
                placeholder='Server address'
                ref='serverInput'
                type='text'
                bsStyle={this.validationState()}
                hasFeedback
                value={this.state.server}
                onChange={this.handleChange}/>
            <Input groupClassName='input-group'
                label='Password'
                labelClassName='label'
                placeholder='Server password'
                ref='passwordInput'
                type='password'
                value={this.state.password}
                onChange={this.handleChange}/>
          </Modal.Body>

          <Modal.Footer>
            <Button bsStyle='primary' onClick={this.submit}>Login</Button>
          </Modal.Footer>

        </Modal.Dialog>
      </div>
    );
  }
});
