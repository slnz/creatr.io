(function() {

  (function(exports) {
    Ember.Facebook = Ember.Mixin.create({
      FBUser: void 0,
      appId: void 0,
      facebookParams: Ember.Object.create(),
      fetchPicture: true,
      init: function() {
        this._super();
        return window.FBApp = this;
      },
      facebookConfigChanged: (function() {
        var _this = this;
        this.removeObserver('appId');
        window.fbAsyncInit = function() {
          return _this.fbAsyncInit();
        };
        return $(function() {
          var js;
          $('body').append($("<div>").attr('id', 'fb-root'));
          js = document.createElement('script');
          $(js).attr({
            id: 'facebook-jssdk',
            async: true,
            src: "//connect.facebook.net/en_US/all.js"
          });
          return $('head').append(js);
        });
      }).observes('facebookParams', 'appId'),
      fbAsyncInit: function() {
        var facebookParams,
          _this = this;
        facebookParams = this.get('facebookParams');
        facebookParams = facebookParams.setProperties({
          appId: this.get('appId' || facebookParams.get('appId') || void 0),
          status: facebookParams.get('status') || true,
          cookie: facebookParams.get('cookie') || true,
          xfbml: facebookParams.get('xfbml') || true,
          channelUrl: facebookParams.get('channelUrl') || void 0
        });
        FB.init(facebookParams);
        FB.getLoginStatus(function(response) {
          if(response.status == 'connected') {
            console.log('trying to logout');
            FB.getLoginStatus(function(response) {
              FB.logout();
              App.set('button', false);
            });
            App.set('button', false);
            App.set('FBUser', false);
          }
        });
        this.set('FBloading', true);
        FB.Event.subscribe('auth.authResponseChange', function(response) {
          retVal =  _this.updateFBUser(response);
          App.set('button', true);
          return retVal;
        });
        return FB.getLoginStatus(function(response) {
          return _this.updateFBUser(response);
        });
      },
      updateFBUser: function(response) {
        var _this = this;
        if (response.status === 'connected') {
          return FB.api('/me', function(user) {
            var FBUser;
            FBUser = Ember.Object.create(user);
            FBUser.set('accessToken', response.authResponse.accessToken);
            if (_this.get('fetchPicture')) {
              return FB.api('/me/picture', function(path) {
                FBUser.picture = path;
                _this.set('FBUser', FBUser);
                return _this.set('FBloading', false);
              });
            } else {
              _this.set('FBUser', FBUser);
              return _this.set('FBloading', false);
            }
          });
        } else {
          this.set('FBUser', false);
          return this.set('FBloading', false);
        }
      }
    });
    return Ember.FacebookView = Ember.View.extend({
      classNameBindings: ['className'],
      init: function() {
        var attr, _results;
        this._super();
        this.setClassName();
        _results = [];
        for (attr in this) {
          if (attr.match(/^data-/) != null) {
            _results.push(this.attributeBindings.pushObjects(attr));
          }
        }
        return _results;
      },
      setClassName: function() {
        return this.set('className', "fb-" + this.type);
      },
      parse: function() {
        if (typeof FB !== "undefined" && FB !== null) {
          return FB.XFBML.parse(this.$().parent()[0].context);
        }
      },
      didInsertElement: function() {
        return this.parse();
      }
    });
  })({});

}).call(this);