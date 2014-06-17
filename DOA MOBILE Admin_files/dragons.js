$(function(){
  $("body").on("click", "button.update-dragon-name", function(e){
    e.preventDefault();

    var $btn = $(e.target),
        $tr = $btn.closest("tr"),
        cityId = $tr.attr("data-city-id"),
        $input = $tr.find("input[name=name]"),
        dragonName = $input.val(),
        dragonName = $.trim(dragonName),
        url = $("#admin_player_dragons_path").val();

    if(_.isEmpty(dragonName)){
      top.toastr.error("The dragon name could not be blank");
    }

    $.ajax({
      url: url ,
      type: "PUT",
      data: { city_id: cityId, name: dragonName },
      success: function(){
        $btn.closest(".lazy_pane").find(".reloader").click();
        top.toastr.success('update successfully!');
      }
    });
  });
});
