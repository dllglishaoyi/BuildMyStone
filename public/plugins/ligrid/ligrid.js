;(function(){
    // Define our constructor
    this.Ligrid = function() {
        // Create global element references
        this._gridElement = null;
        this._gridArea = null;
        this._currentPage = 1;
        this._data = null;
        this._userDataMap = {};

        // Define option defaults
        var defaults = {
            currentPage : 1,
            countPerpage : 20,
            itemCountMax:2,
            userData:[]
        }
        // Create options by extending defaults with the passed in arugments
        if (arguments[0] && typeof arguments[0] === "object") {
            this.options = extendDefaults(defaults, arguments[0]);
        }

        // this._userDataMap = 
        var userData = this.options.userData;
        for (var i = 0; i < userData.length; i++) {
            if (this._userDataMap[userData[i]]) {
                this._userDataMap[userData[i]] = this._userDataMap[userData[i]] + 1;
            }else{
                this._userDataMap[userData[i]] = 1;
            }
        };

        initLayout.call(this);
    }

    function initLayout(){
        var that = this;
        var gridElement = this._gridElement = document.getElementById(that.options.gridid);
        var gridArea = this._gridArea = document.createElement("ul");
        gridArea.className = "ligrid-ul";
        gridElement.appendChild(gridArea);

        //empty gridElement
        gridArea.innerHTML = "";
        var nextPageBtn = document.createElement("Button");
        nextPageBtn.innerHTML = "nextPage";
        var prePageBtn = document.createElement("Button");
        prePageBtn.innerHTML = "prePageBtn";
        gridElement.appendChild(prePageBtn);
        gridElement.appendChild(nextPageBtn);
        prePageBtn.addEventListener("click",function (e) {
            that.prePage();
        });
        nextPageBtn.addEventListener("click",function (e) {
            that.nextPage();
        });

        document.addEventListener("click",function (e) {
            // console.log(e.target.classList);
            if (hasclass(e.target,"ligrid-li")) {
                var currentCount = e.target.getAttribute("data-count");
                var name = e.target.getAttribute("data-name");
                if (that.options.itemCountMax > currentCount) {
                    currentCount ++ ;
                }else{
                    currentCount = 0;
                }
                that._userDataMap[name] = currentCount;
                e.target.setAttribute('data-count',currentCount);
                var countElement = e.target.getElementsByClassName("count")[0];
                countElement.innerHTML = currentCount > 0 ? "*"+currentCount : '';
            };
        });
    }

    function hasclass (element,className) {
        // return /\b\b/.test(element);
        return element.classList.contains(className);
    }

    function fillData(element,data,userDataMap){
        element.innerHTML = "";
        for (var i = 0; i < data.length; i++) {
            var item = document.createElement("li");
            var nameElement = document.createElement("span");
            nameElement.innerHTML = data[i].name+"("+data[i].cost+")";

            var countElement = document.createElement("span");
            countElement.className = "count";
            countElement.innerHTML = userDataMap[data[i].name] ? "*" + userDataMap[data[i].name] : '';

            var imgElement = document.createElement("img");
            imgElement.src = data[i].img;

            item.className = "ligrid-li";
            item.setAttribute('data-name',data[i].name);
            item.setAttribute('data-count',0);

            item.appendChild(imgElement);
            item.appendChild(nameElement);
            item.appendChild(countElement);

            element.appendChild(item);
        };
    }

    function extendDefaults(source, properties) {
        var property;
        for (property in properties) {
            if (properties.hasOwnProperty(property)) {
                source[property] = properties[property];
            }
        }
        return source;
    }

    Ligrid.prototype.showData = function() {
        var that = this;
        console.log(that._userDataMap);
    }

    Ligrid.prototype.fillData = function(data) {
        var that = this;
        if (that._gridArea) {
            var pageData = data.slice(20*(that._currentPage-1),20*that._currentPage);
            fillData(that._gridArea,pageData,that._userDataMap);
        };
    }

    Ligrid.prototype.prePage = function() {
        var that = this;
        if (that._currentPage == 1) {
            return;
        };
        that._currentPage--;
        if (that._gridArea && that._data) {
            var pageData = that._data.slice(20*(that._currentPage-1),20*that._currentPage);
            fillData(that._gridArea,pageData,that._userDataMap);
        };
    }

    Ligrid.prototype.nextPage = function() {
        var that = this;
        
        if (that._gridArea && that._data) {
            var pageData = that._data.slice(20*(that._currentPage),20*(that._currentPage+1));
            if (pageData && pageData.length > 0) {
                that._currentPage++;
                fillData(that._gridArea,pageData,that._userDataMap);
            };
        };
    }

    Ligrid.prototype.loadData = function(data) {
        var that = this;
        that._data = data;
        if (that._gridArea && that._data) {
            that._currentPage = 1;
            var pageData = data.slice(20*(that._currentPage-1),20*that._currentPage);
            fillData(that._gridArea,pageData,that._userDataMap);
        };
    }

    Ligrid.prototype.getSelectedData = function() {
        var that = this;
        var property;
        var data = [];
        for (property in that._userDataMap) {
            if (that._userDataMap.hasOwnProperty(property)) {
                for (var i = 0; i < that._userDataMap[property]; i++) {
                    data.push(property);
                };
            }
        }
        return data;
    }
})();