/*
    The peasant is to be used for low room controller levels

*/
var role_proto = require('prototype.role');

var rolePeasant = {
    rolePeasant.prototype =role_proto,
    
    parts= [[WORK,CARRY,MOVE]],

    create: function(spawn) {
        memory={spawn:spawn.name,
                home:spawn.room.name,
                role: "peasant",
                job:"harvesting"};
        var num= 1;
        var name= memory.role+num;
        while(spawn.canCreateCreep(body,name)=== ERR_NAME_EXISTS){
            num+=1;
            name= memory.role+num;
        }
        memory.num=num;
        if(spawn.canCreateCreep(body,name) == OK){
            console.log("building a "+memory.role +" named " +name + "for room " + memory.home);
            spawn.createCreep(body, name,memory);
        }
    },
    /** @param {Creep} creep **/
    run: function() {
        var creep= this.creep;
        //control what job the peasant does
        if((creep.memory.job == "harvesting")&&(this.creep.carry.energy == this.creep.carryCapacity) ){
            creep.memory.job = "spending";
            creep.say("Spending time!");
        }
        else if((creep.memory.job == "spending")&&(this.creep.carry.energy == this.creep.carryCapacity)){
            creep.memory.job = "harvesting";
            creep.say("Harvest time!");
        }

        if(creep.memory.job == "harvesting")){
            var sources = creep.pos.find(FIND_SOURCES);
            var target = sources[creep.memory.num%2];
            var construction_site = creep.pos.findClosestByRange(FIND_CONSTRUCTION_SITES);


            result= creep.harvest(target);
                    if (result== ERR_NOT_IN_RANGE){
                        creep.moveTo(target);
                    }
                    else if (result!= OK){
                        if (Memory.verbose){console.log("peasant harvesting error:" +result);}
                    }
        }else{ // only other option is spending
            // first check if the spawn is full?
            if(Game.spawns[creep.memory.spawn] < 300){
                if(creep.transfer(Game.spawns[creep.memory.spawn], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                        creep.moveTo(Game.spawns[creep.memory.spawn]);
                    }

            }else if( (creep.memory.num %2 ==0 )&&(construction_site) ){
                //half will be builders
                if(creep.build(construction_site) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(construction_site);
                }
                
            }else{
                // if nothing to build and spawn is full, upgrade the controller
                if(creep.upgradeController(creep.room.controller) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(creep.room.controller);
                }
            }
        }
    }

    
};

module.exports = rolePeasant;