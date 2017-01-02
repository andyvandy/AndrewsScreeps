/*
This class builds structures than I've planned with green flags
The names have to be of the format 
lowercasestructurename-number like extension-5

*/

var roomPlanner = {
    legend : {"extension": STRUCTURE_EXTENSION,
             "container" :STRUCTURE_CONTAINER,
             "tower" : STRUCTURE_TOWER,
             "storage" :STRUCTURE_STORAGE
        },
    run: function (room_name){
        // query for green flags
        var greenFlags = Game.rooms[room_name].find(FIND_FLAGS,{filter: (f) => {return (f.color ==COLOR_GREEN); }});

        // clean-up from the last cycle
        for (var i in greenFlags){
            var location= greenFlags[i].pos;
            var structure= this.legend[greenFlags[i].name.split("-")[0]];
            var site = location.lookFor(LOOK_CONSTRUCTION_SITES).filter((s)=>{return s.structureType==structure; });
            if (site.length){
                console.log("built a "+greenFlags[i].name.split("-")[0] + ", removing flag");
                greenFlags[i].remove();
            }
        }

        // iterate over the flags and try to built the desired structure, if successful delete the flag
        for (var i in greenFlags){
            var location= greenFlags[i].pos;
            var structure= this.legend[greenFlags[i].name.split("-")[0]];
            var built = location.createConstructionSite(structure) ;
        }

    }
};

module.exports = roomPlanner;