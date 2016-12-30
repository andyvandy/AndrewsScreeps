/*
    The hauler will be created with a flag for where to deposit and a flag for where to withdraw
    The hauler has two states: 
        -hauling : bringing resources back the the deposit
        -fetching : getting resources from the assigned source
*/
var role_proto = require('prototype.role');

var roleHauler = {
    
    parts: [[CARRY,CARRY,MOVE],
            [CARRY,CARRY,CARRY,CARRY,MOVE,MOVE],
            [CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE]],

    // TODO make a helper function for finding the costs
    costs: [150,300,600],

    //TODO make the hauler size scale based off of path length not available energy capacity
    create: function(spawn,sourceflag,depositflag){
        memory={spawn:spawn.name,
                home:spawn.room.name,
                role: "hauler",
                job:"fetching",
                source:sourceflag,
                deposit:depositflag};
        var num= 1;
        var name= memory.role+num;
        var body = parts[ costs.filter((c) => {return c<spawn.room.energyCapacityAvailable;}).indexOf(Math.max(...arr))];
        
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
        var creep = this.creep;
        if((creep.memory.job== "hauling" )&& (creep.carry.energy == 0)) {
            creep.memory.job = "fetching";
            creep.say('picking up');
        }
        if((creep.memory.job== "fetching") && (creep.carry.energy == creep.carryCapacity)) {
            creep.memory.job = "hauling";
            creep.say('hauling');
        }

        if(creep.memory.job== "hauling"){
            roleHauler.hauling();
        }
        else if(creep.memory.job== "fetching"){
            roleHauler.fetching();
        }
    },

    hauling: function(){
        var creep = this.creep;
        var targets=creep.room.lookForAt(LOOK_STRUCTURES,Game.flags[creep.memory.deposit]).filter(
                                    (structure) =>{return (structure.structureType ==STRUCTURE_CONTAINER) ||
                                                            (structure.structureType ==STRUCTURE_STORAGE) ;});
            if(targets[0]){
                if(creep.transfer(targets[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(targets[0]);
                }
            }else{
                //hauler is in a different room
                creep.moveTo(Game.flags[creep.memory.deposit]);
            }
    },

    fetching: function(){
        var creep = this.creep;
        var targets=creep.room.lookForAt(LOOK_RESOURCES,Game.flags[creep.memory.source]);
        if (targets.length){
            result=creep.pickup(targets[0]);
            if(result == ERR_NOT_IN_RANGE) {
                creep.moveTo(targets[0]);
            }
        }
        var targets=creep.room.lookForAt(LOOK_STRUCTURES,Game.flags[creep.memory.source]).filter((structure) =>{return structure.structureType ==STRUCTURE_CONTAINER;});
        if(targets[0]){
            result=creep.withdraw(targets[0], RESOURCE_ENERGY);
            if(result == ERR_NOT_IN_RANGE) {
                creep.moveTo(targets[0]);
            }
        }
        else{
            // the container is in a different room
            creep.moveTo(Game.flags[creep.memory.source]);
        }
    }


};

module.exports = roleHauler;