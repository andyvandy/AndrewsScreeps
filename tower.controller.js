/*
    The towers will keep a reserve of 300 to only be used if under attack

    The towers prioritize walls and ramparts differently than other buildings
    
    NOTES:
        - towers will only expand walls if they have 600 energy or more so that they don't let ramparts die
    TODO:
        - make the towers have different health quotas at different phases
*/
var towerController = {

    /** @param {Tower} tower **/
    run: function(tower) {
        var intruder= tower.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
        var safeMode= (tower.room.controller.safeMode != undefined);
        if(intruder && !safeMode){
            console.log("INTRUDER IN "+ tower.room.name+"!!!");
            result= tower.attack(intruder);
            if (result!= OK){
                console.log("tower error: " + result);
            }
        }
        else if( tower.energy >300){
            // basically so that the ramparts don't despawn
            var lowRampart= tower.pos.findClosestByRange(FIND_STRUCTURES,{
                filter: (s)=> (s.hits <1000) && (s.structureType == STRUCTURE_RAMPART)});
            
            var target = tower.pos.findClosestByRange(FIND_STRUCTURES, {
                    filter: (structure) => {
                        return  structure.hitsMax*0.9>=structure.hits && 
                                (structure.structureType != STRUCTURE_WALL) &&
                                (structure.structureType != STRUCTURE_CONTROLLER) &&
                                 ((structure.structureType != STRUCTURE_RAMPART)|| (structure.hits < 2000)) ;
                    }
            }); 
            var wall = tower.pos.findClosestByRange(FIND_STRUCTURES, {
                    filter: (structure) => {
                        return  structure.hitsMax*0.9>=structure.hits && 
                                (structure.structureType != STRUCTURE_CONTROLLER) &&
                                ((structure.structureType != STRUCTURE_WALL)|| (structure.hits < 100000)) &&
                                 ((structure.structureType != STRUCTURE_RAMPART)|| (structure.hits < 100000)) ;
                    }
            });        
            
            if(lowRampart){
                result=tower.repair(lowRampart);
                if(result != OK){
                    console.log(result); // no clue when this would happen
                    }
            }
            else if(target) {
                result=tower.repair(target);
                if(result != OK){
                    console.log(result); // no clue when this would happen
                    }
            }
            else if(wall&& tower.energy >600 && Memory[tower.room.name].phase>2){
                // don't waste energy on brand new rooms
                result=tower.repair(wall);
                if(result != OK){
                    console.log(result); 
                    }
            }
        }
        
    }
};

module.exports = towerController;


