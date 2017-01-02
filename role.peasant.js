/*
    The peasant is to be used for low room controller levels

*/
var role_proto = require('prototype.role');

var rolePeasant = {
    
    parts: [[WORK,CARRY,MOVE],
            [WORK,WORK,CARRY,CARRY,MOVE,MOVE]],

    create: function(spawn) {
        if (!!spawn.spawning){
            // since it returns null otherwise
            //skip this if the spawn is busy
            return;
        }
        memory={spawn:spawn.name,
                home:spawn.room.name,
                role: "peasant",
                job:"harvesting"};
        var num= 1;
        var name= memory.role+num;
        var num_peasants = _.sum(Game.creeps, (c) => c.memory.role == 'peasant' && c.memory.home ==memory.home);
        if ((spawn.room.energyCapacityAvailable>=400)&&(num_peasants>0) ){
            var body =this.parts[1];
        }else{
            var body =this.parts[0];
        }
        
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
    /** @param {Creep} creep **/
    run: function() {
        var creep= this.creep;
        //control what job the peasant does
        if((creep.memory.job == "harvesting")&&(this.creep.carry.energy == this.creep.carryCapacity) ){
            creep.memory.job = "spending";
            creep.say("Spending time!");
        }
        else if((creep.memory.job == "spending")&&(this.creep.carry.energy == 0)){
            creep.memory.job = "harvesting";
            creep.say("Harvest time!");
        }

        if(creep.memory.job == "harvesting"){
            this.harvest();
            
        }else{ // only other option is spending
            var construction_site = creep.pos.findClosestByRange(FIND_CONSTRUCTION_SITES);
            var extension = creep.pos.findClosestByRange(FIND_STRUCTURES,{
                                            filter: (structure) => {return ((structure.structureType== STRUCTURE_EXTENSION)&&(structure.energy <50)) ;} }  );
            
            var towers = creep.room.find(FIND_STRUCTURES, {
                filter: (structure) => {
                    return (structure.structureType == STRUCTURE_TOWER) && structure.energy < 0.65*structure.energyCapacity;
                }
            });
            // first check if the spawn is full?
            if(Game.spawns[creep.memory.spawn].energy < 300){

                if(creep.transfer(Game.spawns[creep.memory.spawn], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                        creep.moveTo(Game.spawns[creep.memory.spawn]);
                    }

            }else if(extension){// then check the extensions
                if(creep.transfer(extension, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                        creep.moveTo(extension);
                    }
            }
            else if( (creep.memory.num %2 ==0 )&&(construction_site) ){
                //half will be builders

                if(creep.build(construction_site) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(construction_site);
                }
            }else if( (creep.memory.num %2 ==1 )&&(towers.length)) {
                if(creep.transfer(towers[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(towers[0]);
                }
            }  
            else{
                // if nothing to build and spawn is full, upgrade the controller
                if(creep.upgradeController(creep.room.controller) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(creep.room.controller);
                }
            }
        }
    },

    harvest: function(){
        // if there is a harvester blocking access to the source, the peasant should withdraw from the source
        var creep= this.creep;


        var sources = creep.room.find(FIND_SOURCES);
        var target = sources[creep.memory.num%2];

        // if there is a non-empty container nearby, draw from that rather than trying to mine
        var container = target.pos.findInRange(FIND_STRUCTURES,1, {filter : (s) =>{return (s.structureType== STRUCTURE_CONTAINER)&& (s.store[RESOURCE_ENERGY]>100)  ;}} );
        if (container.length){
            if(creep.withdraw(container[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                creep.moveTo(container[0]);
            }
        }
        else{
            result= creep.harvest(target);
            if (result== ERR_NOT_IN_RANGE){
                creep.moveTo(target);
            }
            else if (result!= OK){
                if (Memory.verbose){console.log("peasant harvesting error:" +result);}
            }
        }
        

    }    
};


module.exports = rolePeasant;