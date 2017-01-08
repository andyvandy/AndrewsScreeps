/*
    The starter's role is to go into a room and build it's spawn and level up it's RCL to 2
    
    The starter has the following states: 
        -building : spending resources to build a the spawn
        -fetching : getting resources from the an appropriate source
        -upgrading : upgrading the room controller

    The starter's memory consits of the following:
        -job: the starter's current job
        -work: the room the elf lives in
        -flag: the starter's unique identifier
    
    HOWTO:
        - place a blue flag in the room that says "starter_#"
        -the flag will be removed once the starter has completed their task
    Notes:
        - the elf prioritizes repairs over other jobs

*/



var role_proto = require('prototype.role');

var roleStarter = {
    parts: [[WORK,WORK,CARRY,MOVE,MOVE],
            [WORK,WORK,WORK,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE]],

    costs: [200,600],

    create: function(spawn,params){
        if (!!spawn.spawning){
            // since it returns null otherwise
            //skip creating this creep if the spawn is busy
            return true;
        }
        memory={spawn:spawn.name,
                home:spawn.room.name,
                role: "starter",
                job:"fetching",
                work:Game.flags[params.join("_")].pos.roomName,
                flag:params.join("_")};
        var num= 1;
        var name= memory.role+num;

        var body = this.parts[ this.costs.indexOf(_.max(this.costs.filter((c) => {return (c<=spawn.room.energyCapacityAvailable);})))];
        
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
        if (!this.gotoroom(creep.memory.work)){
            return 0;
        }

        //determine the creep's task
        if((creep.memory.job!="fetching") && creep.carry.energy == 0) {
            creep.memory.job="fetching";
            creep.say('fetching');
        }
        if((creep.memory.job=="fetching") &&(creep.carry.energy == creep.carryCapacity  )) {
            creep.memory.job="building";
            creep.say('awaiting task');
        }

        // perform the creep's assigned task
        if(creep.memory.job=="fetching"){
            this.fetch();
        }
        else if(creep.memory.job=="building"){
            this.build();
        }
        else if(creep.memory.job=="upgrading"){
            this.upgrade();
        }
    },
    fetch: function(){
        // harvest from the nearest source

        var creep= this.creep;
        var source = creep.pos.findClosestByRange(FIND_SOURCES);
        if (creep.harvest(source)== ERR_NOT_IN_RANGE){
            creep.moveTo(source);
        }
    },
    build : function(){
        // build the spawn
        var creep= this.creep;
        var spawn = creep.pos.findClosestByRange(FIND_CONSTRUCTION_SITES, {filter: (s)=>s.structureType==STRUCTURE_SPAWN });
        if (spawn){
            if (creep.build(spawn)== ERR_NOT_IN_RANGE){
                creep.moveTo(spawn);
            }
        }
        else{
            creep.memory.job= "upgrading";
        }
    },
    upgrade: function(){
        var creep= this.creep;
        if(creep.upgradeController(creep.room.controller) == ERR_NOT_IN_RANGE) {
            creep.moveTo(creep.room.controller,{maxRooms:1});// beware ,{maxRooms:1} is legacy code
        }
        if (creep.room.controller.level >1){
            //remove the flag if the creep's mission is accomplished
            if (Game.flags[creep.memory.flag] != undefined){
                Game.flags[creep.memory.flag].remove();
                console.log("mission accomplished for "+ creep.name);
            }
            
            
        }
    }

};

module.exports= roleStarter;