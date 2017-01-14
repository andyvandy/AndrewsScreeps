/*
Note that the order in which the class is listed determines it's priority since creep creation is aborted in the spawn is busy
    
    For levels 1 and 2 only use peasants

    For level 3, phase in harvesters so that the haulers will have conainters ready for them, 
        also phase in upgraders so that that the harvesters' energy is not wasted
    
    Phase 4 incorporates mineral harvesters

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
    run: function (room_name,phase){
        //control the creation of new creeps

        //if the room is not mine, just pass
        if(Game.rooms[room_name].controller===undefined){
            return 1;
        }else if(!Game.rooms[room_name].controller.my){
            return 1;
        }


        // TODO set this up for multiple spawns
        var spawn=_.filter(Game.spawns,(s) => {return s.pos.roomName == room_name;})[0];
        if (spawn===undefined){
            // this is the case for a freshly claimed room
            return; 
        }
        var spawned= false; // use this to prevent multiple spawn orders
        
        if(phase==1){
           spawned=this.phaseOne(room_name,spawn);
        }
        else if(phase==2){
            spawned=this.phaseTwo(room_name,spawn);
        }
        else if(phase==3){
            spawned=this.phaseThree(room_name,spawn);
        }
        else if(phase==4){
            spawned=this.phaseFour(room_name,spawn);
        }

        //spawn creeps that are flag designated for this room
        if (!spawned){
            spawned=this.satellite(room_name,room_name); // sneaky;)
        }


        // spawn creeps for satellite rooms
        if (!spawned){
            //query for cyan flags
            var cyanFlags = Game.rooms[room_name].find(FIND_FLAGS,{filter: (f) => {return (f.color ==COLOR_CYAN); }});
            
             var spawned=false;

            // for each dependent room build their stuff
            for (var i in cyanFlags){
                if (spawned){
                    break;
                }
                if ((cyanFlags[i].secondaryColor == COLOR_RED) && (phase >2)){
                    // a cyan/red flag indicates that this remote room should be mined
                    // satelliteRemoteMine requires a storage so only phase 3 and up rooms will call this function
                    spawned=this.satelliteRemoteMine(cyanFlags[i].name,room_name);
                }
                if (spawned){
                    break;
                }
                spawned=this.satellite(cyanFlags[i].name,room_name);
            } 
        }

    },
    phaseOne:function(room_name,spawn){
        //this is the first phase of a room and only uses peasants
        //TODO implement spawned in the peasant class
        var spawned= false;
        var peasants = _.sum(Game.creeps, (c) => c.memory.role == 'peasant' && c.memory.home == room_name);
        
        if (peasants <(Game.rooms[room_name].controller.level*6) ){
            rolePeasant.create(spawn);
        }
        return spawned;

    },
    phaseTwo:function(room_name,spawn){
        //phase two phases in harvesters and some basic road construction, it's kind of efficient
        var spawned = false
        var sourceflags = Game.rooms[room_name].find(FIND_FLAGS,{filter: (f) => {return (f.color ==COLOR_RED && f.secondaryColor == COLOR_RED);}});
        for (var sourceflag in sourceflags){
            var harvester = _.sum(Game.creeps, (c) => c.memory.role == 'harvester' && (c.memory.source ==sourceflags[sourceflag].name));
            if (!harvester && !spawned){
                spawned=roleHarvester.create(spawn,[sourceflags[sourceflag].name]);
            }
        }
        // the peasants will take from the containers
        var peasants = _.sum(Game.creeps, (c) => c.memory.role == 'peasant' && c.memory.home == room_name );
        //check the room controller level, if it is less than a set amount, build peasants
        if ((peasants <10) &&!spawned){
            spawned=rolePeasant.create(spawn);
        }
        return spawned;
    },
    phaseThree:function(room_name,spawn){
        //phase three introduces haulers builders and upgraders as well as more roads
        var spawned= false;
        //query for relevant flags
        var sourceflags = Game.rooms[room_name].find(FIND_FLAGS,{filter: (f) => {return (f.color ==COLOR_RED && f.secondaryColor == COLOR_RED); }});
        var storageflags = Game.rooms[room_name].find(FIND_FLAGS,{filter: (f) => {return (f.color ==COLOR_WHITE&& f.secondaryColor == COLOR_WHITE); }});
        
        // build allocators based on the number of extensions and age of youngest allocator
        // TODO implement more complicated logic
        var allocators = _.sum(Game.creeps, (c) => (c.memory.role == 'allocator')&& (c.memory.home ==room_name));
        
        if((allocators<2 )&&!spawned) {
            spawned= roleAllocator.create(spawn);
            spawned= true;//TODO figure this out
        }

        // build haulers and harvesters
        //check to see if there is a storage container available
        var storage = Game.rooms[room_name].lookForAt(LOOK_STRUCTURES,storageflags[0]);
        for (var sourceflag in sourceflags){
            // we don't count the number of haulers directly because then if I want an extra hauling job for a container it would ruin this
            var harvester = _.sum(Game.creeps, (c) => c.memory.role == 'harvester' && c.memory.source ==sourceflags[sourceflag].name);
            var hauler = _.sum(Game.creeps, (c) => c.memory.role == 'hauler' && c.memory.source ==sourceflags[sourceflag].name);
            if (!harvester && !spawned){
                spawned=roleHarvester.create(spawn,[sourceflags[sourceflag].name]);
            }
            if (!hauler && storage.length &&!spawned){
                spawned=roleHauler.create(spawn,["hauler","blank","blank",sourceflags[sourceflag].name,storageflags[0].name]);
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
        var storedEnergy= Game.rooms[room_name].find(FIND_STRUCTURES, {filter: (s)=> s.structureType==STRUCTURE_STORAGE})[0].store[RESOURCE_ENERGY];
        if (storedEnergy>750000){
            var additionalUpgraders=3;
        }
        else if (storedEnergy>500000){
            var additionalUpgraders=2;
        }
        else if (storedEnergy>250000){
            var additionalUpgraders=1;
        }else{
            var additionalUpgraders=0;
        }
        if((upgraders<(1+additionalUpgraders))&&!spawned) {
            roleUpgrader.create(spawn , "placeholderTODO");
            spawned=true;
        }
        return spawned;
    },

    phaseFour:function(room_name,spawn){
        // phase 4 builds off of phase three but introduces extractors
        var spawned= false;
        spawned= this.phaseThree(room_name,spawn);

        //query red/yellow flags which mark a mineral site
        var mineralflags = Game.rooms[room_name].find(FIND_FLAGS,{filter: (f) => {return (f.color ==COLOR_RED && f.secondaryColor == COLOR_YELLOW); }});
        var storageflags = Game.rooms[room_name].find(FIND_FLAGS,{filter: (f) => {return (f.color ==COLOR_WHITE&& f.secondaryColor == COLOR_WHITE); }});

        var storage = Game.rooms[room_name].lookForAt(LOOK_STRUCTURES,storageflags[0]);

        for (var mineralflag in mineralflags){
            // we don't count the number of haulers directly because then if I want an extra hauling job for a container it would ruin this
            var harvester = _.sum(Game.creeps, (c) => c.memory.role == 'harvester' && c.memory.source ==mineralflags[mineralflag].name);
            var hauler = _.sum(Game.creeps, (c) => c.memory.role == 'hauler' && c.memory.source ==mineralflags[mineralflag].name);
            if (!harvester && !spawned){
                spawned=roleHarvester.create(spawn,[mineralflags[mineralflag].name]);
            }
            if (!hauler && storage.length &&!spawned){
                spawned=roleHauler.create(spawn,["hauler","blank","blank",mineralflags[mineralflag].name,storageflags[0].name]);
            }
        }
        return spawned;
    },

    satellite: function(room_name,parent){
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
    satelliteRemoteMine:function(room_name,parent){
        // check the red flags in the satelite room and spawn harvesters and haulers accordingly.
        // need to have visibility of the room!!!
        var spawn=_.filter(Game.spawns,(s) => {return s.pos.roomName == parent;})[0];
        var spawned=false;

        //storage flags are from the parent room while the source flags are from the satellite room
        var sourceflags =  _.filter(Game.flags, f => (f.pos.roomName ==room_name)&&(f.color ==COLOR_RED) );
        var storageflags = Game.rooms[parent].find(FIND_FLAGS,{filter: (f) => {return (f.color ==COLOR_WHITE); }});


        var storage = Game.rooms[parent].lookForAt(LOOK_STRUCTURES,storageflags[0]);
        for (var sourceflag in sourceflags){
            var harvester = _.sum(Game.creeps, (c) => c.memory.role == 'harvester' && c.memory.source ==sourceflags[sourceflag].name);
            var hauler = _.sum(Game.creeps, (c) => c.memory.role == 'hauler' && c.memory.source ==sourceflags[sourceflag].name);
            if (!harvester && !spawned){
                spawned=roleHarvester.create(spawn,[sourceflags[sourceflag].name]);
            }
            if (!hauler && storage.length && !spawned){
                spawned=roleHauler.create(spawn,["hauler","blank","blank",sourceflags[sourceflag].name,storageflags[0].name]);
            }
        }
        return spawned;
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


