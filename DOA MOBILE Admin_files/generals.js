(function(){
  function registerUpdateEvent(){
    $("body").on("click", ".edit_general button.update", function(e){
      e.preventDefault();

      var $target = $(e.target),
          $tr = $target.closest("tr");

      var first_name = $tr.find("input[name='general[first_name]']").val();
      var victories = $tr.find("input[name='general[victories]']").val();
      var general = {
        first_name: first_name,
        victories: victories
      };

      $.ajax({
        url: $tr.data("url"),
        type: 'PUT',
        data: { general: general },
        success: function(msg){
          $target.closest('.lazy_pane').find('.reloader').click();
          top.toastr.success('Update successfully!');
        },
        error: function(res){
          var errors = _.values(JSON.parse(res.responseText));
          top.toastr.error(errors[0][0]);
        }
      });
    });
  }

  function registerLevelChangeEvent(){
    $("body").on("change", ".edit_general select[name='general[level]']", function(e){
      e.preventDefault();

      var $target = $(e.target),
          $tr = $target.closest("tr"),
          $victories = $tr.find("input[name='general[victories]']");

      var selectedVictories = $target.find("option:selected").data('victories');
      $victories.val(selectedVictories);
    });
  }

  $(function(){
    registerUpdateEvent();
    registerLevelChangeEvent();
  });
})();
