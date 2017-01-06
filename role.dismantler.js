/*
   this is just a temporary dismantler code 
    
*/
var role_proto = require('prototype.role');

var roleDismantler = {
    
    parts: [[WORK,WORK,WORK,WORK,WORK,MOVE,MOVE,MOVE,MOVE,MOVE],
            [TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,WORK,WORK,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,WORK,WORK,WORK]],

    // TODO make a helper function for finding the costs
    costs: [750,1050],

    create: function(spawn,info) {
        if (!!spawn.spawning){
            // since it returns null otherwise
            //skip this if the spawn is busy
            return true;
        }
        memory={spawn:spawn.name,
                home:spawn.room.name,
                role: "dismantler",
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
            return true;
        }
        return false;
    },   


    run: function() {
        var creep = this.creep;
        if(!creep.spawning){
            if (!this.gotoroom(creep.memory.work)){
                return 0;
            }
            // check for hostiles in current room, engage them if there are
            var enemy_tower = creep.pos.findClosestByRange(FIND_HOSTILE_STRUCTURES,{filter: (str) => str.structureType == STRUCTURE_SPAWN});
            var closestStr = creep.pos.findClosestByRange(FIND_HOSTILE_STRUCTURES,{filter: (str) => (str.structureType != STRUCTURE_CONTROLLER) && (str.structureType != STRUCTURE_WALL) && (str.structureType == STRUCTURE_EXTENSION||str.structureType == STRUCTURE_STORAGE)});

            //var wall =Game.getObjectById("5843ee8b466ac8e20a8c2e31"); 
            var wall= creep.room.lookForAt(LOOK_STRUCTURES, Game.flags[creep.memory.flag].pos);
            
            if(wall.length){
                wall=wall[0];
                console.log(wall);
                dis_result=creep.dismantle(wall);
                if( dis_result== ERR_NOT_IN_RANGE){
                    creep.moveTo(wall);
                }else if (dis_result!= OK){
                    console.log("dismantler error " +dis_result);
                }
            }
            else if(enemy_tower){
                if(creep.dismantle(enemy_tower) == ERR_NOT_IN_RANGE){
                    movement_result= creep.moveTo(enemy_tower);
                    if (movement_result == -2){// no path available, destroy the flagged wall
                        //var target_breach = _.filter( Game.flags , (f) => (f.room.name==creep.room.name)&& (f.color == COLOR_GREEN));
                        

                        }
                        

                    }
            }
            else if(closestStr){
                if(creep.dismantle(closestStr) == ERR_NOT_IN_RANGE){
                    movement_result= creep.moveTo(closestStr);
                }
            }
        }
    }
};

module.exports= roleDismantler;