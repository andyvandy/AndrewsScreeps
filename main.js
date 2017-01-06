var roomBrains = require('room.brains');
var taskMaster = require('task.master');
var towerController = require('tower.controller');
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

    //Control my towers
    var towers = _.filter(Game.structures, (s)=> s.structureType== STRUCTURE_TOWER);
    for(var s in towers) {    
        var tower= towers[s];
        towerController.run(tower);
    }
    
    // ----control rooms
   
    for( var room in Game.rooms){
        roomBrains.run(room);
    }

    // make each creep perform their task
    taskMaster.run();
    
};
