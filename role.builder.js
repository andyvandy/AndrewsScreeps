/*
    The Builder Takes energy from storage and builds, the builder is only spawned when there are contruction sites present
    
    The Builder has two states: 
        -building : spending resources to build a consturction site
        -fetching : getting resources from the an appropriate source

    The Builder's memory has no flags
    
    Notes:
        -the builder does not repair so that I don't use this class as a crutch

*/
var role_proto = require('prototype.role');

var roleBuilder = {

    parts: [[WORK,CARRY,MOVE],
            [WORK,WORK,CARRY,CARRY,MOVE,MOVE],
            [WORK,WORK,CARRY,CARRY,MOVE,CARRY,CARRY,MOVE,MOVE]],

    // TODO make a helper function for finding the costs
    costs: [200,400,550],

    create: function(spawn){
        if (!!spawn.spawning){
            // since it returns null otherwise
            //skip creating this creep if the spawn is busy
            return;
        }
        memory={spawn:spawn.name,
                home:spawn.room.name,
                role: "builder",
                job:"fetching"};
        var num= 1;
        var name= memory.role+num;

        var body = this.parts[ this.costs.indexOf(_.max(this.costs.filter((c) => {return (c<spawn.room.energyCapacityAvailable);})))];
        
        while(spawn.canCreateCreep(body,name)=== ERR_NAME_EXISTS){
            num+=1;
            name= memory.role+num;
        }
        memory.num=num;
        if(spawn.canCreateCreep(body,name) == OK){
            console.log("building a "+memory.role +" named " +name + " for room " + memory.home);
            spawn.createCreep(body, name,memory);
        }
    },

    run: function(){
        var creep= this.creep;

        //determine the creep's task
        if((creep.memory.job=="building") && creep.carry.energy == 0) {
            creep.memory.job="fetching";
            creep.say('withdrawing');
        }
        if((creep.memory.job=="fetching") &&(   (creep.carry.energy == creep.carryCapacity)||(creep.carry.energy >=100)   )) {
            creep.memory.job="building";
            creep.say('building');
        }

        // perform the creep's assigned task
        if(creep.memory.job=="building"){
            this.build();
        }
        else if(creep.memory.job=="fetching"){
            this.fetch();
        }

    },

    fetch: function(){
        //the builder should scavenge loose energy off the ground
        //the builder doesn't empty containers or storages
        var creep = this.creep;


        var money = creep.pos.findClosestByRange(FIND_DROPPED_ENERGY);
        var target = creep.pos.findClosestByRange(FIND_STRUCTURES, {
                filter: (structure) => {
                    return ((structure.structureType == STRUCTURE_CONTAINER||
                            structure.structureType == STRUCTURE_STORAGE) && 
                            (structure.store[RESOURCE_ENERGY] > (0.01* structure.storeCapacity)));
                }});
        if(money){
            result= creep.pickup(money);
        
            if( result== ERR_NOT_IN_RANGE) {
                creep.moveTo(money,{maxRooms:1});
            }else if(result!=OK){
                console.log("builder pickup error: " +result); 
            }
        }
        else if(target){
            result= creep.withdraw(target, RESOURCE_ENERGY);
            if( result== ERR_NOT_IN_RANGE) {
                creep.moveTo(target,{maxRooms:1});
            }else if(result!=OK){
                console.log("builder withdraw error: " +result);
            }
        }
    },

    build: function(){
        //just build the closest structure
        var creep = this.creep;

        var target = creep.pos.findClosestByRange(FIND_CONSTRUCTION_SITES);
        if(target) {
            if(creep.build(target) == ERR_NOT_IN_RANGE) {
                creep.moveTo(target,{maxRooms:1});
            }
        }

    }





};

module.exports = roleBuilder;