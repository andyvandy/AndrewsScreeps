/*
    The Guard will be created with a flag for where to station itself
    The guard is primarily menat to deal with NPCs

    The Guard's memory :
        -flag: unique identifier and location of where to guard
    Notes:
        - the guard will only spawn after there hasn't been an attack for some time ( it assumes a harvest rate of 20 energy/tick)
    
*/
var role_proto = require('prototype.role');

var roleGuard = {
    
    parts: [[TOUGH,TOUGH,ATTACK,MOVE,MOVE,MOVE],
            [TOUGH,TOUGH,TOUGH,MOVE,MOVE,MOVE,MOVE,MOVE,ATTACK,ATTACK],
            [TOUGH,TOUGH,TOUGH,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,ATTACK,ATTACK,ATTACK,ATTACK,MOVE]],
            //[TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,MOVE,MOVE,MOVE,MOVE,ATTACK,ATTACK,ATTACK,ATTACK],
            //[TOUGH,TOUGH,TOUGH,MOVE,MOVE,MOVE,MOVE,ATTACK,ATTACK,ATTACK,ATTACK,HEAL],
            //[TOUGH,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,ATTACK,ATTACK,ATTACK,ATTACK,HEAL]],

    // TODO make a helper function for finding the costs
    costs: [250,440,700],//,600,800,880],


    create: function(spawn,params) {
        if (!!spawn.spawning){
            // since it returns null otherwise
            //skip this if the spawn is busy
            return true;
        }
        memory={spawn:spawn.name,
                home:spawn.room.name,
                role: "guard",
                work:Game.flags[params.join("_")].pos.roomName,
                flag:params.join("_")};

        if (Memory[memory.work].defense.lastAttack!= undefined){
            var numSources = _.sum(Game.flags, (f) => f.pos.roomName ==Game.flags[memory.work].pos.roomName && f.color == COLOR_RED && f.secondaryColor == COLOR_RED )
            if (numSources<3 && (Game.time -Memory[memory.home].defense.lastAttack)<3500 && Memory[memory.home].defense.defcon==0 ){
                console.log("too soon since last attack!");
                return false;
            }
        }

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
            return true;
        }
        return false;
    },   

    run:function(){
        // the guard guards my rooms so I'm only going to look for hostile creeps
        var creep= this.creep;

        this.getOffEdge();
        if (!this.gotoroom(creep.memory.work,safely=true)){
            return 0;
        }

        var creep= this.creep;
        var closestHostile = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS,{filter: (c)=>  !(_.contains(Memory.allies,c.owner.username))});
        
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
        }else if ((Game.time%3) !=0){
            // this is to make the guard kill creeps that are bouncing back and forth
            //TODO fix this
            creep.moveTo(Game.flags[creep.memory.flag]);
        }

        if(!closestHostile &&(creep.getActiveBodyparts(HEAL) && (creep.hits<0.4*creep.hitsMax))){
            creep.heal(creep);
        }

    }
};

module.exports=roleGuard;