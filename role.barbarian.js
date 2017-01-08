/*
    this is a temp barbarian class to take out the player "mar"
    
*/
var role_proto = require('prototype.role');

var roleBarbarian = {
    
    parts: [[ATTACK,ATTACK,ATTACK,MOVE,MOVE,MOVE]],

    // TODO make a helper function for finding the costs
    costs: [390],


    create: function(spawn,info) {
        if (!!spawn.spawning){
            // since it returns null otherwise
            //skip this if the spawn is busy
            return;
        }
        memory={spawn:spawn.name,
                home:spawn.room.name,
                role: "barbarian",
                work:Game.flags[info.join("_")].pos.roomName,
                flag:info.join("_")};
        var num= 1;
        var name= memory.role+num;
        var body = this.parts[ this.costs.indexOf(_.max(this.costs.filter((c) => {return (c<=spawn.room.energyCapacityAvailable);})))];
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

    run:function(){
        // the guard guards my rooms so I'm only going to look for hostile creeps
        var creep= this.creep;

        this.getOffEdge();

        var creep= this.creep;
        if (!this.gotoroom(creep.memory.work)){
            //todo this won't work for barbarians, maybe for guards
            return 0;
        }
        var enemySpawn = creep.pos.findClosestByRange(FIND_HOSTILE_STRUCTURES,{filter: (str) => str.structureType == STRUCTURE_SPAWN });
        var closestHostile = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
        
        if(creep.getActiveBodyparts(HEAL) && (creep.hits<0.4*creep.hitsMax) ){
                creep.heal(creep);
        }

        if(enemySpawn){
            creep.say('Sorry!');
            if(creep.attack(enemySpawn) == ERR_NOT_IN_RANGE){
                movement_result= creep.moveTo(enemySpawn,{maxRooms:1});
                if (movement_result == OK){
                    if(creep.getActiveBodyparts(HEAL) && (creep.hits<creep.hitsMax) ){
                        creep.heal(creep);
                    }
                }
                else if (movement_result == -2){
                    // no path available, have to break a wall...
                    creep.moveTo(enemySpawn, {ignoreDestructables: true});
                }
            }
        }
        else if(closestHostile){
            creep.say('Attack!');
            if(creep.attack(closestHostile) == ERR_NOT_IN_RANGE){
                movement_result= creep.moveTo(closestHostile,{maxRooms:1});
                if (movement_result == OK){
                    if(creep.getActiveBodyparts(HEAL) && (creep.hits<creep.hitsMax) ){
                        creep.heal(creep);
                    }
                }
                else if (movement_result == -2){
                    // no path available, have to break a wall...
                    creep.moveTo(closestHostile, {ignoreDestructables: true});
                }
            }
        }else{
            creep.moveTo(Game.flags[creep.memory.flag]);
        }

    }
};

module.exports=roleBarbarian;