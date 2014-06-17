var C = {};

// Provide both function and assignment access to variables for Flash compatibility
C.attrs = {};
C.attr = function( key, value ) {
  if ( value !== undefined ) {
    C.attrs[key] = value;
  }
  return C.attrs[key];
};

C.exceptions = {};
C.exceptions.rescue = function(module,e) {
  var error_message = e.message || e.description;
  if( C.attrs.production ) {
    1;
  } else if( typeof console !== 'undefined' ) {
  }
};

C.user_event = function(event_info_id, given_value, given_callback) {
  var callback = given_callback || function() {};
  var value = given_value || null;
  $.post(
    '/api/user/events.json',
    {
      '_session_id': C.attrs.sessionId,
      'event_info_id': event_info_id,
      'value': value
    },
    callback
  );
};

C.player_event = function(event_info_id, given_value, given_callback) {
  var callback = given_callback || function() {};
  var value = given_value || null;
  $.post(
    '/api/player/events.json',
    {
      '_session_id': C.attrs.sessionId,
      'event_info_id': event_info_id,
      'value': value
    },
    callback
  );
};

C.views = {};
C.views.current = {};

C.lightbox = {};
C.lightbox.prepare = function(){
  $('#facebook_request_iframe').load(function(){
    C.lightbox.hide();
  });
  $('#lightbox .cancel a').live('click', function(e){
    C.lightbox.hide();
  });
}
C.lightbox.loading = function(now_loading){
  var spinner = $('#lightbox .spinner');
  if(now_loading) {
    spinner.show();
  } else {
    spinner.hide();
  }
};
C.lightbox.hide = function() {
  $('#lightbox:visible').hide();
  window.location.href = '#container';
};

C.utils = {};
C.utils.open_in_new_window = function(url) {
  window.open(url);
};
C.utils.open_user_admin_page = function(player_id) {
  this.open_in_new_window('admin/users/?player_id=' + player_id);
};
C.utils.load_page = function(path) {
  window.top.location.href = C.attr('appPath') + path;
};
C.utils.top_load_page = function(path) {
  window.top.location.href = path;
};
C.utils.buy_ruby_package = function(ruby_package) {
  this.top_load_page('/paypal_payments/new?quantity=' + ruby_package);
};
C.utils.reload_app = function() {
  this.top_load_page( C.attrs.appPath );
};
C.utils.jump_to_top = function() {
  window.location.hash = 'hd';
};

C.debugPrint = function(data) {
}
