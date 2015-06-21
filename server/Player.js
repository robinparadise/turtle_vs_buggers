var Player = function(data) {
  this.x = data.x || GAME.SIZE.width / 2;
  this.y = data.y || GAME.SIZE.height / 2;
  this.r = data.r;
  
  this.getX = function() {
    return this.x;
  };
  this.getY = function() {
    return this.y;
  };
  this.getR = function() {
    return this.r;
  };
  this.getPosition = function() {
    return {x: this.x, y: this.y};
  };
  this.setX = function(newX) {
    this.x = newX;
  };
  this.setY = function(newY) {
    this.y = newY;
  };
  this.setR = function(newR) {
    this.r = newR;
  };
};

exports.Player = Player;