(function(){
  function registerUpdateEvent(){
    $("body").on("click", ".edit_city button.update", function(e){
      e.preventDefault();

      var $target = $(e.target),
          $tr = $target.closest("tr");

      var city_name = $tr.find("input[name='capital[name]']").val();
      var city = { name: city_name };

      $.ajax({
        url: $tr.data("url"),
        type: "PUT",
        data: { city: city },
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
    registerUpdateEvent();
  });
})();
