var rolePeasant = require('role.peasant');
var roleHarvester = require('role.harvester');
var roleHauler = require('role.hauler');


//TODO make the spawns multi roomed

var roomPopulator = {
    run: function (room_name){
        //control the creation of new creeps

        //check the room controller level, if it is less than 4, build peasants
        if(Game.rooms[room_name].controller.level <5){
            var peasants = _.sum(Game.creeps, (c) => c.memory.role == 'peasant' );
            if (peasants <8 ){
                rolePeasant.create(Game.spawns.Spawn1);
            }
        }//otherwise if the rom controller is above level 3
        else{
            // build haulers and harvesters
            var sourceflags = Game.rooms[room].find(FIND_FLAGS,{fiter: (f) => {return f.color ==COLOR_RED;}})
            var storageflags = Game.rooms[room].find(FIND_FLAGS,{fiter: (f) => {return f.color ==COLOR_WHITE;}})
            for (var sourceflag in sourceflags){
                var harvester = _.sum(Game.creeps, (c) => c.memory.role == 'harvester' && c.memory.source ==sourceflag.name);
                var hauler = _.sum(Game.creeps, (c) => c.memory.role == 'hauler' && c.memory.source ==sourceflag.name);
                if (!harverter.length){
                    roleHarvester.create(Game.spawns.Spawn1,sourceflag.name);
                }
                if (!hauler.length){
                    roleHauler.create(Game.spawns.Spawn1,sourceflag.name,storageflags[0].name);
                }
            }
            // build allocators based on the number of extensions and age of youngest allocator

            // build builders based on the number of construction sites

            // build upgraders based on the amount of reserves present

        }  
    }
};


module.exports = roomPopulator;