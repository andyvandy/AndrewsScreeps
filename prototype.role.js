/*

        TODO
            -Camel case all the functions ( and the calls to them)... woops
            -add a recle creep function
*/


var role_proto={
    // credit for setCreep to https://github.com/Garethp/Screeps/blob/master/role_prototype.js

    /**
     * The creep for this role
     *
     * @type creep
     */
    creep: null,

    /**
     * Set the creep for this role
     *
     * @param {Creep} creep
     */
    setCreep: function(creep)
    {
        this.creep = creep;
        return this;
    },

    run : function()
    {
        this.action(this.creep); // unclear what happens if an unnessecary variable is passed
    },

    action: function(){} ,

    lastWill: function(){},

    layroads: function(){
        var creep=this.creep;
        // check if the creep is on a road, and if not build one
        // only do so if there are less than 10 construction site present so that it doesn't turn into a shitshow again lol
        var numContructionSites = creep.room.find(FIND_CONSTRUCTION_SITES).length;
        if (numContructionSites<10){
            var road =this.creep.pos.lookFor(LOOK_STRUCTURES,{
                            filter: (structure) => { return structure.structureType == STRUCTURE_ROAD; }} );

            if (!road.length){
                var found_site =creep.pos.lookFor(LOOK_CONSTRUCTION_SITES,{
                                filter: (site) => { return site.structureType == STRUCTURE_ROAD; }} );
                if(!found_site.length){
                    creep.pos.createConstructionSite(STRUCTURE_ROAD);
                }
            }
        }   
    },

    getOffEdge: function(){
        // use this to stop creeps from dancing on the edge of a room
        var creep=this.creep;
        if(creep.pos.x==0){creep.move(RIGHT)}
        if(creep.pos.x==49){creep.move(LEFT)}
        if(creep.pos.y==0){creep.move(BOTTOM)}
        if(creep.pos.y==49){creep.move(TOP)}
    },
    gotoroom:function(room_name){
        var creep= this.creep;
        if (creep.room.name==room_name){
            return true;
        }
        var exit_dir=Game.map.findExit(creep.room.name,room_name);
        var exit= creep.pos.findClosestByRange(exit_dir);
        creep.moveTo(exit);
        return false;
    },
    deploy: function(){
        // deploy to the current checkpoint
        //this is used for military creeps
        var creep=this.creep;
        var checkpointFlag= Game.flags[creep.memory.squad+"_"+creep.memory.checkpoint];
        if (checkpointFlag === undefined){
            checkpointFlag= Game.flags[creep.memory.squad+"_"+creep.memory.checkpoint+"_FINAL"];
        }
        if ( checkpointFlag.name.split("_")[2]=="FINAL" ){
            creep.memory.job= "missioning";
            this.escort();
        }
        creep.moveTo(checkpointFlag);
        if (creep.pos.inRangeTo(checkpointFlag,5) ){
            creep.say("reached!");
            creep.memory.job="idling";
        }
    }
    
};



module.exports = role_proto;