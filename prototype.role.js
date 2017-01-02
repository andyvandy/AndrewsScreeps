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

    lastwill: function(){},

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
    }
    
};



module.exports = role_proto;