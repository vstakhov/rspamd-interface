var React = require('react');
var Common = require('../common.js');

module.exports = React.createClass({
  loadAjaxData: function() {
    $.ajax({
      dataType: 'json',
      cache: false,
      url: Common.ajaxURI('/auth', this.props),
      data: {password: this.props.password},
      success : function(data) {
        this.setState({
          data: data,
          loaded: true
        });
      }.bind(this),
      error : function() {
        this.setState({
          loaded: false
        });
      }.bind(this)
    });
  },

  getInitialState: function() {
    return {loaded: false};
  },

  componentDidMount: function() {
    this.loadAjaxData();
    this.timer = setInterval(this.loadAjaxData, 500);
  },

  componentWillUnmount: function() {
    clearInterval(this.timer);
  },
  
  render: function() {
    if (this.state.loaded) {
      return (
        <div>{JSON.stringify(this.state.data)}</div>
      );
    }
    else {
      /* XXX: add loading progress */
      return <div></div>;
    }
  }
});
