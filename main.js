var roomBrains = require('room.brains');
var taskMaster = require('task.master');
var squadController = require('squad.controller');
var status = require('status');

/*

    TODO:
        -make the threshold for withdrawing from storage a Memory thing instead of being hardcoded into the roles
*/


module.exports.loop = function () {

    // print out a report periodically
    if(Game.time % 50 === 1 ){
        status.run()
    }

    // handle memory
    // stolen from https://github.com/Kendalor/screeps/blob/master/default/main.js 
    for(var name in Memory.creeps) {
        if(!Game.creeps[name]) {
            delete Memory.creeps[name];
            console.log('Clearing non-existing creep memory:', name);
        }
    }


    //-- control squads
    // print out a report periodically
    if(Game.time % 5 === 1 ){
        squadController.run()
    }
    // ----control rooms
   
    for( var room in Game.rooms){
        roomBrains.run(room);
    }

    // make each creep perform their task
    taskMaster.run();
    
};
