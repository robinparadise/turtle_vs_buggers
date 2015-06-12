EXPLOSIONS = [];

function preCacheExplosions(layer) {
  
  var sharedExplosion = function () {
    var animFrames = [];
    var str = '';
    for (var i = 1; i < 35; i++) {
        str = 'explosion_' + (i < 10 ? ('0' + i) : i) + '.png';
        var frame = cc.spriteFrameCache.getSpriteFrame(str);
        animFrames.push(frame);
    }
    var animation = new cc.Animation(animFrames, 0.04);
    cc.animationCache.addAnimation(animation, 'Explosion');
  }
  
  // Explosions
  cc.spriteFrameCache.addSpriteFrames(res.explosion_plist);
  var explosionTexture = cc.textureCache.addImage(res.explosion_png);
  // Adds a sprite batch node.
  layer._explosions = new cc.SpriteBatchNode(explosionTexture);
  layer._explosions.setBlendFunc(cc.SRC_ALPHA, cc.ONE);
  // Adds spriteSheet in this layer.
  layer.addChild(layer._explosions, 5);
  
  sharedExplosion();
  
}

var Explosion = cc.Sprite.extend({
  tmpWidth: 0,
  tmpHeight: 0,
  active: true,
  animation: null,
  ctor: function () {
    var pFrame = cc.spriteFrameCache.getSpriteFrame('explosion_01.png');
    this._super(pFrame);
    this.setBlendFunc(cc.SRC_ALPHA, cc.ONE);

    this.tmpWidth = this.width;
    this.tmpHeight = this.height;
    this.animation = cc.animationCache.getAnimation('Explosion');
    //this.setPosition(cc.p(200,200));
  },
  play: function () {
    this.setRandomPosition();
    this.runAction(cc.sequence(
      cc.animate(this.animation),
      cc.callFunc(this.destroy, this)
    ));
  },
  destroy: function () {
    this.visible = false;
    this.active = false;
  },
  setRandomPosition: function() {
    this._posX = parseInt(cc.random0To1() * _size.width);
    this._posY = parseInt(cc.random0To1() * _size.height);
    this.setPosition(cc.p(this._posX, this._posY));
  },
  sharedExplosion: function () {
    var animFrames = [];
    var str = '';
    for (var i = 1; i < 35; i++) {
        str = 'explosion_' + (i < 10 ? ('0' + i) : i) + '.png';
        var frame = cc.spriteFrameCache.getSpriteFrame(str);
        animFrames.push(frame);
    }
    var animation = new cc.Animation(animFrames, 0.04);
    cc.animationCache.addAnimation(animation, 'Explosion');
  },
  
  getOrCreateExplosion: function () {
    var selChild = null, j;
    for (j = 0; j < EXPLOSIONS.length; j++) {
      selChild = EXPLOSIONS[j];
      if (!selChild.active) {
        selChild.visible = true;
        selChild.active = true;
        selChild.play();
        return selChild;
      }
    }
    selChild = Explosion.create();
    selChild.play();
    return selChild;
  },
  create: function () {
    var explosion = new Explosion();
    _layer.addExplosions(explosion);
    EXPLOSIONS.push(explosion);
    return explosion;
  },
  
  preSet: function () {
    var explosion = null;
    for (var i = 0; i < 10; i++) {
      explosion = Explosion.create();
      explosion.visible = false;
      explosion.active = false;
    }
  }

});