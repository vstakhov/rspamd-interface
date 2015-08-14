module.exports = {
  supportsSessionStorage: function() {
    return typeof(Storage) !== "undefined";
  },
  getAuthCredentials: function() {
    var ret = {
      stage: 'need_auth',
      server: 'localhost:11334',
      password: '',
      loaded: false
    }
    if (this.supportsSessionStorage()) {
      ret.password = localStorage.getItem('Password');
    } else {
      ret.password = $.cookie('rspamdpasswd');
    }

    if (ret.password !== '') {
      if (this.supportsSessionStorage()) {
        ret.server = localStorage.getItem('Server');
      } else {
        ret.server = $.cookie('rspamdserver');
      }
      ret.stage = 'got_auth';
    }

    return ret;
  },
  
  saveCredentials: function(cred) {
    if (this.supportsSessionStorage()) {
      localStorage.setItem('Password', cred.password);
      localStorage.setItem('Server', cred.server);
    }
    else {
      $.cookie('rspamdserver', cred.server);
      $.cookie('rspamdpasswd', cred.password);
    }
  },

  cleanCredentials: function() {
    if (this.supportsSessionStorage()) {
      localStorage.removeItem('Password');
      localStorage.removeItem('Server');
    }
    else {
      $.cookie('rspamdserver', '');
      $.cookie('rspamdpasswd', '');
    }
  },

  ajaxURI: function(path, state) {
    return 'http://' + state.server + path;
  }

};
