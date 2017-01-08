/*
    The Upgrader will be created with a flag for where to withdraw energy
    The Upgrader has two states: 
        -upgrading : spending resources on upgrading the room controller
        -fetching : getting resources from the assigned source
    The Upgrader's memory has one flag
        -withdraw: name of the flag on which the container or storage from which the upgrader should withdraw is on
    
    TODO:
    -currently the upgrader will take resources from the closest available container which is at least 10% full rather than from a specific container
*/
var role_proto = require('prototype.role');

var roleUpgrader = {
    
    parts: [[WORK,WORK,CARRY,MOVE],
            [WORK,WORK,WORK,CARRY,MOVE,MOVE],
            [WORK,WORK,WORK,WORK,WORK,WORK,CARRY,MOVE,MOVE,MOVE]],

    // TODO make a helper function for finding the costs
    costs: [300,450,800],

    create: function(spawn,withdrawflag){
        if (!!spawn.spawning){
            // since it returns null otherwise
            //skip this if the spawn is busy
            return;
        }
        memory={spawn:spawn.name,
                home:spawn.room.name,
                role: "upgrader",
                job:"fetching",
                withdraw:withdrawflag};
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
    run:function() {
        var creep= this.creep;
        //determine what task the creep should be doing

        // the upgrader should lay roads
        this.layroads();

        if((creep.memory.job=="upgrading") && (creep.carry.energy == 0)) {
            creep.memory.job="fetching";
            creep.say('picking up');
        }
        if((creep.memory.job=="fetching") && (creep.carry.energy == creep.carryCapacity)) {
            creep.memory.job="upgrading";
            creep.say('upgrading');
        }

        //perform the current task
        if(creep.memory.job=="fetching"){
            this.fetch();
        }else if(creep.memory.job=="upgrading"){
            this.upgrade();
        }
    },

    fetch: function(){
        var creep= this.creep;
        var target = creep.pos.findClosestByRange(FIND_STRUCTURES, {
                        filter: (structure) => {
                            return ((structure.structureType == STRUCTURE_CONTAINER||
                                    structure.structureType == STRUCTURE_STORAGE) && 
                                    (structure.store[RESOURCE_ENERGY] > (0.01* structure.storeCapacity)));
                        }});
        if(target){
            if(creep.withdraw(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                creep.moveTo(target,{maxRooms:1});
            }
        }
    },

    upgrade: function(){
        var creep= this.creep;
        if(creep.upgradeController(creep.room.controller) == ERR_NOT_IN_RANGE) {
            creep.moveTo(creep.room.controller,{maxRooms:1});// beware ,{maxRooms:1} is legacy code
        }
    }

};

module.exports = roleUpgrader;