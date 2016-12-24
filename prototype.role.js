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
        // check if the creep is on a road, and if not build one
        var road =this.creep.pos.lookFor(LOOK_STRUCTURES,{
                            filter: (structure) => { return structure.structureType == STRUCTURE_ROAD; }} );
        if (!road.length){
            var found_site =this.creep.pos.lookFor(LOOK_CONSTRUCTION_SITES,{
                            filter: (site) => { return site.structureType == STRUCTURE_ROAD; }} );
            if(!found_site.length){
                this.creep.pos.createConstructionSite(STRUCTURE_ROAD);
            }
        }
    }
    
}



module.exports = role_proto;