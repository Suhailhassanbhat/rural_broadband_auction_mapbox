import * as d3 from 'd3'
const pymChild = new pym.Child()
/// /MAP STARTS HERE////////////////////////////////
mapboxgl.accessToken =
  'pk.eyJ1Ijoic3VoYWlsLWJoYXQiLCJhIjoiY2tpbWxzbnZ1MGRqejJ4bncwNHl4anUzaiJ9.NsWEhUt8IvcwkFyDOh9h7g'
const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/suhail-bhat/cklv0oduh3xj917ql1la0k46w',
  center: [-83.9071, 41],
  minZoom: 4,
  zoom: 5,
  trackResize: true,
  dragRotate: false,
  touchZoomRotate: true,
  scrollZoom: false
})

const bbox = [[-89.6, 36.5],[-77.7, 42]]
map.fitBounds(bbox)

map.boxZoom.enable()
map.addControl(
  new mapboxgl.NavigationControl({ showCompass: false }),
  'top-left'
)
map.addControl(
  new MapboxGeocoder({
  accessToken: mapboxgl.accessToken,
  mapboxgl: mapboxgl
  })
  );

map.on('load', function() {
  d3.csv(require('/data/ov_bid_results.csv')).then(data => {
    map.addSource('counties', {
      type: 'vector',
      url: 'mapbox://suhail-bhat.0yk1wgsy',
      promoteId: 'GEOID'
    })
    // console.log(data)
    data.forEach(row => {
      map.setFeatureState(
        {
          source: 'counties',
          sourceLayer: 'ovBlockGroupsShapefile',
          id: row['census_id']
        },
        {
        locations:row["locations"],
        weight:row['t+l_weight'],
        bidder:row['bidder'],
        assignedAmount:row['assigned_support'], 
        county:row['county_name'],
        blockgroups:row['census_id']

        }
      )
    })

    map.addLayer({
      id: 'counties-fill',
      type: 'fill',
      source: 'counties',
      'source-layer': 'ovBlockGroupsShapefile',
      paint: {
        'fill-opacity': [
          'case',
          ['!=', ['feature-state', 'weight'], null],
          [
            'interpolate',
            ['linear'],
            ['to-number', ['feature-state', 'weight']],
            0,
            1,
            20,
            1
          ],
          0],
        'fill-color':
         [
          'case',
          ['!=', ['feature-state', 'weight'], null],
          [
            'interpolate',
            ['linear'],
            ['to-number', ['feature-state', 'weight']],
            0,
            '#8856a7',
            20,
            '#8856a7'
          ],
          '#f1f1f1']
      }
    })
    /// ///mouseover effects here //////////////////////////////////
    const popup = new mapboxgl.Popup({
      closeButton: false,
      closeOnClick: false
    })

    map.on('mousemove', 'counties-fill', function(e) {
      map.getCanvas().style.cursor = 'pointer'
      const counties = map.queryRenderedFeatures(e.point, {
        id: 'counties-fill'
      })

      const props = counties[0].properties
      const state = counties[0].state
      const commaFormat = d3.format(',')

      let content = '<b>' + 'Block Group: ' + props.GEOID + '</b>' + '<br>' 
      content +=
        '<b>County: </b>' + state.county + '<br>'
      content +=
        '<b>Bidder: </b>' + state.bidder + '<br>'
      content +=
        '<b>Assigned Amount: </b>' +'$' +
        commaFormat(state.assignedAmount) + '/year'+
        '<br>'
      content +=
      '<b>Locations: </b>' +
      commaFormat(state.locations) +
      '<br>'

      if (state.blockgroups != null) {
        popup
        .setLngLat(e.lngLat)
        .setHTML(content)
        .addTo(map)
      }

    })
    map.on('mouseleave', 'counties-fill', function() {
      map.getCanvas().style.cursor = ''
      popup.remove()
    })
  })
})