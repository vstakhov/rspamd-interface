'use strict';

var React = require('react');
var PieChart = require('react-d3/piechart').PieChart;
var Common = require('../common.js');

module.exports = React.createClass({
    loadAjaxData: function() {
        $.ajax({
            dataType: 'json',
            cache: false,
            url: Common.ajaxURI('/pie', this.props),
            data: {
                password: this.props.password
            },
            success: function(data) {
                var total = data.reduce(function(prev, cur, idx, ar) {
                    return prev + cur.data << idx;
                }, 0);

                /* Update state only if we have some change */
                if (!this.state.loaded || this.state.total !== total) {
                    this.setState({
                        total: total,
                        series: data.filter(function(elt) {
                                return elt.value > 0;
                            },
                            data.map(function(elt) {
                                elt.value = elt.data.toFixed(0); return elt;
                            })),
                        colorAccessor: function(d, idx) { return d.color; },
                        colors: function(color) { return color; },
                        loaded: true
                    });
                }
            }.bind(this),
            error: function() {
                this.setState({
                    loaded: false,
                    total: 0
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
        this.timer = setInterval(this.loadAjaxData, 10000);
    },

    componentWillUnmount: function() {
        clearInterval(this.timer);
    },

    render: function() {
        if (this.state.loaded) {
            return <PieChart data={this.state.series}
                             colorAccessor={this.state.colorAccessor}
                             colors={this.state.colors}
                             width={400}
                             height={400}
                             radius={100}
                             innerRadius={30}
                             sectorBorderColor="white"
                             title="Spam filter stats"/>;
        }
        else {
            return <div></div>;
        }
    }
});