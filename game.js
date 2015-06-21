/**************************************************
** NODE.JS REQUIREMENTS
**************************************************/
var app = require('http').createServer(handler);
var io = require('socket.io')(app);
var fs = require('fs');

if (typeof String.prototype.startsWith !== 'function') {
  String.prototype.startsWith = function (str){
    return this.indexOf(str) === 0;
  };
}

var resource;
function handler (req, res) {
  function callback(err, data) {
    if (err) {
      res.writeHead(500);
      return res.end('Error loading index.html');
    }
    res.writeHead(200);
    res.end(data);
  }
  resource = req.url.split("?")[0];
  if (resource === "/" || resource === "/index.html") {
    fs.readFile(__dirname + "/template/index.html", callback);
  } else if (resource === "/main.js" || resource === "/project.json") {
    fs.readFile(__dirname + "/template" + resource, callback);
  } else if (resource.startsWith("/res") || resource.startsWith("/src")) {
    fs.readFile(__dirname + "/template" + resource, callback);
  } else if (resource.startsWith("/engine")) {
    fs.readFile(__dirname + "/template" + resource, callback);
  } else {
    fs.readFile(__dirname + "/template/engine" + resource, callback);
  }
}


var Player = require("./server/Player").Player;
// var Monster = require("./server/Monster").Monster;
var MonstersController = require("./server/MonstersController").MonstersController;


/**************************************************
** GAME VARIABLES
**************************************************/
var socket,
	players = [],
	monsters = [],
	projectiles = [],
	clients = 0,
	projectiles_id = 0;

/**************************************************
** GAME INITIALISATION
**************************************************/
// Socket.IO
io.on('connection', onSocketConnection);
// New socket connection
function onSocketConnection(client) {
	console.log("New player has connected: " + client.id);
	client.on("disconnect", onClientDisconnect);
	client.on("new player", onNewPlayer);
	client.on("move player", onMovePlayer);
	client.on("update player health", onUpdatePlayerHealth);
	client.on("remove monster", onRemoveMonster);
	client.on("hurt monster", onHurtMonster);
	client.on("new projectile", onNewProjectile);
	client.on("remove projectile", onRemoveProjectile);
}

function onClientDisconnect() {
  console.log("Player has disconnected: " + this.id);
	var removePlayer = playerById(this.id);
	// Player not found
	if (!removePlayer) {
		console.log("Player not found: " + this.id);
		return;
	}
	clients--;
	// Remove player from players array
	players.splice(players.indexOf(removePlayer), 1);
	if (clients === 0) {
	  monsters.splice(0);
	  players.splice(0);
	}
	// Broadcast removed player to connected socket clients
	this.broadcast.emit("remove player", {id: this.id});
}

function onNewPlayer(data) {
  var newPlayer = new Player(data);
  newPlayer.id = this.id;
  this.broadcast.emit("new player", {
    id: newPlayer.id,
    x: newPlayer.getX(),
    y: newPlayer.getY(),
    r: newPlayer.getR()
  });
  
  // Send existing players to the new player
	var i, existingPlayer;
	for (i = players.length - 1; i >= 0; i--) {
		existingPlayer = players[i];
		this.emit("new player", {
		  id: existingPlayer.id,
		  x: existingPlayer.getX(),
		  y: existingPlayer.getY(),
		  r: existingPlayer.getR(),
		});
	}
	var existingMonsters = [], existingMonster;
	for (i = monsters.length - 1; i >= 0; i--) {
		existingMonster = monsters[i];
		existingMonsters.push({
		  id: existingMonster.id,
		  x: existingMonster.getX(),
		  y: existingMonster.getY(),
		  health: existingMonster.getHealth(),
		  speed: existingMonster.speed,
      aimX: existingMonster.getAimX(),
      aimY: existingMonster.getAimY(),
      moveType: existingMonster.moveType
		});
	}
	this.emit("new monsters", {monsters: existingMonsters});
	
	// Add new player to the players array
	players.push(newPlayer);
	clients++;
}

function onMovePlayer(data) {
  var movePlayer = playerById(this.id);
  
  if (!movePlayer) {
    console.log("Player not found: " + this.id);
    return;
  }
  
  movePlayer.setX(data.x);
  movePlayer.setY(data.y);
  movePlayer.setR(data.r);
  
  this.broadcast.emit("move player", {
    id: movePlayer.id,
    x: movePlayer.getX(),
    y: movePlayer.getY(),
    r: movePlayer.getR()
  });
}

function onUpdatePlayerHealth(data) {
  var player = playerById(this.id);
  if (!player) {
    console.log("Player not found: " + this.id);
    return;
  }
  player.health = data.health;
}

function onRemoveMonster(data) {
  var removedMonster = monsterById(data.id);
  if (!removedMonster) {
    console.log("Monster not found: " + data.id);
    return;
  }
  
  monsters.splice(monsters.indexOf(removedMonster), 1);
  this.broadcast.emit("remove monster", data);
}

function onHurtMonster(data) {
  var hurtMonster = monsterById(data.id);
  if (!hurtMonster) {
    console.log("Monster not found: " + data.id);
    return;
  }
  hurtMonster.health--;
  this.broadcast.emit("hurt monster", data);
}
function removeProjectile(projectile) {
  projectiles.splice(projectiles.indexOf(projectile), 1);
}
function onNewProjectile(projectile) {
  projectiles.push(projectile);
  this.broadcast.emit("new projectile", projectile);
  setTimeout(function() {
    removeProjectile(projectile);
  }, 1500);
}
function onRemoveProjectile(projectile) {
  this.broadcast.emit("remove projectile", projectile);
}

/**************************************************
** MAIN LOOP
**************************************************/
var monstersController = new MonstersController(monsters, players);
var interval = setInterval(function() {
  if (clients <= 0) return;
  var newMonsters = monstersController.getRandomMonsters();
  var newMonster, i;
  for (i = newMonsters.length - 1; i >= 0; i--) {
		newMonster = newMonsters[i];
		io.sockets.emit("new monster", {
		  id: newMonster.id,
		  x: newMonster.getX(),
		  y: newMonster.getY(),
		  health: newMonster.getHealth(),
		  moveType: newMonster.moveType,
		  speed: newMonster.speed
		});
		monsters.push(newMonster);
	}

  var monstersAttack = monstersController.updateAll();
  var existingMonster;
  for (i = monsters.length - 1; i >= 0; i--) {
		existingMonster = monsters[i];
		io.sockets.emit("update monster", {
		  id: existingMonster.id,
		  x: existingMonster.getX(),
		  y: existingMonster.getY(),
      aimX: existingMonster.getAimX(),
      aimY: existingMonster.getAimY()
		});
	}
	for (i = monstersAttack.length - 1; i >= 0; i--) {
	  io.sockets.emit("new projectile", {
		  origin: {
		    id: monstersAttack[i].id,
		    remote: false,
		    attack: monstersAttack[i].attack
		  }
	  });
	}
}, 250);

/**************************************************
** GAME HELPER FUNCTIONS
**************************************************/
// Find player by ID
function playerById(id) {
	var i = players.length - 1;
	for (i; i >= 0; i--) {
		if (players[i].id === id)
			return players[i];
	}
	return false;
}
function monsterById(id) {
	var i = monsters.length - 1;
	for (i; i >= 0; i--) {
		if (monsters[i].id === id)
			return monsters[i];
	}
	return false;
}

// init
app.listen(8000);