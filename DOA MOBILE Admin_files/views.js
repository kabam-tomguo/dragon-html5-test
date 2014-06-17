//JSLint globals declaration:
/*global $, jQuery, setTimeout, clearTimeout, window, document, confirm, alert*/
//Utilities
var Admin;
if (typeof(Admin) == 'undefined') {
	Admin = {};
}
//Show spinners to show that an ajax call is loading
Admin.showSpinners = function(elem) {
	$('.spinner').show();
	$(elem).find('.spinner_container').show();
	$(elem).parents('form').find('.spinner_container').show();
};
//Show spinners to show that an ajax call has completed
Admin.hideSpinners = function(elem) {
	$('.spinner').hide();	
	$(elem).find('.spinner_container').hide();
	$(elem).parents('form').find('.spinner_container').show();
};
//Modal popup show
Admin.showModal = function(content) {
	$('#modal_screen, #modal_container').show();
	$('object:visible, embed:visible').addClass('modal_hide');
	$('.modal_hide').hide();
	$('#modal_popup_content').html(content);
	$('#modal_popup').show();
};
//Modal popup hide
Admin.hideModal = function() {
	$('#modal_screen, #modal_container').hide();
	$('#modal_popup').hide();	
	$('.modal_hide').show().removeClass('modal_hide');
};
//Show flash messages, msgs is null or a json object {notice: NOTICE, error: ERROR}
Admin.showFlash = function(msgs) {
	var $notice = $('#ajax_flash .notice');
	var $error = $('#ajax_flash .error');

	if (msgs.notice) {
    top.toastr.success(msgs.notice);
		//clearTimeout(Admin.flashNoticeTimeout);
		//$notice.text(msgs.notice);
		//$notice.show();
		//Admin.flashNoticeTimeout = setTimeout(function() { $notice.fadeOut(1000); }, 2000);
	}
	if (msgs.error) {
    top.toastr.error(msgs.error);
		//clearTimeout(Admin.flashErrorTimeout);
		//$error.text(msgs.error);
		//$error.show();
		//Admin.flashErrorTimeout = setTimeout(function() { $error.fadeOut(1000); }, 2000);						
	}
};

//jQuery needs to request javascript back
jQuery.ajaxSetup({
  'beforeSend': function(xhr) { xhr.setRequestHeader("Accept", "text/javascript"); }
});

//jQuery Extensions
(function($) {
	//Set Cursor Position -> from http://stackoverflow.com/questions/499126/jquery-set-cursor-position-in-text-area
  $.fn.setCursorPosition = function(pos) {
    if ($(this).get(0).setSelectionRange) {
      $(this).get(0).setSelectionRange(pos, pos);
    } else if ($(this).get(0).createTextRange) {
      var range = $(this).get(0).createTextRange();
      range.collapse(true);
      range.moveEnd('character', pos);
      range.moveStart('character', pos);
      range.select();
    }
  };
	//Utility Method based on Graham Blache's slayjax
	$.adminajax = function(options) {
	  // Always JSON
	  options.dataType = 'json';
	  // Custom response handlers
	  var user_success_callback = options.success;
	  var user_error_callback = options.error;
	  var user_serious_error = options.serious_error;

	  /**
	   * Success callback
	   * Basically this exists because we want to define our own AJAX standard/protocol.
	   * An invalid model or an unauthorized request is different than an AJAX request bombing.
	   * We want to handle these "errors" gracefully.
	   */
	  options.success = function(json) {
	    // Check for errors
			if (json.flash) {
				Admin.showFlash(json.flash);
			}
	    if (json.error) {
				// Error callback
	      if (user_error_callback) { user_error_callback({message: json.error_message, errors: json.errors_list }); }
	    } else {
	      // Call the user success callback if it exists
	      if (user_success_callback) { user_success_callback(json.payload); }
	    }
	  };

	  /**
	   * Bad error handler
	   * This handles real, unplanned errors like 500s
	   * This should probably be improved.
	   */
	  options.error = function(XMLHttpRequest, textStatus, errorThrown) {
	    if (!options.supress_error_alerts) {
				Admin.hideSpinners();
				alert('Oops, we are having trouble processing your request at this time, please try again or contact technical support.');
	    }

	    // Serious error callback
	    if (user_serious_error) { user_serious_error(); }

	  };

	  // Make the call
	  $.ajax(options);
	};

	//Wrapper for showing and hiding spinners with ajax
	$.adminspinnerajax = function(elem, options) {
		Admin.showSpinners(elem);
		var fnSuccess = options.success; 
		var fnError = options.error;
		var fnSerious = options.serious_error;
		options.success = function(content) { 
			Admin.hideSpinners(elem); 
			if (typeof(fnSuccess) == 'function') { fnSuccess(content); }
		};
		options.error = function(error) { 
			Admin.hideSpinners(elem); 
			if (typeof(fnError) == 'function') { fnError(error); }
			if (options.errorsContainer) {
				var $errors = $(options.errorsContainer);
				$errors.find('.message').text(error.message);
				$errors.find('.errors').text(error.errors.join(', '));
				$errors.show();
				$errors.click(function(e) { $(this).hide(); });
				setTimeout(function() { $errors.fadeOut(); }, 5000);			
			}
		};
		options.serious_error = function() {
			Admin.hideSpinners(elem); 
			if (typeof(fnSerious) == 'function') { fnSerious(); }		
		};
		$.adminajax(options);			
	};

	//Wrapper for form submission
	$.adminajaxsubmit = function(form, options) {
		var $form = $(form);
		$.adminspinnerajax(form, $.extend(options, {
			type: 'POST',
			url: $form[0].action,
			data: $.param($form.serializeArray())
		}));
	};

	//Wrapper for ajax links
	$.adminajaxlink = function(link, options) {
		var realType = options.type == 'GET' ? 'GET' : 'POST';
		var extendedData = options.type == 'GET' ? options.data : $.extend(options.data, {_method : options.type});
		$.adminspinnerajax(link, $.extend(options, {
				type: realType,
				url: link.href,
				data: extendedData
			})
		);			
	};

	//Wrapper for search forms
	$.adminajaxsearch = function(form, options) {
		var data = {};
		$(form).find('.search').each(function(i) {
			if (this.value.length > 0 && (this.type != 'checkbox' || this.checked)) {
				data[this.name] = this.value;				
			}
		});
		$.adminspinnerajax(form, $.extend(options, {
			type: 'GET',
			url: form.action,
			data: data
		}));
	};
})(jQuery);

//Setup behaviours
$(document).ready(function(e) {	
	//some fixes to help jquery with rails
	//$("body").bind("ajaxSend", function(elm, xhr, s) {
		//if (s.type == "GET") { return; }
		//if (s.data && s.data.match(new RegExp("\\b" + window._auth_token_name + "="))) { return; }
		//if (s.data) {
			//s.data = s.data + "&";
		//} else {
			//s.data = "";
			//xhr.setRequestHeader("Content-Type", s.contentType);
		//}
		//s.data = s.data + encodeURIComponent(window._auth_token_name) + "=" + encodeURIComponent(window._auth_token);
	//});
	$('#modal_screen, #modal_closer').click(function(e) {
		Admin.hideModal();
	});
	var flashes = {notice: $('#flash_messages .notice').text(), error: $('#flash_messages .error').text()};
	if (flashes.notice.replace(/\s/g, '').length === 0) { flashes.notice = null; } 
	if (flashes.error.replace(/\s/g, '').length === 0) { flashes.error = null; }
	Admin.showFlash(flashes);
	//find the id namespace function
	var id = document.getElementsByTagName('body')[0].id;
	//Call the id namespace function
	if (typeof(Admin[id]) == 'function') { Admin[id](); }
});

C.views.admin_timings_index = function (){

	$('select').bind('change', function(e) {
		e.preventDefault();
		$form = $(this.form);
		$.adminspinnerajax(this, {
			type: 'GET',
			url: '/admin/timings/show/0',
			data: jQuery.param($form.serializeArray()), 
			success: function(data) {
				$form.find("#resource_time").val(data.time);
			}
		});
	});

	$('form').live('submit', function(e) {
		e.preventDefault();
		$this = $(this);
		$.adminajaxsubmit(this, {
			success: function(data) {
				$this[0].reset();
			}
		});
	});
	
}

C.views.admin_abuse_reports_show = function(){

	$('.ignore_link').live('click', function(e) {
		e.preventDefault();
		$this = $(this);
		$.adminajaxlink(this, {
			type: 'PUT',
			success: function(data) {
				if (data.redirect) {
					window.location = data.redirect;
				}
				else {
					$('#abuse_open_reports').html(data.open)
					$('#abuse_closed_reports').html(data.closed)
					$('#notes').html(data.notes);
				}
			}
		});
	});

	$('.button-to').live('submit', function(e) {
		e.preventDefault();
		$form = $(this);	
		var abuse_reports = $('.abuse_report_checkbox:checked');
		if(abuse_reports.length == 1) {	
			$.adminspinnerajax(this, {
				type: 'POST',
				url: $form[0].action,
				data: jQuery.makeArray(abuse_reports),		
				success: function(data) {
					if (data.redirect) {
						window.location = data.redirect;
					}
					else {
						$('#abuse_open_reports').html(data.open)
						$('#player_stats').html(data.warnings)
						$('#notes').html(data.notes);
					}
				}
			})
		}
		else{
			alert("Please select just one report to send a warning about.")	
		}	
		
	});
		
	$('#new_note_form').live('submit', function(e) {
		e.preventDefault();
		$.adminajaxsubmit(this, {
			success: function(content) {
				$('#notes').html(content);
			}
		});
	});		

	$('#select_all_reports_button').live('click', function(e) {
		e.preventDefault();
		$('.abuse_report_checkbox').attr('checked', true);
	});

	$('#ignore_reports_button').live('click', function(e) {
		e.preventDefault();
		form = $('#abuse_reports_form');
		$.adminajaxsubmit(form, {
			success: function(data) {
				if (data.redirect) {
					window.location = data.redirect;
				}
				else {
					$('#abuse_open_reports').html(data.open)
					$('#notes').html(data.notes);
				}
			}
		});
		
	});


}	

admin_user_show_functions = {
	updateStat: function(stat_name, value) {
		var item = $("tr#" + stat_name + "_row td");
		item.text(value);
		Admin.showFlash({notice: stat_name + " updated to " + value});		
	},
}

C.views.admin_users_show = function(){

	$('.lazy_pane_link').live('click', function(e) {
		e.preventDefault();
		var $this = $(this);
		if ($this.data('loaded')) { 
			$this.siblings('.pane').toggle(); 
		} else {
			$.adminajaxlink(this, {
				type: 'GET',
				success: function(data) {
					for (var id in data) {
						if (data.hasOwnProperty(id)) {
							var $container = $('#' + id);
							if ($container.length > 0) {						
								$container.html(data[id]);
							}
						}
					}
					$this.siblings('.pane').show();
					$this.data('loaded', true);
				}
			});			
		}
	});
		
	$('.report_show_details_link').live('click', function(e) {
		e.preventDefault();
		$(this).parents('tr').next().show(); 
		$(this).attr("class", "report_hide_details_link");
		$(this).html("Hide");
	});


	$('.report_hide_details_link').live('click', function(e) {
		e.preventDefault();
		$(this).parents('tr').next().hide(); 
		$(this).attr("class", "report_show_details_link");
		$(this).html("Show");
	});

	$('.reloader').live('click', function(e) {
		e.preventDefault();
		var $link = $(this).parents('.lazy_pane').find('.lazy_pane_link'); 
		$link.data('loaded', null);
		$link.click();		
	});

	$('.new_window').live('click', function(e) {
	  e.preventDefault();
	  var nw = window.open(this.href, 'lazy_pane_popup', 'height=500,width=700');
	  if (window.focus) { nw.focus() };
	  var $this = $(this);
	  nw.onload = function() {
	    var tmp = nw.document.getElementById('lazy_panes');
  	  tmp.innerHTML = '<div class="lazy_pane">' + ($this.parents('.lazy_pane')[0].innerHTML) + '</div>';	    
	  };
	});
	$('.closer').live('click', function(e) {
		e.preventDefault();
		var $link = $(this).parents('.lazy_pane').find('.lazy_pane_link'); 
		$link.siblings('.pane').toggle(); 
	});	
    $('#grant_user_currencies, #revoke_user_currencies').live('submit', function(e) {
		e.preventDefault();
		var $this = $(this);
		$.adminajaxsubmit(this, {
			success: function(data) {
				$this[0].reset();
				$('#notes').html(data.notes);
				for (var currency in data) {
					if (data.hasOwnProperty(currency)) {
						var row = $('#'+currency+'_row');
						if (row.length > 0) {
							row.find('td').text(data[currency]);
						}
					}
				}
			}
		});
	});
	
	//Used in many cases to update the page with player, note and lazy_pane information
	var processCommonData = function(data) {	
		$('#notes').html(data.notes);
		if (data.hasOwnProperty('panes')) {
	      panes = $('#lazy_panes');
		  for (var field in data.panes){
			var container = panes.find('#' + field)
			if (container.length > 0) {						
				container.html(data.panes[field]);
			}
	      }
	    }	
		if (data.hasOwnProperty('player')) {
	      player_stats = $('#player_stats');
		  for (var field in data.player){
		  	player_stats.find('#' + field + '_row td').html(data.player[field]);
	      }
	    }			
	}
	
	
	$('#grant_building_form, #grant_city_form, #grant_resources_form, #grant_items_form, #grant_troops_form, #change_arena_point_form').live('submit', function(e) {
		e.preventDefault();
		var $this = $(this);
		$.adminajaxsubmit(this, {
			success: function(data) {
				$this[0].reset();
				processCommonData(data)
			}
		});
	});

	$('.alliance_remove_link').live('click', function(e) {
      e.preventDefault();
      var $this = $(this);
      $.adminajaxlink(this, {
        type: 'PUT',
        success: function(data) {
			$('#notes').html(data.notes);
			$('#alliance_row').replaceWith(data.row);
		}
      });    
	});

	$('#new_note_form').live('submit', function(e) {
		e.preventDefault();
		$.adminajaxsubmit(this, {
			success: function(content) {
				$('#notes').html(content);
			}
		});
	});
	$('.complete_fue').live('click', function(e) {
      e.preventDefault();
      var $this = $(this);
      $.adminajaxlink(this, {
        type: 'PUT',
        success: function(data) {
          $('#complete_fue_row').remove();
		  processCommonData(data);
		}
      });    
	});
	$('.reset_fte').live('click', function(e) {
      e.preventDefault();
      var $this = $(this);
      $.adminajaxlink(this, {
        type: 'PUT',
        success: function(data) {
          $('#reset_fte_row').remove();
		  processCommonData(data);
		}
      });    
	});


   $('.level_link').live('click', function(e) {
      e.preventDefault();
      var $this = $(this);
      $.adminajaxlink(this, {
        type: 'PUT',
        success: function(data) {
          $this.parents('td').html(data.level);
		}
      });    
    });	

   $('.merged_times_link').live('click', function(e) {
      e.preventDefault();
      var $this = $(this);
      $.adminajaxlink(this, {
        type: 'PUT',
        success: function(data) {
          $this.parents('td').html(data.level);
		}
      });    
    });	

    $('.general_skill_link').live('click', function(e) {
      e.preventDefault();
      var $this = $(this);
      $.adminajaxlink(this, {
        type: 'PUT',
        success: function(data) {
          $this.parents('p').html(data.level);
		  if (data.hasOwnProperty('player')) {
			player_stats = $('#player_stats');
		  	for (var field in data.player){
  			  player_stats.find('#' + field + '_row td').html(data.player[field]);
			}
		  }	
		}
      });    
    });	
	$('.building_delete_link, .city_delete_link, .promotions_delete_link').live('click', function(e) {
		e.preventDefault();
		var $this = $(this);
		$.adminajaxlink(this, {
			type: 'DELETE',
			success: function(data) {
				processCommonData(data)
			}
		});			
	});	
	$('.ban_control_link').live('click', function(e) {
		e.preventDefault();
		$.adminajaxlink(this, {
			type: 'PUT',
			success: function(data) {
				$('#notes').html(data.notes);
				$('#ban_unban_row').replaceWith(data.row);
			}
		});
	});	
	$('.delete_pii_control_link').live('click', function(e) {
		e.preventDefault();
		$.adminajaxlink(this, {
			type: 'PUT',
			success: function(data) {
				$('#notes').html(data.notes);
				$('#ban___delete_pii_row').replaceWith(data.row);
				$('#ban_unban_row').remove();
			}
		});
	});	
	$('.muzzle_control_link').live('click', function(e) {
		e.preventDefault();
		$.adminajaxlink(this, {
			type: 'PUT',
			success: function(data) {
				$('#notes').html(data.notes);
				$('#muzzle_unmuzzle_row').replaceWith(data.row);
				$('#temp_muzzle_unmuzzle_row').replaceWith(data.temp_muzzle_row);
			}
		});
	});	
	$('.city_defend_control_link').live('click', function(e) {
		e.preventDefault();
		$this = $(this);
		$.adminajaxlink(this, {
			type: 'PUT',
			success: function(data) {
				$this.parent().html(data.link);
				$('#notes').html(data.notes);
			}
		});
	});	
	
	$('.simulate_user_link').live('click', function(e) {
      e.preventDefault();
      var $this = $(this);
      $.adminajaxlink(this, {
        type: 'PUT',
		data: {player_id: $('#player_id :selected').val()},
        success: function(data) {
			$('#simulate_row').replaceWith(data.row);
			window.open(data.follow_link);
		}
      });    
	});
		
	$('.unsimulate_user_link').live('click', function(e) {
		e.preventDefault();
		$this = $(this);
		$.adminajaxlink(this, {
			type: 'PUT',
			success: function(data){
				$('#simulate_row').replaceWith(data.row);
			}
		});
	});	

	$('#show_player_protection_add').live('click', function(e) {
		e.preventDefault();
		$this = $(this);
		$('#add_protection').show();
	});	
		
	$('.user_role_select').live('change', function(e) {
		e.preventDefault();
		var $this = $(this);
		var user_id = $("#user_id_row").find("td").html();
		$.adminspinnerajax(this, {
			type: 'POST',
			data: jQuery.makeArray($this),
			url: '/admin/users/' + user_id + '/change_role',
			success: function(data) {
				$('#notes').html(data.notes);
				$('#role_row').replaceWith(data.row);
			}
		});		
	});	

	$('.player_sex_select').live('change', function(e) {
		e.preventDefault();
		var $this = $(this);
		var player_id = $("#player_id_row").find("td").html();
		$.adminspinnerajax(this, {
			type: 'POST',
			data: jQuery.makeArray($this),
			url: '/admin/players/' + player_id + '/change_sex',
			success: function(data) {
				$('#notes').html(data.notes);
				$('#sex_row').replaceWith(data.row);				
			}
		});		
	});	

	$('#add_protection_form').live('submit', function(e) {
		e.preventDefault();
		$.adminajaxsubmit(this, {
			success: function(data) {
                $("#protected").remove();
				$("#protected_until_row").replaceWith(data.row);
				$(".lazy_pane #cities").html(data.cities);
				$('#notes').html(data.notes);
			}
		});
	});

	$('#player_protection_remove_link').live('click', function(e) {
		e.preventDefault();
		if (confirm("This will remove protection from the player and make their cities attackable. Do you want to do this?")) {
			$.adminajaxlink(this, {
				type: 'PUT',
				success: function(data){
                    $("#protected").remove();
					$("#protected_until_row").replaceWith(data.row);
					$(".lazy_pane #cities").html(data.cities);
					$('#notes').html(data.notes);
				}
			});
		}
	});	

}
  
C.views.admin_phrases_index = function(){

	var proto_form = $('form.create_phrase');

  $('form.create_phrase').live('submit',function(e){
    e.preventDefault();
    var _this = $(this);
    $.post(
      _this.attr('action'),
      _this.serialize(),
      function(data){
        _this.find('input:text').val('').focus();
        $('table#phrases').replaceWith(data);
      },
      "html"
    );
  });

  $('form#bulk_create_phrases').live('submit',function(e){
    e.preventDefault();
    var _this = $(this);
    $.post(
      _this.attr('action'),
      _this.serialize(),
      function(data){
        _this.find('textarea').val('').focus();
        $('table#phrases').replaceWith(data);
      },
      "html"
    );
  });
	
}
  
C.views.admin_phrases_show = function() {
    
  var proto_form = $('form.create_phrase');

  $('form.create_phrase').live('submit',function(e){
    e.preventDefault();
    var _this = $(this);
    $.post(
      _this.attr('action'),
      _this.serialize(),
      function(data){
        _this.find('input:text').val('').focus();
        $('table#phrases').replaceWith(data);
      },
      "html"
    );
  });

  $('form#bulk_create_phrases').live('submit',function(e){
    e.preventDefault();
    var _this = $(this);
    $.post(
      _this.attr('action'),
      _this.serialize(),
      function(data){
        _this.find('textarea').val('').focus();
        $('table#phrases').replaceWith(data);
      },
      "html"
    );
  });

  $('table#phrases input.new_child').live('click',function(e){
    var _this = $(this);
    var final_phrase = _this.closest('tr').find('.phrase_name').text() + '.';
    $('form.create_phrase input:text').val( final_phrase ).focus();
  });

  $('table#phrases input.new_sibling').live('click',function(e){
    var _this = $(this);
    var phrase_tokens = _this.closest('tr').find('.phrase_name').text().split(".");
    var last_term = phrase_tokens.pop();    
    if(phrase_tokens.length === 0){
      var final_phrase = last_term+".";
    } else {
      var final_phrase = phrase_tokens.join(".")+".";
    }
    $('form.create_phrase input:text').val( final_phrase ).focus();
  });

  $('span.phrase_name').live('click',function(e){
    e.preventDefault();
    var _this = $(this);
    var list_item = _this.parent();
    var phrase_id = list_item.attr('phrase_id');
    $('form.edit_phrase:visible').remove();
    var form = $('form.edit_phrase').clone()
      .replaceAll(_this)
      .removeClass('hide')
      .find('> input:text')
        .val(_this.text())
        .focus()
        .select()
        .blur(function(){ form.submit(); }).end()
      .submit(function(e){
        e.preventDefault();
        $.post(
          '/admin/phrases/' + phrase_id,
          form.serialize(),
          function(data){
            $('table#phrases').replaceWith(data);
          },
          "html"
        );
      });
  });

  $('tr.phrase a.delete').live('click',function(e){
    e.preventDefault();
    var _this = $(this);
    $.post(
      _this.attr('href'),
      {'_method':'delete'},
      function(data){
        _this.find('input:text').val('').focus();
        $('table#phrases').replaceWith(data);
      },
      "html"
    );
  });

	$('input[value="Cancel"]').live('click', function () {
		$this = $(this);
		$this.parents("tr").prev().find("select").val('');
		$this.parents("tr").remove(); 
	});

	$('#locales_form').live('submit', function(e) {
		e.preventDefault();
		$this = $(this);
		$.adminajaxsubmit(this, {
			success: function(data) {
				$this.parents("tr").prev().find("select").val('');
				$this.parents("tr").remove(); 
			}
		});
	});

	$('.locales_phrase').live('change', function(e) {
		e.preventDefault();
		$this = $(this);
	    var phraseID = $this.siblings('#phrase_id').html();
    	var localeID = this.options[this.selectedIndex].value;
		var locale_name = this.options[this.selectedIndex].text;
		if (localeID != "") {
			$.adminspinnerajax(this, {
				type: 'POST',
				url: '/admin/translations/edit/' + phraseID,
				data: 'locale_id=' + localeID,
				success: function(data){
					//get a clone of the translation editing form container (which will include the form) and change it's name
					var holder = $('#locales_form_container').clone();

					//insert the new form under the phrase
					$this.parents("tr").after(holder);

					//get the editing form and change it's name
					holder.find("#translations_text").val(data.text);			
					holder.find("#locales_form").attr('action', data.url);
					holder.find(".locale_name").html("Locale: " + locale_name);
						
					//show the new container
					holder.show();
		
				}
			});
		};
	});

};

C.views.admin_translations_edit_all = function(){

	$('.edit_translation_form, .new_translation_form').live('submit', function(e) {
		e.preventDefault();
		var $this = $(this);
		$.adminajaxsubmit(this, {
			type: 'POST',
			success: function(data) {
				if(data.form){
					$this.parent().html(data.form);
				}
			}
		});
	});

}


C.views.admin_offensive_words_show = function(){

	$('.remove').live('click', function(e) {
		e.preventDefault();
		$.adminajaxlink(this, {
			type: 'DELETE',
			data: {'word' : this.attributes.value.value, 'word_type': $("#word_type").val()},
			success: function(data) {
				$('#table_container').html(data.table)
			}
		});

	});


	$('.reload').live('click', function(e) {
		e.preventDefault();
		$.adminajaxlink(this, {
			type: 'PUT',
			data: {'word_type': $("#word_type").val()},
			success: function(data) {
				$('#table_container').html(data.table)
			}
		});

	});

	$('#word_manager_form').live('submit', function(e) {
		e.preventDefault();
		var $this = $(this);
		$.adminajaxsubmit(this, {
			success: function(data) {
				$this[0].reset();
				$('#table_container').html(data.table)
			}
		});
	});	

};

C.views.admin_stream_posts_index = function() {

	$('.clone').live('click', function(e) {
		e.preventDefault();
        var stream_post = $(this).parents('tr').find('.stream_post_preview');
        $(['locale','prompt','name','caption','image_url','link']).each(function(){
          if(this !== 'prompt' && stream_post.find('.'+this).text() !== "What's on your mind?") {
            $('#stream_post_'+this).val(stream_post.find('.'+this).text());
          }
        });
        $('#stream_post_link').focus();
	});
	
};

C.views.admin_facebook_requests_index = function() {

	$('.clone').live('click', function(e) {
		e.preventDefault();
        var facebook_request = $(this).parents('tr').find('.facebook_request_preview');
        $(['locale','subject_type','subject_id','action_text','content','button_text']).each(function(){
          if(this !== 'prompt' && facebook_request.find('.'+this).text() !== "What's on your mind?") {
            $('#facebook_request_'+this).val(facebook_request.find('.'+this).text());
          }
        });
        $('#facebook_request_button_text').focus();
	});
	
};

C.views.admin_alliances_show = function() {
		
				
}

C.views.admin_viral_experiments_index = function() {

	var update_candidates = function() {
		var candidates_path = window.location + '/candidates';
		var locale = $('#viral_experiment_locale').val();
		var subject_active = $('#viral_experiment_subject_active:checked');
		var subject_type, subject_id;
		
		if(subject_active.length > 0) {
			subject_type = $('#viral_experiment_subject_type').val();
		  	if(subject_type) {
		    	subject_id = $('.viral_experiment_subject_id:enabled').val();
		  	}
		}
		$.get(
		  candidates_path,
		  {
			'locale':locale,
		    'subject_type':subject_type,
		    'subject_id':subject_id
		  },
		  function(data){
		    $('#candidates').html(data);
		  }
		);
	};
	
	$('#new_viral_experiment :input').change( function(e){
		update_candidates();
	});
	
	$('#candidates tr').live('click',function(e){
		var _this = $(this);
		var checkbox = $(':checkbox',_this);
		var checked = checkbox.attr('checked');
		var mark_selected = true;
		
		if($(e.target).attr('type') === 'checkbox') {
			mark_selected = !!checked;
		} else {
		  	e.preventDefault();
		  	mark_selected = !checked;
		}
		if( mark_selected ){
		  	_this.addClass('selected');
		  checkbox.attr('checked','checked');
		} else {
		  	_this.removeClass('selected');
		  	checkbox.removeAttr('checked');
		}
	});
	
	update_candidates();
	
};

C.views.admin_alliances_show = function(){

	$('.lazy_pane_link').live('click', function(e) {
		e.preventDefault();
		var $this = $(this);
		if ($this.data('loaded')) { 
			$this.siblings('.pane').toggle(); 
		} else {
			$.adminajaxlink(this, {
				type: 'GET',
				success: function(data) {
					for (var id in data) {
						if (data.hasOwnProperty(id)) {
							var $container = $('#' + id);
							if ($container.length > 0) {						
								$container.html(data[id]);
							}
						}
					}
					$this.siblings('.pane').show();
					$this.data('loaded', true);
				}
			});			
		}
	});

	$('.alliance_wall_delete_link, .alliance_report_delete_link').live('click', function(e) {
		e.preventDefault();
		var $this = $(this);
		$.adminajaxlink(this, {
			type: 'DELETE',
			success: function(data) {
				processCommonData(data)
			}
		});			
	});	
	
	//Used in many cases to update the page with player, note and lazy_pane information
	var processCommonData = function(data) {	
		$('#notes').html(data.notes);
		if (data.hasOwnProperty('panes')) {
	      panes = $('#lazy_panes');
		  for (var field in data.panes){
			var container = panes.find('#' + field)
			if (container.length > 0) {						
				container.html(data.panes[field]);
			}
	      }
	    }	
		if (data.hasOwnProperty('player')) {
	      player_stats = $('#player_stats');
		  for (var field in data.player){
		  	player_stats.find('#' + field + '_row td').html(data.player[field]);
	      }
	    }			
	}

	$('.alliance_remove_link').live('click', function (e) {
		e.preventDefault();
		$.adminajaxlink(this, {
			type: 'PUT',
			success: function(data) {
				var cell = $('#members_table').find('td:contains("' + data.fbid + '")');
				cell.parent().remove();
				
				if($('#members_table tr').length <= 1){
					$('#members_table').hide();
					$('#no_members_warning').show();					
				}
				
			}
		});
	});

	var show_members_table = function(data) {
		if($('#members_table').is(':visible') == false) {
			$('#members_table').show();
			$('#no_members_warning').hide();
		}	
		$('#members_table > tbody:last').append(data.new_row);		
	}

	$('.alliance_move_link').live('click', function (e) {
		e.preventDefault();
		if(confirm("This player is already a member of an alliance. This will remove them from their current alliance and add them to this one. Do you want to do that?")){
			$.adminajaxlink(this, {
				type: 'PUT',
				success: function(data) {
					show_members_table(data);
				}
			});			
		}
	});

	$('.alliance_add_link').live('click', function (e) {
		e.preventDefault();
		$.adminajaxlink(this, {
			type: 'PUT',
			success: function(data) {
				show_members_table(data);
			}
		});			
	});
	
	$('#add_members_form').live('submit', function(e) {
		e.preventDefault();
		var $this = $(this);
		$.adminajaxsubmit(this, {
			type: 'PUT',
			success: function(data) {
				$('#players_list_container').html(data.players_list)
			}
		});
	});

	var send_change = function(e, $this, change_type) {
		e.preventDefault();
		var change_value = $this.val();
		var member_id = $this.parent().parent().find("input#membership_id").val();
		var alliance_id = $('#alliance_id').html();
		var realm_id = $('#alliance_realm_id').html();
		$.adminspinnerajax(this, {
			type: 'PUT',
			url: '/admin/alliances/' + alliance_id + '/' + change_type + '/' + member_id + '/' + change_value + "?realm_id=" + realm_id,
			success: function(data) {
        window.location.reload();
			}
		});				
	}
	
	$('.alliance_role_select').live('change', function(e) {
		send_change(e, $(this), 'change_role');
	});	

	$('.alliance_approval_select').live('change', function(e) {
		send_change(e, $(this), 'change_approval');
	});

}

// Loading Rotator
C.views.admin_loading_rotators_index = function() {
	$(".active_rotator").live('click', function(e) {
		e.preventDefault();
		$.adminajaxlink(this, {
			type: 'PUT',
			data: {'rotator[active]' : 1},
			success: function(data) {
        window.location.reload();
			}
		});
	})


	$(".inactive_rotator").live('click', function(e) {
		e.preventDefault();
		$.adminajaxlink(this, {
			type: 'PUT',
			data: {'rotator[active]' : 0},
			success: function(data) {
        window.location.reload();
			}
		});
	})

	$('.delete_rotator').live('click', function(e) {
		e.preventDefault();
		if (confirm("Are you sure to delete the loading rotator?")) {
			$.adminajaxlink(this, {
				type: 'delete',
				success: function(data) {
					if(data.url != null) {
            window.location.href = data.url;
					} else {
            window.location.reload();
					}
				}
			});
		}
	});

}


C.views.admin_loading_rotators_new = function() {
	$('#rotator_form').live('submit', function(e) {
		e.preventDefault();
		$.adminajaxlink(this, {
			type: 'POST',
			url: $('#rotator_form')[0].action,
			data: $('#rotator_form').serializeArray(),
			success: function(data) {
				if(data.url != null) {
          window.location.href = data.url;
				} else {
          window.location.reload();
				}
			}
		});
	});
}

C.views.admin_loading_rotators_edit = function() {
	$('#rotator_form').live('submit', function(e) {
		e.preventDefault();
		$.adminajaxlink(this, {
			type: 'PUT',
			url: $('#rotator_form')[0].action,
			data: $('#rotator_form').serializeArray(),
			success: function(data) {
				if(data.url != null) {
          window.location.href = data.url;
				} else {
          window.location.reload();
				}
			}
		});
	});
}

function remove_nested(link){
    $(link).parents(".prize").find("input[type=hidden]")[0].value = "1" ;
    $(link).parents(".prize").hide();
}

function acts_as_datetime(obj){
    var opt = {
      showSecond: true,
      timeFormat: 'hh:mm:ss',
      dateFormat: 'yy-mm-dd'
    };

    obj.datetimepicker(opt);
}

function save_sort(url, prefix, context){
    var ids = new Array();
    ids.push({name : 'context', value : context});
    $("#"+prefix+"s_sortable tbody tr").
        each(function(i){
                 var id = $(this).attr(prefix + "_id");
                 var obj = {name : prefix + "_ids[]", value : id};
                 ids.push(obj);
                 
             });
    var params = $.param(ids);
    $.post(url, params, function(data, textStatus){
               if(data["result"] == "ok"){
                   alert("Save Success");
               }else{
                   alert("Save Failed");
               }
           });
}

function save_tags(url){
    var item_tags = new Array();
    $('[type=checkbox]').each(function(i,item){
                                  var obj = {"name" : item.value , "value" : item.checked};
                                  item_tags.push(obj);
                              });
    var params = $.param({"item_tags" : item_tags});
    $.post(url, params, function(data, textStatus){
               if(data["result"] == "ok"){
                   alert("Save Success");
               }else{
                   alert("Save Failed");
               }
           });    
}

function save_price(item_id, rubies){
    var url = '/admin/store_items/save_price/' + item_id + '/' + rubies;
    $.post(url, function(data){
      alert(data.result);
    });
}

function bind_save_price(){
  $('.save_price').click(function(){
    var item_id = $(this).parent('td').parent('tr').attr('item_id');
    var rubies = $(this).parent('td').prev('td').children('input').val();
    if(!rubies){
      alert("Please input the rubies count!");
      return false;
    }
    save_price(item_id, rubies);
    return false;
  });
}

$(document).ready(function(){
  bind_save_price();
  acts_as_datetime($('.datetime_picker'));
});
