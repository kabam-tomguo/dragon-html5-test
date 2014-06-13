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
var dragons_list = [];
var dragons_list_map ={}
var currRound = 1;
var battleNotes = "Round 1 start";
var renderTexts = [];
var fireball_list = [];
var heal_list = [];

var Config = {
	DragonMargin: 30,
	TeamMargin:100,
	StartX:400,
	StartY:100,
}


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
	var xy = Dragon.find_pos_by_slot(slot)
	this.x =  xy.x
	this.y =  xy.y 
	
	if(slot >5)
		this.y += Config.TeamMargin

	this.origin_x = this.x;
	this.origin_y = this.y;


	this.w = 75
	this.h = 70
	this.power = 0
	this.type = type
	this.life = life
	this.direction = (slot >5)?6:2
	this.origin_dir = this.direction
	this.slot = slot
	this.max_life = max_life
	this.level = level
	this.buffs = {}//[0,1]
}

Dragon.find_pos_by_slot = function(slot)
{

		var dest_x =  Config.StartX + parseInt(slot % 3 ) * (dragonW  + Config.DragonMargin)  
		var dest_y =  Config.StartY + parseInt(slot / 3) * (dragonH  + Config.DragonMargin)  
		return {x:dest_x,y:dest_y};
}

Dragon.types_string = ["Greate","Fire","Earth","Water","Night"]


Dragon.prototype = {
	show:function(ctx,iSprPos)
	{
		var dragon = this;

		//if life is zero
		if(this.life == 0)
		{
			iSprPos = 0
		}

		//render name
		ctx.font = "12px Arial";
		ctx.fillStyle = 'white';

		ctx.fillText(Dragon.types_string[dragon.type],dragon.x + 10 ,dragon.y - 23);
	

		ctx.font = "12px Arial";
		ctx.fillStyle = 'white';
		ctx.fillText("slot "+ dragon.slot,dragon.x-dragon.w/2 + 8,dragon.y-dragon.h/2- 20);
		ctx.drawImage(Dragon.image, iSprPos*dragon.w, dragon.direction *dragon.h, dragon.w, dragon.h, dragon.x - dragon.w/2, dragon.y - dragon.h/2, dragon.w, dragon.h);
	

		if(this.life == 0)
		{
			ctx.beginPath()
			ctx.lineWidth = 2
			ctx.strokeStyle = "black"
			ctx.moveTo(dragon.x - dragon.w/2,dragon.y-dragon.h/2)
			ctx.lineTo(dragon.x + dragon.w/2,dragon.y+dragon.h/2)
			ctx.stroke();
			ctx.moveTo(dragon.x + dragon.w/2,dragon.y-dragon.h/2)
			ctx.lineTo(dragon.x - dragon.w/2,dragon.y+dragon.h/2)
			ctx.stroke();
			ctx.closePath();

		}


		//render buffer

		// Red rectangle
		var colors = ["red","blue"]
		for(var i in dragon.buffs)
		{	
			var type = i;
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
		ctx.strokeRect(dragon.x - dragon.w/2,dragon.y - dragon.h/2 - 16,dragon.w,3);
		ctx.fillStyle = "rgb(255, 0,0)";
		ratio = dragon.life/dragon.max_life
		ctx.fillRect(dragon.x - dragon.w/2,dragon.y - dragon.h/2 - 16,dragon.w*ratio,3);

		//render power
		ctx.strokeStyle = "white"
		ctx.strokeRect(dragon.x - dragon.w/2,dragon.y - dragon.h/2 - 10,dragon.w,3);
		ctx.fillStyle = "rgb(0,255,0)";
		ratio = dragon.power/3
		ctx.fillRect(dragon.x - dragon.w/2,dragon.y - dragon.h/2 - 10,dragon.w * ratio,3);

	},
	
	update_status:function(after_attack_list)
	{
		var dragon = this;
		for(var i in after_attack_list)
		{
			var status = after_attack_list[i]
			if( status.target == dragon.slot )
			{

				if(status.type == 2 ) //power
					dragon.power = status.args;
				else if(status.type == 0) //buffer
				{
					if(status.status == 0) //add
					{
						dragon.buffs[status.args] = 1
					}
					else if(status.status == 1)//delete
					{
						delete dragon.buffs[status.args]
						//show rebound damage
						if(status.args == 0)
						{
							var rebound_turn = round_list[currRound-1].turn_list[current_turn].rebound_turn;
							dragons_list_map[rebound_turn.target].take_rebound_damage(rebound_turn.numerica);
						}
					}

				}

			}

		}

	},
	reset:function()
	{

		this.direction = this.origin_dir;
		this.x = this.origin_x;
		this.y = this.origin_y;
	},
	get_heal:function(target,callback)
	{
		var dragon = this;
		var heal_obj = new Heal(this.x + this.w/2,this.y-+ this.h/2,"+" + target.numerica);
		heal_list.push(heal_obj);
		setTimeout(function(){
			heal_obj.alive = false
			dragon.life += target.numerica;
			dragon.update_status(target.after_attack_list)

			if(dragon.life > dragon.max_life)
				dragon.life = dragon.max_life;
			if(callback)
				callback();

		},800);
	},

	take_damage:function(damage,callback)
	{
		var dragon = this;
		renderTexts.push(["30px Arial","#00ff33","-" + damage,this.x,this.y])

		setTimeout(function(){
			renderTexts.pop();
			dragon.life -= damage;
			if(dragon.life < 0)
				dragon.life = 0;
			if(callback)
				callback();
		},500);

	},
	take_rebound_damage:function(damage,callback)
	{
		this.reset();
		var dragon = this;
		renderTexts.push(["30px Arial","#00af33","Rebound:-" + damage,this.x,this.y - 10])

		setTimeout(function(){
			renderTexts.pop();
			dragon.life -= damage;
			if(dragon.life < 0)
				dragon.life = 0;
			if(callback)
				callback();
		},500);
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
	add_buff:function(callback,after_attack_list)
	{
		var dragon = this;
		dragon.play_magic(function(){
			dragon.update_status(after_attack_list);
			if(callback != undefined)
				callback();
		});

	},
	fire_magic:function(targets,callback) //[slot,damage]
	{

		for(var i in targets)
		{
			var target = targets[i];
			var fire = new Fire(this.x,this.y,0)
			fireball_list.push(fire);
			target_dragon = dragons_list_map[target.target]
			if(i == (targets.length - 1) )
				Fire.play_towards_animation( fire,target_dragon,target,callback);
			else
				Fire.play_towards_animation( fire,target_dragon,target);
		}
	},
	heal:function(targets,after_attack_list,callback)
	{
		var dragon = this;
		var callback_func = function(){
			dragon.update_status(after_attack_list)
			if(callback != undefined)
				callback();
		}	

		dragon.play_magic(function(){
			for(var i in targets)
			{
				var target = targets[i];
				target_dragon = dragons_list_map[target.target]
				if(i == (targets.length - 1) )
				{
					target_dragon.get_heal(target,callback_func);
				}
				else
				{
					target_dragon.get_heal(target);
				}
			}
		});
	},
	attack:function(type,targets,status_list,callback)
	{
		var dragon = this;
		var normal_attack_func = function(target){
			var dst = Dragon.find_pos_by_slot(target.target);
			var target_dragon = dragons_list_map[target.target];
			var dest_x =dst.x;
			var dest_y = dst.y;

			var times = 10;
			var delta_x = (dest_x - dragon.x) /times;
			var delta_y = (dest_y - dragon.y) /times;

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
					target_dragon.take_damage(target.numerica,function(){
						target_dragon.update_status(target.after_attack_list)
						dragon.reset();
						dragon.update_status(status_list);
						if(callback)
							callback();
					})
				}
			}, 50); // loo

		}

		var magic_attack_func = function(targets){

			dragon.play_magic(function(){
				dragon.fire_magic(targets,callback);
			})

		}

		if(type == 0)
				normal_attack_func(targets[0]);
		else{
			magic_attack_func(targets);
		}


	}
}




function Fire(x,y,rotate)
{

	this.x = x;
	this.y = y;
	this.rotate = rotate;
	this.alive = 1;
}


Fire.play_towards_animation = function(src,target_dragon,target,callback)
{
		var dst =  Dragon.find_pos_by_slot(target_dragon.slot);

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
				setTimeout(function(){
					src.alive =false;
					target_dragon.take_damage(target.numerica,function(){
						target_dragon.update_status(target.after_attack_list);
						if(callback)
							callback();
					})
				},100);
				
			}
		}, 50); // loo

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

function InitDragons()
{
	for(var i in battlerecord.replay_log.dragon_list)
	{
		var obj = battlerecord.replay_log.dragon_list[i];
		dragon = new Dragon( obj.slot, obj.type, obj.life, obj.life, obj.life.level)
    	dragons_list.push(dragon);
    	dragons_list_map[dragon.slot] = dragon

	}

}

var round_list ;
var current_turn = 0;
function PlayTurn()
{
	var turn = round_list[currRound-1].turn_list[current_turn];

	var after_animation = function(){
		//handle after_attack_list
		//after_attack_list
		current_turn++;
		if(current_turn >= round_list[currRound-1].turn_list.length )
		{
			PlayRound()
		}
		else{
			PlayTurn();
		}
	}

	var targets = turn.defend_list;
	var after_attack_list = turn.after_attack_list;
	switch(turn.type)
	{
		case 0: //normal attack
			dragons_list_map[turn.source].attack(turn.type,targets,after_attack_list,after_animation);
			break;
		case 1: //TYPE_ATTACK_MAGIC
			dragons_list_map[turn.source].attack(turn.type,targets,after_attack_list,after_animation);
			break;
		case 2: //TYPE_HEAL
			dragons_list_map[turn.source].heal(targets,after_attack_list,after_animation);
			break;
		case 3: //TYPE_MAGIC_HEAL
			dragons_list_map[turn.source].heal(targets,after_attack_list,after_animation);
			break;
		case 4: //TYPE_MAGIC_BUFF
			dragons_list_map[turn.source].add_buff(after_animation,after_attack_list);
		default:
			break;
	}



}


function PlayRound()
{
	currRound += 1

	if(currRound <= round_list.length)
	{
		var current_round = round_list[currRound-1];

		//force status
		var map = {}
		for(var i in current_round.force_status_list)
		{
			var obj = current_round.force_status_list[i];
			map[obj.slot] = obj
		}	
		for(var i in dragons_list)
		{
			var dragon = dragons_list[i];
			var obj = map[dragon.slot];
			dragon.power = obj.power
			dragon.life = obj.life
		}	

		//play turn
		current_turn = 0
		PlayTurn();
	}
}


function Play()
{
	


	currRound = 0

	round_list = battlerecord.replay_log.round_list;


	PlayRound();




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
    setInterval(drawScene, 50); // loop drawScene


    InitDragons();


    Play();

});