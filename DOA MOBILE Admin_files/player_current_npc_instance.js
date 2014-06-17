(function(){
  function registerSaveEvent(){
    $("body").on("submit", "#player_npc_instance_form", function(e){
      e.preventDefault();

      var $target = $(e.target),
          url = $target.closest(".lazy_pane").find(".lazy_pane_link").attr("href"),
          oldCurrentNpcInstanceId = $target.attr("data-current-npc-instance-id");

      $.ajax({
        url: url,
        type: "PUT",
        data: $target.serialize(),
        success: function(msg){
          $target.closest(".lazy_pane").find(".reloader").click();
          top.toastr.success('Update successfully!');
        },
        error: function(){
          top.toastr.error('Update failure!');
        }
      });
    });
  }

  $(function(){
    registerSaveEvent();
  });
})();
