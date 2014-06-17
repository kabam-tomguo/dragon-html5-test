function updateTabTitle(tabId, title){
  $("#tabs li.ui-tabs-active[aria-controls=" + tabId + "]").find("a.ui-tabs-anchor").text(title);
}

function getParentIframe(selfWindow){
  return _.find(selfWindow.parent.$("iframe"), function(el){
    return el.contentWindow == selfWindow;
  });
}

function printSystemTime(){
  // var time = $("#system_time").val() * 1000;
  var time = new Date();

  var format = "YYYY-MM-DD HH:mm:ss";
  $("#china_time").text(moment(time).tz('Asia/Shanghai').format(format) + " (CN)");
  $("#us_time").text(moment(time).tz('America/Vancouver').format(format) + " (US)");
  $("#utc_time").text(moment(time).utc().format(format) + " (UTC)");

  // $("#system_time").val(parseInt($("#system_time").val()) + 1);
  setTimeout('printSystemTime()', 1000);
}

function open_new_tab(link_url, tab_name){
  parent.$("#tabs").tabs("add", link_url, tab_name);
};

$(document).ready(function(){
  $(".freeze_table_header").fixedtableheader();
  printSystemTime();


  $("#rubies_purchase_pane").click(function () {
    if($("#rubyies_form_and_list").is(":hidden")){
      $("#rubyies_form_and_list").show();
    }else{
      $("#rubyies_form_and_list").hide();
    }
  });

  $("#close_ruby_purchase").click(function () {
    $("#rubyies_form_and_list").hide();
  });

});

