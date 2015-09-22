'use strict';

var React = require('react');

'use strict';

var React = require('react');
var AreaChart = require('react-d3/areachart').AreaChart;
var Common = require('../common.js');

module.exports = React.createClass({
    loadAjaxData: function() {
        $.ajax({
            dataType: 'json',
            cache: false,
            url: Common.ajaxURI('/graph', this.props),
            data: {
                password: this.props.password,
                type: this.props.type
            },
            success: function(data) {
                var transform_func = function(ar) {
                    return ar.map(function(elt) {
                       return {
                           x: new Date(elt.x * 1000),
                           y: (elt.y !== elt.y) ? 0 : elt.y,
                       };
                    });
                };
                this.setState({
                    series: [
                        {
                            name: "Reject",
                            color: "#CB4B4B",
                            values: transform_func(data[0])
                        },
                        {
                            name: "Probable",
                            color: "#D67E7E",
                            values: transform_func(data[1])
                        },
                        {
                            name: "Greylist",
                            color: "#A0A0A0",
                            values: transform_func(data[2])
                        },
                        {
                            name: "Clean",
                            color: "#58A458",
                            values: transform_func(data[3])
                        }
                    ],
                    colorAccessor: function(d, idx) { return d.color; },
                    colors: function(color) { return color; },
                    loaded: true
                });
            }.bind(this),
            error: function() {
                this.setState({
                    loaded: false,
                });
            }.bind(this)
        });
    },
    getInitialState: function() {
        return {
            loaded: false,
            total: 0
        };
    },

    componentDidMount: function() {
        this.loadAjaxData();
        var interval = 60 * 1000;

        if (this.props.type === 'hourly') {
            interval = 60 * 1000;
        }
        else if (this.props.type === 'daily') {
            interval = 5 * 60 * 1000;
        }
        else if (this.props.type === 'weekly') {
            interval = 10 * 60 * 1000;
        }
        else if (this.props.type === 'monthly') {
            interval = 60 * 60 * 1000;
        }

        this.timer = setInterval(this.loadAjaxData, interval);
    },

    componentWillUnmount: function() {
        clearInterval(this.timer);
    },

    render: function() {
        if (this.state.loaded) {
            return <AreaChart data={this.state.series}
                              legend={true}
                              width='100%'
                              height={400}
                              colorAccessor={this.state.colorAccessor}
                              colors={this.state.colors}
                              title={this.props.type + ' graph'}
                              xAxisTickInterval={{unit: 'hour', interval: 60}}
                              yAxisLabel="Messages count"
                              xAxisLabel="Date"
                              gridHorizontal={true}
                />;
        }
        else {
            return <div></div>;
        }
    }
});