(function(){
  function registerSelectAllEvent(){
    $("body").on("click", "input[name=quest_name_select_all]", function(e){
      var $selectAll = $(e.target)
          checked = $selectAll.prop("checked");
      var $allCheckboxes = $selectAll.closest("table").find("tbody td input[name=quest_name]");

      $allCheckboxes.prop("checked", checked);
    });
  }

  function registerCompleteEvent(){
    $("body").on("click", "button.let_quest_completed", function(e){
      var $target = $(e.target),
          quest_names = [];

      $("#quests").find("tbody td input[name=quest_name]:checked").each(function(){
        quest_names.push($(this).val());
      });

      if(quest_names.length === 0){
        alert("Please select at least one quest.");
        return;
      }

      $.ajax({
        url: $target.data("url"),
        type: 'PUT',
        data: { quest_names: quest_names },
        success: function(msg){
          $target.closest('.lazy_pane').find('.reloader').click();
          top.toastr.success('Update successfully!');
        },
        error: function(){
          top.toastr.error('Update failure!');
        }
      });
    });
  }

  $(function(){
    registerSelectAllEvent();
    registerCompleteEvent();
  });
})();
