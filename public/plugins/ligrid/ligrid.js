;(function(){
    // Define our constructor
    this.Ligrid = function() {
        // Create global element references
        this._gridElement = null;
        this._gridArea = null;
        this._currentPage = 1;
        this._data = null;

        // Define option defaults
        var defaults = {
            currentPage : 1,
            countPerpage : 20,
            itemCountMax:2
        }
        // Create options by extending defaults with the passed in arugments
        if (arguments[0] && typeof arguments[0] === "object") {
            this.options = extendDefaults(defaults, arguments[0]);
        }
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
                if (that.options.itemCountMax > currentCount) {
                    currentCount ++ ;
                }else{
                    currentCount = 0;
                }
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

    function fillData(element,data){
        element.innerHTML = "";
        for (var i = 0; i < data.length; i++) {
            var item = document.createElement("li");
            item.className = "ligrid-li";
            item.setAttribute('data-count',0);
            item.innerHTML = data[i].name+'<span class="count"></span>';
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

    Ligrid.prototype.fillData = function(data) {
        var that = this;
        if (that._gridArea) {
            var pageData = data.slice(20*(that._currentPage-1),20*that._currentPage);
            fillData(that._gridArea,pageData);
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
            fillData(that._gridArea,pageData);
        };
    }

    Ligrid.prototype.nextPage = function() {
        var that = this;
        
        if (that._gridArea && that._data) {
            var pageData = that._data.slice(20*(that._currentPage),20*(that._currentPage+1));
            if (pageData && pageData.length > 0) {
                that._currentPage++;
                fillData(that._gridArea,pageData);
            };
        };
    }

    Ligrid.prototype.loadData = function(data) {
        var that = this;
        that._data = data;
        if (that._gridArea && that._data) {
            that._currentPage = 1;
            var pageData = data.slice(20*(that._currentPage-1),20*that._currentPage);
            fillData(that._gridArea,pageData);
        };
    }
})();