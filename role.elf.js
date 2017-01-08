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
        -target: the elf's target to repair until fully healed or out of resources
    
    Notes:
        -the elf should repair structures that are below 70% until they are 95% healed
        - the elf prioritizes repairs over other jobs

*/

var role_proto = require('prototype.role');

var roleElf = {
    parts: [[WORK,CARRY,MOVE],
            [WORK,WORK,CARRY,CARRY,MOVE,MOVE]],

    costs: [200,400],

    create: function(spawn,params){
        if (!!spawn.spawning){
            // since it returns null otherwise
            //skip creating this creep if the spawn is busy
            return true;
        }
        memory={spawn:spawn.name,
                home:spawn.room.name,
                role: "elf",
                job:"fetching",
                work:Game.flags[params.join("_")].pos.roomName,
                flag:params.join("_")};
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

        this.getOffEdge();
        //send the elf to it's room
        if (!this.gotoroom(creep.memory.work)){
            return 0;
        }

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
            creep.say(":scooter:");
            this.fetch();
        }
        else if(creep.memory.job=="idling"){
            creep.say(":sleeping:");
            this.idle();
        }
        else if(creep.memory.job=="fixing"){
            creep.say(":hammer:");
            this.fix();
        }
        else if(creep.memory.job=="building"){
            creep.say(":hammer_pick:");
            this.build();
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
        var decrepitBuilding = creep.pos.findClosestByRange(FIND_STRUCTURES,
                        {filter: (structure) => (structure.hitsMax*0.7 >=structure.hits)&&(structure.structureType!= STRUCTURE_CONTROLLER) }  );
        var constructionSite=creep.pos.findClosestByRange(FIND_CONSTRUCTION_SITES)
        if (decrepitBuilding){
            creep.memory.job="fixing";
            creep.memory.target= decrepitBuilding.id;
            creep.say("fixing!");
        }
        else if(constructionSite){
            creep.memory.job="building";
            creep.memory.target= constructionSite.id;
            creep.say("building!");
        }
    },

    fix:function(){
        // the elf fixes the target until they run out of energy or the target is full health
        var creep = this.creep;
        var target = Game.getObjectById(creep.memory.target);
        var fix_result=creep.repair(target);
        if (fix_result==ERR_NOT_IN_RANGE){
            creep.moveTo(target,{maxRooms:1});
        }
        if(target.hits==target.hitsMax){
            //I'm assuming this is from the structure being full healed
            creep.memory.job="idling";
            // TODO check that it's fine that I leave the old target id, this is to save on cpu
        }
    },
    build: function(){
        //the elf builds the target until they run out of energy or the structure is complete
        var creep = this.creep;

        var target = Game.getObjectById(creep.memory.target);
        var build_result=creep.build(target);
        if(build_result == ERR_NOT_IN_RANGE) {
            creep.moveTo(target,{maxRooms:1});
        }
        else if(build_result == ERR_INVALID_TARGET){
            //will again assum this means the structure has been completed
            creep.memory.job="idling";
        }
    }
    



};

module.exports = roleElf;