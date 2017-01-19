/*
	The squad controller manages creating squads of attacking creeps using one or more spawns and grouping 
	them up before sending off to complete their mission.

	The squad controller uses brown flags with secondary coloursin the following manner:
	secondary:
		-brown : squad name
		-blue : one for each member to be spawned
		-green : checkpoints in the format SQUAD_#_(final)
		-purple : spawn_list
		-orange:  the flag is idle



*/
var utils = require('utils');
var role_proto = require('prototype.role');


var squadController = {
	run:function(){
		// query double brown flags, each squad has one
		var squadFlags= _.filter(Game.flags, (f) => (f.color ==COLOR_BROWN)&&(f.secondaryColor ==COLOR_BROWN) );

		for (let i in squadFlags ){
			this.route(squadFlags[i].name);
			this.muster(squadFlags[i].name);
			this.renewSquad(squadFlags[i].name);
		}
	},
	route: function(squad_name){
		// route the squad through the check points

		// check to see if the whole squad is at the checkpoint
		var squadSize= _.filter(Game.flags, (f) => (f.color ==COLOR_BROWN)&&(f.secondaryColor ==COLOR_BLUE)&&(f.name.split("_")[0]== squad_name) ).length;
		var squadAtCheckpoint= _.filter(Game.creeps, (c) =>  (c.memory.squad == squad_name) &&   (c.memory.job == "idling")); 

		if (squadSize== squadAtCheckpoint.length){
			// send the creeps off to the next checkpoint
			for (var i in squadAtCheckpoint){
				squadAtCheckpoint[i].memory.checkpoint+=1;
				squadAtCheckpoint[i].memory.job= "deploying" ;
			}
		}
	},
	muster:function(squad_name){
		// spawn the creeps that need to be spawned
		var spawnFlag= _.filter(Game.flags, (f) => (f.color ==COLOR_BROWN)&&(f.secondaryColor ==COLOR_PURPLE)&&(f.name.split("_")[0]== squad_name) );
		if (!spawnFlag.length){
			return;
		}
		var spawnRooms = _.drop(spawnFlag[0].name.split("_"),1 ); // drop the element that is the squad's name
		for (let i in spawnRooms){
			var spawn=_.filter(Game.spawns,(s) => {return s.pos.roomName == spawnRooms[i];})[0];
			if (!!!spawn.spawning){ // lol this is hack
				break;
			}
		}
		if (spawn=== undefined){
			return;
		}
		
        var spawned=false;

        //query for blue flags
        var brownBlueFlags = _.filter(Game.flags, (f) => {return (f.color ==COLOR_BROWN)&&(f.secondaryColor ==COLOR_BLUE )&&(f.name.split("_")[0]== squad_name);} );
        for (let i in brownBlueFlags){
            if(spawned){
                continue;
            }

            var params= brownBlueFlags[i].name.split("_");
            var role= params[1];
            var exists = _.filter(Game.creeps, (c)=> (c.memory.flag ==brownBlueFlags[i].name) );
            if (exists.length){
                continue;
            }

            if(utils.roleExists(role)){
                role = utils.getRole(role);
            }
            var role = Object.create(role);
           
            try {  spawned = role.create(spawn,params); } catch(e) { 
                console.log(room_name+" squad spawn error with role "+ params[1] +": " + e.stack);
            };

        }

        if (!spawned){
        	// only do this if not spawning since the creep might be cancelled by a same tick overirde or something
        	var numcreepsinsquad= _.filter(Game.creeps, (c) =>  (c.memory.squad == squad_name) ).length; 
	        var squadSize= _.filter(Game.flags, (f) => (f.color ==COLOR_BROWN)&&(f.secondaryColor ==COLOR_BLUE)&&(f.name.split("_")[0]== squad_name) ).length;
	        if (numcreepsinsquad== squadSize){
	        	// if the squad is fully spawned, stop spawning creep for the squad
	        	spawnFlag[0].setColor(COLOR_BROWN,COLOR_ORANGE);
	        }
        }
        
	},
	renewSquad:function(squad_name){
		// reset the squad to spawn again
		var innactiveSpawnFlag= _.filter(Game.flags, (f) => (f.color ==COLOR_BROWN)&&(f.secondaryColor ==COLOR_ORANGE)&&(f.name.split("_")[0]== squad_name) );
		var numcreepsinsquad= _.filter(Game.creeps, (c) =>  (c.memory.squad == squad_name) ).length;
		if (innactiveSpawnFlag.length &&!numcreepsinsquad){
			innactiveSpawnFlag[0].setColor(COLOR_BROWN,COLOR_PURPLE);
		}
	}

};

module.exports = squadController;