/**************************************************
** GAME HELPER FUNCTIONS
**************************************************/
var _players = [], _monsters, _projectiles, _socket, _id;
// Find player by ID
function playerById(id) {
	var i = _players.length - 1;
	for (i; i >= 0; i--) {
		if (_players[i].id === id)
			return _players[i];
	}
	return false;
}
function monsterById(id) {
	var i = _monsters.length - 1;
	for (i; i >= 0; i--) {
		if (_monsters[i].id === id)
			return _monsters[i];
	}
	return false;
}
function projectileFind(data) {
	var i = _projectiles.length - 1;
	for (i; i >= 0; i--) {
		if (_projectiles[i].id === data.id && _projectiles[i]._shoots === data._shoots)
			return _projectiles[i];
	}
	return false;
}

var Multiplayer = cc.Class.extend({
  ctor: function (gameLayer) {
    this._layer = gameLayer;
    _socket = this.socket = io("https://turtle-vs-buggers.herokuapp.com");
    this.socket.on("connect", this.onSocketConnected);
    this.socket.on("id", this.setId);
    if (!this.socket.connected) {
      this.socket.connect();
    }
    this.socket.on("disconnect", this.onSocketDisconnect);
    
    this.socket.on("new player", this.onNewPlayer);
    this.socket.on("move player", this.onMovePlayer);
    this.socket.on("remove player", this.onRemovePlayer);
    
    this.socket.on("new monster", this.onNewMonster);
    this.socket.on("new monsters", this.onNewMonsters);
    this.socket.on("remove monster", this.onRemoveMonster);
    this.socket.on("update monster", this.onUpdateMonster);
    this.socket.on("update monsters", this.onUpdateMonsters);
    this.socket.on("hurt monster", this.onHurtMonster);
    
    this.socket.on("new projectile", this.onNewProjectile);
    this.socket.on("remove projectile", this.onRemoveProjectile);
    
    this.socket.on("leader", this.onLeaderScore);
    this.socket.on("scores", this.onScores);
    this.socket.on("game over", this.onGameOver);
    
    _players = this.players = [];
    _monsters = this._layer._monsters = [];
    _projectiles = this._projectiles = [];
  },
  setId: function(data) {
    _id = data.id;
  },
  onSocketConnected: function() {
    cc.log("Connected to socket server:");
    _socket.emit("new player", {
      x: _player.positionX,
      y: _player.positionY,
      r: _player.rotation
    });
  },
  onSocketDisconnect: function() {
    cc.log("Disconnected from socket server");
    _players.splice(0);
    _monsters.splice(0);
    _projectiles.splice(0);
  },
  onNewPlayer: function(data) {
    if (data.id === _id) return;
    cc.log("New player connected: " + data.id);
    // Initialise the new player
  	var newPlayer = new PlayerSprite(PLAYER, {
  	  x: data.x,
  	  y: data.y,
  	  r: data.r,
  	  remote: true
  	});
  	newPlayer.id = data.id;
  	// Add new player to the remote players array
  	_players.push(newPlayer);
  },
  onMovePlayer: function(data) {
    // cc.log("onMovePlayer ...", data);
    var movePlayer = playerById(data.id);
  	// Player not found
  	if (!movePlayer) {
  		cc.log("Player not found: "+data.id);
  		return;
  	}
  	// Update player position
  	movePlayer.setup(data);
  },
  onRemovePlayer: function(data) {
    var removePlayer = playerById(data.id);
  	// Player not found
  	if (!removePlayer) {
  		cc.log("Player not found: " + data.id);
  		return;
  	}
  	// Remove player from array
  	_players.splice(_players.indexOf(removePlayer), 1);
  	removePlayer.removeFromParent();
  },
  onNewMonster: function(data) {
    // var newMonster = monsterById(data.id);
    // if (newMonster) return;
  	newMonster = new MonsterSprite(getMonsterByMove(data.moveType), {
  	  x: data.x,
  	  y: data.y,
  	  aimX: data.aimX,
  	  aimY: data.aimY,
  	  health: data.health,
  	  speed: data.speed,
  	  remote: true
  	});
  	newMonster.id = data.id;
  	// Add new player to the remote players array
  	_monsters.push(newMonster);
  },
  onNewMonsters: function(data) {
    console.log("onNewMonsterS::data_id", this.id);
    var newMonster;
    var i = data.monsters.length - 1;
    for (i; i >= 0; i--) {
      // newMonster = monsterById(data.monsters[i].id);
      // if (newMonster) continue;
    	newMonster = new MonsterSprite(getMonsterByMove(data.monsters[i].moveType), {
    	  x: data.monsters[i].x,
    	  y: data.monsters[i].y,
    	  aimX: data.monsters[i].aimX,
    	  aimY: data.monsters[i].aimY,
    	  health: data.monsters[i].health,
    	  speed: data.monsters[i].speed,
    	  remote: true
    	});
    	newMonster.id = data.monsters[i].id;
    	// Add new player to the remote players array
    	_monsters.push(newMonster);
    }
  },
  onUpdateMonster: function(data) {
    var monster = monsterById(data.id);
    if (monster) {
      monster.setup(data);
    }
  },
  onUpdateMonsters: function(data) {
    var i = data.monsters.length - 1, monster;
    for (i; i >= 0; i--) {
      monster = monsterById(data.monsters[i].id);
      if (monster) {
        monster.setup(data.monsters[i]);
      }
    }
  },
  onRemoveMonster: function(data) {
    var removeMonster = monsterById(data.id);
  	if (!removeMonster) {
  		cc.log("Monster not found: " + data.id);
  		return;
  	}
  	removeMonster.destroy();
  },
  onHurtMonster: function(data) {
    var hurtMonster = monsterById(data.id);
  	if (!hurtMonster) {
  		cc.log("Monster not found: " + data.id);
  		return;
  	}
  	--hurtMonster._health;
  },
  onNewProjectile: function(data) {
    if (data.origin && data.origin.remote) {
      _layer.shoot(_layer.multiplayer, data.origin);
    } else {
      var origin = monsterById(data.origin.id);
      if (origin) {
        _layer.shoot(_layer, origin, _layer._players, data.origin.attack);
      }
    }
  },
  onRemoveProjectile: function(data) {
    var projectile = projectileFind(data);
    if (!projectile) {
  		cc.log("Projectile not found: " + data.id, data._shoots);
  		return;
  	}
    projectile.setPosition(data.x, data.y);
    projectile.autodestroy();
  },
  onLeaderScore: function(data) {
    cc.log("onLeaderScore", data);
    var score;
    if (_id === data.leader.id) {
      score = "You";
    } else {
      score = data.leader.score;
    }
    _layer.scoreLabel.updateLeaderScoreLabel(score);
  },
  onScores: function(data) {
    cc.log("Scores", data);
  },
  onGameOver: function(data) {
    cc.log("onGameOver", data);
    _socket.disconnect();
    _socket.off();
    var config = {
      id: _id,
      bg: cc.color(255,255,255),
      color: cc.color(0,0,0),
      title: "=== Top Highscore ===",
      highscores: data.scores
    };
    cc.director.runScene(new cc.TransitionFade(1, Highscore.scene(config)));
  },
  // ******************************
  // Emitter
  // ******************************
  // PLAYER
  emitMovePlayer: function(data) {
    _socket.emit("move player", data);
  },
  emitUpdatePlayerHealth: function(health) {
    _socket.emit("update player health", {health: health});
  },
  emitDisconnectPlayer: function() {
    _socket.disconnect();
    _socket.off();
  },
  // MONSTER
  emitRemoveMonster: function(data) {
    _socket.emit("remove monster", data);
  },
  emitHurtMonster: function(data) {
    _socket.emit("hurt monster", data);
  },
  // PROJECTILE
  emitNewProjectile: function(remote, origin, targets) {
    _socket.emit("new projectile", {
      origin: {
        id: _id,
        x: origin.position.x,
        y: origin.position.y,
        rotation: origin.rotation,
        _power: origin._power,
        _shoots: origin._shoots,
        _colorShoot: origin._colorShoot,
        _colorExplosion: origin._colorExplosion,
        remote: remote
      }
    });
  },
  emitRemoveProjectile: function(projectile) {
    _socket.emit("remove projectile", {
      id: _id,
      x: projectile._position.x,
      y: projectile._position.y,
      _shoots: projectile.origin._shoots
    });
  }
});


var _multiplayer;
Multiplayer.getInstance = function (layer) {
  if (!_multiplayer) {
    _multiplayer = new Multiplayer(layer);
  }
  return _multiplayer;
};
