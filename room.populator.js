/*
Note that the order in which the class is listed determines it's priority since creep creation is aborted in the spawn is busy
    
    For levels 1 and 2 only use peasants

    For level 3, phase in harvesters so that the haulers will have conainters ready for them, 
        also phase in upgraders so that that the harvesters' energy is not wasted

TODO:
    -make the spawns multi roomed
    -implement a spawn queue
*/

var rolePeasant = require('role.peasant');
var roleHarvester = require('role.harvester');
var roleHauler = require('role.hauler');
var roleUpgrader = require('role.upgrader');
var roleAllocator = require('role.allocator');
var roleBuilder = require('role.builder');



var roomPopulator = {
    run: function (room_name){
        //control the creation of new creeps

        //determine whcih spawner to use TODO
        var spawn= Game.spawns.Spawn1;

        
        if(Game.rooms[room_name].controller.level <3){
            var peasants = _.sum(Game.creeps, (c) => c.memory.role == 'peasant' );
            //check the room controller level, if it is less than a set amount, build peasants
            if (peasants <8 ){
                rolePeasant.create(Game.spawns.Spawn1);
            }
        }
        else if(Game.rooms[room_name].controller.level <5){
            //otherwise if the rome controller is level 3
            var sourceflags = Game.rooms[room_name].find(FIND_FLAGS,{filter: (f) => {return (f.color ==COLOR_RED);}});
            for (var sourceflag in sourceflags){
                var harvester = _.sum(Game.creeps, (c) => c.memory.role == 'harvester' && (c.memory.source ==sourceflags[sourceflag].name));
                if (!harvester){
                    roleHarvester.create(spawn,sourceflags[sourceflag].name);
                }
            }

            // TODO check which sources have space for peasants and harvesters
            var peasants = _.sum(Game.creeps, (c) => c.memory.role == 'peasant' );
            //check the room controller level, if it is less than a set amount, build peasants
            if (peasants <6 ){
                rolePeasant.create(Game.spawns.Spawn1);
            }
        }
        else{
            //otherwise if the rome controller is level 4 or higher
            //query for relevant flags
            var sourceflags = Game.rooms[room_name].find(FIND_FLAGS,{filter: (f) => {return (f.color ==COLOR_RED); }});
            var storageflags = Game.rooms[room_name].find(FIND_FLAGS,{filter: (f) => {return (f.color ==COLOR_WHITE); }});
            
            // build allocators based on the number of extensions and age of youngest allocator
            // TODO implement more complicated logic
            var allocators = _.sum(Game.creeps, (c) => c.memory.role == 'allocator'&& c.memory.home ==room_name);
            if(allocators<1) {
                roleAllocator.create(spawn);
            }

            // build haulers and harvesters
            //check to see if there is a storage container available
            var storage = Game.room[room_name].lookForAt(LOOK_STRUCTURES,storageflags[0]);
            for (var sourceflag in sourceflags){
                var harvester = _.sum(Game.creeps, (c) => c.memory.role == 'harvester' && c.memory.source ==sourceflags[sourceflag].name);
                var hauler = _.sum(Game.creeps, (c) => c.memory.role == 'hauler' && c.memory.source ==sourceflags[sourceflag].name);
                if (!harverter){
                    roleHarvester.create(spawn,sourceflags[sourceflag].name);
                }
                if (!hauler && storage.length){
                    roleHauler.create(spawn,sourceflags[sourceflag].name,storageflags[0].name);
                }
            }
            

            // build builders based on the number of construction sites
            var builders = _.sum(Game.creeps, (c) => c.memory.role == 'builder'&& c.memory.home ==room_name);
            var numContructionSites = _.sum(Game.rooms[room_name].find(FIND_CONSTUCTION_SITES));
            if((10*builders)<numContructionSites) {
                roleBuilder.create(spawn);

            }

            // build upgraders based on the amount of reserves present
            var upgraders = _.sum(Game.creeps, (c) => c.memory.role == 'upgrader'&& c.memory.home ==room_name);
            if(upgraders<1) {
                roleUpgrader.create(spawn , "placeholderTODO");
            }
        }  
    }
};


module.exports = roomPopulator;