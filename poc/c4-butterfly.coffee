# C4 Visualization Library
# Butterfly Sankey Visualization

###################################################################
# Butterfly
###################################################################
# extend:
#   nodes - g's
#   rects
#   labels
#   paths

# anchor
# center_node
#   target_links[], source_links[] - arrays of links for a node
#       source - pointer to source node
#       target - pointer to target node
# node_key(), link_key() - key accessor
# node_value(), link_value() - value accessor
# treasure_links[] - Additional set of links to draw
# [node_color()]
# [node_label()] - text to display as a label over node
# [node_title()], [link_title()] - tooltip text
# [node_styles{}], [link_styles{}] - styles for node rects and link paths
# [node_class()], [link_class()] - class to apply to the rects and paths
# node_width - width of the node rect
# [node_padding_percent] - (default: 1) vertical padding as a percentage of node value
# [link_path] - (default: line) line or curve
# [link_path_curvature] - (default: 0.25) curvature for curved link paths from 0-1
# [animate] - (default: true)
# [duration] - (default: 1000) animation transition duration
# [source_label], [target_label] - Text label for the source and target columns

# @todo Document this
# @todo Update with C4 selection support
class c4.chart.butterfly extends c4.chart
    @version: 0.0
    node_padding_percent: 1
    link_path: 'line'
    link_path_curvature: 0.25
    animate: true
    duration: 1000
    constructor: ->
        super
        @h = d3.scale.linear().domain [-2,2]
        @v = d3.scale.linear()
        
    _init: =>
        @g.append('g').attr 'class', 'links'
        @g.append('g').attr 'class', 'treasure_links' # TODO obsolete?
        @g.append('g').attr 'class', 'nodes'
        @g.append('g').attr 'class', 'column_labels'
    
        # Make the graph zoomable
        @zoomer = d3.behavior.zoom().scaleExtent([0.25,10]).on 'zoom', =>
            @g.attr 'transform', "translate(#{d3.event.translate})scale(#{d3.event.scale})"
        @zoomer @svg
        @svg.on 'dblclick.zoom', null
    
    _size: =>
        @h.rangeRound [0, @width]
        @v.range [0, @height]
        
    # Update the node values and assign nodes to columns: prepare @columns
    _update: => if not @center_node? then @columns=[] else
        # Setup the columns
        target_nodes = []
        source_nodes = []
        center_nodes = [@center_node]
        source_nodes.col = -1
        center_nodes.col = 0
        target_nodes.col = 1
        source_nodes.label = @source_label
        target_nodes.label = @target_label
        @columns = [center_nodes, target_nodes, source_nodes]
        
        # Compute the node values and add to source and target columns
        @center_node.value = @node_value @center_node
        if @center_node.target_links? then for link in @center_node.target_links
            if link.target.value = @node_value link.target
                target_nodes.push link.target
        if @center_node.source_links? then for link in @center_node.source_links
            if link.source.value = @node_value link.source
                source_nodes.push link.source
        
        # Add recursive nodes to the center column
        center_nodes.push node for node in target_nodes when node in source_nodes
        
        # Set the vertical scaling domain
        for column in @columns
            column.sum = d3.sum (node.value for node in column)
            column.total_space = (1+@node_padding_percent) * column.sum
        @v.domain [0, d3.max (column.total_space for column in @columns)]
        
        # Determine the node padding and give more space to columns if there is room
        for column in @columns
            if column.total_space < @v.domain()[1]   # Give half the available space if possible
                column.total_space += (@v.domain()[1]-column.total_space) / 2
            column.pad = (column.total_space-column.sum) / (column.length+1)

    # Rebind the data in _draw() instead of _update() due to the algorithm used; it is not performance sensitive
    _draw: (origin)=>
        @current_nodes = []
        @current_links = []

        # Position the nodes and setup @current_nodes
        node_width_half = (@node_width / 2)|0
        for column in @columns
            pad_y = @v column.pad
            cummulative_y = (@v.range()[1]-@v(column.total_space))/2 + pad_y
            for node in column when node not in @current_nodes
                node.butterfly_column = column.col
                node.x = @h(column.col) - node_width_half
                node.y = cummulative_y
                node.dy = @v node.value
                cummulative_y += node.dy + pad_y
                @current_nodes.push node
        
        # Position the links and setup @current_links
        pad_x = @h(1) - @h(0)
        for column in @columns
            for node in column
                trail_total_y = node.dy*@node_padding_percent + @v(column.pad)/2
                if node.target_links?
                    trailing_pad_y = trail_total_y / (node.target_links.length-1)
                    cummulative_trail_y = node.y - trail_total_y/2
                    cummulative_link = node.y
                    for link in node.target_links
                        link.sy = cummulative_link
                        link.dy = @v @link_value link
                        cummulative_link += link.dy
                        link.sx = node.x + @node_width
                        if link.target not in @current_nodes # Trailing link
                            link.tx = node.x + @node_width + pad_x/(if node.butterfly_column < 1 then 2 else 1)
                            link.ty = cummulative_trail_y
                        cummulative_trail_y += link.dy + trailing_pad_y
                        @current_links.push link if link not in @current_links
                if node.source_links?
                    trailing_pad_y = trail_total_y / (node.source_links.length-1)
                    cummulative_trail_y = node.y - trail_total_y/2
                    cummulative_link = node.y
                    for link in node.source_links
                        link.ty = cummulative_link
                        link.dy = @v @link_value link
                        cummulative_link += link.dy
                        link.tx = node.x
                        if link.source not in @current_nodes # Trailing Link
                            link.sx = node.x - pad_x/(if node.butterfly_column > -1 then 2 else 1)
                            link.sy = cummulative_trail_y
                        cummulative_trail_y += link.dy + trailing_pad_y
                        @current_links.push link if link not in @current_links
        
        # Workarounds
        for link in @current_links
            # Workaround for thick trailing links to avoid rendering artifacts
            if link.dy > link.tx-link.sx
                if link.target not in @current_nodes
                    link.tx += link.dy - (link.tx-link.sx)
                else if link.source not in @current_nodes
                    link.sx -= link.dy - (link.tx-link.sx)
            # Workaround that gradients fail when lines are horizontal
            if link.sy.toFixed(3) == link.ty.toFixed(3)
                if link.target not in @current_nodes or link.source not in @current_nodes
                    link.sy += 0.001

        # Add the treasure-map links (N^2 alert)
        for link in @current_links
            for treasure_link in @treasure_links when link.source==treasure_link.source and link.target==treasure_link.target
                treasure_link.sx = link.sx
                treasure_link.tx = link.tx
                treasure_link.sy = link.sy
                treasure_link.ty = link.ty
                treasure_link.dy = @v @link_value treasure_link
                @current_links.push treasure_link

        # Bind the data
        @nodes = @g.select('g.nodes').selectAll('g').data @current_nodes, @node_key
        @paths = @g.select('g.links').selectAll('path').data @current_links, @link_key
        column_labels = @g.select('g.column_labels').selectAll('text.column_labels').data(@columns)
        
        # Create the nodes
        @new_nodes = @nodes.enter().append('g')
        @nodes.exit().remove()
        @new_rects = @new_nodes.append('rect')
            .attr 'width', @node_width
        @rects = @nodes.selectAll 'rect'
        if @node_title?
            @new_rects.append('title')
            @rects.selectAll('title').text @node_title
        if @node_label?
            @new_labels = @new_nodes.append('text').text(@node_label).style('dominant-baseline','middle')
            @labels = @nodes.selectAll 'text'
        if @node_on? then @new_nodes.on event, handler for event, handler of @node_on
        
        # Create the links
        @new_paths = @paths.enter().insert('path')
        @paths.exit().remove()
        if @link_title?
            @new_paths.append('title')
            @paths.selectAll('title').text @link_title
        if @link_on? then @new_paths.on event, handler for event, handler of @link_on
        # Move the treasure links to the top
        treasure_links = @treasure_links
        @paths.each (l)-> if l in treasure_links then this.parentNode.appendChild(this)
        
        # Column the column labels
        column_labels.enter().append('text').attr('class','column_labels')
            .style 'text-anchor', 'middle'
            .style 'dominant-baseline', 'middle'
        
        # Transition the nodes to their new placement
        if @animate
            # Initial placement
            @new_nodes
                .attr 'transform', (n)=> "translate("+(if n.x>@h(0) then @width else if n.x<@h(0)-node_width_half then -@node_width else n.x)+","+n.y+")"
                .style 'opacity', 0
            @new_rects.attr 'height', (n)->n.dy
            @new_labels?.attr 'transform', (n)-> "translate(5,#{n.dy/2})"
        # Final destination
        (if @animate then @nodes.transition().duration(@duration) else @nodes)
            .attr 'transform', (n)->"translate(#{n.x},#{n.y})"
            .style 'opacity', 1
        (if @animate then @rects.transition().duration(@duration) else @rects)
            .attr 'height', (n)->n.dy
        (if @animate then @labels.transition().duration(@duration) else @labels)
            .attr 'transform', (n)->"translate(5,#{n.dy/2})"
        
        # Transition the link path
        paths_render = (paths)=> switch @link_path
            when 'line'
                paths.style 'opacity', 1
                paths.attr 'd', (l)=>
                    "M"+l.sx+','+l.sy+
                    "L"+l.tx+','+l.ty+
                    "L"+l.tx+','+(l.ty+l.dy)+
                    "L"+l.sx+','+(l.sy+l.dy)+"Z"
            when 'curve'
                paths.style 'opacity', 1
                paths.style 'stroke-width', (l)-> Math.max 1, l.dy
                paths.attr 'd', (l)=>
                    # Curves always exit right side of node and enter the left side:
                    curvature = if l.tx>l.sx then @link_path_curvature else -@link_path_curvature*8
                    y0 = l.sy + l.dy/2
                    y1 = l.ty + l.dy/2
                    xi = d3.interpolateRound l.sx, l.tx
                    x0_cp = xi curvature
                    x1_cp = xi 1-curvature
                    "M"+l.sx+','+y0+ # Start of curve
                    "C"+x0_cp+','+y0+ # First control point
                    " "+x1_cp+','+y1+ # Second control point
                    " "+l.tx+','+y1 # End of curve
        if @animate
            paths_render @new_paths
            @new_paths.style 'opacity', 0
        paths_render (if @animate then @paths.transition().duration(@duration) else @paths)
        
        # Transition the column labels
        (if @animate then column_labels.transition().duration(@duration) else column_labels)
            .attr 'x', (column)=> @h(column.col)
            .attr 'y', (column)=> @v( @v.domain()[1]-column.total_space+column.pad )/2
            .text (column)-> if column.length then column.label # Must be last since it's not be chainable
        
        # Enable selection of nodes (can be used for re-centering)
        @nodes.on 'click', (n)=> @.trigger 'click', n
        
    _style: (style_new)=>
        # Style Nodes
        rects = if style_new then @new_rects else @rects
        if @node_class? then rects.attr 'class', @node_class
        if @node_classes? then rects.classed k, v for k, v of @node_classes
        if @node_color? then rects.style 'fill', @node_color
        if @node_styles? then rects.style @node_styles
        
        # Style Paths
        paths = if style_new then @new_paths else @paths
        if @link_styles? then paths.style @link_styles
        if @link_class? then paths.attr 'class', @link_class
        @paths.classed 'treasure', (l)=> l in @treasure_links
        if @link_classes? then paths.classed k, v for k, v of @link_classes
        @paths.attr 'mask', (l)=>
            if l.source not in @current_nodes then 'url(#mask_fade_left)'
            else if l.target not in @current_nodes then 'url(#mask_fade_right)'
            else null
