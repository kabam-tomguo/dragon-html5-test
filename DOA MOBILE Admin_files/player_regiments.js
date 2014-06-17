(function(){
  function registerMoreEvent(){
    $("body").on("click", "table.player-regiments .btn.btn-more", function(e){
      e.preventDefault();

      var $btn = $(e.target);

      $btn.find("i").toggleClass("icon-minus-sign icon-plus-sign");

      $btn.closest("tr")
        .next("tr.units").toggleClass("hide")
        .next("tr.jobs").toggleClass("hide");
    });
  }

  function registerDestroyEvent(){
    $("body").on("click", "table.player-regiments .btn.btn-destroy", function(e){
      e.preventDefault();

      var c = confirm("Are you sure to DESTROY?");

      if(!c){
        return;
      }

      var $target = $(e.target);
      var marchId = $target.closest("tr").data("id");

      $.ajax({
        url: $("#admin_player_regiments_path").val() + "/" + marchId,
        type: "DELETE",
        success: function(){
          $target.closest('.lazy_pane').find('.reloader').click();
          top.toastr.success('Destroy successfully!');
        },
        error: function(){
          $target.closest('.lazy_pane').find('.reloader').click();
          top.toastr.error('Destroy failure!');
        }
      });
    });
  }

  $(function(){
    registerMoreEvent();
    registerDestroyEvent();
  });
})();
