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
var fireball_list = [];
var heal_list = [];
var battleSplit = 100;


var TO_RADIANS = Math.PI/180; 
function drawRotatedImage(image, x, y, angle) { 
	// save the current co-ordinate system 
	// before we screw with it
	ctx.save(); 
	// move to the middle of where we want to draw our image
	ctx.translate(x, y);
	// rotate around that point, converting our 
	// angle from degrees to radians 
	ctx.rotate(angle * TO_RADIANS);
	// draw it up and to the left by half the width
	// and height of the image 
	ctx.drawImage(image, -(image.width/2), -(image.height/2));
	// and restore the co-ords to how they were when we began
	ctx.restore(); 
}
// -------------------------------------------------------------
function Heal(x,y,healing)
{
	this.x = x
	this.y = y
	this.alive = true;
	this.healing = healing;
}
Heal.prototype = {
	show:function(){
		ctx.drawImage(Heal.image, this.x, this.y,25,25);
		ctx.font = "30px Arial";
		ctx.fillStyle = 'green';
		ctx.fillText(this.healing,this.x,this.y);
	}
}
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
	this.power = 1
	this.life = life
	this.direction = (slot >5)?6:2
	this.origin_dir = this.direction
	this.slot = slot
	this.max_life = max_life
	this.level = level

	this.buffs = []//[0,1]
}

Dragon.find_pos_by_slot = function(slot)
{

		var dest_x =  Dragon.start_x + parseInt(slot % 3 ) * (dragonW  + 30)  
		var dest_y =  Dragon.start_y + parseInt(slot / 3) * (dragonH  + 30)  
		return {x:dest_x,y:dest_y};
}

function play_towards_animation(src,dst,damage)
{
		var times = 10;
		var delta_x = (dst.x - src.x) /times;
		var delta_y = (dst.y - src.y) /times;

		var rotate;

		if(delta_x == 0)
			rotate = 0
		else	
			rotate = delta_y / delta_x  / TO_RADIANS;

		src.rotate = rotate;

		var timer = setInterval(function(){
			src.x += delta_x
			src.y += delta_y

			times--;

			if(times == 0)
			{
				clearInterval(timer);	

				renderTexts.push(["30px Arial","#ff0033",damage,dst.x,dst.y  + battleSplit] )

				setTimeout(function(){
					renderTexts.pop();
				},1000);


				setTimeout(function(){
					src.alive =false;

				},100);
				
			}
		}, 50); // loo

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

		var ratio = 0;
		//render life
		ctx.strokeStyle = "white"
		ctx.strokeRect(dragon.x - dragon.w/2,dragon.y - dragon.h/2,dragon.w,3);
		ctx.fillStyle = "rgb(255, 0,0)";
		ratio = dragon.life/dragon.max_life
		ctx.fillRect(dragon.x - dragon.w/2,dragon.y - dragon.h/2,dragon.w*ratio,3);

		//render power
		ctx.strokeStyle = "white"
		ctx.strokeRect(dragon.x - dragon.w/2,dragon.y - dragon.h/2 + 6,dragon.w,3);
		ctx.fillStyle = "rgb(0,255,0)";
		ratio = dragon.power/3
		ctx.fillRect(dragon.x - dragon.w/2,dragon.y - dragon.h/2 + 6,dragon.w * ratio,3);



	},
	reset:function()
	{

		this.direction = this.origin_dir;
		this.x = this.origin_x;
		this.y = this.origin_y;
	},
	get_heal:function(healing)
	{

		var heal_obj = new Heal(this.x + this.w/2,this.y-+ this.h/2,healing);
		heal_list.push(heal_obj);
		setTimeout(function(){
			heal_obj.alive = false
		},800);
	},
	play_magic:function(callback,args)
	{
		var changes_up = [3,2,1,2]
		var changes_down = [5,6,7,5]
		var index = 0
		var dragon = this;

		var timer = setInterval(function(){
			if(dragon.origin_dir == 2)
				dragon.direction = changes_up[index];
			else
				dragon.direction = changes_down[index];

			index++;
			if(index > changes_up.length)
			{
				clearInterval(timer);
				dragon.reset();
				if(callback != undefined)
					callback(args);
			}
		},200);

	},
	fire_magic:function(targets) //[slot,damage]
	{

		for(var i in targets)
		{
			var target = targets[i];

			var dst =  Dragon.find_pos_by_slot( target[0]);

			var fire = new Fire(this.x,this.y,0)

			fireball_list.push(fire);
			play_towards_animation( fire,{x:dst.x,y:dst.y},target[1]);

		}



	},
	attack:function(slot,damage)
	{


		var dst =Dragon.find_pos_by_slot(slot);
		var dest_x =dst.x;
		var dest_y = dst.y;

		var times = 10;
		var delta_x = (dest_x - this.x) /times;
		var delta_y = (dest_y - this.y) /times;
		var dragon = this;

		if(dragon.direction == 2) // down
		{
			if(delta_x < 0)
				dragon.direction = 3;
			else if(delta_x > 0)
				dragon.direction = 1;

		}
		else
		{
			if(delta_x < 0)
				dragon.direction = 5;
			else if(delta_x > 0)
				dragon.direction = 7;
		}

		var timer = setInterval(function(){
			dragon.x += delta_x
			dragon.y += delta_y

			times--;

			if(times == 0)
			{
				clearInterval(timer);	

				renderTexts.push(["30px Arial","#ff0033",damage,dest_x,dest_y  + battleSplit] )

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




function Fire(x,y,rotate)
{

	this.x = x;
	this.y = y;
	this.rotate = rotate;
	this.alive = 1;
}

Fire.prototype = {
	show:function(ctx)
	{
		drawRotatedImage(Fire.image,this.x,this.y,this.rotate);
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

	 for(var i in fireball_list)
    {
    	fireball = fireball_list[i];
    	if(fireball.alive)
   			fireball.show(ctx);
   	}


	 for(var i in heal_list)
    {
    	heal = heal_list[i];
    	if(heal.alive)
   			heal.show(ctx);
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



    var healImage = new Image();
    healImage.src = "images/heal.jpg";
    healImage.onload = function(){}
    Heal.image = healImage;


    var fireImage = new Image();
    fireImage.src = 'images/fireball.png'
    fireImage.onload = function(){}

    Fire.image = fireImage;

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

    setInterval(drawScene, 50); // loop drawScene
});