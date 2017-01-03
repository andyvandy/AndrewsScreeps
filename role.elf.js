/*
    The elf is a house elf like in Harry Potter. It exists to do little mainteance task in satelite rooms
    
    The elf has the following states: 
        -building : spending resources to build a consturction site
        -idling: the creep has resources and is awaiting a job
        -fetching : getting resources from the an appropriate source
        -fixing : repairing a structure

    The elf's memory consits of the following:
        -job: the elf's current job
        -work: the room the elf lives in
        -flag: the elf's unique identifier
    
    Notes:
        -the elf should repair structures that are below 70% until they are 95% healed
        - the elf prioritizes repairs over other jobs

*/

var role_proto = require('prototype.role');

var roleElf = {
    parts: [[WORK,CARRY,MOVE]],

    costs: [200],

    create: function(spawn){
        if (!!spawn.spawning){
            // since it returns null otherwise
            //skip creating this creep if the spawn is busy
            return true;
        }
        memory={spawn:spawn.name,
                home:spawn.room.name,
                role: "elf",
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
            console.log("building a "+memory.role +" named " +name +" in "+ memory.home+ " for room " + memory.work);
            spawn.createCreep(body, name,memory);
            return true;
        }
        return false;
    },

    run: function(){
        var creep= this.creep;

        //determine the creep's task
        if((creep.memory.job!="fetching") && creep.carry.energy == 0) {
            creep.memory.job="fetching";
            creep.say('fetching');
        }
        if((creep.memory.job=="fetching") &&(   (creep.carry.energy == creep.carryCapacity)||(creep.carry.energy >=100)   )) {
            creep.memory.job="idling";
            creep.say('awaiting task');
        }

        // perform the creep's assigned task
        if(creep.memory.job=="fetching"){
            this.fetch();
        }
        else if(creep.memory.job=="idling"){
            this.findWork();
        }

    },
    fetch: function(){
        //the elf should scavenge loose energy off the ground
        var creep = this.creep;

        var money = creep.pos.findClosestByRange(FIND_DROPPED_ENERGY);
        var target = creep.pos.findClosestByRange(FIND_STRUCTURES, {
                filter: (structure) => {
                    return ((structure.structureType == STRUCTURE_CONTAINER) && 
                            (structure.store[RESOURCE_ENERGY] > (0.01* structure.storeCapacity)));
                }});
        if(money){
            result= creep.pickup(money);
        
            if( result== ERR_NOT_IN_RANGE) {
                creep.moveTo(money,{maxRooms:1});
            }else if(result!=OK){
                console.log("elf pickup error: " +result); 
            }
        }
        else if(target){
            result= creep.withdraw(target, RESOURCE_ENERGY);
            if( result== ERR_NOT_IN_RANGE) {
                creep.moveTo(target,{maxRooms:1});
            }else if(result!=OK){
                console.log("elf withdraw error: " +result);
            }
        }
    },

    idle:function(){
        //find a task for the elf
        var creep = this.creep;
    }


};

module.exports = roleElf;