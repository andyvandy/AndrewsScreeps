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

    lastwill: function(){}
    
}



module.exports = role_proto;