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
var renderTexts = [];
var fireball_list = [];
var heal_list = [];
var fire;

var RenderList = {}

var Config = {
	DragonMargin: 30,
	TeamMargin:100,
	StartX:400,
	StartY:100,
}

var $j = jQuery.noConflict();

var Utils = Class.create();

Utils.GUID = function()
{
	var G = function() {
		return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1)
	}
	var guid = (G() + G() + "-" + G() + "-" + G() + "-" + 
G() + "-" + G() + G() + G()).toUpperCase();
	return guid;
}


Utils.AddRender = function(obj)
{
	RenderList[obj.guid] = obj;
}

Utils.DelRender = function(obj)
{
	delete RenderList[obj.guid];
}


var GameObject = Class.create();
GameObject.prototype = {
	initialize:function(x,y)
	{
		this.x = x;
		this.y = y
		this.guid = Utils.GUID();
	},
	show:function(ctx)
	{

	}
}

var Sprite = Class.create();
Sprite.prototype = {
	initialize:function(w,h,x,y,image,col,frame_size,play_speed)
	{
		this.w = w;
		this.h = h
		this.image = image
		this.col = col
		this.frame_size = frame_size
		this.cur_frame = 0
		if(play_speed == undefined)
			this.play_speed = 1
		else
			this.play_speed = play_speed
		GameObject.prototype.initialize.call(this,x,y);
	}
	,
	show:function(ctx)
	{		
		this.cur_frame ++ ;
		var cur_frame = parseInt(this.cur_frame * this.play_speed);
		if(cur_frame >= this.frame_size )
		{
			this.cur_frame  = 0;
			cur_frame = 0;
		}
		ctx.drawImage(this.image, (cur_frame %this.col) *this.w, parseInt( (cur_frame /this.col)) * this.h, this.w, this.h, this.x - this.w/2, this.y - this.h/2, this.w, this.h);
	}
}


var EffectObject =  Class.create(Sprite,{
	initialize:function() //mil seconds
	{
		Sprite.prototype.initialize.apply(this,arguments);
	},
	show:function(ctx)
	{
		ctx.drawImage(this.image, (this.cur_frame %this.col) *this.w, parseInt( (this.cur_frame /this.col)) * this.h, this.w, this.h, this.x - this.w/2, this.y - this.h/2, this.w, this.h);
		this.cur_frame ++ ;
		if(this.cur_frame >= this.frame_size )
		{
			this.cur_frame  = 0;
			Utils.DelRender(this);
			if(this.callback != undefined)
			{
				this.callback();
			}
		}
	}
});

var HealingEffect =  Class.create(EffectObject,{
	initialize:function(x,y,callback)
	{
		var image = new Image();
		image.src = "images/healeffect.png"
		this.callback = callback;
		EffectObject.prototype.initialize.call(this,128,128,x,y,image,5,19);
	}
});





var AttackEffect = Class.create(GameObject,{
	initialize:function(x,y,damage,callback)
	{
		this.damage = damage;
		this.start_size = 35;
		this.end_size = 40;
		this.direction = 1;
		this.cur_size = this.start_size;
		this.callback = callback;
		GameObject.prototype.initialize.call(this,x,y);
	},
	show:function()
	{
		ctx.font = this.cur_size + "px Arial";

		if(this.damage > 0) //damage
		{
			ctx.fillStyle = '#FF3300'
			ctx.fillText("-" + this.damage,this.x,this.y);
		}
		else {
			ctx.fillStyle = '#66FF66';
			ctx.fillText(-this.damage,this.x,this.y);
		} 
	

		this.cur_size += 2* this.direction;
		if(this.cur_size >= this.end_size)
		{
			this.direction = -1;
		}
		else if (this.cur_size <= this.start_size) {
			Utils.DelRender(this)
			if(this.callback != undefined)
			{
				this.callback();
			}
		}
	}
});

var AbsorbBuffer =  Class.create(Sprite,{
	initialize:function(x,y,play_speed,callback)
	{
		var image = new Image();
		image.src = "images/absorbbuff.png"
		Sprite.prototype.initialize.call(this,128,126,x,y,image,4,9,play_speed);
	}
});

var ReboundBuffer =  Class.create(Sprite,{
	initialize:function(x,y,callback)
	{
		var play_speed = 1;
		var image = new Image();
		image.src = "images/reboundbuff.png"
		Sprite.prototype.initialize.call(this,128,126,x,y,image,1,1,play_speed);
	}
});



function Fire()
{
	this.w = 128
	this.h = 128
	this.x = 300
	this.y = 300

	this.anim_index = 0

}


Fire.prototype = {
	show : function(ctx){
	}
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
	if(slot >5)
	{
		dest_y += Config.TeamMargin
		dest_y -= dragonH/2
	}
	else{

		dest_y += dragonH/2
	}
	return {x:dest_x,y:dest_y};
}

Dragon.types_string = ["Greate","Water","Night","Earth","Fire"]

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
		ctx.font = "14px Arial";
		ctx.fillStyle = 'green';

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
		$j.each(dragon.buffs,function(key,value){
			value.x = dragon.x;
			value.y = dragon.y;
			value.show(ctx);
		})


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
	front_pos:function()
	{
		var y = this.y;
		if(this.slot >5)
		{
			y = this.y - this.h -5;
		}
		else
		{
			y = this.y + this.h + 5;
		}

		return {x:this.x,y:y};
	},
	direction_from:function(dragon)
	{
		if(dragon.origin_x - this.origin_x > 0)
			return -1;
		else if (dragon.origin_x - this.origin_x <0)
			return 1;
		else
			return 0;

	},
	shake:function(attacker_direction,callback) //-1 from right ,0 up,1 from left
	{
		var direction = 1;
		var max_offset = 5;
		var cur_offset = 0;
		var origin_x = this.x;
		var origin_y = this.y;
		var dragon = this;
		var t = 0;

		var y_dirction_modify = 0;
		var dragon_rotate = (dragon.slot > 5)?1:-1;

		var timer = setInterval(function(){
			dragon.x += attacker_direction * direction * t *t

			dragon.y += dragon_rotate*direction * t *t
			
			cur_offset += t * t
			if(cur_offset > max_offset)
			{
				if(direction == 1)
				{
					cur_offset =0
					direction = -1
					t = 0
				}
				else
				{
					clearInterval(timer);
					if(callback!= undefined)
						callback();
				}
			}
			t++

		},50);
	},
	action:function()
	{
		var max_y_offset = 20;
		var already_moved = 0;
		var origin_y = this.y;
		var velocity = 0.03;
		var dragon = this;
		var t = 0;
		var direction = -1;

		var timer =setInterval(function(){
			var distance = 0.5*direction*t*t*velocity
			dragon.y += distance
			already_moved +=  0.5* t*t*velocity
			if(already_moved >= max_y_offset) //first turn direction ,then end
			{
				if(direction == -1)
				{
					direction = 1;
					already_moved = 0;
					t = 0;

					dragons_list_map[4].get_heal({numerica:4000})

					//dragon.fire_magic( [{target:dragons_list_map[4].slot}] );
				}
				else
				{
					dragon.y = origin_y;
					clearInterval(timer);
				}

			}
			t += 1

		},20)

	},
	update_status:function(after_attack_list)
	{
		var dragon = this;

		$j.each(after_attack_list,function(key,val){
			var status = val;
			if( status.target == dragon.slot )
			{

				if(status.type == 2 ) //power
					dragon.power = status.args;
				else if(status.type == 0) //buffer
				{
					if(status.status == 0) //get
					{
						if( status.args == 0)
							dragon.buffs[status.args] = new AbsorbBuffer(dragon.x,dragon.y);
						else
							dragon.buffs[status.args] = new ReboundBuffer(dragon.x,dragon.y);
					}
					else if(status.status == 1)//delete
					{
						delete dragon.buffs[status.args]
						//show rebound damage
					
					}

				}

			}

		})

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
		Utils.AddRender(new HealingEffect(dragon.x,dragon.y-5,function(){

			Utils.AddRender(new AttackEffect(dragon.x-dragon.w/2,dragon.y-5,-target.numerica,function(){

				dragon.life += target.numerica;
				dragon.update_status(target.after_attack_list)
				if(dragon.life > dragon.max_life)
					dragon.life = dragon.max_life;

				if(callback)
					callback();
				
			}));

		}));
	},

	take_damage:function(direction,damage,callback)
	{
		var dragon = this;
		Utils.AddRender(new AttackEffect(dragon.x-dragon.w/2,dragon.y-5,damage,function(){
				dragon.life -= damage;
				if(dragon.life < 0)
					dragon.life = 0;
				if(callback != undefined)
					callback();
		}));
		dragon.shake(direction);
	},
	take_rebound_damage:function(damage,callback)
	{
		var dragon = this;
		Utils.AddRender(new AttackEffect(dragon.x-dragon.w/2,dragon.y-5,damage,function(){
				dragon.life -= damage;
				if(dragon.life < 0)
					dragon.life = 0;
				if(callback != undefined)
					callback();
		}));

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

		for(var i = 0 ; i < targets.length ;++i)
		{
			var target = targets[i];
			var fire = new Fireball(this.x,this.y,0)
			fireball_list.push(fire);
			target_dragon = dragons_list_map[target.target]
			if(i == (targets.length - 1) )
				Fireball.play_towards_animation( fire,target_dragon,target,callback);
			else
				Fireball.play_towards_animation( fire,target_dragon,target);
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
			for(var i = 0 ; i < targets.length ;++i)
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
			var dst = dragons_list_map[target.target].front_pos();
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
					target_dragon.take_damage(target_dragon.direction_from(dragon), target.numerica,function(){
						target_dragon.update_status(target.after_attack_list)
						dragon.reset();
						dragon.update_status(status_list);
						if(callback)
							callback();
					})

					var rebound_turn = round_list[currRound-1].turn_list[current_turn].rebound_turn;
					if(rebound_turn.target != undefined)
					{
						dragons_list_map[rebound_turn.target].take_rebound_damage(rebound_turn.numerica);
					}

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




function Fireball(x,y,rotate)
{

	this.x = x;
	this.y = y;
	this.rotate = rotate;
	this.alive = 1;
}


Fireball.play_towards_animation = function(src,target_dragon,target,callback)
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
					target_dragon.take_damage(target_dragon.direction_from(dragon),target.numerica,function(){
						target_dragon.update_status(target.after_attack_list);
						if(callback)
							callback();
					})
				},100);
				
			}
		}, 50); // loo

}

Fireball.prototype = {
	show:function(ctx)
	{
		drawRotatedImage(Fireball.image,this.x,this.y,this.rotate);
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

    ctx.font = "16px Arial";
	ctx.fillStyle = '#FF3300'
	ctx.fillText("Round: "  + currRound,30,50);

    // update sprite positions
    iSprPos++;
    if (iSprPos >= 9) {
        iSprPos = 0;
    }


	$j.each( dragons_list, function( key, value ) {
	  	value.show(ctx,iSprPos);
	});


	$j.each(RenderList, function( key, value ) {
	  	value.show(ctx);
	});


	
 //    for(var i in dragons_list)
 //    {
 //    	dragon = dragons_list[i];
 //   		dragon.show(ctx,iSprPos)
 //   	}


	// //draw render texts
	// for(var i in renderTexts)
	// {
	// 	text_array = renderTexts[i];
	// 	ctx.font = text_array[0];
	// 	ctx.fillStyle = text_array[1];
	// 	ctx.fillText(text_array[2],text_array[3],text_array[4]);

	// }

	//  for(var i in fireball_list)
 //    {
 //    	fireball = fireball_list[i];
 //    	if(fireball.alive)
 //   			fireball.show(ctx);
 //   	}


	//  for(var i in heal_list)
 //    {
 //    	heal = heal_list[i];
 //    	if(heal.alive)
 //   			heal.show(ctx);
 //   	}

// var obj = {
//   "flammable": "inflammable",
//   "duh": "no duh"
// };
// $.each( obj, function( key, value ) {
//   alert( key + ": " + value );
// });
   	fire.show(ctx);
}

function InitDragons()
{
	for(var i =0 ; i < battlerecord.replay_log.dragon_list.length ; ++i)
	{
		var obj = battlerecord.replay_log.dragon_list[i];
		dragon = new Dragon( obj.slot, obj.type, obj.life, obj.life, obj.level)
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
		$j.each(current_round.force_status_list,function(key,val){
			map[val.slot] = val
		})


		$j.each(dragons_list,function(key,dragon){
			var obj = map[dragon.slot];
			dragon.power = obj.power
			dragon.life = obj.life
		})
	

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
$j(function(){
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
    Fireball.image = fireImage;
    Fire.image = new Image();
    Fire.image.src = 'images/healeffect.png'
    Fire.image.onload = function(){}
    fire = new Fire();

    setInterval(drawScene, 50); // loop drawScene



    InitDragons();


   // Play();

});