/*
	The healer is a military creep whose job it is to heal other party members.
	
    The healer has the following states: 
        -deploying : the healer is heading to the checkpoint
        -escorting : the healer is escorting their squad to complete their mission
        -idling: the creep is awaiting further instructions
	
	The healer's memory is structured as follows:
		-spawn: spawn name
		-job: the creep's current task
		-checkpoint: the creeps current checkpoint #(if deploying)
		-military: true , boolean value to identify combat creeps
		-squad: the creep's squad

    NOTES:
       

    TODO:
       
*/

var roleHealer = {

	parts: [[HEAL,HEAL,MOVE,MOVE],
            [TOUGH,TOUGH,TOUGH,MOVE,MOVE,MOVE,MOVE,HEAL,HEAL,MOVE],
            [TOUGH,TOUGH,TOUGH,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,HEAL,HEAL,HEAL,HEAL,MOVE]],

    costs: [600,780,1380],

	create:function(spawn,params){
		if (!!spawn.spawning){
            // since it returns null otherwise
            //skip creating this creep if the spawn is busy
            return true;
        }
        memory={spawn:spawn.name,
                role: "healer",
                job:"deploying",
                checkpoint:0,
                military:true,
                squad: params[3],
                flag:params.join("_")};
        var num= 1;
        var name= memory.role+num;

        var body = this.parts[ this.costs.indexOf(_.max(this.costs.filter((c) => {return (c<spawn.room.energyCapacityAvailable);})))];
        
        while(spawn.canCreateCreep(body,name)=== ERR_NAME_EXISTS){
            num+=1;
            name= memory.role+num;
        }
        memory.num=num;
        if(spawn.canCreateCreep(body,name) == OK){
            console.log("building a "+memory.role +" named " +name +" in "+ memory.home+ " for sqaud " + memory.squad);
            spawn.createCreep(body, name,memory);
            return true;
        }
        return false;
	},

	run: function(){
        var creep= this.creep;


        if(creep.memory.job=="deploying"){
        	this.deploy();
        }
        else if(creep.memory.job=="escorting"){
        	this.escort();
        }


    },
    deploy: function(){
    	// deploy to the current checkpoint
    	var creep=this.creep;
    	var checkpointFlag= Game.flags[Memory.squads.checkpoints[0]];
    	creep.moveTo(checkpointFlag);
    	if (creep.pos.inRangeTo(checkpointFlag,5) ){
    		creep.say("reached!");
    		creep.memory.job="idling";
    	}
    },
    escort: function(){
    	// heal nearby allies, prioritize self.
    	var creep=this.creep;
    	
    }


};

module.exports= roleHealer;