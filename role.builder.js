/*
    The Builder Takes energy from storage and builds, the builder is only spawned when there are contruction sites present
    
    The Builder has two states: 
        -building : spending resources to build a consturction site
        -fetching : getting resources from the an appropriate source

    The builder can be initialized to build in a seperate room but it will still draw energy from its home room
    this is to avoid source keeper issues atm
    
    Notes:
        -the builder does not repair so that I don't use this class as a crutch


*/
var role_proto = require('prototype.role');

var roleBuilder = {

    parts: [[WORK,CARRY,MOVE],
            [WORK,WORK,CARRY,CARRY,MOVE,MOVE],
            [WORK,WORK,CARRY,CARRY,MOVE,CARRY,CARRY,MOVE,MOVE],
            [WORK,WORK,WORK,CARRY,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE,MOVE]],

    // TODO make a helper function for finding the costs
    costs: [200,400,550,1050],

    create: function(spawn,params=[]){
        if (!!spawn.spawning){
            // since it returns null otherwise
            //skip creating this creep if the spawn is busy
            return true;
        }
        memory={spawn:spawn.name,
                home:spawn.room.name,
                role: "builder",
                job:"fetching",
                flag:params.join("_")};

        // this is for long distance builders
        if (memory.flag){
            memory.work=Game.flags[params.join("_")].pos.roomName;
            if(Game.rooms[memory.work]===undefined){
                // if I don't have vision of the room, don't spawn the builder
                return false;
            }
            else if(!Game.rooms[memory.work].find(FIND_CONSTRUCTION_SITES).length){
                //if there aren't any construction sites, don't spawn a builder
                return false;
            }
        }else{
            memory.work=false;
        }

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
            return true;
        }
        return false;
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

        

        // note that the constants FIND_DROPPED_ENERGY and FIND_DROPPED_RESOURCES both equal 106...
        var money = creep.pos.findClosestByRange(FIND_DROPPED_ENERGY ,{filter: (r) => r.resourceType== RESOURCE_ENERGY});
        var target = creep.pos.findClosestByRange(FIND_STRUCTURES, {
                filter: (structure) => {
                    return ((structure.structureType == STRUCTURE_CONTAINER||
                            structure.structureType == STRUCTURE_STORAGE) && 
                            (structure.store[RESOURCE_ENERGY] > (0.01* structure.storeCapacity)));
                }});
        if (creep.memory.work && !!!target && !!!money){// not sure how undefined behaves or if it is returned
            if (!this.gotoroom(creep.memory.home)){
                return 0;
            }
        }
        if(money){
            result= creep.pickup(money);
        
            if( result== ERR_NOT_IN_RANGE) {
                creep.moveTo(money);
            }else if(result!=OK){
                console.log("builder pickup error: " +result); 
            }
        }
        else if(target){
            result= creep.withdraw(target, RESOURCE_ENERGY);
            if( result== ERR_NOT_IN_RANGE) {
                creep.moveTo(target);
            }else if(result!=OK){
                console.log("builder withdraw error: " +result);
            }
        }
    },

    build: function(){
        //just build the closest structure
        var creep = this.creep;

        if (creep.memory.work){
            if (!this.gotoroom(creep.memory.work)){
                return 0;
            }
        }

        var target = creep.pos.findClosestByRange(FIND_CONSTRUCTION_SITES);
        if(target) {
            if(creep.build(target) == ERR_NOT_IN_RANGE) {
                creep.moveTo(target,{maxRooms:1});
            }
        }

    }





};

module.exports = roleBuilder;