/*
    The hauler will be created with a flag for where to deposit and a flag for where to withdraw
    The hauler has two states: 
        -hauling : bringing resources back the the deposit
        -fetching : getting resources from the assigned source

    NOTES:
        - the hauler body scales according to route length
        - remote room haulers have a work part to maintain roads
        - haulers move in the same tick that they pickup

    TODO:
        -improve the scaling based on hauling distance
        -make haulers handle minerals
*/
var role_proto = require('prototype.role');

var utils = require('utils');


var roleHauler = {
    
    parts: [[CARRY,CARRY,MOVE],
            [CARRY,CARRY,CARRY,CARRY,MOVE,MOVE],
            [CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE],
            [CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE],
            [CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE]],

    // TODO make a helper function for finding the costs
    costs: [150,300,600,1050,1500],

    //TODO make the hauler size scale based off of path length not available energy capacity
    create: function(spawn,params){
        if (!!spawn.spawning){
            // since it returns null otherwise
            //skip this if the spawn is busy
            return true;
        }
        memory={spawn:spawn.name,
                home:spawn.room.name,
                role: "hauler",
                job:"fetching",
                flag:params.join("_"),
                source:params[3],
                deposit:params[4]};
        var num= 1;
        var name= memory.role+num;
        var body= this.assessRoute(memory.source,memory.deposit,spawn.room.energyCapacityAvailable);
        if (!body){
            body = this.parts[ this.costs.indexOf(_.max(this.costs.filter((c) => {return (c<=spawn.room.energyCapacityAvailable);})))];
        }
        
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
    assessRoute:function(source,deposit,capacity){
        // determine how much hauling we need
        // as a rule of thumb, haul 15 energy per tick so routeLength*2 *15 is how much capacity is needed 

        //save the results to save cpu TODO
        var distance = utils.globalDistance(Game.flags[source].pos, Game.flags[deposit].pos);
        //console.log(distance);
        //each section is one move and two carries
        //use 20 since i'm using raw distance
        var numSections= Math.ceil((distance*2 *30) /100);
        //console.log(numSections);
        //console.log("dist"+distance);

        var body = _.fill(Array(numSections*2), CARRY).concat(_.fill(Array(numSections), MOVE)) ;

        //if the source and deposit are in diffrent rooms, add a work part so that the hauler can maintain the roads
        if (Game.flags[source].pos.roomName!=Game.flags[deposit].pos.roomName){
            body= body.concat([WORK,MOVE,CARRY]);
        }

        if (capacity> numSections*150){
            return body;
        }
        else{
            return false;
        }
        
    },

    run: function(){
        var creep = this.creep;

        // set up a road network  since the hauler should have a predictable path
        //also maintain the road network to remove the need for a helper creep
        // need to ignore terrain due to this
        this.layroads();
        this.maintain();

        if((creep.memory.job== "hauling" )&& (creep.carry.energy == 0)) {
            creep.memory.job = "fetching";
            creep.say('picking up');
        }
        if((creep.memory.job== "fetching") && (creep.carry.energy == creep.carryCapacity)) {
            creep.memory.job = "hauling";
            creep.say('hauling');
        }

        if(creep.memory.job== "hauling"){
            this.haul();
        }
        else if(creep.memory.job== "fetching"){
            this.fetching();
        }
    },

    haul: function(){
        // the hauler goes to their designated dropoff and unloads all of their resources
        var creep = this.creep;
        var targets=creep.room.lookForAt(LOOK_STRUCTURES,Game.flags[creep.memory.deposit]).filter(
                                    (structure) =>{return (structure.structureType ==STRUCTURE_CONTAINER) ||
                                                            (structure.structureType ==STRUCTURE_STORAGE) ;});
            if(targets[0]){
                var backpack = creep.carry;
                for (var resource in backpack){
                    //iterate over all of the possible resources , TODO make this more efficient?
                    if (backpack[resource]>0){
                        if(creep.transfer(targets[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                            creep.moveTo(targets[0]);
                        }
                    }
                }
            }else{
                //hauler is in a different room
                creep.moveTo(Game.flags[creep.memory.deposit]);
            }
    },

    fetching: function(){
        //the hauler goes to its designated resource collection point and collects energy
        var creep = this.creep;
        var targets=creep.room.lookForAt(LOOK_RESOURCES,Game.flags[creep.memory.source]);
        if (targets.length){
            result=creep.pickup(targets[0]);
            if(result == ERR_NOT_IN_RANGE) {
                creep.moveTo(targets[0]);
            }
        }
        var targets=creep.room.lookForAt(LOOK_STRUCTURES,Game.flags[creep.memory.source]).filter((structure) =>{return structure.structureType ==STRUCTURE_CONTAINER||structure.structureType ==STRUCTURE_STORAGE ;});
        if(targets[0]){
            result=creep.withdraw(targets[0], RESOURCE_ENERGY);
            if(result == ERR_NOT_IN_RANGE) {
                creep.moveTo(targets[0]);
            }else if(result == OK && creep.carry.energy == creep.carryCapacity){
                this.haul();
            }
        }
        else if(!creep.pos.isNearTo(Game.flags[creep.memory.source])){
            // the container is in a different room or not constructed
            // do not step on it and block the source
            creep.moveTo(Game.flags[creep.memory.source]);
        }  
    },
    maintain: function(){
        // the hauler will maintain the roads that they use as they walk
        //we don't check wheter they have energy or not since that doesn't really change anything right?
        var creep = this.creep;
        if (!creep.getActiveBodyparts(WORK)){
            // the creep must have a work body part to continue
            return;
        }
        var potHole =this.creep.pos.lookFor(LOOK_STRUCTURES,{
                            filter: (s) => { return s.structureType == STRUCTURE_ROAD && s.hits < s.hitsMax ; }} );
        if (potHole.length){
            // since lookFor returns a list
            creep.repair(potHole[0]);
            return;// so that we don't look for other stuff and can save a tiny bit of cpu
        }

        var constructionSites = creep.pos.lookFor(LOOK_CONSTRUCTION_SITES);
        if (constructionSites){
            creep.build(constructionSites[0]);
        }


    }   

};

module.exports = roleHauler;