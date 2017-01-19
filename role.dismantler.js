/*
   this is just a temporary dismantler code 
    
*/
var role_proto = require('prototype.role');

var roleDismantler = {
    
    parts: [[WORK,WORK,WORK,WORK,WORK,MOVE,MOVE,MOVE,MOVE,MOVE],
            [TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,WORK,WORK,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,WORK,WORK,WORK],
            [TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,WORK,WORK,WORK,WORK,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,WORK,WORK,WORK],
            [TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,WORK,WORK,WORK,WORK,WORK,WORK,WORK,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,WORK,WORK,WORK]],

    // TODO make a helper function for finding the costs
    costs: [750,1050,1650,2100],

    create: function(spawn,params) {
        if (!!spawn.spawning){
            // since it returns null otherwise
            //skip this if the spawn is busy
            return true;
        }
        memory={spawn:spawn.name,
                role: "dismantler",
                job: "deploying",
                checkpoint:0,
                military:true,
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
            return true;
        }
        return false;
    },   


    run: function() {
        var creep = this.creep;
        if(creep.memory.job=="deploying"){
            this.deploy();
        }
        else if(creep.memory.job=="missioning"){
            this.dismantle();
        }
    },
    dismantle:function(){
        var creep = this.creep;
        var enemy_spawn = creep.pos.findClosestByRange(FIND_HOSTILE_STRUCTURES,{filter: (str) => str.structureType == STRUCTURE_SPAWN});
        var closestStr = creep.pos.findClosestByRange(FIND_HOSTILE_STRUCTURES,{filter: (str) => (str.structureType != STRUCTURE_CONTROLLER) && (str.structureType != STRUCTURE_WALL) && (str.structureType == STRUCTURE_EXTENSION||str.structureType == STRUCTURE_STORAGE||str.structureType == STRUCTURE_TOWER)});

        if (creep.hits<0.5* creep.hitsMax){
            this.retreat();
            return;
        }
        if (creep.memory.breach!=undefined && Game.getObjectById(creep.memory.breach)!= null){
            // fixed bug since getObjectById returns null and not undefined
            var breach= Game.getObjectById(creep.memory.breach);
            if (creep.dismantle(breach)==ERR_NOT_IN_RANGE){
                        creep.moveTo(breach);
                    }
        }
        else if(enemy_spawn){
            if(creep.dismantle(enemy_spawn) == ERR_NOT_IN_RANGE){
                var movement_result;
                if(creep.memory.breach === undefined ||Game.getObjectById(creep.memory.breach) === undefined){
                    movement_result= creep.moveTo(enemy_spawn);
                }
                if ( Game.getObjectById(creep.memory.breach) != undefined ||movement_result == -2){// no path available, destroy the closest wall
                    // look for flags first
                    creep.say("breaching");
                    var breach = Game.flags[creep.memory.squad + "_"+creep.memory.checkpoint+"_FINAL"].pos.findClosestByRange(FIND_STRUCTURES,{filter: (str) => str.structureType == STRUCTURE_WALL});
                    creep.memory.breach= breach.id;
                    if(!breach){
                        var breach = creep.pos.findClosestByRange(FIND_STRUCTURES,{filter: (str) => str.structureType == STRUCTURE_WALL});
                    }
                    console.log("breaching "+breach );
                    if (creep.dismantle(breach)==ERR_NOT_IN_RANGE){
                        creep.moveTo(breach);
                    }
                }
            }
        }
        else if(closestStr){
            if(creep.dismantle(closestStr) == ERR_NOT_IN_RANGE){
                movement_result= creep.moveTo(closestStr);
            }
        }else{
            creep.moveTo( Game.flags[creep.memory.squad +"_" + creep.memory.checkpoint+"_FINAL" ]);
            //the following is temporary
            if(creep.pos.isEqualTo(Game.flags[creep.memory.squad +"_" + creep.memory.checkpoint+"_FINAL" ])  ){
                Game.flags["ALPHA_E76N12_E78N13"].setColor(COLOR_BROWN,COLOR_CYAN);
            }
        }

    }
};

module.exports= roleDismantler;