/*
    this is a temp barbarian class to take out the player "mar"
    
*/
var role_proto = require('prototype.role');

var roleBarbarian = {
    
    parts: [[TOUGH,TOUGH,TOUGH,ATTACK,MOVE,MOVE,MOVE,MOVE]],

    // TODO make a helper function for finding the costs
    costs: [310],


    create: function(spawn,params) {
        if (!!spawn.spawning){
            // since it returns null otherwise
            //skip this if the spawn is busy
            return;
        }
        memory={spawn:spawn.name,
                home:spawn.room.name,
                role: "barbarian",
                job: "deploying",
                checkpoint:0,
                squad: params[0],
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
            console.log("building a "+memory.role +" named " +name + " for room " + memory.home);
            spawn.createCreep(body, name,memory);
        }
    },   

    run:function(){
        // the guard guards my rooms so I'm only going to look for hostile creeps
        var creep= this.creep;

        if(creep.memory.job=="deploying"){
            creep.say("deploying");
            this.deploy();
        }
        else if(creep.memory.job=="missioning"){
            this.barbarise();
        }
    },
    barbarise:function(){
        // go forth and do what a barbarian does!

        this.getOffEdge();
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
            creep.moveTo( Game.flags[creep.memory.squad +"_" + creep.memory.checkpoint+"_FINAL" ]);
        }
    }
};

module.exports=roleBarbarian;