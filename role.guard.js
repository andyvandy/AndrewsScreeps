/*
    The Guard will be created with a flag for where to station itself
    The Guard's memory :
        -flag: unique identifier and location of where to guard
    
*/
var role_proto = require('prototype.role');

var roleGuard = {
    
    parts: [[TOUGH,TOUGH,ATTACK,MOVE,MOVE,MOVE]],

    // TODO make a helper function for finding the costs
    costs: [250],


    create: function(spawn,info) {
        if (!!spawn.spawning){
            // since it returns null otherwise
            //skip this if the spawn is busy
            return;
        }
        memory={spawn:spawn.name,
                home:spawn.room.name,
                role: "guard",
                work:Game.flags[info.join("_")].pos.roomName,
                flag:info.join("_")};
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

    run:function(){
        // the guard guards my rooms so I'm only going to look for hostile creeps
        var creep= this.creep;

        this.getOffEdge();

        var creep= this.creep;
        if (!this.gotoroom(creep.memory.work)){
            return 0;
        }
        var closestHostile = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
        
        if(creep.getActiveBodyparts(HEAL) && (creep.hits<0.4*creep.hitsMax) ){
                creep.heal(creep);
        }
        if(closestHostile){
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
            movement_result= creep.moveTo(closestHostile,{maxRooms:1});
        }else if (Game.tick%3!=0){
            // this is to make the guard kill creeps that are bouncing back and forth
            //TODO fix this
            creep.moveTo(Game.flags[creep.memory.flag]);
        }

    }
};

module.exports=roleGuard;