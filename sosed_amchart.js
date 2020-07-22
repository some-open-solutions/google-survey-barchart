function sosed_amchart(map_div_id,
                       sheet_id,
                       table_id,
                       this_type,
                       subsheet_number,
                       column_number){
  var current_data;
  var ParseGSX = (function() {

    var _defaultCallback = function(data) {
      console.log(data);
    };

    var _parseRawData = function(res) {
      var finalData = [];
      res.feed.entry.forEach(function(entry){
        var parsedObject = {};
        for (var key in entry) {
          if (key.substring(0,4) === "gsx$") {
            parsedObject[key.slice(4)] = entry[key]["$t"];
          }
        }
        finalData.push(parsedObject);
      });
      var processGSXData = _defaultCallback;
      processGSXData(finalData);
    };

    var parseGSX = function(spreadsheetID, callback) {
      var url = "https://spreadsheets.google.com/feeds/list/" + 
                spreadsheetID + "/" + subsheet_number + 
                "/public/values?alt=json";
      var ajax = $.ajax(url);
      if (callback) { _defaultCallback = callback; }
      $.when(ajax).then(_parseRawData);
    };

    return { parseGSX: parseGSX };

  })();
  var chart;
  var continents;
  function update_map(){
    ParseGSX.parseGSX(sheet_id,function(data){
      
      /*
      * use get for type of chart
      */
      console.dir(data);

      switch(this_type){
        case "frequency":
          var freq_obj = {};
          var item = Object.keys(data[0])[column_number];
          freq_obj[item] = {
            text: data[0][item],
            freq: {}
          };
          
          
            
          
          
          
          var chart = am4core.create(map_div_id, am4charts.XYChart);
          chart.hiddenState.properties.opacity = 0; // this creates initial fade-in

          chart.paddingRight = 40;

          chart.data = [];
          
          for(var i = 1; i < data.length; i++){
            if(typeof(freq_obj[item].freq[data[i][item]]) == "undefined"){
              freq_obj[item].freq[data[i][item]] = 0;
            }
            freq_obj[item].freq[data[i][item]]++;
          }
          console.dir("freq_obj");
          console.dir(freq_obj);
          
          Object.keys(freq_obj[item].freq).forEach(function(sub_item){
            chart.data.push({
              "name"  : sub_item,
              "steps" : freq_obj[item].freq[sub_item]
            });
          });
          console.dir(chart.data);

          var categoryAxis = chart.yAxes.push(new am4charts.CategoryAxis());
          categoryAxis.dataFields.category = "name";
          categoryAxis.renderer.grid.template.strokeOpacity = 0;
          categoryAxis.renderer.minGridDistance = 10;
          categoryAxis.renderer.labels.template.dx = -40;
          categoryAxis.renderer.minWidth = 120;
          categoryAxis.renderer.tooltip.dx = -40;

          var valueAxis = chart.xAxes.push(new am4charts.ValueAxis());
          valueAxis.renderer.inside = true;
          valueAxis.renderer.labels.template.fillOpacity = 0.3;
          valueAxis.renderer.grid.template.strokeOpacity = 0;
          valueAxis.min = 0;
          valueAxis.cursorTooltipEnabled = false;
          valueAxis.renderer.baseGrid.strokeOpacity = 0;
          valueAxis.renderer.labels.template.dy = 20;

          var series = chart.series.push(new am4charts.ColumnSeries);
          series.dataFields.valueX = "steps";
          series.dataFields.categoryY = "name";
          series.tooltipText = "{valueX.value}";
          series.tooltip.pointerOrientation = "vertical";
          series.tooltip.dy = - 30;
          series.columnsContainer.zIndex = 100;

          var columnTemplate = series.columns.template;
          columnTemplate.height = am4core.percent(50);
          columnTemplate.maxHeight = 50;
          columnTemplate.column.cornerRadius(60, 10, 60, 10);
          columnTemplate.strokeOpacity = 0;

          series.heatRules.push({ target: columnTemplate, property: "fill", dataField: "valueX", min: am4core.color("#e5dc36"), max: am4core.color("#5faa46") });
          series.mainContainer.mask = undefined;

          var cursor = new am4charts.XYCursor();
          chart.cursor = cursor;
          cursor.lineX.disabled = true;
          cursor.lineY.disabled = true;
          cursor.behavior = "none";

          var bullet = columnTemplate.createChild(am4charts.CircleBullet);
          bullet.circle.radius = 30;
          bullet.valign = "middle";
          bullet.align = "left";
          bullet.isMeasured = true;
          bullet.interactionsEnabled = false;
          bullet.horizontalCenter = "right";
          bullet.interactionsEnabled = false;

          var hoverState = bullet.states.create("hover");
          var outlineCircle = bullet.createChild(am4core.Circle);
          outlineCircle.adapter.add("radius", function (radius, target) {
              var circleBullet = target.parent;
              return circleBullet.circle.pixelRadius + 10;
          })

          var image = bullet.createChild(am4core.Image);
          image.width = 60;
          image.height = 60;
          image.horizontalCenter = "middle";
          image.verticalCenter = "middle";
          image.propertyFields.href = "href";

          image.adapter.add("mask", function (mask, target) {
              var circleBullet = target.parent;
              return circleBullet.circle;
          })

          var previousBullet;
          chart.cursor.events.on("cursorpositionchanged", function (event) {
              var dataItem = series.tooltipDataItem;

              if (dataItem.column) {
                  var bullet = dataItem.column.children.getIndex(1);

                  if (previousBullet && previousBullet != bullet) {
                      previousBullet.isHover = false;
                  }

                  if (previousBullet != bullet) {

                      var hs = bullet.states.getKey("hover");
                      hs.properties.dx = dataItem.column.pixelWidth;
                      bullet.isHover = true;

                      previousBullet = bullet;
                  }
              }          

          }); // end am4core.ready()
          
          /*
          
          * build plot here 
          
          */
          
          
          break;
        case "map":
          if(JSON.stringify(data) !== JSON.stringify(current_data)){
          
            var table_content = "<table class='table'>" +
                                  "<thead>" +
                                    "<tr>" +
                                      "<th scope='col'>Country</th>" +
                                      "<th scope='col'>Number of people</th>" +
                                    "</tr>" +
                                  "</thead>" +
                                  "<tbody>";
            current_data = JSON.parse(JSON.stringify(data));
            am4core.ready(function() {

            // Themes begin
            am4core.useTheme(am4themes_animated);
            // Themes end

            continents = {
              "AF": 2,
              "AN": 2,
              "AS": 2,
              "EU": 2,
              "NA": 2,
              "OC": 2,
              "SA": 2
            }

            // Create map instance
            chart = am4core.create(map_div_id, am4maps.MapChart);
            chart.projection = new am4maps.projections.Miller();

            // Create map polygon series for world map
            worldSeries = chart.series.push(new am4maps.MapPolygonSeries());
            worldSeries.useGeodata = true;
            worldSeries.geodata = am4geodata_worldLow;
            worldSeries.exclude = ["AQ"];

            var worldPolygon = worldSeries.mapPolygons.template;
            worldPolygon.tooltipText = "{name}";
            worldPolygon.nonScalingStroke = true;
            worldPolygon.strokeOpacity = 0.5;
            worldPolygon.fill = am4core.color("#eee");
            worldPolygon.propertyFields.fill = "color";

            var hs = worldPolygon.states.create("hover");
            hs.properties.fill = chart.colors.getIndex(9);


            // Create country specific series (but hide it for now)
            var countrySeries = chart.series.push(new am4maps.MapPolygonSeries());
            countrySeries.useGeodata = true;
            countrySeries.hide();
            countrySeries.geodataSource.events.on("done", function(ev) {
              worldSeries.hide();
              countrySeries.show();
            });

            var countryPolygon = countrySeries.mapPolygons.template;
            countryPolygon.tooltipText = "{name}";
            countryPolygon.nonScalingStroke = true;
            countryPolygon.strokeOpacity = 0.5;
            countryPolygon.fill = am4core.color("#eee");

            var hs = countryPolygon.states.create("hover");
            hs.properties.fill = chart.colors.getIndex(9);

            // Set up click events
            worldPolygon.events.on("hit", function(ev) {
              ev.target.series.chart.zoomToMapObject(ev.target);
              var map = ev.target.dataItem.dataContext.map;
              if (map) {
                ev.target.isHover = false;
                countrySeries.geodataSource.url = "https://www.amcharts.com/lib/4/geodata/json/" + map + ".json";
                countrySeries.geodataSource.load();
              }
            });
            
            
            var row_order = Object.keys(data);


            row_order.sort(function(a,b) {
              return data[a].frequency - data[b].frequency;
            });
            
            data_sorted = [];
            for(var i = 0; i < data.length; i++){
              data_sorted[i] = data[row_order[i]];
            }
            data_sorted = data_sorted.reverse();
            
            data_sorted.forEach(function(row){
              if(row.frequency !== "" && parseFloat(row.frequency) !== 0){
                table_content +=  "<tr>"+
                                    "<td>" + row.country + "</td>" +
                                    "<td>" + row.frequency + "</td>" +
                                  "</tr>";					
              }
            });
            
            
            data = data.map(function(row){
              
              row.id = row.code;
              
              var country = am4geodata_data_countries2[row.id];
              
              if(row.frequency > 0){
                row.color = chart.colors.getIndex(continents[country.continent_code]);
                
              }
              
              //row.map = country.maps[0];
              
              
              
              
              return row;
            });
            
            table_content += "</tbody>"  + "</table>";
            $("#" + table_id).html(table_content);
            
            worldSeries.data = data;

            // Zoom control
            chart.zoomControl = new am4maps.ZoomControl();

            var homeButton = new am4core.Button();
            homeButton.events.on("hit", function() {
              worldSeries.show();
              countrySeries.hide();
              chart.goHome();
            });

            homeButton.icon = new am4core.Sprite();
            homeButton.padding(7, 5, 7, 5);
            homeButton.width = 30;
            homeButton.icon.path = "M16,8 L14,8 L14,16 L10,16 L10,10 L6,10 L6,16 L2,16 L2,8 L0,8 L8,0 L16,8 Z M16,8";
            homeButton.marginBottom = 10;
            homeButton.parent = chart.zoomControl;
            homeButton.insertBefore(chart.zoomControl.plusButton);

            });
          }
        
          break;
      }
      
      
      
      
    });
  }
  update_map();
  setInterval(function(){
    
    ParseGSX.parseGSX(sheet_id,function(data){
      
      if(JSON.stringify(data) !== JSON.stringify(current_data)){
        
        current_data = JSON.parse(JSON.stringify(data));
        var table_content = "<table class='table'>" +
                              "<thead>" +
                                "<tr>" +
                                  "<th scope='col'>Country</th>" +
                                  "<th scope='col'>Number of people</th>" +
                                "</tr>" +
                              "</thead>" +
                              "<tbody>";
        
        worldSeries.data = data.map(function(row){
          
          row.id = row.code;
          
          var country = am4geodata_data_countries2[row.id];
          
          if(row.frequency > 0){
            row.color = chart.colors.getIndex(continents[country.continent_code]);
            
          }
          
          //row.map = country.maps[0];
          
          return row;
        });
        var row_order = Object.keys(data);


        row_order.sort(function(a,b) {
          return data[a].frequency - data[b].frequency;
        });
        
        data_sorted = [];
        for(var i = 0; i < data.length; i++){
          data_sorted[i] = data[row_order[i]];
        }
        data_sorted = data_sorted.reverse();
        
        data_sorted.forEach(function(row){
          if(row.frequency !== "" && parseFloat(row.frequency) !== 0){
            table_content +=  "<tr>"+
                                "<td>" + row.country + "</td>" +
                                "<td>" + row.frequency + "</td>" +
                              "</tr>";					
          }
        });
        
        
        table_content += "</tbody>"  + "</table>";
        $("#" + table_id).html(table_content);
        
      }
    });
  },5000);                           
                           
}