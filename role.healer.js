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
            [TOUGH,TOUGH,TOUGH,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,HEAL,HEAL,HEAL,HEAL,MOVE],
            [TOUGH,TOUGH,TOUGH,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,HEAL,HEAL,HEAL,HEAL,HEAL,MOVE]],

    costs: [600,780,1380,1680],

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
                squad: params[0],
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
        else if(creep.memory.job=="missioning"){
        	this.escort();
        }


    },
    escort: function(){
    	// heal nearby allies, prioritize self.
    	// the healers should follow non healer creeps\
    	//TODO make sure they can handle civilians ect
    	var creep=this.creep;

    	//preserve self
    	if (creep.hits < creep.hitsMax){
    		this.retreat();
    		return;
    	}
    	if( !this.gotoroom( Game.flags[creep.memory.squad +"_" + creep.memory.checkpoint+"_FINAL" ].pos.roomName ) ){
            return 0;
        }

    	var damagedAlly= creep.pos.findClosestByRange(FIND_MY_CREEPS, (c)=> c.hits<c.hitsMax && c.memory.role != "healer");
    	var closestHealthyAlly= creep.pos.findClosestByRange(FIND_MY_CREEPS, (c)=>  c.memory.role != "healer");
    	
    	if (damagedAlly){
    		creep.moveTo(damagedAlly);
    		creep.heal(damagedAlly);
    	}else if(closestHealthyAlly){
    		creep.moveTo(closestHealthyAlly);
    	}else{
    		this.retreat()
    	}
    },
    retreat:function(){
    	// retreat to previous checkpoint and heal self
    	var creep=this.creep;
    	if(creep.getActiveBodyparts(HEAL) && (creep.hits<creep.hitsMax) ){
                creep.heal(creep);
        }
        creep.moveTo(Game.flags[creep.memory.squad+"_"+(creep.memory.checkpoint-1)]);
    }


};

module.exports= roleHealer;