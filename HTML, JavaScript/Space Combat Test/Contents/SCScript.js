/*
	Space Combat script
	
	https://www.w3schools.com/js/js_array_methods.asp
	https://www.w3schools.com/js/js_string_methods.asp
	https://www.w3schools.com/tags/ref_canvas.asp
	https://www.w3schools.com/tags/tag_audio.asp
	https://www.w3schools.com/tags/ref_av_dom.asp
	https://www.w3schools.com/jsref/dom_obj_event.asp
	
	Apps used (credit to their creators):
	Audacity, Firefox, Gedit, GeoGebra 5, Gimp, Google Chrome, Inkscape, Notepad++
	
	Also: PI * 2 / 360 = PI / 180
	
	Current task: simplifying laser damage script
*/

window.onload = function() {
	//Setting variables
	var canvas = document.getElementById("canvas"); canvas.width = 800; canvas.height = 600;
	var ctx = canvas.getContext("2d");
	ctx.imageSmoothingEnabled = false;
	var game_interval;
	var instances = [];
	var game_tick = 0, loop_step = false;
	var key_code = [];
	var mouse_x = 0, mouse_y = 0, m_field_x = 0, m_field_y = 0, mouse_down, mouse_hover, hit_c = 0, kill_c = 0;
	var camera_x = canvas.width / 2, camera_y = canvas.height / 2, camera_r = 0, camera_z = 1;
	var c_shake_x = 0, c_shake_y = 0, c_shake_e = 0, damage_c = 0;
	var old_seconds = 0, new_seconds = 0, m_text = "";
	var stage = "start";
	var damage_gradient = ctx.createRadialGradient(canvas.width / 2, canvas.height / 2, 0, canvas.width / 2, canvas.height / 2, (canvas.width ** 2 + canvas.height ** 2) ** 0.5 / 2);
	damage_gradient.addColorStop(0, "#C0000000");
	damage_gradient.addColorStop(0.38, "#C0000040");
	damage_gradient.addColorStop(0.71, "#C0000080");
	damage_gradient.addColorStop(0.92, "#C00000C0");
	damage_gradient.addColorStop(1, "#C00000FF");
	
	//Setting functions
	function dist(p1x, p1y, p2x, p2y) {
		return ((p2x - p1x) ** 2 + (p2y - p1y) ** 2) ** 0.5;
	}
	function circle_line_collision(p1x, p1y, p2x, p2y, p3x, p3y, r) {
		var dx = p2x - p1x, dy = p2y - p1y, p4x, p4y, p5x, p5y, p6x, p6y;
		if (dy ** 2 + dx ** 2 > 0) {
			p4x = ((p3y - p1y) * dx * dy + dy ** 2 * p1x + dx ** 2 * p3x) / (dy ** 2 + dx ** 2);
			p4y = ((p3x - p1x) * dx * dy + dx ** 2 * p1y + dy ** 2 * p3y) / (dx ** 2 + dy ** 2);
		} else {
			p4x = p1x;
			p4y = p1y;
		}
		if (dist(p3x, p3y, p4x, p4y) <= r && (dist(p1x, p1y, p4x, p4y) <= dist(p1x, p1y, p2x, p2y) && dist(p2x, p2y, p4x, p4y) <= dist(p2x, p2y, p1x, p1y) || dist(p1x, p1y, p3x, p3y) <= r || dist(p2x, p2y, p3x, p3y) <= r)) {
			var t = (r ** 2 - dist(p3x, p3y, p4x, p4y) ** 2) ** 0.5;
			p5x = p4x - Math.cos(Math.atan2(dy, dx)) * t;
			p5y = p4y - Math.sin(Math.atan2(dy, dx)) * t;
			p6x = p4x + Math.cos(Math.atan2(dy, dx)) * t;
			p6y = p4y + Math.sin(Math.atan2(dy, dx)) * t;
		}
		if (dist(p2x, p2y, p5x, p5y) > dist(p2x, p2y, p1x, p1y)) {p5x = p1x; p5y = p1y;}
		if (dist(p1x, p1y, p6x, p6y) > dist(p1x, p1y, p2x, p2y)) {p6x = p2x; p6y = p2y;}
		return [p5x, p5y, p6x, p6y];
	}
	function field_t_coords(x = 0, y = 0, r = 0, size = 1) {
		ctx.setTransform(Math.cos(-camera_r) * camera_z, Math.sin(-camera_r) * camera_z, Math.sin(camera_r) * camera_z, Math.cos(-camera_r) * camera_z, canvas.width / 2, canvas.height / 2);
		ctx.transform(Math.cos(r) * size, Math.sin(r) * size, -Math.sin(r) * size, Math.cos(r) * size, x - camera_x - c_shake_x, y - camera_y - c_shake_y);
	}
	function camera_t_coords(x = 0, y = 0) {
		ctx.setTransform(1, 0, 0, 1, x - c_shake_x * Math.cos(camera_r) - c_shake_y * Math.sin(camera_r), y + c_shake_x * Math.sin(camera_r) - c_shake_y * Math.cos(camera_r));
	}
	function draw_image(sprite = sprite_unknown, x = 0, y = 0) {
		ctx.drawImage(sprite, x - sprite.width / 2, y - sprite.height / 2);
	}
	function correct_r(r = 0) {
		while (r <= -Math.PI)
			r += Math.PI * 2;
		while (r > Math.PI)
			r -= Math.PI * 2;
		return r;
	}
	function find_player() {
		var player = false;
		for (var i of instances)
			if (i.is_player)
				player = i;
		return player;
	}
	function camera_shake(x, y, magnitude) {
		var player = find_player();
		if (player)
			c_shake_e = Math.max(magnitude - dist(x, y, player && player.x || camera_x, player && player.y || camera_y) / 20, c_shake_e);
	}
	function play_sound(sound, speed = 1, volume = 1) {
		if (volume > 0) {
			var tmp_sound = sound.cloneNode();
			tmp_sound.playbackRate = speed;
			tmp_sound.volume = volume;
			tmp_sound.play();
		}
	}
	function play_sound_local(sound, speed, volume, x, y, limit) {
		var player = find_player();
		if (player) {
			var amp = Math.max(1 - dist(x, y, player && player.x || camera_x, player && player.y || camera_y) / limit, 0);
			if (volume > 0 && amp > 0) {
				var tmp_sound = sound.cloneNode();
				tmp_sound.playbackRate = speed;
				tmp_sound.volume = volume * amp;
				tmp_sound.play();
			}
		}
	}
	
	//Loading images
	var sprite_fed_fighter = document.getElementById("img_fed_fighter");
	var sprite_fed_laser = document.getElementById("img_fed_laser");
	var sprite_fed_laser_hit = document.getElementById("img_fed_laser_hit");
	var sprite_fed_shield = document.getElementById("img_fed_shield");
	var sprite_imp_fighter = document.getElementById("img_imp_fighter");
	var sprite_imp_laser = document.getElementById("img_imp_laser");
	var sprite_imp_laser_hit = document.getElementById("img_imp_laser_hit");
	var sprite_imp_shield = document.getElementById("img_imp_shield");
	var sprite_mil_fighter = document.getElementById("img_mil_fighter");
	var sprite_mil_laser = document.getElementById("img_mil_laser");
	var sprite_mil_laser_hit = document.getElementById("img_mil_laser_hit");
	var sprite_mil_shield = document.getElementById("img_mil_shield");
	var sprite_par_fighter = document.getElementById("img_par_fighter");
	var sprite_par_laser = document.getElementById("img_par_laser");
	var sprite_par_laser_hit = document.getElementById("img_par_laser_hit");
	var sprite_par_shield = document.getElementById("img_par_shield");
	var sprite_radar_panel = document.getElementById("img_radar");
	var sprite_status_panel = document.getElementById("img_status");
	var sprite_reticle = document.getElementById("img_reticle");
	var sprite_reticle_hit = document.getElementById("img_reticle_hit");
	var sprite_reticle_kill = document.getElementById("img_reticle_kill");
	var sprite_unknown = document.getElementById("img_unknown");
	var sprite_starfield = document.getElementById("img_starfield");
	var sprite_bars = document.getElementById("img_bars");
	var sprite_explosion_ring = document.getElementById("img_explosion_ring");
	var sprite_fireball = document.getElementById("img_fireball");
	var sprite_hud = document.getElementById("img_hud");
	
	//Creating patterns out of images
	var bar_pattern = ctx.createPattern(sprite_bars, "repeat");
	var starfield_pattern = ctx.createPattern(sprite_starfield, "repeat");
	
	//Loading sounds
	var music_void_fleet = document.getElementById("snd_void_fleet");
	var sound_laser_cannon = document.getElementById("snd_laser_cannon");
	var sound_explosion = document.getElementById("snd_explosion");
	var sound_metal_impact = document.getElementById("snd_metal_impact");
	var sound_electrical = document.getElementById("snd_electrical");
	
	//Connecting to events
	window.onkeydown = function(e) {
		key_code[e.key] = true;
		if(["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].indexOf(e.key) > -1) e.preventDefault();
	}
	window.onkeyup = function(e) {
		key_code[e.key] = false;
	}
	canvas.onmousemove = function(e) {
		mouse_x = e.offsetX;
		mouse_y = e.offsetY;
		mouse_hover = true;
	}
	canvas.onmouseleave = function() {
		mouse_hover = false;
	}
	canvas.onmousedown = function() {
		var player = find_player();
		mouse_down = true;
		if (player) {
			var f_angle = Math.atan2(player.y - m_field_y, player.x - m_field_x);
			instances.push(new laser(player.x - Math.cos(f_angle) * (sprite_imp_laser.width / 2 + 2400), player.y - Math.sin(f_angle) * (sprite_imp_laser.width / 2 + 2400), f_angle, sprite_imp_laser));
		}
	}
	canvas.onmouseup = function() {
		mouse_down = false;
	}
	window.beforeunload = function() {
		clearInterval(game_interval);
	}
	
	//Creating classes
	var base_object = function(x, y, r, sprite) {
		this.x = x || 0;
		this.y = y || 0;
		this.r = r || 0;
		this.sprite = sprite;
	}
	var test_fighter = function(x, y, r, sprite) {
		base_object.call(this, x, y, r, sprite);
		this.step = function() {
			this.r += Math.PI / 120;
			this.r = correct_r(this.r);
		}
	}
	var laser_hit = function(x, y, r, sprite) {
		base_object.call(this, x, y, r, sprite);
		this.opacity = 1;
		this.lifespan = 0;
		this.step = function() {
			this.opacity = 1 - this.lifespan / 15;
			this.lifespan ++;
			if (this.lifespan > 15)
				instances.splice(instances.indexOf(this), 1);
		}
	}
	var laser = function(x, y, r, sprite, origin) {
		base_object.call(this, x, y, r, sprite);
		play_sound_local(sound_laser_cannon, 0.8 + Math.random() * 0.4, 0.2, this.x, this.y, 1200);
		this.speed = 120;
		this.damage = 20;
		this.team = origin && origin.team;
		this.lifespan = 0;
		this.step = function() {
			this.x += Math.cos(this.r) * this.speed;
			this.y += Math.sin(this.r) * this.speed;
			this.lifespan ++;
			var p1x = this.x + Math.cos(this.r) * (this.sprite.width / 2 - this.speed);
			var p1y = this.y + Math.sin(this.r) * (this.sprite.width / 2 - this.speed);
			var p2x = this.x + Math.cos(this.r) * (this.sprite.width / 2);
			var p2y = this.y + Math.sin(this.r) * (this.sprite.width / 2);
			var hit_x, hit_y, hit_object;
			var player = find_player();
			for (var i of instances)
				if (i.sprite && i != this && i != origin && i.constructor.name == "fighter" && (!this.team || !i.team || this.team != i.team)) {
					var data = circle_line_collision(p1x, p1y, p2x, p2y, i.x, i.y, (i.sprite.width * i.sprite.height) ** 0.5 / 2);
					if (data[0] && data[1] && (!hit_object || dist(p1x, p1y, data[0], data[1]) < dist(p1x, p1y, hit_x, hit_y))) {
						hit_x = data[0];
						hit_y = data[1];
						hit_object = i;
					}
				}
			if (hit_object) {
				instances.push(new laser_hit(hit_x, hit_y, Math.random() * Math.PI * 2, eval("sprite" + this.sprite.id.substr(3, 10) + "_hit")));
				if (hit_object.shield >= this.damage) {
					hit_object.shield_effect();
					hit_object.shield -= this.damage;
					play_sound_local(sound_electrical, 1, .25, this.x, this.y, 1200);
					if (origin == player)
						hit_c = 6;
				} else
					if (hit_object.health > 0) {
						if (hit_object == player) {
							camera_shake(hit_x, hit_y, 6);
							damage_c = Math.max(damage_c, 30);
						}
						if (origin == player && hit_object.health > 0)
							if (hit_object.health + hit_object.shield > this.damage)
								hit_c = 6;
							else
								kill_c = 6;
						hit_object.health = Math.max(hit_object.health - this.damage + hit_object.shield, 0);
						hit_object.shield = 0;
						play_sound_local(sound_metal_impact, 1, .5, this.x, this.y, 1200);
					}
			}
			if (this.lifespan > 20 || hit_object)
				instances.splice(instances.indexOf(this), 1);
		}
	}
	var explosion = function(x, y, r, sprite) {
		base_object.call(this, x, y, r, sprite);
		play_sound_local(sound_explosion, 1.5, 1, this.x, this.y, 1200);
		camera_shake(this.x, this.y, 20);
		this.lifespan = 0;
		this.step = function() {
			if (this.lifespan > 30)
				instances.splice(instances.indexOf(this), 1);
			this.lifespan ++;
		}
	}
	var fighter = function(x, y, r, sprite, is_player, team) {
		base_object.call(this, x, y, r, sprite);
		this.speed = 0;
		this.top_speed = 12;
		this.accel = .4;
		this.r_speed = 0;
		this.top_r_speed = Math.PI / 60;
		this.r_accel = Math.PI / 1200;
		this.health = 100;
		this.max_health = 100;
		this.shield = 100;
		this.max_shield = 100;
		this.charge = 100;
		this.max_charge = 100;
		this.cooldown = 0;
		this.shield_timer = 0;
		this.is_player = is_player;
		this.team = team || null;
		this.step = function() {
			if (this.is_player) {
				if (key_code["w"] && this.speed < this.top_speed)
					this.speed += this.accel;
				if (key_code["s"] && this.speed > -this.top_speed / 5)
					this.speed -= this.accel;
				if (!key_code["w"] && !key_code["s"])
					if (this.speed >= this.accel && this.speed < this.top_speed / 5)
						this.speed -= this.accel;
					else
						if (this.speed <= -this.accel)
							this.speed += this.accel;
					else
						if (this.speed < this.accel && this.speed > -this.accel)
							this.speed = 0;
				if (key_code["a"] && this.r_speed > -this.top_r_speed)
					this.r_speed -= this.r_accel;
				if (key_code["d"] && this.r_speed < this.top_r_speed)
					this.r_speed += this.r_accel;
				if (!key_code["a"] && !key_code["d"])
					if (this.r_speed >= this.r_accel)
						this.r_speed -= this.r_accel;
					else
						if (this.r_speed <= -this.r_accel)
							this.r_speed += this.r_accel;
					else
						this.r_speed = 0;
				if (key_code[" "] && this.cooldown == 0 && this.charge >= 8) {
					this.cooldown = 6;
					this.charge -= 8;
					camera_shake(this.x, this.y, 2);
					var m_angle = Math.atan2(m_field_y - this.y, m_field_x - this.x);
					var f_angle = this.r;
					if (m_angle <= this.r + Math.PI / 6 && m_angle >= this.r - Math.PI / 6 || m_angle >= this.r + Math.PI * 11 / 6 || m_angle <= this.r - Math.PI * 11 / 6)
						f_angle = m_angle;
					else
						if (m_angle < this.r && m_angle > this.r - Math.PI * 5 / 6 || m_angle > this.r + Math.PI * 7 / 6)
							f_angle = this.r - Math.PI / 6;
						else
							if (m_angle > this.r && m_angle < this.r + Math.PI * 5 / 6 || m_angle < this.r - Math.PI * 7 / 6)
								f_angle = this.r + Math.PI / 6;
					var var_name = "sprite" + this.sprite.id.substr(3, 5) + "laser";
					instances.push(new laser(this.x - Math.cos(f_angle) * eval(var_name).width / 2, this.y - Math.sin(f_angle) * eval(var_name).width / 2, f_angle, eval(var_name), this));
				}
			} else
				this.r = Math.atan2(m_field_y - this.y, m_field_x - this.x);
			if (this.cooldown > 0)
				this.cooldown --;
			this.shield = Math.min(this.shield + 5 / 12, this.max_shield);
			if (this.shield_timer > 0)
				this.shield_timer --;
			this.charge = Math.min(this.charge + 5 / 9, this.max_charge);
			this.x += this.speed * Math.cos(this.r);
			this.y += this.speed * Math.sin(this.r);
			this.r += this.r_speed;
			this.r = correct_r(this.r);
			if (this.health <= 0) {
				instances.push(new explosion(this.x, this.y, Math.random() * Math.PI * 2));
				instances.splice(instances.indexOf(this), 1);
			}
			if (this.is_player) {
				camera_x = this.x + Math.cos(this.r) * (canvas.width - canvas.height) / 2 / camera_z;
				camera_y = this.y + Math.sin(this.r) * (canvas.width - canvas.height) / 2 / camera_z;
				camera_r = this.r + Math.PI / 2;
			}
		}
		this.shield_effect = function() {
			this.shield_timer = Math.min(this.shield_timer + 15, 30);
		}
	}
	
	//Filling initial object list
	var sprite_list = [sprite_fed_fighter, sprite_imp_fighter, sprite_mil_fighter, sprite_par_fighter];
	instances.push(new fighter(400, 300, 0, sprite_fed_fighter, true, "Federation"));
	for (var i = 0; i < 10; i ++)
		instances.push(new fighter(Math.random() * 1000 - 100, Math.random() * 1000 - 200, Math.random() * Math.PI * 2, sprite_imp_fighter, false, "Empire"));
	for (var i = 0; i < 10; i ++)
		instances.push(new fighter(Math.random() * 1000 - 100, Math.random() * 1000 - 200, Math.random() * Math.PI * 2, sprite_mil_fighter, false, "Milque"));
	for (var i = 0; i < 10; i ++)
		instances.push(new fighter(Math.random() * 1000 - 100, Math.random() * 1000 - 200, Math.random() * Math.PI * 2, sprite_par_fighter, false, "Parasite"));
	for (var i = 0; i < 9; i ++)
		instances.push(new fighter(Math.random() * 1000 - 100, Math.random() * 1000 - 200, Math.random() * Math.PI * 2, sprite_fed_fighter, false, "Federation"));
	
	//Main loops
	game_interval = setInterval(function() {if (!loop_step) {
		//Constants
		m_text = "";
		loop_step = true;
		
		//Global key commands
		if (key_code["q"])
			camera_z *= 2 ** (1 / 20);
		if (camera_z > 4)
			camera_z = 4;
		if (key_code["e"])
			camera_z /= 2 ** (1 / 20);
		if (camera_z < 1 / 4)
			camera_z = 1 / 4;
		if (key_code["m"])
			music_void_fleet.play();
		if (key_code["n"])
			music_void_fleet.pause();
		if (key_code["b"])
			music_void_fleet.currentTime = 0;
		
		//Global and instance actions
		if (c_shake_e > 0) {
			var angle = Math.random() * Math.PI * 2;
			var magnitude = Math.random() * c_shake_e;
			c_shake_x = magnitude * Math.cos(angle);
			c_shake_y = magnitude * Math.sin(angle);
			c_shake_e -= 0.5;
		} else {
			c_shake_x = 0;
			c_shake_y = 0;
		}
		camera_r = correct_r(camera_r);
		m_field_x = camera_x + Math.cos(camera_r) * (mouse_x - canvas.width / 2) / camera_z - Math.sin(camera_r) * (mouse_y - canvas.height / 2) / camera_z;
		m_field_y = camera_y + Math.cos(camera_r) * (mouse_y - canvas.height / 2) / camera_z + Math.sin(camera_r) * (mouse_x - canvas.width / 2) / camera_z;
		for (var i of instances)
			if (i.step)
				i.step();
		
		//Draw background
		ctx.setTransform(1, 0, 0, 1, 0, 0);
		ctx.globalAlpha = 1;
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		var canvas_d = (canvas.width ** 2 + canvas.height ** 2) ** 0.5 / camera_z;
		field_t_coords();
		ctx.fillStyle = starfield_pattern;
		ctx.fillRect(camera_x - canvas_d / 2, camera_y - canvas_d / 2, canvas_d, canvas_d);
		
		//Draw instances and associated effects
		for (var i of instances) {
			field_t_coords(i.x, i.y, i.r);
			if (typeof(i.opacity) == "number")
				ctx.globalAlpha = i.opacity;
			else
				ctx.globalAlpha = 1;
			if (i.constructor.name == "explosion") {
				field_t_coords(i.x, i.y, i.r, (i.lifespan - 1) / 7.5);
				ctx.globalAlpha = (31 - i.lifespan) / 30;
				if (i.lifespan != 1)
					draw_image(sprite_explosion_ring);
				field_t_coords(i.x, i.y, i.r, (i.lifespan - 1) / 30 + 1);
				draw_image(sprite_fireball);
			} else
				if (i.sprite) {
					if (typeof(i.opacity) == "number") 
						ctx.globalAlpha = i.opacity; 
					else 
						ctx.globalAlpha = 1;
					draw_image(i.sprite);
				}
			if (typeof(i.shield_timer) == "number" && i.shield_timer > 0) {
				ctx.globalAlpha = i.shield_timer / 30;
				draw_image(eval("sprite" + i.sprite.id.substr(3, 5) + "shield"));
			}
		}
		
		//Heads up display system
		var player = find_player();
		if (player) {
			//Draw panels and HUD
			camera_t_coords();
			ctx.globalAlpha = 0.75;
			ctx.drawImage(sprite_radar_panel, 0, 0);
			ctx.drawImage(sprite_status_panel, canvas.width - sprite_status_panel.width, 0);
			ctx.globalAlpha = 0.5;
			ctx.drawImage(sprite_hud, 0, 0);
			
			//Draw radar markers
			for (var i of instances) if (i.constructor.name == "fighter") {
				if (i == player)
					ctx.fillStyle = "#C0C0C0";
				else
					if (i.team && player.team && i.team == player.team)
						ctx.fillStyle = "#00FF00";
					else
						ctx.fillStyle = "#FF4000";
				var r_a = Math.atan2(i.y - player.y, i.x - player.x) - camera_r;
				var r_d = Math.min(dist(player.x, player.y, i.x, i.y), 5000);
				ctx.fillRect(Math.round(r_d * Math.cos(r_a) / 100) - 1 + sprite_radar_panel.width / 2, Math.round(r_d * Math.sin(r_a) / 100) - 1 + sprite_radar_panel.height / 2, 2, 2);
			}
			
			//Draw status bars
			ctx.globalAlpha = 1;
			camera_t_coords(canvas.width - 40, 0);
			ctx.fillStyle = bar_pattern;
			ctx.fillRect(0, 110 - player.health / player.max_health * 100, 10, player.health / player.max_health * 100);
			ctx.fillRect(10, 110 - player.shield / player.max_shield * 100, 10, player.shield / player.max_shield * 100);
			ctx.fillRect(20, 110 - player.charge / player.max_charge * 100, 10, player.charge / player.max_charge * 100);
			
			//Draw HUD arrow per object
			for (var i of instances) if (i != player && i.constructor.name == "fighter") {
				if (dist(player.x, player.y, i.x, i.y) * camera_z > canvas.width / 2 - 10 || (i.x - player.x) * Math.cos(player.r) + (i.y - player.y) * Math.sin(player.r) < (canvas.height - canvas.width + 10) / camera_z) {
					//Set arrow position
					var r_a = Math.atan2(i.y - player.y, i.x - player.x) - camera_r;
					if (canvas.width - canvas.height - 10 > Math.sin(r_a) * (canvas.width / 2 - 10))
						camera_t_coords(canvas.width / 2 + Math.cos(r_a) * (canvas.width / 2 - 10), canvas.width / 2 + Math.sin(r_a)* (canvas.width / 2 - 10));
					else
						camera_t_coords(canvas.width / 2 + Math.tan(Math.PI / 2 - r_a) * (canvas.width - canvas.height - 10), canvas.width * 3 / 2 - canvas.height - 10);
					//Configure color and lines
					var arrow_size = 10;
					if (i.team && player.team && i.team == player.team) {
						ctx.fillStyle = "#00C000";
						ctx.strokeStyle = "#00C000";
					} else {
						ctx.fillStyle = "#FF4000";
						ctx.strokeStyle = "#FF4000";
					}
					ctx.lineJoin = "round";
					ctx.lineWidth = 2;
					//Draw arrow
					ctx.beginPath();
					ctx.moveTo(arrow_size * Math.cos(i.r - camera_r), arrow_size * Math.sin(i.r - camera_r));
					ctx.lineTo(arrow_size * (-.8 * Math.cos(i.r - camera_r) - .4 * Math.sin(i.r - camera_r)), arrow_size * (.4 * Math.cos(i.r - camera_r) - .8 * Math.sin(i.r - camera_r)));
					ctx.lineTo(arrow_size / -2 * Math.cos(i.r - camera_r), arrow_size / -2 * Math.sin(i.r - camera_r));
					ctx.lineTo(arrow_size * (-.8 * Math.cos(i.r - camera_r) + .4 * Math.sin(i.r - camera_r)), arrow_size * (-.4 * Math.cos(i.r - camera_r) - .8 * Math.sin(i.r - camera_r)));
					ctx.closePath();
					ctx.globalAlpha = Math.max(0.2, Math.min(.5, .5 / dist(player.x, player.y, i.x, i.y) * (canvas.width / 2 - 10)));
					ctx.fill();
					ctx.globalAlpha = Math.max(0.4, Math.min(1, 1 / dist(player.x, player.y, i.x, i.y) * (canvas.width / 2 - 10)));
					ctx.stroke();
				}
			}
			//Acceleration calculator
			var test_x = player.x, test_y = player.y, test_s = 0, test_r = Math.atan2(m_field_y - player.y, m_field_x - player.x);
			var dist_calc = function(start_s, end_s, accel) {
				var d = 0;
				for (var i = start_s; i < Math.max(start_s, end_s); i += accel)
					d += i + accel;
				return d;
			}
			ctx.globalAlpha = 1;
			ctx.fillStyle = "#4080FF";
			field_t_coords(player.x, player.y, player.r);
			ctx.fillRect(-3 / camera_z, -3 / camera_z, 6 / camera_z, 6 / camera_z);
			console.log("Start");
			while (dist(player.x, player.y, test_x, test_y) < dist(player.x, player.y, m_field_x, m_field_y)) {
				var end_dist = dist(test_x, test_y, m_field_x, m_field_y);
				if (game_tick % 60 == 0)
					console.log(end_dist, dist_calc(0, test_s, 5));
				if (end_dist < dist_calc(0, test_s, 5) && test_s > 5) {
					test_s -= 5;
					ctx.fillStyle = "#FF0000";
				} else
					if (end_dist < dist_calc(0, test_s, 5) + test_s && test_s > 0)
						ctx.fillStyle = "#FFD000";
					else
						if (test_s < 30) {
							test_s += 5;
							ctx.fillStyle = "#00E000";
						} else
							ctx.fillStyle = "#FFD000";
				test_x += Math.cos(test_r) * test_s;
				test_y += Math.sin(test_r) * test_s;
				field_t_coords(test_x, test_y, player.r);
				ctx.fillRect(-3 / camera_z, -3 / camera_z, 6 / camera_z, 6 / camera_z);
			}
			var d = 0;
			ctx.globalAlpha = 0.5;
			for (var i = 0; i < 30; i += 5) {
				d += i + 5;
				ctx.fillStyle = "#FF7800";
				field_t_coords(m_field_x - Math.cos(test_r) * d, m_field_y - Math.sin(test_r) * d, player.r);
				ctx.fillRect(-3 / camera_z, -3 / camera_z, 6 / camera_z, 6 / camera_z);
			}
		}
		
		//Text for test purposes and FPS
		ctx.setTransform(1, 0, 0, 1, 0, 0);
		new_seconds = (new Date()).getMilliseconds();
		if (old_seconds > new_seconds)
			old_seconds -= 1000;
		m_text = m_text + ("FPS: " + Math.round(1e3 / (new_seconds - old_seconds))) + " Hz. Just testing!";
		ctx.fillStyle = "#808080";
		ctx.globalAlpha = 0.5;
		ctx.fillRect((canvas.width - ctx.measureText(m_text).width) / 2 - 5, 0, ctx.measureText(m_text).width + 10, 45);
		ctx.globalAlpha = 1;
		ctx.font = "30px Arial";
		ctx.fillStyle = "#80C0FF";
		ctx.fillText(m_text, (canvas.width - ctx.measureText(m_text).width) / 2, 30);
		old_seconds = new_seconds;
		
		//Draw mouse cursor and associated markers
		if (mouse_hover) {
			ctx.globalAlpha = 1;
			draw_image(sprite_reticle, mouse_x, mouse_y);
			if (kill_c > 0)
				draw_image(sprite_reticle_kill, mouse_x, mouse_y);
			else
				if (hit_c > 0)
					draw_image(sprite_reticle_hit, mouse_x, mouse_y);
			if (damage_c > 0) {
				ctx.globalAlpha = damage_c / 30;
				ctx.fillStyle = damage_gradient;
				ctx.fillRect(0, 0, canvas.width, canvas.height);
			}
		}
		hit_c = Math.max(0, hit_c - 1);
		kill_c = Math.max(0, kill_c - 1);
		damage_c = Math.max(0, damage_c - 1);
		
		//Other things
		game_tick ++;
		loop_step = false;
	}}, 50 / 3);
}

