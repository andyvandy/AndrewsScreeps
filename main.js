var rolePeasant = require('role.peasant');





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
        var peasants = _.sum(Game.creeps, (c) => c.memory.role == 'peasant' );
        if (peasants <6 ){
            rolePeasant.create(Game.spawns.Spawn1);
        }
    }


    for(var name in Game.creeps) {
        var creep = Game.creeps[name];
        if(creep.memory.role == 'peasant') {
            //credit to https://github.com/Garethp/Screeps/blob/master/performRoles.js
            if(creep.spawning || creep.memory.role == undefined || (creep.memory.active !== undefined && !creep.memory.active))
                continue;
            var job = Object.create(rolePeasant);
            job.setCreep(creep);
            try { job.run(); } catch(e) { };
        }
    }
};
