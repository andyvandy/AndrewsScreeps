/*
	This class exist to make creeps go and recycle themselves

*/



var roleGarbage={
	
	run:function(){
		//finds the closest spawn and try to recycle itself
		var creep = this.creep;
		var closestSpawn= creep.pos.findClosestByRange(FIND_STRUCTURES , {filter: (s) => s.structureType==STRUCTURE_SPAWN });
		if (closestSpawn){
			if(closestSpawn.recycleCreep(creep)==ERR_NOT_IN_RANGE){
				creep.moveTo(closestSpawn);
			}
		}
	}

};

module.exports= roleGarbage;