// inner variables
var canvas, ctx;
var backgroundImage;
var iBgShiftX = 100;
var dragonW = 75; // dragon width
var dragonH = 70; // dragon height
var iSprPos = 0; // initial sprite frame
var iSprDir = 4; // initial dragon direction
var dragonSound; // dragon sound
var wingsSound; // wings sound
var bMouseDown = false; // mouse down state
var iLastMouseX = 0;
var iLastMouseY = 0;
var dragons_list = [];
var currRound = 0;
var battleNotes = "Round 1 start";
var renderTexts = [];
var battleSplit = 100;
// -------------------------------------------------------------

function Dragon( slot, type, life, max_life, level)
{
	this.x =  Dragon.start_x + parseInt(slot % 3 ) * (dragonW  + 30)  
	this.y =  Dragon.start_y + parseInt(slot / 3) * (dragonH  + 30)  

	this.origin_x = this.x;
	this.origin_y = this.y;
	if(slot >5)
		this.y += battleSplit

	this.w = 75
	this.h = 70
	this.life = life
	this.direction = (slot >5)?6:2
	this.slot = slot
	this.max_life = max_life
	this.level = level

	this.buffs = []//[0,1]
}

Dragon.start_x = 400;
Dragon.start_y = 100;


Dragon.prototype = {
	show:function(ctx,iSprPos)
	{
		dragon = this
		ctx.font = "12px Arial";
		ctx.fillStyle = 'white';
		ctx.fillText("slot "+ dragon.slot,dragon.x-dragon.w/2 + 8,dragon.y-dragon.h/2- 10);

		ctx.drawImage(Dragon.image, iSprPos*dragon.w, dragon.direction *dragon.h, dragon.w, dragon.h, dragon.x - dragon.w/2, dragon.y - dragon.h/2, dragon.w, dragon.h);
	


		//render buffer

		// Red rectangle
		var colors = ["red","blue"]
		for(var i in dragon.buffs)
		{	
			var type = dragon.buffs[i];
			ctx.beginPath();
			ctx.lineWidth="2";
			ctx.strokeStyle= colors[type];
			type *= 3
			ctx.rect(dragon.x-dragon.w/2-type,dragon.y-dragon.h/2-type,dragon.w + 2*type, dragon.h + 2*type ); 
			ctx.stroke();
		}
	},
	reset:function()
	{

		this.x = this.origin_x;
		this.y = this.origin_y;
	}
	,attack:function(slot,damage)
	{

		var dest_x =  Dragon.start_x + parseInt(slot % 3 ) * (dragonW  + 30)  
		var dest_y =  Dragon.start_y + parseInt(slot / 3) * (dragonH  + 30)  

		var times = 10;
		var delta_x = (dest_x - this.x) /times;
		var delta_y = (dest_y - this.y) /times;
		var dragon = this;

		var timer = setInterval(function(){
			dragon.x += delta_x
			dragon.y += delta_y
			times--;

			if(times == 0)
			{
				clearInterval(timer);	

				renderTexts.push(["24px Arial","red",damage,dest_x,dest_y  + battleSplit] )

				setTimeout(function(){
					renderTexts.pop();
				},1000);


				setTimeout(function(){
					dragon.reset();
				},100);
				
			}
		}, 50); // loo


	}
}

// draw functions :
function clear() { // clear canvas function
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
}

function drawScene() { // main drawScene function
    clear(); // clear canvas

    // draw background
   // iBgShiftX -= 4;
    if (iBgShiftX <= 0) {
        iBgShiftX = 1045;
    }
    ctx.drawImage(backgroundImage, 0 + iBgShiftX, 0, 1000, 940, 0, 0, 1000, 600);

    // update sprite positions
    iSprPos++;
    if (iSprPos >= 9) {
        iSprPos = 0;
    }


    for(var i in dragons_list)
    {
    	dragon = dragons_list[i];
   		dragon.show(ctx,iSprPos)
   	}

   	//draw battleNotes
	ctx.font = "16px Arial";
	ctx.fillStyle = 'white';

	ctx.fillText("Round:"+ currRound,50,30);
	ctx.fillText(battleNotes,50,50);


	//draw render texts
	for(var i in renderTexts)
	{
		text_array = renderTexts[i];
		ctx.font = text_array[0];
		ctx.fillStyle = text_array[1];
		ctx.fillText(text_array[2],text_array[3],text_array[4]);

	}

}

// -------------------------------------------------------------

// initialization
$(function(){
    canvas = document.getElementById('scene');
    ctx = canvas.getContext('2d');

    var width = canvas.width;
    var height = canvas.height;

    // load background image
    backgroundImage = new Image();
    backgroundImage.src = 'images/hell.jpg';
    backgroundImage.onload = function() {
    }
    backgroundImage.onerror = function() {
        console.log('Error loading the background image.');
    }

  

    // initialization of dragon
    var oDragonImage = new Image();
    oDragonImage.src = 'images/dragon.gif';
    oDragonImage.onload = function() {
    }

    Dragon.image = oDragonImage;

    dragon = new Dragon( 3, 1, 1000, 1000, 5)
    dragons_list.push(dragon);

    dragon = new Dragon( 0, 1, 1000, 1000, 5)
    dragons_list.push(dragon);

    dragon = new Dragon( 4, 1, 1000, 1000, 5)
    dragons_list.push(dragon);


    dragon = new Dragon( 7, 1, 1000, 1000, 5)
    dragons_list.push(dragon);

    dragon = new Dragon( 8, 1, 1000, 1000, 5)
    dragons_list.push(dragon);

    dragon = new Dragon( 10, 1, 1000, 1000, 5)
    dragons_list.push(dragon);

    setInterval(drawScene, 30); // loop drawScene
});