var towerController = {

    /** @param {Tower} tower **/
    run: function(tower) {
        var intruder= tower.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
        if(intruder){
            console.log("INTRUDER!!!");
            result= tower.attack(intruder);
            if (result!= OK){
                console.log("tower error: " + result);
            }
        }
        else if( tower.energy >300){
            var target = tower.pos.findClosestByRange(FIND_STRUCTURES, {
                    filter: (structure) => {
                        return  structure.hitsMax*0.9>=structure.hits && 
                                (structure.structureType != STRUCTURE_WALL) &&
                                (structure.structureType != STRUCTURE_CONTROLLER) &&
                                 ((structure.structureType != STRUCTURE_RAMPART)|| (structure.hits < 20000)) ;
                    }
            }); 
            var wall = tower.pos.findClosestByRange(FIND_STRUCTURES, {
                    filter: (structure) => {
                        return  structure.hitsMax*0.9>=structure.hits && 
                                (structure.structureType != STRUCTURE_CONTROLLER) &&
                                ((structure.structureType != STRUCTURE_WALL)|| (structure.hits < 40)) &&
                                 ((structure.structureType != STRUCTURE_RAMPART)|| (structure.hits < 200000)) ;
                    }
            });        
            
            if(target) {
                result=tower.repair(target);
                if(result != OK){
                    console.log(result); // no clue when this would happen
                    }
            }
            else if(wall){
                result=tower.repair(wall);
                if(result != OK){
                    console.log(result); 
                    }
            }
        }
        
    }
};

module.exports = towerController;