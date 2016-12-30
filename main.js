var rolePeasant = require('role.peasant');
var role_proto = require('prototype.role');
var roomPopulator = require('room.populator');





module.exports.loop = function () {

    // handle memory
    // stolen from https://github.com/Kendalor/screeps/blob/master/default/main.js 
    for(var name in Memory.creeps) {
        if(!Game.creeps[name]) {
            delete Memory.creeps[name];
            console.log('Clearing non-existing creep memory:', name);
        }
    }

        
    if(Game.time % 10 === 0 ){
        // run this every once in a while to save cpu
        //count the peasants, and build new ones as needed
        for( var room in Game.rooms){
            try {roomPopulator.run(room);} catch(e){
                console.log("Room populator error in room: "+room );
                console.log(e);
            };
        }
    }


    for(var name in Game.creeps) {
        var creep = Game.creeps[name];
        if(creep.memory.role == 'peasant') {
            //credit to https://github.com/Garethp/Screeps/blob/master/performRoles.js
            if(creep.spawning || creep.memory.role == undefined || (creep.memory.active !== undefined && !creep.memory.active))
                continue;
            var job = Object.assign(role_proto,rolePeasant);
            //job.prototype=role_proto;
            job.setCreep(creep);
            try { job.run(); } catch(e) { 
                console.log("peasant error: " + e);
             };
        }
    }
};
