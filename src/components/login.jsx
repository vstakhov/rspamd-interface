var React = require('react');
var ReactBootstrap = require('react-bootstrap'),
  Modal = ReactBootstrap.Modal,
  Button = ReactBootstrap.Button,
  Input = ReactBootstrap.Input;

module.exports = React.createClass({
  getInitialState: function() {
    return {
      server: this.props.server,
      password: this.props.password,
      show: this.props.parent.state.authenticated
    }
  },

  validationRe: /^\S+:\d{2,5}$/,

  handleChange: function() {
    this.setState({
      server: this.refs.serverInput.getValue(),
      password: this.refs.passwordInput.getValue()
    });
  },

  validationState: function() {
    if (!this.validationRe.test(this.state.server)) {
      return 'error';
    }
    return 'success';
  },

  submit: function() {
    localStorage.setItem('Password', this.state.password);
    localStorage.setItem('Server', this.state.server);
    var pstate = this.props.parent.state;
    pstate.authenticated = true;
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
                labelClassName='label-class'
                placeholder='Server address'
                ref='serverInput'
                type='text'
                bsStyle={this.validationState()}
                hasFeedback
                value={this.props.server}
                onChange={this.handleChange}/>
            <Input groupClassName='input-group'
                  label='Password'
                  labelClassName='label-class'
                  placeholder='Server password'
                  ref='passwordInput'
                  type='password'
                  value={this.props.password}
                  onChange={this.handleChange}/>
          </Modal.Body>

          <Modal.Footer>
            <Button bsStyle='primary' onClick={submit}>Login</Button>
          </Modal.Footer>

        </Modal.Dialog>
      </div>
    );
  }
});
