var roomPopulator = require('room.populator');
var roomPlanner = require('room.planner');
var taskMaster = require('task.master');
var towerController = require('tower.controller');
var status = require('status');




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
    //spawn creeps
    if(Game.time % 3=== 0 ){
        // run this every once in a while to save cpu
        //count the peasants, and build new ones as needed
        for( var room in Game.rooms){
            try {roomPopulator.run(room);} catch(e){
                console.log("Room populator error in room: "+room );
                console.log(e);
            };
        }
    }
    // place buildings
    if(Game.time % 50 === 5 ){
        for( var room in Game.rooms){
            try {roomPlanner.run(room);} catch(e){
                console.log("Room planner error in room: "+room );
                console.log(e);
            };
        }
    }

    // make each creep perform their task
    taskMaster.run();
    
};
