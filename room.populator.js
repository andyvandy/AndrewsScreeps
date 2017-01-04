/*
Note that the order in which the class is listed determines it's priority since creep creation is aborted in the spawn is busy
    
    For levels 1 and 2 only use peasants

    For level 3, phase in harvesters so that the haulers will have conainters ready for them, 
        also phase in upgraders so that that the harvesters' energy is not wasted
    

    SATELITE ROOMS:
        -use a cyan flag with the room name
        -place blue flags with the role_num_options in the satelite room


TODO:
    -make the spawns multi roomed
    -implement a spawn queue
*/

var role_proto = require('prototype.role');

var rolePeasant = require('role.peasant');
var roleHarvester = require('role.harvester');
var roleHauler = require('role.hauler');
var roleUpgrader = require('role.upgrader');
var roleAllocator = require('role.allocator');
var roleBuilder = require('role.builder');



var roomPopulator = {
    run: function (room_name,parent){
        //control the creation of new creeps

        //if the room is not mine, just pass
        if(Game.rooms[room_name].controller===undefined){
            return 1;
        }

        // defaults to itself if not passed
        if (parent === undefined) {
            var parent = room_name;
        }

        // TODO set this up for multiple spawns
        var spawn=_.filter(Game.spawns,(s) => {return s.pos.roomName == parent;})[0];
        var spawned= false; // use this to prevent multiple spawn orders
        
        if(Game.rooms[room_name].controller.level <3){
            var peasants = _.sum(Game.creeps, (c) => c.memory.role == 'peasant' );
            //check the room controller level, if it is less than a set amount, build peasants
            if (peasants <(Game.rooms[room_name].controller.level*7) ){
                rolePeasant.create(spawn);
            }
        }
        else if(Game.rooms[room_name].controller.level <5){
            //otherwise if the rome controller is level 3
            var sourceflags = Game.rooms[room_name].find(FIND_FLAGS,{filter: (f) => {return (f.color ==COLOR_RED);}});
            for (var sourceflag in sourceflags){
                var harvester = _.sum(Game.creeps, (c) => c.memory.role == 'harvester' && (c.memory.source ==sourceflags[sourceflag].name));
                if (!harvester && !spawned){
                    roleHarvester.create(spawn,sourceflags[sourceflag].name);
                    spawned=true;
                }
            }
            // the peasants will take from the containers
            var peasants = _.sum(Game.creeps, (c) => c.memory.role == 'peasant' );
            //check the room controller level, if it is less than a set amount, build peasants
            if ((peasants <10) &&!spawned){
                rolePeasant.create(spawn);
                spawned=true;
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
            if((allocators<1 )&&!spawned) {
                roleAllocator.create(spawn);
                spawned=true;
            }

            // build haulers and harvesters
            //check to see if there is a storage container available
            var storage = Game.rooms[room_name].lookForAt(LOOK_STRUCTURES,storageflags[0]);
            for (var sourceflag in sourceflags){
                var harvester = _.sum(Game.creeps, (c) => c.memory.role == 'harvester' && c.memory.source ==sourceflags[sourceflag].name);
                var hauler = _.sum(Game.creeps, (c) => c.memory.role == 'hauler' && c.memory.source ==sourceflags[sourceflag].name);
                if (!harvester && !spawned){
                    roleHarvester.create(spawn,sourceflags[sourceflag].name);
                    spawned= true;
                }
                if (!hauler && storage.length &&!spawned){
                    roleHauler.create(spawn,sourceflags[sourceflag].name,storageflags[0].name);
                    spawned= true;
                }
            }
            

            // build builders based on the number of construction sites
            var builders = _.sum(Game.creeps, (c) => c.memory.role == 'builder'&& c.memory.home ==room_name);
            var numContructionSites = Game.rooms[room_name].find(FIND_CONSTRUCTION_SITES).length;
            if(((10*builders)<numContructionSites) &&!spawned) {
                roleBuilder.create(spawn);
                spawned=true;

            }

            // build upgraders based on the amount of reserves present
            var upgraders = _.sum(Game.creeps, (c) => c.memory.role == 'upgrader'&& c.memory.home ==room_name);
            if((upgraders<2)&&!spawned) {
                roleUpgrader.create(spawn , "placeholderTODO");
                spawned=true;
            }
        }  

        // spawn creeps for satelite rooms
        if (!spawned){
            //query for cyan flags
            var cyanFlags = Game.rooms[room_name].find(FIND_FLAGS,{filter: (f) => {return (f.color ==COLOR_CYAN); }});
            
             var spawned=false;

            // for each dependent room build their stuff
            for (var i in cyanFlags){
                if (spawned){
                    break;
                }
                spawned=this.satelite(cyanFlags[i].name,room_name);
            } 
        }

    },
    satelite: function(room_name,parent){
        // check the flags in the satelite room and spawn units accordingly.
        var spawn=_.filter(Game.spawns,(s) => {return s.pos.roomName == parent;})[0];
        var spawned=false;

        //query for blue flags
        var blueFlags = _.filter(Game.flags, f => (f.pos.roomName ==room_name)&&(f.color ==COLOR_BLUE) );
        for (var i in blueFlags){
            if(spawned){
                continue;
            }

            var info= blueFlags[i].name.split("_");
            var role= info[0];
            var exists = _.filter(Game.creeps, (c)=> (c.memory.flag ==blueFlags[i].name) );
            if (exists.length){
                continue;
            }
            if(this.roleExists(role)){
                role = this.getRole(role);
            }
            var role = Object.create(role);
           
            try {  spawned = role.create(spawn,info); } catch(e) { 
                console.log(room_name+" satelite spawn error with role "+ info[0] +": " + e.stack);
            };

        }
        if (spawned){
            return true;
        }
        else{
            return false
        }

    },

    roleExists: function(role){
        try
        {
            require("role." + role);
            return true;
        }
        catch(e)
        {
            console.log("role exist error"+e);
            return false;
        }
    },

    getRole: function(role){
        if(!this.roleExists(role))
            return false;
        var roleObject = require("role." + role);
        roleObject = Object.assign( role_proto,roleObject);
        return roleObject;
    },
};


module.exports = roomPopulator;