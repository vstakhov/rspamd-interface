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
  },

  msToTime: function (seconds) {
      var minutes = parseInt(seconds / 60);
      var hours = parseInt(seconds / 3600);
      var days = parseInt(seconds / 3600 / 24);
      var weeks = parseInt(seconds / 3600 / 24 / 7);
      var years = parseInt(seconds / 3600 / 168 / 365);

      if (weeks > 0) {
          years = years >= 10 ? years : '0' + years;
          weeks -= years * 168;
          weeks = weeks >= 10 ? weeks : '0' + weeks;
          // Return in format X years and Y weeks
          return years + ' years ' + weeks + ' weeks';
      }

      seconds -= minutes * 60;
      minutes -= hours * 60;
      hours -= days * 24;
      days = days >= 10 ? days : '0' + days;
      hours = hours >= 10 ? hours : '0' + hours;
      minutes = minutes >= 10 ? minutes : '0' + minutes;
      seconds = seconds >= 10 ? seconds : '0' + seconds;
      
      if (days > 0) {
          return days + ' days, ' + hours + ':' + minutes + ':' + seconds;
      }
      else {
          return hours + ':' + minutes + ':' + seconds;
      }
  }
};
