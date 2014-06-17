(function(){
  function registerRedisDataLink(){
    $("body").on("click", "a.redis_data_link", function(e){
      e.preventDefault();

      var $target = $(e.target);
      var url = $target.attr("href");

      top.$("#tabs").tabs("add", url, "Redis Data");
    });
  }

  $(function(){
    registerRedisDataLink();
  });
})();
