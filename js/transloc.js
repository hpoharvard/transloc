// code by Giovanni Zambotti - October 10 2017
require([
      "esri/config",
      "esri/views/MapView",
      "esri/Map",
      "esri/layers/FeatureLayer",
      "esri/layers/support/Field",
      "esri/geometry/Point",
      "esri/renderers/SimpleRenderer",
      "esri/symbols/SimpleMarkerSymbol",
      "esri/renderers/UniqueValueRenderer",
      "esri/layers/support/LabelClass",
      "esri/widgets/Legend",
      "esri/request",
      "dojo/_base/array",
      "dojo/dom",
      "dojo/on",
      "dojo/domReady!"
    ], function(esriConfig, MapView, Map, FeatureLayer, Field, Point,
      SimpleRenderer, SimpleMarkerSymbol, UniqueValueRenderer, LabelClass, Legend, esriRequest,
      arrayUtils, dom, on
    ) {

      var lyr, lyrStops, legend, sInfo = {}, sStatus = {}, sMerge = {};

      //var buspath = "M 50 0 a 50 50 0 1 1 0 0 a 50 50 0 0 1 50 -50 z M 74.6 54.1 a 5.42 5.42 0 0 0 -5.4 5.3 a 5.35 5.35 0 0 0 10.7 0 a 5.21 5.21 0 0 0 -5.3 -5.3 z M 26.8 54.1 a 5.46 5.46 0 0 0 -5.4 5.4 a 5.3 5.3 0 0 0 10.6 0 a 5.09 5.09 0 0 0 -5.2 -5.4 z M 50 0 h 0 h 0 h 0 z M 50 0 a 50 50 0 1 0 50 50 a 50 50 0 0 0 -50 -50 z M 31.5 83.2 a 3 3 0 0 1 -1.3 2.5 a 5.07 5.07 0 0 1 -3 0.9 c -2.3 0 -4.7 -1.2 -4.7 -3.5 v -5.6 h 9 z M 79.2 83 c 0 2.3 -2.5 3.4 -4.8 3.4 s -4.9 -1.1 -4.9 -3.4 v -5.5 h 9.7 c 0 0.6 0 5.5 0 5.5 z M 84.9 59.4 v 15.4 c 0 0.6 -0.2 0.8 -0.8 0.8 h -66.4 c -0.6 0 -1.1 -0.4 -1.1 -0.8 v -41.8 a 48.86 48.86 0 0 1 1.8 -11 a 9.67 9.67 0 0 1 4.4 -5.3 c 13.9 -8 41.5 -8 56.8 -0.1 c 1.9 1 2.7 3.2 3.4 5.2 a 38.14 38.14 0 0 1 1.9 11.2 z M 76.7 22.3 h -51.9 a 2.47 2.47 0 0 0 -2.3 2.3 l -1.4 23.6 c 0 0.6 0.7 1.8 1.4 1.8 h 55.5 a 2.37 2.37 0 0 0 2.3 -2 l -1.7 -22.8 c 0.1 -1.5 -1.2 -2.9 -1.9 -2.9 z M 50 50 a 7.08 7.08 0 0 1 0 0 z"
      var buspath = "M 30.511,6.326h-9.237c-0.948,0-1.72,0.835-1.72,1.866v10.039c0,0.685,0.341,1.28,0.848,1.604v1.073 c0,0.353,0.567,0.636,1.271,0.636c0.701,0,1.271-0.283,1.271-0.636v-0.812H24.5v-0.001h3.217v0.001h1.195v0.812 c0,0.353,0.568,0.636,1.271,0.636s1.271-0.283,1.271-0.636v-1.116c0.471-0.334,0.78-0.907,0.78-1.562V8.191 C32.232,7.162,31.461,6.326,30.511,6.326z  M24.291,17.061h-3.373v-1.248h3.373V17.061z M27.715,19.941h-3.217v-0.99h3.217V19.941z M31.037,17.061h-3.374v-1.248h3.374V17.061z M31.185,12.773 c0,0.127-0.224,0.23-0.5,0.23H21.1c-0.275,0-0.499-0.104-0.499-0.23V8.339c0-0.128,0.224-0.232,0.499-0.232h9.585 c0.276,0,0.5,0.104,0.5,0.232V12.773z";
      var bussize = 10;
      esriConfig.request.corsEnabledServers.push("https://transloc-api-1-2.p.mashape.com");
            
      /**************************************************
       * Define the specification for each field to create
       * in the layer
       **************************************************/

      var fields = [
      {
        name: "ObjectID",
        alias: "ObjectID",
        type: "oid"
      }, {
        name: "title",
        alias: "title",
        type: "string"
      }];

      var pTemplate = {
        title: "{route_id}",
        content: [{
          type: "fields",
          fieldInfos: [{
            fieldName: "route_id",
            label: "Route Number",
            visible: true
          }, {
            fieldName: "call_name",
            label: "Call Name",
            visible: true
          }, {
            fieldName: "arrival_estimates",
            label: "Arrivals",
            visible: true
          }/*, {
            fieldName: "bikesDisabled",
            label: "Bikes Disabled",
            visible: true
          }, {
            fieldName: "docksAvailable",
            label: "Docks Available",
            visible: true
          }, {
            fieldName: "docksDisabled",
            label: "Docks Disabled",
            visible: true
          }, {
            fieldName: "lastReported",
            label: "Last Reported",
            visible: true
          }*/
          ]
        }],
        /*fieldInfos: [{
          fieldName: "time",
          format: {
            dateFormat: "short-date-short-time"
          }
        }]*/
      };

      /**************************************************
       * Create the map and view
       **************************************************/

      var map = new Map({
        basemap: "gray"
      });

      // Create MapView
      var view = new MapView({
        container: "viewDiv",
        map: map,
        center: [-71.116076, 42.37375],
        zoom: 14,
        // customize ui padding for legend placement
        ui: {
          padding: {
            bottom: 15,
            right: 0
          }
        }
      });

      /**************************************************
       * Define the renderer for symbolizing stops and buses
       **************************************************/
      // stops
      

      var stopsRenderer = new SimpleRenderer({
        symbol: new SimpleMarkerSymbol({
          style: "circle",
          size: 4,
          color: [20, 20, 20],
            outline: {
              width: 1,
              color: "#000000",
              style: "solid"
            }
        })
      }); 
      // 4005718
      var bus061 = new SimpleMarkerSymbol({
        /*style: "circle",*/
        path: buspath,
        size: bussize,
        color: [255, 165, 0],
        outline: {
          width: .3,
          color: "#969696",
          style: "solid"
        }
      });
      // 4005718
      var bus060 = new SimpleMarkerSymbol({
        path: buspath,
        size: bussize,
        color: [0, 0, 255],
        outline: {
          width: .3,
          color: "#969696",
          style: "solid"
        }
      });

      // 4009944
      var bus205b = new SimpleMarkerSymbol({
        path: buspath,
        size: bussize,
        color: [0, 255, 255],
        outline: {
          width: .3,
          color: "#969696",
          style: "solid"
        }
      });

      var bus201 = new SimpleMarkerSymbol({
        path: buspath,
        size: bussize,
        color: [0, 255, 0],
        outline: {
          width: .3,
          color: "#969696",
          style: "solid"
        }
      });  

      // 4010058      
      var bus202 = new SimpleMarkerSymbol({
        path: buspath,
        size: bussize,
        color: [255, 255, 0],
        outline: {
          width: .3,
          color: "#969696",
          style: "solid"
        }
      });

      var bus203 = new SimpleMarkerSymbol({
        path: buspath,
        size: bussize,
        color: [255, 0, 0, 0.8],
        outline: {
          width: .3,
          color: "#969696",
          style: "solid"
        }
      });

      // 4010082 
      var bus206 = new SimpleMarkerSymbol({
        path: buspath,
        size: bussize,
        color: [255, 0, 255],
        outline: {
          width: .3,
          color: "#969696",
          style: "solid"
        }
      });

      var bus207 = new SimpleMarkerSymbol({
        path: buspath,
        size: bussize,
        color: [128, 120, 128],
        outline: {
          width: .3,
          color: "#969696",
          style: "solid"
        }
      });
       
      var symbus = {
        type: "unique-value", // autocasts as new UniqueValueRenderer()        
        field: "call_name",
        uniqueValueInfos: [
          {
            value: "202",  // features labeled as "High"
            symbol: bus202  // will be assigned sym1
          }, {
            value: "203",  // features labeled as "Medium"
            symbol: bus203  // will be assigned sym2
          },
          {
            value: "206",  // features labeled as "Medium"
            symbol: bus206  // will be assigned sym2
          },
          {
            value: "205b",  // features labeled as "Medium"
            symbol: bus205b  // will be assigned sym2
          },
          {
            value: "201",  // features labeled as "Medium"
            symbol: bus201  // will be assigned sym2
          },
          {
            value: "060",  // features labeled as "Medium"
            symbol: bus060  // will be assigned sym2
          },
          {
            value: "061",  // features labeled as "Medium"
            symbol: bus061  // will be assigned sym2
          },
          {
            value: "207",  // features labeled as "Medium"
            symbol: bus207  // will be assigned sym2
          },
        ]
      };

      view.then(function() {          
        setInterval(function(){ getBus() }, 4000).then(getStopsData());
      });

      
      /*document.getElementById("showStops").addEventListener("click", function(){
          //combine(sInfo, sStatus)
          //createGraphics(sInfo)
          //createLayer(createGraphics(sInfo))
          getStopsData();
          //setInterval(function(){ doIt() }, 8000); 
      });*/

      function getStopsData() {
        var url = "js/stops.json";
        var oReq = new XMLHttpRequest();
        oReq.onload = function (e) {
            console.log(e.target.response);
            createLayerStops(createGraphicsStops(e.target.response.data))
        };
        oReq.open('GET', url, true);
        oReq.responseType = 'json';
        //oReq.setRequestHeader("X-Mashape-Key", "flwu3ez4u5mshqSAs0sWUYJc9HHMp1zKVMijsn0OAaoO0TViFs");
        oReq.send();                
      }
      /**************************************************
       * Create graphics with returned geojson data
       **************************************************/
      
      function createGraphicsBus(response) {          
          //console.log(response)
          //var foo = response[1].arrival_estimates[1].arrival_at;
          return arrayUtils.map(response, function(feature, i) { 
            //var a = JSON.stringify(feature.arrival_estimates[i]);
            
            if(feature.arrival_estimates[i] != undefined){
              console.log(feature.arrival_estimates[i])
              var time = feature.arrival_estimates[i].arrival_at;
              var time1 = time.split('T')[1].split('-')[0];  
            }

            return {
              geometry: new Point({
                x: feature.location.lng,
                y: feature.location.lat
              }),
              // select only the attributes you care about
              attributes: {
                //ObjectID: i,              
                route_id: feature.route_id,
                call_name: feature.call_name,
                arrival_estimates: "Time: " + time1         
              }

            };

        });               
      }
      /**************************************************
       * Create a FeatureLayer Buses with the array of graphics
       **************************************************/

      function createLayerBus(graphics) {
        //console.log(graphics)
        map.remove(lyr)
        lyr = new FeatureLayer({
          source: graphics, // autocast as an array of esri/Graphic
          outFields: ["route_id", "call_name", "arrival_estimates"],
          // create an instance of esri/layers/support/Field for each field object
          fields: fields, // This is required when creating a layer from Graphics
          objectIdField: "route_id", // This must be defined when creating a layer from Graphics
          renderer: symbus, // set the visualization on the layer
          spatialReference: {
            wkid: 4326
          },
          geometryType: "point", // Must be set when creating a layer from Graphics
          popupTemplate: pTemplate
        });
        
        map.add(lyr);
        return lyr;
      }

      function createGraphicsStops(response) {
          return arrayUtils.map(response, function(feature, i) {          
          return {
            geometry: new Point({
              x: feature.location.lng,
              y: feature.location.lat
            }),
            // select only the attributes you care about
            attributes: {
              //ObjectID: i,              
              name: feature.name,
              code: feature.code              
            }

          };
        });               
      }

      var statesLabelClass = new LabelClass({
        labelExpressionInfo: { expression: "$feature.code" },
        symbol: {
          type: "text",  // autocasts as new TextSymbol()
          color: "black",
          haloSize: 1,
          haloColor: "white"
        }
      });


      function createLayerStops(graphics) {
        //console.log(graphics)
        //map.remove(lyrStops)
        lyrStops = new FeatureLayer({
          source: graphics, // autocast as an array of esri/Graphic
          outFields: ["name", "code"],
          // create an instance of esri/layers/support/Field for each field object
          fields: fields, // This is required when creating a layer from Graphics
          objectIdField: "code", // This must be defined when creating a layer from Graphics
          renderer: stopsRenderer, // set the visualization on the layer
          spatialReference: {
            wkid: 4326
          },
          geometryType: "point", // Must be set when creating a layer from Graphics
          //popupTemplate: pTemplate
          /*labelsVisible: true,
          labelingInfo: [{
            labelExpression: "[code]",  
          }]*/
        });
        
        map.add(lyrStops);
        lyrStops.labelsVisible = true;
        lyrStops.labelingInfo = [ statesLabelClass ];
        return lyrStops;
      }
      
      // Executes if data retrieval was unsuccessful.
      function errback(error) {
        console.error("Creating legend failed. ", error);
      }

      // 4010082,4010058,4009944,4005718,4005718

      function getBus() { 
        var url = "https://transloc-api-1-2.p.mashape.com/vehicles.json?agencies=52&callback=call&geo_area=42.320973%2C-71.176837%7C42.4056458%2C-71.0552140&routes=4010082,4010058,4009944,4005718";
        
        var oReq = new XMLHttpRequest();
        oReq.onload = function (e) {
            console.log(e.target.response.data)
            createLayerBus(createGraphicsBus(e.target.response.data[52]))            
        };
        oReq.open('GET', url, true);
        oReq.responseType = 'json';
        oReq.setRequestHeader("X-Mashape-Key", "flwu3ez4u5mshqSAs0sWUYJc9HHMp1zKVMijsn0OAaoO0TViFs");
        oReq.send(); 
      }

    });