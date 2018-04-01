var map;
var markers = [];
var markers_label = [];
var markers_idx = 1;

(function() {

    window.addEventListener('load', function() {
        console.log('load');
        map_init();
    }, false);

    window.addEventListener('resize', function() {
        map_resize();
    }, false);

    function map_init() {

        map_resize();

        map = new ol.Map({
            target: 'map',
            layers: [
                new ol.layer.Tile({
                    source: new ol.source.OSM()
                })
            ],
            view: new ol.View({
                center: ol.proj.fromLonLat([139.75, 35.68]),
                zoom: 10
            })
        });

        $('#get_current').on('click', get_current);

        map.on('moveend', on_move_end);
        map.on('singleclick', on_map_click);

    }

    function map_resize() {
        var map_margin = 10;
        var map_top = $('#map_frame').offset().top;
        var win_height = $('body').height();
        var map_height = win_height - map_top - map_margin;
        if (map_height > 120) {
            $('#map_frame').height(map_height);
        }
    }

    function get_current() {
        if (navigator.geolocation) {
            var options = {
                enableHighAccuracy: true,
                timeout: 1000,
                maximumAge: 0
            };
            navigator.geolocation.getCurrentPosition(function(position) {
                loadMap(position.coords);
            }, function(error) {
                console.log(error.message);
                loadMap();
            }, options);
        } else {
            loadMap();
        }
    }

    // https://openlayers.org/en/latest/examples/moveend.html?q=event
    function on_move_end(evt) {
        // EPSG:3857 球面メルカトル
        // EPSG:4326 WGS84:地理座標系
        var c = ol.proj.transform(map.getView().getCenter(), 'EPSG:3857', 'EPSG:4326');
        $('#current_lat').val(floor(c[0]));
        $('#current_lon').val(floor(c[1]));
    }

    function on_map_click(evt) {
        var coordinate = evt.coordinate;
        var c = ol.proj.transform(coordinate, 'EPSG:3857', 'EPSG:4326');
        document.getElementById('popup-content').innerHTML = '<p>クリック場所</p><ul><li>' + floor(c[0]) + '</li></li>' + floor(c[1]) + '</li></ul>';
        // http://openlayers.org/en/latest/apidoc/ol.Overlay.html
        // http://openlayers.org/en/latest/examples/popup.html
        var overlay = new ol.Overlay({
            position: coordinate,
            element: document.getElementById('popup'),
            autoPan: true,
            autoPanAnimation: {
                duration: 250
            }
        });
        map.addOverlay(overlay);
        $('#popup-closer').on('click', function(evv) {
            overlay.setPosition(undefined);
        });

        // http://openlayers.org/en/latest/examples/icon-color.html?q=marker
        var pt = new ol.Feature({
            geometry: new ol.geom.Point(coordinate)
        });

        var src = 'https://chart.googleapis.com/chart?chst=d_map_pin_letter&chld=' + markers_idx + '|FFFF00|000000'; +

        pt.setStyle(new ol.style.Style({
            image: new ol.style.Icon( /** @type {olx.style.IconOptions} */ ({
                color: '#FFFFFF',
                crossOrigin: 'anonymous',
                src: src
            }))
        }));
        var vectorSource = new ol.source.Vector({
            features: [pt]
        });
        var vectorLayer = new ol.layer.Vector({
            source: vectorSource
        });
        map.addOverlay(vectorLayer);
        markers.push(vectorLayer);
        markers_label.push(src);
        view_markers();

        markers_idx++;

    }

    function view_markers() {
        var arr = [];
        for (var i = 0; i < markers.length; i++) {
            var marker = markers[i];
            // WGS84地理座標系からEPSG:3857の球面メルカトル
            var p = marker.getSource().getFeatures()[0].getGeometry().getCoordinates();
            var c = ol.proj.transform(p, 'EPSG:3857', 'EPSG:4326');
            var src = markers_label[i];
            var e = $('<li class="list-group-item" idx="' + i + '">' + '<image src="' + src + '"/> ' + floor(c[0]) + ',' + floor(c[1]) + '</li>');
            e.on('click', function(evt) {
                var idx = evt.target.getAttribute('idx');
                map.removeOverlay(markers[idx]);
                markers.splice(idx, 1);
                markers_label.splice(idx, 1);
                view_markers();
            });
            arr.push(e);
        }
        $('#marker_list').html(arr);
    }

    function loadMap(coords) {
        if (coords === null || coords === undefined) {
            console.log(coords);
        }
        console.log(coords);
        // WGS84地理座標系からEPSG:3857の球面メルカトル
        var c = ol.proj.fromLonLat([coords.longitude, coords.latitude]);
        map.getView().setCenter(c);
        map.getView().setZoom(15);
    }

    function floor(n) {
        var acc = 1000;
        return Math.floor(n * acc) / acc;
    }

})();