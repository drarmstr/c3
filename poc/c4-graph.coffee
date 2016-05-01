# C4 Visualization Library
# Graph Chart Visualization

###################################################################
# Graph
###################################################################
# anchor
# nodes[]
#   targets - array of linked nodes
#   sources - array of linked nodes
#   [show] : bool - force node to be shown and not decimated
#   [pin] : bool - pin a node to its current location
#   [expand] : bool - force a node's neighbors to be rendered
# value() - value accessor
# key() - key function (used for decimation)
# [node_color()], [link_color()]
# [node_title()], [link_title()] - tooltip value or accessor
# [node_class()], [link_class()] - CSS class to apply
# [node_styles()], [link_styles()] - object of styles to apply to nodes with each redraw
# max_r - maximum radius to be proportionally distributed among the nodes
# [min_r] - minimum radius
# [limit_nodes] - limit to this many nodes, not counting pinned or revealed neighbors
# [limit_percent] - when limiting, also keep out nodes that are less than this percentage of the total
# [limit_links] - if there are more than this many links then don't draw decimated links
# [collision_detection]
# [collision_separation]
# [arrow_size]

# @todo Document this
# @todo Update with C4 selection support
class c4.chart.graph extends c4.chart
    @version: 0.0
    collision_separation: 0
    arrow_size: 8
    # [Object] An object to setup event handlers.  Keys represent the event names and the values are the cooresponding handlers.
    node_on: undefined

    _init: =>
#        @svg.classed 'graph', true
        
        # Main iteration loop for the force simulation
        quadtree = d3.geom.quadtree().x((d)->d.x).y((d)->d.y)
        @force = d3.layout.force().gravity(0.2).on 'tick', =>
            # Collision Detection
            if @collision_detection
                for node in @current_nodes
                    bounds = node.r + @collision_separation/2
                    node.x1 = node.x - bounds
                    node.x2 = node.x + bounds
                    node.y1 = node.y - bounds
                    node.y2 = node.y + bounds
                    quadtree(@current_nodes).visit (quad, x1, y1, x2, y2)=>
                        if quad.point and quad.point != node
                            x = node.x - quad.point.x
                            y = node.y - quad.point.y
                            distance = Math.sqrt x*x + y*y
                            collide = node.r + quad.point.r + @collision_separation
                            if distance < collide
                                distance = (distance-collide) / (if distance then distance else Infinity) * 0.5
                                x *= distance
                                y *= distance
                                if not node.fixed
                                    node.x -= x
                                    node.y -= y
                                if not quad.point.fixed
                                    quad.point.x += x
                                    quad.point.y += y
                        return x1 > node.x2 or x2 < node.x1 or y1 > node.y2 or y2 < node.y1

            # Update rendering based on simulation
            @circles
                .attr 'cx', (d)->d.x
                .attr 'cy', (d)->d.y
            @circles.each (d)-> d.animated_r = +$(this).attr('r')
            @lines.each (d)-> d.radian = Math.atan2 (d.target.y-d.source.y), (d.target.x-d.source.x)
            @lines
                .attr 'x1', (d)->d.source.x + (d.source.animated_r)*Math.cos d.radian
                .attr 'y1', (d)->d.source.y + (d.source.animated_r)*Math.sin d.radian
                .attr 'x2', (d)->d.target.x - (d.target.animated_r+2)*Math.cos d.radian
                .attr 'y2', (d)->d.target.y - (d.target.animated_r+2)*Math.sin d.radian
            # TODO Draw recursive functions differently
            # TODO Adjust hard-coded distance arrowhead from target circle based on stroke-width of target and arrowhead size

        # Adjust force simulation parameters
        # Larger nodes repel with more force
        @force.charge (d)=> (@value(d)/@total_value) * (-@max_r*200)
#        @force.gravity 0.05
        @force.linkStrength (d)-> if d.decimated then 0.001 else 1
        @force.linkDistance (d)-> (1000 / (-(d.source.targets.length+d.target.sources.length)-16)) + 80

        # Make the graph zoomable!
        @zoomer = d3.behavior.zoom().scaleExtent([0.25,10]).on 'zoom', =>
            @g.attr 'transform', "translate(#{d3.event.translate})scale(#{d3.event.scale})"
        @zoomer @svg
        @svg.on 'dblclick.zoom', null

        # Prepare line arrowheads
        @defs.append 'marker'
            .attr 'id','arrow_head'
            .attr 'orient','auto'
            .attr 'refX', @arrow_size
            .attr('markerWidth', @arrow_size).attr 'markerHeight', @arrow_size
            .attr 'viewBox',"0 -5 10 10"
            .append 'path'
                .attr 'd',"M0,-5L10,0L0,5"
        @defs.append 'marker'
            .attr 'id','arrow_head_decimated'
            .attr 'orient','auto'
            .attr 'refX', @arrow_size
            .attr('markerWidth', @arrow_size).attr 'markerHeight', @arrow_size
            .attr 'viewBox',"0 -5 10 10"
            .append 'path'
                .attr 'd',"M0,-5L10,0L0,5"
        @defs.append 'marker'
            .attr 'id','arrow_head_select_path'
            .attr 'orient','auto'
            .attr 'refX', @arrow_size
            .attr('markerWidth', @arrow_size).attr 'markerHeight', @arrow_size/1.5
            .attr 'viewBox',"0 -4 8 10"
            .append 'path'
                .attr 'd',"M0,-4L10,0L0,4"

    _size: => @force.size [@width, @height]

    reset: =>
        for node in @nodes
            if not @frozen then node.fixed = false
            delete node.pinned
            delete node.expanded
        @circles.classed 'pinned', false
        @zoomer.scale(1).translate([0,0])
        @g.attr('transform','')
        @redraw()

    _update: =>
        # Get the total value of all nodes
        @total_value = 0
        @total_value += @value(d) for d in @nodes

        # If we're not decimating nodes, then just prepare the complete set
        if not @limit_nodes
            if not @current_nodes or @current_links
                @current_nodes = @nodes
                @current_links = []
                for node in @current_nodes
                    for target in node.targets
                        @current_links.push { source:node, target:target }
        else
            # First select the decimated nodes based on the limit filters
            nodes = @nodes[..]
            c4.array.sort_up nodes, (d)=> -@value(d) # Sorting up by negative value avoids reverse()
            @limit_percent ?= 0
            threshold = @limit_percent * @total_value
            @current_nodes = (node for node in nodes[0..@limit_nodes-1] when @value(node)>threshold)
            (node.visible = false) for node in @nodes
            (node.visible = true) for node in @current_nodes

            # Make sure pinned nodes and neighbors of visible "expanded" nodes are included
            merit_node = (node)=> if not node.visible and @value(node)
                @current_nodes.push node
                node.visible = true
                if node.expanded
                    merit_node neighbor for neighbor in node.targets
                    merit_node neighbor for neighbor in node.sources
            for node in @nodes
                if node.show or node.pin then merit_node node
                if node.visible and node.expanded
                    merit_node neighbor for neighbor in node.targets
                    merit_node neighbor for neighbor in node.sources

            # Construct links between the nodes
            @current_links = []
            for node, i in @current_nodes
                node.index = i
                node.hidden_neighbors = false
                visited_nodes = {}
                visited_nodes[@key(node)] = true
                # Find a connection from this node to all included nodes through any decimated nodes
                for target in node.targets
                    if target.visible
                        # Create the strong direct link between visible nodes
                        @current_links.push { source:node, target:target }
                        visited_nodes[@key(target)] = true
                    else
                        if @value(target) then node.hidden_neighbors = true
                        travel = (travel_from)=>
                            if not @value(travel_from) then return
                            for travel_to in travel_from.targets
                                if visited_nodes[@key(travel_to)] then continue
                                visited_nodes[@key(travel_to)] = true
                                if travel_to.visible
                                    # Create an indirect link due to decimated nodes
                                    @current_links.push { source:node, target:travel_to, decimated:true }
                                else
                                    travel travel_to
                        travel target
                if not node.hidden_neighbors then for source in node.sources
                    if not source.visible and @value(source) then node.hidden_neighbors = true; break
            # If there are too many links then get rid of the decimated ones
            if @limit_links and @current_links.length > @limit_links
                @current_links = (link for link in @current_links when not link.decimated)

        # Adjust node size based on their mass
        for node in @current_nodes
            node.r = Math.ceil Math.sqrt(@value(node)/@total_value) * @max_r
            if @min_r? and node.r<@min_r then node.r = @min_r
            
        # Bind the data to the DOM
        @circles = @g.selectAll('circle').data( @current_nodes, @key )
        @lines = @g.selectAll('line').data( @current_links, (d)=> @key(d.source)+'.'+@key(d.target) )

        # Add new nodes
        @new_circles = @circles.enter().append('circle')
            .attr('r', 0)
            .classed('pinned',(d)->d.pin)
            .on('mousedown', -> d3.event.stopPropagation() ) # Prevent zooming when manipulating the nodes
        # Add and adjust tooltips
        if @node_title?
            @new_circles.append 'title'
            @circles.selectAll('title').text @node_title
        # Custom user event handlers
        if @node_on? then @new_circles.on event, handler for event, handler of @node_on

        # Add new links
        @new_lines = @lines.enter().insert('line',':first-child')
            .style('opacity',0)

        # Transition out decimated items and restore items that were on their way out
        @circles.exit().transition().duration(750).style('opacity',0).remove()
        @circles.transition().duration(0).style('opacity',0.9)
        @lines.exit().transition().duration(750).style('opacity',0).remove()
        @lines.transition().duration(1000).style('opacity',1)

        # Transition nodes to their new size
        @circles.transition().duration(2000)
            .attr 'r', (d)=> d.r

        # Interactive behaviour
        self = this
        @force.drag()
            .on 'dragstart', (d)->
                e = d3.event.sourceEvent
                d.dragging = true
                d.dragstart_x = d.x
                d.dragstart_y = d.y
                if e.which==1 and not e.ctrlKey then d3.select(this).classed('pinned',true)
                if e.which==3 and not d.expanded
                    d.expanded = 'tentative'
                    self.redraw('drag')
                    if not d.pin then $(this).on 'mousemove.drag', ->
                        d3.select(this).classed 'pinned', d.x!=d.dragstart_x or d.y!=d.dragstart_y
            .on 'dragend', (d)->
                $(this).off 'mousemove.drag'
                e = d3.event.sourceEvent
                d.dragging = false
                if self.frozen
                    d.fixed = true
                    if e.which==3
                        d.expanded = (d.expanded=='tentative')
                        if not d.expanded then self.redraw('drag')
                    else if not e.ctrlKey
                        if d.x == d.dragstart_x and d.y == d.dragstart_y then d.pin = not d.pin                    
                else
                    if e.which==3
                        if d.x == d.dragstart_x and d.y == d.dragstart_y
                            d.expanded = (d.expanded=='tentative')
                        else 
                            d.expanded = true
                            d.fixed = d.pin = true
                        if not d.expanded then self.redraw('drag')
                    else if not e.ctrlKey
                        if d.x == d.dragstart_x and d.y == d.dragstart_y then d.pin = not d.pin
                        else d.pin = true
                        d.fixed = d.pin
                d3.select(this).classed('pinned',d.pin)
        @new_circles.call @force.drag
        # Hold the nodes in place when hovering over them
        @new_circles.on 'mouseenter.drag', (d)-> d.fixed = true
        @new_circles.on 'mouseleave.drag', (d)=> if not d.dragging then (d.fixed = if @frozen then true else d.pin)

    _draw: =>
        # Start or restart the force simulation!
        @force.nodes( @current_nodes ).links( @current_links ).start()

    _style: (style_new)=>
        circles = if style_new then @new_circles else @circles
        if @node_class? then circles.attr 'class', @node_class
        if @node_classes? then circles.classed klass, cb for klass, cb of @node_classes
        if @node_color? then circles.style 'fill', @node_color
        if @node_styles? then circles.style @node_styles
        
        lines = if style_new then @new_lines else @lines
        if @link_class? then lines.attr 'class', @link_class
        if @link_classes? then lines.classed klass, cb for klass, cb of @link_classes
        if @link_color? then lines.style 'stroke', @link_color
        if @link_styles? then lines.style @link_styles

        # Style all elements below since these properties may be updated with a redraw
        @circles.classed 'hidden_neighbors', (d)->d.hidden_neighbors
        @lines.classed 'decimated', (d)->d.decimated

    freeze: => if @force?
        @frozen = true
        @force.stop()
        node.fixed = true for node in @nodes

    unfreeze: => if @force?
        @frozen = false
        node.fixed = node.pin for node in @nodes
        @force.start()
