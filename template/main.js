cc.game.onStart = function(){
  if (!cc.sys.isNative && document.getElementById("cocosLoading")) {
    document.body.removeChild(document.getElementById("cocosLoading"));
  }

  _designSize = cc.size(800, 480);//cc.size(480, 800);
  var screenSize = cc.view.getFrameSize();
  
  cc.SPRITE_DEBUG_DRAW =  0;

  if (!cc.sys.isNative && screenSize.height < 800){
    _designSize = cc.size(800, 480); //cc.size(320, 480);
    cc.loader.resPath = "res/Normal";
  } else {
    cc.loader.resPath = "res/HD";
  }
  cc.view.setDesignResolutionSize(_designSize.width, _designSize.height, cc.ResolutionPolicy.SHOW_ALL);

  //load resources
  cc.LoaderScene.preload(g_resources, function () {
    cc.director.runScene(new MyScene());
  }, this);
};
cc.game.run();