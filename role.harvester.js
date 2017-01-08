/*
    The harvester will be created with a flag in mind on which to build a container and mine
    

*/
var role_proto = require('prototype.role');

var roleHarvester = {
    
    parts: [[WORK,CARRY,MOVE],
            [WORK,WORK,CARRY,MOVE,MOVE],
            [WORK,WORK,WORK,WORK,CARRY,MOVE,MOVE],
            [WORK,WORK,WORK,WORK,WORK,WORK,CARRY,MOVE,MOVE,MOVE]],

    // TODO make a helper function for finding the costs
    costs: [200,350,550,800],

    create: function(spawn,params) {
        if (!!spawn.spawning){
            // since it returns null otherwise
            //skip this if the spawn is busy
            return true;
        }
        var flag = params.join("-");
        memory={spawn:spawn.name,
                home:spawn.room.name,
                role: "harvester",
                job:"harvesting",
                source:flag};
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
    run:function() {
        var creep= this.creep;

        // set up a road network  since the harvester should have a predictable path
        // need to ignore terrain due to this
        this.layroads();
        //determine which task the creep should be doing
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
        }
        else{
            this.spend()
        }
    },
    harvest : function(){
        var creep= this.creep;
        if( creep.pos.isEqualTo(Game.flags[creep.memory.source])){
            var source = creep.pos.findClosestByRange(FIND_SOURCES);
            result= creep.harvest(source);
            if (result!= OK){
                if (Memory.verbose){console.log("harvesting error:" +result);} 
            }
        }
        else{
            creep.moveTo(Game.flags[creep.memory.source]);
        }
    },
    spend : function(){
        //the harvester will drop energy if the container is full
        var creep= this.creep;
        var my_container=creep.room.lookForAt(LOOK_STRUCTURES,Game.flags[creep.memory.source]).filter((structure) =>{return structure.structureType ==STRUCTURE_CONTAINER;}) 
        if(!(my_container.length)){
            // don't filter for containers in case there is a road, that way the road will get build and then the conatiner will too, I think..
            var site =creep.room.lookForAt(LOOK_CONSTRUCTION_SITES,Game.flags[creep.memory.source]);
            if(!(site.length)){
                creep.room.createConstructionSite(Game.flags[creep.memory.source].pos,STRUCTURE_CONTAINER);
            }else{
                var result= creep.build(site[0]);
                if(result != OK){
                     if (Memory.verbose){console.log(result);}
                }
            }
        }
        else{
            if (my_container[0].hits<150000){
                //repair the container so it doesn't despawn
                if(creep.repair(my_container[0])){
                    creep.moveTo(my_container[0]);
                }

            }else{
                var result= creep.transfer(my_container[0], RESOURCE_ENERGY)
                if(result == ERR_NOT_IN_RANGE) {
                    creep.moveTo(my_container[0]);
                }else if(result!= OK){
                    if (Memory.verbose){
                        console.log("transfering error " +result);
                        console.log(my_container);
                    }
                    if(result== ERR_FULL){
                        creep.drop(RESOURCE_ENERGY);
                    }
                }
            }
        }
    }
};


module.exports = roleHarvester;