'use strict';

var React = require('react-native');
var tweenState = require('react-tween-state');
var _ = require('lodash');

var {
  StyleSheet,
  Text,
  TouchableHighlight,
  View,
} = React;

var styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: 'column',
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    top: 0
  },
  content: {
    position: 'absolute',
    left: 0,
    right: 0
  }
});

var ContextMenuMixin = {
  getInitialState: function() {
    return {
      is_menu_visible: false
    };
  },

  showContextMenu: function() {
    this.setState({
      is_menu_visible: true
    });
  },

  dismissContextMenu: function() {
    this.setState({
      is_menu_visible: false
    });
  },

  childContextTypes: {
    showContextMenu: React.PropTypes.func,
    dismissContextMenu: React.PropTypes.func
  },

  getChildContext: function() {
    return {
      showContextMenu: this.showContextMenu,
      dismissContextMenu: this.dismissContextMenu
    };
  },
};

var ContextMenu = React.createClass({
  mixins: [tweenState.Mixin],

  statics: {
    Mixin: ContextMenuMixin
  },

  propTypes: {
    isVisible: React.PropTypes.bool.isRequired,
    overlayColor: React.PropTypes.string,
    duration: React.PropTypes.number,
    easeIn: React.PropTypes.string,
    easeOut: React.PropTypes.string,
    cancelButtonStyle: React.PropTypes.object,
    menuItems: React.PropTypes.array.isRequired,
    underlayColor: React.PropTypes.string,
    borderRadius: React.PropTypes.number,
    borderColor: React.PropTypes.string,
    cancelBtnBackground: React.PropTypes.string,
    menuItemBackground: React.PropTypes.string,
    menuItemColor: React.PropTypes.string
  },

  getDefaultProps() {
    return {
      overlayColor: 'rgba(0, 0, 0, 0)',
      duration: 300,
      easeIn: 'linear',
      easeOut: 'linear',
      cancelButtonStyles: {},
      underlayColor: '#0391D7',
      borderRadius: 0,
      cancelBtnBackground: '#ff0040',
      menuItemBackground: '#fff',
      menuItemColor: '#000',
      borderColor: '#fff'
    };
  },

  getInitialState() {
    return {
      opacity: 0,
      content_height: 0,
      overlay_height: 0,
      // temporarily set bottom offscreen
      bottom: -99999
    };
  },

  componentDidMount() {
    // Gets content height when component mounts
    // without setTimeout, measure returns 0 for every value.
    // See https://github.com/facebook/react-native/issues/953

    setTimeout(this._getContentHeight);
  },

  componentWillReceiveProps(new_props) {
    // Will be visible
    this._animateOverlay(new_props.isVisible);
    this._animateContentMenu(new_props.isVisible);
  },

  _getContentHeight() {
    this.refs.ContextMenuContent.measure((ox, oy, width, height, px, py) => {
      this.setState({
        content_height: height,
        bottom: -height
      });
    });
  },

  _animateOverlay: function(is_visible) {
    var delay = 0;
    var easing = this.props.easeIn;
    if (!is_visible) {
      delay = this.props.duration;
      easing = this.props.easeOut;
    }

    this.tweenState('opacity', {
      easing: tweenState.easingTypes[easing],
      delay: delay,
      duration: this.props.duration,
      endValue: is_visible === true ? 1 : 0
    });
  },

  _animateContentMenu: function(is_visible) {
    var delay = 0;
    var easing = this.props.easeOut;
    if (is_visible) {
      delay = this.props.duration;
      easing = this.props.easeIn;
    }

    this.tweenState('bottom', {
      easing: tweenState.easingTypes[easing],
      delay: delay,
      duration: this.props.duration,
      endValue: is_visible === true ? 0 : -this.state.content_height
    });
  },

  render() {
    return (
      /*jshint ignore:start */
      <View
        style={[styles.overlay, {
          opacity: this.getTweeningValue('opacity'),
          backgroundColor: this.props.overlayColor
        }]}
      >
        <View
          ref="ContextMenuContent"
          style={[styles.content, {
            bottom: this.getTweeningValue('bottom'),
          }]}
        >
          <MenuItems
            menuItems={this.props.menuItems}
            underlayColor={this.props.underlayColor}
            borderRadius={this.props.borderRadius}
            borderColor={this.props.borderColor}
            menuItemBackground={this.props.menuItemBackground}
            menuItemColor={this.props.menuItemColor}
          />
          <CancelButton
            style={this.props.cancelButtonStyle}
            underlayColor={this.props.underlayColor}
            borderRadius={this.props.borderRadius}
            cancelBtnBackground={this.props.cancelBtnBackground}
          />
        </View>
      </View>
      /*jshint ignore:end */
    );
  }
});


var MenuItems = React.createClass({
  render() {
    var menu_items = _.map(this.props.menuItems, (m, i) => {
      var style = {
        backgroundColor: this.props.menuItemBackground,
        borderColor: this.props.borderColor
      };

      if (i + 1 === 1) {
        // If border radius is on
        style.borderTopLeftRadius = this.props.borderRadius;
        style.borderTopRightRadius = this.props.borderRadius;

      }

      var is_last = i + 1 === this.props.menuItems.length;
      if (is_last) {
        style.borderBottomWidth = 0;

        // If border radius is on
        style.borderBottomLeftRadius = this.props.borderRadius;
        style.borderBottomRightRadius = this.props.borderRadius;
      }

      return (
        <MenuItem
          key={i}
          label={m.label}
          func={m.func}
          style={style}
          menuItemColor={this.props.menuItemColor}
          underlayColor={this.props.underlayColor}
        />
      );
    });
    return (
      <View
        style={{
          margin: 6,
        }}
      >
        {menu_items}
      </View>
    );
  }
});

var MenuItem = React.createClass({
  contextTypes: {
    showContextMenu: React.PropTypes.func.isRequired,
    dismissContextMenu: React.PropTypes.func,
    animateBackground: React.PropTypes.func
  },

  propTypes: {
    label: React.PropTypes.string.isRequired,
    func: React.PropTypes.func.isRequired,
    style: React.PropTypes.object
  },

  getDefaultProps() {
    style: {}
  },

  _clickHandler() {
    this.props.func();
    this.context.dismissContextMenu();
    this.context.animateBackground();
  },

  render() {
    return (
      <TouchableHighlight
        onPress={this._clickHandler}
        style={[
          {
            paddingTop: 12,
            paddingBottom: 12,
            borderColor: '#fff',
            borderBottomWidth: 1
          },
          this.props.style
        ]}
        activeOpacity={1}
        underlayColor={this.props.underlayColor}
      >
        <Text
          style={{
            color: this.props.menuItemColor,
            textAlign: 'center',
            fontWeight: '800',
            fontSize: 15
          }}
        >
          {this.props.label}
        </Text>
      </TouchableHighlight>

    );
  }
});

var CancelButton = React.createClass({
  contextTypes: {
    showContextMenu: React.PropTypes.func.isRequired,
    dismissContextMenu: React.PropTypes.func,
    animateBackground: React.PropTypes.func
  },

  _dismissContextMenu() {
    this.context.dismissContextMenu();
    this.context.animateBackground();
  },

  render() {
    return (
      /*jshint ignore:start */
        <TouchableHighlight
          ref="ContextMenuCancel"
          onPress={this._dismissContextMenu}
          style={[
            {
              paddingTop: 12,
              paddingBottom: 12,
              margin: 6,
              marginTop: 0
            },
            {
              borderRadius: this.props.borderRadius,
              backgroundColor: this.props.cancelBtnBackground
            }
          ]}
          activeOpacity={1}
          underlayColor={this.props.underlayColor}
        >
          <Text
            style={{
              color: '#fff',
              textAlign: 'center',
              fontWeight: '800',
              fontSize: 15
            }}
          >
            Cancel
          </Text>
        </TouchableHighlight>
      /*jshint ignore:end*/
    );
  }
});

module.exports = ContextMenu;
