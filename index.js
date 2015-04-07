var 
	pol = require('turf-polygon'),
	simplify = require('turf-simplify'),
	buffer= require('turf-buffer'),
	area = require('turf-area'),
	centroid = require('turf-centroid');

 /**
*   turf.polygonreduce
*   Function that reduces a {@link Polygon} to {@link Point} through inside buffering iteration (Pole of inaccessibility)
* @param {Feature<(Polygon)>} poly - single Polygon Feature
* @param {Number} [tolerance=0.1] - factor of shrinking = tolerance * area^1/2
* @return {Feature<(Point)>} 
* @author   Abel Vázquez
* @version 1.1.0
* @example
*       var input = {"type":"Feature","properties":{},"geometry":{"type":"Polygon","coordinates":[[[-0.9427527769617423,38.08430116991525],[-0.9427452685370704,38.084368506535974],[-0.9427416004878013,38.08439686415331],[-0.9427402899960862,38.084396841202945],[-0.9427361729759206,38.084397697273275],[-0.9427317521356767,38.084430132867716],[-0.9427301805160633,38.08443576448326],[-0.9427284953454541,38.08444015955275],[-0.9427259196178825,38.08444541312866],[-0.9427231235197967,38.084449986992574],[-0.9427189896589614,38.08445551065594],[-0.9427149195264595,38.08445998110519],[-0.9427116745738647,38.08446307825502],[-0.942705806747771,38.08446782360734],[-0.9426960100992162,38.08447403208582],[-0.9426900210799745,38.08447700007537],[-0.9426840003654643,38.08447947188428],[-0.9426868275525654,38.08445548807934],[-0.9426515099339366,38.084452932103545],[-0.9426484239850931,38.08447760525101],[-0.9426820654532861,38.0844801679184],[-0.9426718355048703,38.08448312471385],[-0.9426610531658872,38.084485044538184],[-0.9426505419495464,38.08448583367749],[-0.9426414135743397,38.08448569182948],[-0.9426303547006231,38.08448446184048],[-0.9426184810543683,38.08448179378453],[-0.9426072596375722,38.084477821490815],[-0.9425984198680014,38.084473485396686],[-0.9425888797556935,38.08446728970565],[-0.9425832084348772,38.084462585568566],[-0.9425789707187581,38.084458393153476],[-0.9425831514013416,38.084423952835884],[-0.9425847328622783,38.08442407064745],[-0.9425860850289219,38.084413253653956],[-0.9425977736455919,38.084413981028355],[-0.942597950224223,38.08441174930172],[-0.9425984571524803,38.08441115441842],[-0.9425995294123436,38.084399341271954],[-0.9425879476508997,38.084398462575955],[-0.9425665362704758,38.08439683499311],[-0.9425659575629763,38.08439917682447],[-0.9425597573254594,38.08439869876556],[-0.9425678062557649,38.08433364249022],[-0.9427527769617423,38.08430116991525]],[[-0.9426585021528952,38.08439547192084],[-0.9426937739094717,38.08439803610242],[-0.942698823635133,38.08435740216687],[-0.942663488321896,38.08435466565792],[-0.9426585021528952,38.08439547192084]],[[-0.9426179689178278,38.0843674846249],[-0.9426201824146914,38.08434831115516],[-0.9426082681692844,38.084347498729144],[-0.9426061941938553,38.08436657551714],[-0.9426179689178278,38.0843674846249]]]}};
*       var output1 = turf.polygonreduce(input, 0.1, false);
*       // needed 3 iterations
*       // output1 = {"type":"Feature","geometry":{"type":"Point","coordinates":[-0.9426459479287636,38.084423150628155]},"properties":{}}
*       var output2 = turf.polygonreduce(input, 0.1, true);
*       // needed 6 iterations
*       // output2 = {"type":"Feature","geometry":{"type":"Point","coordinates":[-0.9426273169020654,38.084429175554995]},"properties":{}}
*/
module.exports = function(poly, tolerance){
    // check poly is a polygon
    if (poly.geometry === void 0 || poly.geometry.type !== 'Polygon' ) throw('"polygonreduce" only accepts polygon type input');

    // init defaults
    tolerance = (tolerance === void 0 || isNaN(tolerance) || tolerance === 0)? 0.1 : Math.abs(tolerance);

    var
        // init area value
        area = area(poly),

        // max number of points to force a simplify
        maxcount = (fine) ? 500 : 250,

        // factor of shrinking ~ poly.area^1/2
        factor,

        // check if multiple islands and choose the bigger one
        // simplify if needed
        multi2simple = function(e){
            var e2 = (e.features !== void 0)? e.features[0]: e,
                    a=0, j=-1, p, count;
            if (e2.geometry.type=='MultiPolygon'){
                for (i=0;i<e2.geometry.coordinates.length;i++){
                    p = pol(e2.geometry.coordinates[i]);
                    if (area(p)>a){
                        a = area(p);
                        j=i;
                    }
                }
                e2.geometry.coordinates = [e2.geometry.coordinates[j][0]];
                e2.geometry.type='Polygon';
            }
            count = e2.geometry.coordinates.reduce(function(a, b){ return a + b.length; }, 0);  
            return (count > maxcount) ? simplify(e2) : e2;
        };

    // iteration loop, limited to area > 1 m^2 to avoid lockings
    while (area>1){
        factor =  -1 * tolerance* Math.sqrt(area) ;
        try{
            poly = buffer(poly, factor, 'meters');
        }catch(err){
            /* it usually crashes before getting smaller than 1 m^2
            because it tries to buffer the "unbufferable" and crashes
            when processing a 0-vertex polygon (turf.js, line 12068)*/
            return centroid(poly);
        }
        poly = multi2simple(poly);
        area = area(poly);
    }

    // finally, if area<=1
    return centroid(poly);

}
