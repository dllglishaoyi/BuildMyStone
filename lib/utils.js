
var fs = require('fs');
var path = require('path');

module.exports = {
    mkdirs : function (folder) {
        folder = path.normalize(folder);
        if (fs.existsSync(folder))
            return ;

        var parentFolder = path.dirname(folder);
        if (!fs.existsSync(parentFolder))
            this.mkdirs(parentFolder);

        fs.mkdirSync(folder);
    }

	,rmdirs : function (path) {
		var self = this;
		var files = [];
		if(fs.existsSync(path)) {
			files = fs.readdirSync(path);
			files.forEach(function(file,index){
				var curPath = path + "/" + file;
				if(fs.statSync(curPath).isDirectory()) { // recurse
					self.rmdirs(curPath);
				} else { // delete file
					fs.unlinkSync(curPath);
				}
			});
			fs.rmdirSync(path);
		}
		return ;
	}
    ,download:function(uri, filename, callback){
        var fs = require('fs'),
        request = require('request');
        request.head(uri, function(err, res, body){
            request(uri).on('error', callback).pipe(fs.createWriteStream(filename)).on('close', callback);
        });
    }

}
