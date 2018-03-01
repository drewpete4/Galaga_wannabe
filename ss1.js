/**
 * Define an object to hold all our images for the game so images
 * are only ever created once. This type of object is known as a
 * singleton.
 */

var imageRepository = new function () {
    // Define images
    this.background = new Image();

    //Set images src
    this.background.src = 'imgs/bg.png'
}