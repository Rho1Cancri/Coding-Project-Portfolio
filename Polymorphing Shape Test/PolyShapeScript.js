/*
https://www.w3schools.com/js/default.asp
*/

window.onload = function() {
	// Initialising
	var canvas = document.getElementById("canvas");
	var ctx = canvas.getContext("2d");
	canvas.width = 800;
	canvas.height = 600;
	var paused = false;
	var tick = 0;
	var mouseX = 400;
	var mouseY = 300;
	console.log(ctx.globalCompositeOperation);
	
	//Functions
	canvas.onmousemove = function(e) {
		mouseX = e.offsetX;
		mouseY = e.offsetY;
	}
	canvas.onmouseenter = function(e) {
		mouseX = e.offsetX;
		mouseY = e.offsetY;
	}
	canvas.onmouseleave = function(e) {
		mouseX = 400;
		mouseY = 300;
	}
	
	//Main loop
	function mainLoop(timestamp){
		//Start of loop
		tick += 1;
		console.log(mouseX, mouseY);
		
		//Draw shapes
		ctx.clearRect(0, 0, 800, 600);
		
		ctx.globalCompositeOperation = "xor";
		ctx.fillStyle = "#808080FF";
		
		ctx.beginPath();
		ctx.moveTo(400 + 200 * Math.cos(tick / 600 * Math.PI), 300 + 200 * Math.sin(tick / 600 * Math.PI));
		ctx.lineTo(400 + 200 * Math.cos((tick / 600 + 2 / 3) * Math.PI), 300 + 200 * Math.sin((tick / 600 + 2 / 3) * Math.PI));
		ctx.lineTo(400 + 200 * Math.cos((tick / 600 - 2 / 3) * Math.PI), 300 + 200 * Math.sin((tick / 600 - 2 / 3) * Math.PI));
		ctx.closePath();
		ctx.fill();
		ctx.beginPath();
		ctx.moveTo(250, 250);
		ctx.lineTo(350, 250);
		ctx.lineTo(350, 350);
		ctx.lineTo(250, 350);
		ctx.closePath();
		ctx.fill();
		
		ctx.globalCompositeOperation = "source-over";
		
		ctx.fillStyle = "#0080FF80";
		ctx.beginPath();
		ctx.moveTo(mouseX - 50, mouseY + 50);
		ctx.bezierCurveTo(mouseX - 50, mouseY - 50, mouseX + 50, mouseY - 50, mouseX + 50, mouseY + 50);
		ctx.closePath();
		ctx.fill();
		
		//End of loop
		requestAnimationFrame(mainLoop);
	}
	requestAnimationFrame(mainLoop);
}
